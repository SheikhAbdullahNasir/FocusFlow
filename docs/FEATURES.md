# FocusFlow — Features

**Status:** In active development (personal-use MVP, pre-SaaS)
**Last updated:** July 31, 2026
**Related docs:** [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [DECISIONS.md](./DECISIONS.md)

> This file is expected to grow and change frequently as features are built. Update it whenever a feature ships or its behavior changes.

---

## 1. Pomodoro Timer
- Three modes: **Focus** (default 25 min), **Short Break** (default 5 min), **Long Break** (default 15 min).
- Automatic cycling between modes based on a configurable number of sessions before a long break.
- Start / Pause / Reset / Skip controls.
- Visual session-progress dots showing where the user is in the current cycle.

## 2. Task Management
- Add new tasks.
- Mark tasks complete.
- Track number of completed pomodoros per task.
- Set one task as the "active task" — the task the current Focus session is logged against.
- Filter tasks by All / Active / Completed. Note: this filter choice resets to "All" on page reload — it isn't saved.
- "Clear completed" — bulk-remove all completed tasks at once.

## 3. Settings
- Modal for customizing:
  - Focus / Short Break / Long Break durations.
  - Number of sessions before a long break.
  - Sound on/off toggle.
- Settings persist via `storage.js`.

## 4. Theming (Dark/Light Mode)
- Manual toggle.
- System-preference detection on first load.
- Dark mode is the default.
- Persists across sessions.

## 5. Keyboard Shortcuts
| Key | Action |
|---|---|
| `Space` | Start / Pause timer |
| `R` | Reset timer |
| `S` | Skip session |
| `T` | Toggle task drawer |
| `1` `2` `3` | Switch mode (Focus / Short Break / Long Break) |
| `?` | Open settings & shortcuts |
| `Escape` | Close settings modal |

## 6. Session Tracking / Stats
- Visual session dots (progress through the cycle before a long break).
- Stats bar showing: sessions completed, total focus time, tasks completed.

## 7. Sound Notifications
- Generated via the Web Audio API (no external sound files) when a session completes.
- Toggleable in Settings.

## 8. Persistence
- All app data (tasks, settings, theme, presumably session stats) is saved automatically to `localStorage` — no explicit "save" action required from the user.

---

## Planned / Proposed Features (not yet built)

See [PRD.md](./PRD.md) §5 for the official roadmap. See [DECISIONS.md](./DECISIONS.md) for additional proposed ideas (export/import, tab title updates, task notes, focus mode, etc.) and their rationale.
