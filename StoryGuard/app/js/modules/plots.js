/**
 * Plot management functionality for Story Database
 * Handles plot points, story arcs, and chapters
 */

// Pagination settings
let plotsPerPage = 10;
let currentPlotPage = 1;

// Filter variables
let selectedSeries = '';
let selectedBook = '';

// Store pagination settings in localStorage
function savePaginationSettings() {
    console.log("Saving plot pagination settings:", plotsPerPage, currentPlotPage);
    
    try {
        // Get the current values from the window object if available
        // This ensures we're using the most up-to-date values
        if (window.Plots) {
            if (window.Plots.plotsPerPage) {
                plotsPerPage = window.Plots.plotsPerPage;
            }
            if (window.Plots.currentPlotPage) {
                currentPlotPage = window.Plots.currentPlotPage;
            }
        }
        
        // Ensure we have valid values
        if (isNaN(plotsPerPage) || plotsPerPage <= 0) {
            console.warn("Invalid plotsPerPage value:", plotsPerPage);
            plotsPerPage = 10;
        }
        
        if (isNaN(currentPlotPage) || currentPlotPage <= 0) {
            console.warn("Invalid currentPlotPage value:", currentPlotPage);
            currentPlotPage = 1;
        }
        
        // Force values to be integers
        plotsPerPage = parseInt(plotsPerPage);
        currentPlotPage = parseInt(currentPlotPage);
        
        // Save to localStorage
        localStorage.setItem('plotsPerPage', plotsPerPage.toString());
        localStorage.setItem('currentPlotPage', currentPlotPage.toString());
        
        // Export the values to the window object to ensure they're accessible
        if (window.Plots) {
            window.Plots.plotsPerPage = plotsPerPage;
            window.Plots.currentPlotPage = currentPlotPage;
        }
        
        console.log("Plot pagination settings saved successfully to localStorage");
        console.log("Current localStorage values:", {
            plotsPerPage: localStorage.getItem('plotsPerPage'),
            currentPlotPage: localStorage.getItem('currentPlotPage')
        });
        
        return true;
    } catch (error) {
        console.error("Error saving plot pagination settings:", error);
        return false;
    }
}

// Load pagination settings from localStorage
function loadPaginationSettings() {
    try {
        console.log("Loading plot pagination settings from localStorage");
        
        // First, check if we have a valid value in the module variable
        console.log("Current module values:", { plotsPerPage, currentPlotPage });
        
        // Get values from localStorage
        const savedPerPage = localStorage.getItem('plotsPerPage');
        const savedCurrentPage = localStorage.getItem('currentPlotPage');
        
        console.log("Raw values from localStorage:", { savedPerPage, savedCurrentPage });
        
        // Process plotsPerPage
        if (savedPerPage) {
            const parsedValue = parseInt(savedPerPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                // Always update the value to ensure consistency
                console.log(`Setting plotsPerPage to ${parsedValue}`);
                plotsPerPage = parsedValue;
                
                // Make sure the global variable is updated too
                if (window.Plots) {
                    window.Plots.plotsPerPage = parsedValue;
                }
            } else {
                console.warn("Invalid plotsPerPage value in localStorage:", savedPerPage);
                console.log("Setting plotsPerPage to default: 10");
                plotsPerPage = 10; // Reset to default
                localStorage.setItem('plotsPerPage', '10');
            }
        } else {
            console.log("No plotsPerPage found in localStorage, setting default: 10");
            plotsPerPage = 10; // Reset to default
            localStorage.setItem('plotsPerPage', '10');
        }
        
        // Process currentPlotPage
        if (savedCurrentPage) {
            const parsedValue = parseInt(savedCurrentPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                // Always update the value to ensure consistency
                console.log(`Setting currentPlotPage to ${parsedValue}`);
                currentPlotPage = parsedValue;
                
                // Make sure the global variable is updated too
                if (window.Plots) {
                    window.Plots.currentPlotPage = parsedValue;
                }
            } else {
                console.warn("Invalid currentPlotPage value in localStorage:", savedCurrentPage);
                console.log("Setting currentPlotPage to default: 1");
                currentPlotPage = 1; // Reset to default
                localStorage.setItem('currentPlotPage', '1');
            }
        } else {
            console.log("No currentPlotPage found in localStorage, setting default: 1");
            currentPlotPage = 1; // Reset to default
            localStorage.setItem('currentPlotPage', '1');
        }
        
        // Force values to be integers
        plotsPerPage = parseInt(plotsPerPage);
        currentPlotPage = parseInt(currentPlotPage);
        
        // Export the values to the window object to ensure they're accessible
        if (window.Plots) {
            window.Plots.plotsPerPage = plotsPerPage;
            window.Plots.currentPlotPage = currentPlotPage;
        }
        
        console.log("Final plot pagination values:", { plotsPerPage, currentPlotPage });
        
        return true;
    } catch (error) {
        console.error("Error loading plot pagination settings:", error);
        // Only reset localStorage if it's not already set
        if (!localStorage.getItem('plotsPerPage')) {
            localStorage.setItem('plotsPerPage', '10');
        }
        if (!localStorage.getItem('currentPlotPage')) {
            localStorage.setItem('currentPlotPage', '1');
        }
        return false;
    }
}

// Initialize pagination settings
loadPaginationSettings();

// Search debounce timer
let plotSearchDebounceTimer = null;

// Current sort
let currentPlotSort = { column: 'title', direction: 'asc' };

// Plot types with default values
const DEFAULT_PLOT_TYPES = [
    'Main Plot',
    'Character Arc',
    'Quest',
    'Story Arc',
    'Chapter',
    'Scene',
    'Conflict',
    'Resolution',
    'Twist',
    'Subplot'
];

// Initialize plot types
function initializePlotTypes() {
    // Get plot types from localStorage or use defaults
    const storedPlotTypes = localStorage.getItem('plotTypes');
    if (storedPlotTypes) {
        try {
            const parsedTypes = JSON.parse(storedPlotTypes);
            if (Array.isArray(parsedTypes)) {
                window.plotTypes = parsedTypes;
            } else {
                console.error('Invalid plot types format in localStorage');
                window.plotTypes = ['Main Plot', 'Character Arc', 'Quest', 'Story Arc', 'Chapter', 'Other'];
            }
        } catch (error) {
            console.error('Error parsing plot types:', error);
            window.plotTypes = ['Main Plot', 'Character Arc', 'Quest', 'Story Arc', 'Chapter', 'Other'];
        }
    } else {
        // Default plot types
        window.plotTypes = ['Main Plot', 'Character Arc', 'Quest', 'Story Arc', 'Chapter', 'Other'];
        localStorage.setItem('plotTypes', JSON.stringify(window.plotTypes));
    }
    
    // After loading the plot types, make sure we have CSS styles for custom types
    initializeCustomPlotTypeStyles();
    
    return window.plotTypes;
}

// Initialize CSS styles for custom plot types
function initializeCustomPlotTypeStyles() {
    // Default types that already have styles in CSS
    const defaultTypes = ['Main Plot', 'Character Arc', 'Quest', 'Story Arc', 'Chapter', 'Other', 
                          'Subplot', 'Scene', 'Conflict', 'Resolution', 'Twist', 'Dungeon', 'Dungeontwo'];
    
    // Create a style element if it doesn't exist
    let styleElement = document.getElementById('dynamicPlotTypeStyles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'dynamicPlotTypeStyles';
        document.head.appendChild(styleElement);
    }
    
    // Clear existing styles
    styleElement.innerHTML = '';
    
    // Add styles for any custom types
    window.plotTypes.forEach(type => {
        if (!defaultTypes.includes(type)) {
            const colorHue = generateConsistentHue(type);
            const bgColor = `hsl(${colorHue}, 70%, 40%)`;
            
            styleElement.innerHTML += `
            .plot-type-${type.toLowerCase().replace(/\s+/g, '-')},
            .plot-card[data-type="${type}"],
            .plot-type-badge-${type.toLowerCase().replace(/\s+/g, '-')} {
                background-color: ${bgColor};
                color: white !important;
            }`;
        }
    });
}

// Call initialization on module load
initializePlotTypes();

// Initialize plots
function initializePlots() {
    // Load plots from localStorage if not already loaded
    if (plots.length === 0) {
        plots = JSON.parse(localStorage.getItem('plots') || '[]');
        
        // Add IDs to existing plots if they don't have one
        plots.forEach(plot => {
            if (!plot.id) {
                plot.id = Core.generateId();
            }
        });
        
        // Save back to localStorage
        Core.safelyStoreItem('plots', JSON.stringify(plots));
    }
}

// Handle plot form submission
function handlePlotFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Clear any previous validation errors
    form.querySelectorAll('.validation-error').forEach(el => el.remove());
    form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
    
    // Get form values
    const plotTitle = form.plotTitle.value.trim();
    
    // Very simple validation - just check if title is provided
    if (!plotTitle) {
        // Show error message
        Core.showToast('Plot title is required', 'error');
        
        // Highlight the field
        form.plotTitle.classList.add('error-input');
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'validation-error';
        errorMsg.textContent = 'Plot title is required';
        form.plotTitle.parentNode.appendChild(errorMsg);
        
        return;
    }

    // Get rich text content
    const plotDescriptionEditor = document.getElementById('plotRichTextEditor');
    const description = plotDescriptionEditor ? plotDescriptionEditor.innerHTML : form.plotDescription.value;

    // Use existing ID if we're updating a plot
    const plotId = window.useExistingPlotId || Core.generateId();
    // Reset the useExistingPlotId flag
    window.useExistingPlotId = null;

    // Get any pending tags from the tag selector
    console.log("[DEBUG] Looking for plot tags in the tag selector");
    const tagSelector = document.getElementById('plotTagSelector');
    const pendingTags = [];
    if (tagSelector) {
        console.log("[DEBUG] Found plot tag selector:", tagSelector);
        const tagElements = tagSelector.querySelectorAll('.entity-tag');
        console.log("[DEBUG] Found tag elements:", tagElements.length);
        
        // Examine all tag elements to see how they're structured
        tagElements.forEach((tagElement, index) => {
            console.log(`[DEBUG] Tag element ${index} structure:`, {
                hasDataTagId: !!tagElement.getAttribute('data-tag-id'),
                dataTagId: tagElement.getAttribute('data-tag-id'),
                hasTagName: !!tagElement.querySelector('.tag-name'),
                tagNameContent: tagElement.querySelector('.tag-name')?.textContent,
                innerHTML: tagElement.innerHTML,
                outerHTML: tagElement.outerHTML
            });
            
            // First try to get tag ID from data-tag-id attribute
            const tagId = tagElement.getAttribute('data-tag-id');
            if (tagId) {
                console.log(`[DEBUG] Found tag with data-tag-id: ${tagId}`);
                pendingTags.push(tagId);
            } else {
                // If that doesn't work, try to get tag name and match against tags array
                const tagName = tagElement.querySelector('.tag-name')?.textContent;
                if (tagName) {
                    console.log(`[DEBUG] Found tag with name: ${tagName}`);
                    // Look up the tag ID from the tags array using the name
                    const matchingTag = tags.find(tag => tag.name === tagName);
                    if (matchingTag) {
                        console.log(`[DEBUG] Found matching tag in tags array: ${matchingTag.id}`);
                        pendingTags.push(matchingTag.id);
                    } else {
                        console.log(`[DEBUG] No matching tag found in tags array for name: ${tagName}`);
                    }
                } else {
                    console.log(`[DEBUG] No tag name found for this element`);
                }
            }
        });
    } else {
        console.log("[DEBUG] Plot tag selector not found");
    }
    console.log("[DEBUG] Final pending plot tags:", pendingTags);

    // Create plot object
    const plot = {
        id: plotId,
        title: plotTitle,
        type: form.plotType.value,
        series: form.plotSeries.value,
        book: form.plotBook.value,
        chapter: form.plotChapter.value,
        description: description,
        characters: form.plotCharacters ? Array.from(form.plotCharacters.selectedOptions).map(option => option.value) : [],
        locations: form.plotLocations ? Array.from(form.plotLocations.selectedOptions).map(option => option.value) : [],
        tags: pendingTags,
        status: form.plotStatus.value,
        order: form.plotOrder.value ? parseInt(form.plotOrder.value) : null,
        createdAt: window.currentEditingPlotId ? window.originalEditPlot?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    try {
        plots.push(plot);
        if (!Core.safelyStoreItem('plots', JSON.stringify(plots))) {
            // If storage fails, remove the plot we just added
            plots.pop();
            return;
        }
        
        // Add to recent activity
        Dashboard.addActivity('plot', `Added plot "${plotTitle}"`, plot.id);
        
        // Reset the edit mode after successful save
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton && submitButton.dataset.editMode === 'true') {
            submitButton.textContent = 'Add Plot';
            submitButton.dataset.editMode = 'false';
            delete submitButton.dataset.plotId;
            
            // Clear the editing state
            window.currentEditingPlotId = null;
            window.originalEditPlot = null;
        }
        
        displayPlots();
        Core.showToast('Plot added successfully');
        
        // Remove any validation-related elements and classes
        form.querySelectorAll('.validation-error').forEach(el => el.remove());
        form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        
        // Also remove any validation messages that might be added by the browser
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.setCustomValidity('');
        });
        
        form.reset();
        
        // Reset rich text editor
        if (plotDescriptionEditor) {
            plotDescriptionEditor.innerHTML = '';
        }
        
        // Reset tag selector
        if (tagSelector) {
            tagSelector.setAttribute('data-entity-id', '');
            Tags.createTagSelector('plot', '', tagSelector);
        }
        
        // Reset character and location selections
        if (form.plotCharacters) {
            Array.from(form.plotCharacters.options).forEach(option => {
                option.selected = false;
            });
        }
        
        if (form.plotLocations) {
            Array.from(form.plotLocations.options).forEach(option => {
                option.selected = false;
            });
        }
    } catch (error) {
        Core.showToast('Error saving plot: ' + error.message, 'error');
    }
}

// Function to create a delete button for plots
function createPlotDeleteButton(plotId) {
    const button = document.createElement('button');
    button.className = 'delete-btn plot-delete-btn';
    button.title = 'Delete';
    button.textContent = 'Delete';
    button.setAttribute('data-plot-id', plotId);
    button.setAttribute('data-type', 'plot');
    button.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Call our delete function directly
        deletePlot(plotId);
        
        return false;
    };
    return button;
}

// Display plots
function displayPlots() {
    const plotList = document.getElementById('plotList');
    if (!plotList) return;

    // Clear existing content
    plotList.innerHTML = '';

    // Get all plots using the global plots array
    const allPlots = window.plots || [];
    
    // Apply sorting if needed
    let sortedPlots = [...allPlots];
    if (currentPlotSort && currentPlotSort.column) {
        sortedPlots.sort((a, b) => {
            // Handle null/undefined values
            const aVal = a[currentPlotSort.column] || '';
            const bVal = b[currentPlotSort.column] || '';
            
            // Compare values
            if (currentPlotSort.direction === 'asc') {
                return aVal.toString().localeCompare(bVal.toString());
            } else {
                return bVal.toString().localeCompare(aVal.toString());
            }
        });
    }
    
    // Get pagination settings
    const currentPage = parseInt(currentPlotPage || 1);
    const itemsPerPage = parseInt(plotsPerPage || 10);
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPlots = sortedPlots.slice(startIndex, startIndex + itemsPerPage);

    if (paginatedPlots.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="8" style="text-align: center;">No plots found</td>';
        plotList.appendChild(emptyRow);
    } else {
        paginatedPlots.forEach((plot) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${plot.title || ''}</td>
                <td>${plot.type || ''}</td>
                <td>${plot.series || ''}</td>
                <td>${plot.book || ''}</td>
                <td>${plot.chapter || ''}</td>
                <td>${plot.status || ''}</td>
                <td>${plot.description?.substring(0, 50) || ''}${plot.description?.length > 50 ? '...' : ''}</td>
                <td class="actions-column">
                    <button class="view-btn" onclick="Plots.showPlotDetails('${plot.id}')" title="View"><i class="fas fa-eye"></i></button>
                    <button class="edit-btn" onclick="Plots.editPlot('${plot.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn plot-delete-btn" data-plot-id="${plot.id}" data-type="plot" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            
            // Get the delete button and attach the event handler
            const deleteBtn = row.querySelector('.plot-delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    // Call our delete function directly
                    deletePlot(deleteBtn.getAttribute('data-plot-id'));
                    
                    return false;
                };
            }
            
            plotList.appendChild(row);
        });
    }

    // Update pagination controls if needed
    const paginationElement = document.getElementById('plotPagination');
    if (paginationElement) {
        const totalItems = sortedPlots.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // Basic pagination controls
        let paginationHTML = '';
        if (totalPages > 1) {
            paginationHTML += `<span>Page ${currentPage} of ${totalPages}</span>`;
            if (currentPage > 1) {
                paginationHTML += `<button onclick="Plots.changePage(${currentPage - 1})">Previous</button>`;
            }
            if (currentPage < totalPages) {
                paginationHTML += `<button onclick="Plots.changePage(${currentPage + 1})">Next</button>`;
            }
        }
        
        paginationElement.innerHTML = paginationHTML;
    }
    
    // Update the plot arc visualization
    updatePlotArcVisualization();
}

// Show plot details
function showPlotDetails(plotId) {
    const plot = plots.find(p => p.id === plotId);
    if (!plot) {
        Core.showToast('Plot not found', 'error');
        return;
    }
    
    const popup = document.createElement('div');
    popup.className = 'character-popup';
    
    // Get related characters
    const relatedCharacters = plot.characters ? plot.characters.map(charId => {
        const character = characters.find(c => c.id === charId);
        return character ? `${character.firstName} ${character.lastName}`.trim() : null;
    }).filter(Boolean) : [];
    
    // Get related locations
    const relatedLocations = plot.locations ? plot.locations.map(locId => {
        const location = locations.find(l => l.id === locId);
        return location ? location.name : null;
    }).filter(Boolean) : [];
    
    // Get tags
    const plotTags = Tags.getEntityTags('plot', plot.id);
    
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn" onclick="this.parentElement.parentElement.remove()">Close</span>
            <h2>${plot.title}</h2>
            
            <div class="details-section">
                <h3>Basic Information</h3>
                <p><strong>Type:</strong> ${plot.type || 'N/A'}</p>
                <p><strong>Status:</strong> ${plot.status || 'N/A'}</p>
                <p><strong>Order:</strong> ${plot.order || 'N/A'}</p>
            </div>

            <div class="details-section">
                <h3>Story Context</h3>
                <p><strong>Series:</strong> ${plot.series || 'N/A'}</p>
                <p><strong>Book:</strong> ${plot.book || 'N/A'}</p>
                <p><strong>Chapter:</strong> ${plot.chapter || 'N/A'}</p>
            </div>
            
            <div class="details-section">
                <h3>Related Elements</h3>
                <p><strong>Characters:</strong> ${relatedCharacters.length > 0 ? relatedCharacters.join(', ') : 'None'}</p>
                <p><strong>Locations:</strong> ${relatedLocations.length > 0 ? relatedLocations.join(', ') : 'None'}</p>
            </div>
            
            <div class="details-section">
                <h3>Tags</h3>
                <div class="entity-tags">
                    ${plotTags.length > 0 ? 
                        plotTags.map(tag => `
                            <div class="entity-tag" style="background-color: ${tag.color}">
                                <span class="tag-name">${tag.name}</span>
                            </div>
                        `).join('') : 
                        '<div class="no-tags">No tags</div>'
                    }
                </div>
            </div>

            <div class="details-section">
                <h3>Description</h3>
                <div>${plot.description || 'No description available'}</div>
            </div>
        </div>
    `;

    document.body.appendChild(popup);
}

// Store the original plot when editing (make it globally accessible)
window.originalEditPlot = null;

// Edit plot
function editPlot(plotId) {
    // Check if another plot is already being edited
    Core.checkForUnsavedChanges('plot', function() {
        const plot = plots.find(p => p.id === plotId);
        if (!plot) {
            Core.showToast('Plot not found', 'error');
            return;
        }
        
        // Store a copy of the original plot for reference
        window.originalEditPlot = JSON.parse(JSON.stringify(plot));
        
        // Set the current editing ID
        window.currentEditingPlotId = plot.id;
        
        const form = document.getElementById('plotForm');
        if (!form) return;

        form.plotTitle.value = plot.title || '';
        form.plotType.value = plot.type || '';
        form.plotSeries.value = plot.series || '';
        form.plotBook.value = plot.book || '';
        form.plotChapter.value = plot.chapter || '';
        form.plotStatus.value = plot.status || '';
        form.plotOrder.value = plot.order || '';
        
        // Set rich text content
        const plotDescriptionEditor = document.getElementById('plotRichTextEditor');
        if (plotDescriptionEditor) {
            plotDescriptionEditor.innerHTML = plot.description || '';
        } else {
            form.plotDescription.value = plot.description || '';
        }
        
        // Set character selections
        if (form.plotCharacters) {
            Array.from(form.plotCharacters.options).forEach(option => {
                option.selected = plot.characters && plot.characters.includes(option.value);
            });
        }
        
        // Set location selections
        if (form.plotLocations) {
            Array.from(form.plotLocations.options).forEach(option => {
                option.selected = plot.locations && plot.locations.includes(option.value);
            });
        }
        
        // Set up tag selector
        const plotTagSelector = document.getElementById('plotTagSelector');
        if (plotTagSelector) {
            plotTagSelector.setAttribute('data-entity-id', plotId);
            Tags.createTagSelector('plot', plotId, plotTagSelector);
        }

        // Remove the plot from the array
        const plotIndex = plots.findIndex(p => p.id === plotId);
        if (plotIndex !== -1) {
            plots.splice(plotIndex, 1);
            
            if (!Core.safelyStoreItem('plots', JSON.stringify(plots))) {
                // If storage fails, restore the plot
                plots.splice(plotIndex, 0, plot);
                return;
            }
            
            // Update UI
            displayPlots();
            
            // Change submit button text
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Update Plot';
                submitButton.dataset.editMode = 'true';
                submitButton.dataset.plotId = plotId;
            }
            
            // Scroll form into view
            form.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// Delete plot
function deletePlot(plotId) {
    const plotIndex = plots.findIndex(p => p.id === plotId);
    if (plotIndex === -1) {
        Core.showToast('Plot not found', 'error');
        return;
    }
    
    const deletedPlot = plots[plotIndex];
    const plotTitle = deletedPlot.title;
    
    // Use native confirm dialog - simplest solution to avoid conflicts
    if (confirm(`Are you sure you want to delete the plot "${plotTitle}"?`)) {
        // User confirmed deletion
        console.log(`Deleting plot: ${deletedPlot.title} (ID: ${plotId})`);
        
        // 1. Check for and update any related characters
        if (deletedPlot.characters && deletedPlot.characters.length > 0) {
            console.log(`Removing references from ${deletedPlot.characters.length} characters`);
            
            // Loop through each character referenced by this plot
            deletedPlot.characters.forEach(charId => {
                // Find the character
                const character = characters.find(c => c.id === charId);
                if (character) {
                    console.log(`Processing character: ${character.firstName} ${character.lastName}`);
                    
                    // If character has a plots array, remove this plot's ID from it
                    if (character.plots) {
                        const charPlotIndex = character.plots.indexOf(plotId);
                        if (charPlotIndex !== -1) {
                            console.log(`Removing plot reference from character`);
                            character.plots.splice(charPlotIndex, 1);
                        }
                    } else {
                        // Initialize plots array if it doesn't exist
                        character.plots = [];
                    }
                }
            });
            
            // Save updated characters to localStorage
            console.log('Saving updated characters to localStorage');
            Core.safelyStoreItem('characters', JSON.stringify(characters));
        }
        
        // 2. Check for and update any related locations
        if (deletedPlot.locations && deletedPlot.locations.length > 0) {
            console.log(`Removing references from ${deletedPlot.locations.length} locations`);
            
            // Loop through each location referenced by this plot
            deletedPlot.locations.forEach(locId => {
                // Find the location
                const location = locations.find(l => l.id === locId);
                if (location) {
                    console.log(`Processing location: ${location.name}`);
                    
                    // If location has a plots array, remove this plot's ID from it
                    if (location.plots) {
                        const locPlotIndex = location.plots.indexOf(plotId);
                        if (locPlotIndex !== -1) {
                            console.log(`Removing plot reference from location`);
                            location.plots.splice(locPlotIndex, 1);
                        }
                    } else {
                        // Initialize plots array if it doesn't exist
                        location.plots = [];
                    }
                }
            });
            
            // Save updated locations to localStorage
            console.log('Saving updated locations to localStorage');
            Core.safelyStoreItem('locations', JSON.stringify(locations));
        }
        
        // 3. Check for and update any plots that reference this plot
        console.log('Checking for plots that reference the deleted plot');
        let updatedReferencingPlots = false;
        
        plots.forEach(plot => {
            if (plot.id !== plotId) { // Skip the plot being deleted
                // Check if this plot references the deleted plot
                let updated = false;
                
                // A plot might reference another plot in these fields that could
                // contain plot IDs (if your schema supports it):
                // This is a common pattern for plot references, but modify according to your schema
                const possibleReferenceFields = ['relatedPlots', 'parentPlot', 'childPlots', 'dependencies'];
                
                possibleReferenceFields.forEach(field => {
                    if (plot[field]) {
                        if (Array.isArray(plot[field])) {
                            // If the field is an array of IDs
                            const refIndex = plot[field].indexOf(plotId);
                            if (refIndex !== -1) {
                                console.log(`Removing reference from plot ${plot.title}'s ${field} array`);
                                plot[field].splice(refIndex, 1);
                                updated = true;
                            }
                        } else if (plot[field] === plotId) {
                            // If the field is a direct reference
                            console.log(`Clearing direct reference from plot ${plot.title}'s ${field}`);
                            plot[field] = null;
                            updated = true;
                        }
                    }
                });
                
                if (updated) {
                    updatedReferencingPlots = true;
                }
            }
        });
        
        // Now remove the plot itself
        plots.splice(plotIndex, 1);
        
        // Save the updated plots array if needed
        if (updatedReferencingPlots || true) {
            console.log('Saving updated plots to localStorage');
            if (!Core.safelyStoreItem('plots', JSON.stringify(plots))) {
                // If storage fails, restore the plot
                console.error('Failed to save plots to localStorage, restoring deleted plot');
                plots.splice(plotIndex, 0, deletedPlot);
                return;
            }
        }
        
        // Add to recent activity
        Dashboard.addActivity('plot', `Deleted plot "${deletedPlot.title}"`, deletedPlot.id);
        
        displayPlots();
        Core.showToast('Plot deleted successfully');
    } else {
        // User canceled deletion
        Core.showToast('Plot deletion canceled');
    }
}

// Clear plot form
function clearPlotForm() {
    const form = document.getElementById('plotForm');
    if (!form) return;
    
    // Check if we're in edit mode
    const submitButton = form.querySelector('button[type="submit"]');
    const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
    const plotId = submitButton?.dataset.plotId;
    
    // If we're in edit mode, we need to restore the original plot
    if (isEditMode && plotId && window.originalEditPlot) {
        console.log('clearPlotForm - Restoring original plot to the array');
        
        // Add the original plot back to the array
        plots.push(window.originalEditPlot);
        
        // Save to localStorage
        Core.safelyStoreItem('plots', JSON.stringify(plots));
        
        // Update the display
        displayPlots();
        
        Core.showToast(`Editing canceled, original plot "${window.originalEditPlot.title}" restored`);
    }
    
    // Clear the stored original plot and editing state
    console.log('clearPlotForm - Clearing originalEditPlot and currentEditingPlotId');
    window.originalEditPlot = null;
    window.currentEditingPlotId = null; // Clear the current editing ID
    
    // Remove any validation-related elements and classes
    form.querySelectorAll('.validation-error').forEach(el => el.remove());
    form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
    
    // Also remove any validation messages that might be added by the browser
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.setCustomValidity('');
    });
    
    // Reset form
    form.reset();
    
    // Reset rich text editor
    const plotDescriptionEditor = document.getElementById('plotRichTextEditor');
    if (plotDescriptionEditor) {
        plotDescriptionEditor.innerHTML = '';
    }
    
    // Reset submit button
    if (submitButton) {
        submitButton.textContent = 'Add Plot';
        submitButton.dataset.editMode = 'false';
        delete submitButton.dataset.plotId;
    }
    
    // Reset tag selector
    const plotTagSelector = document.getElementById('plotTagSelector');
    if (plotTagSelector) {
        plotTagSelector.setAttribute('data-entity-id', '');
        Tags.createTagSelector('plot', '', plotTagSelector);
    }
    
    Core.showToast('Form cleared');
}

// Sort plot table
function sortPlotTable(column) {
    if (currentPlotSort.column === column) {
        currentPlotSort.direction = currentPlotSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentPlotSort = {
            column: column,
            direction: 'asc'
        };
    }
    
    document.querySelectorAll('#plotTable th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.getAttribute('onclick')?.includes(column)) {
            th.classList.add(`sort-${currentPlotSort.direction}`);
        }
    });
    
    displayPlots();
}

// Update plot arc visualization
function updatePlotArcVisualization() {
    const container = document.getElementById('plotArcVisualization');
    if (!container) return;
    
    container.innerHTML = '';

    // Filter plots based on selected series and book
    const filteredPlots = plots.filter(plot => {
        return (!selectedSeries || plot.series === selectedSeries) &&
               (!selectedBook || plot.book === selectedBook);
    });

    if (filteredPlots.length === 0) {
        container.innerHTML = '<p class="no-plots">No plots to display</p>';
        return;
    }

    // Group plots by type
    const plotsByType = {};
    filteredPlots.forEach(plot => {
        // If no type is selected or the type is empty, put in "Other"
        const type = (plot.type && plot.type.trim() !== '') ? plot.type : 'Other';
        
        if (!plotsByType[type]) {
            plotsByType[type] = [];
        }
        plotsByType[type].push(plot);
    });

    // Create type selection badges at the top
    const arcTypeSelection = document.createElement('div');
    arcTypeSelection.className = 'plot-arc-type-selection';
    
    // First create badges for the main plot types
    const mainTypes = ['Main Plot', 'Character Arc', 'Quest', 'Story Arc', 'Chapter', 'Other'];
    mainTypes.forEach(type => {
        if (plotsByType[type] && plotsByType[type].length > 0) {
            const badge = document.createElement('span');
            badge.className = `plot-type-badge plot-type-badge-${type.toLowerCase().replace(/\s+/g, '-')}`;
            badge.textContent = `${type} (${plotsByType[type].length})`;
            arcTypeSelection.appendChild(badge);
        }
    });
    
    // Add badges for any other types that exist
    Object.keys(plotsByType).forEach(type => {
        if (!mainTypes.includes(type)) {
            const badge = document.createElement('span');
            badge.className = `plot-type-badge plot-type-badge-${type.toLowerCase().replace(/\s+/g, '-')}`;
            badge.textContent = `${type} (${plotsByType[type].length})`;
            arcTypeSelection.appendChild(badge);
        }
    });
    
    container.appendChild(arcTypeSelection);

    // Create the main container
    const arcContainer = document.createElement('div');
    arcContainer.className = 'plot-arc-container';

    // Process each plot type
    Object.keys(plotsByType).forEach(type => {
        const plotSection = document.createElement('div');
        plotSection.className = 'plot-section';
        
        // Create the section header (colored bar)
        const typeHeader = document.createElement('div');
        typeHeader.className = `plot-type-header plot-type-${type.toLowerCase().replace(/\s+/g, '-')}`;
        typeHeader.textContent = `${type}`;
        plotSection.appendChild(typeHeader);
        
        // Sort plots by order within their type
        plotsByType[type].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Create the cards container
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'plot-cards-container';
        
        // Add each plot as a card
        plotsByType[type].forEach(plot => {
            const plotCard = document.createElement('div');
            plotCard.className = 'plot-card';
            // Set a data-type attribute to enable styling based on plot type
            plotCard.setAttribute('data-type', type);
            // Add CSS class based on type for backwards compatibility
            plotCard.classList.add(`plot-type-${type.toLowerCase().replace(/\s+/g, '-')}`);
            plotCard.textContent = plot.title;
            
            // Add click handler to show details
            plotCard.addEventListener('click', () => {
                showPlotDetails(plot.id);
            });
            
            cardsContainer.appendChild(plotCard);
        });
        
        plotSection.appendChild(cardsContainer);
        arcContainer.appendChild(plotSection);
    });

    container.appendChild(arcContainer);
}

// Helper function to convert plot type for CSS class
function getPlotTypeClass(type) {
    // Convert to lowercase and replace spaces with hyphens
    return type.toLowerCase().replace(/\s+/g, '-');
}

// Initialize plot form
function initializePlotForm() {
    const form = document.getElementById('plotForm');
    if (!form) return;
    
    // Initialize plot type dropdown
    const typeSelect = form.plotType;
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Select Type</option><option value="new">+ Add New Type</option>';
        window.plotTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    }
    
    // Initialize series dropdown
    const seriesSelect = form.plotSeries;
    if (seriesSelect) {
        seriesSelect.innerHTML = '<option value="">Select Series</option>';
        seriesList.forEach(series => {
            const option = document.createElement('option');
            option.value = series;
            option.textContent = series;
            seriesSelect.appendChild(option);
        });
    }
    
    // Initialize book dropdown
    const bookSelect = form.plotBook;
    if (bookSelect) {
        bookSelect.innerHTML = '<option value="">Select Book</option>';
        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book;
            option.textContent = book;
            bookSelect.appendChild(option);
        });
    }
    
    // Initialize character multi-select
    const characterSelect = form.plotCharacters;
    if (characterSelect) {
        characterSelect.innerHTML = '';
        
        // Create a copy of the characters array and sort it alphabetically by name
        const sortedCharacters = [...characters].sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        sortedCharacters.forEach(character => {
            const option = document.createElement('option');
            option.value = character.id;
            option.textContent = `${character.firstName} ${character.lastName}`.trim();
            characterSelect.appendChild(option);
        });
    }
    
    // Initialize location multi-select
    const locationSelect = form.plotLocations;
    if (locationSelect) {
        locationSelect.innerHTML = '';
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.name;
            locationSelect.appendChild(option);
        });
    }
    
    // Initialize status dropdown
    const statusSelect = form.plotStatus;
    if (statusSelect) {
        statusSelect.innerHTML = '<option value="">Select Status</option>';
        ['Planned', 'In Progress', 'Completed', 'Revised', 'Cut'].forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });
    }
    
    // Add form submit handler - completely bypass validation system
    form.removeEventListener('submit', handlePlotFormSubmit); // Remove any existing handlers
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear any validation errors before processing the form
        form.querySelectorAll('.validation-error').forEach(el => el.remove());
        form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        
        // Clear any browser validation messages
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.setCustomValidity('');
        });
        
        // Disable HTML5 validation
        form.setAttribute('novalidate', 'novalidate');
        
        // Log that we're handling the form submission
        console.log('Plot form submit handler - bypassing validation system');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
        
        if (isEditMode && submitButton.dataset.plotId) {
            // Update existing plot
            const plotId = submitButton.dataset.plotId;
            console.log(`Form submit - Updating plot with ID: ${plotId}`);
            
            // Use the existing ID instead of generating a new one
            window.useExistingPlotId = plotId;
            
            // Add the updated plot back to the array
            handlePlotFormSubmit(e);
            
            // Reset the edit mode
            window.currentEditingPlotId = null;
            window.originalEditPlot = null;
        } else {
            // Add new plot
            handlePlotFormSubmit(e);
        }
    });
}

// Handle dropdown change
function handleDropdownChange(type, value) {
    if (value === 'new') {
        document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Form`).style.display = 'block';
    } else {
        document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Form`).style.display = 'none';
    }
}

// Add new item to dropdown
function addNewItem(type) {
    // Get the appropriate input and arrays based on the type
    let inputElement, itemArray;
    
    if (type === 'plotType') {
        inputElement = document.getElementById('newPlotTypeInput');
        itemArray = window.plotTypes;
    } else {
        // For other types like series, book, etc.
        inputElement = document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Input`);
        
        switch (type) {
            case 'plotSeries':
                itemArray = seriesList;
                break;
            case 'plotBook':
                itemArray = books;
                break;
            default:
                return;
        }
    }
    
    // Get the value
    const value = inputElement.value.trim();
    
    if (!value) {
        Core.showToast(`Please enter a ${type.replace('plot', '').toLowerCase()}`, 'error');
        return;
    }
    
    // Check for duplicates
    if (itemArray.includes(value)) {
        Core.showToast(`${value} already exists`, 'error');
        return;
    }
    
    // Add the new value
    itemArray.push(value);
    
    // Save to localStorage based on type
    if (type === 'plotType') {
        localStorage.setItem('plotTypes', JSON.stringify(itemArray));
        
        // For plot types, we need to add CSS for styling in both light and dark modes
        // Add a style element to the head if it doesn't exist yet
        let styleElement = document.getElementById('dynamicPlotTypeStyles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dynamicPlotTypeStyles';
            document.head.appendChild(styleElement);
        }
        
        // Generate a consistent color for this new type based on its name
        const colorHue = generateConsistentHue(value);
        const bgColor = `hsl(${colorHue}, 70%, 40%)`;
        
        // Add CSS rules for this new plot type
        styleElement.innerHTML += `
        .plot-type-${value.toLowerCase().replace(/\s+/g, '-')},
        .plot-card[data-type="${value}"],
        .plot-type-badge-${value.toLowerCase().replace(/\s+/g, '-')} {
            background-color: ${bgColor};
            color: white !important;
        }`;
    } else {
        // For other types
        const storageKey = type === 'plotSeries' ? 'series' : type.replace('plot', '').toLowerCase() + 's';
        Core.safelyStoreItem(storageKey, JSON.stringify(itemArray));
    }
    
    // Update the dropdown
    const dropdown = document.getElementById(type);
    if (dropdown) {
        // Create and add the new option
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        
        // Insert before the last option if it's "Add New"
        const lastOption = dropdown.querySelector('option[value="new"]');
        if (lastOption) {
            dropdown.insertBefore(option, lastOption);
        } else {
            dropdown.appendChild(option);
        }
        
        // Select the new value
        dropdown.value = value;
    }
    
    // Hide the form and clear the input
    inputElement.value = '';
    document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Form`).style.display = 'none';
    
    // Show success toast
    Core.showToast(`${value} added successfully`);
    
    // Update visualization if needed
    if (type === 'plotType') {
        updatePlotArcVisualization();
    }
}

// Generate a consistent hue value (0-360) based on a string
function generateConsistentHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

// Clear tag filter
function clearTagFilter() {
    window.currentPlotTagFilter = null;
    
    // Update UI to show all plots
    const tagFilterIndicator = document.getElementById('plotTagFilterIndicator');
    if (tagFilterIndicator) {
        tagFilterIndicator.style.display = 'none';
        // Remove the indicator from DOM to ensure it's recreated fresh next time
        tagFilterIndicator.remove();
    }
    
    // Reset tag cloud to ensure it's clickable again
    const tagCloud = document.getElementById('plotTagCloud');
    if (tagCloud) {
        Tags.renderTagCloud(tagCloud, (tagId) => {
            const entities = Tags.findEntitiesByTag(tagId);
            if (entities.plots && entities.plots.length > 0) {
                // Filter the plot table to show only plots with this tag
                const searchInput = document.getElementById('plotSearchInput');
                if (searchInput) {
                    searchInput.value = '';
                }
                
                // Reset filters
                const filterSelects = ['filterPlotSeries', 'filterPlotBook', 'filterPlotType', 'filterPlotStatus'];
                filterSelects.forEach(id => {
                    const select = document.getElementById(id);
                    if (select) {
                        select.value = '';
                    }
                });
                
                // Set the global tag filter
                window.currentPlotTagFilter = tagId;
                
                // Create a custom filter function
                const tag = tags.find(t => t.id === tagId);
                if (tag) {
                    Core.showToast(`Showing plots tagged with "${tag.name}"`);
                }
                
                // Refresh the display with the tag filter
                displayPlots();
            } else {
                Core.showToast('No plots found with this tag');
            }
        });
    }
    
    displayPlots();
}

// Change page in pagination
function changePage(newPage) {
    // Update current page
    currentPlotPage = newPage;
    
    // Save pagination settings
    savePaginationSettings();
    
    // Refresh the display
    displayPlots();
}

// Function to show Add New Plot Type dialog
function showAddPlotTypeDialog() {
    // Remove any existing dialog
    const existingDialog = document.getElementById('addPlotTypeDialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // Create the dialog container
    const dialogContainer = document.createElement('div');
    dialogContainer.className = 'modal';
    dialogContainer.id = 'addPlotTypeDialog';
    dialogContainer.style.display = 'block';
    
    // Create the modal content
    dialogContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add New Plot Type</h3>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label for="newPlotTypeInput">New Plot Type</label>
                    <input type="text" id="newPlotTypeInput" placeholder="Enter new plot type" class="form-control">
                    <div id="newPlotTypeError" class="validation-error" style="display: none; color: #dc3545; margin-top: 5px;"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="savePlotTypeBtn" class="primary-btn">Add</button>
                <button id="cancelPlotTypeBtn" class="secondary-btn">Cancel</button>
            </div>
        </div>
    `;
    
    // Append the dialog to the body
    document.body.appendChild(dialogContainer);
    
    // Get references to elements
    const closeBtn = dialogContainer.querySelector('.close-btn');
    const saveBtn = dialogContainer.querySelector('#savePlotTypeBtn');
    const cancelBtn = dialogContainer.querySelector('#cancelPlotTypeBtn');
    const inputField = dialogContainer.querySelector('#newPlotTypeInput');
    
    // Focus the input field
    setTimeout(() => {
        inputField.focus();
    }, 100);
    
    // Add event listeners
    closeBtn.addEventListener('click', () => {
        dialogContainer.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
        dialogContainer.remove();
    });
    
    saveBtn.addEventListener('click', saveNewPlotType);
    
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveNewPlotType();
        }
    });
    
    // Close when clicking outside the modal content
    dialogContainer.addEventListener('click', (e) => {
        if (e.target === dialogContainer) {
            dialogContainer.remove();
        }
    });
    
    function saveNewPlotType() {
        const newType = inputField.value.trim();
        const errorElem = document.getElementById('newPlotTypeError');
        
        // Validate
        if (!newType) {
            errorElem.textContent = 'Plot type cannot be empty';
            errorElem.style.display = 'block';
            return;
        }
        
        // Check for duplicates
        if (window.plotTypes.some(type => type.toLowerCase() === newType.toLowerCase())) {
            errorElem.textContent = 'This plot type already exists';
            errorElem.style.display = 'block';
            return;
        }
        
        // Add the new type
        window.plotTypes.push(newType);
        
        // Save to localStorage
        try {
            localStorage.setItem('plotTypes', JSON.stringify(window.plotTypes));
            console.log(`Added new plot type: ${newType}`);
            
            // Update the dropdown
            const typeSelect = document.getElementById('plotType');
            if (typeSelect) {
                // Remove the "+ Add New Type" option temporarily
                const addNewOption = typeSelect.querySelector('option[value="new"]');
                if (addNewOption) {
                    addNewOption.remove();
                }
                
                // Add the new type
                const option = document.createElement('option');
                option.value = newType;
                option.textContent = newType;
                typeSelect.appendChild(option);
                
                // Re-add the "+ Add New Type" option
                const newOption = document.createElement('option');
                newOption.value = 'new';
                newOption.textContent = '+ Add New Type';
                typeSelect.appendChild(newOption);
                
                // Select the new type
                typeSelect.value = newType;
            }
            
            // Show success message
            Core.showToast(`Added new plot type: ${newType}`);
            
            // Close the dialog
            dialogContainer.remove();
            
            // Update the visualization if needed
            updatePlotArcVisualization();
        } catch (error) {
            console.error('Error saving plot types:', error);
            errorElem.textContent = 'Error saving new plot type. Please try again.';
            errorElem.style.display = 'block';
        }
    }
}

// Cancel adding a new item
function cancelNewItem(type) {
    // Hide the form
    document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Form`).style.display = 'none';
    
    // Reset the dropdown to its default value
    document.getElementById(type).value = '';
    
    // Clear the input field
    document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Input`).value = '';
}

// Export plots functions
window.Plots = {
    initializePlots,
    displayPlots,
    handlePlotFormSubmit,
    showPlotDetails,
    editPlot,
    deletePlot,
    clearPlotForm,
    sortPlotTable,
    updatePlotArcVisualization,
    getPlotTypeClass,
    initializePlotForm,
    plotsPerPage,
    currentPlotPage,
    plotTypes,
    savePaginationSettings,
    loadPaginationSettings,
    cancelNewItem,
    clearTagFilter,
    createPlotDeleteButton,
    changePage,
    showAddPlotTypeDialog,
    handleDropdownChange,
    addNewItem,
    generateConsistentHue,
    initializeCustomPlotTypeStyles
};