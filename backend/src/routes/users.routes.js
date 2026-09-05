import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { writeAuditLog } from '../middleware/audit.js';

const router = Router();

// 1. Users List (Protected RBAC)
router.get('/', authenticateToken, authorizeRoles('admin', 'super admin', 'mentor'), async (req, res) => {
  try {
    const db = getDb();
    const users = await db.all(`
      SELECT u.id, u.email, u.username, u.role, u.passcode, u.xp, u.level, u.code_quality, p.learning_track
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user nodes.' });
  }
});

// 2. Update User Role Tag (Super Admin only)
router.put('/:id/role', authenticateToken, authorizeRoles('super admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const db = getDb();
    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const updated = await db.get('SELECT id, email, username, role FROM users WHERE id = ?', [id]);
    await writeAuditLog(req.user.id, `ROLE_CHANGE_${id}_TO_${role.toUpperCase()}`, req);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user security tag.' });
  }
});

export default router;