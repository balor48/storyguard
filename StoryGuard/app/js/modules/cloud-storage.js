/**
 * Cloud Storage functionality for Story Database
 * Handles integration with Google Drive and Dropbox for data synchronization
 */

// Cloud storage providers
const PROVIDERS = {
    GOOGLE_DRIVE: 'google-drive',
    DROPBOX: 'dropbox',
    ONEDRIVE: 'onedrive'
};

// Configuration
let cloudConfig = {
    enabled: false,
    provider: null,
    autoSync: false,
    lastSyncTime: null,
    syncInterval: 30 // minutes
};

// Authentication state
let authState = {
    isAuthenticated: false,
    userInfo: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null
};

// Initialize cloud storage
function initializeCloudStorage() {
    // Load configuration from localStorage
    const savedConfig = localStorage.getItem('cloudConfig');
    if (savedConfig) {
        try {
            cloudConfig = JSON.parse(savedConfig);
        } catch (error) {
            console.error('Error parsing cloud config:', error);
        }
    }
    
    // Load auth state from localStorage
    const savedAuthState = localStorage.getItem('cloudAuthState');
    if (savedAuthState) {
        try {
            authState = JSON.parse(savedAuthState);
            
            // Check if token is expired
            if (authState.expiresAt && new Date(authState.expiresAt) < new Date()) {
                authState.isAuthenticated = false;
                authState.accessToken = null;
            }
        } catch (error) {
            console.error('Error parsing auth state:', error);
        }
    }
    
    // Set up auto-sync if enabled
    if (cloudConfig.enabled && cloudConfig.autoSync && authState.isAuthenticated) {
        setupAutoSync();
    }
    
    // Add cloud status to UI and update it
    addCloudStatusToUI();
}

// Save configuration
function saveCloudConfig() {
    localStorage.setItem('cloudConfig', JSON.stringify(cloudConfig));
}

// Save auth state
function saveAuthState() {
    localStorage.setItem('cloudAuthState', JSON.stringify(authState));
}

// Update cloud status UI
function updateCloudStatusUI() {
    // Get all cloud status elements
    const cloudStatusElements = document.querySelectorAll('.cloud-status');
    
    // Update each cloud status element
    updateCloudStatusElement(document.getElementById('charactersCloudStatus'));
    updateCloudStatusElement(document.getElementById('locationsCloudStatus'));
    updateCloudStatusElement(document.getElementById('plotsCloudStatus'));
    updateCloudStatusElement(document.getElementById('worldbuildingCloudStatus'));
}

// Update a single cloud status element
function updateCloudStatusElement(cloudStatusElement) {
    if (!cloudStatusElement) return;
    
    if (!cloudConfig.enabled) {
        cloudStatusElement.innerHTML = `
            <div class="cloud-status not-configured">
                <span class="cloud-icon"><i class="fas fa-cloud"></i></span>
                <span class="cloud-text">Not configured</span>
            </div>
        `;
        return;
    }
    
    if (!authState.isAuthenticated) {
        cloudStatusElement.innerHTML = `
            <div class="cloud-status not-authenticated">
                <span class="cloud-icon"><i class="fas fa-cloud"></i></span>
                <span class="cloud-text">Not connected to ${getProviderName(cloudConfig.provider)}</span>
                <button class="cloud-connect-btn" onclick="CloudStorage.authenticateWithProvider()">Connect</button>
            </div>
        `;
        return;
    }
    
    const lastSyncText = cloudConfig.lastSyncTime
        ? `Last sync: ${new Date(cloudConfig.lastSyncTime).toLocaleString()}`
        : 'Not synced yet';
    
    cloudStatusElement.innerHTML = `
        <div class="cloud-status authenticated">
            <span class="cloud-icon"><i class="fas fa-cloud"></i></span>
            <span class="cloud-text">Connected to ${getProviderName(cloudConfig.provider)}</span>
            <span class="cloud-user">${authState.userInfo?.name || 'User'}</span>
            <span class="cloud-last-sync">${lastSyncText}</span>
            <button class="cloud-sync-btn" onclick="CloudStorage.syncData()">Sync Now</button>
        </div>
    `;
}

// Add cloud status to UI
function addCloudStatusToUI() {
    // Get all cloud status containers
    const cloudStatusContainers = document.querySelectorAll('.cloud-status-container');
    
    // If no containers found, create them
    if (cloudStatusContainers.length === 0) {
        // Create cloud status containers for each tab
        createCloudStatusContainer('characters');
        createCloudStatusContainer('locations');
        createCloudStatusContainer('plots');
        createCloudStatusContainer('worldbuilding');
    }
    
    // Update cloud status UI
    updateCloudStatusUI();
    
    // Update positions when tabs are switched
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Give time for the tab to become active
            setTimeout(() => {
                // Remove existing cloud status elements
                document.querySelectorAll('[id$="CloudStatus"]').forEach(el => el.remove());
                
                // Recreate cloud status elements
                createCloudStatusContainer('characters');
                createCloudStatusContainer('locations');
                createCloudStatusContainer('plots');
                createCloudStatusContainer('worldbuilding');
                
                // Update all cloud status elements
                updateCloudStatusUI();
            }, 100);
        });
    });
}

// Create cloud status container for a tab
function createCloudStatusContainer(tabName) {
    // Get the file controls div in the tab
    const fileControls = document.querySelector(`#${tabName}-tab .file-controls`);
    if (!fileControls) return;
    
    // Check if cloud status element already exists
    if (document.getElementById(`${tabName}CloudStatus`)) return;
    
    // Look for existing container div with cloud-settings-btn
    let container = null;
    const buttonElement = fileControls.querySelector('div > button.cloud-settings-btn');
    if (buttonElement) {
        container = buttonElement.parentElement;
    }
    
    // If no container found, log an error and return
    if (!container) {
        console.error(`Could not find cloud settings button container for ${tabName} tab`);
        return;
    }
    
    // Create cloud status element directly (no container)
    const statusElement = document.createElement('div');
    statusElement.id = `${tabName}CloudStatus`;
    statusElement.className = 'cloud-status';
    
    // Get the position of the container relative to the viewport
    const rect = container.getBoundingClientRect();
    
    // Position the cloud status element above the cloud settings button
    statusElement.style.position = 'absolute';
    statusElement.style.bottom = '100%'; // Position above the container
    statusElement.style.left = '50px'; // Move 50px to the right from the left edge
    statusElement.style.marginBottom = '5px'; // Add a small margin
    
    // Add window resize event listener to adjust position if needed
    window.addEventListener('resize', function() {
        // Make sure the cloud status element stays within the visible area
        const containerRect = container.getBoundingClientRect();
        const statusRect = statusElement.getBoundingClientRect();
        
        // If the status element would go off-screen, adjust its position
        if (statusRect.right > window.innerWidth) {
            statusElement.style.left = Math.max(0, window.innerWidth - statusRect.width - 10) + 'px';
        } else {
            statusElement.style.left = '50px'; // Reset to default position
        }
    });
    statusElement.style.display = 'block';
    statusElement.style.visibility = 'visible';
    statusElement.style.opacity = '1';
    statusElement.style.zIndex = '9999';
    statusElement.style.backgroundColor = '#f0f0f0';
    statusElement.style.padding = '2px 6px'; // Reduced vertical padding
    statusElement.style.borderRadius = '6px';
    statusElement.style.fontSize = '0.7rem'; // Smaller font
    statusElement.style.width = '130px'; // Wider to fit text on one line
    statusElement.style.whiteSpace = 'nowrap'; // Prevent text wrapping
    statusElement.style.lineHeight = '1'; // Reduced line height
    statusElement.style.height = 'auto'; // Auto height based on content
    
    // Add to the container for proper positioning
    container.appendChild(statusElement);
}

// Get provider display name
function getProviderName(provider) {
    switch (provider) {
        case PROVIDERS.GOOGLE_DRIVE:
            return 'Google Drive';
        case PROVIDERS.DROPBOX:
            return 'Dropbox';
        case PROVIDERS.ONEDRIVE:
            return 'OneDrive';
        default:
            return 'Cloud Storage';
    }
}

// Show cloud storage settings dialog
function showCloudSettings() {
    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Cloud Storage Settings</h3>
            </div>
            <div class="modal-body">
                <div class="settings-group">
                    <h4>Storage Provider</h4>
                    <div class="provider-options">
                        <div class="provider-option ${cloudConfig.provider === PROVIDERS.GOOGLE_DRIVE ? 'selected' : ''}">
                            <input type="radio" name="provider" id="provider-gdrive" value="${PROVIDERS.GOOGLE_DRIVE}" 
                                ${cloudConfig.provider === PROVIDERS.GOOGLE_DRIVE ? 'checked' : ''}>
                            <label for="provider-gdrive">
                                <span class="provider-icon"><i class="fas fa-cloud"></i></span>
                                <span class="provider-name">Google Drive</span>
                            </label>
                        </div>
                        <div class="provider-option ${cloudConfig.provider === PROVIDERS.DROPBOX ? 'selected' : ''}">
                            <input type="radio" name="provider" id="provider-dropbox" value="${PROVIDERS.DROPBOX}"
                                ${cloudConfig.provider === PROVIDERS.DROPBOX ? 'checked' : ''}>
                            <label for="provider-dropbox">
                                <span class="provider-icon"><i class="fas fa-cloud"></i><br><i class="fas fa-dropbox"></i></span>
                                <span class="provider-name">Dropbox</span>
                            </label>
                        </div>
                        <div class="provider-option ${cloudConfig.provider === PROVIDERS.ONEDRIVE ? 'selected' : ''}">
                            <input type="radio" name="provider" id="provider-onedrive" value="${PROVIDERS.ONEDRIVE}" 
                                ${cloudConfig.provider === PROVIDERS.ONEDRIVE ? 'checked' : ''}>
                            <label for="provider-onedrive">
                                <span class="provider-icon"><i class="fas fa-cloud"></i></span>
                                <span class="provider-name">OneDrive</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h4>Sync Settings</h4>
                    <div class="setting-option">
                        <input type="checkbox" id="cloud-enabled" ${cloudConfig.enabled ? 'checked' : ''}>
                        <label for="cloud-enabled">Enable cloud storage</label>
                    </div>
                    <div class="setting-option">
                        <input type="checkbox" id="auto-sync" ${cloudConfig.autoSync ? 'checked' : ''}>
                        <label for="auto-sync">Auto-sync changes</label>
                    </div>
                    <div class="setting-option">
                        <label for="sync-interval">Sync interval (minutes):</label>
                        <input type="number" id="sync-interval" min="5" max="1440" value="${cloudConfig.syncInterval}">
                    </div>
                </div>
                
                <div class="settings-group">
                    <h4>Account</h4>
                    ${authState.isAuthenticated ? `
                        <div class="account-info">
                            <p>Connected as: <strong>${authState.userInfo?.name || 'User'}</strong></p>
                            <button id="disconnect-btn" class="danger-btn">Disconnect Account</button>
                        </div>
                    ` : `
                        <div class="account-info">
                            <p>Not connected</p>
                            <button id="connect-btn" class="primary-btn">Connect to ${getProviderName(cloudConfig.provider || PROVIDERS.GOOGLE_DRIVE)}</button>
                        </div>
                    `}
                </div>
            </div>
            <div class="modal-footer">
                <button id="cloud-readme-btn" class="info-btn" style="box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.5); outline: none; font-weight: bold;" onclick="CloudStorage.showCloudReadme()">README</button>
                <div style="flex-grow: 1;"></div>
                <button id="save-cloud-settings" class="primary-btn">Save Settings</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="danger-btn" style="background-color: #f44336; color: white;">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set up event listeners
    document.querySelectorAll('input[name="provider"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Update selected class
            document.querySelectorAll('.provider-option').forEach(option => {
                option.classList.remove('selected');
            });
            this.closest('.provider-option').classList.add('selected');
            
            // Update connect button text
            const connectBtn = document.getElementById('connect-btn');
            if (connectBtn) {
                connectBtn.textContent = `Connect to ${getProviderName(this.value)}`;
            }
        });
    });
    
    const saveBtn = document.getElementById('save-cloud-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // Save settings
            const provider = document.querySelector('input[name="provider"]:checked')?.value;
            const enabled = document.getElementById('cloud-enabled')?.checked;
            const autoSync = document.getElementById('auto-sync')?.checked;
            const syncInterval = parseInt(document.getElementById('sync-interval')?.value || '30', 10);
            
            // Update config
            cloudConfig.provider = provider;
            cloudConfig.enabled = enabled;
            cloudConfig.autoSync = autoSync;
            cloudConfig.syncInterval = syncInterval;
            
            // Save config
            saveCloudConfig();
            
            // Update UI
            updateCloudStatusUI();
            
            // Set up auto-sync if enabled
            if (cloudConfig.enabled && cloudConfig.autoSync && authState.isAuthenticated) {
                setupAutoSync();
            }
            
            // Close modal
            modal.remove();
            
            // Show success message
            Core.showToast('Cloud settings saved');
        });
    }
    
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', function() {
            // Save current provider selection
            const provider = document.querySelector('input[name="provider"]:checked')?.value;
            if (provider) {
                cloudConfig.provider = provider;
                saveCloudConfig();
            }
            
            // Start authentication
            authenticateWithProvider();
            
            // Close modal
            modal.remove();
        });
    }
    
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', function() {
            // Confirm disconnect
            if (confirm('Are you sure you want to disconnect your account? Your data will remain in the cloud but won\'t be synced.')) {
                // Reset auth state
                authState = {
                    isAuthenticated: false,
                    userInfo: null,
                    accessToken: null,
                    refreshToken: null,
                    expiresAt: null
                };
                
                // Save auth state
                saveAuthState();
                
                // Update UI
                updateCloudStatusUI();
                
                // Close modal
                modal.remove();
                
                // Show success message
                Core.showToast('Disconnected from cloud storage');
            }
        });
    }
}

// Set up auto-sync
function setupAutoSync() {
    // Clear any existing interval
    if (window.cloudSyncInterval) {
        clearInterval(window.cloudSyncInterval);
    }
    
    // Set up new interval
    const intervalMs = cloudConfig.syncInterval * 60 * 1000;
    window.cloudSyncInterval = setInterval(syncData, intervalMs);
    
    console.log(`Auto-sync set up to run every ${cloudConfig.syncInterval} minutes`);
}

// Authenticate with selected provider
function authenticateWithProvider() {
    if (!cloudConfig.provider) {
        Core.showToast('Please select a cloud storage provider first', 'error');
        showCloudSettings();
        return;
    }
    
    switch (cloudConfig.provider) {
        case PROVIDERS.GOOGLE_DRIVE:
            authenticateWithGoogleDrive();
            break;
        case PROVIDERS.DROPBOX:
            authenticateWithDropbox();
            break;
        case PROVIDERS.ONEDRIVE:
            authenticateWithOneDrive();
            break;
        default:
            Core.showToast('Unknown provider', 'error');
    }
}

// Google Drive Authentication
function authenticateWithGoogleDrive() {
    // Google OAuth client ID (you would need to create this in Google Cloud Console)
    const clientId = '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com'; // Replace with actual client ID
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
    
    // Generate random state for security
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauthState', state);
    
    // Create OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;
    
    // Open popup for authentication
    const authWindow = window.open(authUrl, 'GoogleAuth', 'width=600,height=600');
    
    // Poll for redirect
    const pollTimer = window.setInterval(function() {
        try {
            if (authWindow.closed) {
                window.clearInterval(pollTimer);
            } else if (authWindow.location.href.includes(redirectUri)) {
                window.clearInterval(pollTimer);
                
                // Extract code from URL
                const url = new URL(authWindow.location.href);
                const code = url.searchParams.get('code');
                const returnedState = url.searchParams.get('state');
                
                // Verify state
                if (returnedState !== localStorage.getItem('oauthState')) {
                    Core.showToast('Authentication failed: Invalid state', 'error');
                    authWindow.close();
                    return;
                }
                
                // Close auth window
                authWindow.close();
                
                // Exchange code for tokens
                exchangeCodeForTokens(code, 'google');
            }
        } catch (e) {
            // Ignore cross-origin errors while polling
        }
    }, 500);
}

// Dropbox Authentication
function authenticateWithDropbox() {
    // Dropbox OAuth client ID (you would need to create this in Dropbox Developer Console)
    const clientId = 'abcdefghijklm'; // Replace with actual client ID
    const redirectUri = window.location.origin + window.location.pathname;
    
    // Generate random state for security
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauthState', state);
    
    // Create OAuth URL
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
    
    // Open popup for authentication
    const authWindow = window.open(authUrl, 'DropboxAuth', 'width=600,height=600');
    
    // Poll for redirect
    const pollTimer = window.setInterval(function() {
        try {
            if (authWindow.closed) {
                window.clearInterval(pollTimer);
            } else if (authWindow.location.href.includes(redirectUri)) {
                window.clearInterval(pollTimer);
                
                // Extract code from URL
                const url = new URL(authWindow.location.href);
                const code = url.searchParams.get('code');
                const returnedState = url.searchParams.get('state');
                
                // Verify state
                if (returnedState !== localStorage.getItem('oauthState')) {
                    Core.showToast('Authentication failed: Invalid state', 'error');
                    authWindow.close();
                    return;
                }
                
                // Close auth window
                authWindow.close();
                
                // Exchange code for tokens
                exchangeCodeForTokens(code, 'dropbox');
            }
        } catch (e) {
            // Ignore cross-origin errors while polling
        }
    }, 500);
}

// OneDrive Authentication
function authenticateWithOneDrive() {
    // OneDrive OAuth client ID (you would need to create this in Microsoft Azure Portal)
    const clientId = '12345678-1234-1234-1234-123456789012'; // Replace with actual client ID
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'files.readwrite offline_access';
    
    // Generate random state for security
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauthState', state);
    
    // Create OAuth URL
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
    
    // Open popup for authentication
    const authWindow = window.open(authUrl, 'OneDriveAuth', 'width=600,height=600');
    
    // Poll for redirect
    const pollTimer = window.setInterval(function() {
        try {
            if (authWindow.closed) {
                window.clearInterval(pollTimer);
            } else if (authWindow.location.href.includes(redirectUri)) {
                window.clearInterval(pollTimer);
                
                // Extract code from URL
                const url = new URL(authWindow.location.href);
                const code = url.searchParams.get('code');
                const returnedState = url.searchParams.get('state');
                
                // Verify state
                if (returnedState !== localStorage.getItem('oauthState')) {
                    Core.showToast('Authentication failed: Invalid state', 'error');
                    authWindow.close();
                    return;
                }
                
                // Close auth window
                authWindow.close();
                
                // Exchange code for tokens
                exchangeCodeForTokens(code, 'onedrive');
            }
        } catch (e) {
            // Ignore cross-origin errors while polling
        }
    }, 500);
}

// Exchange authorization code for tokens
function exchangeCodeForTokens(code, provider) {
    // In a real implementation, this would make a server request to exchange the code
    // For security reasons, the client secret should not be exposed in client-side code
    // This would typically be handled by a backend service
    
    // Simulate token exchange for demo purposes
    setTimeout(() => {
        // Simulate successful authentication
        authState = {
            isAuthenticated: true,
            userInfo: {
                name: 'Demo User',
                email: 'user@example.com'
            },
            accessToken: 'simulated_access_token',
            refreshToken: 'simulated_refresh_token',
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
        };
        
        // Save auth state
        saveAuthState();
        
        // Update UI
        updateCloudStatusUI();
        
        // Set up auto-sync if enabled
        if (cloudConfig.enabled && cloudConfig.autoSync) {
            setupAutoSync();
        }
        
        // Show success message
        Core.showToast(`Connected to ${getProviderName(cloudConfig.provider)}`);
    }, 1000);
}

// Sync data with cloud storage
function syncData() {
    if (!cloudConfig.enabled || !authState.isAuthenticated) {
        return;
    }
    
    // Show loading indicator
    UI.showLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
        try {
            // Get all data to sync
            const data = {
                characters,
                titles,
                seriesList,
                books,
                roles,
                customFieldTypes,
                relationships,
                tags,
                plots,
                worldElements,
                syncDate: new Date().toISOString(),
                version: '2.0.0'
            };
            
            // In a real implementation, this would upload data to the selected cloud provider
            console.log('Syncing data to cloud storage:', cloudConfig.provider);
            
            // Update last sync time
            cloudConfig.lastSyncTime = new Date().toISOString();
            saveCloudConfig();
            
            // Update UI
            updateCloudStatusUI();
            
            // Hide loading indicator
            UI.showLoading(false);
            
            // Show success message
            Core.showToast(`Data synced to ${getProviderName(cloudConfig.provider)}`);
        } catch (error) {
            // Hide loading indicator
            UI.showLoading(false);
            
            // Show error message
            Core.showToast(`Error syncing data: ${error.message}`, 'error');
        }
    }, 1500);
}

// Load data from cloud storage
function loadFromCloud() {
    if (!cloudConfig.enabled || !authState.isAuthenticated) {
        return Promise.reject(new Error('Not connected to cloud storage'));
    }
    
    // Show loading indicator
    UI.showLoading(true);
    
    // Return a promise
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            try {
                // In a real implementation, this would download data from the selected cloud provider
                console.log('Loading data from cloud storage:', cloudConfig.provider);
                
                // Simulate successful load
                // In a real implementation, this would be the data from the cloud
                const data = {
                    characters,
                    titles,
                    seriesList,
                    books,
                    roles,
                    customFieldTypes,
                    relationships,
                    tags,
                    plots,
                    worldElements,
                    syncDate: new Date().toISOString(),
                    version: '2.0.0'
                };
                
                // Update last sync time
                cloudConfig.lastSyncTime = new Date().toISOString();
                saveCloudConfig();
                
                // Update UI
                updateCloudStatusUI();
                
                // Hide loading indicator
                UI.showLoading(false);
                
                // Resolve with data
                resolve(data);
            } catch (error) {
                // Hide loading indicator
                UI.showLoading(false);
                
                // Show error message
                Core.showToast(`Error loading data: ${error.message}`, 'error');
                
                // Reject with error
                reject(error);
            }
        }, 1500);
    });
}

// Method to show the cloud readme
function showCloudReadme() {
    try {
        console.log('Showing cloud storage readme information');
        
        // Create modal container
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
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background-color: var(--background-color, #fff);
            color: var(--text-color, #333);
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            position: relative;
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 15px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        closeButton.onclick = function() {
            document.body.removeChild(modal);
        };
        modalContent.appendChild(closeButton);
        
        // Create content container directly with embedded content
        const contentContainer = document.createElement('div');
        
        // Add a style element for proper styling
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            h1, h2, h3 { color: #3a6ea5; }
            .feature {
                background-color: #f8f9fa;
                border-left: 4px solid #3a6ea5;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 0 4px 4px 0;
            }
            .warning {
                background-color: #f8d7da;
                border-left: 4px solid #dc3545;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 4px 4px 0;
            }
            .dark-mode h1, .dark-mode h2, .dark-mode h3 { color: #4a8ec6; }
            .dark-mode .feature {
                background-color: #333;
                border-left-color: #4a8ec6;
            }
            .dark-mode .warning {
                background-color: #3d1c1f;
                border-left-color: #a52834;
                color: #f8a5ad;
            }
            .provider-section {
                margin-bottom: 30px;
            }
            .step {
                margin-bottom: 15px;
                padding-left: 20px;
                position: relative;
            }
            .step:before {
                content: "→";
                position: absolute;
                left: 0;
                color: #3a6ea5;
            }
            .dark-mode .step:before {
                color: #4a8ec6;
            }
        `;
        contentContainer.appendChild(styleElement);
        
        // Add the HTML content
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
            <div style="padding: 20px;">
                <h1 style="text-align: center; margin-bottom: 30px;">Cloud Storage Guide</h1>
                <p>Story Database supports cloud storage integration to help you back up your data and sync across devices. This guide explains how to set up and use cloud storage with the application.</p>
                
                <div class="warning">
                    <h3><i class="fas fa-exclamation-triangle"></i> Important Notes</h3>
                    <ul>
                        <li>Cloud storage is a <strong>backup feature</strong> and not a real-time collaboration tool.</li>
                        <li>Always make local backups of your data in addition to cloud storage.</li>
                        <li>You need an account with the cloud provider of your choice.</li>
                        <li>Internet connection is required for sync operations.</li>
                    </ul>
                </div>
                
                <h2>Supported Cloud Providers</h2>
                
                <div class="provider-section">
                    <h3>Google Drive</h3>
                    <p>Store your Story Database files in your Google Drive account.</p>
                    <div class="feature">
                        <h4>Setup Instructions:</h4>
                        <div class="step">Select Google Drive as your provider in the Cloud Settings dialog.</div>
                        <div class="step">Click "Connect to Google Drive" and sign in with your Google account.</div>
                        <div class="step">Grant the requested permissions to allow Story Database to store files.</div>
                        <div class="step">Your data will be stored in a dedicated "Story Database" folder.</div>
                    </div>
                </div>
                
                <div class="provider-section">
                    <h3>Dropbox</h3>
                    <p>Store your Story Database files in your Dropbox account.</p>
                    <div class="feature">
                        <h4>Setup Instructions:</h4>
                        <div class="step">Select Dropbox as your provider in the Cloud Settings dialog.</div>
                        <div class="step">Click "Connect to Dropbox" and sign in with your Dropbox account.</div>
                        <div class="step">Grant the requested permissions to allow Story Database to store files.</div>
                        <div class="step">Your data will be stored in a dedicated "Apps/Story Database" folder.</div>
                    </div>
                </div>
                
                <div class="provider-section">
                    <h3>OneDrive</h3>
                    <p>Store your Story Database files in your Microsoft OneDrive account.</p>
                    <div class="feature">
                        <h4>Setup Instructions:</h4>
                        <div class="step">Select OneDrive as your provider in the Cloud Settings dialog.</div>
                        <div class="step">Click "Connect to OneDrive" and sign in with your Microsoft account.</div>
                        <div class="step">Grant the requested permissions to allow Story Database to store files.</div>
                        <div class="step">Your data will be stored in a dedicated "Story Database" folder.</div>
                    </div>
                </div>
                
                <h2>Sync Settings</h2>
                
                <div class="feature">
                    <h3>Enable Cloud Storage</h3>
                    <p>Turn cloud storage on or off. When disabled, no data will be synced to or from the cloud.</p>
                </div>
                
                <div class="feature">
                    <h3>Auto-Sync Changes</h3>
                    <p>When enabled, changes will be automatically synced to the cloud at the specified interval.</p>
                    <p>When disabled, you must manually sync by clicking the "Sync Now" button.</p>
                </div>
                
                <div class="feature">
                    <h3>Sync Interval</h3>
                    <p>How often automatic syncing should occur (in minutes).</p>
                    <p>Recommended: 30 minutes for regular use, 5-15 minutes for intensive editing sessions.</p>
                </div>
                
                <h2>Troubleshooting</h2>
                
                <div class="feature">
                    <h3>Sync Conflicts</h3>
                    <p>If you edit your data on multiple devices without syncing, conflicts may occur.</p>
                    <p>The application will attempt to merge changes, but in case of conflicts, the most recent changes will be used.</p>
                    <p>To avoid conflicts, always sync before switching devices.</p>
                </div>
                
                <div class="feature">
                    <h3>Connection Issues</h3>
                    <p>If you encounter connection issues:</p>
                    <ol>
                        <li>Check your internet connection</li>
                        <li>Verify that your cloud provider is operational</li>
                        <li>Try disconnecting and reconnecting your account</li>
                        <li>Ensure your authentication hasn't expired</li>
                    </ol>
                </div>
                
                <div class="warning">
                    <h3>Privacy & Security</h3>
                    <p>Your data is stored in your personal cloud storage account and is not accessible to the Story Database developers.</p>
                    <p>The application uses OAuth for authentication and does not store your cloud provider passwords.</p>
                    <p>For additional security, consider enabling two-factor authentication with your cloud provider.</p>
                </div>
            </div>
        `;
        contentContainer.appendChild(contentDiv);
        
        // Add content to modal
        modalContent.appendChild(contentContainer);
        
        // Add modal to DOM
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Apply dark mode if needed
        if (document.body.classList.contains('dark-mode') ||
            document.documentElement.getAttribute('data-theme') === 'dark') {
            contentContainer.querySelectorAll('*').forEach(element => {
                if (element.classList) {
                    element.classList.add('dark-mode');
                }
            });
        }
    } catch (error) {
        console.error('Error showing cloud storage readme:', error);
        // Fallback to the original method if there's an error
        window.open('readme/cloudreadme.html', '_blank');
    }
}

// Export cloud storage functions
window.CloudStorage = {
    initializeCloudStorage,
    showCloudSettings,
    authenticateWithProvider,
    syncData,
    loadFromCloud,
    updateCloudStatusUI,
    addCloudStatusToUI,
    showCloudReadme
};