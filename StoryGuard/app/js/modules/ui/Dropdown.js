/**
 * Dropdown.js
 * 
 * Standard dropdown/select component for displaying selectable options.
 * This provides consistent styling and behavior for all dropdowns in the application.
 */

import { UIComponent } from './UIComponentCore.js';
import { tryCatch } from '../error-handling-util.js';

class Dropdown extends UIComponent {
    constructor(options = {}) {
        // Set default options for dropdown
        const dropdownOptions = {
            tag: 'div',
            className: 'sg-dropdown',
            ...options
        };
        
        super(dropdownOptions);
        
        // Dropdown-specific properties
        this.placeholder = options.placeholder || 'Select an option';
        this.options = options.options || [];
        this.value = options.value || null;
        this.multiple = options.multiple || false;
        this.searchable = options.searchable || false;
        this.required = options.required || false;
        this.disabled = options.disabled || false;
        this.label = options.label || '';
        this.name = options.name || '';
        this.id = options.id || `dropdown-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.helpText = options.helpText || '';
        this.error = options.error || '';
        this.clearable = options.clearable || false;
        this.onChange = options.onChange || null;
        
        // Component state
        this.isOpen = false;
        this.searchText = '';
        this.selectedOptions = [];
        this.highlightedIndex = -1;
        
        // Element references
        this.labelElement = null;
        this.selectElement = null;
        this.dropdownTrigger = null;
        this.dropdownMenu = null;
        this.searchInput = null;
        this.optionElements = [];
        this.errorElement = null;
        this.helpTextElement = null;
        
        // Initialize dropdown
        this._initializeDropdown();
    }
    
    /**
     * Initialize the dropdown
     * @private
     */
    _initializeDropdown() {
        return tryCatch(() => {
            if (!this.element) return;
            
            // Create the structure
            this._createLabel();
            this._createDropdownElements();
            this._createHelpText();
            this._createErrorElement();
            
            // Set initial state
            this._setInitialValue();
            this._updateDisplay();
            
            // Set up event listeners
            this._setupEventListeners();
            
            return this;
        }, this, 'dropdown', 'error', { name: this.name });
    }
    
    /**
     * Create label element if label is provided
     * @private
     */
    _createLabel() {
        if (!this.label) return;
        
        this.labelElement = document.createElement('label');
        this.labelElement.className = 'sg-form-label';
        this.labelElement.htmlFor = this.id;
        this.labelElement.textContent = this.label;
        
        // Add required indicator if needed
        if (this.required) {
            const requiredIndicator = document.createElement('span');
            requiredIndicator.className = 'sg-required-indicator';
            requiredIndicator.textContent = '*';
            this.labelElement.appendChild(requiredIndicator);
        }
        
        this.element.appendChild(this.labelElement);
    }
    
    /**
     * Create dropdown elements
     * @private
     */
    _createDropdownElements() {
        // Create hidden select element for form submission
        this.selectElement = document.createElement('select');
        this.selectElement.className = 'sg-dropdown-select';
        this.selectElement.name = this.name;
        this.selectElement.id = this.id;
        this.selectElement.multiple = this.multiple;
        this.selectElement.style.display = 'none';
        
        if (this.required) {
            this.selectElement.required = true;
        }
        
        if (this.disabled) {
            this.selectElement.disabled = true;
        }
        
        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'sg-dropdown-container';
        
        // Create dropdown trigger
        this.dropdownTrigger = document.createElement('div');
        this.dropdownTrigger.className = 'sg-dropdown-trigger';
        this.dropdownTrigger.tabIndex = this.disabled ? -1 : 0;
        
        if (this.disabled) {
            this.dropdownTrigger.classList.add('sg-dropdown-disabled');
        }
        
        // Create trigger content
        const triggerContent = document.createElement('div');
        triggerContent.className = 'sg-dropdown-trigger-content';
        triggerContent.textContent = this.placeholder;
        this.dropdownTrigger.appendChild(triggerContent);
        
        // Create dropdown arrow
        const arrow = document.createElement('div');
        arrow.className = 'sg-dropdown-arrow';
        arrow.innerHTML = '&#9662;'; // Down arrow
        this.dropdownTrigger.appendChild(arrow);
        
        // Create dropdown menu
        this.dropdownMenu = document.createElement('div');
        this.dropdownMenu.className = 'sg-dropdown-menu';
        
        // Add search input if searchable
        if (this.searchable) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'sg-dropdown-search';
            
            this.searchInput = document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.className = 'sg-dropdown-search-input';
            this.searchInput.placeholder = 'Search...';
            
            searchContainer.appendChild(this.searchInput);
            this.dropdownMenu.appendChild(searchContainer);
        }
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'sg-dropdown-options';
        
        // Create each option
        this._createOptionElements(optionsContainer);
        
        this.dropdownMenu.appendChild(optionsContainer);
        
        // Assemble dropdown
        dropdownContainer.appendChild(this.dropdownTrigger);
        dropdownContainer.appendChild(this.dropdownMenu);
        
        // Add to the main element
        this.element.appendChild(this.selectElement);
        this.element.appendChild(dropdownContainer);
    }
    
    /**
     * Create option elements
     * @private
     * @param {HTMLElement} container - Container to append options to
     */
    _createOptionElements(container) {
        // Clear existing options
        this.optionElements = [];
        container.innerHTML = '';
        this.selectElement.innerHTML = '';
        
        // Add placeholder option to select element
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = this.placeholder;
        placeholderOption.disabled = true;
        placeholderOption.selected = this.value === null;
        this.selectElement.appendChild(placeholderOption);
        
        // Create each option
        this.options.forEach((option, index) => {
            // Create option element for dropdown
            const optionElement = document.createElement('div');
            optionElement.className = 'sg-dropdown-option';
            optionElement.dataset.value = option.value;
            optionElement.dataset.index = index;
            
            if (this.multiple) {
                const checkbox = document.createElement('span');
                checkbox.className = 'sg-dropdown-checkbox';
                optionElement.appendChild(checkbox);
            }
            
            const optionText = document.createElement('span');
            optionText.className = 'sg-dropdown-option-text';
            optionText.textContent = option.label || option.value;
            optionElement.appendChild(optionText);
            
            // Store reference to option element
            this.optionElements.push(optionElement);
            
            // Add option to container
            container.appendChild(optionElement);
            
            // Create option for hidden select element
            const selectOption = document.createElement('option');
            selectOption.value = option.value;
            selectOption.textContent = option.label || option.value;
            this.selectElement.appendChild(selectOption);
        });
    }
    
    /**
     * Create help text element if help text is provided
     * @private
     */
    _createHelpText() {
        if (!this.helpText) return;
        
        this.helpTextElement = document.createElement('div');
        this.helpTextElement.className = 'sg-form-help-text';
        this.helpTextElement.textContent = this.helpText;
        
        this.element.appendChild(this.helpTextElement);
    }
    
    /**
     * Create error element
     * @private
     */
    _createErrorElement() {
        this.errorElement = document.createElement('div');
        this.errorElement.className = 'sg-form-error';
        
        if (this.error) {
            this.errorElement.textContent = this.error;
            this.element.classList.add('sg-form-field-error');
        } else {
            this.errorElement.style.display = 'none';
        }
        
        this.element.appendChild(this.errorElement);
    }
    
    /**
     * Set initial value
     * @private
     */
    _setInitialValue() {
        if (this.value === null) return;
        
        if (this.multiple && Array.isArray(this.value)) {
            this.selectedOptions = this.value;
            
            // Update select element
            Array.from(this.selectElement.options).forEach(option => {
                option.selected = this.value.includes(option.value);
            });
        } else {
            this.value = String(this.value);
            
            // Find option in select element and select it
            Array.from(this.selectElement.options).forEach(option => {
                if (option.value === this.value) {
                    option.selected = true;
                }
            });
        }
    }
    
    /**
     * Update display based on selected options
     * @private
     */
    _updateDisplay() {
        const triggerContent = this.dropdownTrigger.querySelector('.sg-dropdown-trigger-content');
        
        if (this.multiple) {
            if (this.selectedOptions.length === 0) {
                triggerContent.textContent = this.placeholder;
                return;
            }
            
            // Find selected option labels
            const selectedLabels = this.selectedOptions.map(value => {
                const option = this.options.find(opt => String(opt.value) === String(value));
                return option ? (option.label || option.value) : value;
            });
            
            // Show first selected item and count if more than one
            if (selectedLabels.length > 1) {
                triggerContent.textContent = `${selectedLabels[0]} +${selectedLabels.length - 1}`;
            } else {
                triggerContent.textContent = selectedLabels[0];
            }
            
            // Update option elements
            this.optionElements.forEach(optElement => {
                const value = optElement.dataset.value;
                if (this.selectedOptions.includes(value)) {
                    optElement.classList.add('sg-dropdown-option-selected');
                } else {
                    optElement.classList.remove('sg-dropdown-option-selected');
                }
            });
        } else {
            // Single select
            if (this.value === null) {
                triggerContent.textContent = this.placeholder;
                return;
            }
            
            // Find selected option label
            const selectedOption = this.options.find(opt => String(opt.value) === String(this.value));
            triggerContent.textContent = selectedOption ? (selectedOption.label || selectedOption.value) : this.value;
            
            // Update option elements
            this.optionElements.forEach(optElement => {
                const value = optElement.dataset.value;
                if (String(value) === String(this.value)) {
                    optElement.classList.add('sg-dropdown-option-selected');
                } else {
                    optElement.classList.remove('sg-dropdown-option-selected');
                }
            });
        }
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        if (this.disabled) return;
        
        // Toggle dropdown when trigger is clicked
        this.dropdownTrigger.addEventListener('click', () => {
            this.toggle();
        });
        
        // Handle keyboard navigation on trigger
        this.dropdownTrigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'ArrowDown' && !this.isOpen) {
                e.preventDefault();
                this.open();
            }
        });
        
        // Handle search input
        if (this.searchable && this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchText = e.target.value.toLowerCase();
                this._filterOptions();
            });
            
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.stopPropagation(); // Prevent dropdown from closing
                    this.searchText = '';
                    this.searchInput.value = '';
                    this._filterOptions();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this._highlightNextOption();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this._highlightPreviousOption();
                } else if (e.key === 'Enter' && this.highlightedIndex >= 0) {
                    e.preventDefault();
                    const optElement = this.optionElements[this.highlightedIndex];
                    if (optElement && !optElement.classList.contains('sg-dropdown-option-hidden')) {
                        this._selectOption(optElement);
                    }
                }
            });
        }
        
        // Handle option click
        this.optionElements.forEach(optElement => {
            optElement.addEventListener('click', () => {
                this._selectOption(optElement);
            });
            
            // Handle keyboard navigation within options
            optElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._selectOption(optElement);
                }
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.element.contains(e.target)) {
                this.close();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (this.isOpen && e.key === 'Escape') {
                this.close();
            }
        });
    }
    
    /**
     * Filter options based on search text
     * @private
     */
    _filterOptions() {
        if (!this.searchable || !this.optionElements.length) return;
        
        this.optionElements.forEach((optElement, index) => {
            const option = this.options[index];
            const text = (option.label || option.value).toLowerCase();
            
            if (text.includes(this.searchText)) {
                optElement.classList.remove('sg-dropdown-option-hidden');
            } else {
                optElement.classList.add('sg-dropdown-option-hidden');
            }
        });
        
        // Reset highlight
        this._removeHighlights();
        this.highlightedIndex = -1;
    }
    
    /**
     * Highlight next visible option
     * @private
     */
    _highlightNextOption() {
        this._removeHighlights();
        
        let index = this.highlightedIndex;
        let found = false;
        
        // Find next visible option
        while (!found && index < this.optionElements.length - 1) {
            index++;
            const optElement = this.optionElements[index];
            
            if (!optElement.classList.contains('sg-dropdown-option-hidden')) {
                found = true;
                this.highlightedIndex = index;
                optElement.classList.add('sg-dropdown-option-highlighted');
                optElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }
    
    /**
     * Highlight previous visible option
     * @private
     */
    _highlightPreviousOption() {
        this._removeHighlights();
        
        let index = this.highlightedIndex;
        let found = false;
        
        // Find previous visible option
        while (!found && index > 0) {
            index--;
            const optElement = this.optionElements[index];
            
            if (!optElement.classList.contains('sg-dropdown-option-hidden')) {
                found = true;
                this.highlightedIndex = index;
                optElement.classList.add('sg-dropdown-option-highlighted');
                optElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }
    
    /**
     * Remove all highlights
     * @private
     */
    _removeHighlights() {
        this.optionElements.forEach(optElement => {
            optElement.classList.remove('sg-dropdown-option-highlighted');
        });
    }
    
    /**
     * Select an option
     * @private
     * @param {HTMLElement} optElement - Option element
     */
    _selectOption(optElement) {
        const value = optElement.dataset.value;
        const index = parseInt(optElement.dataset.index, 10);
        const option = this.options[index];
        
        if (this.multiple) {
            // Toggle selected state
            const valueIndex = this.selectedOptions.indexOf(value);
            
            if (valueIndex === -1) {
                // Add to selected options
                this.selectedOptions.push(value);
                optElement.classList.add('sg-dropdown-option-selected');
            } else {
                // Remove from selected options
                this.selectedOptions.splice(valueIndex, 1);
                optElement.classList.remove('sg-dropdown-option-selected');
            }
            
            // Update select element
            Array.from(this.selectElement.options).forEach(selectOpt => {
                selectOpt.selected = this.selectedOptions.includes(selectOpt.value);
            });
            
            // Update display
            this._updateDisplay();
            
            // Call onChange handler
            if (typeof this.onChange === 'function') {
                this.onChange.call(this, this.selectedOptions, option);
            }
        } else {
            // Single select
            this.value = value;
            
            // Update select element
            Array.from(this.selectElement.options).forEach(selectOpt => {
                selectOpt.selected = selectOpt.value === value;
            });
            
            // Update display
            this._updateDisplay();
            
            // Close dropdown
            this.close();
            
            // Call onChange handler
            if (typeof this.onChange === 'function') {
                this.onChange.call(this, value, option);
            }
        }
        
        // Dispatch change event
        this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        this.element.dispatchEvent(new CustomEvent('sg-dropdown-change', {
            bubbles: true,
            detail: { 
                dropdown: this,
                value: this.multiple ? this.selectedOptions : this.value,
                option: option
            }
        }));
    }
    
    /**
     * Open the dropdown
     * @returns {Dropdown} - The dropdown instance
     */
    open() {
        if (this.disabled || this.isOpen) return this;
        
        this.isOpen = true;
        this.dropdownMenu.style.display = 'block';
        this.dropdownTrigger.classList.add('sg-dropdown-trigger-open');
        this.dropdownTrigger.querySelector('.sg-dropdown-arrow').innerHTML = '&#9652;'; // Up arrow
        
        // Focus search input if searchable
        if (this.searchable && this.searchInput) {
            setTimeout(() => {
                this.searchInput.focus();
            }, 10);
        }
        
        // Dispatch event
        this.element.dispatchEvent(new CustomEvent('sg-dropdown-open', {
            bubbles: true,
            detail: { dropdown: this }
        }));
        
        return this;
    }
    
    /**
     * Close the dropdown
     * @returns {Dropdown} - The dropdown instance
     */
    close() {
        if (!this.isOpen) return this;
        
        this.isOpen = false;
        this.dropdownMenu.style.display = 'none';
        this.dropdownTrigger.classList.remove('sg-dropdown-trigger-open');
        this.dropdownTrigger.querySelector('.sg-dropdown-arrow').innerHTML = '&#9662;'; // Down arrow
        
        // Clear search
        if (this.searchable && this.searchInput) {
            this.searchInput.value = '';
            this.searchText = '';
            this._filterOptions();
        }
        
        // Remove highlights
        this._removeHighlights();
        this.highlightedIndex = -1;
        
        // Dispatch event
        this.element.dispatchEvent(new CustomEvent('sg-dropdown-close', {
            bubbles: true,
            detail: { dropdown: this }
        }));
        
        return this;
    }
    
    /**
     * Toggle the dropdown
     * @returns {Dropdown} - The dropdown instance
     */
    toggle() {
        if (this.disabled) return this;
        
        return this.isOpen ? this.close() : this.open();
    }
    
    /**
     * Set the dropdown value
     * @param {string|Array} value - Value or array of values
     * @returns {Dropdown} - The dropdown instance
     */
    setValue(value) {
        if (this.multiple && Array.isArray(value)) {
            this.selectedOptions = value.map(String);
        } else if (value !== null) {
            this.value = String(value);
        } else {
            this.value = null;
        }
        
        // Update select element
        Array.from(this.selectElement.options).forEach(option => {
            if (this.multiple) {
                option.selected = this.selectedOptions.includes(option.value);
            } else {
                option.selected = option.value === this.value;
            }
        });
        
        // Update display
        this._updateDisplay();
        
        // Dispatch change event
        this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        return this;
    }
    
    /**
     * Get the current value
     * @returns {string|Array} - Current value or array of values if multiple
     */
    getValue() {
        return this.multiple ? this.selectedOptions : this.value;
    }
    
    /**
     * Set the dropdown options
     * @param {Array} options - Array of option objects with value and label
     * @returns {Dropdown} - The dropdown instance
     */
    setOptions(options) {
        this.options = options || [];
        
        // Find container and update options
        const optionsContainer = this.dropdownMenu.querySelector('.sg-dropdown-options');
        if (optionsContainer) {
            this._createOptionElements(optionsContainer);
            this._setInitialValue();
            this._updateDisplay();
        }
        
        return this;
    }
    
    /**
     * Set disabled state
     * @param {boolean} disabled - Whether the dropdown is disabled
     * @returns {Dropdown} - The dropdown instance
     */
    setDisabled(disabled) {
        this.disabled = disabled;
        
        if (disabled) {
            this.dropdownTrigger.classList.add('sg-dropdown-disabled');
            this.dropdownTrigger.tabIndex = -1;
            this.selectElement.disabled = true;
            this.close();
        } else {
            this.dropdownTrigger.classList.remove('sg-dropdown-disabled');
            this.dropdownTrigger.tabIndex = 0;
            this.selectElement.disabled = false;
        }
        
        return this;
    }
    
    /**
     * Set error message
     * @param {string} error - Error message
     * @returns {Dropdown} - The dropdown instance
     */
    setError(error) {
        this.error = error || '';
        
        if (this.errorElement) {
            if (error) {
                this.errorElement.textContent = error;
                this.errorElement.style.display = 'block';
                this.element.classList.add('sg-form-field-error');
            } else {
                this.errorElement.textContent = '';
                this.errorElement.style.display = 'none';
                this.element.classList.remove('sg-form-field-error');
            }
        }
        
        return this;
    }
    
    /**
     * Validate the dropdown
     * @returns {boolean} - Whether the dropdown is valid
     */
    validate() {
        if (this.required) {
            if ((this.multiple && this.selectedOptions.length === 0) || 
                (!this.multiple && (this.value === null || this.value === ''))) {
                this.setError('This field is required');
                return false;
            }
        }
        
        // Clear error
        this.setError('');
        return true;
    }
    
    /**
     * Reset the dropdown
     * @returns {Dropdown} - The dropdown instance
     */
    reset() {
        // Reset value
        if (this.multiple) {
            this.selectedOptions = [];
        } else {
            this.value = null;
        }
        
        // Reset select element
        this.selectElement.selectedIndex = 0;
        
        // Update display
        this._updateDisplay();
        
        // Clear error
        this.setError('');
        
        return this;
    }
}

// Export the Dropdown component
export { Dropdown };