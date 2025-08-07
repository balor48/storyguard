/**
 * Settings Module Fix
 * This script ensures the settings module is properly loaded and exposed
 */

// Create a global StorageSettings object if it doesn't exist
if (!window.StorageSettings) {
    window.StorageSettings = {};
}

// Function to initialize the settings module
function initializeSettingsModule() {
    console.log('Initializing settings module...');
    
    // Import the settings module functions
    try {
        // Try to dynamically import the settings module
        import('./modules/storage/settings.js')
            .then(module => {
                console.log('Successfully imported settings module');
                
                // Expose the module functions
                if (typeof module.showSettingsDialog === 'function') {
                    window.StorageSettings.showSettingsDialog = module.showSettingsDialog;
                    console.log('✓ showSettingsDialog successfully imported from settings module');
                    
                    // Also attach to Storage if it exists
                    if (window.Storage && !window.Storage.showSettingsDialog) {
                        window.Storage.showSettingsDialog = module.showSettingsDialog;
                        console.log('✓ showSettingsDialog successfully attached to window.Storage');
                    }
                } else {
                    console.error('× showSettingsDialog function not found in settings module');
                }
                
                // Expose other functions
                if (typeof module.getSettings === 'function') {
                    window.StorageSettings.getSettings = module.getSettings;
                }
                
                if (typeof module.updateSettings === 'function') {
                    window.StorageSettings.updateSettings = module.updateSettings;
                }
                
                if (typeof module.initializeSettings === 'function') {
                    window.StorageSettings.initializeSettings = module.initializeSettings;
                }
                
                console.log('Settings module initialization complete');
            })
            .catch(error => {
                console.error('Error importing settings module:', error);
                
                // Create fallback implementation
                createFallbackSettingsModule();
            });
    } catch (error) {
        console.error('Error initializing settings module:', error);
        
        // Create fallback implementation
        createFallbackSettingsModule();
    }
}

// Function to create a fallback settings module
function createFallbackSettingsModule() {
    console.log('Creating fallback settings module...');
    
    // Create a fallback showSettingsDialog function
    window.StorageSettings.showSettingsDialog = function() {
        console.log('Opening settings dialog (fallback implementation)');
        // Try to use the IPC API to open settings
        if (window.api && typeof window.api.send === 'function') {
            window.api.send('open-settings-dialog');
        } else {
            console.error('Cannot open settings dialog: API not available');
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Settings dialog not available', 'error');
            }
        }
    };
    
    // Also attach to Storage if it exists
    if (window.Storage && !window.Storage.showSettingsDialog) {
        window.Storage.showSettingsDialog = window.StorageSettings.showSettingsDialog;
    }
    
    console.log('Fallback settings module created');
}

// Initialize the settings module when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSettingsModule);

// Also try to initialize immediately in case the DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeSettingsModule();
} 