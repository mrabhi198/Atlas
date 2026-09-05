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