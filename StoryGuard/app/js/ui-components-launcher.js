/**
 * UI Components Launcher
 * 
 * This script adds a global function and button to launch the UI components showcase.
 */

// Create global function to show UI components showcase
window.showUIComponentsShowcase = function() {
    // Check if the showcase panel already exists
    let showcasePanel = document.getElementById('ui-components-showcase');
    let showcaseBackdrop = document.getElementById('ui-components-showcase-backdrop');
    
    // If the panel exists, show it
    if (showcasePanel && showcaseBackdrop) {
        showcasePanel.style.display = 'block';
        showcaseBackdrop.style.display = 'block';
        return;
    }
    
    // If the panel doesn't exist yet, create a basic version immediately while we wait for the full version to initialize
    if (!showcasePanel) {
        // Create temporary loading message
        showcasePanel = document.createElement('div');
        showcasePanel.id = 'ui-components-showcase';
        showcasePanel.style.position = 'fixed';
        showcasePanel.style.top = '50%';
        showcasePanel.style.left = '50%';
        showcasePanel.style.transform = 'translate(-50%, -50%)';
        showcasePanel.style.backgroundColor = '#fff';
        showcasePanel.style.padding = '20px';
        showcasePanel.style.borderRadius = '8px';
        showcasePanel.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        showcasePanel.style.zIndex = '10000';
        showcasePanel.style.width = '400px';
        showcasePanel.style.textAlign = 'center';
        showcasePanel.innerHTML = `
            <h2>UI Components Showcase</h2>
            <p>Loading components...</p>
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; margin: 20px auto; animation: spin 2s linear infinite;"></div>
            <button id="temp-close-btn" style="padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        // Create backdrop
        showcaseBackdrop = document.createElement('div');
        showcaseBackdrop.id = 'ui-components-showcase-backdrop';
        showcaseBackdrop.style.position = 'fixed';
        showcaseBackdrop.style.top = '0';
        showcaseBackdrop.style.left = '0';
        showcaseBackdrop.style.width = '100%';
        showcaseBackdrop.style.height = '100%';
        showcaseBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        showcaseBackdrop.style.zIndex = '9999';
        
        // Add to body
        document.body.appendChild(showcaseBackdrop);
        document.body.appendChild(showcasePanel);
        
        // Add event listeners
        document.getElementById('temp-close-btn').addEventListener('click', function() {
            showcasePanel.style.display = 'none';
            showcaseBackdrop.style.display = 'none';
        });
        
        showcaseBackdrop.addEventListener('click', function() {
            showcasePanel.style.display = 'none';
            showcaseBackdrop.style.display = 'none';
        });
        
        // Try to load the full showcase
        setTimeout(function() {
            // Dynamically import the showcase module
            import('./modules/ui-components-showcase.js').then(module => {
                console.log('UI Components showcase module loaded');
                // The module's initialization should create the proper showcase
                // Remove our temporary version once the real one is ready
                setTimeout(function() {
                    const realShowcase = document.getElementById('ui-components-showcase');
                    if (realShowcase && realShowcase !== showcasePanel) {
                        document.body.removeChild(showcasePanel);
                        document.body.removeChild(showcaseBackdrop);
                        // Show the real showcase
                        realShowcase.style.display = 'block';
                        document.getElementById('ui-components-showcase-backdrop').style.display = 'block';
                    }
                }, 500);
            }).catch(err => {
                console.error('Failed to load UI components showcase module:', err);
                // Update the temporary showcase with error message
                showcasePanel.innerHTML = `
                    <h2>UI Components Showcase</h2>
                    <p style="color: red;">Failed to load components</p>
                    <p>${err.message}</p>
                    <button id="error-close-btn" style="padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                `;
                
                document.getElementById('error-close-btn').addEventListener('click', function() {
                    showcasePanel.style.display = 'none';
                    showcaseBackdrop.style.display = 'none';
                });
            });
        }, 100);
    }
};

// Create a floating button to launch the showcase
document.addEventListener('DOMContentLoaded', function() {
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '20px';
    buttonContainer.style.right = '20px';
    buttonContainer.style.zIndex = '9999';
    
    // Create button
    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-palette"></i> UI Components';
    button.style.padding = '10px 16px';
    button.style.backgroundColor = '#3498db';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    button.style.fontSize = '14px';
    button.title = 'View UI Components Showcase';
    
    // Add hover effect
    button.onmouseover = function() {
        this.style.backgroundColor = '#2980b9';
    };
    button.onmouseout = function() {
        this.style.backgroundColor = '#3498db';
    };
    
    // Add click event
    button.onclick = function() {
        window.showUIComponentsShowcase();
    };
    
    // Add to container
    buttonContainer.appendChild(button);
    
    // Add to document
    document.body.appendChild(buttonContainer);
});

// Also listen for app-ready event
window.addEventListener('storyguard:app-ready', function() {
    // If button was not added on DOMContentLoaded, add it now
    if (!document.querySelector('[title="View UI Components Showcase"]')) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.bottom = '20px';
        buttonContainer.style.right = '20px';
        buttonContainer.style.zIndex = '9999';
        
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-palette"></i> UI Components';
        button.style.padding = '10px 16px';
        button.style.backgroundColor = '#3498db';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        button.style.fontSize = '14px';
        button.title = 'View UI Components Showcase';
        
        button.onmouseover = function() {
            this.style.backgroundColor = '#2980b9';
        };
        button.onmouseout = function() {
            this.style.backgroundColor = '#3498db';
        };
        
        button.onclick = function() {
            window.showUIComponentsShowcase();
        };
        
        buttonContainer.appendChild(button);
        document.body.appendChild(buttonContainer);
    }
});
