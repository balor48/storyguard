/**
 * error-handler-init.js
 * 
 * Entry point for initializing the application's error handling system.
 * This script should be included early in the application lifecycle.
 */

import { integrateErrorHandling, ErrorHandlingManager, notificationManager } from './modules/error-handling-integration.js';

// Initialize error handling system with configuration
const errorHandlingConfig = {
    errorManager: {
        loggingEnabled: true,
        consoleOutputEnabled: true,
        persistErrorLog: true,
        maxLogSize: 100
    },
    notificationManager: {
        maxNotifications: 3,
        defaultDuration: 5000
    }
};

// Initialize the error handling system
integrateErrorHandling(errorHandlingConfig);

// Make error handlers globally available for convenience
window.ErrorHandlingManager = ErrorHandlingManager;
window.notificationManager = notificationManager;

// Add a simple API for showing notifications (for easy integration with legacy code)
window.showToast = function(message, type = 'info', title = '', duration = 5000) {
    switch (type.toLowerCase()) {
        case 'error':
            return notificationManager.showError(message, title || 'Error', duration);
        case 'warning':
            return notificationManager.showWarning(message, title || 'Warning', duration);
        case 'success':
            return notificationManager.showSuccess(message, title || 'Success', duration);
        case 'info':
        default:
            return notificationManager.showInfo(message, title || 'Information', duration);
    }
};

// Log initialization
console.log('Error handling system initialized');

// Export for ESM modules
export { ErrorHandlingManager, notificationManager };
