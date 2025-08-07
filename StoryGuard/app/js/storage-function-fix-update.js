// This script updates updateSettingsPaths to use showSettingsToast
// Fixes Cannot read properties of null (reading 'appendChild') error

(function() {
    // If Storage object exists
    if (window.Storage) {
        // Save the original updateSettingsPaths function if it exists
        const originalUpdateSettingsPaths = window.updateSettingsPaths;
        
        // Override the updateSettingsPaths function
        window.updateSettingsPaths = function() {
            try {
                // Get current settings
                if (localStorage.getItem('settings')) {
                    const settings = JSON.parse(localStorage.getItem('settings'));
                    let updated = false;
                    
                    // Check and update database directory
                    if (!settings.databaseDirectory || 
                        settings.databaseDirectory.includes('/app/') || 
                        settings.databaseDirectory.startsWith('/')) {
                        settings.databaseDirectory = window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database');
                        updated = true;
                        console.log('Updated database directory in settings');
                    }
                    
                    // Check and update backup directory
                    if (!settings.backupDirectory || 
                        settings.backupDirectory.includes('/app/') || 
                        settings.backupDirectory.startsWith('/')) {
                        settings.backupDirectory = window.api && window.api.getPaths ? window.api.getPaths().backup : path.join(app.getPath('userData'), 'backup');
                        updated = true;
                        console.log('Updated backup directory in settings');
                    }
                    
                    // Save updated settings
                    if (updated) {
                        localStorage.setItem('settings', JSON.stringify(settings));
                        console.log('Settings updated with correct paths');
                        
                        // Use showSettingsToast (log-only) rather than showToast (DOM-dependent)
                        if (window.Core && window.Core.showSettingsToast) {
                            window.Core.showSettingsToast('Settings updated with correct paths');
                        } else {
                            console.log('Settings updated with correct paths');
                        }
                    }
                } else {
                    // Create default settings
                    const defaultSettings = {
                        theme: 'dark',
                        fontSize: 'medium',
                        databaseDirectory: window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database'),
                        backupDirectory: window.api && window.api.getPaths ? window.api.getPaths().backup : path.join(app.getPath('userData'), 'backup'),
                        autoBackup: true,
                        backupFrequency: 'daily'
                    };
                    localStorage.setItem('settings', JSON.stringify(defaultSettings));
                    console.log('Created default settings');
                }
            } catch (error) {
                console.error('Error updating settings paths:', error);
            }
        };
        
        // Call the new function to ensure settings are updated
        try {
            window.updateSettingsPaths();
        } catch (error) {
            console.error('Error in updateSettingsPaths initialization:', error);
        }
        
        // Also update the function in the Storage object if it exists there
        if (window.Storage.updateSettingsPaths) {
            window.Storage.updateSettingsPaths = window.updateSettingsPaths;
        }
        
        console.log('Updated updateSettingsPaths with safer toast notification method');
    }
})();
