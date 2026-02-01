/**
 * Application-wide constants
 */

export const COOLDOWN = {
    BUTTON: 2000,           // 2 seconds - button cooldown after submission
    TASK_FETCH: 3600000,    // 1 hour - cooldown for fetching new tasks
    TOAST_DURATION: 3000    // 3 seconds - how long toasts are displayed
};

export const INTERACTION = {
    MIN_DRAW_DURATION: 200,  // Minimum duration in ms to register as intentional drawing
    MIN_DRAW_POINTS: 5       // Minimum number of points to consider drawing intentional
};

export const DRAWING_STYLE = {
    strokeColor: '#ff4757',
    lineWidth: 3,
    shadowBlur: 10,
    shadowColor: 'rgba(255, 71, 87, 0.8)',
    fillOpacity: 0.2
};
