// Default Database Name Fix Script
// Prevents databases from being incorrectly renamed to "Default"

(function() {
    console.log('Default database name fix script loaded');
    
    // Track database switching operations
    document.switchOperationInProgress = false;
    
    // When the file changes, wait before running cleanup
    window.api.on('file-opened', (filePath) => {
        console.log('Database file opened:', filePath);
        document.switchOperationInProgress = true;
        
        // Store the file path for reference
        localStorage.setItem('lastOpenedDatabasePath', filePath);
        
        // Extract the filename and store it to protect it
        const filename = filePath.split(/[\/\\]/).pop();
        const databaseName = filename.replace(/\.json$/, '');
        localStorage.setItem('lastValidDatabaseName', databaseName);
        console.log('Protected database name from filename:', databaseName);
        
        // Clear the switch operation flag after a delay
        setTimeout(() => {
            document.switchOperationInProgress = false;
        }, 5000);
    });
    
    // When the database content is received, remember that we're loading a specific database
    window.api.on('database-file-content', (content) => {
        console.log('Database content received, length:', content.length);
        document.switchOperationInProgress = true;
        
        // Parse the content to get the database name
        try {
            const data = JSON.parse(content);
            if (data && data.databaseName) {
                console.log('Database name from content:', data.databaseName);
                localStorage.setItem('loadingSpecificDatabase', 'true');
                localStorage.setItem('loadingDatabaseName', data.databaseName);
                
                // Store this as a valid name that should never be reset
                localStorage.setItem('lastValidDatabaseName', data.databaseName);
            }
        } catch (e) {
            console.error('Error parsing database content:', e);
        }
        
        // Clear the switch operation flag after a delay
        setTimeout(() => {
            document.switchOperationInProgress = false;
            localStorage.removeItem('loadingSpecificDatabase');
        }, 5000);
    });
    
    // Helper function to check if a name is a valid database name (not a path)
    function isValidDatabaseName(name) {
        if (!name) return false;
        
        // Special case: names from our sample databases are always valid
        const sampleDatabaseNames = [
            'Default',
            'hello',
            'historical-supplement',
            'mystery-supplement',
            'sample-fantasy-database',
            'sci-fi-supplement'
        ];
        
        // Check if this is one of our recognized sample databases
        for (const validName of sampleDatabaseNames) {
            if (name === validName || 
                name === validName + '.json' || 
                name.toLowerCase() === validName.toLowerCase()) {
                console.log(`Database name "${name}" matches sample database "${validName}"`);
                return true;
            }
        }
        
        // Custom database names are valid
        if (name.startsWith('Custom Database')) {
            return true;
        }
        
        // Names with just hyphens, underscores and alphanumeric chars are valid
        if (/^[a-zA-Z0-9_\-. ]+$/.test(name)) {
            // But they shouldn't have suspicious path-like sequences
            const pathIndicators = ['\\\\', '\\', '/', ':', '..', '~'];
            const hasPathIndicator = pathIndicators.some(indicator => name.includes(indicator));
            
            if (!hasPathIndicator) {
                return true;
            }
        }
        
        return false;
    }
    
    // Modified function to check and fix the database name
    function fixDatabaseName() {
        // If a switch operation is in progress, don't interfere
        if (document.switchOperationInProgress) {
            console.log('Switch operation in progress, not checking database name');
            return;
        }
        
        // If we're loading a specific database, don't interfere
        if (localStorage.getItem('loadingSpecificDatabase') === 'true') {
            console.log('Loading specific database, not checking database name');
            return;
        }
        
        // Get current database name from localStorage
        const currentName = localStorage.getItem('currentDatabaseName');
        
        // Check against our last known valid database name
        const lastValidName = localStorage.getItem('lastValidDatabaseName');
        if (lastValidName && currentName !== lastValidName) {
            console.log(`Restoring to last valid database name: "${lastValidName}"`);
            localStorage.setItem('currentDatabaseName', lastValidName);
            
            // Show toast explaining what happened
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Restored database name to "${lastValidName}" (previous name "${currentName}" was invalid)`, 'info');
            }
            
            // Update UI if needed
            setTimeout(() => {
                const dbNameElement = document.getElementById('currentDatabaseName');
                if (dbNameElement) {
                    dbNameElement.textContent = lastValidName;
                }
            }, 100);
            return;
        }
        
        // IMPORTANT: Never reset "Custom Database" names
        if (currentName && currentName.startsWith('Custom Database')) {
            console.log(`Preserving Custom Database name: "${currentName}"`);
            return;
        }
        
        // Check if it's a valid database name
        if (currentName && isValidDatabaseName(currentName)) {
            console.log(`Database name check - current name is valid: "${currentName}"`);
            return;
        }
        
        // If we get here, the name is invalid and should be reset
        console.log(`Database name "${currentName}" appears invalid, resetting to "Default"`);
        
        // Store the invalid name for the error message
        const invalidName = currentName || "unknown";
        
        // Reset to Default
        localStorage.setItem('currentDatabaseName', 'Default');
        
        // Show toast explaining what happened
        if (window.Core && window.Core.showToast) {
            let reason = "invalid format";
            
            // Determine more specific reason if possible
            if (!currentName) {
                reason = "empty or missing";
            } else if (currentName.includes('/') || currentName.includes('\\')) {
                reason = "contained path separators";
            } else if (currentName.includes(':')) {
                reason = "contained invalid characters";
            }
            
            // Show detailed message
            window.Core.showToast(`Database reset to Default (previous name "${invalidName}" had ${reason})`, 'warning', 5000);
        }
        
        // Also update the UI if possible
        setTimeout(() => {
            const dbNameElement = document.getElementById('currentDatabaseName');
            if (dbNameElement) {
                dbNameElement.textContent = 'Default';
            }
        }, 100);
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(fixDatabaseName, 2000);
        });
    } else {
        setTimeout(fixDatabaseName, 2000);
    }
})();
