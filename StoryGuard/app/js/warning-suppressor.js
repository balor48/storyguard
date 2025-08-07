// Warning Suppressor
// Hides warnings about database directory configuration since we handle this in save-directory-fix.js

(function() {
    console.log('Warning suppressor loaded');
    
    // Array of warning text patterns to suppress
    const warningPatterns = [
        /database directory not configured/i,
        /please configure it in settings/i,
        /backup directory not configured/i,
        /directory not configured/i
    ];
    
    // Function to check if an element contains warning text we want to suppress
    function isUnwantedWarning(element) {
        // Check element text content against our patterns
        const text = element.textContent || '';
        
        for (const pattern of warningPatterns) {
            if (pattern.test(text)) {
                console.log('Found unwanted warning:', text);
                return true;
            }
        }
        
        return false;
    }
    
    // Function to hide warning elements with matching text
    function hideWarningElements() {
        // Look for elements with warning styling
        const possibleWarnings = document.querySelectorAll('.notification, .toast, .alert, [role="alert"], .warning');
        
        possibleWarnings.forEach(element => {
            if (isUnwantedWarning(element)) {
                console.log('Hiding warning element:', element);
                element.style.display = 'none';
                
                // Add a data attribute to mark it as hidden by our script
                element.setAttribute('data-suppressed-by', 'warning-suppressor');
            }
        });
        
        // Also check for notification-style divs that might not have the standard classes
        const allDivs = document.querySelectorAll('div');
        
        allDivs.forEach(div => {
            // Look for divs that appear to be notifications based on style
            const styles = window.getComputedStyle(div);
            const hasWarningStyles = 
                (styles.backgroundColor && (
                    styles.backgroundColor.includes('rgb(255, 193, 7)') || // warning yellow
                    styles.backgroundColor.includes('rgb(240, 173, 78)') || // warning amber
                    styles.backgroundColor.includes('rgb(255, 152, 0)') || // warning orange
                    styles.backgroundColor.includes('rgb(255, 235, 59)') // warning light yellow
                )) || 
                (styles.position === 'fixed' && 
                 parseInt(styles.zIndex) > 1000);
            
            if (hasWarningStyles && isUnwantedWarning(div)) {
                console.log('Hiding styled warning div:', div);
                div.style.display = 'none';
                div.setAttribute('data-suppressed-by', 'warning-suppressor');
            }
        });
    }
    
    // Function to observe DOM changes and hide new warnings
    function setupWarningObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                    break;
                }
            }
            
            if (shouldCheck) {
                setTimeout(hideWarningElements, 50);
            }
        });
        
        // Start observing the document body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('Warning observer setup complete');
    }
    
    // Initialize when the DOM is ready
    function initialize() {
        console.log('Initializing warning suppressor');
        
        // Immediately hide any existing warnings
        hideWarningElements();
        
        // Setup observer for new warnings
        setupWarningObserver();
        
        // Also check periodically in case observer misses something
        setInterval(hideWarningElements, 1000);
    }
    
    // Run on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM already loaded, run now
        initialize();
    }
    
    console.log('Warning suppressor script initialized');
})();
