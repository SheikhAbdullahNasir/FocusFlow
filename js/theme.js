import { saveTheme, loadTheme } from './storage.js';

let currentTheme = 'dark';
let listeners = [];

function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    saveTheme(theme);
    listeners.forEach(fn => fn(theme));
}

export function init() {
    const saved = loadTheme();
    const preferred = saved || getSystemPreference();
    applyTheme(preferred);
    updateIcons(preferred);
}

export function toggle() {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    updateIcons(next);
}

export function getTheme() {
    return currentTheme;
}

export function onChange(fn) {
    listeners.push(fn);
}

function updateIcons(theme) {
    const sun = document.querySelector('.icon-sun');
    const moon = document.querySelector('.icon-moon');
    if (!sun || !moon) return;
    if (theme === 'dark') {
        sun.classList.add('hidden');
        moon.classList.remove('hidden');
    } else {
        sun.classList.remove('hidden');
        moon.classList.add('hidden');
    }
}
