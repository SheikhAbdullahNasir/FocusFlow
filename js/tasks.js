let tasks = [];
let activeTaskId = null;
let filter = 'all';
let callbacks = { onChange: null };
let lastAction = null;

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

    lastAction = {
        type: 'toggle',
        taskId: id,
        wasCompleted: task.completed
    };

    task.completed = !task.completed;
    if (task.completed && activeTaskId === id) {
        const next = tasks.find(t => !t.completed && t.id !== id);
        activeTaskId = next ? next.id : null;
    }
    notify();
}

export function remove(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    lastAction = {
        type: 'delete',
        task: tasks[index],
        index: index,
        wasActive: activeTaskId === id
    };

    tasks.splice(index, 1);
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
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;

    lastAction = {
        type: 'clear',
        tasksBeforeClear: [...tasks],
        activeTaskIdBeforeClear: activeTaskId
    };

    tasks = tasks.filter(t => !t.completed);
    if (activeTaskId && !tasks.find(t => t.id === activeTaskId)) {
        const next = tasks.find(t => !t.completed);
        activeTaskId = next ? next.id : null;
    }
    notify();
}

export function undo() {
    if (!lastAction) return false;

    switch (lastAction.type) {
        case 'toggle': {
            const task = tasks.find(t => t.id === lastAction.taskId);
            if (task) {
                task.completed = lastAction.wasCompleted;
                if (!lastAction.wasCompleted && !activeTaskId) {
                    activeTaskId = task.id;
                }
            }
            break;
        }
        case 'delete': {
            tasks.splice(lastAction.index, 0, lastAction.task);
            if (lastAction.wasActive) {
                activeTaskId = lastAction.task.id;
            }
            break;
        }
        case 'clear': {
            tasks = lastAction.tasksBeforeClear;
            activeTaskId = lastAction.activeTaskIdBeforeClear;
            break;
        }
    }
    lastAction = null;
    notify();
    return true;
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
