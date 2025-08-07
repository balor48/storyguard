/**
 * UI Components Integration
 * 
 * This file initializes the UI component system and integrates it with the existing application.
 * It provides a bridge between the older UI code and the new standardized components.
 */

// Import the UI components and integration functions
import { integrateWithUIManager, initializeComponentStyles } from './ui/index.js';
import { tryCatch, tryCatchAsync } from './error-handling-util.js';

// Import managers
import notificationManager from './NotificationManager.js';

// Main integration function
export function initializeUIComponents() {
    return tryCatch(() => {
        // Initialize component styles
        initializeComponentStyles();
        
        // Setup a retry mechanism to wait for UIManager
        const attemptIntegration = (retryCount = 0, maxRetries = 10) => {
            // Get the global UIManager instance
            const UIManager = window.UIManager || null;
            
            if (!UIManager) {
                if (retryCount < maxRetries) {
                    console.log(`UIManager not available yet, will retry in ${500 * (retryCount + 1)}ms (attempt ${retryCount + 1}/${maxRetries})`);
                    // Retry with exponential backoff
                    setTimeout(() => attemptIntegration(retryCount + 1, maxRetries), 500 * (retryCount + 1));
                } else {
                    console.error('UIManager not available after maximum retry attempts');
                }
                return false;
            }
            
            // Integrate components with UIManager
            const integrationSuccess = integrateWithUIManager(UIManager);
            
            if (integrationSuccess) {
                console.log('UI components successfully integrated with UIManager');
                
                // Make components available globally for legacy code
                window.SGComponents = UIManager.components;
                
                // Mark integration as complete
                UIManager.componentsInitialized = true;
                
                // Notify success
                const notificationInstance = window.notificationManager || notificationManager;
                if (notificationInstance) {
                    notificationInstance.showInfo('UI components initialized', '', 2000);
                }
                
                return true;
            } else {
                console.error('Failed to integrate UI components with UIManager');
                return false;
            }
        };
        
        // Start the integration attempt
        return attemptIntegration();
    }, null, 'ui-components', 'error', {
        action: 'initialize'
    });
}

/**
 * Upgrade existing UI elements to use standardized components
 * This can be called on specific containers to upgrade their UI elements
 * @param {HTMLElement} container - The container element to upgrade components within
 * @param {Object} options - Upgrade options
 */
export function upgradeExistingUI(container = document, options = {}) {
    return tryCatch(() => {
        // Get UIManager with components
        const UIManager = window.UIManager;
        if (!UIManager || !UIManager.componentsInitialized) {
            console.warn('UI components not initialized, cannot upgrade UI');
            return false;
        }
        
        // Upgrade buttons
        if (options.buttons !== false) {
            upgradeButtons(container, UIManager);
        }
        
        // Upgrade form inputs
        if (options.inputs !== false) {
            upgradeInputs(container, UIManager);
        }
        
        // Upgrade select dropdowns
        if (options.dropdowns !== false) {
            upgradeDropdowns(container, UIManager);
        }
        
        // Upgrade cards/panels
        if (options.cards !== false) {
            upgradeCards(container, UIManager);
        }
        
        return true;
    }, null, 'ui-components', 'error', {
        action: 'upgrade-ui',
        container: container.id || container.className || 'document'
    });
}

/**
 * Upgrade buttons to use Button component
 * @private
 * @param {HTMLElement} container - Container element
 * @param {Object} UIManager - UIManager instance
 */
function upgradeButtons(container, UIManager) {
    // Find buttons with specific class patterns that should be upgraded
    const buttons = container.querySelectorAll('.btn, .button, [data-ui-role="button"]');
    
    buttons.forEach(button => {
        // Skip already upgraded buttons
        if (button.dataset.upgraded || button.classList.contains('sg-button')) return;
        
        // Determine button type/variant based on existing classes
        let variant = 'default';
        if (button.classList.contains('btn-primary') || button.classList.contains('primary')) {
            variant = 'primary';
        } else if (button.classList.contains('btn-danger') || button.classList.contains('danger')) {
            variant = 'danger';
        } else if (button.classList.contains('btn-text') || button.classList.contains('text')) {
            variant = 'text';
        }
        
        // Determine button size
        let size = 'default';
        if (button.classList.contains('btn-sm') || button.classList.contains('small')) {
            size = 'small';
        } else if (button.classList.contains('btn-lg') || button.classList.contains('large')) {
            size = 'large';
        }
        
        // Create options for Button component
        const options = {
            element: button,
            variant: variant,
            size: size,
            content: button.innerHTML,
            className: `sg-button sg-button-${variant} sg-button-${size}`
        };
        
        // Add loading state if present
        if (button.classList.contains('loading') || button.classList.contains('btn-loading')) {
            options.loading = true;
        }
        
        // Create Button component
        const buttonComponent = new UIManager.components.Button(options);
        
        // Mark as upgraded
        button.dataset.upgraded = 'true';
    });
}

/**
 * Upgrade inputs to use FormInput component
 * @private
 * @param {HTMLElement} container - Container element
 * @param {Object} UIManager - UIManager instance
 */
function upgradeInputs(container, UIManager) {
    // Find form input fields that should be upgraded
    const inputs = container.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea');
    
    inputs.forEach(input => {
        // Skip already upgraded inputs
        if (input.dataset.upgraded || input.parentElement.classList.contains('sg-form-field')) return;
        
        // Find associated label if any
        let label = null;
        if (input.id) {
            label = container.querySelector(`label[for="${input.id}"]`);
        } else {
            // Check if input is inside a label
            const parentLabel = input.closest('label');
            if (parentLabel) {
                // Create a unique ID for the input
                input.id = `input-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                label = parentLabel;
            }
        }
        
        // Get label text
        const labelText = label ? label.textContent : '';
        
        // Check if required
        const required = input.hasAttribute('required');
        
        // Create wrapper if needed
        let wrapper = input.parentElement;
        if (!wrapper || !wrapper.classList.contains('form-group')) {
            // If input is directly inside a label, move it outside
            if (wrapper && wrapper.tagName === 'LABEL') {
                const parentElem = wrapper.parentElement;
                wrapper = document.createElement('div');
                parentElem.insertBefore(wrapper, input.parentElement.nextSibling);
                wrapper.appendChild(input);
            } else {
                wrapper = document.createElement('div');
                input.parentElement.insertBefore(wrapper, input);
                wrapper.appendChild(input);
            }
        }
        
        // Create options for FormInput component
        const options = {
            element: input,
            label: labelText,
            required: required,
            parent: wrapper,
            id: input.id || `input-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: input.name || '',
            placeholder: input.placeholder || '',
            value: input.value || '',
            type: input.type || 'text'
        };
        
        // If label exists, remove it as the component will create its own
        if (label && label !== wrapper) {
            label.parentElement.removeChild(label);
        }
        
        // Create FormInput component
        const inputComponent = new UIManager.components.FormInput(options);
        
        // Mark as upgraded
        input.dataset.upgraded = 'true';
    });
}

/**
 * Upgrade select dropdowns to use Dropdown component
 * @private
 * @param {HTMLElement} container - Container element
 * @param {Object} UIManager - UIManager instance
 */
function upgradeDropdowns(container, UIManager) {
    // Find select elements that should be upgraded
    const selects = container.querySelectorAll('select');
    
    selects.forEach(select => {
        // Skip already upgraded selects
        if (select.dataset.upgraded || select.style.display === 'none') return;
        
        // Find associated label if any
        let label = null;
        if (select.id) {
            label = container.querySelector(`label[for="${select.id}"]`);
        }
        
        // Get label text
        const labelText = label ? label.textContent : '';
        
        // Check if required
        const required = select.hasAttribute('required');
        
        // Get placeholder from first option if it's disabled or empty
        let placeholder = 'Select an option';
        if (select.options.length > 0 && 
            (select.options[0].disabled || select.options[0].value === '')) {
            placeholder = select.options[0].textContent;
        }
        
        // Convert options to array format needed by Dropdown
        const options = [];
        for (let i = 0; i < select.options.length; i++) {
            // Skip first option if it's just a placeholder
            if (i === 0 && 
                (select.options[i].disabled || select.options[i].value === '')) {
                continue;
            }
            
            options.push({
                value: select.options[i].value,
                label: select.options[i].textContent
            });
        }
        
        // Get current value
        const currentValue = select.value !== '' ? select.value : null;
        
        // Create wrapper if needed
        let wrapper = select.parentElement;
        if (!wrapper.classList.contains('form-group')) {
            wrapper = document.createElement('div');
            select.parentElement.insertBefore(wrapper, select);
            wrapper.appendChild(select);
        }
        
        // Create options for Dropdown component
        const dropdownOptions = {
            // Don't use select element directly, we'll hide it
            placeholder: placeholder,
            options: options,
            value: currentValue,
            multiple: select.multiple,
            required: required,
            label: labelText,
            name: select.name || '',
            id: select.id || `dropdown-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            parent: wrapper
        };
        
        // Hide the original select element instead of removing it
        select.style.display = 'none';
        
        // If label exists, remove it as the component will create its own
        if (label) {
            label.parentElement.removeChild(label);
        }
        
        // Create Dropdown component
        const dropdownComponent = new UIManager.components.Dropdown(dropdownOptions);
        
        // Connect dropdown changes to original select for compatibility
        dropdownComponent.element.addEventListener('sg-dropdown-change', (e) => {
            // Update original select value
            if (dropdownComponent.multiple) {
                // For multiple select, update all options
                Array.from(select.options).forEach(option => {
                    option.selected = e.detail.value.includes(option.value);
                });
            } else {
                select.value = e.detail.value;
            }
            
            // Trigger change event on original select
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        // Mark as upgraded
        select.dataset.upgraded = 'true';
    });
}

/**
 * Upgrade cards/panels to use Card component
 * @private
 * @param {HTMLElement} container - Container element
 * @param {Object} UIManager - UIManager instance
 */
function upgradeCards(container, UIManager) {
    // Find card/panel elements that should be upgraded
    const cards = container.querySelectorAll('.card, .panel');
    
    cards.forEach(card => {
        // Skip already upgraded cards
        if (card.dataset.upgraded || card.classList.contains('sg-card')) return;
        
        // Get card title, content, and footer if they exist
        let title = '';
        let subtitle = '';
        let content = null;
        let footer = null;
        let actions = [];
        
        // Extract the title
        const titleElement = card.querySelector('.card-title, .panel-title, .card-header h3, .panel-heading h3');
        if (titleElement) {
            title = titleElement.textContent;
        }
        
        // Extract subtitle
        const subtitleElement = card.querySelector('.card-subtitle, .panel-subtitle');
        if (subtitleElement) {
            subtitle = subtitleElement.textContent;
        }
        
        // Extract content
        const contentElement = card.querySelector('.card-body, .panel-body, .card-content');
        if (contentElement) {
            content = contentElement.innerHTML;
        } else {
            // If no specific content element, use all content except header and footer
            const fragment = document.createDocumentFragment();
            let hasContent = false;
            
            Array.from(card.children).forEach(child => {
                if (!child.classList.contains('card-header') && 
                    !child.classList.contains('panel-heading') &&
                    !child.classList.contains('card-footer') &&
                    !child.classList.contains('panel-footer')) {
                    fragment.appendChild(child.cloneNode(true));
                    hasContent = true;
                }
            });
            
            if (hasContent) {
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(fragment);
                content = tempDiv.innerHTML;
            }
        }
        
        // Extract footer
        const footerElement = card.querySelector('.card-footer, .panel-footer');
        if (footerElement) {
            // Look for buttons in the footer
            const footerButtons = footerElement.querySelectorAll('button, .btn, a.button');
            
            if (footerButtons.length > 0) {
                // Create actions array from buttons
                footerButtons.forEach(button => {
                    // Determine button variant based on classes
                    let variant = 'default';
                    if (button.classList.contains('btn-primary') || button.classList.contains('primary')) {
                        variant = 'primary';
                    } else if (button.classList.contains('btn-danger') || button.classList.contains('danger')) {
                        variant = 'danger';
                    }
                    
                    actions.push({
                        text: button.textContent,
                        variant: variant
                    });
                });
            } else {
                // Use entire footer content
                footer = footerElement.innerHTML;
            }
        }
        
        // Create options for Card component
        const options = {
            element: card,
            title: title,
            subtitle: subtitle,
            content: content,
            footer: footer,
            actions: actions
        };
        
        // Create Card component
        const cardComponent = new UIManager.components.Card(options);
        
        // Mark as upgraded
        card.dataset.upgraded = 'true';
    });
}

// Export upgrade functions for individual use
export {
    upgradeButtons,
    upgradeInputs,
    upgradeDropdowns,
    upgradeCards
};
