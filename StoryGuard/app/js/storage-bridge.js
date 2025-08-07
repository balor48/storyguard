// Storage Bridge Script - Ensures Storage functions are available
console.log('Storage bridge script loaded');

(function() {
    // Check if Storage object exists
    function checkStorageObject() {
        console.log('Storage bridge checking for Storage object...');
        
        if (!window.Storage) {
            console.warn('Storage object not found in global scope, creating it');
            window.Storage = {};
        }

        // Try to load essential functions from the storage/settings module
        try {
            // Import essential settings functions if available
            if (window.Storage && !window.Storage.showSettingsDialog) {
                const settingsModule = window.StorageSettings || {};
                
                if (typeof settingsModule.showSettingsDialog === 'function') {
                    window.Storage.showSettingsDialog = settingsModule.showSettingsDialog;
                    console.log('Successfully imported showSettingsDialog from settings module');
                } else {
                    console.warn('showSettingsDialog function not found in StorageSettings module');
                }
            }
            
            // Log the status of key Storage functions
            console.log('Storage functions availability status:');
            console.log('- importDatabase:', typeof window.Storage.importDatabase === 'function' ? 'Available ✓' : 'Not available ✗');
            console.log('- exportDatabase:', typeof window.Storage.exportDatabase === 'function' ? 'Available ✓' : 'Not available ✗');
            console.log('- backupDatabase:', typeof window.Storage.backupDatabase === 'function' ? 'Available ✓' : 'Not available ✗');
            
            console.log('Storage bridge initialization complete');
        } catch (error) {
            console.error('Error in storage bridge:', error);
        }
    }

    // Wait for DOMContentLoaded to check for Storage
    document.addEventListener('DOMContentLoaded', function() {
        // Add a small delay to ensure Storage module has been loaded
        setTimeout(checkStorageObject, 500);
    });

    // Also check immediately in case the DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(checkStorageObject, 500);
    }
})();
