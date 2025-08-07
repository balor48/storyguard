// Analyze Book Tab Element Fix
console.log('Analyze Book Tab Element Fix loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Applying analyze-book tab element fixes');
    
    // 1. Ensure the tab container exists with the required elements
    const tabId = 'analyze-book-tab';
    let tabElement = document.getElementById(tabId);
    
    if (!tabElement) {
        console.log(`Creating missing analyze-book tab container`);
        tabElement = document.createElement('div');
        tabElement.id = tabId;
        tabElement.className = 'tab-content';
        document.querySelector('.container').appendChild(tabElement);
    }
    
    // 2. Ensure the analyze-book tab has the required structure
    const analyzeBookContainer = tabElement.querySelector('.analyze-book-container');
    if (!analyzeBookContainer) {
        console.log('Creating missing analyze-book-container');
        
        // Clear any existing content
        tabElement.innerHTML = '';
        
        // Add basic structure
        tabElement.innerHTML = `
            <h2>Book Analysis</h2>
            <div class="analyze-book-container">
                <div class="book-upload-area">
                    <h3>Upload a Book</h3>
                    <p>Upload a text, DOCX, or TXT file to analyze the content for characters, locations, and more.</p>
                    <div class="file-input-container">
                        <input type="file" id="bookFileInput" accept=".txt,.doc,.docx,.text,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                        <label for="bookFileInput" class="file-input-label">Choose File</label>
                        <span id="selectedFileName">No file selected</span>
                    </div>
                    <button id="analyzeBookButton" disabled>Analyze Book</button>
                </div>
                <div class="analysis-results" style="display:none;">
                    <h3>Analysis Results</h3>
                    <div class="results-tabs">
                        <button class="results-tab-button active" data-tab="characters">Characters</button>
                        <button class="results-tab-button" data-tab="locations">Locations</button>
                        <button class="results-tab-button" data-tab="timeline">Timeline</button>
                        <button class="results-tab-button" data-tab="statistics">Statistics</button>
                    </div>
                    <div id="characters-results" class="results-panel active"></div>
                    <div id="locations-results" class="results-panel"></div>
                    <div id="timeline-results" class="results-panel"></div>
                    <div id="statistics-results" class="results-panel"></div>
                </div>
            </div>
        `;
    }
    
    // 3. Ensure BookAnalysis is properly initialized when tab is activated
    const originalSwitchTab = window.UI.switchTab;
    if (originalSwitchTab && !window.bookAnalysisTabFixed) {
        window.UI.switchTab = function(tabName) {
            // Call original function
            originalSwitchTab(tabName);
            
            // Extra handling for analyze-book tab
            if (tabName === 'analyze-book') {
                console.log('Initializing BookAnalysis module...');
                setTimeout(() => {
                    try {
                        if (window.BookAnalysis && typeof window.BookAnalysis.initialize === 'function') {
                            window.BookAnalysis.initialize();
                            console.log('BookAnalysis module initialized');
                        } else {
                            console.warn('BookAnalysis module not found or initialize method not available');
                            // Create a minimal implementation
                            if (!window.BookAnalysis) {
                                window.BookAnalysis = {
                                    initialize: function() {
                                        console.log('Mock BookAnalysis initialize called');
                                        
                                        // Set up basic file input handling
                                        const fileInput = document.getElementById('bookFileInput');
                                        const analyzeButton = document.getElementById('analyzeBookButton');
                                        const fileNameSpan = document.getElementById('selectedFileName');
                                        
                                        if (fileInput && analyzeButton && fileNameSpan) {
                                            fileInput.addEventListener('change', function() {
                                                if (this.files && this.files.length > 0) {
                                                    fileNameSpan.textContent = this.files[0].name;
                                                    analyzeButton.disabled = false;
                                                } else {
                                                    fileNameSpan.textContent = 'No file selected';
                                                    analyzeButton.disabled = true;
                                                }
                                            });
                                            
                                            analyzeButton.addEventListener('click', function() {
                                                if (fileInput.files && fileInput.files.length > 0) {
                                                    window.Core.showToast('Book analysis feature is not fully implemented yet.', 'info');
                                                }
                                            });
                                        }
                                    }
                                };
                                window.BookAnalysis.initialize();
                            }
                        }
                    } catch (error) {
                        console.error('Error initializing BookAnalysis:', error);
                    }
                }, 200);
            }
        };
        
        window.bookAnalysisTabFixed = true;
    }
    
    console.log('Analyze book tab element fixes applied');
});
