let ctx = null;
let soundEnabled = true;

function getContext() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx;
}

export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
}

export function playNotification() {
    if (!soundEnabled) return;

    try {
        const c = getContext();

        const osc1 = c.createOscillator();
        const gain1 = c.createGain();
        osc1.connect(gain1);
        gain1.connect(c.destination);
        osc1.frequency.value = 830;
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.25, c.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
        osc1.start(c.currentTime);
        osc1.stop(c.currentTime + 0.3);

        setTimeout(() => {
            const osc2 = c.createOscillator();
            const gain2 = c.createGain();
            osc2.connect(gain2);
            gain2.connect(c.destination);
            osc2.frequency.value = 1050;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.25, c.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
            osc2.start(c.currentTime);
            osc2.stop(c.currentTime + 0.4);
        }, 250);
    } catch (_) {
        const el = document.getElementById('alarmSound');
        if (el) {
            el.currentTime = 0;
            el.play().catch(() => {});
        }
    }
}
