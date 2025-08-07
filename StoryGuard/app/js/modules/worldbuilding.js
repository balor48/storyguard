/**
 * World-building functionality for Story Database
 * Handles world elements, cultures, magic systems, technology, etc.
 */

// Initialize variables for pagination at the top of the file
let elementsPerPage = 5;
let currentElementPage = 1;
let totalElementPages = 1;

// Initialize settings as soon as the module loads
(function initializeSettings() {
    console.log("Initializing world building module settings");
    try {
        // Load pagination settings from localStorage
        loadPaginationSettings();
        // Load sort settings (if applicable)
        console.log("World building module settings initialized successfully");
    } catch (error) {
        console.error("Error initializing world building module settings:", error);
    }
})();

// Store pagination settings in localStorage
function savePaginationSettings() {
    console.log("Saving world building pagination settings:", elementsPerPage, currentElementPage);
    try {
        // Always use string values for localStorage
        localStorage.setItem('elementsPerPage', elementsPerPage.toString());
        localStorage.setItem('currentElementPage', currentElementPage.toString());
        
        console.log("World building pagination settings saved successfully to localStorage:", {
            elementsPerPage: elementsPerPage.toString(),
            currentElementPage: currentElementPage.toString()
        });
        return true;
    } catch (error) {
        console.error("Error saving world building pagination settings:", error);
        return false;
    }
}

// Load pagination settings from localStorage
function loadPaginationSettings() {
    try {
        console.log("Loading world building pagination settings from localStorage");
        const storedPerPage = localStorage.getItem('elementsPerPage');
        const storedCurrentPage = localStorage.getItem('currentElementPage');
        
        console.log("Raw values from localStorage:", { 
            storedPerPage, 
            storedCurrentPage 
        });
        
        if (storedPerPage) {
            const parsedValue = parseInt(storedPerPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                elementsPerPage = parsedValue;
                console.log(`Successfully loaded elementsPerPage = ${parsedValue}`);
            } else {
                // Use default if value is invalid
                elementsPerPage = 5;
                localStorage.setItem('elementsPerPage', '5');
                console.log("Invalid stored value, reset to default (5)");
            }
        } else {
            // Use default if no value is stored
            elementsPerPage = 5;
            localStorage.setItem('elementsPerPage', '5');
            console.log("No stored value found, set to default (5)");
        }
        
        if (storedCurrentPage) {
            const parsedValue = parseInt(storedCurrentPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                currentElementPage = parsedValue;
                console.log(`Successfully loaded currentElementPage = ${parsedValue}`);
            } else {
                // Use default if value is invalid
                currentElementPage = 1;
                localStorage.setItem('currentElementPage', '1');
                console.log("Invalid stored value, reset to default (1)");
            }
        } else {
            // Use default if no value is stored
            currentElementPage = 1;
            localStorage.setItem('currentElementPage', '1');
            console.log("No stored value found, set to default (1)");
        }
        
        console.log("Final world building pagination values:", { elementsPerPage, currentElementPage });
        return true;
    } catch (error) {
        console.error("Error loading world building pagination settings:", error);
        
        // Set defaults on error
        elementsPerPage = 5;
        currentElementPage = 1;
        
        // Try to save defaults
        try {
            localStorage.setItem('elementsPerPage', '5');
            localStorage.setItem('currentElementPage', '1');
        } catch (e) {
            console.error("Failed to save default pagination settings:", e);
        }
        
        return false;
    }
}

// Search debounce timer with improved implementation - expose to window for UI.js access
let worldSearchDebounceTimer = null;
// Make the timer accessible from window object
window.worldSearchDebounceTimer = worldSearchDebounceTimer;

// Current sort with memoization
let currentWorldSort = { column: 'name', direction: 'asc' };
let lastFilteredElements = null;
let lastFilterParams = null;

// World element categories
const elementCategories = [
    'Culture',
    'Race/Species',
    'Magic System',
    'Technology',
    'Religion',
    'Government',
    'History',
    'Geography',
    'Flora/Fauna',
    'Language',
    'Economy',
    'Artifact',
    'Custom'
];

// Initialize world elements
function initializeWorldBuilding() {
    // Load world elements from localStorage if not already loaded
    if (worldElements.length === 0) {
        const storedElements = localStorage.getItem('worldElements');
        if (storedElements) {
            worldElements = JSON.parse(storedElements);
        }
    }
    
    // Load pagination settings
    loadPaginationSettings();
    
    // Initialize the form
    initializeWorldElementForm();
    
    // Display world elements
    displayWorldBuilding();
    
    // Load world elements from localStorage if not already loaded
    if (worldElements.length === 0) {
        worldElements = JSON.parse(localStorage.getItem('worldElements') || '[]');
        
        // Add IDs to existing elements if they don't have one
        worldElements.forEach(element => {
            if (!element.id) {
                element.id = Core.generateId();
            }
        });
        
        // Save back to localStorage
        Core.safelyStoreItem('worldElements', JSON.stringify(worldElements));
    }
    
    // Load custom categories from localStorage if they exist
    const savedCategories = localStorage.getItem('elementCategories');
    if (savedCategories) {
        try {
            const parsedCategories = JSON.parse(savedCategories);
            if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
                // Merge saved categories with default categories, removing duplicates
                const uniqueCategories = [...new Set([...elementCategories, ...parsedCategories])];
                elementCategories.length = 0; // Clear the array
                elementCategories.push(...uniqueCategories); // Add all unique categories
            }
        } catch (error) {
            console.error('Error loading custom categories:', error);
        }
    }
}

// Handle world element form submission
function handleWorldElementFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Clear any previous validation errors
    form.querySelectorAll('.validation-error').forEach(el => el.remove());
    form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
    
    // Get form values
    const elementName = form.elementName.value.trim();
    
    // Very simple validation - just check if name is provided
    if (!elementName) {
        // Show error message
        Core.showToast('Element name is required', 'error');
        
        // Highlight the field
        form.elementName.classList.add('error-input');
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'validation-error';
        errorMsg.textContent = 'Element name is required';
        form.elementName.parentNode.appendChild(errorMsg);
        
        return;
    }
    
    // Get rich text content
    const elementDescriptionEditor = document.getElementById('worldElementRichTextEditor');
    let description = '';
    
    if (elementDescriptionEditor) {
        description = elementDescriptionEditor.innerHTML;
        // Make sure the content is transferred to the hidden textarea
        if (form.elementDescription) {
            form.elementDescription.value = description;
        }
    } else if (form.elementDescription) {
        description = form.elementDescription.value;
    }

    // Check if we're editing an existing element
    const isEditMode = window.currentEditingElementId !== null && window.currentEditingElementId !== undefined;
    
    // Use existing ID if we're updating a world element
    const elementId = isEditMode ? window.currentEditingElementId : Core.generateId();
    
    // Reset the useExistingElementId flag (for backward compatibility)
    window.useExistingElementId = null;

    // Get any pending tags from the tag selector
    const tagSelector = document.getElementById('worldElementTagSelector');
    const pendingTags = [];
    if (tagSelector) {
        const tagElements = tagSelector.querySelectorAll('.entity-tag');
        tagElements.forEach(tagElement => {
            const tagName = tagElement.querySelector('.tag-name').textContent;
            const tag = tags.find(t => t.name === tagName);
            if (tag) {
                pendingTags.push(tag.id);
            }
        });
    }
    
    // Create world element object
    const element = {
        id: elementId,
        name: elementName,
        category: form.elementCategory.value,
        series: form.elementSeries.value,
        description: description,
        relatedElements: form.relatedElements ? Array.from(form.relatedElements.selectedOptions).map(option => option.value) : [],
        tags: pendingTags,
        createdAt: isEditMode ? window.originalEditWorldElement?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    try {
        // If we're editing, remove the old element first
        if (isEditMode) {
            const elementIndex = worldElements.findIndex(e => e.id === elementId);
            if (elementIndex !== -1) {
                worldElements.splice(elementIndex, 1);
            }
        }
        
        // Add the new/updated element
        worldElements.push(element);
        
        if (!Core.safelyStoreItem('worldElements', JSON.stringify(worldElements))) {
            // If storage fails, remove the element we just added
            worldElements.pop();
            return;
        }
        
        // Add to recent activity with appropriate message
        const activityAction = isEditMode ? 'Updated' : 'Added';
        Dashboard.addActivity('worldbuilding', `${activityAction} world element "${elementName}"`, element.id);
        
        // Reset the edit mode after successful save
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton && submitButton.dataset.editMode === 'true') {
            submitButton.textContent = 'Add Element';
            submitButton.dataset.editMode = 'false';
            delete submitButton.dataset.elementId;
            
            // Clear the editing state
            window.currentEditingElementId = null;
            window.originalEditWorldElement = null;
        }
        
        // Clear any active filters to ensure the new element is visible
        const filterSeriesDropdown = document.getElementById('filterWorldSeries');
        const filterCategoryDropdown = document.getElementById('filterWorldCategory');
        if (filterSeriesDropdown) filterSeriesDropdown.value = '';
        if (filterCategoryDropdown) filterCategoryDropdown.value = '';
        
        // Reset the cached filtered elements to force a refresh
        lastFilteredElements = null;
        lastFilterParams = null;
        
        displayWorldBuilding();
        Core.showToast('World element added successfully');
        
        // Remove any validation-related elements and classes
        form.querySelectorAll('.validation-error').forEach(el => el.remove());
        form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        
        // Also remove any validation messages that might be added by the browser
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.setCustomValidity('');
        });
        
        // Reset the form
        form.reset();
        
        // Reset rich text editor
        const richTextEditor = document.getElementById('worldElementRichTextEditor');
        if (richTextEditor) {
            richTextEditor.innerHTML = '';
            // Also reset the hidden textarea
            if (form.elementDescription) {
                form.elementDescription.value = '';
            }
        }
        
        // Reset tag selector
        if (tagSelector) {
            tagSelector.setAttribute('data-entity-id', '');
            Tags.createTagSelector('worldElement', '', tagSelector);
        }
        
        // Reset related elements selection
        if (form.relatedElements) {
            Array.from(form.relatedElements.options).forEach(option => {
                option.selected = false;
            });
        }
    } catch (error) {
        Core.showToast('Error saving world element: ' + error.message, 'error');
    }
}

// Display world elements with performance optimizations
function displayWorldBuilding() {
    // Load pagination settings first to ensure we have the correct values
    loadPaginationSettings();
    
    console.log(`Starting displayWorldBuilding with pagination settings: elementsPerPage=${elementsPerPage}, currentElementPage=${currentElementPage}`);
    
    clearTimeout(worldSearchDebounceTimer);
    
    worldSearchDebounceTimer = setTimeout(() => {
        try {
            // Update the window reference
            window.worldSearchDebounceTimer = worldSearchDebounceTimer;
            const searchInput = document.getElementById('worldSearchInput');
            const searchField = document.getElementById('worldSearchField');
            const searchTerm = searchInput?.value.toLowerCase() || '';
            const searchFieldValue = searchField?.value || 'all';
            const tableBody = document.querySelector('#worldElementTable tbody');
            if (!tableBody) {
                console.error('World element table body not found');
                return;
            }
            
            // Initialize filter dropdowns if they don't have options yet
            const filterSeriesDropdown = document.getElementById('filterWorldSeries');
            const filterCategoryDropdown = document.getElementById('filterWorldCategory');
            
            // Update category filter dropdown
            if (filterCategoryDropdown && filterCategoryDropdown.options.length <= 1) {
                filterCategoryDropdown.innerHTML = '<option value="">Any Category</option>';
                elementCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    filterCategoryDropdown.appendChild(option);
                });
            }
            
            // Update series filter dropdown
            if (filterSeriesDropdown && filterSeriesDropdown.options.length <= 1) {
                filterSeriesDropdown.innerHTML = '<option value="">Any Series</option>';
                seriesList.forEach(series => {
                    const option = document.createElement('option');
                    option.value = series;
                    option.textContent = series;
                    filterSeriesDropdown.appendChild(option);
                });
            }
    
            // Advanced search filters
            const filterSeries = filterSeriesDropdown?.value || '';
            const filterCategory = filterCategoryDropdown?.value || '';
    
            // Create a filter params object for memoization check
            const currentFilterParams = {
                searchTerm,
                searchFieldValue,
                filterSeries,
                filterCategory,
                sortColumn: currentWorldSort.column,
                sortDirection: currentWorldSort.direction,
                tagFilter: window.currentWorldElementTagFilter // Add tag filter to params
            };
    
            // Check if we can use memoized results
            let filteredElements;
            if (lastFilteredElements &&
                lastFilterParams &&
                JSON.stringify(currentFilterParams) === JSON.stringify(lastFilterParams)) {
                // Use cached results if filter parameters haven't changed
                filteredElements = lastFilteredElements;
                console.log('Using cached filtered elements:', filteredElements.length);
            } else {
                // Apply filters with optimized search
                filteredElements = worldElements.filter(element => {
                    // Basic search - optimized to exit early when possible
                    let matchesSearch = false;
                    
                    if (searchFieldValue === 'all') {
                        // Only check values that are likely to contain searchable content
                        const searchableFields = ['name', 'category', 'series', 'description'];
                        matchesSearch = searchableFields.some(field =>
                            element[field] &&
                            typeof element[field] === 'string' &&
                            element[field].toLowerCase().includes(searchTerm)
                        );
                    } else {
                        matchesSearch = element[searchFieldValue] &&
                            typeof element[searchFieldValue] === 'string' &&
                            element[searchFieldValue].toLowerCase().includes(searchTerm);
                    }
                    
                    // Exit early if search doesn't match
                    if (!matchesSearch) return false;
                    
                    // Apply tag filter if it exists
                    const matchesTag = !window.currentWorldElementTagFilter ? true :
                        (element.tags && element.tags.includes(window.currentWorldElementTagFilter));
                    
                    // Exit early if tag filter doesn't match
                    if (!matchesTag) return false;
                    
                    // Advanced filters
                    return (!filterSeries || element.series === filterSeries) &&
                           (!filterCategory || element.category === filterCategory);
                });
    
                // Sort elements - only if needed
                if (currentWorldSort.column) {
                    filteredElements.sort((a, b) => {
                        const valueA = (a[currentWorldSort.column] || '').toString().toLowerCase();
                        const valueB = (b[currentWorldSort.column] || '').toString().toLowerCase();
                        
                        // Optimized comparison
                        if (!valueA && valueB) return 1;
                        if (valueA && !valueB) return -1;
                        if (!valueA && !valueB) return 0;
                        
                        // Use localeCompare for proper string comparison
                        return currentWorldSort.direction === 'asc'
                            ? valueA.localeCompare(valueB)
                            : valueB.localeCompare(valueA);
                    });
                }
                
                // Cache the results
                lastFilteredElements = filteredElements;
                lastFilterParams = currentFilterParams;
                console.log('Filtered elements:', filteredElements.length);
            }
            
            // Validate currentElementPage to make sure it's a number
            if (isNaN(currentElementPage) || currentElementPage <= 0) {
                console.warn(`Invalid currentElementPage: ${currentElementPage}, resetting to 1`);
                currentElementPage = 1;
            }
            
            // Calculate pagination
            totalElementPages = Math.max(1, Math.ceil(filteredElements.length / elementsPerPage));
            console.log(`Calculated totalElementPages: ${totalElementPages} (filtered: ${filteredElements.length}, per page: ${elementsPerPage})`);
            
            // Ensure current page is valid
            let pageChanged = false;
            if (currentElementPage > totalElementPages) {
                console.log(`Current page ${currentElementPage} exceeds total pages ${totalElementPages}, adjusting`);
                currentElementPage = totalElementPages;
                pageChanged = true;
            }
            
            if (currentElementPage < 1) {
                console.log(`Current page ${currentElementPage} is less than 1, adjusting`);
                currentElementPage = 1;
                pageChanged = true;
            }
            
            // Save settings if page changed or force save to ensure consistency
            if (pageChanged) {
                console.log(`Page adjusted to ${currentElementPage}, saving settings`);
                savePaginationSettings();
            } else {
                // Save settings even if page hasn't changed to ensure consistency
                // console.log('Saving pagination settings for consistency');
                savePaginationSettings();
            }
            
            console.log(`Pagination calculation: currentElementPage=${currentElementPage}, totalPages=${totalElementPages}, elementsPerPage=${elementsPerPage}`);
            
            // Calculate start and end indices for pagination
            const startIndex = (currentElementPage - 1) * elementsPerPage;
            const endIndex = Math.min(startIndex + elementsPerPage, filteredElements.length);
            
            console.log(`Pagination indices: startIndex=${startIndex}, endIndex=${endIndex}`);
            
            const paginatedElements = filteredElements.slice(startIndex, endIndex);
            console.log(`Paginated elements count: ${paginatedElements.length}`);
            
            // Use DocumentFragment for better performance
            const fragment = document.createDocumentFragment();
            
            if (paginatedElements.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `<td colspan="4" style="text-align: center;">No world elements found</td>`;
                fragment.appendChild(emptyRow);
            } else {
                // Pre-compile the row template for better performance
                const rowTemplate = document.createElement('template');
                
                paginatedElements.forEach((element) => {
                    const row = document.createElement('tr');
                    // Add data-id attribute to the row for easy identification
                    row.setAttribute('data-id', element.id);
                    
                    // Use textContent instead of innerHTML where possible for better performance
                    const nameCell = document.createElement('td');
                    nameCell.textContent = element.name || '';
                    
                    const categoryCell = document.createElement('td');
                    categoryCell.textContent = element.category || '';
                    
                    const seriesCell = document.createElement('td');
                    seriesCell.textContent = element.series || '';
                    
                    const actionsCell = document.createElement('td');
                    actionsCell.className = 'actions-column';
                    actionsCell.innerHTML = `
                        <button class="view-btn" onclick="WorldBuilding.showWorldElementDetails('${element.id}')" title="View"><i class="fas fa-eye"></i></button>
                        <button class="edit-btn" onclick="WorldBuilding.editWorldElement('${element.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" onclick="WorldBuilding.deleteWorldElement('${element.id}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    `;
                    
                    row.appendChild(nameCell);
                    row.appendChild(categoryCell);
                    row.appendChild(seriesCell);
                    row.appendChild(actionsCell);
                    
                    fragment.appendChild(row);
                });
            }
            
            // Clear and update table in one operation
            tableBody.innerHTML = '';
            tableBody.appendChild(fragment);
            
            // Update pagination controls with a small delay to ensure the DOM is ready
            setTimeout(() => {
                try {
                    console.log(`Updating pagination controls with: totalItems=${filteredElements.length}, itemsPerPage=${elementsPerPage}, currentPage=${currentElementPage}`);
                    
                    // Validate again before updating controls
                    if (isNaN(currentElementPage) || currentElementPage < 1) {
                        console.warn(`Invalid currentElementPage before updating controls: ${currentElementPage}, fixing to 1`);
                        currentElementPage = 1;
                    }
                    
                    if (currentElementPage > totalElementPages) {
                        console.warn(`Current page ${currentElementPage} exceeds total pages ${totalElementPages} before updating controls, fixing`);
                        currentElementPage = totalElementPages;
                    }
                    
                    // Now update the controls
                    UI.updatePaginationControls(
                        filteredElements.length, 
                        elementsPerPage, 
                        currentElementPage, 
                        'worldbuilding'
                    );
                    
                    console.log("Pagination: Controls updated successfully");
                    
                    // Apply the table container height class based on entries per page
                    const tableContainer = document.querySelector('#worldbuilding-tab .table-container');
                    if (tableContainer) {
                        if (elementsPerPage > 10) {
                            tableContainer.classList.add('many-entries');
                            console.log("Added many-entries class to world building table container");
                        } else {
                            tableContainer.classList.remove('many-entries');
                            console.log("Removed many-entries class from world building table container");
                        }
                    }
                } catch (error) {
                    console.error("Error updating pagination controls:", error);
                }
            }, 100); // Increased delay slightly for better reliability
            
            // Show tag filter indicator if a tag filter is active
            if (window.currentWorldElementTagFilter) {
                let tagFilterIndicator = document.getElementById('worldElementTagFilterIndicator');
                if (!tagFilterIndicator) {
                    const tagInfo = tags.find(t => t.id === window.currentWorldElementTagFilter);
                    if (tagInfo) {
                        tagFilterIndicator = document.createElement('div');
                        tagFilterIndicator.id = 'worldElementTagFilterIndicator';
                        tagFilterIndicator.className = 'tag-filter-indicator';
                        tagFilterIndicator.innerHTML = `
                            <span class="tag" style="background-color: ${tagInfo.color || '#6c757d'}">
                                ${tagInfo.name} <i class="fas fa-times"></i>
                            </span>
                            <button class="clear-tag-filter" onclick="WorldBuilding.clearTagFilter()">Clear Filter</button>
                        `;
                        
                        const searchContainer = document.querySelector('#worldbuilding-tab .search-container');
                        if (searchContainer) {
                            searchContainer.appendChild(tagFilterIndicator);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Critical error in displayWorldBuilding:", error);
            // Try to recover by showing an error message in the table
            try {
                const tableBody = document.querySelector('#worldElementTable tbody');
                if (tableBody) {
                    tableBody.innerHTML = `<tr><td colspan="4" class="error-cell">
                        An error occurred displaying world elements. Please refresh the page or check the console for details.
                    </td></tr>`;
                }
            } catch (e) {
                console.error("Unable to recover from display error:", e);
            }
        }
    }, 10); // Reduced debounce timer for direct calls
}

// Clear tag filter
function clearTagFilter() {
    window.currentWorldElementTagFilter = null;
    
    // Update UI to show all world elements
    const tagFilterIndicator = document.getElementById('worldElementTagFilterIndicator');
    if (tagFilterIndicator) {
        tagFilterIndicator.style.display = 'none';
        // Remove the indicator from DOM to ensure it's recreated fresh next time
        tagFilterIndicator.remove();
    }
    
    // Refresh the display with no filter
    // This will also re-render the tag cloud with proper event handlers
    displayWorldBuilding();
}

// Show world element details with performance optimizations
function showWorldElementDetails(elementId) {
    const element = worldElements.find(e => e.id === elementId);
    if (!element) {
        Core.showToast('World element not found', 'error');
        return;
    }
    
    // Create popup using document fragments for better performance
    const popup = document.createElement('div');
    popup.className = 'character-popup';
    
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = function() {
        popup.remove();
    };
    popupContent.appendChild(closeBtn);
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = element.name;
    popupContent.appendChild(title);
    
    // Create basic information section
    const basicInfoSection = document.createElement('div');
    basicInfoSection.className = 'details-section';
    
    const basicInfoTitle = document.createElement('h3');
    basicInfoTitle.textContent = 'Basic Information';
    basicInfoSection.appendChild(basicInfoTitle);
    
    const categoryPara = document.createElement('p');
    const categoryStrong = document.createElement('strong');
    categoryStrong.textContent = 'Category:';
    categoryPara.appendChild(categoryStrong);
    categoryPara.appendChild(document.createTextNode(' ' + (element.category || 'N/A')));
    basicInfoSection.appendChild(categoryPara);
    
    const seriesPara = document.createElement('p');
    const seriesStrong = document.createElement('strong');
    seriesStrong.textContent = 'Series:';
    seriesPara.appendChild(seriesStrong);
    seriesPara.appendChild(document.createTextNode(' ' + (element.series || 'N/A')));
    basicInfoSection.appendChild(seriesPara);
    
    popupContent.appendChild(basicInfoSection);
    
    // Create related elements section - with optimized lookup
    const relatedSection = document.createElement('div');
    relatedSection.className = 'details-section';
    
    const relatedTitle = document.createElement('h3');
    relatedTitle.textContent = 'Related Elements';
    relatedSection.appendChild(relatedTitle);
    
    const relatedContainer = document.createElement('div');
    relatedContainer.className = 'related-elements';
    
    // Create a map of element IDs to names for faster lookup
    if (element.relatedElements && element.relatedElements.length > 0) {
        // Only create the map if needed
        const elementMap = {};
        worldElements.forEach(e => {
            elementMap[e.id] = e.name;
        });
        
        element.relatedElements.forEach(relId => {
            if (elementMap[relId]) {
                const relatedElement = document.createElement('div');
                relatedElement.className = 'related-element';
                relatedElement.textContent = elementMap[relId];
                relatedContainer.appendChild(relatedElement);
            }
        });
    }
    
    if (!relatedContainer.hasChildNodes()) {
        relatedContainer.textContent = 'No related elements';
    }
    
    relatedSection.appendChild(relatedContainer);
    popupContent.appendChild(relatedSection);
    
    // Create tags section
    const tagsSection = document.createElement('div');
    tagsSection.className = 'details-section';
    
    const tagsTitle = document.createElement('h3');
    tagsTitle.textContent = 'Tags';
    tagsSection.appendChild(tagsTitle);
    
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'entity-tags';
    
    // Get tags - this is an external call that we can't optimize further
    const elementTags = Tags.getEntityTags('worldElement', element.id);
    
    if (elementTags && elementTags.length > 0) {
        const tagsFragment = document.createDocumentFragment();
        elementTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'entity-tag';
            tagElement.style.backgroundColor = tag.color;
            
            const tagName = document.createElement('span');
            tagName.className = 'tag-name';
            tagName.textContent = tag.name;
            
            tagElement.appendChild(tagName);
            tagsFragment.appendChild(tagElement);
        });
        tagsContainer.appendChild(tagsFragment);
    } else {
        const noTags = document.createElement('div');
        noTags.className = 'no-tags';
        noTags.textContent = 'No tags';
        tagsContainer.appendChild(noTags);
    }
    
    tagsSection.appendChild(tagsContainer);
    popupContent.appendChild(tagsSection);
    
    // Create description section
    const descriptionSection = document.createElement('div');
    descriptionSection.className = 'details-section';
    
    const descriptionTitle = document.createElement('h3');
    descriptionTitle.textContent = 'Description';
    descriptionSection.appendChild(descriptionTitle);
    
    const descriptionContent = document.createElement('div');
    // Use textContent for plain text or innerHTML for rich text
    if (element.description && element.description.includes('<')) {
        // Likely contains HTML
        descriptionContent.innerHTML = element.description;
    } else {
        // Plain text
        descriptionContent.textContent = element.description || 'No description available';
    }
    
    descriptionSection.appendChild(descriptionContent);
    popupContent.appendChild(descriptionSection);
    
    // Add all content to popup
    popup.appendChild(popupContent);
    
    // Add to document
    document.body.appendChild(popup);
}

// Store the original world element when editing (make it globally accessible)
window.originalEditWorldElement = null;

// Edit world element with performance optimizations
function editWorldElement(elementId) {
    // Check if another world element is already being edited
    Core.checkForUnsavedChanges('worldElement', function() {
        // Use a more efficient lookup with a cached element if possible
        const elementIndex = worldElements.findIndex(e => e.id === elementId);
        if (elementIndex === -1) {
            Core.showToast('World element not found', 'error');
            return;
        }
        
        const element = worldElements[elementIndex];
        
        // Store a copy of the original element for reference
        window.originalEditWorldElement = JSON.parse(JSON.stringify(element));
        
        // Set the current editing ID
        window.currentEditingElementId = element.id;
        
        const form = document.getElementById('worldElementForm');
        if (!form) return;

        // Batch DOM operations for better performance
        // Set form values in a single operation where possible
        const formUpdates = {
            'elementName': element.name || '',
            'elementCategory': element.category || '',
            'elementSeries': element.series || ''
        };
        
        // Apply all form updates at once
        Object.entries(formUpdates).forEach(([field, value]) => {
            if (form[field]) form[field].value = value;
        });
        
        // Set rich text content - only update if needed
        const elementDescriptionEditor = document.getElementById('worldElementRichTextEditor');
        if (elementDescriptionEditor) {
            // Only update if content has changed to avoid unnecessary reflows
            if (elementDescriptionEditor.innerHTML !== (element.description || '')) {
                elementDescriptionEditor.innerHTML = element.description || '';
            }
        } else if (form.elementDescription) {
            form.elementDescription.value = element.description || '';
        }
        
        // Optimize related elements selection
        if (form.relatedElements && element.relatedElements) {
            // Create a Set for faster lookups
            const relatedIds = new Set(element.relatedElements);
            
            // Use a more efficient approach for setting selections
            const options = form.relatedElements.options;
            for (let i = 0; i < options.length; i++) {
                options[i].selected = relatedIds.has(options[i].value);
            }
        }
        
        // Set up tag selector
        const worldElementTagSelector = document.getElementById('worldElementTagSelector');
        if (worldElementTagSelector) {
            worldElementTagSelector.setAttribute('data-entity-id', elementId);
            Tags.createTagSelector('worldElement', elementId, worldElementTagSelector);
        }

        // DON'T remove the element from the array here - will be done during save
        // We're just marking it as being edited via currentEditingElementId
        
        // Update UI to highlight the item being edited
        const tableBody = document.querySelector('#worldElementTable tbody');
        if (tableBody && tableBody.offsetParent !== null) {
            displayWorldBuilding();
        }
        
        // Change submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Update Element';
            submitButton.dataset.editMode = 'true';
            submitButton.dataset.elementId = elementId;
        }
        
        // Scroll form into view - use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
            form.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Delete world element with performance optimizations
function deleteWorldElement(elementId) {
    // Use a more efficient lookup
    const elementIndex = worldElements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) {
        Core.showToast('World element not found', 'error');
        return;
    }
    
    // Cache the element before removal
    const deletedElement = worldElements[elementIndex];
    const elementName = deletedElement.name;
    
    // Use native confirm dialog - simplest solution to avoid conflicts
    if (confirm(`Are you sure you want to delete the world element "${elementName}"?`)) {
        // User confirmed deletion
        // Remove element from array
        worldElements.splice(elementIndex, 1);
        
        // Batch storage operations
        try {
            // Store the updated array
            if (!Core.safelyStoreItem('worldElements', JSON.stringify(worldElements))) {
                // If storage fails, restore the element
                worldElements.splice(elementIndex, 0, deletedElement);
                Core.showToast('Failed to delete element: Storage error', 'error');
                return;
            }
            
            // Add to recent activity - only if storage succeeded
            Dashboard.addActivity('worldbuilding', `Deleted world element "${deletedElement.name}"`, deletedElement.id);
            
            // Remove the element from the table immediately using the data-id attribute
            const row = document.querySelector(`#worldElementTable tbody tr[data-id="${elementId}"]`);
            if (row) {
                row.remove();
            }
            
            // Just invalidate the cache for next time the table is displayed
            lastFilteredElements = null;
            lastFilterParams = null;
            
            // Update pagination if needed
            const tableBody = document.querySelector('#worldElementTable tbody');
            if (tableBody && tableBody.offsetParent !== null) {
                // Update pagination controls without refreshing the table
                UI.updatePaginationControls(worldElements.length, elementsPerPage, currentElementPage, 'worldElement');
            }
            
            // Update the related elements dropdown in the form
            const relatedElementsSelect = document.getElementById('relatedElements');
            if (relatedElementsSelect) {
                // Remove the deleted element from the dropdown
                const optionToRemove = relatedElementsSelect.querySelector(`option[value="${elementId}"]`);
                if (optionToRemove) {
                    optionToRemove.remove();
                }
            }
            
            // Remove the deleted element from the relatedElements array of any other elements
            worldElements.forEach(element => {
                if (element.relatedElements && element.relatedElements.includes(elementId)) {
                    // Remove the deleted element ID from the relatedElements array
                    element.relatedElements = element.relatedElements.filter(id => id !== elementId);
                }
            });
            
            // Save the updated worldElements array to localStorage
            Core.safelyStoreItem('worldElements', JSON.stringify(worldElements));
            
            // Force a complete refresh of the UI
            displayWorldBuilding();
            updateWorldBuildingVisualization();
            
            Core.showToast('World element deleted successfully');
        } catch (error) {
            // Restore element if any error occurs
            worldElements.splice(elementIndex, 0, deletedElement);
            Core.showToast(`Error deleting element: ${error.message}`, 'error');
        }
    } else {
        // User canceled deletion
        Core.showToast('World element deletion canceled');
    }
}

// Clear world element form with performance optimizations
function clearWorldElementForm() {
    const form = document.getElementById('worldElementForm');
    if (!form) return;
    
    // Check if we're in edit mode
    const submitButton = form.querySelector('button[type="submit"]');
    const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
    
    // Just clear the editing state - no need to "restore" the element since
    // we never removed it from the array in the first place
    if (isEditMode && window.currentEditingElementId) {
        console.log('clearWorldElementForm - Clearing edit mode');
        
        // Update the display to refresh the item state
        const tableBody = document.querySelector('#worldElementTable tbody');
        if (tableBody && tableBody.offsetParent !== null) {
            displayWorldBuilding();
        } else {
            // If table isn't visible, just invalidate the cache
            lastFilteredElements = null;
            lastFilterParams = null;
        }
        
        Core.showToast('Editing canceled');
    }
    
    // Clear the stored original element and editing state
    console.log('clearWorldElementForm - Clearing originalEditWorldElement and currentEditingElementId');
    window.originalEditWorldElement = null;
    window.currentEditingElementId = null; // Clear the current editing ID
    
    // Remove any validation-related elements and classes
    form.querySelectorAll('.validation-error').forEach(el => el.remove());
    form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
    
    // Also remove any validation messages that might be added by the browser
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.setCustomValidity('');
    });
    
    // Batch operations for better performance
    requestAnimationFrame(() => {
        // Reset form - this is more efficient than setting individual fields
        form.reset();
        
        // Reset rich text editor - only if it exists
        const elementDescriptionEditor = document.getElementById('worldElementRichTextEditor');
        if (elementDescriptionEditor && elementDescriptionEditor.innerHTML !== '') {
            // Only update if needed to avoid unnecessary reflows
            elementDescriptionEditor.innerHTML = '';
            
            // Also reset the hidden textarea
            if (form.elementDescription) {
                form.elementDescription.value = '';
            }
        }
        
        // Reset submit button - use a single operation
        if (submitButton) {
            // Batch DOM updates
            const updates = {
                textContent: 'Add Element',
                dataset: {
                    editMode: 'false'
                }
            };
            
            // Apply updates
            submitButton.textContent = updates.textContent;
            submitButton.dataset.editMode = updates.dataset.editMode;
            
            // Remove elementId property
            if (submitButton.dataset.elementId) {
                delete submitButton.dataset.elementId;
            }
        }
        
        // Reset tag selector
        const worldElementTagSelector = document.getElementById('worldElementTagSelector');
        if (worldElementTagSelector) {
            worldElementTagSelector.setAttribute('data-entity-id', '');
            Tags.createTagSelector('worldElement', '', worldElementTagSelector);
        }
        
        // Show toast after all DOM operations are complete
        Core.showToast('Form cleared');
    });
}

// Sort world element table with performance optimizations
function sortWorldElementTable(column) {
    // Check if we're just toggling direction (more efficient)
    const isToggle = currentWorldSort.column === column;
    
    // Update sort state
    if (isToggle) {
        currentWorldSort.direction = currentWorldSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentWorldSort = {
            column: column,
            direction: 'asc'
        };
    }
    
    // Invalidate cache since sort has changed
    lastFilteredElements = null;
    lastFilterParams = null;
    
    // Batch DOM updates in requestAnimationFrame for better performance
    requestAnimationFrame(() => {
        // Use more efficient DOM selection
        const headers = document.querySelectorAll('#worldElementTable th');
        
        // Remove all sort classes in one pass
        headers.forEach(th => {
            if (th.classList.contains('sort-asc') || th.classList.contains('sort-desc')) {
                th.classList.remove('sort-asc', 'sort-desc');
            }
        });
        
        // Add class only to the sorted column
        const activeHeader = Array.from(headers).find(th =>
            th.getAttribute('onclick')?.includes(column)
        );
        
        if (activeHeader) {
            activeHeader.classList.add(`sort-${currentWorldSort.direction}`);
        }
        
        // Update display
        displayWorldBuilding();
    });
}

// Update world-building visualization with performance optimizations
function updateWorldBuildingVisualization() {
    const container = document.getElementById('worldBuildingVisualization');
    if (!container) return;
    
    // Check if container is actually visible to avoid unnecessary work
    if (container.offsetParent === null) return;
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Get filter values
    const filterSeries = document.getElementById('filterWorldSeries')?.value || '';
    
    // Filter elements - only if needed
    const filteredElements = filterSeries
        ? worldElements.filter(element => element.series === filterSeries)
        : worldElements;
    
    // Group by category - optimized to reduce iterations
    const elementsByCategory = filteredElements.reduce((acc, element) => {
        const category = element.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(element);
        return acc;
    }, {});
    
    // Create visualization
    const vizContainer = document.createElement('div');
    vizContainer.className = 'world-building-viz-container';
    
    // Create header
    const header = document.createElement('h3');
    header.textContent = 'World-Building Elements';
    vizContainer.appendChild(header);
    
    if (Object.keys(elementsByCategory).length === 0) {
        const noData = document.createElement('div');
        noData.className = 'no-data';
        noData.textContent = 'No world-building elements available';
        vizContainer.appendChild(noData);
    } else {
        // Create world-building visualization
        const worldViz = document.createElement('div');
        worldViz.className = 'world-building-viz';
        
        // Pre-compute category colors to avoid repeated function calls
        const categoryColors = {};
        Object.keys(elementsByCategory).forEach(category => {
            categoryColors[category] = getElementCategoryColor(category);
        });
        
        // Create category sections
        Object.entries(elementsByCategory).forEach(([category, categoryElements]) => {
            // Create category section
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            
            // Create category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.setAttribute('data-category', category);
            
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = category;
            
            const categoryCount = document.createElement('span');
            categoryCount.className = 'category-count';
            categoryCount.textContent = categoryElements.length;
            
            categoryHeader.appendChild(categoryTitle);
            categoryHeader.appendChild(categoryCount);
            categorySection.appendChild(categoryHeader);
            
            // Create elements container
            const elementsContainer = document.createElement('div');
            elementsContainer.className = 'category-elements';
            
            // Create element cards
            const elementsFragment = document.createDocumentFragment();
            
            // Only process visible elements (limit to reasonable number)
            const visibleElements = categoryElements.slice(0, 20);
            
            visibleElements.forEach(element => {
                const elementCard = document.createElement('div');
                elementCard.className = 'element-card';
                elementCard.setAttribute('data-category', category);
                elementCard.onclick = function() {
                    WorldBuilding.showWorldElementDetails(element.id);
                };
                
                const elementName = document.createElement('div');
                elementName.className = 'element-name';
                elementName.textContent = element.name;
                
                const elementDescription = document.createElement('div');
                elementDescription.className = 'element-description';
                
                // Optimize description truncation
                const description = element.description || '';
                const truncated = description.length > 100
                    ? description.substring(0, 100) + '...'
                    : description;
                elementDescription.textContent = truncated;
                
                elementCard.appendChild(elementName);
                elementCard.appendChild(elementDescription);
                elementsFragment.appendChild(elementCard);
            });
            
            // Add "Show more" button if there are more elements
            if (categoryElements.length > 20) {
                const showMoreBtn = document.createElement('button');
                showMoreBtn.className = 'show-more-btn';
                showMoreBtn.textContent = `Show ${categoryElements.length - 20} more elements`;
                showMoreBtn.onclick = function() {
                    // Replace with full list when clicked
                    elementsContainer.innerHTML = '';
                    categoryElements.forEach(element => {
                        const elementCard = document.createElement('div');
                        elementCard.className = 'element-card';
                        elementCard.setAttribute('data-category', category);
                        elementCard.onclick = function() {
                            WorldBuilding.showWorldElementDetails(element.id);
                        };
                        
                        const elementName = document.createElement('div');
                        elementName.className = 'element-name';
                        elementName.textContent = element.name;
                        
                        const elementDescription = document.createElement('div');
                        elementDescription.className = 'element-description';
                        const description = element.description || '';
                        const truncated = description.length > 100
                            ? description.substring(0, 100) + '...'
                            : description;
                        elementDescription.textContent = truncated;
                        
                        elementCard.appendChild(elementName);
                        elementCard.appendChild(elementDescription);
                        elementsContainer.appendChild(elementCard);
                    });
                };
                elementsFragment.appendChild(showMoreBtn);
            }
            
            elementsContainer.appendChild(elementsFragment);
            categorySection.appendChild(elementsContainer);
            worldViz.appendChild(categorySection);
        });
        
        vizContainer.appendChild(worldViz);
    }
    
    fragment.appendChild(vizContainer);
    
    // Clear and update in one operation
    container.innerHTML = '';
    container.appendChild(fragment);
}

// Get color for element category with memoization for performance
const getElementCategoryColor = (function() {
    // Static color map that won't change
    const colorMap = {
        'Culture': '#3498db',
        'Race/Species': '#e74c3c',
        'Magic System': '#9b59b6',
        'Technology': '#2ecc71',
        'Religion': '#f39c12',
        'Government': '#1abc9c',
        'History': '#e67e22',
        'Geography': '#27ae60',
        'Flora/Fauna': '#2980b9',
        'Language': '#8e44ad',
        'Economy': '#f1c40f',
        'Artifact': '#d35400',
        'Custom': '#7f8c8d'
    };
    
    // Cache for previously computed results
    const cache = {};
    const defaultColor = '#7f8c8d';
    
    // Return memoized function
    return function(category) {
        // Return from cache if available
        if (category in cache) {
            return cache[category];
        }
        
        // Compute and cache the result
        const color = colorMap[category] || defaultColor;
        cache[category] = color;
        
        return color;
    };
})();

// Initialize world element form
function initializeWorldElementForm() {
    const form = document.getElementById('worldElementForm');
    if (!form) return;
    
    // We'll handle validation manually in the handleWorldElementFormSubmit function
    // Disable automatic validation to prevent issues with rich text content
    
    // Initialize category dropdown
    const categorySelect = form.elementCategory;
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        // Add "Add New Category" option at the top
        const newOption = document.createElement('option');
        newOption.value = "new";
        newOption.textContent = "+ Add New Category";
        categorySelect.appendChild(newOption);
        
        // Add the categories
        elementCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
    
    // Initialize series dropdown
    const seriesSelect = form.elementSeries;
    if (seriesSelect) {
        seriesSelect.innerHTML = '<option value="">Select Series</option>';
        seriesList.forEach(series => {
            const option = document.createElement('option');
            option.value = series;
            option.textContent = series;
            seriesSelect.appendChild(option);
        });
    }
    
    // Initialize related elements multi-select
    const relatedElementsSelect = form.relatedElements;
    if (relatedElementsSelect) {
        relatedElementsSelect.innerHTML = '';
        worldElements.forEach(element => {
            const option = document.createElement('option');
            option.value = element.id;
            option.textContent = element.name;
            relatedElementsSelect.appendChild(option);
        });
    }
    
    // Add form submit handler - completely bypass validation system
    form.removeEventListener('submit', handleWorldElementFormSubmit); // Remove any existing handlers
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
        console.log('World element form submit handler - bypassing validation system');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
        
        if (isEditMode && submitButton.dataset.elementId) {
            // Update existing element
            const elementId = submitButton.dataset.elementId;
            console.log(`Form submit - Updating world element with ID: ${elementId}`);
            
            // Use the existing ID instead of generating a new one
            window.useExistingElementId = elementId;
            
            // Add the updated element back to the array
            handleWorldElementFormSubmit(e);
            
            // Reset the edit mode
            window.currentEditingElementId = null;
            window.originalEditWorldElement = null;
        } else {
            // Add new element
            handleWorldElementFormSubmit(e);
        }
    });
}

// Cancel adding a new item
function cancelNewItem(type) {
    // Hide the form
    const formId = type === 'elementCategory' ? 'newElementCategoryForm' : `new${type.charAt(0).toUpperCase() + type.slice(1)}Form`;
    const formElement = document.getElementById(formId);
    if (formElement) {
        formElement.style.display = 'none';
    }
    
    // Reset the dropdown to its default value
    const dropdownElement = document.getElementById(type);
    if (dropdownElement) {
        dropdownElement.value = '';
    }
    
    // Clear the input field
    const inputId = type === 'elementCategory' ? 'newElementCategoryInput' : `new${type.charAt(0).toUpperCase() + type.slice(1)}Input`;
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.value = '';
    }
}

// Handle dropdown change for adding new items
function handleDropdownChange(type, value) {
    if (value === 'new') {
        // Show the new item form
        const formId = type === 'elementCategory' ? 'newElementCategoryForm' : `newElement${type.charAt(0).toUpperCase() + type.slice(1)}Form`;
        const formElement = document.getElementById(formId);
        if (formElement) {
            formElement.style.display = 'block';
        } else {
            console.error(`Form element with ID ${formId} not found`);
        }
    }
}

// Add a new item to a dropdown
function addNewItem(type) {
    const inputId = type === 'elementCategory' ? 'newElementCategoryInput' : `newElement${type.charAt(0).toUpperCase() + type.slice(1)}Input`;
    const inputElement = document.getElementById(inputId);
    
    if (!inputElement) {
        console.error(`Input element with ID ${inputId} not found`);
        return;
    }
    
    const value = inputElement.value.trim();
    
    if (!value) {
        Core.showToast(`Please enter a ${type} name`, 'error');
        return;
    }
    
    // Add to the appropriate array based on type
    if (type === 'elementCategory') {
        // Check if category already exists
        if (elementCategories.includes(value)) {
            Core.showToast(`Category "${value}" already exists`, 'error');
            return;
        }
        
        // Add to categories array
        elementCategories.push(value);
        
        // Save to localStorage
        localStorage.setItem('elementCategories', JSON.stringify(elementCategories));
        
        // Update the dropdown
        const select = document.getElementById(type);
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        
        // Insert before the "Add New" option
        select.insertBefore(option, select.lastChild);
        
        // Select the new option
        select.value = value;
        
        // Hide the form
        const formId = type === 'elementCategory' ? 'newElementCategoryForm' : `newElement${type.charAt(0).toUpperCase() + type.slice(1)}Form`;
        const formElement = document.getElementById(formId);
        if (formElement) {
            formElement.style.display = 'none';
        }
        
        // Clear the input
        inputElement.value = '';
        
        Core.showToast(`Category "${value}" added successfully`);
    }
}


// Create an alias for displayWorldBuilding to ensure compatibility
function displayWorldElements() {
    return displayWorldBuilding();
}

// Create WorldBuilding object with all functions
window.WorldBuilding = {
    initializeWorldBuilding,
    handleWorldElementFormSubmit,
    displayWorldBuilding,
    clearTagFilter,
    showWorldElementDetails,
    editWorldElement,
    deleteWorldElement,
    clearWorldElementForm,
    sortWorldElementTable,
    updateWorldBuildingVisualization,
    initializeWorldElementForm,
    cancelNewItem,
    handleDropdownChange,
    addNewItem,
    savePaginationSettings,
    loadPaginationSettings,
    createWorldElementDeleteButton,
    changeElementsPerPage,
    // Add these variables to the export so they're accessible from UI
    get elementsPerPage() { return elementsPerPage; },
    set elementsPerPage(value) { elementsPerPage = value; },
    get currentElementPage() { return currentElementPage; },
    set currentElementPage(value) { currentElementPage = value; }
};

// Function to create world element delete button safely
function createWorldElementDeleteButton(elementId) {
    const button = document.createElement('button');
    button.className = 'delete-btn worldbuilding-delete-btn';
    button.title = 'Delete';
    button.textContent = 'Delete';
    button.setAttribute('data-element-id', elementId);
    button.setAttribute('data-type', 'worldbuilding');
    button.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Call our delete function directly
        deleteWorldElement(elementId);
        
        return false;
    };
    return button;
}

// Change the number of world elements per page
function changeElementsPerPage(newSize) {
    console.log(`Changing world elements per page from ${elementsPerPage} to ${newSize}`);
    
    // Parse the new size to ensure it's a number
    newSize = parseInt(newSize);
    
    // Validate the new size - default to 5 if invalid
    if (isNaN(newSize) || newSize <= 0) {
        console.warn(`Invalid page size: ${newSize}, defaulting to 5`);
        newSize = 5;
    }
    
    // Update the elements per page
    elementsPerPage = newSize;
    
    // Reset to page 1
    currentElementPage = 1;
    
    // Save the settings to localStorage
    localStorage.setItem('elementsPerPage', newSize.toString());
    localStorage.setItem('currentElementPage', '1');
    
    // Call the save function to perform any additional processing
    savePaginationSettings();
    
    console.log(`Updated page size settings: elementsPerPage=${elementsPerPage}, currentElementPage=${currentElementPage}`);
    
    // Update the table container class based on the new size
    const tableContainer = document.querySelector('#worldbuilding-tab .table-container');
    if (tableContainer) {
        if (newSize > 10) {
            tableContainer.classList.add('many-entries');
            console.log("Added 'many-entries' class to world building table container");
        } else {
            tableContainer.classList.remove('many-entries');
            console.log("Removed 'many-entries' class from world building table container");
        }
    }
    
    // Update the page size selector to reflect the current value
    const pageSizeSelector = document.getElementById('worldbuildingPageSizeSelector');
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
    displayWorldBuilding();
}