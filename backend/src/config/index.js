import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Repository root = backend/src/config -> ../..: backend, ../../..: repo root
const repoRoot = path.resolve(__dirname, '../../..');
const backendRoot = path.resolve(__dirname, '../..');

export const env = process.env;

export const config = {
  // Server
  port: Number(env.PORT) || 5001,

  // Frontend origin used for OAuth redirects (single dev override point)
  frontendUrl: env.FRONTEND_URL || 'http://localhost:5173',

  // JWT secrets (fallbacks preserve legacy zero-config behavior; DO NOT use in production)
  accessTokenSecret: env.ACCESS_TOKEN_SECRET || 'atlas_core_access_secret_0x8f2',
  refreshTokenSecret: env.REFRESH_TOKEN_SECRET || 'atlas_core_refresh_secret_0x2a9',
  sessionSecret: env.SESSION_SECRET || 'atlas_session_secret_0x999',

  // OAuth
  google: {
    clientId: env.GOOGLE_CLIENT_ID || 'mock_google_id',
    clientSecret: env.GOOGLE_CLIENT_SECRET || 'mock_google_secret',
    callbackUrl: env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID || 'mock_github_id',
    clientSecret: env.GITHUB_CLIENT_SECRET || 'mock_github_secret',
    callbackUrl: env.GITHUB_CALLBACK_URL || 'http://localhost:5001/api/auth/github/callback'
  },

  // AI
  geminiApiKey: env.GEMINI_API_KEY || '',
  geminiModel: env.GEMINI_MODEL || 'gemini-1.5-flash',
  geminiSystemInstruction: env.GEMINI_SYSTEM_INSTRUCTION ||
    'You are Cognitive Guide, AI mentor for Atlas. Answer questions briefly (under 3 sentences) focusing on Kotlin, database systems, and index structures.'
};

export const paths = {
  repoRoot,
  backendRoot,
  dbDir: path.join(repoRoot, 'db'),
  dbFile: path.join(repoRoot, 'db', 'atlas.sqlite')
};