// Ultra simple save fix - using dynamic paths from localStorage
(function() {
    console.log('Ultra simple save fix loaded - using dynamic paths');
    
    // Override the save button click handler
    function fixSaveButton() {
        const saveButton = document.getElementById('saveDatabase');
        if (saveButton) {
            // Remove existing handler
            saveButton.removeAttribute('onclick');
            
            // Add ultra simple handler
            saveButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                try {
                    // Get the current database name
                    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
                    
                    // Get database directory from localStorage (set in settings dialog)
                    let dbDir = localStorage.getItem('databasePath');
                    
                    // If not in localStorage, try to get from settings
                    if (!dbDir && window.getSettings) {
                        const settings = window.getSettings();
                        if (settings && settings.databasePath) {
                            dbDir = settings.databasePath;
                        }
                    }
                    
                    // Final fallback to a relative path if all else fails
                    if (!dbDir) {
                        dbDir = "database";
                    }
                    
                    // Create the full path - handles both absolute and relative paths
                    const filePath = dbDir + "/" + dbName + ".json";
                    
                    console.log(`Saving to dynamic path: ${filePath}`);
                    
                    // Create data object
                    const data = {
                        characters: window.characters || [],
                        titles: window.titles || [],
                        seriesList: window.seriesList || [],
                        books: window.books || [],
                        roles: window.roles || [],
                        customFieldTypes: window.customFieldTypes || [],
                        relationships: window.relationships || [],
                        tags: window.tags || [],
                        plots: window.plots || [],
                        worldElements: window.worldElements || [],
                        version: window.APP_VERSION || '2.0.0',
                        databaseName: dbName
                    };
                    
                    // Convert to JSON
                    const json = JSON.stringify(data, null, 2);
                    
                    // Save using direct file method only
                    if (window.api && window.api.saveFile) {
                        window.api.saveFile(filePath, json, function(success) {
                            if (success) {
                                console.log(`Database saved to: ${filePath}`);
                                // Show simple notification
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast(`Saved to: ${filePath}`, 'success');
                                }
                            } else {
                                console.error(`Failed to save to: ${filePath}`);
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast(`Save failed!`, 'error');
                                }
                            }
                        });
                    }
                } catch (err) {
                    console.error('Error in save function:', err);
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast(`Save error: ${err.message}`, 'error');
                    }
                }
            });
            
            console.log('Save button fixed with dynamic path approach');
        } else {
            setTimeout(fixSaveButton, 500);
        }
    }
    
    // Initialize when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            fixSaveButton();
        });
    } else {
        fixSaveButton();
    }
})();
