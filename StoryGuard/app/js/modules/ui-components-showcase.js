/**
 * UI Components Showcase
 * 
 * This module demonstrates the standardized UI components by adding
 * a showcase panel to the application that users can interact with.
 */

import { tryCatch, tryCatchAsync } from './error-handling-util.js';

/**
 * Initialize the UI components showcase
 */
export function initializeComponentsShowcase() {
    document.addEventListener('DOMContentLoaded', tryCatch(() => {
        console.log('Preparing UI components showcase...');
        checkComponentsAndCreateShowcase();
    }, null, 'ui-showcase', 'error', { action: 'init' }));
    
    window.addEventListener('storyguard:app-ready', tryCatch(() => {
        // Check if already initialized
        if (!document.getElementById('ui-components-showcase')) {
            checkComponentsAndCreateShowcase();
        }
    }, null, 'ui-showcase', 'error', { action: 'init-on-app-ready' }));
}

/**
 * Check if components are initialized and create the showcase
 */
function checkComponentsAndCreateShowcase() {
    return tryCatch(() => {
        // Check every 100ms if the UI components are initialized
        const checkInterval = setInterval(() => {
            if (window.UIManager?.componentsInitialized) {
                clearInterval(checkInterval);
                createComponentShowcase();
            }
        }, 100);
        
        // Timeout after 5 seconds to prevent infinite checking
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('Timed out waiting for UI components to initialize');
        }, 5000);
    }, null, 'ui-showcase', 'error', { action: 'check-components' });
}

/**
 * Create the component showcase panel
 */
function createComponentShowcase() {
    return tryCatchAsync(async () => {
        // Get references we need
        const UIManager = window.UIManager;
        const container = document.querySelector('.container');
        
        if (!UIManager || !container) {
            console.error('Required elements not found for showcase');
            return;
        }
        
        // Create showcase button to toggle visibility
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.bottom = '20px';
        buttonContainer.style.right = '20px';
        buttonContainer.style.zIndex = '9999';
        
        const showcaseButton = UIManager.createButton({
            content: 'UI Components',
            variant: 'primary',
            size: 'default',
            parent: buttonContainer,
            onClick: () => toggleShowcasePanel()
        });
        
        document.body.appendChild(buttonContainer);
        
        // Create the showcase panel (initially hidden)
        const showcasePanel = document.createElement('div');
        showcasePanel.id = 'ui-components-showcase';
        showcasePanel.className = 'ui-components-showcase';
        showcasePanel.style.display = 'none';
        showcasePanel.style.position = 'fixed';
        showcasePanel.style.top = '50%';
        showcasePanel.style.left = '50%';
        showcasePanel.style.transform = 'translate(-50%, -50%)';
        showcasePanel.style.backgroundColor = '#fff';
        showcasePanel.style.padding = '20px';
        showcasePanel.style.borderRadius = '8px';
        showcasePanel.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        showcasePanel.style.zIndex = '10000';
        showcasePanel.style.width = '80%';
        showcasePanel.style.maxWidth = '800px';
        showcasePanel.style.maxHeight = '80vh';
        showcasePanel.style.overflow = 'auto';
        
        // Create showcase content
        const showcaseContent = document.createElement('div');
        showcaseContent.innerHTML = `
            <h2 style="margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee;">UI Components Showcase</h2>
            <p>This panel demonstrates the new standardized UI components that have been implemented in StoryGuard.</p>
            
            <div style="margin: 20px 0;">
                <h3>Button Component</h3>
                <div class="component-demo" id="button-demo" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>
            </div>
            
            <div style="margin: 20px 0;">
                <h3>Form Input Component</h3>
                <div class="component-demo" id="input-demo"></div>
            </div>
            
            <div style="margin: 20px 0;">
                <h3>Dropdown Component</h3>
                <div class="component-demo" id="dropdown-demo"></div>
            </div>
            
            <div style="margin: 20px 0;">
                <h3>Card Component</h3>
                <div class="component-demo" id="card-demo" style="display: flex; gap: 20px; flex-wrap: wrap;"></div>
            </div>
            
            <div style="margin: 20px 0;">
                <h3>Modal Component</h3>
                <div class="component-demo" id="modal-demo"></div>
            </div>
        `;
        
        showcasePanel.appendChild(showcaseContent);
        
        // Add close button
        const closeButton = UIManager.createButton({
            content: 'Close',
            variant: 'primary',
            onClick: () => toggleShowcasePanel(false)
        });
        
        // Add close button container
        const closeContainer = document.createElement('div');
        closeContainer.style.textAlign = 'right';
        closeContainer.style.marginTop = '20px';
        closeContainer.style.paddingTop = '10px';
        closeContainer.style.borderTop = '1px solid #eee';
        closeContainer.appendChild(closeButton.element);
        
        showcasePanel.appendChild(closeContainer);
        
        // Add backdrop for the showcase
        const showcaseBackdrop = document.createElement('div');
        showcaseBackdrop.id = 'ui-components-showcase-backdrop';
        showcaseBackdrop.style.position = 'fixed';
        showcaseBackdrop.style.top = '0';
        showcaseBackdrop.style.left = '0';
        showcaseBackdrop.style.width = '100%';
        showcaseBackdrop.style.height = '100%';
        showcaseBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        showcaseBackdrop.style.zIndex = '9999';
        showcaseBackdrop.style.display = 'none';
        
        // Close showcase when clicking backdrop
        showcaseBackdrop.addEventListener('click', () => toggleShowcasePanel(false));
        
        // Add panel and backdrop to document
        document.body.appendChild(showcaseBackdrop);
        document.body.appendChild(showcasePanel);
        
        // Populate the showcase with component examples
        populateComponentExamples();
        
        console.log('UI components showcase ready');
    }, null, 'ui-showcase', 'error', { action: 'create-showcase' });
}

/**
 * Toggle the visibility of the showcase panel
 * @param {boolean} [show] - If provided, force showing or hiding
 */
function toggleShowcasePanel(show) {
    return tryCatch(() => {
        const panel = document.getElementById('ui-components-showcase');
        const backdrop = document.getElementById('ui-components-showcase-backdrop');
        
        if (!panel || !backdrop) return;
        
        const newDisplay = show !== undefined ? (show ? 'block' : 'none') : 
                           panel.style.display === 'none' ? 'block' : 'none';
        
        panel.style.display = newDisplay;
        backdrop.style.display = newDisplay;
    }, null, 'ui-showcase', 'error', { action: 'toggle-panel' });
}

/**
 * Populate the showcase with component examples
 */
function populateComponentExamples() {
    return tryCatchAsync(async () => {
        const UIManager = window.UIManager;
        
        // 1. Button examples
        const buttonDemo = document.getElementById('button-demo');
        if (buttonDemo) {
            // Default button
            const defaultButton = UIManager.createButton({
                content: 'Default Button',
                onClick: () => window.notificationManager?.showInfo('Default button clicked')
            });
            
            // Primary button
            const primaryButton = UIManager.createButton({
                content: 'Primary Button',
                variant: 'primary',
                onClick: () => window.notificationManager?.showInfo('Primary button clicked')
            });
            
            // Danger button
            const dangerButton = UIManager.createButton({
                content: 'Danger Button',
                variant: 'danger',
                onClick: () => window.notificationManager?.showInfo('Danger button clicked')
            });
            
            // Text button
            const textButton = UIManager.createButton({
                content: 'Text Button',
                variant: 'text',
                onClick: () => window.notificationManager?.showInfo('Text button clicked')
            });
            
            // Loading button
            const loadingButton = UIManager.createButton({
                content: 'Loading Button',
                variant: 'primary',
                onClick: (e, btn) => {
                    btn.setLoading(true);
                    setTimeout(() => btn.setLoading(false), 2000);
                }
            });
            
            // Add to container
            buttonDemo.appendChild(defaultButton.element);
            buttonDemo.appendChild(primaryButton.element);
            buttonDemo.appendChild(dangerButton.element);
            buttonDemo.appendChild(textButton.element);
            buttonDemo.appendChild(loadingButton.element);
        }
        
        // 2. Form Input examples
        const inputDemo = document.getElementById('input-demo');
        if (inputDemo) {
            // Text input
            const textInput = UIManager.createInput({
                label: 'Text Input',
                placeholder: 'Enter text',
                helpText: 'This is a standard text input',
                parent: inputDemo
            });
            
            // Required input
            const requiredInput = UIManager.createInput({
                label: 'Required Input',
                placeholder: 'This field is required',
                required: true,
                parent: inputDemo
            });
            
            // Number input with validation
            const numberInput = UIManager.createInput({
                label: 'Number Input',
                type: 'number',
                min: 0,
                max: 100,
                placeholder: 'Enter a number',
                helpText: 'Value between 0-100',
                validation: {
                    min: 0,
                    max: 100,
                    isNumber: true
                },
                parent: inputDemo
            });
            
            // Input with error
            const errorInput = UIManager.createInput({
                label: 'Input with Error',
                value: 'Invalid value',
                error: 'This value is invalid',
                parent: inputDemo
            });
        }
        
        // 3. Dropdown examples
        const dropdownDemo = document.getElementById('dropdown-demo');
        if (dropdownDemo) {
            // Simple dropdown
            const simpleDropdown = UIManager.createDropdown({
                label: 'Simple Dropdown',
                options: [
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                    { value: 'option3', label: 'Option 3' }
                ],
                parent: dropdownDemo
            });
            
            // Dropdown with preselected value
            const valueDropdown = UIManager.createDropdown({
                label: 'Preselected Value',
                options: [
                    { value: 'protagonist', label: 'Protagonist' },
                    { value: 'antagonist', label: 'Antagonist' },
                    { value: 'supporting', label: 'Supporting Character' }
                ],
                value: 'antagonist',
                parent: dropdownDemo
            });
            
            // Searchable dropdown
            const searchableDropdown = UIManager.createDropdown({
                label: 'Searchable Dropdown',
                options: [
                    { value: 'fantasy', label: 'Fantasy' },
                    { value: 'scifi', label: 'Science Fiction' },
                    { value: 'mystery', label: 'Mystery' },
                    { value: 'romance', label: 'Romance' },
                    { value: 'horror', label: 'Horror' },
                    { value: 'thriller', label: 'Thriller' },
                    { value: 'western', label: 'Western' },
                    { value: 'historical', label: 'Historical Fiction' }
                ],
                searchable: true,
                parent: dropdownDemo
            });
            
            // Multi-select dropdown
            const multiDropdown = UIManager.createDropdown({
                label: 'Multi-Select Dropdown',
                options: [
                    { value: 'brave', label: 'Brave' },
                    { value: 'intelligent', label: 'Intelligent' },
                    { value: 'loyal', label: 'Loyal' },
                    { value: 'charismatic', label: 'Charismatic' },
                    { value: 'cunning', label: 'Cunning' }
                ],
                multiple: true,
                parent: dropdownDemo
            });
        }
        
        // 4. Card examples
        const cardDemo = document.getElementById('card-demo');
        if (cardDemo) {
            // Simple card
            const simpleCard = UIManager.createCard({
                title: 'Simple Card',
                content: 'This is a basic card with just a title and content.',
                elevation: 1
            });
            
            // Card with image
            const imageCard = UIManager.createCard({
                title: 'Character Profile',
                subtitle: 'Protagonist',
                image: 'https://via.placeholder.com/300x200?text=Character',
                content: 'A brave hero who embarks on a dangerous quest to save their world from destruction.',
                elevation: 2,
                actions: [
                    {
                        text: 'Edit',
                        onClick: () => window.notificationManager?.showInfo('Edit clicked')
                    },
                    {
                        text: 'Delete',
                        variant: 'danger',
                        onClick: () => window.notificationManager?.showInfo('Delete clicked')
                    }
                ]
            });
            
            // Collapsible card
            const collapsibleCard = UIManager.createCard({
                title: 'Collapsible Card',
                subtitle: 'Click the arrow to collapse',
                content: 'This card can be collapsed to save space. It is useful for sections that are not always needed.',
                collapsible: true,
                elevation: 3
            });
            
            // Add to container
            cardDemo.appendChild(simpleCard.element);
            cardDemo.appendChild(imageCard.element);
            cardDemo.appendChild(collapsibleCard.element);
        }
        
        // 5. Modal examples
        const modalDemo = document.getElementById('modal-demo');
        if (modalDemo) {
            // Modal demo button
            const modalButton = UIManager.createButton({
                content: 'Open Modal',
                variant: 'primary',
                onClick: () => showDemoModal()
            });
            
            // Confirmation demo button
            const confirmButton = UIManager.createButton({
                content: 'Show Confirmation',
                variant: 'primary',
                onClick: () => showDemoConfirmation()
            });
            
            // Add buttons to container
            modalDemo.appendChild(modalButton.element);
            modalDemo.appendChild(document.createTextNode(' '));
            modalDemo.appendChild(confirmButton.element);
        }
    }, null, 'ui-showcase', 'error', { action: 'populate-examples' });
}

/**
 * Show a demo modal dialog
 */
function showDemoModal() {
    return tryCatch(() => {
        const UIManager = window.UIManager;
        
        // Create a modal with various components inside
        const modal = UIManager.createModal({
            title: 'Sample Modal',
            size: 'default',
            content: `
                <div style="padding: 10px 0;">
                    <p>This is a demonstration of the Modal component. It can contain any content including other components.</p>
                    <div id="modal-inner-content"></div>
                </div>
            `,
            buttons: [
                {
                    text: 'Save Changes',
                    variant: 'primary',
                    onClick: () => {
                        window.notificationManager?.showSuccess('Changes saved!');
                        modal.close();
                    }
                },
                {
                    text: 'Cancel',
                    variant: 'text',
                    onClick: () => modal.close()
                }
            ]
        });
        
        // Add to document and open
        document.body.appendChild(modal.element);
        modal.open();
        
        // Add some components inside the modal
        setTimeout(() => {
            const innerContent = document.getElementById('modal-inner-content');
            if (innerContent) {
                // Add a form input
                const input = UIManager.createInput({
                    label: 'Sample Input',
                    placeholder: 'Enter value',
                    parent: innerContent
                });
                
                // Add a dropdown
                const dropdown = UIManager.createDropdown({
                    label: 'Sample Dropdown',
                    options: [
                        { value: 'option1', label: 'Option 1' },
                        { value: 'option2', label: 'Option 2' },
                        { value: 'option3', label: 'Option 3' }
                    ],
                    parent: innerContent
                });
            }
        }, 100);
    }, null, 'ui-showcase', 'error', { action: 'show-demo-modal' });
}

/**
 * Show a demo confirmation dialog
 */
function showDemoConfirmation() {
    return tryCatchAsync(async () => {
        const UIManager = window.UIManager;
        
        const result = await UIManager.showConfirmation(
            'Confirm Action',
            'This is a demonstration of the confirmation dialog. Would you like to proceed?',
            {
                confirmText: 'Yes, Proceed',
                cancelText: 'No, Cancel'
            }
        );
        
        if (result) {
            window.notificationManager?.showSuccess('Action confirmed!');
        } else {
            window.notificationManager?.showInfo('Action cancelled.');
        }
    }, null, 'ui-showcase', 'error', { action: 'show-demo-confirmation' });
}

// Initialize the showcase
initializeComponentsShowcase();
