import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { writeAuditLog } from '../middleware/audit.js';
import { isNonEmptyString } from '../utils/validators.js';

const router = Router();

// 1. Users List (Protected RBAC)
// NOTE: the plaintext `passcode` column is intentionally NOT selected here —
// it was previously exposed to every admin/mentor with user-read access (P0).
router.get('/', authenticateToken, authorizeRoles('admin', 'super admin', 'mentor'), async (req, res) => {
  try {
    const db = getDb();
    const users = await db.all(`
      SELECT u.id, u.email, u.username, u.role, u.xp, u.level, u.code_quality, p.learning_track
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at ASC
    `);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve user nodes.' });
  }
});

// 2. Update User Role Tag (Super Admin only)
router.put('/:id/role', authenticateToken, authorizeRoles('super admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!isNonEmptyString(role, 60)) {
    return res.status(400).json({ error: 'Role must be a non-empty string (max 60 characters).' });
  }
  const normalizedRole = role.trim();

  try {
    const db = getDb();

    const target = await db.get('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Role change must reference an existing security tag — prevents inventing
    // ad-hoc roles that bypass RBAC checks.
    const tag = await db.get('SELECT id FROM security_tags WHERE LOWER(name) = LOWER(?)', [normalizedRole]);
    if (!tag) {
      return res.status(400).json({ error: 'Role must match an existing security tag.' });
    }

    // Never let the last super admin be demoted (lockout guard).
    if (target.role.toLowerCase() === 'super admin' && normalizedRole.toLowerCase() !== 'super admin') {
      const count = await db.get('SELECT COUNT(*) as count FROM users WHERE LOWER(role) = "super admin"');
      if (count.count <= 1) {
        return res.status(409).json({ error: 'Cannot demote the last super admin account.' });
      }
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [normalizedRole, id]);
    const updated = await db.get('SELECT id, email, username, role FROM users WHERE id = ?', [id]);
    await writeAuditLog(req.user.id, `ROLE_CHANGE_${id}_TO_${normalizedRole.toUpperCase()}`, req);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user security tag.' });
  }
});

export default router;