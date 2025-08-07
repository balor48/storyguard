// Analyze Book Tab Fix Script
console.log('Analyze Book Tab Fix script loaded');

// Create the missing DOM elements for the analyze book tab
document.addEventListener('DOMContentLoaded', () => {
    console.log('Creating missing elements for Analyze Book tab');
    
    // Check if the analyze-book-tab exists
    let analyzeBookTab = document.getElementById('analyze-book-tab');
    
    // If the tab doesn't exist, create it
    if (!analyzeBookTab) {
        console.log('Creating analyze-book-tab element');
        analyzeBookTab = document.createElement('div');
        analyzeBookTab.id = 'analyze-book-tab';
        analyzeBookTab.className = 'tab-content';
        
        // Add tab to container
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(analyzeBookTab);
        } else {
            document.body.appendChild(analyzeBookTab);
        }
    }
    
    // Check if the tab already has content
    if (analyzeBookTab.innerHTML.trim() === '') {
        console.log('Populating analyze-book-tab with default content');
        
        // Create the basic structure for the analyze book tab
        analyzeBookTab.innerHTML = `
            <h2>Book Analysis</h2>
            <div class="analyze-book-container">
                <div class="file-drop-container">
                    <div id="fileDropArea" class="file-drop-area">
                        <div class="drop-message">
                            <i class="fas fa-upload drop-icon"></i>
                            <p>Drag & drop your book file here<br>or</p>
                            <input type="file" id="bookFileUpload" style="display: none;">
                            <button id="chooseFilesBtn" class="btn btn-primary">Select File</button>
                            <p class="supported-formats">Supported formats: TXT, DOCX, RTF, HTML</p>
                        </div>
                    </div>
                    <div id="uploadedFiles" class="uploaded-files"></div>
                </div>
                <div class="analyze-options">
                    <div class="options-header">
                        <h3>Analysis Options</h3>
                        <button id="showReadmeBtn" class="btn btn-info" onclick="BookAnalysis.showReadme()">
                            <i class="fas fa-question-circle"></i> What's This?
                        </button>
                    </div>
                    <div class="options-content">
                        <div class="option-group">
                            <label>Detection Methods:</label>
                            <div class="checkbox-group">
                                <label>
                                    <input type="checkbox" id="methodDialogue" checked>
                                    Dialogue Attribution
                                </label>
                                <label>
                                    <input type="checkbox" id="methodNER" checked>
                                    Named Entity Recognition
                                </label>
                                <label>
                                    <input type="checkbox" id="methodCapitalized" checked>
                                    Capitalized Word Analysis
                                </label>
                                <label>
                                    <input type="checkbox" id="methodFrequency" checked>
                                    Frequency Analysis
                                </label>
                                <label>
                                    <input type="checkbox" id="methodTitles" checked>
                                    Title & Honorific Detection
                                </label>
                                <label>
                                    <input type="checkbox" id="methodDirectAddress" checked>
                                    Direct Address Pattern
                                </label>
                                <label>
                                    <input type="checkbox" id="methodPossessive" checked>
                                    Possessive Form Detection
                                </label>
                                <label>
                                    <input type="checkbox" id="methodIntroduction" checked>
                                    Character Introduction
                                </label>
                            </div>
                        </div>
                        <div class="option-group">
                            <label for="minMentions">Minimum Character Mentions:</label>
                            <input type="number" id="minMentions" value="3" min="1" max="100">
                        </div>
                        <div class="option-group">
                            <label>
                                <input type="checkbox" id="combineVariants" checked>
                                Combine Name Variants
                            </label>
                        </div>
                        <div class="option-group">
                            <label>
                                <input type="checkbox" id="filterCommonWords" checked>
                                Filter Common Words
                            </label>
                        </div>
                        <div class="action-buttons">
                            <button id="analyzeBookBtn" class="btn btn-primary">
                                <i class="fas fa-search"></i> Analyze Book
                            </button>
                        </div>
                    </div>
                </div>
                <div id="formatInfo" class="format-info"></div>
                <div id="analysisLoading" class="analysis-loading" style="display: none;">
                    <div class="progress-container">
                        <div class="progress-bar-container">
                            <div id="analysisProgressBar" class="progress-bar"></div>
                        </div>
                        <div id="analysisProgressText" class="progress-text">Starting analysis...</div>
                    </div>
                    <button id="cancelAnalysisBtn" class="btn btn-danger">Cancel</button>
                </div>
                <div class="analysis-results-container">
                    <div id="seriesBookSection" style="display: none;">
                        <div class="series-book-selector">
                            <div class="selector-column">
                                <label for="analysisSeries">Series:</label>
                                <div class="select-container">
                                    <select id="analysisSeries" onchange="BookAnalysis.handleDropdownChange('analysisSeries', this.value)">
                                        <option value="">Select Series</option>
                                        <option value="new">+ Add New Series</option>
                                    </select>
                                </div>
                                <div id="newAnalysisSeriesForm" class="new-item-form" style="display: none;">
                                    <input type="text" id="newAnalysisSeriesInput" placeholder="New Series Name">
                                    <div class="form-buttons">
                                        <button onclick="BookAnalysis.addNewItem('analysisSeries')" class="btn btn-primary">Add</button>
                                        <button onclick="BookAnalysis.cancelNewItem('analysisSeries')" class="btn btn-secondary">Cancel</button>
                                    </div>
                                </div>
                            </div>
                            <div class="selector-column">
                                <label for="analysisBook">Book:</label>
                                <div class="select-container">
                                    <select id="analysisBook" onchange="BookAnalysis.handleDropdownChange('analysisBook', this.value)">
                                        <option value="">Select Book</option>
                                        <option value="new">+ Add New Book</option>
                                    </select>
                                </div>
                                <div id="newAnalysisBookForm" class="new-item-form" style="display: none;">
                                    <input type="text" id="newAnalysisBookInput" placeholder="New Book Name">
                                    <div class="form-buttons">
                                        <button onclick="BookAnalysis.addNewItem('analysisBook')" class="btn btn-primary">Add</button>
                                        <button onclick="BookAnalysis.cancelNewItem('analysisBook')" class="btn btn-secondary">Cancel</button>
                                    </div>
                                </div>
                            </div>
                            <div class="selector-column button-column">
                                <button onclick="BookAnalysis.addToTable()" class="btn btn-primary">Apply to Table</button>
                                <button onclick="BookAnalysis.clearTable()" class="btn btn-secondary">Clear Table</button>
                            </div>
                        </div>
                    </div>
                    <div id="tableActionButtons" style="display: none;">
                        <div class="action-button-group">
                            <button onclick="BookAnalysis.selectAllCharacters()" class="btn btn-primary">Select All</button>
                            <button onclick="BookAnalysis.deselectAllCharacters()" class="btn btn-secondary">Deselect All</button>
                            <button onclick="BookAnalysis.clearAnalysis()" class="btn btn-danger">Clear Analysis</button>
                            <button onclick="BookAnalysis.addSelectedCharacters()" class="btn btn-success">Add Selected to Database</button>
                            <button onclick="BookAnalysis.generateAnalysisReport()" class="btn btn-info">
                                <i class="fas fa-file-pdf"></i> Generate Report
                            </button>
                        </div>
                    </div>
                    <div id="analysisResults" style="display: none;">
                        <div id="detectedCharacters"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Observer to reinitialize the BookAnalysis module when the tab is shown
    const tabObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const tab = mutation.target;
                if (tab.id === 'analyze-book-tab' && tab.classList.contains('active')) {
                    console.log('Analyze Book tab is now active, reinitializing');
                    if (window.BookAnalysis && typeof window.BookAnalysis.initialize === 'function') {
                        try {
                            window.BookAnalysis.initialize();
                        } catch (e) {
                            console.error('Error reinitializing BookAnalysis:', e);
                        }
                    }
                }
            }
        });
    });
    
    // Start observing the tab element for class changes
    tabObserver.observe(analyzeBookTab, { attributes: true });
    
    console.log('Analyze Book Tab initialization complete');
});

console.log('Analyze Book Tab Fix script loaded and ready');
