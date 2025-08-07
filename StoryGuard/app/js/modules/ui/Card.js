/**
 * Card.js
 * 
 * Standard card component for displaying content in a visually appealing way.
 * This provides consistent styling and behavior for all cards in the application.
 */

import { UIComponent } from './UIComponentCore.js';
import { Button } from './Button.js';
import { tryCatch } from '../error-handling-util.js';

class Card extends UIComponent {
    constructor(options = {}) {
        // Set default options for card
        const cardOptions = {
            tag: 'div',
            className: 'sg-card',
            ...options
        };
        
        super(cardOptions);
        
        // Card-specific properties
        this.title = options.title || '';
        this.subtitle = options.subtitle || '';
        this.content = options.content || '';
        this.image = options.image || null; // Image URL or HTML element
        this.imagePosition = options.imagePosition || 'top'; // top, left, right, bottom, cover
        this.footer = options.footer || null; // Footer content
        this.actions = options.actions || []; // Action buttons
        this.collapsible = options.collapsible || false;
        this.collapsed = options.collapsed || false;
        this.elevation = options.elevation || 1; // 0-5, determines shadow depth
        this.clickable = options.clickable || false;
        this.selected = options.selected || false;
        this.compact = options.compact || false;
        
        // Element references
        this.imageElement = null;
        this.headerElement = null;
        this.titleElement = null;
        this.subtitleElement = null;
        this.contentElement = null;
        this.footerElement = null;
        this.actionsElement = null;
        this.actionButtons = [];
        this.collapseButton = null;
        
        // Initialize card
        this._initializeCard();
    }
    
    /**
     * Initialize the card
     * @private
     */
    _initializeCard() {
        return tryCatch(() => {
            if (!this.element) return;
            
            // Add relevant classes
            if (this.imagePosition) {
                this.element.classList.add(`sg-card-image-${this.imagePosition}`);
            }
            
            if (this.elevation !== 1) {
                this.element.classList.add(`sg-card-elevation-${this.elevation}`);
            }
            
            if (this.clickable) {
                this.element.classList.add('sg-card-clickable');
                this.element.setAttribute('tabindex', '0');
            }
            
            if (this.selected) {
                this.element.classList.add('sg-card-selected');
            }
            
            if (this.compact) {
                this.element.classList.add('sg-card-compact');
            }
            
            // Create components in the right order
            this._createImage();
            this._createHeader();
            this._createContent();
            this._createFooter();
            
            // Add event listeners
            this._setupEventListeners();
            
            // Apply initial collapsed state if needed
            if (this.collapsible && this.collapsed) {
                this._toggleCollapsed(true);
            }
            
            return this;
        }, this, 'card', 'error', { cardTitle: this.title });
    }
    
    /**
     * Create image element
     * @private
     */
    _createImage() {
        return tryCatch(() => {
            if (!this.image) return;
            
            this.imageElement = document.createElement('div');
            this.imageElement.className = 'sg-card-image';
            
            // Handle different image types
            if (typeof this.image === 'string') {
                // URL string
                if (this.image.startsWith('http') || this.image.startsWith('./') || this.image.startsWith('/')) {
                    const img = document.createElement('img');
                    img.src = this.image;
                    img.alt = this.title || 'Card image';
                    this.imageElement.appendChild(img);
                } 
                // HTML string
                else {
                    this.imageElement.innerHTML = this.image;
                }
            } 
            // HTML Element
            else if (this.image instanceof HTMLElement) {
                this.imageElement.appendChild(this.image);
            }
            
            // Add image to card
            this.element.appendChild(this.imageElement);
        }, null, 'card', 'error', { cardTitle: this.title });
    }
    
    /**
     * Create header with title and subtitle
     * @private
     */
    _createHeader() {
        return tryCatch(() => {
            if (!this.title && !this.subtitle && !this.collapsible) return;
            
            this.headerElement = document.createElement('div');
            this.headerElement.className = 'sg-card-header';
            
            const titleContainer = document.createElement('div');
            titleContainer.className = 'sg-card-title-container';
            
            // Create title if provided
            if (this.title) {
                this.titleElement = document.createElement('h3');
                this.titleElement.className = 'sg-card-title';
                this.titleElement.textContent = this.title;
                titleContainer.appendChild(this.titleElement);
            }
            
            // Create subtitle if provided
            if (this.subtitle) {
                this.subtitleElement = document.createElement('div');
                this.subtitleElement.className = 'sg-card-subtitle';
                this.subtitleElement.textContent = this.subtitle;
                titleContainer.appendChild(this.subtitleElement);
            }
            
            this.headerElement.appendChild(titleContainer);
            
            // Add collapse button if collapsible
            if (this.collapsible) {
                this.collapseButton = document.createElement('button');
                this.collapseButton.className = 'sg-card-collapse-button';
                this.collapseButton.innerHTML = this.collapsed ? '&#9660;' : '&#9650;'; // Down/up arrow
                this.collapseButton.setAttribute('aria-label', this.collapsed ? 'Expand' : 'Collapse');
                this.collapseButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleCollapse();
                });
                
                this.headerElement.appendChild(this.collapseButton);
            }
            
            this.element.appendChild(this.headerElement);
        }, null, 'card', 'error', { cardTitle: this.title });
    }
    
    /**
     * Create content area
     * @private
     */
    _createContent() {
        return tryCatch(() => {
            this.contentElement = document.createElement('div');
            this.contentElement.className = 'sg-card-content';
            
            // Set content if provided
            if (this.content) {
                this.setContent(this.content);
            }
            
            this.element.appendChild(this.contentElement);
        }, null, 'card', 'error', { cardTitle: this.title });
    }
    
    /**
     * Create footer with actions
     * @private
     */
    _createFooter() {
        return tryCatch(() => {
            // Don't create footer if no actions or footer content
            if (!this.actions?.length && !this.footer) return;
            
            this.footerElement = document.createElement('div');
            this.footerElement.className = 'sg-card-footer';
            
            // Add footer content if provided
            if (this.footer) {
                if (typeof this.footer === 'string') {
                    const footerContent = document.createElement('div');
                    footerContent.className = 'sg-card-footer-content';
                    footerContent.innerHTML = this.footer;
                    this.footerElement.appendChild(footerContent);
                } else if (this.footer instanceof HTMLElement) {
                    const footerContent = document.createElement('div');
                    footerContent.className = 'sg-card-footer-content';
                    footerContent.appendChild(this.footer);
                    this.footerElement.appendChild(footerContent);
                } else if (this.footer instanceof UIComponent) {
                    const footerContent = document.createElement('div');
                    footerContent.className = 'sg-card-footer-content';
                    footerContent.appendChild(this.footer.element);
                    this.footerElement.appendChild(footerContent);
                }
            }
            
            // Add actions if provided
            if (this.actions?.length) {
                this._createActions();
            }
            
            this.element.appendChild(this.footerElement);
        }, null, 'card', 'error', { cardTitle: this.title });
    }
    
    /**
     * Create action buttons
     * @private
     */
    _createActions() {
        return tryCatch(() => {
            if (!this.footerElement || !this.actions?.length) return;
            
            // Create actions container
            this.actionsElement = document.createElement('div');
            this.actionsElement.className = 'sg-card-actions';
            
            // Clean up any existing buttons
            this.actionButtons.forEach(button => button.destroy());
            this.actionButtons = [];
            
            // Create each button
            this.actions.forEach(actionConfig => {
                const buttonOptions = {
                    content: actionConfig.text || '',
                    className: 'sg-button sg-button-text',
                    variant: actionConfig.variant || 'text',
                    parent: this.actionsElement
                };
                
                // Create button component
                const button = new Button(buttonOptions);
                
                // Add click handler
                if (typeof actionConfig.onClick === 'function') {
                    button.on('click', (e) => {
                        e.stopPropagation(); // Don't trigger card click
                        actionConfig.onClick.call(this, e, button);
                    });
                }
                
                // Add to buttons list
                this.actionButtons.push(button);
            });
            
            // Add actions to footer
            this.footerElement.appendChild(this.actionsElement);
        }, null, 'card', 'error', { cardTitle: this.title });
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        return tryCatch(() => {
            // Handle clickable card
            if (this.clickable) {
                this.element.addEventListener('click', (e) => {
                    // Don't trigger if clicking a button or link inside the card
                    if (e.target.closest('button, a, .sg-button')) return;
                    
                    // Trigger click event
                    this.element.dispatchEvent(new CustomEvent('sg-card-click', {
                        bubbles: true,
                        detail: { card: this }
                    }));
                    
                    // Call click handler if provided
                    if (typeof this.options.onClick === 'function') {
                        this.options.onClick.call(this, e);
                    }
                });
                
                // Handle keyboard enter/space for accessibility
                this.element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.element.click();
                    }
                });
            }
        }, null, 'card', 'error', { cardTitle: this.title });
    }
    
    /**
     * Toggle collapsed state
     * @param {boolean} collapsed - Whether to collapse or expand
     * @private
     */
    _toggleCollapsed(collapsed) {
        return tryCatch(() => {
            if (!this.collapsible) return;
            
            this.collapsed = collapsed;
            
            // Update content visibility
            if (this.contentElement) {
                this.contentElement.style.display = collapsed ? 'none' : 'block';
            }
            
            // Update footer visibility
            if (this.footerElement) {
                this.footerElement.style.display = collapsed ? 'none' : 'flex';
            }
            
            // Update collapse button
            if (this.collapseButton) {
                this.collapseButton.innerHTML = collapsed ? '&#9660;' : '&#9650;'; // Down/up arrow
                this.collapseButton.setAttribute('aria-label', collapsed ? 'Expand' : 'Collapse');
            }
            
            // Update class
            if (collapsed) {
                this.element.classList.add('sg-card-collapsed');
            } else {
                this.element.classList.remove('sg-card-collapsed');
            }
            
            // Trigger event
            this.element.dispatchEvent(new CustomEvent('sg-card-toggle', {
                bubbles: true,
                detail: { card: this, collapsed }
            }));
        }, null, 'card', 'error', { cardTitle: this.title, action: 'toggle-collapse' });
    }
    
    /**
     * Set the card title
     * @param {string} title - Card title
     * @returns {Card} - The card instance
     */
    setTitle(title) {
        this.title = title;
        
        if (this.titleElement) {
            this.titleElement.textContent = title;
        } else if (title) {
            // Need to create header if it doesn't exist
            if (!this.headerElement) {
                this._createHeader();
            } else if (!this.titleElement) {
                this.titleElement = document.createElement('h3');
                this.titleElement.className = 'sg-card-title';
                this.titleElement.textContent = this.title;
                
                if (this.headerElement.firstChild) {
                    this.headerElement.insertBefore(this.titleElement, this.headerElement.firstChild);
                } else {
                    this.headerElement.appendChild(this.titleElement);
                }
            }
        }
        
        return this;
    }
    
    /**
     * Set the card subtitle
     * @param {string} subtitle - Card subtitle
     * @returns {Card} - The card instance
     */
    setSubtitle(subtitle) {
        this.subtitle = subtitle;
        
        if (this.subtitleElement) {
            this.subtitleElement.textContent = subtitle;
        } else if (subtitle) {
            // Need to create header if it doesn't exist
            if (!this.headerElement) {
                this._createHeader();
            } else if (!this.subtitleElement) {
                this.subtitleElement = document.createElement('div');
                this.subtitleElement.className = 'sg-card-subtitle';
                this.subtitleElement.textContent = subtitle;
                
                if (this.titleElement && this.titleElement.nextSibling) {
                    this.headerElement.insertBefore(this.subtitleElement, this.titleElement.nextSibling);
                } else if (this.titleElement) {
                    this.headerElement.appendChild(this.subtitleElement);
                } else {
                    this.headerElement.appendChild(this.subtitleElement);
                }
            }
        }
        
        return this;
    }
    
    /**
     * Set the card content
     * @param {string|HTMLElement|UIComponent} content - Card content
     * @returns {Card} - The card instance
     */
    setContent(content) {
        this.content = content;
        
        if (!this.contentElement) {
            this._createContent();
            return this;
        }
        
        // Clear current content
        while (this.contentElement.firstChild) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
        
        // Set new content
        if (typeof content === 'string') {
            this.contentElement.innerHTML = content;
        } else if (content instanceof UIComponent) {
            this.contentElement.appendChild(content.element);
        } else if (content instanceof HTMLElement) {
            this.contentElement.appendChild(content);
        }
        
        return this;
    }
    
    /**
     * Set the card image
     * @param {string|HTMLElement} image - Card image URL or element
     * @param {string} position - Image position (top, left, right, bottom, cover)
     * @returns {Card} - The card instance
     */
    setImage(image, position = null) {
        this.image = image;
        
        if (position) {
            // Remove current position class
            ['top', 'left', 'right', 'bottom', 'cover'].forEach(pos => {
                this.element.classList.remove(`sg-card-image-${pos}`);
            });
            
            // Set new position
            this.imagePosition = position;
            this.element.classList.add(`sg-card-image-${position}`);
        }
        
        // Remove existing image if any
        if (this.imageElement && this.imageElement.parentNode) {
            this.imageElement.parentNode.removeChild(this.imageElement);
            this.imageElement = null;
        }
        
        // Create new image
        if (image) {
            this._createImage();
            
            // Make sure image is first child
            if (this.imageElement && this.element.firstChild !== this.imageElement) {
                this.element.insertBefore(this.imageElement, this.element.firstChild);
            }
        }
        
        return this;
    }
    
    /**
     * Set the card actions
     * @param {Array} actions - Action button configurations
     * @returns {Card} - The card instance
     */
    setActions(actions) {
        this.actions = actions || [];
        
        // If footer doesn't exist but we have actions, create it
        if (!this.footerElement && this.actions.length) {
            this._createFooter();
        } 
        // If footer exists, update actions
        else if (this.footerElement) {
            // Remove existing actions if any
            if (this.actionsElement && this.actionsElement.parentNode) {
                this.actionsElement.parentNode.removeChild(this.actionsElement);
                this.actionsElement = null;
            }
            
            // Create new actions
            if (this.actions.length) {
                this._createActions();
            }
            
            // Remove footer if empty
            if (!this.actions.length && !this.footer && this.footerElement.childNodes.length === 0) {
                this.element.removeChild(this.footerElement);
                this.footerElement = null;
            }
        }
        
        return this;
    }
    
    /**
     * Add an action button
     * @param {Object} actionConfig - Action configuration
     * @returns {Card} - The card instance
     */
    addAction(actionConfig) {
        if (!actionConfig) return this;
        
        // Add to actions array
        if (!this.actions) this.actions = [];
        this.actions.push(actionConfig);
        
        // Update actions
        return this.setActions(this.actions);
    }
    
    /**
     * Set card elevation level
     * @param {number} level - Elevation level (0-5)
     * @returns {Card} - The card instance
     */
    setElevation(level) {
        if (level < 0) level = 0;
        if (level > 5) level = 5;
        
        // Remove current elevation class
        for (let i = 0; i <= 5; i++) {
            this.element.classList.remove(`sg-card-elevation-${i}`);
        }
        
        // Set new elevation
        this.elevation = level;
        if (level !== 1) { // 1 is default
            this.element.classList.add(`sg-card-elevation-${level}`);
        }
        
        return this;
    }
    
    /**
     * Toggle collapsible state
     * @returns {Card} - The card instance
     */
    toggleCollapse() {
        if (!this.collapsible) return this;
        
        this._toggleCollapsed(!this.collapsed);
        return this;
    }
    
    /**
     * Expand the card
     * @returns {Card} - The card instance
     */
    expand() {
        if (this.collapsible && this.collapsed) {
            this._toggleCollapsed(false);
        }
        return this;
    }
    
    /**
     * Collapse the card
     * @returns {Card} - The card instance
     */
    collapse() {
        if (this.collapsible && !this.collapsed) {
            this._toggleCollapsed(true);
        }
        return this;
    }
    
    /**
     * Set selected state
     * @param {boolean} selected - Whether the card is selected
     * @returns {Card} - The card instance
     */
    setSelected(selected) {
        this.selected = selected;
        
        if (selected) {
            this.element.classList.add('sg-card-selected');
        } else {
            this.element.classList.remove('sg-card-selected');
        }
        
        // Trigger selection event
        this.element.dispatchEvent(new CustomEvent('sg-card-select', {
            bubbles: true,
            detail: { card: this, selected }
        }));
        
        return this;
    }
    
    /**
     * Toggle selected state
     * @returns {Card} - The card instance
     */
    toggleSelected() {
        return this.setSelected(!this.selected);
    }
    
    /**
     * Set clickable state
     * @param {boolean} clickable - Whether the card is clickable
     * @returns {Card} - The card instance
     */
    setClickable(clickable) {
        this.clickable = clickable;
        
        if (clickable) {
            this.element.classList.add('sg-card-clickable');
            this.element.setAttribute('tabindex', '0');
        } else {
            this.element.classList.remove('sg-card-clickable');
            this.element.removeAttribute('tabindex');
        }
        
        return this;
    }
}

// Export the Card component
export { Card };
