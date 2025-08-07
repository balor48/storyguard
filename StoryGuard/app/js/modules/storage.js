// This file bridges the modular storage structure with the global Storage object used by the application

// Import the Storage object and all functions from our modular structure
import * as StorageModule from './storage/index.js';

// Import export functions
import {
    exportCharactersToHTML,
    exportCharactersToTXT,
    exportLocationsToHTML,
    exportLocationsToTXT,
    exportPlotsToHTML,
    exportPlotsToTXT,
    exportWorldBuildingToHTML,
    exportWorldBuildingToTXT
} from './storage/exports.js';

// Make Storage globally available by explicitly attaching all exported properties
window.Storage = {};

// Copy all properties from the imported module to window.Storage
Object.keys(StorageModule).forEach(key => {
    if (key !== 'default' && key !== 'Storage') {
        window.Storage[key] = StorageModule[key];
        console.log(`Attached ${key} to window.Storage`);
    }
});

// If Storage is exported as an object, copy its properties too
if (StorageModule.Storage) {
    Object.keys(StorageModule.Storage).forEach(key => {
        if (!window.Storage[key]) {
            window.Storage[key] = StorageModule.Storage[key];
            console.log(`Attached ${key} from StorageModule.Storage to window.Storage`);
        }
    });
}

// If there's a default export, use it as a fallback
if (StorageModule.default) {
    Object.keys(StorageModule.default).forEach(key => {
        if (!window.Storage[key]) {
            window.Storage[key] = StorageModule.default[key];
            console.log(`Attached ${key} from StorageModule.default to window.Storage`);
        }
    });
}

// Explicitly attach PDF functions to ensure they're available
const pdfFunctions = ['createDetailedPDF', 'exportCharactersToPDF', 'exportLocationsToPDF', 'exportPlotsToPDF', 'exportWorldBuildingToPDF'];
pdfFunctions.forEach(func => {
    if (StorageModule[func]) {
        window.Storage[func] = StorageModule[func];
        console.log(`Explicitly attached PDF function ${func} to window.Storage`);
    } else if (StorageModule.default && StorageModule.default[func]) {
        window.Storage[func] = StorageModule.default[func];
        console.log(`Explicitly attached PDF function ${func} from default export to window.Storage`);
    } else if (StorageModule.Storage && StorageModule.Storage[func]) {
        window.Storage[func] = StorageModule.Storage[func];
        console.log(`Explicitly attached PDF function ${func} from Storage export to window.Storage`);
    } else {
        console.warn(`⚠️ PDF function ${func} could not be found in any export`);
    }
});

// Direct implementation of PDF functions as a fallback
// This ensures the functions are available even if the module exports fail

// Create a PDF with individual views for each item
if (typeof window.Storage.createDetailedPDF !== 'function') {
    window.Storage.createDetailedPDF = function(items, generateItemHTML, filename) {
        console.log(`Creating PDF for ${items.length} items with filename ${filename}`);
        try {
            // Create a container for all items
            const container = document.createElement('div');
            container.style.fontFamily = 'Arial, sans-serif';
            container.style.padding = '20px';
            
            // Add each item to the container
            items.forEach((item) => {
                const itemContainer = document.createElement('div');
                itemContainer.style.marginBottom = '30px';
                itemContainer.style.pageBreakAfter = 'always';
                itemContainer.innerHTML = generateItemHTML(item);
                container.appendChild(itemContainer);
            });
            
            // Generate PDF
            html2pdf()
                .from(container)
                .save(filename);
                
            console.log('PDF generation started');
            return true;
        } catch (error) {
            console.error('Error creating PDF:', error);
            return false;
        }
    };
    console.log('Added direct implementation of createDetailedPDF');
}

// Export characters to PDF
if (typeof window.Storage.exportCharactersToPDF !== 'function') {
    window.Storage.exportCharactersToPDF = function() {
        console.log('Exporting characters to PDF...');
        try {
            // Get the current database name for the filename
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            const filename = `${dbName}-characters.pdf`;
            
            // Generate HTML for a character
            const generateCharacterHTML = (character) => {
                // Basic character info
                let html = `
                    <div style="border: 1px solid #ccc; padding: 15px; border-radius: 5px;">
                        <h2 style="color: #3498db; margin-top: 0;">${character.firstName || ''} ${character.lastName || ''}</h2>
                        <div style="display: flex; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555;">Personal Information</h3>
                                <p><strong>Age:</strong> ${character.age || 'N/A'}</p>
                                <p><strong>Gender:</strong> ${character.gender || 'N/A'}</p>
                                <p><strong>Occupation:</strong> ${character.occupation || 'N/A'}</p>
                            </div>
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555;">Story Context</h3>
                                <p><strong>Role:</strong> ${character.role || 'N/A'}</p>
                                <p><strong>Series:</strong> ${character.series || 'N/A'}</p>
                                <p><strong>Book:</strong> ${character.book || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: #555;">Description</h3>
                            <p>${character.description || 'No description available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555;">Notes</h3>
                            <p>${character.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                `;
                return html;
            };
            
            // Call the createDetailedPDF function
            return window.Storage.createDetailedPDF(characters, generateCharacterHTML, filename);
        } catch (error) {
            console.error('Error exporting characters to PDF:', error);
            return false;
        }
    };
    console.log('Added direct implementation of exportCharactersToPDF');
}

// Export locations to PDF
if (typeof window.Storage.exportLocationsToPDF !== 'function') {
    window.Storage.exportLocationsToPDF = function() {
        console.log('Exporting locations to PDF...');
        try {
            // Get the current database name for the filename
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            const filename = `${dbName}-locations.pdf`;
            
            // Generate HTML for a location
            const generateLocationHTML = (location) => {
                // Basic location info
                let html = `
                    <div style="border: 1px solid #ccc; padding: 15px; border-radius: 5px;">
                        <h2 style="color: #3498db; margin-top: 0;">${location.name || 'Unnamed Location'}</h2>
                        <div style="display: flex; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555;">Basic Information</h3>
                                <p><strong>Type:</strong> ${location.type || 'N/A'}</p>
                                <p><strong>Region:</strong> ${location.region || 'N/A'}</p>
                                <p><strong>Country:</strong> ${location.country || 'N/A'}</p>
                            </div>
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555;">Story Context</h3>
                                <p><strong>Series:</strong> ${location.series || 'N/A'}</p>
                                <p><strong>Book:</strong> ${location.book || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: #555;">Description</h3>
                            <p>${location.description || 'No description available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555;">Notes</h3>
                            <p>${location.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                `;
                return html;
            };
            
            // Call the createDetailedPDF function
            return window.Storage.createDetailedPDF(locations, generateLocationHTML, filename);
        } catch (error) {
            console.error('Error exporting locations to PDF:', error);
            return false;
        }
    };
    console.log('Added direct implementation of exportLocationsToPDF');
}

// Export plots to PDF
if (typeof window.Storage.exportPlotsToPDF !== 'function') {
    window.Storage.exportPlotsToPDF = function() {
        console.log('Exporting plots to PDF...');
        try {
            // Get the current database name for the filename
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            const filename = `${dbName}-plots.pdf`;
            
            // Generate HTML for a plot
            const generatePlotHTML = (plot) => {
                // Basic plot info
                let html = `
                    <div style="border: 1px solid #ccc; padding: 15px; border-radius: 5px;">
                        <h2 style="color: #3498db; margin-top: 0;">${plot.title || 'Unnamed Plot'}</h2>
                        <div style="display: flex; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555;">Basic Information</h3>
                                <p><strong>Type:</strong> ${plot.type || 'N/A'}</p>
                                <p><strong>Status:</strong> ${plot.status || 'N/A'}</p>
                            </div>
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555;">Story Context</h3>
                                <p><strong>Series:</strong> ${plot.series || 'N/A'}</p>
                                <p><strong>Book:</strong> ${plot.book || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: #555;">Description</h3>
                            <p>${plot.description || 'No description available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555;">Notes</h3>
                            <p>${plot.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                `;
                return html;
            };
            
            // Call the createDetailedPDF function
            return window.Storage.createDetailedPDF(plots, generatePlotHTML, filename);
        } catch (error) {
            console.error('Error exporting plots to PDF:', error);
            return false;
        }
    };
    console.log('Added direct implementation of exportPlotsToPDF');
}

// Export world-building to PDF
if (typeof window.Storage.exportWorldBuildingToPDF !== 'function') {
    window.Storage.exportWorldBuildingToPDF = function() {
        console.log('Exporting world-building to PDF...');
        try {
            // Get the current database name for the filename
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            const filename = `${dbName}-world-building.pdf`;
            
            // Generate HTML for a world element
            const generateWorldElementHTML = (element) => {
                // Basic world element info
                let html = `
                    <div style="border: 1px solid #ccc; padding: 15px; border-radius: 5px;">
                        <h2 style="color: #3498db; margin-top: 0;">${element.name || 'Unnamed Element'}</h2>
                        <div style="display: flex; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555;">Basic Information</h3>
                                <p><strong>Category:</strong> ${element.category || 'N/A'}</p>
                                <p><strong>Type:</strong> ${element.type || 'N/A'}</p>
                            </div>
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555;">Story Context</h3>
                                <p><strong>Series:</strong> ${element.series || 'N/A'}</p>
                                <p><strong>Book:</strong> ${element.book || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: #555;">Description</h3>
                            <p>${element.description || 'No description available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555;">Notes</h3>
                            <p>${element.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                `;
                return html;
            };
            
            // Call the createDetailedPDF function
            return window.Storage.createDetailedPDF(worldElements, generateWorldElementHTML, filename);
        } catch (error) {
            console.error('Error exporting world-building to PDF:', error);
            return false;
        }
    };
    console.log('Added direct implementation of exportWorldBuildingToPDF');
}

// Add fallback for setupCloudStorage if missing
if (typeof window.Storage.setupCloudStorage !== 'function') {
    window.Storage.setupCloudStorage = function() {
        console.log('Cloud storage setup is not implemented in this version (added via bridge)');
        return Promise.resolve();
    };
    console.log('Added setupCloudStorage fallback');
}

// For debugging - verify all critical functions are available
const criticalFunctions = ['importDatabase', 'exportDatabase', 'backupDatabase', 'exportWorldBuildingToPDF', 'exportCharactersToPDF', 'exportLocationsToPDF', 'exportPlotsToPDF'];
criticalFunctions.forEach(func => {
    if (typeof window.Storage[func] === 'function') {
        console.log(`✓ ${func} is properly attached to window.Storage`);
    } else {
        console.error(`✗ ${func} is missing from window.Storage`);
    }
});

console.log('Storage bridge initialized');

// Attach export functions to window.Storage
window.Storage.exportCharactersToHTML = exportCharactersToHTML;
window.Storage.exportCharactersToTXT = exportCharactersToTXT;
window.Storage.exportLocationsToHTML = exportLocationsToHTML;
window.Storage.exportLocationsToTXT = exportLocationsToTXT;
window.Storage.exportPlotsToHTML = exportPlotsToHTML;
window.Storage.exportPlotsToTXT = exportPlotsToTXT;
window.Storage.exportWorldBuildingToHTML = exportWorldBuildingToHTML;
window.Storage.exportWorldBuildingToTXT = exportWorldBuildingToTXT;

// Helper functions for generating content
function generateCharactersHTML(characters) {
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Characters Export</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .character { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                h2 { color: #3498db; margin-top: 0; }
                h3 { color: #555; }
            </style>
        </head>
        <body>
            <h1>Characters Export</h1>
    `;
    
    characters.forEach(character => {
        html += `
            <div class="character">
                <h2>${character.firstName || ''} ${character.lastName || ''}</h2>
                <div>
                    <h3>Personal Information</h3>
                    <p><strong>Title:</strong> ${character.title || 'N/A'}</p>
                    <p><strong>Sex:</strong> ${character.sex || 'N/A'}</p>
                    <p><strong>Race:</strong> ${character.race || 'N/A'}</p>
                </div>
                <div>
                    <h3>Story Context</h3>
                    <p><strong>Role:</strong> ${character.role || 'N/A'}</p>
                    <p><strong>Series:</strong> ${character.series || 'N/A'}</p>
                    <p><strong>Book:</strong> ${character.book || 'N/A'}</p>
                </div>
                <div>
                    <h3>Notes</h3>
                    <p>${character.notes || 'No notes available.'}</p>
                </div>
            </div>
        `;
    });
    
    html += `
        </body>
        </html>
    `;
    return html;
}

function generateCharactersTXT(characters) {
    let text = 'CHARACTERS EXPORT\n\n';
    
    characters.forEach(character => {
        text += `=== ${character.firstName || ''} ${character.lastName || ''} ===\n\n`;
        text += 'Personal Information:\n';
        text += `Title: ${character.title || 'N/A'}\n`;
        text += `Sex: ${character.sex || 'N/A'}\n`;
        text += `Race: ${character.race || 'N/A'}\n\n`;
        text += 'Story Context:\n';
        text += `Role: ${character.role || 'N/A'}\n`;
        text += `Series: ${character.series || 'N/A'}\n`;
        text += `Book: ${character.book || 'N/A'}\n\n`;
        text += 'Notes:\n';
        text += `${character.notes || 'No notes available.'}\n\n`;
        text += '----------------------------------------\n\n';
    });
    
    return text;
}

function generateCharactersDOCX(characters) {
    return {
        title: 'Characters Export',
        sections: characters.map(character => ({
            title: `${character.firstName || ''} ${character.lastName || ''}`,
            content: [
                { heading: 'Personal Information' },
                { text: `Title: ${character.title || 'N/A'}` },
                { text: `Sex: ${character.sex || 'N/A'}` },
                { text: `Race: ${character.race || 'N/A'}` },
                { heading: 'Story Context' },
                { text: `Role: ${character.role || 'N/A'}` },
                { text: `Series: ${character.series || 'N/A'}` },
                { text: `Book: ${character.book || 'N/A'}` },
                { heading: 'Notes' },
                { text: character.notes || 'No notes available.' }
            ]
        }))
    };
}

// Add similar export functions for locations, plots, and world-building
// ... existing code ...

// Show database manager dialog
window.Storage.showDatabaseManager = function() {
    if (typeof Dashboard !== 'undefined' && typeof Dashboard.showDatabaseManager === 'function') {
        Dashboard.showDatabaseManager();
    } else {
        console.error('Dashboard.showDatabaseManager is not available');
        if (window.Core && window.Core.showToast) {
            window.Core.showToast('Database manager is not available', 'error');
        }
    }
};
