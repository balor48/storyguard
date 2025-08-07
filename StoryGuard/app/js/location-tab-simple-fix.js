/**
 * Simple Location Tab Fix
 * 
 * This script adds an event listener to handle the "Required DOM elements not found" error
 * on the locations tab without interfering with the core application functionality.
 */

(function() {
    // Add an event listener to handle location tab clicks
    document.addEventListener('DOMContentLoaded', function() {
        const locationTabLinks = document.querySelectorAll('a[href="#locations-tab"]');
        
        if (locationTabLinks.length > 0) {
            locationTabLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    // Short timeout to let the original tab switch happen first
                    setTimeout(function() {
                        // If we got an error, try loading locations anyway
                        if (document.getElementById('locations-tab').style.display !== 'none') {
                            if (typeof Locations !== 'undefined' && typeof Locations.displayLocations === 'function') {
                                try {
                                    console.log('Location tab fix: Attempting to load locations even if elements are missing');
                                    Locations.displayLocations();
                                } catch (err) {
                                    console.error('Error in location tab fix:', err);
                                }
                            }
                        }
                    }, 100);
                });
            });
        }
    });
})();
