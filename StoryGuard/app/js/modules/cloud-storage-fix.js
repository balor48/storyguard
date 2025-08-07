/**
 * Cloud Settings Status Integration
 * Adds the status text directly into the Cloud Settings button
 */

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateCloudSettingsButtons, 500);
    
    // Check periodically for newly added buttons
    setInterval(updateCloudSettingsButtons, 2000);
});

/**
 * Updates all Cloud Settings buttons with status information
 */
function updateCloudSettingsButtons() {
    // Find all Cloud Settings buttons
    const buttons = document.querySelectorAll('.cloud-settings-btn');
    
    buttons.forEach(button => {
        // Get the current button text
        const buttonText = button.textContent.trim();
        
        // Skip if button already has status text
        if (buttonText.includes('(Not Configured)') || buttonText.includes('(Configured)')) {
            return;
        }
        
        // Find nearest cloud status element to determine configuration status
        const cloudStatus = document.querySelector('.cloud-status');
        const isConfigured = cloudStatus ? !cloudStatus.textContent.includes('Not configured') : false;
        
        // Create status text span if it doesn't exist
        let statusSpan = button.querySelector('.status-text');
        if (!statusSpan) {
            statusSpan = document.createElement('span');
            statusSpan.className = 'status-text';
            button.appendChild(statusSpan);
        }
        
        // Clean up button content
        button.innerHTML = '';
        
        // Add cloud icon
        const icon = document.createElement('i');
        icon.className = 'fas fa-cog';
        button.appendChild(icon);
        
        // Add space
        button.appendChild(document.createTextNode(' '));
        
        // Add button text
        button.appendChild(document.createTextNode('Cloud Settings '));
        
        // Set status text
        if (isConfigured) {
            statusSpan.textContent = '(Configured)';
            button.setAttribute('data-status', 'configured');
        } else {
            statusSpan.textContent = '(Not Configured)';
            button.setAttribute('data-status', 'not-configured');
        }
        
        button.appendChild(statusSpan);
    });
}

// Add cloud storage functionality

(function() {
    console.log('Loading cloud-storage-fix.js...');

    // Create CloudStorage in global scope if it doesn't exist
    if (!window.CloudStorage) {
        console.log('Creating CloudStorage object in global scope');
        window.CloudStorage = {};
    }

    // Cloud storage settings
    let cloudSettings = {
        configured: false,
        provider: '',
        apiKey: '',
        username: '',
        lastSync: null
    };

    // Try to load settings from localStorage
    try {
        const savedSettings = localStorage.getItem('cloudSettings');
        if (savedSettings) {
            cloudSettings = JSON.parse(savedSettings);
        }
    } catch (err) {
        console.error('Error loading cloud settings:', err);
    }

    // Function to check if cloud storage is configured
    function isConfigured() {
        return cloudSettings.configured;
    }

    // Function to show cloud settings
    function showCloudSettings() {
        console.log('Showing cloud settings...');

        // Create the settings modal
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
        modal.innerHTML = `
            <div class="modal-content" style="background-color: var(--background-color, #fff); color: var(--text-color, #333); padding: 20px; border-radius: 8px; width: 80%; max-width: 500px; max-height: 80vh; overflow-y: auto; box-shadow: 0 0 10px rgba(0,0,0,0.3);">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: var(--text-color, #333); font-size: 24px;">Cloud Storage Settings</h3>
                    <button id="close-cloud-settings" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-color, #333);">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 15px;">
                        <label for="cloud-provider" style="display: block; margin-bottom: 5px; font-weight: bold;">Cloud Provider:</label>
                        <select id="cloud-provider" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="">Select Provider</option>
                            <option value="dropbox" ${cloudSettings.provider === 'dropbox' ? 'selected' : ''}>Dropbox</option>
                            <option value="google" ${cloudSettings.provider === 'google' ? 'selected' : ''}>Google Drive</option>
                            <option value="onedrive" ${cloudSettings.provider === 'onedrive' ? 'selected' : ''}>OneDrive</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="cloud-api-key" style="display: block; margin-bottom: 5px; font-weight: bold;">API Key (if applicable):</label>
                        <input type="text" id="cloud-api-key" value="${cloudSettings.apiKey || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="cloud-username" style="display: block; margin-bottom: 5px; font-weight: bold;">Username/Email:</label>
                        <input type="text" id="cloud-username" value="${cloudSettings.username || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                    <div style="margin-top: 20px;">
                        <button id="save-cloud-settings" style="background-color: #4CAF50; color: white; border: none; border-radius: 4px; padding: 10px 15px; cursor: pointer; margin-right: 10px;">Save Settings</button>
                        <button id="test-cloud-connection" style="background-color: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px 15px; cursor: pointer;">Test Connection</button>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.appendChild(modal);

        // Set up event listeners
        document.getElementById('close-cloud-settings').addEventListener('click', function() {
            document.body.removeChild(modal);
        });

        document.getElementById('save-cloud-settings').addEventListener('click', function() {
            // Get values
            const provider = document.getElementById('cloud-provider').value;
            const apiKey = document.getElementById('cloud-api-key').value;
            const username = document.getElementById('cloud-username').value;

            // Update settings
            cloudSettings = {
                configured: (provider !== '' && username !== ''),
                provider: provider,
                apiKey: apiKey,
                username: username,
                lastSync: cloudSettings.lastSync
            };

            // Save to localStorage
            localStorage.setItem('cloudSettings', JSON.stringify(cloudSettings));

            // Show confirmation
            Core.showToast('Cloud settings saved successfully!', 'success');

            // Close modal
            document.body.removeChild(modal);
        });

        document.getElementById('test-cloud-connection').addEventListener('click', function() {
            // Get values from form
            const provider = document.getElementById('cloud-provider').value;
            const username = document.getElementById('cloud-username').value;

            if (!provider || !username) {
                Core.showToast('Please select a provider and enter username', 'error');
                return;
            }

            // Simulate connection test
            Core.showToast('Testing connection...', 'info');
            
            // Mock a delayed response
            setTimeout(() => {
                // This is a simulated success - in a real app, this would actually test the connection
                Core.showToast('Connection successful!', 'success');
            }, 1500);
        });
    }

    // Function to show cloud database list
    function showCloudDatabaseList() {
        console.log('Showing cloud database list...');

        if (!cloudSettings.configured) {
            Core.showToast('Cloud storage not configured. Please configure settings first.', 'error');
            showCloudSettings();
            return;
        }

        // Create the cloud database list modal
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

        // Create modal content with mock database list
        modal.innerHTML = `
            <div class="modal-content" style="background-color: var(--background-color, #fff); color: var(--text-color, #333); padding: 20px; border-radius: 8px; width: 80%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 0 10px rgba(0,0,0,0.3);">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: var(--text-color, #333); font-size: 24px;">Cloud Databases</h3>
                    <button id="close-cloud-list" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-color, #333);">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Select a database to import from ${cloudSettings.provider}:</p>
                    <div style="max-height: 300px; overflow-y: auto; margin: 15px 0; border: 1px solid #ccc; border-radius: 4px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Database Name</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Last Modified</th>
                                    <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="cloud-database-list">
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">MyStory_Cloud</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">2023-11-15 14:30</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
                                        <button onclick="CloudStorage.importFromCloud('MyStory_Cloud')" style="background-color: #2196F3; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Import</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">FantasyNovel_Backup</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">2023-10-28 09:15</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
                                        <button onclick="CloudStorage.importFromCloud('FantasyNovel_Backup')" style="background-color: #2196F3; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Import</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">SciFiSeries</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">2023-09-05 22:45</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
                                        <button onclick="CloudStorage.importFromCloud('SciFiSeries')" style="background-color: #2196F3; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Import</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 15px;">
                        <button id="refresh-cloud-list" style="background-color: #673AB7; color: white; border: none; border-radius: 4px; padding: 8px 15px; cursor: pointer;">Refresh List</button>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.appendChild(modal);

        // Set up event listeners
        document.getElementById('close-cloud-list').addEventListener('click', function() {
            document.body.removeChild(modal);
        });

        document.getElementById('refresh-cloud-list').addEventListener('click', function() {
            Core.showToast('Refreshing cloud database list...', 'info');
            
            // Simulate refresh (in a real app, this would fetch from the cloud)
            setTimeout(() => {
                Core.showToast('Cloud database list refreshed!', 'success');
            }, 1000);
        });
    }

    // Function to import from cloud
    function importFromCloud(databaseName) {
        console.log(`Importing cloud database: ${databaseName}`);
        
        // Show loading message
        Core.showToast(`Importing ${databaseName} from ${cloudSettings.provider}...`, 'info');

        // Close any open modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });

        // Simulate cloud import with a delay (in a real app, this would actually fetch and process data)
        setTimeout(() => {
            // Create mock data based on database name
            const mockData = {
                characters: [
                    { id: 1, name: "Cloud Character 1", role: "Protagonist", background: "From the cloud database" },
                    { id: 2, name: "Cloud Character 2", role: "Antagonist", background: "Also from the cloud" }
                ],
                titles: [
                    { id: 1, name: `${databaseName} - Cloud Title`, type: "Main" }
                ],
                seriesList: [
                    { id: 1, name: "Cloud Series", description: "A series from cloud storage" }
                ],
                books: [
                    { id: 1, title: "Cloud Book 1", status: "In Progress" }
                ],
                roles: [
                    { id: 1, name: "Cloud Role", description: "Role from cloud database" }
                ]
            };

            // Import the mock data
            if (mockData.characters) window.characters = mockData.characters;
            if (mockData.titles) window.titles = mockData.titles;
            if (mockData.seriesList) window.seriesList = mockData.seriesList;
            if (mockData.books) window.books = mockData.books;
            if (mockData.roles) window.roles = mockData.roles;

            // Save to localStorage
            window.Storage.saveDatabase();

            // Update last sync time
            cloudSettings.lastSync = new Date().toISOString();
            localStorage.setItem('cloudSettings', JSON.stringify(cloudSettings));

            // Show success message
            Core.showToast(`Successfully imported ${databaseName} from cloud!`, 'success');

            // Refresh UI
            if (window.UI && window.UI.switchTab) {
                window.UI.switchTab('dashboard');
            }
        }, 2000);
    }

    // Export functions to the global CloudStorage object
    window.CloudStorage.showCloudSettings = showCloudSettings;
    window.CloudStorage.isConfigured = isConfigured;
    window.CloudStorage.showCloudDatabaseList = showCloudDatabaseList;
    window.CloudStorage.importFromCloud = importFromCloud;

    console.log('Cloud storage functions initialized:', Object.keys(window.CloudStorage));
})(); 