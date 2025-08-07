/**
 * Book Analysis Integration Module
 *
 * This module integrates the NameExtractor functionality with the BookAnalysis module
 * to extract character names from book files and display them in the UI.
 */

// Hook up the book analysis functions
(function() {
    console.log('Book Analysis Integration - Loading...');
    
    if (!window.BookAnalysis) {
        console.error('BookAnalysis module not found!');
        return;
    }
    
    // Check if NameExtractor is available
    console.log('Checking for NameExtractor availability:', window.NameExtractor ? 'Available' : 'Not available');
    
    // If not available, try loading it
    if (!window.NameExtractor) {
        console.warn('NameExtractor not found on window object - trying to load it');
        try {
            // Use dynamic import if available in browser
            fetch('js/modules/name-extractor.js')
                .then(response => response.text())
                .then(text => {
                    const script = document.createElement('script');
                    script.textContent = text;
                    document.head.appendChild(script);
                    console.log('Dynamically added name-extractor.js to page');
                })
                .catch(err => console.error('Failed to load name-extractor.js:', err));
        } catch (e) {
            console.error('Error attempting to load NameExtractor:', e);
        }
    }

    // Add the analyzeBookText method to BookAnalysis
    BookAnalysis.analyzeBookText = function(text) {
        console.log('Analyzing book text...');
        
        // Show the loading indicator
        this.showLoadingIndicator();
        
        // Reset the results container to prevent it from moving down with each analysis
        const resultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
        if (resultsContainer) {
            // Reset position and styles
            resultsContainer.style.position = 'relative';
            resultsContainer.style.top = '0';
            resultsContainer.style.left = '0';
            resultsContainer.style.marginTop = '20px';
            resultsContainer.style.transform = 'none';
            
            // Remove any inline height that might have been added
            resultsContainer.style.height = '';
            resultsContainer.style.minHeight = '';
            resultsContainer.style.maxHeight = '';
        }
        
        // Check if the NameExtractor module is available
        if (!window.NameExtractor) {
            console.error('NameExtractor module not loaded! Attempting to use fallback.');
            // Use fallback name extractor if available
            this.extractedCharacters = fallbackNameExtraction(text);
        } else {
            // Use the enhanced NameExtractor module
            console.log('Using enhanced NameExtractor module');
            
            // Get element references first - with proper error handling
            const dialogueAttribution = document.getElementById('dialogueAttribution');
            const namedEntityRecognition = document.getElementById('namedEntityRecognition');
            const capitalizedWordAnalysis = document.getElementById('capitalizedWordAnalysis');
            const frequencyAnalysis = document.getElementById('frequencyAnalysis2');
            const titleHonorificDetection = document.getElementById('titleHonorificDetection') || document.getElementById('titleDetection');
            const directAddressPattern = document.getElementById('directAddressPattern');
            const possessiveFormDetection = document.getElementById('possessiveFormDetection');
            const characterIntroduction = document.getElementById('characterIntroduction');
            const combineVariants = document.getElementById('combineVariants') || document.getElementById('combineNameVariants');
            const filterCommonWords = document.getElementById('filterCommonWords');
            
            // Log what was found for debugging
            console.log('Found UI elements:', {
                dialogueAttribution: dialogueAttribution ? 'found' : 'not found',
                namedEntityRecognition: namedEntityRecognition ? 'found' : 'not found',
                capitalizedWordAnalysis: capitalizedWordAnalysis ? 'found' : 'not found',
                frequencyAnalysis: frequencyAnalysis ? 'found' : 'not found',
                titleHonorificDetection: titleHonorificDetection ? 'found' : 'not found',
                directAddressPattern: directAddressPattern ? 'found' : 'not found',
                possessiveFormDetection: possessiveFormDetection ? 'found' : 'not found',
                characterIntroduction: characterIntroduction ? 'found' : 'not found',
                combineVariants: combineVariants ? 'found' : 'not found',
                filterCommonWords: filterCommonWords ? 'found' : 'not found'
            });
            
            // Get options from UI elements safely - default to true if element not found
            const options = {
                dialogueAttribution: dialogueAttribution ? dialogueAttribution.checked : true,
                namedEntityRecognition: namedEntityRecognition ? namedEntityRecognition.checked : true,
                capitalizedWordAnalysis: capitalizedWordAnalysis ? capitalizedWordAnalysis.checked : true,
                frequencyAnalysis: frequencyAnalysis ? frequencyAnalysis.checked : true,
                titleDetection: titleHonorificDetection ? titleHonorificDetection.checked : true,
                directAddressPattern: directAddressPattern ? directAddressPattern.checked : true,
                possessiveFormDetection: possessiveFormDetection ? possessiveFormDetection.checked : true,
                characterIntroduction: characterIntroduction ? characterIntroduction.checked : true,
                combineNameVariants: combineVariants ? combineVariants.checked : true,
                filterCommonWords: filterCommonWords ? filterCommonWords.checked : true
            };
            
            console.log('Collected options for analysis:', options);
            
            // Extract characters using the NameExtractor
            this.extractedCharacters = NameExtractor.extractCharactersFromText(text, options);
        }
        
        console.log('Extracted characters:', this.extractedCharacters);
        
        // Filter characters by minimum mentions
        const minMentions = document.getElementById('minMentions') ? 
                          parseInt(document.getElementById('minMentions').value) : 3;
        
        this.extractedCharacters = this.extractedCharacters.filter(char => char.mentions >= minMentions);
        
        // Display the results
        this.displayResults();
        
        // Ensure the loading indicator is hidden using our new function
        this.hideLoadingIndicator();
        
        return this.extractedCharacters;
    };
    
    // Display the analysis results in the UI
    BookAnalysis.displayResults = function() {
        console.log('Displaying analysis results...');
        
        // No longer showing all hidden elements by default
        
        // Reset and show the results container
        const resultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
        if (resultsContainer) {
            // Remove all inline styles
            resultsContainer.removeAttribute('style');
            
            // Set basic styles to ensure proper positioning
            resultsContainer.style.display = 'block';
            resultsContainer.style.position = 'relative';
            resultsContainer.style.top = '0';
            resultsContainer.style.left = '0';
            resultsContainer.style.marginTop = '20px';
            resultsContainer.style.width = '100%';
            resultsContainer.style.zIndex = '1000'; // Ensure it's on top
            
            // Add a border for debugging
            resultsContainer.style.border = '3px solid red';
            
            // Clear any previous content
            const detectedCharacters = document.getElementById('detectedCharacters');
            if (detectedCharacters) {
                detectedCharacters.innerHTML = '';
            }
            
            // Show the container
            resultsContainer.classList.add('active');
        }
        
        // Make sure all elements are visible
        const elementsToShow = [
            'analysisResults',
            'seriesBookSection',
            'tableActionButtons',
            'formatInfo',
            'detectedCharacters'
        ];
        
        elementsToShow.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'block';
                element.style.visibility = 'visible';
                element.style.opacity = '1';
                
                // Add a border for debugging
                element.style.border = '1px solid blue';
            }
        });
        
        // Special case for flex elements
        const seriesBookSection = document.getElementById('seriesBookSection');
        if (seriesBookSection) {
            seriesBookSection.style.display = 'flex';
        }
        
        const tableActionButtons = document.getElementById('tableActionButtons');
        if (tableActionButtons) {
            tableActionButtons.style.display = 'flex';
        }
        
        // Enable the generate report button
        const generateReportBtn = document.getElementById('generateReportBtn');
        if (generateReportBtn) {
            generateReportBtn.disabled = false;
        }
        
        // Create the characters table
        this.createCharactersTable();
    };
    
    // Completely rewrite the createCharactersTable function to fix the missing Series and Book columns
    BookAnalysis.createCharactersTable = function() {
        console.log('Creating characters table with Series and Book columns');
        
        // Reset the entire results container to prevent accumulation of styles
        const resultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
        if (resultsContainer) {
            // Reset position and styles
            resultsContainer.style.position = 'relative';
            resultsContainer.style.top = '0';
            resultsContainer.style.left = '0';
            resultsContainer.style.marginTop = '20px';
            resultsContainer.style.transform = 'none';
        }
        
        const detectedCharacters = document.getElementById('detectedCharacters');
        if (!detectedCharacters) {
            console.error('detectedCharacters container not found');
            return;
        }

        // Clear previous results
        detectedCharacters.innerHTML = '';

        // Add summary of extraction methods
        const summaryDiv = document.createElement('div');
        summaryDiv.style.padding = '15px';
        summaryDiv.style.marginBottom = '20px';
        summaryDiv.style.backgroundColor = '#f8f9fa';
        summaryDiv.style.border = '1px solid #dee2e6';
        summaryDiv.style.borderRadius = '4px';

        summaryDiv.innerHTML = `
            <h3 style="margin-top: 0;">Extraction Summary</h3>
            <p>Found ${this.extractedCharacters.length} characters with at least ${document.getElementById('minMentions')?.value || 3} mentions.</p>
            <p><strong>Methods used:</strong> ${this.getActiveMethodsString()}</p>
            <p>Check browser console (F12) for detailed extraction logs.</p>
        `;

        detectedCharacters.appendChild(summaryDiv);

        // Create table
        const table = document.createElement('table');
        table.className = 'character-table';
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#f2f2f2';
        
        // Create header cells
        const headers = [
            { type: 'checkbox', html: '<input type="checkbox" id="selectAllCharacters" onclick="BookAnalysis.toggleSelectAllCharacters(this.checked)">', width: '40px' },
            { type: 'text', text: 'Name', width: '120px' },
            { type: 'text', text: 'Title', width: '100px' },
            { type: 'text', text: 'First Name', width: '120px' },
            { type: 'text', text: 'Last Name', width: '120px' },
            { type: 'text', text: 'Series', width: '120px', highlight: true },
            { type: 'text', text: 'Book', width: '120px', highlight: true },
            { type: 'text', text: 'Mentions', width: '80px' },
            { type: 'text', text: 'Variants', width: '200px' }
        ];
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            th.style.border = '1px solid #ddd';
            if (header.width) th.style.width = header.width;
            if (header.highlight) th.style.backgroundColor = '#e3f2fd'; // Light blue background for highlighted columns
            
            if (header.html) {
                th.innerHTML = header.html;
            } else {
                th.textContent = header.text;
            }
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Get selected Series and Book values
        const seriesSelect = document.getElementById('analysisSeries');
        const bookSelect = document.getElementById('analysisBook');
        const selectedSeries = seriesSelect && seriesSelect.value && seriesSelect.value !== 'new' ? seriesSelect.value : '';
        const selectedBook = bookSelect && bookSelect.value && bookSelect.value !== 'new' ? bookSelect.value : '';
        
        console.log('Selected values for pre-filling:', { series: selectedSeries, book: selectedBook });
        
        // Add characters to table
        this.extractedCharacters.forEach((character, index) => {
            const row = document.createElement('tr');
            
            // Checkbox cell
            const checkboxCell = document.createElement('td');
            checkboxCell.style.padding = '8px';
            checkboxCell.style.textAlign = 'left';
            checkboxCell.style.border = '1px solid #ddd';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'character-select';
            checkbox.dataset.index = index;
            
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
            
            // Name cell
            const nameCell = document.createElement('td');
            nameCell.style.padding = '8px';
            nameCell.style.textAlign = 'left';
            nameCell.style.border = '1px solid #ddd';
            nameCell.textContent = character.fullName || '';
            row.appendChild(nameCell);
            
            // Title input cell
            const titleCell = document.createElement('td');
            titleCell.style.padding = '8px';
            titleCell.style.textAlign = 'left';
            titleCell.style.border = '1px solid #ddd';
            
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.value = character.title || '';
            titleInput.dataset.field = 'title';
            titleInput.dataset.index = index;
            titleInput.style.width = '90%';
            titleInput.addEventListener('change', this.updateCharacterField.bind(this));
            
            titleCell.appendChild(titleInput);
            row.appendChild(titleCell);
            
            // First Name input cell
            const firstNameCell = document.createElement('td');
            firstNameCell.style.padding = '8px';
            firstNameCell.style.textAlign = 'left';
            firstNameCell.style.border = '1px solid #ddd';
            
            const firstNameInput = document.createElement('input');
            firstNameInput.type = 'text';
            firstNameInput.value = character.firstName || '';
            firstNameInput.dataset.field = 'firstName';
            firstNameInput.dataset.index = index;
            firstNameInput.style.width = '90%';
            firstNameInput.addEventListener('change', this.updateCharacterField.bind(this));
            
            firstNameCell.appendChild(firstNameInput);
            row.appendChild(firstNameCell);
            
            // Last Name input cell
            const lastNameCell = document.createElement('td');
            lastNameCell.style.padding = '8px';
            lastNameCell.style.textAlign = 'left';
            lastNameCell.style.border = '1px solid #ddd';
            
            const lastNameInput = document.createElement('input');
            lastNameInput.type = 'text';
            lastNameInput.value = character.lastName || '';
            lastNameInput.dataset.field = 'lastName';
            lastNameInput.dataset.index = index;
            lastNameInput.style.width = '90%';
            lastNameInput.addEventListener('change', this.updateCharacterField.bind(this));
            
            lastNameCell.appendChild(lastNameInput);
            row.appendChild(lastNameCell);
            
            // Series input cell - HIGHLIGHTED
            const seriesCell = document.createElement('td');
            seriesCell.style.padding = '8px';
            seriesCell.style.textAlign = 'left';
            seriesCell.style.border = '1px solid #ddd';
            seriesCell.style.backgroundColor = '#f8f9fa'; // Light gray background
            
            const seriesInput = document.createElement('input');
            seriesInput.type = 'text';
            seriesInput.className = 'series-input';
            seriesInput.value = character.series || selectedSeries || '';
            seriesInput.dataset.field = 'series';
            seriesInput.dataset.index = index;
            seriesInput.style.width = '90%';
            seriesInput.style.border = '1px solid #3498db'; // Blue border for visibility
            seriesInput.addEventListener('change', this.updateCharacterField.bind(this));
            
            seriesCell.appendChild(seriesInput);
            row.appendChild(seriesCell);
            
            // Book input cell - HIGHLIGHTED
            const bookCell = document.createElement('td');
            bookCell.style.padding = '8px';
            bookCell.style.textAlign = 'left';
            bookCell.style.border = '1px solid #ddd';
            bookCell.style.backgroundColor = '#f8f9fa'; // Light gray background
            
            const bookInput = document.createElement('input');
            bookInput.type = 'text';
            bookInput.className = 'book-input';
            bookInput.value = character.book || selectedBook || '';
            bookInput.dataset.field = 'book';
            bookInput.dataset.index = index;
            bookInput.style.width = '90%';
            bookInput.style.border = '1px solid #3498db'; // Blue border for visibility
            bookInput.addEventListener('change', this.updateCharacterField.bind(this));
            
            bookCell.appendChild(bookInput);
            row.appendChild(bookCell);
            
            // Mentions cell
            const mentionsCell = document.createElement('td');
            mentionsCell.style.padding = '8px';
            mentionsCell.style.textAlign = 'left';
            mentionsCell.style.border = '1px solid #ddd';
            mentionsCell.textContent = character.mentions || 0;
            row.appendChild(mentionsCell);
            
            // Variants cell
            const variantsCell = document.createElement('td');
            variantsCell.style.padding = '8px';
            variantsCell.style.textAlign = 'left';
            variantsCell.style.border = '1px solid #ddd';
            variantsCell.textContent = character.variants ? character.variants.join(', ') : '';
            row.appendChild(variantsCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        detectedCharacters.appendChild(table);
        
        console.log('Character table created successfully with Series and Book columns');
    };
    
    // Simple hideLoadingIndicator function
    BookAnalysis.hideLoadingIndicator = function() {
        console.log('Hiding loading indicator...');
        
        // Hide the loading indicator
        const loadingIndicator = document.getElementById('analysisLoading');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('active');
            loadingIndicator.style.display = 'none';
        }
    };
    
    // Simple showLoadingIndicator function
    BookAnalysis.showLoadingIndicator = function() {
        console.log('Showing loading indicator...');
        
        // Show the loading indicator
        const loadingIndicator = document.getElementById('analysisLoading');
        if (loadingIndicator) {
            loadingIndicator.classList.add('active');
            loadingIndicator.style.display = 'block';
        }
    };
    
    // Helper to get a string of active methods for display
    BookAnalysis.getActiveMethodsString = function() {
        const methods = [];
        
        if (document.getElementById('dialogueAttribution')?.checked) methods.push('Dialogue Attribution');
        if (document.getElementById('namedEntityRecognition')?.checked) methods.push('Named Entity Recognition');
        if (document.getElementById('capitalizedWordAnalysis')?.checked) methods.push('Capitalized Word Analysis');
        if (document.getElementById('frequencyAnalysis2')?.checked) methods.push('Frequency Analysis');
        if (document.getElementById('titleHonorificDetection')?.checked || document.getElementById('titleDetection')?.checked)
            methods.push('Title Detection');
        if (document.getElementById('directAddressPattern')?.checked) methods.push('Direct Address');
        if (document.getElementById('possessiveFormDetection')?.checked) methods.push('Possessive Form');
        if (document.getElementById('characterIntroduction')?.checked) methods.push('Character Introduction');
        if (document.getElementById('combineVariants')?.checked || document.getElementById('combineNameVariants')?.checked)
            methods.push('Name Variants Combined');
        if (document.getElementById('filterCommonWords')?.checked) methods.push('Common Words Filtered');
        
        return methods.join(', ') || 'None';
    };
    
    // Update character field
    BookAnalysis.updateCharacterField = function(event) {
        const field = event.target.dataset.field;
        const index = parseInt(event.target.dataset.index);
        const value = event.target.value;
        
        this.extractedCharacters[index][field] = value;
    };
    
    // Toggle all character checkboxes
    BookAnalysis.toggleSelectAllCharacters = function(checked) {
        const checkboxes = document.querySelectorAll('.character-select');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    };
    
    // Select all characters
    BookAnalysis.selectAllCharacters = function() {
        this.toggleSelectAllCharacters(true);
    };
    
    // Deselect all characters
    BookAnalysis.deselectAllCharacters = function() {
        this.toggleSelectAllCharacters(false);
    };
    
    // Add selected characters to database
    BookAnalysis.addSelectedCharacters = function() {
        const checkboxes = document.querySelectorAll('.character-select:checked');
        if (checkboxes.length === 0) {
            Core.showToast('No characters selected', 'warning');
            return;
        }
        
        // Get the selected series and book
        const seriesSelect = document.getElementById('analysisSeries');
        const bookSelect = document.getElementById('analysisBook');
        
        const series = seriesSelect ? seriesSelect.value : '';
        const book = bookSelect ? bookSelect.value : '';
        
        let addedCount = 0;
        
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.dataset.index);
            const character = this.extractedCharacters[index];
            
            // Create character object
            const characterData = {
                id: Date.now() + Math.floor(Math.random() * 1000) + index, // Generate a unique ID
                title: character.title || '',
                firstName: character.firstName || '',
                lastName: character.lastName || '',
                series: series,
                book: book,
                notes: `Character extracted from book analysis.\nMentioned ${character.mentions} times.\nVariants: ${character.variants ? character.variants.join(', ') : 'None'}`
            };
            
            // Add character to database
            if (window.Characters && typeof window.Characters.addCharacter === 'function') {
                const success = window.Characters.addCharacter(characterData);
                if (success) {
                    addedCount++;
                }
            } else {
                console.error('Characters.addCharacter function not available');
            }
        });
        
        if (addedCount > 0) {
            Core.showToast(`Added ${addedCount} characters to database`, 'success');
            
            // Refresh the characters display if the function exists
            if (window.Characters && typeof window.Characters.displayCharacters === 'function') {
                window.Characters.displayCharacters();
            }
        } else {
            Core.showToast('No characters were added to the database', 'error');
        }
    };
    
    // Update the addToTable function to properly update the character objects
    BookAnalysis.addToTable = function() {
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
                
                // Update the character data as well
                const index = input.dataset.index;
                if (index !== undefined) {
                    this.extractedCharacters[index].series = seriesValue;
                }
            });
        }

        if (bookValue && bookValue !== 'new') {
            document.querySelectorAll('.book-input').forEach(input => {
                input.value = bookValue;
                
                // Update the character data as well
                const index = input.dataset.index;
                if (index !== undefined) {
                    this.extractedCharacters[index].book = bookValue;
                }
            });
        }

        // Show success message
        if (typeof Core !== 'undefined' && Core.showToast) {
            Core.showToast('Series and book applied to table');
        } else {
            console.log('Series and book applied to table');
            alert('Series and book applied to table');
        }
    };
    
    // Clear table
    BookAnalysis.clearTable = function() {
        // Reset series and book for all characters
        this.extractedCharacters.forEach(character => {
            character.series = '';
            character.book = '';
        });
        
        // Reset the selects
        const seriesSelect = document.getElementById('analysisSeries');
        const bookSelect = document.getElementById('analysisBook');
        
        if (seriesSelect) seriesSelect.value = '';
        if (bookSelect) bookSelect.value = '';
        
        // Refresh the table
        this.createCharactersTable();
        
        Core.showToast('Cleared series and book for all characters', 'info');
    };
    
    // Fix the PDF generation error
    BookAnalysis.generateAnalysisReport = function() {
        if (!this.extractedCharacters || this.extractedCharacters.length === 0) {
            if (typeof Core !== 'undefined' && Core.showToast) {
                Core.showToast('No characters to generate report', 'warning');
            } else {
                alert('No characters to generate report');
            }
            return;
        }

        console.log('Generating analysis report...');

        try {
            // Make sure fileStats exists, create a default if it doesn't
            if (!this.fileStats) {
                console.warn('File stats not found, creating default values');
                this.fileStats = {
                    wordCount: 0,
                    characterCount: 0,
                    lineCount: 0,
                    avgWordsPerSentence: 0,
                    estimatedReadTime: 0
                };
            }

            // For debugging
            console.log('File stats for report:', JSON.stringify(this.fileStats));

            // Create report content
            const reportContent = document.createElement('div');
            reportContent.className = 'analysis-report';
            reportContent.style.padding = '20px';
            reportContent.style.fontFamily = 'Arial, sans-serif';
            reportContent.style.backgroundColor = 'white';
            reportContent.style.color = 'black';

            // Add report header
            const header = document.createElement('div');
            header.innerHTML = `
                <h1 style="color: #2c3e50; text-align: center;">Book Character Analysis Report</h1>
                <p style="text-align: center; color: #7f8c8d;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
            `;
            reportContent.appendChild(header);

            // Add extraction summary
            const summary = document.createElement('div');
            summary.innerHTML = `
                <h2 style="color: #3498db;">Extraction Summary</h2>
                <p>Found ${this.extractedCharacters.length} characters with at least ${document.getElementById('minMentions')?.value || 3} mentions.</p>
                <p><strong>Methods used:</strong> ${this.getActiveMethodsString()}</p>
            `;
            reportContent.appendChild(summary);

            // Add file info
            const fileInfo = document.createElement('div');
            fileInfo.innerHTML = '<h2 style="color: #3498db;">File Information</h2>';

            const fileTable = document.createElement('table');
            fileTable.style.width = '100%';
            fileTable.style.borderCollapse = 'collapse';
            fileTable.style.marginBottom = '20px';

            // Add table header
            const fileTableHeader = document.createElement('tr');
            fileTableHeader.style.backgroundColor = '#f2f2f2';
            
            const propHeader = document.createElement('th');
            propHeader.style.padding = '8px';
            propHeader.style.textAlign = 'left';
            propHeader.style.border = '1px solid #ddd';
            propHeader.textContent = 'Property';
            
            const valueHeader = document.createElement('th');
            valueHeader.style.padding = '8px';
            valueHeader.style.textAlign = 'left';
            valueHeader.style.border = '1px solid #ddd';
            valueHeader.textContent = 'Value';
            
            fileTableHeader.appendChild(propHeader);
            fileTableHeader.appendChild(valueHeader);
            fileTable.appendChild(fileTableHeader);

            // Add file stats rows safely
            const fileStatsRows = [
                { name: 'Word Count', value: this.fileStats.wordCount },
                { name: 'Character Count', value: this.fileStats.characterCount },
                { name: 'Line Count', value: this.fileStats.lineCount },
                { name: 'Avg. Words per Sentence', value: this.fileStats.avgWordsPerSentence },
                { name: 'Estimated Reading Time', value: this.fileStats.estimatedReadTime, unit: ' minutes' }
            ];

            fileStatsRows.forEach(stat => {
                const row = document.createElement('tr');
                
                const nameTd = document.createElement('td');
                nameTd.style.padding = '8px';
                nameTd.style.textAlign = 'left';
                nameTd.style.border = '1px solid #ddd';
                nameTd.textContent = stat.name;
                
                const valueTd = document.createElement('td');
                valueTd.style.padding = '8px';
                valueTd.style.textAlign = 'left';
                valueTd.style.border = '1px solid #ddd';
                
                // Safely format the value
                if (typeof stat.value === 'number') {
                    valueTd.textContent = stat.value.toLocaleString() + (stat.unit || '');
                } else if (stat.value) {
                    valueTd.textContent = stat.value + (stat.unit || '');
                } else {
                    valueTd.textContent = 'N/A';
                }
                
                row.appendChild(nameTd);
                row.appendChild(valueTd);
                fileTable.appendChild(row);
            });

            fileInfo.appendChild(fileTable);
            reportContent.appendChild(fileInfo);

            // Add characters section
            const charactersSection = document.createElement('div');
            charactersSection.innerHTML = `
                <h2 style="color: #3498db;">Detected Characters</h2>
                <p>Total characters detected: ${this.extractedCharacters.length}</p>
            `;

            // Create characters table
            const charTable = document.createElement('table');
            charTable.style.width = '100%';
            charTable.style.borderCollapse = 'collapse';
            charTable.style.marginBottom = '20px';

            // Create header row
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f2f2f2';
            
            // Define headers
            const headers = ['Name', 'Title', 'First Name', 'Last Name', 'Series', 'Book', 'Mentions'];
            
            // Add header cells
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.style.padding = '8px';
                th.style.textAlign = 'left';
                th.style.border = '1px solid #ddd';
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            
            charTable.appendChild(headerRow);
            
            // Add character rows
            this.extractedCharacters.forEach(character => {
                const row = document.createElement('tr');
                
                // Add individual cells
                [
                    character.fullName || '',
                    character.title || '',
                    character.firstName || '',
                    character.lastName || '',
                    character.series || '',
                    character.book || '',
                    character.mentions || 0
                ].forEach(cellValue => {
                    const td = document.createElement('td');
                    td.style.padding = '8px';
                    td.style.textAlign = 'left';
                    td.style.border = '1px solid #ddd';
                    td.textContent = cellValue;
                    row.appendChild(td);
                });
                
                charTable.appendChild(row);
            });
            
            charactersSection.appendChild(charTable);
            reportContent.appendChild(charactersSection);

            // Add footer
            const footer = document.createElement('div');
            footer.style.textAlign = 'center';
            footer.style.marginTop = '30px';
            footer.style.color = '#7f8c8d';
            footer.innerHTML = '<p>Generated by Story Database Character Analysis</p>';
            reportContent.appendChild(footer);

            // Generate PDF
            console.log('Converting report to PDF using html2pdf...');
            
            // Check if html2pdf is loaded
            if (typeof html2pdf === 'undefined') {
                console.error('html2pdf library not found');
                alert('PDF generation library not loaded. Please check console for details.');
                return;
            }
            
            const opt = {
                margin: 1,
                filename: 'character-analysis-report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
            };

            // Convert HTML to PDF and trigger download
            html2pdf().set(opt).from(reportContent).save().then(() => {
                console.log('PDF generated successfully');
                
                if (typeof Core !== 'undefined' && Core.showToast) {
                    Core.showToast('PDF report generated successfully', 'success');
                } else {
                    alert('PDF report generated successfully');
                }
            }).catch(error => {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF: ' + error.message);
            });
        } catch (error) {
            console.error('Error in generateAnalysisReport:', error);
            alert('Error generating report: ' + error.message);
        }
    };
    
    // Clear the analysis
    BookAnalysis.clearAnalysis = function() {
        // Reset extracted characters
        this.extractedCharacters = null;
        
        // Reset current file
        this.currentFile = null;
        
        // Reset file stats
        this.fileStats = null;
        
        // Completely reset the results container
        const resultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
        if (resultsContainer) {
            // Remove all inline styles
            resultsContainer.removeAttribute('style');
            
            // Reset to default styles
            resultsContainer.style.display = 'none';
            resultsContainer.style.position = 'relative';
            resultsContainer.style.top = '0';
            resultsContainer.style.left = '0';
            resultsContainer.style.marginTop = '20px';
            
            // Remove active class
            resultsContainer.classList.remove('active');
        }
        
        // Force hide the loading indicator
        const loadingIndicator = document.getElementById('analysisLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
            
            // Also hide any buttons inside the loading indicator
            const buttons = loadingIndicator.querySelectorAll('button');
            buttons.forEach(button => {
                button.style.display = 'none';
            });
        }
        
        // Hide any statistics that might be showing
        const wordCount = document.getElementById('wordCount');
        if (wordCount) {
            const statsContainer = wordCount.closest('div');
            if (statsContainer) {
                statsContainer.style.display = 'none';
            }
        }
        
        
        // Hide the analysis results container
        const analysisResults = document.getElementById('analysisResults');
        if (analysisResults) {
            analysisResults.style.display = 'none';
        }
        
        // Hide the series-book section
        const seriesBookSection = document.getElementById('seriesBookSection');
        if (seriesBookSection) {
            seriesBookSection.style.display = 'none';
        }
        
        // Hide the table action buttons
        const tableActionButtons = document.getElementById('tableActionButtons');
        if (tableActionButtons) {
            tableActionButtons.style.display = 'none';
        }
        
        // Disable the generate report button
        const generateReportBtn = document.getElementById('generateReportBtn');
        if (generateReportBtn) {
            generateReportBtn.disabled = true;
        }
        
        // Clear the detected characters container
        const detectedCharacters = document.getElementById('detectedCharacters');
        if (detectedCharacters) {
            detectedCharacters.innerHTML = '';
        }
        
        // Reset the file upload
        const fileUpload = document.getElementById('bookFileUpload');
        if (fileUpload) {
            fileUpload.value = '';
        }
        
        // Clear the uploaded files display
        const uploadedFiles = document.getElementById('uploadedFiles');
        if (uploadedFiles) {
            uploadedFiles.innerHTML = '';
        }
        
        // Disable the analyze button
        const analyzeBtn = document.getElementById('analyzeBookBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
        }
        
        Core.showToast('Analysis cleared', 'info');
    };

    // Fallback function if NameExtractor module is not loaded
    function fallbackNameExtraction(text) {
        console.log('Using fallback name extraction');
        
        // Get UI options to respect selected detection methods - default to true if element not found
        const options = {
            dialogueAttribution: document.getElementById('dialogueAttribution')?.checked || true,
            capitalizedWordAnalysis: document.getElementById('capitalizedWordAnalysis')?.checked || true,
            namedEntityRecognition: document.getElementById('namedEntityRecognition')?.checked || true,
            directAddressPattern: document.getElementById('directAddressPattern')?.checked || true
        };
        
        console.log('Fallback using options:', options);
        
        const characterMentions = {};
        
        // Simple extraction for basic dialogue attribution
        if (options.dialogueAttribution) {
            // List of speech verbs commonly used with character names
            const speechVerbs = ['said', 'asked', 'replied', 'whispered', 'shouted', 'muttered'];
            const verbPattern = speechVerbs.join('|');
            
            // Find patterns like "John said" or "said John"
            const beforeVerb = new RegExp(`\\b([A-Z][a-z]+)\\s+(${verbPattern})\\b`, 'g');
            const afterVerb = new RegExp(`\\b(${verbPattern})\\s+([A-Z][a-z]+)\\b`, 'g');
            
            let match;
            
            // Process "Name verb" pattern
            while ((match = beforeVerb.exec(text)) !== null) {
                const name = match[1];
                if (!characterMentions[name]) characterMentions[name] = 0;
                characterMentions[name]++;
            }
            
            // Process "verb Name" pattern
            while ((match = afterVerb.exec(text)) !== null) {
                const name = match[2];
                if (!characterMentions[name]) characterMentions[name] = 0;
                characterMentions[name]++;
            }
            
            console.log('Fallback dialogue attribution found potential names:', Object.keys(characterMentions).length);
        }
        
        // Simple capitalized word extraction
        if (options.capitalizedWordAnalysis) {
            const capitalizedPattern = /\b[A-Z][a-z]+\b/g;
            let match;
            
            while ((match = capitalizedPattern.exec(text)) !== null) {
                const word = match[0];
                // Skip common capitalized words
                if (['The', 'I', 'A', 'An', 'He', 'She', 'They', 'We', 'You'].includes(word)) continue;
                
                if (!characterMentions[word]) characterMentions[word] = 0;
                characterMentions[word]++;
            }
            
            console.log('Fallback capitalized word analysis found potential names:', Object.keys(characterMentions).length);
        }
        
        // Basic named entity recognition 
        if (options.namedEntityRecognition) {
            // Look for proper names not at the start of sentences
            const nerPattern = /(?<=[.!?]\s+)[A-Z][a-z]+\b/g;
            let match;
            
            while ((match = nerPattern.exec(text)) !== null) {
                const word = match[0];
                if (!characterMentions[word]) characterMentions[word] = 0;
                characterMentions[word]++;
            }
            
            console.log('Fallback named entity recognition found potential names:', Object.keys(characterMentions).length);
        }
        
        // Simple direct address patterns
        if (options.directAddressPattern) {
            const directAddressPattern = /["'][^"']+,\s+([A-Z][a-z]+)[,.!?]["']/g;
            let match;
            
            while ((match = directAddressPattern.exec(text)) !== null) {
                const word = match[1];
                if (!characterMentions[word]) characterMentions[word] = 0;
                characterMentions[word]++;
            }
            
            console.log('Fallback direct address pattern found potential names:', Object.keys(characterMentions).length);
        }
        
        // Get minimum mentions threshold
        const minMentions = document.getElementById('minMentions') ? 
                          parseInt(document.getElementById('minMentions').value) : 3;
        
        // Convert to array of character objects
        const characters = Object.entries(characterMentions)
            .filter(([name, count]) => count >= minMentions)
            .map(([name, mentions]) => {
                return {
                    fullName: name,
                    firstName: name,
                    lastName: '',
                    title: '',
                    mentions: mentions,
                    variants: []
                };
            })
            .sort((a, b) => b.mentions - a.mentions);
        
        console.log(`Fallback extracted ${characters.length} characters with at least ${minMentions} mentions`);
        return characters;
    }

    console.log('Book Analysis integration initialized successfully');

    // After the code is initialized, add event listeners to validate the checkboxes
    // Add this at the end of the initialization function or in a document ready handler

    // Add this code near the top of the file, after any existing initialization code
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Setting up name variant combination validation');
        
        // Detection method checkboxes
        const detectionCheckboxes = [
            document.getElementById('dialogueAttribution'),
            document.getElementById('namedEntityRecognition'),
            document.getElementById('capitalizedWordAnalysis'),
            document.getElementById('frequencyAnalysis2'),
            document.getElementById('titleHonorificDetection'),
            document.getElementById('directAddressPattern'),
            document.getElementById('possessiveFormDetection'),
            document.getElementById('characterIntroduction')
        ];
        
        // Options checkboxes
        const combineVariantsCheckbox = document.getElementById('combineVariants');
        
        // Function to check if any detection method is selected
        function isAnyDetectionMethodSelected() {
            return detectionCheckboxes.some(checkbox => checkbox && checkbox.checked);
        }
        
        // Function to validate combine variants checkbox
        function validateCombineVariants() {
            if (combineVariantsCheckbox) {
                if (!isAnyDetectionMethodSelected()) {
                    combineVariantsCheckbox.checked = false;
                    combineVariantsCheckbox.disabled = true;
                    combineVariantsCheckbox.parentElement.parentElement.title =
                        'Select at least one detection method before enabling this option';
                    
                    // Add visual indication
                    if (!combineVariantsCheckbox.parentElement.querySelector('.validation-message')) {
                        const validationMsg = document.createElement('div');
                        validationMsg.className = 'validation-message';
                        validationMsg.style.color = '#d9534f';
                        validationMsg.style.fontSize = '0.8rem';
                        validationMsg.style.marginTop = '5px';
                        validationMsg.innerHTML = 'Requires at least one detection method';
                        combineVariantsCheckbox.parentElement.parentElement.appendChild(validationMsg);
                    }
                } else {
                    combineVariantsCheckbox.disabled = false;
                    combineVariantsCheckbox.parentElement.parentElement.title = '';
                    
                    // Remove visual indication if it exists
                    const validationMsg = combineVariantsCheckbox.parentElement.parentElement.querySelector('.validation-message');
                    if (validationMsg) {
                        validationMsg.remove();
                    }
                }
            }
        }
        
        // Add event listeners to all detection checkboxes
        detectionCheckboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', validateCombineVariants);
            }
        });
        
        // Initial validation
        validateCombineVariants();
        
        // Handle dark mode for file drop area
        function updateFileDropAreaForDarkMode() {
            const fileDropArea = document.getElementById('fileDropArea');
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            if (fileDropArea) {
                if (isDarkMode) {
                    // Dark mode styles
                    fileDropArea.style.backgroundColor = 'rgba(51, 51, 51, 0.7)';
                    
                    // Update text colors
                    const fileMessages = fileDropArea.querySelectorAll('.file-msg');
                    fileMessages.forEach(msg => {
                        msg.style.color = '#fff';
                        msg.style.textShadow = '0 0 2px rgba(0, 0, 0, 0.8)';
                    });
                } else {
                    // Light mode styles
                    fileDropArea.style.backgroundColor = 'white';
                    
                    // Update text colors
                    const fileMessages = fileDropArea.querySelectorAll('.file-msg');
                    fileMessages.forEach(msg => {
                        if (msg.textContent.includes('Supported:')) {
                            msg.style.color = '#555';
                        } else {
                            msg.style.color = '#333';
                        }
                        msg.style.textShadow = 'none';
                    });
                }
            }
        }
        
        // Run once on page load
        updateFileDropAreaForDarkMode();
        
        // Set up a MutationObserver to detect when dark mode is toggled
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class' &&
                    (mutation.target.classList.contains('dark-mode') ||
                     !mutation.target.classList.contains('dark-mode'))) {
                    updateFileDropAreaForDarkMode();
                }
            });
        });
        
        // Start observing the body element for class changes
        observer.observe(document.body, { attributes: true });
    });
})(); 