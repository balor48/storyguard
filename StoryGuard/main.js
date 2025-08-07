const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Force enable all console logging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// Override console methods to ensure they always work
console.log = (...args) => originalConsoleLog.apply(console, args);
console.error = (...args) => originalConsoleError.apply(console, args);
console.warn = (...args) => originalConsoleWarn.apply(console, args);
console.info = (...args) => originalConsoleInfo.apply(console, args);

// Prevent any other code from modifying console methods
Object.defineProperties(console, {
  log: { writable: false, configurable: false },
  error: { writable: false, configurable: false },
  warn: { writable: false, configurable: false },
  info: { writable: false, configurable: false }
});

// Enable critical error logging
process.on('uncaughtException', (error) => {
  console.error('[CRITICAL] Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[CRITICAL] Unhandled Rejection:', error);
});

// Initialize global variables
if (!global.protectedPaths) {
  console.error('[CRITICAL] Initializing global.protectedPaths');
  const appDir = __dirname; // Get the app directory
  
  // Initialize with default paths
  global.protectedPaths = {
    database: path.resolve(appDir, 'database'),
    documents: path.resolve(appDir, 'documents'),
    backup: path.resolve(appDir, 'backup'),
    Images: path.resolve(appDir, 'images') // Changed from 'Images' to 'images' folder
  };
  
  // Try to load from settings if available
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      // Update paths from settings
      if (settings.databaseDirectory) {
        global.protectedPaths.database = settings.databaseDirectory;
      }
      if (settings.documentDirectory) {
        global.protectedPaths.documents = settings.documentDirectory;
      }
      if (settings.backupDirectory) {
        global.protectedPaths.backup = settings.backupDirectory;
      }
      if (settings.imagesDirectory) {
        global.protectedPaths.Images = settings.imagesDirectory;
      }
      
      console.error('[CRITICAL] Updated global.protectedPaths from settings');
    }
  } catch (error) {
    console.error('[CRITICAL] Error loading settings for paths:', error);
  }
  
  console.error('[CRITICAL] global.protectedPaths initialized:', global.protectedPaths);
}

global.isDarkMode = false;
global.storyboardDirectory = '';

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;
let settingsWindow = null;

// Track the last loaded database to prevent duplicate loads
let lastLoadedDatabase = {
  path: null,
  timestamp: 0
};

// Function to initialize application settings
function initializeSettings() {
  try {
    // Check if settings file exists
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      // Initialize dark mode
      global.isDarkMode = settings.theme === 'dark';
      
      // Helper function to clean duplicate directory paths
      const cleanPath = (dirPath, dirType) => {
        if (!dirPath) return dirPath;
        
        const pathParts = dirPath.split(path.sep);
        // Check for duplicate directory types at the end, like /database/database
        if (pathParts.length >= 2 && 
            pathParts[pathParts.length - 1] === dirType && 
            pathParts[pathParts.length - 2] === dirType) {
          // Remove the duplicate folder
          pathParts.pop();
          const cleanedPath = pathParts.join(path.sep);
          console.log(`During initialization: Removed duplicate ${dirType} folder from path:`, cleanedPath);
          return cleanedPath;
        }
        return dirPath;
      };
      
      // Clean and initialize all directory paths
      const databaseDir = settings.databaseDirectory ? cleanPath(settings.databaseDirectory, 'database') : path.resolve(__dirname, 'database');
      const documentsDir = settings.documentDirectory ? cleanPath(settings.documentDirectory, 'documents') : path.resolve(__dirname, 'documents');
      const backupDir = settings.backupDirectory ? cleanPath(settings.backupDirectory, 'backup') : path.resolve(__dirname, 'backup');
      const imagesDir = settings.imagesDirectory ? cleanPath(settings.imagesDirectory, 'images') : path.resolve(__dirname, 'images');
      
      // Initialize protected paths
      global.protectedPaths = {
        database: databaseDir,
        documents: documentsDir,
        backup: backupDir,
        Images: imagesDir
      };
      
      // Ensure all directories exist
      Object.entries(global.protectedPaths).forEach(([key, dir]) => {
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created ${key} directory:`, dir);
        }
      });
      
      // Update settings with cleaned paths
      settings.databaseDirectory = databaseDir;
      settings.documentDirectory = documentsDir;
      settings.backupDirectory = backupDir;
      settings.imagesDirectory = imagesDir;
      
      // Save settings back with cleaned paths
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      
      console.log('Initialized protected paths:', global.protectedPaths);
      
      // Initialize storyboard directory
      if (settings.storyboardDirectory) {
        settings.storyboardDirectory = cleanPath(settings.storyboardDirectory, 'storyboard');
        global.storyboardDirectory = settings.storyboardDirectory;
        console.log('Loaded storyboard directory from settings:', global.storyboardDirectory);
      } else {
        // Use database directory for storyboard if not specified
        global.storyboardDirectory = databaseDir;
        console.log('Using database directory for storyboard:', global.storyboardDirectory);
      }
      
      // Ensure storyboard directory exists
      if (!fs.existsSync(global.storyboardDirectory)) {
        fs.mkdirSync(global.storyboardDirectory, { recursive: true });
        console.log('Created directory for storyboard data:', global.storyboardDirectory);
      }
    } else {
      // Initialize with default paths if no settings file exists
      global.protectedPaths = {
        database: path.join(__dirname, 'database'),
        documents: path.join(__dirname, 'documents'),
        backup: path.join(__dirname, 'backup')
      };
      
      // Create default directories
      Object.entries(global.protectedPaths).forEach(([key, dir]) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created default ${key} directory:`, dir);
        }
      });
      
      // Save default settings
      const defaultSettings = {
        theme: 'light',
        databaseDirectory: global.protectedPaths.database,
        documentDirectory: global.protectedPaths.documents,
        backupDirectory: global.protectedPaths.backup,
        imagesDirectory: global.protectedPaths.Images
      };
      
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
      console.log('Created default settings with paths:', global.protectedPaths);
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
    // Fallback to default directory in case of error
    const dbDir = path.join(__dirname, 'database');
    global.storyboardDirectory = dbDir; // Use database directory directly
    console.log('Error loading settings. Using database directory for storyboard:', global.storyboardDirectory);
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    y: 70,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'app/index.html'));

  // Inject console protection code
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Store original console methods
      const originalConsole = {
        log: console.log.bind(console),
        error: console.error.bind(console),
        warn: console.warn.bind(console),
        info: console.info.bind(console),
        debug: console.debug ? console.debug.bind(console) : console.log.bind(console)
      };

      // Create protected versions
      Object.keys(originalConsole).forEach(method => {
        console[method] = function(...args) {
          try {
            originalConsole[method].apply(console, args);
          } catch (e) {
            originalConsole.log.apply(console, args);
          }
        };
      });

      // Make console methods non-configurable
      Object.defineProperties(console, {
        log: { configurable: false, writable: false },
        error: { configurable: false, writable: false },
        warn: { configurable: false, writable: false },
        info: { configurable: false, writable: false },
        debug: { configurable: false, writable: false }
      });

      // Override any existing logging control
      if (window.loggingControl) {
        delete window.loggingControl;
      }
    `);
  });

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Database',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            // Get the database directory from settings
            let dbDirectory = path.join(__dirname, 'database');
            try {
              const settingsPath = path.join(app.getPath('userData'), 'settings.json');
              if (fs.existsSync(settingsPath)) {
                const settingsData = fs.readFileSync(settingsPath, 'utf8');
                const settings = JSON.parse(settingsData);
                if (settings.databaseDirectory) {
                  dbDirectory = settings.databaseDirectory;
                }
              }
            } catch (error) {
              console.error('Error reading settings:', error);
            }
            
            const { canceled, filePaths } = await dialog.showOpenDialog({
              defaultPath: dbDirectory,
              properties: ['openFile'],
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!canceled && filePaths.length > 0) {
              try {
                console.log('User selected database file:', filePaths[0]);
                
                // Read the file content
                const fileContent = fs.readFileSync(filePaths[0], 'utf8');
                
                // Parse the file to ensure it's valid JSON before loading
                try {
                  const data = JSON.parse(fileContent);
                  console.log('Successfully parsed database file, loading content');
                  
                  // Load the database content
                  const success = await loadDatabaseContent(fileContent, filePaths[0]);
                  
                  if (success) {
                    // Show loading toast only after successful load
                    mainWindow.webContents.executeJavaScript(`
                      if (window.Core && window.Core.showToast) {
                        window.Core.showToast('Database "${path.basename(filePaths[0], '.json')}" loaded successfully', 'success');
                      }
                    `);
                    
                    // Update the renderer process with the new database
                    mainWindow.webContents.executeJavaScript(`
                      if (localStorage) {
                        localStorage.setItem('currentDatabasePath', '${filePaths[0].replace(/\\/g, '\\\\')}');
                        localStorage.setItem('currentDatabaseName', '${path.basename(filePaths[0], '.json')}');
                      }
                      
                      // Refresh UI if possible
                      if (window.UI && typeof window.UI.refreshAllTabs === 'function') {
                        window.UI.refreshAllTabs();
                      } else if (window.UI && typeof window.UI.switchTab === 'function') {
                        window.UI.switchTab('dashboard');
                      }
                    `);
                  }
                } catch (parseError) {
                  console.error('Error parsing database file:', parseError);
                  mainWindow.webContents.executeJavaScript(`
                    if (window.Core && window.Core.showToast) {
                      window.Core.showToast('Error loading database: Not a valid JSON file', 'error');
                    }
                  `);
                }
              } catch (fileError) {
                console.error('Error reading database file:', fileError);
                mainWindow.webContents.executeJavaScript(`
                  if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Error reading database file: ${fileError.message.replace(/'/g, "\\'")}', 'error');
                  }
                `);
              }
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            // Use the automatic save functionality instead of showing a dialog
            mainWindow.webContents.send('auto-save-database');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            // Use the app's local database directory
            let dbDirectory = path.join(__dirname, 'database');
            try {
              const settingsPath = path.join(app.getPath('userData'), 'settings.json');
              if (fs.existsSync(settingsPath)) {
                const settingsData = fs.readFileSync(settingsPath, 'utf8');
                const settings = JSON.parse(settingsData);
                if (settings.databaseDirectory) {
                  dbDirectory = settings.databaseDirectory;
                }
              }
            } catch (error) {
              console.error('Error reading settings:', error);
            }
            
            const { canceled, filePath } = await dialog.showSaveDialog({
              defaultPath: dbDirectory,
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!canceled && filePath) {
              // Get the current database from renderer
              try {
                // Get the current database name from the renderer
                const databaseName = await mainWindow.webContents.executeJavaScript('localStorage.getItem("currentDatabaseName") || "story-database"');
                
                // Get all the data needed for export
                const data = await mainWindow.webContents.executeJavaScript(`
                  (function() {
                    return {
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
                      databaseName: "${databaseName}",
                      exportDate: new Date().toISOString(),
                      version: '2.0.0'
                    };
                  })()
                `);
                
                // Convert to JSON
                const json = JSON.stringify(data, null, 2);
                
                // Save the file directly from main process
                fs.writeFileSync(filePath, json, 'utf8');
                
                // Show success notification
                mainWindow.webContents.executeJavaScript(`
                  if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Database saved successfully', 'success');
                  }
                `);
              } catch (error) {
                console.error('Error saving database:', error);
                mainWindow.webContents.executeJavaScript(`
                  if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Error saving database', 'error');
                  }
                `);
              }
            }
          }
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: async () => {
            createSettingsWindow();
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            dialog.showMessageBox({
              title: 'About Story Database',
              message: 'Story Database Desktop v1.0.0',
              detail: 'A tool for writers to manage their story elements.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  // Get the screen dimensions
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  // Create settings window
  settingsWindow = new BrowserWindow({
    width: 800,
    height: 1050, // Made even taller
    x: (screenWidth - 800) / 2, // Center horizontally
    y: 30, // Position very near top
    modal: true,
    parent: mainWindow,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the settings HTML file
  settingsWindow.loadFile(path.join(__dirname, 'app', 'settings-dialog.html'));

  // No need to send current-theme anymore as we're using localStorage

  // Handle window close
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// Also create directories in app directory instead of userData
const ensureBackupDirectory = () => {
  const backupDir = path.join(__dirname, 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);
  }
};

// Cleanup any Imported DB files
function cleanupImportedDbFiles() {
  console.log('Checking for Imported DB files to clean up');
  
  const directories = [
    path.join(__dirname, 'database'),
    path.join(__dirname, 'backup'),
    path.join(app.getPath('userData'), 'database'),
    path.join(app.getPath('userData'), 'backup')
  ];
  
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.includes('Imported DB') && file.endsWith('.json')) {
            const oldPath = path.join(dir, file);
            const newPath = path.join(dir, file.replace('Imported DB', 'Custom Database'));
            
            try {
              // Read the file to update its content too
              const content = fs.readFileSync(oldPath, 'utf8');
              let data;
              try {
                data = JSON.parse(content);
                if (data.databaseName && data.databaseName.includes('Imported DB')) {
                  data.databaseName = data.databaseName.replace('Imported DB', 'Custom Database');
                  // Write the updated content back
                  fs.writeFileSync(oldPath, JSON.stringify(data, null, 2));
                }
              } catch (parseError) {
                console.error('Error parsing JSON file:', parseError);
              }
              
              // Now rename the file
              fs.renameSync(oldPath, newPath);
              console.log(`Renamed file from ${oldPath} to ${newPath}`);
            } catch (error) {
              console.error(`Error renaming file ${oldPath}:`, error);
            }
          }
        });
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Only create one window
  createWindow();
  
  // Clean up any Imported DB files
  cleanupImportedDbFiles();
  
  // IMPORTANT: Ensure all directories are in app directory
  // Ensure database directory exists
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }
  ensureBackupDirectory();
  
  // Initialize application settings
  initializeSettings();
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  
  // Set up IPC handlers
  setupIPCHandlers();
});

// Set up IPC handlers
function setupIPCHandlers() {
  // ... existing IPC handlers ...
  
  // Handler for saving settings
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      
      // Update global.protectedPaths with the new settings
      if (settings.databaseDirectory) {
        global.protectedPaths.database = settings.databaseDirectory;
      }
      if (settings.documentDirectory) {
        global.protectedPaths.documents = settings.documentDirectory;
        global.protectedPaths.PDF = settings.documentDirectory; // For backward compatibility
      }
      if (settings.backupDirectory) {
        global.protectedPaths.backup = settings.backupDirectory;
      }
      
      console.log('Settings saved to file:', settingsPath);
      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, error: error.message };
    }
  });
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Improved function to safely extract database name from a file path
function sanitizeDatabaseName(filePath) {
  if (!filePath) return 'Default';

  try {
    // Extract just the filename without the path
    const filename = path.basename(filePath, '.json');
    
    // Special handling for known database names with hyphens
    const knownDatabases = [
      'historical-supplement',
      'mystery-supplement',
      'sample-fantasy-database',
      'sci-fi-supplement'
    ];
    
    // Check if this is one of our known databases
    for (const dbName of knownDatabases) {
      if (filename === dbName || 
          filename.toLowerCase() === dbName.toLowerCase() || 
          filename === dbName + '.json') {
        console.log(`Recognized special database: ${dbName}`);
        return dbName;
      }
    }
    
    // Remove file extension if present
    const baseName = filename.replace(/\.json$/i, '');
    
    // Filter out invalid characters but preserve hyphens, underscores, spaces
    const cleaned = baseName.replace(/[^a-zA-Z0-9\-_. ]/g, '');
    
    // If nothing remains after cleaning, use "Default"
    return cleaned || 'Default';
  } catch (error) {
    console.error('Error sanitizing database name:', error);
    return 'Default';
  }
}

// Function to load database content (enhanced)
function loadDatabaseContent(content, filePath) {
  console.log(`Loading database content from: ${filePath || 'unknown source'}`);
  
  try {
    // Parse the content
    let data = JSON.parse(content);
    
    // Check if the database name needs to be preserved/fixed
    if (data) {
      // If the database doesn't have a name, get one from the file path
      if (!data.databaseName && filePath) {
        const databaseName = sanitizeDatabaseName(filePath);
        console.log(`Setting database name from filename: ${databaseName}`);
        data.databaseName = databaseName;
      } 
      // If it has a name, ensure it's cleaned up
      else if (data.databaseName) {
        // For names from our special databases, preserve them exactly
        const knownDatabases = [
          'Default',
          'hello',
          'historical-supplement',
          'mystery-supplement',
          'sample-fantasy-database',
          'sci-fi-supplement'
        ];
        
        // Don't modify known database names
        const isKnownDatabase = knownDatabases.some(
          db => data.databaseName === db || 
               data.databaseName.toLowerCase() === db.toLowerCase()
        );
        
        if (!isKnownDatabase) {
          // Clean up any other database name
          const cleaned = data.databaseName.replace(/[^a-zA-Z0-9\-_. ]/g, '');
          if (cleaned !== data.databaseName) {
            console.log(`Cleaned database name: ${data.databaseName} -> ${cleaned}`);
            data.databaseName = cleaned || sanitizeDatabaseName(filePath) || 'Default';
          }
        }
      }
      
      // Replace any instances of "Imported DB" with "Custom Database"
      if (data && data.databaseName && data.databaseName.includes('Imported DB')) {
        data.databaseName = data.databaseName.replace('Imported DB', 'Custom Database');
        console.log('Renamed Imported DB to Custom Database in database name');
      }
      
      // Send the updated content back
      mainWindow.webContents.send('database-file-content', JSON.stringify(data));
      
      // Let the renderer know that the database has been switched
      if (filePath) {
        mainWindow.webContents.send('database-switched', {
          path: filePath,
          name: data.databaseName
        });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error loading database content:', error);
    mainWindow.webContents.send('error', `Error loading database: ${error.message}`);
    return false;
  }
}

// Handle IPC messages from renderer process
ipcMain.on('read-file', (event, filePath) => {
  console.log('Reading file:', filePath);
  
  try {
    let resolvedPath;
    
    // Special case for readme files and offline-features.html
    if (filePath === 'readme/readme.html' ||
        filePath === 'readme/offline-features.html' ||
        filePath.includes('readme')) {
      // Resolve the path relative to the root directory
      resolvedPath = path.resolve(__dirname, filePath);
      console.log('Documentation file detected, resolving from root directory:', resolvedPath);
    } else {
      // For other files, resolve the path relative to the app directory
      resolvedPath = path.resolve(__dirname, 'app', filePath);
      console.log('Regular file, resolving from app directory:', resolvedPath);
    }
    
    // Check if the file exists
    if (fs.existsSync(resolvedPath)) {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      console.log(`File read successfully. Content length: ${content.length}`);
      event.reply('file-content', content);
    } else {
      console.error('File not found:', resolvedPath);
      
      // Try alternative paths for documentation files
      if (filePath.includes('readme') || filePath.includes('offline-features')) {
        // Extract the filename from the path
        const filename = path.basename(filePath);
        
        const alternativePaths = [
          path.resolve(__dirname, 'readme', filename),
          path.resolve(__dirname, 'app', 'readme', filename),
          path.resolve(__dirname, '..', 'readme', filename)
        ];
        
        console.log('Trying alternative paths for documentation file:', alternativePaths);
        
        for (const altPath of alternativePaths) {
          if (fs.existsSync(altPath)) {
            console.log('Found documentation file at alternative path:', altPath);
            const content = fs.readFileSync(altPath, 'utf8');
            console.log(`File read successfully from alternative path. Content length: ${content.length}`);
            event.reply('file-content', content);
            return;
          }
        }
      }
      
      event.reply('file-error', `File not found: ${resolvedPath}`);
    }
  } catch (error) {
    console.error('Error reading file:', error);
    event.reply('file-error', error.message);
  }
});

ipcMain.on('write-file', (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    event.reply('file-saved', filePath);
  } catch (error) {
    event.reply('file-error', error.message);
  }
});

// Handle opening external URLs
ipcMain.on('open-external-url', (event, url) => {
  console.log('Opening external URL:', url);
  
  // Validate URL to prevent security issues
  const validProtocols = ['https:', 'http:', 'mailto:', 'file:'];
  try {
    const parsedUrl = new URL(url);
    if (validProtocols.includes(parsedUrl.protocol)) {
      shell.openExternal(url)
        .then(() => {
          console.log('URL opened successfully');
        })
        .catch(error => {
          console.error('Error opening URL:', error);
          event.reply('file-error', `Failed to open URL: ${error.message}`);
        });
    } else {
      console.error('Invalid URL protocol:', parsedUrl.protocol);
      event.reply('file-error', `Invalid URL protocol: ${parsedUrl.protocol}`);
    }
  } catch (error) {
    console.error('Invalid URL format:', error);
    event.reply('file-error', `Invalid URL format: ${error.message}`);
  }
});

// Handle opening local files
ipcMain.on('open-local-file', (event, filePath) => {
  console.log('Opening local file:', filePath);
  
  try {
    let resolvedPath;
    
    // Special case for readme files and offline-features.html
    if (filePath === 'readme/readme.html' ||
        filePath === 'readme/offline-features.html' ||
        filePath.includes('readme')) {
      // Resolve the path relative to the root directory
      resolvedPath = path.resolve(__dirname, filePath);
      console.log('Documentation file detected, resolving from root directory');
    } else {
      // For other files, resolve the path relative to the app directory
      resolvedPath = path.resolve(__dirname, 'app', filePath);
    }
    
    console.log('Resolved path:', resolvedPath);
    
    // Check if the file exists
    if (fs.existsSync(resolvedPath)) {
      // Convert to file:// URL
      const fileUrl = `file://${resolvedPath.replace(/\\/g, '/')}`;
      
      // Open the file using the default application
      shell.openExternal(fileUrl)
        .then(() => {
          console.log('File opened successfully');
        })
        .catch(error => {
          console.error('Error opening file:', error);
          event.reply('file-error', `Failed to open file: ${error.message}`);
        });
    } else {
      console.error('File not found:', resolvedPath);
      
      // Try alternative paths for documentation files
      if (filePath.includes('readme') || filePath.includes('offline-features')) {
        // Extract the filename from the path
        const filename = path.basename(filePath);
        
        const alternativePaths = [
          path.resolve(__dirname, 'readme', filename),
          path.resolve(__dirname, 'app', 'readme', filename),
          path.resolve(__dirname, '..', 'readme', filename)
        ];
        
        console.log('Trying alternative paths for documentation file:', alternativePaths);
        
        for (const altPath of alternativePaths) {
          if (fs.existsSync(altPath)) {
            console.log('Found documentation file at alternative path:', altPath);
            const fileUrl = `file://${altPath.replace(/\\/g, '/')}`;
            shell.openExternal(fileUrl)
              .then(() => {
                console.log('File opened successfully from alternative path');
              })
              .catch(error => {
                console.error('Error opening file from alternative path:', error);
                event.reply('file-error', `Failed to open file from alternative path: ${error.message}`);
              });
            return;
          }
        }
      }
      
      event.reply('file-error', `File not found: ${resolvedPath}`);
    }
  } catch (error) {
    console.error('Error opening local file:', error);
    event.reply('file-error', `Error opening local file: ${error.message}`);
  }
});

// Handle reading the database folder
ipcMain.on('read-database-folder', (event, customPath) => {
  console.log('Reading database folder:', customPath);
  
  try {
    // Fix Windows path issues by properly normalizing
    // Convert all forward slashes to backslashes for Windows consistency
    let normalizedPath;
    
    if (customPath) {
      normalizedPath = customPath.replace(/\//g, path.sep);
      // Remove any double backslashes that might have been created
      normalizedPath = normalizedPath.replace(/\\\\/g, path.sep);
      console.log('Normalized custom path:', normalizedPath);
    } else {
      normalizedPath = path.join(process.cwd(), 'database');
      console.log('Using default database path:', normalizedPath);
    }
    
    // Also check if we need to add "database" to the path
    if (!normalizedPath.toLowerCase().endsWith('database')) {
      // Check if the path itself exists and is a directory
      if (fs.existsSync(normalizedPath) && fs.statSync(normalizedPath).isDirectory()) {
        console.log('Path exists but does not end with "database"');
        
        // Check if there's a database subfolder
        const databaseSubfolder = path.join(normalizedPath, 'database');
        if (fs.existsSync(databaseSubfolder) && fs.statSync(databaseSubfolder).isDirectory()) {
          console.log('Found database subfolder, using:', databaseSubfolder);
          normalizedPath = databaseSubfolder;
        }
      }
    }
    
    console.log('Final database path:', normalizedPath);
    
    // Check if the folder exists
    if (!fs.existsSync(normalizedPath)) {
      console.log('Database folder does not exist, creating it');
      fs.mkdirSync(normalizedPath, { recursive: true });
    }
    
    // Read the folder contents
    const files = fs.readdirSync(normalizedPath);
    console.log('Database files:', files);
    
    // Filter for valid database JSON files - use stricter rules
    const jsonFiles = files.filter(file => {
      // Must end with .json
      if (!file.endsWith('.json')) return false;
      
      // Exclude common non-database JSON files
      const excludedFiles = ['package.json', 'package-lock.json', 'settings.json', 'tsconfig.json'];
      if (excludedFiles.includes(file)) return false;
      
      // Get the full path
      const filePath = path.join(normalizedPath, file);
      
      try {
        // Check file size (should be at least 50 bytes to be a valid database)
        const stats = fs.statSync(filePath);
        if (stats.size < 50) return false;
        
        // Try to peek into the file to verify it's a database
        const fileData = fs.readFileSync(filePath, 'utf8');
        
        // Basic check - look for some database structure
        // Most database files will have at least one of these fields
        const hasDbStructure = 
          fileData.includes('"characters"') || 
          fileData.includes('"books"') ||
          fileData.includes('"plots"') ||
          fileData.includes('"worldElements"') ||
          fileData.includes('"relationships"') ||
          fileData.includes('"databaseName"');
        
        return hasDbStructure;
      } catch (err) {
        // If any error occurs during validation, exclude the file
        console.log(`Excluding file ${file} due to validation error:`, err.message);
        return false;
      }
    });
    
    console.log('Valid database JSON files:', jsonFiles);
    
    // Create database info objects
    const databases = jsonFiles.map(file => {
      const filePath = path.join(normalizedPath, file);
      const fileExists = fs.existsSync(filePath);
      const stats = fileExists ? fs.statSync(filePath) : { size: 0, mtime: new Date() };
      return {
        name: file.replace('.json', ''),
        path: filePath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        exists: fileExists
      };
    });
    
    // Send the database list back to the renderer
    event.reply('database-folder-contents', databases);
    
    // If this was a successful read, also try to read parent directory
    // This helps with misplaced database files
    if (normalizedPath !== path.dirname(normalizedPath)) {
      try {
        const parentPath = path.dirname(normalizedPath);
        console.log('Also checking parent directory for database files:', parentPath);
        
        if (fs.existsSync(parentPath) && fs.statSync(parentPath).isDirectory()) {
          const parentFiles = fs.readdirSync(parentPath);
          
          // Apply the same validation to parent directory files
          const parentJsonFiles = parentFiles.filter(file => {
            // Must end with .json
            if (!file.endsWith('.json')) return false;
            
            // Exclude common non-database JSON files
            const excludedFiles = ['package.json', 'package-lock.json', 'settings.json', 'tsconfig.json'];
            if (excludedFiles.includes(file)) return false;
            
            // Get the full path
            const filePath = path.join(parentPath, file);
            
            try {
              // Check file size (should be at least 50 bytes to be a valid database)
              const stats = fs.statSync(filePath);
              if (stats.size < 50) return false;
              
              // Try to peek into the file to verify it's a database
              const fileData = fs.readFileSync(filePath, 'utf8');
              
              // Basic check - look for some database structure
              // Most database files will have at least one of these fields
              const hasDbStructure = 
                fileData.includes('"characters"') || 
                fileData.includes('"books"') ||
                fileData.includes('"plots"') ||
                fileData.includes('"worldElements"') ||
                fileData.includes('"relationships"') ||
                fileData.includes('"databaseName"');
              
              return hasDbStructure;
            } catch (err) {
              // If any error occurs during validation, exclude the file
              console.log(`Excluding parent file ${file} due to validation error:`, err.message);
              return false;
            }
          });
          
          console.log('Valid database JSON files in parent directory:', parentJsonFiles);
          
          if (parentJsonFiles.length > 0) {
            console.log('Found database JSON files in parent directory:', parentJsonFiles);
            
            // Also add these to the database list
            const parentDatabases = parentJsonFiles.map(file => {
              const filePath = path.join(parentPath, file);
              const fileExists = fs.existsSync(filePath);
              const stats = fileExists ? fs.statSync(filePath) : { size: 0, mtime: new Date() };
              return {
                name: file.replace('.json', ''),
                path: filePath,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                exists: fileExists
              };
            });
            
            // Combine with existing databases, avoiding duplicates by path
            const combinedDatabases = [...databases];
            for (const db of parentDatabases) {
              if (!combinedDatabases.some(existingDb => existingDb.path === db.path)) {
                combinedDatabases.push(db);
              }
            }
            
            // Send the combined database list
            console.log('Sending combined database list:', combinedDatabases);
            event.reply('database-folder-contents', combinedDatabases);
          }
        }
      } catch (parentError) {
        console.error('Error checking parent directory:', parentError);
        // Don't fail the whole operation, just log the error
      }
    }
  } catch (error) {
    console.error('Error reading database folder:', error);
    event.reply('file-error', `Error reading database folder: ${error.message}`);
  }
});

// Improved database file reading handler with better path resolution
ipcMain.on('read-database-file', (event, filePath) => {
  console.log(`[MAIN] Received request to read database file: ${filePath}`);
  
  // Normalize the path to prevent issues with backslashes/forward slashes
  const normalizedPath = path.normalize(filePath);
  console.log(`[MAIN] Normalized path: ${normalizedPath}`);
  
  // Define all possible locations where the file might be
  const possibleLocations = [
    normalizedPath,
    path.join(__dirname, normalizedPath),
    path.join(__dirname, 'database', path.basename(normalizedPath)),
    path.join(app.getPath('userData'), 'database', path.basename(normalizedPath)),
    path.join(app.getPath('userData'), path.basename(normalizedPath))
  ];
  
  console.log('[MAIN] Checking these locations for database file:');
  possibleLocations.forEach(loc => console.log(`- ${loc}`));
  
  // Try each location
  let fileFound = false;
  let fileContent = null;
  
  for (const loc of possibleLocations) {
    try {
      console.log(`[MAIN] Checking if file exists at: ${loc}`);
      if (fs.existsSync(loc)) {
        console.log(`[MAIN] Found file at: ${loc}`);
        fileContent = fs.readFileSync(loc, 'utf8');
        fileFound = true;
        
        // Save the successful path to remember where we found it
        const successfulPath = path.resolve(loc);
        console.log(`[MAIN] Successfully loaded database from: ${successfulPath}`);
        
        try {
          // Try to parse the content to see if it's valid JSON
          JSON.parse(fileContent);
          
          // Pass both the content and the resolved path
          const result = loadDatabaseContent(fileContent, successfulPath);
          if (result) {
            console.log('[MAIN] Database loaded successfully');
            // Also send the resolved path so the renderer knows where the file was found
            event.reply('database-file-loaded-from', successfulPath);
            event.reply('toast-message', {
              message: `Switched to database ${path.basename(successfulPath, '.json')}`,
              type: 'success'
            });
          }
        } catch (parseError) {
          console.error(`[MAIN] File is not valid JSON: ${parseError.message}`);
          event.reply('error', `File is not a valid database: ${parseError.message}`);
          event.reply('toast-message', {
            message: `Failed to load database: not a valid JSON file`,
            type: 'error'
          });
          
          // Not a valid database file, continue checking other locations
          fileFound = false;
          continue;
        }
        
        break;
      }
    } catch (error) {
      console.error(`[MAIN] Error checking location ${loc}:`, error);
    }
  }
  
  if (!fileFound) {
    console.error('[MAIN] Database file not found in any location');
    
    // Create a more user-friendly error message
    const filename = path.basename(normalizedPath);
    const detailedMessage = `Could not find database file "${filename}". Checked in application folder and user data folder.`;
    
    event.reply('error', detailedMessage);
    event.reply('toast-message', {
      message: `Database not found: ${filename}`,
      type: 'error'
    });
    
    // DON'T load the default database as a fallback - that's what's causing the issue
    // Instead, send the user a clear error message
    event.reply('toast-message', {
      message: `Please create the database first or select an existing one`,
      type: 'info'
    });
  }
});

ipcMain.on('save-database-file', (event, { filePath, content }) => {
  console.log('Silently saving database file to:', filePath);
  
  try {
    // Get the directory path
    const directory = path.dirname(filePath);
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(directory)) {
      console.log('Creating directory:', directory);
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Write the file synchronously to ensure it's saved before sending response
    fs.writeFileSync(filePath, content);
    console.log('Database file saved successfully');
    
    // Send success notification to renderer
    event.reply('file-saved', filePath);
  } catch (error) {
    console.error('Error saving database file:', error);
    event.reply('file-error', error.message);
  }
});

// Handle directory selection
ipcMain.on('select-directory', async (event) => {
  console.log('Selecting directory');
  
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('Selected directory:', result.filePaths[0]);
      event.reply('directory-selected', result.filePaths[0]);
    } else {
      console.log('Directory selection canceled');
      event.reply('directory-selected', null);
    }
  } catch (error) {
    console.error('Error selecting directory:', error);
    event.reply('file-error', `Error selecting directory: ${error.message}`);
  }
});

// Handle save database request
ipcMain.on('save-database', (event) => {
  console.log('Save database requested');
  mainWindow.webContents.send('save-database-request');
});

// Handle save file with dialog
ipcMain.on('save-file-with-dialog', async (event, { defaultPath, content }) => {
  console.log('Saving file with dialog, default path:', defaultPath);
  
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export Database',
      defaultPath: defaultPath,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      // User selected a file path, now save the content
      fs.writeFile(result.filePath, content, (err) => {
        if (err) {
          console.error('Error saving file:', err);
          event.reply('file-error', `Error saving file: ${err.message}`);
        } else {
          console.log('File saved to:', result.filePath);
          event.reply('file-saved', result.filePath);
        }
      });
    } else {
      console.log('Save dialog canceled');
    }
  } catch (error) {
    console.error('Error saving file with dialog:', error);
    event.reply('file-error', `Error saving file: ${error.message}`);
  }
});

// Handle ensure-directory-exists message
ipcMain.on('ensure-directory-exists', (event, directory) => {
  console.log('');
  console.log('===========================================================');
  console.log('BACKUP DIRECTORY DEBUG - START OF DIRECTORY CHECK');
  console.log('===========================================================');
  console.log('BACKUP DIRECTORY DEBUG - Original path requested:', directory);
  console.log('BACKUP DIRECTORY DEBUG - Application directory:', __dirname);
  console.log('BACKUP DIRECTORY DEBUG - User data directory:', app.getPath('userData'));
  
  try {
    // ALWAYS use the exact directory path provided if it exists
    let finalDirectory = directory;
    
    // Only validate and find alternatives if the provided path is undefined/empty or just a filename
    if (!directory || directory.trim() === '' || !directory.includes('/') && !directory.includes('\\')) {
      console.error('BACKUP DIRECTORY DEBUG - Invalid or relative directory path:', directory);
      
      // CRITICAL FIX: Special handling for 'backup' directory name
      if (directory === 'backup') {
        // If the directory is exactly 'backup', use the app's backup directory
        const backupDir = path.join(__dirname, 'backup');
        console.log('BACKUP DIRECTORY DEBUG - Using app backup directory for "backup":', backupDir);
        finalDirectory = backupDir;
      } else {
        // Try to get a valid backup path from settings or default
        let validPath;
        try {
          // Check settings for database directory
          const settingsPath = path.join(app.getPath('userData'), 'settings.json');
          console.log('BACKUP DIRECTORY DEBUG - Settings path:', settingsPath);
          
          if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            console.log('BACKUP DIRECTORY DEBUG - Found settings file, checking for backup paths');
            console.log('BACKUP DIRECTORY DEBUG - All settings paths:', {
              backupDirectory: settings.backupDirectory,
              databaseDirectory: settings.databaseDirectory,
              documentDirectory: settings.documentDirectory,
              storyboardDirectory: settings.storyboardDirectory
            });
            
            // First try backup directory, then database directory
            if (settings.backupDirectory) {
              validPath = settings.backupDirectory;
              console.log('BACKUP DIRECTORY DEBUG - Using backup directory from settings:', validPath);
            } else if (settings.databaseDirectory) {
              validPath = settings.databaseDirectory;
              console.log('BACKUP DIRECTORY DEBUG - Using database directory from settings:', validPath);
            }
          } else {
            console.log('BACKUP DIRECTORY DEBUG - Settings file not found');
          }
        } catch (settingsError) {
          console.error('BACKUP DIRECTORY DEBUG - Error reading settings for directory fallback:', settingsError);
        }
        
        // If still no valid path, use application default
        if (!validPath) {
          // IMPORTANT: Use 'backup' directory, not 'database'
          validPath = path.join(__dirname, 'backup');
          console.log('BACKUP DIRECTORY DEBUG - No valid path found in settings, using default backup directory:', validPath);
        }
        
        console.log(`BACKUP DIRECTORY DEBUG - Using fallback directory path: ${validPath}`);
        finalDirectory = validPath;
      }
    } else {
      console.log('BACKUP DIRECTORY DEBUG - Using provided directory path:', finalDirectory);
    }
    
    // CRITICAL FIX: Convert any backslashes to forward slashes first for consistency
    let processedPath = finalDirectory.replace(/\\/g, '/');
    console.log('BACKUP DIRECTORY DEBUG - After backslash conversion:', processedPath);
    
    // Remove trailing slashes for consistency
    processedPath = processedPath.replace(/\/+$/, '');
    console.log('BACKUP DIRECTORY DEBUG - After trailing slash removal:', processedPath);
    
    // Convert back to the platform-specific format
    const normalizedDir = processedPath.replace(/\//g, path.sep);
    console.log('BACKUP DIRECTORY DEBUG - After normalizing to platform-specific format:', normalizedDir);
    
    // Ensure it's an absolute path if relative
    let directoryToUse = normalizedDir;
    if (!path.isAbsolute(normalizedDir)) {
      directoryToUse = path.resolve(__dirname, normalizedDir);
      console.log('BACKUP DIRECTORY DEBUG - Path was relative, converted to absolute path:', directoryToUse);
    } else {
      console.log('BACKUP DIRECTORY DEBUG - Path is already absolute, no conversion needed');
    }
    
    // Check if the directory exists and create it if it doesn't
    let success = true;
    let errorMessage = null;
    
    try {
      // First check if the directory exists
      console.log('BACKUP DIRECTORY DEBUG - Checking if directory exists:', directoryToUse);
      const exists = fs.existsSync(directoryToUse);
      console.log('BACKUP DIRECTORY DEBUG - Directory exists check result:', exists);
      
      if (!exists) {
        console.log('BACKUP DIRECTORY DEBUG - Directory does not exist, creating:', directoryToUse);
        try {
          // Create the directory recursively
          fs.mkdirSync(directoryToUse, { recursive: true });
          console.log('BACKUP DIRECTORY DEBUG - Directory creation attempted');
          
          // Double-check that it was created
          const creationCheck = fs.existsSync(directoryToUse);
          console.log('BACKUP DIRECTORY DEBUG - Directory creation verification:', creationCheck);
          
          if (!creationCheck) {
            console.error('BACKUP DIRECTORY DEBUG - Directory creation failed despite no error');
            success = false;
            errorMessage = 'Directory creation failed without throwing an error';
          }
        } catch (mkdirError) {
          console.error('BACKUP DIRECTORY DEBUG - Error creating directory:', mkdirError);
          success = false;
          errorMessage = `Failed to create directory: ${mkdirError.message}`;
        }
      } else {
        console.log('BACKUP DIRECTORY DEBUG - Directory already exists');
        
        // Check if it's writable
        try {
          const testFile = path.join(directoryToUse, '.write_test');
          console.log('BACKUP DIRECTORY DEBUG - Testing write access with file:', testFile);
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          console.log('BACKUP DIRECTORY DEBUG - Directory is writable');
        } catch (writeError) {
          console.error('BACKUP DIRECTORY DEBUG - Directory is not writable:', writeError);
          // Continue anyway, but log the warning
        }
      }
    } catch (checkError) {
      console.error('BACKUP DIRECTORY DEBUG - Error checking directory:', checkError);
      success = false;
      errorMessage = `Error checking directory: ${checkError.message}`;
    }
    
    // Send back the normalized directory path and success status
    console.log('BACKUP DIRECTORY DEBUG - Final result:');
    console.log('  - Success:', success);
    console.log('  - Directory to use:', directoryToUse);
    console.log('  - Error message:', errorMessage);
    console.log('===========================================================');
    console.log('BACKUP DIRECTORY DEBUG - END OF DIRECTORY CHECK');
    console.log('');
    
    // CRITICAL FIX: Always send the directoryToUse as the normalizedPath
    // This fixes the issue where normalizedPath was undefined even when success=true
    event.sender.send('directory-exists-result', success, directoryToUse, errorMessage);
  } catch (error) {
    console.error('BACKUP DIRECTORY DEBUG - Fatal error in ensure-directory-exists:', error);
    // Send failure response with detailed error
    event.sender.send('directory-exists-result', false, null, `Fatal error: ${error.message}`);
  }
});

// Handle save-file message (respects user settings while fixing path issues)
ipcMain.on('save-file', (event, { filePath, content, responseChannel }) => {
  console.log('');
  console.log('===========================================================');
  console.log('FILE SAVE DEBUG - SAVE FILE HANDLER');
  console.log('===========================================================');
  console.log('FILE SAVE DEBUG - Original file path:', filePath);
  
  let finalPath = filePath;
  
  try {
    // First check if this is an absolute path coming from the settings
    // If so, respect it completely
    if (path.isAbsolute(filePath)) {
      console.log('FILE SAVE DEBUG - Using absolute path from settings:', filePath);
      finalPath = filePath;
    }
    // Handle paths that already have a type prefix (e.g., backup/file.json)
    else if (filePath.includes('/') || filePath.includes('\\')) {
      // Just make it absolute
      finalPath = path.join(__dirname, filePath);
      console.log('FILE SAVE DEBUG - Made relative path absolute:', finalPath);
    }
    // Handle standalone filenames with no path only as a fallback
    else {
      // Determine file type and corresponding directory
      const lowerFilePath = filePath.toLowerCase();
      let folderType = 'unknown';
      
      // Check file type for directory routing
      if (lowerFilePath.includes('backup')) {
        folderType = 'backup';
      } else if (lowerFilePath.endsWith('.pdf') || 
                lowerFilePath.endsWith('.doc') || lowerFilePath.endsWith('.docx') || 
                lowerFilePath.endsWith('.txt') || lowerFilePath.endsWith('.rtf')) {
        folderType = 'documents';
      } else if (lowerFilePath.endsWith('.jpg') || lowerFilePath.endsWith('.jpeg') || 
                lowerFilePath.endsWith('.png') || lowerFilePath.endsWith('.gif')) {
        folderType = 'Images';
      }
      
      console.log('FILE SAVE DEBUG - Detected file type for fallback:', folderType);
      
      // Use the appropriate directory
      if (folderType !== 'unknown') {
        finalPath = path.join(__dirname, folderType, filePath);
        console.log(`FILE SAVE DEBUG - Using fallback directory for ${folderType}:`, finalPath);
      } else {
        // Unknown type, just use the file as is in the current directory
        finalPath = path.join(__dirname, filePath);
        console.log('FILE SAVE DEBUG - Using current directory for unknown file type:', finalPath);
      }
    }
    
    // Ensure the target directory exists
    const targetDir = path.dirname(finalPath);
    console.log('FILE SAVE DEBUG - Ensuring target directory exists:', targetDir);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log('FILE SAVE DEBUG - Created target directory:', targetDir);
    }
    
    // Save the file
    console.log('FILE SAVE DEBUG - Saving file to:', finalPath);
    fs.writeFile(finalPath, content, (err) => {
      if (err) {
        console.error('FILE SAVE DEBUG - Error saving file:', err);
        // Send failure response
        event.reply(responseChannel, false);
      } else {
        console.log('FILE SAVE DEBUG - File saved successfully:', finalPath);
        // Send success response
        event.reply(responseChannel, true);
      }
    });
  } catch (error) {
    console.error('FILE SAVE DEBUG - Error in save file handler:', error);
    // Send failure response
    event.reply(responseChannel, false);
  }
  
  console.log('===========================================================');
  console.log('FILE SAVE DEBUG - END SAVE FILE HANDLER');
  console.log('===========================================================');
  console.log('');
});

// Add a handler for directory browsing
ipcMain.handle('browse-directory', async (event, directoryType) => {
  console.log('SETTINGS FIX: Browsing directory request for type:', directoryType);
  
  try {
    let title = 'Select Directory';
    let defaultPath = app.getPath('documents');
    
    // Set appropriate title and default path based on directory type
    if (directoryType === 'database') {
      defaultPath = settings.databasePath || path.join(app.getPath('userData'), 'database');
      title = 'Select Database Directory';
    } else if (directoryType === 'documents') {
      defaultPath = settings.documentPath || path.join(app.getPath('userData'), 'documents');
      title = 'Select Documents Directory';
    } else if (directoryType === 'backup') {
      defaultPath = settings.backupPath || path.join(app.getPath('userData'), 'backup');
      title = 'Select Backup Directory';
    } else if (directoryType === 'images') {
      defaultPath = settings.imagePath || path.join(app.getPath('userData'), 'images');
      title = 'Select Images Directory';
    }
    
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: title,
      defaultPath: defaultPath,
      buttonLabel: 'Select'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      console.log(`SETTINGS FIX: User selected ${directoryType} directory:`, selectedPath);
      
      // Remember this path for this directoryType
      // Send it back via the force-exact-path event
      event.sender.send('force-exact-path', {
        directoryType: directoryType,
        exactPath: selectedPath
      });
      
      return selectedPath;
    }
    
    console.log(`SETTINGS FIX: User canceled ${directoryType} directory selection`);
    return null;
  } catch (error) {
    console.error('SETTINGS FIX: Error showing directory dialog:', error);
    return null;
  }
});

// Update the get-paths handler to provide clearer path information
ipcMain.handle('get-paths', (event) => {
  console.log('PATH INFO: Get paths request');
  console.error('[CRITICAL] In get-paths handler, global.protectedPaths:', global.protectedPaths);
  
  try {
    // Try to read from settings first
    let settings = {};
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      try {
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');
        settings = JSON.parse(settingsContent);
        console.log('PATH INFO: Read settings for paths:', Object.keys(settings));
      } catch (readError) {
        console.error('PATH INFO: Error reading settings file:', readError);
      }
    }
    
    // Get the app directory and make it user-friendly
    const appDir = __dirname;
    
    // Default paths - use absolute paths with app directory
    const paths = {
      root: appDir,
      appData: app.getPath('userData'),
      documents: path.join(appDir, 'documents'),
      database: path.join(appDir, 'database'),
      backup: path.join(appDir, 'backup'),
      images: path.join(appDir, 'images')
    };
    
    // Override with settings if available
    if (settings.databaseDirectory) {
      paths.database = settings.databaseDirectory;
    }
    
    if (settings.backupDirectory) {
      paths.backup = settings.backupDirectory;
    }
    
    // Set document directory path
    if (settings.documentDirectory) {
      paths.documents = settings.documentDirectory;
    } else if (settings.pdfDirectory) {
      // Migrate old pdfDirectory setting to documentDirectory
      paths.documents = settings.pdfDirectory;
      // Update settings to use documentDirectory instead of pdfDirectory
      settings.documentDirectory = settings.pdfDirectory;
      // Save the updated settings
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    }
    
    // Set images directory path from settings if available
    if (settings.imagesDirectory) {
      paths.images = settings.imagesDirectory;
    }
    
    // Make sure global.protectedPaths is consistent with these paths
    if (!global.protectedPaths) {
      console.error('[CRITICAL] global.protectedPaths is undefined in get-paths, initializing with paths');
      global.protectedPaths = {
        database: paths.database,
        documents: paths.documents,
        backup: paths.backup,
        Images: paths.images
      };
    } else {
      // Update global.protectedPaths with current paths
      global.protectedPaths.database = paths.database;
      global.protectedPaths.documents = paths.documents;
      global.protectedPaths.backup = paths.backup;
      global.protectedPaths.Images = paths.images; // Add this line to update the Images path
    }
    
    // Add user-friendly path information
    const pathInfo = {};
    Object.keys(paths).forEach(key => {
      pathInfo[key] = {
        path: paths[key],
        isAbsolute: path.isAbsolute(paths[key]),
        normalized: path.normalize(paths[key]),
        exists: fs.existsSync(paths[key])
      };
    });
    
    console.log('PATH INFO: Paths information:', pathInfo);
    console.error('[CRITICAL] Exiting get-paths handler, global.protectedPaths:', global.protectedPaths);
    
    // Return both the paths and detailed info
    return {
      ...paths,
      pathInfo: pathInfo,
      // For "\PDF" clarification
      pathHelp: "Note: In Windows, '\\PDF' is a relative path from the drive root. For example, 'D:\\PDF'. " +
                "Our app uses absolute paths like '" + path.join(appDir, 'PDF') + "'"
    };
  } catch (error) {
    console.error('PATH INFO: Error getting application paths:', error);
    return {
      app: __dirname,
      userData: app.getPath('userData'),
      error: error.message
    };
  }
});

// Add handlers for settings window
ipcMain.handle('save-settings', async (event, settings) => {
  console.error('[CRITICAL] Starting save-settings handler');
  console.error('[CRITICAL] global.protectedPaths:', global.protectedPaths);
  console.error('[CRITICAL] Received settings:', settings);

  try {
    // Make sure global.protectedPaths exists
    if (!global.protectedPaths) {
      console.error('[CRITICAL] global.protectedPaths is undefined, initializing with defaults');
      global.protectedPaths = {
        database: path.join(__dirname, 'database'),
        documents: path.join(__dirname, 'documents'),
        backup: path.join(__dirname, 'backup')
      };
    }

    // Update paths from settings
    if (settings.databasePath) {
      console.error('[CRITICAL] Updating database path to:', settings.databasePath);
      global.protectedPaths.database = settings.databasePath;
    }
    if (settings.pdfPath) {
      console.error('[CRITICAL] Updating document path to:', settings.pdfPath);
      global.protectedPaths.documents = settings.pdfPath;
    }
    if (settings.documentPath) {
      console.error('[CRITICAL] Updating document path to:', settings.documentPath);
      global.protectedPaths.documents = settings.documentPath;
    }
    if (settings.backupPath) {
      console.error('[CRITICAL] Updating backup path to:', settings.backupPath);
      global.protectedPaths.backup = settings.backupPath;
    }

    // Handle theme change if present
    if (settings.theme) {
      global.isDarkMode = settings.theme === 'dark';
      // Broadcast theme change to all windows
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('theme-changed', global.isDarkMode);
      });
    }

    // Create directories
    for (const [key, dir] of Object.entries(global.protectedPaths)) {
      if (dir && !fs.existsSync(dir)) {
        console.error('[CRITICAL] Creating directory:', dir);
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Save settings
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    const settingsToSave = {
      ...settings,
      databaseDirectory: global.protectedPaths.database,
      documentDirectory: global.protectedPaths.documents, // Ensure document directory is set correctly
      backupDirectory: global.protectedPaths.backup,
      imagesDirectory: global.protectedPaths.Images
    };

    console.error('[CRITICAL] Saving settings to:', settingsPath);
    console.error('[CRITICAL] Settings content:', settingsToSave);

    fs.writeFileSync(settingsPath, JSON.stringify(settingsToSave, null, 2));
    console.error('[CRITICAL] Settings saved successfully');
    return { success: true };
  } catch (error) {
    console.error('[CRITICAL] Error saving settings:', error);
    return { success: false, error: error.message };
  }
});

// Add handler for theme-changed event
ipcMain.on('theme-changed', (event, isDark) => {
  console.log('Theme changed to:', isDark ? 'dark' : 'light');
  
  // Update global theme state
  global.isDarkMode = isDark;
  
  // Broadcast theme change to all windows
  BrowserWindow.getAllWindows().forEach(window => {
    if (window.webContents !== event.sender) {
      window.webContents.send('theme-changed', isDark);
    }
  });
  
  // Save theme setting to settings file
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    
    settings.theme = isDark ? 'dark' : 'light';
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('Theme setting saved to settings file');
  } catch (error) {
    console.error('Error saving theme setting:', error);
  }
});

ipcMain.on('close-settings-window', (event) => {
  console.log('SETTINGS FIX: Closing settings window');
  
  // Find the settings window and close it
  const settingsWindow = BrowserWindow.getAllWindows().find(win => 
    win.webContents.getURL().includes('settings-dialog.html'));
  
  if (settingsWindow) {
    settingsWindow.close();
    console.log('SETTINGS FIX: Settings window closed');
  } else {
    console.log('SETTINGS FIX: Settings window not found');
  }
});

// Add handler for direct PDF saving without dialog
ipcMain.handle('save-pdf', async (event, data) => {
    const { content, filename } = data;
    console.log('DIRECT DOCUMENT SAVE: Saving document without dialog', filename);
    
    try {
        // Get Document directory from global.protectedPaths
        let docDir = global.protectedPaths.documents || path.join(__dirname, 'documents'); // Default
        console.log('DIRECT DOCUMENT SAVE: Using document directory from global.protectedPaths:', docDir);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
            console.log('DIRECT DOCUMENT SAVE: Created directory:', docDir);
        }
        
        // Save the file
        const filePath = path.join(docDir, filename);
        fs.writeFileSync(filePath, content);
        console.log('DIRECT DOCUMENT SAVE: File saved successfully to:', filePath);
        
        return { success: true, path: filePath };
    } catch (error) {
        console.error('DIRECT DOCUMENT SAVE: Error saving file:', error);
        return { success: false, error: error.message };
    }
});

// Add handler for direct HTML saving without dialog
ipcMain.handle('save-html', async (event, data) => {
    const { content, filename } = data;
    console.log('DIRECT HTML SAVE: Saving HTML without dialog', filename);
    
    try {
        // Get Document directory from settings with better logging
        let docDir = path.join(__dirname, 'documents'); // Default
        let settingsFound = false;
        
        // Try to read from settings
        try {
            const settingsPath = path.join(app.getPath('userData'), 'settings.json');
            console.log('DIRECT HTML SAVE: Looking for settings at:', settingsPath);
            
            if (fs.existsSync(settingsPath)) {
                settingsFound = true;
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                console.log('DIRECT HTML SAVE: Settings found:', Object.keys(settings));
                
                // Use documentDirectory setting
                if (settings.documentDirectory) {
                    docDir = settings.documentDirectory;
                    console.log('DIRECT HTML SAVE: Using documentDirectory from settings:', docDir);
                }
            }
        } catch (settingsError) {
            console.error('DIRECT HTML SAVE: Error reading settings:', settingsError);
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
            console.log('DIRECT HTML SAVE: Created directory:', docDir);
        }
        
        // Save the file
        const filePath = path.join(docDir, filename);
        fs.writeFileSync(filePath, content);
        console.log('DIRECT HTML SAVE: File saved successfully to:', filePath);
        
        return { success: true, path: filePath };
    } catch (error) {
        console.error('DIRECT HTML SAVE: Error saving file:', error);
        return { success: false, error: error.message };
    }
});

// Add handler for direct TXT saving without dialog
ipcMain.handle('save-txt', async (event, data) => {
    const { content, filename } = data;
    console.log('DIRECT TXT SAVE: Saving TXT without dialog', filename);
    
    try {
        // Get document directory from settings with better logging
        let docDir = path.join(__dirname, 'documents'); // Default
        let settingsFound = false;
        
        // Try to read from settings
        try {
            const settingsPath = path.join(app.getPath('userData'), 'settings.json');
            console.log('DIRECT TXT SAVE: Looking for settings at:', settingsPath);
            
            if (fs.existsSync(settingsPath)) {
                settingsFound = true;
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                console.log('DIRECT TXT SAVE: Settings found:', Object.keys(settings));
                
                // Use documentDirectory setting
                if (settings.documentDirectory) {
                    docDir = settings.documentDirectory;
                    console.log('DIRECT TXT SAVE: Using documentDirectory from settings:', docDir);
                }
            }
        } catch (settingsError) {
            console.error('DIRECT TXT SAVE: Error reading settings:', settingsError);
        }
        
        // Ensure directory exists
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
            console.log('DIRECT TXT SAVE: Created directory:', docDir);
        }
        
        const filePath = path.join(docDir, filename);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('DIRECT TXT SAVE: File saved successfully to:', filePath);
        
        return { success: true, path: filePath };
    } catch (error) {
        console.error('DIRECT TXT SAVE: Error saving file:', error);
        return { success: false, error: error.message };
    }
});

// Handle menu item: Open Database File
ipcMain.handle('menu-open-database-file', async () => {
  try {
    // Never show the "Opening historical database..." toast - it's unnecessary and confusing
    // Instead of showing a toast, we'll just proceed to open the file dialog
    
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Open Database File',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    return filePaths[0];
  } catch (error) {
    console.error('Error in menu-open-database-file handler:', error);
    return null;
  }
});

// Handle deleting a database file
ipcMain.handle('delete-database-file', async (event, filePath) => {
  console.log('Request to delete database file:', filePath);
  
  try {
    // Normalize the path to prevent issues with slashes
    const normalizedPath = path.normalize(filePath);
    console.log('Normalized path for deletion:', normalizedPath);
    
    // Check if file exists before attempting to delete
    if (fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath);
      console.log('Database file deleted successfully');
      return { success: true, filePath: normalizedPath };
    } else {
      console.error('File does not exist for deletion:', normalizedPath);
      return { 
        success: false, 
        error: `File does not exist: ${normalizedPath}`, 
        filePath: normalizedPath
      };
    }
  } catch (error) {
    console.error('Error deleting database file:', error);
    return { 
      success: false, 
      error: error.message, 
      filePath 
    };
  }
});

// Handle showing the import open dialog
ipcMain.on('import-show-open-dialog', async (event) => {
  console.log('========================================');
  console.log('OPENING IMPORT FILE DIALOG');
  console.log('========================================');
  
  try {
    // Get the database directory path to use as default
    const dbDirectory = global.protectedPaths && global.protectedPaths.database
      ? global.protectedPaths.database
      : path.join(__dirname, 'database');
      
    console.log('Using database directory for import dialog:', dbDirectory);
    
    const result = await dialog.showOpenDialog({
      title: 'Import Database File',
      defaultPath: dbDirectory,
      properties: ['openFile'],
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    console.log('Dialog result:', result);
    console.log('Dialog canceled:', result.canceled);
    console.log('File paths:', result.filePaths);
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      console.log('User selected file for import:', filePath);
      
      // Read the file content
      try {
        console.log('Reading file content...');
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('File content read, length:', content.length);
        
        // Directly load the database content into the application
        console.log('Sending database content to renderer...');
        
        // Send the content back to the renderer process in multiple ways to ensure delivery
        // First try webContents send method
        mainWindow.webContents.send('import-file-selected', {
          success: true,
          filePath,
          content
        });
        
        // Also try event.sender.send as a backup
        if (event && event.sender) {
          console.log('Using event.sender.send as backup');
          event.sender.send('import-file-selected', {
            success: true,
            filePath,
            content
          });
        }
        
        // Also try direct webContents execution
        console.log('Using executeJavaScript as a third delivery method');
        mainWindow.webContents.executeJavaScript(`
          console.log("DIRECT EXECUTE: File selected for import");
          if (window.api && window.api.receive) {
            console.log("DIRECT EXECUTE: Setting up temporary one-time listener");
            
            const importData = {
              success: true,
              filePath: ${JSON.stringify(filePath)},
              content: ${JSON.stringify(content)}
            };
            
            // Directly process the data if possible
            if (window.Storage && typeof window.Storage.loadDatabaseFromFile === 'function') {
              console.log("DIRECT EXECUTE: Loading database from file...");
              try {
                window.Storage.loadDatabaseFromFile(importData.content);
                
                // Update localStorage
                localStorage.setItem('currentDatabaseName', "${path.basename(filePath, '.json')}");
                localStorage.setItem('currentDatabasePath', "${filePath.replace(/\\/g, '\\\\')}");
                
                // Show success notification
                if (window.Core && window.Core.showToast) {
                  window.Core.showToast("Database imported successfully", "success");
                }
                
                // Refresh UI
                if (window.UI && typeof window.UI.refreshAllTabs === 'function') {
                  window.UI.refreshAllTabs();
                } else if (window.UI && typeof window.UI.switchTab === 'function') {
                  window.UI.switchTab('dashboard');
                } else {
                  setTimeout(() => { window.location.reload(); }, 500);
                }
              } catch (error) {
                console.error("DIRECT EXECUTE: Error loading database:", error);
                if (window.Core && window.Core.showToast) {
                  window.Core.showToast("Error loading database: " + error.message, "error");
                }
              }
            } else {
              console.error("DIRECT EXECUTE: Storage.loadDatabaseFromFile not available");
            }
          } else {
            console.error("DIRECT EXECUTE: window.api.receive not available");
          }
        `).catch(err => {
          console.error('Error executing JavaScript in renderer:', err);
        });
        
        console.log('All notification methods complete');
      } catch (fileError) {
        console.error('Error reading selected import file:', fileError);
        if (event && event.sender) {
          event.sender.send('import-file-selected', {
            success: false,
            filePath,
            error: fileError.message
          });
        }
        
        // Also use direct execution as fallback
        mainWindow.webContents.executeJavaScript(`
          console.error("Error reading import file: ${fileError.message.replace(/"/g, '\\"')}");
          if (window.Core && window.Core.showToast) {
            window.Core.showToast("Error reading import file: ${fileError.message.replace(/"/g, '\\"')}", "error");
          }
        `).catch(err => {
          console.error('Error executing JavaScript in renderer:', err);
        });
      }
    } else {
      console.log('Import file dialog canceled by user');
    }
  } catch (error) {
    console.error('Error showing import file dialog:', error);
    if (event && event.sender) {
      event.sender.send('import-file-selected', {
        success: false,
        error: error.message
      });
    }
  }
});

// Handle path joining request
ipcMain.handle('join-paths', async (event, ...pathSegments) => {
  try {
    return path.join(...pathSegments);
  } catch (error) {
    console.error('Error joining paths:', error);
    return null;
  }
});

// Handle save-settings request

// Load settings from file
function loadSettings() {
    try {
        const settingsPath = path.join(app.getPath('userData'), 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            // Validate settings
            if (!settings) {
                console.error('Invalid settings file. Using defaults.');
                return defaultSettings;
            }
            
            // Migrate old settings if needed
            if (settings.pdfDirectory && !settings.documentDirectory) {
                console.log('Migrating old pdfDirectory setting to documentDirectory');
                settings.documentDirectory = settings.pdfDirectory;
                delete settings.pdfDirectory;
                // Save the updated settings
                saveSettings(settings);
            }
            
            return settings;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    
    return defaultSettings;
}

// Default settings
const defaultSettings = {
    theme: 'light',
    fontSize: 'medium',
    documentDirectory: path.join(app.getPath('documents'), 'StoryBoard'),
    databaseDirectory: path.join(app.getPath('userData'), 'database'),
    backupDirectory: path.join(app.getPath('userData'), 'backups'),
    autoBackup: true,
    backupInterval: 24, // hours
    lastBackup: null,
    recentProjects: []
};

// Add handlers for image operations
ipcMain.handle('save-image-file', async (event, options) => {
  try {
    console.log('Saving image file:', options.filename);
    
    // Ensure the directory exists
    if (!fs.existsSync(options.directory)) {
      fs.mkdirSync(options.directory, { recursive: true });
      console.log('Created images directory:', options.directory);
    }
    
    // Create the full path
    const fullPath = path.join(options.directory, options.filename);
    
    // Write the file
    fs.writeFileSync(fullPath, Buffer.from(options.data, 'base64'));
    
    return { 
      success: true, 
      path: fullPath 
    };
  } catch (error) {
    console.error('Error saving image file:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

ipcMain.handle('load-image-file', async (event, imagePath) => {
  try {
    console.log('Loading image file:', imagePath);
    
    if (!fs.existsSync(imagePath)) {
      return { 
        success: false, 
        error: 'Image file not found' 
      };
    }
    
    // Read the file
    const data = fs.readFileSync(imagePath);
    
    // Determine MIME type based on file extension
    let mimeType = 'image/png';
    if (imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (imagePath.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    }
    
    // Convert to base64 data URL
    const base64Data = `data:${mimeType};base64,${data.toString('base64')}`;
    
    return { 
      success: true, 
      data: base64Data 
    };
  } catch (error) {
    console.error('Error loading image file:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    console.log('Ensuring directory exists:', dirPath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('Created directory:', dirPath);
    }
    
    return { success: true, path: dirPath };
  } catch (error) {
    console.error('Error ensuring directory:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});
