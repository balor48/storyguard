// Runs at page load to log the current settings
document.addEventListener('DOMContentLoaded', function() {
    console.log('CHECKING CURRENT AUTO-BACKUP SETTINGS AT LOAD TIME:');
    
    // Direct localStorage values
    const enabledValue = localStorage.getItem('enableAutoBackup');
    const intervalValue = localStorage.getItem('backupInterval');
    const altIntervalValue = localStorage.getItem('autoBackupInterval');
    
    console.log('Direct localStorage values at load time:');
    console.log('- enableAutoBackup:', enabledValue);
    console.log('- backupInterval:', intervalValue);
    console.log('- autoBackupInterval:', altIntervalValue);
    
    // Settings JSON object
    try {
        const settingsJson = localStorage.getItem('settings');
        if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            console.log('Settings JSON object at load time:');
            console.log('- enableAutoBackup:', settings.enableAutoBackup);
            console.log('- backupInterval:', settings.backupInterval);
            console.log('- autoBackupInterval:', settings.autoBackupInterval);
            
            // MOST IMPORTANT: Check if the settings properly match what's expected
            console.log('\nCOMPARISON ANALYSIS:');
            let mismatchDetected = false;
            
            if (enabledValue !== String(settings.enableAutoBackup)) {
                console.error('MISMATCH: enableAutoBackup in localStorage vs settings JSON!');
                console.error(`  - localStorage: ${enabledValue}`);
                console.error(`  - settings JSON: ${settings.enableAutoBackup}`);
                mismatchDetected = true;
            }
            
            if (intervalValue !== String(settings.backupInterval)) {
                console.error('MISMATCH: backupInterval in localStorage vs settings JSON!');
                console.error(`  - localStorage: ${intervalValue}`);
                console.error(`  - settings JSON: ${settings.backupInterval}`);
                mismatchDetected = true;
            }
            
            if (altIntervalValue !== String(settings.autoBackupInterval)) {
                console.error('MISMATCH: autoBackupInterval in localStorage vs settings JSON!');
                console.error(`  - localStorage: ${altIntervalValue}`);
                console.error(`  - settings JSON: ${settings.autoBackupInterval}`);
                mismatchDetected = true;
            }
            
            // If a mismatch was detected, try to synchronize settings
            if (mismatchDetected) {
                console.log('Attempting to fix settings mismatch...');
                if (typeof window.synchronizeSettings === 'function') {
                    window.synchronizeSettings();
                    console.log('Settings synchronization function called');
                } else {
                    console.log('Settings synchronization function not available yet');
                    // Try again after a delay
                    setTimeout(function() {
                        if (typeof window.synchronizeSettings === 'function') {
                            window.synchronizeSettings();
                            console.log('Settings synchronization function called after delay');
                        } else {
                            console.error('Settings synchronization function still not available');
                        }
                    }, 2000);
                }
            } else {
                console.log('All settings are properly synchronized');
            }
        } else {
            console.log('No settings JSON object found in localStorage at load time');
        }
    } catch (e) {
        console.error('Error parsing settings JSON at load time:', e);
    }
    
    // Set up a listener for our debugging window
    window.addEventListener('check-settings-now', function() {
        console.log('CHECKING CURRENT AUTO-BACKUP SETTINGS NOW:');
        
        // Get current values from localStorage
        const enabledValueNow = localStorage.getItem('enableAutoBackup');
        const intervalValueNow = localStorage.getItem('backupInterval');
        const altIntervalValueNow = localStorage.getItem('autoBackupInterval');
        
        console.log('Direct localStorage values NOW:');
        console.log('- enableAutoBackup:', enabledValueNow);
        console.log('- backupInterval:', intervalValueNow);
        console.log('- autoBackupInterval:', altIntervalValueNow);
        
        // Settings JSON object
        try {
            const settingsJsonNow = localStorage.getItem('settings');
            if (settingsJsonNow) {
                const settingsNow = JSON.parse(settingsJsonNow);
                console.log('Settings JSON object NOW:');
                console.log('- enableAutoBackup:', settingsNow.enableAutoBackup);
                console.log('- backupInterval:', settingsNow.backupInterval);
                console.log('- autoBackupInterval:', settingsNow.autoBackupInterval);
                
                // Check if settings are synchronized
                let mismatchDetected = false;
                if (enabledValueNow !== String(settingsNow.enableAutoBackup) ||
                    intervalValueNow !== String(settingsNow.backupInterval) ||
                    altIntervalValueNow !== String(settingsNow.autoBackupInterval)) {
                    console.error('MISMATCH DETECTED: Settings are not synchronized');
                    mismatchDetected = true;
                }
                
                // Try to synchronize if needed
                if (mismatchDetected && typeof window.synchronizeSettings === 'function') {
                    window.synchronizeSettings();
                    console.log('Settings synchronization function called');
                }
            } else {
                console.log('No settings JSON object found in localStorage NOW');
            }
        } catch (e) {
            console.error('Error parsing settings JSON NOW:', e);
        }
        
        console.log('\nCURRENT ACTIVE SETTINGS:');
        console.log('Auto-backup enabled:', enabledValueNow === 'true');
        console.log('Backup interval:', intervalValueNow || altIntervalValueNow || '30 (default)');
    });
    
    // ALSO check the MASTER_AUTO_BACKUP timer status
    window.setTimeout(function() {
        // Log the current state of the MASTER timer
        console.log('MASTER auto-backup timer state:');
        console.log('- MASTER_AUTO_BACKUP_TIMER exists:', !!window.MASTER_AUTO_BACKUP_TIMER);
        console.log('- autoBackupTimer exists:', !!window.autoBackupTimer);
        
        // Check the settings used by the timer
        if (window.MASTER_AUTO_BACKUP && window.MASTER_AUTO_BACKUP.getSettings) {
            const timerSettings = window.MASTER_AUTO_BACKUP.getSettings();
            console.log('Settings used by MASTER timer:');
            console.log('- enabled:', timerSettings.enabled);
            console.log('- interval:', timerSettings.interval);
        }
    }, 2000); // Wait 2 seconds to ensure timer is initialized
});

console.log('check-current-settings.js loaded');
