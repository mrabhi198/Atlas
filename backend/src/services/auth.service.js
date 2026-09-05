import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { getDb } from '../db/index.js';

// Sign JWT access + refresh tokens for a user row
export function signTokens(userRow) {
  const payload = { id: userRow.id, email: userRow.email, username: userRow.username, role: userRow.role };
  const accessToken = jwt.sign(payload, config.accessTokenSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userRow.id }, config.refreshTokenSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// Persist a refresh token row, create an active session, return session ids
export async function persistAuthSession(userRow, ip, userAgent, accessToken, refreshToken) {
  const db = getDb();
  const timestamp = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  // Store Refresh Token
  await db.run(
    'INSERT INTO refresh_tokens (token, user_id, expires_at, revoked, created_at) VALUES (?, ?, ?, 0, ?)',
    [refreshToken, userRow.id, expiresAt, timestamp]
  );

  // Create Active Session
  const sessionId = 'sess_' + uuidv4().substr(0, 8);
  const userAgentLabel = userAgent || 'Unspecified browser';
  await db.run(
    'INSERT INTO sessions (id, user_id, ip_address, user_agent, last_active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [sessionId, userRow.id, ip, userAgentLabel, timestamp, timestamp]
  );

  return { sessionId };
}

// Handles OAuth login: looks up or creates the user, links the OAuth
// account, then issues tokens + session.
export async function processOAuthLogin(profile, provider, ip, userAgent) {
  const db = getDb();
  let email = profile.emails?.[0]?.value;

  // GitHub might not return email in profile.emails if it's private, even with user:email scope
  // If undefined, try to extract from other profile fields or fallback to a dummy email based on provider ID
  if (!email && provider === 'github') {
    email = profile._json?.email || `${profile.username || profile.id}@github.oauth.local`;
  }

  const name = profile.displayName || profile.username || 'OAuth User';
  const providerUserId = profile.id;

  if (!email || !providerUserId) {
    console.error('OAuth profile payload:', profile);
    throw new Error('OAuth payload is incomplete. Email is required.');
  }

  let userRow = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  const timestamp = new Date().toISOString();

  if (!userRow) {
    // Create user
    const userId = 'usr_' + uuidv4().substr(0, 8);
    const randomPass = uuidv4(); // placeholder password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(randomPass, salt);
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    await db.run(
      'INSERT INTO users (id, email, username, password_hash, role, is_email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [userId, email, username, hash, 'Student', timestamp, timestamp]
    );

    await db.run(
      'INSERT INTO profiles (id, user_id, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      ['prof_' + userId, userId, name, timestamp, timestamp]
    );

    userRow = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  }

  // Link OAuth account
  const linkRow = await db.get('SELECT id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?', [provider, providerUserId]);
  if (!linkRow) {
    await db.run(
      'INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, created_at) VALUES (?, ?, ?, ?, ?)',
      ['oa_' + uuidv4().substr(0, 8), userRow.id, provider, providerUserId, timestamp]
    );
  }

  // Sign tokens
  const { accessToken, refreshToken } = signTokens(userRow);
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  await db.run(
    'INSERT INTO refresh_tokens (token, user_id, expires_at, revoked, created_at) VALUES (?, ?, ?, 0, ?)',
    [refreshToken, userRow.id, expiresAt, timestamp]
  );

  const sessionId = 'sess_' + uuidv4().substr(0, 8);
  await db.run(
    'INSERT INTO sessions (id, user_id, ip_address, user_agent, last_active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [sessionId, userRow.id, ip, userAgent, timestamp, timestamp]
  );

  return { accessToken, refreshToken, sessionId };
}