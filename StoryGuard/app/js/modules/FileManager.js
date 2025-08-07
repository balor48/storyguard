/**
 * FileManager.js
 * 
 * A centralized file management module for the Story Database Desktop application.
 * This module handles all file operations including reading, writing, directory management,
 * and path handling to ensure consistent behavior across the application.
 */

class FileManager {
    /**
     * Constructor
     */
    constructor() {
        this.isInitialized = false;
        this.errorManager = null;
        
        // Default paths
        this.paths = {
            database: null,
            documents: null,
            backup: null,
            images: null,
            temp: null
        };
        
        // Track pending operations
        this.pendingOperations = [];
    }
    
    /**
     * Initialize the file manager
     * @param {Object} options - Configuration options
     * @returns {FileManager} - The initialized file manager instance
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('FileManager already initialized');
            return this;
        }
        
        // Set error manager reference if provided
        if (options.errorManager) {
            this.errorManager = options.errorManager;
        }
        
        // Set default paths if provided
        if (options.paths) {
            Object.keys(options.paths).forEach(key => {
                if (this.paths.hasOwnProperty(key)) {
                    this.paths[key] = this._normalizePath(options.paths[key]);
                }
            });
        }
        
        // Set electron API if provided
        if (options.electronAPI) {
            this.electronAPI = options.electronAPI;
        } else {
            // Default to window.api if available
            this.electronAPI = window.api || null;
        }
        
        // Set file system module if provided
        if (options.fs) {
            this.fs = options.fs;
        } else {
            // Use electron API for file operations if available
            this.fs = null;
        }
        
        // Initialize the file system module
        this._initializeFS();
        
        this.isInitialized = true;
        return this;
    }
    
    /**
     * Initialize the file system module
     * @private
     */
    _initializeFS() {
        if (!this.fs && this.electronAPI) {
            // Create API wrapper for file operations
            this.fs = {
                readFile: (path, options, callback) => {
                    if (typeof options === 'function') {
                        callback = options;
                        options = { encoding: 'utf8' };
                    }
                    
                    this.electronAPI.readFile(path)
                        .then(content => callback(null, content))
                        .catch(error => callback(error));
                },
                writeFile: (path, content, options, callback) => {
                    if (typeof options === 'function') {
                        callback = options;
                        options = { encoding: 'utf8' };
                    }
                    
                    this.electronAPI.writeFile(path, content)
                        .then(() => callback(null))
                        .catch(error => callback(error));
                },
                mkdir: (path, options, callback) => {
                    if (typeof options === 'function') {
                        callback = options;
                        options = { recursive: true };
                    }
                    
                    this.electronAPI.ensureDirectoryExists(path)
                        .then(() => callback(null))
                        .catch(error => callback(error));
                },
                stat: (path, callback) => {
                    this.electronAPI.getFileInfo(path)
                        .then(info => callback(null, info))
                        .catch(error => callback(error));
                },
                exists: (path, callback) => {
                    this.electronAPI.fileExists(path)
                        .then(exists => callback(exists))
                        .catch(() => callback(false));
                },
                readdir: (path, callback) => {
                    this.electronAPI.readDirectory(path)
                        .then(files => callback(null, files))
                        .catch(error => callback(error));
                },
                unlink: (path, callback) => {
                    this.electronAPI.deleteFile(path)
                        .then(() => callback(null))
                        .catch(error => callback(error));
                },
                rmdir: (path, options, callback) => {
                    if (typeof options === 'function') {
                        callback = options;
                        options = { recursive: true };
                    }
                    
                    this.electronAPI.deleteDirectory(path, options.recursive)
                        .then(() => callback(null))
                        .catch(error => callback(error));
                }
            };
        }
    }
    
    /**
     * Handle an error through the error manager if available
     * @param {Error} error - The error object
     * @param {string} source - Source of the error
     * @param {string} level - Error level
     * @param {Object} additionalInfo - Additional info
     * @private
     */
    _handleError(error, source = 'file-manager', level = 'error', additionalInfo = {}) {
        // Log to console regardless
        console.error(`[${source}] ${error.message}`, additionalInfo);
        
        // Use error manager if available
        if (this.errorManager && typeof this.errorManager.handleError === 'function') {
            return this.errorManager.handleError(error, source, level, additionalInfo);
        }
        
        return {
            timestamp: new Date().toISOString(),
            message: error instanceof Error ? error.message : String(error),
            source,
            level,
            additionalInfo
        };
    }
    
    /**
     * Normalize a file path for the current platform
     * @param {string} filePath - Path to normalize
     * @returns {string} - Normalized path
     * @private
     */
    _normalizePath(filePath) {
        if (!filePath) return filePath;
        
        // Replace forward slashes with backslashes on Windows
        if (navigator.platform.includes('Win')) {
            return filePath.replace(/\//g, '\\');
        }
        
        return filePath;
    }
    
    /**
     * Create a Promise-based version of a callback function
     * @param {Function} fn - The function to promisify
     * @returns {Function} - A promisified function
     * @private
     */
    _promisify(fn) {
        return (...args) => {
            return new Promise((resolve, reject) => {
                fn(...args, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        };
    }
    
    /**
     * Read a file with retry mechanism
     * @param {string} filePath - Path to the file
     * @param {Object} options - Read options
     * @param {string} options.encoding - File encoding (default: 'utf8')
     * @param {number} options.retries - Number of retries (default: 3)
     * @param {number} options.retryDelay - Delay between retries in ms (default: 500)
     * @returns {Promise<string>} - File content
     */
    async readFile(filePath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const {
            encoding = 'utf8',
            retries = 3,
            retryDelay = 500
        } = options;
        
        // Normalize path
        const normalizedPath = this._normalizePath(filePath);
        
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Add to pending operations
                this.pendingOperations.push({
                    type: 'read',
                    path: normalizedPath,
                    startTime: Date.now()
                });
                
                // Check if fs is available
                if (!this.fs) {
                    throw new Error('File system not initialized');
                }
                
                // Use promisified version of readFile
                const readFileAsync = this._promisify(this.fs.readFile);
                const content = await readFileAsync(normalizedPath, { encoding });
                
                // Remove from pending operations
                this.pendingOperations = this.pendingOperations.filter(
                    op => !(op.type === 'read' && op.path === normalizedPath)
                );
                
                return content;
            } catch (error) {
                lastError = error;
                
                // If this is the last attempt, don't wait
                if (attempt === retries) break;
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        // All attempts failed
        const errorInfo = this._handleError(
            lastError,
            'file-manager',
            'error',
            { operation: 'readFile', path: normalizedPath }
        );
        
        // Remove from pending operations
        this.pendingOperations = this.pendingOperations.filter(
            op => !(op.type === 'read' && op.path === normalizedPath)
        );
        
        throw new Error(`Failed to read file ${normalizedPath}: ${lastError.message}`);
    }
    
    /**
     * Write to a file with retry mechanism
     * @param {string} filePath - Path to the file
     * @param {string|Object} content - Content to write
     * @param {Object} options - Write options
     * @param {string} options.encoding - File encoding (default: 'utf8')
     * @param {boolean} options.createDir - Create directory if it doesn't exist (default: true)
     * @param {number} options.retries - Number of retries (default: 3)
     * @param {number} options.retryDelay - Delay between retries in ms (default: 500)
     * @returns {Promise<boolean>} - Success status
     */
    async writeFile(filePath, content, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const {
            encoding = 'utf8',
            createDir = true,
            retries = 3,
            retryDelay = 500
        } = options;
        
        // Normalize path
        const normalizedPath = this._normalizePath(filePath);
        
        // Convert content to string if it's an object
        if (typeof content === 'object') {
            content = JSON.stringify(content, null, 2);
        }
        
        // Create directory if needed
        if (createDir) {
            await this.ensureDirectory(require('path').dirname(normalizedPath));
        }
        
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Add to pending operations
                this.pendingOperations.push({
                    type: 'write',
                    path: normalizedPath,
                    startTime: Date.now()
                });
                
                // Check if fs is available
                if (!this.fs) {
                    throw new Error('File system not initialized');
                }
                
                // Use promisified version of writeFile
                const writeFileAsync = this._promisify(this.fs.writeFile);
                await writeFileAsync(normalizedPath, content, { encoding });
                
                // Remove from pending operations
                this.pendingOperations = this.pendingOperations.filter(
                    op => !(op.type === 'write' && op.path === normalizedPath)
                );
                
                return true;
            } catch (error) {
                lastError = error;
                
                // If this is the last attempt, don't wait
                if (attempt === retries) break;
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        // All attempts failed
        const errorInfo = this._handleError(
            lastError,
            'file-manager',
            'error',
            { operation: 'writeFile', path: normalizedPath }
        );
        
        // Remove from pending operations
        this.pendingOperations = this.pendingOperations.filter(
            op => !(op.type === 'write' && op.path === normalizedPath)
        );
        
        throw new Error(`Failed to write file ${normalizedPath}: ${lastError.message}`);
    }
    
    /**
     * Ensure a directory exists, creating it if necessary
     * @param {string} dirPath - Path to the directory
     * @param {Object} options - Options
     * @param {number} options.retries - Number of retries (default: 3)
     * @param {number} options.retryDelay - Delay between retries in ms (default: 500)
     * @returns {Promise<boolean>} - Success status
     */
    async ensureDirectory(dirPath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const {
            retries = 3,
            retryDelay = 500
        } = options;
        
        // Normalize path
        const normalizedPath = this._normalizePath(dirPath);
        
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Add to pending operations
                this.pendingOperations.push({
                    type: 'mkdir',
                    path: normalizedPath,
                    startTime: Date.now()
                });
                
                // Check if fs is available
                if (!this.fs) {
                    throw new Error('File system not initialized');
                }
                
                // Check if directory exists first
                const existsAsync = (path) => {
                    return new Promise(resolve => {
                        this.fs.exists(path, (exists) => resolve(exists));
                    });
                };
                
                const exists = await existsAsync(normalizedPath);
                if (exists) {
                    // Directory already exists
                    this.pendingOperations = this.pendingOperations.filter(
                        op => !(op.type === 'mkdir' && op.path === normalizedPath)
                    );
                    return true;
                }
                
                // Create directory
                const mkdirAsync = this._promisify(this.fs.mkdir);
                await mkdirAsync(normalizedPath, { recursive: true });
                
                // Remove from pending operations
                this.pendingOperations = this.pendingOperations.filter(
                    op => !(op.type === 'mkdir' && op.path === normalizedPath)
                );
                
                return true;
            } catch (error) {
                lastError = error;
                
                // If this is the last attempt, don't wait
                if (attempt === retries) break;
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        // All attempts failed
        const errorInfo = this._handleError(
            lastError,
            'file-manager',
            'error',
            { operation: 'ensureDirectory', path: normalizedPath }
        );
        
        // Remove from pending operations
        this.pendingOperations = this.pendingOperations.filter(
            op => !(op.type === 'mkdir' && op.path === normalizedPath)
        );
        
        throw new Error(`Failed to create directory ${normalizedPath}: ${lastError.message}`);
    }
    
    /**
     * Check if a file exists
     * @param {string} filePath - Path to the file
     * @returns {Promise<boolean>} - Whether the file exists
     */
    async fileExists(filePath) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        // Normalize path
        const normalizedPath = this._normalizePath(filePath);
        
        try {
            // Check if fs is available
            if (!this.fs) {
                throw new Error('File system not initialized');
            }
            
            // Use promise-based exists check
            return new Promise(resolve => {
                this.fs.exists(normalizedPath, (exists) => resolve(exists));
            });
        } catch (error) {
            this._handleError(
                error,
                'file-manager',
                'warning',
                { operation: 'fileExists', path: normalizedPath }
            );
            return false;
        }
    }
    
    /**
     * Delete a file with retry mechanism
     * @param {string} filePath - Path to the file
     * @param {Object} options - Options
     * @param {number} options.retries - Number of retries (default: 3)
     * @param {number} options.retryDelay - Delay between retries in ms (default: 500)
     * @returns {Promise<boolean>} - Success status
     */
    async deleteFile(filePath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const {
            retries = 3,
            retryDelay = 500
        } = options;
        
        // Normalize path
        const normalizedPath = this._normalizePath(filePath);
        
        // Check if file exists first
        const exists = await this.fileExists(normalizedPath);
        if (!exists) {
            // File doesn't exist, consider it deleted
            return true;
        }
        
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Add to pending operations
                this.pendingOperations.push({
                    type: 'delete',
                    path: normalizedPath,
                    startTime: Date.now()
                });
                
                // Check if fs is available
                if (!this.fs) {
                    throw new Error('File system not initialized');
                }
                
                // Use promisified version of unlink
                const unlinkAsync = this._promisify(this.fs.unlink);
                await unlinkAsync(normalizedPath);
                
                // Remove from pending operations
                this.pendingOperations = this.pendingOperations.filter(
                    op => !(op.type === 'delete' && op.path === normalizedPath)
                );
                
                return true;
            } catch (error) {
                lastError = error;
                
                // If this is the last attempt, don't wait
                if (attempt === retries) break;
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        // All attempts failed
        const errorInfo = this._handleError(
            lastError,
            'file-manager',
            'error',
            { operation: 'deleteFile', path: normalizedPath }
        );
        
        // Remove from pending operations
        this.pendingOperations = this.pendingOperations.filter(
            op => !(op.type === 'delete' && op.path === normalizedPath)
        );
        
        throw new Error(`Failed to delete file ${normalizedPath}: ${lastError.message}`);
    }
    
    /**
     * Get information about a file
     * @param {string} filePath - Path to the file
     * @returns {Promise<Object>} - File information
     */
    async getFileInfo(filePath) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        // Normalize path
        const normalizedPath = this._normalizePath(filePath);
        
        try {
            // Check if fs is available
            if (!this.fs) {
                throw new Error('File system not initialized');
            }
            
            // Use promisified version of stat
            const statAsync = this._promisify(this.fs.stat);
            const stats = await statAsync(normalizedPath);
            
            return {
                path: normalizedPath,
                size: stats.size,
                created: stats.birthtime || stats.ctime,
                modified: stats.mtime,
                accessed: stats.atime,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile()
            };
        } catch (error) {
            const errorInfo = this._handleError(
                error,
                'file-manager',
                'warning',
                { operation: 'getFileInfo', path: normalizedPath }
            );
            
            throw new Error(`Failed to get file info for ${normalizedPath}: ${error.message}`);
        }
    }
    
    /**
     * List files in a directory
     * @param {string} dirPath - Path to the directory
     * @param {Object} options - Options
     * @param {boolean} options.recursive - Whether to list files recursively (default: false)
     * @param {Array<string>} options.extensions - List of file extensions to include (default: all)
     * @returns {Promise<Array<string>>} - List of file paths
     */
    async listFiles(dirPath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const {
            recursive = false,
            extensions = []
        } = options;
        
        // Normalize path
        const normalizedPath = this._normalizePath(dirPath);
        
        try {
            // Check if fs is available
            if (!this.fs) {
                throw new Error('File system not initialized');
            }
            
            // Check if directory exists
            const exists = await this.fileExists(normalizedPath);
            if (!exists) {
                return [];
            }
            
            // Use promisified version of readdir
            const readdirAsync = this._promisify(this.fs.readdir);
            const files = await readdirAsync(normalizedPath);
            
            // If not recursive, return the files (optionally filtered by extension)
            if (!recursive) {
                const result = await Promise.all(
                    files.map(async (file) => {
                        const filePath = require('path').join(normalizedPath, file);
                        const info = await this.getFileInfo(filePath);
                        
                        // Only include files, not directories
                        if (!info.isFile) {
                            return null;
                        }
                        
                        // Filter by extension if specified
                        if (extensions.length > 0) {
                            const ext = require('path').extname(file).toLowerCase().replace('.', '');
                            if (!extensions.includes(ext)) {
                                return null;
                            }
                        }
                        
                        return filePath;
                    })
                );
                
                // Filter out null values (directories or excluded extensions)
                return result.filter(Boolean);
            }
            
            // Handle recursive case
            const result = [];
            
            for (const file of files) {
                const filePath = require('path').join(normalizedPath, file);
                const info = await this.getFileInfo(filePath);
                
                if (info.isFile) {
                    // Filter by extension if specified
                    if (extensions.length > 0) {
                        const ext = require('path').extname(file).toLowerCase().replace('.', '');
                        if (extensions.includes(ext)) {
                            result.push(filePath);
                        }
                    } else {
                        result.push(filePath);
                    }
                } else if (info.isDirectory) {
                    // Recursively list files in subdirectory
                    const subFiles = await this.listFiles(filePath, { recursive: true, extensions });
                    result.push(...subFiles);
                }
            }
            
            return result;
        } catch (error) {
            const errorInfo = this._handleError(
                error,
                'file-manager',
                'error',
                { operation: 'listFiles', path: normalizedPath }
            );
            
            throw new Error(`Failed to list files in ${normalizedPath}: ${error.message}`);
        }
    }
    
    /**
     * Copy a file
     * @param {string} sourcePath - Source file path
     * @param {string} destinationPath - Destination file path
     * @param {Object} options - Options
     * @param {boolean} options.overwrite - Whether to overwrite existing files (default: false)
     * @returns {Promise<boolean>} - Success status
     */
    async copyFile(sourcePath, destinationPath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const {
            overwrite = false
        } = options;
        
        // Normalize paths
        const normalizedSourcePath = this._normalizePath(sourcePath);
        const normalizedDestPath = this._normalizePath(destinationPath);
        
        try {
            // Check if source file exists
            const sourceExists = await this.fileExists(normalizedSourcePath);
            if (!sourceExists) {
                throw new Error(`Source file does not exist: ${normalizedSourcePath}`);
            }
            
            // Check if destination file exists
            const destExists = await this.fileExists(normalizedDestPath);
            if (destExists && !overwrite) {
                throw new Error(`Destination file already exists: ${normalizedDestPath}`);
            }
            
            // Create destination directory if needed
            await this.ensureDirectory(require('path').dirname(normalizedDestPath));
            
            // Read source file
            const content = await this.readFile(normalizedSourcePath);
            
            // Write to destination file
            await this.writeFile(normalizedDestPath, content);
            
            return true;
        } catch (error) {
            const errorInfo = this._handleError(
                error,
                'file-manager',
                'error',
                { operation: 'copyFile', source: normalizedSourcePath, destination: normalizedDestPath }
            );
            
            throw new Error(`Failed to copy file from ${normalizedSourcePath} to ${normalizedDestPath}: ${error.message}`);
        }
    }
    
    /**
     * Get default path for a specific type
     * @param {string} type - Path type ('database', 'documents', 'backup', 'images', 'temp')
     * @returns {string|null} - The path or null if not found
     */
    getPath(type) {
        if (!this.isInitialized) {
            this.initialize();
        }
        
        if (!this.paths.hasOwnProperty(type)) {
            return null;
        }
        
        return this.paths[type];
    }
    
    /**
     * Set default path for a specific type
     * @param {string} type - Path type ('database', 'documents', 'backup', 'images', 'temp')
     * @param {string} path - The path to set
     * @returns {boolean} - Success status
     */
    setPath(type, path) {
        if (!this.isInitialized) {
            this.initialize();
        }
        
        if (!this.paths.hasOwnProperty(type)) {
            return false;
        }
        
        this.paths[type] = this._normalizePath(path);
        return true;
    }
    
    /**
     * Get all default paths
     * @returns {Object} - Map of path types to paths
     */
    getAllPaths() {
        if (!this.isInitialized) {
            this.initialize();
        }
        
        return { ...this.paths };
    }
}

// Create a singleton instance
const fileManager = new FileManager();

// Export the singleton instance
export default fileManager;
