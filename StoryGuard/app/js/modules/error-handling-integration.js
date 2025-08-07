/**
 * error-handling-integration.js
 * 
 * Integration layer to systematically add error handling to all modules.
 * This module provides utilities and patterns for enforcing consistent
 * error handling throughout the application.
 */

import { ErrorHandlingManager, tryCatch, tryCatchAsync, withErrorHandling, safeEventListener } from './error-handling-util.js';
import notificationManager from './NotificationManager.js';

/**
 * Apply error handling to all modules
 * @param {Object} options - Configuration options
 */
export function integrateErrorHandling(options = {}) {
    // Initialize managers
    if (!ErrorHandlingManager.isInitialized) {
        ErrorHandlingManager.initialize(options.errorManager || {});
    }
    
    if (!notificationManager.isInitialized) {
        notificationManager.initialize(options.notificationManager || {});
    }
    
    // Apply error handling to global unhandled exceptions
    applyGlobalErrorHandling();
    
    // Apply error handling to DOM events if in browser context
    if (typeof document !== 'undefined') {
        applyDOMErrorHandling();
    }
    
    // Apply error handling to specific modules
    applyModuleErrorHandling();
    
    return true;
}

/**
 * Apply error handling to global unhandled exceptions
 */
function applyGlobalErrorHandling() {
    if (typeof window !== 'undefined') {
        // Handle window errors
        window.onerror = function(message, source, lineno, colno, error) {
            ErrorHandlingManager.handleError(
                error || message,
                'global',
                'error',
                { source, lineno, colno }
            );
            return true; // Prevents default browser error handling
        };
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            ErrorHandlingManager.handleError(
                event.reason,
                'promise',
                'error',
                { unhandledRejection: true }
            );
        });
    }
    
    // Handle Node.js process errors if in Node.js context
    if (typeof process !== 'undefined' && process.on) {
        process.on('uncaughtException', function(error) {
            ErrorHandlingManager.handleCriticalError(
                error,
                'process',
                { uncaughtException: true }
            );
        });
        
        process.on('unhandledRejection', function(reason, promise) {
            ErrorHandlingManager.handleError(
                reason,
                'process',
                'error',
                { unhandledRejection: true, promise: String(promise) }
            );
        });
    }
}

/**
 * Apply error handling to DOM events
 */
function applyDOMErrorHandling() {
    // Handle form submissions
    document.addEventListener('submit', function(event) {
        const form = event.target;
        if (!form.hasAttribute('data-error-handled')) {
            form.setAttribute('data-error-handled', 'true');
            
            const originalSubmit = form.onsubmit;
            form.onsubmit = function(e) {
                try {
                    if (originalSubmit) {
                        return originalSubmit.call(this, e);
                    }
                } catch (error) {
                    ErrorHandlingManager.handleError(
                        error,
                        'form',
                        'error',
                        { formId: form.id, formAction: form.action }
                    );
                    e.preventDefault();
                    return false;
                }
            };
        }
    }, true); // Use capture to handle before other listeners
    
    // Handle navigation actions that might lose data
    window.addEventListener('beforeunload', function(event) {
        // Check for unsaved changes
        if (window.hasUnsavedChanges) {
            // Log the navigation attempt
            ErrorHandlingManager.logInfo(
                'User attempted to navigate away with unsaved changes',
                'navigation',
                { hasUnsavedChanges: true }
            );
            
            // Show standard confirmation dialog
            event.preventDefault();
            event.returnValue = '';
        }
    });
}

/**
 * Apply error handling to specific modules
 */
function applyModuleErrorHandling() {
    // List of module integration functions
    const moduleIntegrations = [
        integrateUIManager,
        integrateFileManager,
        integrateDatabaseManager,
        integrateSettingsManager
    ];
    
    // Apply each integration
    moduleIntegrations.forEach(integration => {
        try {
            integration();
        } catch (error) {
            console.warn(`Error integrating module error handling: ${error.message}`);
        }
    });
}

/**
 * Apply error handling to UIManager
 */
function integrateUIManager() {
    if (typeof window === 'undefined' || !window.UIManager) return;
    
    // List of methods to wrap with error handling
    const methodsToWrap = [
        'showModal',
        'closeModal',
        'showSettingsDialog',
        'createPagination',
        'initDragAndDrop',
        'createSortableList',
        'validateForm'
    ];
    
    // Apply error handling to each method
    methodsToWrap.forEach(method => {
        if (typeof window.UIManager[method] === 'function') {
            // Save original method
            const originalMethod = window.UIManager[method];
            
            // Replace with error-handled version
            window.UIManager[method] = withErrorHandling(
                originalMethod,
                null, // Default return value on error
                'ui-manager',
                'error',
                { method }
            );
        }
    });
    
    // Add notification handling for UI errors
    if (!ErrorHandlingManager.errorHandlers['ui-notifications']) {
        ErrorHandlingManager.registerErrorHandler('ui-notifications', 
            (errorInfo) => {
                if (errorInfo.source === 'ui-manager') {
                    notificationManager.showError(
                        errorInfo.message,
                        'UI Error',
                        8000
                    );
                }
            },
            { source: 'ui-manager' }
        );
    }
}

/**
 * Apply error handling to FileManager
 */
function integrateFileManager() {
    // Handle FileManager if it exists in window
    if (typeof window !== 'undefined' && window.fileManager) {
        // List of methods to wrap with async error handling
        const asyncMethodsToWrap = [
            'readFile',
            'writeFile',
            'ensureDirectory',
            'fileExists',
            'deleteFile',
            'listFiles',
            'copyFile'
        ];
        
        // Apply error handling to each method
        asyncMethodsToWrap.forEach(method => {
            if (typeof window.fileManager[method] === 'function') {
                // Save original method
                const originalMethod = window.fileManager[method];
                
                // Replace with error-handled version
                window.fileManager[method] = withAsyncErrorHandling(
                    originalMethod,
                    null, // Default return value on error
                    'file-manager',
                    'error',
                    { method }
                );
            }
        });
    }
    
    // Handle FileManagerBridge if it exists
    if (typeof window !== 'undefined' && window.fileManagerBridge) {
        // List of methods to wrap with async error handling
        const bridgeMethodsToWrap = [
            'readFile',
            'writeFile',
            'ensureDirectory',
            'fileExists',
            'listFiles',
            'getPath',
            'browseDirectory'
        ];
        
        // Apply error handling to each method
        bridgeMethodsToWrap.forEach(method => {
            if (typeof window.fileManagerBridge[method] === 'function') {
                // Save original method
                const originalMethod = window.fileManagerBridge[method];
                
                // Replace with error-handled version
                window.fileManagerBridge[method] = withAsyncErrorHandling(
                    originalMethod,
                    null, // Default return value on error
                    'file-manager-bridge',
                    'error',
                    { method }
                );
            }
        });
    }
    
    // Add notification handling for file errors
    if (!ErrorHandlingManager.errorHandlers['file-notifications']) {
        ErrorHandlingManager.registerErrorHandler('file-notifications', 
            (errorInfo) => {
                if (errorInfo.source.includes('file-manager')) {
                    notificationManager.showError(
                        `File operation failed: ${errorInfo.message}`,
                        'File Error',
                        8000
                    );
                }
            },
            { sourcePattern: /file-manager/ }
        );
    }
}

/**
 * Apply error handling to DatabaseManager
 */
function integrateDatabaseManager() {
    if (typeof window === 'undefined' || !window.databaseManager) return;
    
    // List of methods to wrap with async error handling
    const asyncMethodsToWrap = [
        'loadDatabase',
        'saveDatabase',
        'loadDatabaseFromFile',
        'exportDatabase',
        'importDatabase',
        'deleteDatabase'
    ];
    
    // Apply error handling to each method
    asyncMethodsToWrap.forEach(method => {
        if (typeof window.databaseManager[method] === 'function') {
            // Save original method
            const originalMethod = window.databaseManager[method];
            
            // Replace with error-handled version
            window.databaseManager[method] = withAsyncErrorHandling(
                originalMethod,
                null, // Default return value on error
                'database-manager',
                'error',
                { method }
            );
        }
    });
    
    // Add notification handling for database errors
    if (!ErrorHandlingManager.errorHandlers['database-notifications']) {
        ErrorHandlingManager.registerErrorHandler('database-notifications', 
            (errorInfo) => {
                if (errorInfo.source === 'database-manager') {
                    notificationManager.showError(
                        `Database operation failed: ${errorInfo.message}`,
                        'Database Error',
                        8000
                    );
                }
            },
            { source: 'database-manager' }
        );
    }
}

/**
 * Apply error handling to SettingsManager
 */
function integrateSettingsManager() {
    if (typeof window === 'undefined' || !window.SettingsManager) return;
    
    // List of methods to wrap with error handling
    const methodsToWrap = [
        'loadSettings',
        'saveSettings',
        'getSetting',
        'setSetting',
        'updateSettings'
    ];
    
    // Apply error handling to each method
    methodsToWrap.forEach(method => {
        if (typeof window.SettingsManager[method] === 'function') {
            // Save original method
            const originalMethod = window.SettingsManager[method];
            
            // Replace with error-handled version
            window.SettingsManager[method] = withErrorHandling(
                originalMethod,
                null, // Default return value on error
                'settings-manager',
                'error',
                { method }
            );
        }
    });
    
    // Add notification handling for settings errors
    if (!ErrorHandlingManager.errorHandlers['settings-notifications']) {
        ErrorHandlingManager.registerErrorHandler('settings-notifications', 
            (errorInfo) => {
                if (errorInfo.source === 'settings-manager') {
                    notificationManager.showError(
                        `Settings operation failed: ${errorInfo.message}`,
                        'Settings Error',
                        8000
                    );
                }
            },
            { source: 'settings-manager' }
        );
    }
}

// Export utility functions from error-handling-util for convenience
export { 
    ErrorHandlingManager,
    tryCatch,
    tryCatchAsync,
    withErrorHandling,
    safeEventListener,
    notificationManager
};
