import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import passport from '../config/passport.js';
import { config } from '../config/index.js';
import { getDb } from '../db/index.js';
import { withTransaction } from '../db/transaction.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimitLogin, recordLoginFailure, clearLoginAttempts, rateLimit } from '../middleware/rateLimit.js';
import { writeAuditLog } from '../middleware/audit.js';
import { signTokens, persistAuthSession, processOAuthLogin } from '../services/auth.service.js';
import { isValidEmail, isValidPassword, PASSWORD_ERROR_MESSAGE, isNonEmptyString } from '../utils/validators.js';

const router = Router();

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

function getIp(req) {
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

// 1. Check Username Availability
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  if (!isNonEmptyString(username, 30)) {
    return res.status(400).json({ error: 'Invalid username format.' });
  }
  try {
    const db = getDb();
    const row = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    res.json({ available: !row });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check username availability.' });
  }
});

// 2. Register
router.post('/register', rateLimit({ windowMs: 60_000, max: 30, message: 'Too many registration attempts. Please wait a moment.' }), async (req, res) => {
  const { email, username, password, full_name, career_goal, learning_track } = req.body;
  const db = getDb();

  // Basic Validations
  if (!isNonEmptyString(email, 120) || !isNonEmptyString(username, 30) || !isNonEmptyString(password, 128) || !isNonEmptyString(full_name, 80)) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-30 characters and can only contain letters, numbers, dots, dashes and underscores.' });
  }

  if (career_goal !== undefined && typeof career_goal !== 'string') {
    return res.status(400).json({ error: 'career_goal must be a string.' });
  }
  if (learning_track !== undefined && typeof learning_track !== 'string') {
    return res.status(400).json({ error: 'learning_track must be a string.' });
  }

  // Strong password check: min 10 characters, upper, lower, number, special char
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: PASSWORD_ERROR_MESSAGE });
  }

  try {
    // Unique check
    const emailRow = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (emailRow) return res.status(400).json({ error: 'Email is already registered.' });

    const userRow = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (userRow) return res.status(400).json({ error: 'Username is already taken.' });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const userId = 'usr_' + uuidv4().substr(0, 8);
    const timestamp = new Date().toISOString();

    // Atomic account + profile + verification token creation
    const verifyToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); // 24 hours

    await withTransaction(async (db) => {
      await db.run(
        'INSERT INTO users (id, email, username, password_hash, role, is_email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
        [userId, email, username, hash, 'Student', timestamp, timestamp]
      );

      await db.run(
        'INSERT INTO profiles (id, user_id, full_name, career_goal, learning_track, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['prof_' + userId, userId, full_name, career_goal || '', learning_track || '', timestamp, timestamp]
      );

      await db.run(
        'INSERT INTO email_verifications (token, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)',
        [verifyToken, userId, expiresAt, timestamp]
      );
    });

    await writeAuditLog(userId, 'REGISTER_INIT', req);

    // Developer link helper printed to terminal console
    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] Verification link sent to ${email}`);
    console.log(`Verify Endpoint: ${config.frontendUrl}/#verify-email?token=${verifyToken}`);
    console.log(`======================================================\n`);

    res.status(201).json({
      message: 'Account created. Please check your developer console/inbox to verify your email.',
      verifyToken // returned for easy simulation click
    });

  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({ error: 'Registration service encountered an error.' });
  }
});

// 3. Verify Email Token
router.post('/verify-email', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const { token } = req.body;
  if (!isNonEmptyString(token, 200)) return res.status(400).json({ error: 'Verification token is required.' });

  try {
    const db = getDb();
    const row = await db.get('SELECT * FROM email_verifications WHERE token = ?', [token]);
    if (!row) {
      return res.status(400).json({ error: 'Invalid verification token.' });
    }

    if (row.used === 1) {
      return res.status(400).json({ error: 'This verification token has already been used.' });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This verification token has expired.' });
    }

    // Mark verified
    await withTransaction(async (db) => {
      await db.run('UPDATE users SET is_email_verified = 1 WHERE id = ?', [row.user_id]);
      await db.run('UPDATE email_verifications SET used = 1 WHERE token = ?', [token]);
    });

    await writeAuditLog(row.user_id, 'EMAIL_VERIFIED', req);

    res.json({ message: 'Email verified successfully. You may now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Email verification pipeline failed.' });
  }
});

// 4. Resend Verification Token
router.post('/resend-verification', rateLimit({ windowMs: 60_000, max: 5, message: 'Too many verification emails requested. Please wait.' }), async (req, res) => {
  const { email } = req.body;
  if (!isNonEmptyString(email, 120)) return res.status(400).json({ error: 'Email is required.' });

  try {
    const db = getDb();
    const userRow = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (!userRow) {
      return res.status(400).json({ error: 'Email signature not recognized.' });
    }

    if (userRow.is_email_verified === 1) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    // Invalidate old tokens
    await db.run('UPDATE email_verifications SET used = 1 WHERE user_id = ?', [userRow.id]);

    // Create new token
    const verifyToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    await db.run(
      'INSERT INTO email_verifications (token, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)',
      [verifyToken, userRow.id, expiresAt, new Date().toISOString()]
    );

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] New verification link sent to ${email}`);
    console.log(`Verify Endpoint: ${config.frontendUrl}/#verify-email?token=${verifyToken}`);
    console.log(`======================================================\n`);

    res.json({ message: 'A new verification link has been dispatched.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resend verification mail.' });
  }
});

// 5. Login (Supports callsign+passcode AND email/username+password)
router.post('/login', rateLimitLogin, async (req, res) => {
  const { callsign, passcode, loginId, password } = req.body;
  const ip = getIp(req);

  try {
    const db = getDb();
    let userRow = null;

    if (callsign && passcode) {
      // Keypad Login Path
      userRow = await db.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND passcode = ?', [callsign, passcode]);
      if (!userRow) {
        recordLoginFailure(ip);
        return res.status(401).json({ error: 'Invalid admin credentials or passcode.' });
      }
    } else if (loginId && password) {
      // Email/Username + Password Login Path
      userRow = await db.get(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)',
        [loginId, loginId]
      );
      if (!userRow) {
        recordLoginFailure(ip);
        return res.status(401).json({ error: 'Account not found or password incorrect.' });
      }

      const match = await bcrypt.compare(password, userRow.password_hash);
      if (!match) {
        recordLoginFailure(ip);
        return res.status(401).json({ error: 'Account not found or password incorrect.' });
      }
    } else {
      return res.status(400).json({ error: 'Missing credentials payload.' });
    }

    // Check Verification bounds
    if (userRow.is_email_verified === 0) {
      return res.status(403).json({
        error: 'Email verification required.',
        requiresVerification: true,
        email: userRow.email
      });
    }

    // Success: Clear rate-limiter locks
    clearLoginAttempts(ip);

    // Fetch Profile
    const profileRow = await db.get('SELECT * FROM profiles WHERE user_id = ?', [userRow.id]);

    // Sign Tokens
    const { accessToken, refreshToken } = signTokens(userRow);
    const { sessionId } = await persistAuthSession(userRow, ip, req.headers['user-agent'], accessToken, refreshToken);

    await writeAuditLog(userRow.id, 'LOGIN_SUCCESS', req);

    res.json({
      user: {
        id: userRow.id,
        email: userRow.email,
        username: userRow.username,
        role: userRow.role,
        xp: userRow.xp,
        level: userRow.level,
        code_quality: userRow.code_quality,
        is_email_verified: userRow.is_email_verified
      },
      profile: profileRow,
      accessToken,
      refreshToken,
      sessionId
    });

  } catch (err) {
    console.error('Login process failure:', err);
    res.status(500).json({ error: 'Auth system failed to complete login.' });
  }
});

// 6. Refresh Token
router.post('/refresh', rateLimit({ windowMs: 60_000, max: 60 }), async (req, res) => {
  const { refreshToken } = req.body;
  if (!isNonEmptyString(refreshToken, 500)) return res.status(400).json({ error: 'Refresh token is required.' });

  try {
    const db = getDb();
    const row = await db.get('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken]);
    if (!row || row.revoked === 1 || new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh token is invalid, revoked, or expired.' });
    }

    jwt.verify(refreshToken, config.refreshTokenSecret, async (err, decoded) => {
      if (err) return res.status(401).json({ error: 'Failed to verify token payload.' });

      const userRow = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
      if (!userRow) return res.status(401).json({ error: 'User does not exist.' });

      const payload = { id: userRow.id, email: userRow.email, username: userRow.username, role: userRow.role };
      const accessToken = jwt.sign(payload, config.accessTokenSecret, { expiresIn: '15m' });
      res.json({ accessToken });
    });
  } catch (err) {
    res.status(500).json({ error: 'Refresh pipeline encountered an error.' });
  }
});

// 7. Logout
router.post('/logout', async (req, res) => {
  const { sessionId, refreshToken } = req.body;
  try {
    await withTransaction(async (db) => {
      if (typeof refreshToken === 'string' && refreshToken) {
        await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', [refreshToken]);
      }
      if (typeof sessionId === 'string' && sessionId) {
        // Only remove the session if it belongs to the refresh token's owner.
        // Prevents an unauthenticated client from deleting arbitrary sessions.
        await db.run(`
          DELETE FROM sessions
          WHERE id = ? AND user_id = (SELECT user_id FROM refresh_tokens WHERE token = ? LIMIT 1)
        `, [sessionId, refreshToken || '']);
      }
    });
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Logout pipeline failed.' });
  }
});

// 8. Forgot Password
router.post('/forgot-password', rateLimit({ windowMs: 60_000, max: 5, message: 'Too many password reset requests. Please wait.' }), async (req, res) => {
  const { email } = req.body;
  if (!isNonEmptyString(email, 120)) return res.status(400).json({ error: 'Email is required.' });

  try {
    const db = getDb();
    const userRow = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);

    // Always return success to prevent username validation harvesting
    if (userRow) {
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 1 * 3600 * 1000).toISOString(); // 1 hour expiration
      await withTransaction(async (db) => {
        // Invalidate past resets
        await db.run('UPDATE password_resets SET used = 1 WHERE user_id = ?', [userRow.id]);
        await db.run(
          'INSERT INTO password_resets (token, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)',
          [resetToken, userRow.id, expiresAt, new Date().toISOString()]
        );
      });

      console.log(`\n======================================================`);
      console.log(`[EMAIL DISPATCH] Password reset link sent to ${email}`);
      console.log(`Reset Endpoint: ${config.frontendUrl}/#reset-password?token=${resetToken}`);
      console.log(`======================================================\n`);
    }

    res.json({ message: 'If the email matches a registered node, a reset link will appear shortly.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Password reset system error.' });
  }
});

// 9. Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!isNonEmptyString(token, 200) || !isNonEmptyString(password, 128)) return res.status(400).json({ error: 'Token and Password are required.' });

  if (!isValidPassword(password)) {
    return res.status(400).json({ error: PASSWORD_ERROR_MESSAGE });
  }

  try {
    const db = getDb();
    const resetRow = await db.get('SELECT * FROM password_resets WHERE token = ?', [token]);
    if (!resetRow || resetRow.used === 1 || new Date(resetRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token is invalid or expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await withTransaction(async (db) => {
      await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, resetRow.user_id]);
      await db.run('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
      // Revoke all sessions and refresh tokens for security!
      await db.run('DELETE FROM sessions WHERE user_id = ?', [resetRow.user_id]);
      await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [resetRow.user_id]);
    });

    await writeAuditLog(resetRow.user_id, 'PASSWORD_RESET', req);

    res.json({ message: 'Password has been updated. You may now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 10. Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${config.frontendUrl}/login?error=google_failed` }),
  async (req, res) => {
    try {
      const ip = getIp(req);
      const userAgent = req.headers['user-agent'] || 'Google OAuth Agent';
      const tokens = await processOAuthLogin(req.user, 'google', ip, userAgent);
      await writeAuditLog(jwt.decode(tokens.accessToken).id, 'LOGIN_OAUTH_GOOGLE', req);
      res.redirect(`${config.frontendUrl}/auth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&sessionId=${tokens.sessionId}`);
    } catch (err) {
      console.error('Google OAuth failed:', err);
      res.redirect(`${config.frontendUrl}/login?error=server_error`);
    }
  }
);

// 10b. GitHub OAuth Routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${config.frontendUrl}/login?error=github_failed` }),
  async (req, res) => {
    try {
      const ip = getIp(req);
      const userAgent = req.headers['user-agent'] || 'GitHub OAuth Agent';
      const tokens = await processOAuthLogin(req.user, 'github', ip, userAgent);
      await writeAuditLog(jwt.decode(tokens.accessToken).id, 'LOGIN_OAUTH_GITHUB', req);
      res.redirect(`${config.frontendUrl}/auth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&sessionId=${tokens.sessionId}`);
    } catch (err) {
      console.error('GitHub OAuth failed:', err);
      res.redirect(`${config.frontendUrl}/login?error=server_error`);
    }
  }
);

// 11. Profile details (GET current user credentials)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const userRow = await db.get('SELECT id, email, username, role, xp, level, code_quality, is_email_verified FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) return res.status(404).json({ error: 'User signature not found.' });

    const profileRow = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const oauthRows = await db.all('SELECT provider, created_at FROM oauth_accounts WHERE user_id = ?', [req.user.id]);

    res.json({
      user: userRow,
      profile: profileRow,
      oauthAccounts: oauthRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile loading failure.' });
  }
});

// 12. Update Profile Settings
// Field-level validation for every writable profile column; only provided
// fields are updated (partial PUT). Length caps prevent unbounded bloat.
const PROFILE_FIELD_LIMITS = {
  full_name: 80,
  avatar: 300,
  country: 80,
  timezone: 50,
  language: 40,
  experience: 30,
  career_goal: 160,
  learning_track: 80,
  preferred_time: 40,
  tech_stack: 400
};

router.put('/profile', authenticateToken, async (req, res) => {
  const body = req.body || {};
  if (typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid payload.' });
  }

  const sets = [];
  const values = [];

  for (const [field, maxLength] of Object.entries(PROFILE_FIELD_LIMITS)) {
    if (body[field] === undefined) continue;

    if (body[field] === null) {
      sets.push(`${field} = ?`);
      values.push('');
      continue;
    }

    if (typeof body[field] !== 'string') {
      return res.status(400).json({ error: `${field} must be a string.` });
    }
    if (body[field].length > maxLength) {
      return res.status(400).json({ error: `${field} exceeds the ${maxLength} character limit.` });
    }
    sets.push(`${field} = ?`);
    values.push(body[field].trim());
  }

  if (sets.length === 0) {
    return res.status(400).json({ error: 'No valid profile fields provided.' });
  }

  const timestamp = new Date().toISOString();
  try {
    const db = getDb();

    // Self-heal a missing profile row (legacy/OAuth users) before updating.
    const existing = await db.get('SELECT user_id FROM profiles WHERE user_id = ?', [req.user.id]);
    if (!existing) {
      await db.run(
        'INSERT INTO profiles (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
        ['prof_' + req.user.id, req.user.id, timestamp, timestamp]
      );
    }

    await db.run(
      `UPDATE profiles SET ${sets.join(', ')}, updated_at = ? WHERE user_id = ?`,
      [...values, timestamp, req.user.id]
    );

    const updatedProfile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    res.json(updatedProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update developer profile.' });
  }
});

// 13. Change password
router.put('/change-password', authenticateToken, rateLimit({ windowMs: 60_000, max: 5, message: 'Too many password change attempts. Please wait.' }), async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!isNonEmptyString(oldPassword, 128) || !isNonEmptyString(newPassword, 128)) return res.status(400).json({ error: 'Old and New passwords are required.' });

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      error: PASSWORD_ERROR_MESSAGE
    });
  }

  try {
    const db = getDb();
    const userRow = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) return res.status(404).json({ error: 'User not found.' });
    const match = await bcrypt.compare(oldPassword, userRow.password_hash);
    if (!match) return res.status(400).json({ error: 'Old password is incorrect.' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Changing the password revokes every session and refresh token for the
    // user (same policy as password reset) so stolen credentials do not keep
    // a session alive. The current browser keeps its access token up to its
    // 15-minute expiry, then must re-authenticate.
    await withTransaction(async (db) => {
      await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
      await db.run('DELETE FROM sessions WHERE user_id = ?', [req.user.id]);
      await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [req.user.id]);
    });

    await writeAuditLog(req.user.id, 'PASSWORD_CHANGE', req);

    res.json({ message: 'Password updated successfully. All active sessions were signed out for security.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Change password failed.' });
  }
});

// 14. Get active sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const sessions = await db.all(
      'SELECT id, ip_address, user_agent, last_active, created_at FROM sessions WHERE user_id = ? ORDER BY last_active DESC',
      [req.user.id]
    );
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list active device sessions.' });
  }
});

// 15. Revoke specific session (also revokes the linked refresh token)
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;
  if (!/^sess_[A-Za-z0-9]+$/.test(sessionId || '')) {
    return res.status(400).json({ error: 'Invalid session id.' });
  }
  try {
    const outcome = await withTransaction(async (db) => {
      const del = await db.run('DELETE FROM sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
      if (del.changes === 0) return null;
      // Revoke every refresh token bound to the deleted session (legacy rows
      // without a session link stay active — they cannot be mapped).
      await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE session_id = ?', [sessionId]);
      return del;
    });

    if (!outcome) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    await writeAuditLog(req.user.id, `SESSION_REVOKE_${sessionId}`, req);
    res.json({ message: 'Session revoked successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to terminate device session.' });
  }
});

// 16. Delete account permanently
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const userRow = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);

    // Guard against deleting the final super admin (would lock everyone out).
    if (userRow && userRow.role.toLowerCase() === 'super admin') {
      const count = await db.get('SELECT COUNT(*) as count FROM users WHERE LOWER(role) = "super admin"');
      if (count.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last super admin account.' });
      }
    }

    // Delete user row (cascades profiles, sessions, tokens, etc.)
    await db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Developer profile completely destroyed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Account destruction failed.' });
  }
});

export default router;