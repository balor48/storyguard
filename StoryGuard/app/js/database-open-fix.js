// Database open fix script
// Fixes issues with "Open Database" menu item operation

(function() {
    console.log('Database open fix script loaded');
    
    // Clean up any "Imported DB" references in localStorage on startup
    function cleanupImportedDbReferences() {
        // Check the current database name
        const currentName = localStorage.getItem('currentDatabaseName');
        if (currentName && currentName.includes('Imported DB')) {
            const newName = currentName.replace('Imported DB', 'Custom Database');
            console.log(`Cleaning up database name from "${currentName}" to "${newName}"`);
            localStorage.setItem('currentDatabaseName', newName);
            
            // Update protected storage if it exists
            if (localStorage.getItem('__PROTECTED_DB_NAME__')) {
                localStorage.setItem('__PROTECTED_DB_NAME__', newName);
            }
            
            // Update UI
            setTimeout(() => {
                const displayedNameElement = document.getElementById('currentDatabaseName');
                if (displayedNameElement) {
                    displayedNameElement.textContent = newName;
                }
                
                // Update via UI function if available
                if (window.UI && window.UI.updateDatabaseIndicator) {
                    window.UI.updateDatabaseIndicator(newName);
                }
            }, 100);
        }
    }
    
    // Run cleanup on startup
    cleanupImportedDbReferences();
    // Also run cleanup periodically
    setInterval(cleanupImportedDbReferences, 5000);
    
    // Listen for file content from main process
    if (window.api && window.api.on) {
        window.api.on('database-file-content', function(content) {
            console.log('Received database file content');
            console.log('Content length:', content.length);
            
            try {
                // Parse the JSON data
                const data = JSON.parse(content);
                
                // Extract database name from the data or filename
                let databaseName;
                
                // CRITICAL FIX: First check if this is coming from the switch button
                // If we already have a stored name from file-opened event, use that with highest priority
                if (document.lastOpenedFilePath && document.switchButtonDatabaseName) {
                    databaseName = document.switchButtonDatabaseName;
                    console.log('Using switchButtonDatabaseName with highest priority:', databaseName);
                }
                // First try to get from file path if available and no switch name
                else if (document.lastOpenedFilePath) {
                    const pathParts = document.lastOpenedFilePath.split(/[\/\\]/);
                    const fileWithExt = pathParts[pathParts.length - 1];
                    const fileNameOnly = fileWithExt.replace(/\.json$/, '');
                    if (fileNameOnly && fileNameOnly !== 'default' && fileNameOnly !== 'Default') {
                        databaseName = fileNameOnly;
                        console.log('Using filename for database name:', databaseName);
                    }
                }
                
                // If we couldn't get from path, try from data
                if (!databaseName && data.metadata && data.metadata.databaseName) {
                    databaseName = data.metadata.databaseName;
                    console.log('Using metadata.databaseName for database name:', databaseName);
                } else if (!databaseName && data.databaseName) {
                    databaseName = data.databaseName;
                    console.log('Using databaseName property for database name:', databaseName);
                }
                
                // Fallback to filename if nothing else worked - NEVER use "Imported Database"
                if (!databaseName || databaseName === 'default' || databaseName === 'Default' || databaseName.includes('Imported DB')) {
                    if (document.lastOpenedFilePath) {
                        const pathParts = document.lastOpenedFilePath.split(/[\/\\]/);
                        const fileWithExt = pathParts[pathParts.length - 1];
                        const fileNameOnly = fileWithExt.replace(/\.json$/, '');
                        if (fileNameOnly && fileNameOnly !== 'default' && fileNameOnly !== 'Default') {
                            databaseName = fileNameOnly;
                            console.log('Using filename as fallback:', databaseName);
                        } else {
                            // Last resort - use a generic name but NOT "Imported Database"
                            databaseName = 'Custom Database';
                            console.log('Using "Custom Database" as final fallback');
                        }
                    } else {
                        // Last resort - use a generic name but NOT "Imported Database"
                        databaseName = 'Custom Database';
                        console.log('Using "Custom Database" as final fallback');
                    }
                }
                
                console.log('Final database name:', databaseName);
                
                // Set the database name in localStorage FIRST (very important)
                localStorage.setItem('currentDatabaseName', databaseName);
                console.log('Stored database name in localStorage:', databaseName);
                
                // Also store it on document to prevent overwrites
                document.importedDatabaseName = databaseName;
                
                // Update UI immediately to show the correct database name
                if (window.UI && window.UI.updateDatabaseIndicator) {
                    window.UI.updateDatabaseIndicator(databaseName);
                    console.log('Updated database indicator with:', databaseName);
                } else if (document.getElementById('currentDatabaseName')) {
                    document.getElementById('currentDatabaseName').textContent = databaseName;
                    console.log('Updated database name element directly with:', databaseName);
                }
                
                // Clear all existing data arrays first (critical!)
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
                
                console.log('Cleared all existing data arrays');
                
                // Now load the data from the imported file
                if (Array.isArray(data.characters)) window.characters = data.characters;
                if (Array.isArray(data.titles)) window.titles = data.titles;
                if (Array.isArray(data.seriesList)) window.seriesList = data.seriesList;
                if (Array.isArray(data.books)) window.books = data.books;
                if (Array.isArray(data.roles)) window.roles = data.roles;
                if (Array.isArray(data.customFieldTypes)) window.customFieldTypes = data.customFieldTypes;
                if (Array.isArray(data.relationships)) window.relationships = data.relationships;
                if (Array.isArray(data.tags)) window.tags = data.tags;
                if (Array.isArray(data.plots)) window.plots = data.plots;
                if (Array.isArray(data.worldElements)) window.worldElements = data.worldElements;
                
                console.log('Loaded data from file');
                
                // Save to localStorage for persistence
                localStorage.setItem('characters', JSON.stringify(window.characters || []));
                localStorage.setItem('titles', JSON.stringify(window.titles || []));
                localStorage.setItem('seriesList', JSON.stringify(window.seriesList || []));
                localStorage.setItem('books', JSON.stringify(window.books || []));
                localStorage.setItem('roles', JSON.stringify(window.roles || []));
                localStorage.setItem('customFieldTypes', JSON.stringify(window.customFieldTypes || []));
                localStorage.setItem('relationships', JSON.stringify(window.relationships || []));
                localStorage.setItem('tags', JSON.stringify(window.tags || []));
                localStorage.setItem('plots', JSON.stringify(window.plots || []));
                localStorage.setItem('worldElements', JSON.stringify(window.worldElements || []));
                
                console.log('Saved data to localStorage');
                
                // Switch to dashboard tab
                try {
                    const dashboardTab = document.querySelector('#dashboard-tab-button');
                    if (dashboardTab) {
                        dashboardTab.click();
                        console.log('Switched to dashboard tab');
                    } else if (window.UI && window.UI.switchTab) {
                        window.UI.switchTab('dashboard');
                        console.log('Switched to dashboard tab using UI.switchTab');
                    }
                } catch (navError) {
                    console.error('Error switching to dashboard tab:', navError);
                }
                
                // Force UI refresh
                if (window.UI && window.UI.refreshUI) {
                    window.UI.refreshUI();
                    console.log('Refreshed UI');
                }
                
                // Show success toast - use "Switched to database" when coming from Switch button
                if (window.Core && window.Core.showToast) {
                    if (document.switchButtonClicked) {
                        window.Core.showToast(`Switched to database "${databaseName}"`, 'success');
                        // Reset the flag
                        document.switchButtonClicked = false;
                    } else {
                        window.Core.showToast(`Database "${databaseName}" loaded successfully!`, 'success');
                    }
                    console.log('Displayed success toast');
                } else {
                    console.log('Database loaded successfully!');
                }
                
                // Double-check database name setting in localStorage
                const storedName = localStorage.getItem('currentDatabaseName');
                console.log('Final check - stored database name:', storedName);
                if (storedName !== databaseName) {
                    console.warn('Database name mismatch! Re-setting...');
                    localStorage.setItem('currentDatabaseName', databaseName);
                    // Update UI again
                    if (window.UI && window.UI.updateDatabaseIndicator) {
                        window.UI.updateDatabaseIndicator(databaseName);
                    }
                }
                
            } catch (error) {
                console.error('Error processing database content:', error);
                
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Error loading database: ' + error.message, 'error');
                } else {
                    alert('Error loading database: ' + error.message);
                }
            }
        });
        
        console.log('Registered database-file-content handler');
    } else {
        console.error('API not available for database open fix');
    }
    
    // Listen for file-opened events to capture the file path
    if (window.api && window.api.on) {
        window.api.on('file-opened', function(filePath) {
            console.log('File opened event received, path:', filePath);
            
            // Store the file path on document object for later use
            document.lastOpenedFilePath = filePath;
            
            try {
                // Extract filename without extension
                const pathParts = filePath.split(/[\/\\]/);
                const fileWithExt = pathParts[pathParts.length - 1];
                const fileName = fileWithExt.replace(/\.json$/, '');
                
                console.log('Extracted filename:', fileName);
                
                // IMPORTANT: Check if this is from a Switch button click
                if (document.switchButtonClicked) {
                    console.log('This is from a Switch button click, storing special name:', fileName);
                    document.switchButtonDatabaseName = fileName;
                }
                
                // IMPORTANT: We'll ONLY set the database name here if it's not coming from database-file-content
                // This prevents race conditions where one sets it and then the other overrides
                if (!document.receivingDatabaseContent) {
                    // Never set to "Default" - use the actual filename
                    if (fileName && fileName !== 'default' && fileName !== 'Default') {
                        console.log(`Setting database name from filename: "${fileName}"`);
                        localStorage.setItem('currentDatabaseName', fileName);
                        document.importedDatabaseName = fileName;
                        
                        // Update UI
                        if (window.UI && window.UI.updateDatabaseIndicator) {
                            window.UI.updateDatabaseIndicator(fileName);
                            console.log('Updated database indicator with filename:', fileName);
                        } else if (document.getElementById('currentDatabaseName')) {
                            document.getElementById('currentDatabaseName').textContent = fileName;
                            console.log('Updated database name element directly with filename:', fileName);
                        }
                    }
                } else {
                    console.log('Not setting database name from filename because database content is being processed');
                }
            } catch (error) {
                console.error('Error processing file path:', error);
            }
        });
        
        console.log('Registered file-opened handler');
    }
    
    // Detect and handle the Switch button clicks
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Setting up Switch button detection');
        
        // Function to look for and set up Switch buttons
        function setupSwitchButtons() {
            // Find all buttons with text "Switch"
            const switchButtons = Array.from(document.querySelectorAll('button')).filter(
                button => button.textContent.trim() === 'Switch'
            );
            
            if (switchButtons.length > 0) {
                console.log(`Found ${switchButtons.length} Switch buttons`);
                
                switchButtons.forEach((button, index) => {
                    // Check if we've already set up this button
                    if (!button.dataset.switchHandlerAdded) {
                        console.log(`Setting up Switch button ${index + 1}`);
                        
                        // Add our click handler before the original
                        const originalClick = button.onclick;
                        button.onclick = function(event) {
                            console.log('Switch button clicked!');
                            document.switchButtonClicked = true;
                            
                            // Find the database name from the row
                            try {
                                const row = button.closest('tr');
                                if (row) {
                                    const nameCell = row.querySelector('td:first-child');
                                    if (nameCell) {
                                        const dbName = nameCell.textContent.trim();
                                        console.log(`Switch button for database: ${dbName}`);
                                        document.switchButtonDatabaseName = dbName;
                                    }
                                }
                            } catch (error) {
                                console.error('Error finding database name from Switch button:', error);
                            }
                            
                            // Call the original handler
                            if (originalClick) {
                                return originalClick.call(this, event);
                            }
                        };
                        
                        // Mark that we've set up this button
                        button.dataset.switchHandlerAdded = 'true';
                    }
                });
            } else {
                console.log('No Switch buttons found yet, will try again later');
            }
        }
        
        // Try immediately
        setupSwitchButtons();
        
        // And also try after a delay in case they're added dynamically
        setTimeout(setupSwitchButtons, 1000);
        setTimeout(setupSwitchButtons, 2000);
        
        // Also set up a MutationObserver to catch dynamically added buttons
        const observer = new MutationObserver(function(mutations) {
            setupSwitchButtons();
        });
        
        // Start observing the document with the configured parameters
        observer.observe(document.body, { childList: true, subtree: true });
    });
    
    // Add a listener for the database-file-content event that runs BEFORE the main handler
    if (window.api && window.api.on) {
        const originalOnHandler = window.api.on;
        window.api.on = function(event, handler) {
            if (event === 'database-file-content') {
                // Create a wrapper that sets a flag before calling the handler
                const wrappedHandler = function(content) {
                    console.log('Setting receivingDatabaseContent flag to true');
                    document.receivingDatabaseContent = true;
                    
                    // Call the original handler
                    handler(content);
                    
                    // Reset the flag after a delay
                    setTimeout(() => {
                        console.log('Resetting receivingDatabaseContent flag to false');
                        document.receivingDatabaseContent = false;
                    }, 1000);
                };
                
                // Call the original with our wrapped handler
                return originalOnHandler.call(this, event, wrappedHandler);
            }
            
            // For all other events, just pass through
            return originalOnHandler.apply(this, arguments);
        };
    }

    // Find the Switch button click handler and modify it
    document.addEventListener('click', function(event) {
        // Find the Switch button or its parent
        const switchButton = event.target.closest('.switch-button') || 
                            (event.target.textContent === 'Switch' ? event.target : null);
        
        if (switchButton) {
            console.log('SWITCH BUTTON CLICKED - starting enhanced path handling');
            
            // Set a flag to track that the switch button was clicked
            document.switchButtonClicked = true;
            setTimeout(() => { document.switchButtonClicked = false; }, 5000); // Clear after 5 seconds
            
            // Get the database file path from the button data
            const dbPath = switchButton.getAttribute('data-path');
            console.log('Switch Button Path (raw):', dbPath);
            
            if (dbPath) {
                // Prevent default if it's a link
                event.preventDefault();
                
                // Extra protection for database names with hyphens
                // Extract the filename and store it for protection
                const filename = dbPath.split(/[\/\\]/).pop();
                const databaseName = filename.replace(/\.json$/, '');
                localStorage.setItem('switchingToDatabaseName', databaseName);
                console.log('Protected switch database name:', databaseName);
                
                // Enhanced path handling
                console.log('SWITCH: Sending exact path to main process:', dbPath);
                
                // Send to main process for reading
                if (window.api && window.api.send) {
                    window.api.send('read-database-file', dbPath);
                    
                    // Also update the UI if possible
                    const dbNameElement = document.getElementById('currentDatabaseName');
                    if (dbNameElement) {
                        dbNameElement.textContent = databaseName;
                    }
                }
            }
        }
    }, true);

    // Also listen for database-switched events from main
    if (window.api && window.api.on) {
        window.api.on('database-switched', (data) => {
            console.log('Database switched event:', data);
            
            // Immediately update localStorage with the correct name
            if (data && data.name) {
                localStorage.setItem('currentDatabaseName', data.name);
                localStorage.setItem('lastValidDatabaseName', data.name);
                
                // Update UI
                const dbNameElement = document.getElementById('currentDatabaseName');
                if (dbNameElement) {
                    dbNameElement.textContent = data.name;
                }
                
                // Show success toast
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Switched to database ${data.name}`, 'success');
                }
            }
        });
    }
})();
