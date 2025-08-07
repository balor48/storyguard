// Ultra simple backup fix - using dynamic paths from localStorage
(function() {
    console.log('Ultra simple backup fix loaded - using dynamic paths');

    // Override the backupDatabase function with minimal version
    function fixBackupDatabaseFunction() {
        if (window.Storage && window.Storage.backupDatabase) {
            console.log('Fixing backupDatabase function with dynamic paths...');
            
            // Keep reference to the original function
            const originalBackupDatabase = window.Storage.backupDatabase;
            
            // Replace with ultra simple version
            window.Storage.backupDatabase = function(toCloud = false, isAutoBackup = false) {
                console.log('Fixed backupDatabase called, toCloud:', toCloud, 'isAutoBackup:', isAutoBackup);
                
                // If toCloud is true, just call the original function
                if (toCloud) {
                    return originalBackupDatabase(toCloud);
                }
                
                // Otherwise handle the backup with dynamic paths
                try {
                    // Get the current database name
                    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
                    
                    // Get backup directory from localStorage (set in settings dialog)
                    let backupDir = localStorage.getItem('backupPath');
                    
                    // If not in localStorage, try to get from settings
                    if (!backupDir && window.getSettings) {
                        const settings = window.getSettings();
                        if (settings && settings.backupPath) {
                            backupDir = settings.backupPath;
                        }
                    }
                    
                    // Final fallback to a relative path if all else fails
                    if (!backupDir) {
                        backupDir = "backup";
                    }
                    
                    // Get current date and time for the backup filename
                    const now = new Date();
                    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
                    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
                    
                    // Create full backup path with dynamic directory
                    const backupPath = backupDir + "/" + dbName + "_backup_" + date + "_" + time + ".json";
                    
                    console.log('Backing up to dynamic path:', backupPath);
                    
                    // Create database object with all data
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
                        dbName: dbName,
                        metadata: {
                            databaseName: dbName,
                            backupTime: new Date().toISOString(),
                            backupType: isAutoBackup ? 'auto' : 'manual'
                        }
                    };
                    
                    // Convert to JSON
                    const jsonData = JSON.stringify(data, null, 2);
                    
                    // Save the file directly - NO directory creation
                    if (window.api && window.api.saveFile) {
                        window.api.saveFile(backupPath, jsonData, function(success) {
                            if (success) {
                                console.log('Backup created at:', backupPath);
                                // Remove all toast notifications from here
                                // Let the auto-backup system handle notifications
                            } else {
                                console.error('Failed to create backup at:', backupPath);
                                // Only show error toast if not an auto-backup
                                if (window.Core && window.Core.showToast && !isAutoBackup && !window.isAutoBackupInProgress) {
                                    window.Core.showToast(`Backup failed!`, 'error');
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error in fixed backupDatabase:', error);
                    // Fall back to original function
                    originalBackupDatabase(toCloud);
                }
            };
            
            console.log('Backup function replaced with dynamic path version');
        } else {
            console.warn('Storage.backupDatabase not found, cannot fix');
            // Try to check again later if Storage is not available yet
            setTimeout(fixBackupDatabaseFunction, 500);
        }
    }

    // Initialize right away if possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixBackupDatabaseFunction);
    } else {
        fixBackupDatabaseFunction();
    }
})();
