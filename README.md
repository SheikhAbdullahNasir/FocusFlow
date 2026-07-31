# FocusFlow — Pomodoro Timer & Task Manager

A sleek, minimal Pomodoro timer to boost your productivity. Built with vanilla JavaScript (ES Modules) and a warm orange design system with dark/light mode.

## Features

- **Pomodoro Timer** — Focus (25m), Short Break (5m), Long Break (15m) with automatic cycling
- **Task Management** — Add tasks, mark complete, track pomodoros per task, set active task
- **Settings Modal** — Customize timer durations, sessions before long break, sound toggle
- **Dark/Light Mode** — Manual toggle with system preference detection
- **Keyboard Shortcuts** — Space (Start/Pause), R (Reset), S (Skip), T (Tasks), 1-2-3 (Mode), ? (Shortcuts)
- **Session Tracking** — Visual session dots, stats bar (sessions, focus time, tasks done)
- **Persistent Storage** — All data saved to localStorage automatically

## Design System

- **Accent:** Warm orange (`#ff6b35`) inspired by modern Pomodoro apps
- **Theme:** Dark mode default, smooth transition to light mode
- **Layout:** Desktop-first, fully responsive for tablet and mobile
- **Typography:** Inter (UI) + JetBrains Mono (timer)

## Project Structure

```
├── index.html          Main HTML (layout, modals)
├── css/
│   └── style.css       All styles (design system, components, responsive)
├── js/
│   ├── app.js          Main orchestrator (imports modules, binds events, renders UI)
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
python -m http.server 8000

# Using Node.js
npx serve .

# Using VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

Then open `http://localhost:8000` in your browser.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Pause timer |
| `R` | Reset timer |
| `S` | Skip session |
| `T` | Toggle task drawer |
| `1` `2` `3` | Switch mode (Focus / Short Break / Long Break) |
| `?` | Open settings & shortcuts |
| `Escape` | Close settings modal |

## Roadmap

- [ ] Ambient sounds (rain, forest, coffee shop, white noise)
- [ ] Data export/import (JSON backup)
- [ ] PWA support (offline, installable)
- [ ] User authentication & cloud sync
- [ ] Analytics dashboard
- [ ] Team/workspace features
