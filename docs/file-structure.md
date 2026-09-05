# Atlas — File Structure (Current State)

Canonical annotated tree after the backend modularization and frontend restructure (Sep 2026).
Anything listed here is the source of truth; older docs that still show `backend/server.js` / `backend/db.js` as monoliths or flat `components/*.jsx` are outdated.

---

## Root

```text
Atlas/
├── package.json            ← root npm workspaces config (frontend + backend)
├── package-lock.json
├── README.md               ← setup + quickstart
├── intro.txt               ← project philosophy & context
├── prompt.txt              ← original build prompt (historical)
├── todo                    ← progress tracker
├── .gitignore              ← node_modules/, .env.* (but !.env.example), *.sqlite, dist, logs
│
├── frontend/               ← React + Vite SPA (workspace: frontend)
├── backend/                ← Express API (workspace: backend)
├── db/
│   └── atlas.sqlite        ← runtime SQLite DB (git-ignored; re-seeds via npm run db:reset)
├── docs/                   ← product + architecture documentation
└── logos/                  ← brand assets
```

---

## Backend (`backend/`)

```text
backend/
├── package.json            ← scripts: start/dev = node src/server.js, db:reset = node src/scripts/reset-db.js
├── .env                    ← local secrets (git-ignored)
├── .env.example            ← template of every env var
│
└── src/
    ├── server.js           ← entry point — boots createApp(), loads routes, listens on config.port (16 LOC)
    ├── app.js              ← createApp() factory + GET /api/health (45 LOC)
    │
    ├── config/
    │   ├── index.js        ← exports env, config, paths (50 LOC)
    │   │                     · config: port, frontendUrl, secret fallbacks, OAuth ids, Gemini settings
    │   │                     · paths: repoRoot, backendRoot, dbDir, dbFile
    │   └── passport.js     ← OAuth strategy setup (Google/GitHub)
    │
    ├── db/
    │   ├── index.js        ← singleton connection (sqlite + sqlite3 driver), PRAGMA foreign_keys
    │   ├── schema.js       ← all CREATE TABLE IF NOT EXISTS (28 tables) — 371 LOC
    │   └── seed.js         ← demo data — seeded when users table is empty (5 demo users, tracks, missions) — 380 LOC
    │
    ├── middleware/
    │   ├── auth.js         ← authenticateToken (JWT) + authorizeRoles (RBAC guard)
    │   ├── audit.js        ← audit-log middleware
    │   └── rateLimit.js    ← rate limiting on sensitive endpoints
    │
    ├── routes/             ← 1 module per resource, all under /api
    │   ├── auth.routes.js      ← register, login, refresh, logout, OAuth callbacks, verify/reset
    │   ├── users.routes.js     ← profile, settings, password
    │   ├── dashboard.routes.js ← stats, goals, activity, recommendations
    │   ├── learning.routes.js  ← tracks, modules, lessons, progress, notes, revision queue
    │   ├── missions.routes.js  ← missions, code execution, chat
    │   ├── mentor.routes.js    ← POST /api/ai/mentor (Gemini)
    │   └── admin.routes.js     ← user mgmt, security tags, roles
    │
    ├── services/
    │   ├── ai.service.js       ← generateMentorReply — Gemini with hardcoded fallbacks (AI_SIM)
    │   ├── auth.service.js     ← signTokens, persistAuthSession, processOAuthLogin
    │   └── compiler.service.js ← executeMissionSimulation — keyword-match simulator (AI_SIM)
    │
    ├── utils/
    │   └── validators.js       ← isValidEmail, isValidPassword, PASSWORD_REGEX
    │
    └── scripts/
        └── reset-db.js         ← npm run db:reset — drops schema, re-creates tables + seed
```

---

## Frontend (`frontend/`)

```text
frontend/
├── package.json            ← react ^19.2.8, lucide-react, vite 8.2.0
├── .env                    ← VITE_API_BASE_URL (git-ignored)
├── .env.example            ← template
├── .oxlintrc.json          ← react lint rules
├── index.html              ← Google Fonts (Outfit + JetBrains Mono)
├── vite.config.js
├── vercel.json             ← SPA rewrite: /(.*) → /index.html
├── public/                 ← static assets (banner, favicons, logo)
│
└── src/
    ├── main.jsx            ← React 19 createRoot
    ├── index.css           ← all styles, tokens, animations
    ├── App.css
    ├── App.jsx             ← hash-based manual routing, AuthProvider, <Sidebar />, all view state
    │
    ├── api/
    │   └── client.js       ← SOLE owner of VITE_API_BASE_URL
    │                          · apiFetch(path, { token, headers, ...init }) — drop-in fetch wrapper
    │                          · apiUrl(path) — URL builder for OAuth redirects
    │
    └── components/         ← feature folders; all import the client via ../../api/client
        ├── layout/
        │   └── Sidebar.jsx             (66)  ← extracted nav: activeTab, onNavigate, user, profile, onAdmin, onResetSession
        ├── auth/                        ← Login, Register, OnboardingWizard, AuthSuccess, ForgotPassword, ResetPassword, VerifyEmail
        ├── dashboard/
        │   └── Dashboard.jsx          (696)  ← main dashboard
        ├── admin/
        │   └── AdminCenter.jsx        (705)  ← 12-module admin control center
        ├── mission/
        │   └── MissionIDE.jsx         (370)  ← code workspace
        ├── learn/                       ← LearnHub, LessonViewer, FlashCard
        ├── passport/
        │   └── Passport.jsx           (167)  ← engineering passport
        ├── career/
        │   └── CareerVault.jsx        (217)  ← portfolio
        ├── practice/
        │   └── LogicPractice.jsx      (213)  ← practice problems
        ├── onboarding/
        │   └── Onboarding.jsx         (385)  ← post-login wizard
        └── settings/
            └── AccountSettings.jsx    (416)  ← profile & security settings
```

> `(n)` = line count. All feature components reach the API client with the same import path, so moving a folder never changes call sites.

---

## Docs (`docs/`)

```text
docs/
├── PRD.md                 ← product requirements (3,262 lines)
├── architecture.md        ← current-state architecture reference (~2,600 lines)
├── memory.md              ← working memory / conventions
├── design.md              ← design reference (33 sections)
├── rules.md               ← coding rules (66 sections)
├── phases.doc.md          ← 18-phase roadmap
└── file-structure.md      ← THIS DOCUMENT
```

---

## Where things live (quick map)

| Concern | Location |
|---------|----------|
| HTTP entry | `backend/src/server.js` |
| App wiring / health | `backend/src/app.js` |
| Secrets + fallback defaults | `backend/src/config/index.js` |
| SQLite connection | `backend/src/db/index.js` |
| Tables | `backend/src/db/schema.js` |
| Demo/seed data | `backend/src/db/seed.js` |
| JWT auth + role guard | `backend/src/middleware/auth.js` |
| All API routes | `backend/src/routes/*.routes.js` |
| AI mentor (Gemini + AI_SIM) | `backend/src/services/ai.service.js` |
| Code execution (simulated) | `backend/src/services/compiler.service.js` |
| Frontend API access | `frontend/src/api/client.js` |
| Nav / sidebar | `frontend/src/components/layout/Sidebar.jsx` |
| Runtime database | `db/atlas.sqlite` (untracked) |
| Env templates | `backend/.env.example`, `frontend/.env.example` |

## Lifecycle

- Start backend: `npm run start -w backend` (node `src/server.js`).
- Dev backend: `npm run dev -w backend`.
- Reset DB: `npm run db:reset -w backend` (drops + recreates + reseeds `db/atlas.sqlite`).
- Frontend dev: `npm run dev -w frontend` (Vite, port 5173).
- Frontend build: `npm run build -w frontend`.