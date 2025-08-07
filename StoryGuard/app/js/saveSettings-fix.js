// Define saveSettings function for global scope
// This fixes the reference error in storage-function-fix.js

console.log('SaveSettings fix script loaded');

(function() {
    // Define saveSettings in the global scope so it's available for storage-function-fix.js
    if (typeof window.saveSettings !== 'function') {
        window.saveSettings = function(settings) {
            console.log('Global saveSettings function called');
            try {
                // CRITICAL FIX: Ensure both backup interval keys are included
                if (settings && (settings.backupInterval || settings.autoBackupInterval)) {
                    // If either interval is present, sync them
                    const intervalValue = settings.backupInterval || settings.autoBackupInterval;
                    settings.backupInterval = intervalValue;
                    settings.autoBackupInterval = intervalValue;
                    
                    // Also save them directly in localStorage for maximum compatibility
                    localStorage.setItem('backupInterval', intervalValue);
                    localStorage.setItem('autoBackupInterval', intervalValue);
                    
                    console.log('Synced both backup interval variants to:', intervalValue);
                }
                
                localStorage.setItem('settings', JSON.stringify(settings));
                console.log('Settings saved successfully via global function');
                
                // Also save to Storage object if it exists
                if (window.Storage) {
                    if (typeof window.Storage.saveSettings === 'function') {
                        // Already exists, no need to do anything
                        console.log('Storage.saveSettings already exists');
                    } else {
                        // Add it to Storage
                        window.Storage.saveSettings = function(settings) {
                            // Same critical fix as the global function
                            if (settings && (settings.backupInterval || settings.autoBackupInterval)) {
                                // If either interval is present, sync them
                                const intervalValue = settings.backupInterval || settings.autoBackupInterval;
                                settings.backupInterval = intervalValue;
                                settings.autoBackupInterval = intervalValue;
                                
                                // Also save them directly in localStorage
                                localStorage.setItem('backupInterval', intervalValue);
                                localStorage.setItem('autoBackupInterval', intervalValue);
                                
                                console.log('Storage.saveSettings: Synced intervals to:', intervalValue);
                            }
                            
                            // Check for enableAutoBackup as well
                            if (settings && settings.hasOwnProperty('enableAutoBackup')) {
                                localStorage.setItem('enableAutoBackup', settings.enableAutoBackup);
                                console.log('Storage.saveSettings: Saved enableAutoBackup:', settings.enableAutoBackup);
                            }
                            
                            localStorage.setItem('settings', JSON.stringify(settings));
                            console.log('Settings saved successfully via Storage.saveSettings');
                            return true;
                        };
                        console.log('Added saveSettings to Storage object');
                    }
                }
                
                return true;
            } catch (error) {
                console.error('Error saving settings:', error);
                return false;
            }
        };
        console.log('Global saveSettings function defined');
    }
    
    // Also define loadSettings for completeness
    if (typeof window.loadSettings !== 'function') {
        window.loadSettings = function() {
            try {
                // Try to get settings from localStorage
                const settingsJson = localStorage.getItem('settings');
                if (settingsJson) {
                    return JSON.parse(settingsJson);
                }
                
                // Return default settings if none found
                return {
                    theme: 'system',
                    fontSize: 'medium',
                    databaseDirectory: '',
                    enableAutoBackup: true,
                    autoBackupInterval: 30, // minutes
                    backupInterval: 30, // CRITICAL: Include both names for compatibility
                    backupDirectory: '',
                    enableLocalBackup: true,
                    enableCloudBackup: false,
                    enableCloudSync: false,
                    cloudProvider: 'none'
                };
            } catch (error) {
                console.error('Error loading settings:', error);
                return {
                    theme: 'system',
                    fontSize: 'medium',
                    databaseDirectory: '',
                    enableAutoBackup: true,
                    autoBackupInterval: 30, // minutes
                    backupInterval: 30, // CRITICAL: Include both names for compatibility
                    backupDirectory: '',
                    enableLocalBackup: true,
                    enableCloudBackup: false,
                    enableCloudSync: false,
                    cloudProvider: 'none'
                };
            }
        };
        console.log('Global loadSettings function defined');
    }
    
    // Make sure the Storage object has the settings functions
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit to ensure Storage is loaded
        setTimeout(() => {
            // Try to get StorageSettings module
            const StorageSettings = window.StorageSettings || {};
            
            // Attach settings functions to Storage object
            if (window.Storage) {
                // Prefer the StorageSettings module functions if available
                if (StorageSettings.showSettingsDialog) {
                    window.Storage.showSettingsDialog = StorageSettings.showSettingsDialog;
                    console.log('Attached showSettingsDialog from StorageSettings module');
                }
                
                if (StorageSettings.saveSettings) {
                    window.Storage.saveSettings = StorageSettings.saveSettings;
                    console.log('Attached saveSettings from StorageSettings module');
                } else if (typeof window.Storage.saveSettings !== 'function') {
                    window.Storage.saveSettings = window.saveSettings;
                    console.log('Attached global saveSettings to Storage object');
                }
                
                if (StorageSettings.loadSettings) {
                    window.Storage.loadSettings = StorageSettings.loadSettings;
                    console.log('Attached loadSettings from StorageSettings module');
                } else if (typeof window.Storage.loadSettings !== 'function') {
                    window.Storage.loadSettings = window.loadSettings;
                    console.log('Attached global loadSettings to Storage object');
                }
            }
        }, 500);
    });
})();
