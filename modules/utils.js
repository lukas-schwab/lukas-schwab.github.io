/**
 * Shared utility functions for the application
 */
import { COOLDOWN } from './constants.js';

export function showToast(message) {
    const event = new CustomEvent('app-toast', { detail: message });
    window.dispatchEvent(event);
}

/**
 * Apply cooldown to a single button
 * @param {HTMLElement} button - The button to apply cooldown to
 * @param {number} duration - Duration in milliseconds (defaults to COOLDOWN.BUTTON)
 * @param {string} feedbackText - Text to show during cooldown
 * @returns {Promise} Resolves when cooldown is complete
 */
export function applyButtonCooldown(button, duration = COOLDOWN.BUTTON, feedbackText = 'Submitted!') {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = feedbackText;

    return new Promise(resolve => {
        setTimeout(() => {
            button.disabled = false;
            button.textContent = originalText;
            resolve();
        }, duration);
    });
}

/**
 * Apply cooldown to multiple buttons simultaneously
 * @param {HTMLElement[]} buttons - Array of buttons to disable
 * @param {HTMLElement} activeButton - The button that was clicked (will show feedback text)
 * @param {number} duration - Duration in milliseconds
 * @param {string} feedbackText - Text to show on active button during cooldown
 * @returns {Promise} Resolves when cooldown is complete
 */
export function applyMultiButtonCooldown(buttons, activeButton = null, duration = COOLDOWN.BUTTON, feedbackText = 'Submitted!') {
    const states = buttons.map(btn => ({
        button: btn,
        originalText: btn.textContent
    }));

    // Disable all buttons
    buttons.forEach(btn => btn.disabled = true);

    // Show feedback on the active button
    if (activeButton) {
        activeButton.textContent = feedbackText;
    }

    return new Promise(resolve => {
        setTimeout(() => {
            states.forEach(({ button, originalText }) => {
                button.disabled = false;
                button.textContent = originalText;
            });
            resolve();
        }, duration);
    });
}

/**
 * Load HTML page content from file
 */
export async function loadPageHTML(pageName) {
    try {
        const response = await fetch(`./pages/${pageName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load page: ${pageName}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading page:', error);
        return '';
    }
}

/**
 * Create a debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
