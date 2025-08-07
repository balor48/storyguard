// IMPROVED Auto-backup fix script
// This version fixes issues with multiple toast notifications and allows for shorter backup intervals
(function() {
    console.log('IMPROVED AUTO-BACKUP FIX SCRIPT LOADED');
    
    // Single global timer reference to prevent conflicts
    window.MASTER_AUTO_BACKUP_TIMER = null;
    
    // Track the last backup time to prevent duplicates
    let lastBackupTime = 0;
    const BACKUP_COOLDOWN = 10000; // 10 seconds cooldown between backups
    
    // Log any existing timers and clear them
    if (window.autoBackupTimer) {
        console.log('Found existing window.autoBackupTimer - clearing it');
        clearInterval(window.autoBackupTimer);
        window.autoBackupTimer = null;
    }
    
    // Function to get settings from ALL possible sources
    function getMasterAutoBackupSettings() {
        // Default settings
        const defaults = {
            enabled: false,
            interval: 30 // minutes
        };
        
        try {
            console.log('Reading consolidated auto-backup settings');
            
            // Try multiple ways to get the settings in order of preference
            const directEnabled = localStorage.getItem('enableAutoBackup');
            const directInterval = localStorage.getItem('backupInterval');
            
            // Also check settings JSON object (the correct way)
            let jsonSettings = null;
            try {
                const settingsJson = localStorage.getItem('settings');
                if (settingsJson) {
                    const settings = JSON.parse(settingsJson);
                    if (settings && typeof settings === 'object') {
                        jsonSettings = {
                            enabled: settings.enableAutoBackup === true,
                            interval: parseInt(settings.backupInterval || settings.autoBackupInterval, 10) || defaults.interval
                        };
                    }
                }
            } catch (e) {
                console.error('Error parsing settings JSON:', e);
            }
            
            // Use settings in order of precedence
            if (directEnabled !== null) {
                console.log('Using direct localStorage settings: enabled=' + directEnabled);
                return {
                    enabled: directEnabled === 'true',
                    interval: directInterval ? parseInt(directInterval, 10) : defaults.interval
                };
            } else if (jsonSettings) {
                console.log('Using settings from JSON: enabled=' + jsonSettings.enabled);
                return jsonSettings;
            }
            
            console.log('No settings found, using defaults: enabled=false');
            return defaults;
        } catch (err) {
            console.error('Error reading master auto-backup settings:', err);
            return defaults;
        }
    }
    
    // Function to perform auto backup
    function performMasterAutoBackup() {
        console.log('MASTER Auto-backup triggered');
        
        // Check if we're within the cooldown period
        const now = Date.now();
        if (now - lastBackupTime < BACKUP_COOLDOWN) {
            console.log('Backup skipped - within cooldown period');
            return;
        }
        
        try {
            // First check if we have Storage.backupDatabase
            if (window.Storage && typeof window.Storage.backupDatabase === 'function') {
                // Update the last backup time
                lastBackupTime = now;
                
                // Set a flag to indicate this is an auto-backup
                window.isAutoBackupInProgress = true;
                
                // Perform the backup - pass true as second parameter to indicate this is from auto-backup
                window.Storage.backupDatabase(false, true);
                console.log('MASTER Auto-backup completed via Storage.backupDatabase');
                
                // Remove toast notification from here to prevent duplicates
                // The backup-directory-fix.js or other components will handle showing the toast
                
                // Clear the flag
                setTimeout(() => {
                    window.isAutoBackupInProgress = false;
                }, 1000);
            } else {
                console.error('Storage.backupDatabase not found for auto-backup');
            }
        } catch (err) {
            console.error('Error in MASTER auto-backup:', err);
            // Show error toast if available
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Auto-backup failed: ' + err.message, 'error');
            }
            // Clear the flag in case of error
            window.isAutoBackupInProgress = false;
        }
    }
    
    // Function to start/restart the master auto-backup timer
    function startMasterAutoBackupTimer() {
        // FIRST, ensure no other timers are running anywhere in the app
        if (window.autoBackupTimer) {
            console.log('Clearing any existing window.autoBackupTimer');
            clearInterval(window.autoBackupTimer);
            window.autoBackupTimer = null;
        }
        
        if (window.MASTER_AUTO_BACKUP_TIMER) {
            console.log('Clearing existing MASTER_AUTO_BACKUP_TIMER');
            clearInterval(window.MASTER_AUTO_BACKUP_TIMER);
            window.MASTER_AUTO_BACKUP_TIMER = null;
        }
        
        // Get settings
        const settings = getMasterAutoBackupSettings();
        console.log('MASTER auto-backup settings for timer:', settings);
        
        // Only start timer if enabled
        if (!settings.enabled) {
            console.log('MASTER auto-backup is disabled, not starting timer');
            return;
        }
        
        // Get the interval with more detailed logging
        console.log('Raw interval value from settings:', settings.interval);
        
        // Allow any interval value, but use a minimum of 1 minute for safety
        const intervalMinutes = settings.interval ? parseInt(settings.interval, 10) : 30;
        const validIntervalMinutes = isNaN(intervalMinutes) || intervalMinutes < 1 ? 30 : intervalMinutes;
        const intervalMs = validIntervalMinutes * 60 * 1000;
        
        // Start the NEW MASTER timer with better logging
        console.log(`Starting MASTER auto-backup timer with interval: ${validIntervalMinutes} minutes (${intervalMs}ms)`);
        window.MASTER_AUTO_BACKUP_TIMER = setInterval(performMasterAutoBackup, intervalMs);
    }
    
    // Function to specifically handle saving from settings dialog
    function saveMasterAutoBackupSettings() {
        console.log('Saving MASTER auto-backup settings');
        
        // Find elements in settings dialog
        const enableCheckbox = document.getElementById('enableAutoBackup');
        const intervalInput = document.getElementById('backupInterval');
        
        if (enableCheckbox && intervalInput) {
            const enabled = enableCheckbox.checked;
            
            // CRITICAL BUG FIX: More thorough logging of what we're actually saving
            const rawIntervalValue = intervalInput.value;
            console.log(`Raw interval input value: "${rawIntervalValue}"`);
            
            // Parse the interval value or use default
            const interval = parseInt(rawIntervalValue, 10);
            const finalInterval = isNaN(interval) ? 30 : interval;
            
            console.log(`CRITICAL DEBUG - Saving settings: enabled=${enabled}, parsed interval=${finalInterval} (from raw value: "${rawIntervalValue}")`);
            
            // 1. Save to direct localStorage (for this script) - as string so it's visible in debugging
            localStorage.setItem('enableAutoBackup', String(enabled));
            localStorage.setItem('backupInterval', String(finalInterval));
            localStorage.setItem('autoBackupInterval', String(finalInterval));
            
            // 2. Also update the settings JSON
            try {
                let settings = {};
                const settingsJson = localStorage.getItem('settings');
                if (settingsJson) {
                    settings = JSON.parse(settingsJson);
                }
                
                // Update with ALL possible keys for maximum compatibility
                // FIXED: Use finalInterval not interval to ensure we get the correctly parsed value
                settings.enableAutoBackup = enabled;
                settings.backupInterval = finalInterval;
                settings.autoBackupInterval = finalInterval; // For compatibility with older code
                
                // Extra logging for debugging
                console.log('JSON settings before save:', settings);
                
                // Save settings object
                localStorage.setItem('settings', JSON.stringify(settings));
                console.log('Updated settings JSON object with auto-backup settings');
            } catch (e) {
                console.error('Error updating settings JSON:', e);
            }
        } else {
            console.log('Could not find enableAutoBackup or backupInterval elements in dialog');
        }
    }
    
    // Function to fix the settings dialog
    function fixSettingsDialog() {
        console.log('Setting up MASTER auto-backup settings dialog fixes');
        
        // Look for the save button and add our handler
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            // Add our own handler to ensure settings are saved
            saveButton.addEventListener('click', function() {
                console.log('Save button clicked, saving MASTER auto-backup settings');
                saveMasterAutoBackupSettings();
                // Restart timer with new settings
                setTimeout(startMasterAutoBackupTimer, 100);
            });
            console.log('Added MASTER auto-backup save handler');
        }
        
        // Set initial UI state
        const settings = getMasterAutoBackupSettings();
        
        const enableCheckbox = document.getElementById('enableAutoBackup');
        if (enableCheckbox) {
            enableCheckbox.checked = settings.enabled;
            console.log('Set checkbox to', settings.enabled);
        }
        
        const intervalInput = document.getElementById('backupInterval');
        if (intervalInput) {
            intervalInput.value = settings.interval || 30;
            console.log('Set interval to', settings.interval);
        }
    }
    
    // Main initialization function
    function initialize() {
        console.log('Initializing IMPROVED MASTER auto-backup system');
        
        // Start the global auto-backup timer
        startMasterAutoBackupTimer();
        
        // If we're in the settings dialog, fix it
        if (document.getElementById('enableAutoBackup')) {
            fixSettingsDialog();
        }
        
        // Listen for storage events
        window.addEventListener('storage', function(event) {
            if (event.key === 'enableAutoBackup' || event.key === 'backupInterval' || event.key === 'settings') {
                console.log('Storage changed, restarting MASTER auto-backup timer');
                startMasterAutoBackupTimer();
            }
        });
        
        // Periodic check to ensure timer is running
        setInterval(function() {
            const settings = getMasterAutoBackupSettings();
            
            // Extra debugging to see what's happening with the timer
            console.log('Timer check running. Current settings:', settings, 
                       'MASTER_AUTO_BACKUP_TIMER exists:', !!window.MASTER_AUTO_BACKUP_TIMER);
            
            if (settings.enabled && !window.MASTER_AUTO_BACKUP_TIMER) {
                console.log('WARNING: Auto-backup enabled but timer not running, restarting');
                startMasterAutoBackupTimer();
            }
        }, 300000); // Every 5 minutes
    }
    
    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM already loaded, run now
        initialize();
    }
    
    // Export functions to window for debugging
    window.MASTER_AUTO_BACKUP = {
        getSettings: getMasterAutoBackupSettings,
        start: startMasterAutoBackupTimer,
        perform: performMasterAutoBackup
    };
    
    console.log('IMPROVED MASTER auto-backup fix loaded successfully');
})(); 