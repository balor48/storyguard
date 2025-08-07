/**
 * Relationship management functionality for Story Database
 * Handles character relationships and visualization
 */

// Wrap everything in a self-executing function to avoid global scope pollution
(function() {
    // Skip initialization if module is already loaded
    if (window.Relationships) {
        console.log('Relationships module already initialized');
        return;
    }

    // Add Dashboard module check at the beginning
    if (typeof window.Dashboard === 'undefined') {
        console.warn('Dashboard module not found, activity logging will be disabled');
        window.Dashboard = {
            addActivity: (type, description, id) => {
                console.log('Activity logged:', { type, description, id });
            }
        };
    }

    // Add Core module check
    if (typeof window.Core === 'undefined') {
        console.error('Core module is required for relationships functionality');
        return; // Exit if Core module is not available
    }

    // Initialize global variables
    window.relationships = window.relationships || JSON.parse(localStorage.getItem('relationships') || '[]');
    const relationships = window.relationships;
    let comparisonCharacters = [];
    let selectedSourceCharacter = null;
    let selectedTargetCharacter = null;
    let selectedRelationshipType = null;

    // Initialize relationship types - will load defaults plus any user-added custom types
    // but won't include 'mother' in defaults (will preserve if user already added it)
    window.relationshipTypes = window.relationshipTypes || (function() {
        try {
            // Try to load from localStorage first
            const savedTypes = JSON.parse(localStorage.getItem('relationshipTypes') || '[]');
            
            if (savedTypes && savedTypes.length > 0) {
                // If there are saved types, use them
                return savedTypes;
            } else {
                // Otherwise start with defaults
                return ["friend", "family", "ally", "enemy", "mentor", "student", "lover", "rival", "other"];
            }
        } catch (e) {
            // If there's an error, return defaults
            console.error("Error loading relationship types:", e);
            return ["friend", "family", "ally", "enemy", "mentor", "student", "lover", "rival", "other"];
        }
    })();

    const relationshipTypes = window.relationshipTypes;

    // Initialize the relationship manager
    function initRelationshipManager() {
        try {
            console.log('Initializing relationship manager...');
            
            // Add required CSS styles for general UI elements
            addRequiredCSS();
            
            // Apply specialized styling to relationship panels
            // This will target the panel with "Relationship" header and make it blue
            styleRelationshipPanelHeaders();
            
            // Also apply after a slight delay to catch dynamically created elements
            setTimeout(() => {
                styleRelationshipPanelHeaders();
                // Update relationship type colors to ensure buttons are correctly colored
                updateRelationshipTypeColors();
            }, 500);
            
            // Check if we're on the relationships tab
            const relationshipsTab = document.getElementById('relationships-tab');
            if (!relationshipsTab) {
                console.error('Relationships tab element not found');
                return;
            }
            
            // Show the relationship manager
            const relationshipManager = document.querySelector('.relationship-manager-container');
            if (relationshipManager) {
                relationshipManager.style.display = 'block';
            }
            
            // Initialize character filter dropdown
            const characterFilter = document.getElementById('relationshipFilterCharacter');
            if (characterFilter) {
                // Keep the "All Characters" option
                characterFilter.innerHTML = '<option value="all">All Characters</option>';
                
                // Add all characters from the global characters array
                if (window.characters && Array.isArray(window.characters)) {
                    const sortedCharacters = [...window.characters].sort((a, b) => {
                        const nameA = `${a.firstName} ${a.lastName || ''}`.trim();
                        const nameB = `${b.firstName} ${b.lastName || ''}`.trim();
                        return nameA.localeCompare(nameB);
                    });
                    
                    sortedCharacters.forEach(char => {
                        const fullName = `${char.firstName} ${char.lastName || ''}`.trim();
                        const option = document.createElement('option');
                        option.value = fullName;
                        option.textContent = fullName;
                        characterFilter.appendChild(option);
                    });
                } else {
                    console.error('Global characters array not found');
                }
            } else {
                console.error('Character filter dropdown not found');
            }
            
            // Initialize components with error handling
            try {
            loadCharactersIntoTables();
            } catch (err) {
                console.error('Error loading characters into tables:', err);
            }
            
            try {
            setupEventListeners();
            } catch (err) {
                console.error('Error setting up event listeners:', err);
            }
            
            try {
            setupRelationshipTypeOptions();
            } catch (err) {
                console.error('Error setting up relationship type options:', err);
            }
            
            // Initialize displays with error handling
            try {
            updateRelationshipFilterDropdowns();
            } catch (err) {
                console.error('Error updating relationship filter dropdowns:', err);
            }
            
            try {
            displayRelationships();
            } catch (err) {
                console.error('Error displaying relationships:', err);
            }
            
            // Add listener for theme changes
            document.addEventListener('theme-change', function(e) {
                // Redraw relationship visualization to update colors for the new theme
                try {
                    updateFilteredVisualization();
                    // Re-apply panel styling on theme change
                    styleRelationshipPanelHeaders();
                } catch (err) {
                    console.error('Error updating visualization after theme change:', err);
                }
            });
            
            // Also listen for the class change on body element
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'class') {
                        // The class attribute of body changed, check if dark-mode was toggled
                        // Redraw visualization with new theme
                        try {
                            updateFilteredVisualization();
                            // Re-apply panel styling on class change
                            styleRelationshipPanelHeaders();
                        } catch (err) {
                            console.error('Error updating visualization after class mutation:', err);
                        }
                    }
                });
            });
            
            // Start observing changes to the body class
            observer.observe(document.body, { attributes: true });
            
            console.log('Relationship manager initialized successfully');
        } catch (error) {
            console.error('Error initializing relationship manager:', error);
        }
    }
    
    // Function to directly style relationship panel headers
    function styleRelationshipPanelHeaders() {
        // Clear any previous styling with this id
        const previousStyle = document.getElementById('relationship-panel-header-style');
        if (previousStyle) {
            previousStyle.remove();
        }
        
        // Add a single style element with very specific targeting
        const styleElement = document.createElement('style');
        styleElement.id = 'relationship-panel-header-style';
        styleElement.textContent = `
            /* Direct targeting for panels with 'Relationship' header text */
            div:has(> div:only-child:contains("Relationship")),
            div.header:contains("Relationship"),
            [role="dialog"] > div:first-child,
            .panel-header,
            .relationship-panel > div:first-child {
                background-color: #3498db !important;
                color: white !important;
            }
            
            /* Ensure all text in headers is white */
            div:has(> div:only-child:contains("Relationship")) *,
            div.header:contains("Relationship") *,
            [role="dialog"] > div:first-child *,
            .panel-header *,
            .relationship-panel > div:first-child * {
                color: white !important;
            }
        `;
        document.head.appendChild(styleElement);
        
        // One focused method - find div with exactly "Relationship" text and style upward
        document.querySelectorAll('div').forEach(div => {
            if (div.textContent && div.textContent.trim() === 'Relationship') {
                // This is our target text - style upward
                div.style.setProperty('background-color', '#3498db', 'important');
                div.style.setProperty('color', 'white', 'important');
                
                // Style parent if it exists (likely the panel header)
                const parent = div.parentElement;
                if (parent) {
                    parent.style.setProperty('background-color', '#3498db', 'important');
                    parent.style.setProperty('color', 'white', 'important');
                    
                    // Also style grandparent if it exists (might be panel container)
                    const grandparent = parent.parentElement;
                    if (grandparent && grandparent.firstElementChild === parent) {
                        grandparent.style.setProperty('background-color', '#3498db', 'important');
                    }
                }
            }
        });
    }
    
    // Function to update relationship lists with character data
    function updateRelationshipsList() {
        console.log('Updating relationship lists...');
        try {
            // Check if we're on the relationships tab
            const relationshipsTab = document.getElementById('relationships-tab');
            if (!relationshipsTab || !relationshipsTab.classList.contains('active')) {
                console.log('Not on relationships tab, skipping update');
                return;
            }
            
            // Update character filter dropdown
            updateRelationshipFilterDropdowns();
            
            // Reload characters into selection tables
            loadCharactersIntoTables();
            
            // Refresh the relationship display
            displayRelationships();
            
            // Update visualization
            updateFilteredVisualization();
            
            console.log('Relationship lists updated successfully');
        } catch (error) {
            console.error('Error updating relationship lists:', error);
        }
    }

    // Load characters into tables
    function loadCharactersIntoTables() {
        console.log('Loading characters into relationship tables...');
        
        // Get tables - Updated selectors to match HTML structure
        const sourceTable = document.querySelector('.character-selection .character-column:first-child .character-list table tbody');
        const targetTable = document.querySelector('.character-selection .character-column:last-child .character-list table tbody');
        
        if (!sourceTable || !targetTable) {
            console.error('Character tables not found');
            return;
        }
        
        // Use our central character source function
        const activeCharacters = getActiveCharacters();
        
        // Sort characters by name only once
        const sortedCharacters = [...activeCharacters].sort((a, b) => {
            return (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName);
        });
        
        // Use document fragments for better performance
        const sourceFragment = document.createDocumentFragment();
        const targetFragment = document.createDocumentFragment();
        
        // Create all rows first to avoid reflows
        sortedCharacters.forEach(character => {
            // Source table row
            const sourceRow = document.createElement('tr');
            sourceRow.innerHTML = `
                <td>${character.firstName || ''}</td>
                <td>${character.lastName || ''}</td>
            `;
            
            // Add event listeners using event delegation in setupEventListeners
            sourceRow.dataset.characterId = character.id || '';
            sourceRow.dataset.firstName = character.firstName || '';
            sourceRow.dataset.lastName = character.lastName || '';
            sourceFragment.appendChild(sourceRow);
            
            // Target table row (clone for efficiency)
            const targetRow = sourceRow.cloneNode(true);
            targetRow.dataset.characterId = character.id || '';
            targetRow.dataset.firstName = character.firstName || '';
            targetRow.dataset.lastName = character.lastName || '';
            targetFragment.appendChild(targetRow);
        });
        
        // Clear and append all at once
        sourceTable.innerHTML = '';
        targetTable.innerHTML = '';
        sourceTable.appendChild(sourceFragment);
        targetTable.appendChild(targetFragment);
        
        // Use event delegation for better performance
        setupTableEventDelegation();
    }

    // Setup event delegation for character tables
    function setupTableEventDelegation() {
        // Source table delegation
        const sourceTableContainer = document.querySelector('.character-selection .character-column:first-child .character-list table');
        if (sourceTableContainer) {
            // Remove existing listeners if any
            const oldSource = sourceTableContainer.cloneNode(true);
            sourceTableContainer.parentNode.replaceChild(oldSource, sourceTableContainer);
            
            // Add new delegated listener to the table itself
            oldSource.addEventListener('click', function(e) {
                const row = e.target.closest('tr');
                if (row) {
                    // Create temporary event object for the selection function
                    window.event = e;
                    
                    const character = {
                        id: row.dataset.characterId,
                        firstName: row.dataset.firstName,
                        lastName: row.dataset.lastName
                    };
                    selectSourceCharacter(character);
                }
            });
            
            // Make all rows look clickable and improve z-index
            const rows = oldSource.querySelectorAll('tbody tr');
            rows.forEach((row, index) => {
                row.style.cursor = 'pointer';
                // Ensure rows at the bottom have higher z-index
                row.style.position = 'relative';
                row.style.zIndex = rows.length - index; // Higher z-index for rows at the bottom
            });
            
            // Fix the table container styles to ensure proper event handling
            const listContainer = oldSource.closest('.character-list');
            if (listContainer) {
                listContainer.style.position = 'relative';
                // Ensure clicks can reach through any overlapping elements
                listContainer.style.zIndex = '10';
            }
        }
        
        // Target table delegation
        const targetTableContainer = document.querySelector('.character-selection .character-column:last-child .character-list table');
        if (targetTableContainer) {
            // Remove existing listeners if any
            const oldTarget = targetTableContainer.cloneNode(true);
            targetTableContainer.parentNode.replaceChild(oldTarget, targetTableContainer);
            
            // Add new delegated listener to the table itself
            oldTarget.addEventListener('click', function(e) {
                const row = e.target.closest('tr');
                if (row) {
                    // Create temporary event object for the selection function
                    window.event = e;
                    
                    const character = {
                        id: row.dataset.characterId,
                        firstName: row.dataset.firstName,
                        lastName: row.dataset.lastName
                    };
                    selectTargetCharacter(character);
                }
            });
            
            // Make all rows look clickable and improve z-index
            const rows = oldTarget.querySelectorAll('tbody tr');
            rows.forEach((row, index) => {
                row.style.cursor = 'pointer';
                // Ensure rows at the bottom have higher z-index
                row.style.position = 'relative';
                row.style.zIndex = rows.length - index; // Higher z-index for rows at the bottom
            });
            
            // Fix the table container styles to ensure proper event handling
            const listContainer = oldTarget.closest('.character-list');
            if (listContainer) {
                listContainer.style.position = 'relative';
                // Ensure clicks can reach through any overlapping elements
                listContainer.style.zIndex = '10';
            }
        }
    }

    // Function to ensure the relationship selection indicator exists
    function ensureSelectionIndicator() {
        // This function is no longer needed but kept as empty to prevent errors
        return null;
    }

    function selectCharacter(character, isSource = true) {
        if (isSource) {
            selectedSourceCharacter = character;
        } else {
            selectedTargetCharacter = character;
        }
        
        // Determine which table and input to update based on selection type
        const tableSelector = isSource ? 
            '.character-selection .character-column:first-child .character-list table' : 
            '.character-selection .character-column:last-child .character-list table';
        
        const inputSelector = isSource ? 
            '.character-selection .character-column:first-child input' : 
            '.character-selection .character-column:last-child input';
        
        // Update input box
        const input = document.querySelector(inputSelector);
        if (input) {
            input.value = getCharacterFullName(character);
            // Make input read-only when a character is selected
            input.readOnly = true;
        }
        
        // Find the table
        const table = document.querySelector(tableSelector);
        if (!table) {
            console.error(`Table not found: ${tableSelector}`);
            return;
        }
        
        // Clear previous selections in this table
        const allRows = table.querySelectorAll('tbody tr');
        allRows.forEach(row => {
            row.classList.remove('selected');
            // Reset all cells to normal
            Array.from(row.cells).forEach(cell => {
                cell.style.fontWeight = 'normal';
            });
        });
        
        if (character) {
            // Find matching row
            const characterName = getCharacterFullName(character);
            const selectedRow = Array.from(allRows).find(row => {
                const firstName = row.cells[0].textContent.trim();
                const lastName = row.cells[1].textContent.trim();
                const fullName = `${firstName} ${lastName}`.trim();
                return fullName === characterName;
            });
            
            if (selectedRow) {
                // Apply selection styling
                selectedRow.classList.add('selected');
                // Make both cells bold
                Array.from(selectedRow.cells).forEach(cell => {
                    cell.style.fontWeight = 'bold';
                });
            }
        }
        
        // Check if both characters are selected, and if so, check relationship count
        if (selectedSourceCharacter && selectedTargetCharacter) {
            const source = getCharacterFullName(selectedSourceCharacter);
            const target = getCharacterFullName(selectedTargetCharacter);
            
            // Skip this check if it's the same character (other validation will catch that)
            if (source !== target) {
                // Check existing relationship count
                const existingRelationships = relationships.filter(r => 
                    (r.character1 === source && r.character2 === target) || 
                    (r.character1 === target && r.character2 === source)
                );
                
                if (existingRelationships.length >= 3) {
                    // Show warning without disrupting the selection
                    setTimeout(() => {
                        // Use a small timeout to ensure the message appears after selection is complete
                        console.warn(`Maximum of 3 relationships already exist between ${source} and ${target}`);
                        
                        // Display message to user
                        const readyMessage = document.querySelector('.relationship-ready-message');
                        if (readyMessage) {
                            readyMessage.textContent = 'Warning: Maximum relationships reached';
                            readyMessage.style.color = '#ff9900';
                            readyMessage.style.display = 'block';
                        }
                    }, 100);
                }
            }
        }
        
        // Update add button state - FIXED: Now use checkEnableAddButton directly for consistency
        checkEnableAddButton();
    }

    function selectRelationshipType(type) {
        selectedRelationshipType = type;
        
        // Update visual selection in relationship table
        const allTypeOptions = document.querySelectorAll('.relationship-option');
        allTypeOptions.forEach(row => row.classList.remove('selected-relationship'));
        
        if (type) {
            const selectedType = Array.from(allTypeOptions).find(option => 
                option.getAttribute('data-type')?.toLowerCase() === type.toLowerCase()
            );
            if (selectedType) {
                selectedType.classList.add('selected-relationship');
            }
        }
        
        checkEnableAddButton();
    }

    function updateSelectionIndicator() {
        // This function is no longer needed but kept as empty to prevent errors
        return;
    }

    function clearSelections() {
        selectedSourceCharacter = null;
        selectedTargetCharacter = null;
        selectedRelationshipType = null;
        
        // Clear all input boxes in the character selection area
        const sourceInput = document.querySelector('.character-selection .character-column:first-child input');
        const targetInput = document.querySelector('.character-selection .character-column:last-child input');
        
        if (sourceInput) {
            sourceInput.value = '';
            sourceInput.readOnly = true; // Ensure input stays read-only
        }
        if (targetInput) {
            targetInput.value = '';
            targetInput.readOnly = true; // Ensure input stays read-only
        }
        
        // Clear all highlighted rows in both tables
        const sourceTables = document.querySelectorAll('.character-selection .character-column:first-child .character-list table');
        const targetTables = document.querySelectorAll('.character-selection .character-column:last-child .character-list table');
        
        [sourceTables, targetTables].forEach(tables => {
            tables.forEach(table => {
                const rows = table.querySelectorAll('tbody tr.selected');
                rows.forEach(row => {
                    row.classList.remove('selected');
                    // Un-bold all cells
                    Array.from(row.cells).forEach(cell => {
                        cell.style.fontWeight = 'normal';
                    });
                });
            });
        });
        
        // Reset relationship type selection
        const relationshipOptions = document.querySelectorAll('.relationship-option');
        relationshipOptions.forEach(option => {
            option.classList.remove('selected-relationship');
        });
        
        // Clear any displayed validation errors
        const feedbackMsg = document.getElementById('relationshipFeedback');
        if (feedbackMsg) {
            feedbackMsg.style.display = 'none';
        }
        
        // Reset status text
        const statusText = document.getElementById('relationshipStatusText');
        if (statusText) {
            statusText.textContent = "Create a Relationship";
        }
        
        // Update the Add Relationship button state
        checkEnableAddButton();
    }

    // Set source/target character selection functions to use selectCharacter
    function selectSourceCharacter(character) {
        selectCharacter(character, true);
    }

    function selectTargetCharacter(character) {
        selectCharacter(character, false);
    }

    // Make sure the add button is enabled only when all selections are made
    function checkEnableAddButton() {
        const addButton = document.getElementById('addRelationshipBtn');
        if (!addButton) return;
        
        // Status text element
        const statusText = document.getElementById('relationshipStatusText');
        
        // First check if all three selections are made
        const selectionsComplete = selectedSourceCharacter && selectedTargetCharacter && selectedRelationshipType;
        
        // Default to disabled
        let canAdd = false;
        
        if (selectionsComplete) {
            // Now check for invalid conditions
            
            // 1. Check if trying to create relationship with self
            const isSelfRelationship = getCharacterFullName(selectedSourceCharacter) === getCharacterFullName(selectedTargetCharacter);
            
            // 2. Check if this specific relationship type already exists
            const char1 = getCharacterFullName(selectedSourceCharacter);
            const char2 = getCharacterFullName(selectedTargetCharacter);
            
            const relationshipExists = relationships.some(r => 
                ((r.character1 === char1 && r.character2 === char2) || 
                 (r.character1 === char2 && r.character2 === char1)) && 
                r.type.toLowerCase() === selectedRelationshipType.toLowerCase()
            );
            
            // 3. Check total relationship count between these characters
            const existingRelationships = relationships.filter(r => 
                (r.character1 === char1 && r.character2 === char2) || 
                (r.character1 === char2 && r.character2 === char1)
            );
            
            const tooManyRelationships = existingRelationships.length >= 3;
            
            // Only enable if all conditions are clear
            canAdd = selectionsComplete && !isSelfRelationship && !relationshipExists && !tooManyRelationships;
            
            // Log validation details for easier debugging
            console.log('Checking Add Button state:', {
                selectionsComplete,
                isSelfRelationship,
                relationshipExists,
                tooManyRelationships,
                canAdd
            });
            
            // Update status text element
            if (statusText) {
                if (isSelfRelationship) {
                    statusText.textContent = "Identical characters selected";
                } else if (tooManyRelationships) {
                    statusText.textContent = "Already have three relationships";
                } else {
                    statusText.textContent = "Create a Relationship";
                }
            }
            
            // If we can't add, provide feedback on why
            if (!canAdd && selectionsComplete) {
                if (isSelfRelationship) {
                    // Don't need to show this error, just keep button disabled
                    console.log("Can't create relationship with self");
                } else if (relationshipExists) {
                    // Don't need to show this error, just keep button disabled
                    console.log("This relationship already exists");
                } else if (tooManyRelationships) {
                    // Don't need to show this error, just keep button disabled
                    console.log("Maximum of 3 relationships between these characters reached");
                }
            }
        } else {
            // Reset status text when selections are incomplete
            if (statusText) {
                statusText.textContent = "Create a Relationship";
            }
        }
        
        // Update button state
        addButton.disabled = !canAdd;
        
        // Update button appearance with both class and inline style for maximum compatibility
        if (canAdd) {
            addButton.classList.add('enabled');
            addButton.style.backgroundColor = '#2ecc71'; // Green color
            // Change text to match selection
            addButton.textContent = `Add ${selectedRelationshipType} Relationship`;
        } else {
            addButton.classList.remove('enabled');
            addButton.style.backgroundColor = '#e74c3c'; // Red color
            addButton.textContent = 'Add Relationship';
        }
        
        // If we have enough info, show "Ready to add" message
        const readyMessage = document.querySelector('.relationship-ready-message');
        if (readyMessage) {
            if (canAdd) {
                readyMessage.textContent = 'Ready to add relationship';
                readyMessage.style.display = 'block';
            } else {
                readyMessage.style.display = 'none';
            }
        }
    }

    // Create a separate function for updating button state (for legacy code compatibility)
    function updateAddButtonState() {
        // Forward to the main function for consistency
        checkEnableAddButton();
    }

    // Initialize event listeners
    function setupEventListeners() {
        // Search functionality
        document.querySelectorAll('.character-search').forEach(input => {
            // Make input read-only
            input.readOnly = true;
            
            input.addEventListener('input', (e) => {
                const tableClass = e.target.closest('.character-column').querySelector('table').classList[0];
                filterTable(tableClass, e.target.value);
            });
        });
        
        // Add relationship button
        const addButton = document.getElementById('addRelationshipBtn');
        if (addButton) {
            addButton.addEventListener('click', createNewRelationship);
        }
        
        // Clear button
        const clearButton = document.getElementById('clearRelationshipBtn');
        if (clearButton) {
            clearButton.addEventListener('click', clearSelections);
        }
        
        // Filter Apply button
        const applyFilterBtn = document.querySelector('button[type="button"].btn-primary, button.apply-btn');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', function() {
                applyFilters();
            });
        }
        
        // Filter Clear button
        const clearFilterBtn = document.querySelector('button[type="button"].btn-secondary, button.clear-btn');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', function() {
                clearFilters();
            });
        }
    }
    
    // Apply relationship filters
    function applyFilters() {
        const typeFilter = document.getElementById('relationshipFilterType');
        const characterFilter = document.getElementById('relationshipFilterCharacter');
        
        if (typeFilter && characterFilter) {
            // Store filter selections in localStorage for persistence
            localStorage.setItem('relationshipFilterType', typeFilter.value);
            localStorage.setItem('relationshipFilterCharacter', characterFilter.value);
            
            // Update the display with the filters applied
            displayRelationships();
            
            // Also update the visualization which uses the same filters
            updateFilteredVisualization();
        }
    }
    
    // Clear relationship filters
    function clearFilters() {
        const typeFilter = document.getElementById('relationshipFilterType');
        const characterFilter = document.getElementById('relationshipFilterCharacter');
        
        if (typeFilter) typeFilter.value = 'all';
        if (characterFilter) characterFilter.value = 'all';
        
        // Clear stored filter values
        localStorage.removeItem('relationshipFilterType');
        localStorage.removeItem('relationshipFilterCharacter');
        
        // Update displays
        displayRelationships();
        updateFilteredVisualization();
        
        Core.showToast('Filters cleared');
    }

    // Set up relationship type options
    function setupRelationshipTypeOptions() {
        const relationshipOptionsContainer = document.querySelector('.relationship-options');
        if (!relationshipOptionsContainer) {
            console.error('Relationship options container not found');
            return;
        }
        
        console.log('Setting up relationship type options');
        
        // Clear existing options
        relationshipOptionsContainer.innerHTML = '';
        
        // Add relationship types from the saved list
        relationshipTypes.forEach(type => {
            const option = document.createElement('div');
            option.className = 'relationship-option';
            option.setAttribute('data-type', type.toLowerCase());
            
            // Get color for this relationship type - ensure we get the custom color if set
            const relColor = getRelationshipColor(type.toLowerCase());
            option.style.backgroundColor = relColor;
            option.style.color = 'white';
            option.style.textShadow = '0px 0px 3px rgba(0, 0, 0, 0.7)';
            
            // Add text and edit icon
            option.innerHTML = `
                <span>${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}</span>
                <i class="fas fa-palette color-picker-icon" title="Change color"></i>
            `;
            relationshipOptionsContainer.appendChild(option);
            
            // Add color picker functionality
            const colorPickerIcon = option.querySelector('.color-picker-icon');
            if (colorPickerIcon) {
                colorPickerIcon.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent selecting the relationship type
                    showColorPickerForRelationshipType(type, relColor);
                });
            }
            
            // Add click event for selecting relationship type
            option.addEventListener('click', function() {
                selectRelationshipType(type.toLowerCase());
            });
        });
        
        // Add "Add New..." option at the bottom
        const addNewOption = document.createElement('div');
        addNewOption.className = 'relationship-option add-new-relationship-type';
        addNewOption.innerHTML = '<i class="fas fa-plus"></i> Add New...';
        addNewOption.addEventListener('click', showAddRelationshipTypeDialog);
        relationshipOptionsContainer.appendChild(addNewOption);
        
        // Ensure selection indicator exists
        ensureSelectionIndicator();
        
        // Force an immediate update of colors from localStorage
        updateRelationshipTypeColors();
    }
    
    // Function to update the relationship type filter dropdown
    function updateRelationshipTypeFilter() {
        const typeFilter = document.getElementById('relationshipFilterType');
        if (!typeFilter) return;
        
        // Save current selection
        const currentValue = typeFilter.value;
        
        // Clear options except first one
        typeFilter.innerHTML = '<option value="all">All Relationship Types</option>';
        
        // Add relationship types from the saved list
        relationshipTypes.forEach(type => {
            const option = document.createElement('option');
            const displayName = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            option.value = type.toLowerCase();
            option.textContent = displayName + 's'; // Pluralize for the filter
            typeFilter.appendChild(option);
        });
        
        // Restore selection if possible
        if (Array.from(typeFilter.options).some(opt => opt.value === currentValue)) {
            typeFilter.value = currentValue;
        }
    }
    
    // Function to update the relationship filter dropdowns with current data
    function updateRelationshipFilterDropdowns() {
        console.log('Updating relationship filter dropdowns with current data');
        
        // Update the character filter dropdown
        const characterFilter = document.getElementById('relationshipFilterCharacter');
        if (characterFilter) {
            // Save current selection
            const currentValue = characterFilter.value;
            
            // Keep the "All Characters" option
            characterFilter.innerHTML = '<option value="all">All Characters</option>';
            
            // Get unique character names from relationships instead of all characters
            const uniqueCharacters = new Set();
            if (window.relationships && Array.isArray(window.relationships)) {
                window.relationships.forEach(rel => {
                    if (characterExists(rel.character1)) {
                        uniqueCharacters.add(rel.character1);
                    }
                    if (characterExists(rel.character2)) {
                        uniqueCharacters.add(rel.character2);
                    }
                });
            }
            
            // Sort characters alphabetically
            const sortedCharacters = Array.from(uniqueCharacters).sort();
            
            // Add each character that has relationships
            sortedCharacters.forEach(characterName => {
                const option = document.createElement('option');
                option.value = characterName;
                option.textContent = characterName;
                
                // Try to find the character ID if available
                const character = getActiveCharacters().find(c => {
                    const fullName = `${c.firstName} ${c.lastName || ''}`.trim();
                    return fullName === characterName;
                });
                
                if (character && character.id) {
                    option.setAttribute('data-character-id', character.id);
                }
                
                characterFilter.appendChild(option);
            });
            
            // Restore selection if possible
            if (Array.from(characterFilter.options).some(opt => opt.value === currentValue)) {
                characterFilter.value = currentValue;
            } else {
                // Set to first option if the previous selection is gone
                characterFilter.selectedIndex = 0;
            }
        }
        
        // Update the relationship type filter
        updateRelationshipTypeFilter();
        
        // Set up event listeners for the filters if they don't exist
        const filtersContainer = document.querySelector('.relationship-filters');
        if (filtersContainer && !filtersContainer.hasAttribute('data-listeners-set')) {
            // Character filter change
            const characterFilter = document.getElementById('relationshipFilterCharacter');
            if (characterFilter) {
                characterFilter.addEventListener('change', function() {
                    displayRelationships();
                });
            }
            
            // Type filter change
            const typeFilter = document.getElementById('relationshipFilterType');
            if (typeFilter) {
                typeFilter.addEventListener('change', function() {
                    displayRelationships();
                });
            }
            
            // Mark as initialized
            filtersContainer.setAttribute('data-listeners-set', 'true');
        }
    }
    
    // Function to show dialog for adding a new relationship type
    function showAddRelationshipTypeDialog() {
        // Check if dialog already exists
        let dialog = document.getElementById('addRelationshipTypeDialog');
        
        if (!dialog) {
            // Create dialog element
            dialog = document.createElement('div');
            dialog.id = 'addRelationshipTypeDialog';
            dialog.className = 'modal-dialog';
            dialog.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add New Relationship Type</h3>
                        <span class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label for="newRelationshipType">Type Name:</label>
                            <input type="text" id="newRelationshipType" placeholder="Enter relationship type...">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="cancel-btn" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                        <button type="button" class="add-btn" id="saveNewRelationshipType">Add</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            // Focus the input
            setTimeout(() => {
                document.getElementById('newRelationshipType').focus();
            }, 100);
            
            // Add event listeners
            document.getElementById('saveNewRelationshipType').addEventListener('click', saveNewRelationshipType);
            document.getElementById('newRelationshipType').addEventListener('keyup', function(event) {
                if (event.key === 'Enter') {
                    saveNewRelationshipType();
                }
            });
        } else {
            // Just show the existing dialog
            dialog.style.display = 'block';
            
            // Focus the input
            setTimeout(() => {
                document.getElementById('newRelationshipType').focus();
            }, 100);
        }
    }
    
    // Function to save a new relationship type
    function saveNewRelationshipType() {
        const input = document.getElementById('newRelationshipType');
        const newType = input.value.trim();
        
        if (!newType) {
            // Show error
            input.classList.add('error-input');
            setTimeout(() => input.classList.remove('error-input'), 2000);
            return;
        }
        
        // Check if type already exists (case insensitive)
        if (relationshipTypes.some(type => type.toLowerCase() === newType.toLowerCase())) {
            // Show error
            input.classList.add('error-input');
            Core.showToast('This relationship type already exists', 'error');
            setTimeout(() => input.classList.remove('error-input'), 2000);
            return;
        }
        
        // Add the new type
        relationshipTypes.push(newType.toLowerCase());
        
        // Save to localStorage
        localStorage.setItem('relationshipTypes', JSON.stringify(relationshipTypes));
        
        // Update UI
        setupRelationshipTypeOptions();
        
        // Show success message
        Core.showToast('New relationship type added successfully');
        
        // Close the dialog
        const dialog = document.getElementById('addRelationshipTypeDialog');
        if (dialog) {
            dialog.remove();
        }
    }

    // Filter table based on search input (optimized version)
    function filterTable(tableClass, searchText) {
        const lowerSearchText = searchText.toLowerCase();
        
        // Debounce by setting a timeout
        if (window.filterTableTimeout) {
            clearTimeout(window.filterTableTimeout);
        }
        
        window.filterTableTimeout = setTimeout(() => {
            // Get all rows at once to minimize DOM access
            const rows = document.querySelectorAll(`.${tableClass} tbody tr`);
            
            // Use requestAnimationFrame to avoid blocking the UI
            requestAnimationFrame(() => {
                // Process rows in batches to prevent UI blocking
                const batchSize = 100; // Process 100 rows at a time
                const totalRows = rows.length;
                let processedRows = 0;
                
                function processRowBatch() {
                    const limit = Math.min(processedRows + batchSize, totalRows);
                    
                    for (let i = processedRows; i < limit; i++) {
                        const row = rows[i];
            const firstName = row.cells[0].textContent.toLowerCase();
            const lastName = row.cells[1].textContent.toLowerCase();
            const fullName = `${firstName} ${lastName}`.trim();
            
            row.style.display = fullName.includes(lowerSearchText) ? '' : 'none';
                    }
                    
                    processedRows = limit;
                    
                    // If there are more rows to process, schedule next batch
                    if (processedRows < totalRows) {
                        requestAnimationFrame(processRowBatch);
                    }
                }
                
                // Start processing batches
                processRowBatch();
            });
        }, 150); // 150ms debounce time
    }

    // Validate that user has made all required selections for creating a relationship
    function validateSelections() {
        if (!selectedSourceCharacter) {
            // Don't show error for missing source character
            return false;
        }
        
        if (!selectedTargetCharacter) {
            showValidationError('Please select a target character');
            return false;
        }
        
        if (!selectedRelationshipType) {
            showValidationError('Please select a relationship type');
            return false;
        }
        
        // Get character names for checks
        const char1 = getCharacterFullName(selectedSourceCharacter);
        const char2 = getCharacterFullName(selectedTargetCharacter);
        
        // Check if this is the same character
        if (char1 === char2) {
            showValidationError("You can't create a relationship with yourself");
            return false;
        }
        
        // Check if this exact relationship already exists
        const existingRelationship = relationships.find(r => 
            (r.character1 === char1 && r.character2 === char2 && r.type === selectedRelationshipType) ||
            (r.character1 === char2 && r.character2 === char1 && r.type === selectedRelationshipType)
        );
        
        if (existingRelationship) {
            showValidationError('This relationship already exists');
            return false;
        }
        
        // Check total number of relationships between these characters (max 3)
        const existingRelationships = relationships.filter(r => 
            (r.character1 === char1 && r.character2 === char2) || 
            (r.character1 === char2 && r.character2 === char1)
        );
        
        if (existingRelationships.length >= 3) {
            showValidationError('Maximum of 3 relationships between these characters reached');
            return false;
        }
        
        return true;
    }

    // Create a new relationship between selected characters
    function createNewRelationship() {
        console.log('Creating new relationship...');
        
        // First run validation
        if (!validateSelections()) {
            return;
        }
        
        // Get character names
        const char1 = getCharacterFullName(selectedSourceCharacter);
        const char2 = getCharacterFullName(selectedTargetCharacter);
        
        // Create new relationship
        const newRelationship = {
            id: Core.generateId(),
            character1: char1,
            character2: char2,
            type: selectedRelationshipType,
            createdAt: new Date().toISOString()
        };
        
        // Add to array and save
        window.relationships.push(newRelationship);
        Core.safelyStoreItem('relationships', JSON.stringify(window.relationships));
        
        // Log this activity
        if (window.Dashboard) {
            window.Dashboard.addActivity(
                'relationship_added',
                `Added ${selectedRelationshipType} relationship between ${char1} and ${char2}`,
                newRelationship.id
            );
        }
            
        // Show success message
        Core.showToast(`Added ${selectedRelationshipType} relationship successfully`);
        
        // Clear any displayed error messages
        const feedbackMsg = document.getElementById('relationshipFeedback');
        if (feedbackMsg) {
            feedbackMsg.style.display = 'none';
        }
        
        // Reset UI
            clearSelections();
            
            // Update displays
            displayRelationships();
            updateFilteredVisualization();
            // Update character dropdown
            updateRelationshipFilterDropdowns();
            // Ensure relationship colors are reapplied after adding a new relationship
            updateRelationshipTypeColors();
    }

    // Core relationship functions
    function addRelationship(character1, character2, type) {
        if (!character1 || !character2 || !type) {
            console.error('Missing required parameters for addRelationship');
            return false;
        }

        const newRelationship = {
            id: Core.generateId(),
            character1: character1,
            character2: character2,
            type: type,
            createdAt: new Date().toISOString()
        };

        relationships.push(newRelationship);
        Core.safelyStoreItem('relationships', JSON.stringify(relationships));
        displayRelationships();
        updateFilteredVisualization();
        // Update character dropdown to reflect new relationship
        updateRelationshipFilterDropdowns();
        return true;
    }

    // Initialize the globally accessible Relationships object
    window.Relationships = window.Relationships || {};
    window.Relationships.initRelationshipManager = initRelationshipManager;
    window.Relationships.addRelationship = addRelationship;
    window.Relationships.displayRelationships = displayRelationships;
    window.Relationships.updateFilteredVisualization = updateFilteredVisualization;
    window.Relationships.handleCharacterDeleted = handleCharacterDeleted;
    window.Relationships.getRelationshipColor = getRelationshipColor;
    window.Relationships.createNewRelationship = createNewRelationship;
    window.Relationships.clearSelections = clearSelections;
    window.Relationships.loadCharactersIntoTables = loadCharactersIntoTables;
    window.Relationships.updateRelationshipFilterDropdowns = updateRelationshipFilterDropdowns;
    window.Relationships.updateRelationshipTypeColors = updateRelationshipTypeColors;
    window.Relationships.updateRelationshipTypeFilter = updateRelationshipTypeFilter;
    window.Relationships.selectForComparison = selectForComparison;
    window.Relationships.addComparisonRelationship = addComparisonRelationship;
    window.Relationships.showCharacterComparison = showCharacterComparison;
    window.Relationships.selectSourceCharacter = selectSourceCharacter;
    window.Relationships.selectTargetCharacter = selectTargetCharacter;
    window.Relationships.selectRelationshipType = selectRelationshipType;
    window.Relationships.updateSelectionIndicator = updateSelectionIndicator;
    window.Relationships.ensureSelectionIndicator = ensureSelectionIndicator;
    window.Relationships.checkEnableAddButton = checkEnableAddButton;
    window.Relationships.validateSelections = validateSelections;
    window.Relationships.openCharacterPanelByName = openCharacterPanelByName;
    window.Relationships.showValidationError = showValidationError;
    window.Relationships.applyFilters = applyFilters;
    window.Relationships.clearFilters = clearFilters;
    window.Relationships.updateRelationshipsList = updateRelationshipsList;
    window.Relationships.styleRelationshipPanelHeaders = styleRelationshipPanelHeaders;

    // Initialize the module when the DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM ready, initializing relationship manager...');
        try {
            // Add error listener to catch script errors
            window.addEventListener('error', function(event) {
                if (event.filename && event.filename.includes('relationships.js')) {
                    console.error('Relationship module error:', event.message, 'at line', event.lineno);
                    const errorLog = document.getElementById('errorLog');
                    if (errorLog) {
                        errorLog.innerHTML += `<div class="error">Relationship module error: ${event.message} at line ${event.lineno}</div>`;
                        errorLog.style.display = 'block';
                    }
                }
            });
            
            // Initialize with a short delay to ensure all DOM elements are available
            setTimeout(function() {
                if (typeof initRelationshipManager === 'function') {
                    try {
                        initRelationshipManager();
                        console.log('Relationship manager initialized successfully via DOMContentLoaded event');
                    } catch (e) {
                        console.error('Error initializing relationship manager:', e);
                        const errorLog = document.getElementById('errorLog');
                        if (errorLog) {
                            errorLog.innerHTML += `<div class="error">Error initializing relationship manager: ${e.message}</div>`;
                            errorLog.style.display = 'block';
                        }
                    }
                } else {
                    console.error('initRelationshipManager is not a function!');
                }
            }, 200);
        } catch (e) {
            console.error('Critical error in relationship module initialization:', e);
        }
    });

    // Run this code immediately to ensure characters are loaded
    (function() {
        console.log('Running immediate character loading check...');
        
        // Check if we're in the relationships tab
        const isRelationshipsTabActive = document.getElementById('relationships-tab')?.classList.contains('active');
        
        if (isRelationshipsTabActive) {
            console.log('Relationships tab is active on page load, initializing');
            // Wait a bit for DOM to fully initialize
            setTimeout(() => {
                // Try to load characters
                if (typeof window.Relationships !== 'undefined' && 
                    typeof window.Relationships.loadCharactersIntoTables === 'function') {
                    window.Relationships.initRelationshipManager();
                    console.log('Initialized relationship manager on page load');
                }
            }, 500);
        }
    })();

    // Character comparison functionality
    function selectForComparison(characterId) {
        console.log('Selecting character for comparison:', characterId);
        
        const character = typeof characterId === 'string' ? 
            window.characters.find(c => c.id === characterId || getCharacterFullName(c) === characterId) : 
            window.characters[characterId];
        
        if (!character) {
            console.error('Character not found for comparison:', characterId);
            return;
        }
        
        // Check if character is already selected for comparison
        const characterName = getCharacterFullName(character);
        if (comparisonCharacters.includes(characterName)) {
            console.log('Character already selected for comparison');
            return;
        }
        
        // Add to comparison array (max 2 characters)
        if (comparisonCharacters.length < 2) {
            comparisonCharacters.push(characterName);
            Core.showToast(`Added ${characterName} to comparison`);
            
            // If we have 2 characters, show comparison dialog
            if (comparisonCharacters.length === 2) {
                showCharacterComparison();
            }
        } else {
            // Replace the second character if we already have 2
            comparisonCharacters[1] = characterName;
            Core.showToast(`Added ${characterName} to comparison`);
            showCharacterComparison();
        }
    }

    // Show character comparison dialog
    function showCharacterComparison() {
        if (comparisonCharacters.length !== 2) {
            console.error('Need exactly 2 characters for comparison');
            return;
        }
        
        console.log('Showing comparison for:', comparisonCharacters);
        
        // Check if a relationship already exists
        const existingRelationship = window.relationships.find(rel => 
            (rel.character1 === comparisonCharacters[0] && rel.character2 === comparisonCharacters[1]) ||
            (rel.character1 === comparisonCharacters[1] && rel.character2 === comparisonCharacters[0])
        );
        
        if (existingRelationship) {
            // Show existing relationship
            Core.showToast(`These characters already have a ${existingRelationship.type} relationship`);
        } else {
            // Show relationship creation dialog
            const dialogContent = `
                <div class="comparison-dialog">
                    <h3>Create Relationship</h3>
                    <p>Create a relationship between ${comparisonCharacters[0]} and ${comparisonCharacters[1]}</p>
                    <select id="comparisonRelationshipType">
                        <option value="friend">Friend</option>
                        <option value="family">Family</option>
                        <option value="ally">Ally</option>
                        <option value="enemy">Enemy</option>
                        <option value="mentor">Mentor</option>
                        <option value="student">Student</option>
                        <option value="lover">Lover</option>
                        <option value="rival">Rival</option>
                        <option value="other">Other</option>
                    </select>
                    <div class="dialog-buttons">
                        <button onclick="Relationships.addComparisonRelationship()">Create</button>
                        <button onclick="UI.closeModal()">Cancel</button>
                    </div>
                </div>
            `;
            
            // Display dialog using UI module if available
            if (window.UI && window.UI.showModal) {
                UI.showModal('Create Relationship', dialogContent);
            } else {
                // Fallback
                const confirmed = confirm(`Create a relationship between ${comparisonCharacters[0]} and ${comparisonCharacters[1]}?`);
                if (confirmed) {
                    addComparisonRelationship();
                }
            }
        }
    }

    // Add a relationship from comparison selection
    function addComparisonRelationship() {
        const relationshipType = document.getElementById('comparisonRelationshipType')?.value || 'friend';
        saveComparisonRelationship(relationshipType);
    }

    // Save relationship from comparison
    function saveComparisonRelationship(type) {
        if (comparisonCharacters.length !== 2) {
            console.error('Need exactly 2 characters for comparison relationship');
            return;
        }
        
        // Create the relationship
        const newRelationship = {
            id: Core.generateId(),
            character1: comparisonCharacters[0],
            character2: comparisonCharacters[1],
            type: type,
            createdAt: new Date().toISOString()
        };

        // Add to relationships array
        window.relationships.push(newRelationship);
        
        // Save to localStorage
        if (Core.safelyStoreItem('relationships', JSON.stringify(window.relationships))) {
            Core.showToast(`Added ${type} relationship between ${comparisonCharacters[0]} and ${comparisonCharacters[1]}`);
            
            // Close modal if UI module is available
            if (window.UI && window.UI.closeModal) {
                UI.closeModal();
            }
            
            // Clear comparison selections
            comparisonCharacters = [];
            
            // Update displays
            displayRelationships();
            updateFilteredVisualization();
            // Update character dropdown to reflect new relationship
            updateRelationshipFilterDropdowns();
        } else {
            // If storage fails, remove the relationship
            window.relationships.pop();
            Core.showToast('Failed to save relationship', 'error');
        }
    }

    // Check for existing relationship types in localStorage
    function loadAndMergeRelationshipTypes() {
        try {
            // Get existing relationship types from localStorage
            const savedTypes = JSON.parse(localStorage.getItem('relationshipTypes') || '[]');
            
            // Default relationship types (without 'mother')
            const defaultTypes = ["friend", "family", "ally", "enemy", "mentor", "student", "lover", "rival", "other"];
            
            // Create a set to combine without duplicates (case-insensitive)
            const typesSet = new Set(defaultTypes.map(type => type.toLowerCase()));
            
            // Add any additional saved types that aren't already in the defaults
            savedTypes.forEach(type => {
                typesSet.add(type.toLowerCase());
            });
            
            // Convert back to array
            const mergedTypes = Array.from(typesSet);
            
            // Sort alphabetically for consistent display
            mergedTypes.sort();
            
            // Store back to localStorage and return
            localStorage.setItem('relationshipTypes', JSON.stringify(mergedTypes));
            window.relationshipTypes = mergedTypes;
            return mergedTypes;
        } catch (error) {
            console.error("Error merging relationship types:", error);
            return ["friend", "family", "ally", "enemy", "mentor", "student", "lover", "rival", "other"];
        }
    }

    // Show color picker for relationship type
    function showColorPickerForRelationshipType(type, currentColor) {
        console.log(`Opening color picker for ${type} with current color ${currentColor}`);
        
        // Get the actual current color (potentially from localStorage first)
        let actualCurrentColor = getRelationshipColor(type);
        console.log(`Actual current color from storage: ${actualCurrentColor}`);
        
        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.id = 'colorPickerModal';
        
        // Center the modal in the viewport
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.zIndex = '9999';
        
        // Parse the current color to RGB if it's in hex format
        let rgbColor = { r: 255, g: 0, b: 0 }; // Default red
        
        try {
            if (actualCurrentColor) {
                if (actualCurrentColor.startsWith('#')) {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(actualCurrentColor);
                    if (result) {
                        rgbColor = {
                            r: parseInt(result[1], 16),
                            g: parseInt(result[2], 16),
                            b: parseInt(result[3], 16)
                        };
                    }
                } else if (actualCurrentColor.startsWith('rgb')) {
                    const result = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(actualCurrentColor);
                    if (result) {
                        rgbColor = {
                            r: parseInt(result[1], 10),
                            g: parseInt(result[2], 10),
                            b: parseInt(result[3], 10)
                        };
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing color:', e);
        }
        
        // Format the hex value for display
        const hexValue = `#${rgbColor.r.toString(16).padStart(2, '0')}${rgbColor.g.toString(16).padStart(2, '0')}${rgbColor.b.toString(16).padStart(2, '0')}`.toUpperCase();
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '400px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.overflow = 'hidden';
        modalContent.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        modal.appendChild(modalContent);
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.padding = '15px';
        modalHeader.style.backgroundColor = '#f8f9fa';
        modalHeader.style.borderBottom = '1px solid #dee2e6';
        modalHeader.style.display = 'flex';
        modalHeader.style.justifyContent = 'space-between';
        modalHeader.style.alignItems = 'center';
        modalContent.appendChild(modalHeader);
        
        // Add header title
        const headerTitle = document.createElement('h4');
        headerTitle.textContent = `Choose Color for "${type}" Relationships`;
        headerTitle.style.margin = '0';
        modalHeader.appendChild(headerTitle);
        
        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.id = 'closeColorPicker';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.fontWeight = 'bold';
        modalHeader.appendChild(closeBtn);
        
        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.style.padding = '20px';
        modalBody.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#333' : '#fff';
        modalBody.style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#333';
        modalContent.appendChild(modalBody);
        
        // Create advanced color picker area
        const colorPickerArea = document.createElement('div');
        colorPickerArea.className = 'color-picker-area';
        colorPickerArea.style.display = 'flex';
        colorPickerArea.style.flexDirection = 'column';
        colorPickerArea.style.alignItems = 'center';
        colorPickerArea.style.marginBottom = '15px';
        modalBody.appendChild(colorPickerArea);
        
        // Add color picker box
        const colorPickerBox = document.createElement('div');
        colorPickerBox.className = 'color-picker-box';
        colorPickerBox.style.width = '100%';
        colorPickerBox.style.marginBottom = '20px';
        colorPickerBox.style.display = 'flex';
        colorPickerBox.style.flexDirection = 'column';
        colorPickerBox.style.alignItems = 'center';
        colorPickerArea.appendChild(colorPickerBox);
        
        // Add color palette selector
        const colorSelector = document.createElement('div');
        colorSelector.className = 'color-selector';
        colorSelector.style.position = 'relative';
        colorSelector.style.width = '100%';
        colorSelector.style.display = 'flex';
        colorSelector.style.justifyContent = 'center';
        colorSelector.style.marginBottom = '20px';
        colorPickerBox.appendChild(colorSelector);
        
        // Create color palette (simplified - using a rainbow gradient slider)
        const colorPalette = document.createElement('input');
        colorPalette.type = 'color';
        colorPalette.value = hexValue;
        colorPalette.style.width = '100%';
        colorPalette.style.height = '40px';
        colorPalette.style.border = '1px solid #ddd';
        colorPalette.style.borderRadius = '4px';
        colorPalette.style.cursor = 'pointer';
        colorSelector.appendChild(colorPalette);
        
        // Create RGB sliders container
        const sliderContainer = document.createElement('div');
        sliderContainer.style.width = '100%';
        sliderContainer.style.marginTop = '15px';
        colorPickerBox.appendChild(sliderContainer);
        
        // Red slider
        const redContainer = document.createElement('div');
        redContainer.style.marginBottom = '15px';
        sliderContainer.appendChild(redContainer);
        
        const redLabel = document.createElement('label');
        redLabel.htmlFor = 'redSlider';
        redLabel.innerHTML = `Red: <span id="redValue">${rgbColor.r}</span>`;
        redContainer.appendChild(redLabel);
        
        const redSlider = document.createElement('input');
        redSlider.type = 'range';
        redSlider.id = 'redSlider';
        redSlider.min = '0';
        redSlider.max = '255';
        redSlider.value = rgbColor.r;
        redSlider.className = 'color-slider';
        redSlider.style.width = '100%';
        redContainer.appendChild(redSlider);
        
        // Green slider
        const greenContainer = document.createElement('div');
        greenContainer.style.marginBottom = '15px';
        sliderContainer.appendChild(greenContainer);
        
        const greenLabel = document.createElement('label');
        greenLabel.htmlFor = 'greenSlider';
        greenLabel.innerHTML = `Green: <span id="greenValue">${rgbColor.g}</span>`;
        greenContainer.appendChild(greenLabel);
        
        const greenSlider = document.createElement('input');
        greenSlider.type = 'range';
        greenSlider.id = 'greenSlider';
        greenSlider.min = '0';
        greenSlider.max = '255';
        greenSlider.value = rgbColor.g;
        greenSlider.className = 'color-slider';
        greenSlider.style.width = '100%';
        greenContainer.appendChild(greenSlider);
        
        // Blue slider
        const blueContainer = document.createElement('div');
        blueContainer.style.marginBottom = '15px';
        sliderContainer.appendChild(blueContainer);
        
        const blueLabel = document.createElement('label');
        blueLabel.htmlFor = 'blueSlider';
        blueLabel.innerHTML = `Blue: <span id="blueValue">${rgbColor.b}</span>`;
        blueContainer.appendChild(blueLabel);
        
        const blueSlider = document.createElement('input');
        blueSlider.type = 'range';
        blueSlider.id = 'blueSlider';
        blueSlider.min = '0';
        blueSlider.max = '255';
        blueSlider.value = rgbColor.b;
        blueSlider.className = 'color-slider';
        blueSlider.style.width = '100%';
        blueContainer.appendChild(blueSlider);
        
        // Preview area
        const previewContainer = document.createElement('div');
        previewContainer.style.display = 'flex';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.justifyContent = 'space-between';
        previewContainer.style.marginTop = '15px';
        previewContainer.style.width = '100%';
        colorPickerBox.appendChild(previewContainer);
        
        const previewLabel = document.createElement('div');
        previewLabel.textContent = 'Preview:';
        previewContainer.appendChild(previewLabel);
        
        const colorPreview = document.createElement('div');
        colorPreview.id = 'colorPreview';
        colorPreview.style.width = '100px';
        colorPreview.style.height = '30px';
        colorPreview.style.backgroundColor = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
        colorPreview.style.border = '1px solid #ccc';
        colorPreview.style.borderRadius = '4px';
        previewContainer.appendChild(colorPreview);
        
        const hexDisplay = document.createElement('div');
        hexDisplay.id = 'hexValue';
        hexDisplay.textContent = hexValue;
        previewContainer.appendChild(hexDisplay);
        
        // Create modal footer with spread-out buttons
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalFooter.style.padding = '15px';
        modalFooter.style.backgroundColor = '#f8f9fa';
        modalFooter.style.borderTop = '1px solid #dee2e6';
        modalFooter.style.display = 'flex';
        modalFooter.style.justifyContent = 'space-between'; // This spreads the buttons apart
        modalContent.appendChild(modalFooter);
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelColorPicker';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.style.padding = '8px 16px';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.backgroundColor = '#6c757d';
        cancelBtn.style.color = 'white';
        modalFooter.appendChild(cancelBtn);
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveColor';
        saveBtn.textContent = 'Save';
        saveBtn.className = 'btn btn-primary';
        saveBtn.style.padding = '8px 16px';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '4px';
        saveBtn.style.cursor = 'pointer';
        saveBtn.style.backgroundColor = '#007bff';
        saveBtn.style.color = 'white';
        modalFooter.appendChild(saveBtn);
        
        // Add to document
        document.body.appendChild(modal);
        
        // Function to update color preview from RGB values
        const updateColorFromRgb = () => {
            const r = document.getElementById('redSlider').value;
            const g = document.getElementById('greenSlider').value;
            const b = document.getElementById('blueSlider').value;
            
            document.getElementById('redValue').textContent = r;
            document.getElementById('greenValue').textContent = g;
            document.getElementById('blueValue').textContent = b;
            
            const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`.toUpperCase();
            document.getElementById('colorPreview').style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            document.getElementById('hexValue').textContent = hex;
            colorPalette.value = hex;
            
            return hex;
        };
        
        // Function to update RGB sliders from hex color
        const updateRgbFromHex = (hexColor) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
            if (result) {
                const r = parseInt(result[1], 16);
                const g = parseInt(result[2], 16);
                const b = parseInt(result[3], 16);
                
                document.getElementById('redSlider').value = r;
                document.getElementById('greenSlider').value = g;
                document.getElementById('blueSlider').value = b;
                
                document.getElementById('redValue').textContent = r;
                document.getElementById('greenValue').textContent = g;
                document.getElementById('blueValue').textContent = b;
                
                document.getElementById('colorPreview').style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                document.getElementById('hexValue').textContent = hexColor.toUpperCase();
            }
        };
        
        // Add event listeners to sliders
        redSlider.addEventListener('input', updateColorFromRgb);
        greenSlider.addEventListener('input', updateColorFromRgb);
        blueSlider.addEventListener('input', updateColorFromRgb);
        
        // Add event listener to color picker
        colorPalette.addEventListener('input', function() {
            updateRgbFromHex(this.value);
        });
        
        // Close modal function
        const closeModal = () => {
            console.log('Closing color picker modal');
            const modalElement = document.getElementById('colorPickerModal');
            if (modalElement) {
                document.body.removeChild(modalElement);
            }
        };
        
        // Cancel button
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            closeModal();
        });
        
        // Close X button
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            closeModal();
        });
        
        // Save button
        saveBtn.addEventListener('click', () => {
            console.log('Save button clicked');
            const newColor = updateColorFromRgb();
            console.log(`Saving new color ${newColor} for type ${type}`);
            
            // Close the modal BEFORE calling saveRelationshipTypeColor to prevent UI update issues
            closeModal();
            
            // Now save the color and update the UI
            saveRelationshipTypeColor(type, newColor);
            
            // Additional call to update all relationship type buttons
            updateRelationshipTypeColors();
        });
    }

    // Save relationship type color
    function saveRelationshipTypeColor(type, color) {
        try {
            console.log(`Saving color ${color} for relationship type ${type}`);
            
            // Get custom colors from localStorage
            let customColors = {};
            try {
                const storedColors = localStorage.getItem('relationshipColors');
                if (storedColors) {
                    customColors = JSON.parse(storedColors);
                }
            } catch (e) {
                console.error('Error parsing stored relationship colors:', e);
            }
            
            // Update the color for this type
            customColors[type.toLowerCase()] = color;
            
            // Save back to localStorage
            localStorage.setItem('relationshipColors', JSON.stringify(customColors));
            
            // Force immediate color updates to all elements
            console.log(`Updating UI elements with new color ${color} for type ${type}`);
            
            // Reset the entire UI
            // 1. Update buttons in the relationship options panel
            document.querySelectorAll('.relationship-option').forEach(option => {
                const optionType = option.getAttribute('data-type');
                if (optionType) {
                    // Get the correct color (either custom or default)
                    const relationshipColor = getRelationshipColor(optionType);
                    option.style.backgroundColor = relationshipColor;
                    console.log(`Set option ${optionType} color to ${relationshipColor}`);
                }
            });
            
            // 2. Update relationship type badges in the relationship table
            document.querySelectorAll('.relationship-type').forEach(badge => {
                const badgeType = badge.textContent.trim().toLowerCase();
                const relationshipColor = getRelationshipColor(badgeType);
                badge.style.backgroundColor = relationshipColor;
                console.log(`Set badge ${badgeType} color to ${relationshipColor}`);
            });
            
            // 3. Update the selection indicator if it exists
            const selectionIndicator = document.getElementById('relationshipSelectionIndicator');
            if (selectionIndicator) {
                const indicatorText = selectionIndicator.textContent;
                const match = indicatorText.match(/Selected: (.+)$/);
                if (match && match[1]) {
                    const selectedType = match[1].trim().toLowerCase();
                    const relationshipColor = getRelationshipColor(selectedType);
                    selectionIndicator.style.backgroundColor = relationshipColor;
                    console.log(`Set selection indicator for ${selectedType} to ${relationshipColor}`);
                }
            }
            
            // 4. Force a complete redraw of the relationship table
            console.log('Forcing complete relationship table redraw');
            displayRelationships();
            
            // 5. Redraw network visualization to update the relationship lines
            if (window.relationships && window.relationships.length > 0) {
                console.log(`Updating network visualization for all relationships`);
                updateNetworkVisualization(window.relationships);
            }
            
            // Show toast notification
            if (window.Core && typeof window.Core.showToast === 'function') {
                Core.showToast(`Updated color for ${type} relationships`, 'success');
            } else {
                console.log(`Updated color for ${type} relationships`);
            }
        } catch (error) {
            console.error('Error saving relationship type color:', error);
            if (window.Core && typeof window.Core.showToast === 'function') {
                Core.showToast('Error updating relationship color', 'error');
            }
        }
    }

    // Update all relationship type colors in the UI
    function updateRelationshipTypeColors() {
        console.log('Updating relationship type colors');
        
        // Get custom colors from localStorage
        let customColors = {};
        try {
            const storedColors = localStorage.getItem('relationshipColors');
            if (storedColors) {
                customColors = JSON.parse(storedColors);
            }
        } catch (e) {
            console.error('Error parsing stored relationship colors:', e);
        }
        
        // 1. Update relationship option buttons - more comprehensive selector
        document.querySelectorAll('.relationship-option, div[data-type], [class*="relationship"][data-type]').forEach(option => {
            const type = option.getAttribute('data-type');
            if (type) {
                const color = getRelationshipColor(type);
                option.style.backgroundColor = color;
                console.log(`Updated option with data-type=${type} to color ${color}`);
            }
        });
        
        // 2. Update relationship type badges in the table and relationship list
        document.querySelectorAll('.relationship-type, span.relationship-type, div.relationship-type, [class*="relationship-type"], .relationship-icons-container .relationship-icon span').forEach(badge => {
            const type = badge.textContent.trim().toLowerCase();
            if (type && relationshipTypes.includes(type.toLowerCase())) {
                const color = getRelationshipColor(type);
                badge.style.backgroundColor = color;
                console.log(`Set badge with text "${type}" to color ${color}`);
                
                // If the parent has the relationship-icon class, update the parent's background too
                const parentIcon = badge.closest('.relationship-icon');
                if (parentIcon) {
                    parentIcon.style.backgroundColor = color;
                }
            }
        });
        
        // 3. Update the selection indicator if a type is selected
        const selectedType = document.querySelector('.relationship-option.selected-relationship');
        if (selectedType) {
            const type = selectedType.getAttribute('data-type');
            const selectionIndicator = document.getElementById('relationshipSelectionIndicator');
            if (selectionIndicator && type) {
                selectionIndicator.style.backgroundColor = getRelationshipColor(type);
            }
        }
        
        // 4. Update dropdown selector options (for filtering)
        document.querySelectorAll('#relationshipTypeFilter option, #relationshipFilterType option, #char1RelationshipFilter option, #char2RelationshipFilter option').forEach(option => {
            const type = option.textContent.trim().toLowerCase().replace('s', ''); // Remove trailing 's' from plurals
            if (type && type !== 'all' && type !== 'all relationship type') {
                option.setAttribute('data-color', getRelationshipColor(type));
            }
        });
        
        // 5. Update Add Relationship button if a relationship type is selected
        if (selectedRelationshipType) {
            const addButton = document.getElementById('addRelationshipBtn');
            if (addButton && addButton.classList.contains('enabled')) {
                addButton.textContent = `Add ${selectedRelationshipType} Relationship`;
            }
        }
        
        // 6. Update network visualization lines
        if (window.relationships && window.relationships.length > 0) {
            updateNetworkVisualization(window.relationships);
        }
    }

    // Handle character deletion by removing all relationships involving that character
    function handleCharacterDeleted(characterId) {
        console.log(`Handling deletion of character with ID: ${characterId}`);
        
        // Find the character name based on ID (look in all possible sources)
        let characterName = '';
        
        // First try the current window.characters
        if (window.characters && Array.isArray(window.characters)) {
            const character = window.characters.find(c => c.id === characterId);
            if (character) {
                characterName = `${character.firstName} ${character.lastName || ''}`.trim();
            }
        }
        
        // If not found, try to find the name in existing relationships as a fallback
        if (!characterName && window.relationships && Array.isArray(window.relationships)) {
            // Look for any relationships with this character ID
            const relWithChar = window.relationships.find(rel => 
                rel.character1Id === characterId || rel.character2Id === characterId
            );
            
            if (relWithChar) {
                characterName = relWithChar.character1Id === characterId ? 
                    relWithChar.character1 : relWithChar.character2;
            }
        }
        
        console.log(`Character name for deletion: ${characterName || 'Not found in data sources'}`);
        
        // Track if any relationships were removed
        const originalCount = window.relationships.length;
        
        // Create a filtered array of relationships without the deleted character
        // Check by BOTH name AND id to be thorough
        const filteredRelationships = window.relationships.filter(rel => {
            const matchesId = (rel.character1Id === characterId || rel.character2Id === characterId);
            const matchesName = (rel.character1 === characterName || rel.character2 === characterName);
            return !matchesId && !matchesName;
        });
        
        // Update the global relationships array without reassignment
        window.relationships.length = 0; // Clear the array
        window.relationships.push(...filteredRelationships); // Add filtered items back
        
        // Save to localStorage
        Core.safelyStoreItem('relationships', JSON.stringify(window.relationships));
        
        // Calculate how many relationships were removed
        const removedCount = originalCount - window.relationships.length;
        console.log(`Removed ${removedCount} relationship(s) for character: ${characterName || characterId}`);
        
        // Perform a complete UI refresh using our unified function
        refreshAllRelationshipUI();
        
        // Show toast notification if relationships were removed
        if (removedCount > 0 && window.Core && typeof window.Core.showToast === 'function') {
            Core.showToast(`Removed ${removedCount} relationship(s) for deleted character`, 'info');
        }
    }

    // Hook this function to character deletion events
    // This function should be called by the character management module when a character is deleted
    window.addEventListener('character-deleted', function(e) {
        if (e.detail && e.detail.characterId) {
            handleCharacterDeleted(e.detail.characterId);
        }
    });
    
    // Helper function to completely rebuild all character dropdowns
    function rebuildAllCharacterDropdowns() {
        console.log('Rebuilding all character dropdowns from current character data');
        
        // Get all character dropdowns
        const characterDropdowns = document.querySelectorAll('select[id*="Character"], select[id*="character"]');
        
        characterDropdowns.forEach(dropdown => {
            // Remember the current selection
            const currentValue = dropdown.value;
            
            // Clear the dropdown
            dropdown.innerHTML = '';
            
            // Add the "All Characters" option if this is a filter dropdown
            if (dropdown.id.includes('Filter') || dropdown.id.includes('filter')) {
                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = 'All Characters';
                dropdown.appendChild(allOption);
            }
            
            // Add characters from the current window.characters array
            const activeCharacters = getActiveCharacters();
            
            // Sort the characters by name
            const sortedCharacters = [...activeCharacters].sort((a, b) => {
                const nameA = `${a.firstName} ${a.lastName || ''}`.trim();
                const nameB = `${b.firstName} ${b.lastName || ''}`.trim();
                return nameA.localeCompare(nameB);
            });
            
            // Add each character
            sortedCharacters.forEach(character => {
                const fullName = `${character.firstName} ${character.lastName || ''}`.trim();
                const option = document.createElement('option');
                option.value = fullName;
                option.textContent = fullName;
                option.setAttribute('data-character-id', character.id || '');
                dropdown.appendChild(option);
            });
            
            // Restore the previous selection if it still exists
            if (Array.from(dropdown.options).some(opt => opt.value === currentValue)) {
                dropdown.value = currentValue;
            } else {
                // Set to first option if the previous selection is gone
                if (dropdown.options.length > 0) {
                    dropdown.selectedIndex = 0;
                }
            }
        });
    }

    function setupZoomAndPan(svg, mainGroup) {
        // Current transformation values
        let currentScale = 1;
        let currentTranslateX = 0;
        let currentTranslateY = 0;
        let isDragging = false;
        let startDragX = 0;
        let startDragY = 0;
        
        // Apply transformation to the main group
        function applyTransform() {
            mainGroup.setAttribute('transform', `translate(${currentTranslateX},${currentTranslateY}) scale(${currentScale})`);
        }
        
        // Reset function to be called by button
        function resetView() {
            currentScale = 1;
            currentTranslateX = 0;
            currentTranslateY = 0;
            applyTransform();
        }
        
        // Mouse wheel event for zooming
        svg.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            // Get mouse position relative to SVG
            const svgRect = svg.getBoundingClientRect();
            const mouseX = e.clientX - svgRect.left;
            const mouseY = e.clientY - svgRect.top;
            
            // Calculate scale factor
            const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
            
            // Calculate new scale
            const newScale = currentScale * scaleFactor;
            
            // Limit scale to reasonable range
            if (newScale > 0.2 && newScale < 5) {
                // Calculate new translate to zoom centered on mouse position
                currentTranslateX = mouseX - (mouseX - currentTranslateX) * scaleFactor;
                currentTranslateY = mouseY - (mouseY - currentTranslateY) * scaleFactor;
                currentScale = newScale;
                
                // Apply new transformation
                applyTransform();
            }
        });
        
        // Mouse events for panning
        svg.addEventListener('mousedown', function(e) {
            if (e.button === 0) { // Left mouse button
                isDragging = true;
                startDragX = e.clientX;
                startDragY = e.clientY;
                svg.style.cursor = 'grabbing';
            }
        });
        
        svg.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const dx = e.clientX - startDragX;
                const dy = e.clientY - startDragY;
                
                currentTranslateX += dx;
                currentTranslateY += dy;
                
                startDragX = e.clientX;
                startDragY = e.clientY;
                
                applyTransform();
            }
        });
        
        svg.addEventListener('mouseup', function(e) {
            if (e.button === 0) { // Left mouse button
                isDragging = false;
                svg.style.cursor = 'grab';
            }
        });
        
        svg.addEventListener('mouseleave', function() {
            isDragging = false;
            svg.style.cursor = 'grab';
        });
        
        // Double click to reset zoom and pan
        svg.addEventListener('dblclick', function() {
            resetView();
        });
        
        // Set initial cursor
        svg.style.cursor = 'grab';
        
        // Return the reset function for external use (by the reset button)
        return resetView;
    }

    // Function to delete a relationship
    function deleteRelationship(index) {
        if (index >= 0 && index < relationships.length) {
            const deleted = relationships.splice(index, 1)[0];
            
            // Save to localStorage
            Core.safelyStoreItem('relationships', JSON.stringify(relationships));
            
            // Log activity
            if (window.Dashboard && typeof window.Dashboard.addActivity === 'function') {
                Dashboard.addActivity('relationship_deleted', 
                    `Deleted ${deleted.type} relationship between ${deleted.character1} and ${deleted.character2}`);
            }
            
            // Update UI
            displayRelationships();
            updateFilteredVisualization();
            // Update character dropdown to reflect removed relationship
            updateRelationshipFilterDropdowns();
            
            // Show a toast notification
            Core.showToast('Relationship deleted successfully');
        }
    }

    // Display relationships in the relationship table
    function displayRelationships() {
        // Get the relationship list container
        const relationshipList = document.getElementById('relationshipList');
        if (!relationshipList) {
            console.error('Relationship list container not found');
            return;
        }
        
        // First, make sure we're not displaying any orphaned relationships
        purgeOrphanedRelationships();
        
        // Clear existing content
        relationshipList.innerHTML = '';
        
        // Add table header
        const tableHeader = document.createElement('h3');
        tableHeader.textContent = 'Relationship List';
        tableHeader.className = 'relationship-list-header';
        relationshipList.appendChild(tableHeader);
        
        // Create the table
        const relationshipTable = document.createElement('table');
        relationshipTable.className = 'relationship-table';
        relationshipTable.id = 'relationship-table';

        // Get filter values
        const characterFilter = document.getElementById('relationshipFilterCharacter');
        const typeFilter = document.getElementById('relationshipFilterType');
        const filterCharacter = characterFilter ? characterFilter.value : 'all';
        const filterType = typeFilter ? typeFilter.value : 'all';
        
        // Filter relationships
        let filteredRelationships = [...relationships];
        
        // Make sure we only show relationships where both characters still exist
        filteredRelationships = filteredRelationships.filter(rel => 
            characterExists(rel.character1) && characterExists(rel.character2)
        );
        
        if (filterCharacter !== 'all') {
            filteredRelationships = filteredRelationships.filter(rel => {
                return (rel.character1 === filterCharacter || rel.character2 === filterCharacter);
            });
        }
        
        if (filterType !== 'all') {
            filteredRelationships = filteredRelationships.filter(rel => {
                return rel.type.toLowerCase() === filterType.toLowerCase();
            });
        }

        // Group relationships by character pairs
        const groupedRelationships = {};
        filteredRelationships.forEach(rel => {
            const key = `${rel.character1}|${rel.character2}`;
            if (!groupedRelationships[key]) {
                groupedRelationships[key] = [];
            }
            groupedRelationships[key].push(rel);
        });

        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Source Character</th>
                <th>Relationship Types</th>
                <th>Target Character</th>
            </tr>
        `;
        relationshipTable.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');

        // If no relationships, show message
        if (Object.keys(groupedRelationships).length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="3" class="empty-table-message">
                    No relationships have been defined yet.
                </td>
            `;
            tbody.appendChild(emptyRow);
        } else {
            // Add relationships to table
            Object.entries(groupedRelationships).forEach(([key, rels]) => {
                const [source, target] = key.split('|');
                const row = document.createElement('tr');
                
                // Only show up to 3 relationships
                const displayedRels = rels.slice(0, 3);
                
                row.innerHTML = `
                    <td>${source}</td>
                    <td class="relationship-types-cell">
                        <div class="relationship-icons-container">
                            ${displayedRels.map(rel => {
                                // Capitalize first letter of relationship type
                                const displayType = rel.type.charAt(0).toUpperCase() + rel.type.slice(1);
                                return `
                                    <div class="relationship-icon">
                                        <span class="relationship-type" style="background-color: ${getRelationshipColor(rel.type)}">
                                            ${displayType}
                                        </span>
                                        <button class="relationship-delete-btn" data-source="${source}" data-target="${target}" data-type="${rel.type}">×</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </td>
                    <td>${target}</td>
                `;
                
                tbody.appendChild(row);
            });
        }
        
        relationshipTable.appendChild(tbody);
        
        // Add the table to the container
        relationshipList.appendChild(relationshipTable);

        // Add event listeners for delete buttons
        const deleteButtons = relationshipTable.querySelectorAll('.relationship-delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                
                const source = this.dataset.source;
                const target = this.dataset.target;
                const type = this.dataset.type;
                
                // Store the current scroll position
                const scrollPosition = relationshipList.scrollTop;
                
                // Find the index of the relationship to remove
                const relIndex = relationships.findIndex(rel => 
                    rel.character1 === source && rel.character2 === target && rel.type === type
                );
                
                // Remove the relationship if found
                if (relIndex !== -1) {
                    // Use splice instead of filter+reassignment
                    relationships.splice(relIndex, 1);
                    
                    // Make sure window.relationships is also updated if it exists separately
                    if (window.relationships && window.relationships !== relationships) {
                        window.relationships = [...relationships];
                    }
                    
                    // Save relationships to storage
                    Core.safelyStoreItem('relationships', JSON.stringify(relationships));
                    
                    // Update just this relationship icon/row
                    const relationshipIcon = this.closest('.relationship-icon');
                    if (relationshipIcon) {
                        const iconsContainer = relationshipIcon.parentElement;
                        relationshipIcon.remove();
                        
                        // If this was the last relationship in the row, remove the whole row
                        if (iconsContainer.children.length === 0) {
                            const row = iconsContainer.closest('tr');
                            if (row) row.remove();
                        }
                    }
                    
                    // Force visualization update with the new relationships array
                    updateFilteredVisualization();
                    
                    // Also explicitly update the network visualization
                    updateNetworkVisualization(getFilteredRelationships());
                    
                    // Update character dropdown to reflect relationship changes
                    updateRelationshipFilterDropdowns();
                    
                    // Restore scroll position
                    setTimeout(() => {
                        if (relationshipList) relationshipList.scrollTop = scrollPosition;
                    }, 0);
                    
                    // Show a toast notification
                    Core.showToast('Relationship deleted successfully');
                }
                
                // If this was the last relationship between these characters,
                // they should be deselected in the character tables
                const remainingRels = relationships.filter(rel =>
                    (rel.character1 === source && rel.character2 === target) ||
                    (rel.character1 === target && rel.character2 === source)
                );
                
                if (remainingRels.length === 0) {
                    // Deselect characters in tables
                    const tables = document.querySelectorAll('.character-table');
                    tables.forEach(table => {
                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach(row => {
                            const name = row.cells[0].textContent;
                            if (name === source || name === target) {
                                row.classList.remove('selected');
                            }
                        });
                    });
                }
            });
        });
    }

    // Helper function to get filtered relationships based on current filters
    function getFilteredRelationships() {
        // Get filter values
        const characterFilter = document.getElementById('relationshipFilterCharacter');
        const typeFilter = document.getElementById('relationshipFilterType');
        const filterCharacter = characterFilter ? characterFilter.value : 'all';
        const filterType = typeFilter ? typeFilter.value : 'all';
        
        // Filter relationships
        let filteredRels = [...relationships];
        
        if (filterCharacter !== 'all') {
            filteredRels = filteredRels.filter(rel => {
                return (rel.character1 === filterCharacter || rel.character2 === filterCharacter);
            });
        }
        
        if (filterType !== 'all') {
            filteredRels = filteredRels.filter(rel => {
                return rel.type.toLowerCase() === filterType.toLowerCase();
            });
        }
        
        return filteredRels;
    }

    // Get color for a relationship type
    function getRelationshipColor(type) {
        // Default colors for standard relationship types - improved for contrast with white text
        const defaultColors = {
            'friend': '#3d8c40',     // darker green
            'family': '#1976D2',     // darker blue
            'ally': '#00838f',       // darker cyan
            'enemy': '#d32f2f',      // darker red
            'mentor': '#7B1FA2',     // darker purple
            'student': '#512DA8',    // darker deep purple
            'lover': '#C2185B',      // darker pink
            'rival': '#EF6C00',      // darker orange
            'other': '#455A64'       // darker blue grey
        };
        
        // First check for custom colors in localStorage
        let customColors = {};
        try {
            const storedColors = localStorage.getItem('relationshipColors');
            if (storedColors) {
                customColors = JSON.parse(storedColors);
            }
        } catch (e) {
            console.error('Error parsing stored relationship colors:', e);
        }
        
        // Return custom color if set, otherwise use default or generate one
        const normalizedType = type.toLowerCase();
        
        if (customColors && customColors[normalizedType]) {
            return customColors[normalizedType];
        } else if (defaultColors[normalizedType]) {
            return defaultColors[normalizedType];
        } else {
            // For custom relationship types, generate a color based on the name
            // But ensure it's dark enough for white text
            let hash = 0;
            for (let i = 0; i < normalizedType.length; i++) {
                hash = normalizedType.charCodeAt(i) + ((hash << 5) - hash);
            }
            
            // Generate darker RGB components to ensure contrast with white text
            const r = Math.max(0, Math.min(210, (hash & 0xFF)));
            const g = Math.max(0, Math.min(210, ((hash >> 8) & 0xFF)));
            const b = Math.max(0, Math.min(210, ((hash >> 16) & 0xFF)));
            
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    // Update filtered visualization based on currently selected filters
    function updateFilteredVisualization() {
        // Get filter values
        const characterFilter = document.getElementById('relationshipFilterCharacter');
        const typeFilter = document.getElementById('relationshipFilterType');
        const filterCharacter = characterFilter ? characterFilter.value : 'all';
        const filterType = typeFilter ? typeFilter.value : 'all';
        
        // Filter relationships
        let visualRelationships = [...relationships];
        
        // Make sure we only show relationships where both characters still exist
        visualRelationships = visualRelationships.filter(rel => 
            characterExists(rel.character1) && characterExists(rel.character2)
        );
        
        if (filterCharacter !== 'all') {
            visualRelationships = visualRelationships.filter(rel => {
                return (rel.character1 === filterCharacter || rel.character2 === filterCharacter);
            });
        }
        
        if (filterType !== 'all') {
            visualRelationships = visualRelationships.filter(rel => {
                return rel.type.toLowerCase() === filterType.toLowerCase();
            });
        }
        
        // Update network visualization with filtered relationships
        updateNetworkVisualization(visualRelationships);
    }

    // Update the network visualization with the given relationships
    function updateNetworkVisualization(relationshipsToShow) {
        console.log(`Updating network visualization with ${relationshipsToShow.length} relationships`);
        
        // Get the container
        const networkContainer = document.getElementById('relationshipNetwork');
        if (!networkContainer) {
            console.error('Network visualization container not found');
            return;
        }
        
        // Clear previous visualization
        networkContainer.innerHTML = '';
        
        // If no relationships to show, display a message
        if (relationshipsToShow.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-network-message';
            emptyMessage.textContent = 'No relationships to display. Add relationships to see them visualized here.';
            networkContainer.appendChild(emptyMessage);
            return;
        }
        
        // Create a container for the visualization to handle positioning
        const visualizationContainer = document.createElement('div');
        visualizationContainer.className = 'visualization-container';
        visualizationContainer.style.position = 'relative';
        visualizationContainer.style.width = '100%';
        visualizationContainer.style.height = '600px';
        networkContainer.appendChild(visualizationContainer);
        
        // Add reset button in the top right corner
        const resetButton = document.createElement('button');
        resetButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"></path><path d="M3 8L12 17"></path><path d="M21 22v-6h-6"></path><path d="M21 16L12 7"></path></svg> Reset View';
        resetButton.className = 'reset-view-button';
        visualizationContainer.appendChild(resetButton);
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '600'); // Increased height
        svg.setAttribute('class', 'network-visualization');
        visualizationContainer.appendChild(svg);
        
        // Create a main group for transformations
        const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(mainGroup);
        
        // Reference to reset function for use with button
        let resetViewFunction;
        
        // Set up zoom and pan functionality with reference to reset function
        resetViewFunction = setupZoomAndPan(svg, mainGroup);
        
        // Add click event to reset button
        resetButton.addEventListener('click', function() {
            resetViewFunction();
        });
        
        // Extract unique characters from relationships
        const characterSet = new Set();
        relationshipsToShow.forEach(rel => {
            characterSet.add(rel.character1);
            characterSet.add(rel.character2);
        });
        const characters = Array.from(characterSet);
        
        // Calculate positions for characters in a circle
        const positions = {};
        const centerX = networkContainer.offsetWidth / 2 || 400;
        const centerY = 300;
        const radius = Math.min(280, 100 + characters.length * 20);
        
        characters.forEach((character, index) => {
            const angle = (index / characters.length) * 2 * Math.PI;
            positions[character] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });
        
        // Set minimum distance between nodes
        const minDistance = 120; // Minimum distance between node centers
        
        // Function to adjust positions to maintain minimum distance
        function adjustPositions() {
            const nodes = Array.from(characterSet);
            let positionsChanged = false;
            
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const node1 = nodes[i];
                    const node2 = nodes[j];
                    const pos1 = positions[node1];
                    const pos2 = positions[node2];
                    
                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        positionsChanged = true;
                        const angle = Math.atan2(dy, dx);
                        const distanceToAdd = (minDistance - distance) / 2;
                        
                        // Move nodes apart
                        pos1.x -= Math.cos(angle) * distanceToAdd;
                        pos1.y -= Math.sin(angle) * distanceToAdd;
                        pos2.x += Math.cos(angle) * distanceToAdd;
                        pos2.y += Math.sin(angle) * distanceToAdd;
                    }
                }
            }
            
            return positionsChanged;
        }
        
        // Run the adjustment algorithm multiple times to stabilize
        for (let i = 0; i < 10; i++) {
            if (!adjustPositions()) break;
        }
        
        // Create tooltip div for character information
        const tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'character-tooltip';
        tooltipDiv.style.position = 'absolute';
        tooltipDiv.style.display = 'none';
        tooltipDiv.style.padding = '8px 12px';
        tooltipDiv.style.background = 'rgba(0, 0, 0, 0.8)';
        tooltipDiv.style.color = '#fff';
        tooltipDiv.style.borderRadius = '4px';
        tooltipDiv.style.pointerEvents = 'none';
        tooltipDiv.style.zIndex = '1000';
        tooltipDiv.style.fontSize = '14px';
        tooltipDiv.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        tooltipDiv.style.transition = 'opacity 0.15s';
        networkContainer.appendChild(tooltipDiv);
        
        // Draw relationships (lines) first so they're behind nodes
        const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        linesGroup.setAttribute('class', 'relationship-lines');
        mainGroup.appendChild(linesGroup);
        
        // Define node size for line calculations
        const nodeSize = 45; // This matches the node circle radius below
        
        relationshipsToShow.forEach(rel => {
            const source = positions[rel.character1];
            const target = positions[rel.character2];
            
            if (!source || !target) {
                console.error(`Position not found for characters in relationship: ${rel.character1} -> ${rel.character2}`);
                return;
            }

            // Calculate the angle between the nodes
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const angle = Math.atan2(dy, dx);
            
            // Calculate the start and end points to make lines reach the edge of circles
            const startX = source.x + (nodeSize * Math.cos(angle));
            const startY = source.y + (nodeSize * Math.sin(angle));
            const endX = target.x - (nodeSize * Math.cos(angle));
            const endY = target.y - (nodeSize * Math.sin(angle));
            
            // Draw line that extends exactly to the edge of both circles
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', startX);
            line.setAttribute('y1', startY);
            line.setAttribute('x2', endX);
            line.setAttribute('y2', endY);
            line.setAttribute('stroke', getRelationshipColor(rel.type));
            line.setAttribute('stroke-width', '2.5');
            
            // For dark mode, make lines more visible
            if (document.body.classList.contains('dark-mode')) {
                line.setAttribute('stroke-opacity', '0.85');
            } else {
                line.setAttribute('stroke-opacity', '0.7');
            }
            
            linesGroup.appendChild(line);
            
            // Add relationship type label in the middle of the line - PARALLEL TO THE LINE
            const labelX = (startX + endX) / 2;
            const labelY = (startY + endY) / 2;
            
            // Calculate angle for rotation
            const labelAngle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
            // Adjust angle to keep text readable (not upside down)
            const adjustedAngle = (labelAngle > 90 || labelAngle < -90) ? labelAngle + 180 : labelAngle;
            
            // Create a group to hold the label and apply rotation
            const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            labelGroup.setAttribute('transform', `translate(${labelX}, ${labelY}) rotate(${adjustedAngle})`);
            
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textElement.textContent = rel.type.charAt(0).toUpperCase() + rel.type.slice(1);
            textElement.setAttribute('x', 0);
            textElement.setAttribute('y', 0);
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('dominant-baseline', 'middle');
            textElement.setAttribute('font-size', '13');
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('class', 'relationship-label-text');
            
            // Set text color - BLACK for light mode, WHITE for dark mode
            if (document.body.classList.contains('dark-mode')) {
                textElement.setAttribute('fill', '#FFFFFF'); // White in dark mode
                // Remove the stroke completely in dark mode
                textElement.setAttribute('stroke', 'none');
                textElement.setAttribute('stroke-width', '0');
            } else {
                textElement.setAttribute('fill', '#000000'); // Black in light mode
                textElement.setAttribute('stroke', '#FFFFFF');
                textElement.setAttribute('stroke-width', '0.5');
            }
            
            labelGroup.appendChild(textElement);
            linesGroup.appendChild(labelGroup);
        });
        
        // Draw nodes (characters)
        const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodesGroup.setAttribute('class', 'character-nodes');
        mainGroup.appendChild(nodesGroup);
        
        characters.forEach(character => {
            const pos = positions[character];
            
            // Create node group
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.setAttribute('class', 'character-node');
            nodeGroup.setAttribute('data-character', character);
            nodeGroup.style.cursor = 'pointer';
            nodesGroup.appendChild(nodeGroup);
            
            // Draw node circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', nodeSize);
            
            // Blue node with white stroke
            circle.setAttribute('fill', '#4A9FE6');
            circle.setAttribute('stroke', '#ffffff');
            circle.setAttribute('stroke-width', '2');
            
            nodeGroup.appendChild(circle);
            
            // Get first name for inside the node
            const nameParts = character.split(' ');
            const firstName = nameParts[0];
            
            // Less aggressive truncation to show more of the name
            const displayName = firstName.length > 10 ? firstName.substring(0, 9) + '...' : firstName;
            
            // Add text inside the node
            const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            nameText.textContent = displayName;
            nameText.setAttribute('x', pos.x);
            nameText.setAttribute('y', pos.y - 5); // Move up slightly to make room for button
            nameText.setAttribute('text-anchor', 'middle');
            nameText.setAttribute('font-size', '15'); // Larger font
            nameText.setAttribute('font-weight', 'bold');
            nameText.setAttribute('fill', '#ffffff');
            nameText.setAttribute('pointer-events', 'none');
            
            nodeGroup.appendChild(nameText);
            
            // Add View button inside the node
            const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
            foreignObject.setAttribute('x', pos.x - 20); // Center of circle minus half button width
            foreignObject.setAttribute('y', pos.y + 5); // Below the name text
            foreignObject.setAttribute('width', 40); // Width of button
            foreignObject.setAttribute('height', 25); // Height of button
            
            const viewButton = document.createElement('button');
            viewButton.textContent = 'View';
            viewButton.style.width = '100%';
            viewButton.style.height = '100%';
            viewButton.style.fontSize = '12px';
            viewButton.style.padding = '2px 0';
            viewButton.style.backgroundColor = '#ffffff';
            viewButton.style.color = '#4A9FE6'; // Match node color
            viewButton.style.border = '1px solid #ffffff';
            viewButton.style.borderRadius = '3px';
            viewButton.style.cursor = 'pointer';
            viewButton.style.fontWeight = 'bold';
            viewButton.style.textAlign = 'center';
            
            // Add click handler for the button
            viewButton.onclick = function(e) {
                e.stopPropagation(); // Prevent event from bubbling to the nodeGroup
                e.preventDefault(); // Prevent default behavior
                
                console.log('View button clicked for character:', character);
                
                // Find character in the global characters array
                const charObj = window.characters.find(c => 
                    `${c.firstName} ${c.lastName || ''}`.trim() === character
                );
                
                if (charObj) {
                    const charIndex = window.characters.indexOf(charObj);
                    
                    if (charIndex !== -1) {
                        console.log('Found character at index:', charIndex);
                        
                        // Try all possible methods to show character details
                        if (window.Characters && typeof window.Characters.showCharacterDetails === 'function') {
                            window.Characters.showCharacterDetails(charIndex);
                        } else if (typeof Characters !== 'undefined' && typeof Characters.showCharacterDetails === 'function') {
                            Characters.showCharacterDetails(charIndex);
                        } else if (typeof showCharacterDetails === 'function') {
                            showCharacterDetails(charIndex);
                        } else {
                            console.error('No method available to show character details');
                        }
                    } else {
                        console.error('Character found but index is invalid');
                    }
                } else {
                    console.error('Character not found in the global array');
                }
            };
            
            foreignObject.appendChild(viewButton);
            nodeGroup.appendChild(foreignObject);
            
            // Add tooltip functionality
            nodeGroup.addEventListener('mouseover', (e) => {
                tooltipDiv.textContent = character; // Full name in tooltip
                tooltipDiv.style.display = 'block';
                tooltipDiv.style.opacity = '1';
                
                // Position the tooltip near the mouse
                const svgRect = svg.getBoundingClientRect();
                tooltipDiv.style.left = (e.clientX - svgRect.left + 10) + 'px';
                tooltipDiv.style.top = (e.clientY - svgRect.top - 30) + 'px';
            });
            
            nodeGroup.addEventListener('mousemove', (e) => {
                // Update tooltip position when mouse moves
                const svgRect = svg.getBoundingClientRect();
                tooltipDiv.style.left = (e.clientX - svgRect.left + 10) + 'px';
                tooltipDiv.style.top = (e.clientY - svgRect.top - 30) + 'px';
            });
            
            nodeGroup.addEventListener('mouseout', () => {
                tooltipDiv.style.display = 'none';
                tooltipDiv.style.opacity = '0';
            });
            
            // Make the node clickable to open character panel
            nodeGroup.addEventListener('click', () => {
                openCharacterPanelByName(character.name);
            });
        });
        
        console.log('Enhanced network visualization updated successfully');
    }

    // Helper function to open character panel by name
    function openCharacterPanelByName(characterName) {
        // Find character by name
        const character = window.characters.find(c => {
            return `${c.firstName} ${c.lastName || ''}`.trim() === characterName;
        });
        
        if (!character) {
            console.warn(`Character not found: ${characterName}`);
            return;
        }
        
        console.log(`Opening character panel for: ${characterName} (ID: ${character.id})`);
        
        // Get the character index
        const charIndex = window.characters.indexOf(character);
        
        if (charIndex !== -1) {
            // Try all possible methods to show character details
            if (window.Characters && typeof window.Characters.showCharacterDetails === 'function') {
                window.Characters.showCharacterDetails(charIndex);
                return;
            } else if (typeof Characters !== 'undefined' && typeof Characters.showCharacterDetails === 'function') {
                Characters.showCharacterDetails(charIndex);
                return;
            } else if (typeof showCharacterDetails === 'function') {
                showCharacterDetails(charIndex);
                return;
            }
        }
        
        console.warn('Could not find a method to show character details.');
        
        // Fallback methods can remain for compatibility
        if (typeof window.openCharacterPanel === 'function') {
            console.log('Using openCharacterPanel function');
            window.openCharacterPanel(character.id);
            return;
        }
        
        if (typeof window.Characters?.viewCharacter === 'function') {
            console.log('Using Characters.viewCharacter function');
            window.Characters.viewCharacter(character.id);
            return;
        }
        
        if (typeof window.viewCharacter === 'function') {
            console.log('Using viewCharacter function');
            window.viewCharacter(character.id);
            return;
        }
        
        // Direct DOM manipulation approach
        console.log('Using DOM approach to view character');
        const viewButtons = document.querySelectorAll('button.view-character-btn, button.edit-character-btn');
        let found = false;
        
        for (const btn of viewButtons) {
            const row = btn.closest('tr');
            if (row && (row.dataset.characterId === character.id || row.querySelector(`td[data-id="${character.id}"]`))) {
                console.log('Found matching character row, clicking button');
                btn.click();
                found = true;
                break;
            }
        }
        
        if (!found) {
            console.warn('Could not find a way to view this character');
        }
    }

    // Safe validation message display for relationship errors
    function showValidationError(message) {
        console.log('Validation error:', message);
        
        // Skip showing popup if it's about selecting a source character
        if (message === 'Please select a source character') {
            return;
        }
        
        // Try different notification methods
        if (window.Dashboard && typeof window.Dashboard.Notifications?.notify === 'function') {
            // Use Dashboard notifications if available
            window.Dashboard.Notifications.notify(message, 'error');
        } else if (window.Core && typeof window.Core.showToast === 'function') {
            // Try Core toast as fallback
            window.Core.showToast(message, 'error');
    } else {
            // Fallback to directly showing a message in the UI
            const feedbackMsg = document.getElementById('relationshipFeedback');
            if (feedbackMsg) {
                feedbackMsg.textContent = message;
                feedbackMsg.style.display = 'block';
                feedbackMsg.style.color = '#ff0000';
                
                // Auto-hide after 3 seconds
                setTimeout(() => {
                    feedbackMsg.style.display = 'none';
                }, 3000);
            } else {
                // Last resort - alert
                alert(message);
            }
        }
    }

    // Check if two characters are the same
    function isSameCharacter(char1, char2) {
        if (!char1 || !char2) return false;
        
        return (
            char1.id === char2.id || 
            (char1.firstName === char2.firstName && char1.lastName === char2.lastName)
        );
    }

    // Check if a relationship already exists between characters
    function checkExistingRelationship(char1, char2, relType) {
        if (!char1 || !char2 || !relType) {
            return { exists: false, count: 0 };
        }
        
        const name1 = getCharacterFullName(char1);
        const name2 = getCharacterFullName(char2);
        
        // Count relationships between these characters
        let relationshipCount = 0;
        let typeExists = false;
        
        relationships.forEach(rel => {
            const isMatch = (
                (rel.character1 === name1 && rel.character2 === name2) || 
                (rel.character1 === name2 && rel.character2 === name1)
            );
            
            if (isMatch) {
                relationshipCount++;
                if (rel.type.toLowerCase() === relType.toLowerCase()) {
                    typeExists = true;
                }
            }
        });
        
        return { exists: typeExists, count: relationshipCount };
    }

    // Get full name for a character
    function getCharacterFullName(character) {
        if (!character) return '';
        
        if (typeof character === 'string') return character;
        
        return `${character.firstName || ''} ${character.lastName || ''}`.trim();
    }

    // Make sure we have CSS for highlighted rows
    function addRequiredCSS() {
        const styleId = 'relationship-manager-styles';
        // Don't add if already exists
        if (document.getElementById(styleId)) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
            /* Selected rows in character tables */
            tbody tr.selected {
                background-color: rgba(100, 149, 237, 0.2);
            }
            
            tbody tr.selected td {
                font-weight: bold;
            }
            
            /* Reset view button styling */
            .reset-view-button {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 100;
                padding: 5px 10px;
                background-color: #4A9FE6;
                color: #ffffff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                font-size: 14px;
                transition: all 0.2s ease-in-out;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .reset-view-button svg {
                margin-right: 4px;
            }
            
            .reset-view-button:hover {
                background-color: #3486c7;
                transform: scale(1.05);
            }
            
            .reset-view-button:active {
                background-color: #2a6ca5;
                transform: scale(0.98);
            }
            
            .dark-mode .reset-view-button {
                background-color: #5badee;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
            }
            
            .dark-mode .reset-view-button:hover {
                background-color: #4a9de5;
            }
            
            .dark-mode .reset-view-button:active {
                background-color: #3b8ed6;
            }
            
            /* Relationship table styles */
            .relationship-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .relationship-table th,
            .relationship-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid var(--border-color);
            }
            
            .relationship-table th {
                font-weight: 600;
                background-color: #3498db !important;
                color: white !important;
            }
            
            /* Relationship section styling */
            .relationship-list-header {
                background-color: #3498db !important;
                color: white !important;
                padding: 10px 15px;
                margin-top: 0;
                margin-bottom: 15px;
                border-radius: 4px 4px 0 0;
            }
            
            /* Relationship manager headers */
            .relationship-manager-container h3,
            .character-selection h3,
            .relationship-options h3,
            #relationships-tab h3 {
                background-color: #3498db !important;
                color: white !important;
                padding: 10px 15px;
                margin-top: 0;
                border-radius: 4px 4px 0 0;
            }
            
            /* Create New Relationship header styling */
            #relationships-tab h2,
            .create-relationship-section h2 {
                color: #3498db !important;
                border-bottom: 2px solid #3498db !important;
                padding-bottom: 8px !important;
            }
            
            /* Relationship icons container */
            .relationship-icons-container {
                display: flex;
                justify-content: center;
                gap: 10px;
                padding: 5px;
            }
            
            /* Individual relationship icon */
            .relationship-icon {
                position: relative;
                display: inline-block;
            }
            
            /* Relationship type badge */
            .relationship-type {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 12px;
                color: white;
                text-shadow: 0px 0px 3px rgba(0, 0, 0, 0.9);
                font-weight: 500;
                font-size: 14px;
                border: none;
                box-shadow: none;
            }
            
            /* Delete button for relationship */
            .relationship-delete-btn {
                position: absolute;
                top: -8px;
                right: -8px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background-color: #f44336;
                color: white;
                border: 1px solid rgba(0, 0, 0, 0.2);
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                transition: all 0.2s ease;
                text-shadow: 0px 0px 2px rgba(0, 0, 0, 0.7);
            }
            
            .relationship-delete-btn:hover {
                background-color: #d32f2f;
                transform: scale(1.1);
            }
            
            /* Center column styles */
            .relationship-types-cell {
                text-align: center !important;
            }
            
            /* Create New Relationship section styling */
            .create-relationship-section {
                background-color: #f8f9fa;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 5px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            /* Dark mode adjustments */
            body.dark-mode .relationship-type {
                text-shadow: 0px 0px 3px rgba(0, 0, 0, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            body.dark-mode .relationship-delete-btn {
                background-color: #d32f2f;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            body.dark-mode .relationship-delete-btn:hover {
                background-color: #b71c1c;
            }
            
            body.dark-mode .create-relationship-section {
                background-color: #343a40;
            }
            
            body.dark-mode .create-relationship-section h2 {
                color: #61a8e9 !important;
                border-bottom: 2px solid #61a8e9 !important;
            }
            
            /* Empty table message */
            .empty-table-message {
                text-align: center;
                padding: 20px;
                color: var(--text-color);
                font-style: italic;
            }
            
            /* Ready message styling */
            .relationship-ready-message {
                color: #28a745;
                text-align: center;
                margin: 10px 0;
                font-weight: bold;
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Create a single source of truth function for character data
    function getActiveCharacters() {
        // This ensures we're always using the most current character data
        return window.characters && Array.isArray(window.characters) ? 
            window.characters : [];
    }

    // Create a single function to check if a character exists
    function characterExists(characterName) {
        if (!characterName) return false;
        
        const characters = getActiveCharacters();
        return characters.some(char => {
            const fullName = `${char.firstName} ${char.lastName || ''}`.trim();
            return fullName === characterName;
        });
    }

    // Unified function to rebuild all relationship UI components
    function refreshAllRelationshipUI() {
        console.log('Performing complete relationship UI refresh');
        
        // Step 1: Clean up relationships data to remove any orphaned relationships
        purgeOrphanedRelationships();
        
        // Step 2: Rebuild all dropdowns with current character data
        rebuildAllCharacterDropdowns();
        
        // Step 3: Update relationship tables
        displayRelationships();
        
        // Step 4: Update visualizations
        updateFilteredVisualization();
        
        // Step 5: Clear any selections if needed
        if (typeof clearSelections === 'function') {
            clearSelections();
        }
        
        // Step 6: Refresh character tables
        if (typeof loadCharactersIntoTables === 'function') {
            loadCharactersIntoTables();
        }
    }

    // Function to remove orphaned relationships (referencing deleted characters)
    function purgeOrphanedRelationships() {
        if (!window.relationships || !Array.isArray(window.relationships)) {
            return 0;
        }
        
        const originalCount = window.relationships.length;
        
        // Filter relationships to keep only those where both characters still exist
        const validRelationships = window.relationships.filter(rel => 
            characterExists(rel.character1) && characterExists(rel.character2)
        );
        
        if (validRelationships.length !== originalCount) {
            // Update relationships without reassignment
            window.relationships.length = 0;
            window.relationships.push(...validRelationships);
            
            // Save to localStorage
            Core.safelyStoreItem('relationships', JSON.stringify(window.relationships));
            
            console.log(`Purged ${originalCount - validRelationships.length} orphaned relationships`);
            return originalCount - validRelationships.length;
        }
        
        return 0;
    }

    // Diagnostic function to help troubleshoot character deletion issues
    function diagnoseCharacterSync() {
        console.log('=== Relationship Character Synchronization Diagnostic ===');
        
        // Check if characters array exists and is properly loaded
        console.log(`Characters array: ${window.characters ? 'exists' : 'missing'} with ${window.characters ? window.characters.length : 0} entries`);
        
        // Check if relationships array exists and is properly loaded
        console.log(`Relationships array: ${window.relationships ? 'exists' : 'missing'} with ${window.relationships ? window.relationships.length : 0} entries`);
        
        // Get active character names
        const characterNames = getActiveCharacters().map(c => `${c.firstName} ${c.lastName || ''}`.trim());
        console.log(`Active character names (${characterNames.length}): ${characterNames.join(', ')}`);
        
        // Find orphaned relationships
        const orphanedRelationships = window.relationships.filter(rel => 
            !characterExists(rel.character1) || !characterExists(rel.character2)
        );
        
        console.log(`Found ${orphanedRelationships.length} orphaned relationships:`);
        orphanedRelationships.forEach(rel => {
            const char1Exists = characterExists(rel.character1);
            const char2Exists = characterExists(rel.character2);
            console.log(`- ${rel.character1} (${char1Exists ? 'exists' : 'MISSING'}) ${rel.type} ${rel.character2} (${char2Exists ? 'exists' : 'MISSING'})`);
        });
        
        // Check character dropdowns
        const characterDropdowns = document.querySelectorAll('select[id*="Character"], select[id*="character"]');
        console.log(`Found ${characterDropdowns.length} character dropdowns:`);
        
        characterDropdowns.forEach(dropdown => {
            const options = Array.from(dropdown.options).map(opt => opt.value).filter(v => v !== 'all');
            const invalidOptions = options.filter(name => !characterExists(name) && name !== '');
            
            console.log(`- ${dropdown.id}: ${options.length} options, ${invalidOptions.length} invalid`);
            if (invalidOptions.length > 0) {
                console.log(`  Invalid options: ${invalidOptions.join(', ')}`);
            }
        });
        
        console.log('=== End of Diagnostic ===');
        
        // Return suggestions based on findings
        if (orphanedRelationships.length > 0) {
            console.log('RECOMMENDATION: Run purgeOrphanedRelationships() to clean up orphaned relationships');
            return orphanedRelationships.length;
        }
        
        return 0;
    }
    
    // Expose necessary functions to the window.Relationships object
    window.Relationships = window.Relationships || {};
    window.Relationships.handleCharacterDeleted = handleCharacterDeleted;
    window.Relationships.purgeOrphanedRelationships = purgeOrphanedRelationships;
    window.Relationships.diagnoseCharacterSync = diagnoseCharacterSync;
    window.Relationships.refreshAllRelationshipUI = refreshAllRelationshipUI;
})();
