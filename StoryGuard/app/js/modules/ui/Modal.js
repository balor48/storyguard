/**
 * Modal.js
 * 
 * Standardized modal dialog component.
 * This provides consistent behavior, styling, and accessibility for all modals.
 */

import { UIComponent } from './UIComponentCore.js';
import { Button } from './Button.js';
import { tryCatch } from '../error-handling-util.js';

class Modal extends UIComponent {
    constructor(options = {}) {
        // Set default options for modal
        const modalOptions = {
            tag: 'div',
            className: 'sg-modal-container',
            ...options
        };
        
        super(modalOptions);
        
        // Modal-specific properties
        this.title = options.title || '';
        this.content = options.content || '';
        this.size = options.size || 'medium'; // small, medium, large, fullscreen
        this.closable = options.closable !== false; // Default to true
        this.backdrop = options.backdrop !== false; // Default to true
        this.centered = options.centered !== false; // Default to true
        this.animate = options.animate !== false; // Default to true
        this.buttons = options.buttons || [];
        this.width = options.width || null;
        this.height = options.height || null;
        this.contentScroll = options.contentScroll !== false; // Default to true
        
        // References to child elements
        this.modalElement = null;
        this.backdropElement = null;
        this.headerElement = null;
        this.titleElement = null;
        this.closeButton = null;
        this.bodyElement = null;
        this.footerElement = null;
        this.buttonComponents = [];
        
        // Flag to track if modal is open
        this.isOpen = false;
        
        // Create the modal structure
        this._initializeModal();
    }
    
    /**
     * Initialize the modal structure
     * @private
     */
    _initializeModal() {
        return tryCatch(() => {
            if (!this.element) return;
            
            // Create backdrop if enabled
            if (this.backdrop) {
                this._createBackdrop();
            }
            
            // Create modal element
            this._createModalElement();
            
            // Create header with title and close button
            this._createHeader();
            
            // Create body
            this._createBody();
            
            // Create footer with buttons
            this._createFooter();
            
            // Add event listeners for clicks outside to close
            this._setupEventListeners();
            
            // Set initial visibility
            this.element.style.display = 'none';
            
            return this;
        }, this, 'modal', 'error', { modalTitle: this.title });
    }
    
    /**
     * Create backdrop element
     * @private
     */
    _createBackdrop() {
        return tryCatch(() => {
            this.backdropElement = document.createElement('div');
            this.backdropElement.className = 'sg-modal-backdrop';
            
            // Add to container
            this.element.appendChild(this.backdropElement);
        }, null, 'modal', 'error', { modalTitle: this.title });
    }
    
    /**
     * Create modal element
     * @private
     */
    _createModalElement() {
        return tryCatch(() => {
            this.modalElement = document.createElement('div');
            this.modalElement.className = 'sg-modal';
            
            // Add size class
            this.modalElement.classList.add(`sg-modal-${this.size}`);
            
            // Add centered class if needed
            if (this.centered) {
                this.modalElement.classList.add('sg-modal-centered');
            }
            
            // Add animation class if needed
            if (this.animate) {
                this.modalElement.classList.add('sg-modal-animate');
            }
            
            // Set width and height if provided
            if (this.width) {
                this.modalElement.style.width = typeof this.width === 'number' ? `${this.width}px` : this.width;
                this.modalElement.style.maxWidth = '100%';
            }
            
            if (this.height) {
                this.modalElement.style.height = typeof this.height === 'number' ? `${this.height}px` : this.height;
                this.modalElement.style.maxHeight = '100%';
            }
            
            // Add to container
            this.element.appendChild(this.modalElement);
        }, null, 'modal', 'error', { modalTitle: this.title });
    }
    
    /**
     * Create header with title and close button
     * @private
     */
    _createHeader() {
        return tryCatch(() => {
            // Create header
            this.headerElement = document.createElement('div');
            this.headerElement.className = 'sg-modal-header';
            
            // Create title
            this.titleElement = document.createElement('h3');
            this.titleElement.className = 'sg-modal-title';
            this.titleElement.textContent = this.title;
            this.headerElement.appendChild(this.titleElement);
            
            // Create close button if modal is closable
            if (this.closable) {
                this.closeButton = document.createElement('button');
                this.closeButton.className = 'sg-modal-close';
                this.closeButton.innerHTML = '&times;';
                this.closeButton.setAttribute('aria-label', 'Close');
                this.closeButton.addEventListener('click', () => this.close());
                this.headerElement.appendChild(this.closeButton);
            }
            
            // Add header to modal
            this.modalElement.appendChild(this.headerElement);
        }, null, 'modal', 'error', { modalTitle: this.title });
    }
    
    /**
     * Create body element
     * @private
     */
    _createBody() {
        return tryCatch(() => {
            this.bodyElement = document.createElement('div');
            this.bodyElement.className = 'sg-modal-body';
            
            // Add content scroll class if needed
            if (this.contentScroll) {
                this.bodyElement.classList.add('sg-modal-body-scroll');
            }
            
            // Set content if provided
            if (this.content) {
                this.setContent(this.content);
            }
            
            // Add to modal
            this.modalElement.appendChild(this.bodyElement);
        }, null, 'modal', 'error', { modalTitle: this.title });
    }
    
    /**
     * Create footer with buttons
     * @private
     */
    _createFooter() {
        return tryCatch(() => {
            // Don't create footer if no buttons
            if (!this.buttons || !this.buttons.length) {
                return;
            }
            
            // Create footer
            this.footerElement = document.createElement('div');
            this.footerElement.className = 'sg-modal-footer';
            
            // Add buttons
            this._createButtons();
            
            // Add to modal
            this.modalElement.appendChild(this.footerElement);
        }, null, 'modal', 'error', { modalTitle: this.title });
    }
    
    /**
     * Create buttons for the footer
     * @private
     */
    _createButtons() {
        return tryCatch(() => {
            if (!this.footerElement || !this.buttons || !this.buttons.length) {
                return;
            }
            
            // Clear any existing buttons
            this.buttonComponents.forEach(button => button.destroy());
            this.buttonComponents = [];
            
            // Create each button
            this.buttons.forEach(buttonConfig => {
                const buttonOptions = {
                    content: buttonConfig.text || '',
                    className: 'sg-button',
                    variant: buttonConfig.variant || 'default',
                    parent: this.footerElement
                };
                
                // Create button component
                const button = new Button(buttonOptions);
                
                // Add click handler
                if (typeof buttonConfig.onClick === 'function') {
                    button.on('click', (e) => {
                        buttonConfig.onClick.call(this, e, button);
                    });
                }
                
                // Add to components list
                this.buttonComponents.push(button);
            });
        }, null, 'modal', 'error', { modalTitle: this.title });
    }
    
    /**
     * Set up event listeners for modal behavior
     * @private
     */
    _setupEventListeners() {
        return tryCatch(() => {
            // Close on backdrop click if closable
            if (this.closable && this.backdropElement) {
                this.backdropElement.addEventListener('click', (e) => {
                    // Only close if the actual backdrop was clicked (not modal itself)
                    if (e.target === this.backdropElement) {
                        this.close();
                    }
                });
            }
            
            // Handle keyboard events
            document.addEventListener('keydown', this._handleKeyDown = (e) => {
                // Close on ESC key if closable
                if (this.isOpen && this.closable && e.key === 'Escape') {
                    this.close();
                }
            });
            
            // Trap focus inside modal for accessibility
            this.element.addEventListener('keydown', this._handleTabKey = (e) => {
                if (!this.isOpen || e.key !== 'Tab') return;
                
                const focusableElements = this.element.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                // Shift+Tab => Focus last element if focused on first
                if (e.shiftKey && document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
                // Tab => Focus first element if focused on last
                else if (!e.shiftKey && document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            });
        }, null, 'modal', 'error', { modalTitle: this.title });
    }
    
    /**
     * Set the modal title
     * @param {string} title - Modal title
     * @returns {Modal} - The modal instance
     */
    setTitle(title) {
        if (!this.titleElement) return this;
        
        this.title = title;
        this.titleElement.textContent = title;
        
        return this;
    }
    
    /**
     * Set the modal content
     * @param {string|HTMLElement|UIComponent} content - Modal content
     * @returns {Modal} - The modal instance
     */
    setContent(content) {
        if (!this.bodyElement) return this;
        
        // Clear existing content
        while (this.bodyElement.firstChild) {
            this.bodyElement.removeChild(this.bodyElement.firstChild);
        }
        
        // Set new content
        if (typeof content === 'string') {
            this.bodyElement.innerHTML = content;
        } else if (content instanceof UIComponent) {
            this.bodyElement.appendChild(content.element);
        } else if (content instanceof HTMLElement) {
            this.bodyElement.appendChild(content);
        }
        
        this.content = content;
        
        return this;
    }
    
    /**
     * Set modal buttons
     * @param {Array} buttons - Array of button configs
     * @returns {Modal} - The modal instance
     */
    setButtons(buttons) {
        this.buttons = buttons || [];
        
        // Create footer if it doesn't exist but we have buttons
        if (!this.footerElement && this.buttons.length) {
            this.footerElement = document.createElement('div');
            this.footerElement.className = 'sg-modal-footer';
            this.modalElement.appendChild(this.footerElement);
        }
        // Remove footer if it exists but we have no buttons
        else if (this.footerElement && !this.buttons.length) {
            this.modalElement.removeChild(this.footerElement);
            this.footerElement = null;
        }
        
        // Re-create buttons
        if (this.footerElement) {
            this._createButtons();
        }
        
        return this;
    }
    
    /**
     * Add a button to the modal
     * @param {Object} buttonConfig - Button configuration
     * @returns {Modal} - The modal instance
     */
    addButton(buttonConfig) {
        if (!buttonConfig) return this;
        
        // Add to buttons array
        this.buttons.push(buttonConfig);
        
        // Create or update footer
        if (!this.footerElement) {
            this.footerElement = document.createElement('div');
            this.footerElement.className = 'sg-modal-footer';
            this.modalElement.appendChild(this.footerElement);
        }
        
        // Re-create all buttons
        this._createButtons();
        
        return this;
    }
    
    /**
     * Set modal size
     * @param {string} size - Modal size (small, medium, large, fullscreen)
     * @returns {Modal} - The modal instance
     */
    setSize(size) {
        if (!this.modalElement) return this;
        
        // Remove current size class
        const sizes = ['small', 'medium', 'large', 'fullscreen'];
        sizes.forEach(s => this.modalElement.classList.remove(`sg-modal-${s}`));
        
        // Set new size
        this.size = size;
        this.modalElement.classList.add(`sg-modal-${size}`);
        
        return this;
    }
    
    /**
     * Open the modal
     * @returns {Modal} - The modal instance
     */
    open() {
        return tryCatch(() => {
            if (this.isOpen) return this;
            
            // Show the modal container
            this.element.style.display = 'block';
            
            // Add open class (for animations)
            setTimeout(() => {
                this.element.classList.add('sg-modal-container-open');
                this.modalElement.classList.add('sg-modal-open');
            }, 10); // Small delay for CSS transitions
            
            // Set focus on first focusable element
            setTimeout(() => {
                const focusableElement = this.element.querySelector(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElement) {
                    focusableElement.focus();
                }
            }, 100);
            
            // Track open state
            this.isOpen = true;
            
            // Prevent body scrolling
            document.body.classList.add('sg-modal-open');
            
            // Trigger open event
            this.element.dispatchEvent(new CustomEvent('sg-modal-open', {
                bubbles: true,
                detail: { modal: this }
            }));
            
            return this;
        }, this, 'modal', 'error', { action: 'open', modalTitle: this.title });
    }
    
    /**
     * Close the modal
     * @returns {Modal} - The modal instance
     */
    close() {
        return tryCatch(() => {
            if (!this.isOpen) return this;
            
            // Remove open classes (for animations)
            this.element.classList.remove('sg-modal-container-open');
            this.modalElement.classList.remove('sg-modal-open');
            
            // Hide after animation completes
            setTimeout(() => {
                this.element.style.display = 'none';
            }, 300); // Match CSS transition duration
            
            // Track closed state
            this.isOpen = false;
            
            // Allow body scrolling again
            document.body.classList.remove('sg-modal-open');
            
            // Trigger close event
            this.element.dispatchEvent(new CustomEvent('sg-modal-close', {
                bubbles: true,
                detail: { modal: this }
            }));
            
            return this;
        }, this, 'modal', 'error', { action: 'close', modalTitle: this.title });
    }
    
    /**
     * Toggle the modal open/closed state
     * @returns {Modal} - The modal instance
     */
    toggle() {
        if (this.isOpen) {
            return this.close();
        } else {
            return this.open();
        }
    }
    
    /**
     * Destroy the modal and clean up resources
     */
    destroy() {
        // Remove event listeners
        if (this._handleKeyDown) {
            document.removeEventListener('keydown', this._handleKeyDown);
        }
        
        // Destroy button components
        this.buttonComponents.forEach(button => button.destroy());
        
        // Ensure body scrolling is restored
        document.body.classList.remove('sg-modal-open');
        
        // Call parent destroy
        super.destroy();
    }
}

// Export the Modal component
export { Modal };
