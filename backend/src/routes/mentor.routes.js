import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { generateMentorReply } from '../services/ai.service.js';

const router = Router();

// AI Mentor Insights history
// The :userId path segment is cosmetic — history is always scoped to the
// authenticated user (req.user.id), never to a client-supplied id.
router.get(['/history/:userId', '/history'], authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const history = await db.all('SELECT sender, text FROM chat_messages WHERE user_id = ? ORDER BY id ASC', [req.user.id]);
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve AI mentor logs.' });
  }
});

// AI Mentor send message
router.post('/chat', authenticateToken, rateLimit({ windowMs: 60_000, max: 30, key: req => req.user?.id, message: 'Too many mentor messages. Please wait a moment.' }), async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (typeof message !== 'string' || message.trim().length === 0 || message.length > 4000) {
    return res.status(400).json({ error: 'Message must be a non-empty string of up to 4000 characters.' });
  }

  try {
    const db = getDb();

    await db.run(
      'INSERT INTO chat_messages (user_id, sender, text, timestamp) VALUES (?, ?, ?, ?)',
      [userId, 'user', message, new Date().toISOString()]
    );

    let reply = await generateMentorReply(message);

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
    console.error(error);
    res.status(500).json({ error: 'AI Mentor module offline.' });
  }
});

export default router;