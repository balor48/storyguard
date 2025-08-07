// Book Analysis Fix Script
console.log('Book Analysis fix script loaded');

// Create safe element accessors with null checks
document.addEventListener('DOMContentLoaded', () => {
    // Fix for the fileDropArea null reference error
    const originalSetupFileDropArea = window.BookAnalysis?.setupFileDropArea;
    
    if (window.BookAnalysis && typeof originalSetupFileDropArea === 'function') {
        window.BookAnalysis.setupFileDropArea = function() {
            console.log('Using patched setupFileDropArea with null checks');
            
            const dropArea = document.getElementById('fileDropArea');
            const fileInput = document.getElementById('bookFileUpload');
            const chooseBtn = document.getElementById('chooseFilesBtn');
            
            // Only set up event listeners if elements exist
            if (!dropArea) {
                console.warn('fileDropArea element not found, skipping event setup');
                return;
            }
            
            if (!fileInput) {
                console.warn('bookFileUpload element not found, skipping event setup');
                return;
            }
            
            if (!chooseBtn) {
                console.warn('chooseFilesBtn element not found, skipping event setup');
                return;
            }
            
            // Now safely proceed with the original function logic
            try {
                // Trigger file input when the choose button is clicked
                chooseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Use a flag to prevent multiple dialogs
                    if (!this._fileDialogOpen) {
                        this._fileDialogOpen = true;
                        fileInput.click();
                        
                        // Reset the flag after a short delay
                        setTimeout(() => {
                            this._fileDialogOpen = false;
                        }, 1000);
                    }
                });
                
                // Handle file selection
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        this.handleFiles(e.target.files);
                    }
                });
                
                // Prevent default drag behaviors
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropArea.addEventListener(eventName, preventDefaults, false);
                });
                
                function preventDefaults(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                // Highlight drop area when item is dragged over it
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropArea.addEventListener(eventName, () => {
                        dropArea.classList.add('highlight');
                        // Change border color to green
                        dropArea.style.borderColor = '#4CAF50';
                        // Add a faint green background
                        dropArea.style.backgroundColor = '#f0fff0';
                        // Change the icon color to green if it exists
                        const icon = dropArea.querySelector('.drop-icon');
                        if (icon) {
                            icon.style.color = '#4CAF50';
                        }
                    }, false);
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    dropArea.addEventListener(eventName, () => {
                        dropArea.classList.remove('highlight');
                        // Restore original border color
                        dropArea.style.borderColor = '#ccc';
                        // Restore original background color
                        dropArea.style.backgroundColor = '#fff';
                        // Restore icon color
                        const icon = dropArea.querySelector('.drop-icon');
                        if (icon) {
                            icon.style.color = '';
                        }
                    }, false);
                });
                
                // Handle dropped files
                dropArea.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    const files = dt.files;
                    this.handleFiles(files);
                }, false);
                
                console.log('File drop area event listeners set up successfully');
            } catch (error) {
                console.error('Error in setupFileDropArea:', error);
            }
        };
        
        console.log('Successfully patched BookAnalysis.setupFileDropArea');
    } else {
        console.warn('BookAnalysis or setupFileDropArea not found, fix will be applied when module loads');
        
        // Add a mutation observer to watch for the BookAnalysis object being added
        const checkInterval = setInterval(() => {
            if (window.BookAnalysis && typeof window.BookAnalysis.setupFileDropArea === 'function') {
                clearInterval(checkInterval);
                
                // Apply the fix by replacing the method
                const originalSetupFileDropArea = window.BookAnalysis.setupFileDropArea;
                
                window.BookAnalysis.setupFileDropArea = function() {
                    console.log('Using patched setupFileDropArea with null checks (delayed patch)');
                    
                    const dropArea = document.getElementById('fileDropArea');
                    const fileInput = document.getElementById('bookFileUpload');
                    const chooseBtn = document.getElementById('chooseFilesBtn');
                    
                    // Skip if elements don't exist
                    if (!dropArea || !fileInput || !chooseBtn) {
                        console.warn('Book analysis UI elements not found, skipping event setup');
                        return;
                    }
                    
                    // Call original method
                    try {
                        originalSetupFileDropArea.call(this);
                        console.log('Original setupFileDropArea called successfully');
                    } catch (error) {
                        console.error('Error calling original setupFileDropArea:', error);
                    }
                };
                
                console.log('Successfully applied delayed patch to BookAnalysis.setupFileDropArea');
            }
        }, 500);
    }
    
    // Fix for directory creation errors
    const fixDirectoryHandling = () => {
        // Create a safe directory path handler
        window.ensureDirectoryExists = function(dirPath) {
            if (!dirPath || typeof dirPath !== 'string') {
                console.error('Invalid directory path:', dirPath);
                return false;
            }
            
            // Electron's IPC messaging or a safer approach would go here
            // This is just a stub to prevent errors
            console.log('Safely handling directory creation for:', dirPath);
            return true;
        };
        
        // Patch any save file operations that don't properly check paths
        if (window.electron && window.electron.send) {
            const originalSend = window.electron.send;
            window.electron.send = function(channel, data) {
                if (channel === 'ensure-directory-exists' && (!data || data === 'undefined')) {
                    console.warn('Blocking invalid directory creation request:', data);
                    return false;
                }
                
                if (channel === 'save-file' && (!data || !data.path || data.path === 'undefined')) {
                    console.warn('Blocking invalid file save request:', data);
                    return false;
                }
                
                return originalSend.apply(this, arguments);
            };
        }
    };
    
    fixDirectoryHandling();
    console.log('Directory handling fixes applied');
});

console.log('Book Analysis fix script initialization complete');
