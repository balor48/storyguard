/**
 * Emergency Header Text Alignment Fix
 * This script forces relationship dialog table headers to have center-aligned text
 * using multiple aggressive techniques
 */

document.addEventListener('DOMContentLoaded', function() {
    // Insert a style tag immediately
    const style = document.createElement('style');
    style.textContent = `
        /* Ultra-specific selectors for relationship dialog headers */
        div[role="dialog"] th,
        div[role="dialog"] .character-list table th,
        div[role="dialog"] table th,
        div[role="dialog"] .character-list table th:first-child,
        div[role="dialog"] .character-list table th:last-child,
        div[role="dialog"] table thead th,
        .character-list table th,
        .character-list table thead th {
            text-align: center !important;
        }
    `;
    document.head.appendChild(style);
    
    // Function that directly manipulates DOM elements
    function forceHeaderCentering() {
        // Get all dialog elements
        const dialogs = document.querySelectorAll('div[role="dialog"]');
        
        dialogs.forEach(dialog => {
            // Get all table headers within each dialog
            const headers = dialog.querySelectorAll('th');
            
            // Apply inline style directly to each header
            headers.forEach(header => {
                // Set multiple overlapping inline styles to ensure it takes effect
                header.style.cssText = 'text-align: center !important';
                header.setAttribute('align', 'center');
                
                // Create a style tag specifically for this header
                const inlineStyle = document.createElement('style');
                const randomId = 'header_' + Math.random().toString(36).substr(2, 9);
                
                // Add a unique ID to the header
                header.id = randomId;
                
                // Create a style that targets this specific header by ID
                inlineStyle.textContent = `
                    #${randomId} {
                        text-align: center !important;
                    }
                `;
                document.head.appendChild(inlineStyle);
            });
        });
        
        // Also target all th elements with text content matching 'First Name' or 'Last Name'
        document.querySelectorAll('th').forEach(th => {
            const content = th.textContent.trim();
            if (content === 'First Name' || content === 'Last Name') {
                th.style.cssText = 'text-align: center !important';
                th.setAttribute('align', 'center');
            }
        });
    }
    
    // Call immediately
    forceHeaderCentering();
    
    // Call on short interval to catch any newly created elements
    setInterval(forceHeaderCentering, 500);
    
    // Call on various events that might create dialogs
    document.addEventListener('click', function() {
        setTimeout(forceHeaderCentering, 100);
        setTimeout(forceHeaderCentering, 300);
    });
    
    document.addEventListener('mouseup', function() {
        setTimeout(forceHeaderCentering, 100);
        setTimeout(forceHeaderCentering, 300);
    });
}); 