import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './storage.js';
import { setSoundEnabled } from './sounds.js';

let isOpen = false;
let callbacks = { onSave: null };

const els = {
    modal: null,
    overlay: null,
    btnOpen: null,
    btnClose: null,
    inputFocus: null,
    inputShort: null,
    inputLong: null,
    inputSessions: null,
    toggleSound: null,
    btnSave: null,
};

export function init(opts = {}) {
    if (opts.onSave) callbacks.onSave = opts.onSave;

    els.overlay = document.getElementById('settingsModal');
    els.modal = els.overlay ? els.overlay.querySelector('.modal') : null;
    els.btnOpen = document.getElementById('btnOpenSettings');
    els.btnClose = document.getElementById('btnCloseSettings');
    els.inputFocus = document.getElementById('settingFocus');
    els.inputShort = document.getElementById('settingShort');
    els.inputLong = document.getElementById('settingLong');
    els.inputSessions = document.getElementById('settingSessions');
    els.toggleSound = document.getElementById('settingSound');
    els.btnSave = document.getElementById('btnSaveSettings');

    if (els.btnOpen) els.btnOpen.addEventListener('click', open);
    if (els.btnClose) els.btnClose.addEventListener('click', close);
    if (els.btnSave) els.btnSave.addEventListener('click', save);

    if (els.overlay) {
        els.overlay.addEventListener('click', (e) => {
            if (e.target === els.overlay) close();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) close();
    });

    loadForm();
}

export function open() {
    isOpen = true;
    loadForm();
    if (els.overlay) els.overlay.classList.add('open');
}

export function close() {
    isOpen = false;
    if (els.overlay) els.overlay.classList.remove('open');
}

export function save() {
    const settings = {
        focusDuration: parseInt(els.inputFocus.value, 10) || DEFAULT_SETTINGS.focusDuration,
        shortDuration: parseInt(els.inputShort.value, 10) || DEFAULT_SETTINGS.shortDuration,
        longDuration: parseInt(els.inputLong.value, 10) || DEFAULT_SETTINGS.longDuration,
        sessionsBeforeLong: parseInt(els.inputSessions.value, 10) || DEFAULT_SETTINGS.sessionsBeforeLong,
        soundEnabled: els.toggleSound.checked,
    };

    saveSettings(settings);
    setSoundEnabled(settings.soundEnabled);

    if (callbacks.onSave) callbacks.onSave(settings);
    close();
}

function loadForm() {
    const settings = loadSettings();
    els.inputFocus.value = settings.focusDuration;
    els.inputShort.value = settings.shortDuration;
    els.inputLong.value = settings.longDuration;
    els.inputSessions.value = settings.sessionsBeforeLong;
    els.toggleSound.checked = settings.soundEnabled;
    setSoundEnabled(settings.soundEnabled);
}
