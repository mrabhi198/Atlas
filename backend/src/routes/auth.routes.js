import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import passport from '../config/passport.js';
import { config } from '../config/index.js';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimitLogin, recordLoginFailure, clearLoginAttempts } from '../middleware/rateLimit.js';
import { writeAuditLog } from '../middleware/audit.js';
import { signTokens, persistAuthSession, processOAuthLogin } from '../services/auth.service.js';
import { isValidEmail, isValidPassword, PASSWORD_ERROR_MESSAGE } from '../utils/validators.js';

const router = Router();

// 1. Check Username Availability
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const db = getDb();
    const row = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    res.json({ available: !row });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check username availability.' });
  }
});

// 2. Register
router.post('/register', async (req, res) => {
  const { email, username, password, full_name, career_goal, learning_track } = req.body;
  const db = getDb();

  // Basic Validations
  if (!email || !username || !password || !full_name) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
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

    // Insert User (unverified)
    await db.run(
      'INSERT INTO users (id, email, username, password_hash, role, is_email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
      [userId, email, username, hash, 'Student', timestamp, timestamp]
    );

    // Insert Initial Profile
    await db.run(
      'INSERT INTO profiles (id, user_id, full_name, career_goal, learning_track, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['prof_' + userId, userId, full_name, career_goal || '', learning_track || '', timestamp, timestamp]
    );

    // Create Email Verification Token
    const verifyToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); // 24 hours
    await db.run(
      'INSERT INTO email_verifications (token, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)',
      [verifyToken, userId, expiresAt, timestamp]
    );

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
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Verification token is required.' });

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
    await db.run('UPDATE users SET is_email_verified = 1 WHERE id = ?', [row.user_id]);
    await db.run('UPDATE email_verifications SET used = 1 WHERE token = ?', [token]);

    await writeAuditLog(row.user_id, 'EMAIL_VERIFIED', req);

    res.json({ message: 'Email verified successfully. You may now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Email verification pipeline failed.' });
  }
});

// 4. Resend Verification Token
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

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
    res.status(500).json({ error: 'Failed to resend verification mail.' });
  }
});

// 5. Login (Supports callsign+passcode AND email/username+password)
router.post('/login', rateLimitLogin, async (req, res) => {
  const { callsign, passcode, loginId, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

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
        code_quality: userRow.code_quality
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
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required.' });

  try {
    const db = getDb();
    const row = await db.get('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken]);
    if (!row || row.revoked === 1 || new Date(row.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Refresh token is invalid, revoked, or expired.' });
    }

    jwt.verify(refreshToken, config.refreshTokenSecret, async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Failed to verify token payload.' });

      const userRow = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
      if (!userRow) return res.status(403).json({ error: 'User does not exist.' });

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
    const db = getDb();
    if (sessionId) {
      await db.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
    }
    if (refreshToken) {
      await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', [refreshToken]);
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Logout pipeline failed.' });
  }
});

// 8. Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const db = getDb();
    const userRow = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);

    // Always return success to prevent username validation harvesting
    if (userRow) {
      // Invalidate past resets
      await db.run('UPDATE password_resets SET used = 1 WHERE user_id = ?', [userRow.id]);

      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 1 * 3600 * 1000).toISOString(); // 1 hour expiration
      await db.run(
        'INSERT INTO password_resets (token, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)',
        [resetToken, userRow.id, expiresAt, new Date().toISOString()]
      );

      console.log(`\n======================================================`);
      console.log(`[EMAIL DISPATCH] Password reset link sent to ${email}`);
      console.log(`Reset Endpoint: ${config.frontendUrl}/#reset-password?token=${resetToken}`);
      console.log(`======================================================\n`);
    }

    res.json({ message: 'If the email matches a registered node, a reset link will appear shortly.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset system error.' });
  }
});

// 9. Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and Password are required.' });

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

    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, resetRow.user_id]);
    await db.run('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
    // Revoke all sessions for security!
    await db.run('DELETE FROM sessions WHERE user_id = ?', [resetRow.user_id]);
    await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [resetRow.user_id]);

    await writeAuditLog(resetRow.user_id, 'PASSWORD_RESET', req);

    res.json({ message: 'Password has been updated. You may now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 10. Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${config.frontendUrl}/login?error=google_failed` }),
  async (req, res) => {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
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
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
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
    const userRow = await db.get('SELECT id, email, username, role, xp, level, code_quality FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) return res.status(404).json({ error: 'User signature not found.' });

    const profileRow = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const oauthRows = await db.all('SELECT provider, created_at FROM oauth_accounts WHERE user_id = ?', [req.user.id]);

    res.json({
      user: userRow,
      profile: profileRow,
      oauthAccounts: oauthRows
    });
  } catch (err) {
    res.status(500).json({ error: 'Profile loading failure.' });
  }
});

// 12. Update Profile Settings
router.put('/profile', authenticateToken, async (req, res) => {
  const { full_name, avatar, country, timezone, language, experience, career_goal, learning_track, preferred_time, tech_stack } = req.body;
  const timestamp = new Date().toISOString();

  try {
    const db = getDb();
    await db.run(
      `UPDATE profiles SET
        full_name = ?, avatar = ?, country = ?, timezone = ?, language = ?,
        experience = ?, career_goal = ?, learning_track = ?, preferred_time = ?, tech_stack = ?,
        updated_at = ?
      WHERE user_id = ?`,
      [full_name, avatar, country, timezone, language, experience, career_goal, learning_track, preferred_time, tech_stack, timestamp, req.user.id]
    );

    const updatedProfile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    res.json(updatedProfile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update developer profile.' });
  }
});

// 13. Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Old and New passwords are required.' });

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      error: 'Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  try {
    const db = getDb();
    const userRow = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(oldPassword, userRow.password_hash);
    if (!match) return res.status(400).json({ error: 'Old password is incorrect.' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    await writeAuditLog(req.user.id, 'PASSWORD_CHANGE', req);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Change password failed.' });
  }
});

// 14. Get active sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const sessions = await db.all('SELECT id, ip_address, user_agent, last_active, created_at FROM sessions WHERE user_id = ?', [req.user.id]);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list active device sessions.' });
  }
});

// 15. Revoke specific session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;
  try {
    const db = getDb();
    await db.run('DELETE FROM sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
    await writeAuditLog(req.user.id, `SESSION_REVOKE_${sessionId}`, req);
    res.json({ message: 'Session revoked successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to terminate device session.' });
  }
});

// 16. Delete account permanently
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    // Delete user row (cascades profiles, sessions, etc.)
    await db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Developer profile completely destroyed.' });
  } catch (err) {
    res.status(500).json({ error: 'Account destruction failed.' });
  }
});

export default router;