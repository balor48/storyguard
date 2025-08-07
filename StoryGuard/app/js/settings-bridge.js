// Settings Bridge Script - Ensures settings functions are available globally
console.log('Settings bridge script loaded');

(function() {
    // Create a global StorageSettings object if it doesn't exist
    if (!window.StorageSettings) {
        window.StorageSettings = {};
    }
    
    // Define the settings dialog function
    async function loadSettingsModule() {
        try {
            // This is a dynamic import - it works even if settings.js is an ES module
            const settingsPath = './modules/storage/settings.js';
            
            // Try to load the settings module dynamically
            try {
                // Modern dynamic import approach
                const settingsModule = await import(settingsPath);
                
                // Copy all exported functions to the global StorageSettings object
                if (settingsModule) {
                    Object.assign(window.StorageSettings, settingsModule);
                    console.log('Successfully loaded settings module functions:', Object.keys(settingsModule));
                }
            } catch (importError) {
                console.warn('Dynamic import failed, falling back to alternative approach:', importError);
                
                // Fallback implementation of showSettingsDialog
                window.StorageSettings.showSettingsDialog = function() {
                    console.log('Showing fallback settings dialog');
                    
                    // Create a simple settings dialog
                    const modal = document.createElement('div');
                    modal.className = 'modal';
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 9999;
                    `;
                    
                    modal.innerHTML = `
                        <div class="modal-content" style="background-color: var(--background-color, #fff); color: var(--text-color, #333); padding: 20px; border-radius: 8px; width: 80%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                            <div class="modal-header" style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                                <h2>Settings</h2>
                                <button id="close-settings" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                            </div>
                            <div class="modal-body">
                                <p>This is a fallback settings dialog. The actual settings module could not be loaded.</p>
                                
                                <div style="margin-top: 20px;">
                                    <h3>Theme</h3>
                                    <select id="theme-select">
                                        <option value="light">Light</option>
                                        <option value="dark" selected>Dark</option>
                                    </select>
                                </div>
                                
                                <div style="margin-top: 20px;">
                                    <h3>Font Size</h3>
                                    <select id="font-size-select">
                                        <option value="small">Small</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer" style="margin-top: 20px; text-align: right;">
                                <button id="save-settings" style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Save</button>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(modal);
                    
                    // Add event listeners
                    document.getElementById('close-settings').addEventListener('click', function() {
                        document.body.removeChild(modal);
                    });
                    
                    document.getElementById('save-settings').addEventListener('click', function() {
                        const theme = document.getElementById('theme-select').value;
                        const fontSize = document.getElementById('font-size-select').value;
                        
                        // Define backup interval settings
                        const defaultBackupInterval = 30;
                        const enableAutoBackup = true;
                        
                        // Create settings object with both interval keys for compatibility
                        const settings = {
                            theme,
                            fontSize,
                            // Include other default settings
                            enableAutoBackup: enableAutoBackup,
                            // CRITICAL: Include BOTH backup interval keys for maximum compatibility
                            autoBackupInterval: defaultBackupInterval,
                            backupInterval: defaultBackupInterval,
                            backupDirectory: '',
                            databaseDirectory: ''
                        };
                        
                        // Save settings object to localStorage
                        localStorage.setItem('settings', JSON.stringify(settings));
                        
                        // ALSO save individual settings directly to localStorage for maximum compatibility
                        // This ensures auto-backup-fix.js and other scripts can find these values
                        localStorage.setItem('enableAutoBackup', enableAutoBackup);
                        localStorage.setItem('autoBackupInterval', defaultBackupInterval);
                        localStorage.setItem('backupInterval', defaultBackupInterval);
                        
                        console.log('Settings bridge: Saved settings with both interval keys:', settings);
                        
                        // Apply theme
                        document.body.classList.remove('light-theme', 'dark-theme');
                        document.body.classList.add(`${theme}-theme`);
                        
                        // Apply font size
                        document.body.classList.remove('font-small', 'font-medium', 'font-large');
                        document.body.classList.add(`font-${fontSize}`);
                        
                        // Close modal
                        document.body.removeChild(modal);
                        
                        // Show notification
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast('Settings saved successfully', 'success');
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error in settings bridge:', error);
        }
    }
    
    // Immediately attempt to load the settings module
    loadSettingsModule();
})();
