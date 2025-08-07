// Import the settings dialog function
import { showSettingsDialog } from '../storage/settings.js';

function initializeStorageFunctions() {
    // ... existing initialization code ...
    
    // Explicitly attach showSettingsDialog early
    if (typeof window.Storage !== 'undefined') {
        window.Storage.showSettingsDialog = showSettingsDialog;
        console.log('✓ showSettingsDialog successfully attached to window.Storage');
    }
}

// Call initialization
document.addEventListener('DOMContentLoaded', initializeStorageFunctions);

// ... existing code ... 