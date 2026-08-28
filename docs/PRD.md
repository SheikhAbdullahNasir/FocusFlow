# FocusFlow — Product Requirements Document (PRD)

**Status:** In active development (personal-use MVP, pre-SaaS)
**Last updated:** July 31, 2026
**Related docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [FEATURES.md](./FEATURES.md) · [DECISIONS.md](./DECISIONS.md)

> For most coding tasks, load ARCHITECTURE.md + FEATURES.md. Load this file for product/scope questions, or when an AI tool needs to understand *why* something is built a certain way, not just *how*.

---

## 1. Executive Summary

FocusFlow is a Pomodoro-technique timer and task manager, currently built as a client-side web app using vanilla JavaScript (ES Modules) — no framework, no backend, no build step. It's being built first as a personal productivity tool for the founder's own daily use, with an explicit long-term intent to evolve into a SaaS product (multi-user, cloud-synced, subscription-based) once the core experience is solid.

**Current phase:** Local-first, single-user, browser-based MVP.
**Future phase:** Multi-user SaaS with accounts, cloud sync, and possibly team features.

This phased approach matters for every technical decision going forward — code should stay simple and dependency-light now, but shouldn't be architected in a way that makes a future migration to a backend/auth system painfully expensive.

---

## 2. Problem Statement & Motivation

People trying to do focused, timeboxed work (the Pomodoro technique) often end up using either:
- Bloated productivity suites with too many features and too much friction, or
- Bare-bones timers with no task context, so the timer and the to-do list live in two different apps.

FocusFlow's core hypothesis: a **fast, distraction-free, single-page tool** that combines a Pomodoro timer with lightweight task tracking (pomodoros-per-task) is more useful day-to-day than either extreme. Keyboard-first interaction and a clean visual design are core to that value prop, not afterthoughts.

---

## 3. Goals

### 3.1 Current goals (MVP / personal-use phase)
- Ship a fully working, polished Pomodoro timer + task manager that the founder uses daily.
- Zero backend dependency — everything runs in the browser, persisted via `localStorage`.
- Clean, warm, distinctive visual design (not a generic Bootstrap-looking timer).
- Full keyboard-shortcut coverage for power-user speed.
- Codebase kept modular and simple enough that an AI coding assistant (or the founder) can safely modify any single module without side effects.

### 3.2 Future goals (SaaS phase — not being built yet)
- User accounts & authentication.
- Cloud sync of tasks/settings/stats across devices.
- Possibly team/workspace features (shared task boards, shared focus stats).
- Analytics dashboard (historical focus trends, streaks, productivity insights).
- Monetization via subscription tiers.

### 3.3 Non-goals (explicitly out of scope right now)
- No backend, database, or authentication in the current phase.
- No mobile native app (responsive web only, for now).
- No collaboration/multiplayer features in the current phase.
- No build tooling / bundler / framework migration unless a concrete need arises.

---

## 4. Target User

**Primary (current):** The founder themselves — an early-career backend/full-stack developer who wants a fast, no-friction Pomodoro tool for daily focused work sessions.

**Primary (future/SaaS):** Individual knowledge workers, students, and freelancers who use the Pomodoro technique and want a tool that combines timer + task tracking without subscription bloat, eventually expanding to small teams.

---

## 5. Roadmap

- [x] Data export/import (JSON backup)
- [x] PWA support (offline, installable)
- [x] Pop-out Floating Timer (PiP)
- [x] Minimalist Focus Mode
- [ ] Ambient sounds (rain, forest, coffee shop, white noise)
- [ ] User authentication & cloud sync
- [ ] Analytics dashboard
- [ ] Team/workspace features

See [DECISIONS.md](./DECISIONS.md) for prioritization notes on this roadmap.

---

## 6. On the SaaS Transition

When the project does move to accounts + cloud sync, consider an **explicit local-only mode** as a permanent tier, not just a migration path — some users specifically want a privacy-respecting, no-account timer, and that's a real differentiator against bloated competitors.

The auth/backend stack decision should be made separately once closer to that phase; given the founder's existing Node.js/Express/NestJS/MongoDB background, a Node backend is a natural fit, but that's a distinct decision point, not baked into the current architecture.
