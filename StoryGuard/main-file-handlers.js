/**
 * main-file-handlers.js
 * 
 * IPC handlers for file operations using the new FileManager.
 * This module is meant to be imported in main.js to establish
 * safe file operation handlers that route through the FileManager.
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Import our file manager
let fileManager = null;

/**
 * Initialize the file handlers
 * @param {Object} options - Options
 * @param {Object} options.fileManager - FileManager instance
 * @param {Object} options.errorManager - ErrorManager instance
 */
function initializeFileHandlers(options = {}) {
    // Store the file manager reference
    if (options.fileManager) {
        fileManager = options.fileManager;
    } else {
        console.error('File manager not provided, file operations will fail');
    }
    
    // Setup all IPC handlers for file operations
    setupFileHandlers();
    
    return {
        fileManager
    };
}

/**
 * Setup all IPC handlers for file operations
 */
function setupFileHandlers() {
    // Read file safely with retry mechanism
    ipcMain.handle('read-file-safe', async (event, args) => {
        try {
            if (!fileManager) {
                throw new Error('File manager not initialized');
            }
            
            const { filePath, encoding = 'utf8', retries = 3, retryDelay = 500 } = args;
            
            return await fileManager.readFile(filePath, {
                encoding,
                retries,
                retryDelay
            });
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    });
    
    // Write file safely with retry mechanism
    ipcMain.handle('write-file-safe', async (event, args) => {
        try {
            if (!fileManager) {
                throw new Error('File manager not initialized');
            }
            
            const { 
                filePath, 
                content, 
                encoding = 'utf8', 
                createDir = true,
                retries = 3, 
                retryDelay = 500 
            } = args;
            
            return await fileManager.writeFile(filePath, content, {
                encoding,
                createDir,
                retries,
                retryDelay
            });
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    });
    
    // Ensure directory exists with retry mechanism
    ipcMain.handle('ensure-directory-exists-safe', async (event, dirPath) => {
        try {
            if (!fileManager) {
                throw new Error('File manager not initialized');
            }
            
            return await fileManager.ensureDirectory(dirPath);
        } catch (error) {
            console.error('Error ensuring directory exists:', error);
            throw error;
        }
    });
    
    // Check if file exists
    ipcMain.handle('file-exists-safe', async (event, filePath) => {
        try {
            if (!fileManager) {
                throw new Error('File manager not initialized');
            }
            
            return await fileManager.fileExists(filePath);
        } catch (error) {
            console.error('Error checking if file exists:', error);
            return false;
        }
    });
    
    // List files in directory
    ipcMain.handle('list-files-safe', async (event, args) => {
        try {
            if (!fileManager) {
                throw new Error('File manager not initialized');
            }
            
            const { dirPath, recursive = false, extensions = [] } = args;
            
            return await fileManager.listFiles(dirPath, {
                recursive,
                extensions
            });
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    });
    
    // Get file info
    ipcMain.handle('get-file-info-safe', async (event, filePath) => {
        try {
            if (!fileManager) {
                throw new Error('File manager not initialized');
            }
            
            return await fileManager.getFileInfo(filePath);
        } catch (error) {
            console.error('Error getting file info:', error);
            return null;
        }
    });
    
    // Delete file
    ipcMain.handle('delete-file-safe', async (event, filePath) => {
        try {
            if (!fileManager) {
                throw new Error('File manager not initialized');
            }
            
            return await fileManager.deleteFile(filePath);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    });
    
    // Copy file
    ipcMain.handle('copy-file-safe', async (event, args) => {
        try {
            if (!fileManager) {
                throw new Error('File manager not initialized');
            }
            
            const { sourcePath, destinationPath, overwrite = false } = args;
            
            return await fileManager.copyFile(sourcePath, destinationPath, {
                overwrite
            });
        } catch (error) {
            console.error('Error copying file:', error);
            throw error;
        }
    });
}

module.exports = {
    initializeFileHandlers
};
