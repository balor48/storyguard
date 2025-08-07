/**
 * Keyboard shortcuts functionality for Story Database
 * Provides keyboard navigation and actions for improved productivity
 */

// Shortcut mappings
const SHORTCUTS = {
    // Navigation shortcuts
    'Alt+1': { action: 'switchTab', params: ['dashboard'], description: 'Go to Dashboard' },
    'Alt+2': { action: 'switchTab', params: ['characters'], description: 'Go to Characters' },
    'Alt+3': { action: 'switchTab', params: ['locations'], description: 'Go to Locations' },
    'Alt+4': { action: 'switchTab', params: ['relationships'], description: 'Go to Relationships' },
    'Alt+5': { action: 'switchTab', params: ['plots'], description: 'Go to Plots' },
    'Alt+6': { action: 'switchTab', params: ['worldbuilding'], description: 'Go to World-Building' },
    'Alt+7': { action: 'switchTab', params: ['timeline'], description: 'Go to Timeline' },
    'Alt+8': { action: 'switchTab', params: ['statistics'], description: 'Go to Statistics' },
    'Alt+9': { action: 'switchTab', params: ['analyze-book'], description: 'Go to Analyze Book' },
    
    // Form shortcuts
    'Alt+N': { action: 'newItem', description: 'Clear form / New item' },
    'Alt+S': { action: 'saveForm', description: 'Save current form' },
    
    // Search shortcuts
    'Ctrl+F': { action: 'focusSearch', description: 'Focus search box' },
    'Escape': { action: 'clearSearch', description: 'Clear search' },
    
    // Theme toggle
    'Alt+T': { action: 'toggleTheme', description: 'Toggle dark/light theme' },
    
    // Help
    'F1': { action: 'showShortcutsHelp', description: 'Show keyboard shortcuts help' }
};

// Initialize keyboard shortcuts
function initializeShortcuts() {
    // Set up keyboard event listener
    document.addEventListener('keydown', handleKeyboardShortcut);
    
    // Add shortcut hints to UI elements (except tabs)
    addShortcutHints();
    
    console.log('Keyboard shortcuts initialized');
}

// Handle keyboard shortcuts
function handleKeyboardShortcut(event) {
    // Don't trigger shortcuts when typing in input fields
    if (isInputElement(event.target)) {
        // Allow Escape to work in input fields
        if (event.key === 'Escape') {
            event.target.blur();
            event.preventDefault();
        }
        return;
    }
    
    // Build the shortcut key
    let shortcutKey = '';
    if (event.ctrlKey) shortcutKey += 'Ctrl+';
    if (event.altKey) shortcutKey += 'Alt+';
    if (event.shiftKey) shortcutKey += 'Shift+';
    
    // Add the pressed key
    if (event.key === ' ') {
        shortcutKey += 'Space';
    } else if (event.key === 'Escape') {
        shortcutKey = 'Escape'; // Special case for Escape
    } else {
        shortcutKey += event.key.toUpperCase();
    }
    
    // Check if the shortcut exists
    const shortcut = SHORTCUTS[shortcutKey];
    if (shortcut) {
        event.preventDefault();
        executeShortcut(shortcut);
    }
}

// Execute the shortcut action
function executeShortcut(shortcut) {
    switch (shortcut.action) {
        case 'switchTab':
            UI.switchTab(shortcut.params[0]);
            break;
            
        case 'newItem':
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) {
                const clearButton = activeTab.querySelector('.clear-form-btn');
                if (clearButton) {
                    clearButton.click();
                }
            }
            break;
            
        case 'saveForm':
            const activeTabForm = document.querySelector('.tab-content.active form');
            if (activeTabForm) {
                // Find the submit button and click it
                const submitButton = activeTabForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.click();
                }
            }
            break;
            
        case 'focusSearch':
            const activeTabSearch = document.querySelector('.tab-content.active input[type="text"][id$="SearchInput"]');
            if (activeTabSearch) {
                activeTabSearch.focus();
            }
            break;
            
        case 'clearSearch':
            const searchInput = document.querySelector('.tab-content.active input[type="text"][id$="SearchInput"]');
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                // Trigger the input event to update the display
                searchInput.dispatchEvent(new Event('input'));
            }
            break;
            
        case 'toggleTheme':
            // Use the global toggleDarkMode function instead of UI.toggleDarkMode
            if (typeof toggleDarkMode === 'function') {
                toggleDarkMode();
            } else {
                // Fallback to UI.toggleDarkMode if the global function is not available
                UI.toggleDarkMode();
            }
            break;
            
        case 'showShortcutsHelp':
            showShortcutsHelpDialog();
            break;
    }
}

// Check if the element is an input element
function isInputElement(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || 
           tagName === 'textarea' || 
           tagName === 'select' || 
           element.isContentEditable;
}

// Add shortcut hints to UI elements
function addShortcutHints() {
    // Skip adding hints to tab buttons - removed as requested
    
    // Add hint to theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        const shortcutHint = document.createElement('span');
        shortcutHint.className = 'shortcut-hint';
        shortcutHint.textContent = 'Alt+T';
        themeToggle.appendChild(shortcutHint);
    }
    
    // Add hints to form buttons
    const formButtons = document.querySelectorAll('.form-buttons');
    formButtons.forEach(buttonContainer => {
        const addButton = buttonContainer.querySelector('button[type="submit"]');
        const clearButton = buttonContainer.querySelector('.clear-form-btn');
        
        if (addButton) {
            const shortcutHint = document.createElement('span');
            shortcutHint.className = 'shortcut-hint';
            shortcutHint.textContent = 'Alt+S';
            addButton.appendChild(shortcutHint);
        }
        
        if (clearButton) {
            const shortcutHint = document.createElement('span');
            shortcutHint.className = 'shortcut-hint';
            shortcutHint.textContent = 'Alt+N';
            clearButton.appendChild(shortcutHint);
        }
    });
}

// Show shortcuts help dialog
function showShortcutsHelpDialog() {
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'shortcuts-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1100;
    `;
    
    // Create dialog content
    const content = document.createElement('div');
    content.className = 'shortcuts-dialog-content';
    content.style.cssText = `
        background: white;
        width: 90%;
        max-width: 600px;
        border-radius: 8px;
        padding: 20px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    `;
    
    // Add dark mode support
    if (document.body.classList.contains('dark-mode')) {
        content.style.background = '#343a40';
        content.style.color = '#f8f9fa';
    }
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Keyboard Shortcuts';
    title.style.marginTop = '0';
    title.style.borderBottom = '1px solid #eee';
    title.style.paddingBottom = '10px';
    content.appendChild(title);
    
    // Create shortcuts table
    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
    `;
    
    // Add table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Shortcut</th>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Description</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Add table body
    const tbody = document.createElement('tbody');
    
    // Group shortcuts by category
    const categories = {
        'Navigation': Object.entries(SHORTCUTS).filter(([_, s]) => s.action === 'switchTab'),
        'Form Actions': Object.entries(SHORTCUTS).filter(([_, s]) => ['newItem', 'saveForm'].includes(s.action)),
        'Search': Object.entries(SHORTCUTS).filter(([_, s]) => ['focusSearch', 'clearSearch'].includes(s.action)),
        'Other': Object.entries(SHORTCUTS).filter(([_, s]) => !['switchTab', 'newItem', 'saveForm', 'focusSearch', 'clearSearch'].includes(s.action))
    };
    
    // Add shortcuts by category
    Object.entries(categories).forEach(([category, shortcuts]) => {
        // Add category header
        const categoryRow = document.createElement('tr');
        const categoryCell = document.createElement('td');
        categoryCell.colSpan = 2;
        categoryCell.style.cssText = `
            font-weight: bold;
            padding: 12px 8px 8px;
            color: #007bff;
        `;
        if (document.body.classList.contains('dark-mode')) {
            categoryCell.style.color = '#4dabf7';
        }
        categoryCell.textContent = category;
        categoryRow.appendChild(categoryCell);
        tbody.appendChild(categoryRow);
        
        // Add shortcuts
        shortcuts.forEach(([key, shortcut]) => {
            const row = document.createElement('tr');
            
            const keyCell = document.createElement('td');
            keyCell.style.cssText = `
                padding: 8px;
                border-bottom: 1px solid #eee;
            `;
            
            const keySpan = document.createElement('span');
            keySpan.style.cssText = `
                display: inline-block;
                background-color: #f1f1f1;
                color: #333;
                padding: 2px 8px;
                border-radius: 3px;
                font-family: monospace;
                font-size: 14px;
            `;
            if (document.body.classList.contains('dark-mode')) {
                keySpan.style.backgroundColor = '#495057';
                keySpan.style.color = '#f8f9fa';
            }
            keySpan.textContent = key;
            keyCell.appendChild(keySpan);
            
            const descCell = document.createElement('td');
            descCell.style.cssText = `
                padding: 8px;
                border-bottom: 1px solid #eee;
            `;
            descCell.textContent = shortcut.description;
            
            row.appendChild(keyCell);
            row.appendChild(descCell);
            tbody.appendChild(row);
        });
    });
    
    table.appendChild(tbody);
    content.appendChild(table);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        margin-top: 20px;
        padding: 8px 16px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        float: right;
    `;
    closeButton.onclick = () => dialog.remove();
    content.appendChild(closeButton);
    
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    
    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
    
    // Close dialog with Escape key
    document.addEventListener('keydown', function closeDialog(e) {
        if (e.key === 'Escape') {
            dialog.remove();
            document.removeEventListener('keydown', closeDialog);
        }
    });
}

// Export shortcuts functions
window.Shortcuts = {
    initializeShortcuts,
    showShortcutsHelpDialog
};