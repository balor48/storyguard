// Settings Synchronization Fix
// This script ensures that settings in localStorage and the settings JSON object are synchronized

(function() {
    console.log('Settings Synchronization Fix loaded');

    // Function to synchronize settings
    function synchronizeSettings() {
        console.log('Synchronizing settings between localStorage and settings JSON...');
        
        try {
            // Get settings from JSON
            let settingsJson = localStorage.getItem('settings');
            let settings = {};
            
            if (settingsJson) {
                settings = JSON.parse(settingsJson);
            } else {
                // If no settings JSON exists, create default settings
                settings = {
                    theme: 'system',
                    fontSize: 'medium',
                    databaseDirectory: '',
                    enableAutoBackup: true,
                    autoBackupInterval: 30,
                    backupInterval: 30,
                    backupDirectory: '',
                    enableLocalBackup: true,
                    enableCloudBackup: false,
                    enableCloudSync: false,
                    cloudProvider: 'none'
                };
            }
            
            // Get direct localStorage values
            const directEnabledValue = localStorage.getItem('enableAutoBackup');
            const directIntervalValue = localStorage.getItem('backupInterval');
            const directAltIntervalValue = localStorage.getItem('autoBackupInterval');
            
            // Log current values
            console.log('Current settings:');
            console.log('- JSON settings.enableAutoBackup:', settings.enableAutoBackup);
            console.log('- JSON settings.backupInterval:', settings.backupInterval);
            console.log('- JSON settings.autoBackupInterval:', settings.autoBackupInterval);
            console.log('- localStorage enableAutoBackup:', directEnabledValue);
            console.log('- localStorage backupInterval:', directIntervalValue);
            console.log('- localStorage autoBackupInterval:', directAltIntervalValue);
            
            // Determine which values to use (prefer localStorage direct values if they exist)
            let enabledValue = settings.enableAutoBackup;
            if (directEnabledValue !== null) {
                enabledValue = directEnabledValue === 'true';
            }
            
            let intervalValue = settings.backupInterval || settings.autoBackupInterval || 30;
            if (directIntervalValue !== null) {
                intervalValue = parseInt(directIntervalValue, 10) || 30;
            } else if (directAltIntervalValue !== null) {
                intervalValue = parseInt(directAltIntervalValue, 10) || 30;
            }
            
            // Update settings object
            settings.enableAutoBackup = enabledValue;
            settings.backupInterval = intervalValue;
            settings.autoBackupInterval = intervalValue;
            
            // Save updated settings to JSON
            localStorage.setItem('settings', JSON.stringify(settings));
            
            // Also update direct localStorage values
            localStorage.setItem('enableAutoBackup', String(enabledValue));
            localStorage.setItem('backupInterval', String(intervalValue));
            localStorage.setItem('autoBackupInterval', String(intervalValue));
            
            console.log('Settings synchronized successfully:');
            console.log('- enableAutoBackup:', enabledValue);
            console.log('- backupInterval:', intervalValue);
            console.log('- autoBackupInterval:', intervalValue);
            
            return true;
        } catch (error) {
            console.error('Error synchronizing settings:', error);
            return false;
        }
    }
    
    // Run synchronization on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a short time to ensure all other scripts have loaded
        setTimeout(function() {
            synchronizeSettings();
        }, 1000);
    });
    
    // Expose the synchronization function globally
    window.synchronizeSettings = synchronizeSettings;
    
    // Add a listener for settings changes
    window.addEventListener('storage', function(event) {
        if (event.key === 'settings' || 
            event.key === 'enableAutoBackup' || 
            event.key === 'backupInterval' || 
            event.key === 'autoBackupInterval') {
            console.log('Settings changed, synchronizing...');
            synchronizeSettings();
        }
    });
    
    // Patch the saveSettings function to ensure synchronization
    const originalSaveSettings = window.saveSettings;
    if (typeof originalSaveSettings === 'function') {
        window.saveSettings = function(settings) {
            const result = originalSaveSettings(settings);
            synchronizeSettings();
            return result;
        };
        console.log('Patched global saveSettings function');
    }
    
    // Also patch Storage.saveSettings if it exists
    if (window.Storage && typeof window.Storage.saveSettings === 'function') {
        const originalStorageSaveSettings = window.Storage.saveSettings;
        window.Storage.saveSettings = function(settings) {
            const result = originalStorageSaveSettings(settings);
            synchronizeSettings();
            return result;
        };
        console.log('Patched Storage.saveSettings function');
    }
})(); 