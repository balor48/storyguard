/**
 * Location Form Upgrade
 * 
 * This module upgrades the location form to use standardized UI components.
 * It follows the same pattern as the character form upgrade for consistency.
 */

// Import required modules
import { upgradeExistingUI } from './ui-components-integration.js';
import { tryCatch } from './error-handling-util.js';

/**
 * Initialize the UI component upgrades for the location form
 */
export function initializeLocationFormUpgrade() {
    // We'll use a more conservative approach that doesn't interfere with tab loading
    // Wait for the app to be fully loaded and locations to be initialized first
    setTimeout(() => {
        try {
            console.log('Setting up locations tab upgrade...');
            
            // Wait for the locations tab to be activated before upgrading
            const locationsTabLink = document.querySelector('a[href="#locations-tab"]');
            if (locationsTabLink) {
                locationsTabLink.addEventListener('click', function() {
                    // Give the original tab loading code time to run
                    setTimeout(() => {
                        if (document.getElementById('locationForm') && document.getElementById('locationTable')) {
                            console.log('Locations tab activated, upgrading form...');
                            checkComponentsAndUpgrade();
                        }
                    }, 300); // Wait longer for original code to run
                });
                
                console.log('Location form upgrade will happen when tab is clicked');
            }
            
            // Also check if we're already on the locations tab
            const locationsTab = document.getElementById('locations-tab');
            if (locationsTab && window.getComputedStyle(locationsTab).display !== 'none') {
                console.log('Already on locations tab, checking for form...');
                // We're already on the locations tab, check if form exists and upgrade it
                if (document.getElementById('locationForm') && document.getElementById('locationTable')) {
                    checkComponentsAndUpgrade();
                }
            }
        } catch (error) {
            console.error('Error initializing location form upgrade:', error);
        }
    }, 1000); // Give application time to fully initialize
}

/**
 * Check if components are initialized and upgrade the form
 */
function checkComponentsAndUpgrade() {
    try {
        // Make sure required elements exist before upgrading
        const locationForm = document.getElementById('locationForm');
        const locationTable = document.getElementById('locationTable');
        
        if (!locationForm || !locationTable) {
            console.warn('Required location form elements not found, skipping upgrade');
            return;
        }
        
        console.log('Checking if UI components are ready for location form upgrade...');
        
        // Simplified approach - direct check for UI Manager
        if (window.UIManager?.componentsInitialized) {
            upgradeLocationForm();
        } else {
            // Set a timeout to check again in 500ms
            setTimeout(() => {
                if (window.UIManager?.componentsInitialized) {
                    upgradeLocationForm();
                } else {
                    console.warn('UI components not initialized, location form upgrade skipped');
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error checking components for location form upgrade:', error);
    }
}

/**
 * Upgrade the location form with standardized components
 */
function upgradeLocationForm() {
    return tryCatch(async () => {
        console.log('Upgrading location form with standardized components...');
        
        // Get the location form element
        const locationForm = document.getElementById('locationForm');
        if (!locationForm) {
            console.warn('Location form not found, skipping upgrade');
            return;
        }
        
        // Upgrade all components in the form
        const result = await window.SGUpgradeUI.upgradeContainer(locationForm, {
            // Specify which types of components to upgrade
            buttons: true,
            inputs: true,
            dropdowns: true,
            cards: false // We'll manually handle the map card
        });
        
        if (result) {
            console.log('Location form successfully upgraded with standardized components');
            enhanceFormFunctionality(locationForm);
        } else {
            console.error('Failed to upgrade location form');
        }
    }, null, 'location-form', 'error', { action: 'upgrade-form' });
}

/**
 * Enhance the location form with additional functionality
 * @param {HTMLElement} form - The location form element
 */
function enhanceFormFunctionality(form) {
    return tryCatch(() => {
        // Add a map card for the location if applicable
        const mapSection = form.querySelector('.map-section') || form.querySelector('#locationMap');
        if (mapSection) {
            addMapCard(mapSection);
        }
        
        // Enhance description field with rich text if available
        const descriptionField = form.querySelector('#locationDescription');
        if (descriptionField) {
            enhanceDescriptionField(descriptionField);
        }
        
        // Add form-wide validation
        enhanceFormValidation(form);
    }, null, 'location-form', 'error', { action: 'enhance-functionality' });
}

/**
 * Add map card component
 * @param {HTMLElement} container - The map section container
 */
function addMapCard(container) {
    return tryCatch(() => {
        const UIManager = window.UIManager;
        if (!UIManager?.components?.Card) return;
        
        // Create a card for map display
        const card = UIManager.createCard({
            title: 'Location Map',
            subtitle: 'Visual representation of the location',
            content: container.innerHTML || '<div id="mapPlaceholder" style="height: 200px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center; border-radius: 4px;"><span>Map placeholder</span></div>',
            actions: [
                {
                    text: 'Add Map',
                    variant: 'primary',
                    onClick: () => {
                        // Call existing map functionality if available
                        if (typeof Locations?.addMap === 'function') {
                            Locations.addMap();
                        } else {
                            console.warn('Map functionality not available');
                        }
                    }
                },
                {
                    text: 'Remove',
                    variant: 'danger',
                    onClick: () => {
                        // Call existing remove map functionality if available
                        if (typeof Locations?.removeMap === 'function') {
                            Locations.removeMap();
                        } else {
                            // Fallback
                            const mapElement = document.getElementById('locationMapDisplay');
                            if (mapElement) mapElement.innerHTML = '';
                        }
                    }
                }
            ]
        });
        
        // Replace existing content with the card
        container.innerHTML = '';
        container.appendChild(card.element);
    }, null, 'location-form', 'error', { action: 'add-map-card' });
}

/**
 * Enhance the description field with rich text capabilities
 * @param {HTMLElement} descriptionField - The description textarea
 */
function enhanceDescriptionField(descriptionField) {
    return tryCatch(() => {
        // Check if rich text editor is available
        if (typeof RichTextEditor === 'undefined') return;
        
        // Add rich text editor class for styling
        descriptionField.classList.add('rich-text-editor');
        
        // Initialize rich text editor if available
        if (typeof RichTextEditor?.initialize === 'function') {
            RichTextEditor.initialize(descriptionField, {
                toolbar: ['bold', 'italic', 'underline', 'list', 'clear']
            });
        }
    }, null, 'location-form', 'error', { action: 'enhance-description' });
}

/**
 * Enhance form validation with standardized components
 * @param {HTMLElement} form - The location form element
 */
function enhanceFormValidation(form) {
    return tryCatch(() => {
        // Override form submission
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = function(e) {
            e.preventDefault();
            
            // Validate all form inputs
            const isValid = validateLocationForm();
            
            if (isValid) {
                // Call original submit handler if it exists
                if (typeof originalSubmit === 'function') {
                    originalSubmit.call(this, e);
                } else {
                    // Fallback - try to call the global add location function
                    if (typeof Locations?.addLocation === 'function') {
                        Locations.addLocation();
                    } else {
                        console.error('Cannot find location form submission handler');
                    }
                }
            }
        };
    }, null, 'location-form', 'error', { action: 'enhance-validation' });
}

/**
 * Validate the location form using component validation
 * @returns {boolean} True if the form is valid, false otherwise
 */
function validateLocationForm() {
    return tryCatch(() => {
        const form = document.getElementById('locationForm');
        if (!form) return false;
        
        // Get all input components in the form
        const inputs = form.querySelectorAll('.sg-form-field');
        let isValid = true;
        
        // Validate each input
        inputs.forEach(inputContainer => {
            const input = inputContainer.querySelector('input, select, textarea');
            if (!input || !input.dataset.upgraded) return;
            
            // Get the component instance
            const component = input._component;
            if (!component || typeof component.validate !== 'function') return;
            
            // Validate the component
            const inputValid = component.validate();
            if (!inputValid) {
                isValid = false;
            }
        });
        
        // If not valid, show error message
        if (!isValid) {
            // Use notification system if available
            if (window.notificationManager) {
                window.notificationManager.showError('Please fix the errors in the form before submitting.');
            } else {
                alert('Please fix the errors in the form before submitting.');
            }
            
            // Scroll to first error
            const firstError = form.querySelector('.sg-form-field-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Focus the input
                const input = firstError.querySelector('input, select, textarea');
                if (input) input.focus();
            }
        }
        
        return isValid;
    }, null, 'location-form', 'error', { action: 'validate-form' }, false); // Return false on error
}

// Initialize the location form upgrade
initializeLocationFormUpgrade();
