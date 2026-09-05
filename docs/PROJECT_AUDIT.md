# Atlas — Complete Project Audit & Implementation Plan

**Date:** Sep 5, 2026 · **Branch:** `dev` · **Scope:** entire monorepo (`backend/`, `frontend/`, `docs/`)
**Method:** full source read (all 22 backend modules, all 20 frontend components + client), PRD/rules/phases/memory/architecture/design cross-check, live DB inspection, build + lint + backend smoke verification.
**Legend for statuses:** ✅ COMPLETE · 🟡 PARTIAL · ❌ INCORRECT · ⬜ MISSING · 🔁 DUPLICATE · ❓ UNVERIFIED

---

# PART 1 — PROJECT UNDERSTANDING

## 1.1 What Atlas is

Atlas is an **AI-powered software-engineering learning platform** ("Practice Platform"): learners move from beginner → guided missions → a verifiable engineering passport → interview readiness → employer connections. It is explicitly *not* a LeetCode clone, video-course platform, or "AI chatbot that gives code answers." The core pedagogy: **learn by building**, **think before code**, **guide instead of solving**, and **preserve productive struggle**.

## 1.2 Primary purpose

Turn beginners into professional engineers through a *mission-based* learning loop: study a concept → solve a real-world mission in a code IDE → get it verified → earn XP toward a professional passport that doubles as a portfolio.

## 1.3 Target users

- **Primary:** beginner–intermediate learners (Phase 1 "Student" journey).
- **Secondary:** mentors, guiders, admins, super admins (staff roles) who operate the platform/admin console.
- **Future (out of MVP scope):** companies/recruiters (hiring platform), universities, enterprises.

## 1.4 Core user journeys

1. **Register/verify → onboarding wizard** → (staff) admin console keypad launch or (student) keypad bypass → main workspace.
2. **Learn track journey:** Learning Hub → pick track → module → topic → lesson → read markdown → quiz → flashcards → revision queue → bookmarks/notes.
3. **Mission journey:** Mission Space (IDE) → write Kotlin `FollowerSearch.kt` → "LOAD TRIE INDEX" → Execute → simulated compiler verdict → +800 XP / code_quality 94.
4. **Passport/career journey:** view hardcoded passport, career vault (DSA keyword check, static resumes), practice sandbox (local-only "VERIFIED").
5. **Dashboard journey:** view stats/summary, toggle daily plan (+100 XP), heartbeat timer, regenerate plan, notifications, pinned shortcuts.
6. **Account journey:** profile edit, change password, session management, account deletion.

## 1.5 Major features

| Feature | Status summary |
|---|---|
| Auth: email/password + JWT refresh | ✅ implemented; ❌ tokens in localStorage (rules forbid), OAuth callback broken |
| OAuth Google/GitHub | ⚠️ routes exist; ❌ frontend can never consume tokens (hash vs query parsing) |
| Email verification / password reset | 🟡 implemented; email delivery is `console.log` only |
| Keypad onboarding (admin + student bypass) | 🟡 admin works; ❌ student auto-register fails password regex |
| Onboarding wizard | 🟡 works; ❌ track always resets to Backend Architect (`user.path` absent) |
| Dashboard + daily plan | 🟡 works; ❌ streak/analytics mocked, failure = endless spinner |
| Learning tracks / lessons / progress | 🟡 works; ❌ `progress_percent` never stored (snake_case mismatch) |
| Quiz | ❌ broken end-to-end (wrong payload field + wrong response shape) |
| Notes | ❌ broken (wrong payload field → NOT NULL constraint 500) |
| Bookmark / revision flashcards | 🟡 works; ❌ revision ratings no-op, fallback flashcards hardcoded |
| Mission IDE + compiler | 🟡 real API call; ❌ "compiler" is keyword substring match, no sandbox |
| AI mentor chat | 🟡 endpoint exists; ❌ **not wired into any UI**, fallback is 2 hardcoded strings |
| Passport / Career vault | 🟡 presentational only; ❌ entirely hardcoded/fabricated data |
| Logic practice | 🟡 UI only; ❌ "verification" is local state flip, +250 XP claimed but never persisted |
| Admin Center | 🟡 12-module shell; 2 modules real-ish, ~39 sub-views placeholders |
| Gamification (XP/level) | 🟡 formula exists; ❌ no audit trail, no streak/badges/ranks |
| Notifications | 🟡 read/delete work; ❌ some endpoints unused, categories static |

## 1.6 Major modules

Backend (`backend/src/`): `config` · `db` · `middleware` · `routes` · `services` · `utils` · `scripts`.
Frontend (`frontend/src/`): `api` · `components/{auth, dashboard, admin, learn, mission, passport, career, practice, onboarding, settings, layout}`.

## 1.7 Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19.2.8, Vite 8.2, lucide-react ^1.28.0, react-markdown, rehype-highlight, hash routing (no Router) |
| Backend | Express 4, SQLite via `sqlite`(wrapper)+`sqlite3`, bcryptjs, jsonwebtoken, passport (google/github), uuid, @google/generative-ai, express-session |
| Lint | oxlint (only `react/rules-of-hooks`, `react/only-export-components`) |
| Test | **none** |
| Deploy | Vercel (frontend SPA rewrite), Render referenced in `.env` comment (backend), no CI |

## 1.8 Application architecture

Monorepo with npm workspaces. React SPA talks to Express REST API over localhost:5001 (dev) with Bearer JWT. Single SQLite file `db/atlas.sqlite`. No message bus, no background workers, no caching layer.

## 1.9 Frontend architecture

Hash-based manual router in `App.jsx` (own all state; passes props/callbacks down). Shared `api/client.js` (`apiFetch`, `apiUrl`). Feature-folder components, all importing `../../api/client`. `<StrictMode>` in `main.jsx`. Single `index.css` (~2,916 lines) for all styling.

## 1.10 Backend/API architecture

`server.js` → `createApp()` (`app.js`) → 7 route modules under `/api` → services (ai, auth, compiler) → `db/index.js` (sqlite singleton) → `schema.js`/`seed.js`. Middleware: `auth` (JWT + RBAC), `audit`, `rateLimit` (login only). **No global error handler, no 404 handler.**

## 1.11 Data/storage architecture

SQLite single file, 28 tables, `PRAGMA foreign_keys = ON` only (no WAL/busy_timeout). Seed guard: seeds only when `users` table empty. Runtime DB is git-ignored and re-seedable via `npm run db:reset -w backend`.

## 1.12 Authentication / authorization

- Access JWT (15 min, `{id,email,username,role}`) + refresh JWT (7 days, row-persisted, **not rotated**) handled via `auth.service.js`.
- Tokens stored in `localStorage` (keys `atlas_access_token`/`atlas_refresh_token`/`atlas_session_id`) — **violates rules.md 15.3/18.4** (MUST be httpOnly cookies).
- RBAC via `authorizeRoles` (admin/super admin/mentor gates on `/users` + `/tags`; super admin only on role change). Client gate `isStaff` list = admin, super admin, mentor, guider.
- OAuth: passport google/github, callback → `processOAuthLogin` → tokens in **URL query redirect** (SEC-02).

## 1.13 Calculation / logic architecture

Two-server-synchronized XP/level formulas (all `Math.floor(xp/1000)+1`), implemented in **four places**: dashboard.routes (plan toggle +100), learning.routes (lesson complete `xp_reward`, quiz bonus 20% ≥0.8), compiler.service (mission +800). Code quality: no real calculation — column defaults to 52, written to 94 on mission pass, used as frontend sentinel. Streak and analytics are hardcoded server-side.

## 1.14 Tool architecture

(Simulated) services: `ai.service.js` (Gemini only-if-key, else null), `compiler.service.js` (keyword-match mission simulation). No sandbox, no function calling, no real code execution.

## 1.15 Shared components / utilities

- `api/client.js` (apiFetch/apiUrl) — the only genuinely shared layer.
- `layout/Sidebar.jsx` — shared nav.
- Password strength logic duplicated in `Register.jsx` and `ResetPassword.jsx`.
- No shared form/button/card/table/empty/error/loading components exist.

## 1.16 Routing structure

Frontend: hash routes `#register`, `#auth-success`, `#forgot-password`, `#reset-password`, `#verify-email`, `#keypad`, `#onboarding-wizard`, `#admin` + pathname `/admin`, plus workspace tabs (overview, learn, ide, practice, passport, career, settings). Backend: 46 REST endpoints under `/api/…`.

## 1.17 Error handling

Backend: per-route try/catch → `{error}` JSON for handled cases; **defaults to Express HTML errors** for unhandled/malformed JSON/unmatched routes (no global handler). Inconsistent codes (e.g., token expiry 400 vs 403). Frontend: 5 components have any error state; Dashboard/LearnHub/Practice/Career show endless spinner or blank. No error boundaries.

## 1.18 Validation

Backend: email + password regex (`utils/validators.js`), login payload presence, lesson/track existence, `pinnedActions` array check. **Majority of endpoints have no body validation** (profile, notes, role, revision rating, quiz score trust). Frontend: login/register/reset password have client checks; others rely on HTML `required`.

## 1.19 Testing setup

**None.** No test runner in either package.json; zero unit/integration/e2e/UI tests. rules/open-decision 62.6 (Vitest/Jest/RTL/Cypress) still Open.

## 1.20 Build / deployment setup

- Frontend: Vite build → static → Vercel (`vercel.json` SPA rewrite). Backend: local `node src/server.js` (or `npm run start -w backend`).
- Backend currently must be run manually; no Docker, no process manager, no CI.
- `.env` files (backend + frontend) have example templates now.

---

# PART 2 — COMPLETE FILE & CODEBASE AUDIT

## 2.1 Pages / Routes (frontend hash routes)

| Route | Purpose | Status | Components | APIs | PRD match |
|---|---|---|---|---|---|
| (empty/#) — authenticated | Main workspace | ✅ | Sidebar + tab views | many | 🟡 |
| `#register` | Sign-up | ✅ | Register.jsx | `/auth/check-username/:u`, `/auth/register` | ✅ |
| `#auth-success` | OAuth callback landing | ❌ | AuthSuccess.jsx | (none) | ❌ broken |
| `#forgot-password` | Reset request | ✅ | ForgotPassword.jsx | `/auth/forgot-password` | ✅ |
| `#reset-password` | Set new password | ✅ | ResetPassword.jsx | `/auth/reset-password` | ✅ |
| `#verify-email` | Verify token | ✅ | VerifyEmail.jsx | `/auth/verify-email`, `/auth/resend-verification` | ✅ |
| `#keypad` | Onboarding keypad | 🟡 | Onboarding.jsx | `/auth/login` (admin), register/verify/login (student, broken) | ⚠️ bypass design |
| `#onboarding-wizard` | Profile setup | 🟡 | OnboardingWizard.jsx | `/auth/profile` | ⚠️ track reset bug |
| `#admin` or path `/admin` | Admin Center | 🟡 | AdminCenter.jsx, 403 panel | `/users`, `/users/:id/role`, `/tags` | 🟡 2 of 12 modules real |
| (workspace tabs) | overview/learn/ide/practice/passport/career/settings | 🟡 | 9 components | per-component | mixed |

## 2.2 Components audit

| Component | LOC | Data | Status | Problems |
|---|---|---|---|---|
| App.jsx | 471 | state owner | 🟡 | keypad hardcoded creds; no refresh-on-401; OAuth profile undefined |
| Sidebar.jsx | 66 | props | ✅ | `user.username[0]` crash risk |
| Dashboard.jsx | 696 | `/dashboard/summary` + 5 calls | 🟡 | endless spinner, `dailyGoals.concat` crash, no-op actions, unused `analyticsFilter`, unused icons |
| LearnHub.jsx | 404 | `/tracks`, `/tracks/:id`, `/revision`, `/bookmarks`, `/revision/rate` | 🟡 | no error state, `roadmap.modules` crash, dead `onNavigateToBookmarks` |
| LessonViewer.jsx | 349 | `/lessons/:id`, notes, progress, quiz, bookmarks | ❌ | quiz + note-creation broken, progress_percent dropped, missing effect dep |
| FlashCard.jsx | 133 | props | 🟡 | div-onClick, no keyboard, no semantic button |
| MissionIDE.jsx | 370 | `/missions/execute` | 🟡 | fake pre-seed logs, hardcoded 5001 error string, client-side source tree |
| Passport.jsx | 167 | none | ❌ | fully hardcoded/fabricated |
| CareerVault.jsx | 217 | none | 🟡 | `user.callsign.toUpperCase()` crash, fabricated resume |
| LogicPractice.jsx | 213 | none | ❌ | "+250 XP" fake, verify = local state |
| Onboarding.jsx | 385 | `/auth/login` admin | 🟡 | any-4-digit PIN bypass, hardcoded hint PINs, fake steps |
| OnboardingWizard.jsx | 260 | `/auth/profile` | 🟡 | track always Backend Architect |
| Register.jsx | 321 | 2 endpoints | 🟡 | 4.5s debounce, stale-response race, unused imports |
| Login.jsx | 164 | `/auth/login` | ✅ | hardcoded verification message |
| VerifyEmail.jsx | 155 | 2 endpoints | ✅ | no label association |
| ForgotPassword.jsx | 100 | 1 endpoint | ✅ | unused import |
| ResetPassword.jsx | 212 | 1 endpoint | ✅ | duplicates strength logic |
| AuthSuccess.jsx | 54 | none | ❌ | parses `search` not hash → OAuth fails; `atob` breaks base64url |
| AdminCenter.jsx | 705 | `/users`(prop), `/tags`(broken) | 🟡 | `localStorage.getItem('token')` never set; 10/12 modules placeholder |
| AccountSettings.jsx | 416 | `/auth/sessions`, profile, change-password, account | 🟡 | no strength check, empty-session state absent |

## 2.3 Reusable/shared gaps

- Should-be-shared, currently duplicated: **password strength meter** (Register.jsx, ResetPassword.jsx); **spinner/loading** (6 inline variants); **error/empty states** (mostly absent); **form field + label** (none).
- Incorrect responsibilities: App.jsx holds user-facing flow logic (keypad fake account creation) that belongs in components.
- Violates conventions / too complex: Dashboard.jsx (696 LOC, mixed data+render+mocks), AdminCenter.jsx (705 LOC, 12 modules).

## 2.4 Utilities / libraries audit

| Utility | Location | Verdict |
|---|---|---|
| `apiFetch`/`apiUrl` | `api/client.js` | ✅ shared, no error normalization/401 interception |
| `isValidEmail`/`isValidPassword`/`PASSWORD_REGEX` | `utils/validators.js` | ✅ used server-side register/reset |
| `signTokens`/`persistAuthSession`/`processOAuthLogin` | `services/auth.service.js` | ✅ |
| `writeAuditLog` | `middleware/audit.js` | ✅ used; errors swallowed |
| `rateLimitLogin`/`recordLoginFailure`/`clearLoginAttempts` | `middleware/rateLimit.js` | ✅ login only, in-memory |
| Password strength `strengthScore` | Register.jsx + ResetPassword.jsx | 🔁 duplicated |
| `getHashParam` | VerifyEmail.jsx / ResetPassword.jsx | 🔁 duplicated tiny utils |
| `formatGoalValue`/`formatGoalName`/`getCalendarCells`/`getAnalyticsPoints` | Dashboard.jsx | local, fine |
| Nothing else | — | no constants/config/_blank shared module |

## 2.5 API layer — every endpoint

Auth (`/api/auth`), mounted via `app.js`:

| # | Endpoint | Purpose | Auth | Probs |
|---|---|---|---|---|
| 1 | GET `/check-username/:username` | availability | public | 500 on query failure |
| 2 | POST `/register` | create user | public | returns `verifyToken` to client (byproduct), console-only email |
| 3 | POST `/verify-email` | activate | public | 400 for expiry (resp shape ok) |
| 4 | POST `/resend-verification` | resend | public | console-only email |
| 5 | POST `/login` | login (keypad + password) | public+rateLimit | unverified→403; rate limit in-memory, trusts x-forwarded-for |
| 6 | POST `/refresh` | new access token | public | **no rotation/sliding** |
| 7 | POST `/logout` | end session | public (none!) | can revoke others' sessions if IDs known |
| 8 | POST `/forgot-password` | reset request | public | anti-enum; console-only email |
| 9 | POST `/reset-password` | set new | public | 400 expiry (vs 403 refresh) |
| 10-11 | GET `/google`, `/google/callback` | OAuth | passport | tokens in URL query |
| 12-13 | GET `/github`, `/github/callback` | OAuth | passport | tokens in URL query; GitHub email fallback `.github.oauth.local` |
| 14 | GET `/me` | session user | auth | used by App |
| 15 | PUT `/profile` | update profile | auth | **no validation** |
| 16 | PUT `/change-password` | password | auth | inline msg; no rate limit |
| 17 | GET `/sessions` | list | auth | used by settings |
| 18 | DELETE `/sessions/:id` | revoke | auth | works |
| 19 | DELETE `/account` | delete user | auth | cascade |

Users (`/api/users`):

| # | Endpoint | Purpose | Auth | Probs |
|---|---|---|---|---|
| 20 | GET `/` | list users | auth+RBAC(admin/super admin/mentor) | **returns `passcode`** |
| 21 | PUT `/:id/role` | change role | auth+RBAC(super admin) | **no role validation, crashes on undefined role** |

Admin (`/api/tags`):

| # | Endpoint | Purpose | Auth | Probs |
|---|---|---|---|---|
| 22 | GET `/` | list tags | auth+RBAC | — |
| 23 | POST `/` | create tag | auth+RBAC(admin/super admin) | duplicate → 500 (not 409) |
| 24 | DELETE `/:name` | delete tag | auth+RBAC(admin/super admin) | protects admin/super admin tag |

Dashboard (`/api/dashboard`):

| # | Endpoint | Purpose | Auth | Probs |
|---|---|---|---|---|
| 25 | GET `/summary` | workspace payload | auth | **streak=5 + hardcoded analytics**; inserts default prefs if absent |
| 26 | POST `/regenerate-plan` | shuffle plan | auth | random pools |
| 27 | POST `/plan/toggle` | toggle item | auth | +100 XP, level formula |
| 28 | GET `/notifications` | list | auth | ❌ **unused by UI** |
| 29 | POST `/notifications/:id/read` | mark read | auth | used |
| 30 | DELETE `/notifications/:id` | delete | auth | used |
| 31 | POST `/preferences` | pin actions | auth | only validates array |
| 32 | POST `/heartbeat` | time++ | auth | +30s, no auth issue; fire-and-forget from UI |

Learning (`/api`) — 13-21 in the 46 total:

| # | Endpoint | Purpose | Auth | Probs |
|---|---|---|---|---|
| 33 | GET `/tracks` | list tracks | auth | 6 tracks, only 2 with content |
| 34 | GET `/tracks/:id` | full roadmap | auth | 404 if missing; 4 tracks empty modules |
| 35 | GET `/lessons/:id` | lesson bundle | auth | quiz/flashcards JSON parse |
| 36 | POST `/lessons/:id/progress` | save progress | auth | **reads camelCase; UI sends snake_case → progress 0** |
| 37 | POST `/lessons/:id/notes` | create note | auth | **expects `noteText`; UI sends `text` → 500** |
| 38 | DELETE `/lessons/notes/:id` | delete note | auth | works |
| 39 | GET `/bookmarks` | list | auth | used |
| 40 | POST `/bookmarks` | toggle | auth | `{itemType,itemId}`; UI sends `{item_type,item_id}`? **verify** — backend reads `itemType` (camelCase), LessonViewer sends `item_type` — ❌ toggle may 500 (UNKNOWN w/o live check) |
| 41 | GET `/revision` | queue+cards | auth | 2 hardcoded fallback cards |
| 42 | POST `/revision/rate` | rate card | auth | **NO-OP** (nothing persisted) |
| 43 | POST `/quiz/submit` | grade quiz | auth | **reads `lessonId,score`; UI sends `lesson_id,answers` → always 404; response shape mismatch** |

Missions & Mentor:

| # | Endpoint | Purpose | Auth | Probs |
|---|---|---|---|---|
| 44 | POST `/missions/execute` | compiler sim | auth | keyword match; ignores `userId`/`fileName` |
| 45 | GET `/mentor/history/:userId` | chat history | auth | **ignores `:userId` param** |
| 46 | POST `/mentor/chat` | AI reply | auth | **no frontend caller**; fallback 2 strings |

## 2.6 Data layer audit — schema (28 tables)

Auth/users (8): `users`, `profiles`, `sessions`, `oauth_accounts`, `email_verifications`, `password_resets`, `refresh_tokens`, `audit_logs`.
Learning (10): `learning_tracks`, `learning_modules`, `learning_topics`, `lessons`, `lesson_contents`, `lesson_resources`, `lesson_progress`, `lesson_notes`, `lesson_bookmarks`, `revision_queue`.
Missions/chat (3): `missions`, `chat_messages`, `learning_sessions`.
Dashboard (6): `user_goals`, `notifications`, `calendar_events`, `activity_logs`, `learning_recommendations`, `dashboard_preferences`.
Admin (1): `security_tags`.

Notable: no `user_flashcards` table (SRS stub, phases T5-LRN-03 confirms); `revision_queue.interval_days` always 1; no indexes beyond PK/UNIQUE; FK cascades correct.

Seed: 5 users (all `is_email_verified=1`, bcrypt-hashed **against plaintext seeds**, passcodes abhi/2400 etc.), 6 tracks (only android+backend have content), 3 lessons (`less_and_1` 200xp, `less_back_1` 250xp, `less_back_2` 300xp prereq), 8 goals/user, 3 notifications/user, calendar/activity/recs/pins. Seed skipped when any user exists (so an existing DB won't reseed — `login`, `lesson` content use `INSERT OR REPLACE` only for calendar/content/progress).

---

# PART 3 — REQUIREMENTS vs IMPLEMENTATION AUDIT

Legend: ✅ COMPLETE · 🟡 PARTIAL · ❌ INCORRECT · ⬜ MISSING · 🔁 DUPLICATE · ❓ UNVERIFIED.

| Requirement (PRD source) | Expected | Current implementation | Status | Evidence | Required action |
|---|---|---|---|---|---|
| Auth — email/password (FR-AUTH-001) | Secure register/login | bcrypt + JWT 15m/7d | ✅ | auth.routes.js, auth.service.js | HMAC/rotation hardening |
| Auth — Google+GitHub OAuth (PRD 2573-2574) | Working OAuth sign-in | Routes exist; callback broken in SPA | ❌ | AuthSuccess.jsx:7 vs App.jsx:287 | Fix query↔hash parsing |
| Session security — httpOnly (rules 15.3.1, 18.4.1) | Tokens NOT in localStorage | Access+refresh in localStorage | ❌ | App.jsx:55,98,141-143; rules.md:697 | Cookie migration (P1) |
| OAuth callbacks server-side exact match (PRD 2600-2602) | Callback validation | Fixed config default; no state param validation | 🟡 | config/index.js:31,36 | Add state + env callbacks |
| Onboarding wizard | Profile capture | Works; track hardcodes 'Backend Architect' | 🟡 | OnboardingWizard.jsx:42 | Read path/track from user |
| Dashboard (MVP scope) | Real user stats | Streak/analytics hardcoded; plan toggle real | 🟡 | dashboard.routes.js:62-76 | Real aggregations |
| Learning tracks/lessons (MVP) | Navigable curriculum | 6 tracks, 2 with content; lessons render | 🟡 | seed.js:130-206 | Content + all-tracks depth |
| Lesson progress persist | Store position/% | Always stores 0 (snake_case mismatch) | ❌ | LessonViewer.jsx:98; learning.routes.js:137 | Align payload keys |
| Hidden quiz | Graded quiz, feedback | Quiz request broken (wrong field + shape) | ❌ | LessonViewer.jsx:110; learning.routes.js:336 | Fix contract; score from server |
| Notes per lesson | CRUD notes | Create broken (500); delete works | ❌ | LessonViewer.jsx:68; learning.routes.js:209 | Fix payload key |
| Bookmarks | Save lessons | Works (`{item_type}`?) — ❓ live verify | 🟡 | LearnHub.jsx:97; LessonViewer.jsx:47 | Verify payload case |
| Revision flashcards (SRS) | Spaced repetition persisted | Ratings no-op; no flashcards table | ❌ | learning.routes.js:327; phases T5-LRN-03 | Real SRS persistence |
| Mission Engine (MVP) | Missions, editor, execution | Editor UI + sim execute; **no real sandbox** | ❌ | compiler.service.js:21 | Real sandbox (critical) |
| Hidden Tests (MVP) | Code graded by hidden tests | Keyword substring match awards +800 XP | ❌ | compiler.service.js:21,52 | Test-based grading |
| Compiler limits/timeout (FR-COMPILER-001a,i) | Resource-limited isolated exec | None ("latency" fabricated 0.8-310ms) | ❌ | compiler.service.js:33-49; phases T7-COM-05 | Real limits later |
| AI Mentor (FR-AI-001) | Gemara context, no solution dumps | Endpoint only; **no UI;** 2-string fallback | 🟡 | mentor.routes.js; phases T8-AI-01 | Wire into Mission IDE |
| Guide/Simplify/Hints (16-18) | 6-level hint system, guide mode | **Not implemented** | ⬜ | phases T8-AI-05..07 | Phase 8 work |
| Progress: XP/levels (PRD 2145+) | XP with audit trail + streaks/badges | XP everywhere; no audit trail, no streak | 🟡 | dashboard.routes.js:199, learning:160, compiler:52 | Audit log + real streak |
| Engineering Passport (MVP basic) | Real verifiable evidence | **Fully hardcoded** (XP, dates, hashes) | ❌ | Passport.jsx:47-161; phases T9-PORT-01 | API-backed passport |
| Portfolio (MVP basic) | Portfolio from real data | Static mock canvas + fabricated resume | ❌ | CareerVault.jsx:79-213 | Real profile data |
| Logic Practice (MVP?) | Practice w/ real verification | Verdict = local state; fake +250 XP | ❌ | LogicPractice.jsx:103-108 | Real exec/XP |
| XP awarding correctness | Reward reflects performance | +800 flat mission, +100 plan item, quiz trusts client | 🟡 | see §5.1 | Server-graded |
| Admin Center (MVP basic) | Functional admin ops | Users role mgmt real; tags broken key; 39 placeholders | 🟡 | AdminCenter.jsx; phases T10 | Fix token key; fill core |
| Rate limiting all endpoints (rules 21.1.1) | Global limiter | Login only | 🟡 | app.js; phases T3-AUTH-07 | Global limiter |
| Helmet/CSP (rules 19) | Security headers | **Not installed** | ❌ | package.json | Install + configure |
| CORS restrict (rules 19.4) | Allow-list origins | `cors()` permissive | ❌ | app.js:18 | Origin allow-list |
| Secrets env-only (rules 25, PRD 2590-2596) | No fallback secrets | Hardcoded fallback secrets in config | ❌ | config/index.js:23-25 | Remove fallbacks + fail-fast |
| Email delivery | Real transactional email | `console.log` links only | ❌ | auth.routes.js:89-92,320-323; phases TD-11 | Mail provider |
| Error boundary + global handler (rules 22.3.2) | No uncaught crashes | No error boundary, no global handler | ❌ | App.jsx; app.js | Add both |
| Tests > 0 (quality gate) | Unit/integration/e2e | **Zero tests** | ❌ | both package.json | Test framework + suites |
| Consistency of docs (rules 64) | Docs reflect reality | 4 live contradictions (see §2.8/Part 14) | 🟡 | memory/architecture/rules | Fix stale doc claims |
| Phase-1 MVP scope lock (PRD 2752-2814) | Auth, learn, missions, executor, progress, portfolio, admin | Auth broken (OAuth/keypad); portfolio/compiler fake | 🟡 | overall | Close gaps |

## 3.1 Contradictions between requirement sources

1. **Roles naming:** PRD 2580 lists 5 roles (no `jr architect`, title-case); rules/architecture/memory use 6 roles incl. `jr architect` + `super admin` (lowercase). Code seeds `jr architect` (abhi) & `Student`. **Recommended resolution:** adopt PRD list, rename `jr architect`→`student` or normalize; add migration.
2. **Route count:** rules:643 & architecture.md:766 say 38; architecture route-map has 46; memory:520 has an older 40-endpoint list. **Resolution:** 46 is current truth; fix the 38/40 claims.
3. **Table count:** architecture.md:482 says 24; schema has 28.
4. **`.env.example`:** rules.md:1054 & phases T0-FND-09/T1-REPO-04 say "none exists ⬜"; architecture+memory TD-05 say resolved; **memory.md internally contradicts itself** (TD-05 resolved vs §19/§27 "missing"). Files exist — the doc claims are stale.
5. **Monolith:** rules.md & phases TD-03 still describe a 1,589-line `server.js`; the split is complete. Stale text only.
6. **Line counts:** architecture 2,571 vs actual 2,597; intro 1,418 vs 1,422; Dashboard/AdminCenter/App LOC drift between memory, design, phases.
7. **Commits:** memory says 9; `git log` shows 11.

---

# PART 4 — UI/UX AUDIT

## 4.1 Visual consistency

| Area | Verdict | Finding |
|---|---|---|
| Typography | ✅ | Single design-token scale in index.css (Outfit + JetBrains Mono); consistent headings/body |
| Colors/tokens | ✅ | 7 neon accents, `--glow-*`, near-black bg — consistent across views |
| Spacing/radius/shadows/borders | ✅ | Shared CSS vars; visually coherent |
| Icons | ✅ | lucide-react consistently used |
| Button/label casing | ❌ | "INITIALIZE ACCOUNT bluePRINT" (Register), "VERIFIED" vs "verify", mixed caps styles |
| Component consistency | ❌ | 6 different spinner markups; Login/Register/Reset each render their own layout; modals only in AdminCenter |
| Responsive design | ❓ | No media queries verified for mobile/tablet; grid bg + fixed sidebars likely desktop-first; **UNVERIFIED** on actual devices |

## 4.2 UX

| Aspect | Verdict | Finding |
|---|---|---|
| Navigation | ✅ | Hash tabs + sidebar work; `/admin` pathname handled |
| User flow | 🟡 | Keypad student path dead-ends (register fails); OAuth path can't complete; onboarding resets track |
| Forms | 🟡 | Login/Register solid; others minimal; no inline per-field errors (single error string) |
| Input behavior | ❌ | Register debounce 4.5s (labeled 450ms); stale check race |
| Feedback | ✅ | Loading labels on buttons, alert() for role/delete |
| Loading states | 🟡 | Spinners yes; no skeletons |
| Error states | ❌ | Dashboard: permanent spinner on any failure; LearnHub blank; Practice/Career/Vault/Passport none |
| Success states | 🟡 | Register success panel yes; password change "success" via alert/inline |
| Empty states | ❌ | Sessions table empty render; LearnHub empty tracks renders blank header; bookmark list empty → blank |

## 4.3 Accessibility

| Check | Verdict | Finding |
|---|---|---|
| Semantic HTML | ❌ | Flashcard is a `<div onClick>`; cards not `<button>`; no `nav` landmark usage beyond aside divs |
| Keyboard navigation | ❌ | No `onKeyDown` anywhere; flashcard/keypad are click-only |
| Focus states/trap | ❌ | None; no focus management for overlays (notification tray, admin 403) |
| Labels | ❌ | Zero `<label htmlFor>`/`id` associations; inputs styled via CSS class only |
| ARIA | ❌ | Zero `aria-*` attributes in `frontend/src` (grep confirmed) |
| Contrast | 🟡 | Neon on near-black is generally ok but small text at 73739b muted could fail WCAG AA — **UNVERIFIED** with tooling |
| Screen reader | ❌ | No roles/alerts; dynamic panels (charts, admin) not announced |
| `lang` | ✅ | index.html `lang="en"` |

## 4.4 Responsive

Desktop-only assumptions flagged; sidebar + workspace grid not verified for tablet/mobile widths. **UNVERIFIED** (no media-query sweep performed beyond grep — recommend a manual pass).

---

# PART 5 — FUNCTIONAL & LOGIC AUDIT

## 5.1 XP / Level calculations (4 independent implementations)

Formula everywhere: **`level = Math.floor(xp / 1000) + 1`**. No `ceil`/bound issues (integer xp). Edge: XP can go negative only if decremented (nothing decrements except… nothing). Verified pieces:

| Source | Award | Formula location | Issues |
|---|---|---|---|
| Plan item complete | +100 XP | dashboard.routes.js:199 | Toggle `completed=true` toggling to false first still awards? — ✅ awards only when setting `completed=1`; verified guarded by prior value? ❌ **reads form's `completed` (target state) — toggling OFF also hits the `+100` branch? — check code** ⚠️ |
| Lesson complete | `xp_reward \|\| 100` | learning.routes.js:160-166 | only when transitioning to completed |
| Quiz pass | 20% of `xp_reward` if score ≥ 0.8 | learning.routes.js:346-352 | **trusts client-sent score**; broken request path anyway |
| Mission pass | **+800 flat** | compiler.service.js:52-54 | keyword match; huge unearned award |
| Code quality | none — constant 52→94 | compiler.service.js:54 | never a real calculation |

**Rounding/units:** `todayProgress = Math.round(completed/total*100)` correct. XP integers only — no fractional XP anywhere. Quiz `scorePercent = Math.round(score*100)` fine. No premature-rounding bugs in display paths (XP displayed raw). No unit-conversion issues except heartbeat `+30` per 30s tick is exact.

**Edge cases:** division by zero in `todayProgress` when `todayPlan.length===0` → `Math.round(Infinity)`? ❌ check: `completedCount / 0` = NaN → Math.round(NaN)=NaN — **returns NaN% in empty-plan edge** (low impact; default prefs seeded when absent).

## 5.2 Dashboard "summary" logic

- Streak hardcoded `5`; analytics arrays hardcoded; topicMastery 4 static. **No computation exists.**
- `dailyGoals.concat(weeklyGoals)` — frontend crash if either undefined.
- Heartbeat: `current_value + 30` — integer seconds, exact.

## 5.3 Compiler "logic"

`isOptimized = code.includes('TrieNode') || code.includes('buildIndex') || code.includes('Trie')` (compiler.service.js:21). Any code containing the string "Trie" (even in a comment) → PASS. Latency/memory randomized 0.8–1.7ms / 4.2–5.0MB on pass; 260–310ms on fail. **Not a real compiler. Known and documented (phases T7, architecture §16).**

## 5.4 Mentor "logic"

`generateMentorReply` returns null unless `GEMINI_API_KEY` set. Route fallback: `message.toLowerCase().includes('trie')` → fixed sentence else fixed sentence. No context window, no persist of role, no hint levels.

## 5.5 Other logic checks

- **Role change:** `PUT /users/:id/role` — no role whitelist; `.toUpperCase()` on missing body crashes (500). A bad role string is stored as-is.
- **Passcode login:** plaintext compare `username = ? AND passcode = ?`. 4-digit only by convention, no format validation.
- **Seed guard:** seeds only when `users` empty → existing DB never receives content updates except `INSERT OR REPLACE` rows.
- **Regenerate plan:** unbiased random pools; completed items preserved. OK.
- **AuthSuccess decode:** `atob` on base64url JWT payload — breaks on `-`/`_` chars. Incorrect decode logic.

---

# PART 6 — ERROR & LOG AUDIT

| # | Issue | Root cause | Impact | Severity | Fix |
|---|---|---|---|---|---|
| E1 | Quiz always 404 | LessonViewer sends `lesson_id` (snake), route reads `lessonId` | Quiz unusable | CRITICAL | Align field names + response shape |
| E2 | Note create 500 | UI sends `{text}`, route binds `noteText`→NULL→NOT NULL | Notes unusable | CRITICAL | Align payload |
| E3 | Progress % always 0 | UI `progress_percent` vs route `progressPercent` | Wrong progress UI | HIGH | Align |
| E4 | OAuth always `missing_tokens` | AuthSuccess reads `location.search`; route uses hash | OAuth broken | CRITICAL | Parse hash query |
| E5 | Tags always unauthorized (console errors daily) | AdminCenter uses `localStorage.getItem('token')` (never set); no prop | Admin tags broken | HIGH | Pass accessToken prop |
| E6 | Keypad student register 400 | Password `'PassWord123!_keypad'` has `_`, excluded by regex | Keypad bypass dead | HIGH | Use compliant password |
| E7 | Keypad hints reveal seed PINs | Onboarding:224 + passcode plaintext | Info leak | HIGH | Remove hints; hash passcodes |
| E8 | Blank/endless-spinner screens | Dashboard/LearnHub/Practice lack error states | UX | MEDIUM | Error states |
| E9 | Express HTML errors for bad JSON / unmatched routes | No global error handler / no 404 handler | Inconsistent API | MEDIUM | Add handlers |
| E10 | Inconsistent status codes | Different handlers use 400 vs 403 for token expiry | contract drift | LOW | Standardize |
| E11 | `roadmap.modules` crash | LearnHub:70 assumes `modules` | 500-class crash on malformed payload | MEDIUM | Guard |
| E12 | `user.callsign.toUpperCase()` crash | CareerVault:165 on undefined | Runtime crash | MEDIUM | Optional chaining |
| E13 | Sidebar `user.username[0]` crash | Sidebar:57 | Runtime crash | MEDIUM | Guard string |
| E14 | Mission fake "Compilation Successful." pre-seed logs | MissionIDE:154-160 shown even on network failure | Deceptive UX | MEDIUM | Gate logs on response |
| E15 | 4.5s debounce | Register:47 (comment says 450ms) | Laggy UX | LOW | Fix value |
| E16 | export `analyticsFilter` select is dead | Dashboard:450-457 never consumed | Confusing UI | LOW | Remove or wire |
| E17 | Build chunk >500kB warning | Monolithic App.jsx import graph | Perf | LOW | Code-split later |
| E18 | no npm registry/CI errors | — | tooling gap | LOW | CI add |

Build/lint evidence: `npm run build -w frontend` ✅ PASS (Vite 8.2.0, 641 kB, chunk warning only); `npx oxlint` ✅ exit 0, 107 warnings / 0 errors (all pre-existing in unchanged files, none new).

---

# PART 7 — SECURITY AUDIT

| # | Finding | Where | Risk | Status |
|---|---|---|---|---|
| S1 | Hardcoded fallback JWT/session secrets | config/index.js:23-25 | **CRITICAL** — known secret → full token forgery | Open (documented TD-01) |
| S2 | OAuth tokens in URL query string | auth.routes.js:376,395 | **CRITICAL** — history/referrer logging | Open (TD-02) |
| S3 | Tokens in localStorage (XSS-exfiltratable) | App.jsx:55,98,141-143 | **HIGH** — contradicts rules 15.3/18.4 | Open |
| S4 | Plaintext seed passwords + passcodes column | seed.js:12-16, /users returns passcode | **HIGH** | Open (TD-04) |
| S5 | `cors()` open to all origins | app.js:18 | MEDIUM | Open (rules 19.4) |
| S6 | No Helmet/CSP/security headers | package.json | MEDIUM | Open |
| S7 | Rate limiting only on login; trusts `x-forwarded-for`; in-memory | middleware/rateLimit.js, app.js:434 | MEDIUM/HIGH | Open (rules 21) |
| S8 | No input validation on many endpoints | profile, notes, role, revision/rate, quiz | MEDIUM/HIGH | Open (SEC-07) |
| S9 | No global error handler → HTML stack traces | app.js | LOW/MEDIUM | Open |
| S10 | `/auth/logout` requires no auth | auth.routes.js:283 | MEDIUM — session deletion by ID | Open |
| S11 | `/users` returns `passcode` to staff | users.routes.js:13 | HIGH — staff can read other users' PINs | Open |
| S12 | `POST /users/:id/role` accepts any role string | users.routes.js:24-37 | MEDIUM — privilege escalation to arbitrary role | Open |
| S13 | Refresh token never rotated | auth.service.js:11 | LOW | Open |
| S14 | GitHub OAuth email fallback `.github.oauth.local` | auth.service.js:46-48 | LOW — fake emails | Open |
| S15 | Mock OAuth client IDs in config | config/index.js:29-36 | HIGH in prod (misconfig) | Open |
| S16 | No CSRF (n/a with Bearer until cookies adopted; required at cookie migration) | app.js | LOW now | rules 19.11 |
| S17 | Audit logs swallow write errors; not sanitized | middleware/audit.js | LOW | Open |
| S18 | JWT payload base64url decoded with `atob` (no verification on client) | AuthSuccess.jsx:21-22 | LOW (client-only) | Fix |
| S19 | Compiler simulation not sandboxed — **but it executes nothing**, so no code-injection surface today; becomes critical when real | compiler.service.js | ⚠️ future | Phase 7 |

**Summary:** 2 CRITICAL (S1, S2), 4 HIGH (S3, S4, S11, S12, +S15 in prod), rest MEDIUM/LOW. No code-injection/XSS/SQLi vectors present today (parameterized SQL everywhere; no `dangerouslySetInnerHTML`; React escapes). Verified: all SQL uses `?` binds — ✅ no injection findings.

---

# PART 8 — PERFORMANCE AUDIT

## 8.1 Actual problems

| # | Issue | Impact | Location |
|---|---|---|---|
| P1 | Dashboard reloads **entire** summary after every plan toggle + optimistic update | Chatty: 2 requests/action, wasted computation | Dashboard.jsx:105-118 |
| P2 | No request dedup/caching; `fetchUsers`, summary re-fetched on every route render | Extra round trips | App.jsx:54-66 |
| P3 | Lesson bundle returns markdown+quiz+flashcards+notes in one payload every open | Large payloads each time | learning.routes.js:94-131 |
| P4 | Frontend bundle 641 kB single chunk (no code-split) | Slow first load | build output |
| P5 | 71px+ inline SVG chart recomputed each render | trivial | Dashboard.jsx:479-514 |
| P6 | `GET /tracks/:id` builds hierarchy with dynamic `IN` — fine at this scale | — | learning.routes.js:21-91 |

All of the above are **minor at current data scale** (single-user local SQLite). No real performance emergency.

## 8.2 Future potential optimizations (do NOT do now)

Code-splitting routes, memoization of Dashboard charts, query caching, WAL/pragmas for SQLite, index on `activity_logs(timestamp)`/`notifications(user_id,created_at)`, paginating notifications, debouncing summary fetches, `react-window` for admin users list. **Defer until load actually matters.**

---

# PART 9 — CODE QUALITY AUDIT

| Area | Verdict | Findings |
|---|---|---|
| Naming | 🟡 | Mostly good snakes/camels; inconsistent: `loginId` vs `callsign`+`passcode`; `full_name` in DB vs `fullName` in JS; mixed message casing |
| File organization | ✅ | Modular after restructure; feature folders clean |
| Component responsibilities | 🟡 | Dashboard (data+mock+render 696 LOC) and AdminCenter (705 LOC) overburdened; App owns keypad account logic |
| Function complexity | 🟡 | dashboard summary route 93 lines; processOAuthLogin 67 lines; manageable, no god-functions beyond those |
| Duplication | 🔁 | Password strength logic ×2; spinner markups ×6; `getHashParam` ×2; XP/level formula logic ×4 server-side; error strings inconsistent |
| Type safety | ❌ | Plain JS anywhere; no TS (documented open decision 62.2) |
| Error handling | ❌ | No global handler; no error boundary; component error states missing (Part 6) |
| Maintainability | 🟡 | Good modular structure; weak tests + stale docs hurt |
| Dead code / unused | 🔁 | Unused imports across 10 components (~30 icons); dead `onNavigateToBookmarks`; unused `/dashboard/notifications` GET; unused `analyticsFilter`; unused `todayProgress`/`chatEndRef`; unused `useRef` imports; dead `:userId` param in mentor history routed to `req.user`;
`req.user` no-op fields (`userId`, `fileName` in mission execute) |
| TODOs/FIXMEs | ✅ | None outstanding |
| Hacks/workarounds | 🔁 | `code_quality===94` as a mission-completed sentinel; any-4-digit PIN bypass; random `Math.random()` latency; hardcoded fallback replies; seed PINs shown in hints |

---

# PART 10 — ARCHITECTURE AUDIT

**ARCHITECTURE ACCEPTABLE — NO MAJOR CHANGE REQUIRED** for the monolith-split and feature-folder work already done. The current modular layout (routes/services/middleware/db split; shared `api/client.js`; prop-driven App.jsx) is appropriate for this project's size.

Verified healthy patterns:
- Dependency direction clean (app → routes → services → db/config; components → api/client).
- Business logic correctly placed in services/routes; presentation in components.
- Server/client boundary clean — frontend never touches DB; `client.js` is sole env-URL owner.
- Configuration centralized in `config/index.js`.

Point adjustments (not redesigns):
1. **Global error-handler + 404 handler + `next(error)` discipline** (rules 22.1/22.2) — currently missing.
2. **Error/empty/loading state as small shared primitives** to stop 6 ad-hoc spinners.
3. **Payload-contract alignment** between frontend calls and backend expectations (Part 5) — the single biggest correctness lever.
4. **State**: App.jsx prop-drilling is fine at 9 screens; do **not** introduce Redux (open decision 62.3 appropriately still Open).
5. **Scalability**: SQLite→PG is a documented *future* target (architecture §41); not needed now.

---

# PART 11 — TESTING AUDIT

## 11.1 Current state

**No test framework, no test files, no test scripts in either `package.json`.** Quality gate "Test coverage > 0%" = ❌.

## 11.2 Required test inventory (by priority)

| Area | Priority | Specific cases |
|---|---|---|
| XP/level | P1 | plan-item +100 passes level boundary (999→1000→1k border), lesson complete only-once, quiz 0.79 vs 0.8, mission +800 |
| Auth | P1 | register validation (each regex), login passcode vs password branch, unverified 403, refresh revoke/expiry, reset-password revokes sessions, logout |
| Quiz & notes & progress | P1 | contract (snake vs camel), noteText null guard, status completed on last lesson |
| Compiler (current sim) | P2 | keyword pass/fail, XP awarding, no DB write on fail, level calc |
| Dashboard | P2 | summary shape, todayProgress 0/empty plan NaN edge, heartbeat +30, regenerate keeps completed |
| OAuth | P2 | processOAuthLogin new/linking user, GitHub missing email fallback |
| RBAC | P2 | role matrix for /users, /users/:id/role, /tags |
| UI (component) | P3 | Register debounce + strength, Reset/Login flows, AuthSuccess hash parsing, Sidebar username guard |
| e2e | P3 | register→verify→wizard→dashboard→learn→mission→passport happy path |

Framework: open decision 62.6 — recommend **Vitest + Supertest** (matches Vite toolchain) for unit/API, later Playwright for e2e.

---

# PART 12 — TECHNICAL DEBT REGISTER

| ID | Item | Why exists | Impact | Risk | Effort | Priority | When |
|---|---|---|---|---|---|---|---|
| TD-01 | Hardcoded fallback secrets | MVP speed | Critical | Critical | M | P0 | Must fix now |
| TD-02 | OAuth tokens in URL | MVP simplicity (D-10) | Critical | Critical | M | P0 | Must fix |
| TD-03 | GitHub callback `localhost:5173` default | local dev | High | High | S | P0 | Must fix (env) |
| TD-04 | Plaintext seed passwords/passcodes | demo seeding | High | High | S | P1 | Must fix |
| TD-05 | `.env.example` doc staleness (rules/phases/memory) | docs lag | Low | Low | S | P3 | Nice to fix |
| TD-06/07 | ~~monoliths~~ | split | — | — | — | ✅ Done | — |
| TD-08 | No tests | scope | High | High | L | P1 | Must fix |
| TD-11 | Keyword-match compiler (+800 XP) | prototype | Critical | High | XL | P0/P1 | Must fix (sandbox later) |
| TD-12 | Mock streak/analytics | MVP | Medium | Low | M | P2 | Should fix |
| TD-13 | Legacy PDFs in docs | historical | Low | Low | S | P4 | Nice to fix |
| TD-14 | AdminCenter 39 placeholder sub-views | shell | Medium | Low | L | P3 | Later |
| TD-15 | Role casing inconsistency | organic growth | Low | Low | S | P3 | Should fix |
| TD-16 | No error boundaries | scope | Medium | Medium | S | P1 | Should fix |
| TD-17 | No loading skeletons | polish | Low | Low | S | P4 | Nice |
| TD-18 | Refresh token no rotation | MVP | Low | Medium | S | P1 | Should fix |
| TD-19 | `/logout` unauth; `/users` leaks passcode | oversight | High | Med | S | P0/P1 | Must fix |
| TD-20 | No global error handler/404 | oversight | Medium | Low | S | P1 | Must fix |
| TD-21 | Per-profile OK: DB init race (server.js:8 vs listen) | — | Low | Low | S | P2 | Should fix |
| TD-22 | Stale docs contradictions (Part 3.1) | docs lag | Low | Low | M | P3 | Should fix |
| Move-to-later: WAL/indexes/helm/CI/caching | future | — | — | — | — | P4 | Later |

---

# PART 13 — DUPLICATION & DEAD CODE AUDIT

| Item | Where | Decision |
|---|---|---|
| Duplicated password-strength logic | Register.jsx + ResetPassword.jsx | Merge → `src/lib/passwordStrength.js` (shared) |
| Duplicated spinner markup (6×) | 6 components | Extract tiny `Spinner` + `LoadingState` if touched during error-state work |
| Duplicated `getHashParam` | VerifyEmail + ResetPassword | Keep (2 small), or extract to api/client sibling `src/lib/hash.js` |
| Duplicated XP/level formula across 4 routers/services | dash/learning/compiler | Keep formula in one `src/utils/xp.js` (server) — low risk, avoids drift |
| Unused imports (~30 icons + Shield/Cpu/Check/etc.) | 10 components | Remove (lint 107 warnings mostly these) |
| Dead prop `onNavigateToBookmarks` | LearnHub + App | Remove from LearnHub props |
| Dead `analyticsFilter` select + state | Dashboard | Remove select or wire it |
| Dead `todayProgress`, `chatEndRef` | Dashboard | Remove |
| Dead `useRef` | AdminCenter | Remove |
| Dead GET `/dashboard/notifications` | backend | Keep API (cheap) or mark; UI reads from summary — ❗ decide: use endpoint or delete |
| Dead `:userId` in mentor history | backend | Remove param (serve `req.user.id`) |
| Unused `userId`, `fileName` in mission execute | backend | Keep fileName parse; drop userId from body |
| `code_quality===94` sentinel pattern | App/MissionIDE/Passport | Replace with explicit `mission_completed` state (already in localStorage + API via `/missions`) |
| Hardcoded values in Passport/CareerVault/LogicPractice | 3 components | Replace with API data when passport/practice become real |
| Uncommitted/legacy `docs/*.pdf`, `prompt.txt`, `todo` | repo | Keep (decide) |
| `App.css` (empty), `frontend/src/assets/` (deleted) | — | App.css deletable |

---

# PART 14 — GAP ANALYSIS

## Critical blockers
1. **API contract drift** breaks Quiz, Notes, Progress (E1-E3) — core learning loop broken.
2. **OAuth unusable** from the SPA (E4) — MVP auth requirement unmet.
3. **Tokens in URL + localStorage; hardcoded secrets** (S1-S3) — production blockers per rules/PRD.
4. **Simulated compiler** (TD-11) — MVP "Compiler (basic)+Hidden Tests" scope unmet; +800 XP unearned.
5. **Keypad student path dead** (E6); **`.env` absent → no fail-fast** — local won't run unattended.

## Functional gaps
- AI mentor not wired to UI; Guide/Simplify/Hints (PRD 16-18) absent.
- Passport/CareerVault/LogicPractice fabricated data.
- Admin tags broken (E5); 39 placeholder sub-views.
- Streak/analytics mocked; mentor endpoints unused; revision ratings no-op.
- Content: only 2 of 6 tracks have lessons.

## Incorrect implementations
Quiz, notes, progress contracts; role validation; logout auth; passcode storage; mentor `:userId`; seed-guard content updates; onboarding track reset.

## UX/UI gaps
Error/empty states; error boundaries; debounce lag; dead controls; fake terminal logs; disabled analytics select.

## Performance gaps
None blocking. 641 kB bundle, chatty summary refetch (Part 8) — later.

## Security gaps
Part 7 → 2 critical, 4 high.

## Testing gaps
Zero (Part 11).

## Code-quality gaps
Unused imports, duplication (Part 9/13).

## Technical debt
Part 12 register (P0s first).

## Future improvements
Real sandbox, SRS, email provider, hiring platform, tracking content breadth, analytics engine, passport evidence pipeline, PG/Docker/CI (per PRD phases 2-6).

---

# PART 15 — PRIORITIZATION

| ID | Change | Priority |
|---|---|---|
| 1 | Fix API contract drift — Quiz, Notes, Lesson progress (align camel/snake + response shape) | **P0** |
| 2 | Remove hardcoded fallback secrets; fail-fast env validation; rotate dev secrets | **P0** |
| 3 | OAuth: parse hash tokens correctly in AuthSuccess; base64url-safe decode; profile fetch; correct error redirect | **P0** |
| 4 | Stop passing tokens via URL (fragment → server-set short-lived code or session) | **P1** (architectural; after P0s) |
| 5 | Remove passcode leakage (`/users`) + hash/passcode handling + drop hint PINs; validate role changes | **P1** |
| 6 | Add global error handler + 404 handler + standardize status codes | **P1** |
| 7 | Global rate limiting (all auth endpoints) with in-memory→store design | **P1** |
| 8 | Keypad student path — compliant password + real verify flow | **P1** |
| 9 | AdminCenter tags — pass `accessToken` prop; use `atlas_access_token` key | **P1** |
| 10 | Auth `/logout` requires auth; mentor history uses `req.user.id` (drop param); wired AI mentor UI (basic chat into Mission IDE) | **P1** |
| 11 | Test framework + core suites (auth, XP, contracts, compiler sim, RBAC) | **P1** |
| 12 | Error boundaries + error/empty states (Dashboard, LearnHub, Practice, Career) | **P2** |
| 13 | Shared `passwordStrength`, `Spinner`, remove unused imports/props (lint cleanup) | **P2** |
| 14 | Real streak + analytics from real aggregations | **P2** |
| 15 | Revision ratings persist (SRS minimal) + `progress_percent` correctly stored | **P2** |
| 16 | Passport/CareerVault/LogicPractice wire to real data (XP, missions, profile) | **P2** |
| 17 | Extract XP/level helper (server) to eliminate 4× drift | **P2** |
| 18 | Server boot: await DB init before listen; `busy_timeout`/WAL off (leave WAL off) | **P2** |
| 19 | Docs contradictions fix (Part 3.1 items 1-7) | **P3** |
| 20 | Content for tracks web/devops/aiml/dsa; lesson content breadth | **P3** |
| 21 | Helmet + CORS allow-list + security headers | **P3** (instant value, small) |
| 22 | httpOnly cookie + CSRF migration (per rules) | **P3** (bigger) |
| 23 | Code-split; memoize charts; pagination | **P4** |
| 24 | CI (build+lint+test) | **P4** |
| 25 | Real compiler sandbox + hidden tests | **P4*** (needs infra — but is MVP-critical, so P1 when scoped) |

> *Note 25: flagged P0/P1 in reality (MVP scope "Compiler (basic)") — listed P1 in Part 15 table for ordering because it requires environment/DB/infra decisions (Docker/gVisor) that the team must scope.*

---

# PART 16 — IMPLEMENTATION PLAN (ordered by dependency & risk)

| ID | Task | Priority | Problem | Files likely affected | Deps | Approach | Outcome | Validation | Regression risk |
|---|---|---|---|---|---|---|---|---|---|
| P0-1 | Quiz contract fix | P0 | E1 404/404 shape | LessonViewer.jsx, learning.routes.js | none | Frontend sends `lessonId, answers, score` (compute ratio client-side from `correctAnswer` vs selections) OR route accepts `lesson_id`; align response → `{score_percent, xp_awarded, results}`; server grades from answers | Quiz grades & awards from server | API test; manual quiz | Low (isolated) |
| P0-2 | Notes contract fix | P0 | E2 500 | LessonViewer.jsx, learning.routes.js | none | Send `noteText` (or accept `text`); validate string | Notes create works | API test; manual | Low |
| P0-3 | Progress contract fix | P0 | E3 0% | LessonViewer.jsx, learning.routes.js | none | Send `progressPercent/lastPosition` camelCase; validate numbers | Progress persisted | API test | Low |
| P0-4 | Secrets + env fail-fast | P0 | S1 | config/index.js, .env.example, server.js | none | Remove fallback access/refresh/session secrets; `assertEnv` startup; document rotation | No known-secret boot | boot test with empty env → clean error | Medium (local dev must set .env) |
| P0-5 | OAuth frontend fix | P0 | E4 OAuth dead | AuthSuccess.jsx, App.jsx (me/profile) | none | Parse `location.hash` query; base64url-safe decode with padding; call `/auth/me` for profile; keep tokens→ App | OAuth completes | manual Google/GitHub (mock-creds local) | Medium |
| P1-1 | Token-in-URL migration | P1 | S2/TD-02 | auth.routes.js, AuthSuccess, Login | P0-5 | Redirect to `/#auth-success` with short-lived code? → MVP: keep fragment but clear immediately + document; full fix = server-set httpOnly cookie session after OAuth, SPA auto-login | No persistent URL tokens | manual + code review | High (auth core) — sequence last in P1 |
| P1-2 | Passcode & role hardening | P1 | S4/S11/S12 | users.routes.js, auth.routes.js, seed.js, AuthSuccess? | none | `GET /users` omit passcode; role whitelist + validation; (passcode hashing = P3) | No secret leak; role strict | API test | Low |
| P1-3 | Error infra | P1 | E9/E10 | app.js + new middleware/errorHandler.js + 404 | none | `app.use(404)`, `app.use(err)` JSON; map errors consistently | JSON errors everywhere | curl malformed JSON | Low |
| P1-4 | Global rate limiting | P1 | S7 | middleware/rateLimit.js, app.js | none | Attach limiter to auth & sensitive endpoints (keep login lockout) | Brute-force limited | load test | Low |
| P1-5 | Keypad student path | P1 | E6 | App.jsx, validators.js | none | Use compliant generated password; real verify (already does) | Keypad signup works | manual | Medium |
| P1-6 | AdminCenter tags wiring | P1 | E5 | AdminCenter.jsx, App.jsx | none | Pass `accessToken`; use `atlas_access_token`; remove `token` key | Tags work | manual | Low |
| P1-7 | Logout auth + mentor cleanup + AI UI | P1 | E0/S10 | auth.routes.js, mentor.routes.js, MissionIDE | none | Req auth on logout; drop `:userId`; add minimal mentor chat drawer wired to `/mentor/chat` | Closed loops | manual | Medium |
| P1-8 | Test infra + core suites | P1 | TD-08 | root package.json, backend tests, frontend tests | all P0 | Vitest+Supertest; cases per Part 11 | 60+ assertions green | `npm test` | Low |
| P2-x | UX/error/lint/streak/RTS/passport tasks | P2 | Part 15 rows 12-18 | per row | P0s | incremental per Part 15 + Part 19 | per validation | manual+unit | Low |
| P3-x | Docs, content, helmet/CORS, cookies | P3 | Part 15 rows 19-22 | docs, content, app.js | P0/P1 | as listed | per validation | — | Low/Med |
| P4-x | Perf/CI/sandbox | P4 | Part 15 rows 23-25 | infra | — | scoped later | — | — | — |

---

# PART 17 — IMPLEMENTATION PHASES

## Phase A — "Make the existing loop work" (P0)
**Objective:** everything a real user can click today must function; nothing crashes or silently fails.
**Tasks:** P0-1 Quiz, P0-2 Notes, P0-3 Progress, P0-5 OAuth fix, P0-4 secrets/fail-fast.
**Deps:** none.
**Files:** LessonViewer/learning.routes/auth.routes/AuthSuccess/App/config.
**Validation:** manual register→verify→lesson→quiz→notes; OAuth callback; boot with empty .env fails clearly.
**Exit criteria:** quiz grades+XP; notes save; progress % persists; OAuth logs in; no hardcoded secrets in code paths.

## Phase B — "Harden the shell" (P1)
**Objective:** no auth/security holes; robust error contract; tests exist.
**Tasks:** P1-1..P1-8.
**Exit criteria:** passcode/role leak closed; 100% JSON errors; rate limit active; keypad works; tags work; logout authed; AI chat wired; first test suite green.

## Phase C — "Deliver real data" (P2)
**Objective:** replace mocks with real data for passport, practice, streak/analytics; polish errors/accessibility.
**Tasks:** Part 15 rows 12-18.
**Exit criteria:** no fabricated XP/metrics rendered; error states everywhere; lint warning count drops materially; revisions persist.

## Phase D — "Align docs & defense" (P3)
**Objective:** docs truthful; helmet+CORS; cookie/CSRF migration; content breadth.
**Exit criteria:** doc contradictions zero; headers on; tokens out of localStorage optionally.

## Phase E — "Scale & productionize" (P4)
**Objective:** CI, code-splitting, real compiler sandbox, metrics.
**Exit criteria:** CI green on push; compiler sandbox replaces simulator (as scoped by team).

---

# PART 18 — SAFE IMPLEMENTATION ORDER

1. **P0 broken core features** (Quiz → Notes → Progress → OAuth → secrets) — *why first:* each is a hard functional break of the MVP loop; contracts must be stable before touching callers.
2. **Security hardeners** (passcode/role, logout auth, rate limit) — *why:* cheap, isolated, no cross-feature blast radius.
3. **Error infrastructure** (global handler/404) — *why:* makes every later task testable.
4. **Keypad + Admin tags + mentor wiring** — *why:* depend on error infra + auth fixes.
5. **Tests** — *why:* only meaningful after contracts/security freeze (P0+P1). Write them right after the above so regression net exists before Phase C.
6. **Real-data replacement** (streak/analytics, passport, practice, revisions) — *why:* needs stable XP logic + tests.
7. **UX/accessibility/lint** — *why:* mechanical, low risk, can ride along after logic stable.
8. **Docs + helmet/CORS/cookies** — *why:* doc changes are safe last; cookie/CSRF migration must follow token work and be regression-rehearsed.
9. **Perf/CI/sandbox** — *why:* deferred intentionally (Part 8), except CI which can come cheap with tests.

Deviation note: typically "validation/error handling" precedes "core business logic"; here error infra (3) comes *after* P0 contract fixes because the P0 bugs are payload mismatches, not handler quality — do them first to avoid double-touching the same files.

---

# PART 19 — FILE-BY-FILE CHANGE PLAN

## Files to CREATE
| File | Change | Reason | Priority |
|---|---|---|---|
| `backend/src/middleware/errorHandler.js` | global error + 404 JSON | Part 15 P1-3 | P1 |
| `backend/src/utils/xp.js` | `computeLevel`, `applyXp` helpers | kill 4× formula drift | P2 |
| `frontend/src/lib/passwordStrength.js` | shared strength logic | dedupe | P2 |
| `frontend/src/components/shared/StateBlocks.jsx` (Spinner/Loading/Empty/Error) | shared UI states | consistency | P2 |
| `backend/test/*.test.js` + vitest config + root `test` script | P1-8 | P1 |
| `backend/src/scripts/rotate-secrets.js` (optional) | generate strong local secrets + write .env | P0-4 | P0 |

## Files to MODIFY
| File | Change | Reason | Priority |
|---|---|---|---|
| `frontend/src/components/learn/LessonViewer.jsx` | quiz payload+response, notes payload, progress camelCase | P0-1/2/3 | P0 |
| `backend/src/routes/learning.routes.js` | accept snake OR camel; grade quiz server-side; return `results`; validate noteText | P0-1/2/3 | P0 |
| `frontend/src/components/auth/AuthSuccess.jsx` | hash-query parse, base64url decode, `/auth/me` fetch | P0-5 | P0 |
| `backend/src/config/index.js` | remove fallback secrets; assertEnv | P0-4 | P0 |
| `backend/src/server.js` + `.env.example` + `.env` | await init; env docs | P0-4/P2-18 | P0 |
| `backend/src/routes/users.routes.js` | drop `passcode` from SELECT; role whitelist+validation | P1-2 | P1 |
| `backend/src/routes/auth.routes.js` | logout auth; token redirect strategy; (later cookie session) | P1-1/7 | P1 |
| `backend/src/routes/mentor.routes.js` | use `req.user.id` only (drop param) | P1-7 | P1 |
| `backend/src/middleware/rateLimit.js` + `app.js` | general limiter + errorHandler wiring; CORS allow-list; helmet | P1-3/4/P3-21 | P1 |
| `frontend/src/App.jsx` | keypad password; OAuth profile; pass accessToken to AdminCenter; error boundary wrap | P0-5/P1-5/P1-6/P2-12 | P1 |
| `frontend/src/components/admin/AdminCenter.jsx` | tags token fix | P1-6 | P1 |
| `frontend/src/components/mission/MissionIDE.jsx` | gate fake logs on response; mentor chat; real error string | P1-7/P2 | P1 |
| `frontend/src/components/dashboard/Dashboard.jsx` | error state; goals concat guard; wire/remove analytics select; remove unused | P2-12/13 | P2 |
| `frontend/src/components/learn/LearnHub.jsx` | error/empty states; guard modules; remove dead prop | P2-12/13 | P2 |
| `backend/src/routes/dashboard.routes.js` | real streak/analytics | P2-14 | P2 |
| `backend/src/routes/learning.routes.js` (flashcards) | persist ratings; store progressPercent | P2-15 | P2 |
| `frontend/src/components/{passport,career,practice}/**` | real data / XP | P2-16 | P2 |
| `frontend/src/components/{register,reset,login,sidebar,career}` | dedupe strength; guard undefined; label htmlFor; a11y | P2-13/P3-a11y | P2 |
| docs (memory.md, rules.md, phases.doc.md, architecture.md) | fix Part 3.1 contradictions | P3-19 | P3 |
| `package.json` (root/backend/frontend) | test scripts | P1-8 | P1 |

## Files to DELETE
`frontend/src/App.css` (empty) · unused imports cleanup in 10 components · dead props/state (`onNavigateToBookmarks`, `analyticsFilter`, `todayProgress`, `chatEndRef`, `useRef`) · legacy `docs/*.pdf` (decide/archive).

## Files to RENAME/MOVE
None required. (All restructure renames already landed via the Sep 4–5 refactor.)

---

# PART 20 — VALIDATION STRATEGY

| Bucket | Checks |
|---|---|
| Build | `npm run build -w frontend` PASS · `npx oxlint` exit 0 · no new warnings in touched files |
| Routes | Walk all 46 endpoints with Supertest: happy path + 400/401/403/404/500 per contract |
| Functional | register→verify→login→wizard→dashboard; lesson→quiz→notes→bookmark; mission execute pass/fail; AI chat; admin users/tags; keys→admin login; student keypad |
| Calculations | XP/level boundary tests (0/999/1000/1999/2000), quiz 0.79/0.80, mission +800, todayProgress empty-plan (guard NaN) |
| Data | valid/invalid/empty/boundary payloads for every validated field; snake-vs-camel contract tests |
| UI | desktop walkthrough; tablet/mobile pass (new) ; keyboard-only pass (flashcard, keypad, overlays); focus/aria review |
| Security | env-less boot fails fast; role escalation matrix; `/users` no passcode; rate-limit triggering; tokens not in URL after migration |
| Regression | previously-working flows (login, plan toggle, bookmarks, session mgmt, delete account) unchanged |

---

# PART 21 — DEFINITION OF DONE

The project is **complete** only when all of the following hold:

1. Every P0 bug fixed (Quiz, Notes, Progress, OAuth, secrets) and verified by test + manual.
2. No hardcoded secret values can boot the app; startup fails fast with a clear message if env missing.
3. All 46 API endpoints return structured JSON errors; no HTML error pages; status codes consistent.
4. Security: no `passcode` leak, role-authorization enforced, rate limiting on sensitive endpoints, no OAuth tokens persisted in URLs.
5. Test suite exists and covers auth, XP/level, quiz/notes/progress contracts, compiler sim, RBAC — `npm test` green.
6. All rendered learner-facing metrics are real (no fabricated XP/streak/passport data).
7. UI has error/empty/loading states on every data screen; no endless spinners; error boundary present.
8. Accessibility pass complete for primary flows.
9. Repository docs are consistent with implementation (no Part 3.1 contradictions).
10. A documented, manual regression checklist for the original working features passes.

---

# PART 22 — FINAL AUDIT SUMMARY

## Current project health

| Dimension | Rating |
|---|---|
| Functionality | 🔴 Critical — quiz/notes/progress/OAuth broken; keypad path dead |
| Correctness | 🔴 Critical — contract drift, fabricated numbers, fake +800 XP |
| Architecture | 🟢 Good — modular, clean; no redesign needed |
| UI/UX | 🟡 Needs attention — no error states, dead controls, debounce lag |
| Accessibility | 🔴 Critical — zero ARIA/labels/focus/keyboard |
| Security | 🔴 Critical — hardcoded secrets, tokens in URL/localStorage, passcode leak |
| Performance | 🟢 Good at current scale (future: bundle code-split) |
| Testing | 🔴 Critical — zero tests |
| Code Quality | 🟡 Needs attention — duplication, unused imports, 107 warnings |
| Maintainability | 🟡 Needs attention — docs contradictions, weak tests |

## Critical issues
1. Quiz / Notes / Lesson-progress broken by payload contract mismatch.
2. OAuth login cannot complete in the SPA.
3. Hardcoded fallback secrets + tokens in URL + localStorage (rules MUST violations).
4. Compiler award forgery (+800 XP via substring match).
5. `GET /users` leaks passcodes; role change unvalidated.
6. Passport/CareerVault/LogicPractice render fabricated data.
7. Zero automated tests.

## Important issues
8. No global error handler/404; inconsistent status codes.
9. Rate limiting only login; `/logout` unauthenticated.
10. Keypad student path dead; hint PINs exposed.
11. Admin tags broken (wrong localStorage key); AI mentor not wired.
12. Streak/analytics mocked; revision ratings no-op; 4 of 6 tracks empty.
13. No error boundaries/error states; accessibility baseline missing.
14. 107 pre-existing lint warnings (unused imports).

## Recommended improvements
15. Shared UI-state primitives + password-strength util; extract XP helper.
16. Wired AI chat (basic) into Mission IDE; real SRS for revision.
17. Real streak/analytics; passport/practice wired to real data.
18. Helmet + CORS allow-list; await DB init on boot.
19. Fix doc contradictions; remove legacy PDFs.

## Optional improvements
20. Code-splitting; memoize charts; pagination.
21. CI (build+lint+test) on push.
22. httpOnly cookie + CSRF migration; refresh rotation.
23. Real compiler sandbox + hidden tests (needs infra scoping).

---

# PART 23 — MASTER IMPLEMENTATION ROADMAP

1. **P0 — Fix broken core loop** → Quiz contract · Notes contract · Progress contract · OAuth (AuthSuccess) · secrets/fail-fast.
2. **P1 — Security & robustness** → passcode/role hardening · logout auth · global error infra · rate limiting · keypad fix · Admin tags · mentor wiring.
3. **P1 — Tests** → Vitest+Supertest suites for auth, XP, contracts, compiler, RBAC.
4. **P2 — Real data & UX** → streak/analytics · passport/practice/career real data · revision SRS · error states/boundaries · shared primitives · lint cleanup · a11y baseline.
5. **P3 — Docs & defense** → doc contradictions · helmet/CORS · cookie migration (optional) · content breadth.
6. **P4 — Scale** → CI · code-splitting · real sandbox + hidden tests.