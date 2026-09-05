# Atlas — Design System, UI/UX & Interaction Specification

> **Document:** `docs/design.md`
> **Status:** 🔵 EXISTING PROTOTYPE (living document, mirrors current implementation)
> **Source of truth:** This document standardizes and extends the **existing** Atlas visual identity — a dark cyberpunk / software-engineering aesthetic. It does **not** introduce a generic SaaS design. The running frontend at `frontend/src/index.css` (2,916 lines) plus the component layer are the visual source of truth.
>
> **Doc hierarchy:** `PRD.md` > `architecture.md` > `design.md` > `rules.md` > `Memory.md` > `intro.txt`. When this document conflicts with another doc, the conflict is **recorded** here (see §32 Conflict Register), never silently resolved.
>
> **Status legend** used throughout:
> - 🟢 **CURRENT** — implemented and correct; this spec defines the contract.
> - 🔵 **PROTOTYPE** — implemented in the current build; may be simplified/mock, spec preserves it as baseline.
> - 🟡 **IN PROGRESS** — partially implemented or being actively standardized.
> - ⬜ **PLANNED** — designed in this spec but not yet implemented.
> - 🔮 **FUTURE** — deferred / aspirational; defined here for direction only.
> - **RECOMMENDED IMPROVEMENT** — a deliberate enhancement to the existing design, explicitly labeled with rationale. Nothing here overrides the existing look unless the reason is stated.

---

## Table of Contents

1. [Design Philosophy & Principles](#1-design-philosophy--principles)
2. [UI/UX Overview & Content Strategy](#2-uiux-overview--content-strategy)
3. [Color / Theme System](#3-color--theme-system)
4. [Typography](#4-typography)
5. [Spacing, Layout & Grid](#5-spacing-layout--grid)
6. [Design Tokens (Complete)](#6-design-tokens-complete)
7. [Buttons & Interactive Controls](#7-buttons--interactive-controls)
8. [Form Controls & Inputs](#8-form-controls--inputs)
9. [Cards, Panels & Surfaces](#9-cards-panels--surfaces)
10. [Navigation & Information Architecture](#10-navigation--information-architecture)
11. [Component State Semantics](#11-component-state-semantics)
12. [Motion & Animation](#12-motion--animation)
13. [Iconography](#13-iconography)
14. [Visualizations & Charts](#14-visualizations--charts)
15. [Code Editor & Terminal Aesthetic](#15-code-editor--terminal-aesthetic)
16. [Data Tables & Lists](#16-data-tables--lists)
17. [Modals, Dialogs & Notifications](#17-modals-dialogs--notifications)
18. [AI Mentor / Chat Patterns](#18-ai-mentor--chat-patterns)
19. [Responsive Behavior & Breakpoints](#19-responsive-behavior--breakpoints)
20. [Accessibility (a11y)](#20-accessibility-a11y)
21. [The Admin Center (ACC) Interface](#21-the-admin-center-acc-interface)
22. [User Memory & Preferences](#22-user-memory--preferences)
23. [Loading, Empty, Error & Skeleton States](#23-loading-empty-error--skeleton-states)
24. [Microcopy & Content Voice](#24-microcopy--content-voice)
25. [Anti-Patterns & What NOT to Do](#25-anti-patterns--what-not-to-do)
26. [Design Versioning & Change Process](#26-design-versioning--change-process)
27. [Component Catalog & Ownership](#27-component-catalog--ownership)
28. [Brand Narrative & Visual Tone](#28-brand-narrative--visual-tone)
29. [Frontend File & Module Conventions](#29-frontend-file--module-conventions)
30. [Admin UI Deep-Dive (per-module)](#30-admin-ui-deep-dive-per-module)
31. [QA & Visual Regression Checklist](#31-qa--visual-regression-checklist)
32. [Conflict Register](#32-conflict-register)
33. [Future Design Roadmap](#33-future-design-roadmap)

---

## 1. Design Philosophy & Principles

Atlas is presented as an **AI-powered software engineering learning ecosystem**. Its visual language is deliberately **dark, technical, and "instrumented"** — every surface reads like a piece of engineering tooling (a workbench / cockpit / IDE), not a consumer product. The aesthetic says: *this is where real engineers are measured, verified, and ranked.*

**Governing principles (all CURRENT 🟢 unless noted):**

1. **Dark-first, neon-accents.** The canvas is near-black (`#050508`). Color enters only as purposeful signal: progress, status, engagement, identity. Base chrome must never compete with content amplitude.
2. **The terminal is the brand.** Mono type for labels, status, IDs, and telemetry; blinking cursors; streaming logs; `»` prompt markers. This is the single strongest differentiator of the Atlas identity and must be preserved everywhere.
3. **Grid + glow = "the network."** The fixed radial-vignette + 30px grid-line background evokes a live node graph. Hover/active states use neon glow to suggest an energized connection.
4. **Verified over decorative.** Status pills, verification badges, proof footers, and "LIVE" indicators carry meaning. Decorative flourish is secondary to signal density.
5. **Monochrome hierarchy, neon emphasis.** Neutrals (`#f3f4f6` / `#94a3b8` / `#64748b`) carry body structure; neon colors are reserved for active/interactive/meaning states.
6. **Engineering honesty (from rules/phases).** UI *shells* are not *features*; mocks are labeled as mocks. The design spec must not imply fake polish where the underlying system is a placeholder (e.g., the keyword-match compiler, the conditional AI mentor, the 2-of-12 Admin modules).

**Non-goals (protected, do NOT "fix"):**
- Do not convert Atlas to a light theme, a glassmorphism/euphemistic "modern SaaS" look, card-and-white-space enterprise design, or a colorful gradient playground.
- Do not remove the mono-font telemetry flavor in favor of all-sans readability at the label level.

---

## 2. UI/UX Overview & Content Strategy

**Experience flow (CURRENT 🟢):** hash-based SPA navigation in `App.jsx`:
- Auth gate → `#login` / `#register` → `#onboarding-wizard` → dashboard (`''`).
- Authenticated shell: left sidebar (`--sidebar-width: 250px`) + main workspace with 6 nav tabs: **Overview** (dashboard), **Learn**, **Mission IDE** (ide), **Logic Practice** (practice), **Passport**, **Career Vault**.
- Admin route: `#admin` or `pathname === '/admin'` renders the standalone Admin Center (ACC) shell (its own 260px sidebar), superseding the normal app shell.
- Auth aux flows behind routes: `#keypad`, `#auth-success`, `#forgot-password`, `#reset-password`, `#verify-email`.

**Content/IA principles (CURRENT 🟢):**
- **One primary action per panel.** The Mission IDE, dashboard cards, and admin modules each surface a single dominant CTA.
- **Signal density over whitespace.** Cards pack label/value/trend/footer; panels are tall and information-rich rather than airy.
- **Everything has a status.** Where a datum exists (user, mission, accomplishment, node, module), a status or verification marker is expected.

**Content voice:** terse, imperative, technical. Headers as short nouns; labels as uppercase mono micro-tags; status as pills; body copy in short sentences. Example: `SECURITY TAGS`, `LIVE`, `VERIFIED`, `» traverse graph[O]`.

**RECOMMENDED IMPROVEMENT (rationale — reduces surprise, supports "UI shell ≠ feature" honesty):** Add a `BLUEPRINT` / `MOCK` / `SIMULATOR` micro-badge next to the few prototype-only surfaces (Mission IDE compiler output, AI mentor chat, and the 10 placeholder Admin modules). Implement as a small `code-pill` using existing tokens; do **not** restyle the panels.

---

## 3. Color / Theme System

Single dark theme only. No light theme. Theme is fixed at the `:root` level; there is no runtime theming today.

### 3.1 Base Palette (CURRENT 🟢)

| Token | Value | Role |
|---|---|---|
| `--bg-core` | `#050508` | App background |
| `--bg-panel` | `rgba(13,15,24,0.75)` | Translucent card surface |
| `--bg-panel-solid` | `#0d0f18` | Opaque panel (tabs, editor header) |
| `--bg-input` | `#111422` | Input / chip backgrounds |
| `--text-primary` | `#f3f4f6` | Primary text |
| `--text-secondary` | `#94a3b8` | Body / secondary text |
| `--text-dim` | `#64748b` | Meta / labels / muted |
| `--border-dim` | `rgba(56,189,248,0.15)` | Default borders (blue-tinted dim) |
| `--border-neon-purple` | `rgba(139,92,246,0.35)` | Accent borders (purple) |
| `--border-neon-blue` | `rgba(59,130,246,0.4)` | Accent borders (blue) |

### 3.2 Neon Accent Palette (CURRENT 🟢)

The six neon accents are the semantic color language. **Each maps to a meaning — never use semantically arbitrarily.**

| Token | Value | Canonical meaning / usage |
|---|---|---|
| `--neon-purple` `#8b5cf6` | Primary brand / focus / active | Active path, active challenge, folder active, tab-btn active, mentor-user bubble, admin role, `»` markers, passport avatar, spec `»` bullets |
| `--neon-blue` `#3b82f6` | Structure / verified / blue accent | `.ctrl-btn.load`, net-line active, tip-panel, velocity bar, canvas blocks (db), resume type pill |
| `--neon-cyan` `#00e5ff` | Interactivity / selection / high-signal | Hover border, active file/sidebar item, cursor, connection, `.pipeline-label`, `.panel-title`, LIVE chip, `end` success path |
| `--neon-green` `#10b981` | Success / verified / online | Verified accomplishments, quality green, online pill, success log-line, success badge, `beginner` diff |
| `--neon-lime` `#ccff00` | Mentor / AI / tertiary highlight | Mentor label & bubble border, velocity delta, disambiguation, canvas cache block |
| `--neon-yellow` `#f59e0b` | Warning / in-progress / medium | Pending accomplishments, warning pill, difficulty pill, `medium` diff, indicator bulb active |
| `--neon-red` `#ef4444` | Error / destructive | `.reset` button, error log-line, fail feedback, `hard` diff, admin error alert |

> Note: `--border-dim` is **named "dim"** but is defined with a **blue** tint (`rgba(56,189,248,0.15)`). This is intentional in the current code; it gives default borders a faint cool cast. Keep — do not "correct" to a neutral gray, as that would flatten the palette (see §32.1).

### 3.3 Glow Tokens (CURRENT 🟢)

| Token | Value |
|---|---|
| `--glow-purple` | `0 0 15px rgba(139,92,246,0.35)` |
| `--glow-blue` | `0 0 15px rgba(59,130,246,0.3)` |
| `--glow-cyan` | `0 0 15px rgba(0,229,255,0.4)` |
| `--glow-green` | `0 0 15px rgba(16,185,129,0.3)` |
| `--glow-lime` | `0 0 15px rgba(204,255,0,0.35)` |

Glow = "energized / active / connected." Use glows on hover of interactive neon elements, active tabs, live nodes, and verified graph elements. Keep glow radii ~15px and alpha ≤ 0.4 to avoid halo blowout.

### 3.4 Background System (CURRENT 🟢)

`body` uses a fixed multi-layer background:
```
radial-gradient(circle at 10% 20%, rgba(139,92,246,0.08) 0%, transparent 40%),
radial-gradient(circle at 90% 80%, rgba(59,130,246,0.08) 0%, transparent 40%),
linear-gradient(rgba(18,24,38,0.25) 1px, transparent 1px),      /* 30px grid rows */
linear-gradient(90deg, rgba(18,24,38,0.25) 1px, transparent 1px); /* 30px grid cols */
background-size: 100% 100%, 100% 100%, 30px 30px, 30px 30px;
background-attachment: fixed;
```
Two soft corner vignettes (purple top-left, blue bottom-right) + a faint 30px grid → "the network" motif.

---

## 4. Typography

Two typefaces, confirmed in `frontend/index.html` via Google Fonts:
- **Sans:** `'Outfit'` (`wght 100..900`) — UI text, headings, body.
- **Mono:** `'JetBrains Mono'` (`wght 100..800`, fallback `'Fira Code'`, `monospace`) — labels, telemetry, IDs, code, prompts.

**Font stack tokens:**
```css
--font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```
App-wide body: `letter-spacing: 0.02em`.

### 4.1 Type Scale (CURRENT 🟢)

| Context | Size / Weight / Color | Notes |
|---|---|---|
| H1 screen title | `32px / 700 / #fff / ls -0.02em` | Page-level hero title |
| H2 section | `22px / 600 / #fff` | Panel/section titles (resume header uses `26px`) |
| H3 group | `16px / 600 / --text-secondary` | Group labels, visualizer header (client uses `14px`) |
| Body | `13–13.5px / --text-secondary / lh 1.5–1.6` | Standard copy |
| Small/meta | `10–12px / --text-dim` | Footers, timestamps, meta |
| Micro-tag | `9–11px / mono / uppercase ls 1px` | Labels, section titles, status, pills |

### 4.2 Mono Usage Rules (CURRENT 🟢)

Mono is reserved for **machine-flavored** content. Use it for:
- Micro-labels and uppercase section titles (`.form-group label`, `.panel-title`, `.category-title`).
- IDs and machine identifiers (`.passport-id`, `.passport-title`, log lines, node IDs, `passport-id`).
- Status text on pills and chips where it reads as telemetry.
- Code and terminal content (`.code-textarea`, `.terminal-log-content`, `.code-block`, `.line-numbers`).

**Do not** use mono for long-form body paragraphs or marketing-style prose (reserve for code/status).

**RECOMMENDED IMPROVEMENT (rationale — legibility at small sizes, zero visual change):** The two fonts are fine. If accessibility review (WCAG AA at 9px micro-tags) fails, bump the tiniest mono labels to `10px` minimum rather than changing face.

---

## 5. Spacing, Layout & Grid

### 5.1 Core Spacing Rhythm (CURRENT 🟢)

Non-tokenized but consistent across `index.css`:
- **Panel internal padding:** `16px` (standard), `24px` sidebar, `30px` admin workspace, `40px` resume sheet.
- **Column/gap rhythm:** `8 / 12 / 16 / 20 / 24 / 40` px, scaling with context.
- **Border radius:** `4px` (small chips/inputs/buttons), `6px` (badges/blocks), `8px` (cards/panels/inputs), `12px` (avatar). No fully-rounded (999px) pills except none exist — keep corners technical, not playful.

### 5.2 App Layout (CURRENT 🟢)

```
┌─────────────┬──────────────────────────────┐
│ Sidebar     │  Dashboard main (12-col grid)│
│ 250px       │  .dashboard-grid             │
│ fixed z-100 │                              │
├─────────────┴──────────────────────────────┤
```
- Sidebar: `--sidebar-width: 250px`, bg `#090b11`, `border-right: 1px solid rgba(255,255,255,0.05)`, padding `24px 16px`, `z-index: 100`.
- Main workspace: fills remaining width; content renders inside 12-column grids (`.stats-grid`, `.nodes-visualizer`, `.ai-mentor-panel` span 7, `.active-path-panel` span 5, etc.).

### 5.3 Dashboard Grid (CURRENT 🟢)

- `.stats-container`: `grid-column: span 12; grid-template-columns: repeat(3, 1fr); gap: 24px;` → collapses to `1fr` at ≤768px.
- Panels allocate grid-column spans (e.g., AI mentor `span 7`, active path `span 5`) and collapse to `span 12` at ≤1024px.
- `.paths-grid`: 2 columns, `gap 16px`, collapses to 1 column at ≤768px.

---

## 6. Design Tokens (Complete)

All tokens below are **CURRENT 🟢** and extracted verbatim from `frontend/src/index.css` `:root`. This is the canonical token ledger.

```css
:root {
  /* Color Palette */
  --bg-core: #050508;
  --bg-panel: rgba(13, 15, 24, 0.75);
  --bg-panel-solid: #0d0f18;
  --bg-input: #111422;
  --border-dim: rgba(56, 189, 248, 0.15);
  --border-neon-purple: rgba(139, 92, 246, 0.35);
  --border-neon-blue: rgba(59, 130, 246, 0.4);

  --text-primary: #f3f4f6;
  --text-secondary: #94a3b8;
  --text-dim: #64748b;

  /* Neon Accents */
  --neon-purple: #8b5cf6;
  --neon-blue: #3b82f6;
  --neon-cyan: #00e5ff;
  --neon-green: #10b981;
  --neon-lime: #ccff00;
  --neon-yellow: #f59e0b;
  --neon-red: #ef4444;

  /* Shadows & Glows */
  --glow-purple: 0 0 15px rgba(139, 92, 246, 0.35);
  --glow-blue: 0 0 15px rgba(59, 130, 246, 0.3);
  --glow-cyan: 0 0 15px rgba(0, 229, 255, 0.4);
  --glow-green: 0 0 15px rgba(16, 185, 129, 0.3);
  --glow-lime: 0 0 15px rgba(204, 255, 0, 0.35);

  /* Fonts */
  --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Layout */
  --sidebar-width: 250px;
}
```

### 6.1 Semantic Token Map

| Semantic role | Primitive token(s) |
|---|---|
| Primary interactive/active | `--neon-purple` + `--glow-purple` |
| Hover / selection / link | `--neon-cyan` + `--glow-cyan` |
| Success / verified / online | `--neon-green` + `--glow-green` + `rgba(16,185,129,…)` |
| Warning / in-progress | `--neon-yellow` + `rgba(245,158,11,…)` |
| Error / destructive | `--neon-red` + `rgba(239,68,68,…)` |
| AI / mentor / tertiary | `--neon-lime` + `rgba(204,255,0,…)` |
| Panel bg | `--bg-panel` / `--bg-panel-solid` / `#111422` |
| Default border | `--border-dim` (blue-tinted) |
| Edge borders (subtle) | `rgba(255,255,255,0.03–0.05)` |
| Terminal/editor bg | `#020204` / `#020305` / `#040509` |

---

## 7. Buttons & Interactive Controls

### 7.1 Neon Button (CURRENT 🟢) — `.neon-btn`

The signature CTA. Transparent bg, neon border, glow; on hover the button **fills** with its neon color, emits a 20px glow, and lifts `-1px`. Base anatomy: `radius 6px`, `padding 10px 20px`, `font 500`, `inline-flex gap 8px`, `cursor pointer`, `transition all 0.2s ease-in-out`.

| Variant | Class | Default style | Hover |
|---|---|---|---|
| Default | `.neon-btn` | purple border, `--glow-purple`, transparent bg | fills `--neon-purple`, `0 0 20px rgba(139,92,246,0.6)`, `-1px` lift |
| Secondary | `.neon-btn.secondary` | blue border, `--glow-blue`, transparent | fills `--neon-blue`, `0 0 20px rgba(59,130,246,0.6)` |
| Accent | `.neon-btn.accent` | **cyan filled** bg + dark text `#bg-core`, `--glow-cyan` | bg/border `#00b0ff`, text `#fff`, `0 0 20px rgba(0,229,255,0.7)` |

**Disabled** (`.neon-btn:disabled`): `opacity 0.5`, `cursor: not-allowed`, and force-strips hover (no background, no glow, no transform via `!important`).

### 7.2 Control Buttons — `.ctrl-btn` (CURRENT 🟢)

Small mono-ish editor controls with variants:
- Base: `10px`, `1px solid --border-dim`, transparent, `--text-secondary`, `radius 4px`, hover → `#fff` + `--text-secondary` border.
- `.ctrl-btn.load` (purple accent, `box-shadow: 0 0 10px rgba(139,92,246,0.2)`, hover fills purple).
- `.ctrl-btn.reset` (red accent; hover fills red).

### 7.3 Tab Buttons (CURRENT 🟢)

- `.tab-btn` (Career Vault): mono `12px`, transparent, `--text-secondary`; hover → white; **active** → purple border + `rgba(139,92,246,0.05)` bg + `--glow-purple`.
- `.category-item-btn` (Admin sidebar + Account Settings): two definitions exist (see §32.2); treat as mono 11px text-left nav, hover → white, admin-active → cyan, settings-active → purple.
- `.nav-item` (app sidebar tabs): transitions to accent on `.active`.

### 7.4 Interaction Feedback Contract (CURRENT 🟢)

| Interaction | Feedback |
|---|---|
| Hover (interactive) | Border→neon + glow + optional `translateY(-1px)` or bg tint |
| Active/selected | Neon border + tinted bg + glow (purple or cyan per context) |
| Disabled | `opacity: 0.5`, no glow |
| Destructive | Red border → hover fill red |
| In-progress | Spinner (`Loader2`), yellow bulb for terminal, `LIVE`/status chip |

---

## 8. Form Controls & Inputs

Confirmed patterns from `index.css` (CURRENT 🟢):

### 8.1 Field Groups
- `.form-group`: `gap 12px` (or 8px tighter layouts), column stack.
- `label`: `11px`, `--font-mono`, `uppercase`, `letter-spacing 1px`, `--text-primary`.
- `.form-tip`: `11px`, `--text-dim`, mono fallback.
- `.credentials-form`: `gap 20px`, column stack.
- Inputs: `background: var(--bg-input)` (`#111422`), border `--border-dim`, focus outline neon.

### 8.2 Input/Action Rules
- Focus states must use a neon border (cyan/purple) + subtle glow — never default browser blue.
- Errors surface through `.form-tip`-style inline helper text flipping to `--neon-red`, or inline badges. No blocking modal for field validation.
- Placeholder contrast: use `--text-dim` (do not ship near-invisible placeholders).
- Password/security inputs carry `Key`/`Lock` icons to signal the auth context (matches `auth/` components using `Shield/Key/Lock/User/Mail` icons).

**RECOMMENDED IMPROVEMENT (rationale — reduces support load, no visual change):** Add `aria-invalid`, `aria-describedby`, and `role="alert"` to the currently-inline error text pattern so validation reads correctly to AT (belongs to §20 audit).

---

## 9. Cards, Panels & Surfaces

A **card** is `position: relative; padding ~16–18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03)` on `--bg-panel` (or translucent). The canonical generic panel is **`.glass-panel`** (CURRENT 🟢, used by learn/flashcard/onboarding):
- `background: var(--bg-panel)`, `border: 1px solid var(--border-dim)`, `border-radius: 12px`, `backdrop-filter: blur(12px)`, `padding: 24px`, `box-shadow: 0 8px 32px 0 rgba(0,0,0,0.37)`, `transition: all 0.3s cubic-bezier(0.4,0,0.2,1)`; hover → `border-color rgba(56,189,248,0.3)`.

Panels vary by role:

- **Stat card** (`.stat-card` / `.admin-stat-card`): label (10–11px mono) → big value (`28–36px / 700 / #fff`) → delta chip / footer (top border `rgba(255,255,255,0.03)`).
- **Path card** (`.path-card`): bg `#111422`, border `--border-dim`, radius 8, padding 18; hover → cyan border + glow + `translateY(-2px)`; active → purple border + `rgba(139,92,246,0.05)` bg.
- **Pipeline item** (`.pipeline-item`): bg `rgba(255,255,255,0.01)`; `.current` → purple tint + `rgba(139,92,246,0.1)` border.
- **Accomplishment item** (`.accomplishment-item`): whitesmoke-0.01 bg; `.verified` → green left bar; `.pending` → yellow left bar + `opacity 0.7`.
- **Challenge row** (`.challenge-row`): bg `rgba(13,15,24,0.5)`, border `rgba(255,255,255,0.03)`; hover → cyan, active → purple.
- **Editor/terminal** (`.ide-editor-container`, `.ide-terminal`): border `--border-neon-blue` w/ `box-shadow 0 0 10px rgba(59,130,246,0.1)`, header `#090b12`, body `#020204/#040509`.
- **Canvas**: `.canvas-wrapper`, `.architecture-canvas` in near-black `#020204` with faint borders.

### Surface elevation
Layer stacking (no heavy shadows; light edges + glows):
1. Body layer: `--bg-core` + vignette/grid.
2. Panels/cards: translucent `--bg-panel`, hairline borders.
3. Elevated/active: neon border + glow.
4. Modal/overlay: dark overlay + solid panel (see §17).

**RECOMMENDED IMPROVEMENT (rationale — consistency):** Introduce a `--radius` token scale (`4/6/8/12`) and `--spacing-*` scale in `:root` so new components stop hard-coding radii/padding. This is documentation-of-record only; it changes no rendered pixels before rollout.

---

## 10. Navigation & Information Architecture

### 10.1 App Sidebar (CURRENT 🟢)
- Width `250px`, bg `#090b11`, right hairline, `z-index 100`, padding `24px 16px`.
- Brand header + `.nav-links` (column, `gap 8px`) with `.nav-item` per top-level tab:
  - `.nav-item`: `radius 8px`, `padding 12px 16px`, `14px`, `--text-secondary`, flex gap 12px with icon.
  - hover: `rgba(255,255,255,0.02)` bg + `#fff`.
  - `.active`: `rgba(139,92,246,0.1)` bg + `#fff` + **3px purple left border** + `inset 5px 0 15px -5px rgba(139,92,246,0.3)` glow.
- Sidebar footer `.user-badge`: hairline top; `.avatar` `40px` circle, 2px purple border, `--glow-purple`.

### 10.2 Top-level IA (CURRENT 🟢)
| Route | Tab label | Component |
|---|---|---|
| `''` | Overview | `Dashboard.jsx` |
| `#learn` | Learn | `LearHub.jsx` + `LessonViewer.jsx` + `FlashCard.jsx` |
| `#ide` | Mission IDE | `MissionIDE.jsx` |
| `#practice` | Logic Practice | `LogicPractice.jsx` |
| `#passport` | Passport | `Passport.jsx` |
| `#career` | Career Vault | `CareerVault.jsx` |

Secondary flows (no sidebar): `#login`, `#register`, `#keypad`, `#onboarding-wizard`, `#auth-success`, `#forgot-password`, `#reset-password`, `#verify-email`.

Admin: `#admin` / `/admin` → **Admin Center** (separate 260px sidebar, see §21).

### 10.3 Breadcrumb / Section navigation rules (CURRENT 🟢)
- Career Vault uses `.vault-tabs-nav` (mono `.tab-btn`).
- Mission IDE uses left `.ide-explorer` file tree (folders + files with active highlight).
- Admin uses `.admin-menu-list` → `.admin-menu-category` → `.category-item-btn`.

**RECOMMENDED IMPROVEMENT (rationale — standardize active states):** The `.category-item-btn.active` styling is duplicated with divergent colors (cyan in admin, purple in settings — §32.2). Resolve via a single `--nav-active` semantic mapping: admin conciseness cyan, settings purple, or one canonical purple. Record, don't silently pick.

---

## 11. Component State Semantics

A unified state model applied to interactive components (CURRENT 🟢 wherever present; ⬜ where this spec formalizes behavior already implied):

| State | Visual Treatment |
|---|---|
| `default` | Base border `--border-dim` or hairline, neon text where colored |
| `hover` | Border → neon-cyan, optional glow, optional `-1/-2px` lift |
| `active` / `selected` | Neon-purple (or context accent) border + `rgba(139,92,246,0.05–0.1)` bg + glow |
| `focus-visible` | Neon ring; must never be suppressed |
| `disabled` | `opacity 0.5`, no glow, no pointer events |
| `loading` | Spinner icon (`Loader2`) replacing label, or status chip + pulse |
| `error` | `--neon-red` border + inline message |
| `success` | `--neon-green` border + check badge |
| `empty` | Centered icon + title + dim copy (`.empty-details`) |
| `verified` / `pending` | Green / yellow motif (accomplishment, skill, node) |

**RECOMMENDED IMPROVEMENT (rationale — cursor affordance):** Ensure every `.ctrl-btn`, `.tab-btn`, `.category-item-btn`, `.folder-name`, `.file-item`, `.challenge-row`, and `.path-card` carries `cursor: pointer` and visible `:focus-visible`. Audit in §31.

---

## 12. Motion & Animation

All `transition: all 0.2s ease-in-out` by default; hover micro-motion is the norm. `.glass-panel` uses a springier `0.3s cubic-bezier(0.4,0,0.2,1)`. Defined keyframes/animations (CURRENT 🟢):

| Animation | CSS | Used by |
|---|---|---|
| `fadeIn` | `fadeIn 0.3–0.4s ease-out` | page/panel mounts |
| `terminal-blink` | `step-end 1s infinite` (50% opacity 0) | `.cursor-blink` (8×15px cyan block) |
| `dash` | `dash 10s linear infinite` | active `.net-line` dash sweep |
| `pulse-glow` | `pulse-glow 2s infinite ease-in-out` | live `.net-pulse` |
| `pulse-neon` | `pulse-neon 2s infinite ease-in-out` (opacity 0.3→0.8) | `.pulse-border` attention/border pulse |
| `scanning` | `scanning` (translateY 0→180px→0) | 2D scan / scanning-line effect |
| bar grow | `height 0.5s ease` | velocity/admin chart bars |
| ring draw | `stroke-dashoffset 1s ease-out` | maturity ring |

**Motion principles (CURRENT 🟢):**
- Motion is **fast and subtle** (≤0.3–0.4s), signaling, never decorative-showy.
- Loop animations are reserved for **live/status** signals (cursor blink, network pulse, dash) — do not loop decorative elements.
- Critical: honor `prefers-reduced-motion` (⬜ currently absent — see §20.3 recommendation).

**RECOMMENDED IMPROVEMENT (rationale — a11y):** Add a `@media (prefers-reduced-motion: reduce)` block that disables looping keyframes (`terminal-blink`, `pulse-glow`, `pulse-neon`, `dash`, `scanning`) and reduces transition duration to `0.01ms` where safe. Pure additive, no visual change for most users.

---

## 13. Iconography

**Library:** `lucide-react` (`^1.28.0` in `frontend/package.json`).

> ⚠️ **Note (recorded, not silently resolved, §32.3):** The pinned `lucide-react` version `^1.28.0` is atypical. Current `lucide-react` releases are in the `0.4xx` range. This will need reconciliation before relying on new icons; existing icon usage must not assume symbols beyond what's already imported.

**In-use icon vocabulary (CURRENT 🟢):** `Shield`, `Key`, `Lock`, `User`, `Server`, `Cpu`, `UserCheck`, `Terminal`, `Award`, `ChevronRight`, `Check`, `CheckCircle`, `CheckCircle2`, `X`, `XCircle`, `RotateCw`, `RefreshCw`, `Loader2`, `Globe`, `Clock`, `Mail`, `Trash2`, `ThumbsUp`.

**Icon rules (CURRENT 🟢 + recommendation):**
- Stroke-based, current stroke width (lucide default 2), **no filled brand icons**.
- Accent/status icons use the matching neon semantic color (check → green, x → red, shield → purple).
- **RECOMMENDED IMPROVEMENT (rationale — consistency):** Define a canonical icon set per component (e.g., always `Loader2` for loading, `Shield` for security). Centralize imports to prevent icon drift.

---

## 14. Visualizations & Charts

Dashboards use hand-rolled SVG/CSS charts — no chart library. (CURRENT 🟢)

| Chart | Implementation | Key styling |
|---|---|---|
| Maturity ring | SVG `.maturity-ring` | `ring-fill --neon-purple`, `stroke-dasharray 251.2`, rotate -90°, linecap round, 1s draw |
| Velocity bars | `.velocity-chart` `height:40px` | bar `linear-gradient(to top, --neon-blue, --neon-cyan)`, `height 0.5s` |
| Network graph | `.network-svg` | inactive line `rgba(255,255,255,0.05)`; active `--neon-blue` dashed; node default `#1a1e2e`; `.active` cyan + glow, `.verified` purple + glow, `.end` green |
| Admin mock chart | `.mock-chart-bars` | columns `linear-gradient(to top, --neon-purple, --neon-cyan)` + `--glow-blue`, `height 0.5s` |

**Rules:** Charts render on near-black (`#020204`) canvases; data uses neon strokes/fills; labels `9–10px --text-dim`; trend deltas use `--neon-lime` chips. **Label mocks as mock** (admin charts are static placeholders — see §21).

---

## 15. Code Editor & Terminal Aesthetic

The **Mission IDE** and **terminal** are the heart of the brand (CURRENT 🟢).

### 15.1 IDE layout
- `.mission-ide-root`: column, `gap 20px`, `height calc(100vh - 60px)`, `fadeIn`.
- `.ide-layout-container`: flex row, `gap 20px`; collapses to column at ≤1200px (children `height 400px`).
- Left `.ide-explorer` (240px): folder/file tree; `.file-item.active` → cyan bg tint + 2px cyan left border.
- Center `.ide-editor-container`: border `--border-neon-blue` + blue shadow; `.editor-tab-header` bg `#090b12`; `.tab-title.active` → bg `--bg-panel-solid`, cyan, 2px cyan top border.
- `.editor-workspace` bg `#040509`; `.line-numbers` 45px `#020305`; `.code-textarea` transparent, `--font-mono` soon `13.5px`, color `#c5c6c7`, `tab-size 4`, `white-space pre`.
- Right `.ide-specs` (280px): `.spec-title`, `.spec-pill` (difficulty yellow / type blue), `.spec-list` with `» ` markers (purple bullets), `.spec-section h4` mono.
- Bottom `.ide-terminal` (180px): header `#090b12`, `.terminal-header .title`, `.indicator-bulb` (dim→yellow when active), `.terminal-log-content` bg `#020204`, `#8892b0`, `.log-line.success` → `--neon-green`, `.error` → `--neon-red`.

### 15.2 Stream / log patterns (CURRENT 🟢)
- `.log-line` `line-height 1.5`; prompts `.prompt` / `.log-prompt` → `--neon-purple`.
- Admin streaming `.admin-terminal-log`: bg `#020203`, border `rgba(56,189,248,0.2)`, color `--neon-cyan`, `12.5px`, `400px` tall.

### 15.3 Honesty marker (CURRENT 🔵 — declared)
The Mission IDE compiler is a **keyword-match simulator**, not a real compiler (documents in `phases.doc.md` & `architecture.md`). The design must not fake language-server features (auto-complete, diagnostics) it does not have. [Pending the RECOMMENDED badge in §2.]

---

## 16. Data Tables & Lists

Admin tables (CURRENT 🟢):
- `.table-row`: `display: grid; grid-template-columns: repeat(4, 1fr); padding 14px 20px; border-bottom rgba(255,255,255,0.03); font 13.5px --text-secondary`.
- `.table-row.header`: bg `#090b12`, `11px --text-dim`, `letter-spacing 1px`, rounded top corners.
- `.table-row.last-child` no border; `.align-center` variant.
- Status pills `.status-pill`: `10px / 700`, `radius 4px`, fits content; `.online` green, `.warning` yellow.
- `.admin-status-table` variant of the same row mechanism.

**Rules (CURRENT 🟢 + recommendation):** Row hover gains a subtle bg tint (**RECOMMENDED IMPROVEMENT** — currently no hover on admin rows; add `rgba(255,255,255,0.02)` for scannability); keep header sticky only in long scroll containers (**⬜**); empty state should use `.empty-details`-style centered message instead of a bare "nothing here".

---

## 17. Modals, Dialogs & Notifications

- **Notifications:** Admin uses a lightweight inline `.admin-alert` (success green / error red, `14px 20px`, `radius 8px`). There is **no** global toast system today (see infra).
- **Confirm/disambiguation:** Uses inline confirmation buttons (e.g., `Check`/`Trash2`) rather than a blocking modal.
- **Overlay:** Modal-if-needed pattern uses dark full-bleed overlay + centered solid panel with neon accent border.

**RECOMMENDED IMPROVEMENT (rationale — fills a real gap, matches brand):** Add a **toast container** styled from existing tokens (mono label, `--bg-panel-solid`, hairline border, neon icon) for transient successes/errors. Restrict to `3.5s` auto-dismiss + manual X; respect reduced motion. This is additive; it does not replace inline `.admin-alert`.

---

## 18. AI Mentor / Chat Patterns

Dashboard AI mentor panel (CURRENT 🔵 — prototype/conditional):
- `.ai-mentor-panel`: `span 7` (→ `span 12` ≤1024px), `height 380px`.
- Header: `.mentor-header .status` chip `--neon-lime` `9px` "LIVE"-style.
- Chat: `.mentor-chat-area` scrollable; `.chat-bubble` `max-width 80%`, `radius 8px`, `13.5px lh 1.5`.
  - `.chat-bubble.mentor`: `rgba(255,255,255,0.02)` bg, `rgba(204,255,0,0.1)` border, **lime 3px left border**, `.mentor-label` `9px` lime.
  - `.chat-bubble.user`: `rgba(139,92,246,0.1)` bg, `rgba(139,92,246,0.2)` border, **purple 3px right border**, `#fff`.
- Input: `.mentor-chat-form` flex; text input + `.send-btn` (neon button).

**Rules (CURRENT 🔵):** Mentor = lime; User = purple. The AI is a **conditional chatbot**, not a general assistant — the UI must not overpromise freeform capability (engineering honesty). [Pending RECOMMENDED `SIMULATOR` badge.]

---

## 19. Responsive Behavior & Breakpoints

Three breakpoints, all `max-width` (CURRENT 🟢):

| Breakpoint | Behavior |
|---|---|
| `≤1200px` | IDE layout-container → column; IDE children `width 100%`, `height 400px` |
| `≤1024px` | nodes-visualizer → `span 12`; ai-mentor & active-path → `span 12`; passport-layout, practice-layout → column; admin main `max-width` recomputes |
| `≤768px` | stats-container → `1fr`; paths-grid → 1 column; passport-header → column (actions full-width buttons); admin-grid-3/2 → `1fr` |

**Admin responsiveness (CURRENT 🟢):** `.admin-workspace-content` `padding 30px`, `max-width: calc(100vw - 260px)`, `height 100vh`, scroll-y. Admin sidebar `260px` sticky. At small widths admin grids collapse to 1 col. **RECOMMENDED IMPROVEMENT:** At ≤768px consider collapsing the 260px admin sidebar to an icon/toggle drawer (recorded, ⬜).

---

## 20. Accessibility (a11y)

Current state (CURRENT 🟢 where implemented; explicit gaps flagged):
- Semantic headings h1→h4 used throughout with correct scale.
- Color: neon-on-dark contrast is generally strong; **micro-tags at 9px and `--text-dim` at 10px need an AA check** (known risk).
- Focus: interactive elements rely on custom borders/glows; **ensure `:focus-visible` is never suppressed**.
- `letter-spacing: 0.02em` aids legibility; mono labels uppercase must not exceed ~11px.

**RECOMMENDED IMPROVEMENTS (rationale — closes known gaps without redesigning):**
1. `@media (prefers-reduced-motion: reduce)` to disable looping keyframes (§12).
2. `aria-invalid` / `aria-describedby` / `role="alert"` on form error text (§8).
3. Minimum text size `10px` for micro-tags; `--text-dim` meta stays ≥10px.
4. Focus ring parity: ensure `.neon-btn`, `.ctrl-btn`, `.tab-btn`, `.category-item-btn`, `.challenge-row`, `.file-item` all expose visible `:focus-visible`.
5. Keyboard: file tree + tab lists must be navigable (⬜ — formalize roving tabindex).
6. `.status-pill` and color-only indicators gain text or `aria-label` so they aren't color-dependent.

---

## 21. The Admin Center (ACC) Interface

The **Admin Center** is a standalone shell (CURRENT 🟢) with its own left nav. **Honesty: only Security Tags (CRUD) and the role dropdown are real functional modules; the other 10 are UI shells/mock charts** (from `phases.doc.md`).

### 21.1 ACC Shell (CURRENT 🟢)
```
┌──────────────┬───────────────────────────────────────┐
│ Admin sidebar│  Admin workspace                      │
│ 260px        │  .admin-workspace-content             │
│ sticky h-100 │  padding 30px, span remaining         │
└──────────────┴───────────────────────────────────────┘
```
- `.admin-root-container`: `display flex; min-height 100vh; width 100vw; bg --bg-core`.
- `.admin-sidebar`: `width 260px; bg #06080d; border-right hairline; sticky top 0; height 100vh; padding 24px 16px; z-index 100; overflow-y auto`.
- `.admin-brand-header`: brand text `15px / 800 / ls 2px / #fff`.
- `.admin-menu-list` → `.admin-menu-category` (`.category-title` 11px uppercase mono `--text-secondary`) → `.category-items` (indented, left hairline) → `.category-item-btn` (mono 11px; hover white; **active cyan**).
- `.admin-sidebar-footer`: hairline top; `.admin-badge` (`#111422`, radius 6, name 12px/600/#fff, `.role` 10px uppercase `--neon-purple`).
- `.admin-workspace-content`: `flex 1; padding 30px; max-width calc(100vw - 260px); overflow-y auto; height 100vh; position relative`.

### 21.2 Panel chrome (CURRENT 🟢)
- `.admin-panel-container`: column, `gap 24px`; `h2` 24px `#fff`; `p` 13px `--text-secondary`.
- `.admin-grid-3` / `.admin-grid-2`: `repeat(3|2, 1fr); gap 20px`; collapse to 1 col ≤768px.
- `.admin-stat-card`: label 10px meta, `.value` 28px/700, `.footer` 10px dim w/ top hairline.
- `.admin-chart-mock` + `.mock-chart-bars` (static). `.admin-alert` success/error. `.admin-terminal-log` streaming. `.admin-table-wrapper` rows + `.status-pill`.

### 21.3 ACC module state map (from phases.doc.md)
| Module | Status |
|---|---|
| Dashboard | 🔵 prototype (mock stats/charts) |
| Users | 🔵 prototype (role dropdown is functional) |
| Learning | 🔵 prototype (shell) |
| Mission Studio | 🔵 prototype (shell) |
| AI | 🔵 prototype (conditional chatbot) |
| Compiler | 🔵 prototype (keyword-match simulator) |
| Analytics | 🔵 prototype (mock) |
| Community | 🔵 prototype (shell) |
| Hiring | 🔵 prototype (shell) |
| Finance | 🔵 prototype (shell) |
| Feature Flags | 🔵 prototype (shell / stub) |
| System | 🔵 prototype (SRS stub; logs) |
| **Security Tags** | 🟢 **functional (CRUD)** |
| **User Role update** | 🟢 **functional** |

Design must keep each shell's chrome consistent (same panel chrome, stat/grid/table patterns) so that as modules become functional the visual contract is already set.

---

## 22. User Memory & Preferences

Design-relevant preferences that the UI must honor (and persist — see docs):

| Preference | Design impact | Status |
|---|---|---|
| Role / callsign | Drives sidebar, admin access (`isSuperAdmin`), passport display | 🟢 functional |
| Theme | Fixed dark only — no theme toggle today | 🟢 fixed |
| Mission state (savedMission) | Persisted via `localStorage` (`savedMission === 'true'`) to resume IDE | 🟢 functional |
| Access tokens | Stored in `localStorage`/URL params (⚠️ security note — tokens in URL is a known anti-pattern per rules; do **not** design UI that prints/OAuth-exposes tokens) | 🟢 (risk flagged) |
| Streak / analytics | `streak: 5` hardcoded; analytics mock — UI must not present as live real metrics | 🔵 mock |

**Design rule:** Any preference surfaced in UI must map to a real persisted store; never render a toggle that doesn't persist (honesty). Add a lightweight Settings surface (Account Settings exists) consistent with token styles.

---

## 23. Loading, Empty, Error & Skeleton States

| State | Treatment |
|---|---|
| Loading | `Loader2` spinner (lucide), optional `.fade-in`; button label → spinner |
| Empty | `.empty-details`: centered `h3` white + `p` dim + icon, `min-height 350px` |
| Error | `.admin-alert.error` (red) / inline red message / `.dsa-feedback.fail` / `.log-line.error` |
| Success | `.admin-alert.success` / `.success-badge` / `.dsa-feedback.success` / `.log-line.success` / `.quality-status.green` |
| Pending | `opacity 0.7` + yellow motif |
| Skeleton | ⬜ **not present** — RECOMMENDED: add skeleton blocks (`#111422` + pulse) for async panels so empty flashes are avoided |

---

## 24. Microcopy & Content Voice

Tone: **terse, engineering, confident**. Rules (CURRENT 🟢):
- Nouns & labels: short, often uppercase mono micro-tags (`SECURITY TAGS`, `LIVE`, `VERIFIED`, `ONLINE`, `PENDING`).
- Status as pills: `ONLINE`, `WARNING`, `VERIFIED`, `PENDING`, `SUCCESS`, `FAIL`.
- Prompts/terminals: `» ` prefix, `$`-style, purple prompts.
- Buttons: imperative verbs (`LOAD`, `RESET`, `Submit`, `Run`, `Save`, `Return to Dashboard`, `Swap roles`).
- Empty states: helpful + dim, e.g., "Select a challenge to view its details."
- **No fabricated metrics:** don't say "2,341 nodes live" unless real; use `LIVE` only on genuinely streaming/websocket sources. Keep streaks/analytics labeled as prototype.

**RECOMMENDED IMPROVEMENT:** Standardize success/error copy templates (e.g., `SUCCESS: <noun> updated to "<value>"`) matching the existing `setAdminNotification` pattern, for consistency across modules.

---

## 25. Anti-Patterns & What NOT to Do

1. **No light theme, no glassy "modern SaaS" makeover.** Preserve dark cyberpunk.
2. **No rounded (999px) pills on interactive chrome.** Keep radii 4/6/8/12 technical.
3. **No importing a chart library** just because charts exist — the SVG/CSS chart language is on-brand and cheaper.
4. **No fabricating features through design.** Mocks must read as mocks; don't polish a placeholder compiler/AI into a fake real one (engineering honesty).
5. **No arbitrary neon color assignment.** Purple=brand/active, cyan=interactive, green=success, yellow=warning, red=error, lime=mentor. Don't swap semantics per panel.
6. **No suppressing `:focus-visible`** for aesthetics.
7. **No tight `--text-dim` at <10px** on critical info.
8. **No tokens/secrets in the UI.** The design must never render access tokens passed via URL query (known risk in auth flow — see Conflict Register).
9. **Do not empty `App.css` styles into global `index.css`** casually; keep global vs scoped separation intentional (current: all global).
10. **No layout-jumping localstorage writes** on mount without a loading gate.

---

## 26. Design Versioning & Change Process

- This doc is the **single design contract**. All design work references it.
- Token/visual changes go through: **proposal → impact check (§31) → version bump at top of this file → update component CSS → update component catalog (§27)**.
- Version history appended below (SemVer-ish `v1.0` baseline = current prototype extraction):

**Change log**
| Version | Date | Change | Status |
|---|---|---|---|
| v1.0 | (baseline) | Initial extraction from `index.css`; token ledger, component catalog, ACC spec | 🟢 |

- **Source of truth for visuals:** `frontend/src/index.css` (global) + component classNames. This doc mirrors them; the running UI is the canonical render.

---

## 27. Component Catalog & Ownership

Component inventory (line counts from current tree):

| Component | Path | Role |
|---|---|---|
| `App.jsx` (585) | `frontend/src/App.jsx` | Root, hash routing, shell auth gate, sidebar nav |
| `Dashboard.jsx` (705) | `frontend/src/components/` | Overview: stats, nodes visualizer, AI mentor, active path |
| `MissionIDE.jsx` (372) | `frontend/src/components/` | Editor + explorer + specs + terminal |
| `AdminCenter.jsx` (709) | `frontend/src/components/` | ACC shell, 12 modules, Security Tags/role |
| `Passport.jsx` (167) | `frontend/src/components/` | Verifiable skill passport |
| `CareerVault.jsx` (217) | `frontend/src/components/` | System design, debugging, resume tabs |
| `LogicPractice.jsx` (213) | `frontend/src/components/` | Challenge list + details + verify |
| `Onboarding.jsx` (385) | `frontend/src/components/` | Onboarding gate/shell |
| `learn/LearnHub.jsx` (416) | `frontend/src/components/learn/` | Learning tracks index |
| `learn/LessonViewer.jsx` (364) | `frontend/src/components/learn/` | Lesson renderer (markdown/highlight) |
| `learn/FlashCard.jsx` (133) | `frontend/src/components/learn/` | Flashcard practice |
| `auth/Login.jsx` (165) | `frontend/src/components/auth/` | Login |
| `auth/Register.jsx` (321) | `frontend/src/components/auth/` | Register |
| `auth/OnboardingWizard.jsx` (262) | `frontend/src/components/auth/` | Guided onboarding |
| `auth/CredentialsKeypad.jsx`* | `frontend/src/components/auth/` | Keypad entry |
| `auth/AuthSuccess.jsx` (54) | `frontend/src/components/auth/` | Post-auth state |
| `auth/ForgotPassword.jsx` (100) | `frontend/src/components/auth/` | Forgot |
| `auth/ResetPassword.jsx` (212) | `frontend/src/components/auth/` | Reset |
| `auth/VerifyEmail.jsx` (156) | `frontend/src/components/auth/` | Verify |
| `settings/AccountSettings.jsx` (425) | `frontend/src/components/settings/` | Account + category-item-btn nav |

\* exact filename inferred; see §27 note. **Ownership:** component-level design decisions belong with the component owner; global tokens belong to the design maintainer (this doc).

---

## 28. Brand Narrative & Visual Tone

**Concept:** *Atlas = the instrument panel of a software engineer's career.* Every user is a "node" on the network; the passport is a verifiable identity; missions are compiled and executed; mentors chat on the grid. The tone is **technical theater done honestly** — a cockpit aesthetic, not fantasy.

**Visual signifiers (CURRENT 🟢):**
- The network: grid + vignette + node graph; purple (identity) / blue (structure) / cyan (connection).
- The terminal: blinking cursor, log streaming, mono labels, `»` prompts.
- The passport: verified work as earned badges with proof footers (blockchain-adjacent, but currently plain CRUD history).
- The IDE: real-feeling editor chrome that hosts a prototype compiler.

**Do not** dilute with: fantasy sci-fi UI bloat, heavy animation, or cyberpunk "hacker" clichés beyond the restrained neon/mono baseline. Restraint is the brand.

---

## 29. Frontend File & Module Conventions

From `rules.md` target structure (⬜ as applied; current tree partly flattened):
- Feature-based subdirectories under `src/components/` (`auth/`, `learn/`, `settings/`). **No monolithic `pages/` folder.**
- Global styles centralized in `src/index.css`; `App.css` intentionally emptied (`/* Emptied to prevent styles interference */`).
- Class naming: descriptive, BEM-ish (`ide-`, `admin-`, `passport-`, `career-`, `practice-`, `neon-` prefixes) inline with current usage — keep prefix convention.
- Components own their layout classes; shared primitives (`.neon-btn`, `.form-group`, `.status-pill`, `.tab-btn`) are global.

---

## 30. Admin UI Deep-Dive (per-module)

Chrome contract already in §21; per-module design (🟢 functional / 🔵 shell):

1. **Dashboard (ACC)** 🔵 — `.admin-grid-3` of `.admin-stat-card` + `.admin-chart-mock` bars + status pills. Mock labels must stay obviously demo.
2. **Users** 🟢(partial) — `.admin-status-table` rows (4-col grid), role `<select>`, `Security Tags` CRUD with `.admin-alert` notifications. Functional pieces: role dropdown, security tags CRUD.
3. **Learning** 🔵 — shell; reuse `.admin-grid-2` stat rows + content lists.
4. **Mission Studio** 🔵 — reuse IDE-ish panel chrome (explorer/spec) without pretending live compile.
5. **AI** 🔵 — chat panel reusing §18 mentor/user bubbles (lime/purple).
6. **Compiler** 🔵 — `.admin-terminal-log` streaming output (keyword-match simulator). Label `SIMULATOR`.
7. **Analytics** 🔵 — `.mock-chart-bars` + stat cards; no real data.
8. **Community** 🔵 — table rows + status pills.
9. **Hiring** 🔵 — list/detail panels.
10. **Finance** 🔵 — stat cards + table.
11. **Feature Flags** 🔵(stub) — toggle list (design: mono pill toggles with neon on-state; ⬜ functional toggling).
12. **System** 🔵(stub) — `.admin-terminal-log` (logs) + SRS stub note; `.admin-alert` for non-implementation.

**Admin design rules:** one shared `--panel` chrome; consistent stat/grid/table/alert/terminal primitives; every future functional module slots into this already-defined contract without inventing new chrome.

---

## 31. QA & Visual Regression Checklist

Run before any design merge (tie to §26):
1. `npm run build` (frontend) succeeds; no CSS import breakage.
2. Token sanity: `:root` colors match §6 exactly; no hard-coded hex duplicates introduced where a token exists.
3. Neon semantics: green only on success/verified/online; red only error/destructive; lime only mentor; yellow only warning/pending.
4. Focus: tab through every interactive element; `:focus-visible` visible everywhere (§20).
5. Reduced motion: with secondary assistive "reduce motion" ON, no looping keyframes run (§12/§20).
6. Breakpoints: 1200/1024/768 snap correctly (§19); admin grids collapse; IDE stacks; no horizontal overflow (`body overflow-x hidden` is set — verify nothing reintroduces it).
7. Empty/loading/error states: every async panel has a defined non-flash state (§23).
8. Contrast: micro-tags ≥10px; AA check on `--text-dim` usages.
9. Honesty: mock/simulator surfaces carry the (pending) `BLUEPRINT`/`MOVIE`-style marker; no fabricated metrics in copy.
10. Icons: only lucide-react, only from §13 vocabulary; `Loader2` for loading.
11. No tokens/secrets rendered in UI; no token-in-URL leakage visible on passport/admin.
12. Mobile thresholds: `.passport-actions button` fill width ≤768px; table rows → stacked or scroll on small screens.

**Visual regression tooling:** 🟡 none present. **RECOMMENDED IMPROVEMENT:** add a lightweight screenshot diff (e.g., Playwright) over the 3 breakpoints + the 6 main views to catch drift; label `⬜/🔮` per roadmap.

---

## 32. Conflict Register

Recorded conflicts/notes (do not silently resolve):

- **32.1 `--border-dim` is blue-tinted** (`rgba(56,189,248,0.15)`) despite the "dim" name. Intended cool cast; keep. Not a correctness bug.
- **32.2 Duplicate `.category-item-btn` definition** in `index.css` (admin block ~line 2620 uses `--text-dim`/cyan-active; settings block ~line 2895 uses `--text-secondary`/purple-active). Two stacked definitions with **divergent active colors**. Resolve via single shared `.nav` primitive with a semantic variant (see §10.3 RECOMMENDED IMPROVEMENT).
- **32.3 `lucide-react` pinned at `^1.28.0`** — atypical vs upstream (`0.4xx`). Must reconcile before importing new icons. Recorded; not resolved here.
- **32.4 `App.css` intentionally emptied** — do not interpret as a bug; global styles live in `index.css`.
- **32.5 Status markers:** Dashboard "AI mentor" and Mission IDE compiler are prototype/simulator; ACC has 2 of 12 functional modules. Design doc reflects this honesty; copy must not overpromise.
- **32.6 Security:** access tokens may appear in `localStorage`/URL per current auth; the design contract forbids rendering them. This is a known rule-level issue (see `rules.md`, `phases.doc.md` CR/risk registers) surfaced here, not silently ignored.

---

## 33. Future Design Roadmap

Deferred design work (🔮 / ⬜), listed for direction:

- **⬜ Dark theme refinement** (optional reduced-contrast `bg` tiers) — if a11y review demands.
- **⬜ Skeleton loaders** for async panels (§23).
- **⬜ Admin responsive sidebar** (drawer at ≤768px, §19/§21).
- **⬜ Feature-Flag toggle chromium** (mono pill toggles, §30 #11).
- **🔮 Real theme token pipeline** (e.g., CSS `@theme`/Design Tokens export) while keeping the same palette.
- **🔮 Visual regression harness** (Playwright screenshot diff, §31).
- **🔮 Real-time "LIVE" signals** — only with a genuine websocket/source; keep chips honest until then.
- **🔮 Passport on-chain/"verified by proof" visual upgrade** — only when verification is real (roadmap feature), not decorative now.

---

*End of `design.md`. This spec is the design contract for Atlas; any change proposals route through §26. All values verified against `frontend/src/index.css` (2,916 lines), `frontend/index.html`, `frontend/package.json`, and the component tree at the time of writing.*
