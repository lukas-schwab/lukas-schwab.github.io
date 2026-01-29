/**
 * Shared utility functions for the application
 */

export function showToast(message) {
    const event = new CustomEvent('app-toast', { detail: message });
    window.dispatchEvent(event);
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
