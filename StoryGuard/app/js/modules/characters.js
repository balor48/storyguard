/**
 * Character management functionality for Story Database
 * Handles character creation, editing, and display
 */

// Pagination settings
let charactersPerPage = 10;
let currentCharacterPage = 1;

// Default titles to use if none are found in localStorage
const DEFAULT_TITLES = [
    "Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Prof.", "Sir", "Lady", 
    "Rev.", "Captain", "Lieutenant", "Sergeant", "Master", "Lord",
    "Madam", "Father", "Mother", "Brother", "Sister", "King", "Queen",
    "Prince", "Princess", "Duke", "Duchess", "Baron", "Baroness"
];

// Default roles to use if none are found in localStorage
const DEFAULT_ROLES = [
    "Protagonist", "Antagonist", "Deuteragonist", "Supporting Character", 
    "Minor Character", "Villain", "Anti-Hero", "Love Interest", 
    "Mentor", "Sidekick", "Comic Relief", "Foil", "Neutral",
    "Guardian", "Guide", "Ally", "Rival", "Henchman", "Confidant"
];

// Helper Functions for Character Management

/**
 * Find the index of a character by its ID
 * @param {string} id - The character ID to find
 * @returns {number} - The array index of the character or -1 if not found
 */
function findCharacterIndexById(id) {
    return characters.findIndex(c => c.id === id);
}

/**
 * Check if a character with given name exists (excluding a specific ID)
 * @param {string} firstName - First name to check
 * @param {string} lastName - Last name to check
 * @param {string|null} excludeId - Optional ID to exclude from check
 * @returns {boolean} - True if a character with this name exists
 */
function characterNameExists(firstName, lastName, excludeId = null) {
    return characters.some(char => 
        char.firstName.toLowerCase() === firstName.toLowerCase() &&
        char.lastName.toLowerCase() === lastName.toLowerCase() &&
        (excludeId === null || char.id !== excludeId)
    );
}

/**
 * Update an existing character or add a new one
 * @param {Object} character - The character data
 * @param {boolean} isUpdate - Whether this is an update (true) or addition (false)
 * @returns {boolean} - Success or failure
 */
function updateOrAddCharacter(character, isUpdate = false) {
    if (isUpdate) {
        // Find and remove the existing character
        const index = findCharacterIndexById(character.id);
        if (index !== -1) {
            characters.splice(index, 1);
            console.log(`Removed existing character at index ${index} with ID ${character.id}`);
        } else {
            console.warn(`Could not find character with ID ${character.id} to update`);
        }
    }
    
    // Add the character (whether new or updated)
    characters.push(character);
    console.log(`${isUpdate ? 'Updated' : 'Added'} character "${character.firstName} ${character.lastName}" with ID ${character.id}`);
    
    // Save to localStorage
    if (!Core.safelyStoreItem('characters', JSON.stringify(characters))) {
        // If storage fails, remove the character we just added
        characters.pop();
        return false;
    }
    
    return true;
}

// Load titles from localStorage or use defaults
function initializeTitles() {
    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
    const dbTitlesData = localStorage.getItem(`${dbName}_titles`);
    
    // Try to load from database-specific key first, then fall back to generic key
    let loadedTitles = [];
    try {
        loadedTitles = JSON.parse(dbTitlesData || localStorage.getItem('titles') || '[]');
    } catch (error) {
        console.error('Error parsing titles from localStorage:', error);
        loadedTitles = [];
    }
    
    // If no titles found, use defaults
    if (!loadedTitles || loadedTitles.length === 0) {
        loadedTitles = DEFAULT_TITLES;
        // Save defaults to localStorage
        localStorage.setItem('titles', JSON.stringify(DEFAULT_TITLES));
        if (dbName !== 'Default') {
            localStorage.setItem(`${dbName}_titles`, JSON.stringify(DEFAULT_TITLES));
        }
    }
    
    // Set to both window.titles and local titles
    window.titles = loadedTitles;
    titles = loadedTitles;
    
    console.log(`Loaded ${titles.length} titles`);
}

// Load roles from localStorage or use defaults
function initializeRoles() {
    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
    const dbRolesData = localStorage.getItem(`${dbName}_roles`);
    
    // Try to load from database-specific key first, then fall back to generic key
    let loadedRoles = [];
    try {
        loadedRoles = JSON.parse(dbRolesData || localStorage.getItem('roles') || '[]');
    } catch (error) {
        console.error('Error parsing roles from localStorage:', error);
        loadedRoles = [];
    }
    
    // If no roles found, use defaults
    if (!loadedRoles || loadedRoles.length === 0) {
        loadedRoles = DEFAULT_ROLES;
        // Save defaults to localStorage
        localStorage.setItem('roles', JSON.stringify(DEFAULT_ROLES));
        if (dbName !== 'Default') {
            localStorage.setItem(`${dbName}_roles`, JSON.stringify(DEFAULT_ROLES));
        }
    }
    
    // Set to both window.roles and local roles
    window.roles = loadedRoles;
    roles = loadedRoles;
    
    console.log(`Loaded ${roles.length} roles`);
}

// Initialize titles and roles when the module loads
initializeTitles();
initializeRoles();

// Store pagination settings in localStorage
function savePaginationSettings() {
    console.log("Saving pagination settings:", charactersPerPage, currentCharacterPage);
    
    try {
        // Get the current values from the window object if available
        // This ensures we're using the most up-to-date values
        if (window.Characters) {
            if (window.Characters.charactersPerPage) {
                charactersPerPage = window.Characters.charactersPerPage;
            }
            if (window.Characters.currentCharacterPage) {
                currentCharacterPage = window.Characters.currentCharacterPage;
            }
        }
        
        // Ensure we have valid values
        if (isNaN(charactersPerPage) || charactersPerPage <= 0) {
            console.warn("Invalid charactersPerPage value:", charactersPerPage);
            charactersPerPage = 10;
        }
        
        if (isNaN(currentCharacterPage) || currentCharacterPage <= 0) {
            console.warn("Invalid currentCharacterPage value:", currentCharacterPage);
            currentCharacterPage = 1;
        }
        
        // Force values to be integers
        charactersPerPage = parseInt(charactersPerPage);
        currentCharacterPage = parseInt(currentCharacterPage);
        
        // Save to localStorage
        localStorage.setItem('charactersPerPage', charactersPerPage.toString());
        localStorage.setItem('currentCharacterPage', currentCharacterPage.toString());
        
        // Export the values to the window object to ensure they're accessible
        if (window.Characters) {
            window.Characters.charactersPerPage = charactersPerPage;
            window.Characters.currentCharacterPage = currentCharacterPage;
        }
        
        console.log("Pagination settings saved successfully to localStorage");
        console.log("Current localStorage values:", {
            charactersPerPage: localStorage.getItem('charactersPerPage'),
            currentCharacterPage: localStorage.getItem('currentCharacterPage')
        });
        
        return true;
    } catch (error) {
        console.error("Error saving pagination settings:", error);
        return false;
    }
}

// Load pagination settings from localStorage
function loadPaginationSettings() {
    try {
        console.log("Loading pagination settings from localStorage");
        
        // First, check if we have a valid value in the module variable
        console.log("Current module values:", { charactersPerPage, currentCharacterPage });
        
        // Get values from localStorage
        const savedPerPage = localStorage.getItem('charactersPerPage');
        const savedCurrentPage = localStorage.getItem('currentCharacterPage');
        
        console.log("Raw values from localStorage:", { savedPerPage, savedCurrentPage });
        
        // Process charactersPerPage
        if (savedPerPage) {
            const parsedValue = parseInt(savedPerPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                // Always update the value to ensure consistency
                console.log(`Setting charactersPerPage to ${parsedValue}`);
                charactersPerPage = parsedValue;
                
                // Make sure the global variable is updated too
                if (window.Characters) {
                    window.Characters.charactersPerPage = parsedValue;
                }
            } else {
                console.warn("Invalid charactersPerPage value in localStorage:", savedPerPage);
                console.log("Setting charactersPerPage to default: 10");
                charactersPerPage = 10; // Reset to default
                localStorage.setItem('charactersPerPage', '10');
            }
        } else {
            console.log("No charactersPerPage found in localStorage, setting default: 10");
            charactersPerPage = 10; // Reset to default
            localStorage.setItem('charactersPerPage', '10');
        }
        
        // Process currentCharacterPage
        if (savedCurrentPage) {
            const parsedValue = parseInt(savedCurrentPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                // Always update the value to ensure consistency
                console.log(`Setting currentCharacterPage to ${parsedValue}`);
                currentCharacterPage = parsedValue;
                
                // Make sure the global variable is updated too
                if (window.Characters) {
                    window.Characters.currentCharacterPage = parsedValue;
                }
            } else {
                console.warn("Invalid currentCharacterPage value in localStorage:", savedCurrentPage);
                console.log("Setting currentCharacterPage to default: 1");
                currentCharacterPage = 1; // Reset to default
                localStorage.setItem('currentCharacterPage', '1');
            }
        } else {
            console.log("No currentCharacterPage found in localStorage, setting default: 1");
            currentCharacterPage = 1; // Reset to default
            localStorage.setItem('currentCharacterPage', '1');
        }
        
        // Force values to be integers
        charactersPerPage = parseInt(charactersPerPage);
        currentCharacterPage = parseInt(currentCharacterPage);
        
        // Export the values to the window object to ensure they're accessible
        if (window.Characters) {
            window.Characters.charactersPerPage = charactersPerPage;
            window.Characters.currentCharacterPage = currentCharacterPage;
        }
        
        console.log("Final pagination values:", { charactersPerPage, currentCharacterPage });
        
        return true;
    } catch (error) {
        console.error("Error loading pagination settings:", error);
        // Only reset localStorage if it's not already set
        if (!localStorage.getItem('charactersPerPage')) {
            localStorage.setItem('charactersPerPage', '10');
        }
        if (!localStorage.getItem('currentCharacterPage')) {
            localStorage.setItem('currentCharacterPage', '1');
        }
        return false;
    }
}

// Initialize pagination settings
loadPaginationSettings();

// Search debounce timer
let searchDebounceTimer = null;

// Autosave timer
let autosaveTimer = null;
let unsavedChanges = false;

// Placeholder function (image upload functionality removed)
function initializeImageUpload() {
    // This function is intentionally empty as image functionality has been removed
    console.log('Image functionality has been removed from character tab');
    return true;
}

// Rich Text Editor
function initializeRichTextEditor() {
    const toolbar = document.querySelector('.rich-text-toolbar');
    const editor = document.getElementById('richTextEditor');
    const notesField = document.getElementById('notes');
    
    if (toolbar && editor && notesField) {
        // Set up toolbar buttons
        toolbar.querySelectorAll('.rich-text-btn').forEach(button => {
            button.addEventListener('click', function() {
                const command = this.dataset.command;
                
                if (command === 'createLink') {
                    const url = prompt('Enter the link URL:');
                    if (url) document.execCommand(command, false, url);
                } else {
                    document.execCommand(command, false, null);
                }
                
                // Update hidden textarea with HTML content
                notesField.value = editor.innerHTML;
            });
        });
        
        // Update textarea when content changes
        editor.addEventListener('input', function() {
            notesField.value = editor.innerHTML;
        });
    }
}

// Dropdown Management
function updateDropdown(type, items) {
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

function initializeDropdowns() {
    updateDropdown('title', titles);
    updateDropdown('series', seriesList);
    updateDropdown('book', books);
    updateDropdown('role', roles);
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
        case 'title':
            itemArray = titles;
            break;
        case 'series':
            itemArray = seriesList;
            break;
        case 'book':
            itemArray = books;
            break;
        case 'role':
            itemArray = roles;
            break;
        default:
            return;
    }
    
    if (itemArray.includes(value)) {
        Core.showToast(`${value} already exists`, 'error');
        return;
    }
    
    itemArray.push(value);
    Core.safelyStoreItem(type === 'series' ? 'series' : type + 's', JSON.stringify(itemArray));
    
    updateDropdown(type, itemArray);
    document.getElementById(type).value = value;
    inputElement.value = '';
    document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Form`).style.display = 'none';
    
    Core.showToast(`${value} added to ${type} list`);
    
    // Update filter dropdowns if needed
    if (type === 'series' || type === 'book' || type === 'role') {
        const filterDropdown = document.getElementById(`filter${type.charAt(0).toUpperCase() + type.slice(1)}`);
        if (filterDropdown) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filterDropdown.appendChild(option);
        }
    }
}

// Custom Fields Management
function initializeCustomFields() {
    const container = document.getElementById('customFieldsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    customFieldTypes.forEach(fieldName => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'custom-field';
        fieldDiv.innerHTML = `
            <input type="text" class="custom-field-name" value="${fieldName}" readonly>
            <input type="text" class="custom-field-value" placeholder="Enter value">
            <button type="button" onclick="Characters.removeCustomField(this, '${fieldName}')">Remove</button>
        `;
        container.appendChild(fieldDiv);
    });
}

function addCustomField() {
    // Create a modal dialog for custom field input
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="background-color: var(--background-color, #fff); color: var(--text-color, #333); padding: 20px; border-radius: 8px; width: 80%; max-width: 400px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);">
            <div class="modal-header" style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                <h3 style="margin: 0; color: var(--text-color, #333); font-size: 20px;">Add Custom Field</h3>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 15px;">
                    <label for="custom-field-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Field Name:</label>
                    <input type="text" id="custom-field-name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Enter field name">
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                    <button id="cancel-custom-field" style="background-color: #f44336; color: white; border: none; border-radius: 4px; padding: 8px 15px; cursor: pointer;">Cancel</button>
                    <button id="add-custom-field" style="background-color: #4CAF50; color: white; border: none; border-radius: 4px; padding: 8px 15px; cursor: pointer;">Add Field</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set focus to the input field
    setTimeout(() => {
        const input = document.getElementById('custom-field-name');
        if (input) input.focus();
    }, 100);
    
    // Function to remove the modal
    const removeModal = function() {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    // Set up event listeners
    const cancelBtn = document.getElementById('cancel-custom-field');
    const addBtn = document.getElementById('add-custom-field');
    const input = document.getElementById('custom-field-name');
    
    if (cancelBtn) cancelBtn.addEventListener('click', removeModal);
    
    if (addBtn && input) {
        // Add field when button is clicked
        addBtn.addEventListener('click', function() {
            const fieldName = input.value.trim();
            if (!fieldName) {
                Core.showToast('Please enter a field name', 'error');
                return;
            }
            
            if (!customFieldTypes.includes(fieldName)) {
                customFieldTypes.push(fieldName);
                localStorage.setItem('customFieldTypes', JSON.stringify(customFieldTypes));
            }
            
            removeModal();
            initializeCustomFields();
            Core.showToast(`Custom field "${fieldName}" added successfully`);
        });
        
        // Also add field when Enter key is pressed
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        });
    }
}

function removeCustomField(button, fieldName) {
    Core.showConfirmationDialog(
        `Do you want to remove this custom field type "${fieldName}" permanently? This will affect all characters.`,
        function() {
            // User confirmed removal
            customFieldTypes = customFieldTypes.filter(field => field !== fieldName);
            localStorage.setItem('customFieldTypes', JSON.stringify(customFieldTypes));
            button.parentElement.remove();
            Core.showToast(`Custom field "${fieldName}" removed successfully`);
        },
        function() {
            // User canceled removal
            Core.showToast('Custom field removal canceled');
        }
    );
}

// Calculate similarity between two strings (0-1 where 1 is identical)
function calculateNameSimilarity(str1, str2) {
    // If either string is empty, return 0
    if (!str1 || !str2) return 0;
    
    // If strings are identical, return 1
    if (str1 === str2) return 1;
    
    // Calculate Levenshtein distance
    const len1 = str1.length;
    const len2 = str2.length;
    
    // Create matrix
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    // Calculate similarity as 1 - (distance / max length)
    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return 1 - (distance / maxLength);
}

// Character Management
function displayCharacters() {
    clearTimeout(searchDebounceTimer);
    
    // Debug pagination state
    console.log("Pagination: Before display - charactersPerPage:", charactersPerPage, "currentCharacterPage:", currentCharacterPage);
    
    // We'll let UI.updatePaginationControls handle the page size selector
    // This avoids duplicate event handlers and ensures consistency
    
    searchDebounceTimer = setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        const searchField = document.getElementById('searchField');
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const searchFieldValue = searchField?.value || 'all';
        const tableBody = document.querySelector('#characterTable tbody');
        if (!tableBody) return;

        // CRITICAL FIX: Ensure we're using the global characters array
        // This ensures characters added from book analysis are displayed
        if (window.characters && Array.isArray(window.characters)) {
            characters = window.characters;
            console.log(`Using global window.characters array with ${characters.length} characters`);
        } else {
            console.log('No global window.characters array found, using module-level array');
        }

        // Advanced search filters
        const filterSeries = document.getElementById('filterSeries')?.value || '';
        const filterBook = document.getElementById('filterBook')?.value || '';
        const filterRole = document.getElementById('filterRole')?.value || '';
        const filterRace = document.getElementById('filterRace')?.value || '';

        // Apply filters
        let filteredCharacters = characters;
        
        // Apply fuzzy search if search term exists
        if (searchTerm) {
            if (searchFieldValue === 'all') {
                // Search across all relevant fields
                filteredCharacters = Core.fuzzySearch(
                    filteredCharacters,
                    searchTerm,
                    ['firstName', 'lastName', 'title', 'series', 'book', 'race', 'role']
                );
            } else {
                // Search in specific field
                filteredCharacters = Core.fuzzySearch(
                    filteredCharacters,
                    searchTerm,
                    [searchFieldValue]
                );
            }
        }
        
        // Apply advanced filters
        filteredCharacters = filteredCharacters.filter(character => {
            const matchesSeries = !filterSeries || character.series === filterSeries;
            const matchesBook = !filterBook || character.book === filterBook;
            const matchesRole = !filterRole || character.role === filterRole;
            const matchesRace = !filterRace || character.race === filterRace;
            
            // Apply tag filter if it exists
            const matchesTag = !window.currentTagFilter ? true :
                (character.tags && character.tags.includes(window.currentTagFilter));
            
            return matchesSeries && matchesBook && matchesRole && matchesRace && matchesTag;
        });

        // Sort characters
        if (UI.currentSort.column) {
            filteredCharacters.sort((a, b) => {
                let valueA = (a[UI.currentSort.column] || '').toString().toLowerCase();
                let valueB = (b[UI.currentSort.column] || '').toString().toLowerCase();
                
                if (!valueA && valueB) return 1;
                if (valueA && !valueB) return -1;
                if (!valueA && !valueB) return 0;
                
                return UI.currentSort.direction === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            });
        }

        // Make sure we're using the latest values from localStorage
        loadPaginationSettings();
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredCharacters.length / charactersPerPage);
        
        // Ensure current page is valid
        if (currentCharacterPage > totalPages && totalPages > 0) {
            currentCharacterPage = totalPages;
            savePaginationSettings();
        } else if (currentCharacterPage < 1) {
            currentCharacterPage = 1;
            savePaginationSettings();
        }
        
        console.log(`Pagination calculation: currentCharacterPage=${currentCharacterPage}, totalPages=${totalPages}, charactersPerPage=${charactersPerPage}`);
        
        // Calculate start and end indices for pagination
        const startIndex = (currentCharacterPage - 1) * charactersPerPage;
        const endIndex = startIndex + parseInt(charactersPerPage);
        console.log(`Pagination indices: startIndex=${startIndex}, endIndex=${endIndex}`);
        
        const paginatedCharacters = filteredCharacters.slice(startIndex, endIndex);
        console.log(`Paginated characters: ${paginatedCharacters.length} items`);
        
        // Update table
        tableBody.innerHTML = '';
        
        if (paginatedCharacters.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="10" style="text-align: center;">No characters found</td>`;
            tableBody.appendChild(emptyRow);
        } else {
            paginatedCharacters.forEach((char, index) => {
                const actualIndex = characters.findIndex(c =>
                    c.firstName === char.firstName &&
                    c.lastName === char.lastName &&
                    c.title === char.title
                );
                
                if (actualIndex === -1) return;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${char.title || ''}</td>
                    <td>${char.firstName || ''}</td>
                    <td>${char.lastName || ''}</td>
                    <td>${char.race || ''}</td>
                    <td>${char.series || ''}</td>
                    <td>${char.book || ''}</td>
                    <td>${char.role || ''}</td>
                    <td class="actions-column">
                        <button class="view-btn" onclick="Characters.showCharacterDetails(${actualIndex})" title="View"><i class="fas fa-eye"></i></button>
                        <button class="edit-btn" onclick="Characters.editCharacter(${actualIndex})" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" onclick="Characters.deleteCharacter(${actualIndex})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        // Update pagination controls with a small delay to ensure the DOM is ready
        setTimeout(() => {
            UI.updatePaginationControls(filteredCharacters.length, charactersPerPage, currentCharacterPage, 'character');
            console.log("Pagination: Controls updated with:", {
                totalItems: filteredCharacters.length,
                itemsPerPage: charactersPerPage,
                currentPage: currentCharacterPage
            });
        }, 50);
        
        // Show tag filter indicator if a tag filter is active
        if (window.currentTagFilter) {
            // Create or update tag filter indicator
            let tagFilterIndicator = document.getElementById('tagFilterIndicator');
            
            if (!tagFilterIndicator) {
                // Create indicator if it doesn't exist
                tagFilterIndicator = document.createElement('div');
                tagFilterIndicator.id = 'tagFilterIndicator';
                tagFilterIndicator.className = 'tag-filter-indicator';
                
                // Add to DOM before the table
                const tableContainer = document.querySelector('#characterTable').parentElement;
                tableContainer.insertBefore(tagFilterIndicator, tableContainer.firstChild);
            }
            
            // Get tag name
            const tag = tags.find(t => t.id === window.currentTagFilter);
            if (tag) {
                tagFilterIndicator.innerHTML = `
                    <span>Filtered by tag: <strong>${tag.name}</strong></span>
                    <button onclick="Characters.clearTagFilter()">Clear Filter</button>
                `;
                tagFilterIndicator.style.display = 'flex';
                tagFilterIndicator.style.backgroundColor = tag.color;
            }
        } else {
            // Hide indicator if no tag filter is active
            const tagFilterIndicator = document.getElementById('tagFilterIndicator');
            if (tagFilterIndicator) {
                tagFilterIndicator.style.display = 'none';
            }
        }
        
        // Update tag cloud if it exists
        const tagCloud = document.getElementById('characterTagCloud');
        if (tagCloud) {
            Tags.renderTagCloud(tagCloud, (tagId) => {
                const entities = Tags.findEntitiesByTag(tagId);
                if (entities.characters.length > 0) {
                    // Filter the character table to show only characters with this tag
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    // Reset filters
                    const filterSelects = ['filterSeries', 'filterBook', 'filterRole', 'filterRace'];
                    filterSelects.forEach(id => {
                        const select = document.getElementById(id);
                        if (select) {
                            select.value = '';
                        }
                    });
                    
                    // Set the global tag filter
                    window.currentTagFilter = tagId;
                    
                    // Create a custom filter function
                    const tag = tags.find(t => t.id === tagId);
                    if (tag) {
                        Core.showToast(`Showing characters tagged with "${tag.name}"`);
                    }
                    
                    // Refresh the display with the tag filter
                    displayCharacters();
                } else {
                    Core.showToast('No characters found with this tag');
                }
            });
        }
        
        Statistics.updateStatistics();
    }, 300); // 300ms debounce
}

// Form Handling
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Clear any previous validation errors
    form.querySelectorAll('.validation-error').forEach(el => el.remove());
    form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
    
    // Get form values
    const newFirstName = form.firstName.value.trim();
    const newLastName = form.lastName.value.trim();
    
    // Check if we're in edit mode
    const submitButton = form.querySelector('button[type="submit"]');
    const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
    const characterId = isEditMode ? submitButton.dataset.characterId : null;
    
    console.log(`Form submission - isEditMode: ${isEditMode}, characterId: ${characterId}`);
    
    // Very simple validation - just check if first name is provided
    if (newFirstName === '') {
        // Highlight the field
        form.firstName.classList.add('error-input');
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'validation-error';
        errorMsg.textContent = 'First name is required';
        form.firstName.parentNode.appendChild(errorMsg);
        
        return;
    }

    // Check for exact duplicate names - EXCLUDING the character being edited
    if (characterNameExists(newFirstName, newLastName, characterId)) {
        Core.showToast('A character with this exact name already exists', 'error');
        return;
    }
    
    // Check for similar names (to prevent typos) - EXCLUDING the character being edited
    const similarNames = findSimilarNames(newFirstName, newLastName, characterId);
    
    if (similarNames.length > 0) {
        handleSimilarNameWarning(form, similarNames[0], newFirstName, newLastName);
        return;
    }
    
    // If no similar names, continue with form submission
    processFormSubmission(form);
}

/**
 * Find characters with similar names
 * @param {string} firstName - First name to check
 * @param {string} lastName - Last name to check
 * @param {string|null} excludeId - Optional ID to exclude from check
 * @returns {Array} - Array of characters with similar names
 */
function findSimilarNames(firstName, lastName, excludeId = null) {
    return characters.filter(char => {
        // Skip if it's the character being edited
        if (excludeId && char.id === excludeId) {
            return false;
        }
        
        // First name must match exactly (case insensitive)
        if (char.firstName.toLowerCase() !== firstName.toLowerCase()) {
            return false;
        }
        
        // If either last name is empty, don't compare
        if (!char.lastName || !lastName) {
            return false;
        }
        
        // Calculate similarity between last names
        const similarity = calculateNameSimilarity(
            char.lastName.toLowerCase(),
            lastName.toLowerCase()
        );
        
        // Return true if names are very similar but not identical
        return similarity > 0.8 && similarity < 1;
    });
}

/**
 * Handle warning about similar name
 * @param {HTMLFormElement} form - The form element
 * @param {Object} similarCharacter - The character with a similar name
 * @param {string} firstName - The new first name
 * @param {string} lastName - The new last name
 */
function handleSimilarNameWarning(form, similarCharacter, firstName, lastName) {
    // Store form data temporarily to prevent loss during dialog
    const formData = {
        title: form.title.value,
        firstName: firstName,
        lastName: lastName,
        sex: form.sex.value,
        race: form.race.value,
        series: form.series.value,
        book: form.book.value,
        role: form.role.value,
    };
    
    // Use our custom confirmation dialog
    Core.showConfirmationDialog(
        `Warning: This name is very similar to existing character "${similarCharacter.firstName} ${similarCharacter.lastName}". Did you mean to create a different character?`,
        function() {
            // User confirmed they want to create a new character with a similar name
            console.log("User confirmed creating character with similar name");
            // Continue with form submission
            processFormSubmission(form, formData);
        },
        function() {
            // User canceled, they probably meant to edit the existing character
            editCharacter(characters.indexOf(similarCharacter));
        }
    );
}

/**
 * Process the form submission to create or update a character
 * @param {HTMLFormElement} form - The form element
 * @param {Object} formData - Optional pre-collected form data
 */
function processFormSubmission(form, formData = null) {
    // Get form values
    if (!formData) {
        formData = {
            title: form.title.value,
            firstName: form.firstName.value.trim(),
            lastName: form.lastName.value.trim(),
            sex: form.sex.value,
            race: form.race.value,
            series: form.series.value,
            book: form.book.value,
            role: form.role.value,
        };
    }
    
    // Check if we're in edit mode
    const submitButton = form.querySelector('button[type="submit"]');
    const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
    const characterId = isEditMode ? submitButton.dataset.characterId : null;
    
    console.log(`Processing form submission - isEditMode: ${isEditMode}, characterId: ${characterId}`);
    
    try {
        // Collect any additional data from form
        const richTextEditor = document.getElementById('richTextEditor');
        const notes = richTextEditor ? richTextEditor.innerHTML : form.notes?.value || '';
        
        // Collect custom fields
        const customFields = {};
        form.querySelectorAll('.custom-field').forEach(field => {
            const name = field.querySelector('.custom-field-name').value;
            const value = field.querySelector('.custom-field-value').value.trim();
            if (value) {
                customFields[name] = value;
            }
        });
        
        // Collect tags
        const tagSelector = document.getElementById('characterTagSelector');
        const tags = [];
        if (tagSelector) {
            tagSelector.querySelectorAll('.entity-tag').forEach(tag => {
                const tagId = tag.getAttribute('data-tag-id');
                if (tagId) {
                    tags.push(tagId);
                } else {
                    const tagName = tag.querySelector('.tag-name')?.textContent;
                    if (tagName && window.tags) {
                        const foundTag = window.tags.find(t => t.name === tagName);
                        if (foundTag) tags.push(foundTag.id);
                    }
                }
            });
        }
        
        // Create the character object
        const character = {
            id: characterId || crypto.randomUUID(),
            title: formData.title || '',
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            sex: formData.sex || '',
            race: formData.race || '',
            series: formData.series || '',
            book: formData.book || '',
            role: formData.role || '',
            notes: notes,
            customFields: customFields,
            tags: tags,
            createdAt: isEditMode && window.originalEditCharacter ? 
                window.originalEditCharacter.createdAt : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Use our updateOrAddCharacter helper function
        updateOrAddCharacter(character, isEditMode);
        
        // Show success message
        Core.showToast(isEditMode ? 'Character updated successfully' : 'Character added successfully', 'success');
        
        // ENHANCED RESET: Explicitly clean up ALL edit-mode state
        console.log('Resetting all character edit state variables');
        window.currentEditingCharacterId = null;
        window.originalEditCharacter = null;
        window.useExistingCharacterId = null;
        
        // Reset the form's button state
        if (submitButton) {
            submitButton.textContent = 'Add Character';
            submitButton.dataset.editMode = 'false';
            if (submitButton.dataset.characterId) {
                delete submitButton.dataset.characterId;
            }
        }
        
        // Then reset the form fields
        form.reset();
        resetFormFields(form);
        
        // Verify form state is correct
        console.log('Verifying form state after reset');
        const verifyButton = form.querySelector('button[type="submit"]');
        if (verifyButton && verifyButton.dataset.editMode === 'true') {
            console.warn('Button still in edit mode after reset - forcing reset');
            verifyButton.dataset.editMode = 'false';
            verifyButton.textContent = 'Add Character';
        }
        
        // Update UI
        displayCharacters();
    } catch (error) {
        console.error('Error processing character form submission:', error);
        Core.showToast('Error saving character: ' + error.message, 'error');
    }
}

// Character Details Popup
function showCharacterDetails(index) {
    try {
        // Make sure we're using the latest character data
        if (window.characters && Array.isArray(window.characters)) {
            characters = window.characters;
        }
        
        if (!characters || !Array.isArray(characters) || index < 0 || index >= characters.length) {
            console.error('Invalid character index or characters array:', { 
                index, 
                charactersLength: characters?.length || 0 
            });
            return;
        }
        
        const char = characters[index];
        if (!char) {
            console.error('Character not found at index:', index);
            return;
        }
        
        const popup = document.createElement('div');
        popup.className = 'character-popup';
        
        // Get character tags
        let characterTags = [];
        if (typeof Tags !== 'undefined' && typeof Tags.getEntityTags === 'function') {
            characterTags = Tags.getEntityTags('character', char.id || '');
        } else if (typeof window.Tags !== 'undefined' && typeof window.Tags.getEntityTags === 'function') {
            characterTags = window.Tags.getEntityTags('character', char.id || '');
        }
        
        // Get character relationships
        const characterName = `${char.firstName} ${char.lastName}`.trim();
        
        // Check if Relationships module exists and has the required function
        let characterRelationships = [];
        if (typeof window.relationships !== 'undefined' && Array.isArray(window.relationships)) {
            // Filter relationships manually from global array
            characterRelationships = window.relationships.filter(rel => 
                rel.character1 === characterName || rel.character2 === characterName
            );
        }
        
        // Process relationships to display correctly
        const processedRelationships = characterRelationships.map(rel => {
            // Determine which character is the other one (not this character)
            const otherCharacter = rel.character1 === characterName ? rel.character2 : rel.character1;
            
            return {
                otherCharacter: otherCharacter,
                type: rel.type
            };
        });
        
        popup.innerHTML = `
            <div class="popup-content" style="max-width: 800px; width: 95%;">
                <span class="close-btn" onclick="this.parentElement.parentElement.remove()">Close</span>
                <h2>${char.firstName} ${char.lastName}</h2>
                
                <div class="details-section">
                    <h3>Personal Information</h3>
                    <p><strong>Title:</strong> ${char.title || 'N/A'}</p>
                    <p><strong>Sex:</strong> ${char.sex || 'N/A'}</p>
                    <p><strong>Race:</strong> ${char.race || 'N/A'}</p>
                </div>

                <div class="details-section">
                    <h3>Story Information</h3>
                    <p><strong>Series:</strong> ${char.series || 'N/A'}</p>
                    <p><strong>Book:</strong> ${char.book || 'N/A'}</p>
                    <p><strong>Role:</strong> ${char.role || 'N/A'}</p>
                </div>
                
                <div class="details-section">
                    <h3>Relationships</h3>
                    ${processedRelationships.length > 0 ? 
                        `<ul class="relationship-list">
                            ${processedRelationships.map(rel => 
                                `<li><strong>${rel.otherCharacter}</strong> - ${rel.type}</li>`
                            ).join('')}
                        </ul>` : 
                        '<p>No relationships defined</p>'
                    }
                </div>
                
                <div class="details-section">
                    <h3>Tags</h3>
                    <div class="entity-tags">
                        ${characterTags.length > 0 ? 
                            characterTags.map(tag => `
                                <div class="entity-tag" style="background-color: ${tag.color}">
                                    <span class="tag-name">${tag.name}</span>
                                </div>
                            `).join('') : 
                            '<div class="no-tags">No tags</div>'
                        }
                    </div>
                </div>

                <div class="details-section">
                    <h3>Additional Details</h3>
                    ${char.customFields ? Object.entries(char.customFields).map(([key, value]) =>
                        `<p><strong>${key}:</strong> ${value}</p>`
                    ).join('') : 'No additional details'}
                </div>

                <div class="details-section">
                    <h3>Notes</h3>
                    <div>${char.notes || 'No notes available'}</div>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
    } catch (error) {
        console.error('Error showing character details:', error);
        if (typeof Core !== 'undefined' && typeof Core.showToast === 'function') {
            Core.showToast('Error displaying character details: ' + error.message, 'error');
        } else if (typeof window.Core !== 'undefined' && typeof window.Core.showToast === 'function') {
            window.Core.showToast('Error displaying character details: ' + error.message, 'error');
        } else {
            alert('Error displaying character details: ' + error.message);
        }
    }
}

// Store the original character when editing (make it globally accessible)
window.originalEditCharacter = null;

function editCharacter(index) {
    try {
        // Get the character to edit
        const character = characters[index];
        if (!character) {
            console.error('Character not found at index:', index);
            Core.showToast('Character not found', 'error');
            return;
        }
        
        console.log('Editing character:', character);
        
        // Store this character as the one being edited
        window.currentEditingCharacterId = character.id;
        window.originalEditCharacter = JSON.parse(JSON.stringify(character));
        window.useExistingCharacterId = character.id;
        
        // Set form values
        const form = document.getElementById('characterForm');
        if (!form) {
            console.error('Character form not found');
            return;
        }
        
        // Populate form fields
        if (form.title) form.title.value = character.title || '';
        if (form.firstName) form.firstName.value = character.firstName || '';
        if (form.lastName) form.lastName.value = character.lastName || '';
        if (form.sex) form.sex.value = character.sex || '';
        if (form.race) form.race.value = character.race || '';
        if (form.series) form.series.value = character.series || '';
        if (form.book) form.book.value = character.book || '';
        if (form.role) form.role.value = character.role || '';
        
        // Handle rich text editor for notes if it exists
        const richTextEditor = document.getElementById('richTextEditor');
        if (richTextEditor && character.notes) {
            richTextEditor.innerHTML = character.notes;
        } else if (form.notes) {
            form.notes.value = character.notes || '';
        }
        
        // Handle any custom fields
        setupCustomFields(character);
        
        // Handle tags if the Tags module exists
        setupTagsForEdit(character);
        
        // Set submit button to indicate edit mode
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Update Character';
            submitButton.dataset.editMode = 'true';
            submitButton.dataset.characterId = character.id;
        }
        
        console.log('Edit mode activated, state variables set:', {
            currentEditingCharacterId: window.currentEditingCharacterId,
            hasOriginalCharacter: !!window.originalEditCharacter,
            useExistingCharacterId: window.useExistingCharacterId,
            buttonText: submitButton?.textContent,
            buttonEditMode: submitButton?.dataset.editMode
        });
        
        // Switch to characters tab if not already there
        const charactersTab = document.querySelector('a[href="#characters-tab"]');
        if (charactersTab) {
            charactersTab.click();
        }
        
        // Scroll to the form
        form.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error while setting up character edit:', error);
        Core.showToast('Error preparing character for edit: ' + error.message, 'error');
    }
}

/**
 * Set up custom fields for a character being edited
 * @param {Object} character - The character being edited
 */
function setupCustomFields(character) {
    if (!character.customFields) return;
    
    console.log('Setting up custom fields:', character.customFields);
    const customFieldsContainer = document.getElementById('customFieldsContainer');
    if (!customFieldsContainer) return;
    
    // Clear existing custom fields
    customFieldsContainer.innerHTML = '';
    
    // Add each custom field from the character
    Object.entries(character.customFields).forEach(([name, value]) => {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'custom-field';
        fieldContainer.innerHTML = `
            <input type="text" class="custom-field-name" value="${name}" readonly>
            <input type="text" class="custom-field-value" value="${value}" placeholder="Value">
            <button type="button" class="remove-field" onclick="Characters.removeCustomField(this, '${name}')">×</button>
        `;
        customFieldsContainer.appendChild(fieldContainer);
    });
}

/**
 * Set up tags for a character being edited
 * @param {Object} character - The character being edited
 */
function setupTagsForEdit(character) {
    // Check if Tags module exists
    if (typeof Tags === 'undefined' || typeof Tags.createTagSelector !== 'function') return;
    
    const tagSelector = document.getElementById('characterTagSelector');
    if (!tagSelector) return;
    
    console.log('Setting up tag selector for character ID:', character.id);
    tagSelector.setAttribute('data-entity-id', character.id);
    Tags.createTagSelector('character', character.id, tagSelector);
}

function deleteCharacter(index) {
    const char = characters[index];
    const characterName = `${char.firstName} ${char.lastName}`;
    
    // Use our custom confirmation dialog instead of the browser's built-in confirm
    Core.showConfirmationDialog(
        `Are you sure you want to delete the character "${characterName}"?`,
        function() {
            // User confirmed deletion
            try {
                const deletedCharacter = characters[index];
                
                // Store the character ID before removing it
                const deletedCharacterId = deletedCharacter.id;
                
                characters.splice(index, 1);
                
                if (!Core.safelyStoreItem('characters', JSON.stringify(characters))) {
                    // If storage fails, restore the character
                    characters.splice(index, 0, deletedCharacter);
                    return;
                }
                
                // Add to recent activity
                Dashboard.addActivity('character', `Deleted character "${deletedCharacter.firstName} ${deletedCharacter.lastName}"`, deletedCharacter.id);
                
                displayCharacters();
                Core.showToast('Character deleted successfully');
                
                // Update relationships to remove this character
                if (typeof Relationships !== 'undefined') {
                    // Call the new handler function if available
                    if (typeof Relationships.handleCharacterDeleted === 'function') {
                        Relationships.handleCharacterDeleted(deletedCharacterId);
                    } 
                    // Also update the relationship list UI for backward compatibility
                    else if (typeof Relationships.updateRelationshipsList === 'function') {
                        Relationships.updateRelationshipsList();
                    }
                }
            } catch (error) {
                Core.showToast('Error deleting character: ' + error.message, 'error');
            }
        },
        function() {
            // User canceled deletion
            Core.showToast('Character deletion canceled');
        }
    );
}

function clearForm() {
    const form = document.getElementById('characterForm');
    if (!form) return;

    // Check if we're in edit mode
    const submitButton = form.querySelector('button[type="submit"]');
    const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
    const characterId = submitButton?.dataset.characterId;
    
    console.log(`clearForm called - isEditMode: ${isEditMode}, characterId: ${characterId}`);
    
    // If we're in edit mode, we need to restore the original character
    if (isEditMode && characterId && window.originalEditCharacter) {
        console.log('clearForm - Restoring original character to the array');
        
        // First check if the character still exists in the array
        const index = findCharacterIndexById(characterId);
        if (index !== -1) {
            // Remove the existing character to avoid duplication
            characters.splice(index, 1);
            console.log(`Removed existing character at index ${index} to prevent duplication`);
        }
        
        // Add the original character back to the array
        updateOrAddCharacter(window.originalEditCharacter, false);
        
        // Update the display
        displayCharacters();
        
        Core.showToast(`Editing canceled for "${window.originalEditCharacter.firstName} ${window.originalEditCharacter.lastName}"`);
    }
    
    // ENHANCED RESET: Explicitly clean up ALL edit-mode state
    console.log('Explicitly clearing all edit mode state variables');
    window.currentEditingCharacterId = null;
    window.originalEditCharacter = null;
    window.useExistingCharacterId = null;
    
    // Reset the form's button state
    if (submitButton) {
        submitButton.textContent = 'Add Character';
        submitButton.dataset.editMode = 'false';
        if (submitButton.dataset.characterId) {
            delete submitButton.dataset.characterId;
        }
    }
    
    // Reset form fields
    resetFormFields(form);
    
    // Verify form state is correct
    console.log('Verifying form state after clear');
    const verifyButton = form.querySelector('button[type="submit"]');
    if (verifyButton && verifyButton.dataset.editMode === 'true') {
        console.warn('Button still in edit mode after clear - forcing reset');
        verifyButton.dataset.editMode = 'false';
        verifyButton.textContent = 'Add Character';
    }
}

/**
 * Reset the edit mode state
 * @param {HTMLFormElement} form - The form element
 */
function resetEditMode(form) {
    console.log('resetEditMode - Clearing editing state');
    
    // Clear the stored original character and editing state
    window.originalEditCharacter = null;
    window.currentEditingCharacterId = null;
    window.useExistingCharacterId = null;
    
    // Reset submit button text and state
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Add Character';
        submitButton.dataset.editMode = 'false';
        if (submitButton.dataset.characterId) {
            delete submitButton.dataset.characterId;
        }
    }
    
    // Verify reset was successful
    console.log('Edit mode reset complete, verifying state', {
        currentEditingCharacterId: window.currentEditingCharacterId,
        hasOriginalCharacter: !!window.originalEditCharacter,
        useExistingCharacterId: window.useExistingCharacterId,
        buttonText: submitButton?.textContent,
        buttonEditMode: submitButton?.dataset.editMode
    });
}

/**
 * Reset all form fields
 * @param {HTMLFormElement} form - The form element
 */
function resetFormFields(form) {
    // Remove validation elements
    form.querySelectorAll('.validation-error').forEach(el => el.remove());
    form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
    
    // Clear browser validation messages
    form.querySelectorAll('input, select, textarea').forEach(input => {
        input.setCustomValidity('');
    });

    // Store current series and book values (these are often reused)
    const series = form.series?.value;
    const book = form.book?.value;

    // Reset form
    form.reset();

    // Restore series and book values
    if (form.series) form.series.value = series;
    if (form.book) form.book.value = book;

    // Reset custom fields
    initializeCustomFields();
    
    // Reset image
    const characterImage = document.getElementById('characterImage');
    const uploadPrompt = document.getElementById('uploadPrompt');
    if (characterImage && uploadPrompt) {
        characterImage.style.display = 'none';
        uploadPrompt.style.display = 'block';
    }
    
    // Reset rich text editor
    const richTextEditor = document.getElementById('richTextEditor');
    if (richTextEditor) {
        richTextEditor.innerHTML = '';
    }
    
    // Reset tag selector
    const tagSelector = document.getElementById('characterTagSelector');
    if (tagSelector && typeof Tags !== 'undefined' && typeof Tags.createTagSelector === 'function') {
        tagSelector.setAttribute('data-entity-id', '');
        Tags.createTagSelector('character', '', tagSelector);
    }
}

// Clear tag filter
function clearTagFilter() {
    window.currentTagFilter = null;
    
    // Update UI to show all characters
    const tagFilterIndicator = document.getElementById('tagFilterIndicator');
    if (tagFilterIndicator) {
        tagFilterIndicator.style.display = 'none';
        // Remove the indicator from DOM to ensure it's recreated fresh next time
        tagFilterIndicator.remove();
    }
    
    // Refresh the display with no filter
    // This will also re-render the tag cloud with proper event handlers
    displayCharacters();
}

// Sort character table
function sortTable(column) {
    // Clear tag filter when sorting
    window.currentTagFilter = null;
    
    if (UI.currentSort.column === column) {
        UI.currentSort.direction = UI.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        UI.currentSort = {
            column: column,
            direction: 'asc'
        };
    }
    
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.getAttribute('onclick')?.includes(column)) {
            th.classList.add(`sort-${UI.currentSort.direction}`);
        }
    });
    
    displayCharacters();
}

// Autosave functionality
function setupAutosave() {
    const characterForm = document.getElementById('characterForm');
    
    // Create autosave indicator
    const formButtons = document.querySelector('.form-buttons');
    if (formButtons) {
        const autosaveIndicator = document.createElement('div');
        autosaveIndicator.className = 'autosave-indicator';
        autosaveIndicator.innerHTML = `
            <span class="autosave-icon">💾</span>
            <span class="autosave-text">Saved</span>
        `;
        formButtons.appendChild(autosaveIndicator);
    }
    
    // Function to save form data to localStorage
    function saveFormData(form) {
        if (!form) return;
        
        // Show saving indicator
        const autosaveIndicator = document.querySelector('.autosave-indicator');
        if (autosaveIndicator) {
            autosaveIndicator.className = 'autosave-indicator saving';
            autosaveIndicator.querySelector('.autosave-text').textContent = 'Saving...';
        }
        
        const formData = {};
        Array.from(form.elements).forEach(element => {
            if (element.name && element.type !== 'submit' && element.type !== 'button') {
                formData[element.name] = element.value;
            }
        });
        
        // Handle rich text editor
        const richTextEditor = document.getElementById('richTextEditor');
        if (richTextEditor) {
            formData.notes = richTextEditor.innerHTML;
        }
        
        // Handle custom fields
        formData.customFields = {};
        form.querySelectorAll('.custom-field').forEach(field => {
            const name = field.querySelector('.custom-field-name').value;
            const value = field.querySelector('.custom-field-value').value.trim();
            if (value) {
                formData.customFields[name] = value;
            }
        });
        
        const success = Core.safelyStoreItem('characterFormDraft', JSON.stringify(formData));
        unsavedChanges = true;
        
        // Update indicator based on success
        if (autosaveIndicator) {
            setTimeout(() => {
                autosaveIndicator.className = 'autosave-indicator ' + (success ? 'saved' : 'error');
                autosaveIndicator.querySelector('.autosave-text').textContent =
                    success ? 'Saved' : 'Error saving';
                
                // Hide after a few seconds
                setTimeout(() => {
                    autosaveIndicator.className = 'autosave-indicator';
                }, 3000);
            }, 500);
        }
    }
    
    // Set up autosave for character form
    if (characterForm) {
        const characterInputs = characterForm.querySelectorAll('input, textarea, select');
        characterInputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(autosaveTimer);
                autosaveTimer = setTimeout(() => saveFormData(characterForm), 2000);
            });
        });
        
        // Also save when rich text editor changes
        const richTextEditor = document.getElementById('richTextEditor');
        if (richTextEditor) {
            richTextEditor.addEventListener('input', () => {
                clearTimeout(autosaveTimer);
                autosaveTimer = setTimeout(() => saveFormData(characterForm), 2000);
            });
        }
        
        // Make sure the form has the novalidate attribute
        characterForm.setAttribute('novalidate', 'novalidate');
        
        // Remove any existing onsubmit attribute
        if (characterForm.hasAttribute('onsubmit')) {
            console.log('Removing onsubmit attribute from form');
            characterForm.removeAttribute('onsubmit');
        }
        
        // Clear any existing event listeners and add our own
        characterForm.onsubmit = null; // Clear any existing onsubmit handler
        
        // Add our submit handler - this will override any existing handlers
        console.log('Setting up character form submit handler');
        characterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear any validation errors before processing the form
            this.querySelectorAll('.validation-error').forEach(el => el.remove());
            this.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
            
            // Clear any browser validation messages
            const inputs = this.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.setCustomValidity('');
            });
            
            // Disable HTML5 validation
            this.setAttribute('novalidate', 'novalidate');
            
            // Log that we're handling the form submission
            console.log('Character form submit handler - bypassing validation system');
            
            // Now simply call our updated handleFormSubmit function
            handleFormSubmit(e);
        });
    }
}

// Name Generator
function generateRandomName() {
    // Check if the first name field is empty
    const firstNameField = document.getElementById('firstName');
    if (firstNameField && firstNameField.value.trim() !== '') {
        Core.showToast('Please clear the first name field before generating a new name', 'error');
        return;
    }
    
    const race = document.getElementById('nameGeneratorRace').value;
    const resultDiv = document.getElementById('generatedNameResult');
    const firstNameSpan = document.getElementById('generatedFirstName');
    const lastNameSpan = document.getElementById('generatedLastName');
    
    // Name lists by race
    const namesByRace = {
        human: {
            first: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
                    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
            last: ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
                   'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson']
        },
        elf: {
            first: ['Legolas', 'Arwen', 'Galadriel', 'Elrond', 'Thranduil', 'Celeborn', 'Tauriel', 'Haldir', 'Celebrimbor', 'Luthien',
                    'Aerin', 'Elenwe', 'Faelivrin', 'Nimrodel', 'Silvan', 'Thalion', 'Elwing', 'Glorfindel', 'Fingolfin', 'Feanor'],
            last: ['Greenleaf', 'Evenstar', 'Starlight', 'Silverleaf', 'Moonshadow', 'Sunstrider', 'Dawnbringer', 'Nightwalker',
                   'Swiftarrow', 'Windwhisper', 'Dreamweaver', 'Starsong', 'Moonblade', 'Lightfoot', 'Silverbough', 'Goldleaf']
        },
        dwarf: {
            first: ['Gimli', 'Thorin', 'Balin', 'Dwalin', 'Gloin', 'Oin', 'Bombur', 'Bifur', 'Bofur', 'Dori',
                    'Nori', 'Ori', 'Fili', 'Kili', 'Thrain', 'Dain', 'Durin', 'Fundin', 'Nain', 'Borin'],
            last: ['Ironfoot', 'Stonehelm', 'Oakenshield', 'Strongarm', 'Hammerhand', 'Anvilbreaker', 'Stonefist',
                   'Fireforge', 'Goldbeard', 'Ironheart', 'Steelaxe', 'Rockfist', 'Mountainson', 'Deepdelver']
        },
        orc: {
            first: ['Grom', 'Throk', 'Gorge', 'Karg', 'Gruk', 'Morg', 'Durg', 'Zog', 'Grug', 'Krull',
                    'Grisha', 'Mogra', 'Zagra', 'Murka', 'Gorka', 'Razra', 'Durga', 'Zogra', 'Grumra', 'Krulla'],
            last: ['Skullcrusher', 'Bonegrinder', 'Deathbringer', 'Bloodfist', 'Skullsplitter', 'Ironjaw',
                   'Hellscream', 'Doomhammer', 'Warmaul', 'Blacktooth', 'Bloodaxe', 'Gorefist', 'Deadeye']
        },
        halfling: {
            first: ['Bilbo', 'Frodo', 'Sam', 'Merry', 'Pippin', 'Rosie', 'Elanor', 'Hamfast', 'Adelard', 'Paladin',
                    'Primula', 'Esmeralda', 'Pearl', 'Marigold', 'Daisy', 'May', 'Bell', 'Lily', 'Ruby', 'Robin'],
            last: ['Baggins', 'Gamgee', 'Took', 'Brandybuck', 'Proudfoot', 'Goodbody', 'Greenhand', 'Burrows',
                   'Smallburrow', 'Fairbairn', 'Hornblower', 'Boffin', 'Bolger', 'Bracegirdle', 'Chubb', 'Sackville']
        },
        gnome: {
            first: ['Fizban', 'Gimble', 'Glim', 'Gerbo', 'Wrenn', 'Zook', 'Fibble', 'Dabbledob', 'Warryn', 'Nebin',
                    'Tana', 'Lilli', 'Nyx', 'Zan', 'Ellywick', 'Zanna', 'Tink', 'Breena', 'Mardnab', 'Donella'],
            last: ['Geargrinder', 'Tinkertop', 'Clockworker', 'Sparklegem', 'Quickwit', 'Cogspinner', 'Fizzlebang',
                   'Toggleswitch', 'Nimbletoes', 'Bumblebelly', 'Fastfingers', 'Sprocketwhistle', 'Gadgetspring']
        },
        dragonborn: {
            first: ['Bharash', 'Ghesh', 'Kriv', 'Medrash', 'Torinn', 'Heskan', 'Rhogar', 'Shamash', 'Valanth', 'Arjhan',
                    'Akra', 'Kava', 'Perrin', 'Sora', 'Surina', 'Thava', 'Uadjit', 'Vezera', 'Rina', 'Nala'],
            last: ['Clethinthiallor', 'Daardendrian', 'Delmirev', 'Drachedandion', 'Fenkenkabradon', 'Kepeshkmolik',
                   'Kerrhylon', 'Kimbatuul', 'Linxakasendalor', 'Myastan', 'Nemmonis', 'Norixius', 'Ophinshtalajiir']
        },
        tiefling: {
            first: ['Akmenos', 'Amnon', 'Barakas', 'Damakos', 'Ekemon', 'Kairon', 'Leucis', 'Melech', 'Mordai', 'Morthos',
                    'Akta', 'Anakis', 'Bryseis', 'Criella', 'Damaia', 'Ea', 'Kallista', 'Lerissa', 'Makaria', 'Nemeia'],
            last: ['Shadowhorn', 'Duskwalker', 'Flameheart', 'Nightshade', 'Bloodwrath', 'Grimfire', 'Hellbane',
                   'Thorngage', 'Cruelgaze', 'Dreadwhisper', 'Soulkeeper', 'Darkblood', 'Fiendson', 'Devilkin']
        }
    };
    
    // Get name lists for selected race
    const nameList = namesByRace[race] || namesByRace.human;
    
    // Generate random first and last names
    const firstName = nameList.first[Math.floor(Math.random() * nameList.first.length)];
    const lastName = nameList.last[Math.floor(Math.random() * nameList.last.length)];
    
    // Check if name already exists
    const nameExists = characters.some(char =>
        char.firstName.toLowerCase() === firstName.toLowerCase() &&
        char.lastName.toLowerCase() === lastName.toLowerCase()
    );
    
    // If name exists, try again
    if (nameExists) {
        generateRandomName();
        return;
    }
    
    // Display the generated name
    firstNameSpan.textContent = firstName;
    lastNameSpan.textContent = lastName;
    resultDiv.style.display = 'block';
    
    // Update race field if it's empty
    const raceField = document.getElementById('race');
    if (raceField && !raceField.value) {
        raceField.value = race.charAt(0).toUpperCase() + race.slice(1);
    }
}

function acceptGeneratedName() {
    const firstNameSpan = document.getElementById('generatedFirstName');
    const lastNameSpan = document.getElementById('generatedLastName');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    
    if (firstNameSpan && lastNameSpan && firstNameInput && lastNameInput) {
        // If the input fields already have content, don't overwrite them
        // Only set the value if the field is empty
        if (!firstNameInput.value.trim()) {
            firstNameInput.value = firstNameSpan.textContent;
        }
        
        if (!lastNameInput.value.trim()) {
            lastNameInput.value = lastNameSpan.textContent;
        }
        
        // Hide the result div
        document.getElementById('generatedNameResult').style.display = 'none';
        
        // Show success message
        Core.showToast('Name applied successfully');
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

// Set up form validation and initialization
function setupFormValidation() {
    const form = document.getElementById('characterForm');
    if (!form) return;
    
    // Initialize dropdowns with the latest data
    initializeDropdowns();
    
    // Initialize custom fields
    initializeCustomFields();
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear any validation errors before processing the form
        form.querySelectorAll('.validation-error').forEach(el => el.remove());
        form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        
        // Check if we're in edit mode
        const submitButton = this.querySelector('button[type="submit"]');
        const isEditMode = submitButton && submitButton.dataset.editMode === 'true';
        
        if (isEditMode && submitButton.dataset.characterId) {
            // Check for similar names before updating
            const firstName = this.firstName.value.trim();
            const lastName = this.lastName.value.trim();
            
            // Find similar names but exclude the one we're editing
            const similarName = findSimilarName(firstName, lastName, submitButton.dataset.characterId);
            
            if (similarName) {
                // Show warning about similar name
                // Create temporary form data to use in confirmation
                window.temporaryFormData = {
                    firstName: this.firstName.value,
                    lastName: this.lastName.value,
                    title: this.title.value,
                    series: this.series.value,
                    book: this.book.value,
                    role: this.role.value,
                    // Other fields will be collected later if user confirms
                };
                
                // Use our custom confirmation dialog
                Core.showConfirmationDialog(
                    `Warning: This name is very similar to existing character "${similarName.firstName} ${similarName.lastName}". Continue with update?`,
                    () => {
                        // User confirmed the update
                        // Add the updated character back to the array
                        handleFormSubmit(e);
                    },
                    () => {
                        // User canceled the update
                        Core.showToast('Character update canceled');
                    }
                );
                return; // Return early to prevent the rest of the function from executing
            }
            
            // If no similar names, proceed with the update
            handleFormSubmit(e);
            
            // Reset the edit mode
            window.currentEditingCharacterId = null;
            window.originalEditCharacter = null;
        } else {
            // Add new character
            handleFormSubmit(e);
        }
    });
}

// Find similar name in characters array but exclude the one we're editing
function findSimilarName(firstName, lastName, excludeId) {
    if (!firstName) return null;
    
    return characters.find(char => {
        // Skip the character we're currently editing
        if (char.id === excludeId) return false;
        
        // Consider it similar if first name and at least one letter of last name match
        return char.firstName.toLowerCase() === firstName.toLowerCase() && 
               (lastName && char.lastName && 
                char.lastName.toLowerCase().charAt(0) === lastName.toLowerCase().charAt(0));
    });
}

// Export characters functions
window.Characters = {
    initializeImageUpload,
    initializeRichTextEditor,
    updateDropdown,
    initializeDropdowns,
    handleDropdownChange,
    addNewItem,
    cancelNewItem,
    initializeCustomFields,
    addCustomField,
    removeCustomField,
    displayCharacters,
    handleFormSubmit,
    showCharacterDetails,
    editCharacter,
    deleteCharacter,
    clearForm,
    sortTable,
    setupAutosave,
    charactersPerPage,
    currentCharacterPage,
    unsavedChanges,
    generateRandomName,
    acceptGeneratedName,
    savePaginationSettings,
    loadPaginationSettings,
    clearTagFilter,
    initializeTitles,
    initializeRoles,
    setupFormValidation,
    findSimilarName,
    loadCharacters
};

// Initialize the module
window.addEventListener('load', function() {
    // Initialize titles and roles
    initializeTitles();
    initializeRoles();
    
    // Set up event handlers for page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeImageUpload();
        initializeRichTextEditor();
        
        // Make sure we have the latest titles and roles data
        updateDropdown('title', titles);
        updateDropdown('role', roles);
        
        // Set up form validation
        setupFormValidation();
    });
    
    // Listen for database change events
    window.addEventListener('database-loaded', function() {
        // Refresh titles and roles when database changes
        initializeTitles();
        initializeRoles();
        updateDropdown('title', titles);
        updateDropdown('role', roles);
    });
});

// Add this near the top of the characters.js file, after the initial variable declarations
// This creates a globally accessible function that will be available everywhere

// Create a global function to show character details that any module can call directly
window.showCharacterPopup = function(characterId) {
    try {
        console.log('showCharacterPopup called with ID:', characterId);
        
        // Get access to characters array
        const characters = window.characters || [];
        if (!characters.length) {
            console.error('No characters available');
            return;
        }
        
        // Find character by ID
        const character = characters.find(c => c.id === characterId);
        if (!character) {
            console.error('Character not found with ID:', characterId);
            return;
        }
        
        // Create popup
        const popup = document.createElement('div');
        popup.className = 'character-popup';
        popup.style.position = 'fixed';
        popup.style.top = '0';
        popup.style.left = '0';
        popup.style.width = '100%';
        popup.style.height = '100%';
        popup.style.backgroundColor = 'rgba(0,0,0,0.7)';
        popup.style.zIndex = '1000';
        popup.style.display = 'flex';
        popup.style.justifyContent = 'center';
        popup.style.alignItems = 'center';
        
        // Create popup content
        popup.innerHTML = `
            <div class="popup-content" style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; width: 95%; max-height: 80vh; overflow-y: auto;">
                <span style="position: absolute; right: 15px; top: 10px; cursor: pointer; font-size: 24px;" onclick="this.parentElement.parentElement.remove()">×</span>
                <h2>${character.firstName || ''} ${character.lastName || ''}</h2>
                
                <div style="margin-bottom: 15px;">
                    <h3>Personal Information</h3>
                    <p><strong>Title:</strong> ${character.title || 'N/A'}</p>
                    <p><strong>Sex:</strong> ${character.sex || 'N/A'}</p>
                    <p><strong>Race:</strong> ${character.race || 'N/A'}</p>
                </div>

                <div style="margin-bottom: 15px;">
                    <h3>Story Information</h3>
                    <p><strong>Series:</strong> ${character.series || 'N/A'}</p>
                    <p><strong>Book:</strong> ${character.book || 'N/A'}</p>
                    <p><strong>Role:</strong> ${character.role || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <h3>Notes</h3>
                    <div>${character.notes || 'No notes available'}</div>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(popup);
        
        // Close when clicking outside
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                popup.remove();
            }
        });
        
    } catch (error) {
        console.error('Error in showCharacterPopup:', error);
        alert('Error displaying character: ' + error.message);
    }
};

/**
 * Load and display characters
 */
function loadCharacters() {
    // Load characters from localStorage
    try {
        const charactersData = localStorage.getItem('characters');
        if (charactersData) {
            characters = JSON.parse(charactersData);
            window.characters = characters; // Make sure global reference is updated
            console.log(`Loaded ${characters.length} characters from storage`);
        } else {
            characters = [];
            window.characters = [];
            console.log('No characters found in storage, initialized empty array');
        }
    } catch (error) {
        console.error('Error loading characters:', error);
        characters = [];
        window.characters = [];
    }
    
    // Display the loaded characters
    displayCharacters();
}
