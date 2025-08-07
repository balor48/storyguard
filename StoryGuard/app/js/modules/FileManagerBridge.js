/**
 * FileManagerBridge.js
 * 
 * Bridge module that connects the FileManager to the renderer process.
 * Provides an API for accessing FileManager functionality from renderer
 * and forwards operations to the main process through IPC.
 */

const fileManagerBridge = {
    isInitialized: false,
    
    /**
     * Initialize the file manager bridge
     * @param {Object} options - Options
     * @returns {Object} - The bridge instance
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('FileManagerBridge already initialized');
            return this;
        }
        
        // Connect to the ErrorManager if provided
        if (options.errorManager) {
            this.errorManager = options.errorManager;
        }
        
        // Get paths from main process
        this._refreshPaths();
        
        this.isInitialized = true;
        return this;
    },
    
    /**
     * Handle error reporting
     * @param {Error} error - The error object
     * @param {string} source - Error source
     * @param {string} operation - Operation that failed
     * @param {Object} additionalInfo - Additional context
     * @private
     */
    _handleError(error, source = 'file-manager-bridge', operation = '', additionalInfo = {}) {
        console.error(`[${source}] ${operation} failed:`, error, additionalInfo);
        
        if (this.errorManager && typeof this.errorManager.handleError === 'function') {
            this.errorManager.handleError(error, source, 'error', {
                operation,
                ...additionalInfo
            });
        }
    },
    
    /**
     * Get paths from main process
     * @private
     */
    async _refreshPaths() {
        try {
            if (!window.api || !window.api.invoke) {
                throw new Error('Electron API not available');
            }
            
            const result = await window.api.invoke('get-paths');
            this.paths = result && result.paths ? result.paths : {};
        } catch (error) {
            this._handleError(error, 'file-manager-bridge', 'refreshPaths');
            this.paths = {};
        }
    },
    
    /**
     * Read a file
     * @param {string} filePath - Path to file
     * @param {Object} options - Options
     * @returns {Promise<string>} - File content
     */
    async readFile(filePath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        try {
            if (!window.api || !window.api.invoke) {
                throw new Error('Electron API not available');
            }
            
            return await window.api.invoke('read-file-safe', {
                filePath,
                ...options
            });
        } catch (error) {
            this._handleError(error, 'file-manager-bridge', 'readFile', { filePath });
            throw error;
        }
    },
    
    /**
     * Write to a file
     * @param {string} filePath - Path to file
     * @param {string|Object} content - Content to write
     * @param {Object} options - Options
     * @returns {Promise<boolean>} - Success status
     */
    async writeFile(filePath, content, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        try {
            if (!window.api || !window.api.invoke) {
                throw new Error('Electron API not available');
            }
            
            // Convert content to string if it's an object
            if (typeof content === 'object') {
                content = JSON.stringify(content, null, 2);
            }
            
            return await window.api.invoke('write-file-safe', {
                filePath,
                content,
                ...options
            });
        } catch (error) {
            this._handleError(error, 'file-manager-bridge', 'writeFile', { filePath });
            throw error;
        }
    },
    
    /**
     * Ensure a directory exists
     * @param {string} dirPath - Path to directory
     * @returns {Promise<boolean>} - Success status
     */
    async ensureDirectory(dirPath) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        try {
            if (!window.api || !window.api.invoke) {
                throw new Error('Electron API not available');
            }
            
            return await window.api.invoke('ensure-directory-exists-safe', dirPath);
        } catch (error) {
            this._handleError(error, 'file-manager-bridge', 'ensureDirectory', { dirPath });
            throw error;
        }
    },
    
    /**
     * Check if a file exists
     * @param {string} filePath - Path to file
     * @returns {Promise<boolean>} - Whether file exists
     */
    async fileExists(filePath) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        try {
            if (!window.api || !window.api.invoke) {
                throw new Error('Electron API not available');
            }
            
            return await window.api.invoke('file-exists-safe', filePath);
        } catch (error) {
            this._handleError(error, 'file-manager-bridge', 'fileExists', { filePath });
            return false;
        }
    },
    
    /**
     * List files in a directory
     * @param {string} dirPath - Path to directory
     * @param {Object} options - Options
     * @returns {Promise<Array<string>>} - List of file paths
     */
    async listFiles(dirPath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        try {
            if (!window.api || !window.api.invoke) {
                throw new Error('Electron API not available');
            }
            
            return await window.api.invoke('list-files-safe', {
                dirPath,
                ...options
            });
        } catch (error) {
            this._handleError(error, 'file-manager-bridge', 'listFiles', { dirPath });
            return [];
        }
    },
    
    /**
     * Get a path from the predefined paths
     * @param {string} type - Path type
     * @returns {string|null} - Path or null if not found
     */
    getPath(type) {
        if (!this.isInitialized) {
            this.initialize();
        }
        
        if (!this.paths || !this.paths[type]) {
            // Try to get it from localStorage as fallback
            try {
                const settings = JSON.parse(localStorage.getItem('settings') || '{}');
                
                // Map settings keys to path types
                const keyMap = {
                    database: 'databaseDirectory',
                    documents: 'documentDirectory',
                    backup: 'backupDirectory',
                    images: 'imagesDirectory'
                };
                
                if (keyMap[type] && settings[keyMap[type]]) {
                    return settings[keyMap[type]];
                }
            } catch (error) {
                this._handleError(error, 'file-manager-bridge', 'getPath', { type });
            }
            
            return null;
        }
        
        return this.paths[type];
    },
    
    /**
     * Show a dialog to select a directory
     * @param {string} type - Path type
     * @returns {Promise<string|null>} - Selected directory or null if cancelled
     */
    async browseDirectory(type) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        try {
            if (!window.api || !window.api.invoke) {
                throw new Error('Electron API not available');
            }
            
            const result = await window.api.invoke('browse-directory', type);
            
            if (result && result.path) {
                // Update our local paths cache
                if (!this.paths) this.paths = {};
                this.paths[type] = result.path;
                
                return result.path;
            }
            
            return null;
        } catch (error) {
            this._handleError(error, 'file-manager-bridge', 'browseDirectory', { type });
            return null;
        }
    }
};

// Export the bridge instance
export default fileManagerBridge;
