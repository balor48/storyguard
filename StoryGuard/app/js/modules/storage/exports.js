// Export utility functions
async function getExportDirectory() {
    try {
        const paths = await window.api.getPaths();
        if (!paths || (!paths.PDF && !paths.documents)) {
            console.log('Export directory not found in paths, using default');
            return 'Documents'; // Default fallback directory
        }
        // Prefer documents path, fall back to PDF path
        return paths.documents || paths.PDF;
    } catch (error) {
        console.error('Error getting export directory:', error);
        // Return a default path as fallback
        return 'Documents';
    }
}

function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function getCurrentDatabaseName() {
    return localStorage.getItem('currentDatabaseName') || 'Default';
}

// Common export functions
async function exportToHTML(items, generateItemHTML, filename) {
    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        h3 { color: #666; margin-top: 15px; }
        .tags { margin: 10px 0; }
        .tag { display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 3px; color: white; }
        img { max-width: 200px; height: auto; margin: 10px 0; }
    </style>
</head>
<body>
    ${items.map(item => generateItemHTML(item)).join('<hr>')}
</body>
</html>`;

    try {
        if (window.api && window.api.invoke) {
            const result = await window.api.invoke('save-html', { content, filename });
            if (result.success) {
                console.log('Successfully exported HTML:', result.path);
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`HTML file saved: ${result.path}`, 'success');
                }
            } else {
                throw new Error(result.error);
            }
        } else {
            // Web fallback
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('HTML file downloaded successfully', 'success');
            }
        }
    } catch (error) {
        console.error('Error exporting HTML:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to save HTML file: ${error.message}`, 'error');
        }
    }
}

async function exportToTXT(items, generateItemText, filename) {
    const content = items.map(item => generateItemText(item)).join('\n\n---\n\n');

    try {
        if (window.api && window.api.invoke) {
            const result = await window.api.invoke('save-txt', { content, filename });
            if (result.success) {
                console.log('Successfully exported TXT:', result.path);
                if (window.Core && window.Core.showToast) {
                    window.Core.showToast(`Text file saved: ${result.path}`, 'success');
                }
            } else {
                throw new Error(result.error);
            }
        } else {
            // Web fallback
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (window.Core && window.Core.showToast) {
                window.Core.showToast('Text file downloaded successfully', 'success');
            }
        }
    } catch (error) {
        console.error('Error exporting TXT:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to save text file: ${error.message}`, 'error');
        }
    }
}

// Character export functions
function generateCharacterHTML(character) {
    if (!character) return '<p>Invalid character data</p>';
    
    // Get character relationships - using manual filtering from global relationships array
    const characterName = `${character.firstName || ''} ${character.lastName || ''}`.trim();
    let characterRelationships = [];
    
    // Manually retrieve relationships for this character from the global relationships array
    if (typeof window.relationships !== 'undefined' && Array.isArray(window.relationships)) {
        // Filter relationships manually
        const filteredRelationships = window.relationships.filter(rel => 
            rel.character1 === characterName || rel.character2 === characterName
        );
        
        // Format the relationships for display
        characterRelationships = filteredRelationships.map(rel => {
            // Determine which character is the other one (not this character)
            const otherCharacter = rel.character1 === characterName ? rel.character2 : rel.character1;
            
            return {
                character: otherCharacter,
                type: rel.type
            };
        });
    }
    
    // Create a more structured HTML for better DOCX conversion
    return `
        <h2>${escapeHtml(character.firstName || '')} ${escapeHtml(character.lastName || '')}</h2>
        <div>
            <h3>Personal Information</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Title:</strong></td>
                    <td>${escapeHtml(character.title || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Sex:</strong></td>
                    <td>${escapeHtml(character.sex || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Race:</strong></td>
                    <td>${escapeHtml(character.race || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Age:</strong></td>
                    <td>${escapeHtml(character.age || 'N/A')}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Story Context</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Role:</strong></td>
                    <td>${escapeHtml(character.role || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Series:</strong></td>
                    <td>${escapeHtml(character.series || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Book:</strong></td>
                    <td>${escapeHtml(character.book || 'N/A')}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Relationships</h3>
            ${characterRelationships.length > 0 ? `
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                ${characterRelationships.map(rel => `
                <tr>
                    <td width="30%"><strong>${escapeHtml(rel.character)}:</strong></td>
                    <td>${escapeHtml(rel.type)}</td>
                </tr>
                `).join('')}
            </table>
            ` : '<p>No relationships defined</p>'}
        </div>
        <div>
            <h3>Notes</h3>
            <p>${escapeHtml(character.notes || 'No notes available.')}</p>
        </div>
    `;
}

function generateCharacterText(character) {
    // Get character relationships - using manual filtering from global relationships array
    const characterName = `${character.firstName || ''} ${character.lastName || ''}`.trim();
    let characterRelationships = [];
    
    // Manually retrieve relationships for this character from the global relationships array
    if (typeof window.relationships !== 'undefined' && Array.isArray(window.relationships)) {
        // Filter relationships manually
        const filteredRelationships = window.relationships.filter(rel => 
            rel.character1 === characterName || rel.character2 === characterName
        );
        
        // Format the relationships for display
        characterRelationships = filteredRelationships.map(rel => {
            // Determine which character is the other one (not this character)
            const otherCharacter = rel.character1 === characterName ? rel.character2 : rel.character1;
            
            return {
                character: otherCharacter,
                type: rel.type
            };
        });
    }
    
    // Format relationships as text
    const relationshipsText = characterRelationships.length > 0 ?
        characterRelationships.map(rel => `  - ${rel.character}: ${rel.type}`).join('\n') :
        '  None defined';
    
    return `Name: ${character.firstName || ''} ${character.lastName || ''}
Title: ${character.title || 'N/A'}
Role: ${character.role || 'N/A'}
Series: ${character.series || 'N/A'}
Book: ${character.book || 'N/A'}
Description: ${character.description || 'N/A'}
Notes: ${character.notes || 'N/A'}

Relationships:
${relationshipsText}`;
}

// Export functions for characters
async function exportCharactersToHTML() {
    try {
        const dbName = getCurrentDatabaseName();
        const timestamp = getTimestamp();
        const filename = `${dbName}-characters_${timestamp}.html`;
        
        await exportToHTML(
            window.characters || [],
            generateCharacterHTML,
            filename
        );
    } catch (error) {
        console.error('Error in exportCharactersToHTML:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to export HTML: ${error.message}`, 'error');
        }
    }
}

async function exportCharactersToTXT() {
    try {
        const dbName = getCurrentDatabaseName();
        const timestamp = getTimestamp();
        const filename = `${dbName}-characters_${timestamp}.txt`;
        
        await exportToTXT(
            window.characters || [],
            generateCharacterText,
            filename
        );
    } catch (error) {
        console.error('Error in exportCharactersToTXT:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to export TXT: ${error.message}`, 'error');
        }
    }
}

// Location export functions
function generateLocationHTML(location) {
    if (!location) return '<p>Invalid location data</p>';
    
    // Get location tags
    let tagsHTML = '';
    if (location.tags && location.tags.length > 0 && window.tags) {
        const locationTags = window.tags.filter(tag => location.tags.includes(tag.id));
        tagsHTML = locationTags.map(tag => 
            `<span style="background-color: ${tag.color}; color: white; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-right: 5px;">${escapeHtml(tag.name)}</span>`
        ).join('');
    }
    
    // Create a more structured HTML for better DOCX conversion
    return `
        <h2>${escapeHtml(location.name || 'Unnamed Location')}</h2>
        <div>
            <h3>Basic Information</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Type:</strong></td>
                    <td>${escapeHtml(location.type || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Size/Scale:</strong></td>
                    <td>${escapeHtml(location.size || 'N/A')}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Story Context</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Series:</strong></td>
                    <td>${escapeHtml(location.series || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Book:</strong></td>
                    <td>${escapeHtml(location.book || 'N/A')}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Additional Details</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Climate/Environment:</strong></td>
                    <td>${escapeHtml(location.climate || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Population/Inhabitants:</strong></td>
                    <td>${escapeHtml(location.population || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Tags:</strong></td>
                    <td>${tagsHTML || 'No tags'}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Description</h3>
            <p>${location.description || 'No description available.'}</p>
        </div>
        <div>
            <h3>Notes</h3>
            <p>${escapeHtml(location.notes || 'No notes available.')}</p>
        </div>
    `;
}

function generateLocationText(location) {
    // Get location tags
    let tagsList = '';
    if (location.tags && location.tags.length > 0 && window.tags) {
        const locationTags = window.tags.filter(tag => location.tags.includes(tag.id));
        tagsList = locationTags.map(tag => tag.name).join(', ');
    }
    
    return `== ${location.name || 'Unnamed Location'} ==

BASIC INFORMATION:
Type: ${location.type || 'N/A'}
Size/Scale: ${location.size || 'N/A'}

STORY CONTEXT:
Series: ${location.series || 'N/A'}
Book: ${location.book || 'N/A'}

ADDITIONAL DETAILS:
Climate/Environment: ${location.climate || 'N/A'}
Population/Inhabitants: ${location.population || 'N/A'}
Tags: ${tagsList || 'None'}

DESCRIPTION:
${location.description ? location.description.replace(/<[^>]*>/g, '') || 'N/A' : 'N/A'}

NOTES:
${location.notes || 'No notes available.'}`;
}

// Export functions for locations
async function exportLocationsToHTML() {
    try {
        const dbName = getCurrentDatabaseName();
        const timestamp = getTimestamp();
        const filename = `${dbName}-locations_${timestamp}.html`;
        
        await exportToHTML(
            window.locations || [],
            generateLocationHTML,
            filename
        );
    } catch (error) {
        console.error('Error in exportLocationsToHTML:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to export HTML: ${error.message}`, 'error');
        }
    }
}

async function exportLocationsToTXT() {
    try {
        const dbName = getCurrentDatabaseName();
        const timestamp = getTimestamp();
        const filename = `${dbName}-locations_${timestamp}.txt`;
        
        await exportToTXT(
            window.locations || [],
            generateLocationText,
            filename
        );
    } catch (error) {
        console.error('Error in exportLocationsToTXT:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to export TXT: ${error.message}`, 'error');
        }
    }
}

// Plot export functions
function generatePlotHTML(plot) {
    if (!plot) return '<p>Invalid plot data</p>';
    
    // Create a more structured HTML for better DOCX conversion
    return `
        <h2>${escapeHtml(plot.title || 'Unnamed Plot')}</h2>
        <div>
            <h3>Basic Information</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Type:</strong></td>
                    <td>${escapeHtml(plot.type || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Status:</strong></td>
                    <td>${escapeHtml(plot.status || 'N/A')}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Story Context</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Series:</strong></td>
                    <td>${escapeHtml(plot.series || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Book:</strong></td>
                    <td>${escapeHtml(plot.book || 'N/A')}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Summary</h3>
            <p>${escapeHtml(plot.description || 'No summary available.')}</p>
        </div>
        <div>
            <h3>Notes</h3>
            <p>${escapeHtml(plot.notes || 'No notes available.')}</p>
        </div>
    `;
}

function generatePlotText(plot) {
    return `Title: ${plot.title || 'Unnamed Plot'}
Type: ${plot.type || 'N/A'}
Series: ${plot.series || 'N/A'}
Book: ${plot.book || 'N/A'}
Status: ${plot.status || 'N/A'}
Description: ${plot.description || 'N/A'}`;
}

// Export functions for plots
async function exportPlotsToHTML() {
    try {
        const dbName = getCurrentDatabaseName();
        const timestamp = getTimestamp();
        const filename = `${dbName}-plots_${timestamp}.html`;
        
        await exportToHTML(
            window.plots || [],
            generatePlotHTML,
            filename
        );
    } catch (error) {
        console.error('Error in exportPlotsToHTML:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to export HTML: ${error.message}`, 'error');
        }
    }
}

async function exportPlotsToTXT() {
    try {
        const dbName = getCurrentDatabaseName();
        const timestamp = getTimestamp();
        const filename = `${dbName}-plots_${timestamp}.txt`;
        
        await exportToTXT(
            window.plots || [],
            generatePlotText,
            filename
        );
    } catch (error) {
        console.error('Error in exportPlotsToTXT:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to export TXT: ${error.message}`, 'error');
        }
    }
}

// World-Building export functions
function generateWorldBuildingHTML(element) {
    if (!element) return '<p>Invalid world building element data</p>';
    
    // Create a more structured HTML for better DOCX conversion
    return `
        <h2>${escapeHtml(element.name || 'Unnamed Element')}</h2>
        <div>
            <h3>Basic Information</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Category:</strong></td>
                    <td>${escapeHtml(element.category || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Type:</strong></td>
                    <td>${escapeHtml(element.type || 'N/A')}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Story Context</h3>
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
                <tr>
                    <td width="30%"><strong>Series:</strong></td>
                    <td>${escapeHtml(element.series || 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Book:</strong></td>
                    <td>${escapeHtml(element.book || 'N/A')}</td>
                </tr>
            </table>
        </div>
        <div>
            <h3>Description</h3>
            <p>${escapeHtml(element.description || 'No description available.')}</p>
        </div>
        <div>
            <h3>Notes</h3>
            <p>${escapeHtml(element.notes || 'No notes available.')}</p>
        </div>
    `;
}

function generateWorldBuildingText(element) {
    return `Name: ${element.name || 'Unnamed Element'}
Category: ${element.category || 'N/A'}
Series: ${element.series || 'N/A'}
Description: ${element.description || 'N/A'}`;
}

// Export functions for world-building
async function exportWorldBuildingToHTML() {
    try {
        const dbName = getCurrentDatabaseName();
        const timestamp = getTimestamp();
        const filename = `${dbName}-worldbuilding_${timestamp}.html`;
        
        await exportToHTML(
            window.worldElements || [],
            generateWorldBuildingHTML,
            filename
        );
    } catch (error) {
        console.error('Error in exportWorldBuildingToHTML:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to export HTML: ${error.message}`, 'error');
        }
    }
}

async function exportWorldBuildingToTXT() {
    try {
        const dbName = getCurrentDatabaseName();
        const timestamp = getTimestamp();
        const filename = `${dbName}-worldbuilding_${timestamp}.txt`;
        
        await exportToTXT(
            window.worldElements || [],
            generateWorldBuildingText,
            filename
        );
    } catch (error) {
        console.error('Error in exportWorldBuildingToTXT:', error);
        if (window.Core && window.Core.showToast) {
            window.Core.showToast(`Failed to export TXT: ${error.message}`, 'error');
        }
    }
}

// Helper function to escape HTML special characters
function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Export the functions properly
export {
    exportCharactersToHTML,
    exportCharactersToTXT,
    exportLocationsToHTML,
    exportLocationsToTXT,
    exportPlotsToHTML,
    exportPlotsToTXT,
    exportWorldBuildingToHTML,
    exportWorldBuildingToTXT
}; 