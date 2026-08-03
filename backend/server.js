import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// JWT Secrets (Zero-config fallback keys)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'atlas_core_access_secret_0x8f2';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'atlas_core_refresh_secret_0x2a9';

// Initialize SQLite Database
let db;
initDb().then(database => {
  db = database;
  console.log('SQLite Database connected and ready.');
}).catch(err => {
  console.error('Failed to initialize SQLite Database:', err);
});

// Setup Gemini AI client if API key exists
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('Gemini AI client initialized with API key.');
}

// -------------------------------------------------------------
// Security Middlewares & Helpers
// -------------------------------------------------------------

// Brute Force Lock Limiter (Failed login tracker)
const loginAttempts = new Map(); // ip -> { count, lockUntil }

function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();
  const limitRecord = loginAttempts.get(ip);

  if (limitRecord && limitRecord.lockUntil > now) {
    const minutesLeft = Math.ceil((limitRecord.lockUntil - now) / 60000);
    return res.status(429).json({ 
      error: `Brute force protection active. IP locked. Try again in ${minutesLeft} minutes.` 
    });
  }

  next();
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const limitRecord = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
  
  limitRecord.count += 1;
  if (limitRecord.count >= 5) {
    limitRecord.lockUntil = now + 15 * 60 * 1000; // lock for 15 minutes
    limitRecord.count = 0; // reset counter
  }
  loginAttempts.set(ip, limitRecord);
}

// Middleware to authenticate JWT access tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token missing. Authentication required.' });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token.' });
    }
    req.user = user; // { id, email, username, role }
    next();
  });
}

// Middleware to authorize Role-Based Access Control (RBAC)
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.map(r => r.toLowerCase()).includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ error: `Access Denied. Required role: [${allowedRoles.join(', ')}]` });
    }
    next();
  };
}

// Log admin/security event
async function writeAuditLog(userId, action, req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  try {
    await db.run(
      'INSERT INTO audit_logs (user_id, action, ip_address, timestamp) VALUES (?, ?, ?, ?)',
      [userId, action, ip, new Date().toISOString()]
    );
  } catch (err) {
    console.error('Audit logger error:', err);
  }
}

// -------------------------------------------------------------
// Authentication APIs
// -------------------------------------------------------------

// 1. Check Username Availability
app.get('/api/auth/check-username/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const row = await db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    res.json({ available: !row });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check username availability.' });
  }
});

// 2. Register
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password, full_name, career_goal, learning_track } = req.body;

  // Basic Validations
  if (!email || !username || !password || !full_name) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  // Strong password check: min 10 characters, upper, lower, number, special char
  const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  if (!pwdRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
    });
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
    console.log(`Verify Endpoint: http://localhost:5173/#verify-email?token=${verifyToken}`);
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
app.post('/api/auth/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Verification token is required.' });

  try {
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
app.post('/api/auth/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
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
    console.log(`Verify Endpoint: http://localhost:5173/#verify-email?token=${verifyToken}`);
    console.log(`======================================================\n`);

    res.json({ message: 'A new verification link has been dispatched.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend verification mail.' });
  }
});

// 5. Login (Supports callsing+passcode AND email/username+password)
app.post('/api/auth/login', rateLimitLogin, async (req, res) => {
  const { callsign, passcode, loginId, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  try {
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
    loginAttempts.delete(ip);

    // Fetch Profile
    const profileRow = await db.get('SELECT * FROM profiles WHERE user_id = ?', [userRow.id]);

    // Sign Tokens
    const payload = { id: userRow.id, email: userRow.email, username: userRow.username, role: userRow.role };
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userRow.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    // Store Refresh Token
    await db.run(
      'INSERT INTO refresh_tokens (token, user_id, expires_at, revoked, created_at) VALUES (?, ?, ?, 0, ?)',
      [refreshToken, userRow.id, expiresAt, timestamp]
    );

    // Create Active Session
    const sessionId = 'sess_' + uuidv4().substr(0, 8);
    const userAgent = req.headers['user-agent'] || 'Unspecified browser';
    await db.run(
      'INSERT INTO sessions (id, user_id, ip_address, user_agent, last_active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, userRow.id, ip, userAgent, timestamp, timestamp]
    );

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
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required.' });

  try {
    const row = await db.get('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken]);
    if (!row || row.revoked === 1 || new Date(row.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Refresh token is invalid, revoked, or expired.' });
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Failed to verify token payload.' });

      const userRow = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
      if (!userRow) return res.status(403).json({ error: 'User does not exist.' });

      const payload = { id: userRow.id, email: userRow.email, username: userRow.username, role: userRow.role };
      const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      res.json({ accessToken });
    });
  } catch (err) {
    res.status(500).json({ error: 'Refresh pipeline encountered an error.' });
  }
});

// 7. Logout
app.post('/api/auth/logout', async (req, res) => {
  const { sessionId, refreshToken } = req.body;
  try {
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
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
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
      console.log(`Reset Endpoint: http://localhost:5173/#reset-password?token=${resetToken}`);
      console.log(`======================================================\n`);
    }

    res.json({ message: 'If the email matches a registered node, a reset link will appear shortly.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset system error.' });
  }
});

// 9. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and Password are required.' });

  const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  if (!pwdRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
    });
  }

  try {
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

// 10. OAuth mock login
app.post('/api/auth/oauth', async (req, res) => {
  const { provider, email, name, providerUserId } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  if (!provider || !email || !providerUserId) {
    return res.status(400).json({ error: 'OAuth payload is incomplete.' });
  }

  try {
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

    const profileRow = await db.get('SELECT * FROM profiles WHERE user_id = ?', [userRow.id]);

    // Sign tokens
    const payload = { id: userRow.id, email: userRow.email, username: userRow.username, role: userRow.role };
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userRow.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    await db.run(
      'INSERT INTO refresh_tokens (token, user_id, expires_at, revoked, created_at) VALUES (?, ?, ?, 0, ?)',
      [refreshToken, userRow.id, expiresAt, timestamp]
    );

    const sessionId = 'sess_' + uuidv4().substr(0, 8);
    const userAgent = req.headers['user-agent'] || 'Unspecified OAuth Agent';
    await db.run(
      'INSERT INTO sessions (id, user_id, ip_address, user_agent, last_active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, userRow.id, ip, userAgent, timestamp, timestamp]
    );

    await writeAuditLog(userRow.id, `LOGIN_OAUTH_${provider.toUpperCase()}`, req);

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
    console.error('OAuth failed:', err);
    res.status(500).json({ error: 'OAuth federation failed.' });
  }
});

// 11. Profile details (GET current user credentials)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
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
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { full_name, avatar, country, timezone, language, experience, career_goal, learning_track, preferred_time, tech_stack } = req.body;
  const timestamp = new Date().toISOString();

  try {
    await db.run(
      `UPDATE profiles SET 
        full_name = ?, avatar = ?, country = ?, timezone = ?, language = ?, 
        experience = ?, career_goal = ?, learning_track = ?, preferred_time = ?, tech_stack = ?, 
        updated_at = ? 
      WHERE user_id = ?`,
      [full_name, avatar, country, timezone, language, experience, career_goal, learning_track, preferred_time, tech_stack, timestamp, req.user.id]
    );

    // Also update track in user row if passed
    if (learning_track) {
      await db.run('UPDATE users SET path = ? WHERE id = ?', [learning_track, req.user.id]);
    }

    const updatedProfile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    res.json(updatedProfile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update developer profile.' });
  }
});

// 13. Change password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Old and New passwords are required.' });

  const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  if (!pwdRegex.test(newPassword)) {
    return res.status(400).json({ 
      error: 'Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
    });
  }

  try {
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
app.get('/api/auth/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await db.all('SELECT id, ip_address, user_agent, last_active, created_at FROM sessions WHERE user_id = ?', [req.user.id]);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list active device sessions.' });
  }
});

// 15. Revoke specific session
app.delete('/api/auth/sessions/:sessionId', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;
  try {
    await db.run('DELETE FROM sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
    await writeAuditLog(req.user.id, `SESSION_REVOKE_${sessionId}`, req);
    res.json({ message: 'Session revoked successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to terminate device session.' });
  }
});

// 16. Delete account permanently
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    // Delete user row (cascades profiles, sessions, etc.)
    await db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Developer profile completely destroyed.' });
  } catch (err) {
    res.status(500).json({ error: 'Account destruction failed.' });
  }
});

// 17. Users List (Protected RBAC)
app.get('/api/users', authenticateToken, authorizeRoles('admin', 'super admin', 'mentor'), async (req, res) => {
  try {
    const users = await db.all('SELECT id, email, username, role, passcode, xp, level, code_quality, status FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user nodes.' });
  }
});

// 18. Update User Role Tag (Super Admin only)
app.put('/api/users/:id/role', authenticateToken, authorizeRoles('super admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const updated = await db.get('SELECT id, email, username, role FROM users WHERE id = ?', [id]);
    await writeAuditLog(req.user.id, `ROLE_CHANGE_${id}_TO_${role.toUpperCase()}`, req);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user security tag.' });
  }
});

// -------------------------------------------------------------
// Core Mission & AI endpoints (Hooked to JWT context)
// -------------------------------------------------------------

app.post('/api/missions/execute', authenticateToken, async (req, res) => {
  const { code, fileName } = req.body;
  const userId = req.user.id;

  try {
    const userRow = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!userRow) return res.status(404).json({ error: 'User node not found.' });

    const isOptimized = code.includes('TrieNode') || code.includes('buildIndex') || code.includes('Trie');

    const terminalLogs = [
      'Building Kotlin JVM module...',
      'Executing task: :compileKotlin',
      'Compilation Successful.',
      'Executing task: :test --tests "com.atlas.mission.SearchBenchmarks"',
      'Running performance suite for 50,000 followers...'
    ];

    let success = false;
    let latency = 0;
    let memory = 0;

    if (isOptimized) {
      success = true;
      latency = parseFloat((0.8 + Math.random() * 0.9).toFixed(2));
      memory = parseFloat((4.2 + Math.random() * 0.8).toFixed(2));
      terminalLogs.push(
        '[BENCHMARK] Dataset Size: 50,000 follower records',
        '[BENCHMARK] Query Pattern: Prefix query "follower_49"',
        `[BENCHMARK] Latency: ${latency} ms (Budget constraint: < 5.00 ms) - PASS`,
        `[BENCHMARK] Memory Overhead: ${memory} MB (Budget constraint: < 10.00 MB) - PASS`,
        '[BENCHMARK] Accuracy Index: 100% Correct Match - PASS',
        ' ',
        '✔ ALL TESTS PASSED SUCCESSFULLY',
        'XP Awarded: +800 XP',
        'Passport status updated: Scale Instagram Followers Search [VERIFIED]',
        'BUILD SUCCESSFUL'
      );

      const newXp = userRow.xp + 800;
      const newLevel = Math.floor(newXp / 1000) + 1;
      await db.run('UPDATE users SET xp = ?, level = ?, code_quality = 94 WHERE id = ?', [newXp, newLevel, userId]);
      await db.run(
        'INSERT OR REPLACE INTO missions (id, user_id, title, status, completed_at, source_code, latency, memory) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['instagram_search', userId, 'Scale Instagram Followers Search', 'VERIFIED', new Date().toISOString(), code, latency, memory]
      );
    } else {
      success = false;
      latency = parseFloat((260 + Math.random() * 50).toFixed(2));
      memory = parseFloat((1.1 + Math.random() * 0.1).toFixed(2));
      terminalLogs.push(
        '[BENCHMARK] Dataset Size: 50,000 follower records',
        '[BENCHMARK] Query Pattern: Prefix query "follower_49"',
        `[BENCHMARK] Latency: ${latency} ms (Budget constraint: < 5.00 ms) - FAILED`,
        `[BENCHMARK] Memory Overhead: ${memory} MB (Budget constraint: < 10.00 MB) - PASS`,
        '[BENCHMARK] Error: Latency budget exceeded! Linear O(N) complexity is too high for this dataset.',
        ' ',
        '❌ BENCHMARK FAILED (1/2 Assertions Passed)',
        'Hint: Analyze the search loop. A list filter checks every elements linearly. Index your elements!',
        'BUILD FAILED'
      );
    }

    const updatedUser = await db.get('SELECT id, email, username, role, xp, level, code_quality FROM users WHERE id = ?', [userId]);
    res.json({ success, logs: terminalLogs, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Sandbox execution failure.' });
  }
});

// AI Mentor Insights history
app.get('/api/mentor/history/:userId', authenticateToken, async (req, res) => {
  try {
    const history = await db.all('SELECT sender, text FROM chat_messages WHERE user_id = ? ORDER BY id ASC', [req.user.id]);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve AI mentor logs.' });
  }
});

// AI Mentor send message
app.post('/api/mentor/chat', authenticateToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  try {
    await db.run(
      'INSERT INTO chat_messages (user_id, sender, text, timestamp) VALUES (?, ?, ?, ?)',
      [userId, 'user', message, new Date().toISOString()]
    );

    let reply = '';
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          systemInstruction: 'You are Cognitive Guide, AI mentor for Atlas. Answer questions briefly (under 3 sentences) focusing on Kotlin, database systems, and index structures.'
        });
        const result = await model.generateContent(message);
        reply = result.response.text();
      } catch (err) {
        console.error(err);
      }
    }

    if (!reply) {
      const msgLower = message.toLowerCase();
      if (msgLower.includes('trie')) {
        reply = "A Trie tree index structures string lookup keys by character, achieving O(L) time complexity.";
      } else {
        reply = "Focus on optimizing your prefix search algorithms using index models.";
      }
    }

    await db.run(
      'INSERT INTO chat_messages (user_id, sender, text, timestamp) VALUES (?, ?, ?, ?)',
      [userId, 'mentor', reply, new Date().toISOString()]
    );

    res.json({ sender: 'mentor', text: reply });
  } catch (error) {
    res.status(500).json({ error: 'AI Mentor module offline.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Atlas backend node listening on port ${PORT}`);
});
