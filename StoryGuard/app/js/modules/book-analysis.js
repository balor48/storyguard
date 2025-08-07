/**
 * Book Analysis Module
 * 
 * Handles book file processing, text extraction, and character detection
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Book Analysis module
    BookAnalysis.init();
    
    // Check if analyzeBookText is properly defined
    setTimeout(() => {
        console.log('Checking if analyzeBookText is defined:', typeof BookAnalysis.analyzeBookText);
        console.log('BookAnalysis methods:', Object.keys(BookAnalysis).filter(key => typeof BookAnalysis[key] === 'function'));
    }, 1000); // Wait 1 second to ensure all scripts are loaded
});

// BookAnalysis module
window.BookAnalysis = {
    // Store extracted characters
    extractedCharacters: null,
    
    // Store the current file being analyzed
    currentFile: null,
    
    // Store file statistics
    fileStats: null,
    
    // Flag to track if analysis is in progress
    analysisInProgress: false,
    
    // Calculate statistics about the text content
    calculateFileStats: function(text) {
        try {
            console.log('Calculating file statistics...');
            
            if (!text) {
                console.warn('No text provided to calculateFileStats');
                this.fileStats = {
                    wordCount: 0,
                    characterCount: 0,
                    lineCount: 0,
                    avgWordsPerSentence: 0,
                    estimatedReadTime: 0
                };
                return this.fileStats;
            }
            
            // Calculate basic stats
            const characterCount = text.length;
            const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
            const lineCount = text.split(/\r\n|\r|\n/).length;
            
            // Estimate sentence count by looking for sentence terminators (., !, ?)
            const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            
            // Calculate average words per sentence
            const avgWordsPerSentence = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : 0;
            
            // Estimate reading time (assuming 200 words per minute)
            const estimatedReadTime = wordCount > 0 ? Math.ceil(wordCount / 200) : 0;
            
            this.fileStats = {
                wordCount,
                characterCount,
                lineCount,
                sentenceCount,
                avgWordsPerSentence,
                estimatedReadTime
            };
            
            console.log('File statistics calculated:', this.fileStats);
            return this.fileStats;
        } catch (error) {
            console.error('Error in calculateFileStats:', error);
            // Provide a default result in case of error
            this.fileStats = {
                wordCount: text ? text.length / 5 : 0, // Rough estimate
                characterCount: text ? text.length : 0,
                lineCount: text ? text.split(/\r\n|\r|\n/).length : 0,
                sentenceCount: 0,
                avgWordsPerSentence: 0,
                estimatedReadTime: 0
            };
            return this.fileStats;
        }
    },
    
    // Display format information in the UI
    displayFormatInfo: function() {
        try {
            console.log('Displaying format information...');
            
            if (!this.fileStats) {
                console.warn('No file statistics available for display');
                return;
            }
            
            // Get the format info container
            const formatInfoContainer = document.getElementById('formatInfo');
            if (!formatInfoContainer) {
                console.warn('Format info container not found in the DOM');
                return;
            }
            
            // Create the format info HTML
            const { wordCount, characterCount, lineCount, avgWordsPerSentence, estimatedReadTime } = this.fileStats;
            
            formatInfoContainer.innerHTML = `
                <div class="format-info-item">
                    <span class="format-info-label">Word Count:</span>
                    <span class="format-info-value">${wordCount.toLocaleString()}</span>
                </div>
                <div class="format-info-item">
                    <span class="format-info-label">Character Count:</span>
                    <span class="format-info-value">${characterCount.toLocaleString()}</span>
                </div>
                <div class="format-info-item">
                    <span class="format-info-label">Line Count:</span>
                    <span class="format-info-value">${lineCount.toLocaleString()}</span>
                </div>
                <div class="format-info-item">
                    <span class="format-info-label">Avg. Words per Sentence:</span>
                    <span class="format-info-value">${avgWordsPerSentence}</span>
                </div>
                <div class="format-info-item">
                    <span class="format-info-label">Estimated Reading Time:</span>
                    <span class="format-info-value">${estimatedReadTime} min</span>
                </div>
            `;
            
            // Show the format info container
            formatInfoContainer.style.display = 'block';
            
            console.log('Format information displayed successfully');
        } catch (error) {
            console.error('Error displaying format information:', error);
            // Silently fail - this is not critical functionality
        }
    },
    
    // Initialize the module
    init: function() {
        // Initialize series-book-section visibility
        const seriesBookSection = document.getElementById('seriesBookSection');
        if (seriesBookSection) {
            seriesBookSection.style.display = 'none'; // Start hidden
        }
        
        // Reset UI states when initializing
        this.resetUIStates();
        
        // Set up the file drop area
        this.setupFileDropArea();
        
        // Set up the analyze button
        const analyzeBtn = document.getElementById('analyzeBookBtn');
        if (!analyzeBtn) {
            console.error('Analyze button not found in the DOM!');
        } else {
            analyzeBtn.addEventListener('click', () => {
                console.log('Analyze button clicked!');
                
                if (this.currentFile) {
                    console.log('Current file exists, processing:', this.currentFile.name);
                    
                    // Check if we have an analyzeBookText method
                    if (typeof this.analyzeBookText !== 'function') {
                        console.warn('analyzeBookText is not defined yet - integration files might not be loaded');
                        
                        // Try to load the integration modules
                        if (!window.NameExtractor) {
                            console.warn('NameExtractor not found - attempting to load it');
                            const nameExtractorScript = document.createElement('script');
                            nameExtractorScript.src = 'js/modules/name-extractor.js';
                            document.head.appendChild(nameExtractorScript);
                        }
                        
                        const integrationScript = document.createElement('script');
                        integrationScript.src = 'js/modules/book-analysis-integration.js';
                        document.head.appendChild(integrationScript);
                        
                        // Give the scripts a moment to load
                        setTimeout(() => {
                            if (typeof this.analyzeBookText === 'function') {
                                console.log('analyzeBookText is now defined, continuing...');
                                this.processFile(this.currentFile);
                            } else {
                                console.error('Failed to load required scripts, using fallback');
                                
                                // Define a minimal fallback if all else fails
                                this.analyzeBookText = function(text) {
                                    alert('Using minimal fallback extraction - you may want to reload the page to get full functionality');
                                    
                                    // Very simple extraction
                                    const names = {};
                                    const matches = text.match(/\b[A-Z][a-z]+\b/g) || [];
                                    matches.forEach(name => {
                                        if (!names[name]) names[name] = 0;
                                        names[name]++;
                                    });
                                    
                                    this.extractedCharacters = Object.entries(names)
                                        .filter(([name, count]) => count >= 3)
                                        .map(([name, count]) => ({
                                            fullName: name,
                                            firstName: name,
                                            lastName: '',
                                            title: '',
                                            mentions: count,
                                            variants: []
                                        }))
                                        .sort((a, b) => b.mentions - a.mentions);
                                        
                                    // Show basic results
                                    this.displayBasicResults();
                                    return this.extractedCharacters;
                                };
                                
                                this.processFile(this.currentFile);
                            }
                        }, 1000);
                    } else {
                        this.processFile(this.currentFile);
                    }
                } else {
                    // Create a custom centered modal instead of using alert
                    const modalExists = document.getElementById('selectFileModal');
                    if (modalExists) {
                        // If modal already exists, just show it
                        modalExists.style.display = 'flex';
                        return;
                    }
                    
                    // Create modal container
                    const modal = document.createElement('div');
                    modal.id = 'selectFileModal';
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 9999;
                    `;
                    
                    // Create modal content
                    const modalContent = document.createElement('div');
                    modalContent.style.cssText = `
                        background-color: #333;
                        color: white;
                        padding: 20px;
                        border-radius: 5px;
                        border: 1px solid #555;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                        text-align: center;
                        max-width: 400px;
                        width: 90%;
                    `;
                    
                    // Add message
                    const message = document.createElement('p');
                    message.textContent = 'Please select a file to analyze first.';
                    message.style.cssText = `
                        margin-bottom: 20px;
                        font-size: 16px;
                        color: white;
                        font-weight: bold;
                    `;
                    
                    // Add close button
                    const closeButton = document.createElement('button');
                    closeButton.textContent = 'OK';
                    closeButton.style.cssText = `
                        background-color: #3498db;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                        transition: background-color 0.2s;
                    `;
                    
                    // Add hover effect
                    closeButton.onmouseover = function() {
                        this.style.backgroundColor = '#2980b9';
                    };
                    closeButton.onmouseout = function() {
                        this.style.backgroundColor = '#3498db';
                    };
                    
                    closeButton.addEventListener('click', function() {
                        modal.style.display = 'none';
                    });
                    
                    // Add click outside to close
                    modal.addEventListener('click', function(e) {
                        if (e.target === modal) {
                            modal.style.display = 'none';
                        }
                    });
                    
                    // Assemble modal
                    modalContent.appendChild(message);
                    modalContent.appendChild(closeButton);
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);
                }
            });
        }
        
        // Set up the cancel analysis button
        document.getElementById('cancelAnalysisBtn').addEventListener('click', () => {
            this.cancelAnalysis();
        });
        
        // Set up the series and book dropdowns
        this.setupSeriesAndBookDropdowns();
        
        // Add event listener for tab switching to refresh dropdowns
        document.getElementById('analyze-book-tab-button').addEventListener('click', () => {
            // Refresh the dropdowns when the tab is clicked
            setTimeout(() => {
                this.refreshDropdowns();
                
                // Refresh dropdowns but preserve visibility state
            }, 100);
        });
    },
    
    // Set up the series and book dropdowns
    setupSeriesAndBookDropdowns: function() {
        const maxRetries = 3;
        let retryCount = 0;
        
        const tryPopulateDropdowns = () => {
            // Get the dropdowns
            const seriesDropdown = document.getElementById('analysisSeries');
            const bookDropdown = document.getElementById('analysisBook');
            
            if (!seriesDropdown || !bookDropdown) {
                console.warn('Dropdowns not found in DOM, will retry');
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(tryPopulateDropdowns, 1000);
                }
                return;
            }
            
            // Try to get series data from multiple sources
            let series = [];
            try {
                // Try Characters module first (most reliable)
                if (typeof Characters !== 'undefined' && Characters.getAllSeries) {
                    series = Characters.getAllSeries() || [];
                }
                // Try window.seriesList next
                if (!series.length && window.seriesList) {
                    series = window.seriesList;
                }
                // Try localStorage as last resort
                if (!series.length) {
                    const storedSeries = localStorage.getItem('series');
                    if (storedSeries) {
                        series = JSON.parse(storedSeries);
                    }
                }
            } catch (e) {
                console.error('Error loading series:', e);
            }

            // Similar approach for books
            let books = [];
            try {
                // Try Characters module first
                if (typeof Characters !== 'undefined' && Characters.getAllBooks) {
                    books = Characters.getAllBooks() || [];
                }
                // Try window.books next
                if (!books.length && window.books) {
                    books = window.books;
                }
                // Try localStorage as last resort
                if (!books.length) {
                    const storedBooks = localStorage.getItem('books');
                    if (storedBooks) {
                        books = JSON.parse(storedBooks);
                    }
                }
            } catch (e) {
                console.error('Error loading books:', e);
            }

            // Log data sources for debugging
            console.log('Data sources:', {
                charactersModule: typeof Characters !== 'undefined',
                windowSeriesList: typeof window.seriesList !== 'undefined',
                windowBooks: typeof window.books !== 'undefined',
                localStorageSeries: localStorage.getItem('series') !== null,
                localStorageBooks: localStorage.getItem('books') !== null
            });

            // If no data found and retries remaining, retry
            if ((!series.length || !books.length) && retryCount < maxRetries) {
                console.log(`No data found, retrying... (${retryCount + 1}/${maxRetries})`);
                retryCount++;
                setTimeout(tryPopulateDropdowns, 1000);
                return;
            }

            // Populate series dropdown
            if (series.length > 0) {
                let newOption = seriesDropdown.querySelector('option[value="new"]');
                series.forEach(seriesName => {
                    if (!seriesDropdown.querySelector(`option[value="${seriesName}"]`)) {
                        const option = document.createElement('option');
                        option.value = seriesName;
                        option.textContent = seriesName;
                        if (newOption && newOption.nextSibling) {
                            seriesDropdown.insertBefore(option, newOption.nextSibling);
                        } else {
                            seriesDropdown.appendChild(option);
                        }
                    }
                });
                console.log(`Populated series dropdown with ${series.length} items`);
            } else {
                console.warn("No series found to populate dropdown");
            }

            // Populate books dropdown
            if (books.length > 0) {
                let newOption = bookDropdown.querySelector('option[value="new"]');
                books.forEach(bookName => {
                    if (!bookDropdown.querySelector(`option[value="${bookName}"]`)) {
                        const option = document.createElement('option');
                        option.value = bookName;
                        option.textContent = bookName;
                        if (newOption && newOption.nextSibling) {
                            bookDropdown.insertBefore(option, newOption.nextSibling);
                        } else {
                            bookDropdown.appendChild(option);
                        }
                    }
                });
                console.log(`Populated books dropdown with ${books.length} items`);
            } else {
                console.warn("No books found to populate dropdown");
            }
        };
        
        // Start the population process
        tryPopulateDropdowns();
    },
    
    // Handle dropdown change for "Add New" option
    handleDropdownChange: function(fieldName, value) {
        const suffix = fieldName.replace('analysis', '');
        const formId = `newAnalysis${suffix.charAt(0).toUpperCase() + suffix.slice(1)}Form`;
        const form = document.getElementById(formId);
        
        console.log(`Dropdown changed: ${fieldName} = ${value}, form = ${formId}`);
        
        if (value === 'new') {
            // Show the new item form
            form.style.display = 'flex';
            console.log(`Setting ${formId} display to flex`);
            
            // Focus on the input field
            setTimeout(() => {
                const suffix = fieldName.replace('analysis', '');
                const inputField = document.getElementById(`newAnalysis${suffix.charAt(0).toUpperCase() + suffix.slice(1)}Input`);
                if (inputField) {
                    inputField.focus();
                    console.log(`Focused on input field`);
                } else {
                    console.log(`Input field not found`);
                }
            }, 50);
        } else {
            // Hide the new item form
            form.style.display = 'none';
            console.log(`Setting ${formId} display to none`);
            
            // We no longer automatically apply the value to all rows
            // This will now be handled by the "Add to Table" button
        }
    },
    
    // Cancel adding a new item
    cancelNewItem: function(fieldName) {
        console.log(`Canceling new item for ${fieldName}`);
        
        // Extract the suffix from the fieldName
        const suffix = fieldName.replace('analysis', '');
        
        // Hide the form
        const formId = `newAnalysis${suffix.charAt(0).toUpperCase() + suffix.slice(1)}Form`;
        const form = document.getElementById(formId);
        if (form) {
            form.style.display = 'none';
        }
        
        // Reset the dropdown to its default value
        const dropdown = document.getElementById(fieldName);
        if (dropdown) {
            dropdown.value = '';
        }
        
        // Clear the input field
        const inputId = `newAnalysis${suffix.charAt(0).toUpperCase() + suffix.slice(1)}Input`;
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.value = '';
        }
    },
    
    // Add new item to dropdown - based on Characters.js implementation
    addNewItem: function(fieldName) {
        console.log(`Adding new item for ${fieldName}`);
        
        // Extract the base type (series or book) from the fieldName
        const type = fieldName.replace('analysis', '').toLowerCase();
        
        // Get the input element
        const suffix = fieldName.replace('analysis', '');
        const inputId = `newAnalysis${suffix.charAt(0).toUpperCase() + suffix.slice(1)}Input`;
        const inputElement = document.getElementById(inputId);
        
        if (!inputElement) {
            console.error(`Could not find input: ${inputId}`);
            return;
        }
        
        const value = inputElement.value.trim();
        
        if (!value) {
            if (typeof Core !== 'undefined' && Core.showToast) {
                Core.showToast(`Please enter a ${type}`, 'error');
            } else {
                alert(`Please enter a ${type}`);
            }
            return;
        }
        
        // Get the appropriate array to update
        let itemArray;
        if (type === 'series') {
            itemArray = typeof seriesList !== 'undefined' ? seriesList : [];
        } else if (type === 'book') {
            itemArray = typeof books !== 'undefined' ? books : [];
        } else {
            console.error(`Unknown type: ${type}`);
            return;
        }
        
        // Check if the value already exists
        if (itemArray.includes(value)) {
            if (typeof Core !== 'undefined' && Core.showToast) {
                Core.showToast(`${value} already exists`, 'error');
            } else {
                alert(`${value} already exists`);
            }
            return;
        }
        
        // Add to the array and save to localStorage
        itemArray.push(value);
        
        // Save to localStorage
        if (typeof Core !== 'undefined' && Core.safelyStoreItem) {
            Core.safelyStoreItem(type === 'series' ? 'series' : type + 's', JSON.stringify(itemArray));
        } else {
            localStorage.setItem(type === 'series' ? 'series' : type + 's', JSON.stringify(itemArray));
        }
        
        // Update the dropdown
        const dropdown = document.getElementById(fieldName);
        if (dropdown) {
            // Add new option to dropdown
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            
            // Insert after the "Add New" option
            const newOption = dropdown.querySelector('option[value="new"]');
            if (newOption && newOption.nextSibling) {
                dropdown.insertBefore(option, newOption.nextSibling);
            } else {
                dropdown.appendChild(option);
            }
            
            // Select the new option
            dropdown.value = value;
        }
        
        // Clear the input and hide the form
        inputElement.value = '';
        const formId = `newAnalysis${suffix.charAt(0).toUpperCase() + suffix.slice(1)}Form`;
        const form = document.getElementById(formId);
        if (form) {
            form.style.display = 'none';
        }
        
        // We no longer automatically apply the value to all rows
        // This will now be handled by the "Add to Table" button
        
        // Add to Characters module if available
        if (typeof Characters !== 'undefined') {
            if (type === 'series' && Characters.addSeries) {
                Characters.addSeries(value);
            } else if (type === 'book' && Characters.addBook) {
                Characters.addBook(value);
            }
        }
        
        // Refresh the dropdowns to ensure all options are up to date
        this.refreshDropdowns();
        
        // Show success message
        if (typeof Core !== 'undefined' && Core.showToast) {
            Core.showToast(`${value} added to ${type} list`);
        } else {
            console.log(`Added new ${type}: ${value}`);
        }
    },
    
    // Set up the file drop area
    setupFileDropArea: function() {
        const dropArea = document.getElementById('fileDropArea');
        const fileInput = document.getElementById('bookFileUpload');
        const chooseBtn = document.getElementById('chooseFilesBtn');
        
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
    },
    
    // Handle uploaded files
    handleFiles: function(files) {
        // Currently we only support analyzing one file at a time
        if (files.length > 0) {
            // Get the first file
            const file = files[0];
            
            // Check if the file type is supported
            if (this.isSupportedFileType(file)) {
                // Display the file
                this.displayUploadedFile(file);
                
                // Store the current file
                this.currentFile = file;
                
                // Enable the analyze button
                document.getElementById('analyzeBookBtn').disabled = false;
            } else {
                alert('Unsupported file type. Please upload a TXT, DOCX, RTF, or HTML file.');
            }
        }
    },
    
    // Check if the file type is supported
    isSupportedFileType: function(file) {
        const supportedTypes = [
            'text/plain',                  // TXT
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
            'application/rtf',             // RTF
            'text/html',                   // HTML
            'application/msword'           // DOC
        ];
        
        // Check by MIME type
        if (supportedTypes.includes(file.type)) {
            return true;
        }
        
        // As a fallback, check by file extension
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.txt') ||
            fileName.endsWith('.docx') ||
            fileName.endsWith('.rtf') ||
            fileName.endsWith('.html') ||
            fileName.endsWith('.htm') ||
            fileName.endsWith('.doc')) {
            return true;
        }
        
        return false;
    },
    
    // Display uploaded file in the UI
    displayUploadedFile: function(file) {
        const uploadedFiles = document.getElementById('uploadedFiles');
        uploadedFiles.innerHTML = ''; // Clear previous files
        
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file';
        
        // Get the file icon based on type
        let fileIcon = 'fa-file-alt'; // Default
        if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            fileIcon = 'fa-file-word';
        } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
            fileIcon = 'fa-file-code';
        }
        
        // Format file size
        const fileSizeFormatted = this.formatFileSize(file.size);
        
        // Truncate filename if it's too long
        let displayName = file.name;
        if (displayName.length > 20) {
            const extension = displayName.lastIndexOf('.');
            if (extension !== -1) {
                const ext = displayName.substring(extension);
                displayName = displayName.substring(0, 17) + '...' + ext;
            } else {
                displayName = displayName.substring(0, 17) + '...';
            }
        }
        
        fileElement.innerHTML = `
            <i class="fas ${fileIcon} file-icon"></i>
            <span class="file-name" title="${file.name}">${displayName}</span>
            <span class="file-size">${fileSizeFormatted}</span>
            <i class="fas fa-times file-remove" title="Remove file"></i>
        `;
        
        uploadedFiles.appendChild(fileElement);
        
        // Add remove file event listener
        fileElement.querySelector('.file-remove').addEventListener('click', () => {
            uploadedFiles.innerHTML = '';
            this.currentFile = null;
            // Keep the analyze button enabled
            // document.getElementById('analyzeBookBtn').disabled = true;
        });
    },
    
    // Format file size (convert bytes to KB, MB, etc.)
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Process the file to extract text and analyze
    processFile: function(file) {
        if (!file) {
            console.error('No file provided for processing');
            return;
        }
        
        console.log('processFile called with file:', file.name);
        
        // Store the current file being analyzed
        this.currentFile = file;
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        try {
            // Clear any existing safety timeout
            if (this.safetyTimeoutId) {
                clearTimeout(this.safetyTimeoutId);
            }
            
            // Add a safety timeout to hide the loading indicator if it gets stuck
            this.safetyTimeoutId = setTimeout(() => {
                console.log('Safety timeout reached - forcing loading indicator to hide');
                
                // Create a force hide button
                this.createForceHideButton();
                
                // Also hide the loading indicator automatically
                this.hideLoadingIndicator();
            }, 30000); // 30 seconds timeout
        
            // Extract text from the file based on its type
            this.extractTextFromFile(file)
                .then(text => {
                    try {
                        console.log('Text extracted successfully, length:', text.length);
                        
                        // Calculate file stats
                        if (typeof this.calculateFileStats === 'function') {
                            this.calculateFileStats(text);
                        } else {
                            console.error('calculateFileStats is not a function!', typeof this.calculateFileStats);
                            // Create a basic fileStats object as fallback
                            this.fileStats = {
                                wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
                                characterCount: text.length,
                                lineCount: text.split(/\r\n|\r|\n/).length,
                                sentenceCount: 0,
                                avgWordsPerSentence: 0,
                                estimatedReadTime: 0
                            };
                        }
                        
                        // Display format info
                        if (typeof this.displayFormatInfo === 'function') {
                            this.displayFormatInfo();
                        } else {
                            console.error('displayFormatInfo is not a function!', typeof this.displayFormatInfo);
                        }
                        
                        console.log('Format info displayed, calling analyzeBookText');
                        
                        // Analyze the book text for character names
                        if (typeof this.analyzeBookText === 'function') {
                            this.analyzeBookText(text);
                        } else {
                            console.error('analyzeBookText is not a function!', typeof this.analyzeBookText);
                            alert('Error: Character analysis function not loaded. Please refresh the page and try again.');
                            this.hideLoadingIndicator();
                        }
                    } catch (error) {
                        // Clear the safety timeout since we're handling the error
                        clearTimeout(this.safetyTimeoutId);
                        
                        console.error('Error processing text:', error);
                        alert('Error processing text: ' + error.message);
                        this.hideLoadingIndicator();
                    }
                })
                .catch(error => {
                    // Clear the safety timeout since we're handling the error
                    clearTimeout(this.safetyTimeoutId);
                    
                    console.error('Error extracting text:', error);
                    alert('Error extracting text: ' + error.message);
                    this.hideLoadingIndicator();
                });
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file: ' + error.message);
            this.hideLoadingIndicator();
        }
    },
    
    // Extract text from different file types
    extractTextFromFile: function(file) {
        return new Promise((resolve, reject) => {
            const fileName = file.name.toLowerCase();
            const reader = new FileReader();
            
            // Handle TXT files
            if (fileName.endsWith('.txt')) {
                reader.onload = function(e) {
                    resolve(e.target.result);
                };
                reader.onerror = function(e) {
                    reject(new Error('Error reading text file'));
                };
                reader.readAsText(file);
            }
            // Handle HTML files
            else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
                reader.onload = function(e) {
                    const html = e.target.result;
                    // Strip HTML tags and extract text content
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    const text = div.textContent || div.innerText || '';
                    resolve(text);
                };
                reader.onerror = function(e) {
                    reject(new Error('Error reading HTML file'));
                };
                reader.readAsText(file);
            }
            // Handle DOCX files
            else if (fileName.endsWith('.docx')) {
                reader.onload = function(e) {
                    // Using Mammoth.js library
                    mammoth.extractRawText({ arrayBuffer: e.target.result })
                        .then(result => {
                            resolve(result.value);
                        })
                        .catch(error => {
                            reject(new Error('Error extracting text from DOCX: ' + error.message));
                        });
                };
                reader.onerror = function() {
                    reject(new Error('Error reading DOCX file'));
                };
                reader.readAsArrayBuffer(file);
            }
            // Handle RTF files - basic extraction
            else if (fileName.endsWith('.rtf')) {
                reader.onload = function(e) {
                    // Simple RTF to text conversion - strips RTF commands
                    const rtf = e.target.result;
                    // Remove RTF commands and extract plain text
                    let text = rtf.replace(/[\\](?:rtf[^;]*;)|[\\][a-z0-9]+\s?|[\{\}]|\\\n/gmi, " ");
                    text = text.replace(/\s+/g, " ").trim();
                    resolve(text);
                };
                reader.onerror = function() {
                    reject(new Error('Error reading RTF file'));
                };
                reader.readAsText(file);
            }
            // Handle unsupported file types
            else {
                reject(new Error('Unsupported file type'));
            }
        });
    },
    
    // Cancel the current analysis
    cancelAnalysis: function() {
        if (this.analysisInProgress) {
            // Reset state
            this.analysisInProgress = false;
            
            // Hide loading indicator
            this.hideLoadingIndicator();
        }
    },
    
    // Method to handle book text analysis - will be defined in name-extractor-integration.js
    analyzeBookText: function(text) {
        // This method will be defined in the name-extractor-integration.js file
        // It will extract character names and display them
    },
    
    // Method to process extracted characters - will be defined in name-extractor-integration.js
    processExtractedCharacters: function(extractedCharacters) {
        // This method will be defined in the name-extractor-integration.js file
        // It will process and display the extracted characters
    },
    
    // Method to add selected characters to database - will be defined in name-extractor-integration.js
    addSelectedCharacters: function() {
        // This method will be defined in the name-extractor-integration.js file
        // It will add selected characters to the database
    },
    
    // Method to select all characters - will be defined in name-extractor-integration.js
    selectAllCharacters: function() {
        // This method will be defined in the name-extractor-integration.js file
        // It will select all characters in the list
    },
    
    // Method to deselect all characters - will be defined in name-extractor-integration.js
    deselectAllCharacters: function() {
        // This method will be defined in the name-extractor-integration.js file
        // It will deselect all characters in the list
    },
    
    // Method to clear the analysis - will be defined in name-extractor-integration.js
    clearAnalysis: function() {
        // This method will be defined in the name-extractor-integration.js file
        // It will clear the analysis results
    },
    
    // Method to generate an analysis report - will be defined in name-extractor-integration.js
    generateAnalysisReport: function() {
        // This method will be defined in the name-extractor-integration.js file
        // It will generate a report of the analysis
    },
    
    // Method to add the current series and book selections to the table
    addToTable: function() {
        const seriesDropdown = document.getElementById('analysisSeries');
        const bookDropdown = document.getElementById('analysisBook');
        
        if (!seriesDropdown || !bookDropdown) {
            console.error('Could not find series or book dropdown');
            return;
        }
        
        const seriesValue = seriesDropdown.value;
        const bookValue = bookDropdown.value;
        
        // Only apply values if they are not empty and not "new"
        if (seriesValue && seriesValue !== 'new') {
            document.querySelectorAll('.series-input').forEach(input => {
                input.value = seriesValue;
            });
        }
        
        if (bookValue && bookValue !== 'new') {
            document.querySelectorAll('.book-input').forEach(input => {
                input.value = bookValue;
            });
        }
        
        // Show success message
        if (typeof Core !== 'undefined' && Core.showToast) {
            Core.showToast('Series and book applied to table');
        } else {
            console.log('Series and book applied to table');
            alert('Series and book applied to table');
        }
    },
    
    // Method to clear the series and book columns in the table
    clearTable: function() {
        // Clear all series inputs
        document.querySelectorAll('.series-input').forEach(input => {
            input.value = '';
        });
        
        // Clear all book inputs
        document.querySelectorAll('.book-input').forEach(input => {
            input.value = '';
        });
        
        // Show success message
        if (typeof Core !== 'undefined' && Core.showToast) {
            Core.showToast('Series and book cleared from table');
        } else {
            console.log('Series and book cleared from table');
            alert('Series and book cleared from table');
        }
    },
    
    // Method to refresh the series and book dropdowns
    refreshDropdowns: function() {
        // Clear existing options except the first two (default and "Add New")
        const seriesDropdown = document.getElementById('analysisSeries');
        const bookDropdown = document.getElementById('analysisBook');
        
        if (seriesDropdown) {
            // Save the selected value
            const selectedSeries = seriesDropdown.value;
            
            // Remove all options except the first two
            while (seriesDropdown.options.length > 2) {
                seriesDropdown.remove(2);
            }
            
            // Re-populate the dropdown
            let series = [];
            
            // Try to get series from different sources
            if (typeof Characters !== 'undefined' && Characters.getAllSeries) {
                series = Characters.getAllSeries();
            } else if (window.seriesList) {
                series = window.seriesList;
            } else {
                try {
                    const storedSeries = localStorage.getItem('series');
                    if (storedSeries) {
                        series = JSON.parse(storedSeries);
                    }
                } catch (e) {
                    console.error("Error loading series from localStorage:", e);
                }
            }
            
            // Add options
            if (series && series.length > 0) {
                let newOption = seriesDropdown.querySelector('option[value="new"]');
                series.forEach(seriesName => {
                    const option = document.createElement('option');
                    option.value = seriesName;
                    option.textContent = seriesName;
                    seriesDropdown.insertBefore(option, newOption.nextSibling);
                    newOption = option;
                });
                
                // Restore selected value if it exists in the new options
                if (selectedSeries && Array.from(seriesDropdown.options).some(opt => opt.value === selectedSeries)) {
                    seriesDropdown.value = selectedSeries;
                }
            }
        }
        
        if (bookDropdown) {
            // Save the selected value
            const selectedBook = bookDropdown.value;
            
            // Remove all options except the first two
            while (bookDropdown.options.length > 2) {
                bookDropdown.remove(2);
            }
            
            // Re-populate the dropdown
            let books = [];
            
            // Try to get books from different sources
            if (typeof Characters !== 'undefined' && Characters.getAllBooks) {
                books = Characters.getAllBooks();
            } else if (window.books) {
                books = window.books;
            } else {
                try {
                    const storedBooks = localStorage.getItem('books');
                    if (storedBooks) {
                        books = JSON.parse(storedBooks);
                    }
                } catch (e) {
                    console.error("Error loading books from localStorage:", e);
                }
            }
            
            // Add options
            if (books && books.length > 0) {
                let newOption = bookDropdown.querySelector('option[value="new"]');
                books.forEach(bookName => {
                    const option = document.createElement('option');
                    option.value = bookName;
                    option.textContent = bookName;
                    bookDropdown.insertBefore(option, newOption.nextSibling);
                    newOption = option;
                });
                
                // Restore selected value if it exists in the new options
                if (selectedBook && Array.from(bookDropdown.options).some(opt => opt.value === selectedBook)) {
                    bookDropdown.value = selectedBook;
                }
            }
        }
    },
    
    // Method to show the readme file
    showReadme: function() {
        try {
            console.log('Showing analysis options readme information');
            
            // Create modal container
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.cssText = `
                background-color: var(--background-color, #fff);
                color: var(--text-color, #333);
                padding: 20px;
                border-radius: 8px;
                width: 80%;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                position: relative;
            `;
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.cssText = `
                background-color: #f44336;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 15px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                position: absolute;
                top: 20px;
                right: 20px;
                z-index: 10000;
            `;
            closeButton.onclick = function() {
                document.body.removeChild(modal);
            };
            modalContent.appendChild(closeButton);
            
            // Create content container directly with embedded content
            const contentContainer = document.createElement('div');
            
            // Add a style element for proper styling
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                h1, h2, h3 { color: #3a6ea5; }
                .feature {
                    background-color: #f8f9fa;
                    border-left: 4px solid #3a6ea5;
                    padding: 15px;
                    margin-bottom: 20px;
                    border-radius: 0 4px 4px 0;
                }
                .option-group {
                    background-color: #f8f9fa;
                    border-left: 4px solid #3a6ea5;
                    padding: 15px;
                    margin-bottom: 20px;
                    border-radius: 0 4px 4px 0;
                }
                .warning {
                    background-color: #f8d7da;
                    border-left: 4px solid #dc3545;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 0 4px 4px 0;
                }
                .dark-mode h1, .dark-mode h2, .dark-mode h3 { color: #4a8ec6; }
                .dark-mode .feature, .dark-mode .option-group {
                    background-color: #333;
                    border-left-color: #4a8ec6;
                }
                .dark-mode .warning {
                    background-color: #3d1c1f;
                    border-left-color: #a52834;
                    color: #f8a5ad;
                }
            `;
            contentContainer.appendChild(styleElement);
            
            // Add the HTML content
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = `
                <div style="padding: 20px;">
                    <h1 style="text-align: center; margin-bottom: 30px;">Book Analysis Options</h1>
                    <p>The Book Analysis tool helps you extract character names and other information from your manuscript. This guide explains the available options and how to use them effectively.</p>
                    
                    <h2>Detection Methods</h2>
                    <p>The tool uses several methods to identify character names in your text:</p>
                    
                    <div class="option-group">
                        <h3>Dialogue Attribution</h3>
                        <p>Identifies names used in dialogue tags, such as "said John" or "Mary replied."</p>
                        <p><strong>Example:</strong> "I don't think so," <u>John</u> said firmly.</p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Named Entity Recognition</h3>
                        <p>Uses natural language processing to identify proper nouns that likely refer to people.</p>
                        <p><strong>Example:</strong> <u>Elizabeth Bennett</u> walked through the garden.</p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Capitalized Word Analysis</h3>
                        <p>Identifies capitalized words that appear in the middle of sentences, which often indicate names.</p>
                        <p><strong>Example:</strong> The room fell silent when <u>Alexander</u> entered.</p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Frequency Analysis</h3>
                        <p>Identifies words that appear frequently in the text and match patterns typical of names.</p>
                        <p><strong>Example:</strong> Words like "<u>Harry</u>" that appear multiple times throughout the text.</p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Title & Honorific Detection</h3>
                        <p>Identifies names that appear with titles or honorifics.</p>
                        <p><strong>Example:</strong> <u>Dr. Watson</u>, <u>Mr. Darcy</u>, <u>Captain Ahab</u></p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Direct Address Pattern</h3>
                        <p>Identifies names used in direct address, often with commas.</p>
                        <p><strong>Example:</strong> "Listen, <u>Robert</u>, you need to be careful."</p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Possessive Form Detection</h3>
                        <p>Identifies names used in possessive form.</p>
                        <p><strong>Example:</strong> <u>Sarah's</u> book was on the table.</p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Character Introduction</h3>
                        <p>Identifies patterns that often introduce new characters.</p>
                        <p><strong>Example:</strong> A woman named <u>Jessica</u> approached the counter.</p>
                    </div>
                    
                    <h2>Additional Options</h2>
                    
                    <div class="option-group">
                        <h3>Minimum Character Mentions</h3>
                        <p>Sets the minimum number of times a name must appear to be included in results.</p>
                        <p>Higher values filter out minor characters or false positives.</p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Combine Name Variants</h3>
                        <p>Attempts to group different forms of the same name together.</p>
                        <p><strong>Example:</strong> "Elizabeth", "Lizzy", and "Miss Bennett" might be grouped as variants of the same character.</p>
                    </div>
                    
                    <div class="option-group">
                        <h3>Filter Common Words</h3>
                        <p>Removes common words that might be mistaken for names.</p>
                        <p><strong>Example:</strong> Words like "Hope", "Faith", or "Summer" that could be either names or common nouns.</p>
                    </div>
                    
                    <div class="warning">
                        <h3><i class="fas fa-exclamation-triangle"></i> Important Notes</h3>
                        <ul>
                            <li>The analysis works best with fiction manuscripts in standard formatting.</li>
                            <li>For best results, enable multiple detection methods.</li>
                            <li>No detection method is perfect - always review the results.</li>
                            <li>Larger files may take longer to process.</li>
                        </ul>
                    </div>
                </div>
            `;
            contentContainer.appendChild(contentDiv);
            
            // Add content to modal
            modalContent.appendChild(contentContainer);
            
            // Add modal to DOM
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Apply dark mode if needed
            if (document.body.classList.contains('dark-mode') ||
                document.documentElement.getAttribute('data-theme') === 'dark') {
                contentContainer.querySelectorAll('*').forEach(element => {
                    if (element.classList) {
                        element.classList.add('dark-mode');
                    }
                });
            }
        } catch (error) {
            console.error('Error showing analysis options readme:', error);
            // Fallback to the original method if there's an error
            window.open('readme/ANALYSIS_OPTIONS.html', '_blank');
        }
    },
    
    // Method to reset all UI states when switching tabs
    resetUIStates: function() {
        console.log('Resetting UI states');
        
        // Reset analysis results container
        const analysisResultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
        if (analysisResultsContainer) {
            analysisResultsContainer.classList.remove('active');
            console.log('Removed active class from analysis-results-container');
        }
        
        // Hide the series-book-section
        const seriesBookSection = document.getElementById('seriesBookSection');
        if (seriesBookSection) {
            seriesBookSection.style.display = 'none';
            console.log('Reset seriesBookSection display to none');
        }
        
        // Hide the loading indicator
        const loadingElement = document.getElementById('analysisLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
            console.log('Reset analysisLoading display to none');
        }
        
        // Reset analysis progress
        const progressBar = document.getElementById('analysisProgressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
        // Hide table action buttons
        const tableActionButtons = document.getElementById('tableActionButtons');
        if (tableActionButtons) {
            tableActionButtons.style.display = 'none';
            console.log('Reset tableActionButtons display to none');
        }
        
        // Hide analysis results
        const analysisResults = document.getElementById('analysisResults');
        if (analysisResults) {
            analysisResults.style.display = 'none';
            console.log('Reset analysisResults display to none');
        }
        
        // Clear the format info display
        const formatInfo = document.getElementById('formatInfo');
        if (formatInfo) {
            formatInfo.innerHTML = '';
            formatInfo.style.display = 'none';
        }
        
        // Reset analysis in progress flag
        this.analysisInProgress = false;
    },
    
    // Basic display method for fallback scenario
    displayBasicResults: function() {
        if (!this.extractedCharacters || this.extractedCharacters.length === 0) {
            console.error('No characters to display');
            return;
        }
        
        console.log('Displaying basic results for', this.extractedCharacters.length, 'characters');
        
        // Show the results container
        const resultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
        if (resultsContainer) {
            resultsContainer.classList.add('active');
        }
        
        // Make sure we have a container for the detected characters
        const detectedCharactersContainer = document.getElementById('detectedCharacters');
        if (!detectedCharactersContainer) {
            console.error('No container for detected characters');
            return;
        }
        
        // Clear the container
        detectedCharactersContainer.innerHTML = '';
        
        // Create a table
        const table = document.createElement('table');
        table.className = 'character-table';
        
        // Create header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Name</th>
                <th>Mentions</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        // Add characters to table
        this.extractedCharacters.forEach(character => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${character.fullName}</td>
                <td>${character.mentions}</td>
            `;
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        detectedCharactersContainer.appendChild(table);
        
        // Show the results
        const analysisResults = document.getElementById('analysisResults');
        if (analysisResults) {
            analysisResults.style.display = 'block';
        }
        
        // Add fallback warning message
        const warningDiv = document.createElement('div');
        warningDiv.style.padding = '10px';
        warningDiv.style.margin = '10px 0';
        warningDiv.style.backgroundColor = '#fff3cd';
        warningDiv.style.border = '1px solid #ffeeba';
        warningDiv.style.borderRadius = '4px';
        warningDiv.style.color = '#856404';
        warningDiv.innerHTML = `
            <strong>Note:</strong> Using fallback name extraction. For better results, 
            refresh the page and try again. The enhanced detection methods may require a full page load.
        `;
        
        detectedCharactersContainer.insertBefore(warningDiv, table);
    },
    
    // Process the text content
    processTextContent: function(text) {
        try {
            // Update progress to indicate success
            const progressBar = document.getElementById('analysisProgressBar');
            const progressText = document.getElementById('analysisProgressText');
            
            if (progressBar) progressBar.style.width = '100%';
            if (progressText) progressText.textContent = 'Text extracted successfully...';
            
            // Calculate file stats
            if (typeof this.calculateFileStats === 'function') {
                this.calculateFileStats(text);
            } else {
                console.error('calculateFileStats is not a function!', typeof this.calculateFileStats);
                // Create a basic fileStats object as fallback
                this.fileStats = {
                    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
                    characterCount: text.length,
                    lineCount: text.split(/\r\n|\r|\n/).length,
                    sentenceCount: 0,
                    avgWordsPerSentence: 0,
                    estimatedReadTime: 0
                };
            }
            
            // Display format info
            if (typeof this.displayFormatInfo === 'function') {
                this.displayFormatInfo();
            } else {
                console.error('displayFormatInfo is not a function!', typeof this.displayFormatInfo);
            }
            
            console.log('Format info displayed, calling analyzeBookText');
            
            // Analyze the book text for character names
            if (typeof this.analyzeBookText === 'function') {
                this.analyzeBookText(text);
            } else {
                console.error('analyzeBookText is not a function!', typeof this.analyzeBookText);
                alert('Error: Character analysis function not loaded. Please refresh the page and try again.');
                this.hideLoadingIndicator();
            }
            
            // Hide loading indicator after analysis regardless of outcome
            setTimeout(() => {
                this.hideLoadingIndicator();
            }, 1000); // Small delay to ensure any callbacks finish
            
        } catch (error) {
            console.error('Error processing text content:', error);
            
            // Display error message
            const progressText = document.getElementById('analysisProgressText');
            if (progressText) progressText.textContent = 'Error processing text: ' + error.message;
            
            // Hide loading indicator
            this.hideLoadingIndicator();
        }
    },
    
    // Show loading indicator
    showLoadingIndicator: function() {
        console.log('Showing loading indicator');
        // Clear any existing force hide buttons first
        this.clearForceHideButtons();
        
        // Show the loading indicator
        const loadingIndicator = document.getElementById('analysisLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
            
            // Reset progress bar
            const progressBar = document.getElementById('analysisProgressBar');
            if (progressBar) progressBar.style.width = '0%';
            
            // Reset progress text
            const progressText = document.getElementById('analysisProgressText');
            if (progressText) progressText.textContent = 'Starting analysis...';
        }
        
        // Set the analysis in progress flag
        this.analysisInProgress = true;
    },
    
    // Hide loading indicator
    hideLoadingIndicator: function() {
        console.log('Hiding loading indicator');
        const loadingIndicator = document.getElementById('analysisLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Reset the analysis in progress flag
        this.analysisInProgress = false;
        
        // Clear any safety timeouts
        if (this.safetyTimeoutId) {
            clearTimeout(this.safetyTimeoutId);
            this.safetyTimeoutId = null;
        }
    },
    
    // Helper method to clear all force hide buttons
    clearForceHideButtons: function() {
        // Remove any existing force hide buttons
        const existingButtons = document.querySelectorAll('.force-hide-button');
        existingButtons.forEach(button => button.remove());
        
        // Also check for the button by ID
        const buttonById = document.getElementById('forceHideLoadingButton');
        if (buttonById) buttonById.remove();
    },
    
    // Helper method to create a force hide button
    createForceHideButton: function() {
        // First, clear any existing buttons
        this.clearForceHideButtons();
        
        // Create the button with a unique ID
        const forceHideBtn = document.createElement('button');
        forceHideBtn.id = 'forceHideLoadingButton'; // Unique ID
        forceHideBtn.className = 'force-hide-button';
        forceHideBtn.textContent = 'Force Hide Loading';
        forceHideBtn.style.cssText = `
            background-color: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px auto;
            display: block;
            width: 100%;
            max-width: 300px;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        forceHideBtn.addEventListener('click', () => {
            this.hideLoadingIndicator();
            this.clearForceHideButtons(); // Remove all buttons
            console.log('Loading indicator hidden via force hide button');
        });
        
        // Add to a fixed location
        const formatInfoContainer = document.getElementById('formatInfo');
        if (formatInfoContainer) {
            formatInfoContainer.parentNode.insertBefore(forceHideBtn, formatInfoContainer);
        }
        
        return forceHideBtn;
    },
    
    // Method removed - now using HTML approach for the warning text
};

// Add an alias for the init method to match what UI.switchTab expects
window.BookAnalysis.initialize = window.BookAnalysis.init;