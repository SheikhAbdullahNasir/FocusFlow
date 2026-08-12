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
    toggleNotifications: null,
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
    els.toggleNotifications = document.getElementById('settingNotifications');
    els.btnSave = document.getElementById('btnSaveSettings');

    if (els.btnOpen) els.btnOpen.addEventListener('click', open);
    if (els.btnClose) els.btnClose.addEventListener('click', close);
    if (els.btnSave) els.btnSave.addEventListener('click', save);

    if (els.toggleNotifications) {
        els.toggleNotifications.addEventListener('change', () => {
            if (els.toggleNotifications.checked) {
                if (!('Notification' in window)) {
                    alert('This browser does not support desktop notifications.');
                    els.toggleNotifications.checked = false;
                    return;
                }
                if (Notification.permission === 'denied') {
                    alert('Notification permission has been denied. Please enable it in browser settings.');
                    els.toggleNotifications.checked = false;
                    return;
                }
                if (Notification.permission !== 'granted') {
                    Notification.requestPermission().then(permission => {
                        if (permission !== 'granted') {
                            els.toggleNotifications.checked = false;
                        }
                    });
                }
            }
        });
    }

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
        notificationsEnabled: els.toggleNotifications ? els.toggleNotifications.checked : false,
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
    if (els.toggleNotifications) {
        els.toggleNotifications.checked = settings.notificationsEnabled || false;
    }
}
