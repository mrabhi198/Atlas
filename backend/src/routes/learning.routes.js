import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { withTransaction } from '../db/transaction.js';
import { authenticateToken } from '../middleware/auth.js';
import { clampInt, LESSON_STATUSES } from '../utils/validators.js';

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
// The frontend sends snake_case (progress_percent/last_position); the legacy
// backend read camelCase only and silently stored 0. Both spellings are now
// accepted, status is enum-validated, values are clamped, and completing a
// lesson enforces prerequisites + a single XP award.
router.post('/lessons/:id/progress', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user.id;
  const raw = req.body || {};

  const status = raw.status;
  const progressPercent = raw.progress_percent ?? raw.progressPercent;
  const lastPosition = raw.last_position ?? raw.lastPosition;

  if (!LESSON_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${LESSON_STATUSES.join(', ')}.` });
  }

  const clampedPercent = status === 'available' ? 0 : clampInt(progressPercent, 0, 100);
  const clampedPosition = clampInt(lastPosition, 0, 100_000_000);
  const timestamp = new Date().toISOString();

  try {
    const db = getDb();
    const lesson = await db.get('SELECT xp_reward, title, prerequisites FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const prevProgress = await db.get('SELECT status FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', [userId, lessonId]);
    const alreadyCompleted = prevProgress && prevProgress.status === 'completed';

    // Business rule: a lesson can only be completed once its prerequisites are
    // completed (prerequisites is a comma-separated lesson-id list).
    if (status === 'completed' && !alreadyCompleted) {
      const prereqIds = (lesson.prerequisites || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (prereqIds.length > 0) {
        const rows = await db.all(
          `SELECT lesson_id, status FROM lesson_progress WHERE user_id = ? AND lesson_id IN (${prereqIds.map(() => '?').join(',')})`,
          [userId, ...prereqIds]
        );
        const completedIds = new Set(rows.filter(r => r.status === 'completed').map(r => r.lesson_id));
        const missing = prereqIds.filter(id => !completedIds.has(id));

        if (missing.length > 0) {
          return res.status(409).json({
            error: `Complete the prerequisite lessons first: ${missing.join(', ')}`
          });
        }
      }
    }

    let xpAwarded = 0;

    await withTransaction(async (db) => {
      await db.run(`
        INSERT INTO lesson_progress (user_id, lesson_id, status, progress_percent, last_position, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, lesson_id) DO UPDATE SET
          status = excluded.status,
          progress_percent = excluded.progress_percent,
          last_position = excluded.last_position,
          updated_at = excluded.updated_at
      `, [userId, lessonId, status, clampedPercent, clampedPosition, timestamp]);

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
    });

    res.json({ success: true, xpAwarded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save progress.' });
  }
});

// 5. Notes CRUD
// Contract fix: the frontend submits { text }, legacy backend read { noteText }
// and every save 500'd. Accept text / noteText / note_text.
router.post('/lessons/:id/notes', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const userId = req.user.id;
  const body = req.body || {};
  const noteId = body.id ?? body.noteId ?? body.note_id;
  const noteText = body.text ?? body.noteText ?? body.note_text;
  const tags = typeof body.tags === 'string' ? body.tags.slice(0, 500) : '';
  const pinned = body.pinned ? 1 : 0;
  const timestamp = new Date().toISOString();

  if (typeof noteText !== 'string' || noteText.trim().length === 0) {
    return res.status(400).json({ error: 'Note text is required.' });
  }
  if (noteText.length > 10000) {
    return res.status(400).json({ error: 'Note exceeds the 10,000 character limit.' });
  }
  if (noteId !== undefined && noteId !== null && (typeof noteId !== 'string' || noteId.length > 64)) {
    return res.status(400).json({ error: 'Invalid note id.' });
  }

  try {
    const db = getDb();
    const lesson = await db.get('SELECT id FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    if (noteId) {
      await db.run(`
        UPDATE lesson_notes
        SET note_text = ?, tags = ?, pinned = ?
        WHERE id = ? AND user_id = ? AND lesson_id = ?
      `, [noteText, tags, pinned, noteId, userId, lessonId]);
      res.json({ id: noteId, noteText, tags, pinned });
    } else {
      const newId = 'note_' + uuidv4().substr(0, 8);
      await db.run(`
        INSERT INTO lesson_notes (id, user_id, lesson_id, note_text, tags, pinned, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [newId, userId, lessonId, noteText, tags, pinned, timestamp]);
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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookmarks.' });
  }
});

router.post('/bookmarks', authenticateToken, async (req, res) => {
  const { itemType, itemId } = req.body;
  const userId = req.user.id;
  const timestamp = new Date().toISOString();

  if (typeof itemType !== 'string' || itemType.length === 0 || itemType.length > 24 ||
      typeof itemId !== 'string' || itemId.length === 0 || itemId.length > 64) {
    return res.status(400).json({ error: 'Valid itemType and itemId are required.' });
  }

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
    // Fetch items scheduled for review
    const queue = await db.all(`
      SELECT l.id, l.title, l.estimated_time, rq.interval_days
      FROM revision_queue rq
      JOIN lessons l ON rq.lesson_id = l.id
      WHERE rq.user_id = ?
    `, [userId]);

    // Fetch all flashcards from completed/in_progress lessons. Only real seeded
    // content is returned (the fabricated default cards were removed).
    const progressList = await db.all('SELECT lesson_id FROM lesson_progress WHERE user_id = ?', [userId]);
    const lessonIds = progressList.map(p => p.lesson_id);

    let flashcards = [];
    if (lessonIds.length > 0) {
      const contents = await db.all(`
        SELECT lesson_id, flashcards_json FROM lesson_contents
        WHERE lesson_id IN (${lessonIds.map(() => '?').join(',')})
      `, lessonIds);

      for (const c of contents) {
        let cards = [];
        try { cards = JSON.parse(c.flashcards_json || '[]'); } catch(e) {}
        cards.forEach((card, idx) => {
          flashcards.push({ ...card, id: `card_${c.lesson_id}_${idx}` });
        });
        if (flashcards.length >= 50) break;
      }
      flashcards = flashcards.slice(0, 50);
    }

    // Annotate each card with its spaced-repetition schedule (if any).
    const cardIds = flashcards.map(c => c.id);
    let scheduleMap = {};
    if (cardIds.length > 0) {
      const schedules = await db.all(`
        SELECT card_id, interval_days, next_review_at FROM flashcard_progress
        WHERE user_id = ? AND card_id IN (${cardIds.map(() => '?').join(',')})
      `, [userId, ...cardIds]);
      scheduleMap = Object.fromEntries(schedules.map(s => [s.card_id, s]));
    }

    const now = Date.now();
    flashcards = flashcards.map(card => {
      const s = scheduleMap[card.id];
      const nextReviewAt = s ? s.next_review_at : null;
      return {
        ...card,
        interval_days: s ? s.interval_days : 1,
        next_review_at: nextReviewAt,
        is_due: nextReviewAt ? new Date(nextReviewAt) <= new Date() : true
      };
    });

    const dueCount = flashcards.filter(c => c.is_due).length;

    res.json({ queue, flashcards, dueCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve revision queue' });
  }
});

// Rate flashcard (Spaced Repetition — SM-2 lite). Persists a real schedule row
// keyed by (user_id, card_id). Ratings < 3 reset the streak; ratings >= 3 grow
// the interval (1 → 3 → 7 → doubling, capped at 60 days).
router.post('/revision/rate', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { card_id, rating } = req.body;

  if (typeof card_id !== 'string' || card_id.length === 0 || card_id.length > 120) {
    return res.status(400).json({ error: 'A valid card_id is required.' });
  }
  const score = Number(rating);
  if (!Number.isInteger(score) || score < 0 || score > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 0 and 5.' });
  }

  try {
    const db = getDb();
    const existing = await db.get('SELECT reps, interval_days FROM flashcard_progress WHERE user_id = ? AND card_id = ?', [userId, card_id]);

    let reps = existing ? existing.reps : 0;
    let intervalDays = existing ? existing.interval_days : 1;

    if (score >= 3) {
      reps += 1;
      if (reps === 1) intervalDays = 1;
      else if (reps === 2) intervalDays = 3;
      else if (reps === 3) intervalDays = 7;
      else intervalDays = Math.min((intervalDays || 7) * 2, 60);
    } else {
      reps = 0;
      intervalDays = 0;
    }

    const now = new Date();
    // A failed/unknown card is due again within the hour for a quick retry.
    const spanHours = intervalDays >= 1 ? intervalDays * 24 : 1;
    const nextReview = new Date(now.getTime() + spanHours * 3600 * 1000);

    await db.run(`
      INSERT INTO flashcard_progress (user_id, card_id, reps, interval_days, last_reviewed_at, next_review_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, card_id) DO UPDATE SET
        reps = excluded.reps,
        interval_days = excluded.interval_days,
        last_reviewed_at = excluded.last_reviewed_at,
        next_review_at = excluded.next_review_at
    `, [userId, card_id, reps, intervalDays, now.toISOString(), nextReview.toISOString()]);

    res.json({
      success: true,
      recorded: true,
      intervalDays,
      nextReviewAt: nextReview.toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record flashcard rating.' });
  }
});

// 8. Submit Quiz — server-side scoring.
// Contract fix: the frontend submits { lesson_id, answers: [{question_index,
// selected_option}] } while the legacy backend expected a client-computed
// `score` — every submission 404'd and the score was trusted. Scoring now runs
// server-side against the lesson's quiz_json, and XP is awarded at most once
// per user+lesson (a repeat pass updates the stored result but grants no more).
router.post('/quiz/submit', authenticateToken, async (req, res) => {
  const body = req.body || {};
  const lessonId = body.lesson_id ?? body.lessonId;
  const answers = body.answers;

  if (typeof lessonId !== 'string' || lessonId.length === 0 || lessonId.length > 64) {
    return res.status(400).json({ error: 'A valid lesson_id is required.' });
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers must be a non-empty array.' });
  }
  if (answers.length > 100) {
    return res.status(400).json({ error: 'Too many answers submitted.' });
  }

  const userId = req.user.id;
  const timestamp = new Date().toISOString();

  try {
    const db = getDb();
    const lesson = await db.get('SELECT xp_reward, title FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const content = await db.get('SELECT quiz_json FROM lesson_contents WHERE lesson_id = ?', [lessonId]);
    let quiz = [];
    if (content) {
      try { quiz = JSON.parse(content.quiz_json || '[]'); } catch(e) {}
    }
    if (!Array.isArray(quiz) || quiz.length === 0) {
      return res.status(400).json({ error: 'This lesson has no quiz to score.' });
    }

    // Index selected answers by question_index, ignoring out-of-range indexes.
    const answerMap = new Map();
    for (const a of answers) {
      if (!a || typeof a !== 'object') continue;
      const idx = Number(a.question_index);
      if (Number.isInteger(idx) && idx >= 0 && idx < quiz.length) {
        answerMap.set(idx, a.selected_option);
      }
    }

    const results = quiz.map((q, qIdx) => {
      let selected = answerMap.get(qIdx);
      let isCorrect = false;

      // Tolerate both "index into options" and "option text" answers.
      if (selected !== undefined) {
        let selectedText = String(selected).toLowerCase();
        if (Array.isArray(q.options) && Number.isInteger(selected) && q.options[selected] !== undefined) {
          selectedText = String(q.options[selected]).toLowerCase();
        }

        if (q.type === 'tf') {
          isCorrect = selectedText === String(q.correctAnswer).toLowerCase();
        } else {
          isCorrect = Number(selected) === Number(q.correctIndex);
        }
      }

      return {
        question_index: qIdx,
        is_correct: isCorrect,
        selected_option: selected,
        correct_answer: q.type === 'tf' ? q.correctAnswer : q.correctIndex
      };
    });

    const correctCount = results.filter(r => r.is_correct).length;
    const totalQuestions = quiz.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercent >= 80;

    const xpAwarded = await withTransaction(async (db) => {
      const priorPass = await db.get(
        'SELECT id FROM quiz_results WHERE user_id = ? AND lesson_id = ? AND passed = 1 LIMIT 1',
        [userId, lessonId]
      );

      let awarded = 0;
      if (passed && !priorPass) {
        awarded = Math.round((lesson.xp_reward || 100) * 0.2);
        const userRow = await db.get('SELECT xp, level FROM users WHERE id = ?', [userId]);
        const nextXp = (userRow.xp || 0) + awarded;
        const nextLevel = Math.floor(nextXp / 1000) + 1;
        await db.run('UPDATE users SET xp = ?, level = ? WHERE id = ?', [nextXp, nextLevel, userId]);

        await db.run(
          'INSERT INTO activity_logs (user_id, activity_type, description, timestamp) VALUES (?, ?, ?, ?)',
          [userId, 'quiz', `Passed quiz for "${lesson.title}" with score ${scorePercent}% (+${awarded} XP)`, timestamp]
        );
      }

      await db.run(
        'INSERT INTO quiz_results (id, user_id, lesson_id, score_percent, passed, correct_count, total_questions, answers_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['quiz_' + uuidv4().substr(0, 8) + '_' + Date.now().toString(36), userId, lessonId, scorePercent, passed ? 1 : 0, correctCount, totalQuestions, JSON.stringify(answers), timestamp]
      );

      return awarded;
    });

    res.json({
      success: true,
      score_percent: scorePercent,
      scorePercent,
      xp_awarded: xpAwarded,
      xpAwarded,
      passed,
      correct_count: correctCount,
      total_questions: totalQuestions,
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit quiz score.' });
  }
});

export default router;