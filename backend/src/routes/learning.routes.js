import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 1. Get All Tracks
router.get('/tracks', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const list = await db.all('SELECT id, title, description, icon FROM learning_tracks ORDER BY id');
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve tracks.' });
  }
});

// 2. Get Track Roadmap Tree
router.get('/tracks/:id', authenticateToken, async (req, res) => {
  const trackId = req.params.id;
  const userId = req.user.id;

  try {
    const db = getDb();
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
router.get('/lessons/:id', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user.id;

  try {
    const db = getDb();
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
router.post('/lessons/:id/progress', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user.id;
  const { status, progressPercent, lastPosition } = req.body;
  const timestamp = new Date().toISOString();

  try {
    const db = getDb();
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
router.post('/lessons/:id/notes', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user.id;
  const { id: noteId, noteText, tags, pinned } = req.body;
  const timestamp = new Date().toISOString();

  try {
    const db = getDb();
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

router.delete('/lessons/notes/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.run('DELETE FROM lesson_notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Note deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

// 6. Bookmarks list & toggle
router.get('/bookmarks', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const bookmarks = await db.all('SELECT item_type, item_id FROM lesson_bookmarks WHERE user_id = ?', [req.user.id]);
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarks.' });
  }
});

router.post('/bookmarks', authenticateToken, async (req, res) => {
  const { itemType, itemId } = req.body;
  const userId = req.user.id;
  const timestamp = new Date().toISOString();

  try {
    const db = getDb();
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
router.get('/revision', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const db = getDb();
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
router.post('/revision/rate', authenticateToken, async (req, res) => {
  const { card_id, rating } = req.body;
  // In a full implementation, this would update the next_review date in a user_flashcards_progress table
  // based on the SuperMemo-2 (SM-2) or similar algorithm.
  res.json({ success: true, message: 'Flashcard rating recorded' });
});

// 8. Submit Quiz Submission Scoring & Validation
router.post('/quiz/submit', authenticateToken, async (req, res) => {
  const { lessonId, score, answers } = req.body; // score as float ratio, e.g. 1.0 = 100%
  const userId = req.user.id;

  try {
    const db = getDb();
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

export default router;