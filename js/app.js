import { saveData, loadData, loadSettings } from './storage.js';
import { setSoundEnabled, playNotification } from './sounds.js';
import { init as initTheme, toggle as toggleTheme, getTheme } from './theme.js';
import { init as initTimer, start, pause, reset, skip, switchMode, getDisplayState, restoreState as restoreTimerState, loadSettingsIntoState } from './timer.js';
import { init as initTasks, restoreState as restoreTasksState, getState as getTasksState, add as addTask, toggle as toggleTask, remove as removeTask, setActive as setActiveTask, clearCompleted, incrementPomodoro, getFiltered, setFilter, getStats, getActiveTask } from './tasks.js';
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

// ─── Event Handlers ────────────────────────────
function onSessionComplete(d) {
    dom.timerRing.classList.add('celebrate');
    setTimeout(() => dom.timerRing.classList.remove('celebrate'), 700);

    if (d.mode === 'focus') {
        incrementPomodoro();
    }

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
            case 'toggle':
                toggleTask(id);
                renderTasks();
                persist();
                break;
            case 'delete':
                removeTask(id);
                renderTasks();
                persist();
                break;
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
        clearCompleted();
        renderTasks();
        persist();
    });

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

// ─── Boot ───────────────────────────────────────
const RING_CIRCUMFERENCE = 2 * Math.PI * 120;

init();
