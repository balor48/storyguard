// Core Toast Fix
// Ensures toast notifications work correctly and prevents duplicates

console.log('Core Toast Fix script loaded');

(function() {
    // Make sure Core object exists
    if (!window.Core) {
        window.Core = {};
    }
    
    // Wait for Core module to be available
    const checkCore = setInterval(() => {
        if (window.Core) {
            clearInterval(checkCore);
            console.log('Core module found, adding toast improvements');
            enhanceToastFunctionality();
        }
    }, 100);

    function enhanceToastFunctionality() {
        // Store the original showToast function if it exists
        const originalShowToast = window.Core.showToast;

        // Track recent toasts to prevent duplicates
        window.Core._recentToasts = [];
        
        // Enhanced toast function with aggressive duplicate prevention
        window.Core.showToast = function(message, type = 'info', duration = 3000) {
            console.log('Toast requested:', message, type);
            
            // BLOCK the "Opening historical database..." message completely
            if (message === "Opening historical database..." || 
                message.includes("Opening historical database")) {
                console.log('BLOCKING unwanted "Opening historical database" toast');
                return;
            }
            
            // Block other commonly unwanted blue toasts
            if (type === 'info' && (
                message.includes("Opening") || 
                message.includes("Loading") || 
                message.includes("Initializing") ||
                message.includes("Processing") ||
                message.includes("Please wait")
            )) {
                console.log('BLOCKING unwanted info toast:', message);
                return;
            }
            
            // Add special handling for database-related toasts
            if (message.includes('Database') || message.includes('database') || message.includes('Switched')) {
                console.log('DATABASE TOAST DETECTED:', message);
                
                // Create a key for this toast
                const now = new Date().getTime();
                const toastKey = `${message}|${type}`;
                
                // Check if we already showed this toast recently
                const recentDuplicate = window.Core._recentToasts.find(t => {
                    // Consider it a duplicate if the same message was shown in the last 5 seconds
                    return t.key === toastKey && (now - t.timestamp) < 5000;
                });
                
                if (recentDuplicate) {
                    console.log('PREVENTING DUPLICATE TOAST:', message);
                    return;
                }
                
                // Specific blocking for Imported DB messages when using Switch button
                if (document.switchButtonClicked && message.includes('Imported DB')) {
                    console.log('BLOCKING IMPORTED DB TOAST AFTER SWITCH BUTTON CLICK');
                    return;
                }
                
                // Block "loaded successfully" if we already showed "Switched" recently
                if (message.includes('loaded successfully')) {
                    const switchedRecently = window.Core._recentToasts.some(t => 
                        t.key.includes('Switched to database') && (now - t.timestamp) < 5000
                    );
                    
                    if (switchedRecently) {
                        console.log('BLOCKING REDUNDANT "LOADED SUCCESSFULLY" AFTER "SWITCHED" TOAST');
                        return;
                    }
                }
                
                // Block multiple database loaded toasts with different names
                const loadedToastRecently = window.Core._recentToasts.some(t => 
                    t.key.includes('loaded successfully') && (now - t.timestamp) < 5000
                );
                
                if (loadedToastRecently && message.includes('loaded successfully')) {
                    console.log('BLOCKING MULTIPLE DATABASE LOADED TOASTS');
                    return;
                }
                
                // Record this toast to prevent duplicates
                window.Core._recentToasts.push({
                    key: toastKey,
                    timestamp: now
                });
                
                // Clean up old toasts from tracking
                window.Core._recentToasts = window.Core._recentToasts.filter(t => 
                    (now - t.timestamp) < 10000
                );
            }
            
            // Call the original function if it exists
            if (typeof originalShowToast === 'function') {
                return originalShowToast(message, type, duration);
            } else {
                // Fallback implementation if original doesn't exist
                console.log('Core toast fallback:', message, type);
                // ... rest of the fallback toast implementation
            }
        };
        
        // Protect our enhanced function from being overwritten
        Object.defineProperty(window.Core, 'showToast', {
            configurable: false,
            writable: false
        });
        
        console.log('Toast functionality enhanced with duplicate prevention');
    }
    
    // Fake implementation for showing Settings toast
    // This is specifically for updateSettingsPaths in storage-function-fix.js
    window.Core.showSettingsToast = function(message) {
        // Just log to console, don't try to show UI
        console.log(`Settings: ${message}`);
        return true;
    };
    
    console.log('Safe Core.showToast function installed');
})();
