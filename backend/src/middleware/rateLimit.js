// Rate limiting middleware.
//
// Two complementary mechanisms:
//  - rateLimitLogin / recordLoginFailure / clearLoginAttempts: account-lockout
//    protection for failed password attempts (preserved behavior).
//  - rateLimit({ windowMs, max, key }): generic sliding-window limiter keyed by
//    IP (or a custom key function) usable on any sensitive endpoint.

const loginAttempts = new Map(); // ip -> { count, lockUntil }

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

function pruneLoginMap() {
  const now = Date.now();
  if (loginAttempts.size < 1000) return;
  for (const [ip, rec] of loginAttempts) {
    if (!rec.lockUntil || rec.lockUntil <= now) loginAttempts.delete(ip);
  }
}

export function rateLimitLogin(req, res, next) {
  const ip = clientIp(req);
  const now = Date.now();
  pruneLoginMap();
  const limitRecord = loginAttempts.get(ip);

  if (limitRecord && limitRecord.lockUntil > now) {
    const minutesLeft = Math.ceil((limitRecord.lockUntil - now) / 60000);
    return res.status(429).json({
      error: `Brute force protection active. IP locked. Try again in ${minutesLeft} minutes.`
    });
  }

  next();
}

export function recordLoginFailure(req, resOrIp) {
  const ip = typeof req === 'string' ? req : clientIp(req);
  const now = Date.now();
  const limitRecord = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };

  limitRecord.count += 1;
  if (limitRecord.count >= 5) {
    limitRecord.lockUntil = now + 15 * 60 * 1000; // lock for 15 minutes
    limitRecord.count = 0; // reset counter
  }
  loginAttempts.set(ip, limitRecord);
}

export function clearLoginAttempts(reqOrIp) {
  const ip = typeof reqOrIp === 'string' ? reqOrIp : clientIp(reqOrIp);
  loginAttempts.delete(ip);
}

// Generic sliding-window limiter.
//
// const limiter = rateLimit({ windowMs: 60_000, max: 10 });
// router.post('/register', limiter, handler)
export function rateLimit(opts = {}) {
  const { windowMs = 60_000, max = 60, message, key } = opts;
  const buckets = new Map(); // key -> { count, resetAt }

  return (req, res, next) => {
    const bucketKey = typeof key === 'function' ? key(req) : clientIp(req);
    const now = Date.now();
    let rec = buckets.get(bucketKey);

    if (!rec || rec.resetAt <= now) {
      rec = { count: 0, resetAt: now + windowMs };
    }
    rec.count += 1;

    if (rec.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((rec.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: message || 'Too many requests. Please try again shortly.'
      });
    }

    buckets.set(bucketKey, rec);

    // Opportunistic pruning to bound memory growth.
    if (buckets.size > 5000) {
      const keys = [...buckets.keys()];
      for (const k of keys) {
        if (buckets.get(k).resetAt <= now) buckets.delete(k);
      }
    }

    next();
  };
}