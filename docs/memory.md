# Atlas — Memory: Persistent Working Memory

**Document Status:** Living memory — updated as the project evolves.
**Last Updated:** 2026-09-04
**Source-of-Truth Hierarchy:** PRD.md > architecture.md > design.md > rules.md > Memory.md > intro.txt
**Owner:** TechInfinit Studio / Abhi
**Branch:** `dev` (active work); `main` also exists.

> **What this document is:** A single, durable source for anything a future developer or AI agent needs to know that is NOT captured in a code file. Grounded entirely in what actually exists in this repository — never fabricated.

---

## Table of Contents

1. [Document Information](#1-document-information)
2. [Source of Truth Hierarchy](#2-source-of-truth-hierarchy)
3. [Project Identity](#3-project-identity)
4. [Current Build State](#4-current-build-state)
5. [Repository Structure](#5-repository-structure)
6. [Git History & Branch State](#6-git-history--branch-state)
7. [Key Decisions Log](#7-key-decisions-log)
8. [Known Issues & Tech Debt](#8-known-issues--tech-debt)
9. [Security Findings](#9-security-findings)
10. [What Works Today](#10-what-works-today)
11. [What Does NOT Work Today](#11-what-does-not-work-today)
12. [AI Integration Status](#12-ai-integration-status)
13. [Database Status](#13-database-status)
14. [Authentication & Authorization](#14-authentication--authorization)
15. [Frontend Status](#15-frontend-status)
16. [Backend Status](#16-backend-status)
17. [Admin Center (ACC) Status](#17-admin-center-acc-status)
18. [Deployment & Environments](#18-deployment--environments)
19. [Documentation Status](#19-documentation-status)
20. [File Inventory](#20-file-inventory)
21. [Active Working Context](#21-active-working-context)
22. [Recent Changes](#22-recent-changes)
23. [Open Questions](#23-open-questions)
24. [Blockers](#24-blockers)
25. [Next Actions](#25-next-actions)
26. [Phase Progress](#26-phase-progress)
27. [Quality Gates](#27-quality-gates)
28. [Refactoring Needs](#28-refactoring-needs)
29. [External Dependencies](#29-external-dependencies)
30. [Testing Status](#30-testing-status)
31. [Configuration Files](#31-configuration-files)
32. [Conflict Register](#32-conflict-register)
33. [Changelog](#33-changelog)
34. [Owner & Contacts](#34-owner--contacts)
35. [Appendices](#35-appendices)

---

## 1. Document Information

| Field | Value |
|-------|-------|
| Document Type | Persistent Working Memory |
| Document Status | Living — updated as project evolves |
| Last Updated | 2026-09-04 |
| Version | 0.1 |
| Source of Truth Hierarchy | PRD.md > architecture.md > design.md > rules.md > Memory.md > intro.txt |
| Related Documents | PRD.md · architecture.md · design.md · rules.md · phases.doc.md · intro.txt · todo |

---

## 2. Source of Truth Hierarchy

| Rank | Document | Authority |
|------|----------|-----------|
| 1 | `PRD.md` (3,262 lines) | Product requirements and scope — overrides all others |
| 2 | `architecture.md` (2,571 lines) | Technical architecture and system design |
| 3 | `design.md` (814 lines) | Visual identity, UI/UX, component contracts |
| 4 | `rules.md` (2,247 lines) | Engineering constraints — every PR must comply |
| 5 | **`memory.md`** (this doc) | Persistent working memory — decisions, context, status |
| 6 | `intro.txt` (1,418 lines) | Onboarding narrative; updated when major facts change |

When this document conflicts with another doc, the conflict is **recorded here** (see §32 Conflict Register), never silently resolved.

---

## 3. Project Identity

| Field | Value |
|-------|-------|
| Product Name | Atlas |
| Tagline | "Learn Like an Engineer. Build Like an Engineer. Get Hired Like an Engineer." |
| Studio | TechInfinit Studio |
| Version | 0.2 Alpha |
| Category | AI-powered software engineering learning ecosystem |
| Core Philosophy | Engineering-first: LEARN → THINK → PLAN → BUILD → DEBUG → TEST → OPTIMIZE → REFLECT → PROVE → GROW |
| NOT a clone of | LeetCode · HackerRank · video-course platform · generic coding playground · AI chatbot |
| Central Idea | Teach learners how software engineering work actually happens, not just algorithms |

---

## 4. Current Build State

**Phase:** Early MVP — Phase 1–4 partially complete. The app boots, auth works, dashboard renders, navigation connects all major views, and the Admin Center has partial functional modules. Most features behind nav items are **UI shells with mock/simulated data** — not real implementations.

| Metric | Value |
|--------|-------|
| Frontend JSX files | 20 |
| Frontend component LOC | ~5,868 |
| Frontend shared API client | `src/api/client.js` (37 lines) |
| Backend `src/` files | 22 (modular, split from 2 monoliths) |
| Backend `src/` LOC | 2,598 |
| Database tables | 28 |
| API routes | 46 |
| CSS lines (index.css) | 2,916 |
| Git commits | 9 (Aug 3–4, 2026 + Sep 4, 2026) |
| Active branch | `dev` |

---

## 5. Repository Structure

```
/Users/abhi/Spellora/Atlas/          ← root (npm workspaces monorepo)
├── package.json                      ← root workspace config (frontend + backend)
├── README.md                         ← v0.2 Alpha, TechInfinit Studio
├── intro.txt                         ← project philosophy & context (1,418 lines)
├── todo                              ← progress tracker (885 lines)
├── .gitignore                        ← node_modules/, .env, *.sqlite, *.db, .DS_Store
│
├── docs/
│   ├── PRD.md                        ← 3,262 lines
│   ├── architecture.md               ← 2,571 lines
│   ├── design.md                     ← 814 lines (33 sections)
│   ├── rules.md                      ← 2,247 lines (66 sections)
│   ├── phases.doc.md                 ← 971 lines (18-phase roadmap)
│   ├── memory.md                     ← THIS DOCUMENT
│   └── Doc *.pdf / PRD *.pdf         ← legacy PDF docs (not authoritative)
│
├── frontend/
│   ├── package.json                  ← react ^19.2.8, lucide-react ^1.28.0, vite 8.2.0
│   ├── .env                          ← VITE_API_BASE_URL (key only)
│   ├── index.html                    ← Google Fonts: Outfit + JetBrains Mono
│   ├── vite.config.js
│   ├── vercel.json                   ← SPA rewrite: /(.*) → /index.html
│   └── src/
│       ├── index.css                 ← 2,916 lines — all styles, tokens, animations
│       ├── main.jsx                  ← React 19 createRoot
│       ├── api/
│       │   └── client.js             ← shared API client: apiFetch + apiUrl (sole VITE_API_BASE_URL owner)
│       ├── App.jsx                   ← hash-based manual routing, AuthProvider, <Sidebar />
│       └── components/               ← feature folders (all import via ../../api/client)
│           ├── layout/
│           │   └── Sidebar.jsx       ← extracted nav (activeTab, onNavigate, user, profile, onAdmin, onResetSession)
│           ├── dashboard/
│           │   └── Dashboard.jsx     ← 705 lines — main dashboard
│           ├── admin/
│           │   └── AdminCenter.jsx   ← 709 lines — 12 module ACC
│           ├── mission/
│           │   └── MissionIDE.jsx    ← 372 lines — code workspace
│           ├── passport/
│           │   └── Passport.jsx      ← 167 lines — engineering passport
│           ├── career/
│           │   └── CareerVault.jsx   ← 217 lines — portfolio
│           ├── practice/
│           │   └── LogicPractice.jsx ← 213 lines — practice problems
│           ├── onboarding/
│           │   └── Onboarding.jsx    ← 385 lines — post-login wizard
│           ├── learn/
│           │   ├── LearnHub.jsx      ← 416 lines — learning tracks
│           │   ├── LessonViewer.jsx  ← 364 lines — lesson detail view
│           │   └── FlashCard.jsx     ← 133 lines — revision flashcards
│           ├── settings/
│           │   └── AccountSettings.jsx ← 425 lines — profile & security settings
│           └── auth/
│               ├── Login.jsx         ← OAuth redirects via apiUrl('/auth/{provider}')
│               ├── Register.jsx
│               ├── OnboardingWizard.jsx
│               ├── AuthSuccess.jsx
│               ├── ForgotPassword.jsx
│               ├── ResetPassword.jsx
│               └── VerifyEmail.jsx
│
├── backend/
│   ├── package.json                  ← express, passport, sqlite, bcryptjs, jsonwebtoken, uuid, @google/generative-ai
│   ├── .env                          ← PORT, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, GEMINI_API_KEY, GOOGLE_*, GITHUB_*
│   ├── .env.example                  ← template of all env vars
│   └── src/
│       ├── server.js                 ← entry point (node src/server.js)
│       ├── app.js                    ← createApp() factory + /api/health
│       ├── config/
│       │   └── index.js              ← settings + secret fallbacks (centralized)
│       ├── db/
│       │   ├── index.js             ← db access helper (database.ts pattern)
│       │   ├── schema.js            ← 28 tables
│       │   └── seed.js              ← demo users + seed data
│       ├── middleware/
│       │   ├── auth.js             ← authenticateToken + authorizeRoles (JWT + RBAC)
│       │   ├── audit.js            ← audit log middleware
│       │   └── rateLimit.js        ← rate limiting
│       ├── routes/                 ← 1 module per resource (auth, users, admin, dashboard, learning, mentor, missions)
│       ├── services/
│       │   ├── ai.service.js       ← Gemini mentor + hardcoded fallbacks (AI_SIM)
│       │   ├── auth.service.js     ← JWT/session/OAuth logic
│       │   └── compiler.service.js ← mission code simulation (AI_SIM)
│       ├── utils/
│       │   └── validators.js       ← email/password validation
│       └── scripts/
│           └── reset-db.js         ← npm run db:reset
│
└── db/
    └── atlas.sqlite                  ← actual database file (git-ignored, re-seeds)
```

**Note:** the former monoliths are gone — `backend/server.js` (1,589 LOC) and `backend/db.js` (779 LOC) were split into the modular `backend/src/` tree above. The 0-byte `backend/atlas.sqlite` placeholder no longer exists.

---

## 6. Git History & Branch State

### Branches

| Branch | Status |
|--------|--------|
| `dev` | Active development branch (current) |
| `main` | Stable branch |

### Commit Log (chronological)

| Hash | Date | Message |
|------|------|---------|
| `376a26a` | 2026-08-03 | feat: implement Phase 1 authentication, JWT sessions, SQLite integration, post-login onboarding wizard, security settings workspace, and updated favicon logo |
| `60d1183` | 2026-08-03 | readme added |
| `76d3be5` | 2026-08-03 | google auth and git auth added and also fixed db bugs |
| `ccc19c4` | 2026-08-03 | minor fixes |
| `1336e71` | 2026-08-03 | Added /admin URL route and vercel SPA configuration |
| `61145c8` | 2026-08-04 | Fix hardcoded oauth callback urls |
| `f072265` | 2026-08-04 | Fix broken auth fetch urls |
| `e27480e` | 2026-08-04 | Fix keypad login route |
| `1f92945` | 2026-09-04 | Add initial TODO & Progress Tracker for Atlas MVP development |

---

## 7. Key Decisions Log

| # | Date | Decision | Rationale | Doc Ref |
|---|------|----------|-----------|---------|
| D-01 | 2026-08-03 | Use SQLite for MVP | Zero-config, single-file, sufficient for alpha/prototype | architecture.md §5 |
| D-02 | 2026-08-03 | Hash-based manual routing (no React Router) | Simplicity, no extra dependency, full control | App.jsx |
| D-03 | 2026-08-03 | JWT access + refresh token auth | Stateless, scalable, standard pattern | server.js |
| D-04 | 2026-08-03 | Google Gemini for AI mentor | Free tier available, function-calling support | server.js |
| D-05 | 2026-08-03 | Neon cyberpunk visual theme | Differentiating aesthetic, engineering identity | design.md §1 |
| D-06 | 2026-08-03 | All styles in single index.css (2,916 lines) | Consolidated design system, single source of truth for tokens | design.md §6 |
| D-07 | 2026-08-03 | Empty App.css intentionally | Prevent style interference; all styles in index.css | frontend/src/App.css |
| D-08 | 2026-08-03 | lucide-react ^1.28.0 | Icon library — NOTE: atypical vs upstream (0.4xx range) | frontend/package.json |
| D-09 | 2026-08-04 | SPA rewrite in vercel.json | Required for hash routing on Vercel | frontend/vercel.json |
| D-10 | 2026-08-04 | OAuth tokens passed via URL query params | Simplicity for MVP; **SECURITY CONCERN** — see §9 | server.js |

---

## 8. Known Issues & Tech Debt

### Critical (must fix before any production deploy)

| ID | Issue | Location | Severity |
|----|-------|----------|----------|
| TD-01 | **Hardcoded JWT/session fallback secrets** — `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` have hardcoded fallback strings if env vars are missing (centralized during refactor, unchanged behavior) | `src/config/index.js` | 🔴 Critical |
| TD-02 | **Tokens passed via URL query params** (`?accessToken=...&refreshToken=...`) — logged in browser history, referrer headers, server logs | `src/`, OAuth callback | 🔴 Critical |
| TD-03 | **GitHub OAuth hardcoded redirect** to `localhost:5173` — will break in any non-local environment | `src/` | 🔴 Critical |
| TD-04 | **Plaintext passwords in seed data** — demo users have passwords stored as plain strings (not bcrypt hashed) | `src/db/seed.js` | 🔴 Critical |
| TD-05 | No `.env.example` file — new contributors have no reference for required env vars | **RESOLVED** — `backend/.env.example` + `frontend/.env.example` added | ✅ Done |

### High

| ID | Issue | Location |
|----|-------|----------|
| TD-06 | Monolithic `server.js` (1,589 lines) — all routes in one file | **RESOLVED** — split into 22 modules in `backend/src/` |
| TD-07 | Monolithic `db.js` (779 lines) — schema + seed in one file | **RESOLVED** — split into `src/db/{index,schema,seed}.js` |
| TD-08 | No test suite exists — zero unit, integration, or e2e tests | Entire repo |
| TD-09 | No ESLint config — only `oxlint` with react rules | Root |
| TD-10 | Duplicate `backend/atlas.sqlite` (0 bytes) — confusing vs actual `db/atlas.sqlite` | **RESOLVED** — placeholder deleted |
| TD-11 | Compiler is keyword-match simulator (`code.includes('TrieNode')`), not a real compiler — awards +800 XP | `components/mission/MissionIDE.jsx` |
| TD-12 | Dashboard `streak: 5` is hardcoded, analytics (weeklyHours, monthlyXp, topicMastery) are mocked arrays | `components/dashboard/Dashboard.jsx` |

### Medium

| ID | Issue | Location |
|----|-------|----------|
| TD-13 | `docs/*.pdf` and `PRD 0.1.pdf` are legacy/untracked — should be cleaned up or archived | `docs/` |
| TD-14 | Admin Center 51 menu items but only ~12 have any rendered content; ~39 show placeholder text | `components/admin/AdminCenter.jsx` |
| TD-15 | Roles have inconsistent naming: `Student` (capitalized), `jr architect` (lowercase with space), `guider`, `mentor`, `admin`, `super admin` | `db.js` seed → `src/db/seed.js` |
| TD-16 | No error boundaries in React components | Frontend |
| TD-17 | No loading skeletons — most views show no loading state | Frontend |

---

## 9. Security Findings

| # | Finding | Severity | Location | Status |
|---|---------|----------|----------|--------|
| SEC-01 | Hardcoded JWT fallback secrets in server.js — if `.env` is missing, app runs with known secrets | 🔴 Critical | `server.js` | Open |
| SEC-02 | OAuth tokens passed as URL query parameters — exposed in browser history, referrer headers, access logs | 🔴 Critical | `server.js` OAuth callback | Open |
| SEC-03 | GitHub OAuth redirect URI hardcoded to `localhost:5173` — will fail in production | 🔴 Critical | `server.js` | Open |
| SEC-04 | Plaintext passwords in seed data — not bcrypt hashed | 🔴 Critical | `db.js` seed | Open |
| SEC-05 | No rate limiting on any endpoint | 🟡 High | `server.js` | Open |
| SEC-06 | No CSRF protection | 🟡 High | `server.js` | Open |
| SEC-07 | No input validation/sanitization on most endpoints | 🟡 High | `server.js` | Open |
| SEC-08 | `.gitignore` blocks `.env` — correct; no secrets committed | ✅ Fixed | `.gitignore` | Closed |

---

## 10. What Works Today

### Authentication
- ✅ Local registration (email + password)
- ✅ Local login (email + password)
- ✅ Google OAuth flow (redirect-based)
- ✅ GitHub OAuth flow (redirect-based)
- ✅ JWT access + refresh token issuance
- ✅ Token refresh via `/api/auth/refresh`
- ✅ Logout (client-side token clear)
- ✅ Post-login onboarding wizard
- ✅ Forgot password / reset password flow (UI + API)
- ✅ Email verification flow (UI + API)

### Navigation & Views
- ✅ Hash-based routing across all major views
- ✅ Dashboard renders with user greeting, quick actions, stats cards
- ✅ LearnHub shows tracks/modules/topics
- ✅ LessonViewer shows lesson content
- ✅ MissionIDE renders with code editor (CodeMirror)
- ✅ Passport renders engineering passport
- ✅ CareerVault renders portfolio
- ✅ LogicPractice renders practice problems
- ✅ FlashCard renders revision cards
- ✅ AccountSettings renders profile & security tabs
- ✅ Admin Center renders with 12 module categories

### Backend
- ✅ Express server starts and serves API
- ✅ SQLite database initializes with 28 tables
- ✅ Seed data populates demo users, tracks, modules, topics, lessons
- ✅ CRUD for lessons, topics, modules, tracks
- ✅ CRUD for security tags (`/api/tags`)
- ✅ User list endpoint (`/api/users`) with role update (`PUT /api/users/:id/role`)
- ✅ Audit log endpoint (`/api/audit-logs`)
- ✅ Chat messages endpoint (`/api/chat-messages`)
- ✅ Missions endpoint (`/api/missions`)
- ✅ AI mentor chat endpoint (`/api/ai/mentor`) with Gemini integration
- ✅ Compiler execution endpoint (`/api/compiler/execute`) — keyword-match simulation
- ✅ Onboarding state persistence (`/api/onboarding/state`)

### Design System
- ✅ Full cyberpunk dark theme implemented in `index.css`
- ✅ Outfit (UI) + JetBrains Mono (code) fonts loaded via Google Fonts
- ✅ 7 neon accent colors with semantic meanings
- ✅ `.glass-panel`, `.neon-btn`, `.nav-item` canonical component classes
- ✅ 5 glow tokens, pulse-neon/scanning keyframes
- ✅ 3 responsive breakpoints (768/1024/1200px)

---

## 11. What Does NOT Work Today

### Functional Gaps
- ❌ **Compiler is NOT a real compiler** — keyword-match simulator awards XP for code containing specific strings
- ❌ **Dashboard analytics are mocked** — streak hardcoded to 5, charts show static arrays
- ❌ **AI mentor responses are mostly hardcoded fallbacks** — Gemini works only if `GEMINI_API_KEY` is set; otherwise returns static "Cognitive Guide" text
- ❌ **No real test execution** — no hidden test runner, no test case validation
- ❌ **No real adaptive learning** — no recommendation engine, no difficulty adjustment
- ❌ **No real gamification** — XP is awarded but not persisted or displayed meaningfully
- ❌ **No real engineering passport** — passport view renders but has no real data pipeline
- ❌ **No real notifications** — notification bell exists but no real notification system
- ❌ **No real calendar/scheduling** — calendar events table exists but no UI or logic
- ❌ **No real email sending** — forgot password / verify email flows exist but email transport is not configured

### Admin Center (ACC) Gaps
- ❌ 39 of 51 menu items render only placeholder text ("Coming soon", "Under development")
- ❌ Dashboard overview/status show mock data (not real system metrics)
- ❌ Compiler diagnostics show mock data
- ❌ Flags modules are local state toggles (not persisted)
- ❌ Learning content management, analytics, security audit, system health — all mock/placeholder

---

## 12. AI Integration Status

| Component | Status | Details |
|-----------|--------|---------|
| Provider | Google Gemini | `gemini-1.5-flash` model |
| API Key | Required in `GEMINI_API_KEY` env var | If missing, hardcoded fallback mentor responses are used |
| System Instruction | "Cognitive Guide" | Defined in `src/config/index.js` |
| Endpoint | `POST /api/ai/mentor` | Accepts message history, returns AI response |
| Fallback | Hardcoded responses | "I'm here to guide you..." type messages |
| Function Calling | Not implemented yet | PRD calls for tool-use (compile, hint, simplify) — not built |
| Streaming | Not implemented | PRD calls for streaming responses — not built |
| Cost Controls | None | No token limits, no rate limiting on AI endpoint |

---

## 13. Database Status

**Engine:** SQLite via `sqlite` (async promise wrapper) over the `sqlite3` driver
**File:** `db/atlas.sqlite` (git-ignored runtime DB, re-seeds via `npm run db:reset`)
**Schema defined in:** `backend/src/db/schema.js` (28 tables; split from the old 779-line `db.js`)
**Seed data in:** `backend/src/db/seed.js` (5 demo users, learning tracks, missions, notifications)
**Connection setup in:** `backend/src/db/index.js` (resolves `DATABASE_PATH`, default `../db/atlas.sqlite`)

### Table Count: 28

| Category | Tables |
|----------|--------|
| Auth & Users | `users`, `profiles`, `sessions`, `oauth_accounts`, `email_verifications`, `password_resets`, `refresh_tokens`, `audit_logs` |
| Learning | `learning_tracks`, `learning_modules`, `learning_topics`, `lessons`, `lesson_contents`, `lesson_resources`, `lesson_progress`, `lesson_notes`, `lesson_bookmarks`, `revision_queue` |
| Missions & Chat | `missions`, `chat_messages`, `learning_sessions` |
| Dashboard & Prefs | `user_goals`, `notifications`, `calendar_events`, `activity_logs`, `learning_recommendations`, `dashboard_preferences` |
| Admin | `security_tags` |

### Seed Data (5 demo users)

| ID | Name | Email | Password | Role |
|----|------|-------|----------|------|
| `usr_1` | Abhi | (in db.js) | plaintext | `jr architect` |
| `usr_2` | Sarah | (in db.js) | plaintext | `mentor` |
| `usr_3` | Vikram | (in db.js) | plaintext | `guider` |
| `usr_4` | Elena | (in db.js) | plaintext | `admin` |
| `usr_5` | Alex | (in db.js) | plaintext | `super admin` |

**Note:** Role values use inconsistent casing and contain spaces. This is a known issue (TD-15).

### Seed Learning Data
- 6 learning tracks
- 2 learning modules
- 2 learning topics
- 3 lessons with content, resources, quiz questions, and flashcards

---

## 14. Authentication & Authorization

### Auth Flow
1. User registers (email + password) → bcrypt hash → stored in `users` table
2. User logs in → password verified → JWT access token (15 min) + refresh token (7 days) issued
3. Tokens stored in `localStorage`: `atlas_access_token`, `atlas_refresh_token`, `atlas_session_id`, `atlas_mission_completed`
4. API calls include `Authorization: Bearer <accessToken>` header
5. Token refresh via `POST /api/auth/refresh` with refresh token
6. OAuth (Google/GitHub) → redirect to provider → callback with tokens in URL query params → stored in localStorage

### OAuth Callback (security concern)
- Tokens are passed as URL query parameters: `?accessToken=...&refreshToken=...`
- `AuthSuccess.jsx` reads tokens from `window.location.search`
- This exposes tokens in browser history, referrer headers, and server access logs

### Authorization
- No role-based access control (RBAC) middleware
- Admin Center is accessible to any authenticated user (no server-side gate)
- `PUT /api/users/:id/role` has no authorization check
- All API endpoints are effectively open to any authenticated user

---

## 15. Frontend Status

### Framework & Tooling
- React 19.2.8 (latest)
- Vite 8.2.0 (latest)
- lucide-react ^1.28.0 (atypical version — upstream is 0.4xx)
- highlight.js + react-markdown + rehype-highlight (for markdown code rendering)
- No React Router — manual hash-based routing in `App.jsx`

### Component Inventory (20 JSX files)

| Component | LOC | Purpose | Data Source |
|-----------|-----|---------|-------------|
| `App.jsx` | 471 | Root — hash routing, AuthProvider, all routes | — |
| `layout/Sidebar.jsx` | 66 | Sidebar nav | props (user, profile) |
| `dashboard/Dashboard.jsx` | 696 | Main dashboard | Mock data + API |
| `admin/AdminCenter.jsx` | 705 | Admin control center (12 modules) | Mix of real API + mock |
| `mission/MissionIDE.jsx` | 370 | Code workspace | Mock missions + compiler API |
| `learn/LearnHub.jsx` | 404 | Learning tracks browser | API (`/api/tracks`) |
| `learn/LessonViewer.jsx` | 349 | Lesson detail | API (`/api/lessons`) |
| `onboarding/Onboarding.jsx` | 385 | Post-login wizard | API (`/api/onboarding`) |
| `career/CareerVault.jsx` | 217 | Portfolio | Mock |
| `practice/LogicPractice.jsx` | 213 | Practice problems | Mock |
| `passport/Passport.jsx` | 167 | Engineering passport | Mock |
| `learn/FlashCard.jsx` | 133 | Revision flashcards | Mock |
| `settings/AccountSettings.jsx` | 416 | Profile & security | API (`/api/users`) |
| `auth/Login.jsx` | 164 | Login form | API (`/api/auth/login`) |
| `auth/Register.jsx` | 321 | Registration form | API (`/api/auth/register`) |
| `auth/OnboardingWizard.jsx` | 260 | Initial onboarding | API |
| `auth/AuthSuccess.jsx` | 54 | OAuth callback handler | URL query params |
| `auth/ForgotPassword.jsx` | 100 | Password reset request | API |
| `auth/ResetPassword.jsx` | 212 | Password reset form | API |
| `auth/VerifyEmail.jsx` | 155 | Email verification | API |
| `api/client.js` | 37 | Shared API client (apiFetch + apiUrl) | — |

### Design Tokens (from index.css)
- **Background:** `#06060a` (near-black)
- **Surface:** `#0d0d12`
- **Card:** `#12121a`
- **Borders:** `#1e1e2e`
- **Text Primary:** `#e4e4f0`
- **Text Muted:** `#73739b`
- **7 Neon Accents:** `#ff5722` (primary), `#22d3ee` (cyan), `#a78bfa` (violet), `#34d399` (green), `#fbbf24` (amber), `#f472b6` (pink), `#60a5fa` (blue)
- **Glow Tokens:** `--glow-primary`, `--glow-cyan`, `--glow-violet`, `--glow-green`, `--glow-amber`
- **Keyframes:** `glow-pulse`, `scanning`, `pulse-neon`
- **Typography:** Outfit (UI headings/body), JetBrains Mono (code)
- **Grid:** 30px dot grid background
- **Panel:** `.glass-panel` — `backdrop-filter: blur(12px)`, `border-radius: 12px`
- **Button:** `.neon-btn` — signature CTA with glow hover
- **Nav:** `.nav-item` — sidebar navigation items

---

## 16. Backend Status

### Stack
- Express 4
- sqlite (async promise wrapper) over sqlite3 driver
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- passport + passport-google-oauth20 + passport-github2 (OAuth)
- @google/generative-ai (Gemini)
- uuid (ID generation)

### server.js Route Map (40 endpoints)

| Category | Routes |
|----------|--------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/google`, `GET /api/auth/google/callback`, `GET /api/auth/github`, `GET /api/auth/github/callback` |
| Password | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Email | `POST /api/auth/verify-email`, `GET /api/auth/verify-email/:token` |
| Users | `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `PUT /api/users/:id/role` |
| Onboarding | `GET /api/onboarding/state`, `POST /api/onboarding/state` |
| Tracks | `GET /api/tracks`, `POST /api/tracks`, `GET /api/tracks/:id`, `PUT /api/tracks/:id`, `DELETE /api/tracks/:id` |
| Modules | `GET /api/modules`, `POST /api/modules`, `GET /api/modules/:id`, `PUT /api/modules/:id`, `DELETE /api/modules/:id` |
| Topics | `GET /api/topics`, `POST /api/topics`, `GET /api/topics/:id`, `PUT /api/topics/:id`, `DELETE /api/topics/:id` |
| Lessons | `GET /api/lessons`, `POST /api/lessons`, `GET /api/lessons/:id`, `PUT /api/lessons/:id`, `DELETE /api/lessons/:id` |
| Tags | `GET /api/tags`, `POST /api/tags`, `PUT /api/tags/:id`, `DELETE /api/tags/:id` |
| Missions | `GET /api/missions`, `POST /api/missions` |
| Chat | `GET /api/chat-messages`, `POST /api/chat-messages` |
| AI | `POST /api/ai/mentor` |
| Compiler | `POST /api/compiler/execute` |
| Audit | `GET /api/audit-logs` |

---

## 17. Admin Center (ACC) Status

**File:** `AdminCenter.jsx` (709 lines)
**Structure:** 12 categories, 51 menu items in a sidebar accordion

### Module Status

| Category | Menu Items | Functional? | Details |
|----------|-----------|-------------|---------|
| Dashboard | overview, status | ⚠️ Partial | Renders mock data (user count, active missions, etc.) |
| User Management | students, mentors, admins, roles | ⚠️ Partial | students/mentors/admins filter real user list from API; roles has Security Tags CRUD |
| Learning Content | tracks, modules, lessons, quizzes | ❌ No | Placeholder text |
| Missions & Compiler | active, completed, diagnostics | ❌ No | Mock data in diagnostics |
| Analytics & Reports | overview, user-growth, engagement | ❌ No | Placeholder text |
| Security Audit | overview, tags, flags, permissions | ⚠️ Partial | Security Tags: real CRUD via `/api/tags`; flags: local state toggles; permissions: placeholder |
| System Health | overview, logs, cache, maintenance | ⚠️ Partial | system-logs renders mock stream; others placeholder |
| AI & Automation | mentor-config, prompts, training | ❌ No | Placeholder text |
| Notifications | templates, history, settings | ❌ No | Placeholder text |
| Platform Config | general, themes, branding | ❌ No | Placeholder text |
| Integrations | api-keys, webhooks, services | ❌ No | Placeholder text |
| Advanced | database, developer, backup | ❌ No | Placeholder text |

---

## 18. Deployment & Environments

| Environment | Status | URL |
|-------------|--------|-----|
| Local dev | Working | `http://localhost:5173` (frontend), `http://localhost:3000` (backend) |
| Vercel (frontend) | Configured | `vercel.json` SPA rewrite present |
| Production | Not deployed | — |
| Staging | Not configured | — |

### Environment Variables Required

**Frontend** (`frontend/.env`):
- `VITE_API_BASE_URL` — backend API base URL

**Backend** (`backend/.env`):
- `PORT` — server port
- `ACCESS_TOKEN_SECRET` — JWT access token secret
- `REFRESH_TOKEN_SECRET` — JWT refresh token secret
- `GEMINI_API_KEY` — Google Gemini API key
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `GOOGLE_CALLBACK_URL` — Google OAuth callback URL
- `GITHUB_CLIENT_ID` — GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth client secret
- `GITHUB_CALLBACK_URL` — GitHub OAuth callback URL

**Note:** No `.env.example` file exists (TD-05).

---

## 19. Documentation Status

| Document | Lines | Sections | Status | Completeness |
|----------|-------|----------|--------|--------------|
| `PRD.md` | 3,262 | — | ✅ Complete | Full product requirements |
| `architecture.md` | 2,571 | — | ✅ Complete | Full system architecture |
| `design.md` | 814 | 33 | ✅ Complete | Full design system spec |
| `rules.md` | 2,247 | 66 | ✅ Complete | Full engineering rules |
| `phases.doc.md` | 971 | 35 | ✅ Complete | 18-phase roadmap |
| `memory.md` | This doc | 35 | ✅ Complete | Persistent working memory |
| `README.md` | — | — | ✅ Exists | v0.2 Alpha overview |
| `intro.txt` | 1,418 | 10 | ✅ Complete | Project philosophy |
| `todo` | 885 | — | ✅ Exists | Progress tracker |
| `.env.example` | — | — | ❌ Missing | Needed (TD-05) |

---

## 20. File Inventory

### Critical Files (frequently modified)

| File | LOC | Purpose |
|------|-----|---------|
| `backend/src/server.js` | 16 | Entry point — boots createApp() |
| `backend/src/app.js` | 45 | createApp() factory, /api/health, middleware wiring |
| `backend/src/routes/*.routes.js` | 7 modules | One route module per resource |
| `backend/src/db/schema.js` | 371 | All CREATE TABLE definitions (28 tables) |
| `backend/src/db/seed.js` | 380 | Seed data (demo users, tracks, missions) |
| `backend/src/config/index.js` | 50 | config + secrets fallbacks + paths |
| `frontend/src/App.jsx` | 471 | Root component, routing, auth provider |
| `frontend/src/components/layout/Sidebar.jsx` | 66 | Sidebar nav |
| `frontend/src/api/client.js` | 37 | Shared API client (apiFetch + apiUrl) |
| `frontend/src/components/dashboard/Dashboard.jsx` | 696 | Main dashboard view |
| `frontend/src/components/admin/AdminCenter.jsx` | 705 | Admin control center |
| `frontend/src/index.css` | 2,916 | All styles, tokens, animations |

### Config Files

| File | Purpose |
|------|---------|
| `package.json` (root) | npm workspaces config |
| `frontend/package.json` | Frontend dependencies |
| `backend/package.json` | Backend dependencies |
| `frontend/vite.config.js` | Vite build config |
| `frontend/vercel.json` | Vercel SPA rewrite |
| `.gitignore` | Ignored files |

---

## 21. Active Working Context

**Current Task:** Creating `docs/memory.md` (this document)
**Branch:** `dev`
**Last User Request:** "Continue if you have next steps" — proceed with writing memory.md

**Files Under Active Work:**
- `docs/memory.md` — being created

**Variables/Values in Active Use:**
- All env var key names documented in §18
- All API routes documented in §16
- All DB tables documented in §13

---

## 22. Recent Changes

| Date | Change | Commit |
|------|--------|--------|
| 2026-09-04 | Added TODO & Progress Tracker | `1f92945` |
| 2026-09-04 | Created docs/PRD.md, architecture.md, design.md, rules.md, phases.doc.md, memory.md | (untracked, not committed) |
| 2026-08-04 | Fixed hardcoded OAuth callback URLs | `61145c8` |
| 2026-08-04 | Fixed broken auth fetch URLs | `f072265` |
| 2026-08-04 | Fixed keypad login route | `e27480e` |
| 2026-08-03 | Phase 1 implementation: auth, JWT, SQLite, onboarding, admin route | `376a26a`, `1336e71` |

---

## 23. Open Questions

| # | Question | Impact | Status |
|---|----------|--------|--------|
| Q-01 | Should the monolithic `server.js` be split into route modules before adding more features? | Architecture | Open |
| Q-02 | Should we migrate from SQLite to PostgreSQL for production? | Infrastructure | Open |
| Q-03 | Should OAuth token passing be switched from query params to HTTP-only cookies? | Security | Open |
| Q-04 | Should the compiler be replaced with a real execution environment (Docker containers, WebAssembly)? | Feature | Open |
| Q-05 | Should we add React Router or keep manual hash routing? | Frontend architecture | Open |
| Q-06 | Should the 28 DB tables be reviewed for consolidation? Some may be premature. | Database | Open |
| Q-07 | What is the deployment target — Vercel only, or also backend hosting? | Infrastructure | Open |
| Q-08 | Should `lucide-react` be pinned to a specific version or updated to match upstream? | Dependencies | Open |

---

## 24. Blockers

| # | Blocker | Impact | Mitigation |
|---|---------|--------|------------|
| B-01 | No real compiler/execution platform | Cannot implement real coding missions or test validation | Keyword-match simulator is placeholder; real impl deferred to Phase 7 |
| B-02 | No real AI function calling | Cannot implement Guide Mode, Simplify Mode, Hint System as designed | Gemini chat works; function calling deferred to Phase 8 |
| B-03 | No test suite | Cannot verify changes don't break existing functionality | Manual testing only; testing deferred to Phase 12 |
| B-04 | Hardcoded secrets in server.js | App runs insecurely without .env | Must fix before any non-local deployment |

---

## 25. Next Actions

### Immediate (before next feature work)

1. **Fix hardcoded JWT/session fallback secrets** (TD-01) — fail loudly if env vars missing
2. **Fix OAuth token passing** (TD-02, SEC-02) — switch to HTTP-only cookies or at minimum POST body
3. **Fix GitHub OAuth hardcoded redirect** (TD-03) — use env var
4. **Create `.env.example`** (TD-05) — document all required env vars
5. **Fix seed data plaintext passwords** (TD-04) — bcrypt hash in seed function

### Short-term (next sprint)

6. **Add basic RBAC middleware** — gate Admin Center behind `admin`/`super admin` role check
7. **Add rate limiting** (SEC-05) — protect auth and AI endpoints
8. **Add input validation** (SEC-07) — sanitize all API inputs
9. **Begin server.js modularization** (TD-06) — split routes into `routes/` directory

### Medium-term (next phases)

10. Implement real compiler/execution (Phase 7)
11. Implement AI function calling (Phase 8)
12. Add test suite (Phase 12)
13. Production OAuth configuration (Phase 14)

---

## 26. Phase Progress

Based on `phases.doc.md` and actual repo state:

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Foundation & Governance | 🟢 Done | Docs created, rules defined |
| 1 | Repository, Env & Tooling | 🟢 Done | Monorepo, Vite, npm workspaces |
| 2 | Database & Backend Foundation | 🟢 Done | 28 tables, 40 routes, SQLite |
| 3 | Authentication & Security | 🟡 Partial | Auth works but has critical security issues (§9) |
| 4 | Onboarding & Dashboard | 🟡 Partial | Onboarding wizard works; dashboard has mocked data |
| 5 | Learning System | 🟡 Partial | Tracks/modules/topics/lessons schema + basic CRUD; no real learning flow |
| 6 | Mission Engine | 🔵 UI Only | MissionIDE renders; no real mission execution |
| 7 | Compiler / Execution | 🔵 Mock | Keyword-match simulator only |
| 8 | AI Mentor | 🟡 Partial | Gemini chat works; no function calling, no streaming |
| 9 | Gamification & Passport | 🔵 UI Only | Passport renders; XP awarded but not meaningful |
| 10 | Admin Control Center | 🟡 Partial | 12 categories, ~12 functional modules, ~39 placeholder |
| 11 | Analytics & Notifications | ⬜ Not started | Tables exist; no UI or logic |
| 12 | Testing & CI/CD | ⬜ Not started | Zero tests |
| 13 | Security Hardening | ⬜ Not started | Multiple critical findings (§9) |
| 14 | Deployment & Production OAuth | ⬜ Not started | Vercel config exists; no production setup |
| 15 | Production Infrastructure | ⬜ Not started | — |
| 16 | MVP Final QA & Launch | ⬜ Not started | — |
| 17 | Post-Launch Growth | 🔮 Future | — |

---

## 27. Quality Gates

### Current State

| Gate | Status |
|------|--------|
| All docs written | ✅ Yes (PRD, architecture, design, rules, phases, memory) |
| No critical security findings | ❌ No — 4 critical findings (§9) |
| All API routes documented | ✅ Yes (§16) |
| All DB tables documented | ✅ Yes (§13) |
| Test coverage > 0% | ❌ No — zero tests |
| No hardcoded secrets | ❌ No — TD-01 |
| No mock data in production paths | ❌ No — dashboard, compiler, admin all have mocks |
| Linter passes | ⚠️ Unknown — oxlint configured but not verified in this session |

---

## 28. Refactoring Needs

| Priority | Refactor | Reason | Effort |
|----------|----------|--------|--------|
| 🔴 High | Split `server.js` into route modules | 1,589 lines is unmaintainable | Medium |
| 🔴 High | Split `db.js` schema from seed data | Separate concerns | Low |
| 🔴 High | Fix OAuth token flow (query params → cookies) | Security | Medium |
| 🟡 Medium | Add RBAC middleware | Authorization is missing | Medium |
| 🟡 Medium | Replace mock dashboard data with real queries | Feature completeness | Medium |
| 🟡 Medium | Replace keyword-match compiler with real execution | Feature completeness | High |
| 🟢 Low | Clean up legacy PDFs in `docs/` | Repository hygiene | Low |
| 🟢 Low | Add React error boundaries | Resilience | Low |
| 🟢 Low | Add loading skeletons | UX polish | Low |

---

## 29. External Dependencies

### Runtime Dependencies

| Package | Version | Used For | Risk |
|---------|---------|----------|------|
| react | ^19.2.8 | UI framework | Low — latest stable |
| react-dom | ^19.2.8 | DOM rendering | Low |
| lucide-react | ^1.28.0 | Icons | ⚠️ Atypical version (upstream 0.4xx) |
| highlight.js | ^11.x | Code highlighting | Low |
| react-markdown | ^9.x | Markdown rendering | Low |
| rehype-highlight | ^7.x | Code blocks in markdown | Low |
| express | ^4.x | HTTP server | Low |
| sqlite | ^5.x | Async SQLite wrapper | Low |
| sqlite3 | ^5.1.7 | SQLite driver | Low |
| bcryptjs | ^2.x | Password hashing | Low |
| jsonwebtoken | ^9.x | JWT | Low |
| passport | ^0.7.x | Auth middleware | Low |
| passport-google-oauth20 | ^2.x | Google OAuth | Low |
| passport-github2 | ^0.1.x | GitHub OAuth | Low |
| @google/generative-ai | ^0.x | Gemini AI | Low — Google SDK |
| uuid | ^10.x | ID generation | Low |

### External Services

| Service | Required? | Status |
|---------|-----------|--------|
| Google Gemini API | Optional (fallback exists) | Configured via env var |
| Google OAuth | Optional (local auth works) | Configured via env var |
| GitHub OAuth | Optional (local auth works) | Configured via env var |
| Vercel | Optional (local dev works) | SPA config present |
| Email service | Not configured | Forgot password / verify email UI exists but no transport |

---

## 30. Testing Status

| Category | Status |
|----------|--------|
| Unit tests | ❌ None |
| Integration tests | ❌ None |
| E2E tests | ❌ None |
| API tests | ❌ None |
| Component tests | ❌ None |
| Test framework | Not configured |
| CI/CD | Not configured |
| Linter | oxlint (react rules) — configured but not verified |

**Testing is explicitly deferred to Phase 12** per `phases.doc.md`.

---

## 31. Configuration Files

| File | Format | Purpose | Notes |
|------|--------|---------|-------|
| `package.json` (root) | JSON | npm workspaces | `"workspaces": ["frontend", "backend"]` |
| `frontend/package.json` | JSON | Frontend deps | React 19, Vite 8, lucide-react |
| `backend/package.json` | JSON | Backend deps | Express, passport, SQLite, Gemini |
| `frontend/vite.config.js` | JS | Vite config | Default config |
| `frontend/vercel.json` | JSON | Vercel SPA | `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` |
| `frontend/.env` | dotenv | Frontend secrets | `VITE_API_BASE_URL` |
| `backend/.env` | dotenv | Backend secrets | 10 env vars (§18) |
| `.gitignore` | gitignore | Ignored files | `node_modules/`, `.env`, `*.sqlite`, `*.db`, `.DS_Store` |
| `docs/*.md` | Markdown | Documentation | 6 docs + intro.txt + todo |

---

## 32. Conflict Register

Tracks conflicts between this document and other docs, or between docs and code.

| ID | Conflict | Docs Involved | Resolution | Status |
|----|----------|---------------|------------|--------|
| CR-01 | `memory.md` vs `design.md` doc hierarchy ordering | memory.md §2, design.md §1 | design.md lists `rules.md > Memory.md > intro.txt`; memory.md lists `rules.md > Memory.md > intro.txt` — **consistent** | ✅ No conflict |
| CR-02 | `memory.md` vs `phases.doc.md` doc hierarchy | memory.md §2, phases.doc.md §1 | Both list `Rules.md > Memory.md > intro.txt` — **consistent** | ✅ No conflict |
| CR-03 | Seed user roles inconsistent across docs | db.js, architecture.md | Roles use mixed casing and spaces (`Student`, `jr architect`, `super admin`) — **documented as known issue TD-15** | ⚠️ Known |
| CR-04 | `backend/atlas.sqlite` (0 bytes) vs `db/atlas.sqlite` (274 KB) | Repo filesystem | Two SQLite files exist; root one is empty artifact — **documented in §5** | ⚠️ Known |
| CR-05 | lucide-react ^1.28.0 vs upstream 0.4xx | frontend/package.json, design.md §13 | Version is atypical — **documented in §29** | ⚠️ Known |

---

## 33. Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-09-04 | 0.1 | Initial memory.md created with 35 sections | AI Agent |

---

## 34. Owner & Contacts

| Role | Name | Contact |
|------|------|---------|
| Project Owner | Abhi | TechInfinit Studio |
| Primary Dev | Abhi | — |
| AI Assistant | Atlas AI (big-pickle model) | — |

---

## 35. Appendices

### A. localStorage Keys

| Key | Purpose |
|-----|---------|
| `atlas_access_token` | JWT access token |
| `atlas_refresh_token` | JWT refresh token |
| `atlas_session_id` | Session identifier |
| `atlas_mission_completed` | Mission completion flag |

### B. API Response Shape (typical)

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error:
```json
{
  "success": false,
  "error": "Error description"
}
```

### C. Design Token Quick Reference

```css
/* Backgrounds */
--bg-base: #06060a;
--bg-surface: #0d0d12;
--bg-card: #12121a;

/* Borders */
--border-default: #1e1e2e;

/* Text */
--text-primary: #e4e4f0;
--text-muted: #73739b;

/* Neon accents */
--accent-primary: #ff5722;
--accent-cyan: #22d3ee;
--accent-violet: #a78bfa;
--accent-green: #34d399;
--accent-amber: #fbbf24;
--accent-pink: #f472b6;
--accent-blue: #60a5fa;

/* Fonts */
--font-ui: 'Outfit', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### D. Git Branch Strategy

- `dev` — active development
- `main` — stable/release branch
- No feature branches observed in history
- No PR/MR workflow observed
- Direct commits to `dev` and `main`

### E. Untracked Files (not in git)

The following files exist in the repo but are not tracked by git:

- `docs/PRD.md`
- `docs/architecture.md`
- `docs/design.md`
- `docs/rules.md`
- `docs/phases.doc.md`
- `docs/memory.md` (this file)
- `docs/Doc 1-Atlas Vision & Product Strategy.pdf`
- `docs/Doc 3 - Atlas Learning Framework.pdf`
- `docs/Doc 4.0 - Atlas Product Requirements Document.pdf`
- `docs/PRD 0.1.pdf`
- `prompt.txt`
- `todo`

**These should be committed to the repository.**
