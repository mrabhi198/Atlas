// Centralized error handling + JSON 404 responses.

// Wrap async route handlers so rejected promises reach the error handler
// instead of crashing the process or hanging the request.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Unknown /api routes return a JSON-shaped 404 instead of Express's HTML page.
export function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  next();
}

// Last-resort handler. Pre-empted by in-route try/catch blocks, so it only
// catches genuinely unhandled throws.
export function errorHandler(err, req, res, next) {
  console.error('Unhandled API error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error.' });
}