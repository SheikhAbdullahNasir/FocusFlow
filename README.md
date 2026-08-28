# FocusFlow — Pomodoro Timer & Task Manager

A sleek, minimal Pomodoro timer to boost your productivity. Built with vanilla JavaScript (ES Modules) and a warm orange design system with dark/light mode.

## Documentation

Full product and technical documentation lives in [`docs/`](./docs/):

- [`docs/PRD.md`](./docs/PRD.md) — vision, goals, target users, scope, roadmap
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — tech stack, module boundaries, data model
- [`docs/FEATURES.md`](./docs/FEATURES.md) — detailed feature specifications
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — key decisions, rationale, and open questions

Start there for full context before making significant changes.

## Features

- **Pomodoro Timer** — Focus (25m), Short Break (5m), Long Break (15m) with automatic cycling and background tab timestamp accuracy.
- **Task Management** — Add tasks, mark complete, track pomodoros per task, set active task.
- **Pop-out Floating Timer (Picture-in-Picture)** — Always-on-top window overlay showing timer state and basic controls, fully functional offline.
- **Minimalist Focus Mode** — Distraction-free full-screen layout hiding header/footer controls and centering active task (hotkey `F`).
- **PWA Installation Support** — Standalone desktop install capability with background Service Worker asset caching for 100% offline usage.
- **Settings Modal** — Customize timer durations, sessions before long break, and sound notifications.
- **Backup & Restore** — Export and import entire application state (tasks, settings, stats) via JSON backups.
- **Desktop Push Notifications & Toasts** — Background alerts on session finish and undo alerts for task completions/deletions.
- **Dark/Light Mode** — Manual toggle with system preference detection.
- **Keyboard Shortcuts** — Full hotkey controls for mouse-free productivity.
- **Persistent Storage** — All data saved to localStorage automatically.

## Design System

- **Accent:** Warm orange (`#ff6b35`) inspired by modern Pomodoro apps
- **Theme:** Dark mode default, smooth transition to light mode
- **Layout:** Desktop-first, fully responsive for tablet and mobile
- **Typography:** Inter (UI) + JetBrains Mono (timer)

## Project Structure

```
├── index.html          Main HTML (layout, modals)
├── manifest.json       PWA configurations (app branding, icons)
├── sw.js               PWA Service worker for asset caching & offline capability
├── icons/
│   └── icon.svg        FocusFlow app launcher icon (vector SVG format)
├── css/
│   └── style.css       All styles (design system, components, responsive, PiP, Focus mode)
├── js/
│   ├── app.js          Main orchestrator (imports modules, binds events, handles pop-out and focus modes, registers sw)
│   ├── timer.js        Pomodoro timer logic (start, pause, reset, complete)
│   ├── tasks.js        Task CRUD, filtering, active task management
│   ├── settings.js     Settings modal (open, close, save, form binding)
│   ├── theme.js        Dark/light mode (toggle, system detection, persistence)
│   ├── sounds.js       Web Audio API notification sounds
│   └── storage.js      localStorage wrapper (data, settings, theme)
└── README.md
```

## Getting Started

Since FocusFlow uses ES Modules (`type="module"`), you need a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .

# Using VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in your browser.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Pause timer |
| `R` | Reset timer |
| `S` | Skip session |
| `T` | Toggle task drawer |
| `F` / `f` | Toggle Minimalist Focus Mode |
| `1` `2` `3` | Switch mode (Focus / Short Break / Long Break) |
| `?` | Open settings & shortcuts |
| `Escape` | Exit Focus Mode / Close settings modal |

## Roadmap

- [x] Data export/import (JSON backup)
- [x] PWA support (offline, installable)
- [x] Pop-out Floating Timer (PiP)
- [x] Minimalist Focus Mode
- [ ] Ambient sounds (rain, forest, coffee shop, white noise)
- [ ] User authentication & cloud sync
- [ ] Analytics dashboard
- [ ] Team/workspace features
