// Add toast notifications for manual backups
(function() {
    console.log('Manual backup toast notification handler loaded - DISABLED to prevent duplicates');

    // Function to add toast notifications for manual backups
    function addManualBackupToasts() {
        // Check if Storage.backupDatabase exists
        if (window.Storage && typeof window.Storage.backupDatabase === 'function') {
            console.log('Manual backup toast handler disabled to prevent duplicate notifications');
            
            // No longer adding toast notifications from this component
            // This prevents duplicate toast notifications with auto-backup-fix-improved.js
            
            console.log('Manual backup toast handler disabled successfully');
        } else {
            console.warn('Storage.backupDatabase not found, cannot modify manual backup toast handler');
            // Try again later
            setTimeout(addManualBackupToasts, 1000);
        }
    }
    
    // Initialize when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addManualBackupToasts);
    } else {
        // DOM already loaded, run now
        addManualBackupToasts();
    }
})(); 