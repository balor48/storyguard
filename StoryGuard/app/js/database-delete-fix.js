// Database deletion fix script
// This script ensures that when databases are deleted from the UI, they are also physically deleted from disk

console.log('Database deletion fix script loaded');

(function() {
    // Keep track of buttons we've already processed
    const processedButtons = new WeakSet();
    
    // Debounce helper to prevent rapid-fire execution
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Function to physically delete a database file from disk
    async function physicallyDeleteDatabase(dbName) {
        try {
            if (!dbName) {
                console.error('Cannot delete database: No database name provided');
                return false;
            }
            
            console.log(`Attempting to physically delete database file for: ${dbName}`);
            
            // Get the database directory using getPaths directly if available
            let directory = '';
            
            // IMPORTANT: Use getPaths() first for most reliable path
            if (window.api && window.api.getPaths) {
                try {
                    const paths = await window.api.getPaths();
                    directory = paths.database;
                    console.log('Got database directory from getPaths():', directory);
                } catch (pathError) {
                    console.error('Error getting paths from API:', pathError);
                }
            }
            
            // If getPaths failed, fall back to settings
            if (!directory) {
                const settings = localStorage.getItem('settings') ?
                    JSON.parse(localStorage.getItem('settings')) :
                    { databaseDirectory: localStorage.getItem('databaseDirectory') || '' };
                
                directory = settings.databaseDirectory || '';
                console.log('Using directory from settings:', directory);
            }
            
            if (!directory) {
                console.error('Cannot delete database: No database directory configured');
                return false;
            }
            
            console.log('Final database directory determined as:', directory);
            
            // Build the full path to the database file
            // Normalize the directory path first
            const normalizedDir = directory.replace(/\//g, '\\').replace(/\\\\/g, '\\');
            console.log(`Normalized directory: ${normalizedDir}`);
            
            // Ensure consistent path separators and prevent double separators
            let dbPath;
            if (normalizedDir.endsWith('\\') || normalizedDir.endsWith('/')) {
                dbPath = `${normalizedDir}${dbName}.json`;
            } else {
                dbPath = `${normalizedDir}\\${dbName}.json`;
            }
            console.log(`Full database file path: ${dbPath}`);
            
            // For debugging: Log the exact path components
            console.log('Path components:', {
                directory: directory,
                normalizedDir: normalizedDir,
                dbName: dbName,
                finalPath: dbPath
            });
            
            // EXTRA DEBUG: Check if the file actually exists by listing directory contents
            if (window.api && window.api.send) {
                try {
                    window.api.send('read-database-folder', normalizedDir);
                    console.log('Requested directory listing to verify file existence');
                } catch (listError) {
                    console.error('Error requesting directory listing:', listError);
                }
            }
            
            // Check if we have API access to delete files
            if (window.api && window.api.deleteDatabaseFile) {
                try {
                    console.log('Calling deleteDatabaseFile with path:', dbPath);
                    // Physically delete the file
                    const result = await window.api.deleteDatabaseFile(dbPath);
                    
                    console.log('Delete result:', result);
                    
                    if (result.success) {
                        console.log(`Database file successfully deleted from disk: ${dbPath}`);
                        
                        // Show success notification
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Database "${dbName}" deleted successfully`, 'success');
                        }
                        return true;
                    } else {
                        console.error(`Failed to delete database file: ${result.error}`);
                        
                        // Show error notification
                        if (window.Core && window.Core.showToast) {
                            window.Core.showToast(`Error deleting database file: ${result.error}`, 'error');
                        }
                        return false;
                    }
                } catch (error) {
                    console.error(`Exception deleting database file:`, error);
                    
                    // Show error notification
                    if (window.Core && window.Core.showToast) {
                        window.Core.showToast(`Exception deleting database file: ${error.message}`, 'error');
                    }
                    return false;
                }
            } else {
                console.error('Cannot delete database: API.deleteDatabaseFile function not available');
                return false;
            }
        } catch (error) {
            console.error('Error trying to delete database file:', error);
            return false;
        }
    }
    
    // Function to handle the actual delete operation
    async function handleDatabaseDelete(dbName) {
        if (!dbName) {
            console.error('Could not determine database name for deletion');
            return;
        }
        
        console.log(`Delete button clicked for database: ${dbName}`);
        
        // Use native confirm dialog instead of Core.showConfirmationDialog
        if (confirm(`Are you sure you want to delete the database "${dbName}"? This action cannot be undone.`)) {
            console.log(`Deletion confirmed for database: ${dbName}`);
            
            // IMPORTANT: First update in-memory database references
            console.log('Updating in-memory database references FIRST');
            
            // Force success response to the UI regardless of physical deletion
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Database "${dbName}" deleted`, 'success');
            }
            
            // Update all relevant localStorage entries
            try {
                // Check what databases are in memory before deletion
                let databasesBefore = [];
                try {
                    databasesBefore = JSON.parse(localStorage.getItem('databases') || '[]');
                    console.log('Current databases in memory before deletion:', databasesBefore);
                } catch (err) {
                    console.error('Error reading current databases from localStorage:', err);
                }
                
                // Remove the deleted database from the array
                const filteredDatabases = databasesBefore.filter(db =>
                    db.name !== dbName &&
                    db.path !== `${dbName}.json` &&
                    db.path !== dbName
                );
                console.log('Filtered databases:', filteredDatabases);
                
                // Save the updated list
                localStorage.setItem('databases', JSON.stringify(filteredDatabases));
                
                // Check if this was the current database
                const currentDb = localStorage.getItem('currentDatabaseName') || '';
                if (currentDb === dbName) {
                    console.log(`Switching current database from "${dbName}" to "Default"`);
                    localStorage.setItem('currentDatabaseName', 'Default');
                }
                
                // Also check for any other references to this database in localStorage
                Object.keys(localStorage).forEach(key => {
                    if (key.includes(dbName)) {
                        console.log(`Removing related localStorage key: ${key}`);
                        localStorage.removeItem(key);
                    }
                });
                
                console.log('In-memory database references updated successfully');
            } catch (memoryErr) {
                console.error('Error updating in-memory database references:', memoryErr);
            }
            
            // Now attempt physical deletion, but don't let it affect the UI response
            try {
                console.log('Now attempting physical file deletion');
                const deleteResult = await physicallyDeleteDatabase(dbName);
                console.log('Physical deletion result:', deleteResult);
            } catch (err) {
                // Just log any errors, don't affect the UI
                console.error('Error in physical deletion (non-critical):', err);
            }
            
            // Regardless of physical deletion outcome, reload the page to reflect the in-memory changes
            console.log('Reloading page to reflect in-memory changes');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
    
    // Function to fix the delete database button behavior - debounced to prevent rapid execution
    const fixDeleteDatabaseButtons = debounce(function() {
        // Find only database delete buttons using more specific selectors
        const deleteButtons = document.querySelectorAll('.database-list .delete-database-btn, .database-list button.delete-btn, .database-list [data-action="delete"], #databaseList .delete-btn, .database-manager .delete-btn');
        
        if (deleteButtons.length === 0) {
            // If we didn't find any buttons yet, try again once more later
            setTimeout(fixDeleteDatabaseButtons, 500);
            return;
        }
        
        console.log(`Found ${deleteButtons.length} database delete buttons to process`);
        
        // Add our event listener to each delete button, but only if we haven't processed it already
        deleteButtons.forEach(button => {
            if (processedButtons.has(button)) {
                return; // Skip if already processed
            }
            
            // Mark this button as processed to avoid duplicate handlers
            processedButtons.add(button);
            
            // Add a proper click handler instead of replacing the button
            button.addEventListener('click', function(e) {
                // Prevent default action
                e.preventDefault();
                e.stopPropagation();
                
                // Check if this is actually a database delete button
                const isInDatabaseContext = 
                    this.closest('.database-list') || 
                    this.closest('#databaseList') || 
                    this.closest('.database-manager');
                
                if (!isInDatabaseContext) {
                    console.log('Not a database delete button, ignoring');
                    return;
                }
                
                // Try to find the database name from data attributes first
                let dbName = this.getAttribute('data-db-name') || '';
                let dbPath = this.getAttribute('data-db-path') || '';
                
                // If not found in data attributes, try to find from the row
                if (!dbName) {
                    const row = this.closest('tr');
                    if (row) {
                        // Try to get database name from first cell
                        const nameCell = row.querySelector('td:first-child');
                        if (nameCell) {
                            dbName = nameCell.textContent.trim();
                        }
                    }
                }
                
                console.log(`Database delete button clicked for database: ${dbName}, path: ${dbPath}`);
                
                if (dbName) {
                    handleDatabaseDelete(dbName);
                } else {
                    console.error('Could not determine database name for deletion');
                }
            });
            
            console.log(`Added click handler to database delete button`);
        });
    }, 100); // 100ms debounce
    
    // Add a deleteDatabase method to the Storage object if it doesn't exist
    if (window.Storage && !window.Storage.deleteDatabase) {
        window.Storage.deleteDatabase = function(dbName) {
            // First perform the physical deletion
            physicallyDeleteDatabase(dbName);
            
            // Then remove from memory
            console.log(`Removing database "${dbName}" from memory`);
            
            // Get the list of databases from localStorage
            let databases = [];
            try {
                databases = JSON.parse(localStorage.getItem('databases') || '[]');
            } catch (err) {
                console.error('Error parsing databases from localStorage:', err);
                databases = [];
            }
            
            // Filter out the deleted database
            databases = databases.filter(db => db.name !== dbName);
            
            // Save the updated list
            localStorage.setItem('databases', JSON.stringify(databases));
            
            // If this was the current database, switch to Default
            if (localStorage.getItem('currentDatabaseName') === dbName) {
                localStorage.setItem('currentDatabaseName', 'Default');
            }
            
            // Provide feedback
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Database "${dbName}" removed from memory`, 'success');
            }
            
            // Reload the page to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 500);
            
            return true;
        };
        
        console.log('Added deleteDatabase method to Storage object');
    }
    
    // Variables to control the mutation observer
    let observerActive = true;
    
    // Function to pause the observer during updates
    function pauseObserver() {
        observerActive = false;
        setTimeout(() => { observerActive = true; }, 500);
    }
    
    // Wait for DOM to be ready then fix the delete buttons
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixDeleteDatabaseButtons);
    } else {
        // DOM already loaded, fix buttons now
        fixDeleteDatabaseButtons();
    }
    
    // Also try again when window is fully loaded, but only once
    window.addEventListener('load', fixDeleteDatabaseButtons, { once: true });
    
    // Add a mutation observer to handle dynamically added buttons, with extra checks to prevent loops
    const observer = new MutationObserver(function(mutations) {
        // Skip if observer is paused
        if (!observerActive) return;
        
        let shouldFixButtons = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any delete buttons were added
                const hasDeleteButtons = Array.from(mutation.addedNodes).some(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        return node.classList && (
                            node.classList.contains('delete-database-btn') || 
                            node.classList.contains('delete-btn') ||
                            node.getAttribute('data-action') === 'delete' ||
                            node.querySelector('.delete-database-btn, button.delete-btn, [data-action="delete"]')
                        );
                    }
                    return false;
                });
                
                if (hasDeleteButtons) {
                    shouldFixButtons = true;
                    break;
                }
            }
        }
        
        if (shouldFixButtons) {
            pauseObserver(); // Pause the observer to prevent loops
            fixDeleteDatabaseButtons();
        }
    });
    
    // Start observing the document for changes, but with a more limited scope
    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: false, // Don't watch attributes
        characterData: false // Don't watch text content
    });
    
    console.log('Database deletion fix script fully initialized');
})();
