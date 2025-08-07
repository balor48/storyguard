/**
 * Character Form Upgrade
 * 
 * This script upgrades the character form to use the standardized UI components.
 * It serves as an example of how to utilize the component system in existing forms.
 */

// Import required modules
import { upgradeExistingUI } from './ui-components-integration.js';
import { tryCatch } from './error-handling-util.js';

/**
 * Initialize the UI component upgrades for the character form
 */
export function initializeCharacterFormUpgrade() {
    document.addEventListener('DOMContentLoaded', tryCatch(() => {
        console.log('Waiting for UI components to initialize before upgrading character form...');
        
        // Wait for components to be initialized
        checkComponentsAndUpgrade();
    }, null, 'character-form', 'error', { action: 'init-upgrade' }));
    
    // Also listen for app-ready event in case DOMContentLoaded already happened
    window.addEventListener('storyguard:app-ready', tryCatch(() => {
        checkComponentsAndUpgrade();
    }, null, 'character-form', 'error', { action: 'init-upgrade-on-app-ready' }));
}

/**
 * Check if components are initialized and upgrade the form
 */
function checkComponentsAndUpgrade() {
    return tryCatch(() => {
        // Check every 100ms if the UI components are initialized
        const checkInterval = setInterval(() => {
            if (window.UIManager?.componentsInitialized) {
                clearInterval(checkInterval);
                upgradeCharacterForm();
            }
        }, 100);
        
        // Timeout after 5 seconds to prevent infinite checking
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('Timed out waiting for UI components to initialize');
        }, 5000);
    }, null, 'character-form', 'error', { action: 'check-components' });
}

/**
 * Upgrade the character form with standardized components
 */
function upgradeCharacterForm() {
    return tryCatch(async () => {
        console.log('Upgrading character form with standardized components...');
        
        // Get the character form element
        const characterForm = document.getElementById('characterForm');
        if (!characterForm) {
            console.warn('Character form not found, skipping upgrade');
            return;
        }
        
        // Upgrade all components in the form
        const result = await window.SGUpgradeUI.upgradeContainer(characterForm, {
            // Specify which types of components to upgrade
            buttons: true,
            inputs: true,
            dropdowns: true,
            cards: true
        });
        
        if (result) {
            console.log('Character form successfully upgraded with standardized components');
            enhanceFormFunctionality(characterForm);
        } else {
            console.error('Failed to upgrade character form');
        }
    }, null, 'character-form', 'error', { action: 'upgrade-form' });
}

/**
 * Enhance the character form with additional functionality
 * @param {HTMLElement} form - The character form element
 */
function enhanceFormFunctionality(form) {
    return tryCatch(() => {
        // Example: Convert character stats to upgraded inputs with validation
        const statsContainer = form.querySelector('.character-stats-container');
        if (statsContainer) {
            upgradeStatsInputs(statsContainer);
        }
        
        // Example: Create a new attachment card component for image uploads
        const imageSection = form.querySelector('#imageSection');
        if (imageSection) {
            addImageUploadCard(imageSection);
        }
        
        // Add form-wide validation
        enhanceFormValidation(form);
    }, null, 'character-form', 'error', { action: 'enhance-functionality' });
}

/**
 * Upgrade character stats inputs with standardized components
 * @param {HTMLElement} container - The stats container element
 */
function upgradeStatsInputs(container) {
    return tryCatch(() => {
        const statInputs = container.querySelectorAll('input[type="number"]');
        const UIManager = window.UIManager;
        
        statInputs.forEach(input => {
            // Skip already upgraded inputs
            if (input.dataset.upgraded) return;
            
            // Get parent element and label
            const parent = input.parentElement;
            const label = parent.querySelector('label')?.textContent || '';
            
            // Create FormInput component with validation
            const formInput = UIManager.createInput({
                element: input,
                label: label,
                type: 'number',
                min: 0,
                max: 100,
                validation: {
                    min: 0,
                    max: 100,
                    isNumber: true
                },
                helpText: 'Value between 0-100'
            });
            
            // Mark as upgraded
            input.dataset.upgraded = 'true';
        });
    }, null, 'character-form', 'error', { action: 'upgrade-stats-inputs' });
}

/**
 * Add image upload card component
 * @param {HTMLElement} container - The image section container
 */
function addImageUploadCard(container) {
    return tryCatch(() => {
        const UIManager = window.UIManager;
        
        // Create a card for image upload
        const card = UIManager.createCard({
            title: 'Character Image',
            subtitle: 'Upload or link to an image',
            content: document.getElementById('characterImage') || '<div id="imagePreview"></div>',
            actions: [
                {
                    text: 'Upload',
                    variant: 'primary',
                    onClick: () => {
                        // Trigger existing image upload function if available
                        if (typeof Characters?.uploadImage === 'function') {
                            Characters.uploadImage();
                        } else {
                            console.warn('Image upload function not available');
                        }
                    }
                },
                {
                    text: 'Remove',
                    variant: 'danger',
                    onClick: () => {
                        // Trigger existing image removal function if available
                        if (typeof Characters?.removeImage === 'function') {
                            Characters.removeImage();
                        } else {
                            // Fallback
                            const preview = document.getElementById('imagePreview');
                            if (preview) preview.innerHTML = '';
                            const imageUrl = document.getElementById('imageUrl');
                            if (imageUrl) imageUrl.value = '';
                        }
                    }
                }
            ]
        });
        
        // Replace existing content with the card
        container.innerHTML = '';
        container.appendChild(card.element);
    }, null, 'character-form', 'error', { action: 'add-image-card' });
}

/**
 * Enhance form validation with standardized components
 * @param {HTMLElement} form - The character form element
 */
function enhanceFormValidation(form) {
    return tryCatch(() => {
        // Override form submission
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = function(e) {
            e.preventDefault();
            
            // Validate all form inputs
            const isValid = validateCharacterForm();
            
            if (isValid) {
                // Call original submit handler if it exists
                if (typeof originalSubmit === 'function') {
                    originalSubmit.call(this, e);
                } else {
                    // Fallback - try to call the global add character function
                    if (typeof Characters?.addCharacter === 'function') {
                        Characters.addCharacter();
                    } else {
                        console.error('Cannot find character form submission handler');
                    }
                }
            }
        };
    }, null, 'character-form', 'error', { action: 'enhance-validation' });
}

/**
 * Validate the character form using component validation
 * @returns {boolean} True if the form is valid, false otherwise
 */
function validateCharacterForm() {
    return tryCatch(() => {
        const form = document.getElementById('characterForm');
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
    }, null, 'character-form', 'error', { action: 'validate-form' }, false);  // Return false on error
}

// Initialize the character form upgrade
initializeCharacterFormUpgrade();
