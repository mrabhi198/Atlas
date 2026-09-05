import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { writeAuditLog } from '../middleware/audit.js';

const router = Router();

// 1. Get Security Tags
router.get('/', authenticateToken, authorizeRoles('admin', 'super admin', 'mentor'), async (req, res) => {
  try {
    const db = getDb();
    const tags = await db.all('SELECT * FROM security_tags ORDER BY created_at ASC');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve security tags.' });
  }
});

// 2. Add Security Tag (Super Admin / Admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'super admin'), async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Tag name required' });
  }
  if (name.length > 60) {
    return res.status(400).json({ error: 'Tag name must be 60 characters or fewer.' });
  }

  try {
    const db = getDb();
    const tagName = name.trim();
    const existing = await db.get('SELECT id FROM security_tags WHERE LOWER(name) = LOWER(?)', [tagName]);
    if (existing) {
      return res.status(409).json({ error: 'A tag with this name already exists.' });
    }

    const id = 'tag_' + Date.now() + Math.random().toString(36).substr(2, 9);
    await db.run('INSERT INTO security_tags (id, name, created_at) VALUES (?, ?, ?)', [
      id, tagName, new Date().toISOString()
    ]);
    const tag = await db.get('SELECT * FROM security_tags WHERE id = ?', [id]);
    await writeAuditLog(req.user.id, `CREATED_TAG_${tagName.toUpperCase()}`, req);
    res.json(tag);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create tag.' });
  }
});

// 3. Delete Security Tag (Super Admin / Admin only)
router.delete('/:name', authenticateToken, authorizeRoles('admin', 'super admin'), async (req, res) => {
  const { name } = req.params;
  const criticalTags = ['admin', 'super admin']; // Prevent lockout

  if (criticalTags.includes(name.toLowerCase())) {
    return res.status(403).json({ error: 'Cannot delete critical system tags.' });
  }

  try {
    const db = getDb();
    await db.run('DELETE FROM security_tags WHERE LOWER(name) = LOWER(?)', [name]);
    await writeAuditLog(req.user.id, `DELETED_TAG_${name.toUpperCase()}`, req);
    res.json({ message: 'Tag deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag.' });
  }
});

export default router;