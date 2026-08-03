import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure db directory exists
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'atlas.sqlite');

export async function initDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.get('PRAGMA foreign_keys = ON');

  // Create Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'Student',
      is_email_verified INTEGER DEFAULT 0,
      passcode TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  // Create Profiles Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar TEXT,
      country TEXT,
      timezone TEXT,
      language TEXT,
      experience TEXT,
      career_goal TEXT,
      learning_track TEXT,
      preferred_time TEXT,
      tech_stack TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Sessions Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      last_active TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create OAuth Accounts Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_user_id)
    )
  `);

  // Create Email Verifications Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Password Resets Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Refresh Tokens Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Audit Logs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      ip_address TEXT,
      timestamp TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create Missions Table (Preserved from existing code)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      status TEXT,
      completed_at TEXT,
      source_code TEXT,
      latency REAL,
      memory REAL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Chat Messages Table (Preserved from existing code)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      sender TEXT,
      text TEXT,
      timestamp TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed default admin users if empty
  const count = await db.get('SELECT COUNT(*) as count FROM users');
  if (count.count === 0) {
    const seedUsers = [
      { id: 'usr_1', email: 'abhi@atlas.dev', username: 'abhi', password: 'StudentPass2400!', role: 'jr architect', passcode: '2400', name: 'Abhi', track: 'Backend Architect' },
      { id: 'usr_2', email: 'sarah@atlas.dev', username: 'sarah', password: 'MentorPass5200!', role: 'mentor', passcode: '5200', name: 'Sarah', track: 'Frontend Engineer' },
      { id: 'usr_3', email: 'vikram@atlas.dev', username: 'vikram', password: 'GuiderPass3200!', role: 'guider', passcode: '3200', name: 'Vikram', track: 'Android Developer' },
      { id: 'usr_4', email: 'elena@atlas.dev', username: 'elena', password: 'AdminPass6400!', role: 'admin', passcode: '6400', name: 'Elena', track: 'AI/ML Engineer' },
      { id: 'usr_5', email: 'alex@atlas.dev', username: 'alex', password: 'SuperAdmin8200!', role: 'super admin', passcode: '8200', name: 'Alex', track: 'DevOps Specialist' }
    ];

    const timestamp = new Date().toISOString();

    for (const u of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.password, salt);

      // Insert User
      await db.run(
        'INSERT INTO users (id, email, username, password_hash, role, is_email_verified, passcode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)',
        [u.id, u.email, u.username, hash, u.role, u.passcode, timestamp, timestamp]
      );

      // Insert Profile
      await db.run(
        'INSERT INTO profiles (id, user_id, full_name, experience, career_goal, learning_track, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['prof_' + u.id, u.id, u.name, '5 years', 'Core Platform Engineer', u.track, timestamp, timestamp]
      );
    }
    console.log('Database schemas created. Pre-hashed admin user nodes seeded.');
  }

  return db;
}
