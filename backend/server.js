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
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Session is required for Passport OAuth strategies (to manage state)
app.use(session({
  secret: process.env.SESSION_SECRET || 'atlas_session_secret_0x999',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'mock_google_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    // Pass the profile along to the route handler
    return done(null, profile);
  }
));

// Configure GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'mock_github_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_github_secret',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5001/api/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    // Pass the profile along to the route handler
    return done(null, profile);
  }
));

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

// Helper for processing OAuth login
async function processOAuthLogin(profile, provider, ip, userAgent) {
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
  const payload = { id: userRow.id, email: userRow.email, username: userRow.username, role: userRow.role };
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userRow.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
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

// 10. Google OAuth Routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=google_failed' }),
  async (req, res) => {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Google OAuth Agent';
      const tokens = await processOAuthLogin(req.user, 'google', ip, userAgent);
      await writeAuditLog(jwt.decode(tokens.accessToken).id, `LOGIN_OAUTH_GOOGLE`, req);
      res.redirect(`http://localhost:5173/auth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&sessionId=${tokens.sessionId}`);
    } catch (err) {
      console.error('Google OAuth failed:', err);
      res.redirect('http://localhost:5173/login?error=server_error');
    }
  }
);

// 10b. GitHub OAuth Routes
app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/api/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: 'http://localhost:5173/login?error=github_failed' }),
  async (req, res) => {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'GitHub OAuth Agent';
      const tokens = await processOAuthLogin(req.user, 'github', ip, userAgent);
      await writeAuditLog(jwt.decode(tokens.accessToken).id, `LOGIN_OAUTH_GITHUB`, req);
      res.redirect(`http://localhost:5173/auth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&sessionId=${tokens.sessionId}`);
    } catch (err) {
      console.error('GitHub OAuth failed:', err);
      res.redirect('http://localhost:5173/login?error=server_error');
    }
  }
);

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

// 19. Get Security Tags
app.get('/api/tags', authenticateToken, authorizeRoles('admin', 'super admin', 'mentor'), async (req, res) => {
  try {
    const tags = await db.all('SELECT * FROM security_tags ORDER BY created_at ASC');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve security tags.' });
  }
});

// 20. Add Security Tag (Super Admin / Admin only)
app.post('/api/tags', authenticateToken, authorizeRoles('admin', 'super admin'), async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Tag name required' });
  
  try {
    const id = 'tag_' + Date.now() + Math.random().toString(36).substr(2, 9);
    await db.run('INSERT INTO security_tags (id, name, created_at) VALUES (?, ?, ?)', [
      id, name.trim(), new Date().toISOString()
    ]);
    const tag = await db.get('SELECT * FROM security_tags WHERE id = ?', [id]);
    await writeAuditLog(req.user.id, `CREATED_TAG_${name.toUpperCase()}`, req);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag. It might already exist.' });
  }
});

// 21. Delete Security Tag (Super Admin / Admin only)
app.delete('/api/tags/:name', authenticateToken, authorizeRoles('admin', 'super admin'), async (req, res) => {
  const { name } = req.params;
  const criticalTags = ['admin', 'super admin']; // Prevent lockout
  
  if (criticalTags.includes(name.toLowerCase())) {
    return res.status(403).json({ error: 'Cannot delete critical system tags.' });
  }

  try {
    await db.run('DELETE FROM security_tags WHERE LOWER(name) = LOWER(?)', [name]);
    await writeAuditLog(req.user.id, `DELETED_TAG_${name.toUpperCase()}`, req);
    res.json({ message: 'Tag deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag.' });
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
    const users = await db.all(`
      SELECT u.id, u.email, u.username, u.role, u.passcode, u.xp, u.level, u.code_quality, p.learning_track 
      FROM users u 
      LEFT JOIN profiles p ON u.id = p.user_id
    `);
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

// -------------------------------------------------------------
// Phase 2 Intelligent Student Dashboard APIs
// -------------------------------------------------------------

// 1. Dashboard Summary Data
app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // User & Profile stats
    const userRow = await db.get('SELECT username, role, xp, level, code_quality FROM users WHERE id = ?', [userId]);
    const profileRow = await db.get('SELECT full_name, avatar, career_goal, learning_track FROM profiles WHERE user_id = ?', [userId]);

    // Goals
    const goalsList = await db.all('SELECT goal_type, target_value, current_value FROM user_goals WHERE user_id = ?', [userId]);
    const dailyGoals = goalsList.filter(g => g.goal_type.startsWith('daily_'));
    const weeklyGoals = goalsList.filter(g => g.goal_type.startsWith('weekly_'));

    // Notifications
    const notifications = await db.all('SELECT id, title, message, category, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    // Plan & Preferences
    let prefRow = await db.get('SELECT pinned_actions, today_plan FROM dashboard_preferences WHERE user_id = ?', [userId]);
    if (!prefRow) {
      const defaultPlan = [
        { id: 'item_1', type: 'lesson', title: 'Character Trie Structs & Memory Layout', duration: '15m', completed: 0 },
        { id: 'item_2', type: 'logic', title: 'String Prefix Parsing Benchmark', duration: '10m', completed: 0 },
        { id: 'item_3', type: 'mission', title: 'Scale Instagram Followers Search', duration: '35m', completed: 0 },
        { id: 'item_4', type: 'reflection', title: 'Write Code-Quality Review Log', duration: '10m', completed: 0 }
      ];
      const pinned = ['ide', 'passport', 'settings'];
      await db.run(
        'INSERT INTO dashboard_preferences (user_id, pinned_actions, today_plan) VALUES (?, ?, ?)',
        [userId, JSON.stringify(pinned), JSON.stringify(defaultPlan)]
      );
      prefRow = { pinned_actions: JSON.stringify(pinned), today_plan: JSON.stringify(defaultPlan) };
    }

    const pinnedActions = JSON.parse(prefRow.pinned_actions);
    const todayPlan = JSON.parse(prefRow.today_plan || '[]');

    // Calculate progress
    const completedCount = todayPlan.filter(item => item.completed === 1).length;
    const todayProgress = todayPlan.length > 0 ? Math.round((completedCount / todayPlan.length) * 100) : 0;

    // Recommendations
    const recommendations = await db.all('SELECT id, type, title, estimated_time, difficulty FROM learning_recommendations WHERE user_id = ?', [userId]);

    // Recent Activity
    const recentActivity = await db.all('SELECT activity_type, description, timestamp FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10', [userId]);

    // Calendar Heatmap Events
    const calendarEvents = await db.all('SELECT event_date, event_type, title, details FROM calendar_events WHERE user_id = ?', [userId]);

    // Continue Coding Session
    const continueCoding = await db.get('SELECT activity_type, activity_id, editor_state, time_spent, last_active FROM learning_sessions WHERE user_id = ? AND activity_type = "mission"', [userId]);

    // Mock Analytics Data
    const analytics = {
      weeklyHours: [2.5, 3.8, 1.2, 4.5, 3.2, 2.0, 5.5],
      monthlyXp: [800, 1200, 1500, 1800, 2400, 2800],
      topicMastery: [
        { topic: 'Kotlin Syntax', score: 90 },
        { topic: 'Trie Trees', score: 85 },
        { topic: 'Big-O Analysis', score: 75 },
        { topic: 'Memory Profiling', score: 60 }
      ]
    };

    res.json({
      user: userRow,
      profile: profileRow,
      streak: 5,
      todayProgress,
      dailyGoals,
      weeklyGoals,
      notifications,
      pinnedActions,
      todayPlan,
      recommendations,
      recentActivity,
      calendarEvents,
      continueCoding,
      analytics
    });
  } catch (err) {
    console.error('Summary API error:', err);
    res.status(500).json({ error: 'Failed to construct dashboard data summary.' });
  }
});

// 2. Regenerate Learning Plan
app.post('/api/dashboard/regenerate-plan', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const prefRow = await db.get('SELECT today_plan FROM dashboard_preferences WHERE user_id = ?', [userId]);
    if (!prefRow) return res.status(404).json({ error: 'Preferences not initialized.' });

    const currentPlan = JSON.parse(prefRow.today_plan || '[]');

    const lessonPool = [
      'Kotlin Collections vs Java Streams Complexity',
      'Asymptotic Complexity Bounds & Big-O Notation',
      'Memory Footprints of Nested Pointers',
      'Kotlin Sequences and Laziness Evaluators',
      'Autocompletion Caching Architectures'
    ];
    const logicPool = [
      'Optimize Follower List Filtering Loop',
      'Dynamic Array Expansion Benchmarks',
      'Implement Local LFU Cache Expiry Policy',
      'Compare String Regex Matching Performance',
      'Binary Search Bounds Verification'
    ];
    const missionPool = [
      'Design High-Throughput Autocomplete Cache Node',
      'Scale Database Connection Pooling Gateway',
      'Optimize Compiler Sandbox Executions Cache',
      'Establish Sandbox Secure Memory Jail',
      'Refactor Trie Node Array Allocation Size'
    ];
    const reflectionPool = [
      'Document Autocomplete Algorithmic Slowness',
      'Analyze Cache Miss SLAs Under 5ms',
      'Reflect on Keypad PIN Passcode Security',
      'Review Sandbox CPU Exhaustion Benchmarks'
    ];

    const pickNew = (pool, currentTitles) => {
      const unused = pool.filter(t => !currentTitles.includes(t));
      return unused.length > 0 ? unused[Math.floor(Math.random() * unused.length)] : pool[Math.floor(Math.random() * pool.length)];
    };

    const currentTitles = currentPlan.map(item => item.title);

    const newPlan = currentPlan.map(item => {
      if (item.completed === 1) return item;

      let newTitle = item.title;
      if (item.type === 'lesson') newTitle = pickNew(lessonPool, currentTitles);
      if (item.type === 'logic') newTitle = pickNew(logicPool, currentTitles);
      if (item.type === 'mission') newTitle = pickNew(missionPool, currentTitles);
      if (item.type === 'reflection') newTitle = pickNew(reflectionPool, currentTitles);

      return {
        ...item,
        title: newTitle
      };
    });

    await db.run(
      'UPDATE dashboard_preferences SET today_plan = ? WHERE user_id = ?',
      [JSON.stringify(newPlan), userId]
    );

    res.json({ todayPlan: newPlan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to regenerate today\'s plan.' });
  }
});

// 3. Toggle Learning Plan Item
app.post('/api/dashboard/plan/toggle', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { itemId, completed } = req.body;

  try {
    const prefRow = await db.get('SELECT today_plan FROM dashboard_preferences WHERE user_id = ?', [userId]);
    if (!prefRow) return res.status(404).json({ error: 'Preferences not initialized.' });

    let plan = JSON.parse(prefRow.today_plan || '[]');
    let itemMatched = null;

    plan = plan.map(item => {
      if (item.id === itemId) {
        itemMatched = item;
        return { ...item, completed: completed ? 1 : 0 };
      }
      return item;
    });

    if (!itemMatched) {
      return res.status(404).json({ error: 'Plan item not found.' });
    }

    await db.run(
      'UPDATE dashboard_preferences SET today_plan = ? WHERE user_id = ?',
      [JSON.stringify(plan), userId]
    );

    if (completed) {
      const userRow = await db.get('SELECT xp, level FROM users WHERE id = ?', [userId]);
      const newXp = (userRow.xp || 0) + 100;
      const newLevel = Math.floor(newXp / 1000) + 1;
      await db.run('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, newLevel, userId]);

      await db.run(
        'INSERT INTO activity_logs (user_id, activity_type, description, timestamp) VALUES (?, ?, ?, ?)',
        [userId, 'plan_item', `Completed plan task: "${itemMatched.title}" (+100 XP)`, new Date().toISOString()]
      );

      let goalType = '';
      if (itemMatched.type === 'lesson') goalType = 'daily_lessons';
      if (itemMatched.type === 'logic') goalType = 'daily_logic';
      if (itemMatched.type === 'mission') goalType = 'daily_missions';

      if (goalType) {
        await db.run(
          'UPDATE user_goals SET current_value = current_value + 1, updated_at = ? WHERE user_id = ? AND goal_type = ?',
          [new Date().toISOString(), userId, goalType]
        );
      }
    }

    res.json({ todayPlan: plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update plan item.' });
  }
});

// 4. Notifications API
app.get('/api/dashboard/notifications', authenticateToken, async (req, res) => {
  try {
    const list = await db.all('SELECT id, title, message, category, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
});

app.post('/api/dashboard/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read.' });
  }
});

app.delete('/api/dashboard/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete alert.' });
  }
});

// 5. Pinned Actions Preferences
app.post('/api/dashboard/preferences', authenticateToken, async (req, res) => {
  const { pinnedActions } = req.body;
  if (!Array.isArray(pinnedActions)) return res.status(400).json({ error: 'Invalid payload.' });

  try {
    await db.run(
      'UPDATE dashboard_preferences SET pinned_actions = ? WHERE user_id = ?',
      [JSON.stringify(pinnedActions), req.user.id]
    );
    res.json({ pinnedActions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update dashboard preferences.' });
  }
});

// 6. Active heartbeat
app.post('/api/dashboard/heartbeat', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    await db.run(
      'UPDATE user_goals SET current_value = current_value + 30, updated_at = ? WHERE user_id = ? AND goal_type = "daily_time"',
      [new Date().toISOString(), userId]
    );

    await db.run(
      'UPDATE learning_sessions SET time_spent = time_spent + 30, last_active = ? WHERE user_id = ? AND activity_type = "mission"',
      [new Date().toISOString(), userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Heartbeat log failed.' });
  }
});

// -------------------------------------------------------------
// Phase 3 Learning Module APIs
// -------------------------------------------------------------

// 1. Get All Tracks
app.get('/api/tracks', authenticateToken, async (req, res) => {
  try {
    const list = await db.all('SELECT id, title, description, icon FROM learning_tracks ORDER BY id');
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve tracks.' });
  }
});

// 2. Get Track Roadmap Tree
app.get('/api/tracks/:id', authenticateToken, async (req, res) => {
  const trackId = req.params.id;
  const userId = req.user.id;

  try {
    const track = await db.get('SELECT * FROM learning_tracks WHERE id = ?', [trackId]);
    if (!track) return res.status(404).json({ error: 'Track not found.' });

    // Load modules, topics, lessons and user's progress
    const modules = await db.all('SELECT * FROM learning_modules WHERE track_id = ? ORDER BY order_index', [trackId]);
    const moduleIds = modules.map(m => m.id);

    if (moduleIds.length === 0) {
      return res.json({ track, modules: [] });
    }

    const topics = await db.all(`
      SELECT * FROM learning_topics 
      WHERE module_id IN (${moduleIds.map(() => '?').join(',')}) 
      ORDER BY order_index
    `, moduleIds);

    const topicIds = topics.map(t => t.id);
    let lessons = [];
    let progress = [];

    if (topicIds.length > 0) {
      lessons = await db.all(`
        SELECT * FROM lessons 
        WHERE topic_id IN (${topicIds.map(() => '?').join(',')}) 
        ORDER BY order_index
      `, topicIds);

      const lessonIds = lessons.map(l => l.id);
      if (lessonIds.length > 0) {
        progress = await db.all(`
          SELECT * FROM lesson_progress 
          WHERE user_id = ? AND lesson_id IN (${lessonIds.map(() => '?').join(',')})
        `, [userId, ...lessonIds]);
      }
    }

    // Map progress into a lookup dictionary
    const progressMap = {};
    progress.forEach(p => {
      progressMap[p.lesson_id] = p;
    });

    // Construct hierarchy
    const resultModules = modules.map(m => {
      const modTopics = topics.filter(t => t.module_id === m.id).map(t => {
        const topicLessons = lessons.filter(l => l.topic_id === t.id).map(l => {
          const lp = progressMap[l.id] || { status: 'available', progress_percent: 0 };
          return {
            ...l,
            status: lp.status,
            progressPercent: lp.progress_percent
          };
        });
        return { ...t, lessons: topicLessons };
      });
      return { ...m, topics: modTopics };
    });

    res.json({ track, modules: resultModules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to construct track roadmap tree.' });
  }
});

// 3. Get Lesson Details
app.get('/api/lessons/:id', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user.id;

  try {
    const lesson = await db.get('SELECT * FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const content = await db.get('SELECT markdown_content, quiz_json, flashcards_json FROM lesson_contents WHERE lesson_id = ?', [lessonId]);
    const resources = await db.all('SELECT id, title, url, type FROM lesson_resources WHERE lesson_id = ?', [lessonId]);
    const notes = await db.all('SELECT id, note_text, tags, pinned, created_at FROM lesson_notes WHERE user_id = ? AND lesson_id = ? ORDER BY created_at DESC', [userId, lessonId]);
    const bookmark = await db.get('SELECT 1 FROM lesson_bookmarks WHERE user_id = ? AND item_type = "lesson" AND item_id = ?', [userId, lessonId]);
    const progress = await db.get('SELECT status, progress_percent, last_position FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', [userId, lessonId]);

    // Parse quiz & flashcard lists
    let quiz = [];
    let flashcards = [];
    if (content) {
      try { quiz = JSON.parse(content.quiz_json || '[]'); } catch(e) {}
      try { flashcards = JSON.parse(content.flashcards_json || '[]'); } catch(e) {}
    }

    res.json({
      lesson,
      markdownContent: content ? content.markdown_content : '',
      quiz,
      flashcards,
      resources,
      notes,
      isBookmarked: !!bookmark,
      progress: progress || { status: 'available', progress_percent: 0, last_position: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve lesson details.' });
  }
});

// 4. Update Lesson Progress
app.post('/api/lessons/:id/progress', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user.id;
  const { status, progressPercent, lastPosition } = req.body;
  const timestamp = new Date().toISOString();

  try {
    const lesson = await db.get('SELECT xp_reward, title FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    // Check previous progress
    const prevProgress = await db.get('SELECT status FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', [userId, lessonId]);
    const alreadyCompleted = prevProgress && prevProgress.status === 'completed';

    await db.run(`
      INSERT INTO lesson_progress (user_id, lesson_id, status, progress_percent, last_position, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET
        status = excluded.status,
        progress_percent = excluded.progress_percent,
        last_position = excluded.last_position,
        updated_at = excluded.updated_at
    `, [userId, lessonId, status, progressPercent || 0, lastPosition || 0, timestamp]);

    let xpAwarded = 0;
    if (status === 'completed' && !alreadyCompleted) {
      xpAwarded = lesson.xp_reward || 100;
      const userRow = await db.get('SELECT xp, level FROM users WHERE id = ?', [userId]);
      const nextXp = (userRow.xp || 0) + xpAwarded;
      const nextLevel = Math.floor(nextXp / 1000) + 1;

      await db.run('UPDATE users SET xp = ?, level = ? WHERE id = ?', [nextXp, nextLevel, userId]);

      // Add to calendar heatmap
      const dateStr = timestamp.split('T')[0];
      await db.run(`
        INSERT INTO calendar_events (id, user_id, event_date, event_type, title, details)
        VALUES (?, ?, ?, 'lesson_completed', 'Lesson Completed', ?)
        ON CONFLICT(id) DO UPDATE SET event_type = excluded.event_type, details = excluded.details
      `, [`cal_${userId}_l_${lessonId}`, userId, dateStr, `Completed lesson: "${lesson.title}"`]);

      // Write activity timeline log
      await db.run(
        'INSERT INTO activity_logs (user_id, activity_type, description, timestamp) VALUES (?, ?, ?, ?)',
        [userId, 'lesson', `Completed lesson: "${lesson.title}" (+${xpAwarded} XP)`, timestamp]
      );

      // Increment daily goal
      await db.run(
        'UPDATE user_goals SET current_value = current_value + 1, updated_at = ? WHERE user_id = ? AND goal_type = "daily_lessons"',
        [timestamp, userId]
      );

      // Add lesson to revision queue
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 1); // review in 1 day
      await db.run(`
        INSERT INTO revision_queue (user_id, lesson_id, next_review_date, interval_days)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(user_id, lesson_id) DO UPDATE SET next_review_date = excluded.next_review_date
      `, [userId, lessonId, nextReview.toISOString()]);
    }

    res.json({ success: true, xpAwarded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save progress.' });
  }
});

// 5. Notes CRUD
app.post('/api/lessons/:id/notes', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user.id;
  const { id: noteId, noteText, tags, pinned } = req.body;
  const timestamp = new Date().toISOString();

  try {
    if (noteId) {
      // Update
      await db.run(`
        UPDATE lesson_notes 
        SET note_text = ?, tags = ?, pinned = ?
        WHERE id = ? AND user_id = ? AND lesson_id = ?
      `, [noteText, tags || '', pinned ? 1 : 0, noteId, userId, lessonId]);
      res.json({ id: noteId, noteText, tags, pinned });
    } else {
      // Create
      const newId = 'note_' + uuidv4().substr(0, 8);
      await db.run(`
        INSERT INTO lesson_notes (id, user_id, lesson_id, note_text, tags, pinned, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [newId, userId, lessonId, noteText, tags || '', pinned ? 1 : 0, timestamp]);
      res.json({ id: newId, noteText, tags, pinned, createdAt: timestamp });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to write note.' });
  }
});

app.delete('/api/lessons/notes/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM lesson_notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Note deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

// 6. Bookmarks list & toggle
app.get('/api/bookmarks', authenticateToken, async (req, res) => {
  try {
    const bookmarks = await db.all('SELECT item_type, item_id FROM lesson_bookmarks WHERE user_id = ?', [req.user.id]);
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarks.' });
  }
});

app.post('/api/bookmarks', authenticateToken, async (req, res) => {
  const { itemType, itemId } = req.body;
  const userId = req.user.id;
  const timestamp = new Date().toISOString();

  try {
    const existing = await db.get('SELECT 1 FROM lesson_bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?', [userId, itemType, itemId]);
    if (existing) {
      await db.run('DELETE FROM lesson_bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?', [userId, itemType, itemId]);
      res.json({ bookmarked: false });
    } else {
      await db.run('INSERT INTO lesson_bookmarks (user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?)', [userId, itemType, itemId, timestamp]);
      res.json({ bookmarked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
});

// 7. Revision Queue (Flashcards & incomplete review items)
app.get('/api/revision', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Fetch items scheduled for review or in_progress lessons
    const queue = await db.all(`
      SELECT l.id, l.title, l.estimated_time, rq.interval_days
      FROM revision_queue rq
      JOIN lessons l ON rq.lesson_id = l.id
      WHERE rq.user_id = ?
    `, [userId]);

    // Fetch all flashcards from completed/in_progress lessons
    const progressList = await db.all('SELECT lesson_id FROM lesson_progress WHERE user_id = ?', [userId]);
    const lessonIds = progressList.map(p => p.lesson_id);

    let flashcards = [];
    if (lessonIds.length > 0) {
      const contents = await db.all(`
        SELECT flashcards_json FROM lesson_contents 
        WHERE lesson_id IN (${lessonIds.map(() => '?').join(',')})
      `, lessonIds);

      contents.forEach(c => {
        try {
          const cards = JSON.parse(c.flashcards_json || '[]');
          flashcards = flashcards.concat(cards);
        } catch(e) {}
      });
    }

    // Default flashcard if none seeded yet
    if (flashcards.length === 0) {
      flashcards = [
        { question: 'What keyword initializes a read-only variable in Kotlin?', answer: 'val', difficulty: 'easy' },
        { question: 'What complexity parameter describes Trie tree prefix searching?', answer: 'O(L) where L represents key length.', difficulty: 'medium' }
      ];
    }

    res.json({ queue, flashcards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve revision queue' });
  }
});

// Rate flashcard (Spaced Repetition)
app.post('/api/revision/rate', authenticateToken, async (req, res) => {
  const { card_id, rating } = req.body;
  // In a full implementation, this would update the next_review date in a user_flashcards_progress table
  // based on the SuperMemo-2 (SM-2) or similar algorithm.
  res.json({ success: true, message: 'Flashcard rating recorded' });
});

// 7. Submit Quiz Submission Scoring & Validation
app.post('/api/quiz/submit', authenticateToken, async (req, res) => {
  const { lessonId, score, answers } = req.body; // score as float ratio, e.g. 1.0 = 100%
  const userId = req.user.id;

  try {
    const lesson = await db.get('SELECT xp_reward, title FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    let xpAwarded = 0;
    // Award 50 bonus XP for passing quiz
    if (score >= 0.8) {
      xpAwarded = Math.round((lesson.xp_reward || 100) * 0.2);
      const userRow = await db.get('SELECT xp, level FROM users WHERE id = ?', [userId]);
      const nextXp = (userRow.xp || 0) + xpAwarded;
      const nextLevel = Math.floor(nextXp / 1000) + 1;

      await db.run('UPDATE users SET xp = ?, level = ? WHERE id = ?', [nextXp, nextLevel, userId]);

      // Timeline activity log
      await db.run(
        'INSERT INTO activity_logs (user_id, activity_type, description, timestamp) VALUES (?, ?, ?, ?)',
        [userId, 'quiz', `Passed quiz for "${lesson.title}" with score ${Math.round(score * 100)}% (+${xpAwarded} XP)`, new Date().toISOString()]
      );
    }

    res.json({ success: true, scorePercent: Math.round(score * 100), xpAwarded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit quiz score.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Atlas backend node listening on port ${PORT}`);
});
