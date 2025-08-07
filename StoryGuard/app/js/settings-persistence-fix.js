// Settings Persistence Fix - Prevents auto-backup settings from being reset when loading databases
console.log('Settings persistence fix script loaded');

(function() {
    // Function to save current auto-backup settings before database operations
    function saveCurrentAutoBackupSettings() {
        console.log('Saving current auto-backup settings for persistence');
        
        // Get current auto-backup settings from localStorage
        const enabledValue = localStorage.getItem('enableAutoBackup');
        const intervalValue = localStorage.getItem('backupInterval');
        const autoIntervalValue = localStorage.getItem('autoBackupInterval');
        
        // Store them in sessionStorage for temporary safe keeping
        if (enabledValue !== null) {
            sessionStorage.setItem('savedEnableAutoBackup', enabledValue);
            console.log('Saved enableAutoBackup:', enabledValue);
        }
        
        if (intervalValue !== null) {
            sessionStorage.setItem('savedBackupInterval', intervalValue);
            console.log('Saved backupInterval:', intervalValue);
        }
        
        if (autoIntervalValue !== null) {
            sessionStorage.setItem('savedAutoBackupInterval', autoIntervalValue);
            console.log('Saved autoBackupInterval:', autoIntervalValue);
        }
        
        // Also check settings JSON
        try {
            const settingsJson = localStorage.getItem('settings');
            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                sessionStorage.setItem('savedSettingsJson', JSON.stringify({
                    enableAutoBackup: settings.enableAutoBackup,
                    backupInterval: settings.backupInterval,
                    autoBackupInterval: settings.autoBackupInterval
                }));
                console.log('Saved settings JSON backup values');
            }
        } catch (e) {
            console.error('Error saving settings JSON backup:', e);
        }
    }
    
    // Function to restore saved auto-backup settings after database operations
    function restoreAutoBackupSettings() {
        console.log('Restoring saved auto-backup settings');
        
        // Get saved settings from sessionStorage
        const savedEnabled = sessionStorage.getItem('savedEnableAutoBackup');
        const savedInterval = sessionStorage.getItem('savedBackupInterval');
        const savedAutoInterval = sessionStorage.getItem('savedAutoBackupInterval');
        const savedSettingsJson = sessionStorage.getItem('savedSettingsJson');
        
        // Restore direct localStorage values if they exist
        if (savedEnabled !== null) {
            localStorage.setItem('enableAutoBackup', savedEnabled);
            console.log('Restored enableAutoBackup:', savedEnabled);
        }
        
        if (savedInterval !== null) {
            localStorage.setItem('backupInterval', savedInterval);
            console.log('Restored backupInterval:', savedInterval);
        }
        
        if (savedAutoInterval !== null) {
            localStorage.setItem('autoBackupInterval', savedAutoInterval);
            console.log('Restored autoBackupInterval:', savedAutoInterval);
        }
        
        // Restore settings in the settings JSON object
        if (savedSettingsJson) {
            try {
                const savedSettings = JSON.parse(savedSettingsJson);
                const currentSettingsJson = localStorage.getItem('settings');
                
                if (currentSettingsJson) {
                    const currentSettings = JSON.parse(currentSettingsJson);
                    
                    // Merge saved auto-backup settings into current settings
                    currentSettings.enableAutoBackup = savedSettings.enableAutoBackup;
                    currentSettings.backupInterval = savedSettings.backupInterval;
                    currentSettings.autoBackupInterval = savedSettings.autoBackupInterval;
                    
                    // Save the merged settings back to localStorage
                    localStorage.setItem('settings', JSON.stringify(currentSettings));
                    console.log('Restored auto-backup settings in settings JSON');
                }
            } catch (e) {
                console.error('Error restoring settings JSON:', e);
            }
        }
        
        // If we have a MASTER_AUTO_BACKUP system, restart it with the restored settings
        if (window.MASTER_AUTO_BACKUP && window.MASTER_AUTO_BACKUP.start) {
            setTimeout(() => {
                console.log('Restarting MASTER auto-backup timer with restored settings');
                window.MASTER_AUTO_BACKUP.start();
            }, 500);
        }
    }
    
    // Override loadDatabase to preserve auto-backup settings
    const originalLoadDatabase = window.loadDatabase;
    if (typeof originalLoadDatabase === 'function') {
        window.loadDatabase = function(callback) {
            console.log('Overridden loadDatabase called, preserving settings');
            
            // Save current auto-backup settings
            saveCurrentAutoBackupSettings();
            
            // Call original loadDatabase
            const result = originalLoadDatabase.call(this, function(database, error) {
                if (database) {
                    // Database loaded successfully, restore auto-backup settings
                    setTimeout(restoreAutoBackupSettings, 100);
                }
                
                // Call original callback
                if (typeof callback === 'function') {
                    callback(database, error);
                }
            });
            
            return result;
        };
        console.log('Successfully overrode loadDatabase to preserve settings');
    }
    
    // Also intercept Storage.loadDatabase if it exists or when it's created
    if (window.Storage) {
        if (typeof window.Storage.loadDatabase === 'function') {
            const originalStorageLoadDatabase = window.Storage.loadDatabase;
            window.Storage.loadDatabase = function(callback) {
                console.log('Overridden Storage.loadDatabase called, preserving settings');
                
                // Save current auto-backup settings
                saveCurrentAutoBackupSettings();
                
                // Call original Storage.loadDatabase
                return originalStorageLoadDatabase.call(this, function(database, error) {
                    if (database) {
                        // Database loaded successfully, restore auto-backup settings
                        setTimeout(restoreAutoBackupSettings, 100);
                    }
                    
                    // Call original callback
                    if (typeof callback === 'function') {
                        callback(database, error);
                    }
                });
            };
            console.log('Successfully overrode Storage.loadDatabase to preserve settings');
        }
    }
    
    // Set up a listener for Storage object creation
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit to ensure Storage is loaded
        setTimeout(() => {
            if (window.Storage && typeof window.Storage.loadDatabase === 'function' && 
                !window.Storage.loadDatabase.isOverridden) {
                
                console.log('Late override of Storage.loadDatabase');
                const originalStorageLoadDatabase = window.Storage.loadDatabase;
                window.Storage.loadDatabase = function(callback) {
                    console.log('Late overridden Storage.loadDatabase called, preserving settings');
                    
                    // Save current auto-backup settings
                    saveCurrentAutoBackupSettings();
                    
                    // Call original Storage.loadDatabase
                    return originalStorageLoadDatabase.call(this, function(database, error) {
                        if (database) {
                            // Database loaded successfully, restore auto-backup settings
                            setTimeout(restoreAutoBackupSettings, 100);
                        }
                        
                        // Call original callback
                        if (typeof callback === 'function') {
                            callback(database, error);
                        }
                    });
                };
                window.Storage.loadDatabase.isOverridden = true;
                console.log('Successfully completed late override of Storage.loadDatabase');
            }
        }, 1000);
    });
    
    // Initial restoration (for page loads/refreshes)
    document.addEventListener('DOMContentLoaded', () => {
        // Wait to let the normal initialization complete
        setTimeout(() => {
            // Only restore if we have saved settings
            if (sessionStorage.getItem('savedEnableAutoBackup') || 
                sessionStorage.getItem('savedBackupInterval') ||
                sessionStorage.getItem('savedSettingsJson')) {
                
                console.log('Restoring saved settings on page load');
                restoreAutoBackupSettings();
            }
        }, 1500);
    });
    
    // Also preserve settings during importDatabase operations
    const setupImportDatabaseOverride = () => {
        if (window.Storage && typeof window.Storage.importDatabase === 'function' &&
            !window.Storage.importDatabase.isOverridden) {
            
            const originalImportDatabase = window.Storage.importDatabase;
            window.Storage.importDatabase = function(...args) {
                console.log('Overridden importDatabase called, preserving settings');
                
                // Save current auto-backup settings
                saveCurrentAutoBackupSettings();
                
                // Call original importDatabase
                const result = originalImportDatabase.apply(this, args);
                
                // Restore settings after a delay
                setTimeout(restoreAutoBackupSettings, 500);
                
                return result;
            };
            window.Storage.importDatabase.isOverridden = true;
            console.log('Successfully overrode importDatabase to preserve settings');
        }
    };
    
    // Try immediately and also later when Storage may be fully loaded
    setupImportDatabaseOverride();
    setTimeout(setupImportDatabaseOverride, 2000);
})();
