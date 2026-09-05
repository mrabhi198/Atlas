import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';

// PROTOTYPE SIMULATOR — not a real compiler.
//
// This service emulates the "Scale Instagram Followers Search" mission
// benchmark by matching keywords in the submitted code instead of compiling
// and executing it. It exists to power the current prototype UX and must be
// replaced by a real sandboxed execution engine before production (see
// architecture.md). This is documented here and surfaced to the client via the
// `simulation: true` flag on every response.
//
// Honesty contract (implemented 2026-09-05):
//  - No XP / level / code_quality mutations. Re-running the mission used to
//    grant +800 XP each time (unbounded farm) and hardcode code_quality=94
//    ("verified engineer") with zero evidence.
//  - No VERIFIED mission row is written. Each run instead inserts a real
//    `mission_attempts` row (status passed/failed, source code, timestamp) so
//    there is verifiable submission history.
//  - latency/memory are display figures of the simulation; they are NOT stored
//    (NULL) because nothing actually executed to measure them.

export const MISSION_ID = 'instagram_search';
export const MISSION_TITLE = 'Scale Instagram Followers Search';

export async function executeMissionSimulation(userId, code) {
  const db = getDb();
  const userRow = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!userRow) {
    const error = new Error('User node not found.');
    error.status = 404;
    throw error;
  }

  const isOptimized = code.includes('TrieNode') || code.includes('buildIndex') || code.includes('Trie');

  const logs = [
    'Building Kotlin JVM module...',
    'Executing task: :compileKotlin',
    'Compilation Successful.',
    'Executing task: :test --tests "com.atlas.mission.SearchBenchmarks"',
    'Running performance suite for 50,000 followers...'
  ];

  let success = false;

  if (isOptimized) {
    success = true;
    const latency = parseFloat((0.8 + Math.random() * 0.9).toFixed(2));
    const memory = parseFloat((4.2 + Math.random() * 0.8).toFixed(2));
    logs.push(
      '[BENCHMARK] Dataset Size: 50,000 follower records',
      '[BENCHMARK] Query Pattern: Prefix query "follower_49"',
      `[BENCHMARK] Latency: ${latency} ms (Budget constraint: < 5.00 ms) - PASS`,
      `[BENCHMARK] Memory Overhead: ${memory} MB (Budget constraint: < 10.00 MB) - PASS`,
      '[BENCHMARK] Accuracy Index: 100% Correct Match - PASS',
      ' ',
      '✔ ALL TESTS PASSED — SIMULATION RESULT',
      'Submission recorded to your attempt history.'
    );
  } else {
    const latency = parseFloat((260 + Math.random() * 50).toFixed(2));
    const memory = parseFloat((1.1 + Math.random() * 0.1).toFixed(2));
    logs.push(
      '[BENCHMARK] Dataset Size: 50,000 follower records',
      '[BENCHMARK] Query Pattern: Prefix query "follower_49"',
      `[BENCHMARK] Latency: ${latency} ms (Budget constraint: < 5.00 ms) - FAILED`,
      `[BENCHMARK] Memory Overhead: ${memory} MB (Budget constraint: < 10.00 MB) - PASS`,
      '[BENCHMARK] Error: Latency budget exceeded! Linear O(N) complexity is too high for this dataset.',
      ' ',
      '❌ BENCHMARK FAILED (1/2 Assertions Passed)',
      'Hint: Analyze the search loop. A list filter checks every element linearly. Index your elements!',
      'BUILD FAILED'
    );
  }

  // Real submission history — latency/memory are intentionally NULL (the
  // simulator never executes the code, so no real measurements exist).
  const attemptId = 'att_' + uuidv4().substr(0, 12);
  await db.run(
    'INSERT INTO mission_attempts (id, user_id, mission_id, status, source_code, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [attemptId, userId, MISSION_ID, success ? 'passed' : 'failed', code, new Date().toISOString()]
  );

  const attemptCountRow = await db.get(
    'SELECT COUNT(*) as count FROM mission_attempts WHERE user_id = ? AND mission_id = ?',
    [userId, MISSION_ID]
  );

  const updatedUser = await db.get('SELECT id, email, username, role, xp, level, code_quality FROM users WHERE id = ?', [userId]);
  return {
    success,
    logs,
    user: updatedUser,
    simulation: true,
    missionId: MISSION_ID,
    attemptId,
    attemptCount: attemptCountRow.count
  };
}