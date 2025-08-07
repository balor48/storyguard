/**
 * Story Database - Main Entry Point
 * Initializes the application and loads all modules
 *
 * Version: 2.1.0
 * Author: Roo
 */

// Module loading system
const loadedModules = new Set(['Core', 'UI']);
const modulePromises = {};

// Lazy load a module
async function loadModule(moduleName) {
    // If already loaded, return immediately
    if (loadedModules.has(moduleName)) {
        return Promise.resolve(window[moduleName]);
    }
    
    // If already loading, return the existing promise
    if (modulePromises[moduleName]) {
        return modulePromises[moduleName];
    }
    
    console.log(`Lazy loading module: ${moduleName}`);
    
    // Create a new promise for this module
    modulePromises[moduleName] = new Promise((resolve, reject) => {
        // For modules that are already included via script tags
        if (window[moduleName]) {
            loadedModules.add(moduleName);
            resolve(window[moduleName]);
            return;
        }
        
        // For dynamically loaded modules (future implementation)
        // This would use import() for true dynamic loading
        // For now, we'll just resolve with the global module
        setTimeout(() => {
            if (window[moduleName]) {
                loadedModules.add(moduleName);
                resolve(window[moduleName]);
            } else {
                reject(new Error(`Module ${moduleName} not found`));
            }
        }, 10);
    });
    
    return modulePromises[moduleName];
}

// Network status monitoring
let isOnline = navigator.onLine;

// Function to update the connection status indicator in the UI
function updateConnectionIndicator() {
    const statusIndicator = document.getElementById('connectionStatus');
    const statusText = document.getElementById('connectionText');
    
    if (!statusIndicator || !statusText) return;
    
    if (navigator.onLine) {
        statusIndicator.style.backgroundColor = '#2ecc71'; // Green
        statusText.textContent = 'Online';
    } else {
        statusIndicator.style.backgroundColor = '#e74c3c'; // Red
        statusText.textContent = 'Offline';
    }
}

// Function to handle online/offline status changes
function handleNetworkStatusChange() {
    const newOnlineStatus = navigator.onLine;
    
    // Update the UI indicator
    updateConnectionIndicator();
    
    // Only show notification if status has changed
    if (newOnlineStatus !== isOnline) {
        isOnline = newOnlineStatus;
        
        if (isOnline) {
            Core.showToast('You are back online', 'success');
            
            // Attempt to sync data if we have pending changes
            if (window.CloudStorage && CloudStorage.hasPendingChanges) {
                CloudStorage.syncData()
                    .then(() => {
                        Core.showToast('Data synchronized successfully', 'success');
                    })
                    .catch(error => {
                        console.error('Sync error:', error);
                        Core.showToast('Error synchronizing data', 'error');
                    });
            }
        } else {
            Core.showToast('You are offline. Changes will be saved locally.', 'warning', 5000);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Story Database v2.1.0 initializing...');
    
    // Debug tab buttons
    console.log('Tab buttons found:', document.querySelectorAll('.tab-button').length);
    document.querySelectorAll('.tab-button').forEach((btn, index) => {
        console.log(`Button ${index + 1}:`, btn.textContent.trim(), 'Visible:', btn.offsetParent !== null);
    });
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    try {
        // Remove error log button if it exists
        const errorLogButton = document.getElementById('error-log-button');
        if (errorLogButton) {
            errorLogButton.remove();
        }
        
        // Initialize core state (already loaded)
        Core.initializeState();
        
        // Initialize UI (already loaded)
        UI.initializeDarkMode();
        UI.initializeToastNotifications();
        
        // Initialize database indicator with stored name or default
        const storedDatabaseName = localStorage.getItem('currentDatabaseName');
        UI.updateDatabaseIndicator(storedDatabaseName || 'Default');
        
        // Force update the database indicator after a short delay to ensure it's displayed correctly
        setTimeout(() => {
            UI.forceUpdateDatabaseIndicator();
        }, 1000);
        
        // Set up network status monitoring
        window.addEventListener('online', handleNetworkStatusChange);
        window.addEventListener('offline', handleNetworkStatusChange);
        
        // Initial network status check and UI update
        handleNetworkStatusChange();
        updateConnectionIndicator();
        
        // Initialize essential modules first
        await loadModule('Storage');
        
        // Check if cloud storage setup is available
        if (typeof Storage.setupCloudStorage === 'function') {
            try {
                await Storage.setupCloudStorage();
                console.log('Cloud storage setup complete');
            } catch (error) {
                console.error('Cloud storage setup failed, continuing without cloud features:', error);
                // Non-critical error, continue with application initialization
            }
        } else {
            console.log('Cloud storage is not available in this version');
        }
        
        // Initialize keyboard shortcuts
        await loadModule('Shortcuts');
        Shortcuts.initializeShortcuts();
        
        // Load Tags module early to ensure it's available for all tabs
        console.log("Loading Tags module early");
        await loadModule('Tags');
        
        // Initialize the active tab to determine which modules to load next
        initializeActiveTab();
        
        // Load modules based on the active tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const tabId = activeTab.id;
            console.log(`Active tab: ${tabId}`);
            
            // Load modules needed for the current tab
            if (tabId === 'characters-tab') {
                await Promise.all([
                    loadModule('Characters')
                ]);
                Characters.initializeDropdowns();
                Characters.initializeCustomFields();
                Characters.initializeImageUpload();
                Characters.initializeRichTextEditor();
                Characters.setupAutosave();
                console.log("Initializing Tags for characters tab");
                Tags.initializeTags();
            } else if (tabId === 'locations-tab') {
                await Promise.all([
                    loadModule('Locations')
                ]);
                Locations.initializeLocationForm();
                console.log("Initializing Tags for locations tab");
                Tags.initializeTags();
            } else if (tabId === 'plots-tab') {
                await Promise.all([
                    loadModule('Plots')
                ]);
                Plots.initializePlots();
                Plots.initializePlotForm();
                console.log("Initializing Tags for plots tab");
                Tags.initializeTags();
            } else if (tabId === 'worldbuilding-tab') {
                await Promise.all([
                    loadModule('WorldBuilding')
                ]);
                WorldBuilding.initializeWorldBuilding();
                WorldBuilding.initializeWorldElementForm();
                console.log("Initializing Tags for worldbuilding tab");
                Tags.initializeTags();
            } else if (tabId === 'relationships-tab') {
                await Promise.all([
                    loadModule('Relationships'),
                    loadModule('Characters')
                ]);
                // Initialize tags for relationships tab as well
                console.log("Initializing Tags for relationships tab");
                Tags.initializeTags();
            } else if (tabId === 'timeline-tab') {
                await loadModule('Timeline');
                // Initialize tags for timeline tab as well
                console.log("Initializing Tags for timeline tab");
                Tags.initializeTags();
            } else if (tabId === 'statistics-tab') {
                await loadModule('Statistics');
                // Initialize tags for statistics tab as well
                console.log("Initializing Tags for statistics tab");
                Tags.initializeTags();
            } else if (tabId === 'dashboard-tab') {
                await loadModule('Dashboard');
                Dashboard.initializeDashboard();
                // Initialize tags for dashboard tab as well
                console.log("Initializing Tags for dashboard tab");
                Tags.initializeTags();
            }
            
            // Force re-initialization of tags after a delay
            setTimeout(() => {
                console.log("Force re-initializing Tags module");
                Tags.initializeTags();
            }, 1500);
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up IPC event listeners for Electron menu integration
        if (window.api) {
            // Listen for the show-settings event from the Electron menu
            window.api.onShowSettings(() => {
                console.log('Show settings dialog requested from Electron menu');
                if (window.Storage && window.Storage.showSettingsDialog) {
                    window.Storage.showSettingsDialog();
                } else {
                    console.error('Storage.showSettingsDialog function not available');
                }
            });
            
            // Listen for save database requests from the Electron menu
            window.api.onSaveDatabaseRequest(() => {
                console.log('Save database requested from Electron menu');
                if (window.Storage && window.Storage.saveDatabase) {
                    window.Storage.saveDatabase();
                } else {
                    console.error('Storage.saveDatabase function not available');
                }
            });
        }
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        console.log('Story Database initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        Core.showToast('Error initializing application: ' + error.message, 'error');
    }
});

// Initialize forms - now handled by lazy loading
async function initializeForms() {
    // This function is kept for backward compatibility
    // but the initialization is now handled in the main DOMContentLoaded event
    // based on which tab is active
    
    // If needed, we can still initialize forms for specific tabs
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    const tabId = activeTab.id;
    
    try {
        // Initialize form based on active tab
        if (tabId === 'characters-tab' && document.getElementById('characterForm')) {
            await loadModule('Characters');
            Characters.initializeDropdowns();
            Characters.initializeCustomFields();
            Characters.initializeImageUpload();
            Characters.initializeRichTextEditor();
            Characters.setupAutosave();
        } else if (tabId === 'locations-tab' && document.getElementById('locationForm')) {
            await loadModule('Locations');
            Locations.initializeLocationForm();
        } else if (tabId === 'plots-tab' && document.getElementById('plotForm')) {
            await loadModule('Plots');
            Plots.initializePlotForm();
        } else if (tabId === 'worldbuilding-tab' && document.getElementById('worldElementForm')) {
            await loadModule('WorldBuilding');
            WorldBuilding.initializeWorldElementForm();
        }
    } catch (error) {
        console.error('Error initializing forms:', error);
        Core.showToast('Error initializing forms: ' + error.message, 'error');
    }
}

// Flag to track if character tab event listeners have been set up
let characterTabEventListenersSetup = false;

// Set up event listeners with lazy loading support
async function setupEventListeners() {
    try {
        // Set up tab switching to load modules on demand
        document.querySelectorAll('.tab-button').forEach(button => {
            const originalOnClick = button.getAttribute('onclick');
            if (originalOnClick && originalOnClick.includes('UI.switchTab')) {
                // Extract tab name from onclick attribute
                const tabName = originalOnClick.match(/UI\.switchTab\('([^']+)'\)/)?.[1];
                if (tabName) {
                    // Replace onclick with our lazy loading version
                    button.removeAttribute('onclick');
                    button.addEventListener('click', async () => {
                        // Show loading indicator
                        const loadingIndicator = document.getElementById('loadingIndicator');
                        if (loadingIndicator) loadingIndicator.style.display = 'block';
                        
                        try {
                            // Switch tab first for better UX
                            UI.switchTab(tabName);
                            
                            // Make sure Tags module is loaded for all tabs
                            await loadModule('Tags');
                            
                            // Load modules based on tab
                            if (tabName === 'characters') {
                                await Promise.all([
                                    loadModule('Characters')
                                ]);
                            } else if (tabName === 'locations') {
                                await Promise.all([
                                    loadModule('Locations')
                                ]);
                            } else if (tabName === 'plots') {
                                await Promise.all([
                                    loadModule('Plots')
                                ]);
                            } else if (tabName === 'worldbuilding') {
                                await Promise.all([
                                    loadModule('WorldBuilding')
                                ]);
                            } else if (tabName === 'relationships') {
                                await Promise.all([
                                    loadModule('Relationships'),
                                    loadModule('Characters')
                                ]);
                            } else if (tabName === 'timeline') {
                                await loadModule('Timeline');
                            } else if (tabName === 'statistics') {
                                await loadModule('Statistics');
                            } else if (tabName === 'dashboard') {
                                await loadModule('Dashboard');
                            }
                            
                            // Initialize the tab's content
                            await initializeForms();
                            
                            // Set up search and filter handlers for the active tab
                            setupTabSpecificEventListeners();
                            
                            // Initialize tags for the current tab
                            console.log(`Initializing Tags for ${tabName} tab after switching`);
                            Tags.initializeTags();
                            
                            // Force re-initialization of tags after a delay
                            setTimeout(() => {
                                console.log(`Force re-initializing Tags for ${tabName} tab`);
                                Tags.initializeTags();
                            }, 1000);
                        } catch (error) {
                            console.error(`Error loading modules for ${tabName} tab:`, error);
                            Core.showToast(`Error loading ${tabName} tab: ${error.message}`, 'error');
                        } finally {
                            // Hide loading indicator
                            if (loadingIndicator) loadingIndicator.style.display = 'none';
                        }
                    });
                }
            }
        });
        
        // Set up tab-specific event listeners
        setupTabSpecificEventListeners();
        
        // Warn user before leaving page with unsaved changes
        window.addEventListener('beforeunload', function(e) {
            if (loadedModules.has('Characters') && Characters.unsavedChanges) {
                const message = 'You have unsaved changes. Are you sure you want to leave?';
                e.returnValue = message;
                return message;
            }
        });
    } catch (error) {
        console.error('Error setting up event listeners:', error);
        Core.showToast('Error setting up event listeners: ' + error.message, 'error');
    }
}

// Set up event listeners specific to the active tab
async function setupTabSpecificEventListeners() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    const tabId = activeTab.id;
    
    // Load validation module for all tabs
    await loadModule('Validation');
    
    // Search inputs
    if (tabId === 'characters-tab') {
        await loadModule('Characters');

        // Load pagination settings from localStorage or use defaults
        console.log("Loading pagination settings from localStorage");

        // Call the load function to properly initialize pagination settings
        Characters.loadPaginationSettings();

        console.log("Pagination settings loaded:", {
            charactersPerPage: Characters.charactersPerPage,
            currentCharacterPage: Characters.currentCharacterPage
        });

        // Check if event listeners have already been set up for the character tab
        if (!characterTabEventListenersSetup) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                // Remove existing listeners to prevent duplicates
                const newSearchInput = searchInput.cloneNode(true);
                searchInput.parentNode.replaceChild(newSearchInput, searchInput);
                newSearchInput.addEventListener('input', Core.debounce(Characters.displayCharacters, 300));
            }
            
            // Add event listener to search button
            const searchButton = document.querySelector('.search-button');
            if (searchButton) {
                const newSearchButton = searchButton.cloneNode(true);
                searchButton.parentNode.replaceChild(newSearchButton, searchButton);
                newSearchButton.addEventListener('click', function() {
                    // Trigger search immediately without debounce
                    Characters.displayCharacters();
                });
            }

            // Advanced search filters
            ['filterSeries', 'filterBook', 'filterRole', 'filterRace'].forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    const newSelect = select.cloneNode(true);
                    select.parentNode.replaceChild(newSelect, select);
                    newSelect.addEventListener('change', Characters.displayCharacters);
                }
            });

            // Form submission
            const form = document.getElementById('characterForm');
            if (form) {
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.addEventListener('submit', function(event) {
                    // Validate form before submission
                    const formData = {
                        firstName: document.getElementById('firstName').value,
                        lastName: document.getElementById('lastName').value,
                        email: document.getElementById('email')?.value || '',
                        notes: document.getElementById('notes').value
                    };
                    
                    const validationResult = Validation.validateForm(formData, 'character');
                    if (!validationResult.isValid) {
                        event.preventDefault();
                        validationResult.displayErrors(newForm);
                        return false;
                    }
                    
                    // If valid, proceed with normal submission
                    return Characters.handleFormSubmit.call(this, event);
                });
                
                // Set up live validation
                Validation.setupLiveValidation(newForm, 'character');
            }

            // Set the flag to indicate that event listeners have been set up
            characterTabEventListenersSetup = true;
        }

        // Remove any existing pagination container to force a clean rebuild
        const paginationContainer = document.getElementById('characterPagination');
        if (paginationContainer) {
            paginationContainer.remove();
        }
    } else if (tabId === 'locations-tab') {
        await loadModule('Locations');
        const searchInput = document.getElementById('locationSearchInput');
        if (searchInput) {
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            newSearchInput.addEventListener('input', Core.debounce(Locations.displayLocations, 300));
        }
        
        // Add event listener to location search button
        const searchButton = document.querySelector('#locations-tab .search-button');
        if (searchButton) {
            const newSearchButton = searchButton.cloneNode(true);
            searchButton.parentNode.replaceChild(newSearchButton, searchButton);
            newSearchButton.addEventListener('click', function() {
                // Trigger search immediately without debounce
                Locations.displayLocations();
            });
        }
        
        // Advanced search filters
        ['filterLocationSeries', 'filterLocationType'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const newSelect = select.cloneNode(true);
                select.parentNode.replaceChild(newSelect, select);
                newSelect.addEventListener('change', Locations.displayLocations);
            }
        });
        
        // Form submission
        const form = document.getElementById('locationForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', function(event) {
                // Validate form before submission
                const formData = {
                    locationName: document.getElementById('locationName').value,
                    locationDescription: document.getElementById('locationDescription').value
                };
                
                const validationResult = Validation.validateForm(formData, 'location');
                if (!validationResult.isValid) {
                    event.preventDefault();
                    validationResult.displayErrors(newForm);
                    return false;
                }
                
                // If valid, proceed with normal submission
                return Locations.handleLocationFormSubmit.call(this, event);
            });
            
            // Set up live validation
            Validation.setupLiveValidation(newForm, 'location');
        }
    } else if (tabId === 'plots-tab') {
        await loadModule('Plots');
        const searchInput = document.getElementById('plotSearchInput');
        if (searchInput) {
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            newSearchInput.addEventListener('input', Core.debounce(Plots.displayPlots, 300));
        }
        
        // Add event listener to plot search button
        const searchButton = document.querySelector('#plots-tab .search-button');
        if (searchButton) {
            const newSearchButton = searchButton.cloneNode(true);
            searchButton.parentNode.replaceChild(newSearchButton, searchButton);
            newSearchButton.addEventListener('click', function() {
                // Trigger search immediately without debounce
                Plots.displayPlots();
            });
        }
        
        // Advanced search filters
        ['filterPlotSeries', 'filterPlotBook', 'filterPlotType', 'filterPlotStatus'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const newSelect = select.cloneNode(true);
                select.parentNode.replaceChild(newSelect, select);
                newSelect.addEventListener('change', Plots.displayPlots);
            }
        });
        
        // Form submission
        const form = document.getElementById('plotForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', function(event) {
                // Validate form before submission
                const formData = {
                    plotTitle: document.getElementById('plotTitle').value,
                    plotDescription: document.getElementById('plotDescription').value
                };
                
                const validationResult = Validation.validateForm(formData, 'plot');
                if (!validationResult.isValid) {
                    event.preventDefault();
                    validationResult.displayErrors(newForm);
                    return false;
                }
                
                // If valid, proceed with normal submission
                return Plots.handlePlotFormSubmit.call(this, event);
            });
            
            // Set up live validation
            Validation.setupLiveValidation(newForm, 'plot');
        }
    } else if (tabId === 'worldbuilding-tab') {
        await loadModule('WorldBuilding');
        const searchInput = document.getElementById('worldSearchInput');
        if (searchInput) {
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            newSearchInput.addEventListener('input', Core.debounce(WorldBuilding.displayWorldBuilding, 300));
        }
        
        // Add event listener to worldbuilding search button
        const searchButton = document.querySelector('#worldbuilding-tab .search-button');
        if (searchButton) {
            const newSearchButton = searchButton.cloneNode(true);
            searchButton.parentNode.replaceChild(newSearchButton, searchButton);
            newSearchButton.addEventListener('click', function() {
                // Trigger search immediately without debounce
                WorldBuilding.displayWorldBuilding();
            });
        }
        
        // Advanced search filters
        ['filterWorldSeries', 'filterWorldCategory'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const newSelect = select.cloneNode(true);
                select.parentNode.replaceChild(newSelect, select);
                newSelect.addEventListener('change', WorldBuilding.displayWorldBuilding);
            }
        });
        
        // Form submission
        const form = document.getElementById('worldElementForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', function(event) {
                // Validate form before submission
                const formData = {
                    elementName: document.getElementById('elementName').value,
                    elementDescription: document.getElementById('elementDescription').value
                };
                
                const validationResult = Validation.validateForm(formData, 'worldElement');
                if (!validationResult.isValid) {
                    event.preventDefault();
                    validationResult.displayErrors(newForm);
                    return false;
                }
                
                // If valid, proceed with normal submission
                return WorldBuilding.handleWorldElementFormSubmit.call(this, event);
            });
            
            // Set up live validation
            Validation.setupLiveValidation(newForm, 'worldElement');
        }
    }
}

// Initialize the active tab
async function initializeActiveTab() {
    try {
        // Get the active tab button
        const activeTabButton = document.querySelector('.tab-button.active');
        
        // If no active tab, default to dashboard
        if (!activeTabButton) {
            console.log('No active tab found, defaulting to dashboard');
            // Always default to dashboard tab when refreshing
            UI.switchTab('dashboard');
        } else {
            // Get the tab name from the button
            let tabName;
            if (activeTabButton.hasAttribute('data-tab')) {
                tabName = activeTabButton.getAttribute('data-tab');
            } else {
                // Try to extract from onclick attribute
                const onclickAttr = activeTabButton.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes('UI.switchTab')) {
                    tabName = onclickAttr.match(/UI\.switchTab\('([^']+)'\)/)?.[1];
                }
                
                // Fallback to text content
                if (!tabName) {
                    tabName = activeTabButton.textContent.toLowerCase().replace(/\s+/g, '');
                }
                
                if (tabName) {
                    UI.switchTab(tabName);
                }
            }
        }
    } catch (error) {
        console.error('Error initializing active tab:', error);
        Core.showToast('Error initializing active tab: ' + error.message, 'error');
    }
}

// Export global functions
window.initializeForms = initializeForms;
window.setupEventListeners = setupEventListeners;
window.initializeActiveTab = initializeActiveTab;

function activateTab(tabId) {
    // First deactivate all tabs
    tabItems.forEach(tab => tab.classList.remove('active'));
    
    // Hide all content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
        pane.classList.remove('show');
    });
    
    // Activate the selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
        
        // Show the corresponding content
        const contentId = tabId.replace('Tab', 'Content');
        const contentPane = document.getElementById(contentId);
        if (contentPane) {
            contentPane.classList.add('active');
            contentPane.classList.add('show');
            
            // Initialize module if not already initialized
            if (tabId === 'dashboardTab') {
                Dashboard.initialize();
            } else if (tabId === 'charactersTab') {
                Characters.initialize();
                
                // Delay image upload initialization slightly to ensure DOM is ready
                setTimeout(() => {
                    if (typeof Characters.initializeImageUpload === 'function') {
                        Characters.initializeImageUpload();
                        console.log('Characters image upload initialized after tab activation');
                    }
                    if (typeof Characters.initializeRichTextEditor === 'function') {
                        Characters.initializeRichTextEditor();
                    }
                }, 100);
            } else if (tabId === 'locationsTab') {
                Locations.initialize();
                
                // Delay image upload initialization slightly to ensure DOM is ready
                setTimeout(() => {
                    if (typeof Locations.initializeLocationImageUpload === 'function') {
                        Locations.initializeLocationImageUpload();
                        console.log('Locations image upload initialized after tab activation');
                    }
                    if (typeof Locations.initializeRichTextEditor === 'function') {
                        Locations.initializeRichTextEditor();
                    }
                }, 100);
            } else if (tabId === 'plotsTab') {
                Plots.initialize();
            } else if (tabId === 'worldbuildingTab') {
                Worldbuilding.initialize();
            } else if (tabId === 'relationshipsTab') {
                Relationships.initialize();
            } else if (tabId === 'timelineTab') {
                Timeline.initialize();
            } else if (tabId === 'statisticsTab') {
                Statistics.initialize();
            } else if (tabId === 'analyzeBookTab') {
                BookAnalysis.initialize();
            }
        }
    }
}
