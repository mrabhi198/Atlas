import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { paths } from '../config/index.js';
import { createSchema } from './schema.js';
import { seedDatabase } from './seed.js';

// Singleton database connection. All backend modules obtain the same
// instance via getDb() after the server has initialized it.

let db = null;

export async function initDatabase() {
  // Ensure db directory exists
  if (!fs.existsSync(paths.dbDir)) {
    fs.mkdirSync(paths.dbDir, { recursive: true });
  }

  db = await open({
    filename: paths.dbFile,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // WAL improves read concurrency for the dashboard while the connection pool
  // remains single-connection.
  await db.run('PRAGMA journal_mode = WAL');

  // Older databases predate the session_id column on refresh_tokens. Add it
  // before createSchema runs, because the schema's index block references it.
  await ensureSessionIdColumn(db);

  // Create all tables
  await createSchema(db);

  // Seed demo data if the database is empty (before migrations so data-repair
  // migrations also normalize freshly seeded rows).
  await seedDatabase(db);

  // In-place data-repair migrations for pre-existing databases.
  await applyMigrations(db);

  console.log('SQLite Database connected and ready.');
  return db;
}

// Best-effort ALTER statements for pre-existing databases. Fresh databases get
// these columns from createSchema directly; older files need the column added.
// Each migration is individually guarded so a missing column does not abort boot.
async function ensureSessionIdColumn(db) {
  try {
    await db.run('ALTER TABLE refresh_tokens ADD COLUMN session_id TEXT');
  } catch (err) {
    // Column already present or the table does not exist yet (fresh schema).
  }
}

async function applyMigrations(db) {
  // Data repair (seeded lessons): the original seed INSERTed the demo lessons
  // without populating xp_reward/estimated_time/prerequisites, so those columns
  // are NULL in existing databases (fresh installs are seeded correctly now).
  // Only touch the three known demo rows, and only where the reward is still
  // NULL — never clobber user-authored edits.
  try {
    await db.run(`
      UPDATE lessons SET xp_reward = 200, estimated_time = '10m', prerequisites = ''
      WHERE id = 'less_and_1' AND xp_reward IS NULL
    `);
    await db.run(`
      UPDATE lessons SET xp_reward = 250, estimated_time = '12m', prerequisites = ''
      WHERE id = 'less_back_1' AND xp_reward IS NULL
    `);
    await db.run(`
      UPDATE lessons SET xp_reward = 300, estimated_time = '15m', prerequisites = 'less_back_1'
      WHERE id = 'less_back_2' AND xp_reward IS NULL
    `);
  } catch (err) {
    // Migration is best-effort; a missing lessons table would be handled earlier.
  }

  // Data repair: the seeded true/false quiz question shipped without options,
  // which crashed the frontend lesson renderer (q.options.map). Ensure every
  // tf question has explicit True/False options.
  try {
    const rows = await db.all('SELECT lesson_id, quiz_json FROM lesson_contents WHERE quiz_json IS NOT NULL');
    for (const row of rows) {
      let quiz = null;
      try { quiz = JSON.parse(row.quiz_json); } catch (e) { quiz = null; }
      if (!Array.isArray(quiz)) continue;

      let changed = false;
      for (const q of quiz) {
        if (q && q.type === 'tf' && !Array.isArray(q.options)) {
          q.options = ['True', 'False'];
          changed = true;
        }
      }
      if (changed) {
        await db.run('UPDATE lesson_contents SET quiz_json = ? WHERE lesson_id = ?', [JSON.stringify(quiz), row.lesson_id]);
      }
    }
  } catch (err) {
    console.error('Failed to normalize quiz tf options:', err);
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized. Call initDatabase() before accessing the database.');
  }
  return db;
}