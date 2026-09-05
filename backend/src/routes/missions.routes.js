import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { executeMissionSimulation } from '../services/compiler.service.js';

const router = Router();

// Execute mission code (prototype simulation — see compiler.service.js)
router.post('/execute', authenticateToken, async (req, res) => {
  const { code, fileName } = req.body;
  const userId = req.user.id;

  try {
    const result = await executeMissionSimulation(userId, code);
    res.json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Sandbox execution failure.' });
  }
});

export default router;