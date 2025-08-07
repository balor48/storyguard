/**
 * UIManager.js
 * 
 * A centralized UI management module for the Story Database Desktop application.
 * This module handles UI operations such as tab switching, dark mode, notifications,
 * modal dialogs, and other UI-related functionality.
 *
 * Part of the application's modular architecture refactoring.
 */

// Import dependencies
import { ErrorHandlingManager, tryCatch } from './ErrorHandlingManager.js';

/**
 * UIManager - Centralizes all UI operations
 */
class UIManager {
    constructor() {
        this.isInitialized = false;
        this.activeTab = null;
        this.isDarkMode = false;
        this.isToastEnabled = true;
        this.activeModals = [];
        this.eventListeners = {};
    }

    /**
     * Initialize the UI manager
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('UIManager already initialized');
            return this;
        }

        // Load settings from localStorage
        this._loadSettings();
        
        // Apply theme based on settings
        this._applyTheme();
        
        // Initialize UI components
        this._initializeComponents();
        
        // Set up event listeners
        this._setupEventListeners();
        
        this.isInitialized = true;
        
        return this;
    }
    
    /**
     * Load UI settings from localStorage
     * @private
     */
    _loadSettings() {
        return tryCatch(() => {
            // Load dark mode setting
            this.isDarkMode = this._safelyGetItem('darkMode', 'false') === 'true';
            
            // Load toast notification setting
            this.isToastEnabled = this._safelyGetItem('toastNotificationsEnabled', 'true') === 'true';
            
            // Load the last active tab
            this.activeTab = this._safelyGetItem('lastActiveTab', 'dashboard');
            
            console.log('UI settings loaded:', {
                darkMode: this.isDarkMode,
                toastEnabled: this.isToastEnabled,
                activeTab: this.activeTab
            });
        }, null, 'ui-manager');
    }
    
    /**
     * Initialize UI components
     * @private
     */
    _initializeComponents() {
        return tryCatch(() => {
            // Initialize database indicator
            this.updateDatabaseIndicator();
            
            // Initialize theme
            this.initializeDarkMode();
            
            // Initialize toast notifications
            this.initializeToastNotifications();
        }, null, 'ui-manager');
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        return tryCatch(() => {
            // Listen for theme preference changes from system
            if (window.matchMedia) {
                const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                darkModeMediaQuery.addEventListener('change', (e) => {
                    if (this._safelyGetItem('themePreference', 'system') === 'system') {
                        this.isDarkMode = e.matches;
                        this._applyTheme();
                    }
                });
            }
            
            // Set up back-to-top button if it exists
            const backToTopButton = document.getElementById('backToTop');
            if (backToTopButton) {
                backToTopButton.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                // Show/hide back-to-top button based on scroll position
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 300) {
                        backToTopButton.style.display = 'block';
                    } else {
                        backToTopButton.style.display = 'none';
                    }
                });
            }
            
            // Listen for settings changes
            if (window.SettingsManager) {
                window.SettingsManager.on('settings-updated', (settings) => {
                    if (settings && settings.themePreference) {
                        this._handleThemePreferenceChange(settings.themePreference);
                    }
                });
            }
        }, null, 'ui-manager');
    }
    
    /**
     * Apply the current theme
     * @private
     */
    _applyTheme() {
        return tryCatch(() => {
            const bodyElement = document.body;
            
            if (this.isDarkMode) {
                bodyElement.classList.add('dark-mode');
                bodyElement.classList.remove('light-mode');
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                bodyElement.classList.add('light-mode');
                bodyElement.classList.remove('dark-mode');
                document.documentElement.setAttribute('data-theme', 'light');
            }
            
            // Update theme meta tag for mobile
            let metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (!metaThemeColor) {
                metaThemeColor = document.createElement('meta');
                metaThemeColor.name = 'theme-color';
                document.head.appendChild(metaThemeColor);
            }
            
            metaThemeColor.content = this.isDarkMode ? '#333333' : '#f5f5f5';
            
            // Save setting to localStorage
            this._safelySetItem('darkMode', this.isDarkMode.toString());
            
            // Notify any listeners about theme change
            this._triggerEvent('theme-changed', { isDarkMode: this.isDarkMode });
            
            console.log(`Theme applied: ${this.isDarkMode ? 'Dark' : 'Light'} mode`);
        }, null, 'ui-manager');
    }
    
    /**
     * Handle theme preference change
     * @param {string} preference - Theme preference ('light', 'dark', or 'system')
     * @private
     */
    _handleThemePreferenceChange(preference) {
        return tryCatch(() => {
            if (preference === 'system') {
                // Use system preference
                if (window.matchMedia) {
                    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }
            } else if (preference === 'dark') {
                this.isDarkMode = true;
            } else {
                this.isDarkMode = false;
            }
            
            this._applyTheme();
        }, null, 'ui-manager');
    }
    
    /**
     * Register an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     * @returns {Function} - Unsubscribe function
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        
        this.eventListeners[event].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        };
    }
    
    /**
     * Trigger an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @private
     */
    _triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Safely get an item from localStorage
     * @param {string} key - Storage key
     * @param {string} defaultValue - Default value if not found
     * @returns {string} - The value or default
     * @private
     */
    _safelyGetItem(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (error) {
            console.error(`Error accessing localStorage for key ${key}:`, error);
            return defaultValue;
        }
    }
    
    /**
     * Safely set an item in localStorage
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @private
     */
    _safelySetItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Error saving to localStorage for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Switch to a different tab
     * @param {string} tabName - Name of the tab to switch to
     * @returns {boolean} - Success status
     */
    switchTab(tabName) {
        return tryCatch(() => {
            if (!this.isInitialized) {
                this.initialize();
            }
            
            console.log(`Switching to tab: ${tabName}`);
            
            // Get the current active tab
            const currentActiveTab = document.querySelector('.tab-content.active');
            const currentTabId = currentActiveTab ? currentActiveTab.id : null;
            const currentTabName = currentTabId ? currentTabId.replace('-tab', '') : null;
            
            // Save the new tab as active
            this.activeTab = tabName;
            this._safelySetItem('lastActiveTab', tabName);
            
            // Update button states
            try {
                document.querySelectorAll('.tab-button').forEach(button => {
                    if (button && button.classList) {
                        button.classList.remove('active');
                        // Normalize both strings for comparison: remove hyphens and convert to lowercase
                        const buttonText = button.textContent ? button.textContent.toLowerCase().replace(/-/g, '') : '';
                        const normalizedTabName = tabName.toLowerCase().replace(/-/g, '');
                        
                        if (buttonText.includes(normalizedTabName)) {
                            button.classList.add('active');
                        }
                    }
                });
            } catch (error) {
                ErrorHandlingManager.handleWarning(error, 'ui-manager', {
                    message: 'Error updating button states during tab switch'
                });
            }
    
            // Update tab content visibility
            try {
                document.querySelectorAll('.tab-content').forEach(content => {
                    if (content && content.classList) {
                        content.classList.remove('active');
                    }
                });
                
                const tabElement = document.getElementById(`${tabName}-tab`);
                if (tabElement && tabElement.classList) {
                    tabElement.classList.add('active');
                } else {
                    console.error(`Tab element not found or classList not available: ${tabName}-tab`);
                    // Create the tab element if it doesn't exist
                    if (!tabElement) {
                        console.log(`Creating missing tab element: ${tabName}-tab`);
                        const newTabElement = document.createElement('div');
                        newTabElement.id = `${tabName}-tab`;
                        newTabElement.className = 'tab-content active';
                        document.querySelector('.container').appendChild(newTabElement);
                    }
                }
            } catch (error) {
                ErrorHandlingManager.handleWarning(error, 'ui-manager', {
                    message: 'Error updating tab visibility during tab switch'
                });
            }
    
            // Initialize appropriate content for the tab
            this._initializeTabContent(tabName);
            
            // Trigger event for tab change
            this._triggerEvent('tab-changed', { 
                previousTab: currentTabName,
                currentTab: tabName
            });
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Initialize the content for a specific tab
     * @param {string} tabName - Name of the tab to initialize
     * @private
     */
    _initializeTabContent(tabName) {
        return tryCatch(() => {
            if (tabName === 'dashboard') {
                if (window.Dashboard && window.Dashboard.displayDashboard) {
                    window.Dashboard.displayDashboard();
                }
            } else if (tabName === 'characters') {
                if (window.Characters && window.Characters.displayCharacters) {
                    window.Characters.displayCharacters();
                }
                // Update relationships if available
                if (window.Relationships && window.Relationships.updateRelationshipsList) {
                    window.Relationships.updateRelationshipsList();
                }
            } else if (tabName === 'locations') {
                if (window.Locations && window.Locations.displayLocations) {
                    window.Locations.displayLocations();
                }
            } else if (tabName === 'plots') {
                if (window.Plots && window.Plots.displayPlots) {
                    window.Plots.displayPlots();
                }
            } else if (tabName === 'worldbuilding') {
                // Clear any existing world search debounce timer
                if (window.worldSearchDebounceTimer) {
                    clearTimeout(window.worldSearchDebounceTimer);
                }
                
                if (window.WorldBuilding && window.WorldBuilding.displayWorldBuilding) {
                    window.WorldBuilding.displayWorldBuilding();
                }
            } else if (tabName === 'relationships') {
                if (window.Relationships && window.Relationships.displayRelationships) {
                    window.Relationships.displayRelationships();
                }
            } else if (tabName === 'timeline') {
                if (window.Timeline && window.Timeline.displayTimeline) {
                    window.Timeline.displayTimeline();
                }
            } else if (tabName === 'statistics') {
                if (window.Statistics && window.Statistics.displayStatistics) {
                    window.Statistics.displayStatistics();
                }
            }
        }, null, 'ui-manager');
    }
    
    /**
     * Refresh all tabs by re-initializing their content
     * @returns {boolean} - Success status
     */
    refreshAllTabs() {
        return tryCatch(() => {
            // List of all tabs to refresh
            const tabs = ['dashboard', 'characters', 'locations', 'plots', 'worldbuilding', 'relationships', 'timeline', 'statistics'];
            
            // Initialize content for each tab without switching to it
            tabs.forEach(tab => {
                this._initializeTabContent(tab);
            });
            
            // Finally switch to the current tab to ensure it's displayed correctly
            return this.switchTab(this.activeTab || 'dashboard');
        }, false, 'ui-manager');
    }
    
    /**
     * Toggle dark mode on/off
     * @returns {boolean} - New dark mode state
     */
    toggleDarkMode() {
        return tryCatch(() => {
            this.isDarkMode = !this.isDarkMode;
            this._applyTheme();
            return this.isDarkMode;
        }, false, 'ui-manager');
    }
    
    /**
     * Initialize dark mode based on settings
     * @returns {boolean} - Success status
     */
    initializeDarkMode() {
        return tryCatch(() => {
            // Check for theme preference in settings
            const themePreference = this._safelyGetItem('themePreference', 'system');
            
            // Apply theme based on preference
            if (themePreference === 'system') {
                // Use system preference if available
                if (window.matchMedia) {
                    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }
            } else if (themePreference === 'dark') {
                this.isDarkMode = true;
            } else {
                this.isDarkMode = false;
            }
            
            this._applyTheme();
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Update the database indicator with the current database name
     * @param {string} databaseName - Name of the current database
     * @returns {boolean} - Success status
     */
    updateDatabaseIndicator(databaseName) {
        return tryCatch(() => {
            // If no database name provided, get it from localStorage
            if (!databaseName) {
                databaseName = this._safelyGetItem('currentDatabaseName', 'Default');
            }
            
            console.log(`Updating database indicator: ${databaseName}`);
            
            // Update all database indicator elements
            const indicators = document.querySelectorAll('.database-indicator, #currentDatabaseName');
            indicators.forEach(indicator => {
                if (indicator) {
                    indicator.textContent = this.formatDatabaseName(databaseName);
                    indicator.title = databaseName;  // Full name as tooltip
                }
            });
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Format a database name for display (truncate if needed)
     * @param {string} name - Database name to format
     * @param {number} maxLength - Maximum length before truncation
     * @returns {string} - Formatted database name
     */
    formatDatabaseName(name, maxLength = 40) {
        return tryCatch(() => {
            if (!name) return 'Default';
            
            if (name.length <= maxLength) {
                return name;
            }
            
            // Truncate and add ellipsis
            return name.substring(0, maxLength - 3) + '...';
        }, 'Default', 'ui-manager');
    }
    
    /**
     * Show a notification toast
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, warning, info)
     * @param {Object} options - Additional options
     * @returns {boolean} - Success status
     */
    showNotification(message, type = 'info', options = {}) {
        return tryCatch(() => {
            // Check if notifications are enabled
            if (!this.isToastEnabled && !options.forceShow) {
                console.log(`Toast notification suppressed: ${message} (${type})`);
                return false;
            }
            
            console.log(`Showing notification: ${message} (${type})`);
            
            // If NotificationManager exists, use it
            if (window.NotificationManager) {
                return window.NotificationManager.show(message, type, options);
            }
            
            // Fallback to legacy toast method
            if (window.Core && window.Core.showToast) {
                return window.Core.showToast(message, type, options.duration || 3000);
            }
            
            // Last resort implementation
            this._createToastNotification(message, type, options);
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Create a toast notification element
     * @param {string} message - Message to display
     * @param {string} type - Type of notification
     * @param {Object} options - Additional options
     * @private
     */
    _createToastNotification(message, type = 'info', options = {}) {
        return tryCatch(() => {
            // Create toast container if it doesn't exist
            let toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toast-container';
                toastContainer.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 80%;
                `;
                document.body.appendChild(toastContainer);
            }
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.style.cssText = `
                background-color: ${this._getToastColor(type)};
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                margin-bottom: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
                word-wrap: break-word;
                max-width: 100%;
            `;
            
            // Add message
            toast.textContent = message;
            
            // Add close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.cssText = `
                float: right;
                cursor: pointer;
                margin-left: 10px;
                font-weight: bold;
            `;
            closeButton.addEventListener('click', () => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            });
            toast.insertBefore(closeButton, toast.firstChild);
            
            // Add to container
            toastContainer.appendChild(toast);
            
            // Show toast with animation
            setTimeout(() => {
                toast.style.opacity = '1';
            }, 10);
            
            // Auto-hide after duration
            const duration = options.duration || 3000;
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);
        }, null, 'ui-manager');
    }
    
    /**
     * Get the background color for a toast type
     * @param {string} type - Type of notification
     * @returns {string} - Color value
     * @private
     */
    _getToastColor(type) {
        switch (type.toLowerCase()) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            case 'warning': return '#FF9800';
            default: return '#2196F3'; // info
        }
    }
    
    /**
     * Initialize toast notifications
     * @returns {boolean} - Success status
     */
    initializeToastNotifications() {
        return tryCatch(() => {
            // Load toast notification setting
            this.isToastEnabled = this._safelyGetItem('toastNotificationsEnabled', 'true') === 'true';
            
            console.log(`Toast notifications initialized: ${this.isToastEnabled ? 'enabled' : 'disabled'}`);
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Toggle toast notifications on/off
     * @returns {boolean} - New state (true = enabled)
     */
    toggleToastNotifications() {
        return tryCatch(() => {
            this.isToastEnabled = !this.isToastEnabled;
            this._safelySetItem('toastNotificationsEnabled', this.isToastEnabled.toString());
            
            // Show confirmation of the change
            const message = this.isToastEnabled 
                ? 'Toast notifications enabled' 
                : 'Toast notifications disabled';
                
            this.showNotification(message, 'info', { forceShow: true });
            
            return this.isToastEnabled;
        }, false, 'ui-manager');
    }
    
    /**
     * Show a modal dialog
     * @param {string} titleOrContent - Title or content if no separate content provided
     * @param {string} content - Content HTML (optional)
     * @param {Object} options - Additional options
     * @returns {Object} - Modal object with close method
     */
    showModal(titleOrContent, content, options = {}) {
        return tryCatch(() => {
            console.log('Showing modal dialog');
            
            // If DialogManager exists, use it
            if (window.DialogManager) {
                return window.DialogManager.showDialog(titleOrContent, content, options);
            }
            
            // Determine if first parameter is title or content
            let title = options.noTitle ? '' : (content ? titleOrContent : 'Information');
            let modalContent = content || titleOrContent;
            
            // Create modal backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
            `;
            
            // Create modal container
            const modal = document.createElement('div');
            modal.className = 'modal-container';
            modal.style.cssText = `
                background-color: ${this.isDarkMode ? '#333' : '#fff'};
                color: ${this.isDarkMode ? '#fff' : '#333'};
                border-radius: 8px;
                padding: 20px;
                max-width: 80%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                position: relative;
            `;
            
            // Add title if provided
            if (title) {
                const titleElem = document.createElement('div');
                titleElem.className = 'modal-title';
                titleElem.innerHTML = title;
                titleElem.style.cssText = `
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid ${this.isDarkMode ? '#555' : '#ddd'};
                `;
                modal.appendChild(titleElem);
            }
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.className = 'modal-close';
            closeButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: transparent;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: ${this.isDarkMode ? '#ccc' : '#666'};
            `;
            modal.appendChild(closeButton);
            
            // Add content
            const contentElem = document.createElement('div');
            contentElem.className = 'modal-content';
            contentElem.innerHTML = modalContent;
            modal.appendChild(contentElem);
            
            // Add to backdrop and body
            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);
            
            // Track this modal
            const modalObj = { backdrop, modal, closed: false };
            this.activeModals.push(modalObj);
            
            // Handle close button click
            const closeModal = () => {
                if (modalObj.closed) return;
                
                backdrop.style.opacity = '0';
                setTimeout(() => {
                    if (backdrop.parentNode) {
                        document.body.removeChild(backdrop);
                    }
                    this.activeModals = this.activeModals.filter(m => m !== modalObj);
                    modalObj.closed = true;
                }, 300);
                
                // Call onClose callback if provided
                if (options.onClose && typeof options.onClose === 'function') {
                    options.onClose();
                }
            };
            
            closeButton.addEventListener('click', closeModal);
            
            // Close on backdrop click if allowed
            if (options.closeOnBackdropClick !== false) {
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) {
                        closeModal();
                    }
                });
            }
            
            // Close on ESC key if allowed
            if (options.closeOnEsc !== false) {
                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        closeModal();
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);
            }
            
            // Add animation
            backdrop.style.opacity = '0';
            modal.style.transform = 'scale(0.8)';
            modal.style.transition = 'transform 0.3s ease-out';
            backdrop.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                backdrop.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
            
            // Return object with methods
            return {
                close: closeModal,
                element: modal,
                backdrop: backdrop
            };
        }, null, 'ui-manager');
    }
    
    /**
     * Close all active modals
     * @returns {boolean} - Success status
     */
    closeAllModals() {
        return tryCatch(() => {
            this.activeModals.forEach(modal => {
                if (modal.backdrop && modal.backdrop.parentNode) {
                    document.body.removeChild(modal.backdrop);
                }
            });
            
            this.activeModals = [];
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Show a loading indicator
     * @param {boolean} show - Whether to show or hide the indicator
     * @returns {boolean} - Success status
     */
    showLoading(show = true) {
        return tryCatch(() => {
            let loadingContainer = document.getElementById('loading-container');
            
            if (show) {
                // Create the loading container if it doesn't exist
                if (!loadingContainer) {
                    loadingContainer = document.createElement('div');
                    loadingContainer.id = 'loading-container';
                    loadingContainer.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        z-index: 9999;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    `;
                    
                    const spinner = document.createElement('div');
                    spinner.className = 'loading-spinner';
                    spinner.style.cssText = `
                        border: 4px solid rgba(255, 255, 255, 0.3);
                        border-radius: 50%;
                        border-top: 4px solid white;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                    `;
                    
                    // Add the animation keyframes
                    const style = document.createElement('style');
                    style.innerHTML = `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `;
                    document.head.appendChild(style);
                    
                    loadingContainer.appendChild(spinner);
                    document.body.appendChild(loadingContainer);
                } else {
                    loadingContainer.style.display = 'flex';
                }
            } else if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Update pagination controls for a list or table
     * @param {number} totalItems - Total number of items
     * @param {number} itemsPerPage - Number of items per page
     * @param {number} currentPage - Current page number
     * @param {string} type - Type of items being paginated
     * @returns {boolean} - Success status
     */
    updatePaginationControls(totalItems, itemsPerPage, currentPage, type) {
        return tryCatch(() => {
            if (!this.isInitialized) {
                this.initialize();
            }
            
            // Early return if there are no items
            if (totalItems === 0) {
                return false;
            }
            
            // Calculate total pages
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            
            // Ensure current page is within bounds
            currentPage = Math.max(1, Math.min(currentPage, totalPages));
            
            // Create the pagination container if it doesn't exist
            let paginationContainer = document.getElementById(`${type}PaginationContainer`);
            if (!paginationContainer) {
                paginationContainer = document.createElement('div');
                paginationContainer.id = `${type}PaginationContainer`;
                paginationContainer.className = 'pagination-container';
                paginationContainer.style.cssText = `
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 20px 0;
                    flex-wrap: wrap;
                `;
                
                // Find the table container to append pagination
                const tableContainer = document.getElementById(`${type}Table`);
                if (tableContainer && tableContainer.parentNode) {
                    tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
                } else {
                    // Fallback to generic containers
                    const container = document.getElementById(`${type}-tab`) || document.getElementById(`${type}Container`);
                    if (container) {
                        container.appendChild(paginationContainer);
                    } else {
                        console.warn(`Could not find container for ${type} pagination`);
                        return false;
                    }
                }
            }
            
            // Clear existing pagination
            paginationContainer.innerHTML = '';
            
            // Create pagination info
            const paginationInfo = document.createElement('div');
            paginationInfo.className = 'pagination-info';
            paginationInfo.style.cssText = `
                margin: 0 15px;
                font-size: 14px;
            `;
            paginationInfo.textContent = `${totalItems} ${type}s | Page ${currentPage} of ${totalPages}`;
            paginationContainer.appendChild(paginationInfo);
            
            // Create buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'pagination-buttons';
            buttonsContainer.style.cssText = `
                display: flex;
                gap: 5px;
            `;
            paginationContainer.appendChild(buttonsContainer);
            
            // Create first page button
            this._createPaginationButton(buttonsContainer, '«', 1, currentPage === 1, type);
            
            // Create previous page button
            this._createPaginationButton(buttonsContainer, '‹', currentPage - 1, currentPage === 1, type);
            
            // Determine which page buttons to show
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);
            
            // Adjust if we're near the end
            if (endPage - startPage < 4 && startPage > 1) {
                startPage = Math.max(1, endPage - 4);
            }
            
            // Create page buttons
            for (let i = startPage; i <= endPage; i++) {
                this._createPaginationButton(buttonsContainer, i.toString(), i, false, type, i === currentPage);
            }
            
            // Create next page button
            this._createPaginationButton(buttonsContainer, '›', currentPage + 1, currentPage === totalPages, type);
            
            // Create last page button
            this._createPaginationButton(buttonsContainer, '»', totalPages, currentPage === totalPages, type);
            
            // Add page size selector
            this._createPageSizeSelector(paginationContainer, itemsPerPage, type);
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Create a pagination button
     * @param {HTMLElement} container - Container to append button to
     * @param {string} text - Button text
     * @param {number} pageNumber - Page number to navigate to
     * @param {boolean} isDisabled - Whether button is disabled
     * @param {string} type - Type of items being paginated
     * @param {boolean} isActive - Whether button is active (current page)
     * @private
     */
    _createPaginationButton(container, text, pageNumber, isDisabled, type, isActive = false) {
        return tryCatch(() => {
            const button = document.createElement('button');
            button.textContent = text;
            button.className = `pagination-button ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
            button.style.cssText = `
                padding: 6px 12px;
                background-color: ${isActive ? '#007bff' : (this.isDarkMode ? '#444' : '#f0f0f0')};
                color: ${isActive ? 'white' : (this.isDarkMode ? '#ccc' : '#333')};
                border: 1px solid ${this.isDarkMode ? '#555' : '#ddd'};
                border-radius: 4px;
                cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                opacity: ${isDisabled ? '0.6' : '1'};
            `;
            
            if (!isDisabled) {
                button.addEventListener('click', () => {
                    // Find the appropriate page change function
                    let pageChangeFn;
                    if (type === 'character') {
                        pageChangeFn = window.Characters && window.Characters.goToPage;
                    } else if (type === 'location') {
                        pageChangeFn = window.Locations && window.Locations.goToPage;
                    } else if (type === 'plot') {
                        pageChangeFn = window.Plots && window.Plots.goToPage;
                    } else if (type === 'worldElement') {
                        pageChangeFn = window.WorldBuilding && window.WorldBuilding.goToPage;
                    }
                    
                    if (pageChangeFn) {
                        pageChangeFn(pageNumber);
                    } else {
                        console.warn(`No page change function found for ${type}`);
                    }
                });
            }
            
            container.appendChild(button);
        }, null, 'ui-manager');
    }
    
    /**
     * Create a page size selector
     * @param {HTMLElement} container - Container to append selector to
     * @param {number} currentPageSize - Current page size
     * @param {string} type - Type of items being paginated
     * @private
     */
    _createPageSizeSelector(container, currentPageSize, type) {
        return tryCatch(() => {
            const selectorContainer = document.createElement('div');
            selectorContainer.className = 'page-size-selector';
            selectorContainer.style.cssText = `
                margin-left: 15px;
                display: flex;
                align-items: center;
            `;
            
            const label = document.createElement('label');
            label.textContent = 'Items per page: ';
            label.style.cssText = `
                font-size: 14px;
                margin-right: 5px;
            `;
            selectorContainer.appendChild(label);
            
            const select = document.createElement('select');
            select.className = 'page-size-select';
            select.style.cssText = `
                padding: 5px;
                border-radius: 4px;
                border: 1px solid ${this.isDarkMode ? '#555' : '#ddd'};
                background-color: ${this.isDarkMode ? '#333' : '#fff'};
                color: ${this.isDarkMode ? '#ccc' : '#333'};
            `;
            
            // Common page sizes
            const pageSizes = [10, 20, 50, 100];
            
            // Make sure current size is in the list
            if (!pageSizes.includes(currentPageSize)) {
                pageSizes.push(currentPageSize);
                pageSizes.sort((a, b) => a - b);
            }
            
            // Create options
            pageSizes.forEach(size => {
                const option = document.createElement('option');
                option.value = size.toString();
                option.textContent = size.toString();
                option.selected = size === currentPageSize;
                select.appendChild(option);
            });
            
            // Handle change event
            select.addEventListener('change', () => {
                const newPageSize = parseInt(select.value, 10);
                
                // Find the appropriate page size change function
                let pageSizeChangeFn;
                if (type === 'character') {
                    pageSizeChangeFn = window.Characters && window.Characters.setItemsPerPage;
                } else if (type === 'location') {
                    pageSizeChangeFn = window.Locations && window.Locations.setItemsPerPage;
                } else if (type === 'plot') {
                    pageSizeChangeFn = window.Plots && window.Plots.setItemsPerPage;
                } else if (type === 'worldElement') {
                    pageSizeChangeFn = window.WorldBuilding && window.WorldBuilding.setItemsPerPage;
                }
                
                if (pageSizeChangeFn) {
                    pageSizeChangeFn(newPageSize);
                } else {
                    console.warn(`No page size change function found for ${type}`);
                    
                    // Try to store the preference anyway
                    this._safelySetItem(`${type}ItemsPerPage`, newPageSize.toString());
                }
            });
            
            selectorContainer.appendChild(select);
            container.appendChild(selectorContainer);
        }, null, 'ui-manager');
    }
    
    /**
     * Show a confirmation dialog
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Function to call when confirmed
     * @param {Function} onCancel - Function to call when cancelled
     * @param {Object} options - Additional options
     * @returns {Object} - Modal object with close method
     */
    showConfirmation(message, onConfirm, onCancel, options = {}) {
        return tryCatch(() => {
            // Default options
            const defaultOptions = {
                title: 'Confirmation',
                confirmText: 'Yes',
                cancelText: 'No',
                confirmButtonClass: 'primary',
                cancelButtonClass: 'secondary'
            };
            
            // Merge options
            options = { ...defaultOptions, ...options };
            
            // Create buttons HTML
            const buttonsHtml = `
                <div class="confirmation-buttons" style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                    <button id="confirmButton" class="${options.confirmButtonClass}" style="
                        padding: 8px 16px;
                        border-radius: 4px;
                        border: none;
                        cursor: pointer;
                        background-color: ${options.confirmButtonClass === 'primary' ? '#4CAF50' : '#2196F3'};
                        color: white;
                        font-weight: bold;
                    ">${options.confirmText}</button>
                    <button id="cancelButton" class="${options.cancelButtonClass}" style="
                        padding: 8px 16px;
                        border-radius: 4px;
                        border: none;
                        cursor: pointer;
                        background-color: ${options.cancelButtonClass === 'danger' ? '#F44336' : '#9E9E9E'};
                        color: white;
                    ">${options.cancelText}</button>
                </div>
            `;
            
            // Create content HTML
            const contentHtml = `
                <div class="confirmation-message" style="margin-bottom: 20px; text-align: center;">
                    ${message}
                </div>
                ${buttonsHtml}
            `;
            
            // Show modal
            const modal = this.showModal(options.title, contentHtml, {
                closeOnEsc: false,
                closeOnBackdropClick: false
            });
            
            // Add event listeners to buttons
            const confirmButton = modal.element.querySelector('#confirmButton');
            const cancelButton = modal.element.querySelector('#cancelButton');
            
            if (confirmButton) {
                confirmButton.addEventListener('click', () => {
                    modal.close();
                    if (typeof onConfirm === 'function') {
                        onConfirm();
                    }
                });
            }
            
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    modal.close();
                    if (typeof onCancel === 'function') {
                        onCancel();
                    }
                });
            }
            
            return modal;
        }, null, 'ui-manager');
    }
    
    /**
     * Show an alert dialog
     * @param {string} message - Alert message
     * @param {string} title - Alert title
     * @param {Object} options - Additional options
     * @returns {Object} - Modal object with close method
     */
    showAlert(message, title = 'Alert', options = {}) {
        return tryCatch(() => {
            // Create button HTML
            const buttonHtml = `
                <div style="display: flex; justify-content: center; margin-top: 20px;">
                    <button id="alertOkButton" style="
                        padding: 8px 20px;
                        border-radius: 4px;
                        border: none;
                        cursor: pointer;
                        background-color: #2196F3;
                        color: white;
                        font-weight: bold;
                    ">OK</button>
                </div>
            `;
            
            // Create content HTML
            const contentHtml = `
                <div style="margin-bottom: 20px; text-align: center;">
                    ${message}
                </div>
                ${buttonHtml}
            `;
            
            // Show modal
            const modal = this.showModal(title, contentHtml, options);
            
            // Add event listener to button
            const okButton = modal.element.querySelector('#alertOkButton');
            if (okButton) {
                okButton.addEventListener('click', () => {
                    modal.close();
                    if (options.onClose && typeof options.onClose === 'function') {
                        options.onClose();
                    }
                });
                
                // Focus the OK button so user can press Enter
                setTimeout(() => okButton.focus(), 100);
            }
            
            return modal;
        }, null, 'ui-manager');
    }
    
    /**
     * Validate a form input element
     * @param {HTMLElement} inputElement - The input element to validate
     * @param {Object} options - Validation options
     * @returns {boolean} - Whether the input is valid
     */
    validateInput(inputElement, options = {}) {
        return tryCatch(() => {
            if (!inputElement) {
                console.warn('No input element provided for validation');
                return false;
            }
            
            // Default options
            const defaultOptions = {
                required: false,
                minLength: 0,
                maxLength: Infinity,
                pattern: null,
                customValidator: null,
                showError: true,
                errorContainer: null
            };
            
            // Merge options
            options = { ...defaultOptions, ...options };
            
            // Clear previous errors
            this._clearInputError(inputElement, options.errorContainer);
            
            // Get input value (trim whitespace for text inputs)
            const value = (inputElement.type === 'text' || inputElement.type === 'textarea') ? 
                inputElement.value.trim() : inputElement.value;
            
            // Check required fields
            if (options.required && !value) {
                return this._showInputError(inputElement, 'This field is required', options.errorContainer, options.showError);
            }
            
            // Skip other validation if field is empty and not required
            if (!value && !options.required) {
                return true;
            }
            
            // Check min length
            if (options.minLength > 0 && value.length < options.minLength) {
                return this._showInputError(
                    inputElement, 
                    `Minimum length is ${options.minLength} characters`, 
                    options.errorContainer,
                    options.showError
                );
            }
            
            // Check max length
            if (options.maxLength < Infinity && value.length > options.maxLength) {
                return this._showInputError(
                    inputElement, 
                    `Maximum length is ${options.maxLength} characters`, 
                    options.errorContainer,
                    options.showError
                );
            }
            
            // Check pattern
            if (options.pattern && !options.pattern.test(value)) {
                return this._showInputError(
                    inputElement, 
                    options.patternError || 'Invalid format', 
                    options.errorContainer,
                    options.showError
                );
            }
            
            // Custom validator
            if (options.customValidator && typeof options.customValidator === 'function') {
                const result = options.customValidator(value, inputElement);
                if (result !== true) {
                    return this._showInputError(
                        inputElement, 
                        typeof result === 'string' ? result : 'Invalid value', 
                        options.errorContainer,
                        options.showError
                    );
                }
            }
            
            // Add valid class
            inputElement.classList.add('valid');
            inputElement.classList.remove('invalid');
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Validate an entire form
     * @param {HTMLFormElement|string} form - Form element or form ID
     * @param {Object} validationRules - Validation rules for each input
     * @param {boolean} scrollToError - Whether to scroll to the first error
     * @returns {boolean} - Whether the form is valid
     */
    validateForm(form, validationRules = {}, scrollToError = true) {
        return tryCatch(() => {
            // Get form element if string ID was provided
            if (typeof form === 'string') {
                form = document.getElementById(form);
            }
            
            if (!form) {
                console.warn('No form element found for validation');
                return false;
            }
            
            let isValid = true;
            let firstInvalidElement = null;
            
            // Process all inputs with rules
            Object.keys(validationRules).forEach(selector => {
                const inputElement = form.querySelector(selector);
                if (inputElement) {
                    const inputIsValid = this.validateInput(inputElement, validationRules[selector]);
                    isValid = isValid && inputIsValid;
                    
                    if (!inputIsValid && !firstInvalidElement) {
                        firstInvalidElement = inputElement;
                    }
                }
            });
            
            // Scroll to first error if needed
            if (!isValid && scrollToError && firstInvalidElement) {
                firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidElement.focus();
            }
            
            return isValid;
        }, false, 'ui-manager');
    }
    
    /**
     * Show an error message for an input
     * @param {HTMLElement} inputElement - The input element with an error
     * @param {string} message - Error message to display
     * @param {HTMLElement} errorContainer - Custom error container
     * @param {boolean} showError - Whether to show the error visually
     * @returns {boolean} - Always returns false to indicate validation failure
     * @private
     */
    _showInputError(inputElement, message, errorContainer, showError = true) {
        return tryCatch(() => {
            if (!showError) {
                return false;
            }
            
            // Add invalid class
            inputElement.classList.add('invalid');
            inputElement.classList.remove('valid');
            
            if (errorContainer) {
                // Use custom error container
                errorContainer.textContent = message;
                errorContainer.style.display = 'block';
            } else {
                // Create an error message element
                let errorElement = inputElement.nextElementSibling;
                if (!errorElement || !errorElement.classList.contains('input-error')) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'input-error';
                    errorElement.style.cssText = `
                        color: #F44336;
                        font-size: 12px;
                        margin-top: 4px;
                    `;
                    inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
                }
                
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
            
            return false;
        }, false, 'ui-manager');
    }
    
    /**
     * Clear error messages for an input
     * @param {HTMLElement} inputElement - The input element to clear errors for
     * @param {HTMLElement} errorContainer - Custom error container
     * @private
     */
    _clearInputError(inputElement, errorContainer) {
        return tryCatch(() => {
            // Remove classes
            inputElement.classList.remove('invalid');
            
            if (errorContainer) {
                // Clear custom error container
                errorContainer.textContent = '';
                errorContainer.style.display = 'none';
            } else {
                // Clear default error message
                const errorElement = inputElement.nextElementSibling;
                if (errorElement && errorElement.classList.contains('input-error')) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
            }
        }, null, 'ui-manager');
    }
    
    /**
     * Reset a form to its initial state
     * @param {HTMLFormElement|string} form - Form element or form ID
     * @param {boolean} clearValues - Whether to clear input values
     */
    resetForm(form, clearValues = true) {
        return tryCatch(() => {
            // Get form element if string ID was provided
            if (typeof form === 'string') {
                form = document.getElementById(form);
            }
            
            if (!form) {
                console.warn('No form element found to reset');
                return false;
            }
            
            // Reset the form (clear values and form state)
            if (clearValues) {
                form.reset();
            }
            
            // Clear validation classes and error messages
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.classList.remove('invalid', 'valid');
                
                // Clear error messages
                const errorElement = input.nextElementSibling;
                if (errorElement && errorElement.classList.contains('input-error')) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
            });
            
            return true;
        }, false, 'ui-manager');
    }
    
    /**
     * Initialize drag and drop functionality for an element
     * @param {HTMLElement|string} element - The draggable element or its ID
     * @param {Object} options - Drag and drop options
     * @returns {Object} - Drag controller with methods to control behavior
     */
    initDragAndDrop(element, options = {}) {
        return tryCatch(() => {
            // Get element if string ID was provided
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            
            if (!element) {
                console.warn('No element found for drag and drop initialization');
                return null;
            }
            
            // Default options
            const defaultOptions = {
                handle: null, // Element or selector to use as drag handle
                containment: null, // Element or selector to contain the dragging within
                axis: null, // 'x', 'y', or null for both
                clone: false, // Whether to drag a clone instead of the original
                snapToGrid: false, // Whether to snap to a grid when dragging
                gridSize: 10, // Grid size if snapping to grid
                dragClass: 'dragging', // Class to add while dragging
                dropTargets: [], // Elements that can accept the draggable as a drop
                dropEffect: 'move', // CSS drop effect: 'none', 'copy', 'move', 'link'
                onStart: null, // Callback when drag starts
                onDrag: null, // Callback while dragging
                onDrop: null, // Callback when dropped
                onEnd: null // Callback when drag ends (whether dropped or not)
            };
            
            // Merge options
            options = { ...defaultOptions, ...options };
            
            // Initialize handle element
            let handle = options.handle ? 
                (typeof options.handle === 'string' ? element.querySelector(options.handle) : options.handle) : 
                element;
                
            if (!handle) {
                handle = element; // Fallback to the element itself
            }
            
            // Initialize drop targets
            const dropTargets = [];
            if (options.dropTargets && options.dropTargets.length > 0) {
                options.dropTargets.forEach(target => {
                    if (typeof target === 'string') {
                        // If target is a CSS selector, find all matching elements
                        document.querySelectorAll(target).forEach(el => dropTargets.push(el));
                    } else {
                        // If target is an element, add it directly
                        dropTargets.push(target);
                    }
                });
            }
            
            // State variables
            let isDragging = false;
            let startX, startY, elementX, elementY;
            let width, height;
            let containmentRect = null;
            let clone = null;
            let activeDropTarget = null;
            
            // Calculate containment rect if specified
            if (options.containment) {
                const containment = typeof options.containment === 'string' ? 
                    document.querySelector(options.containment) : options.containment;
                    
                if (containment) {
                    containmentRect = containment.getBoundingClientRect();
                }
            }
            
            // Start drag handler
            const startDrag = (e) => {
                // If it's a mouse event, make sure it's the left button
                if (e.type === 'mousedown' && e.button !== 0) {
                    return;
                }
                
                // Prevent default only if this is not an input element
                const target = e.target;
                if (!['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) && 
                    !(target.isContentEditable)) {
                    e.preventDefault();
                }
                
                // Calculate starting position
                const rect = element.getBoundingClientRect();
                startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
                elementX = rect.left;
                elementY = rect.top;
                width = rect.width;
                height = rect.height;
                
                // Create a clone if necessary
                if (options.clone) {
                    clone = element.cloneNode(true);
                    clone.style.position = 'absolute';
                    clone.style.left = elementX + 'px';
                    clone.style.top = elementY + 'px';
                    clone.style.width = width + 'px';
                    clone.style.height = height + 'px';
                    clone.style.opacity = '0.8';
                    clone.style.pointerEvents = 'none';
                    clone.style.zIndex = '10000';
                    document.body.appendChild(clone);
                }
                
                // Add dragging class
                if (options.clone) {
                    clone.classList.add(options.dragClass);
                } else {
                    element.classList.add(options.dragClass);
                }
                
                // Set up move and end handlers
                if (e.type === 'touchstart') {
                    document.addEventListener('touchmove', drag, { passive: false });
                    document.addEventListener('touchend', endDrag);
                } else {
                    document.addEventListener('mousemove', drag);
                    document.addEventListener('mouseup', endDrag);
                }
                
                isDragging = true;
                
                // Call start callback if provided
                if (typeof options.onStart === 'function') {
                    options.onStart({
                        element: element,
                        clone: clone,
                        x: elementX,
                        y: elementY,
                        event: e
                    });
                }
            };
            
            // Drag handler
            const drag = (e) => {
                if (!isDragging) return;
                
                // Prevent default scrolling on touch devices
                if (e.type === 'touchmove') {
                    e.preventDefault();
                }
                
                // Calculate new position
                const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                
                let newX = elementX + (currentX - startX);
                let newY = elementY + (currentY - startY);
                
                // Apply axis constraints
                if (options.axis === 'x') {
                    newY = elementY;
                } else if (options.axis === 'y') {
                    newX = elementX;
                }
                
                // Apply grid snapping if enabled
                if (options.snapToGrid) {
                    newX = Math.round(newX / options.gridSize) * options.gridSize;
                    newY = Math.round(newY / options.gridSize) * options.gridSize;
                }
                
                // Apply containment constraints
                if (containmentRect) {
                    newX = Math.max(containmentRect.left, Math.min(newX, containmentRect.right - width));
                    newY = Math.max(containmentRect.top, Math.min(newY, containmentRect.bottom - height));
                }
                
                // Update element position
                const target = options.clone ? clone : element;
                
                if (options.clone || element.style.position === 'absolute') {
                    target.style.left = newX + 'px';
                    target.style.top = newY + 'px';
                } else {
                    // If element doesn't have absolute positioning, use transform
                    const dx = newX - elementX;
                    const dy = newY - elementY;
                    target.style.transform = `translate(${dx}px, ${dy}px)`;
                }
                
                // Check for drop targets
                const targetEl = options.clone ? clone : element;
                const targetRect = targetEl.getBoundingClientRect();
                let foundDropTarget = null;
                
                // Find drop target under the element
                for (const dropTarget of dropTargets) {
                    const dropRect = dropTarget.getBoundingClientRect();
                    if (rectsIntersect(targetRect, dropRect)) {
                        foundDropTarget = dropTarget;
                        break;
                    }
                }
                
                // Handle enter/leave events for drop targets
                if (foundDropTarget !== activeDropTarget) {
                    if (activeDropTarget) {
                        // Leave previous target
                        activeDropTarget.classList.remove('drop-active');
                        if (typeof activeDropTarget.onDragLeave === 'function') {
                            activeDropTarget.onDragLeave({ element, target: activeDropTarget, event: e });
                        }
                    }
                    
                    if (foundDropTarget) {
                        // Enter new target
                        foundDropTarget.classList.add('drop-active');
                        if (typeof foundDropTarget.onDragEnter === 'function') {
                            foundDropTarget.onDragEnter({ element, target: foundDropTarget, event: e });
                        }
                    }
                    
                    activeDropTarget = foundDropTarget;
                }
                
                // Call drag callback if provided
                if (typeof options.onDrag === 'function') {
                    options.onDrag({
                        element: element,
                        clone: clone,
                        x: newX,
                        y: newY,
                        dropTarget: activeDropTarget,
                        event: e
                    });
                }
            };
            
            // End drag handler
            const endDrag = (e) => {
                if (!isDragging) return;
                
                // Remove event listeners
                document.removeEventListener('mousemove', drag);
                document.removeEventListener('mouseup', endDrag);
                document.removeEventListener('touchmove', drag);
                document.removeEventListener('touchend', endDrag);
                
                // Remove dragging class
                if (options.clone) {
                    clone.classList.remove(options.dragClass);
                } else {
                    element.classList.remove(options.dragClass);
                }
                
                // Process drop if there's an active drop target
                let dropped = false;
                if (activeDropTarget) {
                    dropped = true;
                    activeDropTarget.classList.remove('drop-active');
                    
                    // Call drop callback if provided
                    if (typeof options.onDrop === 'function') {
                        options.onDrop({
                            element: element,
                            clone: clone,
                            target: activeDropTarget,
                            event: e
                        });
                    }
                    
                    // Call target's onDrop handler if it exists
                    if (typeof activeDropTarget.onDrop === 'function') {
                        activeDropTarget.onDrop({ element, target: activeDropTarget, event: e });
                    }
                }
                
                // Reset position if not dropped and not using clone
                if (!dropped && !options.clone && element.style.transform) {
                    element.style.transition = 'transform 0.2s ease-out';
                    element.style.transform = 'translate(0px, 0px)';
                    
                    // Remove transition after animation completes
                    setTimeout(() => {
                        element.style.transition = '';
                    }, 200);
                }
                
                // Remove clone if it exists
                if (clone) {
                    document.body.removeChild(clone);
                    clone = null;
                }
                
                // Reset state
                isDragging = false;
                activeDropTarget = null;
                
                // Call end callback if provided
                if (typeof options.onEnd === 'function') {
                    options.onEnd({
                        element: element,
                        dropped: dropped,
                        target: activeDropTarget,
                        event: e
                    });
                }
            };
            
            // Helper function to check if two rects intersect
            const rectsIntersect = (rect1, rect2) => {
                return !(
                    rect1.right < rect2.left || 
                    rect1.left > rect2.right || 
                    rect1.bottom < rect2.top || 
                    rect1.top > rect2.bottom
                );
            };
            
            // Add appropriate event listeners based on device
            handle.addEventListener('mousedown', startDrag);
            handle.addEventListener('touchstart', startDrag, { passive: false });
            
            // Return controller object with methods to control behavior
            return {
                element: element,
                destroy: () => {
                    // Remove event listeners
                    handle.removeEventListener('mousedown', startDrag);
                    handle.removeEventListener('touchstart', startDrag);
                    document.removeEventListener('mousemove', drag);
                    document.removeEventListener('mouseup', endDrag);
                    document.removeEventListener('touchmove', drag);
                    document.removeEventListener('touchend', endDrag);
                    
                    // Remove clone if it exists
                    if (clone) {
                        document.body.removeChild(clone);
                    }
                },
                enable: () => {
                    handle.addEventListener('mousedown', startDrag);
                    handle.addEventListener('touchstart', startDrag, { passive: false });
                },
                disable: () => {
                    handle.removeEventListener('mousedown', startDrag);
                    handle.removeEventListener('touchstart', startDrag);
                },
                getIsDragging: () => isDragging
            };
        }, null, 'ui-manager');
    }
    
    /**
     * Create a drag sortable list
     * @param {HTMLElement|string} list - The list element or its ID
     * @param {Object} options - Sortable list options
     * @returns {Object} - Sortable controller with methods to control behavior
     */
    createSortableList(list, options = {}) {
        return tryCatch(() => {
            // Get list element if string ID was provided
            if (typeof list === 'string') {
                list = document.getElementById(list);
            }
            
            if (!list) {
                console.warn('No list element found for sortable initialization');
                return null;
            }
            
            // Default options
            const defaultOptions = {
                itemSelector: 'li', // Selector for items that can be sorted
                handle: null, // Element or selector to use as drag handle
                axis: 'y', // 'x', 'y', or null for both
                animation: 200, // Animation time in ms when items move
                dragClass: 'sortable-dragging', // Class for the dragged item
                ghostClass: 'sortable-ghost', // Class for the ghost placeholder
                chosenClass: 'sortable-chosen', // Class for the chosen item
                disabled: false, // Whether the sortable is initially disabled
                onStart: null, // Callback when sorting starts
                onSort: null, // Callback when sorting changes
                onEnd: null, // Callback when sorting ends
                onChange: null // Callback when the order changes
            };
            
            // Merge options
            options = { ...defaultOptions, ...options };
            
            // Get all sortable items
            const getItems = () => {
                return Array.from(list.querySelectorAll(options.itemSelector));
            };
            
            // State variables
            let items = getItems();
            let dragItem = null;
            let dragItemRect = null;
            let startIndex = -1;
            let placeholder = null;
            let startY, startX;
            let originalTransform;
            
            // Create placeholder element
            const createPlaceholder = (item) => {
                const rect = item.getBoundingClientRect();
                const placeholderEl = document.createElement('div');
                placeholderEl.classList.add('sortable-placeholder');
                placeholderEl.style.height = rect.height + 'px';
                placeholderEl.style.width = rect.width + 'px';
                placeholderEl.style.marginTop = window.getComputedStyle(item).marginTop;
                placeholderEl.style.marginBottom = window.getComputedStyle(item).marginBottom;
                placeholderEl.style.marginLeft = window.getComputedStyle(item).marginLeft;
                placeholderEl.style.marginRight = window.getComputedStyle(item).marginRight;
                return placeholderEl;
            };
            
            // Find the insertion index based on position
            const findInsertionIndex = (y, x) => {
                for (let i = 0; i < items.length; i++) {
                    if (items[i] === dragItem) continue;
                    
                    const rect = items[i].getBoundingClientRect();
                    
                    if (options.axis === 'y') {
                        const midY = rect.top + rect.height / 2;
                        if (y < midY) return i;
                    } else if (options.axis === 'x') {
                        const midX = rect.left + rect.width / 2;
                        if (x < midX) return i;
                    } else {
                        // Determine based on both X and Y
                        if (rect.top <= y && y <= rect.bottom && 
                            rect.left <= x && x <= rect.right) {
                            return i;
                        }
                    }
                }
                return items.length;
            };
            
            // Start sorting
            const startSort = (e) => {
                if (options.disabled) return;
                
                // If it's a mouse event, make sure it's the left button
                if (e.type === 'mousedown' && e.button !== 0) {
                    return;
                }
                
                // Find the closest sortable item from the event target
                let target = e.target;
                let item = null;
                
                while (target && target !== list) {
                    if (items.includes(target)) {
                        item = target;
                        break;
                    }
                    target = target.parentNode;
                }
                
                if (!item) return;
                
                // Check if handle is specified
                if (options.handle) {
                    let hasHandle = false;
                    let handleTarget = e.target;
                    
                    while (handleTarget && handleTarget !== item) {
                        if (options.handle.includes(handleTarget.className) || 
                            handleTarget.matches(options.handle)) {
                            hasHandle = true;
                            break;
                        }
                        handleTarget = handleTarget.parentNode;
                    }
                    
                    if (!hasHandle) return;
                }
                
                // Prevent default only if not on input elements
                const targetNode = e.target;
                if (!['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(targetNode.tagName) && 
                    !(targetNode.isContentEditable)) {
                    e.preventDefault();
                }
                
                // Set initial positions
                const rect = item.getBoundingClientRect();
                startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
                startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                
                // Store the original transform
                originalTransform = item.style.transform;
                
                // Get all items again in case there were changes
                items = getItems();
                dragItem = item;
                dragItemRect = rect;
                startIndex = items.indexOf(dragItem);
                
                // Create and insert placeholder
                placeholder = createPlaceholder(dragItem);
                list.insertBefore(placeholder, dragItem.nextSibling);
                
                // Add dragging styles
                dragItem.classList.add(options.dragClass);
                dragItem.classList.add(options.chosenClass);
                
                // Make the drag item absolute
                dragItem.style.position = 'absolute';
                dragItem.style.zIndex = '1000';
                dragItem.style.width = rect.width + 'px';
                dragItem.style.height = rect.height + 'px';
                dragItem.style.top = rect.top + 'px';
                dragItem.style.left = rect.left + 'px';
                
                // Add event listeners for drag and end
                if (e.type === 'touchstart') {
                    document.addEventListener('touchmove', onMove, { passive: false });
                    document.addEventListener('touchend', endSort);
                } else {
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', endSort);
                }
                
                // Trigger the start callback
                if (typeof options.onStart === 'function') {
                    options.onStart({
                        item: dragItem,
                        index: startIndex,
                        event: e
                    });
                }
            };
            
            // Handle moving
            const onMove = (e) => {
                if (!dragItem) return;
                
                // Prevent default scrolling on touch devices
                if (e.type === 'touchmove') {
                    e.preventDefault();
                }
                
                // Calculate new position
                const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                
                // Calculate offset
                const dy = clientY - startY;
                const dx = clientX - startX;
                
                // Move the drag item
                if (options.axis === 'y') {
                    dragItem.style.transform = `translate(0px, ${dy}px)`;
                } else if (options.axis === 'x') {
                    dragItem.style.transform = `translate(${dx}px, 0px)`;
                } else {
                    dragItem.style.transform = `translate(${dx}px, ${dy}px)`;
                }
                
                // Find position and move placeholder
                const insertIndex = findInsertionIndex(clientY, clientX);
                
                if (insertIndex < items.length) {
                    if (insertIndex !== startIndex) {
                        // Move placeholder to new position
                        if (insertIndex < startIndex) {
                            list.insertBefore(placeholder, items[insertIndex]);
                        } else {
                            list.insertBefore(placeholder, items[insertIndex].nextSibling);
                        }
                    }
                } else {
                    // If inserting at the end
                    list.appendChild(placeholder);
                }
                
                // Trigger the sort callback
                if (typeof options.onSort === 'function') {
                    options.onSort({
                        item: dragItem,
                        startIndex: startIndex,
                        currentIndex: insertIndex,
                        event: e
                    });
                }
            };
            
            // End sorting
            const endSort = (e) => {
                if (!dragItem) return;
                
                // Remove event listeners
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', endSort);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', endSort);
                
                // Reset item styles
                dragItem.style.position = '';
                dragItem.style.zIndex = '';
                dragItem.style.top = '';
                dragItem.style.left = '';
                dragItem.style.width = '';
                dragItem.style.height = '';
                dragItem.style.transform = originalTransform;
                
                // Remove drag classes
                dragItem.classList.remove(options.dragClass);
                dragItem.classList.remove(options.chosenClass);
                
                // Insert the dragged item at the placeholder position
                if (placeholder && placeholder.parentNode) {
                    list.insertBefore(dragItem, placeholder);
                    list.removeChild(placeholder);
                }
                
                // Get final indices to determine if order changed
                const newItems = getItems();
                const newIndex = newItems.indexOf(dragItem);
                const changed = newIndex !== startIndex;
                
                // Call change callback if the order changed
                if (changed && typeof options.onChange === 'function') {
                    options.onChange({
                        item: dragItem,
                        oldIndex: startIndex,
                        newIndex: newIndex,
                        event: e
                    });
                }
                
                // Call end callback
                if (typeof options.onEnd === 'function') {
                    options.onEnd({
                        item: dragItem,
                        oldIndex: startIndex,
                        newIndex: newIndex,
                        changed: changed,
                        event: e
                    });
                }
                
                // Reset state variables
                dragItem = null;
                placeholder = null;
                startIndex = -1;
                items = newItems;
            };
            
            // Add event listeners
            list.addEventListener('mousedown', startSort);
            list.addEventListener('touchstart', startSort, { passive: false });
            
            // Return controller object
            return {
                element: list,
                getItems: () => getItems(),
                destroy: () => {
                    list.removeEventListener('mousedown', startSort);
                    list.removeEventListener('touchstart', startSort);
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', endSort);
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend', endSort);
                },
                disable: () => {
                    options.disabled = true;
                },
                enable: () => {
                    options.disabled = false;
                },
                isEnabled: () => !options.disabled
            };
        }, null, 'ui-manager');
    }
    
    /**
     * Show the settings dialog
     * Uses the implementation from storage/settings.js but centralizes it in UIManager
     * @returns {HTMLElement} - The settings dialog element
     */
    showSettingsDialog() {
        return tryCatch(() => {
            // Import settings functionality if not already available
            let settingsModule;
            
            try {
                // Try to import from modules/storage/settings.js
                if (window.storageSettings && typeof window.storageSettings.showSettingsDialog === 'function') {
                    settingsModule = window.storageSettings;
                    console.log('Using global storageSettings module');
                } else {
                    throw new Error('Global storageSettings not found');
                }
            } catch (error) {
                console.warn('Could not access storageSettings module:', error);
                
                // Create a simple settings dialog if the module isn't available
                return this._createFallbackSettingsDialog();
            }
            
            // Call the original function
            return settingsModule.showSettingsDialog();
        }, null, 'ui-manager');
    }
    
    /**
     * Create a fallback settings dialog if the settings module isn't available
     * @private
     * @returns {HTMLElement} - The settings dialog element
     */
    _createFallbackSettingsDialog() {
        return tryCatch(() => {
            const settings = localStorage.getItem('settings') ? 
                JSON.parse(localStorage.getItem('settings')) : 
                {
                    theme: 'light',
                    fontSize: 'medium',
                    databaseDirectory: '',
                    documentDirectory: '',
                    enableAutoBackup: true,
                    autoBackupInterval: 30,
                    backupDirectory: '',
                    enableLocalBackup: true,
                    enableCloudBackup: false,
                    enableCloudSync: false,
                    cloudProvider: 'none'
                };
            
            // Create a modal dialog for settings
            return this.showModal('Settings', `
                <div class="settings-section">
                    <h3>General</h3>
                    <div class="setting-item">
                        <label for="theme">Theme:</label>
                        <select id="theme">
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="fontSize">Font Size:</label>
                        <select id="fontSize">
                            <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                            <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Database</h3>
                    <div class="setting-item">
                        <label for="databaseDirectory">Database Directory:</label>
                        <div class="input-with-button">
                            <input type="text" id="databaseDirectory" value="${settings.databaseDirectory || ''}" readonly>
                            <button id="browseDatabaseDir" class="btn btn-secondary">Browse</button>
                        </div>
                    </div>
                </div>
            `, {
                onOpen: (modal) => {
                    // Add event listeners for directory browsing buttons
                    const browseDatabaseDirBtn = modal.element.querySelector('#browseDatabaseDir');
                    if (browseDatabaseDirBtn) {
                        browseDatabaseDirBtn.addEventListener('click', () => {
                            if (window.api && typeof window.api.selectDirectory === 'function') {
                                window.api.selectDirectory().then(result => {
                                    if (result && !result.canceled && result.filePaths.length > 0) {
                                        const databaseDirectoryInput = modal.element.querySelector('#databaseDirectory');
                                        if (databaseDirectoryInput) {
                                            databaseDirectoryInput.value = result.filePaths[0];
                                        }
                                    }
                                });
                            } else {
                                console.warn('API for directory selection not available');
                            }
                        });
                    }
                    
                    // Add save button to the footer
                    const footer = modal.element.querySelector('.modal-footer');
                    if (footer) {
                        const saveBtn = document.createElement('button');
                        saveBtn.className = 'btn btn-primary';
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => {
                            // Gather settings from the form
                            const newSettings = {
                                ...settings,
                                theme: modal.element.querySelector('#theme').value,
                                fontSize: modal.element.querySelector('#fontSize').value,
                                databaseDirectory: modal.element.querySelector('#databaseDirectory').value
                            };
                            
                            // Save settings
                            localStorage.setItem('settings', JSON.stringify(newSettings));
                            
                            // Apply settings
                            this.applyTheme(newSettings.theme);
                            this.applyFontSize(newSettings.fontSize);
                            
                            // Close the modal
                            modal.close();
                        });
                        footer.appendChild(saveBtn);
                    }
                }
            });
        }, null, 'ui-manager');
    }
    
    /**
     * Apply the selected theme
     * @param {string} theme - The theme to apply ('light', 'dark', or 'system')
     */
    applyTheme(theme) {
        return tryCatch(() => {
            if (theme === 'system') {
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                theme = prefersDark ? 'dark' : 'light';
            }
            
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
                this.isDarkMode = true;
            } else {
                document.body.classList.remove('dark-mode');
                this.isDarkMode = false;
            }
            
            // Dispatch an event for other components to react to theme changes
            document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
            
            return theme;
        }, 'light', 'ui-manager');
    }
    
    /**
     * Apply the selected font size
     * @param {string} fontSize - The font size to apply ('small', 'medium', or 'large')
     */
    applyFontSize(fontSize) {
        return tryCatch(() => {
            // Remove existing font size classes
            document.body.classList.remove('font-small', 'font-medium', 'font-large');
            
            // Add the new font size class
            document.body.classList.add(`font-${fontSize}`);
            
            // Dispatch an event for other components to react to font size changes
            document.dispatchEvent(new CustomEvent('fontSizeChanged', { detail: { fontSize } }));
            
            return fontSize;
        }, 'medium', 'ui-manager');
    }
}

// Create a singleton instance
const uiManager = new UIManager();

// Initialize with default settings
uiManager.initialize();

// Export the singleton instance
export { uiManager as UIManager };

// Also make available globally
window.UIManager = uiManager;
