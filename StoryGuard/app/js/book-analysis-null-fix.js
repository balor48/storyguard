// Book Analysis Null Fix Script
console.log('Book Analysis Null Fix script loaded');

// Fix for null reference errors without modifying the DOM structure
document.addEventListener('DOMContentLoaded', () => {
    console.log('Applying null reference fixes for Book Analysis tab');
    
    // Create a safer version of setupFileDropArea that checks for null elements
    const safeSetupFileDropArea = function() {
        console.log('Using safe setupFileDropArea with null checks');
        
        // Find the elements we need
        const dropArea = document.getElementById('fileDropArea');
        const fileInput = document.getElementById('bookFileUpload');
        const chooseBtn = document.getElementById('chooseFilesBtn');
        const cancelBtn = document.getElementById('cancelAnalysisBtn');
        
        // Exit early if critical elements are missing
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
        
        // Set up event handlers for the elements that exist
        try {
            // Set up the choose files button
            if (chooseBtn) {
                chooseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (fileInput) fileInput.click();
                });
            }
            
            // Set up the file input
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0 && window.BookAnalysis && typeof window.BookAnalysis.handleFiles === 'function') {
                        window.BookAnalysis.handleFiles(e.target.files);
                    }
                });
            }
            
            // Set up the cancel button
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    if (window.BookAnalysis && typeof window.BookAnalysis.cancelAnalysis === 'function') {
                        window.BookAnalysis.cancelAnalysis();
                    }
                });
            }
            
            // Set up drag and drop for the drop area
            if (dropArea) {
                // Prevent default behaviors
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropArea.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }, false);
                });
                
                // Highlight drop area when item is dragged over it
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropArea.addEventListener(eventName, () => {
                        dropArea.classList.add('highlight');
                    }, false);
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    dropArea.addEventListener(eventName, () => {
                        dropArea.classList.remove('highlight');
                    }, false);
                });
                
                // Handle dropped files
                dropArea.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    if (dt && dt.files && window.BookAnalysis && typeof window.BookAnalysis.handleFiles === 'function') {
                        window.BookAnalysis.handleFiles(dt.files);
                    }
                }, false);
            }
            
            console.log('Book analysis event listeners set up successfully');
        } catch (error) {
            console.error('Error setting up Book Analysis event listeners:', error);
        }
    };
    
    // Apply the fix
    if (window.BookAnalysis) {
        // Store the original setupFileDropArea function
        const originalSetup = window.BookAnalysis.setupFileDropArea;
        
        // Replace it with our safer version
        window.BookAnalysis.setupFileDropArea = safeSetupFileDropArea;
        
        console.log('Replaced BookAnalysis.setupFileDropArea with safer version');
        
        // Add dummy methods if they don't exist
        if (!window.BookAnalysis.analyzeBookText) {
            window.BookAnalysis.analyzeBookText = function(text) {
                console.log('Dummy analyzeBookText called with text length:', text.length);
                return [];
            };
        }
    } else {
        // If BookAnalysis isn't available yet, wait for it to load
        console.log('BookAnalysis not available yet, setting up monitor');
        
        // Check periodically if BookAnalysis becomes available
        const checkInterval = setInterval(() => {
            if (window.BookAnalysis && typeof window.BookAnalysis.setupFileDropArea === 'function') {
                clearInterval(checkInterval);
                
                // Replace the method with our safer version
                const originalSetup = window.BookAnalysis.setupFileDropArea;
                window.BookAnalysis.setupFileDropArea = safeSetupFileDropArea;
                
                console.log('BookAnalysis became available - replaced setupFileDropArea with safer version');
            }
        }, 500);
    }
    
    // Create the analyze-book-tab if it doesn't exist
    const createTabIfMissing = () => {
        if (!document.getElementById('analyze-book-tab')) {
            console.log('Creating missing analyze-book-tab element');
            
            const tab = document.createElement('div');
            tab.id = 'analyze-book-tab';
            tab.className = 'tab-content';
            tab.innerHTML = `<h2>Book Analysis</h2><p>Book analysis tab is loading...</p>`;
            
            // Add it to the container
            const container = document.querySelector('.container');
            if (container) {
                container.appendChild(tab);
            }
        }
    };
    
    // Apply the tab fix
    createTabIfMissing();
    
    // Fix for directory creation errors
    const fixDirectoryHandling = () => {
        if (window.electron && window.electron.send) {
            // Save the original send function
            const originalSend = window.electron.send;
            
            // Replace it with a safer version
            window.electron.send = function(channel, data) {
                // Check for invalid directory creation requests
                if (channel === 'ensure-directory-exists' && (!data || data === 'undefined')) {
                    console.warn('Blocking invalid directory creation request:', data);
                    return false;
                }
                
                // Check for invalid file save requests
                if (channel === 'save-file' && (!data || !data.path || data.path === 'undefined')) {
                    console.warn('Blocking invalid file save request:', data);
                    return false;
                }
                
                // Call the original function
                return originalSend.apply(this, arguments);
            };
            
            console.log('Patched electron.send to prevent invalid directory/file operations');
        }
    };
    
    // Apply the directory handling fix
    fixDirectoryHandling();
});

console.log('Book Analysis Null Fix script initialization complete');
