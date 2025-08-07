/**
 * storage-ui-bridge.js
 * 
 * This module bridges between the Storage module and UIManager for UI-related operations.
 * It ensures backward compatibility by redirecting Storage.showSettingsDialog calls to UIManager.
 */

// Wait for both Storage and UIManager to be available
function initializeStorageUIBridge() {
    console.log('Initializing Storage-UI bridge');
    
    // Check if both modules are available
    if (!window.Storage) {
        console.warn('Storage module not available, will retry later');
        setTimeout(initializeStorageUIBridge, 500);
        return;
    }
    
    if (!window.UIManager) {
        console.warn('UIManager module not available, will retry later');
        setTimeout(initializeStorageUIBridge, 500);
        return;
    }
    
    // Bridge the showSettingsDialog method
    if (typeof window.Storage.showSettingsDialog !== 'function') {
        console.log('Bridging Storage.showSettingsDialog to UIManager');
        window.Storage.showSettingsDialog = function() {
            return window.UIManager.showSettingsDialog();
        };
    }
    
    // Add reference to the settings module if available
    if (window.storageSettings) {
        window.UIManager.storageSettings = window.storageSettings;
    }
    
    console.log('Storage-UI bridge initialized successfully');
}

// Initialize the bridge when the document is ready
if (document.readyState === 'complete') {
    initializeStorageUIBridge();
} else {
    document.addEventListener('DOMContentLoaded', initializeStorageUIBridge);
}

// Also try initializing after a delay to ensure everything is loaded
setTimeout(initializeStorageUIBridge, 1000);
