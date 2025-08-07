// Core storage functions
function saveData() {
    try {
        const savedSuccessfully =
            Core.safelyStoreItem('characters', JSON.stringify(characters)) &&
            Core.safelyStoreItem('titles', JSON.stringify(titles)) &&
            Core.safelyStoreItem('series', JSON.stringify(seriesList)) &&
            Core.safelyStoreItem('books', JSON.stringify(books)) &&
            Core.safelyStoreItem('roles', JSON.stringify(roles)) &&
            Core.safelyStoreItem('customFieldTypes', JSON.stringify(customFieldTypes)) &&
            Core.safelyStoreItem('relationships', JSON.stringify(relationships)) &&
            Core.safelyStoreItem('tags', JSON.stringify(tags)) &&
            Core.safelyStoreItem('plots', JSON.stringify(plots)) &&
            Core.safelyStoreItem('worldElements', JSON.stringify(worldElements));
            
        if (!savedSuccessfully) {
            console.error('Failed to save one or more data items');
            return false;
        }
        
        console.log('All data successfully saved');
        return true;
    } catch (error) {
        console.error('Error in saveData function:', error);
        return false;
    }
}

function saveDatabase() {
    // Save all data to the database
    return saveData();
}

// Export the functions
export { saveData, saveDatabase }; 