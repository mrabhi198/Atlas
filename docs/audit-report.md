# Atlas — Audit Report (Sep 4 2026)

---

## 1. Production Readiness Verdict

### NEEDS HARDENING

Atlas is functional and bootable on localhost. The codebase has been restructured into a clean modular layout on both backend and frontend, but four critical security/quality gaps and two process gaps remain that must be addressed before any non-local deployment.

| Critical Finding | Impact |
|------------------|--------|
| Hardcoded fallback JWT + session secrets in `src/config/index.js` | Any unconfigured deployment runs with known secret strings |
| OAuth tokens passed via URL query params | Tokens logged in browser history, referrer headers, server logs |
| GitHub OAuth redirect hardcoded to `localhost:5173` | Fails in any non-local environment |
| Plaintext seed passwords (not bcrypt hashed) | Demo users trivially compromiseable if DB leaks |
| No test suite | Zero unit, integration, or e2e coverage |
| Simulated compiler (keyword string match) | Awards +800 XP on fake success, no real code execution |

Verdict: **NEEDS HARDENING** — safe for local dev/demo; not deployable as-is.

---

## 2. Scope & Methodology

- Full audit of the Atlas monorepo (`/Users/abhi/Spellora/Atlas`, branch `dev`)
- Covers: backend structure, frontend structure, security posture, dependency health, documentation accuracy
- Approach: audit findings were implemented immediately (not just reported) — backend and frontend restructured, stale docs updated, stale files cleaned up

---

## 3. Problems Found

### Structure
- Backend was a 2-file monolith: `backend/server.js` (1,589 LOC — all routes, middleware, server) + `backend/db.js` (779 LOC — schema + seed)
- Frontend had 20 components in a flat `components/` directory; no shared API abstraction; sidebar logic was inlined in `App.jsx`

### Security
- **SEC-01**: Hardcoded JWT/session fallback secrets (critical)
- **SEC-02**: OAuth tokens in URL query params (critical)
- **SEC-03**: GitHub OAuth redirect hardcoded to localhost (critical)
- **SEC-04**: Plaintext seed passwords (critical)
- **SEC-05/06/07**: No rate limiting / CSRF / input validation (high)

### Quality
- No test suite, no CI/CD, no database migration system
- Linter: `oxlint` with React rules only; no ESLint config
- 107 pre-existing lint warnings (unused imports, missing hook dependencies) across existing codebase; all in pre-existing files, none in restructured code

### Documentation
- `memory.md` listed SQLite engine as `better-sqlite3` (wrong — always `sqlite`/`sqlite3`)
- `memory.md` structure, file inventory, component inventory, and dependency table all described pre-restructure state
- `architecture.md` described monolithic layout, stale paths, missing component file paths
- `intro.txt` and `README.md` trees referenced old monolith structure
- `.env.example` files did not exist

---

## 4. Changes Implemented

### Backend (fully implemented, verified)

| Module | Purpose |
|--------|---------|
| `src/server.js` | Entry point — boots createApp() |
| `src/app.js` | createApp() factory + `/api/health` |
| `src/config/index.js` | Centralized config, secrets, paths |
| `src/config/passport.js` | OAuth strategy setup |
| `src/db/index.js` | Singleton connection (sqlite + sqlite3) |
| `src/db/schema.js` | 28 CREATE TABLE definitions |
| `src/db/seed.js` | Demo users, tracks, missions |
| `src/middleware/auth.js` | authenticateToken + authorizeRoles |
| `src/middleware/audit.js` | Audit-log middleware |
| `src/middleware/rateLimit.js` | Rate limiting |
| `src/routes/` | 7 resource modules (auth, users, dashboard, learning, missions, mentor, admin) |
| `src/services/ai.service.js` | Gemini mentor + hardcoded fallbacks |
| `src/services/auth.service.js` | JWT/session/OAuth logic |
| `src/services/compiler.service.js` | Mission code simulation |
| `src/utils/validators.js` | Email + password validation |
| `src/scripts/reset-db.js` | Drop + recreate + reseed |
| `backend/.env.example` | Env var template |

### Frontend (fully implemented, verified)

| Change | Detail |
|--------|--------|
| Created `src/api/client.js` | `apiFetch()` drop-in wrapper + `apiUrl()` for redirects; sole owner of `VITE_API_BASE_URL` |
| Created `src/components/layout/Sidebar.jsx` | Extracted sidebar with props: `activeTab`, `onNavigate`, `user`, `profile`, `onAdmin`, `onResetSession` |
| Moved via `git mv` into feature folders | `dashboard/`, `admin/`, `mission/`, `learn/`, `passport/`, `career/`, `practice/`, `onboarding/` |
| All fetch calls converted to `apiFetch` | ~51 call sites; removed all direct `import.meta.env` and `API_BASE` references from components |
| Updated `App.jsx` | Imports updated, `<Sidebar />` replaces inline nav, API_BASE removed (114 LOC reduction) |
| `frontend/.env.example` | `VITE_API_BASE_URL` template |

### Cleanup

| Change | Detail |
|--------|--------|
| `.gitignore` rewritten | Covers `.env.*` (except `.env.example`), `dist/`, `*.sqlite`, logs |
| Removed `backend/atlas.sqlite` placeholder | 0-byte file was a source of confusion |
| Removed `frontend/src/assets/{hero.png,react.svg,vite.svg}` | Unused; component builds unaffected |

### Documentation Updated

| File | What changed |
|------|--------------|
| `architecture.md` | Diagram, §4-§7.3, §9-§12, §14-§16, §18, §20, §22-§25, §30 (debt table with Status), §31, §41-§45 — ~2,600 lines current-state sections |
| `memory.md` | §4 metrics, §5 tree, §13 (sqlite/sqlite3), §15 component inventory, §16 stack, §20 file inventory, §29 dependencies, §8 tech-debt resolved items |
| `intro.txt` | Project structure tree (line 735) |
| `README.md` | Structure tree, backend start command (`npm run start`), `.env.example` note |
| `docs/file-structure.md` | **Created** — canonical annotated tree with lifecycle commands |

---

## 5. Final File Tree

```text
Atlas/
├── package.json                          ← root workspaces config
├── .gitignore                            ← .env.*, dist, *.sqlite, logs
├── README.md
├── intro.txt                             ← project philosophy (1,418 lines)
│
├── frontend/                             ← React 19 + Vite 8.2 (workspace: frontend)
│   ├── .env.example
│   └── src/
│       ├── api/client.js                 ← apiFetch + apiUrl (sole VITE_API_BASE_URL owner)
│       ├── components/
│       │   ├── layout/Sidebar.jsx        ← extracted sidebar (66 LOC)
│       │   ├── auth/                     ← 7 auth components
│       │   ├── dashboard/Dashboard.jsx
│       │   ├── admin/AdminCenter.jsx
│       │   ├── mission/MissionIDE.jsx
│       │   ├── learn/                    ← LearnHub, LessonViewer, FlashCard
│       │   ├── passport/Passport.jsx
│       │   ├── career/CareerVault.jsx
│       │   ├── practice/LogicPractice.jsx
│       │   ├── onboarding/Onboarding.jsx
│       │   └── settings/AccountSettings.jsx
│       └── App.jsx                       ← routing, AuthProvider, <Sidebar /> (471 LOC)
│
├── backend/                              ← Express 4 + sqlite + sqlite3 (workspace: backend)
│   ├── .env.example
│   └── src/
│       ├── server.js                     ← entry (16 LOC)
│       ├── app.js                        ← createApp + /api/health (45 LOC)
│       ├── config/{index,passport}.js
│       ├── db/{index,schema,seed}.js     ← 28 tables (371 + 380 LOC)
│       ├── middleware/{auth,audit,rateLimit}.js
│       ├── routes/{auth,users,dashboard,learning,missions,mentor,admin}.routes.js
│       ├── services/{ai,auth,compiler}.service.js
│       ├── utils/validators.js
│       └── scripts/reset-db.js
│
├── db/atlas.sqlite                       ← runtime DB (git-ignored, re-seeds)
│
└── docs/
    ├── architecture.md                   ← ~2,600 lines
    ├── memory.md
    ├── file-structure.md                 ← NEW: canonical tree
    ├── design.md / rules.md / phases.doc.md / PRD.md
    └── *.pdf                             ← legacy docs (untracked)
```

---

## 6. Key Decisions

1. **Shared API client (`apiFetch`)** — Drop-in `fetch` wrapper returning real `Response` (not parsed JSON). Every component imports `../../api/client` with the same path from any feature folder; no need to update import paths when moving files.

2. **`git mv` for all frontend renames** — Preserves git history; renames staged in index.

3. **Sidebar extracted as a props-driven component** — `Sidebar({ activeTab, onNavigate, user, profile, onAdmin, onResetSession })`. No hooks, no context dependency. `App.jsx` owns all state and passes callbacks down.

4. **Backend secrets centralized in `src/config/index.js`** — Fallback strings identical to the old monolith; behavior deliberately preserved during restructure to avoid introducing regressions while isolating the problem for future hardening.

5. **`sqlite` + `sqlite3` — no `better-sqlite3`** — This was always the actual stack; `memory.md` §13 had a documentation error that has now been corrected.

---

## 7. Files Moved

All frontend component renames were done via `git mv`:

| Original | New |
|----------|-----|
| `components/Dashboard.jsx` | `components/dashboard/Dashboard.jsx` |
| `components/AdminCenter.jsx` | `components/admin/AdminCenter.jsx` |
| `components/MissionIDE.jsx` | `components/mission/MissionIDE.jsx` |
| `components/Passport.jsx` | `components/passport/Passport.jsx` |
| `components/CareerVault.jsx` | `components/career/CareerVault.jsx` |
| `components/LogicPractice.jsx` | `components/practice/LogicPractice.jsx` |
| `components/Onboarding.jsx` | `components/onboarding/Onboarding.jsx` |
| `components/LearnHub.jsx` | `components/learn/LearnHub.jsx` |
| `components/LessonViewer.jsx` | `components/learn/LessonViewer.jsx` |
| `components/FlashCard.jsx` | `components/learn/FlashCard.jsx` |
| `components/settings/AccountSettings.jsx` | `components/settings/AccountSettings.jsx` (unchanged) |
| `components/auth/*` | `components/auth/*` (unchanged) |

---

## 8. Files Removed

| File | Reason |
|------|--------|
| `backend/atlas.sqlite` | 0-byte placeholder; real DB is `db/atlas.sqlite` (git-ignored) |
| `frontend/src/assets/hero.png` | Unused |
| `frontend/src/assets/react.svg` | Unused |
| `frontend/src/assets/vite.svg` | Unused |
| `backend/server.js` (monolith) | Split into `src/` modules |
| `backend/db.js` (monolith) | Split into `src/db/` modules |

---

## 9. Files Created

| File | Purpose |
|------|---------|
| `frontend/src/api/client.js` | Shared API client (37 LOC) |
| `frontend/src/components/layout/Sidebar.jsx` | Extracted sidebar (66 LOC) |
| `backend/src/config/index.js` | Centralized config + secrets (50 LOC) |
| `backend/src/config/passport.js` | OAuth strategy setup |
| `backend/src/db/index.js` | SQLite singleton connection |
| `backend/src/db/schema.js` | 28 tables (371 LOC) |
| `backend/src/db/seed.js` | Seed data (380 LOC) |
| `backend/src/middleware/audit.js` | Audit log middleware |
| `backend/src/middleware/rateLimit.js` | Rate limiting |
| `backend/src/routes/*.routes.js` | 7 route modules |
| `backend/src/services/*.service.js` | 3 service modules |
| `backend/src/utils/validators.js` | Input validation |
| `backend/src/scripts/reset-db.js` | DB reset script |
| `backend/.env.example` | Env var template |
| `frontend/.env.example` | Env var template |
| `docs/file-structure.md` | Canonical annotated tree |

---

## 10. Import / Path Updates

- **All 51+ fetch call sites** in frontend components: converted from `fetch(\`${API_BASE}/path\`, ...)` to `apiFetch('/path', { token, ...init })`
- **`App.jsx`**: all imports updated to `./components/{feature}/{Component}`; `API_BASE` removed; inline sidebar markup replaced with `<Sidebar />`
- **All feature components**: `import ... from '../Component'` → `import ... from '../../api/client'` (plus correct relative paths to other feature components where applicable)
- **No stale imports remain**: verified via `rg` grep across entire repo

---

## 11. Validation Results

| Check | Result |
|-------|--------|
| Backend `node --check` (all 22 src files) | ✅ PASS |
| Backend boot (all routes wired, /api/health OK) | ✅ PASS |
| Backend login guard (empty creds → proper 400) | ✅ PASS |
| `npm run build -w frontend` (Vite 8.2.0) | ✅ PASS (2,657 modules, 641 KB, 265ms) |
| `npx oxlint` | ✅ EXIT 0 — 107 warnings, 0 errors (all pre-existing in unchanged files) |
| Stale import scan (`rg` for old paths) | ✅ No stale references |
| Docs consistency scan (better-sqlite3, old monolith refs) | ✅ All corrected |
| Backend smoke (health + login validation) | ✅ POST `/api/health` → `{"status":"ok"}`, empty creds → `{"error":"Missing credentials payload."}` |

---

## 12. Remaining Issues / Known Debt

### Critical (pre-existing — must fix before production)

| ID | Issue | Location | Status |
|----|-------|----------|--------|
| TD-01 | Hardcoded fallback JWT/session secrets | `src/config/index.js` | Open — behavior preserved intentionally during restructure |
| TD-02 | OAuth tokens passed as URL query params | OAuth callback routes | Open |
| TD-03 | GitHub OAuth redirect hardcoded to `localhost:5173` | OAuth callback routes | Open |
| TD-04 | Plaintext seed passwords (not bcrypt hashed) | `src/db/seed.js` | Open |
| TD-08 | No test suite (zero unit/integration/e2e) | Entire repo | Open |

### High

| ID | Issue | Status |
|----|-------|--------|
| TD-09 | No ESLint config; only oxlint with React rules | Open |
| TD-11 | Compiler is keyword-match simulator (`code.includes('TrieNode')`) | Open — AI_SIM prototype |
| TD-12 | Dashboard analytics (streak, weeklyHours, topicMastery) are hardcoded/mocked | Open |

### Documentation Follow-up

| Item | Status |
|------|--------|
| `docs/architecture.md` | Updated (current-state sections corrected) |
| `docs/memory.md` | Updated (§13, §15, §16, §20, §29 corrected) |
| `docs/file-structure.md` | Created |
| `intro.txt` | Updated (structure tree) |
| `README.md` | Updated (structure tree, start commands, .env.example note) |
| Full lint-fix pass for pre-existing 107 warnings | Not performed — deferred to avoid churn in restructure PR |

---

*Generated: Sep 4 2026 | Branch: `dev` | Verdict: NEEDS HARDENING*