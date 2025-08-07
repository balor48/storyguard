// Fix for the loadDatabasesFromFolder function to remove the Location column
(function() {
    // Store the original function
    const originalLoadDatabasesFromFolder = window.Dashboard.loadDatabasesFromFolder;
    
    // Create a new function that overrides the original
    function fixedLoadDatabasesFromFolder() {
        console.debug('DEBUG: Fixed loadDatabasesFromFolder called');
        
        // Check if we're in Electron (desktop app)
        if (window.api && window.api.readDatabaseFolder) {
            console.debug('DEBUG: Using Electron API to read database folder');
            try {
                // Show loading indicator
                Core.showToast('Loading databases...', 'info');
                
                // Set up event listener for the response
                window.api.onDatabaseFolderContents((databases) => {
                    console.debug('DEBUG: Received database list:', databases);
                    
                    // Check if the modal has been removed
                    if (window.databaseManagerModalRemoved) {
                        console.debug('DEBUG: Database manager modal was removed, skipping update');
                        return;
                    }
                    
                    // Double-check if the modal still exists in the DOM
                    const modalElement = document.querySelector('.modal');
                    if (!modalElement) {
                        console.debug('DEBUG: Modal element not found in DOM, marking as removed');
                        window.databaseManagerModalRemoved = true;
                        window.databaseSelectionModalRemoved = true;
                        return;
                    }
                    
                    // Get the database list element
                    const databaseList = document.getElementById('databaseList');
                    if (!databaseList) {
                        console.debug('DEBUG: Database list element not found, modal may have been removed');
                        // Set the flags to indicate all modals are removed
                        window.databaseManagerModalRemoved = true;
                        window.databaseSelectionModalRemoved = true;
                        return;
                    }
                    
                    // Get the current database name
                    const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
                    console.debug('DEBUG: Current database name:', currentDbName);
                    
                    // Clear all existing rows except the first one (current database)
                    while (databaseList.children.length > 0) {
                        databaseList.removeChild(databaseList.lastChild);
                    }
                    
                    // Create the current database row with green text
                    const currentRow = document.createElement('tr');
                    currentRow.innerHTML = `
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 45%;">${currentDbName}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 20%;">Current</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                            <button disabled style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: not-allowed; opacity: 0.5;">Switch</button>
                        </td>
                    `;
                    databaseList.appendChild(currentRow);
                    
                    // Filter out databases that don't exist (check if they have a valid path and exists property)
                    const validDatabases = databases.filter(db => db.exists === true);
                    console.debug('DEBUG: Filtered valid databases:', validDatabases);
                    
                    // Add each database to the list
                    validDatabases.forEach(db => {
                        // Skip the current database as it's already in the list
                        if (db.name === currentDbName) {
                            console.debug('DEBUG: Skipping current database:', db.name);
                            return;
                        }
                        
                        console.debug('DEBUG: Adding database to list:', db.name);
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 45%;">${db.name}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 20%;">Available</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                                <div style="display: flex; gap: 5px; justify-content: center;">
                                    <button class="switch-btn" onclick="Dashboard.switchToDatabase('${db.name}', '${db.path}')" style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Switch</button>
                                    <button class="delete-btn" onclick="Dashboard.confirmDeleteDatabase('${db.name}', '${db.path}')" style="background-color: #f44336; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Delete</button>
                                </div>
                            </td>
                        `;
                        databaseList.appendChild(row);
                    });
                    
                    // Hide loading indicator
                    Core.showToast('Databases loaded successfully', 'success');
                });
                
                // Get settings for database directory
                const settings = Storage.getSettings ? Storage.getSettings() : { databaseDirectory: window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database') };
                const databasePath = settings.databaseDirectory;
                console.debug('DEBUG: Reading database folder:', databasePath);
                
                // Use the Electron API to read the database folder
                window.api.readDatabaseFolder(databasePath);
            } catch (error) {
                console.error('DEBUG: Error loading databases from folder:', error);
                Core.showToast('Error loading databases from folder: ' + error.message, 'error');
            }
        } else {
            // Fallback for browser mode or if API is not available
            console.debug('DEBUG: Database folder API not available, using sample data');
            
            const databaseList = document.getElementById('databaseList');
            if (databaseList) {
                // Get the current database name
                const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
                
                // Clear all existing rows except the first one (current database)
                while (databaseList.children.length > 0) {
                    databaseList.removeChild(databaseList.lastChild);
                }
                
                // Create the current database row with green text
                const currentRow = document.createElement('tr');
                currentRow.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 45%;">${currentDbName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 20%;">Current</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                        <button disabled style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: not-allowed; opacity: 0.5;">Switch</button>
                    </td>
                `;
                databaseList.appendChild(currentRow);
                
                // Add sample databases
                const sampleDatabases = [
                    { name: 'sample-database', path: getDynamicPath('sample-database.json') }
                ];
                
                console.debug('DEBUG: Adding sample databases to list');
                
                // Add each database to the list
                sampleDatabases.forEach(db => {
                    // Skip the current database as it's already in the list
                    if (db.name === currentDbName) return;
                    
                    console.debug('DEBUG: Adding database to list:', db.name);
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 45%;">${db.name}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 20%;">Available</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                            <div style="display: flex; gap: 5px; justify-content: center;">
                                <button class="switch-btn" onclick="Dashboard.switchToDatabase('${db.name}', '${db.path}')" style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Switch</button>
                                <button class="delete-btn" onclick="Dashboard.confirmDeleteDatabase('${db.name}', '${db.path}')" style="background-color: #f44336; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Delete</button>
                            </div>
                        </td>
                    `;
                    databaseList.appendChild(row);
                });
            }
        }
    }
    
    // Override the original function
    window.Dashboard.loadDatabasesFromFolder = fixedLoadDatabasesFromFolder;
    
    console.log('Database Manager fix loaded - Location column removed');
})(); 