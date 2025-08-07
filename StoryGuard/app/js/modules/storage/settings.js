// Settings-related functions
let currentSettingsDialog = null;

function loadSettings() {
    try {
        // Try to get settings from localStorage
        const settingsJson = localStorage.getItem('settings');
        if (settingsJson) {
            return JSON.parse(settingsJson);
        }
        
        // Return default settings if none found
        return getDefaultSettings();
    } catch (error) {
        console.error('Error loading settings:', error);
        return getDefaultSettings();
    }
}

function saveSettings(settings) {
    try {
        localStorage.setItem('settings', JSON.stringify(settings));
        console.log('Settings saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

function getSettings() {
    return loadSettings();
}

function updateSettings(newSettings) {
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    return saveSettings(updatedSettings);
}

function showSettingsDialog() {
    console.log('Showing settings dialog...');
    
    // Prevent multiple dialogs
    if (currentSettingsDialog) {
        console.log('Settings dialog already open');
        return;
    }

    // Get current settings
    const settings = loadSettings();
    
    // Create a modal dialog for settings
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content settings-modal">
            <div class="modal-header">
                <h2>Settings</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h3>General</h3>
                    <div class="setting-item">
                        <label for="theme">Theme:</label>
                        <select id="theme">
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="fontSize">Font Size:</label>
                        <select id="fontSize">
                            <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                            <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Database</h3>
                    <div class="setting-item">
                        <label for="databaseDirectory">Database Directory:</label>
                        <div class="input-with-button">
                            <input type="text" id="databaseDirectory" value="${settings.databaseDirectory || ''}" readonly>
                            <button id="browseDatabaseDir" class="btn btn-secondary">Browse</button>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Documents</h3>
                    <div class="setting-item">
                        <label for="documentDirectory">Document Directory:</label>
                        <div class="input-with-button">
                            <input type="text" id="documentDirectory" value="${settings.documentDirectory || ''}" readonly>
                            <button id="browseDocumentDir" class="btn btn-secondary">Browse</button>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Backup</h3>
                    <div class="setting-item">
                        <label for="enableAutoBackup">
                            <input type="checkbox" id="enableAutoBackup" ${settings.enableAutoBackup ? 'checked' : ''}>
                            Enable Automatic Backups
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="autoBackupInterval">Backup Interval (minutes):</label>
                        <input type="number" id="autoBackupInterval" value="${settings.autoBackupInterval || 30}" min="5" max="1440">
                    </div>
                    <div class="setting-item">
                        <label for="backupDirectory">Backup Directory:</label>
                        <div class="input-with-button">
                            <input type="text" id="backupDirectory" value="${settings.backupDirectory || ''}" readonly>
                            <button id="browseBackupDir" class="btn btn-secondary">Browse</button>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label for="enableLocalBackup">
                            <input type="checkbox" id="enableLocalBackup" ${settings.enableLocalBackup ? 'checked' : ''}>
                            Enable Local Backups
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="enableCloudBackup">
                            <input type="checkbox" id="enableCloudBackup" ${settings.enableCloudBackup ? 'checked' : ''}>
                            Enable Cloud Backups
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Cloud Storage</h3>
                    <div class="setting-item">
                        <label for="enableCloudSync">
                            <input type="checkbox" id="enableCloudSync" ${settings.enableCloudSync ? 'checked' : ''}>
                            Enable Cloud Sync
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="cloudProvider">Cloud Provider:</label>
                        <select id="cloudProvider">
                            <option value="none" ${settings.cloudProvider === 'none' ? 'selected' : ''}>None</option>
                            <option value="google" ${settings.cloudProvider === 'google' ? 'selected' : ''}>Google Drive</option>
                            <option value="dropbox" ${settings.cloudProvider === 'dropbox' ? 'selected' : ''}>Dropbox</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="resetSettings" class="btn btn-danger">Reset to Defaults</button>
                <button id="saveSettings" class="btn btn-primary">Save</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    currentSettingsDialog = modal;
    
    // Show the modal
    modal.style.display = 'block';
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close');
    const saveBtn = modal.querySelector('#saveSettings');
    const resetBtn = modal.querySelector('#resetSettings');
    const browseDatabaseDirBtn = modal.querySelector('#browseDatabaseDir');
    const browseBackupDirBtn = modal.querySelector('#browseBackupDir');
    
    const removeModal = function() {
        if (currentSettingsDialog) {
            currentSettingsDialog.style.display = 'none';
            document.body.removeChild(currentSettingsDialog);
            currentSettingsDialog = null;
        }
    };
    
    closeBtn.addEventListener('click', removeModal, { once: true });
    
    // Save settings
    const saveSettings = function() {
        const newSettings = {
            theme: document.getElementById('theme').value,
            fontSize: document.getElementById('fontSize').value,
            databaseDirectory: document.getElementById('databaseDirectory').value,
            documentDirectory: document.getElementById('documentDirectory').value,
            enableAutoBackup: document.getElementById('enableAutoBackup').checked,
            // IMPORTANT: Save both backupInterval and autoBackupInterval with the same value
            // This ensures compatibility with both settings-dialog.html and auto-backup-fix.js
            autoBackupInterval: parseInt(document.getElementById('autoBackupInterval').value),
            backupInterval: parseInt(document.getElementById('autoBackupInterval').value),
            backupDirectory: document.getElementById('backupDirectory').value,
            enableLocalBackup: document.getElementById('enableLocalBackup').checked,
            enableCloudBackup: document.getElementById('enableCloudBackup').checked,
            enableCloudSync: document.getElementById('enableCloudSync').checked,
            cloudProvider: document.getElementById('cloudProvider').value
        };
        
        // Save the settings to localStorage
        updateSettings(newSettings);
        
        // Also save to settings.json via IPC if available
        if (window.api && window.api.saveSettings) {
            try {
                window.api.saveSettings(newSettings);
                console.log('Settings saved to settings.json via IPC');
            } catch (error) {
                console.error('Error saving settings to settings.json:', error);
            }
        }
        
        // Apply theme
        applyTheme(newSettings.theme);
        
        // Apply font size
        applyFontSize(newSettings.fontSize);
        
        // Restart auto backup timer if enabled
        if (newSettings.enableAutoBackup) {
            startAutoBackupTimer();
        } else {
            stopAutoBackupTimer();
        }
        
        // Close the modal
        removeModal();
        
        // Show notification
        UI.showNotification('Settings saved successfully', 'success');
    };
    
    saveBtn.addEventListener('click', saveSettings, { once: true });
    
    // Reset settings
    const resetSettings = function() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            const defaultSettings = getDefaultSettings();
            updateSettings(defaultSettings);
            removeModal();
            showSettingsDialog(); // Reopen with default settings
        }
    };
    
    resetBtn.addEventListener('click', resetSettings, { once: true });
    
    // Path protection system - prevents directory name appending
    window.protectedPaths = window.protectedPaths || {};
                
    // Listen for force-exact-path events if not already set up
    if (!window.pathProtectionListenerSet) {
        window.pathProtectionListenerSet = true;
        window.api.onForceExactPath && window.api.onForceExactPath((data) => {
            console.log('IMPORTANT: Received protected path for:', data.directoryType);
            window.protectedPaths[data.directoryType] = data.exactPath;
        });
    }

    // Browse for database directory with path protection
    const browseDatabaseDir = async function() {
        try {
            // Use the upgraded browseDirectory method that includes directory type
            if (window.api && window.api.browseDirectory) {
                const path = await window.api.browseDirectory('database');
                if (path) {
                    // Use EXACTLY the path that was selected - NO MODIFICATIONS
                    document.getElementById('databaseDirectory').value = path;
                    console.log('Using exact database path:', path);
                }
            } else if (window.api && window.api.showDirectoryDialog) {
                // Fallback to old method if needed
                window.api.showDirectoryDialog((dirPath) => {
                    if (dirPath) {
                        document.getElementById('databaseDirectory').value = dirPath;
                    }
                });
            }
        } catch (error) {
            console.error('Error browsing for database directory:', error);
        }
    };

    browseDatabaseDirBtn.addEventListener('click', browseDatabaseDir, { once: true });

    // Browse for document directory with path protection
    const browseDocumentDir = async function() {
        try {
            // Use the upgraded browseDirectory method that includes directory type
            if (window.api && window.api.browseDirectory) {
                const path = await window.api.browseDirectory('documents');
                if (path) {
                    // Use EXACTLY the path that was selected - NO MODIFICATIONS
                    document.getElementById('documentDirectory').value = path;
                    console.log('Using exact document path:', path);
                }
            } else if (window.api && window.api.showDirectoryDialog) {
                // Fallback to old method if needed
                window.api.showDirectoryDialog((dirPath) => {
                    if (dirPath) {
                        document.getElementById('documentDirectory').value = dirPath;
                    }
                });
            }
        } catch (error) {
            console.error('Error browsing for document directory:', error);
        }
    };
    
    const browseDocumentDirBtn = modal.querySelector('#browseDocumentDir');
    if (browseDocumentDirBtn) {
        browseDocumentDirBtn.addEventListener('click', browseDocumentDir, { once: true });
    }

    // Browse for backup directory with path protection
    const browseBackupDir = async function() {
        try {
            // Use the upgraded browseDirectory method that includes directory type
            if (window.api && window.api.browseDirectory) {
                const path = await window.api.browseDirectory('backup');
                if (path) {
                    // Use EXACTLY the path that was selected - NO MODIFICATIONS
                    document.getElementById('backupDirectory').value = path;
                    console.log('Using exact backup path:', path);
                }
            } else if (window.api && window.api.showDirectoryDialog) {
                // Fallback to old method if needed
                window.api.showDirectoryDialog((dirPath) => {
                    if (dirPath) {
                        document.getElementById('backupDirectory').value = dirPath;
                    }
                });
            }
        } catch (error) {
            console.error('Error browsing for backup directory:', error);
        }
    };
    
    browseBackupDirBtn.addEventListener('click', browseBackupDir, { once: true });
    
    // Enable/disable backup interval based on auto backup checkbox
    const autoBackupCheckbox = document.getElementById('enableAutoBackup');
    const autoBackupIntervalInput = document.getElementById('autoBackupInterval');
    
    const updateAutoBackupInterval = function() {
        autoBackupIntervalInput.disabled = !autoBackupCheckbox.checked;
    };
    
    autoBackupCheckbox.addEventListener('change', updateAutoBackupInterval);
    updateAutoBackupInterval(); // Initial state
    
    // Enable/disable cloud provider based on cloud sync checkbox
    const cloudSyncCheckbox = document.getElementById('enableCloudSync');
    const cloudProviderSelect = document.getElementById('cloudProvider');
    
    const updateCloudProvider = function() {
        cloudProviderSelect.disabled = !cloudSyncCheckbox.checked;
    };
    
    cloudSyncCheckbox.addEventListener('change', updateCloudProvider);
    updateCloudProvider(); // Initial state
}

function getDefaultSettings() {
    return {
        theme: 'system',
        fontSize: 'medium',
        databaseDirectory: '',
        enableAutoBackup: true,
        autoBackupInterval: 30, // minutes
        backupInterval: 30, // duplicate for compatibility
        backupDirectory: '',
        enableLocalBackup: true,
        enableCloudBackup: false,
        enableCloudSync: false,
        cloudProvider: 'none'
    };
}

function initializeSettings() {
    // Load settings
    const settings = loadSettings();
    
    // Apply theme
    applyTheme(settings.theme);
    
    // Apply font size
    applyFontSize(settings.fontSize);
    
    // Start auto backup timer if enabled
    if (settings.enableAutoBackup) {
        startAutoBackupTimer();
    }
}

// Helper functions
function applyTheme(theme) {
    if (theme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('dark-theme', prefersDark);
        document.body.classList.toggle('light-theme', !prefersDark);
    } else {
        // Use specified theme
        document.body.classList.toggle('dark-theme', theme === 'dark');
        document.body.classList.toggle('light-theme', theme === 'light');
    }
}

function applyFontSize(fontSize) {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${fontSize}`);
}

// Export the functions
export {
    loadSettings,
    saveSettings,
    getSettings,
    updateSettings,
    showSettingsDialog,
    getDefaultSettings,
    initializeSettings,
    applyTheme,
    applyFontSize
};
