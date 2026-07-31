let tasks = [];
let activeTaskId = null;
let filter = 'all';
let callbacks = { onChange: null };

export function init(opts = {}) {
    if (opts.onChange) callbacks.onChange = opts.onChange;
}

export function restoreState(saved) {
    if (saved) {
        tasks = saved.tasks || [];
        activeTaskId = saved.activeTaskId || null;
    }
}

export function getState() {
    return { tasks, activeTaskId, filter };
}

export function getExportData() {
    return { tasks, activeTaskId };
}

function notify() {
    if (callbacks.onChange) callbacks.onChange(getState());
}

export function add(text) {
    const task = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: text.trim(),
        completed: false,
        pomodoros: 0,
        createdAt: Date.now(),
    };
    tasks.unshift(task);
    if (!activeTaskId) activeTaskId = task.id;
    notify();
}

export function toggle(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    if (task.completed && activeTaskId === id) {
        const next = tasks.find(t => !t.completed && t.id !== id);
        activeTaskId = next ? next.id : null;
    }
    notify();
}

export function remove(id) {
    tasks = tasks.filter(t => t.id !== id);
    if (activeTaskId === id) {
        const next = tasks.find(t => !t.completed);
        activeTaskId = next ? next.id : null;
    }
    notify();
}

export function setActive(id) {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
        activeTaskId = id;
        notify();
    }
}

export function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    if (activeTaskId && !tasks.find(t => t.id === activeTaskId)) {
        const next = tasks.find(t => !t.completed);
        activeTaskId = next ? next.id : null;
    }
    notify();
}

export function incrementPomodoro() {
    if (activeTaskId) {
        const task = tasks.find(t => t.id === activeTaskId);
        if (task) task.pomodoros++;
        notify();
    }
}

export function getFiltered() {
    switch (filter) {
        case 'active': return tasks.filter(t => !t.completed);
        case 'completed': return tasks.filter(t => t.completed);
        default: return tasks;
    }
}

export function setFilter(f) {
    filter = f;
    notify();
}

export function getStats() {
    return {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        active: tasks.filter(t => !t.completed).length,
    };
}

export function getActiveTask() {
    if (!activeTaskId) return null;
    return tasks.find(t => t.id === activeTaskId) || null;
}
