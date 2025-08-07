/**
 * UIComponentCore.js
 * 
 * Core functionality for the UI component system.
 * This module provides the base classes and utilities for the component library.
 */

import { tryCatch, safeEventListener } from '../error-handling-util.js';

// Base class for all UI components
class UIComponent {
    constructor(options = {}) {
        this.element = null;
        this.id = options.id || `ui-component-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.className = options.className || '';
        this.events = {};
        this.children = [];
        this.parent = null;
        this.options = options;
        this.state = {};
        
        // Initialize if options provided
        if (options.element || options.tag) {
            this.initialize(options);
        }
    }
    
    /**
     * Initialize the component
     * @param {Object} options - Configuration options
     * @returns {UIComponent} - The component instance
     */
    initialize(options = {}) {
        return tryCatch(() => {
            // Use existing element or create new one
            if (options.element && options.element instanceof HTMLElement) {
                this.element = options.element;
            } else {
                const tag = options.tag || 'div';
                this.element = document.createElement(tag);
            }
            
            // Set ID if provided and not already set
            if (options.id && this.element.id !== options.id) {
                this.element.id = options.id;
                this.id = options.id;
            } else if (!this.element.id) {
                this.element.id = this.id;
            }
            
            // Add classes
            if (this.className) {
                this._addClasses(this.className);
            }
            if (options.className) {
                this._addClasses(options.className);
            }
            
            // Add attributes
            if (options.attributes) {
                Object.entries(options.attributes).forEach(([key, value]) => {
                    this.element.setAttribute(key, value);
                });
            }
            
            // Set styles
            if (options.style) {
                Object.entries(options.style).forEach(([key, value]) => {
                    this.element.style[key] = value;
                });
            }
            
            // Set content
            if (options.content !== undefined) {
                this.setContent(options.content);
            }
            
            // Set initial state
            if (options.state) {
                this.state = { ...options.state };
            }
            
            // Add event listeners
            if (options.events) {
                Object.entries(options.events).forEach(([event, handler]) => {
                    this.on(event, handler);
                });
            }
            
            // Append to parent if provided
            if (options.parent) {
                if (options.parent instanceof UIComponent) {
                    options.parent.append(this);
                } else if (options.parent instanceof HTMLElement) {
                    options.parent.appendChild(this.element);
                    this.parent = options.parent;
                } else if (typeof options.parent === 'string') {
                    const parentElement = document.querySelector(options.parent);
                    if (parentElement) {
                        parentElement.appendChild(this.element);
                        this.parent = parentElement;
                    }
                }
            }
            
            return this;
        }, this, 'ui-component', 'error', { componentId: this.id });
    }
    
    /**
     * Add CSS classes to the component
     * @param {string|Array} classes - CSS class(es) to add
     * @returns {UIComponent} - The component instance
     * @private
     */
    _addClasses(classes) {
        if (!this.element) return this;
        
        if (typeof classes === 'string') {
            classes.split(' ').forEach(cls => {
                if (cls.trim()) {
                    this.element.classList.add(cls.trim());
                }
            });
        } else if (Array.isArray(classes)) {
            classes.forEach(cls => {
                if (typeof cls === 'string' && cls.trim()) {
                    this.element.classList.add(cls.trim());
                }
            });
        }
        
        return this;
    }
    
    /**
     * Remove CSS classes from the component
     * @param {string|Array} classes - CSS class(es) to remove
     * @returns {UIComponent} - The component instance
     */
    removeClass(classes) {
        if (!this.element) return this;
        
        if (typeof classes === 'string') {
            classes.split(' ').forEach(cls => {
                if (cls.trim()) {
                    this.element.classList.remove(cls.trim());
                }
            });
        } else if (Array.isArray(classes)) {
            classes.forEach(cls => {
                if (typeof cls === 'string' && cls.trim()) {
                    this.element.classList.remove(cls.trim());
                }
            });
        }
        
        return this;
    }
    
    /**
     * Add an event listener to the component
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     * @returns {UIComponent} - The component instance
     */
    on(event, handler, options = {}) {
        if (!this.element || typeof handler !== 'function') return this;
        
        // Create safe event handler
        const safeHandler = (...args) => {
            try {
                return handler.apply(this, args);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
                // Re-throw to allow bubbling if needed
                throw error;
            }
        };
        
        // Store reference for cleanup
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        // Use safeEventListener from error handling util
        const removeListener = safeEventListener(
            this.element,
            event,
            safeHandler,
            {
                source: `ui-component-${this.id}`,
                level: 'error',
                ...options
            }
        );
        
        this.events[event].push({ handler, removeListener });
        
        return this;
    }
    
    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler (optional, remove all if not provided)
     * @returns {UIComponent} - The component instance
     */
    off(event, handler) {
        if (!this.element || !this.events[event]) return this;
        
        if (handler) {
            // Remove specific handler
            const index = this.events[event].findIndex(e => e.handler === handler);
            if (index !== -1) {
                this.events[event][index].removeListener();
                this.events[event].splice(index, 1);
            }
        } else {
            // Remove all handlers for this event
            this.events[event].forEach(e => e.removeListener());
            delete this.events[event];
        }
        
        return this;
    }
    
    /**
     * Remove all event listeners
     * @returns {UIComponent} - The component instance
     */
    removeAllEventListeners() {
        if (!this.element) return this;
        
        Object.keys(this.events).forEach(event => {
            this.events[event].forEach(e => e.removeListener());
        });
        
        this.events = {};
        
        return this;
    }
    
    /**
     * Set the inner content of the component
     * @param {string|HTMLElement|UIComponent} content - Content to set
     * @returns {UIComponent} - The component instance
     */
    setContent(content) {
        if (!this.element) return this;
        
        // Clear current content
        this.empty();
        
        // Set new content
        if (content instanceof UIComponent) {
            this.append(content);
        } else if (content instanceof HTMLElement) {
            this.element.appendChild(content);
        } else {
            this.element.innerHTML = content;
        }
        
        return this;
    }
    
    /**
     * Append a child to this component
     * @param {UIComponent|HTMLElement} child - Child to append
     * @returns {UIComponent} - The component instance
     */
    append(child) {
        if (!this.element) return this;
        
        if (child instanceof UIComponent) {
            this.element.appendChild(child.element);
            child.parent = this;
            this.children.push(child);
        } else if (child instanceof HTMLElement) {
            this.element.appendChild(child);
        }
        
        return this;
    }
    
    /**
     * Prepend a child to this component
     * @param {UIComponent|HTMLElement} child - Child to prepend
     * @returns {UIComponent} - The component instance
     */
    prepend(child) {
        if (!this.element) return this;
        
        if (child instanceof UIComponent) {
            this.element.insertBefore(child.element, this.element.firstChild);
            child.parent = this;
            this.children.unshift(child);
        } else if (child instanceof HTMLElement) {
            this.element.insertBefore(child, this.element.firstChild);
        }
        
        return this;
    }
    
    /**
     * Empty the component (remove all children)
     * @returns {UIComponent} - The component instance
     */
    empty() {
        if (!this.element) return this;
        
        // Clean up child components
        this.children.forEach(child => child.destroy());
        this.children = [];
        
        // Remove all child elements
        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }
        
        return this;
    }
    
    /**
     * Remove the component from the DOM
     * @returns {UIComponent} - The component instance
     */
    remove() {
        if (!this.element) return this;
        
        // Remove from parent
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Clear parent reference
        if (this.parent instanceof UIComponent) {
            const index = this.parent.children.indexOf(this);
            if (index !== -1) {
                this.parent.children.splice(index, 1);
            }
        }
        
        this.parent = null;
        
        return this;
    }
    
    /**
     * Destroy the component and clean up resources
     */
    destroy() {
        // Clean up child components
        this.children.forEach(child => child.destroy());
        this.children = [];
        
        // Remove all event listeners
        this.removeAllEventListeners();
        
        // Remove from DOM
        this.remove();
        
        // Clear references
        this.element = null;
        this.parent = null;
    }
    
    /**
     * Set component state
     * @param {Object} newState - New state to set
     * @param {boolean} update - Whether to trigger update
     * @returns {UIComponent} - The component instance
     */
    setState(newState, update = true) {
        this.state = { ...this.state, ...newState };
        
        if (update) {
            this.update();
        }
        
        return this;
    }
    
    /**
     * Update the component based on current state
     * @returns {UIComponent} - The component instance
     */
    update() {
        // Override in subclasses
        return this;
    }
    
    /**
     * Show the component
     * @returns {UIComponent} - The component instance
     */
    show() {
        if (this.element) {
            this.element.style.display = '';
        }
        return this;
    }
    
    /**
     * Hide the component
     * @returns {UIComponent} - The component instance
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
        return this;
    }
    
    /**
     * Toggle component visibility
     * @returns {UIComponent} - The component instance
     */
    toggle() {
        if (!this.element) return this;
        
        if (this.element.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
        
        return this;
    }
    
    /**
     * Check if component is visible
     * @returns {boolean} - Whether component is visible
     */
    isVisible() {
        return this.element && this.element.style.display !== 'none';
    }
    
    /**
     * Enable the component
     * @returns {UIComponent} - The component instance
     */
    enable() {
        if (this.element) {
            this.element.removeAttribute('disabled');
            this.removeClass('disabled');
        }
        return this;
    }
    
    /**
     * Disable the component
     * @returns {UIComponent} - The component instance
     */
    disable() {
        if (this.element) {
            this.element.setAttribute('disabled', '');
            this._addClasses('disabled');
        }
        return this;
    }
}

// Export the core class
export { UIComponent };
