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
| `F` / `f` | Toggle Minimalist Focus Mode |
| `1` `2` `3` | Switch mode (Focus / Short Break / Long Break) |
| `?` | Open settings & shortcuts |
| `Escape` | Exit Focus Mode / Close settings modal |

## 6. Session Tracking / Stats
- Visual session dots (progress through the cycle before a long break).
- Stats bar showing: sessions completed, total focus time, tasks completed.

## 7. Sound Notifications
- Generated via the Web Audio API (no external sound files) when a session completes.
- Toggleable in Settings.

## 8. Persistence
- All app data (tasks, settings, theme, presumably session stats) is saved automatically to `localStorage` — no explicit "save" action required from the user.

## 9. Pop-out Floating Timer (Picture-in-Picture)
- Spawns a native always-on-top window showing the countdown timer, mode label, and basic controls (Play/Pause, Skip).
- Allows layering the timer over other applications (like VS Code or other browser windows).
- Built using the Document Picture-in-Picture API, with a Canvas-to-video stream fallback for unsupported browsers (Safari/Firefox).

## 10. PWA Installation Support
- Enables installability as a standalone desktop app on Windows/macOS.
- Implements service worker caching to support offline functionality.

## 11. Minimalist Focus Mode
- Full screen layout that slides out the top header, the bottom statistics footer, collapses the task list, and expands the timer widget.
- Highly useful for removing distractions during intense work blocks.

## 12. Backup & Restore (Import/Export)
- Export button that packages tasks, configurations, and session records into a single JSON file.
- Import selector that loads local backup files to easily restore state.

## 13. Push Notifications & Action Toasts
- Employs the browser Notifications API to trigger desktop alerts when a Pomodoro focus or break block is finished.
- Introduces toast popups allowing users to undo unintended task completions or deletions.

See [PRD.md](./PRD.md) §5 for the official roadmap. See [DECISIONS.md](./DECISIONS.md) for additional proposed ideas and their rationale.
