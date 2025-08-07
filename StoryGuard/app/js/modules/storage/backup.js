// Backup-related functions
function backupDatabase(toCloud = false) {
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
            dbName: dbName,
            metadata: {
                databaseName: dbName,
                backupTime: new Date().toISOString(),
                backupType: 'manual'
            }
        };
        
        // Get current date and time for the backup filename
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        
        // If toCloud is true, sync to cloud
        if (toCloud) {
            syncWithCloud();
            return;
        }
        
        // CRITICAL FIX: Ensure we have a valid backup directory
        // Get backup directory from settings
        const settings = getSettings();
        let backupDir = settings.backupDirectory;
        
        console.log('BACKUP DIRECTORY DEBUG - Backup directory from settings:', backupDir);
        
        // If backup directory is not set in settings, try to get it from localStorage
        if (!backupDir && localStorage.getItem('backupDirectory')) {
            backupDir = localStorage.getItem('backupDirectory');
            console.log('BACKUP DIRECTORY DEBUG - Backup directory from localStorage:', backupDir);
        }
        
        // If still no backup directory, check if there's a global backup directory
        if (!backupDir && window.backupDirectory) {
            backupDir = window.backupDirectory;
            console.log('BACKUP DIRECTORY DEBUG - Backup directory from global variable:', backupDir);
        }
        
        // If still no backup directory, use the hardcoded 'backup' folder
        if (!backupDir) {
            backupDir = 'backup';
            console.log('BACKUP DIRECTORY DEBUG - Using hardcoded backup directory:', backupDir);
        }
        
        console.log('BACKUP DIRECTORY DEBUG - Final backup directory to use:', backupDir);
        
        // If a backup directory is specified and we're in desktop mode
        if (window.api && window.api.saveFile) {
            // Handle case where backupDirectory is not properly set
            if (typeof backupDir !== 'string' || backupDir.trim() === '') {
                console.warn('BACKUP DIRECTORY DEBUG - Backup directory is not properly set, using default path');
                
                // Use app data directory if available, otherwise use a default
                if (window.api && window.api.getPaths) {
                    try {
                        const paths = window.api.getPaths();
                        backupDir = paths.backups || 'backup';
                        console.log('BACKUP DIRECTORY DEBUG - Using backup directory from getPaths:', backupDir);
                    } catch (e) {
                        console.error('BACKUP DIRECTORY DEBUG - Failed to get paths from API:', e);
                        backupDir = 'backup';
                    }
                } else {
                    backupDir = 'backup';
                }
            }
            
            // Ensure the backup directory exists - this is very important
            if (window.api && window.api.ensureDirectoryExists) {
                // CRITICAL FIX: Make sure we're not passing undefined to ensureDirectoryExists
                const dirToEnsure = backupDir || 'backup';
                console.log('BACKUP DIRECTORY DEBUG - Ensuring directory exists:', dirToEnsure);
                
                window.api.ensureDirectoryExists(dirToEnsure, (success, normalizedPath, errorMessage) => {
                    console.log('BACKUP DEBUG - Backup directory check result:', {
                        originalPath: dirToEnsure,
                        success: success,
                        normalizedPath: normalizedPath,
                        errorMessage: errorMessage
                    });
                    
                    // Use the normalized path if provided, otherwise use the original path
                    const pathToUse = normalizedPath || dirToEnsure;
                    console.log('BACKUP DEBUG - Using path for backup:', pathToUse);
                    
                    // CRITICAL FIX: Check if path is just a filename with no directory
                    // If so, prepend the current directory
                    let finalPath = pathToUse;
                    if (!pathToUse.includes('/') && !pathToUse.includes('\\') && pathToUse !== 'backup') {
                        // If it's just a filename, use the default backup directory
                        if (window.api && window.api.getPaths) {
                            try {
                                const paths = window.api.getPaths();
                                finalPath = paths.backups || 'backup';
                                console.log('BACKUP DEBUG - Path was just a filename, using backup directory:', finalPath);
                            } catch (e) {
                                console.error('BACKUP DEBUG - Failed to get paths from API, using default backup path:', e);
                                finalPath = 'backup';
                            }
                        } else {
                            finalPath = 'backup';
                        }
                    }
                    console.log('BACKUP DEBUG - Final path to use:', finalPath);
                    
                    // Only proceed with backup if the directory exists or was created
                    if (success) {
                        // Normalize path separators for consistency
                        const normalizedBackupDir = finalPath.replace(/\//g, '\\');
                        // Generate a consistent path with backslashes
                        const backupPath = `${normalizedBackupDir}\\${dbName}_backup_${date}_${time}.json`;
                        console.log('BACKUP DEBUG - Generated backup path with normalized directory:', backupPath);
                        
                        const jsonData = JSON.stringify(data, null, 2);
                        
                        // Show notification without showing the full path to avoid confusion
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Creating backup...`, 'info');
                        } else {
                            UI.showNotification(`Creating backup...`, 'info');
                        }
                        
                        window.api.saveFile(backupPath, jsonData, (success) => {
                            if (success) {
                                console.log('BACKUP DEBUG - Database backup created successfully at:', backupPath);
                                // Format the path display but don't show the full path to avoid confusion
                                if (window.Core && window.Core.showToast) {
                                    // Show the full directory path in the success message for debugging
                                    window.Core.showToast(`Backup saved to: ${normalizedBackupDir}\\${dbName}_backup_${date}_${time}.json`, 'success');
                                } else {
                                    UI.showNotification(`Backup saved to: ${normalizedBackupDir}\\${dbName}_backup_${date}_${time}.json`, 'success');
                                }
                            } else {
                                console.error('BACKUP DEBUG - Failed to create database backup at:', backupPath);
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast(`Failed to save backup to: ${normalizedBackupDir}\\${dbName}_backup_${date}_${time}.json`, 'error');
                                } else {
                                    UI.showNotification(`Failed to save backup to: ${normalizedBackupDir}\\${dbName}_backup_${date}_${time}.json`, 'error');
                                }
                                
                                // Fallback to browser backup if desktop backup fails
                                createBrowserBackup(data, date, time, dbName);
                            }
                        });
                    } else {
                        console.error('BACKUP DEBUG - Failed to ensure backup directory exists:', errorMessage || 'Unknown error');
                        if (window.Core && window.Core.showToast) {
                            const errorMsg = errorMessage ? `Failed to create backup directory: ${errorMessage}` : `Failed to create backup directory`;
                            window.Core.showToast(errorMsg, 'error');
                        } else {
                            UI.showNotification(`Failed to create backup directory`, 'error');
                        }
                        
                        // Fallback to browser backup if directory creation fails
                        createBrowserBackup(data, date, time, dbName);
                    }
                });
                console.log('BACKUP DEBUG - Requested to ensure backup directory exists:', dirToEnsure);
            } else {
                // If ensureDirectoryExists is not available, continue with the old flow
                // Normalize path separators for consistency
                const normalizedBackupDir = backupDir.replace(/\//g, '\\');
                // Generate a consistent path with backslashes
                const backupPath = `${normalizedBackupDir}\\${dbName}_backup_${date}_${time}.json`;
                console.log('Generated backup path (no directory check):', backupPath);
                
                const jsonData = JSON.stringify(data, null, 2);
                
                // Show notification without showing the full path to avoid confusion
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Creating backup...`, 'info');
                } else {
                    UI.showNotification(`Creating backup...`, 'info');
                }
                
                window.api.saveFile(backupPath, jsonData, (success) => {
                    if (success) {
                        console.log('Database backup created successfully at:', backupPath);
                        // Format the path display but don't show the full path to avoid confusion
                        if (window.Core && window.Core.showToast) {
                            // Show the full directory path in the success message for debugging
                            window.Core.showToast(`Backup saved to: ${backupPath}`, 'success');
                        } else {
                            UI.showNotification(`Backup saved to: ${backupPath}`, 'success');
                        }
                    } else {
                        console.error('Failed to create database backup at:', backupPath);
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Failed to save backup to: ${backupPath}`, 'error');
                        } else {
                            UI.showNotification(`Failed to save backup to: ${backupPath}`, 'error');
                        }
                        
                        // Fallback to browser backup if desktop backup fails
                        createBrowserBackup(data, date, time, dbName);
                    }
                });
            }
        } else {
            // Create a browser backup if no backup directory or not in desktop mode
            createBrowserBackup(data, date, time, dbName);
        }
    } catch (error) {
        console.error('Error creating database backup:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Failed to create database backup: ' + error.message, 'error');
        } else {
            UI.showNotification('Failed to create database backup: ' + error.message, 'error');
        }
    }
}

function createBrowserBackup(data, date, time, dbName) {
    try {
        // Convert the data to JSON
        const jsonData = JSON.stringify(data, null, 2);
        
        // Create a blob and download it
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `${dbName}_backup_${date}_${time}.json`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Database backup created successfully (browser download)');
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Backup downloaded to your browser's download folder: ${filename}`, 'success');
        } else {
            UI.showNotification(`Backup downloaded to your browser's download folder: ${filename}`, 'success');
        }
    } catch (error) {
        console.error('Error creating browser backup:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Failed to create browser backup: ' + error.message, 'error');
        } else {
            UI.showNotification('Failed to create browser backup: ' + error.message, 'error');
        }
    }
}

function startAutoBackupTimer() {
    // DISABLED - Now handled by the master auto-backup system in auto-backup-fix.js
    console.log('Original startAutoBackupTimer in backup.js is disabled - using master auto-backup system instead');
    return;
    
    /* Original functionality disabled to prevent conflicts
    // Get settings
    const settings = getSettings();
    
    // If auto backup is enabled
    if (settings.enableAutoBackup) {
        // Read from backupInterval (to match settings-dialog.html) or fall back to autoBackupInterval
        const intervalMin = settings.backupInterval || settings.autoBackupInterval || 30;
        
        // Calculate interval in milliseconds
        const interval = intervalMin * 60 * 1000; // Convert minutes to milliseconds
        
        // Clear any existing timer
        stopAutoBackupTimer();
        
        // Set a new timer
        window.autoBackupTimer = setInterval(performAutoBackup, interval);
        
        console.log(`Auto backup timer started with interval: ${intervalMin} minutes`);
    }
    */
}

function stopAutoBackupTimer() {
    if (window.autoBackupTimer) {
        clearInterval(window.autoBackupTimer);
        window.autoBackupTimer = null;
        console.log('Auto backup timer stopped');
    }
}

function performAutoBackup() {
    try {
        console.log('Performing auto backup...');
        
        // Simply call the same backup function used by the manual backup button
        // This ensures consistent behavior between manual and automatic backups
        backupDatabase(false);
        
        console.log('Auto backup completed');
    } catch (error) {
        console.error('Error performing auto backup:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Error performing auto backup: ' + error.message, 'error');
        } else {
            UI.showNotification('Error performing auto backup: ' + error.message, 'error');
        }
    }
}

// Export the functions
export { 
    backupDatabase, 
    createBrowserBackup, 
    startAutoBackupTimer, 
    stopAutoBackupTimer, 
    performAutoBackup 
};
