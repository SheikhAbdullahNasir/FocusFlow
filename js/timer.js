import { loadSettings } from './storage.js';
import { playNotification } from './sounds.js';

const RING_RADIUS = 120;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

let state = {
    mode: 'focus',
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    intervalId: null,
    sessionsCompleted: 0,
    totalFocusMinutes: 0,
    settings: loadSettings(),
    startedAt: null,
    timeLeftAtStart: null,
};

let callbacks = {
    onTick: null,
    onComplete: null,
    onModeChange: null,
};

export function init(opts = {}) {
    if (opts.onTick) callbacks.onTick = opts.onTick;
    if (opts.onComplete) callbacks.onComplete = opts.onComplete;
    if (opts.onModeChange) callbacks.onModeChange = opts.onModeChange;

    loadSettingsIntoState();
    reset();
}

export function loadSettingsIntoState() {
    state.settings = loadSettings();
    if (state.totalTime === calcDuration(state.mode, { ...state.settings })) return;
    state.totalTime = calcDuration(state.mode, state.settings);
    state.timeLeft = state.totalTime;
    reset();
}

function calcDuration(mode, settings) {
    switch (mode) {
        case 'focus': return settings.focusDuration * 60;
        case 'short': return settings.shortDuration * 60;
        case 'long':  return settings.longDuration * 60;
        default:      return settings.focusDuration * 60;
    }
}

export function start() {
    if (state.isRunning) return;
    state.isRunning = true;
    state.startedAt = Date.now();
    state.timeLeftAtStart = state.timeLeft;

    state.intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
        state.timeLeft = Math.max(0, state.timeLeftAtStart - elapsed);

        if (state.timeLeft <= 0) {
            state.timeLeft = 0;
            complete();
        }
        if (callbacks.onTick) callbacks.onTick(getDisplayState());
    }, 200);

    if (callbacks.onTick) callbacks.onTick(getDisplayState());
}

export function pause() {
    state.isRunning = false;
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
    state.startedAt = null;
    state.timeLeftAtStart = null;
    if (callbacks.onTick) callbacks.onTick(getDisplayState());
}

export function reset() {
    pause();
    state.timeLeft = state.totalTime;
    if (callbacks.onTick) callbacks.onTick(getDisplayState());
}

export function skip() {
    pause();
    complete();
}

function complete() {
    pause();

    playNotification();

    if (state.mode === 'focus') {
        state.sessionsCompleted++;
        state.totalFocusMinutes += Math.round(state.totalTime / 60);

        if (callbacks.onComplete) callbacks.onComplete(getDisplayState());

        if (state.sessionsCompleted % state.settings.sessionsBeforeLong === 0) {
            switchMode('long');
        } else {
            switchMode('short');
        }
    } else {
        if (callbacks.onComplete) callbacks.onComplete(getDisplayState());
        switchMode('focus');
    }
}

export function switchMode(mode) {
    state.mode = mode;
    state.totalTime = calcDuration(mode, state.settings);
    state.timeLeft = state.totalTime;
    reset();
    if (callbacks.onModeChange) callbacks.onModeChange(mode);
}

export function getDisplayState() {
    return {
        mode: state.mode,
        timeLeft: state.timeLeft,
        totalTime: state.totalTime,
        isRunning: state.isRunning,
        sessionsCompleted: state.sessionsCompleted,
        totalFocusMinutes: state.totalFocusMinutes,
        ringProgress: 1 - (state.timeLeft / state.totalTime),
    };
}

export function restoreState(saved) {
    if (saved) {
        state.sessionsCompleted = saved.sessionsCompleted || 0;
        state.totalFocusMinutes = saved.totalFocusMinutes || 0;
    }
}

export function getSessionsCompleted() {
    return state.sessionsCompleted;
}

export function getTotalFocusMinutes() {
    return state.totalFocusMinutes;
}
