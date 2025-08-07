/**
 * Database Loader for Story Database
 * Handles loading database files from the Open Database menu action
 */

// Function to clean up database name
function cleanupDatabaseName(name) {
    // Extract filename from path if it's a path
    if (name.includes('\\') || name.includes('/')) {
        name = name.split(/[\\\/]/).pop();
    }
    
    // Remove file extension
    name = name.replace(/\.json$/, '');
    
    // Remove timestamp pattern from backup files (very strict pattern matching)
    name = name.replace(/-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/, '');
    
    // Remove common prefixes/suffixes but preserve mystery prefix
    name = name.replace(/^backup-/, '')
             // .replace(/^mystery-/, '') // Commented out to preserve mystery- prefix
             .replace(/-backup$/, '');
    
    // Convert dashes and underscores to spaces
    name = name.replace(/[-_]/g, ' ');
    
    // Capitalize words
    name = name.split(' ')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
    
    return name.trim() || 'Default';
}

// Function to load database content
function loadDatabaseContent(content) {
    console.log('Loading database content from database-loader.js');
    
    try {
        // Parse the database content
        const data = JSON.parse(content);
        console.log('Successfully parsed database content');
        
        // Extract the database name from the file or generate one
        let dbName = 'Default';
        if (data.databaseName) {
            dbName = cleanupDatabaseName(data.databaseName);
            console.log('Cleaned up database name:', dbName);
        } else {
            // If no database name was found, generate one based on the current date
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
            
            // Save to generic keys (for backward compatibility)
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
            
            // Also save to database-specific keys
            window.Core.safelyStoreItem(`${dbName}_characters`, JSON.stringify(window.characters));
            window.Core.safelyStoreItem(`${dbName}_titles`, JSON.stringify(window.titles));
            window.Core.safelyStoreItem(`${dbName}_seriesList`, JSON.stringify(window.seriesList));
            window.Core.safelyStoreItem(`${dbName}_books`, JSON.stringify(window.books));
            window.Core.safelyStoreItem(`${dbName}_roles`, JSON.stringify(window.roles));
            window.Core.safelyStoreItem(`${dbName}_customFieldTypes`, JSON.stringify(window.customFieldTypes));
            window.Core.safelyStoreItem(`${dbName}_relationships`, JSON.stringify(window.relationships));
            window.Core.safelyStoreItem(`${dbName}_tags`, JSON.stringify(window.tags));
            window.Core.safelyStoreItem(`${dbName}_plots`, JSON.stringify(window.plots));
            window.Core.safelyStoreItem(`${dbName}_worldElements`, JSON.stringify(window.worldElements));
            
            console.log(`Saved data to both generic and database-specific keys for database: ${dbName}`);
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
            
            // Show success message
            if (window.Core && window.Core.showToast) {
                window.Core.showToast(`Database "${dbName}" loaded successfully`, 'success');
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
    } catch (error) {
        console.error('Error loading database content:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Error loading database: ' + error.message, 'error');
        }
        return false;
    }
}

// Set up event listener for database content
if (window.api && window.api.onDatabaseFileContent) {
    console.log('Setting up database file content listener in database-loader.js');
    window.api.onDatabaseFileContent(loadDatabaseContent);
}

// Export the function for use in other modules
window.DatabaseLoader = {
    loadDatabaseContent
};