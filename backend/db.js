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
      xp INTEGER DEFAULT 200,
      level INTEGER DEFAULT 1,
      code_quality INTEGER DEFAULT 52,
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

  // -------------------------------------------------------------
  // Student Dashboard tables
  // -------------------------------------------------------------

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

  // -------------------------------------------------------------
  // Security Tags (Dynamic Roles)
  // -------------------------------------------------------------
  await db.exec(`
    CREATE TABLE IF NOT EXISTS security_tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT
    )
  `);

  // -------------------------------------------------------------
  // NEW Phase 3 Learning Module tables
  // -------------------------------------------------------------

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

  // Seed default admin users if empty
  const count = await db.get('SELECT COUNT(*) as count FROM users');
  if (count.count === 0) {
    const seedUsers = [
      { id: 'usr_1', email: 'abhi@atlas.dev', username: 'abhi', password: 'StudentPass2400!', role: 'jr architect', passcode: '2400', name: 'Abhi', track: 'Backend Architect', xp: 2800, level: 3, code_quality: 94 },
      { id: 'usr_2', email: 'sarah@atlas.dev', username: 'sarah', password: 'MentorPass5200!', role: 'mentor', passcode: '5200', name: 'Sarah', track: 'Frontend Engineer', xp: 5200, level: 6, code_quality: 98 },
      { id: 'usr_3', email: 'vikram@atlas.dev', username: 'vikram', password: 'GuiderPass3200!', role: 'guider', passcode: '3200', name: 'Vikram', track: 'Android Developer', xp: 1200, level: 2, code_quality: 85 },
      { id: 'usr_4', email: 'elena@atlas.dev', username: 'elena', password: 'AdminPass6400!', role: 'admin', passcode: '6400', name: 'Elena', track: 'AI/ML Engineer', xp: 9500, level: 10, code_quality: 99 },
      { id: 'usr_5', email: 'alex@atlas.dev', username: 'alex', password: 'SuperAdmin8200!', role: 'super admin', passcode: '8200', name: 'Alex', track: 'DevOps Specialist', xp: 15400, level: 16, code_quality: 99 }
    ];

    const timestamp = new Date().toISOString();

    for (const u of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.password, salt);

      // Insert User
      await db.run(
        'INSERT INTO users (id, email, username, password_hash, role, is_email_verified, passcode, xp, level, code_quality, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)',
        [u.id, u.email, u.username, hash, u.role, u.passcode, u.xp, u.level, u.code_quality, timestamp, timestamp]
      );

      // Insert Profile
      await db.run(
        'INSERT INTO profiles (id, user_id, full_name, avatar, country, timezone, language, experience, career_goal, learning_track, preferred_time, tech_stack, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['prof_' + u.id, u.id, u.name, '🤖', 'India', 'GMT+5:30', 'English', 'mid', 'Core Platform Engineer', u.track, '1 hour', 'Kotlin, Spring Boot, SQLite', timestamp, timestamp]
      );

      // Seed Default Dashboard Preferences
      const defaultPlan = [
        { id: 'item_1', type: 'lesson', title: 'Character Trie Structs & Memory Layout', duration: '15m', completed: 0 },
        { id: 'item_2', type: 'logic', title: 'String Prefix Parsing Benchmark', duration: '10m', completed: 0 },
        { id: 'item_3', type: 'mission', title: 'Scale Instagram Followers Search', duration: '35m', completed: 0 },
        { id: 'item_4', type: 'reflection', title: 'Write Code-Quality Review Log', duration: '10m', completed: 0 }
      ];
      await db.run(
        'INSERT INTO dashboard_preferences (user_id, pinned_actions, today_plan) VALUES (?, ?, ?)',
        [u.id, JSON.stringify(['ide', 'passport', 'settings']), JSON.stringify(defaultPlan)]
      );

      // Seed Default Goals
      const goals = [
        { type: 'daily_lessons', target: 1, current: 0 },
        { type: 'daily_missions', target: 1, current: 0 },
        { type: 'daily_logic', target: 1, current: 0 },
        { type: 'daily_time', target: 3600, current: 1200 },
        { type: 'weekly_lessons', target: 5, current: 3 },
        { type: 'weekly_missions', target: 3, current: 1 },
        { type: 'weekly_logic', target: 20, current: 8 },
        { type: 'weekly_xp', target: 2000, current: 800 }
      ];
      for (const g of goals) {
        await db.run(
          'INSERT INTO user_goals (id, user_id, goal_type, target_value, current_value, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [`goal_${u.id}_${g.type}`, u.id, g.type, g.target, g.current, timestamp]
        );
      }

      // Seed Default Notifications
      const notifs = [
        { id: `notif_${u.id}_1`, title: 'Welcome to Atlas Core', msg: 'Your developer signature has been mapped to our cognitive learning network.', cat: 'system' },
        { id: `notif_${u.id}_2`, title: 'High-Efficiency Target Achieved', msg: 'Your Kotlin search benchmarks scored under 2ms. +800 XP.', cat: 'achievement' },
        { id: `notif_${u.id}_3`, title: 'AI Recommendation Queue', msg: 'Cognitive Guide has recommended studying Trie prefix tree indexing.', cat: 'mentor' }
      ];
      for (const n of notifs) {
        await db.run(
          'INSERT INTO notifications (id, user_id, title, message, category, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
          [n.id, u.id, n.title, n.msg, n.cat, timestamp]
        );
      }

      // Seed Default Learning Recommendations
      const recs = [
        { id: `rec_${u.id}_1`, type: 'lesson', title: 'Character Trie Structs & Memory Layout', time: '15m', diff: 'Intermediate' },
        { id: `rec_${u.id}_2`, type: 'mission', title: 'Design High-Throughput Autocomplete Cache', time: '45m', diff: 'Advanced' },
        { id: `rec_${u.id}_3`, type: 'logic', title: 'String Prefix Parsing Benchmark', time: '10m', diff: 'Easy' }
      ];
      for (const r of recs) {
        await db.run(
          'INSERT OR REPLACE INTO learning_recommendations (id, user_id, type, title, estimated_time, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
          [r.id, u.id, r.type, r.title, r.time, r.diff]
        );
      }

      // Seed Learning Session placeholder (Continue Coding)
      await db.run(
        'INSERT INTO learning_sessions (id, user_id, activity_type, activity_id, editor_state, time_spent, last_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`sess_act_${u.id}`, u.id, 'mission', 'instagram_search', JSON.stringify({ code: '', selectedFile: 'FollowerSearch.kt' }), 1200, timestamp]
      );

      // Seed Heatmap Calendar events
      const dates = [0, 1, 2, 4, 5, 8, 12, 13, 14, 15];
      for (const offset of dates) {
        const d = new Date();
        d.setDate(d.getDate() - offset);
        const dateStr = d.toISOString().split('T')[0];
        await db.run(
          'INSERT OR REPLACE INTO calendar_events (id, user_id, event_date, event_type, title, details) VALUES (?, ?, ?, ?, ?, ?)',
          [`cal_${u.id}_${offset}`, u.id, dateStr, 'session', 'Active Code Study', `Completed log sequence. Active duration: 25 minutes.`]
        );
      }

      // Seed Activity Logs
      const activities = [
        { type: 'onboard', desc: 'Registered Developer Profile on System Registry' },
        { type: 'chat', desc: 'Consulted AI Mentor regarding Trie prefix indexing structures' },
        { type: 'ide_fail', desc: 'Executed follower search benchmark. O(N) constraint failed' },
        { type: 'ide_pass', desc: 'Optimized search loop via prefix Trie indexing. Latency verified at 1.4ms' }
      ];
      for (let i = 0; i < activities.length; i++) {
        const act = activities[i];
        const logDate = new Date();
        logDate.setMinutes(logDate.getMinutes() - (i + 1) * 30);
        await db.run(
          'INSERT INTO activity_logs (user_id, activity_type, description, timestamp) VALUES (?, ?, ?, ?)',
          [u.id, act.type, act.desc, logDate.toISOString()]
        );
      }
    }

    // -------------------------------------------------------------
    // SEED LEARNING MODULE CONTENT
    // -------------------------------------------------------------
    const tracksSeed = [
      { id: 'android', title: 'Android Development', desc: 'Master reactive UI development and MVVM architecture blueprints.', icon: '📱' },
      { id: 'backend', title: 'Backend Development', desc: 'Design microservices, high-throughput caching, and structured indices.', icon: '⚙️' },
      { id: 'web', title: 'Frontend Development', desc: 'Build highly interactive user views utilizing modular systems.', icon: '🎨' },
      { id: 'devops', title: 'DevOps & SRE', desc: 'Configure cloud clustering networks and CI/CD compiler stages.', icon: '🚀' },
      { id: 'aiml', title: 'Artificial Intelligence', desc: 'Train logic models and implement on-device cognitive engines.', icon: '🤖' },
      { id: 'dsa', title: 'Data Structures & Algorithms', desc: 'Audit memory layouts and design low-latency algorithms.', icon: '📊' }
    ];

    for (const t of tracksSeed) {
      await db.run(
        'INSERT OR REPLACE INTO learning_tracks (id, title, description, icon, created_at) VALUES (?, ?, ?, ?, ?)',
        [t.id, t.title, t.desc, t.icon, timestamp]
      );
    }

    // Seed Modules
    const modulesSeed = [
      { id: 'mod_and_1', track_id: 'android', title: 'Jetpack Compose Basics', order: 1 },
      { id: 'mod_back_1', track_id: 'backend', title: 'Scalable Caching & Indexes', order: 1 }
    ];
    for (const m of modulesSeed) {
      await db.run(
        'INSERT OR REPLACE INTO learning_modules (id, track_id, title, order_index) VALUES (?, ?, ?, ?)',
        [m.id, m.track_id, m.title, m.order]
      );
    }

    // Seed Topics
    const topicsSeed = [
      { id: 'top_and_1', module_id: 'mod_and_1', title: 'Layout Containers', order: 1 },
      { id: 'top_back_1', module_id: 'mod_back_1', title: 'Prefix Tree Indexing', order: 1 }
    ];
    for (const tp of topicsSeed) {
      await db.run(
        'INSERT OR REPLACE INTO learning_topics (id, module_id, title, order_index) VALUES (?, ?, ?, ?)',
        [tp.id, tp.module_id, tp.title, tp.order]
      );
    }

    // Seed Lessons
    const lessonsSeed = [
      {
        id: 'less_and_1',
        topic_id: 'top_and_1',
        title: 'Understanding Row & Column composables',
        order: 1,
        time: '10m',
        xp: 200,
        prereqs: ''
      },
      {
        id: 'less_back_1',
        topic_id: 'top_back_1',
        title: 'Kotlin Variables & Null Safety Guidelines',
        order: 1,
        time: '12m',
        xp: 250,
        prereqs: ''
      },
      {
        id: 'less_back_2',
        topic_id: 'top_back_1',
        title: 'Prefix Trie Tree Index Memory Layout',
        order: 2,
        time: '15m',
        xp: 300,
        prereqs: 'less_back_1'
      }
    ];

    for (const ls of lessonsSeed) {
      await db.run(
        'INSERT OR REPLACE INTO lessons (id, topic_id, title, order_index, estimated_time, xp_reward, prerequisites) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ls.id, ls.topic_id, ls.title, ls.order, ls.estimated_time, ls.xp_reward, ls.prerequisites]
      );
    }

    // Seed Lesson Content Markdown and Quizzes
    const contentsSeed = [
      {
        lesson_id: 'less_and_1',
        markdown: `
# Row & Column Composables in Compose

Learn to arrange interface components in Jetpack Compose layout engines.

## 1. Rows
Row composables place children horizontally across the viewport:

\`\`\`kotlin
Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween
) {
    Text("Sidebar")
    Text("Editor Workspace")
}
\`\`\`

> [!NOTE]
> Row behaves similar to a flexbox container with horizontal orientation.
        `,
        quiz: JSON.stringify([
          {
            id: 'q1',
            type: 'mcq',
            question: 'Which composable arranges children horizontally?',
            options: ['Row', 'Column', 'Box', 'ConstraintLayout'],
            correctIndex: 0,
            explanation: 'Row arranges its items horizontally one after the other.'
          }
        ]),
        flashcards: JSON.stringify([
          { question: 'What composable lays out elements horizontally?', answer: 'Row', difficulty: 'easy' }
        ])
      },
      {
        lesson_id: 'less_back_1',
        markdown: `
# Kotlin Variables & Null Safety Guidelines

Master nullable types, type safety, and memory allocations in Kotlin codebases.

## 1. Variable Declarations
Kotlin provides two primary variable types:
- \`val\`: Read-only, immutable values (equivalent to final in Java).
- \`var\`: Mutable values.

\`\`\`kotlin
val callsign: String = "Neo" // Immutable
var latency: Double = 2.4     // Mutable
\`\`\`

## 2. Null Safety Engine
Kotlin prevents \`NullPointerException\` bugs by separating nullable from non-nullable types:

\`\`\`kotlin
var name: String = "Sarah" // Cannot be null
var bio: String? = null     // Nullable
\`\`\`

> [!WARNING]
> Accessing a nullable variable directly will trigger a compilation error. Use the safe-call operator \`?.\` instead!

### Elvis Operator fallback
\`\`\`kotlin
val length = bio?.length ?: 0 // returns 0 if bio is null
\`\`\`
        `,
        quiz: JSON.stringify([
          {
            id: 'q2',
            type: 'mcq',
            question: 'Which keyword declares an immutable variable?',
            options: ['var', 'val', 'const', 'let'],
            correctIndex: 1,
            explanation: 'val is used to define immutable values that cannot be reassigned.'
          },
          {
            id: 'q3',
            type: 'tf',
            question: 'The safe call operator ?. returns null if the object is null.',
            correctAnswer: 'true',
            explanation: 'Correct! Safe call avoids throwing a NullPointerException and evaluates directly to null.'
          }
        ]),
        flashcards: JSON.stringify([
          { question: 'Difference between val and var?', answer: 'val defines read-only variables; var defines mutable variables.', difficulty: 'easy' },
          { question: 'What does ?. do?', answer: 'It safe-calls a nullable variable without throwing a NullPointerException.', difficulty: 'easy' }
        ])
      },
      {
        lesson_id: 'less_back_2',
        markdown: `
# Prefix Trie Tree Index Memory Layout

Learn to optimize lookup searches from linear $O(N)$ scanning bounds down to character length bounds $O(L)$ using Tries.

## 1. Trie Nodes
A Trie (Prefix Tree) organizes string keys by char keys, where each character path routes to a node:

\`\`\`kotlin
class TrieNode {
    val children = mutableMapOf<Char, TrieNode>()
    var isWord = false
}
\`\`\`

### Complexity Comparison
| Algorithm | Search Time | Space Complexity |
| :--- | :--- | :--- |
| Linear Filter | $O(N)$ | $O(1)$ |
| Prefix Trie | $O(L)$ | $O(N \\times L)$ |

> [!IMPORTANT]
> Tries utilize more memory pointers to gain maximum lookup speeds, matching the 5ms SLA latency targets.
        `,
        quiz: JSON.stringify([
          {
            id: 'q4',
            type: 'mcq',
            question: 'What is the lookup search complexity of a Trie prefix tree?',
            options: ['O(N)', 'O(log N)', 'O(L) where L is key length', 'O(1)'],
            correctIndex: 2,
            explanation: 'Trie search complexity is proportional to the length of the string lookup key, O(L).'
          }
        ]),
        flashcards: JSON.stringify([
          { question: 'Trie tree lookup time complexity?', answer: 'O(L) where L is key string length.', difficulty: 'medium' }
        ])
      }
    ];

    for (const c of contentsSeed) {
      await db.run(
        'INSERT OR REPLACE INTO lesson_contents (lesson_id, markdown_content, quiz_json, flashcards_json) VALUES (?, ?, ?, ?)',
        [c.lesson_id, c.markdown, c.quiz, c.flashcards]
      );
    }

    // Seed Resources
    await db.run(
      'INSERT OR REPLACE INTO lesson_resources (id, lesson_id, title, url, type) VALUES (?, ?, ?, ?, ?)',
      ['res_1', 'less_back_1', 'Kotlin Null Safety Documentation', 'https://kotlinlang.org/docs/null-safety.html', 'documentation']
    );

    // Seed Default Progress for usr_1 (Abhi)
    await db.run(
      'INSERT OR REPLACE INTO lesson_progress (user_id, lesson_id, status, progress_percent, last_position, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['usr_1', 'less_back_1', 'completed', 100, 0, timestamp]
    );
    await db.run(
      'INSERT OR REPLACE INTO lesson_progress (user_id, lesson_id, status, progress_percent, last_position, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['usr_1', 'less_back_2', 'in_progress', 45, 120, timestamp]
    );

    // Seed Security Tags (Dynamic Roles)
    const tagCount = await db.get('SELECT COUNT(*) as count FROM security_tags');
    if (tagCount.count === 0) {
      const defaultTags = ['jr architect', 'admin', 'super admin', 'mentor', 'guider', 'Student'];
      for (const tag of defaultTags) {
        await db.run('INSERT INTO security_tags (id, name, created_at) VALUES (?, ?, ?)', [
          'tag_' + Date.now() + Math.random().toString(36).substr(2, 9),
          tag,
          timestamp
        ]);
      }
    }

    console.log('Database initialized. Pre-hashed admin user nodes and dashboard data seeded.');
  }

  return db;
}
