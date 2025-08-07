// Dynamic path fix for database save operations
console.log("Dynamic path fix script loaded");

(function() {
    // Fix the saveDatabase function to properly use dynamic paths from settings
    const originalSaveDatabase = window.Storage ? window.Storage.saveDatabase : null;
    
    function fixedSaveDatabase() {
        try {
            console.log('Enhanced saveDatabase called with dynamic path support');
            
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
            
            // Get settings for database directory
            let settings;
            try {
                settings = localStorage.getItem('settings') ? 
                    JSON.parse(localStorage.getItem('settings')) : {};
            } catch (error) {
                console.error('Error parsing settings:', error);
                settings = {};
            }
            
            // Check if database directory is configured
            if (!settings.databaseDirectory) {
                // Prompt user to configure settings instead of using hardcoded path
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Database directory not configured. Please configure it in Settings.', 'warning');
                } else {
                    alert('Database directory not configured. Please configure it in Settings.');
                }
                
                // Show settings dialog if available
                if (window.Storage && typeof window.Storage.showSettingsDialog === 'function') {
                    setTimeout(() => {
                        window.Storage.showSettingsDialog();
                    }, 1000);
                }
                
                // Still save to localStorage to prevent data loss
                saveToLocalStorage(data);
                return;
            }
            
            // Use directory from settings - WITH a fallback now!
            let directory = settings.databaseDirectory;
            
            // If directory is not configured, use a fallback rather than failing
            if (!directory) {
                if (window.api && window.api.getPaths) {
                    // Try to get the database directory from API
                    try {
                        directory = window.api.getPaths().database;
                        console.log('Using fallback directory from getPaths:', directory);
                    } catch (error) {
                        console.error('Error getting paths:', error);
                        // Last resort fallback to 'database' directory in app folder
                        directory = 'database';
                    }
                } else {
                    // Default to 'database' directory in app folder
                    directory = 'database';
                }
                
                // Log which directory we're using
                console.log('Using fallback directory for save:', directory);
                
                // Show warning to user, but don't prompt for settings dialog
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Database directory not configured. Using ${directory}`, 'warning');
                }
            } else {
                console.log('Using configured directory for save:', directory);
            }
            
            // Ensure the directory exists
            if (window.api && window.api.ensureDirectoryExists) {
                window.api.ensureDirectoryExists(directory, (success) => {
                    if (success) {
                        console.log(`Directory created or already exists: ${directory}`);
                    } else {
                        console.error(`Failed to create directory: ${directory}`);
                    }
                });
            }
            
            // Create filename with database name
            const filename = `${dbName}.json`;
            
            // Check if we're running in Electron
            if (window.api && window.api.saveFile) {
                // Use Electron API to save the file directly without dialog
                // Normalize directory path - remove trailing slashes and normalize separator
                let normalizedDirectory = directory;
                if (normalizedDirectory) {
                    // Remove trailing slashes
                    normalizedDirectory = normalizedDirectory.replace(/[\/\\]+$/, '');
                    // Normalize path with explicit join
                    console.log('Normalized directory:', normalizedDirectory);
                }
                
                // Use proper path joining with normalized components
                const savePath = normalizedDirectory ? `${normalizedDirectory}\\${filename}` : filename;
                console.log('Full save path:', savePath);
                const jsonData = JSON.stringify(data, null, 2);
                
                // Show notification about where we're saving
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Saving to ${savePath}`, 'info');
                }
                
                window.api.saveFile(savePath, jsonData, (success) => {
                    if (success) {
                        console.log('Database saved successfully at:', savePath);
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Database saved successfully to ${savePath}`, 'success');
                        }
                    } else {
                        console.error('Failed to save database at:', savePath);
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Failed to save database to ${savePath}`, 'error');
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
            saveToLocalStorage(data);
            
        } catch (error) {
            console.error('Error saving database:', error);
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Error saving database: ' + error.message, 'error');
            }
        }
    }
    
    // Helper function to save to localStorage
    function saveToLocalStorage(data) {
        localStorage.setItem('characters', JSON.stringify(data.characters || []));
        localStorage.setItem('titles', JSON.stringify(data.titles || []));
        localStorage.setItem('seriesList', JSON.stringify(data.seriesList || []));
        localStorage.setItem('books', JSON.stringify(data.books || []));
        localStorage.setItem('roles', JSON.stringify(data.roles || []));
        localStorage.setItem('customFieldTypes', JSON.stringify(data.customFieldTypes || []));
        localStorage.setItem('relationships', JSON.stringify(data.relationships || []));
        localStorage.setItem('tags', JSON.stringify(data.tags || []));
        localStorage.setItem('plots', JSON.stringify(data.plots || []));
        localStorage.setItem('worldElements', JSON.stringify(data.worldElements || []));
    }
    
    // Override the saveDatabase function when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Setting up dynamic path fix for saveDatabase function');
        setTimeout(() => {
            if (window.Storage) {
                // Save original function reference (if needed for fallback)
                if (window.Storage.saveDatabase) {
                    window._originalSaveDatabase = window.Storage.saveDatabase;
                }
                
                // Override with our fixed version
                window.Storage.saveDatabase = fixedSaveDatabase;
                console.log('✓ saveDatabase function has been enhanced with dynamic path support');
            } else {
                console.error('× Storage object not found, could not enhance saveDatabase function');
            }
        }, 1500); // Wait for original function to be loaded
    });
    
    // Also ensure it's applied when the window loads (just to be safe)
    window.addEventListener('load', function() {
        setTimeout(() => {
            if (window.Storage && window.Storage.saveDatabase !== fixedSaveDatabase) {
                window._originalSaveDatabase = window.Storage.saveDatabase;
                window.Storage.saveDatabase = fixedSaveDatabase;
                console.log('✓ saveDatabase function has been enhanced with dynamic path support (window.load)');
            }
        }, 2000);
    });
})();
