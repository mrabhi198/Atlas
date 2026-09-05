import { getDb } from '../db/index.js';

// Log admin/security event
export async function writeAuditLog(userId, action, req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  try {
    await getDb().run(
      'INSERT INTO audit_logs (user_id, action, ip_address, timestamp) VALUES (?, ?, ?, ?)',
      [userId, action, ip, new Date().toISOString()]
    );
  } catch (err) {
    console.error('Audit logger error:', err);
  }
}