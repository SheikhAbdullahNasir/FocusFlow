import { saveData, loadData, loadSettings, saveSettings, saveTheme } from './storage.js';
import { setSoundEnabled, playNotification } from './sounds.js';
import { init as initTheme, toggle as toggleTheme, getTheme } from './theme.js';
import { init as initTimer, start, pause, reset, skip, switchMode, getDisplayState, restoreState as restoreTimerState, loadSettingsIntoState } from './timer.js';
import { init as initTasks, restoreState as restoreTasksState, getState as getTasksState, add as addTask, toggle as toggleTask, remove as removeTask, setActive as setActiveTask, clearCompleted, incrementPomodoro, getFiltered, setFilter, getStats, getActiveTask, undo as undoTask } from './tasks.js';
import { init as initSettings, open as openSettings } from './settings.js';

// DOM refs
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    timerDisplay: $('#timerDisplay'),
    timerLabel: $('#timerLabel'),
    ringProgress: $('#ringProgress'),
    timerSection: $('#timerSection'),
    timerRing: $('#timerRing'),
    btnStartPause: $('#btnStartPause'),
    btnReset: $('#btnReset'),
    btnSkip: $('#btnSkip'),
    iconPlay: $('.icon-play'),
    iconPause: $('.icon-pause'),
    modeTabs: $('#modeTabs'),
    sessionDots: $('#sessionDots'),

    statSessions: $('#statSessions'),
    statMinutes: $('#statMinutes'),
    statCompleted: $('#statCompleted'),

    activeTaskDisplay: $('#activeTaskDisplay'),
    taskInput: $('#taskInput'),
    btnAddTask: $('#btnAddTask'),
    taskList: $('#taskList'),
    emptyState: $('#emptyState'),
    tasksFilter: $('#tasksFilter'),
    taskCount: $('#taskCount'),
    btnClearCompleted: $('#btnClearCompleted'),
    taskDrawer: $('#taskDrawer'),
    btnToggleDrawer: $('#btnToggleDrawer'),
    btnCloseDrawer: $('#btnCloseDrawer'),
    taskBadge: $('#taskBadge'),
    taskDrawerCount: $('#taskDrawerCount'),
    btnExportData: $('#btnExportData'),
    btnImportData: $('#btnImportData'),
    importFile: $('#importFile'),
    btnPopOut: $('#btnPopOut'),
    btnToggleFocus: $('#btnToggleFocus'),
    btnExitFocusMode: $('#btnExitFocusMode'),
};

// ─── Init ──────────────────────────────────────
function init() {
    initTheme();
    initSettings({ onSave: onSettingsSave });
    initTimer({
        onTick: renderTimer,
        onComplete: onSessionComplete,
        onModeChange: onModeChanged,
    });
    initTasks({ onChange: renderTasks });

    // Collapse drawer on smaller screens by default
    if (window.innerWidth <= 1024) {
        dom.taskDrawer.classList.add('collapsed');
    }

    const saved = loadData();
    if (saved) {
        restoreTimerState(saved);
        restoreTasksState(saved);
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err));
    }

    renderAll();
    bindEvents();
}

// ─── Save ──────────────────────────────────────
function persist() {
    const tasks = getTasksState();
    const timer = getDisplayState();
    const data = {
        sessionsCompleted: timer.sessionsCompleted,
        totalFocusMinutes: timer.totalFocusMinutes,
        tasks: tasks.tasks,
        activeTaskId: tasks.activeTaskId,
    };
    saveData(data);
}

// ─── Render ────────────────────────────────────
function renderAll() {
    const d = getDisplayState();
    renderTimer(d);
    renderModeTabs(d.mode);
    renderSessionDots(d);
    renderStats(d);
    renderTasks();
}

function renderTimer(d) {
    if (!d) d = getDisplayState();
    const mins = Math.floor(d.timeLeft / 60);
    const secs = d.timeLeft % 60;
    dom.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const progress = d.ringProgress;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    dom.ringProgress.style.strokeDasharray = RING_CIRCUMFERENCE;
    dom.ringProgress.style.strokeDashoffset = offset;

    const labels = { focus: 'FOCUS TIME', short: 'SHORT BREAK', long: 'LONG BREAK' };
    dom.timerLabel.textContent = labels[d.mode] || 'FOCUS TIME';

    dom.timerSection.classList.toggle('running', d.isRunning);

    dom.iconPlay.classList.toggle('hidden', d.isRunning);
    dom.iconPause.classList.toggle('hidden', !d.isRunning);

    updateTitle(d);

    // Update active PiP windows
    if (pipWindow) {
        renderPip(d);
    }
    if (pipVideoElement) {
        renderCanvasPip(d);
    }
}

function updateTitle(d) {
    const mins = Math.floor(d.timeLeft / 60);
    const secs = d.timeLeft % 60;
    const time = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.title = d.isRunning
        ? `🍅 ${time} — FocusFlow`
        : 'FocusFlow — Pomodoro Timer';
}

function renderModeTabs(mode) {
    $$('.mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
}

function renderSessionDots(d) {
    const container = dom.sessionDots;
    container.innerHTML = '';
    const settings = loadSettings();
    const total = settings.sessionsBeforeLong;
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 'session-dot';
        const pos = d.sessionsCompleted % total;
        if (i < pos) {
            dot.classList.add('completed');
        } else if (i === pos && d.mode === 'focus') {
            dot.classList.add('active');
        }
        container.appendChild(dot);
    }
}

function renderStats(d) {
    const tasks = getTasksState();
    const completed = tasks.tasks.filter(t => t.completed).length;

    dom.statSessions.textContent = d.sessionsCompleted;
    dom.statMinutes.textContent = d.totalFocusMinutes >= 60
        ? `${Math.floor(d.totalFocusMinutes / 60)}h ${d.totalFocusMinutes % 60}m`
        : `${d.totalFocusMinutes}m`;
    dom.statCompleted.textContent = completed;
}

function renderTasks() {
    const filtered = getFiltered();
    const stats = getStats();
    const activeTask = getActiveTask();
    const tasksState = getTasksState();

    // Active task display
    if (activeTask) {
        dom.activeTaskDisplay.textContent = activeTask.text;
        dom.activeTaskDisplay.className = 'task-name';
    } else {
        dom.activeTaskDisplay.textContent = 'No task selected';
        dom.activeTaskDisplay.className = 'task-name empty';
    }

    // Badge
    dom.taskBadge.textContent = stats.active;
    dom.taskBadge.classList.toggle('visible', stats.active > 0);
    dom.taskDrawerCount.textContent = stats.active > 0 ? `(${stats.active})` : '';

    // List
    dom.taskList.innerHTML = '';

    if (filtered.length === 0) {
        dom.emptyState.classList.add('visible');
        dom.taskList.classList.add('hidden');
    } else {
        dom.emptyState.classList.remove('visible');
        dom.taskList.classList.remove('hidden');

        filtered.forEach(task => {
            const div = document.createElement('div');
            div.className = `task-item${task.completed ? ' completed' : ''}${task.id === tasksState.activeTaskId ? ' active-task' : ''}`;
            div.dataset.taskId = task.id;

            const checkboxHtml = `<button class="task-checkbox" data-action="toggle" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
            </button>`;

            const pomoHtml = task.pomodoros > 0
                ? `<span class="task-pomodoros">${task.pomodoros}</span>`
                : '';

            const deleteHtml = `<button class="task-delete" data-action="delete" title="Delete task">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>`;

            div.innerHTML = checkboxHtml +
                `<span class="task-text" data-action="activate" title="Set as active task">${escapeHtml(task.text)}</span>` +
                pomoHtml + deleteHtml;

            dom.taskList.appendChild(div);
        });
    }

    // Footer
    dom.taskCount.textContent = `${stats.active} task${stats.active !== 1 ? 's' : ''} remaining`;
    dom.btnClearCompleted.style.display = stats.completed > 0 ? '' : 'none';
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ─── Toast System ──────────────────────────────
function showToast(message, actionLabel, actionCallback) {
    const container = $('#toastContainer');
    if (!container) return;

    container.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'toast';

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    if (actionLabel && actionCallback) {
        const btn = document.createElement('button');
        btn.className = 'toast-action';
        btn.textContent = actionLabel;
        btn.addEventListener('click', () => {
            actionCallback();
            toast.remove();
        });
        toast.appendChild(btn);
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 250);
    }, 5000);
}

// ─── Desktop Notifications ─────────────────────
function showDesktopNotification(d) {
    const settings = loadSettings();
    if (!settings.notificationsEnabled) return;
    if (Notification.permission !== 'granted') return;

    let title = '';
    let body = '';

    if (d.mode === 'focus') {
        title = 'Focus Session Completed!';
        const isLong = d.sessionsCompleted % settings.sessionsBeforeLong === 0;
        body = isLong
            ? `Great job! Take a longer ${settings.longDuration}-minute break.`
            : `Good work! Take a ${settings.shortDuration}-minute break.`;
    } else {
        title = 'Break Completed!';
        body = `Time to start your focus block of ${settings.focusDuration} minutes.`;
    }

    try {
        const n = new Notification(title, { body });
        n.onclick = () => {
            window.focus();
            n.close();
        };
    } catch (err) {
        console.error('Failed to show notification', err);
    }
}

// ─── Import & Export ───────────────────────────
function exportData() {
    const tasksState = getTasksState();
    const timerDisplay = getDisplayState();
    const settings = loadSettings();
    const theme = getTheme();

    const backup = {
        version: 1,
        timestamp: Date.now(),
        data: {
            sessionsCompleted: timerDisplay.sessionsCompleted,
            totalFocusMinutes: timerDisplay.totalFocusMinutes,
            tasks: tasksState.tasks,
            activeTaskId: tasksState.activeTaskId
        },
        settings: settings,
        theme: theme
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            if (!backup || !backup.data || !backup.settings) {
                throw new Error('Invalid backup file format.');
            }

            saveData(backup.data);
            saveSettings(backup.settings);
            if (backup.theme) {
                saveTheme(backup.theme);
            }

            alert('Backup imported successfully! FocusFlow will reload to apply changes.');
            window.location.reload();
        } catch (err) {
            alert('Failed to import backup: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ─── Picture-in-Picture System ──────────────────
let pipWindow = null;
let pipVideoElement = null;
let pipCanvas = null;
let pipCanvasCtx = null;

async function togglePopOut() {
    if (pipWindow) {
        pipWindow.close();
        pipWindow = null;
        return;
    }
    if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
    }

    if ('documentPictureInPicture' in window) {
        try {
            pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 280,
                height: 180,
            });

            const pipBody = pipWindow.document.body;
            pipBody.className = 'pip-body';
            pipBody.setAttribute('data-theme', getTheme());

            // Copy all styles from the main window to the PiP window to work offline without the Python server running
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                    const style = pipWindow.document.createElement('style');
                    style.textContent = cssRules;
                    pipWindow.document.head.appendChild(style);
                } catch (e) {
                    const link = pipWindow.document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    pipWindow.document.head.appendChild(link);
                }
            });

            pipBody.innerHTML = `
                <div class="pip-container">
                    <div class="pip-header">
                        <span class="pip-label" id="pipLabel">FOCUS TIME</span>
                    </div>
                    <div class="pip-time" id="pipTime">25:00</div>
                    <div class="pip-controls">
                        <button class="pip-btn" id="pipToggle" title="Start/Pause">
                            <svg class="pip-icon-play" viewBox="0 0 24 24" fill="currentColor" style="display: block;">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            <svg class="pip-icon-pause" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                                <rect x="6" y="4" width="4" height="16"/>
                                <rect x="14" y="4" width="4" height="16"/>
                            </svg>
                        </button>
                        <button class="pip-btn" id="pipSkip" title="Skip">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="5 4 15 12 5 20 5 4"/>
                                <line x1="19" y1="5" x2="19" y2="19"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            const pipToggle = pipWindow.document.getElementById('pipToggle');
            const pipSkip = pipWindow.document.getElementById('pipSkip');

            pipToggle.addEventListener('click', () => {
                const d = getDisplayState();
                d.isRunning ? pause() : start();
            });

            pipSkip.addEventListener('click', skip);

            pipWindow.addEventListener('unload', () => {
                pipWindow = null;
            });

            renderPip();
            return;
        } catch (err) {
            console.error('Failed to open Document PiP, falling back to Canvas PiP', err);
        }
    }

    setupCanvasPip();
}

function renderPip(d) {
    if (!pipWindow) return;
    if (!d) d = getDisplayState();
    const mins = Math.floor(d.timeLeft / 60);
    const secs = d.timeLeft % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const pipTime = pipWindow.document.getElementById('pipTime');
    const pipLabel = pipWindow.document.getElementById('pipLabel');
    const pipToggle = pipWindow.document.getElementById('pipToggle');

    if (pipTime) pipTime.textContent = timeStr;
    if (pipLabel) {
        const labels = { focus: 'FOCUS TIME', short: 'SHORT BREAK', long: 'LONG BREAK' };
        pipLabel.textContent = labels[d.mode] || 'FOCUS TIME';
    }

    if (pipToggle) {
        const playIcon = pipToggle.querySelector('.pip-icon-play');
        const pauseIcon = pipToggle.querySelector('.pip-icon-pause');
        if (playIcon && pauseIcon) {
            playIcon.style.display = d.isRunning ? 'none' : 'block';
            pauseIcon.style.display = d.isRunning ? 'block' : 'none';
        }
    }
}

async function setupCanvasPip() {
    if (!pipCanvas) {
        pipCanvas = document.createElement('canvas');
        pipCanvas.width = 240;
        pipCanvas.height = 120;
        pipCanvasCtx = pipCanvas.getContext('2d');
    }

    const video = document.createElement('video');
    video.muted = true;
    video.srcObject = pipCanvas.captureStream(10);
    video.style.display = 'none';
    document.body.appendChild(video);

    video.addEventListener('loadedmetadata', async () => {
        try {
            await video.play();
            await video.requestPictureInPicture();
            
            video.addEventListener('leavepictureinpicture', () => {
                video.remove();
                pipVideoElement = null;
            });
            pipVideoElement = video;
            renderCanvasPip();
        } catch (err) {
            console.error('Failed to start Canvas PiP', err);
            video.remove();
            alert('Picture-in-Picture is not supported or was blocked by the browser.');
        }
    });
}

function renderCanvasPip(d) {
    if (!pipCanvasCtx) return;
    if (!d) d = getDisplayState();
    const mins = Math.floor(d.timeLeft / 60);
    const secs = d.timeLeft % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const ctx = pipCanvasCtx;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, pipCanvas.width, pipCanvas.height);

    ctx.fillStyle = '#ff6b35';
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    const labels = { focus: 'FOCUS TIME', short: 'SHORT BREAK', long: 'LONG BREAK' };
    ctx.fillText(labels[d.mode] || 'FOCUS TIME', pipCanvas.width / 2, 32);

    ctx.fillStyle = '#f5f5f7';
    ctx.font = 'bold 42px "JetBrains Mono", monospace';
    ctx.fillText(timeStr, pipCanvas.width / 2, 80);

    ctx.fillStyle = 'rgba(245, 245, 247, 0.4)';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText(d.isRunning ? 'RUNNING' : 'PAUSED', pipCanvas.width / 2, 105);
}

// ─── Event Handlers ────────────────────────────
function onSessionComplete(d) {
    dom.timerRing.classList.add('celebrate');
    setTimeout(() => dom.timerRing.classList.remove('celebrate'), 700);

    if (d.mode === 'focus') {
        incrementPomodoro();
    }

    showDesktopNotification(d);

    renderAll();
    persist();
}

function onModeChanged(mode) {
    renderAll();
}

function onSettingsSave(settings) {
    loadSettingsIntoState();
    const d = getDisplayState();
    renderTimer(d);
    renderSessionDots(d);
}

// ─── Events ─────────────────────────────────────
function bindEvents() {
    // Timer controls
    dom.btnStartPause.addEventListener('click', () => {
        const d = getDisplayState();
        d.isRunning ? pause() : start();
    });

    dom.btnReset.addEventListener('click', reset);
    dom.btnSkip.addEventListener('click', skip);

    // Mode tabs
    dom.modeTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.mode-tab');
        if (!tab || tab.classList.contains('active')) return;
        pause();
        switchMode(tab.dataset.mode);
    });

    // Task drawer
    dom.btnToggleDrawer.addEventListener('click', toggleDrawer);
    dom.btnCloseDrawer.addEventListener('click', closeDrawer);

    // Add task
    function onAddTask(e) {
        if (e) e.preventDefault();
        const text = dom.taskInput.value.trim();
        if (!text) return;
        addTask(text);
        dom.taskInput.value = '';
        dom.taskInput.focus();
        renderTasks();
        persist();
    }

    dom.taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onAddTask(e);
    });
    dom.btnAddTask.addEventListener('click', onAddTask);

    // Task list (delegated)
    dom.taskList.addEventListener('click', (e) => {
        const item = e.target.closest('.task-item');
        if (!item) return;
        const id = item.dataset.taskId;
        const action = e.target.closest('[data-action]');
        if (!action) return;

        switch (action.dataset.action) {
            case 'toggle': {
                const task = getTasksState().tasks.find(t => t.id === id);
                const wasCompleted = task ? task.completed : false;
                toggleTask(id);
                renderTasks();
                persist();

                const msg = wasCompleted ? 'Task marked active' : 'Task completed';
                showToast(msg, 'Undo', () => {
                    if (undoTask()) {
                        renderTasks();
                        persist();
                    }
                });
                break;
            }
            case 'delete': {
                const task = getTasksState().tasks.find(t => t.id === id);
                const taskText = task ? task.text : 'Task';
                removeTask(id);
                renderTasks();
                persist();

                showToast(`Deleted "${taskText}"`, 'Undo', () => {
                    if (undoTask()) {
                        renderTasks();
                        persist();
                    }
                });
                break;
            }
            case 'activate':
                setActiveTask(id);
                renderTasks();
                persist();
                break;
        }
    });

    // Filter
    dom.tasksFilter.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        setFilter(btn.dataset.filter);
        $$('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderTasks();
    });

    // Clear completed
    dom.btnClearCompleted.addEventListener('click', () => {
        const completedCount = getTasksState().tasks.filter(t => t.completed).length;
        if (completedCount > 0) {
            clearCompleted();
            renderTasks();
            persist();

            showToast(`Cleared ${completedCount} completed tasks`, 'Undo', () => {
                if (undoTask()) {
                    renderTasks();
                    persist();
                }
            });
        }
    });

    // Backup & Restore
    if (dom.btnExportData) {
        dom.btnExportData.addEventListener('click', exportData);
    }
    if (dom.btnImportData && dom.importFile) {
        dom.btnImportData.addEventListener('click', () => {
            dom.importFile.click();
        });
        dom.importFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importData(e.target.files[0]);
                dom.importFile.value = '';
            }
        });
    }

    // Pop Out Timer (PiP)
    if (dom.btnPopOut) {
        dom.btnPopOut.addEventListener('click', togglePopOut);
    }

    // Focus Mode toggles
    if (dom.btnToggleFocus) {
        dom.btnToggleFocus.addEventListener('click', toggleFocusMode);
    }
    if (dom.btnExitFocusMode) {
        dom.btnExitFocusMode.addEventListener('click', toggleFocusMode);
    }

    // Theme toggle
    document.getElementById('btnToggleTheme').addEventListener('click', toggleTheme);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                {
                    const d = getDisplayState();
                    d.isRunning ? pause() : start();
                }
                break;
            case 'r':
            case 'R':
                reset();
                break;
            case 's':
            case 'S':
                if (!e.ctrlKey && !e.metaKey) skip();
                break;
            case 't':
            case 'T':
                toggleDrawer();
                break;
            case '1':
                pause();
                switchMode('focus');
                break;
            case '2':
                pause();
                switchMode('short');
                break;
            case '3':
                pause();
                switchMode('long');
                break;
            case 'f':
            case 'F':
                toggleFocusMode();
                break;
            case 'Escape':
                if (isFocusMode) {
                    toggleFocusMode();
                }
                break;
            case '?':
                openSettings();
                break;
        }
    });
}

function toggleDrawer() {
    dom.taskDrawer.classList.toggle('collapsed');
}

function closeDrawer() {
    dom.taskDrawer.classList.add('collapsed');
}

let isFocusMode = false;

function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    document.body.classList.toggle('focus-mode-active', isFocusMode);
    if (dom.btnExitFocusMode) {
        dom.btnExitFocusMode.classList.toggle('hidden', !isFocusMode);
    }
    if (isFocusMode) {
        closeDrawer();
    }
}

// ─── Boot ───────────────────────────────────────
const RING_CIRCUMFERENCE = 2 * Math.PI * 120;

init();
