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

  // Create all tables
  await createSchema(db);

  // Seed demo data if the database is empty
  await seedDatabase(db);

  console.log('SQLite Database connected and ready.');
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized. Call initDatabase() before accessing the database.');
  }
  return db;
}