/**
 * Cloud Status Direct Fix
 * 
 * This script directly manipulates the cloud status containers using
 * a more aggressive approach to ensure they are positioned correctly.
 */

// Function to fix cloud containers
function fixCloudContainers() {
    // Find all cloud containers on the page, regardless of class
    const cloudContainers = document.querySelectorAll('div');
    
    cloudContainers.forEach(container => {
        // Check if this is a cloud status container (by checking its content)
        if (container.textContent && container.textContent.includes('Not configured')) {
            // Apply direct styling
            container.style.position = 'absolute';
            container.style.top = '-50px';
            container.style.right = '12px';
            container.style.zIndex = '9999';
            container.style.backgroundColor = '#343a40';
            container.style.color = '#f8f9fa';
            container.style.padding = '10px';
            container.style.borderRadius = '5px';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            
            // Move it 12px to the right
            container.style.transform = 'translateX(12px)';
            
            // Make sure it's attached to the proper parent
            const parentButton = document.querySelector('.cloud-settings-btn');
            if (parentButton && parentButton.parentNode) {
                // Remove from current parent
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
                
                // Add to the button's parent
                parentButton.parentNode.appendChild(container);
            }
            
            console.log('Fixed cloud status container');
        }
    });
}

// Run on page load and periodically
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for everything to load
    setTimeout(fixCloudContainers, 1000);
    
    // Also run periodically to catch dynamically added containers
    setInterval(fixCloudContainers, 2000);
});

// Also listen for specific events that might trigger UI changes
document.addEventListener('click', function() {
    setTimeout(fixCloudContainers, 500);
});

console.log('Cloud status direct fix loaded'); 