import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// Middleware to authenticate JWT access tokens
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token missing. Authentication required.' });
  }

  jwt.verify(token, config.accessTokenSecret, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired access token. Please re-authenticate.' });
    }
    req.user = user; // { id, email, username, role }
    next();
  });
}

// Middleware to authorize Role-Based Access Control (RBAC)
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.map(r => r.toLowerCase()).includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ error: `Access Denied. Required role: [${allowedRoles.join(', ')}]` });
    }
    next();
  };
}