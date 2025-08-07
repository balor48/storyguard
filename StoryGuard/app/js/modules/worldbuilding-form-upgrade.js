/**
 * Worldbuilding Form Upgrade
 * 
 * This module upgrades the worldbuilding form to use standardized UI components.
 * It follows the pattern established in our other form upgrades for consistency.
 */

// Import required modules
import { upgradeExistingUI } from './ui-components-integration.js';
import { tryCatch } from './error-handling-util.js';

/**
 * Initialize the UI component upgrades for the worldbuilding form
 */
export function initializeWorldbuildingFormUpgrade() {
    // We'll use a more conservative approach that doesn't interfere with tab loading
    // Wait for the app to be fully loaded and worldbuilding to be initialized first
    setTimeout(() => {
        try {
            console.log('Setting up worldbuilding tab upgrade...');
            
            // Wait for the worldbuilding tab to be activated before upgrading
            const worldbuildingTabLink = document.querySelector('a[href="#worldbuilding-tab"]');
            if (worldbuildingTabLink) {
                worldbuildingTabLink.addEventListener('click', function() {
                    // Give the original tab loading code time to run
                    setTimeout(() => {
                        if (document.getElementById('worldElementForm') && document.getElementById('worldElementTable')) {
                            console.log('Worldbuilding tab activated, upgrading form...');
                            checkComponentsAndUpgrade();
                        }
                    }, 300); // Wait longer for original code to run
                });
                
                console.log('Worldbuilding form upgrade will happen when tab is clicked');
            }
            
            // Also check if we're already on the worldbuilding tab
            const worldbuildingTab = document.getElementById('worldbuilding-tab');
            if (worldbuildingTab && window.getComputedStyle(worldbuildingTab).display !== 'none') {
                console.log('Already on worldbuilding tab, checking for form...');
                // We're already on the worldbuilding tab, check if form exists and upgrade it
                if (document.getElementById('worldElementForm') && document.getElementById('worldElementTable')) {
                    checkComponentsAndUpgrade();
                }
            }
        } catch (error) {
            console.error('Error initializing worldbuilding form upgrade:', error);
        }
    }, 1000); // Give application time to fully initialize
}

/**
 * Check if components are initialized and upgrade the form
 */
function checkComponentsAndUpgrade() {
    try {
        // Make sure required elements exist before upgrading
        const worldElementForm = document.getElementById('worldElementForm');
        const worldElementTable = document.getElementById('worldElementTable');
        
        if (!worldElementForm || !worldElementTable) {
            console.warn('Required worldbuilding form elements not found, skipping upgrade');
            return;
        }
        
        console.log('Checking if UI components are ready for worldbuilding form upgrade...');
        
        // Simplified approach - direct check for UI Manager
        if (window.UIManager?.componentsInitialized) {
            upgradeWorldbuildingForm();
            upgradeWorldElementDisplay();
        } else {
            // Set a timeout to check again in 500ms
            setTimeout(() => {
                if (window.UIManager?.componentsInitialized) {
                    upgradeWorldbuildingForm();
                    upgradeWorldElementDisplay();
                } else {
                    console.warn('UI components not initialized, worldbuilding form upgrade skipped');
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error checking components for worldbuilding form upgrade:', error);
    }
}

/**
 * Upgrade the worldbuilding form with standardized components
 */
function upgradeWorldbuildingForm() {
    return tryCatch(async () => {
        console.log('Upgrading worldbuilding form with standardized components...');
        
        // Get the worldbuilding form element
        const worldbuildingForm = document.getElementById('worldElementForm');
        if (!worldbuildingForm) {
            console.warn('Worldbuilding form not found, skipping upgrade');
            return;
        }
        
        // Upgrade all components in the form
        const result = await window.SGUpgradeUI.upgradeContainer(worldbuildingForm, {
            // Specify which types of components to upgrade
            buttons: true,
            inputs: true,
            dropdowns: true,
            cards: false // We'll handle cards separately
        });
        
        if (result) {
            console.log('Worldbuilding form successfully upgraded with standardized components');
            enhanceFormFunctionality(worldbuildingForm);
        } else {
            console.error('Failed to upgrade worldbuilding form');
        }
    }, null, 'worldbuilding-form', 'error', { action: 'upgrade-form' });
}

/**
 * Upgrade the world element display with card-based layout
 */
function upgradeWorldElementDisplay() {
    return tryCatch(() => {
        // This will be implemented in a future update when we convert to card-based display
        // For now, we'll focus on the form upgrade
        
        console.log('World element display enhancement ready for future implementation');
    }, null, 'worldbuilding-form', 'error', { action: 'upgrade-display' });
}

/**
 * Enhance the worldbuilding form with additional functionality
 * @param {HTMLElement} form - The worldbuilding form element
 */
function enhanceFormFunctionality(form) {
    return tryCatch(() => {
        // Enhance the description field with rich text capabilities
        const descriptionField = form.querySelector('#elementDescription');
        if (descriptionField) {
            enhanceRichTextField(descriptionField, 'Description');
        }
        
        // Enhance any rules/laws field with rich text capabilities
        const rulesField = form.querySelector('#elementRules');
        if (rulesField) {
            enhanceRichTextField(rulesField, 'Rules/Laws');
        }
        
        // Enhance customs field with rich text if available
        const customsField = form.querySelector('#elementCustoms');
        if (customsField) {
            enhanceRichTextField(customsField, 'Customs');
        }
        
        // Enhance type selection dropdown
        const typeSelect = form.querySelector('#elementType');
        if (typeSelect) {
            enhanceTypeDropdown(typeSelect);
        }
        
        // Add form-wide validation
        enhanceFormValidation(form);
    }, null, 'worldbuilding-form', 'error', { action: 'enhance-functionality' });
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
    }, null, 'worldbuilding-form', 'error', { action: 'enhance-rich-text', field: label });
}

/**
 * Enhance the type dropdown with better categorization
 * @param {HTMLElement} typeSelect - The type select element
 */
function enhanceTypeDropdown(typeSelect) {
    return tryCatch(() => {
        const UIManager = window.UIManager;
        if (!UIManager?.components?.Dropdown) return;
        
        // Skip if already upgraded
        if (typeSelect.dataset.upgraded) return;
        
        // Check if we have a parent input group
        const inputGroup = typeSelect.closest('.input-group');
        if (!inputGroup) return;
        
        // Get current value
        const currentValue = typeSelect.value;
        
        // Get label text
        const labelElement = inputGroup.querySelector('label');
        const labelText = labelElement ? labelElement.textContent : 'Element Type';
        
        // Group options by category
        const groupedOptions = [
            { value: '', label: 'Select a type', disabled: true },
            { value: 'culture', label: 'Culture', group: true },
            { value: 'religion', label: 'Religion' },
            { value: 'government', label: 'Government' },
            { value: 'economy', label: 'Economy' },
            { value: 'customs', label: 'Customs & Traditions' },
            { value: 'social', label: 'Social Structure' },
            { value: 'language', label: 'Language' },
            { value: 'arts', label: 'Arts & Entertainment' },
            
            { value: 'natural', label: 'Natural World', group: true },
            { value: 'geography', label: 'Geography' },
            { value: 'climate', label: 'Climate & Weather' },
            { value: 'environment', label: 'Environment' },
            { value: 'flora', label: 'Flora' },
            { value: 'fauna', label: 'Fauna' },
            
            { value: 'supernatural', label: 'Supernatural', group: true },
            { value: 'magic', label: 'Magic System' },
            { value: 'mythology', label: 'Mythology' },
            { value: 'deities', label: 'Deities' },
            { value: 'supernatural_beings', label: 'Supernatural Beings' },
            
            { value: 'technology', label: 'Technology & Science', group: true },
            { value: 'technology', label: 'Technology' },
            { value: 'science', label: 'Science' },
            { value: 'transportation', label: 'Transportation' },
            { value: 'communication', label: 'Communication' },
            
            { value: 'history', label: 'History & Timeline', group: true },
            { value: 'history', label: 'Historical Events' },
            { value: 'conflict', label: 'Conflicts & Wars' },
            { value: 'timeline', label: 'Timeline' },
            
            { value: 'other', label: 'Other', group: true },
            { value: 'food', label: 'Food & Cuisine' },
            { value: 'occupation', label: 'Occupations & Professions' },
            { value: 'education', label: 'Education' },
            { value: 'law', label: 'Laws & Justice' },
            { value: 'custom', label: 'Custom Element' }
        ];
        
        // Create wrapper element
        const wrapper = document.createElement('div');
        wrapper.className = 'sg-dropdown-wrapper';
        typeSelect.parentNode.insertBefore(wrapper, typeSelect);
        
        // Create dropdown component with enhanced options
        const dropdown = UIManager.createDropdown({
            label: labelText,
            options: groupedOptions,
            value: currentValue,
            searchable: true,
            parent: wrapper
        });
        
        // Hide original select
        typeSelect.style.display = 'none';
        wrapper.appendChild(typeSelect);
        
        // Connect dropdown to original select
        dropdown.element.addEventListener('sg-dropdown-change', (e) => {
            typeSelect.value = e.detail.value;
            typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        // Mark as upgraded
        typeSelect.dataset.upgraded = 'true';
    }, null, 'worldbuilding-form', 'error', { action: 'enhance-type-dropdown' });
}

/**
 * Enhance form validation with standardized components
 * @param {HTMLElement} form - The worldbuilding form element
 */
function enhanceFormValidation(form) {
    return tryCatch(() => {
        // Override form submission
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = function(e) {
            e.preventDefault();
            
            // Validate all form inputs
            const isValid = validateWorldElementForm();
            
            if (isValid) {
                // Call original submit handler if it exists
                if (typeof originalSubmit === 'function') {
                    originalSubmit.call(this, e);
                } else {
                    // Fallback - try to call the global add world element function
                    if (typeof WorldBuilding?.addWorldElement === 'function') {
                        WorldBuilding.addWorldElement();
                    } else {
                        console.error('Cannot find worldbuilding form submission handler');
                    }
                }
            }
        };
    }, null, 'worldbuilding-form', 'error', { action: 'enhance-validation' });
}

/**
 * Validate the worldbuilding form using component validation
 * @returns {boolean} True if the form is valid, false otherwise
 */
function validateWorldElementForm() {
    return tryCatch(() => {
        const form = document.getElementById('worldElementForm');
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
        const nameField = form.querySelector('#elementName');
        if (nameField && !nameField.value.trim()) {
            isValid = false;
            const nameContainer = nameField.closest('.sg-form-field');
            if (nameContainer) {
                nameContainer.classList.add('sg-form-field-error');
                const errorElement = nameContainer.querySelector('.sg-form-error') || document.createElement('div');
                errorElement.className = 'sg-form-error';
                errorElement.textContent = 'Element name is required';
                nameContainer.appendChild(errorElement);
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
    }, null, 'worldbuilding-form', 'error', { action: 'validate-form' }, false); // Return false on error
}

// Initialize the worldbuilding form upgrade
initializeWorldbuildingFormUpgrade();
