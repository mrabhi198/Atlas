// Database schema definition — all 28 tables.
// Extracted verbatim from the original monolithic db.js to preserve behavior.

export async function createSchema(db) {
  // Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'Student',
      is_email_verified INTEGER DEFAULT 0,
      passcode TEXT,
      xp INTEGER DEFAULT 200,
      level INTEGER DEFAULT 1,
      code_quality INTEGER DEFAULT 52,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  // Profiles Table
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

  // Sessions Table
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

  // OAuth Accounts Table
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

  // Email Verifications Table
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

  // Password Resets Table
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

  // Refresh Tokens Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      expires_at TEXT NOT NULL,
      revoked INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Mission Attempts Table — real submission history. Each RUN writes one row;
  // no XP/level/metrics are fabricated from this (latency/memory may stay NULL
  // until a real sandbox executes the code).
  await db.exec(`
    CREATE TABLE IF NOT EXISTS mission_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      status TEXT NOT NULL,
      source_code TEXT,
      latency REAL,
      memory REAL,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Quiz Results Table — server-scored submissions with one-time XP awarded
  // only on the first passing score per user+lesson.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      score_percent INTEGER NOT NULL,
      passed INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      answers_json TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  // Flashcard Progress Table — SM-2-lite spaced repetition schedule.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS flashcard_progress (
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      reps INTEGER DEFAULT 0,
      interval_days INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      last_reviewed_at TEXT,
      next_review_at TEXT,
      PRIMARY KEY(user_id, card_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Audit Logs Table
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

  // Missions Table (Preserved from existing code)
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

  // Chat Messages Table (Preserved from existing code)
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

  // Student Dashboard tables

  // 1. Learning Sessions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      editor_state TEXT,
      time_spent INTEGER DEFAULT 0,
      last_active TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 2. User Goals
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goal_type TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      current_value INTEGER DEFAULT 0,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, goal_type)
    )
  `);

  // 3. Notifications
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 4. Calendar Events
  await db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 5. Activity Logs (timeline)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 6. Learning Recommendations
  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_recommendations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      estimated_time TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 7. Dashboard Preferences (Pinned shortcuts)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_preferences (
      user_id TEXT PRIMARY KEY,
      pinned_actions TEXT NOT NULL,
      today_plan TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Security Tags (Dynamic Roles)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS security_tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT
    )
  `);

  // Learning Module tables

  // 1. Learning Tracks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_tracks (
      id TEXT PRIMARY KEY,
      title TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      created_at TEXT
    )
  `);

  // 2. Learning Modules
  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_modules (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER,
      FOREIGN KEY(track_id) REFERENCES learning_tracks(id) ON DELETE CASCADE
    )
  `);

  // 3. Learning Topics
  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_topics (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER,
      FOREIGN KEY(module_id) REFERENCES learning_modules(id) ON DELETE CASCADE
    )
  `);

  // 4. Lessons
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER,
      estimated_time TEXT,
      xp_reward INTEGER,
      prerequisites TEXT,
      FOREIGN KEY(topic_id) REFERENCES learning_topics(id) ON DELETE CASCADE
    )
  `);

  // 5. Lesson Contents
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_contents (
      lesson_id TEXT PRIMARY KEY,
      markdown_content TEXT NOT NULL,
      quiz_json TEXT,
      flashcards_json TEXT,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  // 6. Lesson Resources
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_resources (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  // 7. Lesson Progress
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      progress_percent INTEGER DEFAULT 0,
      last_position INTEGER DEFAULT 0,
      updated_at TEXT,
      PRIMARY KEY(user_id, lesson_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  // 8. Student Notes
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      note_text TEXT NOT NULL,
      tags TEXT,
      pinned INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  // 9. Bookmarks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_bookmarks (
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT,
      PRIMARY KEY(user_id, item_type, item_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 10. Revision Queue
  await db.exec(`
    CREATE TABLE IF NOT EXISTS revision_queue (
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      next_review_date TEXT NOT NULL,
      interval_days INTEGER DEFAULT 1,
      PRIMARY KEY(user_id, lesson_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  // Query-path indexes for the hot read endpoints (dashboard timeline, calendar,
  // lesson progress, sessions, refresh tokens). Placed last so every referenced
  // table already exists.
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time ON activity_logs(user_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON notifications(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id, event_date);
    CREATE INDEX IF NOT EXISTS idx_progress_user_status ON lesson_progress(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id, session_id);
    CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_last ON learning_sessions(user_id, last_active);
    CREATE INDEX IF NOT EXISTS idx_mission_attempts_user ON mission_attempts(user_id, created_at);
  `);
}