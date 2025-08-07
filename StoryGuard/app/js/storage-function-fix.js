// This script fixes Storage function availability for HTML button handlers
// It's designed to be loaded AFTER storage.js but BEFORE interaction begins

(function() {
    console.log('Storage function fix script running');
    
    // Check if Storage object exists
    if (!window.Storage) {
        console.warn('Storage object not found, creating it.');
        window.Storage = {};
    }
    
    // Define Storage in the global scope if it doesn't exist
    if (!window.Storage) {
        console.log('Creating Storage object in global scope');
        window.Storage = {};
    }

    // Function to create the import dialog modal
    function createImportDialog() {
        // Create the modal with rich UI
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
        
        // Use the EXACT original HTML structure from import.js
        modal.innerHTML = `
            <div class="modal-content" style="background-color: var(--background-color, #fff); color: var(--text-color, #333); padding: 20px; border-radius: 8px; width: 80%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 0 10px rgba(0,0,0,0.3);">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: var(--text-color, #333); font-size: 24px;">Import Database</h3>
                </div>
                <div class="modal-body">
                    <div class="import-options" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; align-items: center; text-align: center;">
                        <button id="import-local" class="import-option" style="display: inline-flex; align-items: center; padding: 10px 30px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; width: auto; min-width: 250px; justify-content: center; margin: 0 auto;">
                            <span class="import-icon" style="font-size: 20px; margin-right: 10px;">📁</span>
                            <span class="import-text">Import from File</span>
                        </button>
                        <button id="import-cloud" class="import-option" style="display: inline-flex; align-items: center; padding: 10px 30px; background-color: ${!window.CloudStorage ? '#cccccc' : '#2196F3'}; color: white; border: none; border-radius: 4px; cursor: ${!window.CloudStorage ? 'not-allowed' : 'pointer'}; font-size: 16px; font-weight: bold; opacity: ${!window.CloudStorage ? '0.7' : '1'}; width: auto; min-width: 250px; justify-content: center; margin: 10px auto 0;" ${!window.CloudStorage ? 'disabled' : ''}>
                            <span class="import-icon" style="font-size: 20px; margin-right: 10px;">☁️</span>
                            <span class="import-text">Import from Cloud</span>
                        </button>
                    </div>
                    
                    <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffeeba; font-size: 14px;">
                        <div style="display: flex; align-items: flex-start;">
                            <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
                            <div>
                                <strong>Important:</strong> Only import files that were exported from this program. Files from other sources will likely fail to import correctly and may cause errors.
                            </div>
                        </div>
                    </div>
                    
                    <div class="import-settings" style="margin-top: 20px; padding: 15px; border-top: 1px solid #ddd; background-color: #f8f9fa; color: #333; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; color: #333; font-size: 18px; text-align: center;">IMPORT DESTINATION</h4>
                        <div style="margin-bottom: 15px; background-color: #e3f2fd; padding: 10px; border-radius: 4px; border-left: 4px solid #2196F3; position: relative; min-height: 40px; display: flex; align-items: center; justify-content: space-between;">
                            <div style="flex-grow: 1; text-align: center;">
                                <span style="font-size: 16px; font-weight: bold; color: #333; white-space: nowrap;">Create NEW database</span>
                            </div>
                            <div style="width: 40px; display: flex; justify-content: center; align-items: center;">
                                <input type="radio" id="new-db-radio" name="import-mode" value="new" checked style="transform: scale(1.3);">
                            </div>
                        </div>
                        <div style="margin-bottom: 15px; background-color: #e9f7ef; padding: 10px; border-radius: 4px; border-left: 4px solid #4CAF50; position: relative; min-height: 40px; display: flex; align-items: center; justify-content: space-between;">
                            <div style="flex-grow: 1; text-align: center;">
                                <span style="font-size: 16px; font-weight: bold; color: #333; white-space: nowrap;">Add to "${localStorage.getItem('currentDatabaseName') || 'Default'}" database</span>
                            </div>
                            <div style="width: 40px; display: flex; justify-content: center; align-items: center;">
                                <input type="radio" id="existing-db-radio" name="import-mode" value="update" style="transform: scale(1.3);">
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: center; margin: 20px 0;">
                        <button id="cancel-import" style="background-color: #f44336; color: white; border: none; border-radius: 4px; padding: 10px 30px; font-size: 16px; font-weight: bold; cursor: pointer; width: auto; min-width: 150px;">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('Import dialog added to DOM');
        
        // Handle cancel button
        const cancelButton = document.getElementById('cancel-import');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                console.log('Cancel button clicked');
                document.body.removeChild(modal);
            });
        } else {
            console.error('Cancel button not found!');
        }
        
        // Handle import from local file
        const importLocalButton = document.getElementById('import-local');
        if (importLocalButton) {
            importLocalButton.addEventListener('click', function() {
                console.log('Import from local file button clicked');
                
                // Create and trigger file input
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json, .scxi';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                // Handle file selection
                fileInput.addEventListener('change', function(e) {
                    console.log('File selected');
                    const file = e.target.files[0];
                    if (!file) {
                        console.log('No file selected');
                        document.body.removeChild(fileInput);
                        return;
                    }
                    
                    // Get selected option
                    const createNew = document.getElementById('new-db-radio').checked;
                    console.log('Import mode:', createNew ? 'Create New' : 'Update Existing');
                    
                    // Read file
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            // Parse JSON
                            const data = JSON.parse(e.target.result);
                            console.log('File parsed successfully:', data);
                            
                            // ALWAYS extract database name from file if available,
                            // regardless of whether creating new or updating
                            let databaseName = localStorage.getItem('currentDatabaseName') || 'Default';
                            
                            if (createNew) {
                                // For new database, try to get a new name
                                if (data.metadata && data.metadata.databaseName) {
                                    databaseName = data.metadata.databaseName;
                                } else if (file.name) {
                                    // Try to use the filename (without extension) as the database name
                                    const filenameParts = file.name.split('.');
                                    if (filenameParts.length > 1) {
                                        filenameParts.pop(); // Remove extension
                                    }
                                    databaseName = filenameParts.join('.');
                                }
                                
                                console.log(`Setting database name to: ${databaseName}`);
                                localStorage.setItem('currentDatabaseName', databaseName);
                                
                                // CRITICAL FIX: Create new database by REPLACING all data arrays
                                // and saving them to localStorage
                                console.log('REPLACING all database content with imported data');
                                
                                // Clear existing data in memory
                                window.characters = [];
                                window.titles = [];
                                window.seriesList = [];
                                window.books = [];
                                window.roles = [];
                                window.customFieldTypes = [];
                                window.relationships = [];
                                window.tags = [];
                                window.plots = [];
                                window.worldElements = [];
                                
                                // Load the imported data into memory
                                if (Array.isArray(data.characters)) window.characters = data.characters;
                                if (Array.isArray(data.titles)) window.titles = data.titles;
                                if (Array.isArray(data.seriesList)) window.seriesList = data.seriesList;
                                if (Array.isArray(data.books)) window.books = data.books;
                                if (Array.isArray(data.roles)) window.roles = data.roles;
                                if (Array.isArray(data.customFieldTypes)) window.customFieldTypes = data.customFieldTypes;
                                if (Array.isArray(data.relationships)) window.relationships = data.relationships;
                                if (Array.isArray(data.tags)) window.tags = data.tags;
                                if (Array.isArray(data.plots)) window.plots = data.plots;
                                if (Array.isArray(data.worldElements)) window.worldElements = data.worldElements;
                                
                                // CRITICAL FIX: Save all data to localStorage to persist it
                                localStorage.setItem('characters', JSON.stringify(window.characters || []));
                                localStorage.setItem('titles', JSON.stringify(window.titles || []));
                                localStorage.setItem('seriesList', JSON.stringify(window.seriesList || []));
                                localStorage.setItem('books', JSON.stringify(window.books || []));
                                localStorage.setItem('roles', JSON.stringify(window.roles || []));
                                localStorage.setItem('customFieldTypes', JSON.stringify(window.customFieldTypes || []));
                                localStorage.setItem('relationships', JSON.stringify(window.relationships || []));
                                localStorage.setItem('tags', JSON.stringify(window.tags || []));
                                localStorage.setItem('plots', JSON.stringify(window.plots || []));
                                localStorage.setItem('worldElements', JSON.stringify(window.worldElements || []));
                                
                                // Show success notification
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast(`Database "${databaseName}" imported successfully!`, 'success');
                                } else {
                                    alert(`Database "${databaseName}" imported successfully!`);
                                }
                            } else {
                                // Update existing database - MERGE arrays
                                if (Array.isArray(data.characters)) {
                                    window.characters = (window.characters || []).concat(data.characters);
                                }
                                
                                if (Array.isArray(data.titles)) {
                                    window.titles = (window.titles || []).concat(data.titles);
                                }
                                
                                if (Array.isArray(data.seriesList)) {
                                    window.seriesList = (window.seriesList || []).concat(data.seriesList);
                                }
                                
                                if (Array.isArray(data.books)) {
                                    window.books = (window.books || []).concat(data.books);
                                }
                                
                                if (Array.isArray(data.roles)) {
                                    window.roles = (window.roles || []).concat(data.roles);
                                }
                                
                                if (Array.isArray(data.customFieldTypes)) {
                                    window.customFieldTypes = (window.customFieldTypes || []).concat(data.customFieldTypes);
                                }
                                
                                if (Array.isArray(data.relationships)) {
                                    window.relationships = (window.relationships || []).concat(data.relationships);
                                }
                                
                                if (Array.isArray(data.tags)) {
                                    window.tags = (window.tags || []).concat(data.tags);
                                }
                                
                                if (Array.isArray(data.plots)) {
                                    window.plots = (window.plots || []).concat(data.plots);
                                }
                                
                                if (Array.isArray(data.worldElements)) {
                                    window.worldElements = (window.worldElements || []).concat(data.worldElements);
                                }
                                
                                // Show success notification
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast('Database updated successfully!', 'success');
                                } else {
                                    alert('Database updated successfully!');
                                }
                            }
                            
                            // Close modal
                            if (document.body.contains(modal)) {
                                document.body.removeChild(modal);
                            }
                            
                            // Critical: Navigation to dashboard and hard refresh
                            console.log('Switching to dashboard tab and reloading...');
                            // First try to switch to dashboard tab
                            try {
                                const dashboardTab = document.querySelector('#dashboard-tab');
                                if (dashboardTab) {
                                    dashboardTab.click();
                                    console.log('Switched to dashboard tab');
                                }
                            } catch (navError) {
                                console.error('Error switching to dashboard tab:', navError);
                            }
                            
                            // Then reload the page
                            setTimeout(function() {
                                window.location.reload();
                            }, 500);
                            
                        } catch (error) {
                            console.error('Error importing file:', error);
                            if (window.Core && window.Core.showToast) {
                                window.Core.showToast('Error importing database: ' + error.message, 'error');
                            } else {
                                alert('Error importing database: ' + error.message);
                            }
                        } finally {
                            document.body.removeChild(fileInput);
                        }
                    };
                    
                    reader.readAsText(file);
                });
                
                // Trigger file selection dialog
                fileInput.click();
            });
        } else {
            console.error('Import from local file button not found!');
        }
        
        // Handle import from cloud
        const importCloudButton = document.getElementById('import-cloud');
        if (importCloudButton && !importCloudButton.disabled) {
            importCloudButton.addEventListener('click', function() {
                console.log('Import from cloud button clicked');
                // Would implement cloud import functionality here
                if (window.CloudStorage && typeof window.CloudStorage.showImportFromCloudDialog === 'function') {
                    // Remove current modal first
                    document.body.removeChild(modal);
                    // Call cloud import function
                    window.CloudStorage.showImportFromCloudDialog();
                } else {
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast('Cloud import is not available in this version', 'error');
                    } else {
                        alert('Cloud import is not available in this version');
                    }
                }
            });
        }
    }
    
    // Main import database function
    function importDatabase(fromCloud = false) {
        console.log('IMPORT DATABASE FUNCTION CALLED SUCCESSFULLY');
        
        // Reset modal state completely (like the original)
        window.databaseManagerModalRemoved = true;
        window.databaseSelectionModalRemoved = true;
        window.currentModalType = null;
        console.log('importDatabase - modal state fully reset at start');
        
        if (fromCloud) {
            // Import from cloud directly (would need implementation)
            console.log('Cloud import not implemented in fallback');
            return;
        }
        
        // First, make sure any existing modals are removed with proper cleanup
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            if (document.body.contains(modal)) {
                // Clone and replace all buttons to remove event listeners
                const allButtons = modal.querySelectorAll('button');
                allButtons.forEach(button => {
                    const newButton = button.cloneNode(true);
                    if (button.parentNode) {
                        button.parentNode.replaceChild(newButton, button);
                    }
                });
                
                // Then remove the modal
                document.body.removeChild(modal);
                console.log('Removed existing modal with enhanced cleanup before showing import dialog');
            }
        });
        
        createImportDialog();
    }
    
    // Function to handle file selection via input element
    function handleFileSelect(input) {
        console.log('File selected');
        const file = input.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        // Get selected option
        const createNew = document.getElementById('new-db-radio').checked;
        console.log('Import mode:', createNew ? 'Create New' : 'Update Existing');
        
        // Read file
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Parse JSON
                const data = JSON.parse(e.target.result);
                console.log('File parsed successfully:', data);
                
                // ALWAYS extract database name from file if available,
                // regardless of whether creating new or updating
                let databaseName = localStorage.getItem('currentDatabaseName') || 'Default';
                
                if (createNew) {
                    // For new database, try to get a new name
                    if (data.metadata && data.metadata.databaseName) {
                        databaseName = data.metadata.databaseName;
                    } else if (file.name) {
                        // Try to use the filename (without extension) as the database name
                        const filenameParts = file.name.split('.');
                        if (filenameParts.length > 1) {
                            filenameParts.pop(); // Remove extension
                        }
                        databaseName = filenameParts.join('.');
                    }
                    
                    console.log(`Setting database name to: ${databaseName}`);
                    localStorage.setItem('currentDatabaseName', databaseName);
                    
                    // Create new database - REPLACE all data arrays
                    if (Array.isArray(data.characters)) window.characters = data.characters;
                    if (Array.isArray(data.titles)) window.titles = data.titles;
                    if (Array.isArray(data.seriesList)) window.seriesList = data.seriesList;
                    if (Array.isArray(data.books)) window.books = data.books;
                    if (Array.isArray(data.roles)) window.roles = data.roles;
                    if (Array.isArray(data.customFieldTypes)) window.customFieldTypes = data.customFieldTypes;
                    if (Array.isArray(data.relationships)) window.relationships = data.relationships;
                    if (Array.isArray(data.tags)) window.tags = data.tags;
                    if (Array.isArray(data.plots)) window.plots = data.plots;
                    if (Array.isArray(data.worldElements)) window.worldElements = data.worldElements;
                    
                    // Show success notification
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast(`Database "${databaseName}" imported successfully!`, 'success');
                    } else {
                        alert(`Database "${databaseName}" imported successfully!`);
                    }
                } else {
                    // Update existing database - MERGE arrays
                    if (Array.isArray(data.characters)) {
                        window.characters = (window.characters || []).concat(data.characters);
                    }
                    
                    if (Array.isArray(data.titles)) {
                        window.titles = (window.titles || []).concat(data.titles);
                    }
                    
                    if (Array.isArray(data.seriesList)) {
                        window.seriesList = (window.seriesList || []).concat(data.seriesList);
                    }
                    
                    if (Array.isArray(data.books)) {
                        window.books = (window.books || []).concat(data.books);
                    }
                    
                    if (Array.isArray(data.roles)) {
                        window.roles = (window.roles || []).concat(data.roles);
                    }
                    
                    if (Array.isArray(data.customFieldTypes)) {
                        window.customFieldTypes = (window.customFieldTypes || []).concat(data.customFieldTypes);
                    }
                    
                    if (Array.isArray(data.relationships)) {
                        window.relationships = (window.relationships || []).concat(data.relationships);
                    }
                    
                    if (Array.isArray(data.tags)) {
                        window.tags = (window.tags || []).concat(data.tags);
                    }
                    
                    if (Array.isArray(data.plots)) {
                        window.plots = (window.plots || []).concat(data.plots);
                    }
                    
                    if (Array.isArray(data.worldElements)) {
                        window.worldElements = (window.worldElements || []).concat(data.worldElements);
                    }
                    
                    // Show success notification
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast('Database updated successfully!', 'success');
                    } else {
                        alert('Database updated successfully!');
                    }
                }
                
                // Close modal
                const modal = document.querySelector('.modal');
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                
                // Critical: Navigation to dashboard and hard refresh
                console.log('Switching to dashboard tab and reloading...');
                // First try to switch to dashboard tab
                try {
                    const dashboardTab = document.querySelector('#dashboard-tab');
                    if (dashboardTab) {
                        dashboardTab.click();
                        console.log('Switched to dashboard tab');
                    }
                } catch (navError) {
                    console.error('Error switching to dashboard tab:', navError);
                }
                
                // Then reload the page
                setTimeout(function() {
                    window.location.reload();
                }, 500);
                
            } catch (error) {
                console.error('Error importing file:', error);
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Error importing database: ' + error.message, 'error');
                } else {
                    alert('Error importing database: ' + error.message);
                }
            }
        };
        
        reader.readAsText(file);
    }
    
    // Function to process the selected file
    function processFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Parse JSON
                const data = JSON.parse(e.target.result);
                console.log('File parsed successfully:', data);
                
                // Process the imported data
                processImportedData(data, file.name);
            } catch (error) {
                console.error('Error importing file:', error);
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Error importing database: ' + error.message, 'error');
                } else {
                    alert('Error importing database: ' + error.message);
                }
            }
        };
        
        reader.readAsText(file);
    }
    
    // Function to process the imported data
    function processImportedData(data, filename) {
        // ALWAYS extract database name from file if available,
        // regardless of whether creating new or updating
        let databaseName = localStorage.getItem('currentDatabaseName') || 'Default';
        
        // Get selected option
        const createNew = document.getElementById('new-db-radio').checked;
        console.log('Import mode:', createNew ? 'Create New' : 'Update Existing');
        
        if (createNew) {
            // For new database, try to get a new name
            if (data.metadata && data.metadata.databaseName) {
                databaseName = data.metadata.databaseName;
            } else if (filename) {
                // Try to use the filename (without extension) as the database name
                const filenameParts = filename.split('.');
                if (filenameParts.length > 1) {
                    filenameParts.pop(); // Remove extension
                }
                databaseName = filenameParts.join('.');
            }
            
            console.log(`Setting database name to: ${databaseName}`);
            localStorage.setItem('currentDatabaseName', databaseName);
            
            // Create new database - REPLACE all data arrays
            if (Array.isArray(data.characters)) window.characters = data.characters;
            if (Array.isArray(data.titles)) window.titles = data.titles;
            if (Array.isArray(data.seriesList)) window.seriesList = data.seriesList;
            if (Array.isArray(data.books)) window.books = data.books;
            if (Array.isArray(data.roles)) window.roles = data.roles;
            if (Array.isArray(data.customFieldTypes)) window.customFieldTypes = data.customFieldTypes;
            if (Array.isArray(data.relationships)) window.relationships = data.relationships;
            if (Array.isArray(data.tags)) window.tags = data.tags;
            if (Array.isArray(data.plots)) window.plots = data.plots;
            if (Array.isArray(data.worldElements)) window.worldElements = data.worldElements;
            
            // Show success notification
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Database "${databaseName}" imported successfully!`, 'success');
            } else {
                alert(`Database "${databaseName}" imported successfully!`);
            }
        } else {
            // Update existing database - MERGE arrays
            if (Array.isArray(data.characters)) {
                window.characters = (window.characters || []).concat(data.characters);
            }
            
            if (Array.isArray(data.titles)) {
                window.titles = (window.titles || []).concat(data.titles);
            }
            
            if (Array.isArray(data.seriesList)) {
                window.seriesList = (window.seriesList || []).concat(data.seriesList);
            }
            
            if (Array.isArray(data.books)) {
                window.books = (window.books || []).concat(data.books);
            }
            
            if (Array.isArray(data.roles)) {
                window.roles = (window.roles || []).concat(data.roles);
            }
            
            if (Array.isArray(data.customFieldTypes)) {
                window.customFieldTypes = (window.customFieldTypes || []).concat(data.customFieldTypes);
            }
            
            if (Array.isArray(data.relationships)) {
                window.relationships = (window.relationships || []).concat(data.relationships);
            }
            
            if (Array.isArray(data.tags)) {
                window.tags = (window.tags || []).concat(data.tags);
            }
            
            if (Array.isArray(data.plots)) {
                window.plots = (window.plots || []).concat(data.plots);
            }
            
            if (Array.isArray(data.worldElements)) {
                window.worldElements = (window.worldElements || []).concat(data.worldElements);
            }
            
            // Show success notification
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Database updated successfully!', 'success');
            } else {
                alert('Database updated successfully!');
            }
        }
    }
    
    // Function to create a backup of the current database
    function backupDatabase(toCloud = false) {
        try {
            console.log('Backup database called');
            
            // Get the current database name
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            console.log('Backing up database:', dbName);
            
            // Create a database object with all data
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
                version: '2.1.0', // Current app version
                databaseName: dbName,
                backupDate: new Date().toISOString()
            };
            
            // Get current date and time for the backup filename
            const now = new Date();
            const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
            
            // Get settings for default directory
            const settings = localStorage.getItem('settings') ? 
                JSON.parse(localStorage.getItem('settings')) : 
                { backupDirectory: localStorage.getItem('backupDirectory') || path.join(app.getPath('userData'), 'backup') };
            
            // Use directory from settings if available
            const directory = settings.backupDirectory || (window.api && window.api.getPaths ? window.api.getPaths().backup : path.join(app.getPath('userData'), 'backup'));
            console.log('Using backup directory:', directory);
            
            // Ensure the directory exists
            ensureDirectoryExists(directory);
            
            // Create filename with database name, date and time
            const filename = `${dbName}_backup_${date}_${time}.json`;
            
            // Check if we're running in Electron
            if (window.api && window.api.saveFile) {
                // Use Electron API to save the file
                const backupPath = directory ? `${directory}\\${filename}` : filename;
                console.log('Full backup path:', backupPath);
                const jsonData = JSON.stringify(data, null, 2);
                
            // Show notification without full path to avoid confusion
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Creating backup...`, 'info');
            }
            
            window.api.saveFile(backupPath, jsonData, (success) => {
                if (success) {
                    console.log('Database backup created successfully at:', backupPath);
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast(`Database backup created successfully`, 'success');
                    }
                    } else {
                        console.error('Failed to create database backup at:', backupPath);
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Failed to create database backup`, 'error');
                        }
                        // Fallback to download as file
                        createDownloadBackup(data, date, time, dbName);
                    }
                });
            } else {
                // Web version - fallback to download as file
                console.log('Running in web mode, creating downloadable backup');
                createDownloadBackup(data, date, time, dbName);
            }
        } catch (error) {
            console.error('Error creating database backup:', error);
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Error creating database backup: ' + error.message, 'error');
            }
        }
    }
    
    // Function to create a downloadable backup file
    function createDownloadBackup(data, date, time, dbName) {
        try {
            // Create a JSON string from the data
            const jsonData = JSON.stringify(data, null, 2);
            
            // Create a blob from the JSON string
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Create a URL for the blob
            const url = URL.createObjectURL(blob);
            
            // Create a filename
            const filename = `${dbName}_backup_${date}_${time}.json`;
            
            // Create a link element
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Append the link to the document
            document.body.appendChild(link);
            
            // Click the link to start the download
            link.click();
            
            // Remove the link from the document
            document.body.removeChild(link);
            
            // Show success message
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Database saved successfully as download', 'success');
            }
        } catch (error) {
            console.error('Error creating downloadable backup:', error);
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Error saving database: ' + error.message, 'error');
            }
        }
    }
    
    // Function to export the database with a file dialog
    function exportDatabase(syncToCloud = false) {
        console.log('exportDatabase function called');
        try {
            // Check if we're in Electron environment
            console.log('Checking for Electron environment:', { api: !!window.api, send: window.api ? !!window.api.send : false });
            if (window.api && window.api.send) {
                // Prepare the data to export
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
                    exportDate: new Date().toISOString(),
                    version: '2.0.0',
                    metadata: {
                        databaseName: localStorage.getItem('currentDatabaseName') || 'Story Database'
                    }
                };
                
                // Get the database folder path from settings or use default
                let dbFolder = localStorage.getItem('databaseFolderPath');
                if (!dbFolder) {
                    dbFolder = window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database');
                }
                
                // Get current database name for the default filename
                const dbName = localStorage.getItem('currentDatabaseName') || 'story-database';
                const defaultPath = `${dbFolder}\\${dbName.replace(/\s+/g, '-').toLowerCase()}.json`;
                
                // Use the save-file-with-dialog IPC message to show a file save dialog
                console.log('Sending save-file-with-dialog message to main process');
                
                // Set up one-time listeners for the response before sending the request
                const onSaved = (event, filePath) => {
                    console.log('File saved to:', filePath);
                    if (window.Core && Core.showToast) {
                        Core.showToast('Database exported successfully');
                    }
                    
                    // Sync to cloud if requested
                    if (syncToCloud && window.syncWithCloud) {
                        syncWithCloud()
                            .then(() => {
                                if (window.Core && Core.showToast) {
                                    Core.showToast('Database synced to cloud');
                                }
                            })
                            .catch(error => {
                                console.error('Error syncing with cloud:', error);
                                if (window.Core && Core.showToast) {
                                    Core.showToast('Error syncing with cloud', 'error');
                                }
                            });
                    }
                    
                    // Remove the listeners after handling the response
                    window.api.removeAllListeners('file-saved');
                    window.api.removeAllListeners('file-error');
                };
                
                const onError = (event, errorMessage) => {
                    console.error('Error saving file:', errorMessage);
                    if (window.Core && Core.showToast) {
                        Core.showToast(`Error exporting database: ${errorMessage}`, 'error');
                    }
                    
                    // Remove the listeners after handling the error
                    window.api.removeAllListeners('file-saved');
                    window.api.removeAllListeners('file-error');
                };
                
                // Set up the event listeners
                window.api.on('file-saved', onSaved);
                window.api.on('file-error', onError);
                
                // Send the request
                window.api.send('save-file-with-dialog', {
                    defaultPath: defaultPath,
                    content: JSON.stringify(data, null, 2)
                });
                
                return;
            }
            
            console.log('Falling back to web environment export');
            
            // Fallback for web environment - prepare the data to export
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
                exportDate: new Date().toISOString(),
                version: '2.0.0',
                metadata: {
                    databaseName: localStorage.getItem('currentDatabaseName') || 'Story Database'
                }
            };
            
            // For web environment, create a download
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dbName = localStorage.getItem('currentDatabaseName') || 'story-database';
            a.download = `${dbName.replace(/\s+/g, '-').toLowerCase()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show success message
            if (window.Core && Core.showToast) {
                Core.showToast('Database exported successfully');
            } else {
                alert('Database exported successfully');
            }
            
            // Sync to cloud if requested
            if (syncToCloud && window.syncWithCloud) {
                syncWithCloud()
                    .then(() => {
                        if (window.Core && Core.showToast) {
                            Core.showToast('Database synced to cloud');
                        }
                    })
                    .catch(error => {
                        console.error('Error syncing with cloud:', error);
                        if (window.Core && Core.showToast) {
                            Core.showToast('Error syncing with cloud', 'error');
                        }
                    });
            }
        } catch (error) {
            console.error('Error exporting database:', error);
            if (window.Core && Core.showToast) {
                Core.showToast('Error exporting database: ' + error.message, 'error');
            } else {
                alert('Error exporting database: ' + error.message);
            }
        }
    }
    
    // Function to ensure directory exists
    function ensureDirectoryExists(directory) {
        if (window.api && window.api.ensureDirectoryExists) {
            window.api.ensureDirectoryExists(directory, (success) => {
                if (success) {
                    console.log(`Directory created or already exists: ${directory}`);
                } else {
                    console.error(`Failed to create directory: ${directory}`);
                }
            });
        }
    }
    
    // Function to save the database automatically to the configured directory
    function saveDatabase() {
        try {
            console.log('Save database called');
            
            // Get the current database name
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            console.log('Saving database:', dbName);
            
            // Create a database object with all data
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
                version: '2.1.0', // Current app version
                databaseName: dbName,
                saveDate: new Date().toISOString()
            };
            
            // Get settings for default directory
            const settings = localStorage.getItem('settings') ? 
                JSON.parse(localStorage.getItem('settings')) : 
                { databaseDirectory: localStorage.getItem('databaseDirectory') || (window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database')) };
            
            // Use directory from settings if available
            const directory = settings.databaseDirectory || (window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database'));
            console.log('Using directory for save:', directory);
            
            // Ensure the directory exists
            ensureDirectoryExists(directory);
            
            // Create filename with database name
            const filename = `${dbName}.json`;
            
            // Check if we're running in Electron
            if (window.api && window.api.saveFile) {
                // Use Electron API to save the file directly without dialog
                const savePath = directory ? `${directory}\\${filename}` : filename;
                console.log('Full save path:', savePath);
                const jsonData = JSON.stringify(data, null, 2);
                
                // Show notification without full path to avoid confusion
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Saving database...`, 'info');
                }
                
                window.api.saveFile(savePath, jsonData, (success) => {
                    if (success) {
                        console.log('Database saved successfully at:', savePath);
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Database saved successfully`, 'success');
                        }
                    } else {
                        console.error('Failed to save database at:', savePath);
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Failed to save database`, 'error');
                        }
                        // Fallback to localStorage only
                    }
                });
            } else {
                // Web version - just save to localStorage and show notification
                console.log('Running in web mode, saving to localStorage only');
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Database saved successfully to localStorage', 'success');
                }
            }
            
            // Always save to localStorage
            localStorage.setItem('characters', JSON.stringify(window.characters || []));
            localStorage.setItem('titles', JSON.stringify(window.titles || []));
            localStorage.setItem('seriesList', JSON.stringify(window.seriesList || []));
            localStorage.setItem('books', JSON.stringify(window.books || []));
            localStorage.setItem('roles', JSON.stringify(window.roles || []));
            localStorage.setItem('customFieldTypes', JSON.stringify(window.customFieldTypes || []));
            localStorage.setItem('relationships', JSON.stringify(window.relationships || []));
            localStorage.setItem('tags', JSON.stringify(window.tags || []));
            localStorage.setItem('plots', JSON.stringify(window.plots || []));
            localStorage.setItem('worldElements', JSON.stringify(window.worldElements || []));
            
        } catch (error) {
            console.error('Error saving database:', error);
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Error saving database: ' + error.message, 'error');
            }
        }
    }
    
    // Function to create a downloadable save file
    function createDownloadSave(data, date, time, dbName) {
        try {
            // Create a JSON string from the data
            const jsonData = JSON.stringify(data, null, 2);
            
            // Create a blob from the JSON string
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Create a URL for the blob
            const url = URL.createObjectURL(blob);
            
            // Create a filename
            const filename = `${dbName}_${date}.json`;
            
            // Create a link element
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Append the link to the document
            document.body.appendChild(link);
            
            // Click the link to start the download
            link.click();
            
            // Remove the link from the document
            document.body.removeChild(link);
            
            // Show success message
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Database saved successfully as download', 'success');
            }
        } catch (error) {
            console.error('Error creating downloadable save:', error);
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Error saving database: ' + error.message, 'error');
            }
        }
    }
    
    // Add settings functionality
    if (typeof window.Storage.showSettingsDialog !== 'function') {
        console.warn('showSettingsDialog not found in Storage module, it should be imported from storage/settings.js');
    }
    
    // Function to initialize the application
    function initializeApp() {
        console.log('Initializing application...');
        
        // Update existing settings to use correct paths
        updateSettingsPaths();
        
        // Other initialization code...
    }
    
    // Function to update settings paths to the correct values
    function updateSettingsPaths() {
        console.log('Updating settings paths');
        try {
            // Get paths from main process
            api.getPaths((paths) => {
                // Store paths in localStorage
                if (paths.userDataPath) {
                    localStorage.setItem('userDataPath', paths.userDataPath);
                }
                if (paths.databasePath) {
                    localStorage.setItem('databasePath', paths.databasePath);
                }
                if (paths.backupPath) {
                    localStorage.setItem('backupPath', paths.backupPath);
                }
                
                console.log('Settings paths updated:', paths);
                
                // Show success toast only if DOM is ready
                if (document && document.body && window.Core && window.Core.showToast) {
                    // Wait a moment before showing the toast
                    setTimeout(() => {
                        window.Core.showToast('Settings paths updated', 'success');
                    }, 1000);
                } else {
                    console.log('DOM not ready yet, skipping toast notification');
                }
            });
        } catch (error) {
            console.error('Error updating settings paths:', error);
        }
    }
    
    // Call the initialization function when the module loads
    updateSettingsPaths();
    
    // Attach the functions to the window.Storage object if it exists
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Setting up DOMContentLoaded event listener');
        // Wait a bit to ensure Storage is loaded
        setTimeout(() => {
            console.log('Attaching storage functions...');
            
            // Override the import function
            window.Storage.importDatabase = importDatabase;
            console.log('u2713 importDatabase successfully attached to window.Storage');
            
            // Override the backup function
            window.Storage.backupDatabase = backupDatabase;
            console.log('u2713 backupDatabase successfully attached to window.Storage');
            
            // Fix for showSettingsDialog - properly import it from settings module
            try {
                // Try to get the settings module
                if (window.StorageSettings && typeof window.StorageSettings.showSettingsDialog === 'function') {
                    window.Storage.showSettingsDialog = window.StorageSettings.showSettingsDialog;
                    console.log('u2713 showSettingsDialog imported from StorageSettings module');
                } else if (window.Settings && typeof window.Settings.showSettingsDialog === 'function') {
                    window.Storage.showSettingsDialog = window.Settings.showSettingsDialog;
                    console.log('u2713 showSettingsDialog imported from Settings module');
                } else {
                    // Fallback implementation
                    window.Storage.showSettingsDialog = function() {
                        console.log('Opening settings dialog (fallback implementation)');
                        // Try to use the IPC API to open settings
                        if (window.api && typeof window.api.send === 'function') {
                            window.api.send('open-settings-dialog');
                        } else {
                            console.error('Cannot open settings dialog: API not available');
                            if (window.Core && window.Core.showToast) {
                                window.Core.showToast('Settings dialog not available', 'error');
                            }
                        }
                    };
                    console.log('u2713 showSettingsDialog fallback implementation created');
                }
            } catch (error) {
                console.error('Error setting up showSettingsDialog:', error);
            }
            
            // Override the export function
            window.Storage.exportDatabase = exportDatabase;
            console.log('u2713 exportDatabase successfully attached to window.Storage');
            
            // Override the save function
            window.Storage.saveDatabase = saveDatabase;
            console.log('u2713 saveDatabase successfully attached to window.Storage');
        }, 1000);
    });
    
    // Check if functions are attached
    setTimeout(() => {
        if (typeof window.Storage.importDatabase === 'function') {
            console.log('u2713 importDatabase successfully attached to window.Storage');
        } else {
            console.error('u2717 importDatabase still not available on window.Storage');
        }
        
        if (typeof window.Storage.backupDatabase === 'function') {
            console.log('u2713 backupDatabase successfully attached to window.Storage');
        } else {
            console.error('u2717 backupDatabase still not available on window.Storage');
        }
        
        if (typeof window.Storage.showSettingsDialog === 'function') {
            console.log('u2713 showSettingsDialog successfully attached to window.Storage');
        } else {
            console.error('u2717 showSettingsDialog still not available on window.Storage');
        }
        
        if (typeof window.Storage.exportDatabase === 'function') {
            console.log('u2713 exportDatabase successfully attached to window.Storage');
        } else {
            console.error('u2717 exportDatabase still not available on window.Storage');
        }
        
        if (typeof window.Storage.saveDatabase === 'function') {
            console.log('u2713 saveDatabase successfully attached to window.Storage');
        } else {
            console.error('u2717 saveDatabase still not available on window.Storage');
        }
    }, 1000);
    
    // Define Storage in the global scope if it doesn't exist
    if (!window.Storage) {
        console.log('Creating Storage object in global scope');
        window.Storage = {};
    }

// Define the missing loadDatabase function
function loadDatabase(dbName) {
    console.log(`Loading database: ${dbName}`);
    try {
        // Set the current database name in localStorage
        if (dbName) {
            localStorage.setItem('currentDatabaseName', dbName);
        }
        
        // Get the database name from localStorage if not provided
        dbName = dbName || localStorage.getItem('currentDatabaseName') || 'Default';
        
        // Check if we're in Electron environment
        if (window.api && window.api.readDatabaseFile) {
            const dbDir = localStorage.getItem('databaseDirectory') || (window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database'));
            const dbPath = `${dbDir}\\${dbName}.json`;
            
            // Read the database file
            window.api.readDatabaseFile(dbPath);
            return true;
        } else {
            // Web environment - load from localStorage
            console.log('Using localStorage to load data');
            
            // Load data from localStorage
            window.characters = JSON.parse(localStorage.getItem('characters') || '[]');
            window.titles = JSON.parse(localStorage.getItem('titles') || '[]');
            window.seriesList = JSON.parse(localStorage.getItem('seriesList') || '[]');
            window.books = JSON.parse(localStorage.getItem('books') || '[]');
            window.roles = JSON.parse(localStorage.getItem('roles') || '[]');
            window.customFieldTypes = JSON.parse(localStorage.getItem('customFieldTypes') || '[]');
            window.relationships = JSON.parse(localStorage.getItem('relationships') || '[]');
            window.tags = JSON.parse(localStorage.getItem('tags') || '[]');
            window.plots = JSON.parse(localStorage.getItem('plots') || '[]');
            window.worldElements = JSON.parse(localStorage.getItem('worldElements') || '[]');
            
            // Update UI to reflect the loaded database
            if (window.UI && window.UI.updateDatabaseIndicator) {
                window.UI.updateDatabaseIndicator(dbName);
            }
            
            return true;
        }
    } catch (error) {
        console.error('Error loading database:', error);
        return false;
    }
}

// Function to load database from file
function loadDatabaseFromFile(content) {
    console.log('========================================');
    console.log('LOADING DATABASE FROM FILE');
    console.log('Content length:', content ? content.length : 0);
    console.log('========================================');
    
    try {
        // Parse the content
        const data = JSON.parse(content);
        console.log('Successfully parsed JSON content with keys:', Object.keys(data));
        
        // Validate the content
        if (!data || (!data.characters && !data.titles && !data.books)) {
            console.error('Invalid database format - missing required data');
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Invalid database format', 'error');
            }
            return false;
        }
        
        // Clear existing data
        console.log('Clearing existing data before import');
        window.characters = [];
        window.titles = [];
        window.seriesList = [];
        window.books = [];
        window.roles = [];
        window.customFieldTypes = [];
        window.relationships = [];
        window.tags = [];
        
        // Load the data
        console.log('Loading data from imported file');
        if (data.characters) {
            console.log('Loading characters:', data.characters.length);
            window.characters = data.characters;
        }
        if (data.titles) {
            console.log('Loading titles:', data.titles.length);
            window.titles = data.titles;
        }
        if (data.seriesList) {
            console.log('Loading series:', data.seriesList.length);
            window.seriesList = data.seriesList;
        }
        if (data.books) {
            console.log('Loading books:', data.books.length);
            window.books = data.books;
        }
        if (data.roles) {
            console.log('Loading roles:', data.roles.length);
            window.roles = data.roles;
        }
        if (data.customFieldTypes) {
            console.log('Loading custom field types:', data.customFieldTypes.length);
            window.customFieldTypes = data.customFieldTypes;
        }
        if (data.relationships) {
            console.log('Loading relationships:', data.relationships.length);
            window.relationships = data.relationships;
        }
        if (data.tags) {
            console.log('Loading tags:', data.tags.length);
            window.tags = data.tags;
        }
        if (data.plots) {
            console.log('Loading plots:', data.plots.length);
            window.plots = data.plots;
        }
        if (data.worldElements) {
            console.log('Loading world elements:', data.worldElements.length);
            window.worldElements = data.worldElements;
        }
        
        // Database name handling
        if (data.databaseName) {
            console.log('Using database name from file:', data.databaseName);
            localStorage.setItem('currentDatabaseName', data.databaseName);
        } else {
            console.log('No database name found in file, using default');
            localStorage.setItem('currentDatabaseName', 'Imported Database');
        }
        
        // Save the data to localStorage
        console.log('Saving imported data to localStorage');
        if (typeof window.saveToLocalStorage === 'function') {
            window.saveToLocalStorage();
        } else {
            // Manual save
            localStorage.setItem('characters', JSON.stringify(window.characters || []));
            localStorage.setItem('titles', JSON.stringify(window.titles || []));
            localStorage.setItem('seriesList', JSON.stringify(window.seriesList || []));
            localStorage.setItem('books', JSON.stringify(window.books || []));
            localStorage.setItem('roles', JSON.stringify(window.roles || []));
            localStorage.setItem('customFieldTypes', JSON.stringify(window.customFieldTypes || []));
            localStorage.setItem('relationships', JSON.stringify(window.relationships || []));
            localStorage.setItem('tags', JSON.stringify(window.tags || []));
        }
        
        // Update UI
        console.log('Refreshing UI after import');
        if (window.UI && typeof window.UI.refreshAllTabs === 'function') {
            window.UI.refreshAllTabs();
        } else if (window.UI && typeof window.UI.switchTab === 'function') {
            window.UI.switchTab('dashboard');
        } else {
            // Last resort - reload the page
            console.log('No UI refresh function found, reloading page');
            setTimeout(() => { window.location.reload(); }, 500);
        }
        
        // Show success notification
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Database '${data.databaseName || 'Imported Database'}' loaded successfully`, 'success');
        }
        
        console.log('Database loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading database from file:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Error loading database: ' + error.message, 'error');
        }
        return false;
    }
}

// Function to save database to file
function saveDatabaseToFile(filePath) {
    console.log('Saving database to file:', filePath);
    
    try {
        // Get the current database name
        const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
        
        // Create a database object with all data
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
            version: '2.1.0', // Current app version
            databaseName: dbName,
            saveDate: new Date().toISOString()
        };
        
        // Convert to JSON
        const json = JSON.stringify(data, null, 2);
        
        // Save the file
        if (window.api && window.api.saveFile) {
            window.api.saveFile(filePath, json, (success) => {
                if (success) {
                    console.log('Database saved to file successfully');
                    
                    // Show success notification
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast('Database saved successfully', 'success');
                    }
                    
                    return true;
                } else {
                    console.error('Error saving database to file');
                    
                    // Show error notification
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast('Error saving database to file', 'error');
                    }
                    
                    return false;
                }
            });
        } else {
            console.error('API saveFile function not available');
            return false;
        }
    } catch (error) {
        console.error('Error saving database to file:', error);
        return false;
    }
}

// Function to create a new empty database
function createNewDatabase(dbName) {
    console.log('Creating new database:', dbName);
    
    try {
        // Set the new database name
        localStorage.setItem('currentDatabaseName', dbName);
        
        // Clear all data
        window.characters = [];
        window.titles = [];
        window.seriesList = [];
        window.books = [];
        window.roles = [];
        window.customFieldTypes = [];
        window.relationships = [];
        window.tags = [];
        window.plots = [];
        window.worldElements = [];
        
        // Save to localStorage
        localStorage.setItem('characters', JSON.stringify(window.characters));
        localStorage.setItem('titles', JSON.stringify(window.titles));
        localStorage.setItem('seriesList', JSON.stringify(window.seriesList));
        localStorage.setItem('books', JSON.stringify(window.books));
        localStorage.setItem('roles', JSON.stringify(window.roles));
        localStorage.setItem('customFieldTypes', JSON.stringify(window.customFieldTypes));
        localStorage.setItem('relationships', JSON.stringify(window.relationships));
        localStorage.setItem('tags', JSON.stringify(window.tags));
        localStorage.setItem('plots', JSON.stringify(window.plots));
        localStorage.setItem('worldElements', JSON.stringify(window.worldElements));
        
        // Update UI
        if (window.UI && window.UI.updateDatabaseIndicator) {
            window.UI.updateDatabaseIndicator(dbName);
        }
        
        // Show success notification
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`New database "${dbName}" created successfully`, 'success');
        }
        
        return true;
    } catch (error) {
        console.error('Error creating new database:', error);
        return false;
    }
}

// Function to import database directly without showing a dialog
function importDatabaseDirectly() {
    console.log('========================================');
    console.log('IMPORT DATABASE DIRECTLY CALLED');
    console.log('========================================');
    
    try {
        // Reset modal state to avoid conflicts
        if (window.databaseManagerModalRemoved !== undefined) {
            window.databaseManagerModalRemoved = true;
        }
        if (window.databaseSelectionModalRemoved !== undefined) {
            window.databaseSelectionModalRemoved = true;
        }
        if (window.currentModalType !== undefined) {
            window.currentModalType = null;
        }
        
        // Set import preferences
        window.tempCreateNewDatabase = true;
        window.tempUpdateExistingDatabase = false;

        // Check if running in desktop mode with Electron
        if (window.api && window.api.send) {
            console.log('Using Electron to open file dialog');
            
            // Make sure to set up a listener for the response
            if (window.api.receive) {
                console.log('Setting up import-file-selected listener in importDatabaseDirectly');
                
                // Remove any existing listeners to avoid duplicates
                if (typeof window.api.removeListener === 'function') {
                    try {
                        window.api.removeListener('import-file-selected');
                        console.log('Removed any existing import-file-selected listeners');
                    } catch (e) {
                        console.log('No existing listeners to remove or error removing:', e);
                    }
                }
                
                // Set up the new listener
                window.api.receive('import-file-selected', (response) => {
                    console.log('★★★ RECEIVED FILE SELECTION RESPONSE in importDatabaseDirectly ★★★');
                    console.log('Response:', response ? 'received' : 'undefined');
                    
                    if (response && response.success && response.content) {
                        console.log('Processing imported database content');
                        
                        // Load the database using our attached function
                        if (window.Storage && typeof window.Storage.loadDatabaseFromFile === 'function') {
                            console.log('Calling loadDatabaseFromFile function');
                            window.Storage.loadDatabaseFromFile(response.content);
                        } else {
                            console.error('loadDatabaseFromFile function not available');
                            
                            try {
                                // Try to parse the content directly
                                console.log('Trying direct parsing');
                                const data = JSON.parse(response.content);
                                
                                // Load data into application
                                if (data.characters) window.characters = data.characters;
                                if (data.titles) window.titles = data.titles;
                                if (data.seriesList) window.seriesList = data.seriesList;
                                if (data.books) window.books = data.books;
                                
                                // Show success message
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast('Database loaded successfully', 'success');
                                }
                                
                                // Force reload the page to ensure everything is updated
                                console.log('Reloading page to apply changes');
                                setTimeout(() => window.location.reload(), 1000);
                            } catch (parseError) {
                                console.error('Error parsing content:', parseError);
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast('Error parsing database file: ' + parseError.message, 'error');
                                }
                            }
                        }
                    } else if (response && response.error) {
                        console.error('Error importing file:', response.error);
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast('Error importing database: ' + response.error, 'error');
                        }
                    } else {
                        console.log('Import cancelled or invalid response');
                    }
                });
            }
            
            // Send the message to show the open dialog
            console.log('Sending import-show-open-dialog message to main process');
            window.api.send('import-show-open-dialog');
        } else {
            console.error('Electron API not available, cannot open file dialog');
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Import functionality not available in this environment', 'error');
            }
        }
    } catch (error) {
        console.error('Error in importDatabaseDirectly:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Error initiating import: ' + error.message, 'error');
        }
    }
}

// Attach all functions to the window.Storage object once it exists
function attachFunctionsToStorage() {
    console.log('========================================');
    console.log('ATTACHING FUNCTIONS TO STORAGE OBJECT');
    console.log('========================================');
    
    // Check if window.Storage exists
    if (typeof window.Storage === 'undefined') {
        console.log('window.Storage does not exist, creating it');
        window.Storage = {};
    }
    
    // Add all functions to the Storage object
    console.log('Attaching core functions to Storage object');
    window.Storage.saveDatabase = saveDatabase;
    window.Storage.loadDatabase = loadDatabase;
    window.Storage.exportDatabase = exportDatabase;
    window.Storage.importDatabase = importDatabase;
    window.Storage.importDatabaseDirectly = importDatabaseDirectly;
    window.Storage.createNewDatabase = createNewDatabase;
    window.Storage.loadDatabaseFromFile = loadDatabaseFromFile;
    window.Storage.saveDatabaseToFile = saveDatabaseToFile;
    window.Storage.saveSettings = saveSettings;
    window.Storage.loadSettings = loadSettings;
    window.Storage.backupDatabase = backupDatabase;
    
    console.log('Successfully attached functions to Storage object:');
    Object.keys(window.Storage).forEach(key => {
        console.log(`- ${key}: ${typeof window.Storage[key]}`);
    });
    console.log('========================================');
}

// Call the function to attach everything to window.Storage immediately
console.log('Attaching functions immediately to prevent any gaps in functionality');
attachFunctionsToStorage();

// Also attach on DOMContentLoaded to ensure they're available after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, attaching functions to Storage object again');
    attachFunctionsToStorage();
});

// Also ensure direct access to these key functions
window.handleExportDatabase = function() {
    console.log('Global handleExportDatabase called, redirecting to Storage.exportDatabase');
    if (window.Storage && typeof window.Storage.exportDatabase === 'function') {
        window.Storage.exportDatabase();
    } else {
        console.error('Storage.exportDatabase not available');
        alert('Export function not available');
    }
};

window.handleBackupDatabase = function() {
    console.log('Global handleBackupDatabase called, redirecting to Storage.backupDatabase');
    if (window.Storage && typeof window.Storage.backupDatabase === 'function') {
        window.Storage.backupDatabase();
    } else {
        console.error('Storage.backupDatabase not available');
        alert('Backup function not available');
    }
};

})();
