/**
 * Form Validation Module for Story Database
 * Provides comprehensive validation for all forms with clear error feedback
 */

// Validation rules
const VALIDATION_RULES = {
    required: {
        test: value => value !== undefined && value !== null && value.toString().trim() !== '',
        message: 'This field is required'
    },
    email: {
        test: value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email address'
    },
    minLength: (min) => ({
        test: value => !value || value.length >= min,
        message: `Must be at least ${min} characters`
    }),
    maxLength: (max) => ({
        test: value => !value || value.length <= max,
        message: `Cannot exceed ${max} characters`
    }),
    numeric: {
        test: value => !value || /^[0-9]+$/.test(value),
        message: 'Please enter numbers only'
    },
    alphanumeric: {
        test: value => !value || /^[a-zA-Z0-9]+$/.test(value),
        message: 'Please use only letters and numbers'
    },
    url: {
        test: value => !value || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(value),
        message: 'Please enter a valid URL'
    }
};

// Form schemas for different entity types
const VALIDATION_SCHEMAS = {
    character: {
        firstName: [VALIDATION_RULES.required],
        lastName: [],
        email: [VALIDATION_RULES.email],
        notes: [VALIDATION_RULES.maxLength(5000)]
    },
    location: {
        locationName: [VALIDATION_RULES.required],
        locationDescription: [VALIDATION_RULES.maxLength(5000)]
    },
    plot: {
        plotTitle: [VALIDATION_RULES.required],
        plotDescription: [VALIDATION_RULES.maxLength(5000)]
    },
    worldElement: {
        elementName: [VALIDATION_RULES.required],
        elementDescription: [VALIDATION_RULES.maxLength(5000)]
    }
};

/**
 * Validate a form based on its type
 * @param {Object} formData - The form data to validate
 * @param {string} formType - The type of form (character, location, etc.)
 * @returns {Object} Validation result with isValid flag and errors object
 */
function validateForm(formData, formType) {
    // Skip validation for worldElement, plot, location, and character - they have their own validation
    if (formType === 'worldElement' || formType === 'plot' || formType === 'location' || formType === 'character') {
        console.log(`Skipping validation for ${formType} - using custom validation`);
        return { isValid: true, errors: {} };
    }
    
    // Get the validation schema for this form type
    const schema = VALIDATION_SCHEMAS[formType];
    if (!schema) {
        console.warn(`No validation schema found for form type: ${formType}`);
        return { isValid: true, errors: {} };
    }
    
    const errors = {};
    
    // Validate each field against its rules
    Object.entries(schema).forEach(([field, rules]) => {
        let value = formData[field];
        
        // Special handling for rich text content
        if (field.includes('Description') && value && value.includes('<')) {
            // For rich text, strip HTML tags for validation
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = value;
            value = tempDiv.textContent || tempDiv.innerText || '';
        }
        
        // Apply each rule to the field
        for (const rule of rules) {
            if (!rule.test(value)) {
                errors[field] = rule.message;
                break; // Stop at first failed rule
            }
        }
    });
    
    // Return validation result
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
        
        // Method to display errors in the form
        displayErrors: function(form) {
            // Clear previous errors
            form.querySelectorAll('.validation-error').forEach(el => el.remove());
            form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
            
            // Display new errors
            Object.entries(this.errors).forEach(([field, message]) => {
                const input = form.querySelector(`[name="${field}"], #${field}`);
                if (input) {
                    // Add error class to input
                    input.classList.add('error-input');
                    
                    // Create error message element
                    const errorElement = document.createElement('div');
                    errorElement.className = 'validation-error';
                    errorElement.textContent = message;
                    errorElement.style.color = '#e74c3c';
                    errorElement.style.fontSize = '0.85rem';
                    errorElement.style.marginTop = '5px';
                    
                    // Add error message after input
                    const parentElement = input.parentNode;
                    parentElement.insertBefore(errorElement, input.nextSibling);
                    
                    // Log the error for debugging
                    console.log(`Validation error for ${field}: ${message}`);
                }
            });
            
            // If there are errors, scroll to the first one
            if (Object.keys(this.errors).length > 0) {
                const firstErrorField = Object.keys(this.errors)[0];
                const firstErrorElement = form.querySelector(`[name="${firstErrorField}"], #${firstErrorField}`);
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorElement.focus();
                }
                
                // Show toast with error summary
                if (window.Core && typeof Core.showToast === 'function') {
                    Core.showToast('Please correct the errors in the form', 'error');
                }
            }
        }
    };
}

/**
 * Add a custom validation rule to a form schema
 * @param {string} formType - The type of form to add the rule to
 * @param {string} field - The field name to validate
 * @param {Function} testFn - The validation test function
 * @param {string} message - The error message to display
 */
function addCustomValidationRule(formType, field, testFn, message) {
    // Ensure the schema exists
    if (!VALIDATION_SCHEMAS[formType]) {
        VALIDATION_SCHEMAS[formType] = {};
    }
    
    // Ensure the field exists in the schema
    if (!VALIDATION_SCHEMAS[formType][field]) {
        VALIDATION_SCHEMAS[formType][field] = [];
    }
    
    // Add the custom rule
    VALIDATION_SCHEMAS[formType][field].push({
        test: testFn,
        message: message
    });
    
    console.log(`Added custom validation rule for ${formType}.${field}`);
}

/**
 * Validate a single field
 * @param {string} formType - The type of form
 * @param {string} field - The field name to validate
 * @param {*} value - The value to validate
 * @returns {Object} Validation result with isValid flag and error message
 */
function validateField(formType, field, value) {
    // Skip validation for worldElement, plot, location, and character - they have their own validation
    if (formType === 'worldElement' || formType === 'plot' || formType === 'location' || formType === 'character') {
        console.log(`Skipping field validation for ${formType} - using custom validation`);
        return { isValid: true };
    }
    
    // Get the validation schema for this form type
    const schema = VALIDATION_SCHEMAS[formType];
    if (!schema || !schema[field]) {
        return { isValid: true };
    }
    
    // Apply each rule to the field
    for (const rule of schema[field]) {
        if (!rule.test(value)) {
            return {
                isValid: false,
                error: rule.message
            };
        }
    }
    
    return { isValid: true };
}

/**
 * Add real-time validation to a form
 * @param {HTMLFormElement} form - The form element
 * @param {string} formType - The type of form
 */
function setupLiveValidation(form, formType) {
    // Skip validation for worldElementForm, plotForm, locationForm, and characterForm - they have their own validation
    if (form.id === 'worldElementForm' || form.id === 'plotForm' || form.id === 'locationForm' || form.id === 'characterForm') {
        console.log(`Skipping validation setup for ${form.id} - using custom validation`);
        return;
    }
    
    // Get the validation schema for this form type
    const schema = VALIDATION_SCHEMAS[formType];
    if (!schema) {
        console.warn(`No validation schema found for form type: ${formType}`);
        return;
    }
    
    // Add blur event listeners to all fields in the schema
    Object.keys(schema).forEach(field => {
        const input = form.querySelector(`[name="${field}"], #${field}`);
        if (input) {
            input.addEventListener('blur', () => {
                // Validate just this field
                const result = validateField(formType, field, input.value);
                
                // Clear previous error for this field
                const existingError = input.parentNode.querySelector('.validation-error');
                if (existingError) {
                    existingError.remove();
                }
                input.classList.remove('error-input');
                
                // If invalid, show error
                if (!result.isValid) {
                    input.classList.add('error-input');
                    
                    // Create error message element
                    const errorElement = document.createElement('div');
                    errorElement.className = 'validation-error';
                    errorElement.textContent = result.error;
                    errorElement.style.color = '#e74c3c';
                    errorElement.style.fontSize = '0.85rem';
                    errorElement.style.marginTop = '5px';
                    
                    // Add error message after input
                    input.parentNode.insertBefore(errorElement, input.nextSibling);
                }
            });
        }
    });
    
    // Add submit handler to validate all fields
    form.addEventListener('submit', function(event) {
        // Get all form data
        const formData = {};
        Object.keys(schema).forEach(field => {
            const input = form.querySelector(`[name="${field}"], #${field}`);
            if (input) {
                formData[field] = input.value;
            }
        });
        
        // Validate the form
        const validationResult = validateForm(formData, formType);
        
        // If invalid, prevent submission and show errors
        if (!validationResult.isValid) {
            event.preventDefault();
            validationResult.displayErrors(form);
            return false;
        }
        
        return true;
    });
    
    console.log(`Live validation set up for ${formType} form`);
}

// Export validation functions
window.Validation = {
    validateForm,
    validateField,
    setupLiveValidation,
    addCustomValidationRule,
    VALIDATION_RULES
};