/**
 * UI utilities for Story Database
 * Handles tab switching, dark mode, and other UI-related functionality
 */

// Current UI state
let isDarkMode = false;
let currentSort = { column: 'firstName', direction: 'asc' };
let currentLocationSort = { column: 'name', direction: 'asc' };

// Safely get items from localStorage
function safelyGetItem(key, defaultValue) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (error) {
        console.error(`Error accessing localStorage for key ${key}:`, error);
        return defaultValue;
    }
}

// Initialize dark mode from localStorage
try {
    isDarkMode = safelyGetItem('darkMode', 'false') === 'true';
} catch (error) {
    console.error('Error initializing dark mode:', error);
}

// Tab Management
function switchTab(tabName) {
    // Get the current active tab
    const currentActiveTab = document.querySelector('.tab-content.active');
    const currentTabId = currentActiveTab ? currentActiveTab.id : null;
    const currentTabName = currentTabId ? currentTabId.replace('-tab', '') : null;
    
    // Check if we're switching away from a tab with editing functionality
    let checkType = null;
    
    if (currentTabName === 'characters') {
        checkType = 'character';
    } else if (currentTabName === 'locations') {
        checkType = 'location';
    } else if (currentTabName === 'plots') {
        checkType = 'plot';
    } else if (currentTabName === 'worldbuilding') {
        checkType = 'worldElement';
    }
    
    // Function to perform the actual tab switch
    const performTabSwitch = () => {
        // Update button states
        try {
            document.querySelectorAll('.tab-button').forEach(button => {
                if (button && button.classList) {
                    button.classList.remove('active');
                    // Normalize both strings for comparison: remove hyphens and convert to lowercase
                    const buttonText = button.textContent ? button.textContent.toLowerCase().replace(/-/g, '') : '';
                    const normalizedTabName = tabName.toLowerCase().replace(/-/g, '');
                    
                    if (buttonText.includes(normalizedTabName)) {
                        button.classList.add('active');
                    }
                }
            });
        } catch (error) {
            console.error('Error updating button states:', error);
        }

        // Update tab content visibility
        try {
            document.querySelectorAll('.tab-content').forEach(content => {
                if (content && content.classList) {
                    content.classList.remove('active');
                }
            });
            
            const tabElement = document.getElementById(`${tabName}-tab`);
            if (tabElement && tabElement.classList) {
                tabElement.classList.add('active');
            } else {
                console.error(`Tab element not found or classList not available: ${tabName}-tab`);
                // Create the tab element if it doesn't exist
                if (!tabElement) {
                    console.log(`Creating missing tab element: ${tabName}-tab`);
                    const newTabElement = document.createElement('div');
                    newTabElement.id = `${tabName}-tab`;
                    newTabElement.className = 'tab-content active';
                    document.querySelector('.container').appendChild(newTabElement);
                }
            }
        } catch (error) {
            console.error('Error updating tab visibility:', error);
        }

        // Initialize appropriate content
        if (tabName === 'dashboard') {
            Dashboard.displayDashboard();
        } else if (tabName === 'characters') {
            Characters.displayCharacters();
            if (typeof Relationships !== 'undefined' && Relationships.updateRelationshipsList) {
                Relationships.updateRelationshipsList();
            }
        } else if (tabName === 'locations') {
            try {
                console.log('Initializing locations tab...');
                // Check if required DOM elements exist
                const locationTable = document.getElementById('locationTable');
                const locationForm = document.getElementById('locationForm');
                
                if (!locationTable || !locationForm) {
                    console.error('Error loading locations tab: Required DOM elements not found');
                    Core.showToast('Error loading locations tab. Some elements may be missing.', 'error');
                } else {
                    Locations.displayLocations();
                }
            } catch (error) {
                console.error('Error loading locations tab:', error);
                Core.showToast('Error loading locations tab: ' + error.message, 'error');
            }
        } else if (tabName === 'relationships') {
            try {
                console.log('Initializing relationships tab...');
                // Check if required DOM elements exist
                const relationshipList = document.getElementById('relationshipList');
                const relationshipNetwork = document.getElementById('relationshipNetwork');
                
                if (!relationshipList || !relationshipNetwork) {
                    console.error('Error loading relationships tab: Required DOM elements not found');
                    Core.showToast('Error loading relationships tab. Some elements may be missing.', 'error');
                } else {
                    Relationships.displayRelationships();
                }
            } catch (error) {
                console.error('Error loading relationships tab:', error);
                Core.showToast('Error loading relationships tab: ' + error.message, 'error');
            }
        } else if (tabName === 'timeline') {
            try {
                console.log('Initializing timeline tab...');
                const timelineContent = document.getElementById('timelineContent');
                
                if (!timelineContent) {
                    console.error('Error loading timeline tab: Required DOM elements not found');
                    Core.showToast('Error loading timeline tab. Some elements may be missing.', 'error');
                } else {
                    Timeline.displayTimeline();
                }
            } catch (error) {
                console.error('Error loading timeline tab:', error);
                Core.showToast('Error loading timeline tab: ' + error.message, 'error');
            }
        } else if (tabName === 'plots') {
            try {
                console.log('Initializing plots tab...');
                const plotTable = document.getElementById('plotTable');
                const plotForm = document.getElementById('plotForm');
                
                if (!plotTable || !plotForm) {
                    console.error('Error loading plots tab: Required DOM elements not found');
                    Core.showToast('Error loading plots tab. Some elements may be missing.', 'error');
                } else {
                    Plots.displayPlots();
                }
            } catch (error) {
                console.error('Error loading plots tab:', error);
                Core.showToast('Error loading plots tab: ' + error.message, 'error');
            }
        } else if (tabName === 'worldbuilding') {
            try {
                console.log('Initializing worldbuilding tab...');
                // Ensure the tab stays active by clearing any existing timer
                if (window.worldSearchDebounceTimer) {
                    clearTimeout(window.worldSearchDebounceTimer);
                }
                
                const worldElementTable = document.getElementById('worldElementTable');
                const worldElementForm = document.getElementById('worldElementForm');
                
                if (!worldElementTable || !worldElementForm) {
                    console.error('Error loading worldbuilding tab: Required DOM elements not found');
                    Core.showToast('Error loading worldbuilding tab. Some elements may be missing.', 'error');
                } else {
                    // Call displayWorldBuilding directly without debounce for tab switching
                    WorldBuilding.displayWorldBuilding();
                }
            } catch (error) {
                console.error('Error loading worldbuilding tab:', error);
                Core.showToast('Error loading worldbuilding tab: ' + error.message, 'error');
            }
        } else if (tabName === 'statistics') {
            try {
                console.log('Initializing statistics tab...');
                const statisticsTab = document.getElementById('statistics-tab');
                
                if (!statisticsTab) {
                    console.error('Error loading statistics tab: Required DOM elements not found');
                    Core.showToast('Error loading statistics tab. Some elements may be missing.', 'error');
                } else {
                    // Create statistics dashboard with a small delay to ensure DOM is ready
                    setTimeout(() => {
                        try {
                            Statistics.createStatisticsDashboard();
                        } catch (error) {
                            console.error('Error refreshing statistics dashboard:', error);
                        }
                    }, 100);
                }
            } catch (error) {
                console.error('Error loading statistics tab:', error);
                Core.showToast('Error loading statistics tab: ' + error.message, 'error');
            }
        } else if (tabName === 'analyze-book') {
            try {
                console.log('Initializing analyze-book tab...');
                const analyzeBookTab = document.getElementById('analyze-book-tab');
                
                if (!analyzeBookTab) {
                    console.error('Error loading analyze-book tab: Required DOM elements not found');
                    Core.showToast('Error loading analyze-book tab. Some elements may be missing.', 'error');
                } else {
                    // Initialize Book Analysis tab
                    if (typeof BookAnalysis !== 'undefined' && BookAnalysis.initialize) {
                        BookAnalysis.initialize();
                        console.log('Book Analysis initialized');
                    } else {
                        console.error('BookAnalysis module not found or initialize method not available');
                        Core.showToast('Error initializing Book Analysis module', 'error');
                    }
                }
            } catch (error) {
                console.error('Error loading analyze-book tab:', error);
                Core.showToast('Error loading analyze-book tab: ' + error.message, 'error');
            }
        }
    };
    
    // If we're switching from a tab with editing functionality, check for unsaved changes
    if (checkType && tabName !== currentTabName) {
        Core.checkForUnsavedChanges(checkType, performTabSwitch);
    } else {
        // No need to check for unsaved changes, just switch tabs
        performTabSwitch();
    }
}

// Safely set items in localStorage
function safelySetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error(`Error setting localStorage for key ${key}:`, error);
        return false;
    }
}

// Dark Mode Toggle
function toggleDarkMode() {
    try {
        isDarkMode = !isDarkMode;
        
        if (document.body && document.body.classList) {
            document.body.classList.toggle('dark-mode', isDarkMode);
        }
        
        safelySetItem('darkMode', isDarkMode);
        
        // Update theme toggle text
        const toggleText = document.querySelector('.theme-toggle-text');
        const toggleIcon = document.querySelector('.theme-toggle-icon');
        
        if (toggleText) {
            toggleText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
        }
        
        if (toggleIcon) {
            const icon = toggleIcon.querySelector('i');
            if (icon && icon.classList) {
                icon.classList.remove(isDarkMode ? 'fa-moon' : 'fa-sun');
                icon.classList.add(isDarkMode ? 'fa-sun' : 'fa-moon');
            }
        }
        
        // Notify main process about theme change
        if (window.api && window.api.send) {
            window.api.send('theme-changed', isDarkMode);
        }
        
        // Refresh statistics if on statistics tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'statistics-tab' && typeof Statistics !== 'undefined') {
            setTimeout(() => {
                try {
                    Statistics.createStatisticsDashboard();
                } catch (error) {
                    console.error('Error refreshing statistics dashboard:', error);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error toggling dark mode:', error);
    }
}

// Initialize dark mode
function initializeDarkMode() {
    try {
        if (isDarkMode) {
            if (document.body && document.body.classList) {
                document.body.classList.add('dark-mode');
            }
            
            const toggleText = document.querySelector('.theme-toggle-text');
            const toggleIcon = document.querySelector('.theme-toggle-icon');
            
            if (toggleText) {
                toggleText.textContent = 'Light Mode';
            }
            
            if (toggleIcon) {
                const icon = toggleIcon.querySelector('i');
                if (icon && icon.classList) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }
        }
        
        // Listen for theme changes from main process
        if (window.api && window.api.on) {
            window.api.on('theme-changed', (isDark) => {
                console.log('Received theme-changed event:', isDark);
                
                // Update dark mode state
                isDarkMode = isDark;
                
                // Apply theme
                if (document.body && document.body.classList) {
                    document.body.classList.toggle('dark-mode', isDarkMode);
                }
                
                // Update localStorage
                safelySetItem('darkMode', isDarkMode);
                
                // Update theme toggle UI
                const toggleText = document.querySelector('.theme-toggle-text');
                const toggleIcon = document.querySelector('.theme-toggle-icon');
                
                if (toggleText) {
                    toggleText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
                }
                
                if (toggleIcon) {
                    const icon = toggleIcon.querySelector('i');
                    if (icon && icon.classList) {
                        icon.classList.remove(isDarkMode ? 'fa-moon' : 'fa-sun');
                        icon.classList.add(isDarkMode ? 'fa-sun' : 'fa-moon');
                    }
                }
                
                // Refresh statistics if on statistics tab
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab && activeTab.id === 'statistics-tab' && typeof Statistics !== 'undefined') {
                    setTimeout(() => {
                        try {
                            Statistics.createStatisticsDashboard();
                        } catch (error) {
                            console.error('Error refreshing statistics dashboard:', error);
                        }
                    }, 100);
                }
            });
        }
    } catch (error) {
        console.error('Error initializing dark mode:', error);
    }
}

// Advanced Search Toggle
function toggleAdvancedSearch() {
    const advancedSearch = document.getElementById('advancedSearch');
    const toggle = document.querySelector('.advanced-search-toggle');
    
    if (advancedSearch.style.display === 'none') {
        advancedSearch.style.display = 'grid';
        toggle.textContent = 'Advanced Search ▲';
    } else {
        advancedSearch.style.display = 'none';
        toggle.textContent = 'Advanced Search ▼';
    }
}

function toggleLocationAdvancedSearch() {
    const advancedSearch = document.getElementById('locationAdvancedSearch');
    const toggle = document.querySelector('.advanced-search-toggle:nth-of-type(2)');
    
    if (advancedSearch.style.display === 'none') {
        advancedSearch.style.display = 'grid';
        toggle.textContent = 'Advanced Search ▲';
    } else {
        advancedSearch.style.display = 'none';
        toggle.textContent = 'Advanced Search ▼';
    }
}

// Pagination Controls
function updatePaginationControls(totalItems, itemsPerPage, currentPage, type) {
    console.log(`Updating pagination controls for ${type}:`, { totalItems, itemsPerPage, currentPage });
    
    // Get current page from localStorage if available
    if (type === 'character') {
        const storedCurrentPage = localStorage.getItem('currentCharacterPage');
        if (storedCurrentPage) {
            const parsedValue = parseInt(storedCurrentPage);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                currentPage = parsedValue;
                console.log(`Using currentPage from localStorage: ${currentPage}`);
            }
        }
    }
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Get the pagination container based on type
    const containerId = `${type}Pagination`;
    
    // Remove existing pagination container completely to clear all event listeners
    const existingContainer = document.getElementById(containerId);
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Create a new pagination container
    const paginationContainer = document.createElement('div');
    paginationContainer.id = containerId;
    paginationContainer.className = 'pagination-controls';
    
    // Find the table container
    const tableSelector = type === 'worldbuilding' ? '#worldElementTable' : `#${type}Table`;
    const tableElement = document.querySelector(tableSelector);
    
    if (!tableElement) {
        console.error(`Table element not found with selector: ${tableSelector}`);
        
        // Special case for worldElement which might have a mismatch
        if (type === 'worldElement') {
            const worldElementTable = document.querySelector('#worldElementTable');
            if (worldElementTable) {
                const tableContainer = worldElementTable.parentNode;
                if (tableContainer) {
                    tableContainer.appendChild(paginationContainer);
                    return; // Successfully handled the special case
                }
            }
        }
        
        return; // Exit early if table not found
    }
    
    const tableContainer = tableElement.parentNode;
    if (!tableContainer) {
        console.error(`Parent container not found for table: ${tableSelector}`);
        return; // Exit early if parent container not found
    }
    
    // Apply or remove 'many-entries' class based on items per page
    if (itemsPerPage > 10) {
        tableContainer.classList.add('many-entries');
        console.log(`Added 'many-entries' class to ${type} table container`);
    } else {
        tableContainer.classList.remove('many-entries');
        console.log(`Removed 'many-entries' class from ${type} table container`);
    }
    
    tableContainer.appendChild(paginationContainer);
    
    // Create page size selector
    const pageSizeContainer = document.createElement('div');
    pageSizeContainer.className = 'page-size-container';
    
    const pageSizeLabel = document.createElement('span');
    pageSizeLabel.textContent = 'Show: ';
    pageSizeLabel.style.fontWeight = 'bold';
    pageSizeContainer.appendChild(pageSizeLabel);
    
    const pageSizeSelector = document.createElement('select');
    pageSizeSelector.className = 'page-size-selector';
    pageSizeSelector.id = `${type}PageSizeSelector`;
    
    // Create page size options
    const sizeOptions = [5, 10, 25, 50, 100];
    
    // Make sure the current itemsPerPage is in the options
    if (!sizeOptions.includes(itemsPerPage)) {
        sizeOptions.push(itemsPerPage);
        sizeOptions.sort((a, b) => a - b);
    }
    
    sizeOptions.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = `${size} per page`;
        option.selected = itemsPerPage === size;
        pageSizeSelector.appendChild(option);
    });
    
    console.log(`Created page size selector with options:`, sizeOptions);
    console.log(`Current itemsPerPage: ${itemsPerPage}`);
    
    // Add event listener for page size change
    pageSizeSelector.addEventListener('change', function() {
        const newSize = parseInt(this.value);
        console.log(`${type} page size changed to ${newSize}`);
        
        // Update the appropriate module's page size
        if (type === 'character') {
            try {
                // Update the characters per page
                window.Characters.charactersPerPage = newSize;
                
                // Reset to page 1
                window.Characters.currentCharacterPage = 1;
                localStorage.setItem('currentCharacterPage', '1');
                localStorage.setItem('charactersPerPage', newSize.toString());
                
                // Call the save function for additional processing
                window.Characters.savePaginationSettings();
                
                // Force the value to be applied
                console.log(`Forcing charactersPerPage to ${newSize}`);
                
                // Refresh the display with a longer delay to ensure settings are saved
                setTimeout(() => {
                    // Double-check the value before display
                    if (window.Characters.charactersPerPage !== newSize) {
                        window.Characters.charactersPerPage = newSize;
                        console.log(`Re-applied charactersPerPage = ${newSize}`);
                    }
                    window.Characters.displayCharacters();
                }, 500);
            } catch (error) {
                console.error("Error updating page size:", error);
            }
        } else if (type === 'location') {
            try {
                // Call the dedicated function to change locations per page
                window.Locations.changeLocationsPerPage(newSize);
            } catch (error) {
                console.error("Error updating location page size:", error);
            }
        } else if (type === 'plot') {
            try {
                // Update the plots per page
                window.Plots.plotsPerPage = newSize;
                
                // Reset to page 1
                window.Plots.currentPlotPage = 1;
                localStorage.setItem('plotsPerPage', newSize.toString());
                localStorage.setItem('currentPlotPage', '1');
                
                // Call the save function for additional processing
                window.Plots.savePaginationSettings();
                
                // Force the value to be applied
                console.log(`Forcing plotsPerPage to ${newSize}`);
                
                // Refresh the display with a longer delay to ensure settings are saved
                setTimeout(() => {
                    // Double-check the value before display
                    if (window.Plots.plotsPerPage !== newSize) {
                        window.Plots.plotsPerPage = newSize;
                        console.log(`Re-applied plotsPerPage = ${newSize}`);
                    }
                    window.Plots.displayPlots();
                }, 500);
            } catch (error) {
                console.error("Error updating plot page size:", error);
            }
        } else if (type === 'worldbuilding') {
            try {
                // Ensure new size is valid
                const validSize = parseInt(newSize) || 5;
                console.log(`Changing worldbuilding page size to ${validSize}`);
                
                // Call the dedicated function to change elements per page if it exists
                if (typeof window.WorldBuilding.changeElementsPerPage === 'function') {
                    window.WorldBuilding.changeElementsPerPage(validSize);
                } else {
                    // Fallback if the function doesn't exist
                    console.warn('changeElementsPerPage function not available, applying changes directly');
                    
                    // Update the elements per page
                    if (typeof window.WorldBuilding.elementsPerPage !== 'undefined') {
                        window.WorldBuilding.elementsPerPage = validSize;
                    }
                    
                    // Reset to page 1
                    if (typeof window.WorldBuilding.currentElementPage !== 'undefined') {
                        window.WorldBuilding.currentElementPage = 1;
                    }
                    
                    // Save settings to localStorage
                    localStorage.setItem('elementsPerPage', validSize.toString());
                    localStorage.setItem('currentElementPage', '1');
                    
                    // Call the save function if available
                    if (typeof window.WorldBuilding.savePaginationSettings === 'function') {
                        window.WorldBuilding.savePaginationSettings();
                    }
                    
                    // Refresh the display
                    setTimeout(() => {
                        if (typeof window.WorldBuilding.displayWorldBuilding === 'function') {
                            window.WorldBuilding.displayWorldBuilding();
                        } else if (typeof window.WorldBuilding.displayWorldElements === 'function') {
                            window.WorldBuilding.displayWorldElements();
                        }
                    }, 300);
                }
            } catch (error) {
                console.error("Error updating worldbuilding page size:", error);
                // Attempt recovery by forcing refresh
                setTimeout(() => {
                    if (typeof window.WorldBuilding.displayWorldBuilding === 'function') {
                        window.WorldBuilding.displayWorldBuilding();
                    }
                }, 500);
            }
        }
    });
    
    pageSizeContainer.appendChild(pageSizeSelector);
    paginationContainer.appendChild(pageSizeContainer);
    
    // Create pagination buttons container
    const paginationButtons = document.createElement('div');
    paginationButtons.className = 'pagination-buttons';
    
    // First page button
    const firstPageBtn = document.createElement('button');
    firstPageBtn.type = 'button';
    firstPageBtn.textContent = '<<';
    firstPageBtn.title = 'First Page';
    firstPageBtn.disabled = currentPage <= 1;
    firstPageBtn.addEventListener('click', function() {
        console.log(`${type} first page clicked`);
        if (type === 'character') {
            // Set to first page
            window.Characters.currentCharacterPage = 1;
            
            // Save directly to localStorage
            localStorage.setItem('currentCharacterPage', '1');
            console.log(`Directly saved to localStorage: currentCharacterPage=1`);
            
            // Call the save function for additional processing
            window.Characters.savePaginationSettings();
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayCharacters with currentCharacterPage=${window.Characters.currentCharacterPage}`);
                window.Characters.displayCharacters();
            }, 300);
        } else if (type === 'location') {
            window.Locations.currentLocationPage = 1;
            setTimeout(() => {
                window.Locations.displayLocations();
            }, 50);
        } else if (type === 'plot') {
            window.Plots.currentPlotPage = 1;
            setTimeout(() => {
                window.Plots.displayPlots();
            }, 50);
        } else if (type === 'worldbuilding') {
            // Set to first page
            window.WorldBuilding.currentElementPage = 1;
            
            // Save directly to localStorage
            localStorage.setItem('currentElementPage', '1');
            console.log(`Directly saved to localStorage: currentElementPage=1`);
            
            // Call the save function for additional processing
            if (typeof window.WorldBuilding.savePaginationSettings === 'function') {
                window.WorldBuilding.savePaginationSettings();
            }
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayWorldBuilding with currentElementPage=1`);
                if (typeof window.WorldBuilding.displayWorldBuilding === 'function') {
                    window.WorldBuilding.displayWorldBuilding();
                } else {
                    // Fallback in case displayWorldBuilding is not available
                    console.warn('displayWorldBuilding function not available, trying displayWorldElements');
                    if (typeof window.WorldBuilding.displayWorldElements === 'function') {
                        window.WorldBuilding.displayWorldElements();
                    }
                }
            }, 300);
        }
    });
    paginationButtons.appendChild(firstPageBtn);
    
    // Previous page button
    const prevPageBtn = document.createElement('button');
    prevPageBtn.type = 'button';
    prevPageBtn.textContent = '<';
    prevPageBtn.title = 'Previous Page';
    prevPageBtn.disabled = currentPage <= 1;
    prevPageBtn.addEventListener('click', function() {
        console.log(`${type} previous page clicked`);
        if (type === 'character') {
            // Decrement the page number
            const newPage = parseInt(window.Characters.currentCharacterPage) - 1;
            console.log(`Decrementing page from ${window.Characters.currentCharacterPage} to ${newPage}`);
            
            // Update the page number in the Characters object
            window.Characters.currentCharacterPage = newPage;
            
            // Save directly to localStorage
            localStorage.setItem('currentCharacterPage', newPage.toString());
            console.log(`Directly saved to localStorage: currentCharacterPage=${newPage}`);
            
            // Call the save function for additional processing
            window.Characters.savePaginationSettings();
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayCharacters with currentCharacterPage=${window.Characters.currentCharacterPage}`);
                window.Characters.displayCharacters();
            }, 300);
        } else if (type === 'location') {
            window.Locations.currentLocationPage--;
            setTimeout(() => {
                window.Locations.displayLocations();
            }, 50);
        } else if (type === 'plot') {
            window.Plots.currentPlotPage--;
            setTimeout(() => {
                window.Plots.displayPlots();
            }, 50);
        } else if (type === 'worldbuilding') {
            // Decrement the page number but ensure it's not less than 1
            const currentPage = parseInt(window.WorldBuilding.currentElementPage || 1);
            const newPage = Math.max(1, currentPage - 1);
            console.log(`Decrementing page from ${currentPage} to ${newPage}`);
            
            // Update the page number
            window.WorldBuilding.currentElementPage = newPage;
            
            // Save directly to localStorage
            localStorage.setItem('currentElementPage', newPage.toString());
            console.log(`Directly saved to localStorage: currentElementPage=${newPage}`);
            
            // Call the save function for additional processing
            if (typeof window.WorldBuilding.savePaginationSettings === 'function') {
                window.WorldBuilding.savePaginationSettings();
            }
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayWorldBuilding with currentElementPage=${newPage}`);
                if (typeof window.WorldBuilding.displayWorldBuilding === 'function') {
                    window.WorldBuilding.displayWorldBuilding();
                } else {
                    // Fallback in case displayWorldBuilding is not available
                    console.warn('displayWorldBuilding function not available, trying displayWorldElements');
                    if (typeof window.WorldBuilding.displayWorldElements === 'function') {
                        window.WorldBuilding.displayWorldElements();
                    }
                }
            }, 300);
        }
    });
    paginationButtons.appendChild(prevPageBtn);
    
    // Page info
    const paginationInfo = document.createElement('div');
    paginationInfo.className = 'pagination-info';
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    paginationButtons.appendChild(paginationInfo);
    
    // Next page button
    const nextPageBtn = document.createElement('button');
    nextPageBtn.type = 'button';
    nextPageBtn.textContent = '>';
    nextPageBtn.title = 'Next Page';
    nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
    nextPageBtn.addEventListener('click', function() {
        console.log(`${type} next page clicked`);
        if (type === 'character') {
            // Increment the page number
            const newPage = parseInt(window.Characters.currentCharacterPage) + 1;
            console.log(`Incrementing page from ${window.Characters.currentCharacterPage} to ${newPage}`);
            
            // Make sure we don't exceed the total pages
            const maxPage = Math.max(1, totalPages);
            const validPage = Math.min(newPage, maxPage);
            
            console.log(`Validated page: ${validPage} (max: ${maxPage})`);
            
            // Update the page number in the Characters object
            window.Characters.currentCharacterPage = validPage;
            
            // Save directly to localStorage
            localStorage.setItem('currentCharacterPage', validPage.toString());
            console.log(`Directly saved to localStorage: currentCharacterPage=${validPage}`);
            
            // Call the save function for additional processing
            window.Characters.savePaginationSettings();
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayCharacters with currentCharacterPage=${window.Characters.currentCharacterPage}`);
                window.Characters.displayCharacters();
            }, 500);
        } else if (type === 'location') {
            // Get the current values
            const newPage = window.Locations.currentLocationPage + 1;
            
            // Update the values
            window.Locations.currentLocationPage = newPage;
            
            // Save directly to localStorage for immediate persistence
            localStorage.setItem('currentLocationPage', newPage.toString());
            console.log(`Directly saved to localStorage: currentLocationPage=${newPage}`);
            
            // Call the save function for additional processing
            window.Locations.savePaginationSettings();
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayLocations with currentLocationPage=${window.Locations.currentLocationPage}`);
                window.Locations.displayLocations();
            }, 300);
        } else if (type === 'plot') {
            const newPage = window.Plots.currentPlotPage + 1;
            window.Plots.currentPlotPage = newPage;
            localStorage.setItem('currentPlotPage', newPage.toString());
            setTimeout(() => {
                window.Plots.displayPlots();
            }, 100);
        } else if (type === 'worldbuilding') {
            // Get the current values
            const currentPage = parseInt(window.WorldBuilding.currentElementPage || 1);
            const newPage = currentPage + 1;
            // Make sure we don't exceed the total pages
            const maxPage = Math.max(1, totalPages);
            const validPage = Math.min(newPage, maxPage);
            
            console.log(`Incrementing page from ${currentPage} to ${validPage} (max: ${maxPage})`);
            
            // Update the values
            window.WorldBuilding.currentElementPage = validPage;
            
            // Save directly to localStorage for immediate persistence
            localStorage.setItem('currentElementPage', validPage.toString());
            console.log(`Directly saved to localStorage: currentElementPage=${validPage}`);
            
            // Call the save function for additional processing
            if (typeof window.WorldBuilding.savePaginationSettings === 'function') {
                window.WorldBuilding.savePaginationSettings();
            }
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayWorldBuilding with currentElementPage=${validPage}`);
                if (typeof window.WorldBuilding.displayWorldBuilding === 'function') {
                    window.WorldBuilding.displayWorldBuilding();
                } else {
                    // Fallback in case displayWorldBuilding is not available
                    console.warn('displayWorldBuilding function not available, trying displayWorldElements');
                    if (typeof window.WorldBuilding.displayWorldElements === 'function') {
                        window.WorldBuilding.displayWorldElements();
                    }
                }
            }, 300);
        }
    });
    paginationButtons.appendChild(nextPageBtn);
    
    // Last page button
    const lastPageBtn = document.createElement('button');
    lastPageBtn.type = 'button';
    lastPageBtn.textContent = '>>';
    lastPageBtn.title = 'Last Page';
    lastPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
    lastPageBtn.addEventListener('click', function() {
        console.log(`${type} last page clicked`);
        if (type === 'character') {
            // Set to the last page
            window.Characters.currentCharacterPage = totalPages;
            
            // Save directly to localStorage
            localStorage.setItem('currentCharacterPage', totalPages.toString());
            console.log(`Directly saved to localStorage: currentCharacterPage=${totalPages}`);
            
            // Call the save function for additional processing
            window.Characters.savePaginationSettings();
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayCharacters with currentCharacterPage=${window.Characters.currentCharacterPage}`);
                window.Characters.displayCharacters();
            }, 300);
        } else if (type === 'location') {
            // Set to the last page
            window.Locations.currentLocationPage = totalPages;
            
            // Save directly to localStorage
            localStorage.setItem('currentLocationPage', totalPages.toString());
            console.log(`Directly saved to localStorage: currentLocationPage=${totalPages}`);
            
            // Call the save function for additional processing
            window.Locations.savePaginationSettings();
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayLocations with currentLocationPage=${window.Locations.currentLocationPage}`);
                window.Locations.displayLocations();
            }, 300);
        } else if (type === 'plot') {
            window.Plots.currentPlotPage = totalPages;
            localStorage.setItem('currentPlotPage', totalPages.toString());
            setTimeout(() => {
                window.Plots.displayPlots();
            }, 100);
        } else if (type === 'worldbuilding') {
            // Set to the last page (ensure totalPages is at least 1)
            const lastPage = Math.max(1, totalPages);
            
            // Update the page number
            window.WorldBuilding.currentElementPage = lastPage;
            
            // Save directly to localStorage
            localStorage.setItem('currentElementPage', lastPage.toString());
            console.log(`Directly saved to localStorage: currentElementPage=${lastPage}`);
            
            // Call the save function for additional processing
            if (typeof window.WorldBuilding.savePaginationSettings === 'function') {
                window.WorldBuilding.savePaginationSettings();
            }
            
            // Refresh the display with a longer delay
            setTimeout(() => {
                console.log(`Calling displayWorldBuilding with currentElementPage=${lastPage}`);
                if (typeof window.WorldBuilding.displayWorldBuilding === 'function') {
                    window.WorldBuilding.displayWorldBuilding();
                } else {
                    // Fallback in case displayWorldBuilding is not available
                    console.warn('displayWorldBuilding function not available, trying displayWorldElements');
                    if (typeof window.WorldBuilding.displayWorldElements === 'function') {
                        window.WorldBuilding.displayWorldElements();
                    }
                }
            }, 300);
        }
    });
    paginationButtons.appendChild(lastPageBtn);
    
    // Add pagination buttons to container
    paginationContainer.appendChild(paginationButtons);
}

// Loading indicator
function showLoading(show = true) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

// Truncate and format database names
function formatDatabaseName(name, maxLength = 40) {
    if (!name) return 'Default';
    
    // Extract filename from path if it's a path
    if (name.includes('\\') || name.includes('/')) {
        name = name.split(/[\\/]/).pop();
    }
    
    // Remove file extension
    name = name.replace(/\.json$/, '');
    
    // First clean up the name by removing timestamps but preserve mystery prefix
    name = name.replace(/-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/, '')  // Remove timestamp
              // .replace(/^(mystery|backup)-/, '')  // Commented out to preserve mystery- prefix
              .replace(/-backup$/, '')  // Remove suffix
              .replace(/[-_]/g, ' ')  // Convert dashes/underscores to spaces
              .split(' ')
              .filter(word => word.length > 0)  // Remove empty words
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())  // Capitalize words
              .join(' ')
              .trim();
    
    // Show only the first 10 characters of the database name
    if (name.length > 10) {
        return name.substring(0, 10) + '...';
    }
    
    return name || 'Default';
}

// Update database indicator
function updateDatabaseIndicator(databaseName = 'Default') {
    try {
        console.log('updateDatabaseIndicator called with:', databaseName);
        const databaseIndicator = document.getElementById('currentDatabaseName');
        if (databaseIndicator) {
            const formattedName = formatDatabaseName(databaseName);
            console.log('Database indicator found, updating text to:', formattedName, '(original:', databaseName, ')');
            databaseIndicator.textContent = formattedName;
            // Store the original database name in localStorage
            safelySetItem('currentDatabaseName', databaseName);
            console.log('Database name stored in localStorage:', databaseName);
        } else {
            console.error('Database indicator element not found!');
            // Try to find the element again after a short delay
            setTimeout(() => {
                try {
                    const retryIndicator = document.getElementById('currentDatabaseName');
                    if (retryIndicator) {
                        const formattedName = formatDatabaseName(databaseName);
                        console.log('Database indicator found on retry, updating text to:', formattedName, '(original:', databaseName, ')');
                        retryIndicator.textContent = formattedName;
                        safelySetItem('currentDatabaseName', databaseName);
                    } else {
                        console.error('Database indicator element still not found after retry!');
                    }
                } catch (error) {
                    console.error('Error in retry update of database indicator:', error);
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error updating database indicator:', error);
    }
}

// Force update database indicator
function forceUpdateDatabaseIndicator() {
    try {
        const storedName = safelyGetItem('currentDatabaseName', null);
        if (storedName) {
            console.log('Force updating database indicator to stored name:', storedName);
            const databaseIndicator = document.getElementById('currentDatabaseName');
            if (databaseIndicator) {
                // Use formatDatabaseName to ensure consistent formatting
                const formattedName = formatDatabaseName(storedName);
                console.log('Formatted database name for display:', formattedName);
                databaseIndicator.textContent = formattedName;
            }
        }
    } catch (error) {
        console.error('Error force updating database indicator:', error);
    }
}

// Toggle toast notifications
function toggleToastNotifications() {
    try {
        // Toggle the Core.toastNotificationsEnabled flag
        Core.toastNotificationsEnabled = !Core.toastNotificationsEnabled;
        
        // Save to localStorage for persistence
        localStorage.setItem('toastNotificationsEnabled', Core.toastNotificationsEnabled);
        
        // Update the UI
        const toastToggleIcon = document.querySelector('#toastToggle i');
        const toastToggleText = document.getElementById('toastToggleText');
        
        if (toastToggleIcon && toastToggleText) {
            if (Core.toastNotificationsEnabled) {
                toastToggleIcon.className = 'fas fa-bell';
                toastToggleText.textContent = 'Notifications On';
            } else {
                toastToggleIcon.className = 'fas fa-bell-slash';
                toastToggleText.textContent = 'Notifications Off';
            }
        }
        
        // Notify other windows about the change
        window.api.send('notification-setting-changed', Core.toastNotificationsEnabled);
        
    } catch (error) {
        console.error('Error toggling toast notifications:', error);
    }
}

// Initialize toast notifications setting
function initializeToastNotifications() {
    try {
        // Get setting from localStorage
        const storedSetting = safelyGetItem('toastNotificationsEnabled', null);
        if (storedSetting !== null) {
            Core.toastNotificationsEnabled = storedSetting === 'true';
        }
        
        // Update the UI
        const toastToggleIcon = document.querySelector('#toastToggle i');
        const toastToggleText = document.getElementById('toastToggleText');
        
        if (toastToggleIcon && toastToggleText) {
            if (Core.toastNotificationsEnabled) {
                toastToggleIcon.className = 'fas fa-bell';
                toastToggleText.textContent = 'Notifications On';
            } else {
                toastToggleIcon.className = 'fas fa-bell-slash';
                toastToggleText.textContent = 'Notifications Off';
            }
        }
    } catch (error) {
        console.error('Error initializing toast notifications:', error);
    }
}

// Show Offline Features in a modal
function showOfflineFeatures() {
    try {
        console.log('Showing offline features information');
        
        // Create modal container
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
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background-color: var(--background-color, #fff);
            color: var(--text-color, #333);
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            position: relative;
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 15px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        closeButton.onclick = function() {
            document.body.removeChild(modal);
        };
        modalContent.appendChild(closeButton);
        
        // Create content container directly with embedded content
        const contentContainer = document.createElement('div');
        
        // Add a style element for proper styling
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            h1, h2, h3 { color: #3a6ea5; }
            .feature {
                background-color: #f8f9fa;
                border-left: 4px solid #3a6ea5;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 0 4px 4px 0;
            }
            .warning {
                background-color: #f8d7da;
                border-left: 4px solid #dc3545;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 4px 4px 0;
            }
            .dark-mode h1, .dark-mode h2, .dark-mode h3 { color: #4a8ec6; }
            .dark-mode .feature {
                background-color: #333;
                border-left-color: #4a8ec6;
            }
            .dark-mode .warning {
                background-color: #3d1c1f;
                border-left-color: #a52834;
                color: #f8a5ad;
            }
        `;
        contentContainer.appendChild(styleElement);
        
        // Add the HTML content
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
            <div style="padding: 20px;">
                <h1 style="text-align: center; margin-bottom: 30px;">Offline-First Features in Story Database</h1>
                <p>Story Database includes robust offline-first capabilities, allowing you to continue working on your stories even when you don't have an internet connection.</p>
                
                <h2>What is Offline-First?</h2>
                <p>Offline-first is an approach to web application development that prioritizes making the app functional without an internet connection. Rather than treating offline functionality as an error condition, it's treated as a core feature.</p>
                
                <h2>How It Works</h2>
                <p>Story Database uses several modern web technologies to enable offline functionality:</p>
                <ul>
                    <li><strong>Service Workers</strong>: These run in the background and intercept network requests, serving cached content when you're offline.</li>
                    <li><strong>Cache API</strong>: Stores application assets (HTML, CSS, JS) and data for offline use.</li>
                    <li><strong>IndexedDB</strong>: A powerful client-side database that stores your story data locally.</li>
                    <li><strong>Progressive Web App (PWA)</strong>: Allows you to install Story Database as an app on your device.</li>
                </ul>
                
                <h2>Features</h2>
                <div class="feature">
                    <h3>Automatic Caching</h3>
                    <ul>
                        <li>All essential application files are cached when you first visit the app</li>
                        <li>Your data is automatically saved to both localStorage and IndexedDB</li>
                        <li>Changes made offline are synchronized when you reconnect</li>
                    </ul>
                </div>
                
                <div class="feature">
                    <h3>Installation as an App</h3>
                    <p>Story Database can be installed as a Progressive Web App (PWA) on your device:</p>
                    <ol>
                        <li>In Chrome, Edge, or other compatible browsers, look for the install icon (➕) in the address bar</li>
                        <li>On mobile devices, you may see a prompt to "Add to Home Screen"</li>
                        <li>Once installed, Story Database will appear in your app list/home screen and can be launched like any other app</li>
                    </ol>
                </div>
                
                <div class="feature">
                    <h3>Offline Indicators</h3>
                    <ul>
                        <li>The app will notify you when you're working offline</li>
                        <li>You'll see sync status indicators when changes are pending synchronization</li>
                    </ul>
                </div>
                
                <h2>Best Practices for Offline Use</h2>
                <ol>
                    <li><strong>Regular Exports</strong>: Use the Export feature to create backups of your data</li>
                    <li><strong>Sync Before Going Offline</strong>: If possible, ensure your data is synchronized before disconnecting</li>
                    <li><strong>Clear Cache Occasionally</strong>: Use the "Clear Cache and Reload" option in settings if you experience any issues</li>
                </ol>
                
                <div class="warning">
                    <h3><i class="fas fa-exclamation-triangle"></i> Important Warning About Browser Storage</h3>
                    <p><strong>Your data is stored in your current browser only!</strong> If you switch browsers or use a different device, your data will not be available.</p>
                    <p>To prevent data loss:</p>
                    <ul>
                        <li><strong>Regularly export backups</strong> to your local drive using the Export/Backup feature</li>
                        <li><strong>Consider enabling cloud storage</strong> to sync your data across devices</li>
                        <li>Always export your data before clearing browser cache or reinstalling your browser</li>
                    </ul>
                </div>
            </div>
        `;
        contentContainer.appendChild(contentDiv);
        
        // Add content to modal
        modalContent.appendChild(contentContainer);
        
        // Add modal to DOM
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Apply dark mode if needed
        if (isDarkMode) {
            contentContainer.querySelectorAll('*').forEach(element => {
                if (element.classList) {
                    element.classList.add('dark-mode');
                }
            });
        }
    } catch (error) {
        console.error('Error showing offline features:', error);
        Core.showToast('Error showing offline features: ' + error.message, 'error');
    }
}

// Show a modal dialog with the provided HTML content
function showModal(titleOrContent, content, options = {}) {
    console.log('UI.showModal called');
    
    // Determine if this is a one-argument or two-argument call
    let title = '';
    let contentHTML = '';
    
    if (content === undefined) {
        // One argument call: just content
        contentHTML = titleOrContent;
    } else {
        // Two argument call: title and content
        title = titleOrContent;
        contentHTML = content;
    }
    
    // Default options
    const defaultOptions = {
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90%',
        closeOnBackdropClick: true
    };
    
    const modalOptions = { ...defaultOptions, ...options };
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        width: ${modalOptions.width};
        max-width: ${modalOptions.maxWidth};
        max-height: ${modalOptions.maxHeight};
        overflow-y: auto;
        position: relative;
    `;
    
    // Add title if provided
    if (title) {
        const titleElement = document.createElement('h2');
        titleElement.className = 'modal-title';
        titleElement.style.cssText = `
            margin-top: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        `;
        titleElement.textContent = title;
        modalContent.appendChild(titleElement);
    }
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'modal-content-inner';
    
    // Add the HTML content
    if (typeof contentHTML === 'string') {
        contentContainer.innerHTML = contentHTML;
    } else if (contentHTML instanceof HTMLElement) {
        contentContainer.appendChild(contentHTML);
    }
    
    modalContent.appendChild(contentContainer);
    
    // Add close functionality if enabled
    if (modalOptions.closeOnBackdropClick) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Add modal to DOM
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Return the modal element in case the caller needs it
    return modal;
}

// Close the currently open modal
function closeModal() {
    console.log('UI.closeModal called');
    const modal = document.querySelector('.modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Export UI functions
window.UI = {
    switchTab,
    toggleDarkMode,
    initializeDarkMode,
    toggleAdvancedSearch,
    toggleLocationAdvancedSearch,
    updatePaginationControls,
    showLoading,
    updateDatabaseIndicator,
    forceUpdateDatabaseIndicator,
    toggleToastNotifications,
    initializeToastNotifications,
    showOfflineFeatures,
    isDarkMode,
    currentSort,
    currentLocationSort,
    showModal,
    closeModal
};