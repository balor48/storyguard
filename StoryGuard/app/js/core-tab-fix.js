/**
 * Core Tab Fix
 * 
 * This script adds missing structure to tabs that are experiencing issues
 * without modifying the core application code. It follows the principle of
 * enhancing UI consistency while maintaining backward compatibility.
 */

(function() {
    // Initialize when document is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Core tab fix initializing');
        
        // Fix tabs when they're activated
        const tabLinks = document.querySelectorAll('.nav-tabs a');
        if (tabLinks.length > 0) {
            tabLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    const tabId = this.getAttribute('href');
                    if (tabId) {
                        // Small delay to let the original tab switch happen
                        setTimeout(function() {
                            fixTabContent(tabId.replace('#', ''));
                        }, 50);
                    }
                });
            });
        }
        
        // Also check the current active tab
        const activeTab = document.querySelector('.tab-content > div[style*="display: block"]');
        if (activeTab) {
            fixTabContent(activeTab.id);
        }
    });
    
    /**
     * Fix content for a specific tab
     * @param {string} tabId - The ID of the tab to fix (without #)
     */
    function fixTabContent(tabId) {
        console.log('Checking tab content for: ' + tabId);
        
        // Handle specific tabs
        switch (tabId) {
            case 'locations-tab':
                fixLocationsTab();
                break;
            case 'plots-tab':
                fixPlotsTab();
                break;
            case 'worldbuilding-tab':
                fixWorldBuildingTab();
                break;
            case 'relationships-tab':
                fixRelationshipsTab();
                break;
            case 'timeline-tab':
                fixTimelineTab();
                break;
        }
    }
    
    /**
     * Fix the locations tab content
     */
    function fixLocationsTab() {
        console.log('Fixing locations tab');
        const tab = document.getElementById('locations-tab');
        if (!tab) return;
        
        // Check for form and table
        ensureElementExists('locationForm', tab, createLocationForm);
        ensureElementExists('locationTable', tab, createLocationTable);
        
        // Try to display locations
        if (typeof Locations !== 'undefined' && typeof Locations.displayLocations === 'function') {
            try {
                Locations.displayLocations();
            } catch (err) {
                console.error('Error displaying locations:', err);
            }
        }
    }
    
    /**
     * Fix the plots tab content
     */
    function fixPlotsTab() {
        console.log('Fixing plots tab');
        const tab = document.getElementById('plots-tab');
        if (!tab) return;
        
        // Check for form and table
        ensureElementExists('plotForm', tab, createPlotForm);
        ensureElementExists('plotTable', tab, createPlotTable);
        
        // Try to display plots
        if (typeof Plots !== 'undefined' && typeof Plots.displayPlots === 'function') {
            try {
                Plots.displayPlots();
            } catch (err) {
                console.error('Error displaying plots:', err);
            }
        }
    }
    
    /**
     * Fix the worldbuilding tab content
     */
    function fixWorldBuildingTab() {
        console.log('Fixing worldbuilding tab');
        const tab = document.getElementById('worldbuilding-tab');
        if (!tab) return;
        
        // Check for form and table
        ensureElementExists('worldElementForm', tab, createWorldElementForm);
        ensureElementExists('worldElementTable', tab, createWorldElementTable);
        
        // Try to display world elements
        if (typeof WorldBuilding !== 'undefined' && typeof WorldBuilding.displayWorldElements === 'function') {
            try {
                WorldBuilding.displayWorldElements();
            } catch (err) {
                console.error('Error displaying world elements:', err);
            }
        }
    }
    
    /**
     * Fix the relationships tab content
     */
    function fixRelationshipsTab() {
        console.log('Fixing relationships tab');
        const tab = document.getElementById('relationships-tab');
        if (!tab) return;
        
        // Check for relationship elements
        ensureElementExists('relationshipList', tab, createRelationshipList);
        ensureElementExists('relationshipNetwork', tab, createRelationshipNetwork);
        
        // Try to display relationships
        if (typeof Relationships !== 'undefined' && typeof Relationships.displayRelationships === 'function') {
            try {
                Relationships.displayRelationships();
            } catch (err) {
                console.error('Error displaying relationships:', err);
            }
        }
    }
    
    /**
     * Fix the timeline tab content
     */
    function fixTimelineTab() {
        console.log('Fixing timeline tab');
        const tab = document.getElementById('timeline-tab');
        if (!tab) return;
        
        // Check for timeline elements
        ensureElementExists('timelineContainer', tab, createTimelineContainer);
        
        // Try to display timeline
        if (typeof Timeline !== 'undefined' && typeof Timeline.displayTimeline === 'function') {
            try {
                Timeline.displayTimeline();
            } catch (err) {
                console.error('Error displaying timeline:', err);
            }
        }
    }
    
    /**
     * Ensure an element exists in a container, create it if not
     * @param {string} elementId - The ID of the element to check
     * @param {HTMLElement} container - The container to check in
     * @param {Function} creationFunction - Function to create the element if needed
     */
    function ensureElementExists(elementId, container, creationFunction) {
        if (!document.getElementById(elementId) && typeof creationFunction === 'function') {
            console.log(`Creating missing element: ${elementId}`);
            creationFunction(container);
        }
    }
    
    /**
     * Create a basic location form
     * @param {HTMLElement} container - Container to add the form to
     */
    function createLocationForm(container) {
        const form = document.createElement('form');
        form.id = 'locationForm';
        form.setAttribute('novalidate', '');
        form.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <h3>Basic Information</h3>
                    <div class="input-group">
                        <label for="locationName">Name</label>
                        <input type="text" id="locationName" name="locationName" placeholder="Enter location name">
                    </div>
                    <div class="input-group">
                        <label for="locationType">Type</label>
                        <input type="text" id="locationType" name="locationType" placeholder="Enter location type">
                    </div>
                </div>
            </div>
            <div class="form-buttons">
                <button type="submit" class="add-location-btn"><i class="fas fa-map-marker-alt"></i> Add</button>
                <button type="button" class="clear-form-btn" onclick="Locations.clearLocationForm()"><i class="fas fa-eraser"></i> Clear</button>
            </div>
        `;
        
        // Find the right position to insert
        const searchContainer = container.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.parentNode.insertBefore(form, searchContainer.nextSibling);
        } else {
            container.appendChild(form);
        }
        
        return form;
    }
    
    /**
     * Create a basic location table
     * @param {HTMLElement} container - Container to add the table to
     */
    function createLocationTable(container) {
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-container';
        
        const table = document.createElement('table');
        table.id = 'locationTable';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Series</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- Location data will be loaded here -->
            </tbody>
        `;
        
        tableWrapper.appendChild(table);
        
        // Create pagination div
        const pagination = document.createElement('div');
        pagination.id = 'locationPagination';
        pagination.className = 'pagination-controls';
        tableWrapper.appendChild(pagination);
        
        container.appendChild(tableWrapper);
        
        return tableWrapper;
    }
    
    /**
     * Create a basic plot form
     * @param {HTMLElement} container - Container to add the form to
     */
    function createPlotForm(container) {
        const form = document.createElement('form');
        form.id = 'plotForm';
        form.setAttribute('novalidate', '');
        form.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <h3>Basic Information</h3>
                    <div class="input-group">
                        <label for="plotTitle">Title</label>
                        <input type="text" id="plotTitle" name="plotTitle" placeholder="Enter plot title">
                    </div>
                    <div class="input-group">
                        <label for="plotType">Type</label>
                        <input type="text" id="plotType" name="plotType" placeholder="Enter plot type">
                    </div>
                </div>
            </div>
            <div class="form-buttons">
                <button type="submit" class="add-plot-btn"><i class="fas fa-plus-circle"></i> Add</button>
                <button type="button" class="clear-form-btn" onclick="Plots.clearPlotForm()"><i class="fas fa-eraser"></i> Clear</button>
            </div>
        `;
        
        // Find the right position to insert
        const searchContainer = container.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.parentNode.insertBefore(form, searchContainer.nextSibling);
        } else {
            container.appendChild(form);
        }
        
        return form;
    }
    
    /**
     * Create a basic plot table
     * @param {HTMLElement} container - Container to add the table to
     */
    function createPlotTable(container) {
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-container';
        
        const table = document.createElement('table');
        table.id = 'plotTable';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Series</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- Plot data will be loaded here -->
            </tbody>
        `;
        
        tableWrapper.appendChild(table);
        
        // Create pagination div
        const pagination = document.createElement('div');
        pagination.id = 'plotPagination';
        pagination.className = 'pagination-controls';
        tableWrapper.appendChild(pagination);
        
        container.appendChild(tableWrapper);
        
        return tableWrapper;
    }
    
    /**
     * Create a basic world element form
     * @param {HTMLElement} container - Container to add the form to
     */
    function createWorldElementForm(container) {
        const form = document.createElement('form');
        form.id = 'worldElementForm';
        form.setAttribute('novalidate', '');
        form.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <h3>Basic Information</h3>
                    <div class="input-group">
                        <label for="elementName">Name</label>
                        <input type="text" id="elementName" name="elementName" placeholder="Enter element name">
                    </div>
                    <div class="input-group">
                        <label for="elementType">Type</label>
                        <select id="elementType" name="elementType">
                            <option value="">Select a type</option>
                            <option value="culture">Culture</option>
                            <option value="religion">Religion</option>
                            <option value="government">Government</option>
                            <option value="geography">Geography</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="form-buttons">
                <button type="submit" class="add-element-btn"><i class="fas fa-plus-circle"></i> Add</button>
                <button type="button" class="clear-form-btn" onclick="WorldBuilding.clearWorldElementForm()"><i class="fas fa-eraser"></i> Clear</button>
            </div>
        `;
        
        // Find the right position to insert
        const searchContainer = container.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.parentNode.insertBefore(form, searchContainer.nextSibling);
        } else {
            container.appendChild(form);
        }
        
        return form;
    }
    
    /**
     * Create a basic world element table
     * @param {HTMLElement} container - Container to add the table to
     */
    function createWorldElementTable(container) {
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-container';
        
        const table = document.createElement('table');
        table.id = 'worldElementTable';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Series</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- World element data will be loaded here -->
            </tbody>
        `;
        
        tableWrapper.appendChild(table);
        
        // Create pagination div
        const pagination = document.createElement('div');
        pagination.id = 'worldElementPagination';
        pagination.className = 'pagination-controls';
        tableWrapper.appendChild(pagination);
        
        container.appendChild(tableWrapper);
        
        return tableWrapper;
    }
    
    /**
     * Create a basic relationship list
     * @param {HTMLElement} container - Container to add the list to
     */
    function createRelationshipList(container) {
        const listContainer = document.createElement('div');
        listContainer.id = 'relationshipList';
        listContainer.className = 'relationship-list';
        listContainer.innerHTML = '<ul class="relationship-items"></ul>';
        
        container.appendChild(listContainer);
        
        return listContainer;
    }
    
    /**
     * Create a basic relationship network visualization
     * @param {HTMLElement} container - Container to add the network to
     */
    function createRelationshipNetwork(container) {
        const networkContainer = document.createElement('div');
        networkContainer.id = 'relationshipNetwork';
        networkContainer.className = 'relationship-network';
        networkContainer.style.height = '400px';
        networkContainer.style.border = '1px solid #ccc';
        
        container.appendChild(networkContainer);
        
        return networkContainer;
    }
    
    /**
     * Create a basic timeline container
     * @param {HTMLElement} container - Container to add the timeline to
     */
    function createTimelineContainer(container) {
        const timelineContainer = document.createElement('div');
        timelineContainer.id = 'timelineContainer';
        timelineContainer.className = 'timeline-container';
        
        container.appendChild(timelineContainer);
        
        return timelineContainer;
    }
})();
