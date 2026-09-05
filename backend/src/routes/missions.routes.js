import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { executeMissionSimulation } from '../services/compiler.service.js';

const router = Router();

// Execute mission code (prototype simulation — see compiler.service.js).
// Rate-limited per user to keep a misbehaving client from flooding the DB with
// submission-history rows.
router.post('/execute',
  authenticateToken,
  rateLimit({ windowMs: 60_000, max: 20, key: req => req.user?.id, message: 'Too many mission runs. Please wait a moment.' }),
  async (req, res) => {
    const { code, fileName } = req.body;

    if (typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ error: 'code is required.' });
    }
    if (code.length > 50000) {
      return res.status(400).json({ error: 'code exceeds the 50,000 character limit.' });
    }
    if (fileName !== undefined && (typeof fileName !== 'string' || fileName.length > 120)) {
      return res.status(400).json({ error: 'fileName must be a short string.' });
    }

    try {
      const result = await executeMissionSimulation(req.user.id, code);
      res.json(result);
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ error: error.message });
      }
      console.error(error);
      res.status(500).json({ error: 'Sandbox execution failure.' });
    }
  }
);

export default router;