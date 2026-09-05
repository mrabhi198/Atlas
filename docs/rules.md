# Rules.md — Atlas Engineering Constitution

**Document Status:** Living constitution — subject to governance process.
**Last Updated:** 2026-09-04
**Source-of-Truth Hierarchy:** PRD.md > architecture.md > Design.md > Rules.md > Memory.md > intro.txt
**Authority:** Governs all implementation, review, and architectural decisions.
**Enforcement:** All PRs and code changes must comply. Violations require documented justification.

---

## Table of Contents

1. [Document Purpose & Governance](#1-document-purpose--governance)
2. [Terminology](#2-terminology)
3. [Source-of-Truth Hierarchy](#3-source-of-truth-hierarchy)
4. [Implementation Status Legend](#4-implementation-status-legend)
5. [File Naming Conventions](#5-file-naming-conventions)
6. [Module Organization](#6-module-organization)
7. [Repository Structure](#7-repository-structure)
8. [Monorepo Rules](#8-monorepo-rules)
9. [Server Architecture Rules](#9-server-architecture-rules)
10. [Database Rules](#10-database-rules)
11. [Schema Management Rules](#11-schema-management-rules)
12. [Data Validation Rules](#12-data-validation-rules)
13. [SQL Query Rules](#13-sql-query-rules)
14. [API Design Rules](#14-api-design-rules)
15. [Authentication Rules](#15-authentication-rules)
16. [Authorization Rules](#16-authorization-rules)
17. [Session Management Rules](#17-session-management-rules)
18. [Token Handling Rules](#18-token-handling-rules)
19. [Security Headers Rules](#19-security-headers-rules)
20. [Input Sanitization Rules](#20-input-sanitization-rules)
21. [Rate Limiting Rules](#21-rate-limiting-rules)
22. [Error Handling Rules](#22-error-handling-rules)
23. [Logging Rules](#23-logging-rules)
24. [Environment Configuration Rules](#24-environment-configuration-rules)
25. [Secret Management Rules](#25-secret-management-rules)
26. [Frontend Architecture Rules](#26-frontend-architecture-rules)
27. [React Component Rules](#27-react-component-rules)
28. [Routing Rules](#28-routing-rules)
29. [State Management Rules](#29-state-management-rules)
30. [API Client Rules](#30-api-client-rules)
31. [UI Component Library Rules](#31-ui-component-library-rules)
32. [Styling Rules](#32-styling-rules)
33. [Form Handling Rules](#33-form-handling-rules)
34. [Error Boundary Rules](#34-error-boundary-rules)
35. [AI Integration Rules](#35-ai-integration-rules)
36. [AI Provider Rules](#36-ai-provider-rules)
37. [AI Prompt Engineering Rules](#37-ai-prompt-engineering-rules)
38. [AI Response Handling Rules](#38-ai-response-handling-rules)
39. [Compiler Rules](#39-compiler-rules)
40. [Code Execution Rules](#40-code-execution-rules)
41. [Mission Rules](#41-mission-rules)
42. [Lesson Rules](#42-lesson-rules)
43. [Quiz Rules](#43-quiz-rules)
44. [Spaced Repetition Rules](#44-spaced-repetition-rules)
45. [Passport/Portfolio Rules](#45-passportportfolio-rules)
46. [Dashboard Rules](#46-dashboard-rules)
47. [Notification Rules](#47-notification-rules)
48. [File Upload Rules](#48-file-upload-rules)
49. [Caching Rules](#49-caching-rules)
50. [Performance Rules](#50-performance-rules)
51. [Database Indexing Rules](#51-database-indexing-rules)
52. [Testing Rules](#52-testing-rules)
53. [Linting Rules](#53-linting-rules)
54. [Type Checking Rules](#54-type-checking-rules)
55. [CI/CD Rules](#55-cicd-rules)
56. [Deployment Rules](#56-deployment-rules)
57. [Monitoring Rules](#57-monitoring-rules)
58. [Documentation Rules](#58-documentation-rules)
59. [Version Control Rules](#59-version-control-rules)
60. [Dependency Management Rules](#60-dependency-management-rules)
61. [Accessibility Rules](#61-accessibility-rules)
62. [Open Engineering Decisions](#62-open-engineering-decisions)
63. [Code Review Checklist](#63-code-review-checklist)
64. [Final Audit](#64-final-audit)
65. [Changelog](#65-changelog)
66. [Owner & Contacts](#66-owner--contacts)

---

## 1. Document Purpose & Governance

### 1.1 Purpose

This document is the **engineering constitution** for the Atlas project. It governs every technical decision, code change, and architectural evolution. It exists to:

- Ensure consistency across all code contributions
- Prevent technical debt accumulation without justification
- Provide a single reference for "how we build Atlas"
- Enforce security, performance, and quality standards
- Guide AI coding agents and human contributors equally

### 1.2 Governance Process

| Action | Process |
|--------|---------|
| Add new rule | Create PR with rule proposal, require 2 approvals, update changelog |
| Modify rule | Create PR with justification, require 1 approval, update changelog |
| Deprecate rule | Mark as deprecated in rules.md, require 1 approval, update changelog |
| Emergency bypass | Document in PR, require lead approval, create follow-up to restore compliance |

### 1.3 Enforcement

- **All PRs** must comply with applicable rules
- **CI/CD** will enforce automated rules (linting, type checking, tests)
- **Code review** will enforce manual rules (architecture, security, naming)
- **Violations** require documented justification in PR description

### 1.4 Status Tags

Every rule uses one of three status tags:

| Tag | Meaning |
|-----|---------|
| **CURRENT** | This rule is actively implemented and enforced in the codebase today |
| **TARGET** | This rule describes the desired state; implementation is planned or in progress |
| **REQUIRED** | This rule is mandatory but not yet implemented; must be addressed before production |

---

## 2. Terminology

| Term | Definition |
|------|------------|
| **Atlas** | The AI-powered software engineering learning ecosystem |
| **Student** | Default role for new users (db.js default `'Student'`) |
| **jr architect** | Learner/architect role (seed user 'abhi') |
| **guider** | Learner/guider role (seed user 'vikram') |
| **mentor** | Mentor role (seed user 'sarah') |
| **admin** | Admin role (seed user 'elena') |
| **super admin** | Super admin role (seed user 'alex') |
| **Mission** | A multi-step engineering task (real-world scenario) |
| **Lesson** | Educational content with structured learning flow |
| **Flashcard** | Spaced repetition learning card |
| **Passport** | Learner portfolio/career profile |
| **MissionIDE** | The Atlas code editor component for mission execution |
| **Heartbeat** | Background polling system (30s interval) for study duration sync |
| **Session** | Authenticated user session (JWT-based, express-session for OAuth) |
| **Skill Tag** | Categorized competency (e.g., "DSA", "System Design") |
| **Hint** | Progressive help system (target: 3 levels per step) |
| **SRS** | Spaced Repetition System |

---

## 3. Source-of-Truth Hierarchy

```
PRD.md          = Product requirements and scope (highest authority)
architecture.md = Technical architecture and implementation decisions
Design.md       = Visual/UX system (not yet created)
Rules.md        = Engineering rules and constraints (this document)
Memory.md       = Persistent project decisions/context (not yet created)
intro.txt       = Onboarding/context summary
```

**Rules:**
- Higher-level documents override lower-level documents
- If rules.md conflicts with PRD.md, PRD.md wins
- Changes to higher-level documents require updating all affected lower-level documents
- All documents must be consistent; inconsistencies must be documented as Open Engineering Decisions

---

## 4. Implementation Status Legend

Throughout this document, rules reference current implementation state:

| Status | Meaning |
|--------|---------|
| **CURRENT** | Actively implemented and working in codebase today |
| **TARGET** | Planned/desired state; implementation required before production |
| **REQUIRED** | Mandatory but missing; must be implemented |

**Example:**
```
[RULE 15.3] Access tokens MUST be stored in httpOnly cookies.
Status: REQUIRED (currently localStorage — XSS-vulnerable)
```

---

## 5. File Naming Conventions

### 5.1 General Rules

| Rule | Status | Description |
|------|--------|-------------|
| Use kebab-case for files | CURRENT | All file names use lowercase-with-hyphens (e.g., `server.js`, `db.js`) |
| Use PascalCase for React components | CURRENT | Component files named after their export (e.g., `Dashboard.jsx`) |
| Match file name to export | CURRENT | File name must match the primary export name |
| Use `.jsx` for React components | CURRENT | All React component files use `.jsx` extension |
| Use `.js` for non-React modules | CURRENT | All non-React JavaScript files use `.js` extension |

### 5.2 Directory Naming

| Rule | Status | Description |
|------|--------|-------------|
| Use kebab-case for directories | CURRENT | Directories use lowercase-with-hyphens |
| Use descriptive directory names | CURRENT | Directory names must clearly indicate purpose (e.g., `components/auth/`, `components/learn/`) |

---

## 6. Module Organization

### 6.1 Backend Module Structure

```
backend/
├── server.js          # Monolithic Express server (all routes, middleware, logic)
├── db.js              # SQLite database schema, migrations, seeds
├── package.json       # Dependencies and scripts
└── .env               # Environment secrets (not committed)
```

**[RULE 6.1.1]** The backend is a **monolithic single-file server** (`server.js`).
Status: **CURRENT**
- All routes, middleware, AI integration, compiler logic, and business logic live in `server.js`
- Target: Extract to separate modules before production (see architecture.md)

**[RULE 6.1.2]** The database schema is defined in `db.js` using `CREATE TABLE IF NOT EXISTS`.
Status: **CURRENT**
- No separate migration system exists
- Target: Implement proper migration system before production

### 6.2 Frontend Module Structure

```
frontend/src/
├── App.jsx                    # Root component with manual hash-based routing
├── main.jsx                   # Entry point
├── App.css / index.css        # Global styles
├── components/
│   ├── AdminCenter.jsx        # Admin panel
│   ├── CareerVault.jsx        # Career readiness
│   ├── Dashboard.jsx          # Main dashboard
│   ├── LogicPractice.jsx      # Logic sandbox
│   ├── MissionIDE.jsx         # Mission code editor
│   ├── Onboarding.jsx         # Onboarding flow
│   ├── Passport.jsx           # Learner portfolio
│   ├── auth/                  # Authentication components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── VerifyEmail.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── AuthSuccess.jsx
│   │   └── OnboardingWizard.jsx
│   ├── learn/                 # Learning components
│   │   ├── LearnHub.jsx
│   │   ├── LessonViewer.jsx
│   │   └── FlashCard.jsx
│   └── settings/
│       └── AccountSettings.jsx
```

**[RULE 6.2.1]** Frontend components are organized by feature in `components/`.
Status: **CURRENT**
- Feature-based subdirectories exist: `components/auth/`, `components/learn/`, `components/settings/`
- Root-level components for major views (Dashboard, Passport, etc.)
- No `pages/` directory exists

**[RULE 6.2.2]** Reusable components are co-located with feature.
Status: **CURRENT**
- Component files live alongside their feature
- No separate reusable UI components directory

---

## 7. Repository Structure

### 7.1 Root Structure

```
Atlas/
├── backend/           # Express server
├── frontend/          # React application
├── docs/              # Documentation (PRD.md, architecture.md, rules.md)
├── .gitignore         # Git ignore rules
├── package.json       # Root workspace config
├── todo               # Task tracking file
└── README.md          # Project readme
```

**[RULE 7.1.1]** The repository uses a monorepo structure.
Status: **CURRENT**
- Root `package.json` defines workspaces (frontend, backend)
- Backend and frontend are separate packages
- No shared package; API contract implied

**[RULE 7.1.2]** Documentation lives in `docs/`.
Status: **CURRENT**
- `docs/PRD.md` = Product requirements
- `docs/architecture.md` = Technical architecture
- `docs/rules.md` = This document (engineering rules)
- Target: Add `docs/Design.md`, `docs/Memory.md`

### 7.2 File Placement Rules

| Rule | Status | Description |
|------|--------|-------------|
| Backend code in `backend/` | CURRENT | All server-side code lives in `backend/` |
| Frontend code in `frontend/` | CURRENT | All client-side code lives in `frontend/` |
| Documentation in `docs/` | CURRENT | All documentation lives in `docs/` |
| No root-level source files | CURRENT | No source files at repository root |
| Secrets in `backend/.env` | CURRENT | Environment secrets in `backend/.env` (not committed by `.gitignore`) |

---

## 8. Monorepo Rules

### 8.1 Workspace Configuration

**[RULE 8.1.1]** The root `package.json` defines workspaces.
Status: **CURRENT**
```json
{
  "workspaces": ["backend", "frontend"]
}
```

**[RULE 8.1.2]** Install dependencies from repository root.
Status: **CURRENT**
- Run `npm install` from root to install all workspace dependencies
- Never install dependencies individually in `backend/` or `frontend/`

### 8.2 Script Execution

**[RULE 8.2.1]** Use workspace scripts from root.
Status: **CURRENT**
- `npm run dev` — starts both backend and frontend via concurrently
- `npm run dev:backend` — starts backend server
- `npm run dev:frontend` — starts frontend dev server
- `npm run build:frontend` — builds frontend for production
- `npm run start:backend` — starts backend in production mode

### 8.3 Shared Code

**[RULE 8.3.1]** Shared code is currently duplicated.
Status: **CURRENT**
- API contract implied by endpoint usage; no shared types
- No shared package exists yet
- Target: Create `shared/` package for common types and utilities

---

## 9. Server Architecture Rules

### 9.1 Express Server Configuration

**[RULE 9.1.1]** The server uses Express.js.
Status: **CURRENT**
- Backend server runs on Express.js (v4.21.x)
- Port configured via `process.env.PORT` (default: 5001)

**[RULE 9.1.2]** The server is monolithic.
Status: **CURRENT**
- All routes, middleware, and logic live in `server.js` (1,589 lines)
- Target: Extract to separate modules before production

**[RULE 9.1.3]** Use async route handlers.
Status: **CURRENT**
- All route handlers are async functions
- Errors caught by global error handler

### 9.2 Middleware Stack

**[RULE 9.2.1]** Apply middleware in correct order.
Status: **CURRENT**
```javascript
// 1. cors()                           — line 22
// 2. express.json()                   — line 23
// 3. express-session (for OAuth)      — lines 26-30
// 4. passport.initialize()            — line 32
// 5. passport.session()               — line 33
```
Note: Hardcoded fallback session secret exists (line 27) — security gap. Must use env-only secret before production.

**[RULE 9.2.2]** CORS is fully open.
Status: **CURRENT** (security gap)
- `app.use(cors())` allows all origins (server.js line 22)
- No origin restriction, no credentials config
- Target: Restrict to specific frontend origin before production

**[RULE 9.2.3]** Use `helmet` for security headers.
Status: **REQUIRED**
- `helmet` NOT installed in backend package.json
- Must add `helmet` dependency and `app.use(helmet())` to server.js

**[RULE 9.2.4]** Use `morgan` for request logging.
Status: **REQUIRED**
- `morgan` NOT installed in backend package.json
- Must add `morgan` dependency and `app.use(morgan('combined'))` to server.js

### 9.3 Static File Serving

**[RULE 9.3.1]** Serve frontend build from backend in production.
Status: **REQUIRED**
- No static file serving currently implemented in server.js
- Frontend served separately (Vite dev server / static host)
- Target: Optionally serve built frontend from Express or use a CDN/static host

---

## 10. Database Rules

### 10.1 Database Technology

**[RULE 10.1.1]** Use SQLite for local development.
Status: **CURRENT**
- Database file: `db/atlas.sqlite`
- Library: `sqlite` + `sqlite3` (async API via `db.get`, `db.all`, `db.run`)
- Foreign keys enabled via `PRAGMA foreign_keys = ON`

**[RULE 10.1.2]** Target PostgreSQL for production.
Status: **TARGET**
- Architecture.md specifies PostgreSQL as target
- Must maintain SQLite compatibility during transition
- Use database-agnostic SQL where possible

### 10.2 Schema Design

**[RULE 10.2.1]** Use `TEXT PRIMARY KEY` for primary keys.
Status: **CURRENT**
- Users, profiles, sessions tables use `TEXT PRIMARY KEY`
- Other tables use `INTEGER PRIMARY KEY AUTOINCREMENT`
- Inconsistent across schema

**[RULE 10.2.2]** Use `TEXT` for all string columns.
Status: **CURRENT**
- SQLite does not enforce string length limits
- Use `VARCHAR(n)` only when migrating to PostgreSQL

**[RULE 10.2.3]** Use `INTEGER DEFAULT 0` for boolean-like flags.
Status: **CURRENT**
- SQLite has no native boolean type
- 0 = false, 1 = true

**[RULE 10.2.4]** Use `TEXT` for timestamps.
Status: **CURRENT**
- Timestamps stored as ISO 8601 strings
- Example: `2026-09-04T12:00:00.000Z`

### 10.3 Table Naming

**[RULE 10.3.1]** Use snake_case for table names.
Status: **CURRENT**
- All tables use snake_case (e.g., `users`, `oauth_accounts`, `audit_logs`)

**[RULE 10.3.2]** Use plural nouns for table names.
Status: **CURRENT**
- Tables named as plural nouns (e.g., `users`, `missions`, `lessons`)

### 10.4 Relationship Rules

**[RULE 10.4.1]** Use `FOREIGN KEY` constraints where appropriate.
Status: **CURRENT**
- Foreign keys defined for related tables
- Example: `user_id TEXT REFERENCES users(id)`

**[RULE 10.4.2]** Use `ON DELETE CASCADE` for dependent data.
Status: **CURRENT**
- Cascade deletes used for related records
- Example: User deletion cascades to profiles, sessions, oauth_accounts

---

## 11. Schema Management Rules

### 11.1 Current State

**[RULE 11.1.1]** Schema is defined in `db.js` using `CREATE TABLE IF NOT EXISTS`.
Status: **CURRENT**
- All 28 tables created via `CREATE TABLE IF NOT EXISTS`
- No separate migration files exist
- Schema changes require modifying `db.js` directly

**[RULE 11.1.2]** No migration system exists.
Status: **CURRENT**
- No migration files or migration runner
- No version tracking for schema changes
- Target: Implement migration system before production

### 11.2 Target State

**[RULE 11.2.1]** Implement migration system.
Status: **TARGET**
- Use a migration library (e.g., `knex.js`, `prisma`, or custom)
- Track schema versions in database
- Support forward and rollback migrations

**[RULE 11.2.2]** Separate seed data from schema.
Status: **TARGET**
- Seed data currently mixed with schema definitions
- Move seeds to separate files
- Support environment-specific seeds

---

## 12. Data Validation Rules

### 12.1 Backend Validation

**[RULE 12.1.1]** Validate all user input on the server.
Status: **CURRENT**
- Manual validation in route handlers
- Example: `if (!title) return res.status(400).json({ error: 'Title required' })`

**[RULE 12.1.2]** Use a validation library.
Status: **REQUIRED**
- No validation library currently used
- Target: Implement `joi`, `zod`, or `express-validator`
- Must validate: email format, password strength, required fields, data types

**[RULE 12.1.3]** Validate email format.
Status: **CURRENT**
- Basic email regex validation in registration

**[RULE 12.1.4]** Validate password strength.
Status: **CURRENT**
- Enforced: min 10 chars + uppercase + lowercase + number + special char (server.js lines 196-201, 686-691)
- Example regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/`

### 12.2 Frontend Validation

**[RULE 12.2.1]** Validate inputs before API calls.
Status: **CURRENT**
- Basic validation in form components
- Example: Check required fields before submission

**[RULE 12.2.2]** Show validation errors to users.
Status: **CURRENT**
- Error messages displayed near form fields
- Target: Consistent error display pattern

---

## 13. SQL Query Rules

### 13.1 Query Construction

**[RULE 13.1.1]** Use parameterized queries.
Status: **CURRENT**
- All queries use `?` placeholders
- Example: `db.get('SELECT * FROM users WHERE id = ?', [userId])`

**[RULE 13.1.2]** Never concatenate user input into SQL.
Status: **CURRENT**
- All queries use parameterized statements
- No string concatenation in SQL

**[RULE 13.1.3]** Use async database methods.
Status: **CURRENT**
- `db.get()` for single row
- `db.all()` for multiple rows
- `db.run()` for inserts/updates/deletes

### 13.2 Query Patterns

**[RULE 13.2.1]** Use transactions for multi-step operations.
Status: **CURRENT**
- Transactions used for related inserts/updates
- Example: Creating user + default settings in single transaction

**[RULE 13.2.2]** Keep queries simple and readable.
Status: **CURRENT**
- Complex queries broken into multiple statements
- Use CTEs for readability when needed

**[RULE 13.2.3]** Limit result sets.
Status: **CURRENT**
- `LIMIT` clause used for pagination
- Default limit: 50 records

---

## 14. API Design Rules

### 14.1 RESTful Conventions

**[RULE 14.1.1]** Use standard HTTP methods.
Status: **CURRENT**
- `GET` for retrieval
- `POST` for creation
- `PUT` for full updates
- `PATCH` for partial updates
- `DELETE` for deletion

**[RULE 14.1.2]** Use plural nouns for resources.
Status: **CURRENT**
- `/api/missions`, `/api/flashcards`, `/api/users`
- Not: `/api/mission`, `/api/flashcard`, `/api/user`

**[RULE 14.1.3]** Use nested routes for related resources.
Status: **CURRENT**
- `/api/missions/:id/steps` for mission steps
- `/api/users/:id/progress` for user progress

### 14.2 Response Format

**[RULE 14.2.1]** Use consistent response structure.
Status: **CURRENT**
```json
// Success
{ "data": {...} }
// Error
{ "error": "Error message" }
// List
{ "data": [...], "total": 100 }
```

**[RULE 14.2.2]** Use appropriate HTTP status codes.
Status: **CURRENT**
- `200` for success
- `201` for created
- `400` for bad request
- `401` for unauthorized
- `403` for forbidden
- `404` for not found
- `429` for rate limiting
- `500` for server error

**[RULE 14.2.3]** Include error details in development.
Status: **CURRENT**
- Stack traces included in error responses during development
- Target: Hide details in production, log internally

### 14.3 Pagination

**[RULE 14.3.1]** Use query parameters for pagination.
Status: **CURRENT**
- `?page=1&limit=20` for page-based pagination
- `?offset=0&limit=20` for offset-based pagination

**[RULE 14.3.2]** Include total count in paginated responses.
Status: **CURRENT**
- Response includes `total` field for total record count

### 14.4 API Endpoints

**[RULE 14.4.1]** Document all API endpoints.
Status: **CURRENT**
- 38 endpoints documented in architecture.md
- Target: Add OpenAPI/Swagger documentation

**[RULE 14.4.2]** Version the API.
Status: **REQUIRED**
- No API versioning exists
- Target: Use URL versioning (`/api/v1/...`)

---

## 15. Authentication Rules

### 15.1 Authentication Method

**[RULE 15.1.1]** Use JWT for authentication.
Status: **CURRENT**
- Library: `jsonwebtoken`
- Access token: 15-minute expiry (hardcoded)
- Refresh token: 7-day expiry (hardcoded)

**[RULE 15.1.2]** Use bcrypt for password hashing.
Status: **CURRENT**
- Library: `bcryptjs`
- Salt rounds: 10

**[RULE 15.1.3]** Support multiple authentication methods.
Status: **CURRENT**
- Email + password authentication
- Google OAuth (server.js lines 602-618)
- GitHub OAuth (server.js lines 622-637)

### 15.2 Authentication Flow

**[RULE 15.2.1]** Login returns access + refresh tokens.
Status: **CURRENT**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "sessionId": "...",
  "user": { "id": 1, "email": "...", "role": "Student" }
}
```

**[RULE 15.2.2]** Validate tokens on protected routes.
Status: **CURRENT**
- `authenticateToken` middleware validates access token
- Returns 401 if token invalid/expired

### 15.3 Token Storage (Critical Security)

**[RULE 15.3.1]** Access tokens MUST be stored in httpOnly cookies.
Status: **REQUIRED**
- Currently stored in `localStorage` (XSS-vulnerable)
- Must implement httpOnly cookie storage before production

**[RULE 15.3.2]** Refresh tokens MUST be stored in httpOnly cookies.
Status: **REQUIRED**
- Currently stored in `localStorage` (XSS-vulnerable)
- Must implement httpOnly cookie storage before production

**[RULE 15.3.3]** Never store tokens in `localStorage`.
Status: **REQUIRED**
- Current implementation uses `localStorage`
- Must migrate to httpOnly cookies before production

---

## 16. Authorization Rules

### 16.1 Role-Based Access Control

**[RULE 16.1.1]** Define roles in the `users` table.
Status: **CURRENT**
- Roles in use: `Student`, `jr architect`, `guider`, `mentor`, `admin`, `super admin`
- Default role on registration: `'Student'` (db.js line 34)
- Roles use spaces (e.g., `'super admin'`, `'jr architect'`)
- Note: Role model is loose; seed data defines the working set

**[RULE 16.1.2]** Enforce roles on API endpoints.
Status: **CURRENT**
- `authorizeRoles(...)` middleware checks `req.user.role` (server.js line 140)
- Case-insensitive role comparison
- Example: `authorizeRoles('admin', 'super admin')` for admin-only endpoints

**[RULE 16.1.3]** Restrict sensitive operations to admin roles.
Status: **CURRENT**
- `/api/users` and `/api/tags`: admin/super admin/mentor (server.js line 711, 790)
- `POST`/`DELETE /api/tags`: admin/super admin (server.js line 721, 739)
- `/api/users/:id/role`: super admin only (server.js line 804)
- `DELETE /api/tags` blocks deleting critical tags `['admin', 'super admin']` (lockout protection)

### 16.2 Resource Ownership

**[RULE 16.2.1]** Users can only access their own resources.
Status: **CURRENT**
- Authenticated user ID derived from JWT (`req.user.id`)
- Queries filter by `user_id`

**[RULE 16.2.2]** Admins can access additional resources.
Status: **CURRENT**
- Admin roles gate admin endpoints via `authorizeRoles`
- Must still respect role hierarchy

---

## 17. Session Management Rules

### 17.1 Session Storage

**[RULE 17.1.1]** Sessions are stateless (JWT-based).
Status: **CURRENT**
- No server-side session storage for JWT
- Refresh tokens stored in `refresh_tokens` table
- Token validity checked on each request

**[RULE 17.1.2]** Support token refresh.
Status: **CURRENT**
- `/api/auth/refresh` endpoint exists
- Refresh token validated against database

### 17.2 Session Expiry

**[RULE 17.2.1]** Access tokens expire after 15 minutes.
Status: **CURRENT**
- Hardcoded as `{ expiresIn: '15m' }` in server.js

**[RULE 17.2.2]** Refresh tokens expire after 7 days.
Status: **CURRENT**
- Hardcoded as `{ expiresIn: '7d' }` in server.js
- Target: Make configurable via env

### 17.3 Session Revocation

**[RULE 17.3.1]** Support logout (token invalidation).
Status: **CURRENT**
- `/api/auth/logout` endpoint exists (server.js lines 447-462)
- Refresh token removed from database

**[RULE 17.3.2]** Support force logout (admin-initiated).
Status: **REQUIRED**
- No admin-initiated logout exists
- Target: Add endpoint to invalidate all user sessions

---

## 18. Token Handling Rules

### 18.1 Token Generation

**[RULE 18.1.1]** Generate cryptographically secure tokens.
Status: **CURRENT**
- Use `jwt.sign` for access and refresh tokens
- Refresh tokens tracked in `refresh_tokens` table

**[RULE 18.1.2]** Include user identity in access token.
Status: **CURRENT**
```javascript
jwt.sign({ id, email, username, role, level, xp }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
```

**[RULE 18.1.3]** Separate access and refresh secrets.
Status: **CURRENT**
- `ACCESS_TOKEN_SECRET` for access tokens
- `REFRESH_TOKEN_SECRET` for refresh tokens
- Both have hardcoded fallbacks (security gap)
- Expiry hardcoded: access `15m`, refresh `7d`
- Target: Make expiry env-configurable

### 18.2 Token Validation

**[RULE 18.2.1]** Validate token signature.
Status: **CURRENT**
- `jwt.verify` validates signature and expiry

**[RULE 18.2.2]** Check token against database (for refresh tokens).
Status: **CURRENT**
- Refresh token validated against `refresh_tokens` table
- Supports token revocation

### 18.3 Token Refresh

**[RULE 18.3.1]** Issue new access token on refresh.
Status: **CURRENT**
- `/api/auth/refresh` validates refresh token
- Returns new access token

**[RULE 18.3.2]** Rotate refresh tokens on use.
Status: **CURRENT**
- Old refresh token deleted on use
- New refresh token issued

### 18.4 Client-Side Token Storage

**[RULE 18.4.1]** Tokens stored in localStorage (insecure).
Status: **CURRENT** (security gap)
- Access token stored under `atlas_access_token` key
- Refresh token stored under `atlas_refresh_token` key
- Session ID under `atlas_session_id`, mission flag under `atlas_mission_completed`
- XSS-vulnerable
- **Inconsistency:** `AdminCenter.jsx` reads `localStorage.getItem('token')` (lines 53/68/94) while other components use the `accessToken` prop — must standardize
- Target: Migrate to httpOnly cookies before production

**[RULE 18.4.2]** Avoid tokens in URL query strings.
Status: **REQUIRED**
- OAuth callbacks redirect with tokens in URL query params (server.js lines 613, 632) — tokens leak into browser history/logs
- `AuthSuccess.jsx` reads tokens from URL params
- Target: Exchange authorization code server-side; never pass tokens via URL

---

## 19. Security Headers Rules

### 19.1 Helmet.js

**[RULE 19.1.1]** Use `helmet` for security headers.
Status: **REQUIRED**
- `helmet` NOT installed in backend package.json
- Must add `helmet` dependency and `app.use(helmet())` to server.js

### 19.2 Content Security Policy

**[RULE 19.2.1]** Configure CSP for frontend.
Status: **REQUIRED**
- No CSP headers configured
- Target: Configure restrictive CSP

### 19.3 CORS Configuration

**[RULE 19.3.1]** Restrict CORS to specific origins.
Status: **REQUIRED**
- Currently `app.use(cors())` — allows all origins (security gap)
- Must restrict to frontend origin before production

**[RULE 19.3.2]** Configure credentials for cookie-based auth.
Status: **REQUIRED**
- `credentials: true` not set
- Required when migrating to httpOnly cookies

### 19.4 CSRF Protection

**[RULE 19.4.1]** Implement CSRF protection.
Status: **REQUIRED**
- No CSRF protection exists (architecture.md §Security Controls, line 661)
- Current token-in-header auth reduces CSRF risk
- Target: Add CSRF token middleware when migrating to cookie-based auth

---

## 20. Input Sanitization Rules

### 20.1 XSS Prevention

**[RULE 20.1.1]** Sanitize all user input.
Status: **CURRENT**
- Basic sanitization in route handlers
- Target: Use `xss` or `DOMPurify` library

**[RULE 20.1.2]** Escape HTML in user-generated content.
Status: **CURRENT**
- React escapes by default
- Server-side must also escape

### 20.2 SQL Injection Prevention

**[RULE 20.2.1]** Use parameterized queries.
Status: **CURRENT**
- All queries use `?` placeholders
- No string concatenation in SQL

### 20.3 Command Injection Prevention

**[RULE 20.3.1]** Never execute shell commands with user input.
Status: **CURRENT**
- No shell commands executed with user input
- Prototype compiler uses string matching, not shell execution

---

## 21. Rate Limiting Rules

### 21.1 General Rate Limiting

**[RULE 21.1.1]** Implement rate limiting on all API endpoints.
Status: **TARGET**
- Brute-force rate limiter exists for login attempts (server.js lines 92-119)
- Target: Extend to all API endpoints using `express-rate-limit` library

### 21.2 Authentication Rate Limiting

**[RULE 21.2.1]** Rate limit login attempts.
Status: **CURRENT**
- Brute-force rate limiter implemented (server.js lines 92-119)
- Tracks failed attempts per IP

### 21.3 API Rate Limiting

**[RULE 21.3.1]** Rate limit API calls per user.
Status: **REQUIRED**
- No per-user rate limiting
- Target: 100 requests per minute per user

---

## 22. Error Handling Rules

### 22.1 Global Error Handler

**[RULE 22.1.1]** Implement global error handler.
Status: **REQUIRED**
- No Express global error handler exists (server.js ends at `app.listen`)
- Errors are handled per-route via try/catch
- Must add `app.use((err, req, res, next) => {...})` for unhandled errors

**[RULE 22.1.2]** Log all unhandled errors.
Status: **REQUIRED**
- Currently `console.error` in catch blocks only
- Target: Use structured logging library

### 22.2 Route-Level Error Handling

**[RULE 22.2.1]** Wrap async handlers in try-catch.
Status: **CURRENT**
- All route handlers have try/catch
- Errors returned as `500` JSON responses with descriptive messages
- Errors NOT passed to `next()` (no global handler)

**[RULE 22.2.2]** Return meaningful error messages.
Status: **CURRENT**
- Errors include descriptive messages
- Target: Hide internal details in production

### 22.3 Frontend Error Handling

**[RULE 22.3.1]** Handle API errors gracefully.
Status: **CURRENT**
- Check response status before parsing
- Show user-friendly error messages

**[RULE 22.3.2]** Implement error boundaries.
Status: **REQUIRED**
- No `ErrorBoundary` component exists
- Target: Add React error boundary for rendering errors

---

## 23. Logging Rules

### 23.1 Logging Library

**[RULE 23.1.1]** Use structured logging.
Status: **CURRENT**
- Audit logging implemented (server.js lines 149-160)
- `console.log`/`console.error` used for general logging
- Target: Use `winston` or `pino` library for structured logging

### 23.2 Log Levels

**[RULE 23.2.1]** Define log levels.
Status: **REQUIRED**
- Target: `error`, `warn`, `info`, `debug`, `trace`

### 23.3 Log Format

**[RULE 23.3.1]** Include timestamp in logs.
Status: **REQUIRED**
- Target: ISO 8601 timestamps

**[RULE 23.3.2]** Include request ID in logs.
Status: **REQUIRED**
- Target: Generate request ID per request

---

## 24. Environment Configuration Rules

### 24.1 Environment Variables

**Required environment variables (used by server.js):**

| Variable | Purpose | Current Default |
|----------|---------|-----------------|
| `PORT` | Server port | 5001 |
| `SESSION_SECRET` | Express session secret | hardcoded fallback (insecure) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | mock (insecure) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | mock (insecure) |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback | localhost:5001 |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | mock (insecure) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | mock (insecure) |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback | localhost:5001 |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | hardcoded fallback (insecure) |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | hardcoded fallback (insecure) |
| `GEMINI_API_KEY` | Google Gemini API key | none (AI disabled) |

**[RULE 24.1.1]** Use environment variables for configuration.
Status: **CURRENT**
- All config values read via `process.env`
- Sensitive values have hardcoded fallbacks (security gap)

**[RULE 24.1.2]** Provide defaults for non-sensitive config.
Status: **CURRENT**
- `process.env.PORT || 5001`

### 24.2 .env File Management

**[RULE 24.2.1]** Never commit `.env` files.
Status: **CURRENT**
- `.gitignore` excludes `.env`

**[RULE 24.2.2]** Document required environment variables.
Status: **REQUIRED**
- No `.env.example` exists anywhere in project
- Must create `backend/.env.example` with all required variables (no secrets)

---

## 25. Secret Management Rules

### 25.1 JWT Secrets

**[RULE 25.1.1]** Use strong, unique secrets from environment variables only.
Status: **REQUIRED**
- Hardcoded fallback secrets exist in server.js (security gap):
  - `ACCESS_TOKEN_SECRET || 'atlas_core_access_secret_0x8f2'` (line 68)
  - `REFRESH_TOKEN_SECRET || 'atlas_core_refresh_secret_0x2a9'` (line 69)
  - `SESSION_SECRET || 'atlas_session_secret_0x999'` (line 27)
  - Google/GitHub OAuth mock client IDs and secrets (lines 45-47, 57-59)
- Must remove all hardcoded fallbacks before production

**[RULE 25.1.2]** Rotate secrets periodically.
Status: **REQUIRED**
- No secret rotation mechanism exists
- Target: Implement secret rotation

### 25.1b OAuth Credentials

**[RULE 25.1b.1]** Use real OAuth credentials in production.
Status: **REQUIRED**
- Currently mock credentials in dev
- Must configure real Google/GitHub OAuth app credentials before production

### 25.2 API Keys

**[RULE 25.2.1]** Store API keys in environment variables.
Status: **CURRENT**
- Google Gemini API key stored in `.env`

**[RULE 25.2.2]** Never log API keys.
Status: **CURRENT**
- API keys not logged in normal operation

### 25.3 Database Credentials

**[RULE 25.3.1]** Store database credentials in environment variables.
Status: **CURRENT**
- SQLite path stored in `DATABASE_URL` env var

---

## 26. Frontend Architecture Rules

### 26.1 Framework

**[RULE 26.1.1]** Use React 19.
Status: **CURRENT**
- React 19.2.8 installed

**[RULE 26.1.2]** Use Vite as build tool.
Status: **CURRENT**
- Vite 8.2.0 configured
- `@vitejs/plugin-react` for JSX transforms

### 26.2 Component Structure

**[RULE 26.2.1]** Use functional components.
Status: **CURRENT**
- All components are functional
- No class components

**[RULE 26.2.2]** Use hooks for state and side effects.
Status: **CURRENT**
- `useState`, `useEffect` used throughout
- No context API currently used for global state

### 26.3 File Organization

**[RULE 26.3.1]** One component per file.
Status: **CURRENT**
- Each component in its own file

**[RULE 26.3.2]** Group components by feature.
Status: **CURRENT**
- Feature subdirectories: `auth/`, `learn/`, `settings/`
- Root-level components for major views

---

## 27. React Component Rules

### 27.1 Component Definition

**[RULE 27.1.1]** Use arrow function components.
Status: **CURRENT**
- `const Component = () => { ... }`

**[RULE 27.1.2]** Export components as default.
Status: **CURRENT**
- `export default Component`

### 27.2 Props

**[RULE 27.2.1]** Destructure props in function signature.
Status: **CURRENT**
- `const Component = ({ prop1, prop2 }) => { ... }`

**[RULE 27.2.2]** Pass props explicitly.
Status: **CURRENT**
- Props defined per component
- Target: Add PropTypes or migrate to TypeScript

### 27.3 State

**[RULE 27.3.1]** Use `useState` for local state.
Status: **CURRENT**
- All component state via `useState`

**[RULE 27.3.2]** Lift state up when needed.
Status: **CURRENT**
- Shared state lifted to common ancestor

### 27.4 Side Effects

**[RULE 27.4.1]** Use `useEffect` for side effects.
Status: **CURRENT**
- API calls, subscriptions, DOM manipulation in `useEffect`

**[RULE 27.4.2]** Clean up effects.
Status: **CURRENT**
- Return cleanup function from `useEffect` when needed

---

## 28. Routing Rules

### 28.1 Routing Library

**[RULE 28.1.1]** Use React Router.
Status: **TARGET**
- Currently using manual hash-based routing in `App.jsx`
- Target: Migrate to React Router

### 28.2 Route Configuration

**[RULE 28.2.1]** Define routes in `App.jsx`.
Status: **CURRENT**
- All routes defined in root component

**[RULE 28.2.2]** Use hash-based routing.
Status: **CURRENT**
- `window.location.hash` for routing
- No browser history API

### 28.3 Protected Routes

**[RULE 28.3.1]** Protect authenticated routes.
Status: **CURRENT**
- Check `accessToken` prop before rendering

**[RULE 28.3.2]** Redirect unauthenticated users.
Status: **CURRENT**
- Redirect to login page if not authenticated

---

## 29. State Management Rules

### 29.1 Local State

**[RULE 29.1.1]** Use React hooks for local state.
Status: **CURRENT**
- `useState` for simple state
- `useReducer` for complex state (if used)

### 29.2 Global State

**[RULE 29.2.1]** Pass state via props.
Status: **CURRENT**
- `accessToken`, `user`, callbacks passed as props
- No Context API currently used
- Target: Evaluate Context API or Zustand for global auth state

**[RULE 29.2.2]** Keep prop drilling minimal.
Status: **TARGET**
- Some prop drilling exists
- Target: Reduce with Context API

### 29.3 Server State

**[RULE 29.3.1]** Fetch data in `useEffect`.
Status: **CURRENT**
- API calls in `useEffect` hooks
- Target: Use React Query or SWR for server state

---

## 30. API Client Rules

### 30.1 HTTP Client

**[RULE 30.1.1]** Use `fetch` API.
Status: **CURRENT**
- Native `fetch` used for API calls
- No Axios or other HTTP client

### 30.2 Request Configuration

**[RULE 30.2.1]** Include Authorization header.
Status: **CURRENT**
```javascript
headers: { 'Authorization': `Bearer ${accessToken}` }
```

**[RULE 30.2.2]** Set Content-Type header.
Status: **CURRENT**
- `Content-Type: application/json` for POST/PUT/PATCH

### 30.3 Error Handling

**[RULE 30.3.1]** Handle HTTP errors.
Status: **CURRENT**
- Check `response.ok` before parsing
- Throw error for non-2xx responses

**[RULE 30.3.2]** Handle network errors.
Status: **CURRENT**
- Catch `fetch` errors
- Show user-friendly message

---

## 31. UI Component Library Rules

### 31.1 Library

**[RULE 31.1.1]** Prefer minimal dependency footprint.
Status: **CURRENT**
- No component library installed
- Custom CSS used for styling
- Icon library: `lucide-react`
- Target: Evaluate ShadCN UI if components grow complex

### 31.2 Component Usage

**[RULE 31.2.1]** Build reusable components.
Status: **CURRENT**
- Buttons, panels, dialogs built as custom components
- Reused across views

**[RULE 31.2.2]** Keep components lean.
Status: **CURRENT**
- Single-purpose components
- Composable via props

---

## 32. Styling Rules

### 32.1 CSS Approach

**[RULE 32.1.1]** Use plain CSS with modular class names.
Status: **CURRENT**
- Global CSS files with component-specific class names
- No Tailwind CSS installed
- Themed via CSS variables (glass-panel, neon-btn, etc.)

### 32.2 CSS Structure

**[RULE 32.2.1]** Avoid CSS-in-JS libraries.
Status: **CURRENT**
- No styled-components or emotion
- Plain CSS class names

### 32.3 Responsive Design

**[RULE 32.3.1]** Use CSS media queries.
Status: **CURRENT**
- Media queries for responsive breakpoints

### 32.4 Dark Mode

**[RULE 32.4.1]** Support dark mode.
Status: **CURRENT**
- Dark mode toggle exists
- CSS variables switched via `.dark` class on root

---

## 33. Form Handling Rules

### 33.1 Form Libraries

**[RULE 33.1.1]** Use controlled components.
Status: **CURRENT**
- Form inputs use `useState`

**[RULE 33.1.2]** Consider form libraries for complex forms.
Status: **TARGET**
- No form library currently used
- Target: Evaluate `react-hook-form` or `formik`

### 33.2 Form Validation

**[RULE 33.2.1]** Validate on submit.
Status: **CURRENT**
- Validation in submit handler

**[RULE 33.2.2]** Show validation errors.
Status: **CURRENT**
- Error messages displayed near fields

### 33.3 Form Submission

**[RULE 33.3.1]** Disable submit during API call.
Status: **CURRENT**
- Loading state prevents multiple submissions

**[RULE 33.3.2]** Show loading indicator.
Status: **CURRENT**
- Loading spinner during API calls

---

## 34. Error Boundary Rules

### 34.1 Implementation

**[RULE 34.1.1]** Implement error boundaries.
Status: **REQUIRED**
- No `ErrorBoundary` component exists in the codebase
- React does not catch errors in event handlers or async code — must rely on explicit handling
- Target: Add React error boundary for render errors

### 34.2 Error Display

**[RULE 34.2.1]** Show fallback UI on error.
Status: **REQUIRED**
- Errors handled per-component with state/status messages
- Target: Add global error boundary with fallback UI

**[RULE 34.2.2]** Provide recovery option.
Status: **TARGET**
- Target: "Try again" button to retry failed loads

---

## 35. AI Integration Rules

### 35.1 AI Provider

**[RULE 35.1.1]** Use Google Gemini.
Status: **CURRENT**
- Library: `@google/generative-ai`
- Model: `gemini-1.5-flash` (server.js line 917)
- System instruction: "Cognitive Guide, AI mentor for Atlas"

### 35.2 Fallback Behavior

**[RULE 35.2.1]** Provide fallback responses when AI unavailable.
Status: **CURRENT**
- Falls back to hardcoded keyword-based responses when `genAI` is null or API call fails (server.js lines 927-934)
- Example: "trie" → Trie explanation
- Fallback content is educational guidance, not secrets

### 35.3 AI Usage

**[RULE 35.3.1]** Use AI for mentor chat assistance.
Status: **CURRENT**
- `/api/mentor/chat` endpoint (server.js line 903)
- Messages stored in `chat_messages` table

**[RULE 35.3.2]** Use AI for code analysis.
Status: **TARGET**
- Not implemented — code analysis via AI is future work
- Target: AI reviews learner code submissions

**[RULE 35.3.3]** Use AI for hint generation.
Status: **TARGET**
- Not implemented — hint system uses static hints
- Target: AI generates progressive hints per step

---

## 36. AI Provider Rules

### 36.1 Provider Configuration

**[RULE 36.1.1]** Store API key in environment variable.
Status: **CURRENT**
- `GEMINI_API_KEY` in `.env`

**[RULE 36.1.2]** Configure model via system instruction.
Status: **CURRENT**
- `systemInstruction` set to define AI mentor persona and focus (server.js line 918)
- No temperature/max-token tuning currently
- Target: Expose model parameters (temperature, max tokens) per request

### 36.2 Provider Failover

**[RULE 36.2.1]** Implement provider failover.
Status: **REQUIRED**
- No failover mechanism exists
- Target: Add fallback providers (OpenAI, Anthropic)

---

## 37. AI Prompt Engineering Rules

### 37.1 Prompt Design

**[RULE 37.1.1]** Use system prompts for context.
Status: **CURRENT**
- `systemInstruction` defines AI role ("Cognitive Guide") and behavior (server.js line 918)

**[RULE 37.1.2]** Include learner context in prompts.
Status: **TARGET**
- Currently no learner-specific context in prompts
- Target: Include learner progress, skill level in context

### 37.2 Prompt Safety

**[RULE 37.2.1]** Validate AI responses.
Status: **CURRENT**
- Basic response validation exists

**[RULE 37.2.2]** Filter harmful content.
Status: **REQUIRED**
- No content filtering exists
- Target: Implement content safety filters

---

## 38. AI Response Handling Rules

### 38.1 Response Handling

**[RULE 38.1.1]** Persist AI conversations.
Status: **CURRENT**
- User and mentor messages stored in `chat_messages` table (server.js lines 908-911, 936-939)

**[RULE 38.1.2]** Handle AI unavailability gracefully.
Status: **CURRENT**
- Falls back to hardcoded response when AI call fails (server.js lines 922-924)

### 38.2 Response Display

**[RULE 38.2.1]** Stream AI responses.
Status: **TARGET**
- Currently returns complete response
- Target: Implement streaming for better UX

---

## 39. Compiler Rules

### 39.1 Compiler Technology

**[RULE 39.1.1]** Use string-matching simulation.
Status: **CURRENT**
- Prototype compiler uses string matching on code content (server.js lines 822-890)
- Success determined by presence of keywords (e.g., `TrieNode`, `buildIndex`, `Trie`)

**[RULE 39.1.2]** Simulate benchmark execution.
Status: **CURRENT**
- Terminal logs are pre-generated strings simulating Kotlin compile/test output
- Random latency/memory values generated for realism
- No actual code execution

**[RULE 39.1.3]** Use secure sandbox for code execution.
Status: **TARGET**
- Target: Docker/gVisor sandbox before production
- Current: no real execution, so no sandbox needed yet

### 39.2 Supported Missions

**[RULE 39.2.1]** Mission is Kotlin framework-oriented.
Status: **CURRENT**
- ./api/missions/execute handles the "Scale Instagram Followers Search" mission (server.js line 866)
- Simulated Kotlin JVM build pipeline
- XP/level awarded on "success" (accurate toward target check)

**[RULE 39.2.2]** Add multi-language + multi-mission support.
Status: **TARGET**
- Currently only one hardcoded mission validation
- Target: Support multiple missions and languages with true compilation

### 39.3 Security

**[RULE 39.3.1]** Never execute user code.
Status: **CURRENT**
- Compiler only simulates; does not execute user code
- No shell execution
- Safe but not functional as a real compiler

---

## 40. Code Execution Rules

### 40.1 Execution Environment

**[RULE 40.1.1]** Do not execute user code in production.
Status: **CURRENT**
- No code execution in current implementation

**[RULE 40.1.2]** Use sandboxed environment for execution.
Status: **TARGET**
- Target: Docker containers or WebAssembly for execution

### 40.2 Resource Limits

**[RULE 40.2.1]** Limit execution time.
Status: **TARGET**
- Target: 10-second timeout for code execution

**[RULE 40.2.2]** Limit memory usage.
Status: **TARGET**
- Target: 256MB memory limit per execution

---

## 41. Mission Rules

### 41.1 Mission Structure

**[RULE 41.1.1]** Missions have a structured definition.
Status: **CURRENT**
- `missions` table stores mission records (id, user_id, title, status)
- Single mission implemented: "Scale Instagram Followers Search"
- Target: Multiple missions with ordered steps/stages

**[RULE 41.1.2]** Support hint system.
Status: **TARGET**
- No `mission_steps` table or hint system exists
- Target: Progressive hint system (multiple levels per step)

### 41.2 Mission Progress

**[RULE 41.2.1]** Track mission completion.
Status: **CURRENT**
- `missions.status` field (e.g., 'VERIFIED')
- Triggered by `/api/missions/execute` success

**[RULE 41.2.2]** Track XP and level.
Status: **CURRENT**
- XP awarded and level updated on mission success (server.js lines 861-863)
- `code_quality` updated on success

### 41.3 Mission Scoring

**[RULE 41.3.1]** Validate against target criteria.
Status: **CURRENT**
- Success determined by keyword matching in code (TrieNode/buildIndex/Trie)
- Simulated latency/memory benchmarks
- Target: Real hidden-test validation

---

## 42. Lesson Rules

### 42.1 Lesson Structure

**[RULE 42.1.1]** Lessons have structured content.
Status: **CURRENT**
- Content stored as JSON with sections
- LessonViewer.jsx renders lesson content

**[RULE 42.1.2]** Lessons include code examples.
Status: **CURRENT**
- Code blocks with syntax highlighting (highlight.js)
- React-markdown for rendering

### 42.2 Lesson Progress

**[RULE 42.2.1]** Track lesson completion.
Status: **CURRENT**
- `lesson_progress` table tracks completion

**[RULE 42.2.2]** Track time spent.
Status: **CURRENT**
- Time tracking for lessons

---

## 43. Quiz Rules

### 43.1 Quiz Structure

**[RULE 43.1.1]** Quizzes belong to lessons.
Status: **CURRENT**
- `/api/quiz/submit` endpoint (server.js line 1554)
- Accepts `lessonId`, `score`, `answers`

**[RULE 43.1.2]** Support multiple question types.
Status: **TARGET**
- Question content/format not enforced by server
- Target: Define question schema and types (MCQ, true/false, code completion)

### 43.2 Quiz Scoring

**[RULE 43.2.1]** Award XP for passing.
Status: **CURRENT**
- Score >= 0.8 qualifies (server.js line 1564)
- 20% of lesson XP reward awarded on pass
- User XP/level updated (server.js lines 1566-1570)

**[RULE 43.2.2]** Log quiz activity.
Status: **CURRENT**
- `activity_logs` entry created with quiz description
- Target: Provide answer explanations for feedback

---

## 44. Spaced Repetition Rules

### 44.1 SRS Algorithm

**[RULE 44.1.1]** Implement spaced repetition.
Status: **TARGET**
- Endpoint exists but returns stub response (server.js lines 1500-1551)
- Target: Implement full SM-2 algorithm

**[RULE 44.1.2]** Calculate next review date.
Status: **TARGET**
- Target: Based on performance and difficulty

### 44.2 Flashcard Types

**[RULE 44.2.1]** Support code flashcards.
Status: **TARGET**
- Target: Code snippets as flashcard content

**[RULE 44.2.2]** Support concept flashcards.
Status: **TARGET**
- Target: Text-based concept explanations

---

## 45. Passport/Portfolio Rules

### 45.1 Portfolio Structure

**[RULE 45.1.1]** Passport contains learner profile.
Status: **CURRENT**
- Skills, projects, achievements displayed
- Currently uses hardcoded metrics (Passport.jsx line 24)
- Target: Dynamic data from API

**[RULE 45.1.2]** Passport is shareable.
Status: **CURRENT**
- Share button copies URL to clipboard
- URL format: `https://atlas.dev/passport/{username}`
- Target: Public portfolio URL with real backend

### 45.2 Portfolio Content

**[RULE 45.2.1]** Show completed missions.
Status: **TARGET**
- Passport currently displays hardcoded accomplishments (Passport.jsx)
- Target: Populate from mission records

**[RULE 45.2.2]** Show skill ratings.
Status: **TARGET**
- Passport displays hardcoded metrics
- Target: Compute skill ratings from real activity

---

## 46. Dashboard Rules

### 46.1 Dashboard Content

**[RULE 46.1.1]** Show learner progress.
Status: **CURRENT**
- Progress charts and statistics

**[RULE 46.1.2]** Show recent activity.
Status: **CURRENT**
- Recent missions, lessons, flashcards

### 46.2 Dashboard Updates

**[RULE 46.2.1]** Update in real-time.
Status: **CURRENT**
- Heartbeat system for real-time updates (Dashboard.jsx)
- Polls server every 30 seconds for state changes

---

## 47. Notification Rules

### 47.1 Notification Types

**[RULE 47.1.1]** Support in-app notifications.
Status: **CURRENT**
- `/api/dashboard/notifications` GET/POST/read/DELETE endpoints (server.js lines 1169-1189)
- Notifications stored in `notifications` table
- Mark-as-read and delete supported

**[RULE 47.1.2]** Support email notifications.
Status: **REQUIRED**
- Email dispatch logs to console only (server.js)
- Target: Implement real email service (SendGrid/AWS SES)

### 47.2 Notification Preferences

**[RULE 47.2.1]** Allow notification preferences.
Status: **REQUIRED**
- No preference management exists
- Target: Add notification settings page

---

## 48. File Upload Rules

### 48.1 Upload Handling

**[RULE 48.1.1]** Implement file upload handling.
Status: **REQUIRED**
- No file upload functionality exists
- No `multer` in dependencies
- Target: Add `multer` for multipart parsing

**[RULE 48.1.2]** Limit file size.
Status: **REQUIRED**
- No size limits configured
- Target: 10MB limit via multer

### 48.2 File Storage

**[RULE 48.2.1]** Store files locally.
Status: **TARGET**
- Target: `uploads/` directory or similar

**[RULE 48.2.2]** Support cloud storage.
Status: **TARGET**
- Target: AWS S3 or similar for production

---

## 49. Caching Rules

### 49.1 Client-Side Caching

**[RULE 49.1.1]** Configure browser cache.
Status: **TARGET**
- No explicit HTTP cache headers configured
- Vite build output handles static asset cache via default headers
- Target: Configure explicit cache-control headers

**[RULE 49.1.2]** Limit localStorage to non-sensitive data.
Status: **CURRENT**
- Tokens stored in localStorage (security concern, see Section 18.4)
- No user preference caching
- Target: Migrate tokens to httpOnly cookies; avoid localStorage for auth

### 49.2 Server-Side Caching

**[RULE 49.2.1]** Implement response caching.
Status: **REQUIRED**
- No server-side caching exists
- Target: Use Redis for caching

---

## 50. Performance Rules

### 50.1 Frontend Performance

**[RULE 50.1.1]** Code splitting.
Status: **TARGET**
- Currently single bundle
- Target: React.lazy for route-based splitting

**[RULE 50.1.2]** Image optimization.
Status: **TARGET**
- No image optimization exists
- Target: Use next-gen formats (WebP, AVIF)

### 50.2 Backend Performance

**[RULE 50.2.1]** Database query optimization.
Status: **REQUIRED**
- No indexes defined in db.js
- Foreign keys and frequently queried columns unindexed
- Must add indexes on foreign key and lookup columns

**[RULE 50.2.2]** Connection pooling.
Status: **CURRENT**
- SQLite single connection (acceptable for SQLite)
- Must revisit for PostgreSQL

---

## 51. Database Indexing Rules

### 51.1 Index Creation

**[RULE 51.1.1]** Index foreign keys.
Status: **REQUIRED**
- No `CREATE INDEX` statements exist in db.js
- Must add indexes on all foreign key columns

**[RULE 51.1.2]** Index frequently queried columns.
Status: **REQUIRED**
- No indexes on email, user_id, username, etc.
- Must add indexes for common lookup and join columns

### 51.2 Index Maintenance

**[RULE 51.2.1]** Monitor index usage.
Status: **REQUIRED**
- No index monitoring exists
- Target: Add index usage tracking

---

## 52. Testing Rules

### 52.1 Testing Framework

**[RULE 52.1.1]** Use Vitest for unit tests.
Status: **TARGET**
- No test framework currently configured
- Target: Add Vitest configuration

### 52.2 Test Coverage

**[RULE 52.2.1]** Write tests for critical paths.
Status: **REQUIRED**
- No tests exist
- Target: 80% coverage for critical paths

### 52.3 Test Types

**[RULE 52.3.1]** Unit tests for utilities.
Status: **REQUIRED**
- No unit tests exist

**[RULE 52.3.2]** Integration tests for API.
Status: **REQUIRED**
- No integration tests exist

**[RULE 52.3.3]** E2E tests for critical flows.
Status: **REQUIRED**
- No E2E tests exist

---

## 53. Linting Rules

### 53.1 Linter Configuration

**[RULE 53.1.1]** Use oxlint.
Status: **CURRENT**
- oxlint 1.75.0 installed in frontend devDependencies
- `npm run lint` runs oxlint

**[RULE 53.1.2]** Integrate linter in CI.
Status: **REQUIRED**
- Linter not integrated in CI pipeline
- Target: Add lint step to CI

### 53.2 Lint Rules

**[RULE 53.2.1]** Enforce consistent code style.
Status: **CURRENT**
- Rules defined in oxlint.json

**[RULE 53.2.2]** Catch common errors.
Status: **CURRENT**
- Rules for null checks, unused variables, etc.

---

## 54. Type Checking Rules

### 54.1 TypeScript

**[RULE 54.1.1]** Use TypeScript for type safety.
Status: **TARGET**
- Currently using JavaScript
- Target: Migrate to TypeScript

### 54.2 PropTypes

**[RULE 54.2.1]** Use PropTypes if not using TypeScript.
Status: **REQUIRED**
- No PropTypes defined
- Target: Add PropTypes or migrate to TypeScript

---

## 55. CI/CD Rules

### 55.1 CI Pipeline

**[RULE 55.1.1]** Implement CI pipeline.
Status: **REQUIRED**
- No CI/CD exists
- Target: GitHub Actions

**[RULE 55.1.2]** Run tests on PR.
Status: **REQUIRED**
- No tests to run yet

### 55.2 CD Pipeline

**[RULE 55.2.1]** Implement CD pipeline.
Status: **REQUIRED**
- No deployment automation exists
- Target: Automated deployment on merge to main

---

## 56. Deployment Rules

### 56.1 Deployment Target

**[RULE 56.1.1]** Use Vercel for frontend.
Status: **TARGET**
- Target: Vercel deployment

**[RULE 56.1.2]** Use Railway for backend.
Status: **TARGET**
- Target: Railway deployment

### 56.2 Environment Management

**[RULE 56.2.1]** Separate environments.
Status: **TARGET**
- Target: Development, staging, production

---

## 57. Monitoring Rules

### 57.1 Application Monitoring

**[RULE 57.1.1]** Implement error tracking.
Status: **REQUIRED**
- No error tracking exists
- Target: Sentry or similar

**[RULE 57.1.2]** Implement performance monitoring.
Status: **REQUIRED**
- No APM exists
- Target: Add APM solution

### 57.2 Uptime Monitoring

**[RULE 57.2.1]** Monitor API uptime.
Status: **REQUIRED**
- No uptime monitoring exists
- Target: Health check endpoint + monitoring

---

## 58. Documentation Rules

### 58.1 Code Documentation

**[RULE 58.1.1]** Document complex functions.
Status: **CURRENT**
- JSDoc comments for complex logic

**[RULE 58.1.2]** Document API endpoints.
Status: **CURRENT**
- Comments for route handlers

### 58.2 Project Documentation

**[RULE 58.2.1]** Maintain README.
Status: **CURRENT**
- README.md exists with setup instructions

**[RULE 58.2.2]** Maintain architecture docs.
Status: **CURRENT**
- architecture.md exists

---

## 59. Version Control Rules

### 59.1 Git Workflow

**[RULE 59.1.1]** Use feature branches.
Status: **CURRENT**
- Branch-per-feature workflow

**[RULE 59.1.2]** Require PR reviews.
Status: **TARGET**
- Target: Require 1 approval before merge

### 59.2 Commit Messages

**[RULE 59.2.1]** Use conventional commits.
Status: **REQUIRED**
- Current commits do not follow a convention
- Target: `feat:`, `fix:`, `docs:`, etc.

**[RULE 59.2.2]** Keep commits atomic.
Status: **CURRENT**
- One logical change per commit

---

## 60. Dependency Management Rules

### 60.1 Adding Dependencies

**[RULE 60.1.1]** Evaluate before adding.
Status: **CURRENT**
- Consider: maintenance, security, bundle size

**[RULE 60.1.2]** Prefer well-maintained packages.
Status: **CURRENT**
- High weekly downloads, active maintenance

### 60.2 Updating Dependencies

**[RULE 60.2.1]** Update regularly.
Status: **TARGET**
- Target: Monthly dependency updates

**[RULE 60.2.2]** Test after updates.
Status: **REQUIRED**
- No test suite exists yet

---

## 61. Accessibility Rules

### 61.1 WCAG Compliance

**[RULE 61.1.1]** Target WCAG 2.1 AA.
Status: **TARGET**
- No formal accessibility audit exists

### 61.2 Implementation

**[RULE 61.2.1]** Use semantic HTML.
Status: **CURRENT**
- Semantic elements used (nav, main, section, etc.)

**[RULE 61.2.2]** Add ARIA labels.
Status: **CURRENT**
- ARIA labels on interactive elements

**[RULE 61.2.3]** Support keyboard navigation.
Status: **CURRENT**
- Focus management implemented

---

## 62. Open Engineering Decisions

These decisions require resolution before production deployment.

### 62.1 Database Migration Strategy

**Decision:** Which migration tool to use?
**Options:** Knex.js, Prisma, custom
**Status:** Open
**Impact:** Schema management, developer experience

### 62.2 TypeScript Migration

**Decision:** When and how to migrate to TypeScript?
**Options:** Big bang, incremental, new files only
**Status:** Open
**Impact:** Type safety, developer experience, build time

### 62.3 State Management Library

**Decision:** Which state management library to use?
**Options:** Redux Toolkit, Zustand, Jotai, Context API only
**Status:** Open
**Impact:** Developer experience, performance

### 62.4 Form Library

**Decision:** Which form library to use?
**Options:** React Hook Form, Formik, custom
**Status:** Open
**Impact:** Developer experience, form validation

### 62.5 API Documentation

**Decision:** Which API documentation tool to use?
**Options:** OpenAPI/Swagger, API Blueprint, custom
**Status:** Open
**Impact:** Developer experience, API adoption

### 62.6 Testing Strategy

**Decision:** Which testing libraries to use?
**Options:** Vitest, Jest, React Testing Library, Cypress
**Status:** Open
**Impact:** Test coverage, developer experience

### 62.7 Deployment Platform

**Decision:** Which platforms for frontend/backend?
**Options:** Vercel+Railway, AWS, Google Cloud, self-hosted
**Status:** Open
**Impact:** Cost, scalability, maintenance

### 62.8 Monitoring Solution

**Decision:** Which monitoring tools to use?
**Options:** Sentry, Datadog, New Relic, custom
**Status:** Open
**Impact:** Visibility, cost

---

## 63. Code Review Checklist

Use this checklist for all PR reviews.

### 63.1 Code Quality

- [ ] Code follows naming conventions (Section 5)
- [ ] Code is organized according to module rules (Section 6)
- [ ] No commented-out code
- [ ] No console.log in production code

### 63.2 Security

- [ ] Input validation present
- [ ] Parameterized queries used
- [ ] No hardcoded secrets
- [ ] Authentication checked on protected routes

### 63.3 Performance

- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Appropriate indexes exist

### 63.4 Testing

- [ ] Tests added for new functionality
- [ ] Existing tests not broken
- [ ] Edge cases covered

### 63.5 Documentation

- [ ] Code comments for complex logic
- [ ] API endpoints documented
- [ ] README updated if needed

---

## 64. Final Audit

### 64.1 Consistency Check

Before merging rules.md, verify consistency with:

- [ ] PRD.md — All requirements covered
- [ ] architecture.md — All technical decisions aligned
- [ ] intro.txt — All context accurate
- [ ] Source code — All rules grounded in actual implementation
- [ ] package.json — All dependencies accurate
- [ ] Database schema — All tables/columns accurate
- [ ] API routes — All endpoints accurate

### 64.2 Status Verification

Verify all status tags are accurate:

- [ ] CURRENT rules match actual implementation
- [ ] TARGET rules are documented in architecture.md
- [ ] REQUIRED rules are clearly marked and justified

---

## 65. Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-09-04 | Initial rules.md created | AI Agent |
| 2026-09-04 | Audit corrections: roles (Student/jr architect/guider/mentor/admin/super admin), 28 tables, SQLite using sqlite+sqlite3 (not better-sqlite3), no helmet/morgan/multer installed, no CORS origin config, default PORT=5001, no global error handler, no indexes, no static file serving, tokens in URL query params, hardcoded secrets (access/refresh/session/OAuth), frontend component structure (feature subdirs, no pages/), compiler is single Kotlin mission keyword-match, AI endpoint /api/mentor/chat, quiz/XP logic | AI Agent |

---

## 66. Owner & Contacts

**Document Owner:** Atlas Engineering Team
**Last Reviewed:** 2026-09-04
**Next Review:** TBD

---

*This document is the engineering constitution for Atlas. All technical decisions must comply with these rules unless a documented exception is approved through the governance process.*
