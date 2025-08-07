/**
 * Tab Switching Fix - ensures proper tab switching and loading
 * 
 * This script fixes issues with tab switching where some tabs might not
 * load properly due to missing elements or initialization problems.
 */

(function() {
    // Store reference to original switchTab function
    const originalSwitchTab = UI.switchTab;
    
    // Override with fixed version
    UI.switchTab = function(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        
        // First, remove active class from all tabs and hide their content
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Then, activate the requested tab and its content
        const tabButton = document.querySelector(`.tab-button[onclick*="switchTab('${tabName}')"]`);
        const tabContent = document.getElementById(`${tabName}-tab`);
        
        if (tabButton) tabButton.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
        
        // Special handling for different tabs
        switch(tabName) {
            case 'characters':
                ensureCharactersTabLoaded();
                break;
            case 'locations':
                ensureLocationsTabLoaded();
                break;
            case 'relationships':
                ensureRelationshipsTabLoaded();
                break;
            case 'plots':
                ensurePlotsTabLoaded();
                break;
            case 'worldbuilding':
                ensureWorldbuildingTabLoaded();
                break;
            case 'timeline':
                ensureTimelineTabLoaded();
                break;
            case 'statistics':
                ensureStatisticsTabLoaded();
                break;
            case 'analyze-book':
                ensureAnalyzeBookTabLoaded();
                break;
            case 'dashboard':
            default:
                ensureDashboardTabLoaded();
                break;
        }
        
        // Call any original functionality
        if (typeof originalSwitchTab === 'function') {
            try {
                originalSwitchTab(tabName);
            } catch (e) {
                console.error(`Error in original switchTab for ${tabName}:`, e);
            }
        }
        
        // Save current tab to localStorage
        localStorage.setItem('currentTab', tabName);
    };
    
    // Helper functions for each tab
    function ensureCharactersTabLoaded() {
        if (typeof Characters === 'undefined' || !Characters) {
            console.warn('Characters module not available, attempting to initialize...');
            window.Characters = window.Characters || {};
            
            // Initialize Characters table
            if (!Characters.initialized) {
                initializeCharactersModule();
            }
        }
        
        // Update character list
        if (typeof Characters.displayCharacters === 'function') {
            try {
                Characters.displayCharacters();
                console.log('Characters list refreshed');
            } catch (e) {
                console.error('Error refreshing characters list:', e);
            }
        }
        
        // Update relationships list if available
        if (typeof Relationships !== 'undefined' && typeof Relationships.updateRelationshipsList === 'function') {
            try {
                Relationships.updateRelationshipsList();
                console.log('Relationships list refreshed');
            } catch (e) {
                console.error('Error refreshing relationships list:', e);
            }
        }
        
        // Make sure character form is reset
        const characterForm = document.getElementById('characterForm');
        if (characterForm) {
            characterForm.reset();
            
            // Clear rich text editor if present
            const richTextEditor = document.getElementById('characterRichTextEditor');
            if (richTextEditor) {
                richTextEditor.innerHTML = '';
            }
        }
    }
    
    function ensureLocationsTabLoaded() {
        if (typeof Locations === 'undefined' || !Locations) {
            console.warn('Locations module not available, attempting to initialize...');
            window.Locations = window.Locations || {};
        }
        
        // Update locations list
        if (typeof Locations.displayLocations === 'function') {
            try {
                Locations.displayLocations();
            } catch (e) {
                console.error('Error refreshing locations list:', e);
            }
        }
    }
    
    function ensureRelationshipsTabLoaded() {
        try {
            if (typeof Relationships === 'undefined' || !Relationships) {
                console.warn('Relationships module not available, attempting to initialize...');
                window.Relationships = window.Relationships || {};
            }
            
            // Initialize relationship manager
            if (typeof Relationships.initRelationshipManager === 'function') {
                try {
                    Relationships.initRelationshipManager();
                    console.log('Relationship manager initialized successfully');
                } catch (e) {
                    console.error('Error during relationship manager initialization:', e);
                    
                    // Create a fallback container if the relationship UI isn't loaded properly
                    createFallbackRelationshipUI();
                }
            } else {
                // Try to reload the module if function is missing
                console.warn('Relationship manager initialization function missing, attempting to reload module');
                
                // Check if the script exists and reload it
                const scriptSrc = 'app/js/modules/relationships.js';
                const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
                
                if (existingScript) {
                    // Remove existing script
                    existingScript.remove();
                }
                
                // Create and append new script
                const script = document.createElement('script');
                script.src = scriptSrc;
                script.onload = function() {
                    console.log('Relationships module reloaded');
                    // Try initializing again after load
                    if (typeof Relationships.initRelationshipManager === 'function') {
                        try {
                            Relationships.initRelationshipManager();
                        } catch (e) {
                            console.error('Failed to initialize relationship manager after reload:', e);
                            createFallbackRelationshipUI();
                        }
                    } else {
                        console.error('Failed to initialize relationship manager after reload');
                        createFallbackRelationshipUI();
                    }
                };
                script.onerror = function() {
                    console.error('Failed to reload relationships module');
                    createFallbackRelationshipUI();
                };
                
                document.head.appendChild(script);
            }
        } catch (e) {
            console.error('Error loading relationships tab:', e);
            const errorLog = document.getElementById('errorLog');
            if (errorLog) {
                errorLog.innerHTML = `<div class="error">Error loading modules for relationships tab: ${e.message}</div>`;
                errorLog.style.display = 'block';
            }
            createFallbackRelationshipUI();
        }
    }
    
    // Create a minimal fallback UI if the relationship manager fails to load
    function createFallbackRelationshipUI() {
        const relationshipsTab = document.getElementById('relationships-tab');
        if (!relationshipsTab) return;
        
        // Check if we already have content
        if (relationshipsTab.querySelector('.relationship-manager-container')) {
            return; // Content exists, don't overwrite
        }
        
        // Create a simple container with error message
        const container = document.createElement('div');
        container.className = 'relationship-manager-container';
        container.innerHTML = `
            <div class="error-container">
                <h2>Relationship Manager</h2>
                <div class="error-message">
                    <p>There was an error loading the relationship manager. Please try:</p>
                    <ol>
                        <li>Refreshing the page</li>
                        <li>Checking if your character data is properly loaded</li>
                        <li>Verifying that all required modules are loaded</li>
                    </ol>
                    <button id="retryRelationshipsBtn" class="retry-btn">Retry Loading</button>
                </div>
            </div>
        `;
        
        relationshipsTab.appendChild(container);
        
        // Add retry button functionality
        const retryBtn = document.getElementById('retryRelationshipsBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                // Remove the fallback UI
                container.remove();
                
                // Try to reload the module
                const scriptSrc = 'app/js/modules/relationships.js';
                const script = document.createElement('script');
                script.src = scriptSrc + '?t=' + new Date().getTime(); // Add timestamp to avoid caching
                script.onload = function() {
                    console.log('Relationships module reloaded on retry');
                    if (typeof Relationships.initRelationshipManager === 'function') {
                        try {
                            Relationships.initRelationshipManager();
                        } catch (e) {
                            console.error('Failed to initialize relationship manager on retry:', e);
                            createFallbackRelationshipUI();
                        }
                    }
                };
                document.head.appendChild(script);
            });
        }
    }
    
    function ensurePlotsTabLoaded() {
        if (typeof Plots === 'undefined' || !Plots) {
            console.warn('Plots module not available, attempting to initialize...');
            window.Plots = window.Plots || {};
        }
        
        // Update plots list
        if (typeof Plots.displayPlots === 'function') {
            try {
                Plots.displayPlots();
            } catch (e) {
                console.error('Error refreshing plots list:', e);
            }
        }
    }
    
    function ensureWorldbuildingTabLoaded() {
        console.log('Ensuring worldbuilding tab is loaded properly');
        
        if (typeof WorldBuilding === 'undefined' || !WorldBuilding) {
            console.warn('WorldBuilding module not available, attempting to initialize...');
            window.WorldBuilding = window.WorldBuilding || {};
        }
        
        try {
            // Check if we need to initialize
            if (!window.WorldBuilding.initialized) {
                console.log('Initializing WorldBuilding module for the first time');
                if (typeof window.WorldBuilding.initializeWorldBuilding === 'function') {
                    window.WorldBuilding.initializeWorldBuilding();
                    console.log('WorldBuilding module initialized successfully');
                }
            }
            
            // First - load pagination settings to ensure they're available
            if (typeof window.WorldBuilding.loadPaginationSettings === 'function') {
                window.WorldBuilding.loadPaginationSettings();
                console.log('World building pagination settings loaded');
            } else {
                console.warn('loadPaginationSettings function not available');
            }
            
            // Get the current element page from localStorage
            try {
                const storedPage = localStorage.getItem('currentElementPage');
                if (storedPage && !isNaN(parseInt(storedPage))) {
                    window.WorldBuilding.currentElementPage = parseInt(storedPage);
                    console.log(`Restored currentElementPage from localStorage: ${storedPage}`);
                }
            } catch (e) {
                console.error('Error restoring page from localStorage:', e);
            }
            
            // Update world elements list - first try displayWorldBuilding
            if (typeof window.WorldBuilding.displayWorldBuilding === 'function') {
                console.log('Refreshing world elements list using displayWorldBuilding');
                window.WorldBuilding.displayWorldBuilding();
            } else if (typeof window.WorldBuilding.displayWorldElements === 'function') {
                // Fallback for compatibility
                console.log('Using compatible function displayWorldElements to refresh world elements list');
                window.WorldBuilding.displayWorldElements();
            } else {
                console.error('No display function available for world building elements');
                // Create a simple error message in the tab
                const worldbuildingTab = document.getElementById('worldbuilding-tab');
                if (worldbuildingTab) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.innerHTML = `
                        <h3>Error Loading World Building Tab</h3>
                        <p>The required display functions for world building elements are not available.</p>
                        <p>Please refresh the page or check the console for details.</p>
                        <button onclick="location.reload()">Refresh Page</button>
                    `;
                    worldbuildingTab.appendChild(errorMsg);
                }
            }
        } catch (e) {
            console.error('Error initializing world building tab:', e);
            
            // Create an error message in the tab
            try {
                const worldbuildingTab = document.getElementById('worldbuilding-tab');
                if (worldbuildingTab) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.innerHTML = `
                        <h3>Error Loading World Building Tab</h3>
                        <p>An error occurred while initializing the world building tab: ${e.message}</p>
                        <p>Please refresh the page or check the console for details.</p>
                        <button onclick="location.reload()">Refresh Page</button>
                    `;
                    worldbuildingTab.appendChild(errorMsg);
                }
            } catch (innerError) {
                console.error('Unable to display error message:', innerError);
            }
        }
    }
    
    function ensureTimelineTabLoaded() {
        if (typeof Timeline === 'undefined' || !Timeline) {
            console.warn('Timeline module not available, attempting to initialize...');
            window.Timeline = window.Timeline || {};
        }
        
        // Initialize timeline if not already initialized
        if (typeof Timeline.initializeTimeline === 'function' && !Timeline.initialized) {
            try {
                Timeline.initializeTimeline();
                Timeline.initialized = true;
                console.log('Timeline initialized');
            } catch (e) {
                console.error('Error initializing timeline:', e);
            }
        }
        
        // Refresh timeline
        if (typeof Timeline.displayTimeline === 'function') {
            try {
                Timeline.displayTimeline();
                console.log('Timeline refreshed');
            } catch (e) {
                console.error('Error refreshing timeline:', e);
            }
        }
        
        // Update filter dropdowns
        if (typeof Timeline.updateTimelineFilterDropdowns === 'function') {
            try {
                Timeline.updateTimelineFilterDropdowns();
                console.log('Timeline filter dropdowns updated');
            } catch (e) {
                console.error('Error updating timeline filter dropdowns:', e);
            }
        }
    }
    
    function ensureStatisticsTabLoaded() {
        if (typeof Statistics === 'undefined' || !Statistics) {
            console.warn('Statistics module not available, attempting to initialize...');
            window.Statistics = window.Statistics || {};
        }
        
        // Refresh statistics
        if (typeof Statistics.createStatisticsDashboard === 'function') {
            try {
                Statistics.createStatisticsDashboard();
            } catch (e) {
                console.error('Error refreshing statistics:', e);
            }
        }
    }
    
    function ensureAnalyzeBookTabLoaded() {
        if (typeof BookAnalysis === 'undefined' || !BookAnalysis) {
            console.warn('BookAnalysis module not available, attempting to initialize...');
            window.BookAnalysis = window.BookAnalysis || {};
        }
        
        // Make sure needed UI elements exist
        const fileDropArea = document.getElementById('fileDropArea');
        if (fileDropArea && typeof BookAnalysis.initializeFileDropArea === 'function') {
            try {
                BookAnalysis.initializeFileDropArea();
            } catch (e) {
                console.error('Error initializing file drop area:', e);
            }
        }
    }
    
    function ensureDashboardTabLoaded() {
        if (typeof Dashboard === 'undefined' || !Dashboard) {
            console.warn('Dashboard module not available, attempting to initialize...');
            window.Dashboard = window.Dashboard || {};
        }
        
        // Refresh dashboard
        if (typeof Dashboard.displayDashboard === 'function') {
            try {
                Dashboard.displayDashboard();
            } catch (e) {
                console.error('Error refreshing dashboard:', e);
            }
        }
    }
    
    // Basic Characters module initialization in case it's missing
    function initializeCharactersModule() {
        if (!window.Characters) {
            window.Characters = {};
        }
        
        // Initialize basic functionality
        Characters.displayCharacters = Characters.displayCharacters || function() {
            console.log('Characters.displayCharacters called (default implementation)');
            
            // Get characters data from storage
            const characters = window.characters || [];
            const characterList = document.getElementById('characterList');
            
            if (!characterList) {
                console.error('Character list element not found');
                return;
            }
            
            // Clear existing list
            characterList.innerHTML = '';
            
            // Display characters or show message if none
            if (characters.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = '<td colspan="8" class="empty-message">No characters found. Add your first character using the form above.</td>';
                characterList.appendChild(emptyRow);
            } else {
                characters.forEach((character, index) => {
                    const row = document.createElement('tr');
                    
                    // Image cell
                    const imgCell = document.createElement('td');
                    if (character.image) {
                        const img = document.createElement('img');
                        img.src = character.image;
                        img.alt = `${character.firstName} ${character.lastName}`;
                        img.style.width = '50px';
                        img.style.height = '50px';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '50%';
                        imgCell.appendChild(img);
                    } else {
                        imgCell.textContent = 'No Image';
                    }
                    
                    // Create other cells
                    const firstNameCell = document.createElement('td');
                    firstNameCell.textContent = character.firstName || '';
                    
                    const lastNameCell = document.createElement('td');
                    lastNameCell.textContent = character.lastName || '';
                    
                    const roleCell = document.createElement('td');
                    roleCell.textContent = character.role || '';
                    
                    const seriesCell = document.createElement('td');
                    seriesCell.textContent = character.series || '';
                    
                    const bookCell = document.createElement('td');
                    bookCell.textContent = character.book || '';
                    
                    const descriptionCell = document.createElement('td');
                    const truncatedDesc = (character.description || '').substring(0, 100);
                    descriptionCell.textContent = truncatedDesc + (character.description && character.description.length > 100 ? '...' : '');
                    
                    // Actions cell
                    const actionsCell = document.createElement('td');
                    
                    const viewBtn = document.createElement('button');
                    viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                    viewBtn.className = 'show-btn';
                    viewBtn.title = 'View Character';
                    viewBtn.onclick = function() {
                        if (typeof Characters.showCharacterDetails === 'function') {
                            Characters.showCharacterDetails(index);
                        } else {
                            alert('View function not available');
                        }
                    };
                    
                    const editBtn = document.createElement('button');
                    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                    editBtn.className = 'edit-btn';
                    editBtn.title = 'Edit Character';
                    editBtn.onclick = function() {
                        if (typeof Characters.editCharacter === 'function') {
                            Characters.editCharacter(index);
                        } else {
                            alert('Edit function not available');
                        }
                    };
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.title = 'Delete Character';
                    deleteBtn.onclick = function() {
                        if (typeof Characters.deleteCharacter === 'function') {
                            Characters.deleteCharacter(index);
                        } else {
                            alert('Delete function not available');
                        }
                    };
                    
                    actionsCell.appendChild(viewBtn);
                    actionsCell.appendChild(editBtn);
                    actionsCell.appendChild(deleteBtn);
                    
                    // Add all cells to row
                    row.appendChild(imgCell);
                    row.appendChild(firstNameCell);
                    row.appendChild(lastNameCell);
                    row.appendChild(roleCell);
                    row.appendChild(seriesCell);
                    row.appendChild(bookCell);
                    row.appendChild(descriptionCell);
                    row.appendChild(actionsCell);
                    
                    // Add row to table
                    characterList.appendChild(row);
                });
            }
        };
        
        // Add other basic event handlers for the character form
        const characterForm = document.getElementById('characterForm');
        if (characterForm) {
            characterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form values
                const firstName = document.getElementById('firstName').value;
                const lastName = document.getElementById('lastName').value;
                
                if (!firstName) {
                    alert('First name is required');
                    return;
                }
                
                // Create character object
                const character = {
                    firstName: firstName,
                    lastName: lastName,
                    alias: document.getElementById('alias')?.value || '',
                    title: document.getElementById('title')?.value || '',
                    age: document.getElementById('age')?.value || '',
                    gender: document.getElementById('gender')?.value || '',
                    race: document.getElementById('race')?.value || '',
                    appearance: document.getElementById('appearance')?.value || '',
                    role: document.getElementById('role')?.value || '',
                    series: document.getElementById('series')?.value || '',
                    book: document.getElementById('book')?.value || '',
                    occupation: document.getElementById('occupation')?.value || '',
                    description: document.getElementById('description')?.value || 
                                 document.getElementById('characterRichTextEditor')?.innerHTML || '',
                    notes: document.getElementById('notes')?.value || ''
                };
                
                // Add to characters array
                window.characters = window.characters || [];
                window.characters.push(character);
                
                // Save data
                if (typeof Storage !== 'undefined' && typeof Storage.saveDatabase === 'function') {
                    Storage.saveDatabase();
                } else {
                    // Simple save to localStorage
                    localStorage.setItem('characters', JSON.stringify(window.characters));
                }
                
                // Reset form
                characterForm.reset();
                if (document.getElementById('characterRichTextEditor')) {
                    document.getElementById('characterRichTextEditor').innerHTML = '';
                }
                
                // Update display
                if (typeof Characters.displayCharacters === 'function') {
                    Characters.displayCharacters();
                }
                
                // Show confirmation
                if (typeof Core !== 'undefined' && typeof Core.showToast === 'function') {
                    Core.showToast('Character added successfully', 'success');
                } else {
                    alert('Character added successfully');
                }
            });
        }
        
        // Initialize character form
        Characters.clearCharacterForm = function() {
            const form = document.getElementById('characterForm');
            if (form) {
                form.reset();
                
                // Clear rich text editor
                const richTextEditor = document.getElementById('characterRichTextEditor');
                if (richTextEditor) {
                    richTextEditor.innerHTML = '';
                }
            }
        };
        
        // Initialize dropdown change handler
        Characters.handleDropdownChange = function(fieldName, value) {
            if (value === 'new') {
                const formId = `new${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Form`;
                const form = document.getElementById(formId);
                if (form) {
                    form.style.display = 'block';
                }
            }
        };
        
        // Initialize add new item handler
        Characters.addNewItem = function(fieldName) {
            const inputId = `new${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Input`;
            const input = document.getElementById(inputId);
            
            if (input && input.value.trim()) {
                const value = input.value.trim();
                const selectId = fieldName;
                const select = document.getElementById(selectId);
                
                if (select) {
                    // Add new option
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    
                    // Insert before the "Add New" option
                    const newOption = select.querySelector('option[value="new"]');
                    if (newOption) {
                        select.insertBefore(option, newOption);
                    } else {
                        select.appendChild(option);
                    }
                    
                    // Select the new value
                    select.value = value;
                    
                    // Hide the form
                    const formId = `new${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Form`;
                    const form = document.getElementById(formId);
                    if (form) {
                        form.style.display = 'none';
                        input.value = '';
                    }
                }
            }
        };
        
        // Initialize cancel new item handler
        Characters.cancelNewItem = function(fieldName) {
            const formId = `new${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Form`;
            const form = document.getElementById(formId);
            if (form) {
                form.style.display = 'none';
                
                const inputId = `new${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Input`;
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = '';
                }
                
                const select = document.getElementById(fieldName);
                if (select) {
                    select.value = '';
                }
            }
        };
        
        // Mark as initialized
        Characters.initialized = true;
    }
    
    // Load characters on initial script load if none exist
    if (!window.Characters) {
        window.Characters = {};
        initializeCharactersModule();
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Tab switching fix initialized');
        
        // Restore last active tab from localStorage
        const lastTab = localStorage.getItem('currentTab');
        if (lastTab) {
            try {
                UI.switchTab(lastTab);
            } catch (e) {
                console.error('Error restoring last tab:', e);
                // Default to dashboard if error
                UI.switchTab('dashboard');
            }
        }
    });
})();
