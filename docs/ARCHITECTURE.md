# FocusFlow — Architecture

**Status:** In active development (personal-use MVP, pre-SaaS)
**Last updated:** July 31, 2026
**Related docs:** [PRD.md](./PRD.md) · [FEATURES.md](./FEATURES.md) · [DECISIONS.md](./DECISIONS.md)

> Load this file for most coding tasks, along with FEATURES.md. It defines the tech stack and the module boundaries that AI-assisted changes should respect.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | Vanilla JavaScript (ES Modules) | No framework (no React/Vue) by design — keeps it lightweight and dependency-free |
| Markup | Plain HTML | Single `index.html`, with modal markup for Settings |
| Styling | Plain CSS | Custom design system, dark/light themes, no CSS framework |
| Audio | Web Audio API | Used for notification sounds, no external audio files/libraries |
| Persistence | `localStorage` + Service Worker Cache | PWA manifest and caching enables offline functionality |
| Overlays | Document Picture-in-Picture / Canvas Video | Native always-on-top window overlay for the timer, fallback for Safari/Firefox |
| Fonts | Inter (UI), JetBrains Mono (timer digits) | |
| Dev server | Any static server (Python `http.server`, `npx serve`, VS Code Live Server) | Required only because ES Modules need to be served over HTTP, not `file://` |

**Why this stack:** Zero build step, zero dependency management overhead, fast to iterate on solo, and trivially portable later — a vanilla JS/localStorage app can be progressively migrated to a backend (e.g., swapping the `storage.js` module for API calls) without a full rewrite.

---

## 2. Project Structure

```
├── index.html          Main HTML (layout, modals)
├── manifest.json       PWA configurations (app branding, icons)
├── sw.js               PWA Service worker for asset caching & offline capability
├── icons/
│   └── icon.svg        FocusFlow app launcher icon (vector SVG format)
├── css/
│   └── style.css       All styles (design system, components, responsive, PiP styles)
├── js/
│   ├── app.js          Main orchestrator (imports modules, binds events, handles pop-out window, registers sw)
│   ├── timer.js        Pomodoro timer logic (start, pause, reset, complete)
│   ├── tasks.js        Task CRUD, filtering, active task management
│   ├── settings.js     Settings modal (open, close, save, form binding)
│   ├── theme.js        Dark/light mode (toggle, system detection, persistence)
│   ├── sounds.js       Web Audio API notification sounds
│   └── storage.js      localStorage wrapper (data, settings, theme)
└── README.md
```

## 3. Module Responsibility Boundaries

Important for AI-assisted dev — keep these strict so changes stay isolated:

- **`app.js`** — orchestration only. Wires modules together, handles top-level DOM events, triggers renders. Should not contain timer/task business logic itself.
- **`timer.js`** — owns all timer state and transitions (start/pause/reset/complete/mode-switch/auto-cycling). No direct DOM manipulation beyond what's needed to expose state.
- **`tasks.js`** — owns task CRUD, the active-task concept, and per-task pomodoro counts.
- **`settings.js`** — owns the settings modal lifecycle and validation of settings form input.
- **`theme.js`** — owns dark/light mode state, system-preference detection, and persistence of the choice.
- **`sounds.js`** — owns Web Audio API sound generation/playback for notifications.
- **`storage.js`** — the *only* module that talks to `localStorage`. All other modules should read/write app state through this module, not `localStorage` directly. This boundary is what will make a future backend migration tractable.

---

## 4. Design System

- **Accent color:** Warm orange, `#ff6b35`.
- **Visual direction:** Inspired by modern Pomodoro apps; warm, minimal, not generic/templated.
- **Default theme:** Dark mode, with a smooth transition when switching to light mode.
- **Layout:** Desktop-first, fully responsive down to tablet and mobile breakpoints.
- **Typography:** Inter for general UI text; JetBrains Mono for the timer digits (monospace ensures no layout shift as digits change).

---

## 5. Data Model

✅ **Confirmed against the real `storage.js` implementation (as of the version reviewed).**

`storage.js` does **not** store one nested object — it uses **three separate `localStorage` keys**, each with its own get/save functions:

| localStorage key | Functions | Shape |
|---|---|---|
| `focusflow_data` | `saveData(data)` / `loadData()` | **Flat, combined object** — built by `app.js`'s `persist()`, mixing timer stats and task state in one shape (confirmed below). |
| `focusflow_settings` | `saveSettings(settings)` / `loadSettings()` | Confirmed shape below. `loadSettings()` merges saved values over `DEFAULT_SETTINGS`, so missing fields always fall back to defaults. |
| `focusflow_theme` | `saveTheme(theme)` / `loadTheme()` | A **raw string** (`"dark"` or `"light"`), not JSON-wrapped. `loadTheme()` returns `null` if unset. |

Confirmed settings shape (from `DEFAULT_SETTINGS` in `storage.js`):

```js
{
  focusDuration: 25,       // minutes
  shortDuration: 5,        // minutes  — NOT shortBreakDuration
  longDuration: 15,        // minutes  — NOT longBreakDuration
  sessionsBeforeLong: 4,   // NOT sessionsBeforeLongBreak
  soundEnabled: true
}
```

Confirmed shape stored under `focusflow_data` (from `app.js`'s `persist()` function — note `tasks.js`'s own `getExportData()` returns just `{ tasks, activeTaskId }`, but `app.js` is what actually gets saved, and it adds the timer stats alongside):

```js
{
  sessionsCompleted: number,     // from timer.js state — total focus sessions ever completed
  totalFocusMinutes: number,     // from timer.js state — cumulative focus minutes
  tasks: [
    {
      id: string,        // Date.now().toString(36) + random suffix — NOT a UUID
      text: string,       // NOT "title"
      completed: boolean,
      pomodoros: number,  // NOT "pomodorosCompleted"
      createdAt: number   // Date.now() timestamp (ms) — NOT an ISO string
    }
  ],
  activeTaskId: string | null   // points at a task.id — tasks no longer carry their own isActive flag
}
```

Notes on `tasks.js` behavior worth knowing for future changes:
- `filter` (`'all' | 'active' | 'completed'`) is tracked in module state but is **not persisted** — it's excluded from `getExportData()`/the saved object, so it resets to `"all"` on every page reload.
- Task IDs are generated with `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)` — not a proper UUID, but collision-unlikely for single-user local use. Worth revisiting if IDs ever need to be globally unique (see SaaS-transition suggestions in DECISIONS.md).
- There is **no separate stats object** — `sessionsCompleted`/`totalFocusMinutes` are just two plain numbers tracked inside `timer.js`'s internal `state`, incremented in `complete()` whenever a focus session finishes, and read via `getDisplayState()`. `tasks.js`'s `getStats()` is unrelated — it only computes live task counts (total/completed/active), not time-based stats.

Notes on `timer.js` behavior worth knowing:
- The countdown is a **plain `setInterval` tick-counter** (`state.timeLeft--` every 1000ms) — not timestamp-based elapsed time. This means the displayed time can drift if the tab is backgrounded/throttled by the browser. See the related suggestion in DECISIONS.md.
- Timer settings (`focusDuration`, etc.) are read fresh from `storage.js`'s `loadSettings()` on init and whenever `loadSettingsIntoState()` is called (i.e. after the Settings modal saves) — `timer.js` doesn't hold its own separate copy that can silently drift out of sync with saved settings.
- Session-dot progress (`renderSessionDots` in `app.js`) is derived live from `sessionsCompleted % sessionsBeforeLong` — it isn't a stored value itself.

Also worth noting: every `storage.js` function is wrapped in try/catch and **fails silently** (e.g. if `localStorage` is full or unavailable, `saveData`/`saveSettings`/`saveTheme` just do nothing — no error is surfaced to the rest of the app). Worth keeping in mind if data ever appears to silently not persist.

---

## 6. Non-Functional Requirements

- **No build step:** the app must remain runnable by simply serving static files — no bundler required for the current phase.
- **No external runtime dependencies:** timer, sounds, and storage are all built on native browser APIs.
- **Offline-capable by nature** (already true today since it's fully client-side; formal PWA/offline support is on the roadmap).
- **Performance:** ⚠️ **confirmed gap** — `timer.js` currently counts down via a plain `setInterval` tick (`state.timeLeft--` every 1000ms), not timestamp-based elapsed time. The displayed time will drift if the tab is backgrounded/throttled. See DECISIONS.md for the suggested fix.
- **Data durability:** since everything lives in `localStorage`, there's currently no protection against data loss from clearing browser data — this is a known limitation of the current phase, not a bug.
