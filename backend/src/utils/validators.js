// Shared validation helpers used across auth routes.

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password) {
  return PASSWORD_REGEX.test(password);
}

export const PASSWORD_ERROR_MESSAGE =
  'Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).';

// Returns true when value is a non-empty trimmed string within maxLength characters.
export function isNonEmptyString(value, maxLength = 500) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

// Coerce a value to an integer clamped to [min, max]; returns min for non-numeric input.
export function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

// Trim + cap a raw string to maxLength characters (returns '' for non-strings).
export function capString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength).trim();
}

export const LESSON_STATUSES = ['available', 'in_progress', 'completed'];