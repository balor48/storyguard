/**
 * Initialize Components
 * 
 * This module provides a simple way to initialize the UI components
 * without relying on problematic imports.
 */

import { tryCatch } from '../error-handling-util.js';

/**
 * Initialize the UI components and prepare the showcase
 */
export function initializeComponents() {
    return tryCatch(() => {
        console.log('Initializing basic UI components...');
        
        // Create UI showcase function in global scope
        window.showUIComponentsShowcase = function() {
            // Create a simple modal to show UI components information
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '10000';
            
            const content = document.createElement('div');
            content.style.backgroundColor = '#fff';
            content.style.padding = '20px';
            content.style.borderRadius = '8px';
            content.style.maxWidth = '800px';
            content.style.maxHeight = '80vh';
            content.style.overflow = 'auto';
            content.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
            
            content.innerHTML = `
                <h2 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">UI Components</h2>
                
                <p>The UI Components system provides standardized components for consistent styling and behavior across the application:</p>
                
                <h3>Available Components</h3>
                
                <ul style="line-height: 1.6;">
                    <li><strong>Button</strong> - Standardized buttons with consistent styling</li>
                    <li><strong>FormInput</strong> - Form input fields with validation</li>
                    <li><strong>Dropdown</strong> - Selection dropdown with search capability</li>
                    <li><strong>Modal</strong> - Modal dialogs for consistent popups</li>
                    <li><strong>Card</strong> - Card layout for displaying content</li>
                </ul>
                
                <h3>How to Use</h3>
                
                <p>Components can be created through the UIManager:</p>
                
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">
// Create a button
const button = UIManager.createButton({
  content: 'Click Me',
  variant: 'primary',
  onClick: () => alert('Button clicked')
});

// Create a form input
const input = UIManager.createInput({
  label: 'Username',
  required: true,
  validation: { minLength: 3 }
});

// Create a dropdown
const dropdown = UIManager.createDropdown({
  label: 'Select Option',
  options: [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]
});

// Show a modal
UIManager.showModal('Information', 'This is a modal dialog');
                </pre>
                
                <p>See the documentation for more details on component options and usage.</p>
                
                <div style="text-align: right; margin-top: 20px;">
                    <button id="close-showcase-btn" style="padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            `;
            
            modal.appendChild(content);
            document.body.appendChild(modal);
            
            // Add close button functionality
            document.getElementById('close-showcase-btn').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
            // Close on backdrop click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        };
        
        // Add a floating button to show the showcase
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
        button.title = 'View UI Components';
        
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
        
        // Add to document when ready
        if (document.body) {
            document.body.appendChild(buttonContainer);
        } else {
            window.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(buttonContainer);
            });
        }
        
        return true;
    }, null, 'ui-components', 'error', { action: 'initialize' });
}

// Run initialization immediately
initializeComponents();
