/**
 * DatabaseManager.js
 * 
 * A centralized database management module for the Story Database Desktop application.
 * This module provides consistent database operations, including loading, saving,
 * deleting, importing and exporting databases.
 *
 * Part of the application's modular architecture refactoring.
 */

// Import dependencies
import { ErrorHandlingManager, tryCatch } from './ErrorHandlingManager.js';
import { safeGet, safeStore } from '../storage-util.js';
import fileManager from './FileManager.js'; // Import the new FileManager
import fileManagerBridge from './FileManagerBridge.js'; // For renderer process

/**
 * DatabaseManager - Centralizes all database operations
 */
class DatabaseManager {
    constructor() {
        this.isInitialized = false;
        this.databases = [];
        this.currentDatabase = null;
        this.currentDatabaseName = '';
        this.databaseDirectory = '';
        this.fileSystem = null;
    }

    /**
     * Initialize the database manager
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('DatabaseManager already initialized');
            return this;
        }

        // Set the file system interface if provided
        this.fileSystem = options.fileSystem || (window.api ? window.api : null);
        
        // Get database directory from settings
        this._loadDatabaseDirectory();
        
        // Load available databases
        this._loadDatabaseList();
        
        // Get current database name
        this.currentDatabaseName = this._getCurrentDatabaseName();
        
        this.isInitialized = true;
        
        // Register for settings changes
        if (window.SettingsManager) {
            window.SettingsManager.on('settings-updated', this._handleSettingsUpdated.bind(this));
        }
        
        return this;
    }
    
    /**
     * Get the current database name
     * @private
     */
    _getCurrentDatabaseName() {
        return tryCatch(() => {
            // Try to get from localStorage using safe methods
            let name = safeGet('currentDatabaseName');
            
            // If no database name is set, use 'Default'
            if (!name) {
                name = 'Default';
                safeStore('currentDatabaseName', name);
            }
            
            return name;
        }, 'Default', 'database-manager');
    }
    
    /**
     * Load database directory from settings
     * @private
     */
    _loadDatabaseDirectory() {
        return tryCatch(async () => {
            // First try to get the path from the FileManager
            try {
                // If we're in the renderer process, use the bridge
                if (typeof window !== 'undefined') {
                    if (!fileManagerBridge.isInitialized) {
                        await fileManagerBridge.initialize();
                    }
                    
                    const dbPath = fileManagerBridge.getPath('database');
                    if (dbPath) {
                        this.databaseDirectory = dbPath;
                        return this.databaseDirectory;
                    }
                } 
                // If we're in the main process, use the FileManager directly
                else if (fileManager && fileManager.getPath) {
                    const dbPath = fileManager.getPath('database');
                    if (dbPath) {
                        this.databaseDirectory = dbPath;
                        return this.databaseDirectory;
                    }
                }
            } catch (error) {
                ErrorHandlingManager.handleWarning(error, 'database-manager', {
                    message: 'Failed to get database directory from FileManager, trying API fallback'
                });
            }
            
            // Try to get paths from API as a fallback
            if (this.fileSystem && this.fileSystem.getPaths) {
                try {
                    const paths = await this.fileSystem.getPaths();
                    this.databaseDirectory = paths.database;
                    return this.databaseDirectory;
                } catch (error) {
                    ErrorHandlingManager.handleWarning(error, 'database-manager', {
                        message: 'Failed to get database directory from API, falling back to settings'
                    });
                }
            }
            
            // Fall back to settings
            const settings = JSON.parse(safeGet('settings') || '{}');
            this.databaseDirectory = settings.databaseDirectory || '';
            
            // If still not set, try legacy approach
            if (!this.databaseDirectory) {
                this.databaseDirectory = safeGet('databaseDirectory') || '';
            }
            
            return this.databaseDirectory;
        }, '', 'database-manager');
    }
    
    /**
     * Load the list of available databases
     * @private
     */
    _loadDatabaseList() {
        return tryCatch(() => {
            // Try to get from localStorage using safe methods
            const databasesStr = safeGet('databases');
            
            if (databasesStr) {
                this.databases = JSON.parse(databasesStr);
            } else {
                this.databases = [];
            }
            
            return this.databases;
        }, [], 'database-manager');
    }
    
    /**
     * Handle settings update event
     * @private
     */
    _handleSettingsUpdated(settings) {
        if (settings && settings.databaseDirectory) {
            this.databaseDirectory = settings.databaseDirectory;
        }
    }

    /**
     * Get a list of all available databases
     * @returns {Array} - Array of database objects
     */
    getAllDatabases() {
        if (!this.isInitialized) {
            this.initialize();
        }
        return [...this.databases];
    }

    /**
     * Get the name of the current database
     * @returns {string} - Current database name
     */
    getCurrentDatabaseName() {
        if (!this.isInitialized) {
            this.initialize();
        }
        return this.currentDatabaseName;
    }

    /**
     * Set the current database by name
     * @param {string} dbName - Database name to set as current
     * @returns {boolean} - Success status
     */
    setCurrentDatabase(dbName) {
        return tryCatch(() => {
            if (!dbName) {
                throw new Error('Invalid database name');
            }
            
            // Store the current name
            this.currentDatabaseName = dbName;
            safeStore('currentDatabaseName', dbName);
            
            // Update UI elements if available
            this._updateDatabaseIndicator(dbName);
            
            return true;
        }, false, 'database-manager');
    }

    /**
     * Update the database indicator in the UI
     * @param {string} dbName - Database name
     * @private
     */
    _updateDatabaseIndicator(dbName) {
        // Update UI indicator element
        const indicator = document.getElementById('currentDatabaseName');
        if (indicator) {
            indicator.textContent = dbName;
        }
        
        // Use UI module if available
        if (window.UI && window.UI.updateDatabaseIndicator) {
            window.UI.updateDatabaseIndicator(dbName);
        }
        
        return true;
    }

    /**
     * Sanitize database name to prevent invalid characters
     * @param {string} name - Database name to sanitize
     * @returns {string} - Sanitized name
     * @private
     */
    _sanitizeDatabaseName(name) {
        // Remove any characters that might cause issues with filenames
        let sanitized = name.replace(/[\/:*?"<>|]/g, '');
        
        // Trim whitespace
        sanitized = sanitized.trim();
        
        // If empty after sanitizing, use a default
        if (!sanitized) {
            sanitized = `Database_${new Date().toISOString().replace(/[:\-.]/g, '_')}`;
        }
        
        return sanitized;
    }

    /**
     * Save the current database state
     * @param {Object} data - Database data to save
     * @param {boolean} saveToFile - Whether to also save to file
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _saveDatabase(data, saveToFile = true) {
        if (!data) return false;
        
        // Ensure the database has a name
        const dbName = data.databaseName || this.currentDatabaseName || 'Default';
        
        // Make sure all collections exist
        const collections = ['characters', 'locations', 'plots', 'worldBuilding', 'relationships', 'timeline'];
        collections.forEach(collection => {
            if (!data[collection]) {
                data[collection] = [];
            }
        });
        
        // Update metadata
        data.modified = new Date().toISOString();
        data.databaseName = dbName;
        
        // Save to localStorage
        safeStore(`database_${dbName}`, JSON.stringify(data));
        
        // Save to file if requested
        if (saveToFile) {
            try {
                // If we have FileManager/Bridge available, use it
                if (typeof window !== 'undefined' && fileManagerBridge.isInitialized) {
                    // Get database filepath
                    const dbPath = this._getDatabasePath(dbName);
                    if (!dbPath) {
                        throw new Error(`Could not determine path for database: ${dbName}`);
                    }
                    
                    // Ensure database directory exists
                    await fileManagerBridge.ensureDirectory(this.databaseDirectory);
                    
                    // Save file with retry mechanism
                    await fileManagerBridge.writeFile(dbPath, JSON.stringify(data, null, 2), {
                        retries: 3,
                        retryDelay: 500
                    });
                    
                    console.log(`Database saved to file: ${dbPath}`);
                }
                // If in main process and FileManager available, use it
                else if (fileManager && fileManager.isInitialized) {
                    // Get database filepath
                    const dbPath = this._getDatabasePath(dbName);
                    if (!dbPath) {
                        throw new Error(`Could not determine path for database: ${dbName}`);
                    }
                    
                    // Ensure database directory exists
                    await fileManager.ensureDirectory(this.databaseDirectory);
                    
                    // Save file with retry mechanism
                    await fileManager.writeFile(dbPath, JSON.stringify(data, null, 2), {
                        retries: 3,
                        retryDelay: 500
                    });
                    
                    console.log(`Database saved to file: ${dbPath}`);
                }
                // Fall back to traditional saving mechanism
                else if (this.fileSystem && this.fileSystem.writeFile) {
                    const dbPath = this._getDatabasePath(dbName);
                    if (dbPath) {
                        await this.fileSystem.writeFile(dbPath, JSON.stringify(data, null, 2));
                        console.log(`Database saved to file via API: ${dbPath}`);
                    }
                }
            } catch (error) {
                ErrorHandlingManager.handleError(error, 'database-manager', 'warning', {
                    message: `Failed to save database to file: ${dbName}`,
                    databaseName: dbName
                });
                // Continue despite file save error - we've already saved to localStorage
            }
        }
        
        return true;
    }

    /**
     * Load a database by name
     * @param {string} dbName - Name of the database to load
     * @returns {Object} - Result with success status and data
     */
    loadDatabase(dbName) {
        return tryCatch(() => {
            if (!dbName) {
                throw new Error('Database name is required');
            }
            
            console.log(`Loading database: ${dbName}`);
            
            // Check if database exists in localStorage
            const dbKey = `database_${dbName}`;
            const dbStr = safeGet(dbKey);
            
            if (!dbStr) {
                // Try loading from file if not in localStorage
                return this.loadDatabaseFromFile(dbName);
            }
            
            // Parse the database
            const database = JSON.parse(dbStr);
            
            // Set as current database
            this.setCurrentDatabase(dbName);
            
            // Update UI with loaded data
            this._updateUIWithLoadedDatabase(database);
            
            // Show success notification
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Database "${dbName}" loaded successfully`, 'success');
            }
            
            return {
                success: true,
                database: database
            };
        }, { success: false, error: 'Failed to load database' }, 'database-manager');
    }
    
    /**
     * Load database from file
     * @param {string} dbNameOrPath - Database name or full path
     * @returns {Promise<Object>} - Result with success status
     */
    async loadDatabaseFromFile(dbNameOrPath) {
        return tryCatch(async () => {
            if (!dbNameOrPath) {
                throw new Error('Database name or path is required');
            }
            
            console.log(`Loading database from file: ${dbNameOrPath}`);
            
            // Determine file path
            let filePath = dbNameOrPath;
            if (!filePath.includes('/') && !filePath.includes('\\')) {
                // Get the sanitized database name
                const sanitizedName = this._sanitizeDatabaseName(dbNameOrPath);
                
                // Get path using our helper method
                filePath = this._getDatabasePath(sanitizedName);
                if (!filePath) {
                    throw new Error(`Could not determine path for database: ${sanitizedName}`);
                }
            }
            
            // Try to read file using FileManager if available
            try {
                let content;
                
                // If we're in the renderer process, use the bridge
                if (typeof window !== 'undefined' && fileManagerBridge.isInitialized) {
                    content = await fileManagerBridge.readFile(filePath, {
                        retries: 3,
                        retryDelay: 500
                    });
                }
                // If we're in the main process, use FileManager directly
                else if (fileManager && fileManager.isInitialized) {
                    content = await fileManager.readFile(filePath, {
                        retries: 3,
                        retryDelay: 500
                    });
                }
                // Fall back to traditional API if FileManager is not available
                else if (this.fileSystem && this.fileSystem.readDatabaseFile) {
                    const result = await this.fileSystem.readDatabaseFile(filePath);
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to read database file');
                    }
                    content = result.content;
                }
                else {
                    throw new Error('No file system implementation available');
                }
                
                // Load the database from the content
                return this.loadDatabaseContent(content);
            } catch (error) {
                ErrorHandlingManager.handleError(error, 'database-manager', 'error', {
                    message: `Failed to read database file: ${filePath}`,
                    databasePath: filePath
                });
                throw error;
            }
        }, { success: false, error: 'Failed to load database from file' }, 'database-manager');
    }
    
    /**
     * Load database from content string
     * @param {string} content - Database content as JSON string
     * @returns {Object} - Result with success status
     */
    loadDatabaseContent(content) {
        return tryCatch(() => {
            if (!content) {
                throw new Error('No content provided');
            }
            
            // Parse the database content
            const data = JSON.parse(content);
            
            // Extract the database name or generate one
            let dbName;
            if (data.databaseName) {
                dbName = this._sanitizeDatabaseName(data.databaseName);
            } else {
                dbName = `Imported Database ${new Date().toLocaleDateString()}`;
                data.databaseName = dbName;
            }
            
            // Save to localStorage
            safeStore(`database_${dbName}`, JSON.stringify(data));
            
            // Add to database list
            this._addToDbList(dbName);
            
            // Set as current database
            this.setCurrentDatabase(dbName);
            
            // Update UI with loaded data
            this._updateUIWithLoadedDatabase(data);
            
            return {
                success: true,
                database: data
            };
        }, { success: false, error: 'Failed to load database content' }, 'database-manager');
    }
    
    /**
     * Update UI with loaded database
     * @param {Object} database - The loaded database
     * @private
     */
    _updateUIWithLoadedDatabase(database) {
        // Update UI elements with the loaded data
        // Characters
        if (database.characters && window.characters) {
            window.characters = database.characters;
        }
        
        // Locations
        if (database.locations && window.locations) {
            window.locations = database.locations;
        }
        
        // Plots
        if (database.plots && window.plots) {
            window.plots = database.plots;
        }
        
        // World building
        if (database.worldBuilding && window.worldBuilding) {
            window.worldBuilding = database.worldBuilding;
        }
        
        // Relationships
        if (database.relationships && window.relationships) {
            window.relationships = database.relationships;
        }
        
        // Timeline
        if (database.timeline && window.timeline) {
            window.timeline = database.timeline;
        }
        
        // Trigger UI refresh for each tab
        ['refreshCharacters', 'refreshLocations', 'refreshPlots', 
         'refreshWorldBuilding', 'refreshRelationships', 'refreshTimeline'].forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                } catch (error) {
                    ErrorHandlingManager.handleWarning(error, 'database-manager', {
                        message: `Error refreshing UI: ${funcName}`
                    });
                }
            }
        });
    }
    
    /**
     * Delete a database
     * @param {string} dbName - Name of the database to delete
     * @returns {Object} - Result with success status
     */
    deleteDatabase(dbName) {
        return tryCatch(async () => {
            if (!dbName) {
                throw new Error('Database name is required');
            }
            
            console.log(`Deleting database: ${dbName}`);
            
            // Show confirmation dialog
            const confirmDelete = confirm(`Are you sure you want to delete the database "${dbName}"? This action cannot be undone.`);
            if (!confirmDelete) {
                return { success: false, canceled: true };
            }
            
            // Remove from localStorage first
            localStorage.removeItem(`database_${dbName}`);
            
            // Update database list
            this.databases = this.databases.filter(db => 
                db.name !== dbName && 
                db.path !== `${dbName}.json` && 
                db.path !== dbName
            );
            safeStore('databases', JSON.stringify(this.databases));
            
            // If this was the current database, switch to Default
            if (this.currentDatabaseName === dbName) {
                this.setCurrentDatabase('Default');
            }
            
            // Also physically delete the file if possible
            const physicalResult = await this._physicallyDeleteDatabase(dbName);
            
            // Show success notification
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Database "${dbName}" deleted successfully`, 'success');
            }
            
            return {
                success: true,
                physicalDeletionSuccess: physicalResult.success
            };
        }, { success: false, error: 'Failed to delete database' }, 'database-manager');
    }
    
    /**
     * Physically delete a database file from disk
     * @param {string} dbName - Name of the database to delete
     * @returns {Object} - Result with success status
     * @private
     */
    _physicallyDeleteDatabase(dbName) {
        return tryCatch(async () => {
            if (!dbName) {
                throw new Error('Database name is required');
            }
            
            // Ensure we have the database directory
            if (!this.databaseDirectory) {
                await this._loadDatabaseDirectory();
            }
            
            if (!this.databaseDirectory) {
                throw new Error('Database directory not configured');
            }
            
            // Normalize directory path
            const normalizedDir = this.databaseDirectory.replace(/[\/]/g, '\\');
            
            // Build full path to the file
            let dbPath;
            if (normalizedDir.endsWith('\\')) {
                dbPath = `${normalizedDir}${dbName}.json`;
            } else {
                dbPath = `${normalizedDir}\\${dbName}.json`;
            }
            
            console.log(`Full database file path for deletion: ${dbPath}`);
            
            // Delete the file using the API
            if (!this.fileSystem || !this.fileSystem.deleteDatabaseFile) {
                console.error('Cannot delete database: API.deleteDatabaseFile function not available');
                return { success: false, error: 'File system API not available' };
            }
            
            const result = await this.fileSystem.deleteDatabaseFile(dbPath);
            return result;
        }, { success: false, error: 'Failed to physically delete database file' }, 'database-manager');
    }
    
    /**
     * Export the current database
     * @param {boolean} saveAs - Whether to show a file picker dialog
     * @returns {Object} - Result with success status
     */
    exportDatabase(saveAs = true) {
        return tryCatch(async () => {
            const dbName = this.currentDatabaseName;
            if (!dbName) {
                throw new Error('No current database to export');
            }
            
            console.log(`Exporting database: ${dbName}`);
            
            // Get the database content
            const dbKey = `database_${dbName}`;
            const dbStr = safeGet(dbKey);
            
            if (!dbStr) {
                throw new Error(`Database "${dbName}" not found in storage`);
            }
            
            let data = JSON.parse(dbStr);
            
            // Ensure database name is set
            if (!data.databaseName) {
                data.databaseName = dbName;
            }
            
            // Update metadata
            data.exported = new Date().toISOString();
            
            // Convert to JSON string
            const content = JSON.stringify(data, null, 2);
            
            if (saveAs) {
                // Show save dialog
                if (!this.fileSystem || !this.fileSystem.showSaveDialog) {
                    throw new Error('File system API not available');
                }
                
                // Get starting directory from settings
                const directory = this.databaseDirectory || '';
                
                // Set up save dialog options
                const options = {
                    title: 'Export Database',
                    defaultPath: directory ? `${directory}\\${dbName}.json` : `${dbName}.json`,
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] }
                    ]
                };
                
                // Show save dialog
                const result = await this.fileSystem.showSaveDialog(options);
                
                if (result.canceled) {
                    return { success: false, canceled: true };
                }
                
                // Write to the selected file
                const saveResult = await this.fileSystem.writeFile(result.filePath, content);
                
                if (!saveResult.success) {
                    throw new Error(saveResult.error || 'Failed to save database file');
                }
                
                // Show success notification
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Database "${dbName}" exported successfully to ${result.filePath}`, 'success');
                }
                
                return {
                    success: true,
                    path: result.filePath
                };
            } else {
                // Save to default location without dialog
                if (!this.databaseDirectory) {
                    throw new Error('Database directory not configured');
                }
                
                // Normalize directory path
                const normalizedDir = this.databaseDirectory.replace(/[\/]/g, '\\');
                
                // Build full path to the file
                const dbPath = normalizedDir.endsWith('\\') ? 
                    `${normalizedDir}${dbName}.json` : 
                    `${normalizedDir}\\${dbName}.json`;
                
                // Write the file
                const saveResult = await this.fileSystem.writeFile(dbPath, content);
                
                if (!saveResult.success) {
                    throw new Error(saveResult.error || 'Failed to save database file');
                }
                
                // Show success notification
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Database "${dbName}" saved successfully to ${dbPath}`, 'success');
                }
                
                return {
                    success: true,
                    path: dbPath
                };
            }
        }, { success: false, error: 'Failed to export database' }, 'database-manager');
    }
    
    /**
     * Import a database from a file
     * @returns {Object} - Result with success status
     */
    importDatabase() {
        return tryCatch(async () => {
            console.log('Importing database from file');
            
            // Show open dialog
            if (!this.fileSystem || !this.fileSystem.showOpenDialog) {
                throw new Error('File system API not available');
            }
            
            // Get starting directory from settings
            const directory = this.databaseDirectory || '';
            
            // Set up open dialog options
            const options = {
                title: 'Import Database',
                defaultPath: directory,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] }
                ],
                properties: ['openFile']
            };
            
            // Show open dialog
            const result = await this.fileSystem.showOpenDialog(options);
            
            if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                return { success: false, canceled: true };
            }
            
            // Read the selected file
            const filePath = result.filePaths[0];
            const readResult = await this.fileSystem.readFile(filePath);
            
            if (!readResult.success) {
                throw new Error(readResult.error || 'Failed to read database file');
            }
            
            // Load the database content
            return this.loadDatabaseContent(readResult.content);
        }, { success: false, error: 'Failed to import database' }, 'database-manager');
    }
    
    /**
     * Show the database manager dialog
     * @returns {boolean} - Success status
     */
    showDatabaseManager() {
        return tryCatch(() => {
            console.log('Showing database manager');
            
            // If we have a DialogManager, use it
            if (window.DialogManager) {
                window.DialogManager.showStorageDialog();
                return true;
            }
            
            // Otherwise use the legacy approach
            if (window.Storage && window.Storage.showDatabaseManager) {
                window.Storage.showDatabaseManager();
                return true;
            }
            
            console.error('No method available to show database manager');
            return false;
        }, false, 'database-manager');
    }

    /**
     * Refresh database list from disk
     * @returns {Array} - Updated database list
     */
    refreshDatabaseList() {
        return tryCatch(async () => {
            console.log('Refreshing database list from disk');
            
            // Ensure we have the database directory
            if (!this.databaseDirectory) {
                await this._loadDatabaseDirectory();
            }
            
            if (!this.databaseDirectory) {
                throw new Error('Database directory not configured');
            }
            
            // Read directory contents
            if (!this.fileSystem || !this.fileSystem.readDirectory) {
                throw new Error('File system API not available');
            }
            
            const result = await this.fileSystem.readDirectory(this.databaseDirectory);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to read database directory');
            }
            
            // Filter for JSON files
            const dbFiles = result.files.filter(file => file.endsWith('.json'));
            
            // Update database list
            const newList = dbFiles.map(file => {
                // Remove .json extension
                const name = file.replace(/\.json$/, '');
                
                // Check if already in list
                const existing = this.databases.find(db => 
                    db.name === name || 
                    db.path === file || 
                    db.path === name
                );
                
                if (existing) {
                    return existing;
                }
                
                return {
                    name: name,
                    path: file,
                    lastOpened: null
                };
            });
            
            // Update databases array
            this.databases = newList;
            
            // Save to localStorage
            safeStore('databases', JSON.stringify(newList));
            
            return newList;
        }, [], 'database-manager');
    }
}

// Create a singleton instance
const databaseManager = new DatabaseManager();

// Initialize with default settings
databaseManager.initialize();

// Export the singleton instance
export { databaseManager as DatabaseManager };

// Also make available globally
window.DatabaseManager = databaseManager;
