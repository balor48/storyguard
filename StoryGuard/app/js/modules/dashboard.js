/**
 * Dashboard functionality for Story Database
 * Provides a welcome page with key statistics and quick access to frequently used features
 */

// Global flag to prevent automatic database selection dialog
window.preventAutoDbSelection = false;

// Helper function to get dynamic path for database files
function getDynamicPath(filename) {
    if (window.api && window.api.getPaths) {
        return window.api.getPaths().database + '\\\\' + filename;
    } else if (localStorage.getItem('databaseDirectory')) {
        return localStorage.getItem('databaseDirectory').replace(/\\/g, '\\\\') + '\\\\' + filename;
    } else if (typeof path !== 'undefined' && typeof app !== 'undefined') {
        return path.join(app.getPath('userData'), 'database', filename).replace(/\\/g, '\\\\');
    } else {
        // Fallback to default
        return 'database\\\\' + filename;
    }
}

// Modal state debugging functions
window.debugModals = {
  // Store initial state
  initialState: {
    managerModalRemoved: true,
    selectionModalRemoved: true,
    currentModalType: null
  },
  
  // Log current modal state with caller info
  logState: function(caller) {
    console.log('====== MODAL STATE DEBUG ======');
    console.log('Called from:', caller);
    console.log('databaseManagerModalRemoved:', window.databaseManagerModalRemoved);
    console.log('databaseSelectionModalRemoved:', window.databaseSelectionModalRemoved);
    console.log('currentModalType:', window.currentModalType);
    console.log('Visible modals in DOM:', document.querySelectorAll('.modal, .modal-selection, .modal-manager').length);
    console.log('============================');
  },
  
  // Reset all modal state to a clean state
  resetState: function(caller) {
    console.log('RESETTING MODAL STATE from:', caller);
    window.databaseManagerModalRemoved = true;
    window.databaseSelectionModalRemoved = true;
    window.currentModalType = null;
    this.logState('after resetState');
  },
  
  // Validate that state is consistent
  validateState: function() {
    const modalsInDOM = document.querySelectorAll('.modal, .modal-selection, .modal-manager');
    
    // If there are no modals in the DOM, both flags should be true
    if (modalsInDOM.length === 0 &&
        (!window.databaseManagerModalRemoved || !window.databaseSelectionModalRemoved)) {
      console.error('STATE INCONSISTENCY: No modals in DOM but flags indicate modals exist');
      // Auto-correct the state
      this.resetState('validateState - inconsistency detected');
      return false;
    }
    
    // If there are modals in DOM, at least one flag should be false
    if (modalsInDOM.length > 0 &&
        window.databaseManagerModalRemoved && window.databaseSelectionModalRemoved) {
      console.error('STATE INCONSISTENCY: Modals exist in DOM but flags indicate no modals');
      return false;
    }
    
    return true;
  },
  
  // Initialize debugging
  init: function() {
    console.log('Initializing modal debugging');
    // Store initial state
    this.initialState.managerModalRemoved = window.databaseManagerModalRemoved || true;
    this.initialState.selectionModalRemoved = window.databaseSelectionModalRemoved || true;
    this.initialState.currentModalType = window.currentModalType || null;
    this.logState('init');
  }
};

// Initialize debugging
window.debugModals.init();

// Set up a MutationObserver to detect when the selection screen is created
const selectionScreenObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
                const node = mutation.addedNodes[i];
                if (node.classList && (node.classList.contains('modal-selection') ||
                    (node.querySelector && node.querySelector('.modal-selection')))) {
                    console.log('Selection screen detected - setting up listeners');
                    
                    // Set the correct modal type for the selection screen
                    window.databaseManagerModalRemoved = true;
                    window.databaseSelectionModalRemoved = false;
                    window.currentModalType = "selection"; // This is crucial - set to "selection" not "manager"
                    console.log('Selection modal state set correctly');
                    
                    // Wait a short time for the DOM to be fully ready
                    setTimeout(function() {
                        Dashboard.setupSelectionScreenListeners();
                    }, 100);
                }
            }
        }
    });
});

// Start observing the document body for added nodes
selectionScreenObserver.observe(document.body, { childList: true, subtree: true });

// Recent activity tracking
let recentActivity = [];

// Initialize dashboard
function initializeDashboard() {
    // Load recent activity from localStorage
    recentActivity = JSON.parse(localStorage.getItem('recentActivity') || '[]');
}

// Add activity to recent activity log
function addActivity(type, description, entityId) {
    const activity = {
        id: Core.generateId(),
        type,
        description,
        entityId,
        timestamp: new Date().toISOString()
    };
    
    // Add to beginning of array
    recentActivity.unshift(activity);
    
    // Limit to 20 most recent activities
    if (recentActivity.length > 20) {
        recentActivity = recentActivity.slice(0, 20);
    }
    
    // Save to localStorage
    localStorage.setItem('recentActivity', JSON.stringify(recentActivity));
}

// Clear all recent activity
function clearRecentActivity() {
    // Show confirmation dialog before clearing
    Core.showConfirmationDialog(
        "Are you sure you want to clear all recent activity?",
        function() {
            // User confirmed, clear the activity
            recentActivity = [];
            localStorage.setItem('recentActivity', JSON.stringify(recentActivity));
            
            // Refresh the dashboard to show the changes
            displayDashboard();
            Core.showToast('Recent activity cleared successfully');
        },
        function() {
            // User canceled
            Core.showToast('Clear operation canceled');
        }
    );
}

// Display dashboard
function displayDashboard() {
    const dashboardTab = document.getElementById('dashboard-tab');
    if (!dashboardTab) return;
    
    // Clear previous content
    dashboardTab.innerHTML = '';
    
    // Create welcome section
    const welcomeSection = document.createElement('div');
    welcomeSection.className = 'dashboard-welcome';
    welcomeSection.innerHTML = `
        <h2>Welcome to Story Database</h2>
        <p>Organize your characters, locations, plots, and world-building elements in one place.</p>
    `;
    dashboardTab.appendChild(welcomeSection);
    
    // Create quick stats section
    const statsSection = document.createElement('div');
    statsSection.className = 'dashboard-stats';
    
    // Calculate stats
    const characterCount = characters.length;
    const locationCount = locations.length;
    const relationshipCount = relationships.length;
    const plotCount = plots.length;
    const worldElementCount = worldElements.length;
    
    // Create stat cards
    statsSection.innerHTML = `
        <div class="dashboard-section-header">
            <h3>Story Overview</h3>
        </div>
        <div class="dashboard-stats-grid">
            <div class="dashboard-stat-card" onclick="UI.switchTab('characters')">
                <div class="stat-icon">👤</div>
                <div class="stat-value">${characterCount}</div>
                <div class="stat-label">Characters</div>
            </div>
            <div class="dashboard-stat-card" onclick="UI.switchTab('locations')">
                <div class="stat-icon">🏙️</div>
                <div class="stat-value">${locationCount}</div>
                <div class="stat-label">Locations</div>
            </div>
            <div class="dashboard-stat-card" onclick="UI.switchTab('relationships')">
                <div class="stat-icon">🔄</div>
                <div class="stat-value">${relationshipCount}</div>
                <div class="stat-label">Relationships</div>
            </div>
            <div class="dashboard-stat-card" onclick="UI.switchTab('plots')">
                <div class="stat-icon">📝</div>
                <div class="stat-value">${plotCount}</div>
                <div class="stat-label">Plot Points</div>
            </div>
            <div class="dashboard-stat-card" onclick="UI.switchTab('worldbuilding')">
                <div class="stat-icon">🌍</div>
                <div class="stat-value">${worldElementCount}</div>
                <div class="stat-label">World Elements</div>
            </div>
            <div class="dashboard-stat-card" onclick="UI.switchTab('timeline')">
                <div class="stat-icon">⏱️</div>
                <div class="stat-value">-</div>
                <div class="stat-label">Timeline</div>
            </div>
            <div class="dashboard-stat-card" onclick="UI.switchTab('statistics')">
                <div class="stat-icon">📊</div>
                <div class="stat-value">-</div>
                <div class="stat-label">Statistics</div>
            </div>
            <div class="dashboard-stat-card" onclick="UI.switchTab('analyze-book')">
                <div class="stat-icon">📖</div>
                <div class="stat-value">-</div>
                <div class="stat-label">Analyze Book</div>
            </div>
        </div>
    `;
    dashboardTab.appendChild(statsSection);
    
    // Create additional buttons section
    const additionalButtonsSection = document.createElement('div');
    additionalButtonsSection.className = 'dashboard-additional-buttons';
    additionalButtonsSection.innerHTML = `
        <div class="dashboard-section-header">
            <h3>Additional Resources</h3>
        </div>
        <div class="dashboard-buttons-grid">
            <button class="dashboard-resource-btn" onclick="Dashboard.showReadme()">
                <span class="resource-icon">📖</span>
                <span class="resource-text">Read Me</span>
            </button>
            <button class="dashboard-resource-btn" onclick="Dashboard.openExternalLink('https://www.storyguard.ca')">
                <span class="resource-icon">🌐</span>
                <span class="resource-text">Webpage</span>
            </button>
            <button class="dashboard-resource-btn" onclick="Dashboard.openExternalLink('mailto:contact@storyguard.ca')">
                <span class="resource-icon">✉️</span>
                <span class="resource-text">Contact</span>
            </button>
        </div>
    `;
    dashboardTab.appendChild(additionalButtonsSection);
    
    // Create recent activity section
    const activitySection = document.createElement('div');
    activitySection.className = 'dashboard-activity';
    
    let activityHTML = `
        <div class="dashboard-section-header">
            <h3>Recent Activity</h3>
            <button id="clear-activity-btn" class="clear-btn" title="Clear all activity">
                <span class="clear-icon">🗑️</span>
                <span class="clear-text">Clear</span>
            </button>
        </div>
    `;
    
    if (recentActivity.length === 0) {
        activityHTML += `
            <div class="no-data">No recent activity</div>
        `;
    } else {
        activityHTML += `<ul class="activity-list">`;
        
        recentActivity.forEach(activity => {
            const date = new Date(activity.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            let icon = '📝';
            if (activity.type === 'character') icon = '👤';
            else if (activity.type === 'location') icon = '🏙️';
            else if (activity.type === 'relationship') icon = '🔄';
            else if (activity.type === 'plot') icon = '📜';
            else if (activity.type === 'worldbuilding') icon = '🌍';
            
            activityHTML += `
                <li class="activity-item">
                    <span class="activity-icon">${icon}</span>
                    <div class="activity-content">
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${formattedDate}</div>
                    </div>
                </li>
            `;
        });
        
        activityHTML += `</ul>`;
    }
    
    activitySection.innerHTML = activityHTML;
    dashboardTab.appendChild(activitySection);
    
    // Add event listener for the clear button
    const clearButton = document.getElementById('clear-activity-btn');
    if (clearButton) {
        clearButton.addEventListener('click', function(e) {
            e.preventDefault();
            Dashboard.clearRecentActivity();
        });
    }
    
    // Create series overview section if there are series
    if (seriesList.length > 0) {
        const seriesSection = document.createElement('div');
        seriesSection.className = 'dashboard-series';
        
        let seriesHTML = `
            <div class="dashboard-section-header">
                <h3>Series Overview</h3>
            </div>
            <div class="series-grid">
        `;
        
        // Count characters per series
        const seriesCounts = {};
        characters.forEach(char => {
            if (char.series) {
                seriesCounts[char.series] = (seriesCounts[char.series] || 0) + 1;
            }
        });
        
        // Create series cards
        Object.entries(seriesCounts).forEach(([series, count]) => {
            seriesHTML += `
                <div class="series-card">
                    <h4>${series}</h4>
                    <div class="series-stats">
                        <div class="series-stat">
                            <span class="series-stat-value">${count}</span>
                            <span class="series-stat-label">Characters</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        seriesHTML += `</div>`;
        seriesSection.innerHTML = seriesHTML;
        dashboardTab.appendChild(seriesSection);
    }
}

// Method to show the readme file inline like other readme files in the application
function showReadme() {
    try {
        console.log('Showing main application readme information');
        
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
            .section {
                margin-bottom: 30px;
            }
            code {
                background-color: #f5f5f5;
                padding: 2px 5px;
                border-radius: 3px;
                font-family: monospace;
            }
            .dark-mode code {
                background-color: #2d2d2d;
                color: #e6e6e6;
            }
        `;
        contentContainer.appendChild(styleElement);
        
        // Add the HTML content
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
            <div style="padding: 20px;">
                <h1 style="text-align: center; margin-bottom: 30px;">Story Database Desktop</h1>
                <p>Welcome to Story Database Desktop, your all-in-one solution for organizing and managing your creative writing projects.</p>
                
                <div class="feature">
                    <h3>Getting Started</h3>
                    <p>Story Database Desktop helps you organize characters, locations, plots, and world-building elements in a structured way.</p>
                    <p>This application stores your data locally on your computer and can be used completely offline.</p>
                </div>
                
                <div class="section">
                    <h2>Main Features</h2>
                    
                    <h3>📊 Dashboard</h3>
                    <p>The central hub showing an overview of your story elements and providing quick access to all features.</p>
                    
                    <h3>👤 Character Management</h3>
                    <p>Create detailed character profiles with customizable fields, images, and relationships.</p>
                    
                    <h3>🏙️ Location Management</h3>
                    <p>Catalog and organize all the settings and places in your story world.</p>
                    
                    <h3>📝 Plot Points</h3>
                    <p>Track story arcs, plot points, and narrative elements.</p>
                    
                    <h3>🌍 World Building</h3>
                    <p>Document your story world's elements, cultures, magic systems, technology, and more.</p>
                    
                    <h3>🔄 Relationships</h3>
                    <p>Map connections between characters and visualize their dynamics.</p>
                </div>
                
                <div class="section">
                    <h2>Data Management</h2>
                    
                    <h3>💾 Database Management</h3>
                    <p>Story Database allows you to create and manage multiple databases for different projects.</p>
                    <p>Your database files are stored in:</p>
                    <code id="dynamic-db-path">Loading path...</code>
                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            const dbPathElement = document.getElementById('dynamic-db-path');
                            if (window.api && window.api.getPaths) {
                                dbPathElement.textContent = window.api.getPaths().database;
                            } else if (localStorage.getItem('databaseDirectory')) {
                                dbPathElement.textContent = localStorage.getItem('databaseDirectory');
                            } else {
                                dbPathElement.textContent = "User's application data directory";
                            }
                        });
                    </script>
                    
                    <h3>🔄 Backup System</h3>
                    <p>The application automatically creates backups of your data when you save changes.</p>
                    <p>Backup files are stored in:</p>
                    <code id="dynamic-backup-path">Loading path...</code>
                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            const backupPathElement = document.getElementById('dynamic-backup-path');
                            if (window.api && window.api.getPaths) {
                                backupPathElement.textContent = window.api.getPaths().backup;
                            } else if (localStorage.getItem('backupDirectory')) {
                                backupPathElement.textContent = localStorage.getItem('backupDirectory');
                            } else {
                                backupPathElement.textContent = "User's application data directory/backup";
                            }
                        });
                    </script>
                    <p>These directories are created automatically if they don't exist.</p>
                </div>
                
                <div class="section">
                    <h2>Export Options</h2>
                    <p>Export your story elements in various formats:</p>
                    <ul>
                        <li><strong>PDF Export:</strong> Generate detailed PDF reports of characters, locations, etc.</li>
                        <li><strong>JSON Export:</strong> Export data for backup or transfer purposes.</li>
                        <li><strong>Text Export:</strong> Generate plain text summaries of your story elements.</li>
                    </ul>
                </div>
                
                <div class="warning">
                    <h3>Important Notes</h3>
                    <ul>
                        <li>Always make regular backups of your data</li>
                        <li>Changes are saved automatically when you switch tabs or exit the application</li>
                        <li>For large projects, consider splitting your data into multiple databases</li>
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
        if (document.body.classList.contains('dark-mode') ||
            document.documentElement.getAttribute('data-theme') === 'dark') {
            contentContainer.querySelectorAll('*').forEach(element => {
                if (element.classList) {
                    element.classList.add('dark-mode');
                }
            });
        }
    } catch (error) {
        console.error('Error showing readme:', error);
        // Fallback to the original method if there's an error
        window.open('readme/readme.html', '_blank');
    }
}

// Open external links using Electron's shell if available
function openExternalLink(url) {
    // Check if it's a local file path (doesn't start with http:, https:, or mailto:)
    const isLocalFile = !url.startsWith('http:') && !url.startsWith('https:') && !url.startsWith('mailto:');
    
    // Check if we're in Electron (desktop app)
    if (window.api) {
        if (isLocalFile) {
            // For local files, use a different approach
            if (window.api.openLocalFile) {
                // If we have a dedicated method for local files
                window.api.openLocalFile(url);
            } else {
                // Otherwise, try to construct a file:// URL
                const baseUrl = window.location.href.split('/').slice(0, -1).join('/');
                const absoluteUrl = new URL(url, baseUrl).href;
                window.api.openExternal(absoluteUrl);
            }
        } else {
            // For external URLs, use shell.openExternal
            window.api.openExternal(url);
        }
    } else {
        // Fallback for browser environment
        window.open(url, '_blank');
    }
}

// Close the modal
function closeModal() {
    console.debug('DEBUG: closeModal called');
    
    // Make sure both flags get reset no matter which modal is being closed
    window.databaseManagerModalRemoved = true;
    window.databaseSelectionModalRemoved = true;
    window.currentModalType = null;
    
    window.debugModals.logState('closeModal - start');
    console.log('closeModal - state fully reset at start');
    
    // Get all potential modals by their various classes
    const managerModal = document.querySelector('.modal-manager');
    const selectionModal = document.querySelector('.modal-selection');
    const genericModal = document.querySelector('.modal');
    
    // Log which modals were found
    console.log('Found modals:', {
        managerModal: !!managerModal,
        selectionModal: !!selectionModal,
        genericModal: !!genericModal
    });
    
    // Track if we closed anything
    let modalClosed = false;
    
    // Close manager modal if it exists
    if (managerModal) {
        document.body.removeChild(managerModal);
        console.debug('DEBUG: Removed manager modal');
        modalClosed = true;
    }
    
    // Close selection modal if it exists
    if (selectionModal) {
        document.body.removeChild(selectionModal);
        console.debug('DEBUG: Removed selection modal');
        modalClosed = true;
    }
    
    // Close generic modal as fallback
    if (!modalClosed && genericModal) {
        document.body.removeChild(genericModal);
        console.debug('DEBUG: Removed generic modal');
        modalClosed = true;
    }
    
    if (!modalClosed) {
        console.debug('DEBUG: No modal found to close');
    }
    
    // Double-check that state flags are properly set
    // This is redundant with the reset at the beginning, but ensures state is clean
    window.databaseManagerModalRemoved = true;
    window.databaseSelectionModalRemoved = true;
    window.currentModalType = null;
    console.log('closeModal - final state check: all flags reset');
    
    // Validate state at the end
    window.debugModals.logState('closeModal - end');
    window.debugModals.validateState();
}

// Load databases from the database folder
function loadDatabasesFromFolder() {
    console.debug('DEBUG: loadDatabasesFromFolder called');
    
    // Check if we're in Electron (desktop app)
    if (window.api && window.api.readDatabaseFolder) {
        console.debug('DEBUG: Using Electron API to read database folder');
        try {
            // Show loading indicator
            Core.showToast('Loading databases...', 'info');
            
            // Do not reset the modal removal flag - this was causing the database selection
            // to reappear when the manager button was clicked
            
            // Set up event listener for the response
            window.api.onDatabaseFolderContents((databases) => {
                console.debug('DEBUG: Received database list:', databases);
                
                // Check if the modal has been removed
                if (window.databaseManagerModalRemoved) {
                    console.debug('DEBUG: Database manager modal was removed, skipping update');
                    return;
                }
                
                // Double-check if the modal still exists in the DOM
                const modalElement = document.querySelector('.modal');
                if (!modalElement) {
                    console.debug('DEBUG: Modal element not found in DOM, marking as removed');
                    window.databaseManagerModalRemoved = true;
                    window.databaseSelectionModalRemoved = true;
                    return;
                }
                
                // Get the database list element
                const databaseList = document.getElementById('databaseList');
                if (!databaseList) {
                    console.debug('DEBUG: Database list element not found, modal may have been removed');
                    // Set the flags to indicate all modals are removed
                    window.databaseManagerModalRemoved = true;
                    window.databaseSelectionModalRemoved = true;
                    return;
                }
                
                // Get the current database name
                const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
                console.debug('DEBUG: Current database name:', currentDbName);
                
                // Clear all existing rows except the first one (current database)
                while (databaseList.children.length > 0) {
                    databaseList.removeChild(databaseList.lastChild);
                }
                
                // Create the current database row with green text
                const currentRow = document.createElement('tr');
                currentRow.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 45%;">${currentDbName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 20%;">Current</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                        <button disabled style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: not-allowed; opacity: 0.5;">Switch</button>
                    </td>
                `;
                databaseList.appendChild(currentRow);
                
                // Filter out databases that don't exist (check if they have a valid path and exists property)
                const validDatabases = databases.filter(db => db.exists === true);
                console.debug('DEBUG: Filtered valid databases:', validDatabases);
                
                // Add each database to the list
                validDatabases.forEach(db => {
                    // Skip the current database as it's already in the list
                    if (db.name === currentDbName) {
                        console.debug('DEBUG: Skipping current database:', db.name);
                        return;
                    }
                    
                    console.debug('DEBUG: Adding database to list:', db.name);
                    
                    // Determine if database is local or web-based
                    const location = db.path && (db.path.includes('http://') || db.path.includes('https://')) ? 'Web' : 'Available';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 45%;">${db.name}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 20%;">${location}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                            <div style="display: flex; gap: 5px; justify-content: center;">
                                <button class="switch-btn" onclick="Dashboard.switchToDatabase('${db.name}', '${db.path}')" style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Switch</button>
                                <button class="delete-btn" data-db-name="${db.name}" data-db-path="${db.path}" style="background-color: #f44336; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Delete</button>
                            </div>
                        </td>
                    `;
                    databaseList.appendChild(row);
                });
                
                // Hide loading indicator
                Core.showToast('Databases loaded successfully', 'success');
            });
            
            // Get settings for database directory
            const settings = Storage.getSettings ? Storage.getSettings() : { databaseDirectory: window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database') };
            const databasePath = settings.databaseDirectory;
            console.debug('DEBUG: Reading database folder:', databasePath);
            
            // Use the Electron API to read the database folder
            window.api.readDatabaseFolder(databasePath);
        } catch (error) {
            console.error('DEBUG: Error loading databases from folder:', error);
            Core.showToast('Error loading databases from folder: ' + error.message, 'error');
        }
    } else {
        // Fallback for browser mode or if API is not available
        console.debug('DEBUG: Database folder API not available, using sample data');
        
        const databaseList = document.getElementById('databaseList');
        if (databaseList) {
            // Get the current database name
            const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
            
            // Clear all existing rows except the first one (current database)
            while (databaseList.children.length > 0) {
                databaseList.removeChild(databaseList.lastChild);
            }
            
            // Create the current database row with green text
            const currentRow = document.createElement('tr');
            currentRow.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 45%;">${currentDbName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 20%;">Current</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                    <button disabled style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: not-allowed; opacity: 0.5;">Switch</button>
                </td>
            `;
            databaseList.appendChild(currentRow);
            
            // Add sample databases
            const sampleDatabases = [
                { name: 'sample-database', path: getDynamicPath('sample-database.json') }
            ];
            
            console.debug('DEBUG: Adding sample databases to list');
            
            // Add each database to the list
            sampleDatabases.forEach(db => {
                // Skip the current database as it's already in the list
                if (db.name === currentDbName) return;
                
                console.debug('DEBUG: Adding database to list:', db.name);
                
                // Determine if database is local or web-based
                const location = db.path && (db.path.includes('http://') || db.path.includes('https://')) ? 'Web' : 'Available';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 45%;">${db.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 20%;">${location}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button class="switch-btn" onclick="Dashboard.switchToDatabase('${db.name}', '${db.path}')" style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Switch</button>
                            <button class="delete-btn" data-db-name="${db.name}" data-db-path="${db.path}" style="background-color: #f44336; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Delete</button>
                        </div>
                    </td>
                `;
                databaseList.appendChild(row);
            });
        }
    }
}

// Rename database
function renameDatabase(oldName) {
    // Prompt for new name
    const newName = prompt(`Enter new name for database "${oldName}":`, oldName);
    
    // Check if user cancelled or entered an empty name
    if (!newName || newName.trim() === '') return;
    
    // Update the database name in localStorage
    localStorage.setItem('currentDatabaseName', newName);
    
    // Update the UI
    const currentDbDisplay = document.getElementById('currentDbDisplay');
    if (currentDbDisplay) {
        currentDbDisplay.textContent = newName;
    }
    
    // Update the database indicator in the header
    const databaseIndicator = document.getElementById('currentDatabaseName');
    if (databaseIndicator) {
        databaseIndicator.textContent = newName;
    }
    
    Core.showToast(`Database renamed to "${newName}"`, 'success');
}

// Create new database
function createNewDatabase() {
    // Get the new database name
    const newDatabaseNameInput = document.getElementById('newDatabaseName');
    if (!newDatabaseNameInput) return;
    
    const newName = newDatabaseNameInput.value.trim();
    if (newName === '') {
        Core.showToast('Please enter a database name', 'error');
        return;
    }
    
    // Show confirmation dialog before clearing the database
    Core.showConfirmationDialog(
        `Create new database "${newName}"? Any unsaved changes to the current database will be lost.`,
        () => {
            // User confirmed, proceed with creating new database
            console.log('DEBUG: Performing hard reset of all data for new database creation');
            
            // Hard reset: Clear all localStorage data except essential settings
            const essentialSettings = {
                darkMode: localStorage.getItem('darkMode'),
                fontSize: localStorage.getItem('fontSize'),
                theme: localStorage.getItem('theme')
            };
            
            // Store the new database name
            const newDatabaseName = newName;
            
            // Clear localStorage completely
            localStorage.clear();
            
            // Restore essential settings
            if (essentialSettings.darkMode) localStorage.setItem('darkMode', essentialSettings.darkMode);
            if (essentialSettings.fontSize) localStorage.setItem('fontSize', essentialSettings.fontSize);
            if (essentialSettings.theme) localStorage.setItem('theme', essentialSettings.theme);
            
            // Set the new database name
            localStorage.setItem('currentDatabaseName', newDatabaseName);
            
            // Create a new empty database with explicit empty arrays
            characters = [];
            titles = [];
            seriesList = [];
            books = [];
            roles = [];
            customFieldTypes = [];
            relationships = [];
            tags = [];
            plots = [];
            worldElements = [];
            
            // Save the new empty database
            const savedSuccessfully =
                Core.safelyStoreItem('characters', JSON.stringify(characters)) &&
                Core.safelyStoreItem('titles', JSON.stringify(titles)) &&
                Core.safelyStoreItem('series', JSON.stringify(seriesList)) &&
                Core.safelyStoreItem('books', JSON.stringify(books)) &&
                Core.safelyStoreItem('roles', JSON.stringify(roles)) &&
                Core.safelyStoreItem('customFieldTypes', JSON.stringify(customFieldTypes)) &&
                Core.safelyStoreItem('relationships', JSON.stringify(relationships)) &&
                Core.safelyStoreItem('tags', JSON.stringify(tags)) &&
                Core.safelyStoreItem('plots', JSON.stringify(plots)) &&
                Core.safelyStoreItem('worldElements', JSON.stringify(worldElements));
            
            if (!savedSuccessfully) {
                Core.showToast('Failed to create new database', 'error');
                return;
            }
            
            // FORCE SAVE to the correct directory - special handling for new database creation
            if (window.Storage) {
                console.log('Saving new database to file using configured database directory');
                
                // IMPORTANT: Use a direct approach to ensure it saves in the right place
                try {
                    // Get settings for database directory
                    let settings;
                    try {
                        settings = localStorage.getItem('settings') ? 
                            JSON.parse(localStorage.getItem('settings')) : {};
                    } catch (error) {
                        console.error('Error parsing settings:', error);
                        settings = {};
                    }
                    
                    // Get the directory path from settings
                    let databaseDir;
                    if (settings.databaseDirectory) {
                        databaseDir = settings.databaseDirectory;
                        console.log('Using database directory from settings:', databaseDir);
                    } else if (window.api && window.api.getPaths) {
                        // Try to get path from API
                        try {
                            databaseDir = window.api.getPaths().database;
                            console.log('Using database directory from API:', databaseDir);
                        } catch (error) {
                            console.error('Error getting paths from API:', error);
                        }
                    }
                    
                    // Ensure we have a directory
                    if (!databaseDir) {
                        // Use default directory
                        databaseDir = 'database';
                        console.log('Using default database directory:', databaseDir);
                    }
                    
                    // Make sure directory exists
                    if (window.api && window.api.ensureDirectoryExists) {
                        window.api.ensureDirectoryExists(databaseDir, (success) => {
                            if (success) {
                                console.log(`Directory created or already exists: ${databaseDir}`);
                            } else {
                                console.error(`Failed to create directory: ${databaseDir}`);
                            }
                        });
                    }
                    
                    // Create data object with all entities
                    const data = {
                        characters: window.characters || [],
                        titles: window.titles || [],
                        seriesList: window.seriesList || [],
                        books: window.books || [],
                        roles: window.roles || [],
                        customFieldTypes: window.customFieldTypes || [],
                        relationships: window.relationships || [],
                        tags: window.tags || [],
                        plots: window.plots || [],
                        worldElements: window.worldElements || [],
                        version: '2.1.0',
                        databaseName: newDatabaseName,
                        saveDate: new Date().toISOString()
                    };
                    
                    // Create full path with database name - properly normalized for any path format
                    // First normalize the directory path - convert forward slashes to backslashes and remove any trailing slashes
                    let normalizedDir = databaseDir.replace(/\//g, '\\').replace(/\\+$/, '');
                    // Make sure there's no duplicate slashes
                    normalizedDir = normalizedDir.replace(/\\{2,}/g, '\\');
                    // Then construct the full path with the normalized dir
                    const savePath = `${normalizedDir}\\${newDatabaseName}.json`;
                    console.log('Normalized database directory:', normalizedDir);
                    const jsonData = JSON.stringify(data, null, 2);
                    
                    console.log('Saving new database directly to:', savePath);
                    
                    // Save file directly
                    if (window.api && window.api.saveFile) {
                        window.api.saveFile(savePath, jsonData, (success) => {
                            if (success) {
                                console.log('Database saved successfully at:', savePath);
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast(`Database saved successfully to ${savePath}`, 'success');
                                }
                            } else {
                                console.error('Failed to save database at:', savePath);
                                if (window.Core && window.Core.showToast) {
                                    window.Core.showToast(`Failed to save database to ${savePath}`, 'error');
                                }
                            }
                        });
                    } else {
                        // Standard saveDatabase as fallback
                        if (typeof window.Storage.saveDatabase === 'function') {
                            window.Storage.saveDatabase();
                        } else {
                            console.error('Storage.saveDatabase function not available');
                        }
                    }
                } catch (error) {
                    console.error('Error in direct database save approach:', error);
                    // Try standard saveDatabase as fallback
                    if (typeof window.Storage.saveDatabase === 'function') {
                        window.Storage.saveDatabase();
                    } else {
                        console.error('Storage.saveDatabase function not available');
                    }
                }
            } else {
                console.error('Storage object not available for database save');
            }
            
            // Update the database indicator in the header
            const databaseIndicator = document.getElementById('currentDatabaseName');
            if (databaseIndicator) {
                databaseIndicator.textContent = newDatabaseName;
            }
            
            // Show success notification
            Core.showToast(`New database "${newDatabaseName}" created successfully`, 'success');
            
            // Close the modal if it exists - with enhanced cleanup
            if (!window.databaseManagerModalRemoved) {
                const modal = document.querySelector('.modal');
                if (modal) {
                    // First, clone and replace all buttons to remove event listeners
                    const allButtons = modal.querySelectorAll('button');
                    allButtons.forEach(button => {
                        const newButton = button.cloneNode(true);
                        if (button.parentNode) {
                            button.parentNode.replaceChild(newButton, button);
                        }
                    });
                    
                    // Set the flags to indicate all modals are being removed
                    window.databaseManagerModalRemoved = true;
                    window.databaseSelectionModalRemoved = true;
                    
                    // Remove the modal
                    document.body.removeChild(modal);
                    console.debug('DEBUG: Removed database manager modal during database creation with enhanced cleanup');
                } else {
                    console.warn('DEBUG: Modal element not found during database creation');
                }
            } else {
                console.debug('DEBUG: Modal already removed, skipping removal during database creation');
            }
            
            // Double-check for any remaining modals
            setTimeout(() => {
                const remainingModals = document.querySelectorAll('.modal');
                remainingModals.forEach(remainingModal => {
                    if (document.body.contains(remainingModal)) {
                        document.body.removeChild(remainingModal);
                        console.log('Removed lingering modal in final cleanup during database creation');
                    }
                });
            }, 100);
            
            // Force a complete page reload to ensure all data and UI is reset
            console.log('DEBUG: Forcing complete page reload to ensure clean state after database creation');
            setTimeout(() => {
                window.location.href = window.location.href.split('?')[0] + 
                    '?forcereload=' + new Date().getTime();
            }, 500);
        },
        () => {
            // User cancelled, do nothing
            console.debug('DEBUG: User cancelled new database creation');
        }
    );
}

// Switch to a different database
function switchToDatabase(dbName, dbPath) {
    console.debug('DEBUG: switchToDatabase called with:', { dbName, dbPath });
    
    // Add detailed API availability logging
    console.log("API availability check:", {
        api: !!window.api,
        readDatabaseFile: window.api ? !!window.api.readDatabaseFile : false,
        onDatabaseFileContent: window.api ? !!window.api.onDatabaseFileContent : false
    });
    
    // Confirm switch - use styled dialog instead of basic browser confirm
    Core.showConfirmationDialog(
        `Switch to database "${dbName}"? Any unsaved changes to the current database will be lost.`,
        () => {
            // User confirmed the switch
            console.debug('DEBUG: User confirmed database switch');
            
            // Show loading indicator
            Core.showToast(`Loading database "${dbName}"...`, 'info');
            console.debug('DEBUG: Starting database switch process');
            
            // Load the database file
            if (window.api && window.api.readDatabaseFile) {
                console.debug('DEBUG: Using Electron API to read database file');
                try {
                    // First, check if we can remove existing event listeners
                    if (window.currentDbFileContentHandler) {
                        console.log('DEBUG: Attempting to remove existing database-file-content event listener');
                        try {
                            // Check if removeListener function exists
                            if (window.api.removeListener) {
                                window.api.removeListener('database-file-content', window[window.currentDbFileContentHandler]);
                                console.log('DEBUG: Successfully removed existing database-file-content event listener');
                            } else {
                                console.error('DEBUG: window.api.removeListener function does not exist!');
                                console.log('DEBUG: This is likely the root cause of the issue - the API does not expose a removeListener function');
                                console.log('DEBUG: Using a workaround with unique handler names instead');
                            }
                        } catch (error) {
                            console.error('DEBUG: Error removing event listener:', error);
                        }
                        
                        // Even if we can't remove the listener, we'll use a new unique name
                        console.log('DEBUG: Using a new unique handler name to avoid conflicts');
                    }
                    
                    // Create a named handler function that we can reference later
                    // Use a unique name for each call to avoid conflicts with multiple listeners
                    window.dbFileContentHandlerCalled = false; // Flag to track if handler was called
                    const handlerName = 'dbFileContentHandler_' + new Date().getTime();
                    window[handlerName] = function(content) {
                        window.dbFileContentHandlerCalled = true; // Set flag when handler is called
                        console.log('DEBUG: ========== DATABASE FILE CONTENT HANDLER CALLED ==========');
                        console.log('DEBUG: Handler called at:', new Date().toISOString());
                        console.log('DEBUG: Content received:', {
                            contentExists: !!content,
                            contentLength: content ? content.length : 0,
                            contentType: content ? typeof content : 'undefined',
                            contentSample: content ? content.substring(0, 100) + '...' : 'N/A'
                        });
                        
                        // Make sure any existing modals are removed first with proper cleanup
                        const existingModals = document.querySelectorAll('.modal, .modal-selection, .modal-manager');
                        existingModals.forEach(modal => {
                            if (document.body.contains(modal)) {
                                // Clone and replace all buttons to remove event listeners
                                const allButtons = modal.querySelectorAll('button');
                                allButtons.forEach(button => {
                                    const newButton = button.cloneNode(true);
                                    if (button.parentNode) {
                                        button.parentNode.replaceChild(newButton, button);
                                    }
                                });
                                
                                // Then remove the modal
                                document.body.removeChild(modal);
                                console.log('Removed existing modal with enhanced cleanup before processing database content');
                            }
                        });
                        
                        // Ensure database modal flags are properly set
                        window.databaseManagerModalRemoved = true;
                        window.databaseSelectionModalRemoved = true;
                        
                        try {
                            // Check if we have content
                            if (!content) {
                                console.error('DEBUG: No content received from database file');
                                Core.showToast('Error: No content received from database file', 'error');
                                return;
                            }
                            
                            // Parse the database content
                            const data = JSON.parse(content);
                            console.debug('DEBUG: Successfully parsed database content');
                            
                            // Import the data
                            if (data.characters) characters = data.characters;
                            if (data.titles) titles = data.titles;
                            if (data.seriesList) seriesList = data.seriesList;
                            if (data.books) books = data.books;
                            if (data.roles) roles = data.roles;
                            if (data.customFieldTypes) customFieldTypes = data.customFieldTypes;
                            if (data.relationships) relationships = data.relationships;
                            if (data.tags) tags = data.tags;
                            if (data.plots) plots = data.plots;
                            if (data.worldElements) worldElements = data.worldElements;
                            
                            console.debug('DEBUG: Data imported from database file');
                            
                            // Save all data with error handling
                            const savedSuccessfully =
                                Core.safelyStoreItem('characters', JSON.stringify(characters)) &&
                                Core.safelyStoreItem('titles', JSON.stringify(titles)) &&
                                Core.safelyStoreItem('series', JSON.stringify(seriesList)) &&
                                Core.safelyStoreItem('books', JSON.stringify(books)) &&
                                Core.safelyStoreItem('roles', JSON.stringify(roles)) &&
                                Core.safelyStoreItem('customFieldTypes', JSON.stringify(customFieldTypes)) &&
                                Core.safelyStoreItem('relationships', JSON.stringify(relationships)) &&
                                Core.safelyStoreItem('tags', JSON.stringify(tags)) &&
                                Core.safelyStoreItem('plots', JSON.stringify(plots)) &&
                                Core.safelyStoreItem('worldElements', JSON.stringify(worldElements));
                            
                            console.debug('DEBUG: Data saved to localStorage:', savedSuccessfully);
                            
                            if (!savedSuccessfully) {
                                console.error('DEBUG: Failed to save database data');
                                Core.showToast('Failed to save database data', 'error');
                                return;
                            }
                            
                            // Update the database name in localStorage
                            localStorage.setItem('currentDatabaseName', dbName);
                            console.debug('DEBUG: Updated database name in localStorage to:', dbName);
                            
                            // Update the database indicator in the header
                            const databaseIndicator = document.getElementById('currentDatabaseName');
                            if (databaseIndicator) {
                                databaseIndicator.textContent = dbName;
                                console.debug('DEBUG: Updated database indicator in header');
                            } else {
                                console.warn('DEBUG: Database indicator element not found');
                            }
                            
                            // Close the modal if it exists - with enhanced cleanup
                            if (!window.databaseManagerModalRemoved) {
                                const modal = document.querySelector('.modal');
                                if (modal) {
                                    // First, clone and replace all buttons to remove event listeners
                                    const allButtons = modal.querySelectorAll('button');
                                    allButtons.forEach(button => {
                                        const newButton = button.cloneNode(true);
                                        if (button.parentNode) {
                                            button.parentNode.replaceChild(newButton, button);
                                        }
                                    });
                                    
                                    // Set the flags to indicate all modals are being removed
                                    window.databaseManagerModalRemoved = true;
                                    window.databaseSelectionModalRemoved = true;
                                    
                                    // Remove the modal
                                    document.body.removeChild(modal);
                                    console.debug('DEBUG: Removed database manager modal during database switch with enhanced cleanup');
                                } else {
                                    console.warn('DEBUG: Modal element not found during database switch');
                                }
                            } else {
                                console.debug('DEBUG: Modal already removed, skipping removal during database switch');
                            }
                            
                            // Double-check for any remaining modals
                            setTimeout(() => {
                                const remainingModals = document.querySelectorAll('.modal');
                                remainingModals.forEach(remainingModal => {
                                    if (document.body.contains(remainingModal)) {
                                        document.body.removeChild(remainingModal);
                                        console.log('Removed lingering modal in final cleanup during database switch');
                                    }
                                });
                            }, 100);
                            
                            // Refresh the UI
                            console.debug('DEBUG: Switching to dashboard tab');
                            UI.switchTab('dashboard');
                            
                            // Force a page reload to ensure everything is refreshed
                            console.debug('DEBUG: Scheduling forced page reload');
                            setTimeout(() => {
                                console.log('Forcing page reload to ensure clean state after database switch');
                                window.location.href = window.location.href.split('?')[0] +
                                    '?forcereload=' + new Date().getTime();
                            }, 1000);
                            
                            Core.showToast(`Switched to database "${dbName}"`, 'success');
                        } catch (error) {
                            console.error('DEBUG: Error parsing database content:', error);
                            Core.showToast('Error parsing database content: ' + error.message, 'error');
                        }
                    };
                    
                    // Register the handler with the API
                    console.log('DEBUG: Registering database file content handler');
                    try {
                        // Store the current handler name for reference
                        window.currentDbFileContentHandler = handlerName;
                        
                        // Register the handler
                        window.api.onDatabaseFileContent(window[handlerName]);
                        console.log('DEBUG: Successfully registered database file content handler:', handlerName);
                    } catch (error) {
                        console.error('DEBUG: Error registering database file content handler:', error);
                    }
                    
                    // Fix the path format to ensure proper backslashes
                    let fixedPath = dbPath;
                    if (dbPath) {
                        console.log('Original path before fixing:', dbPath);
                        
                        // More thorough path fixing
                        // First, normalize all existing backslashes
                        fixedPath = dbPath.replace(/\\/g, '\\\\');
                        console.log('After normalizing backslashes:', fixedPath);
                        
                        // Make sure drive letter is followed by backslash
                        fixedPath = fixedPath.replace(/([A-Z]:)(?!\\)/, '$1\\\\');
                        console.log('After fixing drive letter:', fixedPath);
                        
                        // Make sure there's a backslash between Desktop and database
                        fixedPath = fixedPath.replace(/(Desktop)(?!\\)database/, '$1\\\\database');
                        console.log('After fixing Desktop/database path:', fixedPath);
                        
                        // Make sure there's a backslash between database and filename
                        fixedPath = fixedPath.replace(/database(?!\\)([^\\])/, 'database\\\\$1');
                        console.log('After fixing database/filename path:', fixedPath);
                        
                        // If path doesn't have backslashes at all, add them at key points
                        if (!fixedPath.includes('\\')) {
                            fixedPath = fixedPath.replace(/([A-Z]:)([^\\])/g, '$1\\\\$2')
                                                 .replace(/([^\\])Desktop([^\\])/g, '$1\\\\Desktop\\\\$2')
                                                 .replace(/([^\\])database([^\\])/g, '$1\\\\database\\\\$2');
                            console.log('After adding missing backslashes:', fixedPath);
                        }
                        
                        console.debug('DEBUG: Original path:', dbPath);
                        console.debug('DEBUG: Final fixed path:', fixedPath);
                    } else {
                        // If no path provided, construct one with proper backslashes
                        const settings = Storage.getSettings ? Storage.getSettings() : { databaseDirectory: window.api && window.api.getPaths ? window.api.getPaths().database : path.join(app.getPath('userData'), 'database') };
                        const databaseDir = settings.databaseDirectory.replace(/\\/g, '\\\\');
                        fixedPath = `${databaseDir}\\\\${dbName}.json`;
                        console.debug('DEBUG: Constructed path:', fixedPath);
                    }
                    
                    // Use the Electron API to read the database file
                    console.log('About to call readDatabaseFile with path:', fixedPath);
                    try {
                        // Add detailed debugging of the API object
                        console.log('DEBUG: API object details:', {
                            apiExists: !!window.api,
                            readDatabaseFileExists: !!(window.api && window.api.readDatabaseFile),
                            readDatabaseFileType: window.api ? typeof window.api.readDatabaseFile : 'undefined',
                            onDatabaseFileContentExists: !!(window.api && window.api.onDatabaseFileContent),
                            onDatabaseFileContentType: window.api ? typeof window.api.onDatabaseFileContent : 'undefined'
                        });
                        
                        // Call the API function with detailed logging
                        console.log('DEBUG: Calling readDatabaseFile with path:', fixedPath);
                        window.api.readDatabaseFile(fixedPath);
                        console.log('DEBUG: readDatabaseFile called successfully - waiting for callback');
                        
                        // Add a timeout to check if the callback was called
                        setTimeout(() => {
                            console.log('DEBUG: Checking if callback was called after 2 seconds');
                            console.log('DEBUG: Current handler status:', {
                                handlerExists: !!window.dbFileContentHandler,
                                handlerCalled: window.dbFileContentHandlerCalled || false
                            });
                        }, 2000);
                    } catch (callError) {
                        console.error('DEBUG: Error calling readDatabaseFile:', callError);
                        console.error('DEBUG: Error details:', {
                            message: callError.message,
                            stack: callError.stack,
                            name: callError.name
                        });
                        Core.showToast('Error reading database file: ' + callError.message, 'error');
                    }
                } catch (error) {
                    console.error('DEBUG: Error switching to database:', error);
                    Core.showToast('Error switching to database: ' + error.message, 'error');
                }
            } else {
                // Fallback for browser mode or if API is not available
                console.log('DEBUG: Database file API not available, simulating database switch');
                
                // Update the database name in localStorage
                localStorage.setItem('currentDatabaseName', dbName);
                
                // Update the database indicator in the header
                const databaseIndicator = document.getElementById('currentDatabaseName');
                if (databaseIndicator) {
                    databaseIndicator.textContent = dbName;
                }
                
                // Close the modal if it exists - with enhanced cleanup
                if (!window.databaseManagerModalRemoved) {
                    const modal = document.querySelector('.modal');
                    if (modal) {
                        // First, clone and replace all buttons to remove event listeners
                        const allButtons = modal.querySelectorAll('button');
                        allButtons.forEach(button => {
                            const newButton = button.cloneNode(true);
                            if (button.parentNode) {
                                button.parentNode.replaceChild(newButton, button);
                            }
                        });
                        
                        // Set the flags to indicate all modals are being removed
                        window.databaseManagerModalRemoved = true;
                        window.databaseSelectionModalRemoved = true;
                        
                        // Remove the modal
                        document.body.removeChild(modal);
                        console.debug('DEBUG: Removed database manager modal during browser fallback database switch with enhanced cleanup');
                    } else {
                        console.warn('DEBUG: Modal element not found during browser fallback database switch');
                    }
                } else {
                    console.debug('DEBUG: Modal already removed, skipping removal during browser fallback database switch');
                }
                
                // Double-check for any remaining modals
                setTimeout(() => {
                    const remainingModals = document.querySelectorAll('.modal');
                    remainingModals.forEach(remainingModal => {
                        if (document.body.contains(remainingModal)) {
                            document.body.removeChild(remainingModal);
                            console.log('Removed lingering modal in final cleanup during browser fallback database switch');
                        }
                    });
                }, 100);
                
                // Refresh the UI
                UI.switchTab('dashboard');
                
                // Force a page reload to ensure everything is refreshed
                setTimeout(() => {
                    console.log('Forcing page reload to ensure clean state after database switch');
                    window.location.href = window.location.href.split('?')[0] +
                        '?forcereload=' + new Date().getTime();
                }, 1000);
                
                Core.showToast(`Switched to database "${dbName}"`, 'success');
            }
        }
    );
}

// Show application settings
function showApplicationSettings() {
    // This is now a simple wrapper around Storage.showSettingsDialog
    // We keep this function for backward compatibility
    if (window.Storage && Storage.showSettingsDialog) {
        Storage.showSettingsDialog();
    } else {
        Core.showToast('Settings functionality not available', 'error');
    }
}

// Show database manager
function showDatabaseManager() {
    console.debug('DEBUG: showDatabaseManager called');
    
    // Set flag to prevent selection dialog from appearing
    window.preventAutoDbSelection = true;
    
    // Reset all modal state flags first
    window.databaseManagerModalRemoved = true;
    window.databaseSelectionModalRemoved = true;
    window.currentModalType = null;
    
    window.debugModals.logState('showDatabaseManager - start');
    console.log('showDatabaseManager - state fully reset at start');
    
    // Clean up any existing modals
    const existingModals = document.querySelectorAll('.modal, .modal-selection, .modal-manager');
    existingModals.forEach(modal => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
            console.debug('DEBUG: Force-closed existing modal');
        }
    });
    
    // Check if the modal already exists (prevent duplicates)
    if (document.querySelector('.modal-manager')) {
        console.debug('DEBUG: Manager modal already exists, not creating another one');
        return;
    }
    
    // Then set the flag for this specific modal type
    window.databaseManagerModalRemoved = false;
    window.databaseSelectionModalRemoved = true;
    window.currentModalType = 'manager';
    console.log('showDatabaseManager - currentModalType explicitly set to "manager"');
    window.debugModals.logState('showDatabaseManager - after setting flags');
    
    // Create the database manager modal
    const modal = document.createElement('div');
    modal.className = 'modal modal-manager';
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
    
    // Get the current database name
    const currentDbName = localStorage.getItem('currentDatabaseName') || 'Default';
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-content" style="background-color: var(--background-color, #fff); color: var(--text-color, #333); padding: 20px; border-radius: 8px; width: 85%; max-width: 850px; max-height: 100vh; overflow-y: hidden; overflow-x: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.3); position: relative;">
            <button onclick="Dashboard.closeModal()" style="background-color: #f44336; color: white; border: none; border-radius: 4px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; position: absolute; top: 20px; right: 30px; z-index: 10000;">Close</button>
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                <h3 style="margin: 0; color: var(--text-color, #333); font-size: 24px;">Database Manager</h3>
            </div>
            <div class="modal-body">
                
                <div class="database-actions" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f8f9fa; position: relative;">
                    <h4 style="margin-top: 0; color: #333; padding-bottom: 8px; white-space: nowrap;">Database Actions</h4>
                    
                    <div style="display: flex; align-items: flex-end; margin-top: 10px;">
                        <button onclick="window.Storage.backupDatabase()" style="background-color: #FF9800; color: white; border: none; border-radius: 4px; padding: 8px 15px; cursor: pointer; margin-right: 50px;">Backup</button>
                        
                        <!-- Container for input field -->
                        <div style="flex-grow: 1; position: relative;">
                            <!-- Input field inline with buttons -->
                            <input type="text" id="newDatabaseName" placeholder="Enter database name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        
                        <button onclick="Dashboard.createNewDatabase()" style="background-color: #4CAF50; color: white; border: none; border-radius: 4px; padding: 8px 15px; cursor: pointer; margin-left: 10px;">Create</button>
                    </div>
                </div>
                
                <div class="database-list" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f8f9fa; width: 100%; box-sizing: border-box;">
                    <h4 style="margin-top: 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Available Databases</h4>
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; width: 45%;">Name</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; width: 20%;">Status</th>
                                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd; width: 35%;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="databaseList">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 45%;">${currentDbName}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #4CAF50; font-weight: bold; width: 20%;">Current</td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 35%;">
                                    <button disabled style="background-color: #FF9800; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: not-allowed; opacity: 0.5;">Switch</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Close button moved to top right corner -->
            </div>
        </div>
    `;
    
    // Add the modal to the DOM
    document.body.appendChild(modal);
    
    // Load databases from the database folder
    loadDatabasesFromFolder();
    
    // Log state at the end
    window.debugModals.logState('showDatabaseManager - end');
    window.debugModals.validateState();
}

// Reset modal state completely
function resetModalState(caller) {
    console.log(`${caller} - Resetting modal state completely`);
    window.databaseManagerModalRemoved = true;
    window.databaseSelectionModalRemoved = true;
    window.currentModalType = null; // This is crucial!
    console.log(`${caller} - State fully reset`);
    window.debugModals.logState(`${caller} - after reset`);
}

// Add event listeners to selection screen buttons
function setupSelectionScreenListeners() {
    console.debug('DEBUG: Setting up selection screen listeners');
    
    // For Browse for File button
    const browseButton = document.getElementById('browse-for-file-btn');
    if (browseButton) {
        browseButton.addEventListener('click', function() {
            console.log('Browse for File clicked');
            resetModalState('browse-for-file-btn');
        });
        console.debug('DEBUG: Added listener to Browse for File button');
    } else {
        console.debug('DEBUG: Browse for File button not found');
    }
    
    // For Cancel button
    const cancelButton = document.getElementById('cancel-selection-btn');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            console.log('Cancel selection clicked');
            resetModalState('cancel-selection-btn');
        });
        console.debug('DEBUG: Added listener to Cancel button');
    } else {
        console.debug('DEBUG: Cancel button not found');
    }
    
    // Add listeners to any other close buttons in the selection modal
    const closeButtons = document.querySelectorAll('.modal-selection .close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Selection modal close button clicked');
            resetModalState('selection-close-btn');
        });
        console.debug('DEBUG: Added listener to selection modal close button');
    });
    
    // Log that we've set up the listeners
    window.debugModals.logState('setupSelectionScreenListeners - complete');
}

// Handle import from manager specially
function handleImportFromManager() {
    // Close the manager modal first
    closeModal();
    
    // Wait for the modal to fully close
    setTimeout(() => {
        // Show import dialog
        if (window.Storage && typeof window.Storage.importDatabase === 'function') {
            window.Storage.importDatabase();
        } else {
            Core.showToast('Import function not available', 'error');
        }
    }, 100);
}

// Export dashboard functions
window.Dashboard = {
    initializeDashboard,
    displayDashboard,
    addActivity,
    clearRecentActivity,
    openExternalLink,
    showReadme,
    closeModal,
    loadDatabasesFromFolder,
    renameDatabase,
    createNewDatabase,
    switchToDatabase,
    showApplicationSettings,
    showDatabaseManager,
    resetModalState,
    setupSelectionScreenListeners,
    handleImportFromManager,
    confirmDeleteDatabase
};

// Confirm deletion of a database
async function confirmDeleteDatabase(dbName, dbPath) {
    // This function is now just a wrapper that directly calls the deletion code
    // The confirmation dialog is handled by database-delete-fix.js
    
    console.log('DEBUG: Deleting database:', dbName);
    console.log('DEBUG: Database path:', dbPath);

    try {
        // Get the full path to the database file
        let fullPath = '';
        
        // If dbPath is already a full path, use it directly
        if (dbPath && (dbPath.includes('/') || dbPath.includes('\\'))) {
            fullPath = dbPath;
            // Make sure it has the .json extension
            if (!fullPath.toLowerCase().endsWith('.json')) {
                fullPath += '.json';
            }
        } else {
            // Otherwise, construct the path using the database directory
            let databaseDirectory = '';
            
            // Try to get the database directory from the API first
            if (window.api && window.api.getPaths) {
                try {
                    const paths = await window.api.getPaths();
                    databaseDirectory = paths.database;
                    console.log('DEBUG: Using database directory from API:', databaseDirectory);
                } catch (error) {
                    console.error('DEBUG: Error getting paths from API:', error);
                }
            }
            
            // If API failed, try other methods
            if (!databaseDirectory) {
                if (Storage.getSettings) {
                    const settings = Storage.getSettings();
                    databaseDirectory = settings.databaseDirectory;
                    console.log('DEBUG: Using database directory from settings:', databaseDirectory);
                } else if (localStorage.getItem('databaseDirectory')) {
                    databaseDirectory = localStorage.getItem('databaseDirectory');
                    console.log('DEBUG: Using database directory from localStorage:', databaseDirectory);
                }
            }
            
            // Construct the full path
            if (databaseDirectory) {
                // Ensure the path has the correct separator
                if (!databaseDirectory.endsWith('/') && !databaseDirectory.endsWith('\\')) {
                    databaseDirectory += '/';
                }
                fullPath = `${databaseDirectory}${dbName}.json`;
            } else {
                // Fallback to just the filename if no directory is found
                fullPath = `${dbName}.json`;
            }
        }
        
        console.log('DEBUG: Full path for deletion:', fullPath);

        // Remove the database file from disk
        if (window.api && window.api.deleteDatabaseFile) {
            try {
                console.log('DEBUG: Calling window.api.deleteDatabaseFile with path:', fullPath);
                const result = await window.api.deleteDatabaseFile(fullPath);
                console.log('DEBUG: Delete result:', result);

                // If the file wasn't found, consider it successfully deleted
                if (!result.success && result.error && result.error.includes('File does not exist')) {
                    console.log('DEBUG: File not found, but this is okay - considering it deleted');
                    // Remove from UI only (file was already gone)
                    const databaseList = document.getElementById('databaseList');
                    if (databaseList) {
                        const rows = Array.from(databaseList.children);
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows[i];
                            if (row.children[0] && row.children[0].textContent === dbName) {
                                databaseList.removeChild(row);
                                break;
                            }
                        }
                    }
                    console.log('DEBUG: Removed entry from UI list');
                    Core.showToast(`Database "${dbName}" removed from list`, 'success');
                    return;
                }

                if (!result.success) {
                    console.error('DEBUG: Error deleting database file:', result.error);
                    Core.showToast('Error deleting database file: ' + result.error, 'error');
                    return;
                }

                // Remove from UI list
                const databaseList = document.getElementById('databaseList');
                if (databaseList) {
                    const rows = Array.from(databaseList.children);
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        if (row.children[0] && row.children[0].textContent === dbName) {
                            databaseList.removeChild(row);
                            break;
                        }
                    }
                }

                console.log('DEBUG: Database file deleted successfully');
                Core.showToast(`Database "${dbName}" deleted successfully`, 'success');
                
                // Refresh the database list to ensure it's up to date
                loadDatabasesFromFolder();
            } catch (apiError) {
                console.error('DEBUG: API Error during deletion:', apiError);
                Core.showToast('Error deleting database file: ' + (apiError.message || 'Unknown error'), 'error');
            }
        } else {
            console.error('DEBUG: deleteDatabaseFile API not available');
            Core.showToast('Delete functionality not available. Database removed from list but may still exist on disk.', 'warning');
            
            // Even though the API is not available, still remove from the UI
            const databaseList = document.getElementById('databaseList');
            if (databaseList) {
                const rows = Array.from(databaseList.children);
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.children[0] && row.children[0].textContent === dbName) {
                        databaseList.removeChild(row);
                        break;
                    }
                }
            }
        }
        
        // Also remove the database from localStorage
        try {
            // Get the current list of databases
            let databases = [];
            try {
                databases = JSON.parse(localStorage.getItem('databases') || '[]');
            } catch (e) {
                console.error('DEBUG: Error parsing databases from localStorage:', e);
            }
            
            // Remove the deleted database
            databases = databases.filter(db => db.name !== dbName);
            
            // Save the updated list
            localStorage.setItem('databases', JSON.stringify(databases));
            console.log('DEBUG: Removed database from localStorage');
            
            // Remove any references to this database from localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.includes(dbName)) {
                    console.log(`DEBUG: Removing related localStorage key: ${key}`);
                    localStorage.removeItem(key);
                }
            });
            
            // If this was the current database, switch to Default
            const currentDb = localStorage.getItem('currentDatabaseName');
            if (currentDb === dbName) {
                console.log(`DEBUG: Current database was deleted, switching to Default`);
                localStorage.setItem('currentDatabaseName', 'Default');
            }
        } catch (e) {
            console.error('DEBUG: Error updating localStorage:', e);
        }
    } catch (error) {
        console.error('DEBUG: General error in confirmDeleteDatabase:', error);
        Core.showToast('Error deleting database: ' + error.message, 'error');
    }
}
