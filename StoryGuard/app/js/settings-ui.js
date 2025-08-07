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
                    <h3>Database Paths</h3>
                    <div class="setting-item">
                        <label>Database Directory:</label>
                        <div id="databasePath" class="path-display"></div>
                    </div>
                    <div class="setting-item">
                        <label>Backup Directory:</label>
                        <div id="backupPath" class="path-display"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="closeSettings" class="btn btn-primary">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    currentSettingsDialog = modal;
    
    // Show the modal
    modal.style.display = 'block';
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close');
    const closeSettingsBtn = modal.querySelector('#closeSettings');
    
    const removeModal = function() {
        if (currentSettingsDialog) {
            currentSettingsDialog.style.display = 'none';
            document.body.removeChild(currentSettingsDialog);
            currentSettingsDialog = null;
            window.api.removeAllListeners('current-paths');
        }
    };
    
    closeBtn.addEventListener('click', removeModal, { once: true });
    closeSettingsBtn.addEventListener('click', removeModal, { once: true });
    
    // Get current paths
    window.api.once('current-paths', (paths) => {
        if (currentSettingsDialog) {
            document.getElementById('databasePath').textContent = paths.database;
            document.getElementById('backupPath').textContent = paths.backup;
        }
    });
    
    window.api.send('get-paths');
}

function getDefaultSettings() {
    return {
        theme: 'system',
        fontSize: 'medium',
        enableAutoBackup: true,
        autoBackupInterval: 30,
        enableLocalBackup: true,
        enableCloudBackup: false,
        enableCloudSync: false,
        cloudProvider: 'none'
    };
}

// Make functions globally available
window.Storage = window.Storage || {};
window.Storage.showSettingsDialog = showSettingsDialog;
window.Storage.loadSettings = loadSettings;
window.Storage.saveSettings = saveSettings;
window.Storage.getSettings = getSettings;
window.Storage.updateSettings = updateSettings;
window.Storage.getDefaultSettings = getDefaultSettings;
