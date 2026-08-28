# FocusFlow — Decisions, Suggestions & Open Questions

**Status:** In active development (personal-use MVP, pre-SaaS)
**Last updated:** July 31, 2026
**Related docs:** [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [FEATURES.md](./FEATURES.md)

> Running log. Add an entry whenever a meaningful tradeoff is decided, so an AI coding tool (or future-you) doesn't re-litigate something already settled.

---

## Decisions Made

| Decision | Rationale |
|---|---|
| Vanilla JS / ES Modules, no framework | Zero build step, zero dependency overhead, fast solo iteration |
| `localStorage` only, no backend (current phase) | Matches current single-user, personal-use scope; defers backend complexity until actually needed |
| `storage.js` is the only module allowed to touch `localStorage` | Creates a clean seam for a future swap to API calls, without a full rewrite |
| Dark mode as default theme | Design preference, matches most modern Pomodoro app conventions |
| No build tooling/bundler for now | Keeps the project simple to run and modify; revisit only if a concrete need arises |
| Switch timer from tick-interval counter to timestamp elapsed comparison | Solves timer drifting when browser tabs are backgrounded or laptop is suspended |
| Implement local state backup/import settings | Insures user data against accidental browser storage wipes |
| Add browser Push Notifications and Undo action toasts | Improves notifications when tab is out of focus, and adds a completion/deletion safety net |
| Design a distraction-free Minimalist Focus Mode | Minimizes visual clutter for users who want absolute screen concentration |

---

## Suggestions & Improvement Ideas

Proposals, not commitments — for consideration as the project matures.

### Quick wins before SaaS (still local-first)
- ~~**Data export/import is more urgent than its roadmap position suggests.**~~ **Shipped.** Added JSON backup and restore configuration settings.
- ~~**Idle/backgrounded-tab accuracy — confirmed real gap, not hypothetical.**~~ **Shipped.** Switch to timestamp-based elapsed calculation.
- **Daily/weekly stats history**, not just "today." Even before a full analytics dashboard, storing a per-day summary (sessions, focus minutes) in `localStorage` gives streaks and trends for free later.
- ~~**"Undo" for task completion/deletion.**~~ **Shipped.** Toast system allows immediate reversion.
- ~~**Notification via the Notifications API**~~ **Shipped.** Browser alerts trigger on session end.

### Architecture decisions that pay off later (for the SaaS transition)
- **Design `storage.js` functions as if already async**, even though `localStorage` itself is synchronous — e.g. `saveData()`/`loadData()`/`saveSettings()`/`loadSettings()` could return Promises now. That way, swapping the internals for `fetch` calls later won't require touching every caller.
- **Give every entity a stable UUID now** (tasks, sessions) rather than array-index-based identity — avoids a painful migration when data needs to be uniquely addressable across devices/users later.
- ~~Namespace `localStorage` keys to avoid collisions~~ — **already done.** Keys are `focusflow_data`, `focusflow_settings`, `focusflow_theme`.
- **Surface storage failures instead of failing silently.** Every function in `storage.js` currently swallows errors in an empty `catch`. That's safe (won't crash the app) but means a full/blocked `localStorage` fails invisibly — worth at least logging, or exposing a "storage unavailable" flag the UI can warn about.

### Product/feature ideas worth considering
- **Task-level notes/subtasks** — even a single free-text notes field per task adds a lot of value for context-switching.
- **Recurring/daily tasks** — some Pomodoro users have standing daily tasks (e.g., "inbox zero," "deep work block") that shouldn't need to be re-added each day.
- **Focus session tagging/categories** (e.g., "deep work," "admin," "learning") to make the eventual analytics dashboard meaningfully segmented rather than just a single number.
- ~~**A minimal "focus mode" view**~~ **Shipped.** Toggles a distraction-free layout (hotkey `F`).
- ~~Browser tab title updates~~ — **already shipped.** `app.js`'s `updateTitle()` sets `document.title` to `🍅 MM:SS — FocusFlow` while the timer is running.

---

## Open Questions

- ~~Is timer accuracy under tab-throttling already handled, or a known gap?~~ **Resolved** — Switch to timestamp-based elapsed calculations.
- ~~Is there already a defined data schema in `storage.js`?~~ **Resolved** — `storage.js`, `tasks.js`, `timer.js`, and `app.js` are all confirmed now (see ARCHITECTURE.md §5). Full data model is verified end to end.
- ~~Where do session/focus-time stats actually live?~~ **Resolved** — `sessionsCompleted`/`totalFocusMinutes` live in `timer.js`'s internal state, persisted via `app.js`'s `persist()`.
- ~~Is timer accuracy under tab-throttling already handled, or a known gap?~~ **Resolved — it's a known gap.** See the `setInterval` vs. timestamp-based note in DECISIONS.md's suggestions and ARCHITECTURE.md §6.
- Any target browser support constraints (e.g., must it work on older Safari), given no framework/polyfills are currently in use? *(Still open — not answerable from source code alone; only the founder can say.)*
