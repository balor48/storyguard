const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // File operations
    readFile: (filePath) => {
      return new Promise((resolve, reject) => {
        ipcRenderer.send('read-file', filePath);

        // Set up a one-time listener for the file content
        ipcRenderer.once('file-content', (event, content) => {
          resolve(content);
        });

        // Set up a one-time listener for errors
        ipcRenderer.once('file-error', (event, error) => {
          reject(new Error(error));
        });

        // Set a timeout to prevent hanging if no response is received
        setTimeout(() => {
          reject(new Error('Timeout reading file: ' + filePath));
        }, 5000);
      });
    },
    writeFile: (filePath, content) => {
      console.log(`Sending message to main process: write-file`, { filePath, content });
      ipcRenderer.send('write-file', { filePath, content });
    },
    saveSettings: (settings) => {
      return ipcRenderer.invoke('save-settings', settings);
    },
    saveFile: (filePath, content, callback) => {
      // Create a unique channel for this save operation
      const responseChannel = `save-file-response-${Date.now()}`;

      // Set up a one-time listener for the response
      ipcRenderer.once(responseChannel, (event, success) => {
        callback(success);
      });
      
      // EMERGENCY FIX: Check if we're dealing with a standalone filename
      let pathToUse = filePath;
      
      // RESTORE SETTINGS MENU FUNCTIONALITY: Give priority to protected paths from settings
      if (protectedPaths['backupDirectory'] && filePath.toLowerCase().includes('backup') && !filePath.includes('/') && !filePath.includes('\\')) {
        // Use the user-defined backup directory from settings
        pathToUse = `${protectedPaths['backupDirectory']}\\${filePath}`;
        console.log('SETTINGS RESTORED: Using user-defined backup directory:', pathToUse);
      }
      // Check for document directory for PDF files
      else if (protectedPaths['documentDirectory'] && 
              filePath.toLowerCase().endsWith('.pdf') && 
              !filePath.includes('/') && !filePath.includes('\\')) {
        // Use the user-defined document directory from settings
        pathToUse = `${protectedPaths['documentDirectory']}\\${filePath}`;
        console.log('SETTINGS RESTORED: Using user-defined document directory for PDF:', pathToUse);
      }
      else if (protectedPaths['database'] && !filePath.includes('/') && !filePath.includes('\\')) {
        // Use the database protected path for other files
        pathToUse = `${protectedPaths['database']}\\${filePath}`;
        console.log('SETTINGS RESTORED: Using protected database path for file:', pathToUse);
      }
      // Only use our direct fix if no protected paths are available
      else if (!filePath.includes('/') && !filePath.includes('\\')) {
        console.log('No protected paths set, using direct path fix for standalone filename:', filePath);
        
        // Check file type by extension or name pattern
        const lowerFilePath = filePath.toLowerCase();
        
        // BACKUP FILES: Contains 'backup' in the name
        if (lowerFilePath.includes('backup')) {
          // DIRECT FIX: Always use the app's backup directory for backup files
          // This bypasses all the complex path handling that's failing
          const backupPath = 'backup/' + filePath;
          console.log('DIRECT FIX: Forcing backup file to app backup directory:', backupPath);
          pathToUse = backupPath;
        }
        // PDF FILES: Has .pdf extension
        else if (lowerFilePath.endsWith('.pdf')) {
          // Use the PDF directory
          const pdfPath = 'PDF/' + filePath;
          console.log('DIRECT FIX: Forcing PDF file to app PDF directory:', pdfPath);
          pathToUse = pdfPath;
        }
        // DOCUMENT FILES: Has .doc, .docx, .txt, .rtf extensions
        else if (lowerFilePath.endsWith('.doc') || lowerFilePath.endsWith('.docx') || 
                 lowerFilePath.endsWith('.txt') || lowerFilePath.endsWith('.rtf')) {
          // Use the documents directory
          const docsPath = 'documents/' + filePath;
          console.log('DIRECT FIX: Forcing document file to app documents directory:', docsPath);
          pathToUse = docsPath;
        }
        // IMAGE FILES: Has image extensions
        else if (lowerFilePath.endsWith('.jpg') || lowerFilePath.endsWith('.jpeg') || 
                 lowerFilePath.endsWith('.png') || lowerFilePath.endsWith('.gif')) {
          // Use the images directory
          const imagesPath = 'Images/' + filePath;
          console.log('DIRECT FIX: Forcing image file to app Images directory:', imagesPath);
          pathToUse = imagesPath;
        }
      }

      // Send the save request with the response channel
      console.log(`Sending message to main process: save-file`, { filePath: pathToUse, content, responseChannel });
      ipcRenderer.send('save-file', { filePath: pathToUse, content, responseChannel });
    },

    // Event listeners
    onFileOpened: (callback) => {
      ipcRenderer.on('file-opened', (event, filePath) => callback(filePath));
    },
    onSaveFile: (callback) => {
      ipcRenderer.on('save-file', (event, filePath) => callback(filePath));
    },
    onFileContent: (callback) => {
      ipcRenderer.on('file-content', (event, content) => callback(content));
    },
    onFileSaved: (callback) => {
      ipcRenderer.on('file-saved', (event, filePath) => callback(filePath));
    },
    onFileError: (callback) => {
      ipcRenderer.on('file-error', (event, message) => callback(message));
    },
    onShowSettings: (callback) => {
      ipcRenderer.on('show-settings', () => callback());
    },

    onSaveDatabaseRequest: (callback) => {
      ipcRenderer.on('save-database-request', () => callback());
    },

    // Path protection feature - NEW FEATURE!
    onForceExactPath: (callback) => {
      ipcRenderer.on('force-exact-path', (event, data) => {
        console.log('IMPORTANT: Received force-exact-path event with data:', data);
        callback(data);
      });
    },

    // Settings-specific IPC
    getPaths: () => ipcRenderer.invoke('get-paths'),
    browseDirectory: (directoryType) => {
      console.log('CRITICAL: Browsing directory for type:', directoryType);
      return ipcRenderer.invoke('browse-directory', directoryType);
    },

    // General IPC
    send: (channel, data) => {
      console.log(`Sending message to main process: ${channel}`, data);
      // Whitelist channels for security
      const validChannels = [
        'open-external-url',
        'open-local-file',
        'read-database-folder',
        'save-settings',
        'close-settings-window',
        'notification-setting-changed',
        'font-size-changed',
        'load-database-from-file',
        'save-database-to-file',
        'read-database-file',
        'save-database-file',
        'select-directory',
        'save-file-with-dialog',
        'show-export-dialog',
        'get-paths',
        'show-settings',
        'browse-directory',
        'theme-changed',
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },

    // Add invoke functionality with security checks
    invoke: (channel, data) => {
      console.log(`Invoking main process: ${channel}`, data);
      // Whitelist channels for security
      const validChannels = [
        'get-paths',
        'browse-directory',
        'delete-database-file',
        'save-settings',
        'save-pdf',
        'save-html',
        'save-txt',
        'save-docx',
        'join-paths'
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      return Promise.reject(new Error(`Channel ${channel} is not allowed for invoke`));
    },

    // Helper method to join paths using the OS-specific separator
    joinPaths: async (...pathSegments) => {
      return ipcRenderer.invoke('join-paths', ...pathSegments);
    },

    // Direct method for saving PDF
    savePdf: async (content, filename) => {
      console.log(`Saving PDF: ${filename}`);
      return ipcRenderer.invoke('save-pdf', { content, filename });
    },

    // Direct method for saving HTML
    saveHtml: async (content, filename) => {
      console.log(`Saving HTML: ${filename}`);
      return ipcRenderer.invoke('save-html', { content, filename });
    },

    // Direct method for saving TXT
    saveTxt: async (content, filename) => {
      console.log(`Saving TXT: ${filename}`);
      return ipcRenderer.invoke('save-txt', { content, filename });
    },

    // Direct method for saving DOCX
    saveDocx: async (content, filename) => {
      console.log(`Saving DOCX: ${filename}`);
      return ipcRenderer.invoke('save-docx', { content, filename });
    },

    once: (channel, callback) => {
      if (channel === 'theme-changed' || channel === 'current-theme') {
        ipcRenderer.once(channel, (event, ...args) => callback(...args));
      } else {
        ipcRenderer.once(channel, (event, ...args) => callback(...args));
      }
    },

    on: (channel, callback) => {
      const allowedChannels = ['theme-changed', 'current-theme', 'notification-setting-changed'];
      if (allowedChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
      }
    },

    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },

    openExternal: (url) => {
      console.log(`Sending message to main process: open-external-url`, url);
      ipcRenderer.send('open-external-url', url);
    },

    openLocalFile: (path) => {
      console.log(`Sending message to main process: open-local-file`, path);
      ipcRenderer.send('open-local-file', path);
    },

    readDatabaseFolder: (customPath) => {
      console.log(`Sending message to main process: read-database-folder`, customPath);
      ipcRenderer.send('read-database-folder', customPath);
    },

    readDatabaseFile: (filePath) => {
      console.log(`Sending message to main process: read-database-file`, filePath);
      ipcRenderer.send('read-database-file', filePath);
    },

    saveDatabaseFile: (filePath, content) => {
      console.log(`Sending message to main process: save-database-file`, { filePath, content });
      ipcRenderer.send('save-database-file', { filePath, content });
    },

    deleteDatabaseFile: (filePath) => ipcRenderer.invoke('delete-database-file', filePath),

    selectDirectory: (callback) => {
      console.log(`Sending message to main process: select-directory`);
      ipcRenderer.send('select-directory');
      ipcRenderer.once('directory-selected', (event, path) => callback(path));
    },

    ensureDirectoryExists: (directory, callback) => {
      console.log(`Sending message to main process: ensure-directory-exists`, directory);
      ipcRenderer.send('ensure-directory-exists', directory);
      ipcRenderer.once('directory-exists-result', (event, success, normalizedPath) => {
        console.log(`Directory exists check result: Success=${success}, NormalizedPath=${normalizedPath}`);
        // If normalizedPath is provided, use it, otherwise just pass the success value
        if (normalizedPath) {
          callback(success, normalizedPath);
        } else {
          callback(success);
        }
      });
    },

    onDatabaseFolderContents: (callback) => {
      ipcRenderer.on('database-folder-contents', (event, databases) => callback(databases));
    },

    onDatabaseFileContent: (callback) => {
      // Listen on both the standard and alternative channels
      ipcRenderer.on('database-file-content', (event, content) => {
        console.log('Received content on database-file-content channel, length:', content ? content.length : 0);
        callback(content);
      });

      // Also listen on the alternative channel
      ipcRenderer.on('database-file-content-alt', (event, content) => {
        console.log('Received content on database-file-content-alt channel, length:', content ? content.length : 0);
        callback(content);
      });
    },

    onDatabaseFileSaved: (callback) => {
      ipcRenderer.on('database-file-saved', (event, filePath) => callback(filePath));
    },

    removeListener: (channel, listener) => {
      const validChannels = ['database-file-content', 'database-file-content-alt', 'database-folder-contents', 'database-file-saved'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, listener);

        // If removing the main channel listener also remove the alt channel listener
        if (channel === 'database-file-content') {
          ipcRenderer.removeListener('database-file-content-alt', listener);
        }
      }
    },

    // Add a specific receive function for import-file-selected
    receive: (channel, callback) => {
      const validChannels = [
        'database-file-content',
        'database-folder-contents',
        'database-switched',
        'import-file-selected',
        'save-database-request',
        'theme-changed',
        'database-file-deleted',
        'database-file-loaded-from',
        'toast-message'
      ];

      if (validChannels.includes(channel)) {
        // Remove any existing listeners for this channel
        ipcRenderer.removeAllListeners(channel);
        
        // Set up a new listener
        ipcRenderer.on(channel, (event, ...args) => {
          console.log(`Received message on channel "${channel}":`, ...args);
          callback(...args);
        });
      } else {
        console.warn(`Channel "${channel}" is not allowed for receive`);
      }
    },

    // Remove a specific listener
    removeListener: (channel) => {
      const validChannels = [
        'database-file-content',
        'database-folder-contents',
        'database-switched',
        'import-file-selected',
        'save-database-request',
        'theme-changed',
        'database-file-deleted',
        'database-file-loaded-from',
        'toast-message'
      ];
      
      if (validChannels.includes(channel)) {
        console.log(`Removing all listeners for channel "${channel}"`);
        ipcRenderer.removeAllListeners(channel);
      }
    }
  }
);

// Add IPC functions for saving to database folder
contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = ['save-pdf', 'ensure-directory'];
    if (validChannels.includes(channel)) {
      ipcRenderer.invoke(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['pdf-saved', 'directory-created'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});

// Listen for auto-save-database message from main process
ipcRenderer.on('auto-save-database', () => {
    console.log('Auto-save triggered from menu');

    // Use the document to trigger the save button click to ensure we use the same function
    const saveButton = document.getElementById('saveDatabase');
    if (saveButton) {
        console.log('Triggering save button click');
        saveButton.click();
    } else {
        console.error('Save button not found');
    }
});

// Listen for force-exact-path from main process - PREVENTS PATH MODIFICATION
// This is a critical security feature to prevent path manipulation
let protectedPaths = {};
ipcRenderer.on('force-exact-path', (event, data) => {
    console.log('PATH PROTECTION ACTIVATED for:', data.directoryType);
    console.log('PROTECTED PATH:', data.exactPath);
    
    // Store the protected path
    protectedPaths[data.directoryType] = data.exactPath;
    
    // Store paths with friendlier names for our path handling
    if (data.directoryType === 'backupDirectory' || data.directoryType === 'backup') {
        protectedPaths['backup'] = data.exactPath;
        protectedPaths['backupDirectory'] = data.exactPath;
        console.log('SETTINGS FIX: Backup directory protection activated:', data.exactPath);
    }
    else if (data.directoryType === 'documentDirectory' || data.directoryType === 'documents') {
        protectedPaths['documents'] = data.exactPath;
        protectedPaths['documentDirectory'] = data.exactPath;
        console.log('SETTINGS FIX: Documents directory protection activated:', data.exactPath);
    }
    else if (data.directoryType === 'imageDirectory' || data.directoryType === 'Images') {
        protectedPaths['Images'] = data.exactPath;
        protectedPaths['imageDirectory'] = data.exactPath;
        console.log('SETTINGS FIX: Images directory protection activated:', data.exactPath);
    }
    else if (data.directoryType === 'databaseDirectory' || data.directoryType === 'database') {
        protectedPaths['database'] = data.exactPath;
        protectedPaths['databaseDirectory'] = data.exactPath;
        console.log('SETTINGS FIX: Database directory protection activated:', data.exactPath);
    }
    
    // When a directory type has a protected path, the renderer MUST use
    // exactly this path and not append anything to it
    console.log('SETTINGS FIX: Protected paths currently active:', Object.keys(protectedPaths));
});

// Listen for save-file message from main process (used by both Save As and Export)
ipcRenderer.on('save-file', (event, filePath, options = {}) => {
    console.log('Save file triggered from menu with path:', filePath, 'options:', options);

    // Check if this is an export operation based on the options passed
    const isExport = options && options.isExport;

    // If this is an export operation with content, save the content directly
    if (isExport && options.content) {
        console.log('This is an export operation with content');

        // Use the API to save the file
        if (window.api && window.api.saveFile) {
            window.api.saveFile(filePath, options.content, (success) => {
                if (success) {
                    // Show success message using toast only
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast(`Database exported to ${filePath.split('\\').pop()}`);
                    }
                } else {
                    // Show error message using toast only
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast('Error exporting database', 'error');
                    }
                }
            });
        } else {
            console.error('API saveFile function not available');
        }
        return;
    }

    // Regular export operation without content
    if (isExport) {
        console.log('This is an export operation');

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

        // Convert data to JSON
        const jsonData = JSON.stringify(data, null, 2);

        // Use the API to save the file
        if (window.api && window.api.saveFile) {
            window.api.saveFile(filePath, jsonData, (success) => {
                if (success) {
                    // Show success message using toast only
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast(`Database exported to ${filePath.split('\\').pop()}`);
                    }
                } else {
                    // Show error message using toast only
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast('Error exporting database', 'error');
                    }
                }
            });
        } else {
            console.error('API saveFile function not available');
            // Fallback to browser download if API not available
            const blob = new Blob([jsonData], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('\\').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success message using toast only
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Database exported to ${filePath.split('\\').pop()}`);
            }
        }
    } else {
        // This is a regular save operation
        console.log('This is a save operation');

        // Get the current database as JSON
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
            saveDate: new Date().toISOString(),
            version: '2.0.0',
            metadata: {
                databaseName: localStorage.getItem('currentDatabaseName') || 'Story Database'
            }
        };

        // Convert data to JSON
        const jsonData = JSON.stringify(data, null, 2);

        // Use the API to save the file
        if (window.api && window.api.saveFile) {
            window.api.saveFile(filePath, jsonData, (success) => {
                if (success) {
                    // Show success message using toast only
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast(`Database saved successfully`);
                    }

                    // Update the current database name to match the saved file
                    const fileName = filePath.split('\\').pop().replace('.json', '');
                    localStorage.setItem('currentDatabaseName', fileName);

                    // Update the UI to show the new database name
                    const databaseNameElement = document.getElementById('currentDatabaseName');
                    if (databaseNameElement) {
                        databaseNameElement.textContent = fileName;
                    }
                } else {
                    // Show error message using toast only
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast('Error saving database', 'error');
                    }
                }
            });
        } else {
            console.error('API saveFile function not available');
            // Fallback to browser download if API not available
            const blob = new Blob([jsonData], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('\\').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success message using toast only
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Database saved successfully');
            }
        }
    }
});

// Listen for export-file message from main process
ipcRenderer.on('export-file', (event, filePath) => {
    console.log('Export file triggered from menu with path:', filePath);

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

    // Convert data to JSON
    const jsonData = JSON.stringify(data, null, 2);

    // Use the API to save the file
    if (window.api && window.api.saveFile) {
        window.api.saveFile(filePath, jsonData, (success) => {
            if (success) {
                // Show success message using toast only
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Database exported to ${filePath.split('\\').pop()}`);
                }
            } else {
                // Show error message using toast only
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Error exporting database', 'error');
                }
            }
        });
    } else {
        console.error('API saveFile function not available');
        // Fallback to browser download if API not available
        const blob = new Blob([jsonData], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('\\').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message using toast only
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Database exported to ${filePath.split('\\').pop()}`);
        }
    }
});

// Listen for file-saved event from main process
ipcRenderer.on('file-saved', (event, filePath) => {
    console.log('File saved event received with path:', filePath);

    // Show success message using toast only
    if (window.Core && window.Core.showToast) {
        window.Core.showToast(`Database exported to ${filePath.split('\\').pop()}`);
    }
});

// Listen for export-error event from main process
ipcRenderer.on('export-error', (event, errorMessage) => {
    console.error('Export error:', errorMessage);

    // Show error message using toast only
    if (window.Core && window.Core.showToast) {
        window.Core.showToast(errorMessage || 'Error exporting database', 'error');
    }
});

// Listen for import-file-content event from main process
ipcRenderer.on('import-file-content', (event, content) => {
    console.log('Import file content received');

    // Process the imported content using the Storage module
    if (window.Storage && typeof window.Storage.processImportContent === 'function') {
        // Get the selected mode (create new or add to existing)
        const createNew = true; // Default to creating a new database
        window.Storage.processImportContent(content, !createNew);
    } else {
        console.error('processImportContent function not available');
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Error processing import: Import handler not available', 'error');
        }
    }
});

// Listen for import-error event from main process
ipcRenderer.on('import-error', (event, errorMessage) => {
    console.error('Import error:', errorMessage);

    // Show error message using toast only
    if (window.Core && window.Core.showToast) {
        window.Core.showToast(errorMessage || 'Error importing database', 'error');
    }
});

// Listen for silent-save message from main process
ipcRenderer.on('silent-save', (event, filePath) => {
    console.log('Silent save triggered with path:', filePath);

    // Get the current database as JSON
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
        databaseName: dbName,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
    };

    // Convert to JSON
    const json = JSON.stringify(data, null, 2);

    // Send to main process for silent saving
    ipcRenderer.send('save-database-file', {
        filePath: filePath,
        content: json
    });

    // Show a toast notification after a short delay
    setTimeout(() => {
        if (window.Core && window.Core.showToast) {
            const fileName = filePath.split('\\').pop();
            window.Core.showToast(`Database exported to ${fileName}`, 'success');
        }
    }, 500);
});
