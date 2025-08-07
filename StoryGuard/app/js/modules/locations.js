/**
 * Location management functionality for Story Database
 * Handles location creation, editing, and display
 */

// Initialize variables for pagination at the top of the file
let currentLocationPage = 1;
let locationsPerPage = 5;
let totalLocationPages = 1;

// Sorting settings
let locationSortKey = 'name';
let locationSortDirection = 'asc';

// Initialize edit state variables
window.currentEditingLocationId = null;
window.originalEditLocation = null;
window.useExistingLocationId = null;

// Initialize settings as soon as the module loads
(function initializeSettings() {
    console.log("Initializing location module settings");
    try {
        // Load pagination settings from localStorage
        loadPaginationSettings();
        // Load sort settings from localStorage
        loadSortSettings();
        console.log("Location module settings initialized successfully");
    } catch (error) {
        console.error("Error initializing location module settings:", error);
    }
})();

// Store pagination settings in localStorage
function savePaginationSettings() {
    console.log("Saving location pagination settings:", locationsPerPage, currentLocationPage);
    try {
        // Always use string values for localStorage
        localStorage.setItem('locationsPerPage', locationsPerPage.toString());
        localStorage.setItem('currentLocationPage', currentLocationPage.toString());
        
        console.log("Location pagination settings saved successfully to localStorage:", {
            locationsPerPage: locationsPerPage.toString(),
            currentLocationPage: currentLocationPage.toString()
        });
        return true;
    } catch (error) {
        console.error("Error saving location pagination settings:", error);
        return false;
    }
}

// Store sorting settings in localStorage
function saveSortSettings() {
    console.log("Saving location sort settings:", locationSortKey, locationSortDirection);
    
    try {
        // Get the current values from the window object if available
        if (window.Locations) {
            if (window.Locations.locationSortKey) {
                locationSortKey = window.Locations.locationSortKey;
            }
            if (window.Locations.locationSortDirection) {
                locationSortDirection = window.Locations.locationSortDirection;
            }
        }
        
        // Save to localStorage
        localStorage.setItem('locationSortKey', locationSortKey);
        localStorage.setItem('locationSortDirection', locationSortDirection);
        
        // Export the values to the window object
        if (window.Locations) {
            window.Locations.locationSortKey = locationSortKey;
            window.Locations.locationSortDirection = locationSortDirection;
        }
        
        console.log("Location sort settings saved successfully to localStorage");
    } catch (error) {
        console.error("Error saving location sort settings:", error);
    }
}

// Load pagination settings from localStorage
function loadPaginationSettings() {
    try {
        console.log("Loading location pagination settings from localStorage");
        const storedPerPage = localStorage.getItem('locationsPerPage');
        const storedCurrentPage = localStorage.getItem('currentLocationPage');
        
        console.log("Raw values from localStorage:", { 
            storedPerPage, 
            storedCurrentPage 
        });
        
        if (storedPerPage) {
            const parsedValue = parseInt(storedPerPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                locationsPerPage = parsedValue;
                console.log(`Successfully loaded locationsPerPage = ${parsedValue}`);
            } else {
                // Use default if value is invalid
                locationsPerPage = 5;
                localStorage.setItem('locationsPerPage', '5');
                console.log("Invalid stored value, reset to default (5)");
            }
        } else {
            // Use default if no value is stored
            locationsPerPage = 5;
            localStorage.setItem('locationsPerPage', '5');
            console.log("No stored value found, set to default (5)");
        }
        
        if (storedCurrentPage) {
            const parsedValue = parseInt(storedCurrentPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                currentLocationPage = parsedValue;
                console.log(`Successfully loaded currentLocationPage = ${parsedValue}`);
            } else {
                // Use default if value is invalid
                currentLocationPage = 1;
                localStorage.setItem('currentLocationPage', '1');
                console.log("Invalid stored value, reset to default (1)");
            }
        } else {
            // Use default if no value is stored
            currentLocationPage = 1;
            localStorage.setItem('currentLocationPage', '1');
            console.log("No stored value found, set to default (1)");
        }
        
        console.log("Final location pagination values:", { locationsPerPage, currentLocationPage });
        return true;
    } catch (error) {
        console.error("Error loading location pagination settings:", error);
        
        // Set defaults on error
        locationsPerPage = 5;
        currentLocationPage = 1;
        
        // Try to save defaults
        try {
            localStorage.setItem('locationsPerPage', '5');
            localStorage.setItem('currentLocationPage', '1');
        } catch (e) {
            console.error("Failed to save default pagination settings:", e);
        }
        
        return false;
    }
}

// Load sorting settings from localStorage
function loadSortSettings() {
    try {
        console.log("Loading location sort settings from localStorage");
        
        // Get values from localStorage
        const savedSortKey = localStorage.getItem('locationSortKey');
        const savedSortDirection = localStorage.getItem('locationSortDirection');
        
        console.log("Raw sort values from localStorage:", { savedSortKey, savedSortDirection });
        
        // Process locationSortKey
        if (savedSortKey) {
            locationSortKey = savedSortKey;
            
            // Make sure the global variable is updated too
            if (window.Locations) {
                window.Locations.locationSortKey = savedSortKey;
            }
        } else {
            // Use default value
            locationSortKey = 'name';
            localStorage.setItem('locationSortKey', locationSortKey);
        }
        
        // Process locationSortDirection
        if (savedSortDirection && (savedSortDirection === 'asc' || savedSortDirection === 'desc')) {
            locationSortDirection = savedSortDirection;
            
            // Make sure the global variable is updated too
            if (window.Locations) {
                window.Locations.locationSortDirection = savedSortDirection;
            }
        } else {
            // Use default value
            locationSortDirection = 'asc';
            localStorage.setItem('locationSortDirection', locationSortDirection);
        }
        
        console.log("Location sort settings loaded successfully:", { locationSortKey, locationSortDirection });
    } catch (error) {
        console.error("Error loading location sort settings:", error);
        // Set defaults in case of error
        locationSortKey = 'name';
        locationSortDirection = 'asc';
    }
}

// Reset location sort settings to default
function resetLocationSortSettings() {
    try {
        locationSortKey = 'name';
        locationSortDirection = 'asc';
        
        // Update localStorage
        localStorage.setItem('locationSortKey', locationSortKey);
        localStorage.setItem('locationSortDirection', locationSortDirection);
        
        // Update window object
        if (window.Locations) {
            window.Locations.locationSortKey = locationSortKey;
            window.Locations.locationSortDirection = locationSortDirection;
        }
        
        console.log("Location sort settings reset to defaults");
        return true;
    } catch (error) {
        console.error("Error resetting location sort settings:", error);
        return false;
    }
}

// Search debounce timer
let locationSearchDebounceTimer = null;

// Initialize location form
function initializeLocationForm() {
    // Initialize location type dropdown
    const typeSelect = document.getElementById('locationType');
    if (typeSelect) {
        updateLocationDropdown('locationType', locationTypes);
    }
    
    // Initialize series dropdown
    const seriesSelect = document.getElementById('locationSeries');
    if (seriesSelect) {
        updateLocationDropdown('locationSeries', seriesList);
    }
    
    // Initialize book dropdown
    const bookSelect = document.getElementById('locationBook');
    if (bookSelect) {
        updateLocationDropdown('locationBook', books);
    }
    
    // Initialize rich text editor
    initializeLocationRichTextEditor();
    
    // Initialize image upload
    initializeLocationImageUpload();
    
    // Set up form submission handler - completely bypass validation system
    const form = document.getElementById('locationForm');
    if (form) {
        form.removeEventListener('submit', handleLocationFormSubmit); // Remove any existing handlers
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
            
            console.log('Location form submitted - bypassing validation system');
            
            const submitButton = this.querySelector('button[type="submit"]');
            const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
            
            console.log(`Form submit - isEditMode: ${isEditMode}, locationId: ${submitButton?.dataset.locationId}`);
            
            // Add a direct event listener to the submit button to ensure it's working
            if (!submitButton._hasClickListener) {
                submitButton.addEventListener('click', function() {
                    console.log('Submit button clicked directly');
                });
                submitButton._hasClickListener = true;
            }
            
            // When editing a location, we need to:
            // 1. The location has already been removed from the array in editLocation
            // 2. Let the user edit it in the form
            // 3. When they submit, it will be added back to the array with changes
            if (isEditMode && submitButton.dataset.locationId) {
                const locationId = submitButton.dataset.locationId;
                console.log(`Form submit - Updating location with ID: ${locationId}`);
                
                // Use the existing ID instead of generating a new one
                window.useExistingLocationId = locationId;
                
                // Add the updated location back to the array
                handleLocationFormSubmit(e);
                
                // Reset the edit mode
                window.currentEditingLocationId = null;
                window.originalEditLocation = null;
            } else {
                // Add new location
                handleLocationFormSubmit(e);
            }
        });
    }
}

// Initialize location rich text editor
function initializeLocationRichTextEditor() {
    const locationToolbar = document.querySelectorAll('.rich-text-toolbar')[1];
    const locationEditor = document.getElementById('locationRichTextEditor');
    const locationDescField = document.getElementById('locationDescription');
    
    if (locationToolbar && locationEditor && locationDescField) {
        // Set up toolbar buttons
        locationToolbar.querySelectorAll('.rich-text-btn').forEach(button => {
            button.addEventListener('click', function() {
                const command = this.dataset.command;
                document.execCommand(command, false, null);
                
                // Update hidden textarea with HTML content
                locationDescField.value = locationEditor.innerHTML;
            });
        });
        
        // Update textarea when content changes
        locationEditor.addEventListener('input', function() {
            locationDescField.value = locationEditor.innerHTML;
        });
    }
}

// Initialize location image upload
function initializeLocationImageUpload() {
    console.log('Location image upload disabled - feature removed');
    return false;
}

// Process file function for both input and drag-drop
const processFile = async (file) => {
    // Image upload functionality has been removed
    return null;
}

// Update location dropdown
function updateLocationDropdown(type, items) {
    const dropdown = document.getElementById(type);
    if (!dropdown) return;
    
    const currentValue = dropdown.value;
    while (dropdown.options.length > 2) {
        dropdown.remove(2);
    }
    
    items.forEach(item => {
        const option = new Option(item, item);
        dropdown.add(option);
    });
    
    if (items.includes(currentValue)) {
        dropdown.value = currentValue;
    }
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
    const inputElement = document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Input`);
    const value = inputElement.value.trim();
    
    if (!value) {
        Core.showToast(`Please enter a ${type}`, 'error');
        return;
    }
    
    let itemArray;
    switch (type) {
        case 'locationType':
            itemArray = locationTypes;
            break;
        case 'locationSeries':
            itemArray = seriesList;
            break;
        case 'locationBook':
            itemArray = books;
            break;
        default:
            return;
    }
    
    if (itemArray.includes(value)) {
        Core.showToast(`${value} already exists`, 'error');
        return;
    }
    
    itemArray.push(value);
    Core.safelyStoreItem(type === 'locationSeries' ? 'series' : type === 'locationBook' ? 'books' : 'locationTypes', JSON.stringify(itemArray));
    
    updateLocationDropdown(type, itemArray);
    document.getElementById(type).value = value;
    inputElement.value = '';
    document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Form`).style.display = 'none';
    
    Core.showToast(`${value} added to ${type} list`);
    
    // Update filter dropdowns if needed
    if (type === 'locationSeries') {
        const filterDropdown = document.getElementById('filterLocationSeries');
        if (filterDropdown) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filterDropdown.appendChild(option);
        }
    } else if (type === 'locationType') {
        const filterDropdown = document.getElementById('filterLocationType');
        if (filterDropdown) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filterDropdown.appendChild(option);
        }
    }
}

// Handle location form submission
function handleLocationFormSubmit(e) {
    e.preventDefault();
    console.log('Location form submitted');
    
    // Insurance policy - if someone forgot to initialize, do it now
    if (window.currentEditingLocationId === undefined) {
        window.currentEditingLocationId = null;
        console.warn('currentEditingLocationId was undefined, reset to null');
    }
    
    // Form elements
    const locationForm = document.getElementById('locationForm');
    const locationNameInput = document.getElementById('locationName');
    const locationTypeInput = document.getElementById('locationType');
    const locationSizeInput = document.getElementById('locationSize');
    const locationSeriesInput = document.getElementById('locationSeries');
    const locationBookInput = document.getElementById('locationBook');
    const locationDescInput = document.getElementById('locationDescription');
    
    // Validate required fields
    if (!locationNameInput.value.trim()) {
        Core.showToast('Location name is required', 'error');
        return;
    }
    
    // Collect form data
    const formData = {
        name: locationNameInput.value.trim(),
        type: locationTypeInput.value.trim(),
        size: locationSizeInput.value.trim(),
        series: locationSeriesInput.value.trim(),
        book: locationBookInput.value.trim(),
        description: locationDescInput.value,
        image: null
    };
    
    // Check if this is an update or a new location
    const isUpdate = Boolean(window.currentEditingLocationId);
    console.log('Form submission - isUpdate:', isUpdate, 'currentEditingLocationId:', window.currentEditingLocationId);
    
    // Check for duplicate names - ignore the location being edited
    const currentEditingId = window.currentEditingLocationId;
    const duplicate = locations.find(loc =>
        loc.name.toLowerCase() === formData.name.toLowerCase() &&
        (!currentEditingId || loc.id !== currentEditingId)
    );

    if (duplicate) {
        Core.showToast('A location with this name already exists', 'error');
        return;
    }
    
    // Get rich text content
    const locationRichTextEditor = document.getElementById('locationRichTextEditor');
    const description = locationRichTextEditor ? locationRichTextEditor.innerHTML : formData.description;
    
    // Get tags - try different methods based on available selectors
    let tagIds = [];
    let tagsWereModified = false;
    
    // First check for tag-selector component
    const tagSelectorComponent = document.querySelector('.tag-selector[data-entity-type="location"]');
    if (tagSelectorComponent) {
        console.log('Getting tags from tag-selector component');
        const tagElements = tagSelectorComponent.querySelectorAll('.entity-tag');
        
        // If we're in edit mode and the tag-selector is empty, this means all tags were intentionally removed
        if (isUpdate && tagElements.length === 0) {
            console.log('All tags have been removed from the tag selector component');
            tagsWereModified = true;
            tagIds = []; // Keep this empty to remove all tags
        } else {
            tagElements.forEach(tagElement => {
                const tagId = tagElement.getAttribute('data-tag-id');
                if (tagId) {
                    tagIds.push(tagId);
                }
            });
            
            // If we're in edit mode, check if tags were modified
            if (isUpdate && window.originalLocationTags) {
                // Compare current tags with original tags
                const currentTags = new Set(tagIds);
                const originalTags = new Set(window.originalLocationTags);
                
                // Check if tags are different (added, removed, or changed)
                if (currentTags.size !== originalTags.size) {
                    tagsWereModified = true;
                    console.log('Tag count changed from', originalTags.size, 'to', currentTags.size);
                } else {
                    // Check if the tags are the same
                    const tagsAreSame = [...currentTags].every(tag => originalTags.has(tag));
                    tagsWereModified = !tagsAreSame;
                    if (!tagsAreSame) {
                        console.log('Tags were modified but count remains the same');
                    }
                }
            }
        }
    } else {
        // Fall back to locationTagSelector
        const tagSelector = document.getElementById('locationTagSelector');
        if (tagSelector) {
            console.log('Getting tags from locationTagSelector');
            // Check if it's a select element
            if (tagSelector.tagName === 'SELECT') {
                // Get selected options
                Array.from(tagSelector.selectedOptions).forEach(option => {
                    tagIds.push(option.value);
                });
                
                // For select elements, we can determine if tags were modified by comparing selection count
                if (isUpdate && window.originalLocationTags) {
                    tagsWereModified = tagIds.length !== window.originalLocationTags.length;
                }
            } else {
                // Otherwise try to get entity-tag elements
                const tagElements = tagSelector.querySelectorAll('.entity-tag');
                
                // If we're in edit mode and the tag container is empty, this means all tags were intentionally removed
                if (isUpdate && tagElements.length === 0) {
                    console.log('All tags have been removed from locationTagSelector');
                    tagsWereModified = true;
                    tagIds = []; // Keep this empty to remove all tags
                } else {
                    tagElements.forEach(tagElement => {
                        const tagId = tagElement.getAttribute('data-tag-id');
                        if (tagId) {
                            tagIds.push(tagId);
                        }
                    });
                    
                    // If we're in edit mode, check if tags were modified
                    if (isUpdate && window.originalLocationTags) {
                        tagsWereModified = tagIds.length !== window.originalLocationTags.length;
                    }
                }
            }
        }
    }
    
    // ONLY use original tags if tags weren't explicitly modified
    if (isUpdate && window.originalLocationTags && tagIds.length === 0 && !tagsWereModified) {
        console.log('No tags found and no tag modifications detected, using original tags:', window.originalLocationTags);
        tagIds = window.originalLocationTags;
    } else if (tagsWereModified) {
        console.log('Tags were modified, using current selection (even if empty)');
    }
    
    console.log('Final tag IDs:', tagIds);
    
    // Use the current editing ID if updating, otherwise generate a new one
    const locationId = isUpdate ? currentEditingId : Core.generateId();
    console.log('Using locationId:', locationId, isUpdate ? '(from edit)' : '(new)');

    const location = {
        id: locationId,
        name: formData.name,
        type: formData.type,
        size: formData.size,
        series: formData.series,
        book: formData.book,
        description: description,
        climate: locationForm.locationClimate.value,
        population: locationForm.locationPopulation.value,
        notes: locationForm.locationNotes.value,
        image: formData.image,
        tags: tagIds,
        createdAt: isUpdate ? window.originalEditLocation?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (isUpdate) {
            // Find the index of the original location
            const index = locations.findIndex(loc => loc.id === locationId);
            if (index !== -1) {
                // Replace the original location with the updated one
                locations[index] = location;
                Dashboard.addActivity('location', `Updated location "${location.name}"`, location.id);
                Core.showToast('Location updated successfully');
            } else {
                console.error('Attempted to update a location that does not exist:', locationId);
                // Instead of returning an error, fall back to adding as new
                locations.push(location);
                Dashboard.addActivity('location', `Added location "${location.name}"`, location.id);
                Core.showToast('Location added successfully');
            }
        } else {
            // Add new location
            locations.push(location);
            Dashboard.addActivity('location', `Added location "${location.name}"`, location.id);
            Core.showToast('Location added successfully');
        }
        
        if (!Core.safelyStoreItem('locations', JSON.stringify(locations))) {
            Core.showToast('Failed to save location changes', 'error');
            return;
        }
        
        // Reset the edit mode and form
        resetEditMode();
        
        displayLocations();
        
        // Remove any validation-related elements and classes
        locationForm.querySelectorAll('.validation-error').forEach(el => el.remove());
        locationForm.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        
        // Also remove any validation messages that might be added by the browser
        const inputs = locationForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.setCustomValidity('');
        });
        
        locationForm.reset();
        
        // Reset rich text editor
        if (locationRichTextEditor) {
            locationRichTextEditor.innerHTML = '';
        }
    } catch (error) {
        Core.showToast('Error saving location: ' + error.message, 'error');
    }
}

// Helper function to reset edit mode state
function resetEditMode() {
    console.log('Resetting edit mode, was editing:', window.currentEditingLocationId);
    
    // Reset the edit mode after successful save
    const locationForm = document.getElementById('locationForm');
    if (locationForm) {
        const submitButton = locationForm.querySelector('button[type="submit"]');
        if (submitButton) {
            console.log('Resetting button to Add Location mode');
            submitButton.textContent = 'Add Location';
            submitButton.classList.remove('update-mode');
            submitButton.dataset.editMode = 'false';
            if (submitButton.dataset.locationId) {
                delete submitButton.dataset.locationId;
            }
        } else {
            console.error('Submit button not found during reset!');
        }
    }
    
    // Reset tag selector if using tag-selector component
    const tagSelector = document.querySelector('.tag-selector[data-entity-type="location"]');
    if (tagSelector) {
        console.log('Resetting tag selector');
        tagSelector.setAttribute('data-entity-id', '');
        if (window.Tags && typeof window.Tags.createTagSelector === 'function') {
            Tags.createTagSelector('location', '', tagSelector);
        }
    }
    
    // Clear the editing state
    window.currentEditingLocationId = null;
    window.originalEditLocation = null;
    window.originalLocationTags = null;
    window.useExistingLocationId = null;
}

// Display locations
function displayLocations() {
    // Load pagination settings first to ensure we have the correct values
    loadPaginationSettings();
    
    console.log(`Starting displayLocations with pagination settings: locationsPerPage=${locationsPerPage}, currentLocationPage=${currentLocationPage}`);
    
    const locationList = document.getElementById('locationList');
    if (!locationList) return;
    
    // Clear current list
    locationList.innerHTML = '';
    
    // Get sorting parameters
    const sortKey = locationSortKey || 'name';
    const sortDirection = locationSortDirection || 'asc';
    
    // Get filter values
    const searchInput = document.getElementById('locationSearchInput');
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
    
    const seriesFilter = document.getElementById('filterLocationSeries');
    const seriesValue = seriesFilter ? seriesFilter.value : '';
    
    const typeFilter = document.getElementById('filterLocationType');
    const typeValue = typeFilter ? typeFilter.value : '';
    
    // Apply filters
    let filteredLocations = locations.filter(location => {
        const matchesSearch = !searchValue || 
                              location.name.toLowerCase().includes(searchValue) || 
                              location.description?.toLowerCase().includes(searchValue);
        
        const matchesSeries = !seriesValue || location.series === seriesValue;
        const matchesType = !typeValue || location.type === typeValue;
        
        // Check tag filter if active
        let matchesTag = true;
        if (window.currentLocationTagFilter) {
            matchesTag = location.tags && location.tags.includes(window.currentLocationTagFilter);
        }
        
        return matchesSearch && matchesSeries && matchesType && matchesTag;
    });
    
    // Sort the filtered locations
    filteredLocations.sort((a, b) => {
        let valA = a[sortKey] ? a[sortKey].toString().toLowerCase() : '';
        let valB = b[sortKey] ? b[sortKey].toString().toLowerCase() : '';
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Calculate pagination
    totalLocationPages = Math.ceil(filteredLocations.length / locationsPerPage);
    
    // Ensure current page is valid
    if (currentLocationPage > totalLocationPages && totalLocationPages > 0) {
        currentLocationPage = totalLocationPages;
        savePaginationSettings();
    }
    
    if (currentLocationPage <= 0) {
        currentLocationPage = 1;
        savePaginationSettings();
    }
    
    console.log(`Pagination calculation: currentLocationPage=${currentLocationPage}, totalPages=${totalLocationPages}, locationsPerPage=${locationsPerPage}`);
    
    // Calculate start and end indices for pagination
    const startIndex = (currentLocationPage - 1) * locationsPerPage;
    const endIndex = Math.min(startIndex + locationsPerPage, filteredLocations.length);
    
    console.log(`Pagination indices: startIndex=${startIndex}, endIndex=${endIndex}`);
    
    // Get the current page of locations
    const locationsToDisplay = filteredLocations.slice(startIndex, endIndex);
    
    // Add each location to the table
    locationsToDisplay.forEach(location => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', location.id);
        
        // Create location row HTML
        row.innerHTML = `
            <td>${location.name}</td>
            <td>${location.type || ''}</td>
            <td>${location.size || ''}</td>
            <td>${location.series || ''}</td>
            <td>${location.book || ''}</td>
            <td class="actions-column">
                <button class="view-btn" onclick="Locations.showLocationDetails('${location.id}')"><i class="fas fa-eye"></i></button>
                <button class="edit-btn" onclick="Locations.editLocation('${location.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="Locations.deleteLocation('${location.id}')"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        
        locationList.appendChild(row);
    });
    
    // Update pagination controls with a small delay to ensure the DOM is ready
    setTimeout(() => {
        try {
            UI.updatePaginationControls(filteredLocations.length, locationsPerPage, currentLocationPage, 'location');
            console.log("Pagination: Controls updated with:", {
                totalItems: filteredLocations.length,
                itemsPerPage: locationsPerPage,
                currentPage: currentLocationPage
            });
            
            // Apply the table container height class based on entries per page
            const tableContainer = document.querySelector('#locations-tab .table-container');
            if (tableContainer) {
                if (locationsPerPage > 10) {
                    tableContainer.classList.add('many-entries');
                    console.log("Added many-entries class to location table container");
                } else {
                    tableContainer.classList.remove('many-entries');
                    console.log("Removed many-entries class from location table container");
                }
            }
        } catch (error) {
            console.error("Error updating pagination controls:", error);
        }
    }, 50);
}

// Show location details
function showLocationDetails(locationId) {
    console.log(`Showing details for location: ${locationId}`);
    
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
        Core.showToast('Location not found', 'error');
        return;
    }
    
    // Prepare tags list
    let tagsHTML = '';
    if (location.tags && location.tags.length > 0) {
        const locationTags = tags.filter(tag => location.tags.includes(tag.id));
        tagsHTML = locationTags.map(tag => 
            `<span class="tag" style="background-color: ${tag.color || '#6c757d'}">${tag.name}</span>`
        ).join('');
    }
    
    // Get related characters
    const relatedCharacters = characters.filter(char => 
        char.locations && char.locations.includes(location.id)
    );
    
    let relatedCharactersHTML = '';
    if (relatedCharacters.length > 0) {
        relatedCharactersHTML = `
            <h4>Related Characters</h4>
            <ul class="related-items-list">
                ${relatedCharacters.map(char => 
                    `<li>${char.name}</li>`
                ).join('')}
            </ul>
        `;
    }
    
    // Create details HTML
    const detailsHTML = `
        <div class="location-details">            
            <div class="details-grid">
                <div class="details-section">
                    <h3>Basic Information</h3>
                    <p><strong>Type:</strong> ${location.type || 'Not specified'}</p>
                    <p><strong>Size/Scale:</strong> ${location.size || 'Not specified'}</p>
                </div>
                
                <div class="details-section">
                    <h3>Story Context</h3>
                    <p><strong>Series:</strong> ${location.series || 'Not specified'}</p>
                    <p><strong>Book:</strong> ${location.book || 'Not specified'}</p>
                </div>
                
                <div class="details-section">
                    <h3>Additional Details</h3>
                    <p><strong>Climate/Environment:</strong> ${location.climate || 'Not specified'}</p>
                    <p><strong>Population/Inhabitants:</strong> ${location.population || 'Not specified'}</p>
                    ${tagsHTML ? `
                    <div class="tags-container">
                        <strong>Tags:</strong> ${tagsHTML}
                    </div>` : ''}
                </div>
                
                <div class="details-section">
                    <h3>Description</h3>
                    <div class="rich-text-content">${location.description || 'No description available.'}</div>
                </div>
                
                <div class="details-section">
                    <h3>Notes</h3>
                    <p>${location.notes || 'No notes available.'}</p>
                </div>
                
                ${relatedCharactersHTML ? `
                <div class="details-section">
                    ${relatedCharactersHTML}
                </div>` : ''}
            </div>
            
            <div class="modal-buttons">
                <button class="edit-btn" onclick="Locations.editLocation('${location.id}')">Edit</button>
                <button class="close-btn" onclick="UI.closeModal()">Close</button>
            </div>
        </div>
    `;
    
    // Call UI.showModal with both title and content
    UI.showModal(location.name, detailsHTML, {
        maxWidth: '900px'
    });
}

// Edit location
function editLocation(locationId) {
    console.log(`Editing location with ID: ${locationId}`);
    
    // Find the location in our array
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
        Core.showToast('Location not found', 'error');
        return;
    }
    
    // Store the original location data and ID
    window.originalEditLocation = JSON.parse(JSON.stringify(location));
    window.currentEditingLocationId = locationId;
    window.originalLocationTags = location.tags ? [...location.tags] : [];
    console.log('Entering edit mode for location:', locationId);
    console.log('Original location tags:', window.originalLocationTags);
    
    // Populate the form
    const locationForm = document.getElementById('locationForm');
    if (!locationForm) {
        console.error('Location form not found');
        return;
    }
    
    // Switch to the locations tab
    const tabButtons = document.querySelectorAll('.tab-button');
    const locationsTabButton = Array.from(tabButtons).find(btn => btn.getAttribute('data-tab') === 'locations-tab');
    if (locationsTabButton) {
        locationsTabButton.click();
    }
    
    // Set form values
    const locationNameInput = document.getElementById('locationName');
    const locationTypeInput = document.getElementById('locationType');
    const locationSizeInput = document.getElementById('locationSize');
    const locationSeriesInput = document.getElementById('locationSeries');
    const locationBookInput = document.getElementById('locationBook');
    const locationClimateInput = document.getElementById('locationClimate');
    const locationPopulationInput = document.getElementById('locationPopulation');
    const locationDescInput = document.getElementById('locationDescription');
    const locationNotesInput = document.getElementById('locationNotes');
    
    if (locationNameInput) locationNameInput.value = location.name || '';
    if (locationTypeInput) locationTypeInput.value = location.type || '';
    if (locationSizeInput) locationSizeInput.value = location.size || '';
    if (locationSeriesInput) locationSeriesInput.value = location.series || '';
    if (locationBookInput) locationBookInput.value = location.book || '';
    if (locationClimateInput) locationClimateInput.value = location.climate || '';
    if (locationPopulationInput) locationPopulationInput.value = location.population || '';
    if (locationDescInput) locationDescInput.value = location.description || '';
    if (locationNotesInput) locationNotesInput.value = location.notes || '';
    
    // Set rich text editor content if available
    const locationRichTextEditor = document.getElementById('locationRichTextEditor');
    if (locationRichTextEditor && location.description) {
        locationRichTextEditor.innerHTML = location.description;
    }
    
    // Initialize tag selector for location
    const tagSelector = document.querySelector('.tag-selector[data-entity-type="location"]');
    if (tagSelector) {
        // Set the entity ID on the existing tag selector
        tagSelector.setAttribute('data-entity-id', locationId);
        
        // Use Tags.createTagSelector to properly populate tags
        if (window.Tags && typeof window.Tags.createTagSelector === 'function') {
            console.log('Using Tags.createTagSelector for location:', locationId);
            Tags.createTagSelector('location', locationId, tagSelector);
        } else {
            console.error('Tags.createTagSelector not available');
        }
    } else {
        console.log('Tag selector not found, looking for alternative elements');
        
        // Try to find alternative tag selector
        const alternativeSelector = document.getElementById('locationTagSelector');
        if (alternativeSelector) {
            console.log('Found alternative selector #locationTagSelector');
            
            // Set tags using legacy approach
            if (location.tags && Array.isArray(location.tags)) {
                try {
                    // Try to use Tags if available
                    if (window.Tags && typeof window.Tags.setSelectedTags === 'function') {
                        Tags.setSelectedTags(alternativeSelector, location.tags);
                    } else {
                        // Manual selection of tags if Tags module is not available
                        console.warn('Tags.setSelectedTags is not available - using manual tag selection');
                        
                        // Clear existing selections
                        const options = alternativeSelector.options;
                        for (let i = 0; i < options.length; i++) {
                            options[i].selected = false;
                        }
                        
                        // Select tags that exist in our location
                        for (let i = 0; i < options.length; i++) {
                            if (location.tags.includes(options[i].value)) {
                                options[i].selected = true;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error setting tags:', error);
                }
            }
        } else {
            console.error('No tag selector found for location editing');
        }
    }
    
    // Update submit button text and state - try multiple selectors to ensure we find the button
    let submitButton = locationForm.querySelector('button[type="submit"]');
    if (!submitButton) {
        submitButton = locationForm.querySelector('input[type="submit"]');
    }
    if (!submitButton) {
        submitButton = locationForm.querySelector('.submit-btn');
    }
    
    if (submitButton) {
        console.log('Setting button to Update Location mode');
        submitButton.textContent = 'Update Location';
        submitButton.value = 'Update Location'; // For input type="submit"
        submitButton.classList.add('update-mode');
        submitButton.dataset.editMode = 'true';
        submitButton.dataset.locationId = locationId;
        
        // Force a redraw of the button
        submitButton.style.display = 'none';
        setTimeout(() => {
            submitButton.style.display = '';
        }, 0);
    } else {
        console.error('Submit button not found in form! Searched all possible selectors.');
    }
    
    // Scroll to the form
    locationForm.scrollIntoView({ behavior: 'smooth' });
}

// Delete location
function deleteLocation(locationId) {
    const locationIndex = locations.findIndex(l => l.id === locationId);
    if (locationIndex === -1) {
        Core.showToast('Location not found', 'error');
        return;
    }
    
    const location = locations[locationIndex];
    const locationName = location.name;
    
    // Use our custom confirmation dialog instead of the browser's built-in confirm
    Core.showConfirmationDialog(
        `Are you sure you want to delete the location "${locationName}"?`,
        function() {
            // User confirmed deletion
            const deletedLocation = locations[locationIndex];
            locations.splice(locationIndex, 1);
            
            if (!Core.safelyStoreItem('locations', JSON.stringify(locations))) {
                // If storage fails, restore the location
                locations.splice(locationIndex, 0, deletedLocation);
                return;
            }
            
            // Add to recent activity
            Dashboard.addActivity('location', `Deleted location "${deletedLocation.name}"`, deletedLocation.id);
            
            displayLocations();
            Core.showToast('Location deleted successfully');
        },
        function() {
            // User canceled deletion
            Core.showToast('Location deletion canceled');
        }
    );
}

// Clear location form
function clearLocationForm() {
    console.log('Clearing location form');
    
    // Reset the edit mode
    resetEditMode();
    
    // Reset form values
    const locationForm = document.getElementById('locationForm');
    if (locationForm) {
        locationForm.reset();
    }
    
    // Reset individual form fields
    const fields = [
        'locationName', 'locationType', 'locationSize', 'locationSeries', 
        'locationBook', 'locationDescription', 'locationNotes', 'locationClimate', 
        'locationPopulation'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
    
    // Reset rich text editor if available
    const locationRichTextEditor = document.getElementById('locationRichTextEditor');
    if (locationRichTextEditor) {
        locationRichTextEditor.innerHTML = '';
    }
    
    // Reset tag selector - first check for the tag-selector component
    const tagSelectorComponent = document.querySelector('.tag-selector[data-entity-type="location"]');
    if (tagSelectorComponent) {
        console.log('Clearing tag-selector component');
        tagSelectorComponent.setAttribute('data-entity-id', '');
        if (window.Tags && typeof window.Tags.createTagSelector === 'function') {
            Tags.createTagSelector('location', '', tagSelectorComponent);
        }
    }
    
    // Also reset the legacy tag selector if it exists
    const tagSelector = document.getElementById('locationTagSelector');
    if (tagSelector) {
        console.log('Clearing locationTagSelector');
        try {
            if (window.Tags && typeof window.Tags.clearSelectedTags === 'function') {
                Tags.clearSelectedTags(tagSelector);
            } else {
                // Manual clearing of tags
                if (tagSelector.tagName === 'SELECT') {
                    const options = tagSelector.options;
                    for (let i = 0; i < options.length; i++) {
                        options[i].selected = false;
                    }
                } else {
                    // For non-select elements, try to clear entity-tags
                    const tagElements = tagSelector.querySelectorAll('.entity-tag');
                    tagElements.forEach(tag => tag.remove());
                }
            }
        } catch (error) {
            console.error('Error clearing tags:', error);
        }
    }
}

// Sort location table
function sortLocationTable(column) {
    if (locationSortKey === column) {
        locationSortDirection = locationSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        locationSortKey = column;
        locationSortDirection = 'asc';
    }
    
    // Save the sort settings
    saveSortSettings();
    
    // Update UI to show sort indicators
    document.querySelectorAll('#locationTable th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.getAttribute('onclick')?.includes(column)) {
            th.classList.add(`sort-${locationSortDirection}`);
        }
    });
    
    displayLocations();
}

// Location Name Generator
function generateRandomLocationName() {
    // Check if the name field is empty
    const nameField = document.getElementById('locationName');
    if (nameField && nameField.value.trim() !== '') {
        Core.showToast('Please clear the name field before generating a new name', 'error');
        return;
    }
    
    const locationType = document.getElementById('locationGeneratorType').value;
    const resultDiv = document.getElementById('generatedLocationNameResult');
    const locationNameSpan = document.getElementById('generatedLocationName');
    
    // Name lists by location type
    const namesByType = {
        city: [
            'Ironhold', 'Stormhaven', 'Highgarden', 'Riverdale', 'Oakridge', 'Westport',
            'Silverkeep', 'Dragonspire', 'Blackwater', 'Goldcrest', 'Eaglecrest', 'Shadowvale',
            'Brightstone', 'Northwatch', 'Eastmarch', 'Southshore', 'Westwind', 'Redrock',
            'Greenfield', 'Bluewater', 'Stonehaven', 'Frostpeak', 'Sunhaven', 'Moonlight',
            'Starfall', 'Dawnbreak', 'Duskwood', 'Mistral', 'Emberhold', 'Winterfell'
        ],
        town: [
            'Millfield', 'Oakdale', 'Riverbend', 'Crossroads', 'Pinewood', 'Meadowbrook',
            'Fairhaven', 'Thornhill', 'Willowdale', 'Maplewood', 'Cedarville', 'Elmwood',
            'Ashford', 'Birchwood', 'Hazelbrook', 'Lakeshore', 'Springvale', 'Summerfield',
            'Autumngrove', 'Winterhaven', 'Brookside', 'Hillcrest', 'Valleyforge', 'Ridgewood',
            'Foxhollow', 'Hawkridge', 'Deerhaven', 'Beaverdam', 'Otterbrook', 'Rabbitrun'
        ],
        village: [
            'Littleroot', 'Smallcreek', 'Tinybrook', 'Pebbleshire', 'Mosshollow', 'Dewdrop',
            'Whisperwind', 'Honeysuckle', 'Thistledown', 'Cloverfield', 'Buttercup', 'Dandelion',
            'Primrose', 'Lavender', 'Rosemary', 'Thyme', 'Sage', 'Mint',
            'Barley', 'Wheat', 'Rye', 'Oat', 'Corn', 'Apple',
            'Cherry', 'Plum', 'Peach', 'Pear', 'Grape', 'Berry'
        ],
        castle: [
            'Dragonstone', 'Eagleclaw', 'Wolfkeep', 'Lionroar', 'Ravensperch', 'Hawkwatch',
            'Griffonreach', 'Phoenixnest', 'Wyvernspire', 'Basiliskden', 'Hydrahold', 'Chimerapeak',
            'Manticorelair', 'Unicornhorn', 'Pegasuspoint', 'Centaurhooves', 'Minotaurhorn', 'Cyclopsview',
            'Gorgongaze', 'Medusastare', 'Cerberusfang', 'Harpytalon', 'Sphinxriddle', 'Krakentide',
            'Leviathandeep', 'Scyllarock', 'Charybdiswhirl', 'Sirenshore', 'Tritonwave', 'Poseidondepth'
        ],
        forest: [
            'Darkwood', 'Brightleaf', 'Silverleaf', 'Goldenbough', 'Emeraldgrove', 'Jadethicket',
            'Amberwood', 'Rubyforest', 'Sapphireglade', 'Diamondleaf', 'Pearlbranch', 'Opalgrove',
            'Whispering Pines', 'Murmuring Oaks', 'Rustling Maples', 'Sighing Willows', 'Creaking Elms', 'Groaning Ash',
            'Misty Woods', 'Foggy Thicket', 'Cloudy Grove', 'Rainy Copse', 'Sunny Glade', 'Shadowy Dell',
            'Enchanted Forest', 'Mystic Woods', 'Magical Grove', 'Arcane Thicket', 'Fey Woodland', 'Elven Forest'
        ],
        mountain: [
            'Frostpeak', 'Firetop', 'Stormcrest', 'Thunderhead', 'Cloudreach', 'Skytouch',
            'Mistcrown', 'Fogveil', 'Rainkeeper', 'Snowcap', 'Iceridge', 'Glacierspire',
            'Stonespire', 'Ironpeak', 'Steelridge', 'Coppercrest', 'Goldmine', 'Silvervein',
            'Gemheart', 'Crystalpeak', 'Diamondmine', 'Rubycrest', 'Sapphireridge', 'Emeraldpeak',
            'Dragon\'s Tooth', 'Griffin\'s Nest', 'Phoenix Roost', 'Wyvern\'s Perch', 'Roc\'s Aerie', 'Harpy\'s Nest'
        ],
        kingdom: [
            'Avaloria', 'Brenovia', 'Caldoria', 'Drakoria', 'Elendria', 'Frostholm',
            'Glimmerdale', 'Havencrest', 'Ironforge', 'Jorvik', 'Kingsreach', 'Lorimar',
            'Mysteria', 'Nordheim', 'Oakheart', 'Pendragon', 'Queenshold', 'Ravenspire',
            'Solaris', 'Thornwall', 'Umbria', 'Valoria', 'Westmark', 'Xenovia',
            'Yornheim', 'Zephyria', 'Altamar', 'Borealis', 'Celestia', 'Drakmoor'
        ],
        realm: [
            'The Eternal Empire', 'The Golden Dominion', 'The Silver Alliance', 'The Iron Confederacy', 'The Emerald Sovereignty', 'The Ruby Dynasty',
            'The Sapphire Republic', 'The Diamond Coalition', 'The Amber Hegemony', 'The Jade Concordat', 'The Obsidian Imperium', 'The Onyx Directorate',
            'The Realm of Light', 'The Domain of Darkness', 'The Kingdom of Fire', 'The Empire of Water', 'The Dominion of Earth', 'The Sovereignty of Air',
            'The Celestial Realm', 'The Infernal Domain', 'The Fey Wilds', 'The Shadow Lands', 'The Dream Realm', 'The Nightmare Domain',
            'The Astral Plane', 'The Ethereal Dimension', 'The Elemental Confluence', 'The Arcane Nexus', 'The Divine Pantheon', 'The Demonic Legion'
        ]
    };
    
    // Get name list for selected location type
    const nameList = namesByType[locationType] || namesByType.city;
    
    // Generate random location name
    const locationName = nameList[Math.floor(Math.random() * nameList.length)];
    
    // Check if location already exists
    const nameExists = locations.some(loc =>
        loc.name.toLowerCase() === locationName.toLowerCase()
    );
    
    // If name exists, try again
    if (nameExists) {
        generateRandomLocationName();
        return;
    }
    
    // Display the generated name
    locationNameSpan.textContent = locationName;
    resultDiv.style.display = 'block';
    
    // Update type field if it's empty
    const typeField = document.getElementById('locationType');
    if (typeField && typeField.value === "") {
        // Find the option with the matching value
        for (let i = 0; i < typeField.options.length; i++) {
            if (typeField.options[i].value.toLowerCase() === locationType) {
                typeField.selectedIndex = i;
                break;
            }
        }
    }
}

function acceptGeneratedLocationName() {
    const locationNameSpan = document.getElementById('generatedLocationName');
    const locationNameInput = document.getElementById('locationName');
    
    if (locationNameSpan && locationNameInput) {
        // Only set the value if the field is empty
        if (!locationNameInput.value.trim()) {
            locationNameInput.value = locationNameSpan.textContent;
        }
        
        // Hide the result div
        document.getElementById('generatedLocationNameResult').style.display = 'none';
        
        // Show success message
        Core.showToast('Location name applied successfully');
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

// Clear location tag filter
function clearLocationTagFilter() {
    window.currentLocationTagFilter = null;
    
    // Update UI to show all locations
    const tagFilterIndicator = document.getElementById('locationTagFilterIndicator');
    if (tagFilterIndicator) {
        tagFilterIndicator.style.display = 'none';
        // Remove the indicator from DOM to ensure it's recreated fresh next time
        tagFilterIndicator.remove();
    }
    
    // Reset tag cloud to ensure it's clickable again
    const tagCloud = document.getElementById('locationTagCloud');
    if (tagCloud) {
        Tags.renderTagCloud(tagCloud, (tagId) => {
            const entities = Tags.findEntitiesByTag(tagId);
            if (entities.locations && entities.locations.length > 0) {
                // Filter the location table to show only locations with this tag
                const searchInput = document.getElementById('locationSearchInput');
                if (searchInput) {
                    searchInput.value = '';
                }
                
                // Reset filters
                const filterSelects = ['filterLocationSeries', 'filterLocationType'];
                filterSelects.forEach(id => {
                    const select = document.getElementById(id);
                    if (select) {
                        select.value = '';
                    }
                });
                
                // Set the global tag filter
                window.currentLocationTagFilter = tagId;
                
                // Create a custom filter function
                const tag = tags.find(t => t.id === tagId);
                if (tag) {
                    Core.showToast(`Showing locations tagged with "${tag.name}"`);
                }
                
                // Refresh the display with the tag filter
                displayLocations();
            } else {
                Core.showToast('No locations found with this tag');
            }
        });
    }
    
    displayLocations();
}

// Change the number of locations per page
function changeLocationsPerPage(newSize) {
    console.log(`Changing locations per page from ${locationsPerPage} to ${newSize}`);
    
    // Parse the new size to ensure it's a number
    newSize = parseInt(newSize);
    
    // Validate the new size - default to 5 if invalid
    if (isNaN(newSize) || newSize <= 0) {
        console.warn(`Invalid page size: ${newSize}, defaulting to 5`);
        newSize = 5;
    }
    
    // Update the locations per page
    locationsPerPage = newSize;
    
    // Reset to page 1
    currentLocationPage = 1;
    
    // Save the settings to localStorage
    localStorage.setItem('locationsPerPage', newSize.toString());
    localStorage.setItem('currentLocationPage', '1');
    
    // Call the save function to perform any additional processing
    savePaginationSettings();
    
    console.log(`Updated page size settings: locationsPerPage=${locationsPerPage}, currentLocationPage=${currentLocationPage}`);
    
    // Update the table container class based on the new size
    const tableContainer = document.querySelector('#locations-tab .table-container');
    if (tableContainer) {
        if (newSize > 10) {
            tableContainer.classList.add('many-entries');
            console.log("Added 'many-entries' class to location table container");
        } else {
            tableContainer.classList.remove('many-entries');
            console.log("Removed 'many-entries' class from location table container");
        }
    }
    
    // Update the page size selector to reflect the current value
    const pageSizeSelector = document.getElementById('locationPageSizeSelector');
    if (pageSizeSelector) {
        // Find the matching option and select it
        for (let i = 0; i < pageSizeSelector.options.length; i++) {
            if (parseInt(pageSizeSelector.options[i].value) === newSize) {
                pageSizeSelector.selectedIndex = i;
                console.log(`Updated page size selector to index ${i} (${newSize})`);
                break;
            }
        }
    }
    
    // Refresh the display
    displayLocations();
}

// Create Locations object with all functions
window.Locations = {
    initializeLocationForm,
    initializeLocationRichTextEditor,
    initializeLocationImageUpload,
    updateLocationDropdown,
    handleDropdownChange,
    addNewItem,
    cancelNewItem,
    handleLocationFormSubmit,
    displayLocations,
    showLocationDetails,
    editLocation,
    deleteLocation,
    clearLocationForm,
    sortLocationTable,
    generateRandomLocationName,
    acceptGeneratedLocationName,
    savePaginationSettings,
    loadPaginationSettings,
    clearLocationTagFilter,
    saveSortSettings,
    loadSortSettings,
    resetLocationSortSettings,
    changeLocationsPerPage,
    resetEditMode,
    // Add these variables to the export so they're accessible from UI
    get locationsPerPage() { return locationsPerPage; },
    set locationsPerPage(value) { locationsPerPage = value; },
    get currentLocationPage() { return currentLocationPage; },
    set currentLocationPage(value) { currentLocationPage = value; }
};
