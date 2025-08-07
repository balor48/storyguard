/**
 * FormInput.js
 * 
 * Standardized form input component.
 * This provides consistent behavior, validation, and styling for input fields.
 */

import { UIComponent } from './UIComponentCore.js';
import { tryCatch } from '../error-handling-util.js';

class FormInput extends UIComponent {
    constructor(options = {}) {
        // Create a wrapper div as the main element
        const inputOptions = {
            tag: 'div',
            className: 'sg-form-field',
            ...options
        };
        
        super(inputOptions);
        
        // Input-specific properties
        this.inputType = options.type || 'text';
        this.name = options.name || '';
        this.value = options.value || '';
        this.label = options.label || '';
        this.placeholder = options.placeholder || '';
        this.required = options.required || false;
        this.disabled = options.disabled || false;
        this.readOnly = options.readOnly || false;
        this.helpText = options.helpText || '';
        this.errorText = options.errorText || '';
        this.validation = options.validation || null;
        this.customClasses = options.customClasses || {};
        
        // References to child elements
        this.inputElement = null;
        this.labelElement = null;
        this.helpTextElement = null;
        this.errorElement = null;
        
        // Apply input-specific initialization
        this._initializeInput();
    }
    
    /**
     * Initialize input field and its components
     * @private
     */
    _initializeInput() {
        return tryCatch(() => {
            if (!this.element) return;
            
            // Create label if specified
            if (this.label) {
                this._createLabel();
            }
            
            // Create input element
            this._createInputElement();
            
            // Create help text if specified
            if (this.helpText) {
                this._createHelpText();
            }
            
            // Create error element (initially hidden)
            this._createErrorElement();
            
            // Add custom classes if provided
            this._applyCustomClasses();
            
            // Set initial disabled/readonly state
            if (this.disabled) {
                this.disable();
            }
            
            if (this.readOnly) {
                this.setReadOnly(true);
            }
            
            // Set up validation
            this._setupValidation();
            
            return this;
        }, this, 'form-input', 'error', { inputName: this.name });
    }
    
    /**
     * Create the label element
     * @private
     */
    _createLabel() {
        return tryCatch(() => {
            this.labelElement = document.createElement('label');
            this.labelElement.className = 'sg-form-label';
            
            // Set for attribute if name is provided
            if (this.name) {
                this.labelElement.setAttribute('for', this.name);
            }
            
            // Add required indicator if needed
            if (this.required) {
                const requiredIndicator = document.createElement('span');
                requiredIndicator.className = 'sg-required-indicator';
                requiredIndicator.textContent = '*';
                
                this.labelElement.textContent = this.label + ' ';
                this.labelElement.appendChild(requiredIndicator);
            } else {
                this.labelElement.textContent = this.label;
            }
            
            this.element.appendChild(this.labelElement);
        }, null, 'form-input', 'error', { inputName: this.name });
    }
    
    /**
     * Create the input element based on the input type
     * @private
     */
    _createInputElement() {
        return tryCatch(() => {
            // Create the appropriate input element based on type
            if (this.inputType === 'textarea') {
                this.inputElement = document.createElement('textarea');
            } else if (this.inputType === 'select') {
                this.inputElement = document.createElement('select');
                
                // Add options if provided
                if (this.options.options && Array.isArray(this.options.options)) {
                    this.options.options.forEach(option => {
                        const optionEl = document.createElement('option');
                        optionEl.value = option.value;
                        optionEl.textContent = option.label || option.value;
                        
                        if (option.selected || this.value === option.value) {
                            optionEl.selected = true;
                        }
                        
                        this.inputElement.appendChild(optionEl);
                    });
                }
            } else {
                this.inputElement = document.createElement('input');
                this.inputElement.type = this.inputType;
            }
            
            // Set common attributes
            this.inputElement.className = 'sg-form-input';
            
            if (this.name) {
                this.inputElement.name = this.name;
                this.inputElement.id = this.name; // Use name as ID for label association
            }
            
            if (this.value !== undefined && this.value !== null) {
                this.setValue(this.value);
            }
            
            if (this.placeholder) {
                this.inputElement.placeholder = this.placeholder;
            }
            
            if (this.required) {
                this.inputElement.required = true;
            }
            
            if (this.disabled) {
                this.inputElement.disabled = true;
            }
            
            if (this.readOnly) {
                this.inputElement.readOnly = true;
            }
            
            // Add standard event listeners
            this.inputElement.addEventListener('input', e => this._handleInput(e));
            this.inputElement.addEventListener('change', e => this._handleChange(e));
            this.inputElement.addEventListener('focus', e => this._handleFocus(e));
            this.inputElement.addEventListener('blur', e => this._handleBlur(e));
            
            // Add the input to the container
            this.element.appendChild(this.inputElement);
        }, null, 'form-input', 'error', { inputName: this.name });
    }
    
    /**
     * Create help text element
     * @private
     */
    _createHelpText() {
        return tryCatch(() => {
            this.helpTextElement = document.createElement('div');
            this.helpTextElement.className = 'sg-form-help-text';
            this.helpTextElement.textContent = this.helpText;
            
            this.element.appendChild(this.helpTextElement);
        }, null, 'form-input', 'error', { inputName: this.name });
    }
    
    /**
     * Create error element (initially hidden)
     * @private
     */
    _createErrorElement() {
        return tryCatch(() => {
            this.errorElement = document.createElement('div');
            this.errorElement.className = 'sg-form-error';
            this.errorElement.style.display = 'none';
            
            if (this.errorText) {
                this.errorElement.textContent = this.errorText;
                this.errorElement.style.display = 'block';
                this.element.classList.add('sg-form-field-error');
            }
            
            this.element.appendChild(this.errorElement);
        }, null, 'form-input', 'error', { inputName: this.name });
    }
    
    /**
     * Apply custom classes to elements
     * @private
     */
    _applyCustomClasses() {
        return tryCatch(() => {
            if (this.customClasses.container && this.element) {
                this._addClasses(this.customClasses.container);
            }
            
            if (this.customClasses.label && this.labelElement) {
                this.labelElement.className += ' ' + this.customClasses.label;
            }
            
            if (this.customClasses.input && this.inputElement) {
                this.inputElement.className += ' ' + this.customClasses.input;
            }
            
            if (this.customClasses.helpText && this.helpTextElement) {
                this.helpTextElement.className += ' ' + this.customClasses.helpText;
            }
            
            if (this.customClasses.error && this.errorElement) {
                this.errorElement.className += ' ' + this.customClasses.error;
            }
        }, null, 'form-input', 'error', { inputName: this.name });
    }
    
    /**
     * Set up validation
     * @private
     */
    _setupValidation() {
        return tryCatch(() => {
            // If validation function is provided, add it
            if (typeof this.validation === 'function') {
                this.validateFn = this.validation;
            } 
            // Standard validation based on input type
            else {
                this.validateFn = (value) => {
                    // Check required
                    if (this.required && (!value || value.trim() === '')) {
                        return {
                            valid: false,
                            message: `${this.label || 'Field'} is required`
                        };
                    }
                    
                    // Skip further validation if empty and not required
                    if (!value || value.trim() === '') {
                        return { valid: true };
                    }
                    
                    // Email validation
                    if (this.inputType === 'email') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(value)) {
                            return {
                                valid: false,
                                message: 'Please enter a valid email address'
                            };
                        }
                    }
                    
                    // Number validation
                    if (this.inputType === 'number') {
                        if (isNaN(parseFloat(value)) || !isFinite(value)) {
                            return {
                                valid: false,
                                message: 'Please enter a valid number'
                            };
                        }
                        
                        // Min/max validation
                        const num = parseFloat(value);
                        if (this.options.min !== undefined && num < this.options.min) {
                            return {
                                valid: false,
                                message: `Value must be at least ${this.options.min}`
                            };
                        }
                        
                        if (this.options.max !== undefined && num > this.options.max) {
                            return {
                                valid: false,
                                message: `Value must be at most ${this.options.max}`
                            };
                        }
                    }
                    
                    // URL validation
                    if (this.inputType === 'url') {
                        try {
                            new URL(value);
                        } catch (_) {
                            return {
                                valid: false,
                                message: 'Please enter a valid URL'
                            };
                        }
                    }
                    
                    // Password validation
                    if (this.inputType === 'password' && this.options.passwordStrength) {
                        const minLength = this.options.minLength || 8;
                        
                        if (value.length < minLength) {
                            return {
                                valid: false,
                                message: `Password must be at least ${minLength} characters`
                            };
                        }
                        
                        // Check for strong password if required
                        if (this.options.passwordStrength === 'strong') {
                            const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                            if (!strongRegex.test(value)) {
                                return {
                                    valid: false,
                                    message: 'Password must include uppercase, lowercase, number and special character'
                                };
                            }
                        }
                    }
                    
                    // All validations passed
                    return { valid: true };
                };
            }
        }, null, 'form-input', 'error', { inputName: this.name });
    }
    
    /**
     * Handle input event
     * @param {Event} event - The input event
     * @private
     */
    _handleInput(event) {
        return tryCatch(() => {
            // Update the value
            this.value = this.getValue();
            
            // Clear error on typing if present
            if (this.options.validateOnInput) {
                this.validate();
            } else if (this.hasError()) {
                this.clearError();
            }
            
            // Trigger custom input event
            if (this.options.onInput) {
                this.options.onInput.call(this, event, this.value);
            }
            
            // Dispatch a custom event
            this.element.dispatchEvent(new CustomEvent('sg-input', {
                bubbles: true,
                detail: {
                    value: this.value,
                    name: this.name,
                    component: this
                }
            }));
        }, null, 'form-input', 'error', { inputName: this.name, eventType: 'input' });
    }
    
    /**
     * Handle change event
     * @param {Event} event - The change event
     * @private
     */
    _handleChange(event) {
        return tryCatch(() => {
            // Update the value
            this.value = this.getValue();
            
            // Validate on change if requested
            if (this.options.validateOnChange) {
                this.validate();
            }
            
            // Trigger custom change event
            if (this.options.onChange) {
                this.options.onChange.call(this, event, this.value);
            }
            
            // Dispatch a custom event
            this.element.dispatchEvent(new CustomEvent('sg-change', {
                bubbles: true,
                detail: {
                    value: this.value,
                    name: this.name,
                    component: this
                }
            }));
        }, null, 'form-input', 'error', { inputName: this.name, eventType: 'change' });
    }
    
    /**
     * Handle focus event
     * @param {Event} event - The focus event
     * @private
     */
    _handleFocus(event) {
        return tryCatch(() => {
            // Add focused class
            this.element.classList.add('sg-form-field-focused');
            
            // Trigger custom focus event
            if (this.options.onFocus) {
                this.options.onFocus.call(this, event);
            }
        }, null, 'form-input', 'error', { inputName: this.name, eventType: 'focus' });
    }
    
    /**
     * Handle blur event
     * @param {Event} event - The blur event
     * @private
     */
    _handleBlur(event) {
        return tryCatch(() => {
            // Remove focused class
            this.element.classList.remove('sg-form-field-focused');
            
            // Validate on blur if requested
            if (this.options.validateOnBlur) {
                this.validate();
            }
            
            // Trigger custom blur event
            if (this.options.onBlur) {
                this.options.onBlur.call(this, event);
            }
        }, null, 'form-input', 'error', { inputName: this.name, eventType: 'blur' });
    }
    
    /**
     * Get the current input value
     * @returns {string} - Current value
     */
    getValue() {
        if (!this.inputElement) return this.value;
        
        if (this.inputType === 'checkbox') {
            return this.inputElement.checked;
        } else if (this.inputType === 'radio') {
            return this.inputElement.checked ? this.inputElement.value : null;
        } else {
            return this.inputElement.value;
        }
    }
    
    /**
     * Set the input value
     * @param {string|boolean} value - Value to set
     * @returns {FormInput} - The component instance
     */
    setValue(value) {
        if (!this.inputElement) return this;
        
        if (this.inputType === 'checkbox') {
            this.inputElement.checked = !!value;
        } else if (this.inputType === 'radio') {
            this.inputElement.checked = this.inputElement.value === value;
        } else {
            this.inputElement.value = value;
        }
        
        this.value = this.getValue();
        
        return this;
    }
    
    /**
     * Set the label text
     * @param {string} text - Label text
     * @returns {FormInput} - The component instance
     */
    setLabel(text) {
        if (!this.labelElement) {
            if (!text) return this;
            
            // Create label if it doesn't exist
            this.label = text;
            this._createLabel();
            return this;
        }
        
        this.label = text;
        
        // Keep the required indicator if present
        if (this.required) {
            const indicator = this.labelElement.querySelector('.sg-required-indicator');
            this.labelElement.textContent = text + ' ';
            if (indicator) {
                this.labelElement.appendChild(indicator);
            } else {
                const requiredIndicator = document.createElement('span');
                requiredIndicator.className = 'sg-required-indicator';
                requiredIndicator.textContent = '*';
                this.labelElement.appendChild(requiredIndicator);
            }
        } else {
            this.labelElement.textContent = text;
        }
        
        return this;
    }
    
    /**
     * Set input placeholder
     * @param {string} text - Placeholder text
     * @returns {FormInput} - The component instance
     */
    setPlaceholder(text) {
        if (!this.inputElement) return this;
        
        this.placeholder = text;
        this.inputElement.placeholder = text;
        
        return this;
    }
    
    /**
     * Set help text
     * @param {string} text - Help text
     * @returns {FormInput} - The component instance
     */
    setHelpText(text) {
        if (!text) {
            // Remove help text if exists
            if (this.helpTextElement && this.helpTextElement.parentNode) {
                this.helpTextElement.parentNode.removeChild(this.helpTextElement);
                this.helpTextElement = null;
            }
            this.helpText = '';
            return this;
        }
        
        this.helpText = text;
        
        if (!this.helpTextElement) {
            this._createHelpText();
        } else {
            this.helpTextElement.textContent = text;
        }
        
        return this;
    }
    
    /**
     * Set required state
     * @param {boolean} required - Whether input is required
     * @returns {FormInput} - The component instance
     */
    setRequired(required) {
        if (!this.inputElement) return this;
        
        this.required = !!required;
        
        // Update input attribute
        if (this.required) {
            this.inputElement.setAttribute('required', '');
        } else {
            this.inputElement.removeAttribute('required');
        }
        
        // Update label if exists
        if (this.labelElement) {
            this.setLabel(this.label);
        }
        
        return this;
    }
    
    /**
     * Set disabled state
     * @param {boolean} disabled - Whether input is disabled
     * @returns {FormInput} - The component instance
     */
    disable(disabled = true) {
        if (!this.inputElement) return this;
        
        this.disabled = disabled;
        
        if (disabled) {
            this.inputElement.setAttribute('disabled', '');
            this.element.classList.add('sg-form-field-disabled');
        } else {
            this.inputElement.removeAttribute('disabled');
            this.element.classList.remove('sg-form-field-disabled');
        }
        
        return this;
    }
    
    /**
     * Enable the input
     * @returns {FormInput} - The component instance
     */
    enable() {
        return this.disable(false);
    }
    
    /**
     * Set read-only state
     * @param {boolean} readOnly - Whether input is read-only
     * @returns {FormInput} - The component instance
     */
    setReadOnly(readOnly) {
        if (!this.inputElement) return this;
        
        this.readOnly = !!readOnly;
        
        if (this.readOnly) {
            this.inputElement.setAttribute('readonly', '');
            this.element.classList.add('sg-form-field-readonly');
        } else {
            this.inputElement.removeAttribute('readonly');
            this.element.classList.remove('sg-form-field-readonly');
        }
        
        return this;
    }
    
    /**
     * Set error state and message
     * @param {string} message - Error message
     * @returns {FormInput} - The component instance
     */
    setError(message) {
        if (!this.errorElement) return this;
        
        // Add error state
        this.element.classList.add('sg-form-field-error');
        
        // Set error message
        this.errorElement.textContent = message;
        this.errorElement.style.display = 'block';
        
        // Store error message
        this.errorText = message;
        
        return this;
    }
    
    /**
     * Clear error state
     * @returns {FormInput} - The component instance
     */
    clearError() {
        if (!this.errorElement) return this;
        
        // Remove error state
        this.element.classList.remove('sg-form-field-error');
        
        // Hide error message
        this.errorElement.textContent = '';
        this.errorElement.style.display = 'none';
        
        // Clear error message
        this.errorText = '';
        
        return this;
    }
    
    /**
     * Check if field has an error
     * @returns {boolean} - Whether field has error
     */
    hasError() {
        return this.element.classList.contains('sg-form-field-error');
    }
    
    /**
     * Validate the input
     * @returns {Object} - Validation result { valid, message }
     */
    validate() {
        const value = this.getValue();
        let result = { valid: true };
        
        if (this.validateFn) {
            try {
                result = this.validateFn(value, this);
            } catch (error) {
                console.error('Validation error:', error);
                result = {
                    valid: false,
                    message: 'Validation error'
                };
            }
        }
        
        // Update UI based on validation result
        if (!result.valid) {
            this.setError(result.message || 'Invalid input');
        } else {
            this.clearError();
        }
        
        return result;
    }
    
    /**
     * Reset the input
     * @returns {FormInput} - The component instance
     */
    reset() {
        if (!this.inputElement) return this;
        
        // Reset value
        this.setValue(this.options.value || '');
        
        // Clear error
        this.clearError();
        
        return this;
    }
    
    /**
     * Focus the input
     * @returns {FormInput} - The component instance
     */
    focus() {
        if (this.inputElement && !this.disabled) {
            this.inputElement.focus();
        }
        return this;
    }
    
    /**
     * Blur (unfocus) the input
     * @returns {FormInput} - The component instance
     */
    blur() {
        if (this.inputElement) {
            this.inputElement.blur();
        }
        return this;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Remove all event listeners
        if (this.inputElement) {
            // Remove standard listeners
            this.inputElement.removeEventListener('input', this._handleInput);
            this.inputElement.removeEventListener('change', this._handleChange);
            this.inputElement.removeEventListener('focus', this._handleFocus);
            this.inputElement.removeEventListener('blur', this._handleBlur);
        }
        
        // Call parent destroy method
        super.destroy();
    }
}

// Export the FormInput component
export { FormInput };
