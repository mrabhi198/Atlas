// Brute Force Lock Limiter (Failed login tracker)
const loginAttempts = new Map(); // ip -> { count, lockUntil }

export function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();
  const limitRecord = loginAttempts.get(ip);

  if (limitRecord && limitRecord.lockUntil > now) {
    const minutesLeft = Math.ceil((limitRecord.lockUntil - now) / 60000);
    return res.status(429).json({
      error: `Brute force protection active. IP locked. Try again in ${minutesLeft} minutes.`
    });
  }

  next();
}

export function recordLoginFailure(ip) {
  const now = Date.now();
  const limitRecord = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };

  limitRecord.count += 1;
  if (limitRecord.count >= 5) {
    limitRecord.lockUntil = now + 15 * 60 * 1000; // lock for 15 minutes
    limitRecord.count = 0; // reset counter
  }
  loginAttempts.set(ip, limitRecord);
}

export function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}