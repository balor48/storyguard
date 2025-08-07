// File operation functions
function initializeFileListeners() {
    // Listen for save-file event from main process (triggered by Save As menu)
    if (window.api && window.api.onSaveFile) {
        window.api.onSaveFile((filePath) => {
            console.log('Save As requested for path:', filePath);
            
            // Get the current database name
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            
            // Create a database object with all data
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
                version: APP_VERSION,
                dbName: dbName
            };
            
            // Export the database to the specified file path
            saveToSpecificPath(false, filePath);
        });
    }
    
    // Listen for open-file event from main process (triggered by Open menu)
    if (window.api && window.api.onOpenFile) {
        window.api.onOpenFile((filePath) => {
            console.log('Open requested for path:', filePath);
            openFileWithDefaultPath(filePath);
        });
    }
}

// Save database to a specific path (renamed from exportDatabase to avoid duplication)
function saveToSpecificPath(syncToCloud = false, customPath = null) {
    try {
        // Get the current database name
        const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
        
        // Create a database object with all data
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
            version: APP_VERSION,
            dbName: dbName
        };
        
        // Convert the data to JSON
        const jsonData = JSON.stringify(data, null, 2);
        
        // If a custom path is provided, save to that path
        if (customPath) {
            if (window.api && window.api.saveFile) {
                window.api.saveFile(customPath, jsonData, (success) => {
                    if (success) {
                        console.log('Database exported successfully to:', customPath);
                        UI.showNotification('Database exported successfully', 'success');
                        
                        // If syncToCloud is true, also sync to cloud
                        if (syncToCloud) {
                            syncWithCloud();
                        }
                    } else {
                        console.error('Failed to export database to:', customPath);
                        UI.showNotification('Failed to export database', 'error');
                    }
                });
            } else {
                console.error('API for saving files is not available');
                UI.showNotification('Failed to export database: API not available', 'error');
            }
            return;
        }
        
        // If no custom path, use the default save dialog
        if (window.api && window.api.showSaveDialog) {
            const defaultPath = `${dbName}_database.json`;
            window.api.showSaveDialog(defaultPath, (filePath) => {
                if (filePath) {
                    window.api.saveFile(filePath, jsonData, (success) => {
                        if (success) {
                            console.log('Database exported successfully to:', filePath);
                            UI.showNotification('Database exported successfully', 'success');
                            
                            // If syncToCloud is true, also sync to cloud
                            if (syncToCloud) {
                                syncWithCloud();
                            }
                        } else {
                            console.error('Failed to export database to:', filePath);
                            UI.showNotification('Failed to export database', 'error');
                        }
                    });
                } else {
                    console.log('Export canceled by user');
                }
            });
        } else {
            // Fallback for web version or when API is not available
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${dbName}_database.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Database exported successfully (browser download)');
            UI.showNotification('Database exported successfully', 'success');
            
            // If syncToCloud is true, also sync to cloud
            if (syncToCloud) {
                syncWithCloud();
            }
        }
    } catch (error) {
        console.error('Error exporting database:', error);
        UI.showNotification('Failed to export database: ' + error.message, 'error');
    }
}

// Function to save the database
function saveDatabase() {
    // Implementation code here
    console.log('Saving database...');
    // Get the current database name
    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
    
    // Save to local storage
    saveCharactersToStorage();
    savePlotsToStorage();
    saveLocationsToStorage();
    saveWorldElementsToStorage();
    saveRelationshipsToStorage();
    
    Core.showToast(`Database "${dbName}" saved successfully.`);
}

// Function to export locations (placeholder)
function exportLocations() {
    console.log('Exporting locations...');
    // Implementation would go here
}

// Function to import locations (placeholder)
function importLocations() {
    console.log('Importing locations...');
    // Implementation would go here
}

// Export the functions
export { 
    initializeFileListeners, 
    saveToSpecificPath, 
    saveDatabase,
    exportLocations,
    importLocations 
};