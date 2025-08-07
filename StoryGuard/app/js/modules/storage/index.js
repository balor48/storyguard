/**
 * Storage Module Index
 * This file exports all storage-related functionality
 */

// Import all module components
import { exportDatabase, importDatabase, importFromLocalFile, processImportContent } from './import.js';
import { saveDatabase, exportLocations, importLocations } from './fileOperations.js';
import { backupDatabase } from './backup.js';
import { 
    createDetailedPDF,
    exportCharactersToPDF,
    exportLocationsToPDF,
    exportPlotsToPDF,
    exportWorldBuildingToPDF
} from './pdf.js';

// Create the Storage object with all functions
const Storage = {
    exportDatabase,
    importDatabase,
    importFromLocalFile,
    backupDatabase,
    saveDatabase,
    createDetailedPDF,
    exportCharactersToPDF,
    exportLocationsToPDF,
    exportPlotsToPDF,
    exportWorldBuildingToPDF,
    exportLocations,
    importLocations,
    processImportContent,
    
    // Add stub implementation for setupCloudStorage to prevent errors
    setupCloudStorage: function() {
        console.log('Cloud storage setup is not implemented in this version');
        // This stub implementation prevents errors when the function is called
        return Promise.resolve();
    }
    // Add other functions as needed
};

// Initialize
function initStorage() {
    console.log('Initializing Storage module...');
}

// Auto-initialize when imported
initStorage();

// Export the Storage object as default and named export
export default Storage;
export { Storage };

// Re-export individual functions for direct access
export {
    exportDatabase,
    importDatabase,
    importFromLocalFile,
    backupDatabase,
    saveDatabase,
    createDetailedPDF,
    exportCharactersToPDF,
    exportLocationsToPDF,
    exportPlotsToPDF,
    exportWorldBuildingToPDF,
    exportLocations,
    importLocations,
    processImportContent
};

// Export the setupCloudStorage function separately
export function setupCloudStorage() {
    console.log('Cloud storage setup is not implemented in this version');
    // This stub implementation prevents errors when the function is called
    return Promise.resolve();
}
