/**
 * NotificationManager.js
 * 
 * A centralized notification system for the Story Database Desktop application.
 * This module provides consistent message display including error notifications,
 * success messages, warnings, and informational alerts.
 *
 * Part of the application's modular architecture refactoring.
 */

// Import dependencies
import { ErrorHandlingManager, tryCatch } from './error-handling-util.js';

/**
 * NotificationManager - Manages all user notifications in a consistent way
 */
class NotificationManager {
    constructor() {
        this.isInitialized = false;
        this.activeNotifications = [];
        this.maxNotifications = 3;
        this.defaultDuration = 5000; // milliseconds
        this.container = null;
        
        // Notification types
        this.TYPES = {
            ERROR: 'error',
            WARNING: 'warning',
            SUCCESS: 'success',
            INFO: 'info'
        };
    }
    
    /**
     * Initialize the notification manager
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('NotificationManager already initialized');
            return this;
        }
        
        // Set options
        this.maxNotifications = options.maxNotifications || 3;
        this.defaultDuration = options.defaultDuration || 5000;
        
        // Create notification container if it doesn't exist
        this._createContainer();
        
        // Connect to error handling manager
        if (ErrorHandlingManager) {
            ErrorHandlingManager.registerErrorHandler('notifications', this._handleErrorNotification.bind(this), {
                levels: ['error', 'critical', 'warning']
            });
        }
        
        this.isInitialized = true;
        return this;
    }
    
    /**
     * Create the notification container
     * @private
     */
    _createContainer() {
        return tryCatch(() => {
            // Check if container already exists
            let container = document.getElementById('notification-container');
            
            if (!container) {
                // Create the container
                container = document.createElement('div');
                container.id = 'notification-container';
                container.className = 'notification-container';
                
                // Add styles if not already defined in CSS
                if (!document.querySelector('style#notification-styles')) {
                    const styles = document.createElement('style');
                    styles.id = 'notification-styles';
                    styles.textContent = `
                        .notification-container {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            z-index: 9999;
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                            max-width: 350px;
                        }
                        
                        .notification {
                            padding: 12px 15px;
                            border-radius: 4px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                            display: flex;
                            align-items: flex-start;
                            animation: notification-slide-in 0.3s ease-out;
                            transition: opacity 0.3s ease, transform 0.3s ease;
                        }
                        
                        .notification.closing {
                            opacity: 0;
                            transform: translateX(50px);
                        }
                        
                        .notification-content {
                            flex: 1;
                        }
                        
                        .notification-close {
                            cursor: pointer;
                            padding: 5px;
                            margin: -5px;
                            opacity: 0.7;
                        }
                        
                        .notification-close:hover {
                            opacity: 1;
                        }
                        
                        .notification-title {
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        
                        .notification-error {
                            background-color: #f8d7da;
                            border-left: 4px solid #dc3545;
                            color: #721c24;
                        }
                        
                        .notification-warning {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            color: #856404;
                        }
                        
                        .notification-success {
                            background-color: #d4edda;
                            border-left: 4px solid #28a745;
                            color: #155724;
                        }
                        
                        .notification-info {
                            background-color: #d1ecf1;
                            border-left: 4px solid #17a2b8;
                            color: #0c5460;
                        }
                        
                        @keyframes notification-slide-in {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `;
                    document.head.appendChild(styles);
                }
                
                // Add container to document
                document.body.appendChild(container);
            }
            
            this.container = container;
            return container;
        }, null, 'notification-manager');
    }
    
    /**
     * Handle errors from ErrorHandlingManager and show notifications
     * @param {Object} errorInfo - Error information object
     * @private
     */
    _handleErrorNotification(errorInfo) {
        if (!errorInfo) return;
        
        // Map error levels to notification types
        const levelMap = {
            'critical': this.TYPES.ERROR,
            'error': this.TYPES.ERROR,
            'warning': this.TYPES.WARNING,
            'info': this.TYPES.INFO
        };
        
        const type = levelMap[errorInfo.level] || this.TYPES.ERROR;
        
        // Create title based on source and level
        const titleMap = {
            'critical': 'Critical Error',
            'error': 'Error',
            'warning': 'Warning',
            'info': 'Information'
        };
        
        const title = `${titleMap[errorInfo.level] || 'Error'} (${errorInfo.source})`;
        
        // Show notification
        this.showNotification({
            type,
            title,
            message: errorInfo.message,
            duration: type === this.TYPES.ERROR ? 8000 : this.defaultDuration,
            isError: type === this.TYPES.ERROR
        });
    }
    
    /**
     * Show a notification
     * @param {Object} options - Notification options
     * @param {string} options.type - Notification type (from this.TYPES)
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {number} options.duration - How long to show notification (ms)
     * @returns {Object} - The notification object with remove function
     */
    showNotification(options) {
        return tryCatch(() => {
            if (!this.isInitialized) {
                this.initialize();
            }
            
            // Make sure container exists
            if (!this.container) {
                this._createContainer();
            }
            
            // Destructure options with defaults
            const {
                type = this.TYPES.INFO,
                title = '',
                message = '',
                duration = this.defaultDuration,
                isError = false
            } = options;
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            // Create notification content
            const content = document.createElement('div');
            content.className = 'notification-content';
            
            // Add title if provided
            if (title) {
                const titleElement = document.createElement('div');
                titleElement.className = 'notification-title';
                titleElement.textContent = title;
                content.appendChild(titleElement);
            }
            
            // Add message
            const messageElement = document.createElement('div');
            messageElement.className = 'notification-message';
            messageElement.textContent = message;
            content.appendChild(messageElement);
            
            // Add close button
            const closeButton = document.createElement('div');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => this.removeNotification(notification));
            
            // Assemble notification
            notification.appendChild(content);
            notification.appendChild(closeButton);
            
            // Add to container
            this.container.appendChild(notification);
            
            // Limit number of notifications
            this._enforceMaxNotifications();
            
            // Add to active notifications
            const notificationObj = {
                element: notification,
                type,
                createdAt: Date.now(),
                remove: () => this.removeNotification(notification)
            };
            
            this.activeNotifications.push(notificationObj);
            
            // Auto-remove after duration if not an error
            if (duration !== -1) { // -1 means don't auto-remove
                setTimeout(() => {
                    this.removeNotification(notification);
                }, duration);
            }
            
            return notificationObj;
        }, null, 'notification-manager');
    }
    
    /**
     * Remove a notification
     * @param {HTMLElement} notification - The notification element to remove
     */
    removeNotification(notification) {
        return tryCatch(() => {
            if (!notification) return false;
            
            // Add closing class for animation
            notification.classList.add('closing');
            
            // Remove from active notifications
            this.activeNotifications = this.activeNotifications.filter(
                n => n.element !== notification
            );
            
            // Wait for animation to finish before removing
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300); // Match the CSS transition duration
            
            return true;
        }, false, 'notification-manager');
    }
    
    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        return tryCatch(() => {
            // Remove each notification
            this.activeNotifications.forEach(notification => {
                this.removeNotification(notification.element);
            });
            
            return true;
        }, false, 'notification-manager');
    }
    
    /**
     * Enforce maximum number of notifications
     * @private
     */
    _enforceMaxNotifications() {
        return tryCatch(() => {
            // If we have too many notifications, remove oldest non-error ones first
            while (this.container.children.length > this.maxNotifications) {
                // Try to find a non-error notification to remove first
                let notificationToRemove = null;
                
                for (let i = 0; i < this.activeNotifications.length; i++) {
                    if (this.activeNotifications[i].type !== this.TYPES.ERROR) {
                        notificationToRemove = this.activeNotifications[i].element;
                        break;
                    }
                }
                
                // If no non-error notification found, remove oldest one
                if (!notificationToRemove && this.activeNotifications.length > 0) {
                    notificationToRemove = this.activeNotifications[0].element;
                }
                
                // Remove the notification
                if (notificationToRemove) {
                    this.removeNotification(notificationToRemove);
                } else {
                    break; // No notifications to remove
                }
            }
        }, null, 'notification-manager');
    }
    
    /**
     * Show an error notification
     * @param {string} message - Error message
     * @param {string} title - Optional title (defaults to 'Error')
     * @param {number} duration - How long to show notification (-1 for permanent)
     */
    showError(message, title = 'Error', duration = 8000) {
        return this.showNotification({
            type: this.TYPES.ERROR,
            title,
            message,
            duration,
            isError: true
        });
    }
    
    /**
     * Show a warning notification
     * @param {string} message - Warning message
     * @param {string} title - Optional title (defaults to 'Warning')
     * @param {number} duration - How long to show notification
     */
    showWarning(message, title = 'Warning', duration = this.defaultDuration) {
        return this.showNotification({
            type: this.TYPES.WARNING,
            title,
            message,
            duration
        });
    }
    
    /**
     * Show a success notification
     * @param {string} message - Success message
     * @param {string} title - Optional title (defaults to 'Success')
     * @param {number} duration - How long to show notification
     */
    showSuccess(message, title = 'Success', duration = this.defaultDuration) {
        return this.showNotification({
            type: this.TYPES.SUCCESS,
            title,
            message,
            duration
        });
    }
    
    /**
     * Show an info notification
     * @param {string} message - Info message
     * @param {string} title - Optional title (defaults to 'Information')
     * @param {number} duration - How long to show notification
     */
    showInfo(message, title = 'Information', duration = this.defaultDuration) {
        return this.showNotification({
            type: this.TYPES.INFO,
            title,
            message,
            duration
        });
    }
}

// Create a singleton instance
const notificationManager = new NotificationManager();

// Export the singleton instance
export default notificationManager;
