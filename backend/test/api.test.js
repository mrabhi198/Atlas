// Integration tests for the Atlas backend API.
//
// Spins up the real app (Express + sqlite) against a throwaway database file
// under ATLAS_DB_FILE, then exercises the HTTP surface with node's fetch.
//
// Run: npm test  (from backend/)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Must be set before any backend module is imported (config reads it eagerly).
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-test-'));
process.env.ATLAS_DB_FILE = path.join(tmpDir, 'test.sqlite');

let server;
let base;

before(async () => {
  const { initDatabase } = await import('../src/db/index.js');
  await initDatabase();
  const { createApp } = await import('../src/app.js');
  const app = createApp();
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function api(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, json };
}

const PASSWORD = 'TestPass1234!';

async function registerAndLogin(name) {
  const email = `${name}@test.local`;
  const username = `${name}_${Date.now().toString(36)}`;
  const reg = await api('/auth/register', {
    method: 'POST',
    body: { email, username, password: PASSWORD, full_name: 'Test User' }
  });
  assert.equal(reg.status, 201, `register ${name} failed: ${JSON.stringify(reg.json)}`);

  const verify = await api('/auth/verify-email', { method: 'POST', body: { token: reg.json.verifyToken } });
  assert.equal(verify.status, 200);

  const login = await api('/auth/login', { method: 'POST', body: { loginId: email, password: PASSWORD } });
  assert.equal(login.status, 200, `login ${name} failed: ${JSON.stringify(login.json)}`);
  return { ...login.json, email, username };
}

test('GET /api/health responds ok', async () => {
  const res = await fetch(base + '/health');
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'ok');
});

test('unknown API route returns JSON 404', async () => {
  const res = await fetch(base + '/nope');
  assert.equal(res.status, 404);
  assert.ok(res.json);
  const json = await res.json();
  assert.equal(typeof json.error, 'string');
});

test('CORS is restricted to the configured origin allow-list', async () => {
  const res = await fetch(base + '/health', { headers: { Origin: 'http://evil.example' } });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('register validates inputs', async () => {
  const r1 = await api('/auth/register', {
    method: 'POST',
    body: { email: 'bad', username: 'okname', password: PASSWORD, full_name: 'X' }
  });
  assert.equal(r1.status, 400);

  const r2 = await api('/auth/register', {
    method: 'POST',
    body: { email: 'ok@test.local', username: 'ab', password: PASSWORD, full_name: 'X' }
  });
  assert.equal(r2.status, 400);

  const r3 = await api('/auth/register', {
    method: 'POST',
    body: { email: 'ok@test.local', username: 'okname', password: 'weak', full_name: 'X' }
  });
  assert.equal(r3.status, 400);
});

test('auth: verify+login flow and 401 protection', async () => {
  const alice = await registerAndLogin('alice');

  // Wrong password
  const bad = await api('/auth/login', { method: 'POST', body: { loginId: alice.email, password: 'WrongPass1234!' } });
  assert.equal(bad.status, 401);

  // No token
  const noToken = await api('/auth/me');
  assert.equal(noToken.status, 401);

  // Invalid token
  const badToken = await api('/auth/me', { token: 'not-a-real-token' });
  assert.equal(badToken.status, 401);

  // /me returns the real user without the passcode column
  const me = await api('/auth/me', { token: alice.accessToken });
  assert.equal(me.status, 200);
  assert.equal(me.json.user.email, alice.email);
  assert.equal(me.json.user.passcode, undefined);
  assert.equal(me.json.user.is_email_verified, 1);
});

test('users directory never leaks passcodes', async () => {
  const admin = await api('/auth/login', {
    method: 'POST',
    body: { loginId: 'elena@atlas.dev', password: 'AdminPass6400!' }
  });
  assert.equal(admin.status, 200);

  const list = await api('/users', { token: admin.json.accessToken });
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.json));
  assert.ok(list.json.some(u => u.username === 'abhi'));
  assert.equal('passcode' in list.json[0], false, 'passcode must not be exposed');
});

test('profile update validates fields and persists partial updates', async () => {
  const bob = await registerAndLogin('bob');

  const tooLong = await api('/auth/profile', {
    method: 'PUT',
    token: bob.accessToken,
    body: { full_name: 'x'.repeat(200) }
  });
  assert.equal(tooLong.status, 400);

  const nonString = await api('/auth/profile', {
    method: 'PUT',
    token: bob.accessToken,
    body: { experience: 42 }
  });
  assert.equal(nonString.status, 400);

  const ok = await api('/auth/profile', {
    method: 'PUT',
    token: bob.accessToken,
    body: { career_goal: 'Core Platform Engineer', language: 'English', tech_stack: 'Kotlin, SQLite' }
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.career_goal, 'Core Platform Engineer');
  assert.equal(ok.json.language, 'English');

  const me = await api('/auth/me', { token: bob.accessToken });
  assert.equal(me.json.profile.career_goal, 'Core Platform Engineer');
});

test('lesson progression: prereq enforcement, snake_case support, single XP award', async () => {
  const carol = await registerAndLogin('carol');

  // less_back_2 requires less_back_1 which carol has not completed.
  const blocked = await api('/lessons/less_back_2/progress', {
    method: 'POST',
    token: carol.accessToken,
    body: { status: 'completed', progress_percent: 100, last_position: 100 }
  });
  assert.equal(blocked.status, 409);

  // Complete less_back_1 first (snake_case payload the FE sends).
  const lp1 = await api('/lessons/less_back_1/progress', {
    method: 'POST',
    token: carol.accessToken,
    body: { status: 'completed', progress_percent: 100, last_position: 100 }
  });
  assert.equal(lp1.status, 200);
  assert.equal(lp1.json.xpAwarded, 250);

  const meBefore = await api('/auth/me', { token: carol.accessToken });
  const xpAfterLesson1 = meBefore.json.user.xp;

  // Now the prereq is satisfied.
  const lp2 = await api('/lessons/less_back_2/progress', {
    method: 'POST',
    token: carol.accessToken,
    body: { status: 'completed', progress_percent: 100, last_position: 100 }
  });
  assert.equal(lp2.status, 200);
  assert.equal(lp2.json.xpAwarded, 300);

  // Re-completing grants nothing (no XP farm).
  const lp3 = await api('/lessons/less_back_2/progress', {
    method: 'POST',
    token: carol.accessToken,
    body: { status: 'completed', progress_percent: 100, last_position: 100 }
  });
  assert.equal(lp3.status, 200);
  assert.equal(lp3.json.xpAwarded, 0);

  // Invalid status rejected.
  const bad = await api('/lessons/less_back_1/progress', {
    method: 'POST',
    token: carol.accessToken,
    body: { status: 'banana' }
  });
  assert.equal(bad.status, 400);

  // The FE-friendly snake_case progress_percent is honored.
  const detail = await api('/lessons/less_back_1', { token: carol.accessToken });
  assert.equal(detail.json.progress.progress_percent, 100);
  assert.ok(xpAfterLesson1 > 0);
});

test('notes: text contract fixed, IDOR-safe deletion', async () => {
  const dave = await registerAndLogin('dave');
  const mallory = await registerAndLogin('mallory');

  // Frontend sends { text } — legacy backend 500'd on every save.
  const create = await api('/lessons/less_back_1/notes', {
    method: 'POST',
    token: dave.accessToken,
    body: { text: 'A dave note' }
  });
  assert.equal(create.status, 200);
  assert.equal(create.json.noteText, 'A dave note');

  const lesson = await api('/lessons/less_back_1', { token: dave.accessToken });
  const note = lesson.json.notes.find(n => n.note_text === 'A dave note');
  assert.ok(note, 'note should be visible on the lesson');

  // Mallory cannot delete Dave's note.
  await api(`/lessons/notes/${note.id}`, { method: 'DELETE', token: mallory.accessToken });
  const after = await api('/lessons/less_back_1', { token: dave.accessToken });
  assert.ok(after.json.notes.some(n => n.id === note.id), 'note must survive another user delete');

  // Empty note rejected.
  const empty = await api('/lessons/less_back_1/notes', {
    method: 'POST',
    token: dave.accessToken,
    body: { text: '   ' }
  });
  assert.equal(empty.status, 400);
});

test('quiz: server-side scoring, broken contract fixed, one-time XP', async () => {
  const eve = await registerAndLogin('eve');

  const me0 = await api('/auth/me', { token: eve.accessToken });
  const xpBefore = me0.json.user.xp;

  // FE payload shape: { lesson_id, answers: [{question_index, selected_option}] }
  const submit = await api('/quiz/submit', {
    method: 'POST',
    token: eve.accessToken,
    body: {
      lesson_id: 'less_back_1',
      answers: [
        { question_index: 0, selected_option: 1 }, // val
        { question_index: 1, selected_option: 0 }  // True
      ]
    }
  });
  assert.equal(submit.status, 200);
  assert.equal(submit.json.score_percent, 100);
  assert.equal(submit.json.passed, true);
  assert.equal(submit.json.xp_awarded, 50); // 20% of xp_reward 250
  assert.ok(Array.isArray(submit.json.results));
  assert.equal(submit.json.results[0].is_correct, true);

  const me1 = await api('/auth/me', { token: eve.accessToken });
  assert.ok(me1.json.user.xp >= xpBefore + 50);

  // Resubmit (even with a perfect score) grants no more XP.
  const redo = await api('/quiz/submit', {
    method: 'POST',
    token: eve.accessToken,
    body: {
      lesson_id: 'less_back_1',
      answers: [
        { question_index: 0, selected_option: 1 },
        { question_index: 1, selected_option: 0 }
      ]
    }
  });
  assert.equal(redo.status, 200);
  assert.equal(redo.json.xp_awarded, 0);

  // A failing score is recorded but grants nothing.
  const fail = await api('/quiz/submit', {
    method: 'POST',
    token: eve.accessToken,
    body: {
      lesson_id: 'less_back_1',
      answers: [
        { question_index: 0, selected_option: 0 }, // wrong (var)
        { question_index: 1, selected_option: 1 }  // wrong (False)
      ]
    }
  });
  assert.equal(fail.status, 200);
  assert.equal(fail.json.passed, false);
  assert.equal(fail.json.xp_awarded, 0);

  // Unknown lesson → 404.
  const missing = await api('/quiz/submit', {
    method: 'POST',
    token: eve.accessToken,
    body: { lesson_id: 'less_nope', answers: [{ question_index: 0, selected_option: 0 }] }
  });
  assert.equal(missing.status, 404);
});

test('revision routing is honest and rate persistence works', async () => {
  const frank = await registerAndLogin('frank');

  // Completion adds the lesson to the revision queue.
  await api('/lessons/less_back_1/progress', {
    method: 'POST',
    token: frank.accessToken,
    body: { status: 'completed', progress_percent: 100, last_position: 100 }
  });

  const rev = await api('/revision', { token: frank.accessToken });
  assert.equal(rev.status, 200);
  assert.ok(Array.isArray(rev.json.flashcards));
  assert.ok(rev.json.queue.find(q => q.id === 'less_back_1'));
  // Cards are real seeded content with stable ids.
  assert.ok(rev.json.flashcards.every(c => typeof c.id === 'string' && c.id.length > 0));

  const first = rev.json.flashcards[0];
  const rate = await api('/revision/rate', {
    method: 'POST',
    token: frank.accessToken,
    body: { card_id: first.id, rating: 4 }
  });
  assert.equal(rate.status, 200);
  assert.equal(rate.json.recorded, true);
  assert.ok(rate.json.nextReviewAt);

  // Invalid rating rejected.
  const bad = await api('/revision/rate', {
    method: 'POST',
    token: frank.accessToken,
    body: { card_id: first.id, rating: 9 }
  });
  assert.equal(bad.status, 400);

  // Rated card is now annotated with its schedule and not due.
  const rev2 = await api('/revision', { token: frank.accessToken });
  const rated = rev2.json.flashcards.find(c => c.id === first.id);
  assert.equal(rated.is_due, false);
  assert.ok(rated.next_review_at);

  // A fresh user with no progress gets no fabricated default flashcards.
  const grace = await registerAndLogin('grace');
  const revGrace = await api('/revision', { token: grace.accessToken });
  assert.equal(revGrace.json.flashcards.length, 0);
});

test('mission execute: simulation only — no XP, no fabricated metrics, attempt history', async () => {
  const henry = await registerAndLogin('henry');

  const me0 = await api('/auth/me', { token: henry.accessToken });
  const xpBefore = me0.json.user.xp;
  const codeBefore = me0.json.user.code_quality;

  // Failing run (no Trie).
  const fail = await api('/missions/execute', {
    method: 'POST',
    token: henry.accessToken,
    body: { code: 'fun search() { return 1 }', fileName: 'FollowerSearch.kt' }
  });
  assert.equal(fail.status, 200);
  assert.equal(fail.json.success, false);
  assert.equal(fail.json.simulation, true);

  // Passing run (Trie keyword).
  const pass = await api('/missions/execute', {
    method: 'POST',
    token: henry.accessToken,
    body: { code: 'class TrieNode { val children = HashMap<Char, TrieNode>() }', fileName: 'FollowerSearch.kt' }
  });
  assert.equal(pass.status, 200);
  assert.equal(pass.json.success, true);
  assert.ok(Array.isArray(pass.json.logs));
  assert.equal(pass.json.attemptCount, 2);

  // No fabricated authoritative state changes.
  const me1 = await api('/auth/me', { token: henry.accessToken });
  assert.equal(me1.json.user.xp, xpBefore, 'mission must not grant XP');
  assert.equal(me1.json.user.code_quality, codeBefore, 'mission must not rewrite code_quality');

  // code input validated.
  const noCode = await api('/missions/execute', {
    method: 'POST',
    token: henry.accessToken,
    body: { code: '' }
  });
  assert.equal(noCode.status, 400);
});

test('dashboard summary: real streak + no fabricated analytics', async () => {
  const ivy = await registerAndLogin('ivy');
  await api('/lessons/less_back_1/progress', {
    method: 'POST',
    token: ivy.accessToken,
    body: { status: 'completed', progress_percent: 100, last_position: 100 }
  });

  const summary = await api('/dashboard/summary', { token: ivy.accessToken });
  assert.equal(summary.status, 200);
  assert.equal(typeof summary.json.streak, 'number');
  // Progressing a lesson today yields at least a 1-day streak.
  assert.ok(summary.json.streak >= 1);
  assert.deepEqual(summary.json.analytics.weeklyHours, [], 'weeklyHours must not be fabricated');
  assert.deepEqual(summary.json.analytics.monthlyXp, [], 'monthlyXp must not be fabricated');
  assert.ok(Array.isArray(summary.json.analytics.topicMastery));
  assert.ok(summary.json.analytics.topicMastery.some(t => t.topic && typeof t.score === 'number'));
});

test('plan toggle awards XP only once per transition', async () => {
  const jack = await registerAndLogin('jack');

  const toggle = await api('/dashboard/plan/toggle', {
    method: 'POST',
    token: jack.accessToken,
    body: { itemId: 'item_1', completed: true }
  });
  assert.equal(toggle.status, 200);

  const me0 = await api('/auth/me', { token: jack.accessToken });
  const xpAfterFirst = me0.json.user.xp;

  // Re-toggling the same completed state must not double-award.
  await api('/dashboard/plan/toggle', {
    method: 'POST',
    token: jack.accessToken,
    body: { itemId: 'item_1', completed: true }
  });
  const me1 = await api('/auth/me', { token: jack.accessToken });
  assert.equal(me1.json.user.xp, xpAfterFirst);

  // Invalid payloads rejected.
  const badCompleted = await api('/dashboard/plan/toggle', {
    method: 'POST',
    token: jack.accessToken,
    body: { itemId: 'item_1', completed: 'yes' }
  });
  assert.equal(badCompleted.status, 400);
});

test('session revocation also revokes the linked refresh token', async () => {
  const kim = await registerAndLogin('kim');
  const freshLogin = await api('/auth/login', { method: 'POST', body: { loginId: kim.email, password: PASSWORD } });
  assert.equal(freshLogin.status, 200);

  const sessions = await api('/auth/sessions', { token: freshLogin.json.accessToken });
  assert.equal(sessions.status, 200);
  assert.ok(sessions.json.length >= 1);

  // Delete the newest session (the one tied to this refresh token).
  const newest = sessions.json[0];
  const del = await api(`/auth/sessions/${newest.id}`, { method: 'DELETE', token: freshLogin.json.accessToken });
  assert.equal(del.status, 200);

  // Its refresh token can no longer mint tokens.
  const refresh = await api('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: freshLogin.json.refreshToken }
  });
  assert.equal(refresh.status, 401);

  // Unknown session → 404.
  const missing = await api('/auth/sessions/sess_doesnotexist', { method: 'DELETE', token: kim.accessToken });
  assert.equal(missing.status, 404);
});

test('change password revokes sessions and requires the new password', async () => {
  const leo = await registerAndLogin('leo');

  const change = await api('/auth/change-password', {
    method: 'PUT',
    token: leo.accessToken,
    body: { oldPassword: PASSWORD, newPassword: 'NewPassword5678!' }
  });
  assert.equal(change.status, 200);

  // Old password no longer works.
  const oldLogin = await api('/auth/login', { method: 'POST', body: { loginId: leo.email, password: PASSWORD } });
  assert.equal(oldLogin.status, 401);

  // Old refresh token revoked.
  const refresh = await api('/auth/refresh', { method: 'POST', body: { refreshToken: leo.refreshToken } });
  assert.equal(refresh.status, 401);

  // New password works.
  const newLogin = await api('/auth/login', { method: 'POST', body: { loginId: leo.email, password: 'NewPassword5678!' } });
  assert.equal(newLogin.status, 200);

  // Wrong old password rejected.
  const wrongOld = await api('/auth/change-password', {
    method: 'PUT',
    token: newLogin.json.accessToken,
    body: { oldPassword: 'WrongPassword999!', newPassword: 'AnotherPassword123!' }
  });
  assert.equal(wrongOld.status, 400);
});

test('brute force lockout engages after repeated failures', async () => {
  // 5 failed attempts engage the lock; the 6th must be throttled.
  for (let i = 0; i < 5; i++) {
    await api('/auth/login', { method: 'POST', body: { loginId: 'ghost@test.local', password: 'WrongPass1234!' } });
  }
  const locked = await api('/auth/login', { method: 'POST', body: { loginId: 'ghost@test.local', password: 'WrongPass1234!' } });
  assert.equal(locked.status, 429);

  // Clear the lock so later tests (account deletion) can still log in. The
  // request IP on macOS loopback can surface as 127.0.0.1, ::1 or the
  // IPv4-mapped ::ffff:127.0.0.1 — clear all canonical forms.
  const rateLimiter = await import('../src/middleware/rateLimit.js');
  rateLimiter.clearLoginAttempts('127.0.0.1');
  rateLimiter.clearLoginAttempts('::1');
  rateLimiter.clearLoginAttempts('::ffff:127.0.0.1');
});

test('forgot-password endpoint is rate limited', async () => {
  for (let i = 0; i < 5; i++) {
    await api('/auth/forgot-password', { method: 'POST', body: { email: 'ghost@test.local' } });
  }
  const blocked = await api('/auth/forgot-password', { method: 'POST', body: { email: 'ghost@test.local' } });
  assert.equal(blocked.status, 429);
});

test('account deletion is irreversible and cascades', async () => {
  const nora = await registerAndLogin('nora');

  const del = await api('/auth/account', { method: 'DELETE', token: nora.accessToken });
  assert.equal(del.status, 200);

  const relogin = await api('/auth/login', { method: 'POST', body: { loginId: nora.email, password: PASSWORD } });
  assert.equal(relogin.status, 401);
});

test('role changes validate against security tags and guard the last super admin', async () => {
  const superAdmin = await api('/auth/login', {
    method: 'POST',
    body: { loginId: 'alex@atlas.dev', password: 'SuperAdmin8200!' }
  });
  assert.equal(superAdmin.status, 200);

  const db = (await import('../src/db/index.js')).getDb();
  const adminRow = await db.get('SELECT id FROM users WHERE username = ?', ['elena']);
  const users = await db.all('SELECT id, username FROM users WHERE username NOT IN (?, ?, ?, ?, ?)', ['abhi', 'sarah', 'vikram', 'elena', 'alex']);
  const expendable = users[0];

  // Unknown tag → 400 (role must exist in security_tags).
  const badTag = await api(`/users/${expendable.id}/role`, {
    method: 'PUT',
    token: superAdmin.json.accessToken,
    body: { role: 'not_a_real_tag' }
  });
  assert.equal(badTag.status, 400);

  // Valid tag change works.
  const okTag = await api(`/users/${adminRow.id}/role`, {
    method: 'PUT',
    token: superAdmin.json.accessToken,
    body: { role: 'mentor' }
  });
  assert.equal(okTag.status, 200);
  assert.equal(okTag.json.role, 'mentor');

  // Restore to avoid leaving the demo DB in a weird state for later assertions.
  await api(`/users/${adminRow.id}/role`, {
    method: 'PUT',
    token: superAdmin.json.accessToken,
    body: { role: 'admin' }
  });

  // Demoting the last super admin is refused.
  const selfDemote = await api(`/users/${superAdmin.json.user.id}/role`, {
    method: 'PUT',
    token: superAdmin.json.accessToken,
    body: { role: 'mentor' }
  });
  assert.equal(selfDemote.status, 409);
});