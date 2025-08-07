/**
 * UI Components Index
 * 
 * This file exports all standardized UI components and provides integration
 * with the existing UIManager functionality.
 */

// Export core components
export { UIComponent } from './UIComponentCore.js';
export { Button } from './Button.js';
export { FormInput } from './FormInput.js';
export { Modal } from './Modal.js';
export { Card } from './Card.js';
export { Dropdown } from './Dropdown.js';

// Import error handling utilities
import { tryCatch } from '../error-handling-util.js';

/**
 * Integrate UI components with the existing UIManager
 * @param {Object} UIManager - The existing UIManager instance
 */
export function integrateWithUIManager(UIManager) {
    if (!UIManager) {
        console.error('UIManager not provided for integration');
        return false;
    }
    
    // Add component references to UIManager
    UIManager.components = {
        Button,
        FormInput,
        Modal,
        Card,
        Dropdown,
        UIComponent
    };
    
    // Add component creation methods to UIManager
    UIManager.createButton = (options) => new Button(options);
    UIManager.createInput = (options) => new FormInput(options);
    UIManager.createModal = (options) => new Modal(options);
    UIManager.createCard = (options) => new Card(options);
    UIManager.createDropdown = (options) => new Dropdown(options);
    
    // Enhance existing UIManager methods with components where appropriate
    enhanceUIManagerWithComponents(UIManager);
    
    return true;
}

/**
 * Enhance existing UIManager methods with UI components
 * @param {Object} UIManager - The UIManager instance to enhance
 */
function enhanceUIManagerWithComponents(UIManager) {
    // Store original methods for use by the enhanced versions
    const originalShowModal = UIManager.showModal;
    const originalCreatePagination = UIManager.createPagination;
    const originalShowConfirmation = UIManager.showConfirmation;
    
    // Enhance showModal to use our Modal component
    UIManager.showModal = tryCatch((title, content, options = {}) => {
        // If original function is called directly, preserve behavior
        if (options?.useOriginal) {
            return originalShowModal.call(UIManager, title, content, options);
        }
        
        // Create modal with our component
        const modal = new Modal({
            title,
            content,
            ...options,
            buttons: options.buttons || [
                {
                    text: options.closeButtonText || 'Close',
                    variant: 'secondary',
                    onClick: () => modal.close()
                }
            ]
        });
        
        // Add to document body if not already added
        if (!modal.element.parentNode) {
            document.body.appendChild(modal.element);
        }
        
        // Open the modal
        modal.open();
        
        return modal;
    }, null, 'ui-manager', 'error', { method: 'showModal' });
    
    // Enhance confirmation dialog to use our Modal component
    UIManager.showConfirmation = tryCatch((title, message, options = {}) => {
        // If original function is called directly, preserve behavior
        if (options?.useOriginal) {
            return originalShowConfirmation.call(UIManager, title, message, options);
        }
        
        return new Promise((resolve) => {
            // Create buttons based on options
            const buttons = [
                {
                    text: options.confirmText || 'Confirm',
                    variant: options.confirmVariant || 'primary',
                    onClick: () => {
                        modal.close();
                        resolve(true);
                    }
                },
                {
                    text: options.cancelText || 'Cancel',
                    variant: options.cancelVariant || 'secondary',
                    onClick: () => {
                        modal.close();
                        resolve(false);
                    }
                }
            ];
            
            // Create the modal
            const modal = new Modal({
                title,
                content: message,
                closable: options.closable !== false,
                buttons,
                ...options
            });
            
            // Add to document body
            document.body.appendChild(modal.element);
            
            // Open the modal
            modal.open();
            
            // Handle close without button click
            modal.element.addEventListener('sg-modal-close', () => {
                resolve(false); // Default to cancel if closed without clicking button
            }, { once: true });
        });
    }, null, 'ui-manager', 'error', { method: 'showConfirmation' });
    
    // Enhance pagination with our components when appropriate
    UIManager.createPagination = tryCatch((container, options = {}) => {
        // For now, keep using the original pagination system
        // We may enhance this in the future with our components
        return originalCreatePagination.call(UIManager, container, options);
    }, null, 'ui-manager', 'error', { method: 'createPagination' });
}

/**
 * Initialize UI components styles
 * Injects required CSS if not already present
 */
export function initializeComponentStyles() {
    // Only add styles if not already present
    if (!document.getElementById('sg-components-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'sg-components-styles';
        styleElement.textContent = `
            /* Dropdown Styles */
.sg-dropdown {
    position: relative;
    margin-bottom: 16px;
}
.sg-dropdown-container {
    position: relative;
}
.sg-dropdown-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    transition: border-color 0.2s ease;
}
.sg-dropdown-trigger:hover {
    border-color: #b0b0b0;
}
.sg-dropdown-trigger:focus {
    border-color: #4a86e8;
    outline: none;
    box-shadow: 0 0 0 2px rgba(74, 134, 232, 0.2);
}
.sg-dropdown-trigger-open {
    border-color: #4a86e8;
}
.sg-dropdown-trigger-content {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.sg-dropdown-arrow {
    margin-left: 8px;
    color: #777;
}
.sg-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 300px;
    background-color: #fff;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
    display: none;
    margin-top: 4px;
}
.sg-dropdown-search {
    padding: 8px;
    border-bottom: 1px solid #e8e8e8;
}
.sg-dropdown-search-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    font-size: 14px;
}
.sg-dropdown-options {
    max-height: 250px;
    overflow-y: auto;
}
.sg-dropdown-option {
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
}
.sg-dropdown-option:hover {
    background-color: #f5f5f5;
}
.sg-dropdown-option-selected {
    background-color: #e8f0fe;
    color: #1a73e8;
}
.sg-dropdown-option-highlighted {
    background-color: #f0f0f0;
}
.sg-dropdown-option-hidden {
    display: none;
}
.sg-dropdown-checkbox {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 1px solid #d0d0d0;
    border-radius: 3px;
    margin-right: 8px;
    position: relative;
}
.sg-dropdown-option-selected .sg-dropdown-checkbox::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 8px;
    height: 8px;
    background-color: #1a73e8;
    border-radius: 1px;
}
.sg-dropdown-disabled {
    opacity: 0.7;
    pointer-events: none;
    cursor: not-allowed;
    background-color: #f8f8f8;
}
            /* Button Styles */
            .sg-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 8px 16px;
                border-radius: 4px;
                border: 1px solid #d0d0d0;
                background-color: #f5f5f5;
                color: #333;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                outline: none;
                position: relative;
                overflow: hidden;
            }
            .sg-button:hover {
                background-color: #e8e8e8;
            }
            .sg-button:active {
                background-color: #d8d8d8;
            }
            .sg-button-primary {
                background-color: #4a86e8;
                color: white;
                border-color: #3a76d8;
            }
            .sg-button-primary:hover {
                background-color: #3a76d8;
            }
            .sg-button-danger {
                background-color: #e74c3c;
                color: white;
                border-color: #c0392b;
            }
            .sg-button-danger:hover {
                background-color: #c0392b;
            }
            .sg-button-text {
                background-color: transparent;
                border-color: transparent;
                padding: 6px 8px;
            }
            .sg-button-text:hover {
                background-color: rgba(0,0,0,0.05);
            }
            .sg-button-small {
                padding: 4px 8px;
                font-size: 12px;
            }
            .sg-button-large {
                padding: 12px 24px;
                font-size: 16px;
            }
            .sg-button-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .sg-button-icon-left {
                margin-right: 8px;
            }
            .sg-button-icon-right {
                margin-left: 8px;
            }
            .sg-button-loading {
                opacity: 0.7;
                pointer-events: none;
            }
            .sg-button-spinner {
                display: inline-block;
                width: 12px;
                height: 12px;
                margin-right: 8px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
            }
            
            /* Form Input Styles */
            .sg-form-field {
                margin-bottom: 16px;
                position: relative;
            }
            .sg-form-label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                font-size: 14px;
            }
            .sg-form-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d0d0d0;
                border-radius: 4px;
                font-size: 14px;
                transition: border-color 0.2s ease;
                background-color: #fff;
            }
            .sg-form-input:focus {
                border-color: #4a86e8;
                outline: none;
                box-shadow: 0 0 0 2px rgba(74, 134, 232, 0.2);
            }
            .sg-form-help-text {
                font-size: 12px;
                color: #777;
                margin-top: 4px;
            }
            .sg-form-error {
                font-size: 12px;
                color: #e74c3c;
                margin-top: 4px;
            }
            .sg-form-field-error .sg-form-input {
                border-color: #e74c3c;
            }
            .sg-form-field-error .sg-form-input:focus {
                box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
            }
            .sg-required-indicator {
                color: #e74c3c;
                margin-left: 2px;
            }
            
            /* Modal Styles */
            .sg-modal-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .sg-modal-container-open {
                opacity: 1;
                visibility: visible;
            }
            .sg-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: -1;
            }
            .sg-modal {
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                width: 500px;
                max-width: 90%;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                transform: translateY(20px);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            .sg-modal-open {
                transform: translateY(0);
                opacity: 1;
            }
            .sg-modal-small {
                width: 300px;
            }
            .sg-modal-large {
                width: 800px;
            }
            .sg-modal-fullscreen {
                width: 90%;
                height: 90vh;
            }
            .sg-modal-header {
                padding: 16px 20px;
                border-bottom: 1px solid #e8e8e8;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .sg-modal-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            .sg-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s ease;
            }
            .sg-modal-close:hover {
                opacity: 1;
            }
            .sg-modal-body {
                padding: 20px;
                overflow-y: auto;
            }
            .sg-modal-body-scroll {
                max-height: 60vh;
                overflow-y: auto;
            }
            .sg-modal-footer {
                padding: 16px 20px;
                border-top: 1px solid #e8e8e8;
                display: flex;
                justify-content: flex-end;
                gap: 8px;
            }
            
            /* Card Styles */
            .sg-card {
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                position: relative;
                transition: box-shadow 0.3s ease, transform 0.3s ease;
            }
            .sg-card-elevation-0 {
                box-shadow: none;
                border: 1px solid #e8e8e8;
            }
            .sg-card-elevation-2 {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .sg-card-elevation-3 {
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }
            .sg-card-elevation-4 {
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            }
            .sg-card-elevation-5 {
                box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
            }
            .sg-card-image {
                width: 100%;
                position: relative;
                overflow: hidden;
            }
            .sg-card-image img {
                width: 100%;
                display: block;
            }
            .sg-card-image-left {
                display: flex;
                flex-direction: row;
            }
            .sg-card-image-left .sg-card-image {
                width: 30%;
                min-width: 120px;
            }
            .sg-card-image-left .sg-card-content {
                flex: 1;
            }
            .sg-card-image-right {
                display: flex;
                flex-direction: row-reverse;
            }
            .sg-card-image-right .sg-card-image {
                width: 30%;
                min-width: 120px;
            }
            .sg-card-image-right .sg-card-content {
                flex: 1;
            }
            .sg-card-header {
                padding: 16px 16px 8px 16px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .sg-card-title-container {
                flex: 1;
            }
            .sg-card-title {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            .sg-card-subtitle {
                margin: 4px 0 0 0;
                font-size: 14px;
                color: #777;
            }
            .sg-card-content {
                padding: 16px;
                flex: 1 1 auto;
            }
            .sg-card-footer {
                padding: 8px 16px 16px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .sg-card-actions {
                display: flex;
                gap: 8px;
            }
            .sg-card-footer-content {
                flex: 1;
            }
            .sg-card-clickable {
                cursor: pointer;
            }
            .sg-card-clickable:hover {
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }
            .sg-card-compact .sg-card-header {
                padding: 12px 12px 4px 12px;
            }
            .sg-card-compact .sg-card-content {
                padding: 8px 12px;
            }
            .sg-card-compact .sg-card-footer {
                padding: 4px 12px 12px 12px;
            }
            .sg-card-selected {
                box-shadow: 0 0 0 2px #4a86e8, 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .sg-card-collapse-button {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
                opacity: 0.5;
                transition: opacity 0.2s ease;
            }
            .sg-card-collapse-button:hover {
                opacity: 1;
            }
            
            /* Animation keyframes */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleElement);
    }
}
