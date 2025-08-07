/**
 * UI Components Initialization
 * 
 * This file initializes the standardized UI component system when the application starts.
 * It should be loaded early in the application startup process.
 */

// Import initialization function
import { initializeUIComponents } from './modules/ui-components-integration.js';
import { tryCatch } from './modules/error-handling-util.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', tryCatch(() => {
    console.log('Initializing UI component system...');
    
    // Initialize UI components
    initializeUIComponents();
    
    // Setup global upgrade function for use in other modules
    if (!window.SGUpgradeUI) {
        window.SGUpgradeUI = {};
        
        // Import upgradeExistingUI function dynamically when needed
        window.SGUpgradeUI.upgradeContainer = async (container, options) => {
            try {
                const { upgradeExistingUI } = await import('./modules/ui-components-integration.js');
                return upgradeExistingUI(container, options);
            } catch (err) {
                console.error('Failed to load UI upgrade module:', err);
                return false;
            }
        };
    }
    
    console.log('UI component system initialization complete');
}, 'ui-components-init', 'error', { action: 'initialize' }));

// Also initialize when storyguard:app-ready event is fired (in case DOMContentLoaded already happened)
window.addEventListener('storyguard:app-ready', tryCatch(() => {
    // Only initialize if not already done in DOMContentLoaded
    if (!window.UIManager?.componentsInitialized) {
        console.log('Initializing UI component system on app-ready event...');
        initializeUIComponents();
        console.log('UI component system initialization complete');
    }
}, 'ui-components-init', 'error', { action: 'initialize-on-app-ready' }));
