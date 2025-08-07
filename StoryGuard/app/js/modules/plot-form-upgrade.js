/**
 * Plot Form Upgrade
 * 
 * This module upgrades the plot form to use standardized UI components.
 * It follows the pattern established for character and location forms for consistency.
 */

// Import required modules
import { upgradeExistingUI } from './ui-components-integration.js';
import { tryCatch } from './error-handling-util.js';

/**
 * Initialize the UI component upgrades for the plot form
 */
export function initializePlotFormUpgrade() {
    // We'll use a more conservative approach that doesn't interfere with tab loading
    // Wait for the app to be fully loaded and plots to be initialized first
    setTimeout(() => {
        try {
            console.log('Setting up plots tab upgrade...');
            
            // Wait for the plots tab to be activated before upgrading
            const plotsTabLink = document.querySelector('a[href="#plots-tab"]');
            if (plotsTabLink) {
                plotsTabLink.addEventListener('click', function() {
                    // Give the original tab loading code time to run
                    setTimeout(() => {
                        if (document.getElementById('plotForm') && document.getElementById('plotTable')) {
                            console.log('Plots tab activated, upgrading form...');
                            checkComponentsAndUpgrade();
                        }
                    }, 300); // Wait longer for original code to run
                });
                
                console.log('Plot form upgrade will happen when tab is clicked');
            }
            
            // Also check if we're already on the plots tab
            const plotsTab = document.getElementById('plots-tab');
            if (plotsTab && window.getComputedStyle(plotsTab).display !== 'none') {
                console.log('Already on plots tab, checking for form...');
                // We're already on the plots tab, check if form exists and upgrade it
                if (document.getElementById('plotForm') && document.getElementById('plotTable')) {
                    checkComponentsAndUpgrade();
                }
            }
        } catch (error) {
            console.error('Error initializing plot form upgrade:', error);
        }
    }, 1000); // Give application time to fully initialize
}

/**
 * Check if components are initialized and upgrade the form
 */
function checkComponentsAndUpgrade() {
    try {
        // Make sure required elements exist before upgrading
        const plotForm = document.getElementById('plotForm');
        const plotTable = document.getElementById('plotTable');
        
        if (!plotForm || !plotTable) {
            console.warn('Required plot form elements not found, skipping upgrade');
            return;
        }
        
        console.log('Checking if UI components are ready for plot form upgrade...');
        
        // Simplified approach - direct check for UI Manager
        if (window.UIManager?.componentsInitialized) {
            upgradePlotForm();
            upgradePlotList();
        } else {
            // Set a timeout to check again in 500ms
            setTimeout(() => {
                if (window.UIManager?.componentsInitialized) {
                    upgradePlotForm();
                    upgradePlotList();
                } else {
                    console.warn('UI components not initialized, plot form upgrade skipped');
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error checking components for plot form upgrade:', error);
    }
}

/**
 * Upgrade the plot form with standardized components
 */
function upgradePlotForm() {
    return tryCatch(async () => {
        console.log('Upgrading plot form with standardized components...');
        
        // Get the plot form element
        const plotForm = document.getElementById('plotForm');
        if (!plotForm) {
            console.warn('Plot form not found, skipping upgrade');
            return;
        }
        
        // Upgrade all components in the form
        const result = await window.SGUpgradeUI.upgradeContainer(plotForm, {
            // Specify which types of components to upgrade
            buttons: true,
            inputs: true,
            dropdowns: true,
            cards: false // We'll manually handle cards
        });
        
        if (result) {
            console.log('Plot form successfully upgraded with standardized components');
            enhanceFormFunctionality(plotForm);
        } else {
            console.error('Failed to upgrade plot form');
        }
    }, null, 'plot-form', 'error', { action: 'upgrade-form' });
}

/**
 * Upgrade the plot list with card-based display
 */
function upgradePlotList() {
    return tryCatch(async () => {
        console.log('Upgrading plot list with card-based display...');
        
        // This will be implemented when we convert the plot list to cards
        // For now, we'll focus on the form upgrade
        
        // Check if the plot cards container exists
        const plotCardsContainer = document.getElementById('plot-cards-container');
        if (plotCardsContainer) {
            enhancePlotCards(plotCardsContainer);
        }
    }, null, 'plot-form', 'error', { action: 'upgrade-plot-list' });
}

/**
 * Enhance the plot form with additional functionality
 * @param {HTMLElement} form - The plot form element
 */
function enhanceFormFunctionality(form) {
    return tryCatch(() => {
        // Enhance plot outline field with rich text if available
        const outlineField = form.querySelector('#plotOutline');
        if (outlineField) {
            enhanceRichTextField(outlineField, 'Plot outline');
        }
        
        // Enhance plot resolution field with rich text if available
        const resolutionField = form.querySelector('#plotResolution');
        if (resolutionField) {
            enhanceRichTextField(resolutionField, 'Plot resolution');
        }
        
        // Enhance character selection section
        const characterSelection = form.querySelector('#plotCharacters');
        if (characterSelection) {
            enhanceMultiSelection(characterSelection, 'characters');
        }
        
        // Enhance location selection section
        const locationSelection = form.querySelector('#plotLocations');
        if (locationSelection) {
            enhanceMultiSelection(locationSelection, 'locations');
        }
        
        // Add form-wide validation
        enhanceFormValidation(form);
    }, null, 'plot-form', 'error', { action: 'enhance-functionality' });
}

/**
 * Enhance the plot cards display
 * @param {HTMLElement} container - The plot cards container
 */
function enhancePlotCards(container) {
    return tryCatch(() => {
        const UIManager = window.UIManager;
        if (!UIManager?.components?.Card) return;
        
        // This is a placeholder for when we implement card-based plot display
        // The actual implementation will depend on how the plot data is structured
        // and how the existing plot cards are displayed
        
        console.log('Plot cards enhancement ready for implementation');
    }, null, 'plot-form', 'error', { action: 'enhance-plot-cards' });
}

/**
 * Enhance a text field with rich text capabilities
 * @param {HTMLElement} textField - The text field to enhance
 * @param {string} label - The label for the field
 */
function enhanceRichTextField(textField, label) {
    return tryCatch(() => {
        // Check if rich text editor is available
        if (typeof RichTextEditor === 'undefined') return;
        
        // Add rich text editor class for styling
        textField.classList.add('rich-text-editor');
        
        // Initialize rich text editor if available
        if (typeof RichTextEditor?.initialize === 'function') {
            RichTextEditor.initialize(textField, {
                toolbar: ['bold', 'italic', 'underline', 'heading', 'list', 'clear'],
                placeholder: `Enter ${label.toLowerCase()} here...`
            });
        }
    }, null, 'plot-form', 'error', { action: 'enhance-rich-text', field: label });
}

/**
 * Enhance multi-selection capability for characters or locations
 * @param {HTMLElement} selectElement - The select element to enhance
 * @param {string} type - The type of elements being selected ('characters' or 'locations')
 */
function enhanceMultiSelection(selectElement, type) {
    return tryCatch(() => {
        const UIManager = window.UIManager;
        if (!UIManager?.components?.Dropdown) return;
        
        // Skip if already upgraded
        if (selectElement.dataset.upgraded) return;
        
        // Convert to options array required by Dropdown component
        const options = [];
        Array.from(selectElement.options).forEach(option => {
            if (option.value !== '') {
                options.push({
                    value: option.value,
                    label: option.textContent
                });
            }
        });
        
        // Get currently selected values
        const selectedValues = Array.from(selectElement.selectedOptions).map(option => option.value);
        
        // Create wrapper if needed
        const wrapper = document.createElement('div');
        wrapper.className = 'sg-form-field';
        selectElement.parentNode.insertBefore(wrapper, selectElement);
        
        // Create the Dropdown component
        const dropdown = UIManager.createDropdown({
            label: `Select ${type}`,
            options: options,
            value: selectedValues,
            multiple: true,
            searchable: true,
            parent: wrapper
        });
        
        // Hide the original select element
        selectElement.style.display = 'none';
        wrapper.appendChild(selectElement);
        
        // Connect dropdown changes to original select
        dropdown.element.addEventListener('sg-dropdown-change', (e) => {
            // Update original select values
            Array.from(selectElement.options).forEach(option => {
                option.selected = e.detail.value.includes(option.value);
            });
            
            // Trigger change event on original select
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        // Mark as upgraded
        selectElement.dataset.upgraded = 'true';
    }, null, 'plot-form', 'error', { action: 'enhance-multi-selection', type });
}

/**
 * Enhance form validation with standardized components
 * @param {HTMLElement} form - The plot form element
 */
function enhanceFormValidation(form) {
    return tryCatch(() => {
        // Override form submission
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = function(e) {
            e.preventDefault();
            
            // Validate all form inputs
            const isValid = validatePlotForm();
            
            if (isValid) {
                // Call original submit handler if it exists
                if (typeof originalSubmit === 'function') {
                    originalSubmit.call(this, e);
                } else {
                    // Fallback - try to call the global add plot function
                    if (typeof Plots?.addPlot === 'function') {
                        Plots.addPlot();
                    } else {
                        console.error('Cannot find plot form submission handler');
                    }
                }
            }
        };
    }, null, 'plot-form', 'error', { action: 'enhance-validation' });
}

/**
 * Validate the plot form using component validation
 * @returns {boolean} True if the form is valid, false otherwise
 */
function validatePlotForm() {
    return tryCatch(() => {
        const form = document.getElementById('plotForm');
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
        
        // Check required fields specifically
        const titleField = form.querySelector('#plotTitle');
        if (titleField && !titleField.value.trim()) {
            isValid = false;
            const titleContainer = titleField.closest('.sg-form-field');
            if (titleContainer) {
                titleContainer.classList.add('sg-form-field-error');
                const errorElement = titleContainer.querySelector('.sg-form-error') || document.createElement('div');
                errorElement.className = 'sg-form-error';
                errorElement.textContent = 'Plot title is required';
                titleContainer.appendChild(errorElement);
            }
        }
        
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
    }, null, 'plot-form', 'error', { action: 'validate-form' }, false); // Return false on error
}

// Initialize the plot form upgrade
initializePlotFormUpgrade();
