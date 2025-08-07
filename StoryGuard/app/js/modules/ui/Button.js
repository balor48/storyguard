/**
 * Button.js
 * 
 * Standard button component implementation.
 * This provides a consistent look and behavior for all buttons in the application.
 */

import { UIComponent } from './UIComponentCore.js';

class Button extends UIComponent {
    constructor(options = {}) {
        // Set default options for buttons
        const buttonOptions = {
            tag: 'button',
            type: 'button',
            className: 'sg-button',
            ...options
        };
        
        super(buttonOptions);
        
        this.type = buttonOptions.type || 'button';
        this.size = buttonOptions.size || 'default';
        this.variant = buttonOptions.variant || 'default';
        
        // Apply button-specific initialization
        this._initializeButton();
    }
    
    /**
     * Initialize button-specific properties
     * @private
     */
    _initializeButton() {
        if (!this.element) return;
        
        // Set button type (submit, reset, button)
        this.element.setAttribute('type', this.type);
        
        // Add size class if not default
        if (this.size !== 'default') {
            this.element.classList.add(`sg-button-${this.size}`);
        }
        
        // Add variant class if not default
        if (this.variant !== 'default') {
            this.element.classList.add(`sg-button-${this.variant}`);
        }
        
        // Add loading state handling
        if (this.options.loading) {
            this.setLoading(true);
        }
        
        // Add icon if specified
        if (this.options.icon) {
            this.setIcon(this.options.icon, this.options.iconPosition);
        }
    }
    
    /**
     * Set button text
     * @param {string} text - Button text
     * @returns {Button} - The button instance
     */
    setText(text) {
        if (!this.element) return this;
        
        // If we have an icon, we need to update differently
        if (this.iconElement) {
            // Find the text element
            let textElement = Array.from(this.element.childNodes)
                .find(node => node.nodeType === Node.TEXT_NODE);
            
            // If not found, create it
            if (!textElement) {
                textElement = document.createTextNode('');
                
                // Add it in the right position
                if (this.iconPosition === 'right') {
                    this.element.insertBefore(textElement, this.iconElement);
                } else {
                    this.element.appendChild(textElement);
                }
            }
            
            // Update the text
            textElement.nodeValue = text;
        } else {
            this.element.textContent = text;
        }
        
        return this;
    }
    
    /**
     * Set button icon
     * @param {string} icon - Icon HTML or class
     * @param {string} position - Icon position (left or right)
     * @returns {Button} - The button instance
     */
    setIcon(icon, position = 'left') {
        if (!this.element) return this;
        
        // Remove existing icon if any
        if (this.iconElement && this.iconElement.parentNode) {
            this.iconElement.parentNode.removeChild(this.iconElement);
        }
        
        // Create new icon element
        this.iconElement = document.createElement('span');
        this.iconElement.className = 'sg-button-icon';
        
        // Add position class
        this.iconPosition = position === 'right' ? 'right' : 'left';
        this.iconElement.classList.add(`sg-button-icon-${this.iconPosition}`);
        
        // Set icon content
        if (icon.startsWith('<')) {
            // Assume HTML content
            this.iconElement.innerHTML = icon;
        } else {
            // Assume CSS class
            const iconInner = document.createElement('i');
            iconInner.className = icon;
            this.iconElement.appendChild(iconInner);
        }
        
        // Add to button in the right position
        if (position === 'right') {
            this.element.appendChild(this.iconElement);
        } else {
            this.element.insertBefore(this.iconElement, this.element.firstChild);
        }
        
        return this;
    }
    
    /**
     * Remove the icon
     * @returns {Button} - The button instance
     */
    removeIcon() {
        if (this.iconElement && this.iconElement.parentNode) {
            this.iconElement.parentNode.removeChild(this.iconElement);
            this.iconElement = null;
        }
        return this;
    }
    
    /**
     * Set loading state
     * @param {boolean} isLoading - Whether button is in loading state
     * @returns {Button} - The button instance
     */
    setLoading(isLoading) {
        if (!this.element) return this;
        
        if (isLoading) {
            // Store original content if not already stored
            if (!this._originalContent) {
                this._originalContent = this.element.innerHTML;
                this._originalDisabled = this.element.disabled;
            }
            
            // Add loading class
            this.element.classList.add('sg-button-loading');
            
            // Disable button
            this.element.disabled = true;
            
            // Create spinner if not exists
            if (!this.spinnerElement) {
                this.spinnerElement = document.createElement('span');
                this.spinnerElement.className = 'sg-button-spinner';
                this.spinnerElement.innerHTML = '<div class="spinner"></div>';
            }
            
            // Show spinner
            this.element.innerHTML = '';
            this.element.appendChild(this.spinnerElement);
            
            // Add loading text if provided
            if (this.options.loadingText) {
                const textNode = document.createTextNode(this.options.loadingText);
                this.element.appendChild(textNode);
            }
        } else {
            // Remove loading class
            this.element.classList.remove('sg-button-loading');
            
            // Restore original content
            if (this._originalContent) {
                this.element.innerHTML = this._originalContent;
                this.element.disabled = this._originalDisabled;
                
                // Clear stored original content
                this._originalContent = null;
                this._originalDisabled = null;
            }
        }
        
        return this;
    }
    
    /**
     * Set button variant
     * @param {string} variant - Button variant (primary, secondary, danger, etc.)
     * @returns {Button} - The button instance
     */
    setVariant(variant) {
        if (!this.element) return this;
        
        // Remove current variant class
        if (this.variant !== 'default') {
            this.element.classList.remove(`sg-button-${this.variant}`);
        }
        
        // Set new variant
        this.variant = variant;
        
        // Add new variant class if not default
        if (this.variant !== 'default') {
            this.element.classList.add(`sg-button-${this.variant}`);
        }
        
        return this;
    }
    
    /**
     * Click the button programmatically
     * @returns {Button} - The button instance
     */
    click() {
        if (this.element && !this.element.disabled) {
            this.element.click();
        }
        return this;
    }
}

// Export the Button component
export { Button };
