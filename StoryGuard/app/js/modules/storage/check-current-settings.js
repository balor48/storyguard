// Function to consolidate auto-backup settings
function consolidateAutoBackupSettings() {
    // Default values
    const defaults = {
        enableAutoBackup: false,
        backupInterval: 30,
        autoBackupInterval: 30
    };

    // Get current settings with error handling
    let settings;
    try {
        settings = loadSettings() || {};
    } catch (e) {
        console.error('Error loading settings:', e);
        settings = {};
    }

    // Get localStorage values with error handling
    let localStorageValues = {};
    try {
        localStorageValues = {
            enableAutoBackup: localStorage.getItem('enableAutoBackup'),
            backupInterval: localStorage.getItem('backupInterval'),
            autoBackupInterval: localStorage.getItem('autoBackupInterval')
        };
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        localStorageValues = {};
    }

    // Log current values for debugging
    console.log('Current settings:', {
        settingsJson: settings,
        localStorage: localStorageValues,
        defaults: defaults
    });

    // Consolidate values with proper type conversion
    const consolidated = {
        enableAutoBackup: settings.enableAutoBackup ?? (localStorageValues.enableAutoBackup === 'true') ?? defaults.enableAutoBackup,
        backupInterval: settings.backupInterval ?? (parseInt(localStorageValues.backupInterval) || defaults.backupInterval),
        autoBackupInterval: settings.autoBackupInterval ?? (parseInt(localStorageValues.autoBackupInterval) || defaults.autoBackupInterval)
    };

    // Save consolidated values back to both locations with error handling
    try {
        // Save to localStorage
        localStorage.setItem('enableAutoBackup', consolidated.enableAutoBackup.toString());
        localStorage.setItem('backupInterval', consolidated.backupInterval.toString());
        localStorage.setItem('autoBackupInterval', consolidated.autoBackupInterval.toString());

        // Update settings object and save
        settings.enableAutoBackup = consolidated.enableAutoBackup;
        settings.backupInterval = consolidated.backupInterval;
        settings.autoBackupInterval = consolidated.autoBackupInterval;
        saveSettings(settings);

        console.log('Auto-backup settings consolidated successfully:', consolidated);
    } catch (e) {
        console.error('Error saving consolidated settings:', e);
    }

    return consolidated;
}

// Initialize settings with retry logic
let retryCount = 0;
const maxRetries = 3;

function initializeSettings() {
    try {
        const settings = consolidateAutoBackupSettings();
        console.log('Settings initialized:', settings);
    } catch (e) {
        console.error('Error initializing settings:', e);
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying settings initialization (${retryCount}/${maxRetries})...`);
            setTimeout(initializeSettings, 1000);
        }
    }
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSettings); 