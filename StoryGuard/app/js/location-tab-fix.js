/**
 * Location Tab Fix
 * 
 * This script ensures that the required DOM elements for the locations tab
 * are available when the tab is loaded. It addresses the "Required DOM elements not found"
 * error that occurs during tab switching.
 */

(function() {
    // Initialize when the document is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Location tab fix initialized');
        
        // Add a listener for tab switching
        document.querySelectorAll('a[href="#locations-tab"]').forEach(function(link) {
            link.addEventListener('click', function() {
                // Short delay to ensure we run after the tab switch but before validation
                setTimeout(ensureLocationElements, 10);
            });
        });
        
        // Also check on app-ready event
        window.addEventListener('storyguard:app-ready', ensureLocationElements);
        
        // Check if we're already on the locations tab
        if (isLocationsTabActive()) {
            ensureLocationElements();
        }
    });
    
    /**
     * Check if the locations tab is currently active
     * @returns {boolean} True if the locations tab is active
     */
    function isLocationsTabActive() {
        const locationsTab = document.getElementById('locations-tab');
        return locationsTab && window.getComputedStyle(locationsTab).display !== 'none';
    }
    
    /**
     * Ensure location tab elements exist and are properly initialized
     */
    function ensureLocationElements() {
        console.log('Checking location tab elements');
        const locationsTab = document.getElementById('locations-tab');
        
        if (!locationsTab) {
            console.warn('Locations tab element not found');
            return;
        }
        
        // Check for the location form
        let locationForm = document.getElementById('locationForm');
        if (!locationForm) {
            console.log('Creating missing locationForm');
            locationForm = document.createElement('form');
            locationForm.id = 'locationForm';
            locationForm.setAttribute('novalidate', '');
            
            // Add basic structure to the form
            locationForm.innerHTML = `
                <div class="form-grid">
                    <!-- Basic Info Group -->
                    <div class="form-group">
                        <h3>Basic Information</h3>
                        <div class="input-group">
                            <label for="locationName">Name</label>
                            <input type="text" id="locationName" name="locationName" placeholder="Enter location name">
                        </div>
                    </div>
                </div>
                <div class="form-buttons">
                    <button type="submit" class="add-location-btn"><i class="fas fa-map-marker-alt"></i> Add</button>
                    <button type="button" class="clear-form-btn" onclick="Locations.clearLocationForm()"><i class="fas fa-eraser"></i> Clear</button>
                </div>
            `;
            
            // Add the form at the right position
            const searchContainer = locationsTab.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.parentNode.insertBefore(locationForm, searchContainer.nextSibling);
            } else {
                locationsTab.appendChild(locationForm);
            }
        }
        
        // Check for the location table
        let tableContainer = locationsTab.querySelector('.table-container');
        let locationTable = document.getElementById('locationTable');
        
        if (!tableContainer) {
            console.log('Creating missing table container');
            tableContainer = document.createElement('div');
            tableContainer.className = 'table-container';
            locationsTab.appendChild(tableContainer);
        }
        
        if (!locationTable) {
            console.log('Creating missing locationTable');
            locationTable = document.createElement('table');
            locationTable.id = 'locationTable';
            locationTable.innerHTML = `
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
            tableContainer.appendChild(locationTable);
        }
        
        // Create pagination controls if needed
        if (!document.getElementById('locationPagination')) {
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'locationPagination';
            paginationDiv.className = 'pagination-controls';
            tableContainer.appendChild(paginationDiv);
        }
        
        console.log('Location tab elements verified');
        
        // Attempt to refresh the locations display
        if (typeof Locations !== 'undefined' && typeof Locations.displayLocations === 'function') {
            try {
                console.log('Refreshing locations display');
                Locations.displayLocations();
            } catch (err) {
                console.error('Error refreshing locations:', err);
            }
        }
    }
})();
