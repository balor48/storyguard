// loadDatabase Fix Script
// This script adds a loadDatabase function to the global scope and to the Storage object

console.log('loadDatabase fix script loaded');

(function() {
    // Define loadDatabase in global scope if it doesn't exist
    if (typeof window.loadDatabase !== 'function') {
        window.loadDatabase = function(callback) {
            console.log('Global loadDatabase function called');
            try {
                // Try to get current database from localStorage
                const currentDatabaseName = localStorage.getItem('currentDatabaseName');
                if (!currentDatabaseName) {
                    console.warn('No current database name found in localStorage');
                    if (typeof callback === 'function') {
                        callback(null, 'No current database selected');
                    }
                    return null;
                }
                
                // Try to get database data from localStorage
                const databaseData = localStorage.getItem(`database_${currentDatabaseName}`);
                if (!databaseData) {
                    console.warn(`No data found for database: ${currentDatabaseName}`);
                    if (typeof callback === 'function') {
                        callback(null, `No data found for database: ${currentDatabaseName}`);
                    }
                    return null;
                }
                
                // Parse the database data
                try {
                    const database = JSON.parse(databaseData);
                    console.log(`Database ${currentDatabaseName} loaded successfully`);
                    
                    // If Storage object exists, add data to it
                    if (window.Storage) {
                        // Copy relevant data to window object for access by other scripts
                        window.characters = database.characters || [];
                        window.locations = database.locations || [];
                        window.plots = database.plots || [];
                        window.worldElements = database.worldElements || [];
                        window.relationships = database.relationships || [];
                        window.tags = database.tags || [];
                    }
                    
                    if (typeof callback === 'function') {
                        callback(database);
                    }
                    
                    return database;
                } catch (parseError) {
                    console.error('Error parsing database data:', parseError);
                    if (typeof callback === 'function') {
                        callback(null, `Error parsing database data: ${parseError.message}`);
                    }
                    return null;
                }
            } catch (error) {
                console.error('Error in loadDatabase:', error);
                if (typeof callback === 'function') {
                    callback(null, `Error in loadDatabase: ${error.message}`);
                }
                return null;
            }
        };
        console.log('Global loadDatabase function defined');
    }
    
    // Make sure the Storage object has the loadDatabase function too
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.Storage && typeof window.Storage.loadDatabase !== 'function') {
                window.Storage.loadDatabase = window.loadDatabase;
                console.log('Added loadDatabase to Storage object');
            }
        }, 500);
    });
})();
