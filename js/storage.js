const STORAGE_KEY = 'focusflow_data';
const SETTINGS_KEY = 'focusflow_settings';
const THEME_KEY = 'focusflow_theme';

export const DEFAULT_SETTINGS = {
    focusDuration: 25,
    shortDuration: 5,
    longDuration: 15,
    sessionsBeforeLong: 4,
    soundEnabled: true,
};

export function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
}

export function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (_) {
        return null;
    }
}

export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}
}

export function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (_) {
        return { ...DEFAULT_SETTINGS };
    }
}

export function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (_) {}
}

export function loadTheme() {
    try {
        return localStorage.getItem(THEME_KEY);
    } catch (_) {
        return null;
    }
}
