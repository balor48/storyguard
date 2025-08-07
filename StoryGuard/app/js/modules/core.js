/**
 * Core functionality for Story Database
 * Contains state management and utility functions
 */

// State Management
let roles = [];
let locationTypes = [];
let locations = [];
let customFieldTypes = [];
let characters = [];
let titles = [];
let seriesList = [];
let books = [];
let relationships = [];
let tags = []; // New: Tags for characters and locations
let plots = []; // New: Plot points and story arcs
let worldElements = []; // New: World-building elements

// Initialize state from localStorage
function initializeState() {
    // Get the current database name
    const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
    console.log('Initializing state for database:', currentDbName);
    
    // Try to load from database-specific keys first, fall back to generic keys
    const dbRolesData = localStorage.getItem(`${currentDbName}_roles`);
    const dbLocationTypesData = localStorage.getItem(`${currentDbName}_locationTypes`);
    const dbLocationsData = localStorage.getItem(`${currentDbName}_locations`);
    const dbCustomFieldTypesData = localStorage.getItem(`${currentDbName}_customFieldTypes`);
    const dbCharactersData = localStorage.getItem(`${currentDbName}_characters`);
    const dbTitlesData = localStorage.getItem(`${currentDbName}_titles`);
    const dbSeriesListData = localStorage.getItem(`${currentDbName}_seriesList`) || localStorage.getItem(`${currentDbName}_series`);
    const dbBooksData = localStorage.getItem(`${currentDbName}_books`);
    const dbRelationshipsData = localStorage.getItem(`${currentDbName}_relationships`);
    const dbTagsData = localStorage.getItem(`${currentDbName}_tags`);
    const dbPlotsData = localStorage.getItem(`${currentDbName}_plots`);
    const dbWorldElementsData = localStorage.getItem(`${currentDbName}_worldElements`);
    
    // Use database-specific data if available, otherwise fall back to generic keys
    roles = JSON.parse(dbRolesData || localStorage.getItem('roles') || '["Protagonist", "Antagonist", "Supporting Character", "Minor Character"]');
    locationTypes = JSON.parse(dbLocationTypesData || localStorage.getItem('locationTypes') || '["City", "Town", "Village", "Castle", "Forest", "Mountain", "Kingdom", "Realm"]');
    locations = JSON.parse(dbLocationsData || localStorage.getItem('locations') || '[]');
    customFieldTypes = JSON.parse(dbCustomFieldTypesData || localStorage.getItem('customFieldTypes') || '[]');
    characters = JSON.parse(dbCharactersData || localStorage.getItem('characters') || '[]');
    titles = JSON.parse(dbTitlesData || localStorage.getItem('titles') || '["Mr.", "Mrs.", "Dr.", "Sir", "Lady", "Miss"]');
    seriesList = JSON.parse(dbSeriesListData || localStorage.getItem('seriesList') || localStorage.getItem('series') || '[]');
    books = JSON.parse(dbBooksData || localStorage.getItem('books') || '[]');
    relationships = JSON.parse(dbRelationshipsData || localStorage.getItem('relationships') || '[]');
    tags = JSON.parse(dbTagsData || localStorage.getItem('tags') || '[]');
    plots = JSON.parse(dbPlotsData || localStorage.getItem('plots') || '[]');
    worldElements = JSON.parse(dbWorldElementsData || localStorage.getItem('worldElements') || '[]');
    
    // Log which keys were used
    console.log('Data loaded from:', {
        roles: dbRolesData ? 'database-specific' : 'generic',
        locationTypes: dbLocationTypesData ? 'database-specific' : 'generic',
        locations: dbLocationsData ? 'database-specific' : 'generic',
        customFieldTypes: dbCustomFieldTypesData ? 'database-specific' : 'generic',
        characters: dbCharactersData ? 'database-specific' : 'generic',
        titles: dbTitlesData ? 'database-specific' : 'generic',
        seriesList: dbSeriesListData ? 'database-specific' : 'generic',
        books: dbBooksData ? 'database-specific' : 'generic',
        relationships: dbRelationshipsData ? 'database-specific' : 'generic',
        tags: dbTagsData ? 'database-specific' : 'generic',
        plots: dbPlotsData ? 'database-specific' : 'generic',
        worldElements: dbWorldElementsData ? 'database-specific' : 'generic'
    });
    
    // Set window variables AFTER data is loaded from localStorage
    window.characters = characters;
    window.locations = locations;
    window.plots = plots;
    window.worldElements = worldElements;
}

// Error types and user-friendly messages
const ERROR_TYPES = {
    STORAGE_FULL: 'STORAGE_FULL',
    NETWORK_ERROR: 'NETWORK_ERROR',
    INVALID_DATA: 'INVALID_DATA',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// User-friendly error messages
const ERROR_MESSAGES = {
    [ERROR_TYPES.STORAGE_FULL]: 'Your local storage is full. Try exporting some data to make space.',
    [ERROR_TYPES.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
    [ERROR_TYPES.INVALID_DATA]: 'The data format is invalid. Please try again or contact support.',
    [ERROR_TYPES.PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
    [ERROR_TYPES.NOT_FOUND]: 'The requested item could not be found.',
    [ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ERROR_TYPES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

// In-memory error log
const errorLog = [];
const MAX_ERROR_LOG_SIZE = 100;

// Centralized error handler
function handleError(error, context = '', severity = 'error', options = {}) {
    // Create standardized error object
    const errorObj = {
        timestamp: new Date().toISOString(),
        message: error.message || 'Unknown error',
        code: error.code || ERROR_TYPES.UNKNOWN_ERROR,
        context: context,
        severity: severity,
        stack: error.stack,
        userAgent: navigator.userAgent,
        ...options
    };
    
    // Log to console
    console.error(`[${severity.toUpperCase()}] ${context}:`, error);
    
    // Add to error log
    logError(errorObj);
    
    // Get user-friendly message
    const userMessage = getUserFriendlyErrorMessage(error);
    
    // Show appropriate UI based on severity
    switch(severity) {
        case 'critical':
            showErrorModal(userMessage, context);
            break;
        case 'warning':
            showToast(userMessage, 'warning', options.duration || 5000);
            break;
        case 'error':
        default:
            showToast(userMessage, 'error', options.duration || 4000);
            break;
    }
    
    return errorObj;
}

// Get user-friendly error message
function getUserFriendlyErrorMessage(error) {
    // If error has a code that maps to a predefined message
    if (error.code && ERROR_MESSAGES[error.code]) {
        return ERROR_MESSAGES[error.code];
    }
    
    // Handle common error types
    if (error instanceof TypeError) {
        return 'There was a problem with the data format. Please try again.';
    }
    
    if (error instanceof ReferenceError) {
        return 'A technical error occurred. Please refresh the page and try again.';
    }
    
    // For QuotaExceededError in localStorage
    if (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        return ERROR_MESSAGES[ERROR_TYPES.STORAGE_FULL];
    }
    
    // Use error message if available, otherwise generic message
    return error.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR];
}

// Log error to in-memory store and localStorage
function logError(errorObj) {
    // Add to in-memory log
    errorLog.push(errorObj);
    
    // Limit log size
    if (errorLog.length > MAX_ERROR_LOG_SIZE) {
        errorLog.shift();
    }
    
    // Try to save to localStorage
    try {
        localStorage.setItem('errorLog', JSON.stringify(errorLog));
    } catch (e) {
        // If localStorage fails, just keep in-memory log
        console.warn('Could not save error log to localStorage');
    }
}

// Show error modal for critical errors
function showErrorModal(message, title = 'Error') {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'error-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    
    // Add dark mode support
    if (document.body.classList.contains('dark-mode')) {
        modal.style.background = '#333';
        modal.style.color = '#fff';
    }
    
    // Add content
    modal.innerHTML = `
        <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px;">
            <h3 style="color: #e74c3c; margin: 0;">${title}</h3>
        </div>
        <div style="margin-bottom: 20px;">
            <p>${message}</p>
        </div>
        <div style="text-align: right;">
            <button id="error-modal-close" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
    `;
    
    // Add to DOM
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add close handler
    document.getElementById('error-modal-close').addEventListener('click', () => {
        overlay.remove();
    });
}

// Enhanced error handling for localStorage
function safelyStoreItem(key, value) {
    try {
        // Get the current database name
        const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
        
        // Save to both the generic key and the database-specific key
        localStorage.setItem(key, value);
        
        // Only create database-specific key if it's one of our data keys
        // and doesn't already have a database prefix
        const dataKeys = ['characters', 'titles', 'series', 'seriesList', 'books', 'roles', 
                          'customFieldTypes', 'relationships', 'tags', 'plots', 'worldElements', 'locations'];
        
        if (dataKeys.includes(key) && !key.includes('_')) {
            // Create a database-specific key (e.g., 'mystery-supplement_characters')
            localStorage.setItem(`${currentDbName}_${key}`, value);
            console.log(`Saved data to both generic key '${key}' and database-specific key '${currentDbName}_${key}'`);
        }
        
        return true;
    } catch (error) {
        // Determine error type
        if (error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            // Storage full error
            error.code = ERROR_TYPES.STORAGE_FULL;
            handleError(error, 'Local Storage', 'warning', {
                key: key,
                valueSize: value.length,
                action: 'Suggest exporting data'
            });
            
            // Suggest solutions
            showStorageManagementDialog();
        } else {
            // Other storage errors
            handleError(error, 'Local Storage', 'error', {
                key: key,
                action: 'Save attempt failed'
            });
        }
        return false;
    }
}

// Show storage management dialog
function showStorageManagementDialog() {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    // Create dialog box
    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';
    dialog.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        max-width: 500px;
        width: 100%;
    `;
    
    // Add dark mode support
    if (document.body.classList.contains('dark-mode')) {
        dialog.style.background = '#333';
        dialog.style.color = '#fff';
    }
    
    // Create dialog content
    dialog.innerHTML = `
        <h3 style="margin-top: 0; color: #e67e22;">Storage Space Low</h3>
        <p>Your browser's storage space is running low. To free up space, you can:</p>
        <ul style="margin-bottom: 20px;">
            <li>Export your data as a backup file</li>
            <li>Delete unused characters, locations, or other items</li>
            <li>Clear your browser cache and cookies</li>
        </ul>
        <div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 20px;">
            <button id="export-data-btn" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Export Data</button>
            <button id="storage-dialog-close" style="padding: 8px 16px; background: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
    `;
    
    // Add dialog to overlay
    overlay.appendChild(dialog);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('export-data-btn').addEventListener('click', function() {
        overlay.remove();
        // Call the export function if Storage module is available
        if (window.Storage && typeof Storage.exportDatabase === 'function') {
            Storage.exportDatabase();
        } else {
            showToast('Export functionality not available', 'error');
        }
    });
    
    document.getElementById('storage-dialog-close').addEventListener('click', function() {
        overlay.remove();
    });
}

// Flag to control toast notifications
let toastNotificationsEnabled = true; // Set to false to disable most notifications

// Initialize toast notifications setting from localStorage
try {
    const storedSetting = localStorage.getItem('toastNotificationsEnabled');
    if (storedSetting !== null) {
        toastNotificationsEnabled = storedSetting === 'true';
        console.log('Initialized toastNotificationsEnabled from localStorage:', toastNotificationsEnabled);
    }
} catch (error) {
    console.error('Error initializing toast notifications setting:', error);
}

// Function to update the notification setting
function updateNotificationSetting(isEnabled) {
    toastNotificationsEnabled = isEnabled === true;
    console.log('Core: Updated toastNotificationsEnabled to:', toastNotificationsEnabled);
    
    // Also update localStorage for persistence
    try {
        localStorage.setItem('toastNotificationsEnabled', toastNotificationsEnabled);
    } catch (error) {
        console.error('Error saving notification setting to localStorage:', error);
    }
    
    return toastNotificationsEnabled;
}

// Wrapper function to check if toast notifications are enabled
function showToastIfEnabled(message, type = 'info', duration = 3000) {
    // Check notification setting directly from localStorage for the most up-to-date value
    try {
        const storedSetting = localStorage.getItem('toastNotificationsEnabled');
        if (storedSetting !== null) {
            toastNotificationsEnabled = storedSetting === 'true';
        }
    } catch (error) {
        console.error('Error reading notification setting from localStorage:', error);
    }
    
    // Check if toast notifications are disabled
    if (!toastNotificationsEnabled) {
        console.log(`Toast suppressed (${type}): ${message} - Notifications are disabled`);
        return;
    }
    
    // Call the actual showToast function
    showToastImplementation(message, type, duration);
}

// Enhanced Toast Notifications with duration control
function showToastImplementation(message, type = 'info', duration = 3000) {
    // Block unwanted messages
    if (message === "Opening historical database..." || 
        message.includes("Opening historical database")) {
        console.log('CORE: Blocked unwanted "Opening historical database" toast');
        return;
    }
    
    // Log the message first in case DOM operations fail
    console.log(`Toast (${type}): ${message}`);
    
    // If the document isn't ready yet, queue the toast for later
    if (!document || !document.body) {
        console.log('DOM not ready for toast, queuing for later');
        if (!window.Core._queuedToasts) {
            window.Core._queuedToasts = [];
            
            // Set up the queue processor to run when DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
                console.log('Processing queued toasts:', window.Core._queuedToasts.length);
                window.Core._queuedToasts.forEach(toast => {
                    window.Core.showToast(toast.message, toast.type, toast.duration);
                });
                window.Core._queuedToasts = [];
            });
        }
        
        // Queue this toast
        window.Core._queuedToasts.push({ message, type, duration });
        return;
    }
    
    try {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon ${type}"></i>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: type === 'success' ? '#4CAF50' : 
                          type === 'error' ? '#F44336' : 
                          type === 'warning' ? '#FF9800' : '#2196F3',
            color: 'white',
            padding: '12px 15px',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.3s, transform 0.3s',
            maxWidth: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '14px'
        });
        
        // Add close button handler
        const closeButton = toast.querySelector('.toast-close');
        if (closeButton) {
            Object.assign(closeButton.style, {
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                marginLeft: '10px'
            });
            
            closeButton.addEventListener('click', () => {
                if (document && document.body && document.body.contains(toast)) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        if (document && document.body && document.body.contains(toast)) {
                            document.body.removeChild(toast);
                        }
                    }, 300);
                }
            });
        }
        
        // Safely append to body
        if (document && document.body) {
            // Find existing toasts and stack them
            const existingToasts = document.querySelectorAll('.toast');
            const offset = existingToasts.length * 10;
            toast.style.bottom = `${20 + offset}px`;
            
            document.body.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            }, 10);
            
            // Auto-remove after duration
            setTimeout(() => {
                if (document && document.body && document.body.contains(toast)) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        if (document && document.body && document.body.contains(toast)) {
                            document.body.removeChild(toast);
                        }
                    }, 300);
                }
            }, duration);
        } else {
            console.error('Cannot append toast: document.body is not available');
        }
    } catch (error) {
        console.error('Error showing toast:', error);
    }
}

// Function to display error log UI
function showErrorLog() {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    `;
    
    // Create dialog box
    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';
    dialog.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    // Add dark mode support
    if (document.body.classList.contains('dark-mode')) {
        dialog.style.background = '#333';
        dialog.style.color = '#fff';
    }
    
    // Create log entries HTML
    let logEntriesHtml = '';
    if (errorLog.length === 0) {
        logEntriesHtml = '<p>No errors have been logged.</p>';
    } else {
        logEntriesHtml = errorLog.map(entry => {
            const date = new Date(entry.timestamp).toLocaleString();
            const severityColor = entry.severity === 'critical' ? '#e74c3c' :
                                 entry.severity === 'error' ? '#e67e22' :
                                 entry.severity === 'warning' ? '#f39c12' : '#3498db';
            
            return `
                <div class="log-entry" style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${severityColor}; background: ${document.body.classList.contains('dark-mode') ? '#444' : '#f9f9f9'};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: bold; color: ${severityColor};">${entry.severity.toUpperCase()}</span>
                        <span style="color: #7f8c8d;">${date}</span>
                    </div>
                    <div style="margin-bottom: 5px;"><strong>Context:</strong> ${entry.context || 'Unknown'}</div>
                    <div style="margin-bottom: 5px;"><strong>Message:</strong> ${entry.message}</div>
                    <details style="margin-top: 5px;">
                        <summary style="cursor: pointer; color: #3498db;">Stack Trace</summary>
                        <pre style="margin-top: 5px; padding: 10px; background: ${document.body.classList.contains('dark-mode') ? '#222' : '#f1f1f1'}; overflow-x: auto; font-size: 12px;">${entry.stack || 'No stack trace available'}</pre>
                    </details>
                </div>
            `;
        }).join('');
    }
    
    // Create dialog content
    dialog.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
            <h3 style="margin: 0;">Error Log</h3>
            <button id="clear-error-log" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Log</button>
        </div>
        <div class="error-log-container">
            ${logEntriesHtml}
        </div>
        <div style="text-align: right; margin-top: 15px;">
            <button id="close-error-log" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
    `;
    
    // Add dialog to overlay
    overlay.appendChild(dialog);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('close-error-log').addEventListener('click', function() {
        overlay.remove();
    });
    
    document.getElementById('clear-error-log').addEventListener('click', function() {
        clearErrorLog();
        dialog.querySelector('.error-log-container').innerHTML = '<p>No errors have been logged.</p>';
    });
}

// Clear error log
function clearErrorLog() {
    errorLog.length = 0;
    try {
        localStorage.removeItem('errorLog');
        showToast('Error log cleared', 'success');
    } catch (e) {
        console.warn('Could not clear error log from localStorage');
    }
}

// Retry mechanism for operations that might fail
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.log(`Attempt ${attempt} failed:`, error);
            lastError = error;
            
            if (attempt < maxRetries) {
                // Show retry message
                showToast(`Operation failed, retrying (${attempt}/${maxRetries})...`, 'warning');
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Exponential backoff
                delay *= 1.5;
            }
        }
    }
    
    // If we get here, all retries failed
    throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Fuzzy search utility
function fuzzySearch(items, searchTerm, fields) {
    if (!searchTerm || searchTerm.trim() === '') return items;
    
    searchTerm = searchTerm.toLowerCase().trim();
    
    return items.filter(item => {
        return fields.some(field => {
            const value = item[field];
            if (!value) return false;
            
            const str = value.toString().toLowerCase();
            
            // Exact substring match - this is the primary matching method
            if (str.includes(searchTerm)) return true;
            
            // Check for word starts with the search term
            const words = str.split(/\s+/);
            for (const word of words) {
                if (word.startsWith(searchTerm)) return true;
            }
            
            // No more fuzzy matching - we only want exact substring matches
            // or words that start with the search term
            
            return false;
        });
    });
}

// Confirmation dialog
function showConfirmationDialog(message, onConfirm, onCancel) {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    // Create dialog box
    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';
    dialog.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        width: 100%;
    `;
    
    // Add dark mode support
    if (document.body.classList.contains('dark-mode')) {
        dialog.style.background = '#333';
        dialog.style.color = '#fff';
    }
    
    // Create dialog content
    dialog.innerHTML = `
        <h3 style="margin-top: 0;">Warning</h3>
        <p>${message}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="dialog-cancel" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
            <button id="dialog-confirm" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Continue</button>
        </div>
    `;
    
    // Add dialog to overlay
    overlay.appendChild(dialog);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('dialog-confirm').addEventListener('click', function() {
        overlay.remove();
        if (onConfirm) onConfirm();
    });
    
    document.getElementById('dialog-cancel').addEventListener('click', function() {
        overlay.remove();
        if (onCancel) onCancel();
    });
}

// Check if an item is being edited
function checkForUnsavedChanges(type, onContinue) {
    let isEditing = false;
    let originalItem = null;
    let currentEditingId = null;
    let clearFunction = null;
    
    // Check which type of item is being edited
    switch (type) {
        case 'character':
            isEditing = window.currentEditingCharacterId !== null && window.currentEditingCharacterId !== undefined;
            originalItem = window.originalEditCharacter;
            currentEditingId = window.currentEditingCharacterId;
            clearFunction = Characters.clearForm;
            break;
        case 'location':
            isEditing = window.currentEditingLocationId !== null && window.currentEditingLocationId !== undefined;
            originalItem = window.originalEditLocation;
            currentEditingId = window.currentEditingLocationId;
            clearFunction = Locations.clearLocationForm;
            break;
        case 'plot':
            isEditing = window.currentEditingPlotId !== null && window.currentEditingPlotId !== undefined;
            originalItem = window.originalEditPlot;
            currentEditingId = window.currentEditingPlotId;
            clearFunction = Plots.clearPlotForm;
            break;
        case 'worldElement':
            isEditing = window.currentEditingElementId !== null && window.currentEditingElementId !== undefined;
            originalItem = window.originalEditWorldElement;
            currentEditingId = window.currentEditingElementId;
            clearFunction = WorldBuilding.clearWorldElementForm;
            break;
    }
    
    // If an item is being edited, show confirmation dialog
    if (isEditing && originalItem) {
        const itemName = type === 'character' ?
            `${originalItem.firstName} ${originalItem.lastName}` :
            originalItem.name || originalItem.title || 'this item';
        
        showConfirmationDialog(
            `You are currently editing ${type} "${itemName}". If you continue, your changes will be saved. Do you want to continue?`,
            function() {
                // User clicked Continue - save the current item
                const form = document.querySelector(
                    type === 'character' ? '#characterForm' :
                    type === 'location' ? '#locationForm' :
                    type === 'plot' ? '#plotForm' :
                    '#worldElementForm'
                );
                
                if (form) {
                    // Trigger form submission to save changes
                    const submitEvent = new Event('submit', { cancelable: true });
                    form.dispatchEvent(submitEvent);
                    
                    // Continue with the requested action
                    if (onContinue) setTimeout(onContinue, 100);
                }
            },
            function() {
                // User clicked Cancel - do nothing, continue editing current item
            }
        );
        return true; // Unsaved changes exist
    }
    
    // No unsaved changes, continue with the requested action
    if (onContinue) onContinue();
    return false; // No unsaved changes
}

// Export Core functions
window.Core = {
    // State management
    initializeState,
    
    // Error handling
    handleError,
    getUserFriendlyErrorMessage,
    logError,
    showErrorModal,
    showErrorLog,
    clearErrorLog,
    retryOperation,
    
    // Storage utilities
    safelyStoreItem,
    showStorageManagementDialog,
    
    // Toast notifications
    showToast: showToastIfEnabled, // Use the wrapper function
    
    // Constants
    ERROR_TYPES,
    
    // Utility functions
    debounce,
    generateId,
    fuzzySearch,
    showConfirmationDialog,
    checkForUnsavedChanges,
    
    // Toast notification settings
    get toastNotificationsEnabled() { return toastNotificationsEnabled; },
    set toastNotificationsEnabled(value) { toastNotificationsEnabled = !!value; },
    enableToastNotifications: function() { toastNotificationsEnabled = true; },
    disableToastNotifications: function() { toastNotificationsEnabled = false; },
    updateNotificationSetting,
    
    // Initialize toasts queue
    _queuedToasts: []
};

// Initialize error log from localStorage if available
(function initErrorLog() {
    try {
        const storedLog = localStorage.getItem('errorLog');
        if (storedLog) {
            const parsedLog = JSON.parse(storedLog);
            if (Array.isArray(parsedLog)) {
                // Add stored errors to the in-memory log
                parsedLog.forEach(entry => errorLog.push(entry));
                
                // Limit size if needed
                if (errorLog.length > MAX_ERROR_LOG_SIZE) {
                    errorLog.splice(0, errorLog.length - MAX_ERROR_LOG_SIZE);
                }
                
                console.log(`Loaded ${errorLog.length} error log entries from localStorage`);
            }
        }
    } catch (e) {
        console.warn('Failed to load error log from localStorage:', e);
    }
})();

// Log that the core module has loaded
console.log('[Debug] Core module loaded successfully');