// Central API client — single source for the backend base URL and
// authentication header injection.
//
// Usage:
//   import { apiFetch, apiUrl } from '../api/client';
//   const res = await apiFetch('/dashboard/summary', { token: accessToken });
//   window.location.href = apiUrl('/auth/google');

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export function apiUrl(path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

// Drop-in replacement for fetch() with the API base URL pre-applied and
// helpers for the JSON content-type and Bearer token header.
//
//   apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
//   apiFetch('/tracks', { token: accessToken })
//
// Returns a standard fetch Response (res.ok, res.status, res.json() all work).
export function apiFetch(path, { token, headers, ...init } = {}) {
  const mergedHeaders = new Headers(headers || {});

  // Set JSON content type for string bodies
  if (init.body && typeof init.body === 'string' && !(init.body instanceof FormData)) {
    if (!mergedHeaders.has('Content-Type')) {
      mergedHeaders.set('Content-Type', 'application/json');
    }
  }

  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  return fetch(apiUrl(path), { ...init, headers: mergedHeaders });
}