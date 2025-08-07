/**
 * error-handling-util.js
 * 
 * Utility functions for standardized error handling throughout the application.
 * This module simplifies integration with ErrorHandlingManager across the codebase.
 */

import { ErrorHandlingManager } from './ErrorHandlingManager.js';

/**
 * Wraps a function with standard error handling
 * @param {Function} fn - The function to execute
 * @param {*} defaultValue - Value to return if function fails
 * @param {string} source - Source identifier for error reporting
 * @param {string} level - Error level (default: 'error')
 * @param {Object} additionalInfo - Additional contextual information
 * @returns {*} - Result of the function or defaultValue if it fails
 */
export function tryCatch(fn, defaultValue, source = 'unknown', level = 'error', additionalInfo = {}) {
    try {
        return fn();
    } catch (error) {
        ErrorHandlingManager.handleError(error, source, level, additionalInfo);
        return defaultValue;
    }
}

/**
 * Wraps an async function with standard error handling
 * @param {Function} fn - The async function to execute
 * @param {*} defaultValue - Value to return if function fails
 * @param {string} source - Source identifier for error reporting
 * @param {string} level - Error level (default: 'error')
 * @param {Object} additionalInfo - Additional contextual information
 * @returns {Promise<*>} - Result of the function or defaultValue if it fails
 */
export async function tryCatchAsync(fn, defaultValue, source = 'unknown', level = 'error', additionalInfo = {}) {
    try {
        return await fn();
    } catch (error) {
        ErrorHandlingManager.handleError(error, source, level, additionalInfo);
        return defaultValue;
    }
}

/**
 * Creates a wrapper function that applies tryCatch to the wrapped function
 * @param {Function} fn - The function to wrap
 * @param {*} defaultValue - Value to return if function fails
 * @param {string} source - Source identifier for error reporting
 * @param {string} level - Error level (default: 'error')
 * @param {Object} additionalInfo - Additional contextual information
 * @returns {Function} - Wrapped function with error handling
 */
export function withErrorHandling(fn, defaultValue, source = 'unknown', level = 'error', additionalInfo = {}) {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            ErrorHandlingManager.handleError(error, source, level, {
                arguments: args,
                ...additionalInfo
            });
            return defaultValue;
        }
    };
}

/**
 * Creates a wrapper function that applies tryCatchAsync to the wrapped async function
 * @param {Function} fn - The async function to wrap
 * @param {*} defaultValue - Value to return if function fails
 * @param {string} source - Source identifier for error reporting
 * @param {string} level - Error level (default: 'error')
 * @param {Object} additionalInfo - Additional contextual information
 * @returns {Function} - Wrapped async function with error handling
 */
export function withAsyncErrorHandling(fn, defaultValue, source = 'unknown', level = 'error', additionalInfo = {}) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            ErrorHandlingManager.handleError(error, source, level, {
                arguments: args,
                ...additionalInfo
            });
            return defaultValue;
        }
    };
}

/**
 * Ensures that all errors from event handlers are properly caught and reported
 * @param {HTMLElement} element - The DOM element to attach the handler to
 * @param {string} eventType - The event type (e.g., 'click', 'change')
 * @param {Function} handler - The event handler function
 * @param {Object} options - Options for addEventListener and error handling
 */
export function safeEventListener(element, eventType, handler, options = {}) {
    if (!element || !eventType || typeof handler !== 'function') {
        return false;
    }
    
    const { source = 'ui', level = 'error', ...eventOptions } = options;
    
    // Create safe handler that catches errors
    const safeHandler = function(event) {
        try {
            return handler.call(this, event);
        } catch (error) {
            ErrorHandlingManager.handleError(error, source, level, {
                eventType,
                element: element.id || element.tagName,
                eventPhase: event.eventPhase
            });
            // Prevent default behavior on error if it might cause further issues
            if (level === 'critical' || level === 'error') {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    };
    
    // Attach the safe handler
    element.addEventListener(eventType, safeHandler, eventOptions);
    
    // Return a function to remove the event listener
    return () => element.removeEventListener(eventType, safeHandler, eventOptions);
}

// Export all from ErrorHandlingManager for convenience
export { ErrorHandlingManager };
