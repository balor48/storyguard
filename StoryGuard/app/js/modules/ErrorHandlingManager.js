/**
 * ErrorHandlingManager.js
 * 
 * A centralized error handling module for the Story Database Desktop application.
 * This module provides consistent error handling, logging, and user notification
 * for errors throughout the application.
 *
 * Part of the application's modular architecture refactoring.
 */

// Import dependencies if needed
import { safeGet, safeStore } from '../storage-util.js';

/**
 * ErrorHandlingManager - Centralizes all error handling functionality
 */
class ErrorHandlingManager {
    constructor() {
        this.isInitialized = false;
        this.errorLog = [];
        this.maxLogSize = 100; // Maximum number of errors to keep in memory
        this.loggingEnabled = true;
        this.consoleOutputEnabled = true;
        this.errorHandlers = {}; // Custom error handlers for specific error types
        
        // Error levels
        this.ERROR_LEVELS = {
            CRITICAL: 'critical', // Application cannot continue
            ERROR: 'error',      // Operation failed but app can continue
            WARNING: 'warning',  // Potential issue but operation succeeded
            INFO: 'info'         // Informational message
        };
    }

    /**
     * Initialize the error handling manager
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('ErrorHandlingManager already initialized');
            return this;
        }

        // Set options
        this.loggingEnabled = options.loggingEnabled !== undefined ? options.loggingEnabled : true;
        this.consoleOutputEnabled = options.consoleOutputEnabled !== undefined ? options.consoleOutputEnabled : true;
        this.maxLogSize = options.maxLogSize || 100;
        
        // Load existing error log if persistence is enabled
        if (options.persistErrorLog) {
            try {
                const savedLog = safeGet('errorLog');
                if (savedLog) {
                    this.errorLog = JSON.parse(savedLog);
                }
            } catch (err) {
                console.error('Failed to load error log from storage:', err);
                this.errorLog = [];
            }
        }

        this.isInitialized = true;
        return this;
    }

    /**
     * Handle an error with consistent logging and notification
     * @param {Error|string} error - The error object or message
     * @param {string} source - The source of the error (e.g., 'storage', 'database')
     * @param {string} level - Error level from ERROR_LEVELS
     * @param {Object} additionalInfo - Any additional context for the error
     * @returns {Object} - Error info object
     */
    handleError(error, source = 'unknown', level = this.ERROR_LEVELS.ERROR, additionalInfo = {}) {
        if (!this.isInitialized) {
            this.initialize();
        }

        // Create an error info object
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error instanceof Error ? error.message : error,
            source: source,
            level: level,
            stack: error instanceof Error ? error.stack : null,
            additionalInfo: additionalInfo
        };

        // Log to internal log
        if (this.loggingEnabled) {
            this._addToLog(errorInfo);
        }

        // Output to console if enabled
        if (this.consoleOutputEnabled) {
            this._outputToConsole(errorInfo);
        }

        // Notify user if appropriate
        this._notifyUser(errorInfo);

        // Execute custom handlers if any exist for this source or level
        this._executeCustomHandlers(errorInfo);

        return errorInfo;
    }

    /**
     * Handle a critical error that prevents the application from functioning properly
     * @param {Error|string} error - The error object or message
     * @param {string} source - The source of the error 
     * @param {Object} additionalInfo - Any additional context for the error
     */
    handleCriticalError(error, source = 'unknown', additionalInfo = {}) {
        return this.handleError(error, source, this.ERROR_LEVELS.CRITICAL, additionalInfo);
    }

    /**
     * Handle a warning (non-fatal issue)
     * @param {Error|string} warning - The warning object or message
     * @param {string} source - The source of the warning
     * @param {Object} additionalInfo - Any additional context for the warning
     */
    handleWarning(warning, source = 'unknown', additionalInfo = {}) {
        return this.handleError(warning, source, this.ERROR_LEVELS.WARNING, additionalInfo);
    }

    /**
     * Log an informational message
     * @param {string} message - The info message
     * @param {string} source - The source of the info
     * @param {Object} additionalInfo - Any additional context
     */
    logInfo(message, source = 'unknown', additionalInfo = {}) {
        return this.handleError(message, source, this.ERROR_LEVELS.INFO, additionalInfo);
    }

    /**
     * Register a custom error handler for specific error types
     * @param {string} key - A unique identifier for this handler
     * @param {Function} handlerFn - The handler function(errorInfo)
     * @param {Object} options - Options for when this handler should execute
     */
    registerErrorHandler(key, handlerFn, options = {}) {
        if (typeof handlerFn !== 'function') {
            console.error('Error handler must be a function');
            return false;
        }

        this.errorHandlers[key] = {
            handler: handlerFn,
            options: options
        };

        return true;
    }

    /**
     * Remove a custom error handler
     * @param {string} key - The handler identifier
     */
    unregisterErrorHandler(key) {
        if (this.errorHandlers[key]) {
            delete this.errorHandlers[key];
            return true;
        }
        return false;
    }

    /**
     * Get the error log
     * @param {number} limit - Number of most recent errors to retrieve
     * @returns {Array} - Array of error info objects
     */
    getErrorLog(limit = null) {
        if (limit && typeof limit === 'number') {
            return this.errorLog.slice(-limit);
        }
        return [...this.errorLog];
    }

    /**
     * Clear the error log
     */
    clearErrorLog() {
        this.errorLog = [];
        try {
            safeStore('errorLog', JSON.stringify([]));
        } catch (err) {
            console.error('Failed to clear error log in storage:', err);
        }
        return true;
    }

    /**
     * Create a try-catch wrapper for any function
     * @param {Function} fn - The function to wrap
     * @param {string} source - Source identifier for errors
     * @param {Object} options - Additional options
     * @returns {Function} - Wrapped function
     */
    createSafeFunction(fn, source = 'unknown', options = {}) {
        const self = this;
        return function safeWrapper(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                const level = options.errorLevel || self.ERROR_LEVELS.ERROR;
                const additionalInfo = {
                    ...options.additionalInfo || {},
                    arguments: options.includeArguments ? args : undefined
                };
                
                self.handleError(error, source, level, additionalInfo);
                
                // Return fallback value if provided
                if ('fallbackValue' in options) {
                    return options.fallbackValue;
                }
                
                // Re-throw if specified
                if (options.rethrow) {
                    throw error;
                }
                
                return undefined;
            }
        };
    }

    /**
     * Safely execute a function with error handling
     * @param {Function} fn - The function to execute
     * @param {Array} args - Arguments to pass to the function
     * @param {string} source - Source identifier for errors
     * @param {Object} options - Additional options
     * @returns {*} - Function result or fallback value
     */
    safeExecute(fn, args = [], source = 'unknown', options = {}) {
        const safeFn = this.createSafeFunction(fn, source, options);
        return safeFn(...args);
    }

    /**
     * Add an error to the internal log
     * @private
     */
    _addToLog(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // Trim log if it exceeds max size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
        
        // Persist error log if storage is available
        try {
            safeStore('errorLog', JSON.stringify(this.errorLog));
        } catch (err) {
            console.error('Failed to save error log to storage:', err);
        }
    }

    /**
     * Output an error to the console
     * @private
     */
    _outputToConsole(errorInfo) {
        const { level, message, source, timestamp, additionalInfo } = errorInfo;
        
        const prefix = `[${new Date(timestamp).toLocaleTimeString()}] [${source}] `;
        
        switch (level) {
            case this.ERROR_LEVELS.CRITICAL:
                console.error(`${prefix}CRITICAL: ${message}`, errorInfo.stack || '', additionalInfo);
                break;
            case this.ERROR_LEVELS.ERROR:
                console.error(`${prefix}ERROR: ${message}`, errorInfo.stack || '', additionalInfo);
                break;
            case this.ERROR_LEVELS.WARNING:
                console.warn(`${prefix}WARNING: ${message}`, additionalInfo);
                break;
            case this.ERROR_LEVELS.INFO:
                console.info(`${prefix}INFO: ${message}`, additionalInfo);
                break;
            default:
                console.log(`${prefix}${message}`, additionalInfo);
        }
    }

    /**
     * Notify the user of an error if appropriate
     * @private
     */
    _notifyUser(errorInfo) {
        const { level, message, source } = errorInfo;
        
        // Skip notifications for info level or if specifically disabled
        if (level === this.ERROR_LEVELS.INFO || errorInfo.additionalInfo?.suppressNotification) {
            return;
        }
        
        // Check if NotificationManager exists and use it if available
        if (window.NotificationManager) {
            switch (level) {
                case this.ERROR_LEVELS.CRITICAL:
                case this.ERROR_LEVELS.ERROR:
                    window.NotificationManager.error(`Error in ${source}: ${message}`);
                    break;
                case this.ERROR_LEVELS.WARNING:
                    window.NotificationManager.warning(`Warning in ${source}: ${message}`);
                    break;
                default:
                    // Do nothing for other levels
            }
            return;
        }
        
        // Fallback to legacy toast notification system
        if (typeof window.showToast === 'function') {
            const type = level === this.ERROR_LEVELS.WARNING ? 'warning' : 'error';
            window.showToast(`${level.toUpperCase()}: ${message}`, type);
        }
    }

    /**
     * Execute any registered custom error handlers that apply
     * @private
     */
    _executeCustomHandlers(errorInfo) {
        Object.values(this.errorHandlers).forEach(({ handler, options }) => {
            // Check if this handler should execute for this error
            const shouldExecute = (
                (!options.level || options.level === errorInfo.level) &&
                (!options.source || options.source === errorInfo.source) &&
                (!options.filter || options.filter(errorInfo))
            );
            
            if (shouldExecute) {
                try {
                    handler(errorInfo);
                } catch (err) {
                    // Don't use handleError here to avoid infinite loops
                    console.error('Error in custom error handler:', err);
                }
            }
        });
    }
}

// Create a singleton instance
const errorHandling = new ErrorHandlingManager();

// Initialize with default settings
errorHandling.initialize();

// Create convenience function for wrapping code in try-catch
function tryCatch(fn, fallbackValue = null, source = 'unknown') {
    return errorHandling.safeExecute(fn, [], source, { fallbackValue });
}

// Legacy support - create a global error handling function
window.handleError = function(error, source = 'unknown', additionalInfo = {}) {
    return errorHandling.handleError(error, source, errorHandling.ERROR_LEVELS.ERROR, additionalInfo);
};

// Legacy support - create a global warning function
window.handleWarning = function(warning, source = 'unknown', additionalInfo = {}) {
    return errorHandling.handleWarning(warning, source, additionalInfo);
};

// Export the singleton instance and utility functions
export {
    errorHandling as ErrorHandlingManager,
    tryCatch
};

// Also make available globally
window.ErrorHandlingManager = errorHandling;
window.tryCatch = tryCatch;
