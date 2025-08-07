// This file is loaded by the HTML page and handles communication with Electron

// Add DOM ready check to ensure we can show toasts

// Ensure the DOM is ready before any UI operations
function ensureDomReady() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      console.log('DOM already ready, proceeding immediately');
      resolve();
    } else {
      console.log('Waiting for DOM to be ready...');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM now ready, proceeding');
        resolve();
      });
    }
  });
}

// Wait for DOM to be ready before showing any toasts or initializing UI
ensureDomReady().then(() => {
  console.log('DOM is ready, initializing application');
  
  // Create a placeholder element for toasts if it doesn't exist
  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
    console.log('Created toast container');
  }
  
  // Now we can safely initialize our application
  initializeApplication();
});

// Main application initialization function
function initializeApplication() {
  console.log('Renderer script loaded');
  
  // Set up event listeners for Electron API
  if (window.api) {
    // Listen for file open events
    window.api.onFileOpened((filePath) => {
      console.log('File opened:', filePath);
      // Use readDatabaseFile for database files
      if (filePath.toLowerCase().endsWith('.json')) {
        console.log('Opening as database file:', filePath);
        window.api.readDatabaseFile(filePath);
      } else {
        console.log('Opening as regular file:', filePath);
        window.api.readFile(filePath);
      }
    });
    
    // Listen for notification setting changes from settings dialog
    window.api.on('notification-setting-changed', (isEnabled) => {
      console.log('Notification setting changed to:', isEnabled);
      if (window.Core) {
        if (typeof window.Core.updateNotificationSetting === 'function') {
          // Use the new updateNotificationSetting function
          window.Core.updateNotificationSetting(isEnabled);
          console.log('Updated notification setting using updateNotificationSetting function');
        } else if (typeof window.Core.toastNotificationsEnabled !== 'undefined') {
          // Fallback to the old way
          window.Core.toastNotificationsEnabled = isEnabled;
          console.log('Updated Core.toastNotificationsEnabled to:', isEnabled);
          
          // Also update localStorage for persistence
          localStorage.setItem('toastNotificationsEnabled', isEnabled);
        }
      }
    });
    
    // Listen for file save events
    window.api.onSaveFile((filePath) => {
      console.log('Save file to:', filePath);
      // Get content to save - this will depend on your app's structure
      const content = getContentToSave();
      window.api.writeFile(filePath, content);
    });
    
    // Handle file content received
    window.api.onFileContent((content) => {
      console.log('File content received, length:', content.length);
      processFileContent(content);
    });
    
    // Handle file saved confirmation
    window.api.onFileSaved((filePath) => {
      console.log('File saved successfully:', filePath);
      showNotification(`File saved: ${filePath}`);
    });
    
    // Handle file errors
    window.api.onFileError((message) => {
      console.error('File operation error:', message);
      showError(`Error: ${message}`);
    });
    
    // Add openExternal function if it doesn't exist
    if (!window.api.openExternal) {
      window.api.openExternal = (url) => {
        console.log('Opening external URL:', url);
        // This is just a placeholder. The actual implementation
        // should be in the main Electron process using shell.openExternal
        // We're sending a message to the main process to handle this
        window.api.send('open-external-url', url);
        showNotification(`Opening: ${url}`);
      };
    }

    // Add enhanced handling for switch button database loading
    if (window.api && window.api.on) {
      // Listen for the database file loaded from path
      window.api.on('database-file-loaded-from', (loadedPath) => {
        console.log('Database file was successfully loaded from:', loadedPath);
        
        // Store this path for future reference
        localStorage.setItem('lastSuccessfulDatabasePath', loadedPath);
        
        // Update any database manager UI with this information
        const switchButtons = document.querySelectorAll('.switch-button');
        switchButtons.forEach(button => {
          const buttonPath = button.getAttribute('data-path');
          if (buttonPath === loadedPath) {
            // Add a visual indicator that this is the current database
            button.classList.add('current-database');
          } else {
            button.classList.remove('current-database');
          }
        });
      });
      
      // Listen for toast messages from main
      window.api.on('toast-message', (data) => {
        // Check notification setting directly from localStorage
        const notificationsEnabled = localStorage.getItem('toastNotificationsEnabled') !== 'false';
        
        if (window.Core) {
          // Check if notifications are enabled before showing toast
          if (notificationsEnabled && window.Core.showToast) {
            window.Core.showToast(data.message, data.type);
          } else {
            // Just log to console if notifications are disabled
            console.log(`Toast suppressed (${data.type}): ${data.message} - Notifications are disabled`);
          }
        } else {
          console.log(`Toast (${data.type}): ${data.message}`);
        }
      });
    }

    // Block "Opening historical database..." toast
    if (window.api && window.api.on) {
      const openFileHandler = () => {
        console.log('Open Database menu item clicked - preventing historical database toast');
        
        // Temporarily override showToast to prevent the unwanted message
        if (window.Core && window.Core.showToast) {
          const originalShowToast = window.Core.showToast;
          window.Core.showToast = function(message, type, duration) {
            if (message === "Opening historical database..." || 
                message.includes("Opening historical database")) {
              console.log('Blocked "Opening historical database..." toast from menu action');
              return;
            }
            return originalShowToast.call(this, message, type, duration);
          };
          
          // Restore original after a short delay
          setTimeout(() => {
            window.Core.showToast = originalShowToast;
          }, 3000);
        }
      };
      
      // Listen for the open-file event from the main process
      window.api.on('open-file', openFileHandler);
      
      // Also listen for menu-open-database event if it exists
      if (window.api.on('menu-open-database')) {
        window.api.on('menu-open-database', openFileHandler);
      }
    }

    // Listen for database-switched events from main
    if (window.api && window.api.on) {
      window.api.on('database-switched', (data) => {
        console.log('Database switch event received:', data);
        
        if (data && data.name) {
          // Store the database name
          localStorage.setItem('currentDatabaseName', data.name);
          
          // Store this as a protected name
          localStorage.setItem('lastValidDatabaseName', data.name);
          
          // Add special protection for hyphened names
          if (data.name.includes('-')) {
            console.log('Adding special protection for hyphenated database name:', data.name);
            localStorage.setItem('hyphenatedDatabaseName', data.name);
          }
          
          // Update the UI
          const dbNameElement = document.getElementById('currentDatabaseName');
          if (dbNameElement) {
            dbNameElement.textContent = data.name;
          }
        }
      });
    }
  } else {
    console.warn('Electron API not available - running in browser mode');
  }
}

// Function to get content to save - customize based on your app
function getContentToSave() {
  console.log('Getting content to save...');
  
  // If we have the Storage module and it has an exportDatabase function
  if (window.Storage && typeof window.Storage.exportDatabase === 'function') {
    try {
      // Create a database object with all data
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
      console.log('Database content prepared for saving, size:', json.length);
      return json;
    } catch (error) {
      console.error('Error preparing database content for save:', error);
      showError('Error preparing database for save: ' + error.message);
    }
  }
  
  // Example: If you have a text area for book content
  const bookContent = document.getElementById('bookContent');
  if (bookContent) {
    return bookContent.value;
  }
  
  // Example: If you're saving character data
  if (window.BookAnalysis && window.BookAnalysis.extractedCharacters) {
    return JSON.stringify(window.BookAnalysis.extractedCharacters);
  }
  
  // Fallback - try to get data from global variables
  try {
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
      worldElements: window.worldElements || []
    };
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.error('Error in fallback save:', e);
    return '';
  }
}

// Function to process file content - customize based on your app
function processFileContent(content) {
  console.log('Processing file content, type:', typeof content);
  
  // Example: If you have a text area for book content
  const bookContent = document.getElementById('bookContent');
  if (bookContent) {
    bookContent.value = content;
    
    // If your app has an analyze function, call it
    if (window.BookAnalysis && typeof window.BookAnalysis.analyzeBookText === 'function') {
      window.BookAnalysis.analyzeBookText(content);
    }
    return;
  }
  
  // Example: Try to parse as JSON for character data or database
  try {
    const data = JSON.parse(content);
    console.log('Successfully parsed JSON data');
    
    // Check if it's character data
    if (Array.isArray(data) && data.length > 0 && data[0].firstName) {
      console.log('Detected character data');
      if (window.Characters) {
        window.Characters.characters = data;
        if (typeof window.Characters.displayCharacters === 'function') {
          window.Characters.displayCharacters();
        }
      }
      return;
    }
    
    // Check if it's a database file
    if (data.characters || data.locations || data.plots || data.worldbuilding) {
      console.log('Detected database file');
      // If Storage module exists, import the database
      if (window.Storage) {
        // Create a temporary function to handle database loading if loadDatabase doesn't exist
        if (!window.Storage.loadDatabase) {
          window.Storage.loadDatabase = function(data) {
            console.log('Loading database from file - completely replacing existing database');
            
            // Extract the database name from the file or generate one
            let dbName = 'Default';
            if (data.databaseName) {
              dbName = data.databaseName;
            } else {
              // Never use "Imported DB" as a name
              dbName = `Custom Database ${new Date().toLocaleDateString()}`;
            }
            console.log('Using database name:', dbName);
            
            // Reset all arrays to empty to ensure a fresh start
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
            
            // Now import the data from the file
            if (data.characters) window.characters = data.characters;
            if (data.titles) window.titles = data.titles;
            if (data.seriesList) window.seriesList = data.seriesList;
            if (data.books) window.books = data.books;
            if (data.roles) window.roles = data.roles;
            if (data.customFieldTypes) window.customFieldTypes = data.customFieldTypes;
            if (data.relationships) window.relationships = data.relationships;
            if (data.tags) window.tags = data.tags;
            if (data.plots) window.plots = data.plots;
            if (data.worldElements) window.worldElements = data.worldElements;
            
            // Update the database name immediately
            localStorage.setItem('currentDatabaseName', dbName);
            
            // Update UI elements with the new database name
            const databaseIndicator = document.getElementById('currentDatabaseName');
            if (databaseIndicator) {
              databaseIndicator.textContent = dbName;
              console.log('Updated database indicator text to:', dbName);
            }
            
            // Force UI update for database name
            if (window.UI && window.UI.updateDatabaseIndicator) {
              window.UI.updateDatabaseIndicator(dbName);
              console.log('Called UI.updateDatabaseIndicator with:', dbName);
            }
            
            // Save all data to localStorage
            if (window.Core && window.Core.safelyStoreItem) {
              console.log('Saving all data to localStorage');
              window.Core.safelyStoreItem('characters', JSON.stringify(window.characters));
              window.Core.safelyStoreItem('titles', JSON.stringify(window.titles));
              window.Core.safelyStoreItem('series', JSON.stringify(window.seriesList));
              window.Core.safelyStoreItem('books', JSON.stringify(window.books));
              window.Core.safelyStoreItem('roles', JSON.stringify(window.roles));
              window.Core.safelyStoreItem('customFieldTypes', JSON.stringify(window.customFieldTypes));
              window.Core.safelyStoreItem('relationships', JSON.stringify(window.relationships));
              window.Core.safelyStoreItem('tags', JSON.stringify(window.tags));
              window.Core.safelyStoreItem('plots', JSON.stringify(window.plots));
              window.Core.safelyStoreItem('worldElements', JSON.stringify(window.worldElements));
            }
            
            // Refresh UI components
            console.log('Refreshing UI components');
            try {
              // Refresh UI components
              if (window.Characters && window.Characters.displayCharacters) {
                window.Characters.displayCharacters();
              }
              if (window.Characters && window.Characters.initializeDropdowns) {
                window.Characters.initializeDropdowns();
              }
              if (window.Characters && window.Characters.initializeCustomFields) {
                window.Characters.initializeCustomFields();
              }
              if (window.Locations && window.Locations.displayLocations) {
                window.Locations.displayLocations();
              }
              if (window.Plots && window.Plots.displayPlots) {
                window.Plots.displayPlots();
              }
              if (window.WorldBuilding && window.WorldBuilding.displayWorldElements) {
                window.WorldBuilding.displayWorldElements();
              }
              if (window.Tags && window.Tags.refreshTagCloud) {
                window.Tags.refreshTagCloud();
              }
              
              // Force a refresh of the current tab
              const activeTab = document.querySelector('.tab-button.active');
              if (activeTab && window.UI && window.UI.switchTab) {
                const tabText = activeTab.textContent;
                const tabName = tabText.replace(/\s*Alt\+\d+\s*$/i, '').toLowerCase().trim();
                window.UI.switchTab(tabName);
              }
              
              // Force a UI refresh if available
              if (window.UI && window.UI.refreshUI) {
                window.UI.refreshUI();
              }
              
              // Schedule a page reload to ensure everything is refreshed properly
              setTimeout(() => {
                console.log('Forcing page reload to ensure clean state');
                window.location.reload();
              }, 1000);
              
            } catch (error) {
              console.error('Error during UI refresh:', error);
              // Force a page reload as a fallback
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
            
            return true;
          };
        }
        
        // Call the loadDatabase function
        window.Storage.loadDatabase(data);
        showNotification('Database loaded successfully');
      } else {
        console.error('Storage module not available to load database');
        showError('Cannot load database: Storage module not available');
      }
      return;
    }
    
    // Generic JSON data
    showNotification('JSON file loaded, but format not recognized');
    
  } catch (e) {
    console.log('Content is not JSON, treating as text:', e);
    // Handle as regular text
    showNotification('File loaded, but format not recognized');
  }
}

// Helper function to show notifications
function showNotification(message) {
  // Check notification setting directly from localStorage
  const notificationsEnabled = localStorage.getItem('toastNotificationsEnabled') !== 'false';
  
  // Use your app's notification system if available
  if (window.Core) {
    // Check if notifications are enabled
    if (notificationsEnabled) {
      // Use regular showToast which respects the notification setting
      if (window.Core.showToast) {
        window.Core.showToast(message, 'info');
      }
    } else {
      // Just log to console if notifications are disabled
      console.log(`Toast suppressed (info): ${message} - Notifications are disabled`);
    }
    return;
  }
  
  // Fallback notification only if no Core module is available
  console.log(`Fallback notification: ${message}`);
}

// Helper function to show errors
function showError(message) {
  // Check notification setting directly from localStorage
  const notificationsEnabled = localStorage.getItem('toastNotificationsEnabled') !== 'false';
  
  // Use your app's error system if available
  if (window.Core) {
    // Check if notifications are enabled
    if (notificationsEnabled) {
      // Use regular showToast which respects the notification setting
      if (window.Core.showToast) {
        window.Core.showToast(message, 'error');
      }
    } else {
      // Just log to console if notifications are disabled
      console.log(`Toast suppressed (error): ${message} - Notifications are disabled`);
    }
    return;
  }
  
  // Fallback error display only if no Core module is available
  console.error(`Fallback error: ${message}`);
}

// Add function to create "Switch" buttons for database manager
function createDatabaseSwitchButtons(databases) {
  console.log('Creating database switch buttons for:', databases);
  
  // Find the database manager container
  const dbManagerContainer = document.querySelector('.database-manager-container');
  if (!dbManagerContainer) {
    console.log('Database manager container not found');
    return;
  }
  
  // Find or create the database list
  let dbList = dbManagerContainer.querySelector('.database-list');
  if (!dbList) {
    dbList = document.createElement('div');
    dbList.className = 'database-list';
    dbManagerContainer.appendChild(dbList);
  }
  
  // Clear existing items
  dbList.innerHTML = '';
  
  // Get the currently loaded database path
  const currentPath = localStorage.getItem('lastSuccessfulDatabasePath') || '';
  
  // Add each database to the list
  databases.forEach(db => {
    const dbItem = document.createElement('div');
    dbItem.className = 'database-item';
    
    // Format size nicely
    const sizeInKB = Math.round(db.size / 1024);
    const formattedSize = sizeInKB > 1024 ? 
      `${(sizeInKB / 1024).toFixed(2)} MB` : 
      `${sizeInKB} KB`;
    
    // Format date nicely
    const date = new Date(db.modified);
    const formattedDate = date.toLocaleDateString();
    
    // Create HTML structure
    dbItem.innerHTML = `
      <div class="db-name">${db.name}</div>
      <div class="db-info">
        <span class="db-size">${formattedSize}</span>
        <span class="db-date">${formattedDate}</span>
      </div>
      <div class="db-actions">
        <button class="switch-button" data-path="${db.path}">Switch</button>
      </div>
    `;
    
    // Check if this is the current database
    if (db.path === currentPath) {
      dbItem.classList.add('current-database');
      const switchButton = dbItem.querySelector('.switch-button');
      if (switchButton) {
        switchButton.classList.add('current-database');
      }
    }
    
    dbList.appendChild(dbItem);
  });
  
  console.log('Created database switch buttons');
}

// Intercept and enhance any database-folder-contents events
if (window.api && window.api.on) {
  const originalHandler = window.api._events['database-folder-contents'];
  
  if (originalHandler) {
    window.api._events['database-folder-contents'] = (databases) => {
      // Call the original handler
      originalHandler(databases);
      
      // Then add our enhanced switch buttons
      createDatabaseSwitchButtons(databases);
    };
  } else {
    window.api.on('database-folder-contents', (databases) => {
      createDatabaseSwitchButtons(databases);
    });
  }
}

// Extra protection: Check frequently for database name consistency
function ensureDatabaseNameConsistency() {
  // Get various stored database names
  const currentName = localStorage.getItem('currentDatabaseName');
  const lastValidName = localStorage.getItem('lastValidDatabaseName');
  const switchingToName = localStorage.getItem('switchingToDatabaseName');
  const hyphenatedName = localStorage.getItem('hyphenatedDatabaseName');
  
  // Special protection for hyphenated names
  if (hyphenatedName && currentName !== hyphenatedName && 
      (currentName === 'Default' || !currentName)) {
    console.log(`Restoring hyphenated database name: ${hyphenatedName}`);
    localStorage.setItem('currentDatabaseName', hyphenatedName);
    
    // Update UI if needed
    const dbNameElement = document.getElementById('currentDatabaseName');
    if (dbNameElement) {
      dbNameElement.textContent = hyphenatedName;
    }
  }
  // If we're in the middle of switching
  else if (switchingToName && currentName !== switchingToName) {
    console.log(`Ensuring switch to: ${switchingToName}`);
    localStorage.setItem('currentDatabaseName', switchingToName);
    
    // Update UI if needed
    const dbNameElement = document.getElementById('currentDatabaseName');
    if (dbNameElement) {
      dbNameElement.textContent = switchingToName;
    }
  }
  // If we have a last valid name that's different
  else if (lastValidName && currentName !== lastValidName) {
    console.log(`Restoring database name to: ${lastValidName}`);
    localStorage.setItem('currentDatabaseName', lastValidName);
    
    // Update UI if needed
    const dbNameElement = document.getElementById('currentDatabaseName');
    if (dbNameElement) {
      dbNameElement.textContent = lastValidName;
    }
  }
}

// Run the consistency check periodically
setInterval(ensureDatabaseNameConsistency, 3000);