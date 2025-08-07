// Import-related functions

// Define the current app version for version compatibility checks
const APP_VERSION = '2.0.0'; // Update this to match your application's version

// Function to check if import file version is compatible with current app version
function isVersionCompatible(importVersion) {
    // Simple version check - can be made more sophisticated if needed
    try {
        if (!importVersion) return false;
        
        const importParts = importVersion.split('.');
        const appParts = APP_VERSION.split('.');
        
        // Major version check - only compatible if major versions match
        if (parseInt(importParts[0]) !== parseInt(appParts[0])) {
            return false;
        }
        
        // If we got here, the version is compatible
        return true;
    } catch (error) {
        console.error('Error checking version compatibility:', error);
        return false;
    }
}

function validateImportFile(data) {
    // Check if the data is valid JSON
    if (!data) {
        return { valid: false, message: 'No data found in the import file.' };
    }
    
    // Check if the data has the required properties
    const requiredProperties = ['characters', 'titles', 'version'];
    for (const prop of requiredProperties) {
        if (!data.hasOwnProperty(prop)) {
            return { valid: false, message: `Missing required property: ${prop}` };
        }
    }
    
    // Check if the version is compatible
    if (data.version && !isVersionCompatible(data.version)) {
        return { 
            valid: false, 
            message: `The database was created with version ${data.version}, which may not be compatible with the current version ${APP_VERSION}.` 
        };
    }
    
    return { valid: true };
}

function showImportError(title, message) {
    console.error(`${title}: ${message}`);
    
    // Use toast notification if available
    if (window.Core && typeof window.Core.showNotification === 'function') {
        window.Core.showNotification(`${title}: ${message}`, 'error');
    }
}

function isUsingNonDefaultDatabase() {
    const currentDbName = localStorage.getItem('currentDatabaseName');
    return currentDbName && currentDbName !== 'Default';
}

function importFromLocalFile(forceExistingDb = false) {
    try {
        // Show file selection dialog
        if (window.api && window.api.showOpenDialog) {
            window.api.showOpenDialog((filePath) => {
                if (filePath) {
                    console.log('Selected file:', filePath);
                    openFileWithDefaultPath(filePath, forceExistingDb);
                } else {
                    console.log('Import canceled by user');
                }
            });
        } else {
            // Fallback for web version or when API is not available
            openFileWithStandardInput(forceExistingDb);
        }
    } catch (error) {
        console.error('Error importing from local file:', error);
        // Use Core.showNotification if available, otherwise use alert
        if (window.Core && typeof window.Core.showNotification === 'function') {
            window.Core.showNotification('Failed to import database: ' + error.message, 'error');
        } else if (window.Core && typeof window.Core.showToast === 'function') {
            window.Core.showToast('Failed to import database: ' + error.message, 'error');
        } else {
            console.error('Failed to import database:', error.message);
        }
    }
}

function processImportContent(content, forceExistingDb) {
    try {
        // Parse the JSON content
        const data = JSON.parse(content);
        
        // Log the imported data structure
        console.log('Imported data structure:', Object.keys(data));
        console.log('Data content preview:', {
            characters: data.characters ? `${data.characters.length} items` : 'none',
            seriesList: data.seriesList ? `${data.seriesList.length} items` : 'none',
            plots: data.plots ? `${data.plots.length} items` : 'none',
            worldElements: data.worldElements ? `${data.worldElements.length} items` : 'none'
        });
        
        // Validate the import file
        const validation = validateImportFile(data);
        if (!validation.valid) {
            showImportError('Import Error', validation.message);
            return;
        }
        
        // Get the import preferences from global variables set by importDatabase
        const createNew = window.tempCreateNewDatabase === true;
        const updateExisting = window.tempUpdateExistingDatabase === true;
        
        console.log('Import options selected:', {createNewDatabase: createNew, updateExistingDatabase: updateExisting});
        
        // Set a timestamp for this import operation
        localStorage.setItem('lastImportTimestamp', Date.now().toString());
        
        // Process based on the selected option
        if (createNew) {
            // Create new database was selected
            loadAsNewDatabase(data);
        } else if (updateExisting) {
            // Update existing database was selected
            updateCurrentDatabase(data);
        } else {
            // Default to update if neither is explicitly set
            updateCurrentDatabase(data);
        }
        
        // Force a complete reload of the page after a delay
        setTimeout(() => {
            console.log('Forcing complete page reload after import');
            window.location.reload(true); // true forces reload from server, not cache
        }, 2000); // Allow time for user to see success message
        
    } catch (error) {
        console.error('Error processing import content:', error);
        if (window.Core && typeof window.Core.showToast === 'function') {
            window.Core.showToast('Failed to import database: ' + error.message, 'error');
        } else if (window.Core && typeof window.Core.showNotification === 'function') {
            window.Core.showNotification('Failed to import database: ' + error.message, 'error');
        } else {
            console.error('Failed to import database:', error.message);
        }
    }
}

function loadAsNewDatabase(data) {
    // Implementation for creating a new database from the imported data
    console.log('Loading as new database:', data);
    
    // Set database name
    const dbName = data.databaseName || `Custom Database ${new Date().toLocaleDateString()}`;
    localStorage.setItem('currentDatabaseName', dbName);
    
    // Clear existing data
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
    
    // Load the imported data
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
    
    // Save the data to ensure it persists
    try {
        // Get the current database name
        const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
        console.log('Current database name for saving imported data:', currentDbName);
        
        // Save to both generic keys and database-specific keys
        // Generic keys (for backward compatibility)
        localStorage.setItem('characters', JSON.stringify(window.characters));
        localStorage.setItem('seriesList', JSON.stringify(window.seriesList));
        localStorage.setItem('titles', JSON.stringify(window.titles));
        localStorage.setItem('books', JSON.stringify(window.books));
        localStorage.setItem('roles', JSON.stringify(window.roles));
        localStorage.setItem('customFieldTypes', JSON.stringify(window.customFieldTypes));
        localStorage.setItem('relationships', JSON.stringify(window.relationships));
        localStorage.setItem('tags', JSON.stringify(window.tags));
        localStorage.setItem('plots', JSON.stringify(window.plots));
        localStorage.setItem('worldElements', JSON.stringify(window.worldElements));
        
        // Database-specific keys (to ensure data is properly associated with the current database)
        localStorage.setItem(`${currentDbName}_characters`, JSON.stringify(window.characters));
        localStorage.setItem(`${currentDbName}_seriesList`, JSON.stringify(window.seriesList));
        localStorage.setItem(`${currentDbName}_titles`, JSON.stringify(window.titles));
        localStorage.setItem(`${currentDbName}_books`, JSON.stringify(window.books));
        localStorage.setItem(`${currentDbName}_roles`, JSON.stringify(window.roles));
        localStorage.setItem(`${currentDbName}_customFieldTypes`, JSON.stringify(window.customFieldTypes));
        localStorage.setItem(`${currentDbName}_relationships`, JSON.stringify(window.relationships));
        localStorage.setItem(`${currentDbName}_tags`, JSON.stringify(window.tags));
        localStorage.setItem(`${currentDbName}_plots`, JSON.stringify(window.plots));
        localStorage.setItem(`${currentDbName}_worldElements`, JSON.stringify(window.worldElements));
        
        console.log('Data saved to both generic and database-specific localStorage keys');
        
        // Trigger storage events to notify the application of data changes
        window.dispatchEvent(new Event('storage'));
        document.dispatchEvent(new CustomEvent('dataLoaded', { detail: { source: 'import' } }));
    } catch (error) {
        console.error('Error saving imported data to localStorage:', error);
    }
    
    // Force refresh and go to dashboard
    setTimeout(() => {
        refreshAllUI();
        triggerDataLoadEvents();
        
        // Try to activate the first tab (dashboard)
        const firstTab = document.querySelector('#tabs a:first-child, .nav-tabs a:first-child, .tab:first-child');
        if (firstTab) {
            console.log('Activating dashboard tab:', firstTab);
            firstTab.click();
        }
    }, 500);
    
    // Show success message using only toast notifications, no popups
    if (window.Core && typeof window.Core.showNotification === 'function') {
        window.Core.showNotification('Database imported successfully!', 'success');
    }
    
    // Update the current database display
    const databaseNameElement = document.getElementById('currentDatabaseName');
    if (databaseNameElement) {
        databaseNameElement.textContent = dbName;
    }
    
    // Navigate to dashboard or perform hard refresh
    setTimeout(() => {
        navigateToDashboard();
    }, 1500); // 1.5 second delay to let the notification appear
}

function updateCurrentDatabase(data) {
    // Implementation for updating the current database with the imported data
    console.log('Updating current database with:', data);
    
    // Get the current database name
    const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
    console.log('Current database name for appending data:', currentDbName);
    
    // First, try to load data from database-specific keys
    let existingCharacters = JSON.parse(localStorage.getItem(`${currentDbName}_characters`) || '[]');
    let existingTitles = JSON.parse(localStorage.getItem(`${currentDbName}_titles`) || '[]');
    let existingSeriesList = JSON.parse(localStorage.getItem(`${currentDbName}_seriesList`) || '[]');
    let existingBooks = JSON.parse(localStorage.getItem(`${currentDbName}_books`) || '[]');
    let existingRoles = JSON.parse(localStorage.getItem(`${currentDbName}_roles`) || '[]');
    let existingCustomFieldTypes = JSON.parse(localStorage.getItem(`${currentDbName}_customFieldTypes`) || '[]');
    let existingRelationships = JSON.parse(localStorage.getItem(`${currentDbName}_relationships`) || '[]');
    let existingTags = JSON.parse(localStorage.getItem(`${currentDbName}_tags`) || '[]');
    let existingPlots = JSON.parse(localStorage.getItem(`${currentDbName}_plots`) || '[]');
    let existingWorldElements = JSON.parse(localStorage.getItem(`${currentDbName}_worldElements`) || '[]');
    
    // If database-specific keys are empty, fall back to generic keys
    if (existingCharacters.length === 0) existingCharacters = JSON.parse(localStorage.getItem('characters') || '[]');
    if (existingTitles.length === 0) existingTitles = JSON.parse(localStorage.getItem('titles') || '[]');
    if (existingSeriesList.length === 0) existingSeriesList = JSON.parse(localStorage.getItem('seriesList') || '[]');
    if (existingBooks.length === 0) existingBooks = JSON.parse(localStorage.getItem('books') || '[]');
    if (existingRoles.length === 0) existingRoles = JSON.parse(localStorage.getItem('roles') || '[]');
    if (existingCustomFieldTypes.length === 0) existingCustomFieldTypes = JSON.parse(localStorage.getItem('customFieldTypes') || '[]');
    if (existingRelationships.length === 0) existingRelationships = JSON.parse(localStorage.getItem('relationships') || '[]');
    if (existingTags.length === 0) existingTags = JSON.parse(localStorage.getItem('tags') || '[]');
    if (existingPlots.length === 0) existingPlots = JSON.parse(localStorage.getItem('plots') || '[]');
    if (existingWorldElements.length === 0) existingWorldElements = JSON.parse(localStorage.getItem('worldElements') || '[]');
    
    console.log('Existing data before merge:', {
        characters: existingCharacters.length,
        seriesList: existingSeriesList.length,
        plots: existingPlots.length,
        worldElements: existingWorldElements.length
    });
    
    // Initialize window objects with existing data
    window.characters = existingCharacters;
    window.titles = existingTitles;
    window.seriesList = existingSeriesList;
    window.books = existingBooks;
    window.roles = existingRoles;
    window.customFieldTypes = existingCustomFieldTypes;
    window.relationships = existingRelationships;
    window.tags = existingTags;
    window.plots = existingPlots;
    window.worldElements = existingWorldElements;
    
    // Track duplicate items
    let duplicateCharacters = 0;
    let duplicatePlots = 0;
    let duplicateWorldElements = 0;
    
    // Merge the imported data with the existing data
    if (data.characters && data.characters.length > 0) {
        // Filter out characters that are functionally identical to existing ones
        const uniqueCharacters = data.characters.filter(newChar => {
            // Check if this character is functionally identical to any existing character
            const isDuplicate = window.characters.some(existingChar => areCharactersIdentical(existingChar, newChar));
            
            if (isDuplicate) {
                duplicateCharacters++;
                return false;
            }
            return true;
        });
        
        window.characters = window.characters.concat(uniqueCharacters);
        console.log(`Added ${uniqueCharacters.length} characters, skipped ${duplicateCharacters} duplicates, new total: ${window.characters.length}`);
    }
    
    if (data.titles && data.titles.length > 0) {
        // Remove duplicates before adding
        const newTitles = data.titles.filter(title => !window.titles.includes(title));
        window.titles = window.titles.concat(newTitles);
        console.log(`Added ${newTitles.length} titles, new total: ${window.titles.length}`);
    }
    
    if (data.seriesList && data.seriesList.length > 0) {
        // Remove duplicates before adding
        const newSeriesList = data.seriesList.filter(series => !window.seriesList.includes(series));
        window.seriesList = window.seriesList.concat(newSeriesList);
        console.log(`Added ${newSeriesList.length} series, new total: ${window.seriesList.length}`);
    }
    
    if (data.books && data.books.length > 0) {
        // Remove duplicates before adding
        const newBooks = data.books.filter(book => !window.books.includes(book));
        window.books = window.books.concat(newBooks);
        console.log(`Added ${newBooks.length} books, new total: ${window.books.length}`);
    }
    
    if (data.roles && data.roles.length > 0) {
        // Remove duplicates before adding
        const newRoles = data.roles.filter(role => !window.roles.includes(role));
        window.roles = window.roles.concat(newRoles);
        console.log(`Added ${newRoles.length} roles, new total: ${window.roles.length}`);
    }
    
    if (data.customFieldTypes && data.customFieldTypes.length > 0) {
        // Remove duplicates by name before adding
        const newCustomFieldTypes = data.customFieldTypes.filter(cft => 
            !window.customFieldTypes.some(existingCft => existingCft.name === cft.name));
        window.customFieldTypes = window.customFieldTypes.concat(newCustomFieldTypes);
        console.log(`Added ${newCustomFieldTypes.length} custom field types, new total: ${window.customFieldTypes.length}`);
    }
    
    if (data.relationships && data.relationships.length > 0) {
        window.relationships = window.relationships.concat(data.relationships);
        console.log(`Added ${data.relationships.length} relationships, new total: ${window.relationships.length}`);
    }
    
    if (data.tags && data.tags.length > 0) {
        // Remove duplicates by name before adding
        const newTags = data.tags.filter(tag => 
            !window.tags.some(existingTag => existingTag.name === tag.name));
        window.tags = window.tags.concat(newTags);
        console.log(`Added ${newTags.length} tags, new total: ${window.tags.length}`);
    }
    
    if (data.plots && data.plots.length > 0) {
        // Filter out plots that are functionally identical to existing ones
        const uniquePlots = data.plots.filter(newPlot => {
            // Check if this plot is functionally identical to any existing plot
            const isDuplicate = window.plots.some(existingPlot => arePlotsIdentical(existingPlot, newPlot));
            
            if (isDuplicate) {
                duplicatePlots++;
                return false;
            }
            return true;
        });
        
        window.plots = window.plots.concat(uniquePlots);
        console.log(`Added ${uniquePlots.length} plots, skipped ${duplicatePlots} duplicates, new total: ${window.plots.length}`);
    }
    
    if (data.worldElements && data.worldElements.length > 0) {
        // Filter out world elements that are functionally identical to existing ones
        const uniqueWorldElements = data.worldElements.filter(newElement => {
            // Check if this element is functionally identical to any existing element
            const isDuplicate = window.worldElements.some(existingElement => 
                areWorldElementsIdentical(existingElement, newElement));
            
            if (isDuplicate) {
                duplicateWorldElements++;
                return false;
            }
            return true;
        });
        
        window.worldElements = window.worldElements.concat(uniqueWorldElements);
        console.log(`Added ${uniqueWorldElements.length} world elements, skipped ${duplicateWorldElements} duplicates, new total: ${window.worldElements.length}`);
    }
    
    // Save the merged data to ensure it persists
    try {
        // Get the current database name
        const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
        console.log('Current database name for saving imported data:', currentDbName);
        
        // Save to both generic keys and database-specific keys
        // Generic keys (for backward compatibility)
        localStorage.setItem('characters', JSON.stringify(window.characters));
        localStorage.setItem('seriesList', JSON.stringify(window.seriesList));
        localStorage.setItem('titles', JSON.stringify(window.titles));
        localStorage.setItem('books', JSON.stringify(window.books));
        localStorage.setItem('roles', JSON.stringify(window.roles));
        localStorage.setItem('customFieldTypes', JSON.stringify(window.customFieldTypes));
        localStorage.setItem('relationships', JSON.stringify(window.relationships));
        localStorage.setItem('tags', JSON.stringify(window.tags));
        localStorage.setItem('plots', JSON.stringify(window.plots));
        localStorage.setItem('worldElements', JSON.stringify(window.worldElements));
        
        // Database-specific keys (to ensure data is properly associated with the current database)
        localStorage.setItem(`${currentDbName}_characters`, JSON.stringify(window.characters));
        localStorage.setItem(`${currentDbName}_seriesList`, JSON.stringify(window.seriesList));
        localStorage.setItem(`${currentDbName}_titles`, JSON.stringify(window.titles));
        localStorage.setItem(`${currentDbName}_books`, JSON.stringify(window.books));
        localStorage.setItem(`${currentDbName}_roles`, JSON.stringify(window.roles));
        localStorage.setItem(`${currentDbName}_customFieldTypes`, JSON.stringify(window.customFieldTypes));
        localStorage.setItem(`${currentDbName}_relationships`, JSON.stringify(window.relationships));
        localStorage.setItem(`${currentDbName}_tags`, JSON.stringify(window.tags));
        localStorage.setItem(`${currentDbName}_plots`, JSON.stringify(window.plots));
        localStorage.setItem(`${currentDbName}_worldElements`, JSON.stringify(window.worldElements));
        
        console.log('Merged data saved to both generic and database-specific localStorage keys');
        
        // Trigger storage events to notify the application of data changes
        window.dispatchEvent(new Event('storage'));
        document.dispatchEvent(new CustomEvent('dataLoaded', { detail: { source: 'import' } }));
    } catch (error) {
        console.error('Error saving imported data to localStorage:', error);
    }
    
    // Show a detailed success message if items were skipped
    let successMessage = 'Database updated successfully!';
    const totalDuplicates = duplicateCharacters + duplicatePlots + duplicateWorldElements;
    if (totalDuplicates > 0) {
        successMessage = `Database updated. Skipped ${totalDuplicates} duplicate items (${duplicateCharacters} characters, ${duplicatePlots} plots, ${duplicateWorldElements} world elements).`;
    }
    
    // Force refresh and go to dashboard with a longer delay to ensure data is loaded
    setTimeout(() => {
        console.log('Refreshing UI after append operation');
        reloadDataFromLocalStorage(); // Reload from localStorage to ensure data is fresh
        refreshAllUI();
        triggerDataLoadEvents();
    }, 500);
    
    // Show success message using only toast notifications, no popups
    if (window.Core && typeof window.Core.showNotification === 'function') {
        window.Core.showNotification(successMessage, 'success');
    }
}

function refreshAllUI() {
    // Try different component display methods
    try {
        console.log('Starting UI refresh with:', {
            characters: window.characters ? `${window.characters.length} items` : 'none',
            seriesList: window.seriesList ? `${window.seriesList.length} items` : 'none',
            plots: window.plots ? `${window.plots.length} items` : 'none'
        });
        
        // Force database reload from localStorage
        try {
            // Try to reload from localStorage first
            reloadDataFromLocalStorage();
        } catch (e) {
            console.warn('Error reloading from localStorage:', e);
        }
        
        // Refresh characters list
        if (window.Characters && typeof window.Characters.displayCharacters === 'function') {
            window.Characters.displayCharacters();
        }
        
        // Refresh locations
        if (window.Locations && typeof window.Locations.displayLocations === 'function') {
            window.Locations.displayLocations();
        }
        
        // Refresh plots
        if (window.Plots && typeof window.Plots.displayPlots === 'function') {
            window.Plots.displayPlots();
        }
        
        // Refresh world elements
        if (window.WorldBuilding && typeof window.WorldBuilding.displayWorldElements === 'function') {
            window.WorldBuilding.displayWorldElements();
        }
        
        // Try to refresh tables directly
        refreshAllTables();
        
        // Try Electron-specific refresh
        if (window.api && typeof window.api.refresh === 'function') {
            window.api.refresh();
        }
        
        // Try general UI refresh
        if (window.UI && typeof window.UI.refreshAll === 'function') {
            window.UI.refreshAll();
        }
        
        // Try refresh current screen
        if (window.UI && typeof window.UI.refreshCurrentScreen === 'function') {
            window.UI.refreshCurrentScreen();
        }
        
        // Reload all data lists
        if (window.loadAllDataLists && typeof window.loadAllDataLists === 'function') {
            window.loadAllDataLists();
        }
        
        // Try to call individual update functions
        ['updateCharacterList', 'updateSeriesList', 'updateWorldElementsList', 'updatePlotsList'].forEach(funcName => {
            if (window[funcName] && typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                } catch (e) {
                    console.warn(`Error calling ${funcName}:`, e);
                }
            }
        });
        
        // Try to refresh any DataTables if they exist
        if (window.$ && window.$.fn && window.$.fn.DataTable) {
            try {
                window.$('.dataTable').DataTable().ajax.reload();
            } catch (e) {
                console.warn('Error refreshing DataTables:', e);
            }
        }
        
        // Force UI update by triggering a custom event
        document.dispatchEvent(new CustomEvent('databaseUpdated', { detail: { source: 'import' } }));
        
        console.log('UI refresh completed');
    } catch (error) {
        console.error('Error during UI refresh:', error);
    }
}

function reloadDataFromLocalStorage() {
    try {
        // Get the current database name
        const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
        console.log('Reloading data from localStorage for database:', currentDbName);
        
        // First try to load from database-specific keys
        const dbCharactersData = localStorage.getItem(`${currentDbName}_characters`);
        const dbSeriesListData = localStorage.getItem(`${currentDbName}_seriesList`);
        const dbTitlesData = localStorage.getItem(`${currentDbName}_titles`);
        const dbBooksData = localStorage.getItem(`${currentDbName}_books`);
        const dbRolesData = localStorage.getItem(`${currentDbName}_roles`);
        const dbCustomFieldTypesData = localStorage.getItem(`${currentDbName}_customFieldTypes`);
        const dbRelationshipsData = localStorage.getItem(`${currentDbName}_relationships`);
        const dbTagsData = localStorage.getItem(`${currentDbName}_tags`);
        const dbPlotsData = localStorage.getItem(`${currentDbName}_plots`);
        const dbWorldElementsData = localStorage.getItem(`${currentDbName}_worldElements`);
        
        // Fall back to generic keys if database-specific keys are not available
        const charactersData = dbCharactersData || localStorage.getItem('characters');
        const seriesListData = dbSeriesListData || localStorage.getItem('seriesList');
        const titlesData = dbTitlesData || localStorage.getItem('titles');
        const booksData = dbBooksData || localStorage.getItem('books');
        const rolesData = dbRolesData || localStorage.getItem('roles');
        const customFieldTypesData = dbCustomFieldTypesData || localStorage.getItem('customFieldTypes');
        const relationshipsData = dbRelationshipsData || localStorage.getItem('relationships');
        const tagsData = dbTagsData || localStorage.getItem('tags');
        const plotsData = dbPlotsData || localStorage.getItem('plots');
        const worldElementsData = dbWorldElementsData || localStorage.getItem('worldElements');
        
        // Parse and assign the data
        if (charactersData) window.characters = JSON.parse(charactersData);
        if (seriesListData) window.seriesList = JSON.parse(seriesListData);
        if (titlesData) window.titles = JSON.parse(titlesData);
        if (booksData) window.books = JSON.parse(booksData);
        if (rolesData) window.roles = JSON.parse(rolesData);
        if (customFieldTypesData) window.customFieldTypes = JSON.parse(customFieldTypesData);
        if (relationshipsData) window.relationships = JSON.parse(relationshipsData);
        if (tagsData) window.tags = JSON.parse(tagsData);
        if (plotsData) window.plots = JSON.parse(plotsData);
        if (worldElementsData) window.worldElements = JSON.parse(worldElementsData);
        
        console.log('Data reloaded from localStorage with priority given to database-specific keys');
    } catch (error) {
        console.error('Error reloading data from localStorage:', error);
    }
}

function refreshAllTables() {
    try {
        // Find all tables in the document
        const tables = document.querySelectorAll('table');
        console.log(`Found ${tables.length} tables to refresh`);
        
        // Try to refresh each table using different methods
        tables.forEach((table, index) => {
            try {
                // Method 1: If table has an ID and there's a function to update it
                if (table.id) {
                    const updateFunctionName = `update${table.id.charAt(0).toUpperCase() + table.id.slice(1)}`;
                    if (window[updateFunctionName] && typeof window[updateFunctionName] === 'function') {
                        window[updateFunctionName]();
                        console.log(`Updated table #${table.id} using ${updateFunctionName}()`);
                    }
                }
                
                // Method 2: Try to force a redraw by toggling display
                const originalDisplay = table.style.display;
                table.style.display = 'none';
                setTimeout(() => {
                    table.style.display = originalDisplay;
                    console.log(`Forced redraw of table ${index}`);
                }, 50);
                
                // Method 3: If table has a data-source attribute, try to reload it
                if (table.dataset.source) {
                    const sourceFunction = table.dataset.source;
                    if (window[sourceFunction] && typeof window[sourceFunction] === 'function') {
                        window[sourceFunction]();
                        console.log(`Reloaded table data using ${sourceFunction}()`);
                    }
                }
            } catch (e) {
                console.warn(`Error refreshing table ${index}:`, e);
            }
        });
    } catch (error) {
        console.error('Error refreshing tables:', error);
    }
}

function openFileWithStandardInput(forceExistingDb) {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    // Set up the change event handler
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                // Use the processImportContent function to handle the file content
                if (window.tempCreateNewDatabase !== undefined && window.tempUpdateExistingDatabase !== undefined) {
                    processImportContent(content, forceExistingDb);
                } else {
                    // Fallback to default behavior if the global variables are not set
                    processImportContent(content, forceExistingDb);
                }
            } catch (error) {
                console.error('Error reading file:', error);
                if (window.Core && typeof window.Core.showToast === 'function') {
                    window.Core.showToast('Failed to read database file: ' + error.message, 'error');
                } else if (window.Core && typeof window.Core.showNotification === 'function') {
                    window.Core.showNotification('Failed to read database file: ' + error.message, 'error');
                } else {
                    console.error('Failed to read database file:', error.message);
                }
            }
        };
        
        reader.readAsText(file);
    });
    
    // Trigger the file selection dialog
    fileInput.click();
}

function openFileWithDefaultPath(filePath, forceExistingDb) {
    if (window.api && window.api.readFile) {
        window.api.readFile(filePath, (content) => {
            if (content) {
                // Use the processImportContent function to handle the file content
                if (window.tempCreateNewDatabase !== undefined && window.tempUpdateExistingDatabase !== undefined) {
                    processImportContent(content, forceExistingDb);
                } else {
                    // Fallback to default behavior if the global variables are not set
                    processImportContent(content, forceExistingDb);
                }
            } else {
                console.error('Failed to read file content');
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast('Failed to read database file', 'error');
                } else if (window.Core && window.Core.showNotification) {
                    window.Core.showNotification('Failed to read database file', 'error');
                } else {
                    console.error('Failed to read database file');
                }
            }
        });
    } else {
        console.error('API for reading files is not available');
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('API for reading files is not available', 'error');
        } else if (window.Core && window.Core.showNotification) {
            window.Core.showNotification('API for reading files is not available', 'error');
        } else {
            console.error('API for reading files is not available');
        }
    }
}

function exportDatabase(syncToCloud = false) {
    console.log('exportDatabase function called');
    
    // Get the current database name
    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
    
    // Create a database object with all data
    const data = {
        characters,
        titles,
        seriesList,
        books,
        roles,
        customFieldTypes,
        relationships,
        tags,
        plots,
        worldElements,
        databaseName: dbName,
        exportDate: new Date().toISOString(),
        version: '2.0.0' // Added version for future compatibility
    };
    
    // Convert to JSON
    const json = JSON.stringify(data, null, 2);
    
    // Check if running in desktop mode
    if (window.api) {
        // Silent save to database directory without any dialogs - using dynamic path
        const databaseDirectory = window.api && window.api.getPaths ? 
            window.api.getPaths().database : 
            (localStorage.getItem('databaseDirectory') || path.join(app.getPath('userData'), 'database'));
        const formattedName = dbName.replace(/\s+/g, '-').toLowerCase();
        const filePath = `${databaseDirectory}\\${formattedName}.json`;
        
        console.log('Silently exporting to:', filePath);
        
        // Send directly to main process to save silently
        window.api.send('save-database-file', {
            filePath: filePath,
            content: json
        });
        
        return;
    }
    
    // Browser fallback for web version
    try {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dbName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Database exported via browser download');
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Database exported successfully', 'success');
        } else {
            alert('Database exported successfully');
        }
    } catch (error) {
        console.error('Error exporting database:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Error exporting database', 'error');
        } else {
            alert('Error exporting database: ' + error.message);
        }
    }
}

function importDatabase(fromCloud = false) {
    window.databaseManagerModalRemoved = true;
    window.databaseSelectionModalRemoved = true;
    window.currentModalType = null;
    
    // Always set to create new database
    window.tempCreateNewDatabase = true;
    window.tempUpdateExistingDatabase = false;
    
    console.log('importDatabase - modal state fully reset at start');
    
    if (fromCloud) {
        // Import from cloud directly
        loadFromCloud();
        return;
    }
    
    // Check if running in desktop mode with Electron
    if (window.api) {
        // Use Electron's dialog to open file with default directory set to database directory
        window.api.send('import-show-open-dialog');
        return;
    }

    // For web version, use standard file input
    openFileWithStandardInput(false);
}

// Function to navigate to dashboard or hard refresh application
function navigateToDashboard() {
    console.log('Attempting to navigate to dashboard with forced reload...');
    
    // Delay to allow any pending operations to complete
    setTimeout(() => {
        try {
            // Store a flag in localStorage to indicate we should go to dashboard after reload
            localStorage.setItem('redirectToDashboard', 'true');
            localStorage.setItem('redirectTimestamp', Date.now().toString());
            
            // Force window reload - most direct approach
            console.log('Forcing application reload...');
            window.location.reload(true);
        } catch (error) {
            console.error('Error during forced reload:', error);
        }
    }, 500);
}

// Function to trigger all the standard data loading events in the application
function triggerDataLoadEvents() {
    console.log('Triggering data load events');
    
    // Common event names used for data loading
    const events = [
        'dataLoaded',
        'databaseLoaded',
        'storageChange',
        'databaseUpdated'
    ];
    
    // Dispatch all events
    events.forEach(eventName => {
        try {
            document.dispatchEvent(new CustomEvent(eventName, { 
                detail: { source: 'import', timestamp: Date.now() } 
            }));
            console.log(`Dispatched ${eventName} event`);
        } catch (e) {
            console.warn(`Error dispatching ${eventName} event:`, e);
        }
    });
    
    // Also trigger window storage event which many apps listen for
    try {
        window.dispatchEvent(new Event('storage'));
        console.log('Dispatched window.storage event');
    } catch (e) {
        console.warn('Error dispatching window.storage event:', e);
    }
}

// Helper function to detect if two characters are functionally the same content
function areCharactersIdentical(char1, char2) {
    // If both have IDs and they match, they're the same character
    if (char1.id && char2.id && char1.id === char2.id) return true;
    
    // Otherwise, check if they have the same first and last name
    return char1.firstName && char2.firstName && 
           char1.firstName.toLowerCase().trim() === char2.firstName.toLowerCase().trim() &&
           char1.lastName && char2.lastName && 
           char1.lastName.toLowerCase().trim() === char2.lastName.toLowerCase().trim();
}

// Helper function to detect if two plots are functionally the same content
function arePlotsIdentical(plot1, plot2) {
    // Check title, which is the basic identity
    if (plot1.title !== plot2.title) {
        return false;
    }
    
    // If we have the same title, check for other key properties
    const keyProperties = [
        'description', 'series', 'notes', 'tags', 'plotPoints'
    ];
    
    // Count how many key properties match
    let matchCount = 0;
    let availableProps = 0;
    
    for (const prop of keyProperties) {
        // Only compare properties that exist in both plots
        if (plot1[prop] !== undefined && plot2[prop] !== undefined) {
            availableProps++;
            if (JSON.stringify(plot1[prop]) === JSON.stringify(plot2[prop])) {
                matchCount++;
            }
        }
    }
    
    // If more than 80% of the properties match, consider it the same plot
    if (availableProps > 0) {
        const matchPercentage = matchCount / availableProps;
        return matchPercentage > 0.8;
    }
    
    // If we don't have enough data to compare, default to not identical
    return false;
}

// Helper function to detect if two world elements are functionally the same content
function areWorldElementsIdentical(elem1, elem2) {
    // Check name and category, which are the basic identity
    if (elem1.name !== elem2.name || elem1.category !== elem2.category) {
        return false;
    }
    
    // If we have the same name and category, check for other key properties
    const keyProperties = [
        'description', 'notes', 'tags', 'series'
    ];
    
    // Count how many key properties match
    let matchCount = 0;
    let availableProps = 0;
    
    for (const prop of keyProperties) {
        // Only compare properties that exist in both elements
        if (elem1[prop] !== undefined && elem2[prop] !== undefined) {
            availableProps++;
            if (JSON.stringify(elem1[prop]) === JSON.stringify(elem2[prop])) {
                matchCount++;
            }
        }
    }
    
    // If more than 80% of the properties match, consider it the same element
    if (availableProps > 0) {
        const matchPercentage = matchCount / availableProps;
        return matchPercentage > 0.8;
    }
    
    // If we don't have enough data to compare, default to not identical
    return false;
}

// Listen for file-saved notifications
if (window.api) {
    window.api.onFileSaved((filePath) => {
        console.log('Received file-saved notification for:', filePath);
        if (window.Core && window.Core.showToast) {
            const fileName = filePath.split('\\').pop();
            window.Core.showToast(`Database exported to ${fileName}`, 'success');
        }
    });
    
    window.api.onFileError((message) => {
        console.error('Received file error notification:', message);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Error exporting database: ${message}`, 'error');
        }
    });
}

// Export the functions
export { 
    validateImportFile, 
    showImportError, 
    isUsingNonDefaultDatabase, 
    importFromLocalFile, 
    processImportContent,
    importDatabase,
    exportDatabase,
    openFileWithStandardInput,
    openFileWithDefaultPath,
    isVersionCompatible,
    loadAsNewDatabase,
    updateCurrentDatabase,
    refreshAllUI,
    reloadDataFromLocalStorage,
    refreshAllTables,
    navigateToDashboard,
    triggerDataLoadEvents
};
