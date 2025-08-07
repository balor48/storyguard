/**
 * Character Name Extraction Module
 * 
 * This module extracts character names from book text, handles different title formats,
 * and properly categorizes first and last names for the Story Database system.
 */

// Hook up the book analysis functions
(function() {
    if (!window.BookAnalysis) {
        console.error('BookAnalysis module not found!');
        return;
    }

    // Add the analyzeBookText method to BookAnalysis
    BookAnalysis.analyzeBookText = function(text) {
        console.log('Analyzing book text...');
        
        // Check if the NameExtractor module is available
        if (!window.NameExtractor) {
            console.error('NameExtractor module not loaded! Attempting to use fallback.');
            // Use fallback name extractor if available
            this.extractedCharacters = fallbackNameExtraction(text);
        } else {
            // Use the enhanced NameExtractor module
            console.log('Using enhanced NameExtractor module');
            
            // Get options from UI
            const options = {
                dialogueAttribution: document.getElementById('dialogueAttribution').checked,
                namedEntityRecognition: document.getElementById('namedEntityRecognition').checked,
                capitalizedWordAnalysis: document.getElementById('capitalizedWordAnalysis').checked,
                frequencyAnalysis: document.getElementById('frequencyAnalysis2').checked,
                titleDetection: document.getElementById('titleHonorificDetection') ?
                               document.getElementById('titleHonorificDetection').checked : true,
                directAddressPattern: document.getElementById('directAddressPattern') ?
                                    document.getElementById('directAddressPattern').checked : true,
                possessiveFormDetection: document.getElementById('possessiveFormDetection') ?
                                       document.getElementById('possessiveFormDetection').checked : true,
                characterIntroduction: document.getElementById('characterIntroduction') ?
                                     document.getElementById('characterIntroduction').checked : true,
                combineNameVariants: document.getElementById('combineVariants') ?
                                   document.getElementById('combineVariants').checked : true,
                filterCommonWords: document.getElementById('filterCommonWords') ? 
                                 document.getElementById('filterCommonWords').checked : true
            };
            
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
        
        return this.extractedCharacters;
    };
    
    // Restore the displayResults function
    BookAnalysis.displayResults = function() {
        if (!this.extractedCharacters || this.extractedCharacters.length === 0) {
            Core.showToast('No characters extracted', 'warning');
            return;
        }

        console.log('Displaying analysis results...');

        // First, preprocess names to fix titles
        this.preprocessNames();

        // Add active class to the results container
        const resultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
        if (resultsContainer) {
            resultsContainer.classList.add('active');
        }

        // Show the series-book section
        const seriesBookSection = document.getElementById('seriesBookSection');
        if (seriesBookSection) {
            seriesBookSection.style.display = 'flex';
        }

        // Hide the loading indicator
        const loadingIndicator = document.getElementById('analysisLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

        // Show the table action buttons
        const tableActionButtons = document.getElementById('tableActionButtons');
        if (tableActionButtons) {
            tableActionButtons.style.display = 'block';
            
            console.log("Found tableActionButtons container:", tableActionButtons);
            
            // Try multiple ways to find the button container
            let buttonContainer = tableActionButtons.querySelector('.character-buttons');
            
            if (!buttonContainer) {
                // Try another selector that might exist
                buttonContainer = tableActionButtons.querySelector('.btn-group');
            }
            
            if (!buttonContainer) {
                // Fallback: just use the tableActionButtons itself
                buttonContainer = tableActionButtons;
            }
            
            console.log("Using button container:", buttonContainer);
            
            // Create simple checkbox with label
            const existingCheckbox = document.getElementById('overrideDuplicates');
            if (existingCheckbox) {
                existingCheckbox.parentElement.remove();
            }
            
            const checkboxSpan = document.createElement('span');
            checkboxSpan.style.display = 'inline-block';
            checkboxSpan.style.marginLeft = '10px';
            checkboxSpan.style.position = 'relative';
            checkboxSpan.style.top = '5px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'overrideDuplicates';
            
            const label = document.createElement('span');
            label.textContent = 'Override Duplicates ';
            
            const infoIcon = document.createElement('span');
            infoIcon.textContent = 'ℹ️';
            infoIcon.title = 'When checked, characters with the same name will be updated instead of skipped';
            
            // Append in the right order
            checkboxSpan.appendChild(checkbox);
            checkboxSpan.appendChild(label);
            checkboxSpan.appendChild(infoIcon);
            
            // Insert at the end of the button container
            buttonContainer.appendChild(checkboxSpan);
            
            console.log("Added override checkbox to container");
        }

        // Show the analysis results
        const analysisResults = document.getElementById('analysisResults');
        if (analysisResults) {
            analysisResults.style.display = 'block';
        }

        // Make sure all report buttons are not disabled
        const reportButtons = [
            'generateReportBtn',
            'generateDocxReportBtn',
            'extractFirstNamesBtn'
        ];
        
        reportButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = false;
                button.classList.remove('disabled');
            }
        });

        // Create the table
        this.createCharactersTable();
    };
    
    // Improved preprocessing function for titles that prevents conflicts
    BookAnalysis.preprocessNames = function() {
        if (!this.extractedCharacters || this.extractedCharacters.length === 0) {
            console.log('No characters to preprocess');
            return;
        }
        
        console.log('Preprocessing character names for title detection...');
        
        // Process each character
        this.extractedCharacters.forEach(character => {
            const fullName = character.fullName || '';
            
            // Check if character already has a title and firstName filled in
            // If so, we need to make sure lastName doesn't contain the firstName
            if (character.title && character.firstName && character.lastName) {
                if (character.lastName === character.firstName) {
                    // If lastName is duplicating firstName, clear it
                    console.log(`Clearing duplicate lastName for: ${fullName} (${character.firstName} === ${character.lastName})`);
                    character.lastName = '';
                }
            }
            
            // Special direct handling for problematic titles
            if (fullName.startsWith('Mayor ')) {
                character.title = 'Mayor';
                character.firstName = fullName.replace('Mayor ', '');
                character.lastName = ''; // Important: clear lastName to prevent conflicts
                console.log(`Fixed title for: ${fullName} -> Title: ${character.title}, First name: ${character.firstName}, Last name: cleared`);
                return;
            }
            
            if (fullName.startsWith('Old ')) {
                character.title = 'Old';
                character.firstName = fullName.replace('Old ', '');
                character.lastName = ''; // Important: clear lastName to prevent conflicts
                console.log(`Fixed title for: ${fullName} -> Title: ${character.title}, First name: ${character.firstName}, Last name: cleared`);
                return;
            }
            
            // Special handling for names with Lady
            if (fullName.startsWith('Lady ')) {
                character.title = 'Lady';
                character.firstName = fullName.replace('Lady ', '');
                character.lastName = ''; // Important: clear lastName to prevent conflicts
                console.log(`Fixed title for: ${fullName} -> Title: ${character.title}, First name: ${character.firstName}, Last name: cleared`);
                return;
            }
            
            // Special handling for names with Master
            if (fullName.startsWith('Master ')) {
                character.title = 'Master';
                character.firstName = fullName.replace('Master ', '');
                character.lastName = ''; // Important: clear lastName to prevent conflicts
                console.log(`Fixed title for: ${fullName} -> Title: ${character.title}, First name: ${character.firstName}, Last name: cleared`);
                return;
            }
            
            // Check for other possible titles that might not be detected correctly
            const possibleTitles = [
                'Captain', 'Doctor', 'Professor', 'General', 'Admiral', 'Senator', 'Governor',
                'Lord', 'King', 'Queen', 'Prince', 'Princess', 'Chief', 'Sir', 'Dame',
                'President', 'Chancellor', 'Colonel', 'Commander', 'Father', 'Sister', 'Brother'
            ];
            
            for (const title of possibleTitles) {
                if (fullName.startsWith(title + ' ')) {
                    character.title = title;
                    character.firstName = fullName.replace(title + ' ', '');
                    character.lastName = ''; // Important: clear lastName to prevent conflicts
                    console.log(`Fixed title for: ${fullName} -> Title: ${character.title}, First name: ${character.firstName}, Last name: cleared`);
                    return;
                }
            }
            
            // Also handle cases where firstName and lastName are the same
            if (character.firstName && character.lastName && character.firstName === character.lastName) {
                console.log(`Detected duplicate name parts in: ${fullName} - clearing lastName`);
                character.lastName = '';
            }
        });
        
        console.log('Preprocessing completed');
    };
    
    // Create the characters table
    BookAnalysis.createCharactersTable = function() {
        const detectedCharacters = document.getElementById('detectedCharacters');
        if (!detectedCharacters) {
            console.error('detectedCharacters container not found');
            return;
        }
        
        // Clear previous results
        detectedCharacters.innerHTML = '';
        
        // Create table
        const table = document.createElement('table');
        table.className = 'character-table';
        
        // Remove any previous styling elements we might have added
        const previousStyles = document.getElementById('character-table-styles');
        if (previousStyles) {
            previousStyles.remove();
        }

        // Add styling with simple colors but good contrast
        const styleElement = document.createElement('style');
        styleElement.id = 'character-table-styles';
        styleElement.textContent = `
            .character-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
            }
            .character-table th {
                background-color: #e6e6e6 !important; /* Simple light gray header */
                color: black !important;
                border: 1px solid #cccccc !important;
                padding: 8px !important;
                text-align: left !important;
                max-width: 100px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .character-table td {
                background-color: white !important;
                border: 1px solid #cccccc !important;
                padding: 8px !important;
                max-width: 100px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .character-table tr:nth-child(even) td {
                background-color: #f2f2f2 !important; /* Light gray for even rows */
            }
            .character-table input[type="text"] {
                background-color: white !important;
                border: 1px solid #cccccc !important;
                color: black !important;
                padding: 4px 8px !important;
                width: 90% !important;
                max-width: 90px !important;
                box-sizing: border-box !important;
            }
        `;
        document.head.appendChild(styleElement);
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Define columns - REMOVED Name column completely
        const columns = [
            { type: 'checkbox', title: '', id: 'selectAllCharacters', onclick: 'BookAnalysis.toggleSelectAllCharacters(this.checked)' },
            // Name/fullName column has been REMOVED
            { type: 'text', title: 'Title', field: 'title' },
            { type: 'text', title: 'First Name', field: 'firstName' },
            { type: 'text', title: 'Last Name', field: 'lastName' },
            { type: 'text', title: 'Series', field: 'series' },
            { type: 'text', title: 'Book', field: 'book' },
            { type: 'text', title: 'Mentions', field: 'mentions', readonly: true },
            { type: 'text', title: 'Variants', field: 'variants', readonly: true }
        ];
        
        // Create header cells
        columns.forEach(column => {
            const th = document.createElement('th');
            
            if (column.type === 'checkbox') {
                th.innerHTML = `<input type="checkbox" id="${column.id}" onclick="${column.onclick}">`;
            } else {
                th.textContent = column.title;
            }
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        // Add characters to table
        this.extractedCharacters.forEach((character, index) => {
            const row = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                
                if (column.type === 'checkbox') {
                    td.innerHTML = `<input type="checkbox" class="character-select" data-index="${index}">`;
                } else {
                    // For text columns
                    if (column.field === 'variants') {
                        // Variants is a special case - array joined by commas
                        td.textContent = character.variants ? character.variants.join(', ') : '';
                    } else if (column.readonly) {
                        // For read-only fields, just add text
                        td.textContent = character[column.field] || '';
                    } else {
                        // For editable fields, add input
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = character[column.field] || '';
                        input.dataset.field = column.field;
                        input.dataset.index = index;
                        
                        // Add event listener for changes
                        input.addEventListener('change', this.updateCharacterField.bind(this));
                        
                        td.appendChild(input);
                    }
                }
                
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        detectedCharacters.appendChild(table);
        
        console.log('Character table created with simple styling and Name column completely removed');
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
        console.log('toggleSelectAllCharacters called with:', checked);
        const checkboxes = document.querySelectorAll('.character-select');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        
        // Log how many checkboxes were toggled
        console.log(`Toggled ${checkboxes.length} character checkboxes to ${checked}`);
    };
    
    // Select all characters
    BookAnalysis.selectAllCharacters = function() {
        this.toggleSelectAllCharacters(true);
    };
    
    // Deselect all characters
    BookAnalysis.deselectAllCharacters = function() {
        this.toggleSelectAllCharacters(false);
    };
    
    // Comprehensive fix for adding characters with full localStorage debugging
    BookAnalysis.addSelectedCharacters = function() {
        const checkboxes = document.querySelectorAll('.character-select:checked');
        console.log(`Adding ${checkboxes.length} selected characters to database`);
        
        if (checkboxes.length === 0) {
            Core.showToast('No characters selected', 'warning');
            return;
        }

        // Get the selected series and book
        const seriesSelect = document.getElementById('analysisSeries');
        const bookSelect = document.getElementById('analysisBook');
        const series = seriesSelect ? seriesSelect.value : '';
        const book = bookSelect ? bookSelect.value : '';

        // Get the override checkbox value
        const overrideCheckbox = document.getElementById('overrideDuplicates');
        const overrideDuplicates = overrideCheckbox ? overrideCheckbox.checked : false;
        console.log('Override duplicates:', overrideDuplicates);

        // DEBUG SECTION - Examine all localStorage keys to find where characters are stored
        console.log("===== STORAGE DEBUGGING =====");
        console.log("All localStorage keys:");
        const storageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            storageKeys.push(key);
            try {
                const value = localStorage.getItem(key);
                if (value && value.includes("firstName")) {
                    console.log(`Key '${key}' looks like it contains character data:`);
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        console.log(`  - Contains an array with ${parsed.length} items`);
                        if (parsed.length > 0) {
                            console.log(`  - First item sample:`, parsed[0]);
                        }
                    } else {
                        console.log(`  - Contains a non-array value:`, parsed);
                    }
                }
            } catch (e) {
                console.log(`Error parsing key '${key}':`, e);
            }
        }
        console.log("All localStorage keys:", storageKeys);
        
        // Check if Characters module exists and what it contains
        if (window.Characters) {
            console.log("Characters module exists:");
            console.log("  - Characters.characters:", window.Characters.characters);
            
            // Check for methods
            for (const prop in window.Characters) {
                if (typeof window.Characters[prop] === "function") {
                    console.log(`  - Function: Characters.${prop}`);
                }
            }
        }
        
        // MAIN IMPLEMENTATION
        
        // Find the most likely character storage key
        const possibleKeys = [
            'characters',
            'historical-supplement_characters',
            `${localStorage.getItem('currentDatabase')}_characters`
        ];
        
        // Find which key contains character data
        let mainStorageKey = null;
        let characterData = [];
        
        for (const key of possibleKeys) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        console.log(`Found character data in key '${key}' with ${parsed.length} items`);
                        mainStorageKey = key;
                        characterData = parsed;
                        break;
                    }
                }
            } catch (e) {
                console.log(`Error checking key '${key}':`, e);
            }
        }
        
        if (!mainStorageKey) {
            console.log("Could not find existing character storage. Creating new array.");
            mainStorageKey = 'characters';
            characterData = [];
        }
        
        // Process the selected characters
        let addedCount = 0;
        let skippedCount = 0;
        const timestamp = Date.now();
        
        // Create a map of existing character first names for faster duplicate checking
        const existingFirstNames = new Map();
        characterData.forEach(char => {
            if (char && char.firstName) {
                existingFirstNames.set(char.firstName.toLowerCase().trim(), char);
            }
        });
        
        // Process each selected character
        checkboxes.forEach((checkbox, idx) => {
            const index = parseInt(checkbox.dataset.index);
            const character = this.extractedCharacters[index];
            
            if (!character || !character.firstName) {
                console.log(`Skipping character at index ${index} - missing data or first name`);
                return;
            }
            
            const firstName = character.firstName.toLowerCase().trim();
            const existingChar = existingFirstNames.get(firstName);
            
            // Check if it's a duplicate
            if (existingChar) {
                if (!overrideDuplicates) {
                    console.log(`Skipping duplicate character: ${character.firstName}`);
                    skippedCount++;
                    return;
                } else {
                    // Remove the existing character
                    console.log(`Replacing existing character: ${character.firstName}`);
                    characterData = characterData.filter(c => 
                        !c.firstName || c.firstName.toLowerCase().trim() !== firstName
                    );
                }
            }
            
            // Create the character object
            const newCharacter = {
                id: existingChar ? existingChar.id : `${timestamp}_${idx}`,
                title: character.title || '',
                firstName: character.firstName || '',
                lastName: character.lastName || '',
                series: series || '',
                book: book || '',
                notes: `Character extracted from book analysis.\nMentioned ${character.mentions} times.\nVariants: ${character.variants ? character.variants.join(', ') : 'None'}`
            };
            
            // Add to our array
            characterData.push(newCharacter);
            console.log(`Added character: ${character.firstName}`);
            addedCount++;
        });
        
        // Save back to localStorage if we added any characters
        if (addedCount > 0) {
            try {
                // Save to ALL possible storage locations to ensure it works
                localStorage.setItem(mainStorageKey, JSON.stringify(characterData));
                console.log(`Saved ${characterData.length} characters to localStorage key '${mainStorageKey}'`);
                
                // Also save to other possible keys as a backup
                for (const key of possibleKeys) {
                    if (key !== mainStorageKey) {
                        localStorage.setItem(key, JSON.stringify(characterData));
                        console.log(`Also saved to backup key '${key}'`);
                    }
                }
                
                // CRITICAL FIX: Update the global window.characters array
                window.characters = characterData;
                console.log('Updated window.characters array with', characterData.length, 'characters');
                
                // Update any in-memory arrays
                if (window.Characters && typeof window.Characters.characters !== 'undefined') {
                    window.Characters.characters = characterData;
                    console.log('Updated Characters.characters array in memory');
                }
                
                // IMPROVED CHARACTER REFRESH
                // Try to update the character table directly without full page reload
                try {
                    const characterList = document.getElementById('characterList');
                    if (characterList && window.Characters && typeof window.Characters.displayCharacters === 'function') {
                        // This is the proper way to refresh the table with new characters
                        console.log('Calling Characters.displayCharacters() to refresh table');
                        window.Characters.displayCharacters();
                        
                        // Also update character counts/stats
                        if (typeof window.Characters.updateCharacterCounts === 'function') {
                            window.Characters.updateCharacterCounts();
                        }
                        
                        // Switch to the characters tab to show the new characters
                        if (typeof window.UI.switchTab === 'function') {
                            window.UI.switchTab('characters');
                            console.log('Switched to characters tab to show new characters');
                        }
                        
                        // Show success toast without the page refresh message
                        const charactersWord = addedCount === 1 ? 'character' : 'characters';
                        Core.showToast(`Added ${addedCount} ${charactersWord} to database. Switched to Characters tab.`, 'success');
                        
                        if (skippedCount > 0) {
                            const skippedWord = skippedCount === 1 ? 'character' : 'characters';
                            Core.showToast(`Skipped ${skippedCount} duplicate ${skippedWord}. Check Override Duplicates to update them.`, 'warning');
                        }
                        
                        // Clear the analysis results to indicate completion
                        this.clearAnalysis();
                        
                        // Early return to prevent the page reload
                        return;
                    }
                } catch (e) {
                    console.error('Error refreshing character table:', e);
                    // Continue with the fallback page reload approach below
                }
                
                // Try to use any available refresh methods
                if (window.Characters) {
                    if (typeof window.Characters.displayCharacters === 'function') {
                        try {
                            window.Characters.displayCharacters();
                            console.log('Called Characters.displayCharacters()');
                        } catch (e) {
                            console.error('Error calling displayCharacters():', e);
                        }
                    }
                    
                    if (typeof window.Characters.init === 'function') {
                        try {
                            window.Characters.init();
                            console.log('Called Characters.init()');
                        } catch (e) {
                            console.error('Error calling init():', e);
                        }
                    }
                }
                
                // Show success messages
                const charactersWord = addedCount === 1 ? 'character' : 'characters';
                Core.showToast(`Added ${addedCount} ${charactersWord} to database`, 'success');
                
                if (skippedCount > 0) {
                    const skippedWord = skippedCount === 1 ? 'character' : 'characters';
                    Core.showToast(`Skipped ${skippedCount} duplicate ${skippedWord}. Check Override Duplicates to update them.`, 'warning');
                }
                
                // Notify the user that we're about to refresh and go to dashboard
                const refreshMsg = document.createElement('div');
                refreshMsg.innerHTML = `
                    <p><strong>${addedCount} characters added successfully!</strong></p>
                    <p>The page will automatically refresh and go to the dashboard in 3 seconds...</p>
                `;
                
                // Inject this message into the UI
                const resultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
                if (resultsContainer) {
                    const msgElement = document.createElement('div');
                    msgElement.className = 'alert alert-info mt-3';
                    msgElement.style.padding = '10px';
                    msgElement.style.backgroundColor = '#d1ecf1';
                    msgElement.style.border = '1px solid #bee5eb';
                    msgElement.style.borderRadius = '5px';
                    msgElement.style.color = '#0c5460';
                    msgElement.style.marginTop = '20px';
                    msgElement.appendChild(refreshMsg);
                    
                    resultsContainer.appendChild(msgElement);
                }
                
                // Set a timestamp for this operation
                localStorage.setItem('lastCharacterAddTimestamp', Date.now().toString());
                
                // Trigger data load events before reloading
                if (typeof window.triggerDataLoadEvents === 'function') {
                    try {
                        window.triggerDataLoadEvents();
                        console.log('Called triggerDataLoadEvents()');
                    } catch (e) {
                        console.error('Error calling triggerDataLoadEvents():', e);
                    }
                } else {
                    // Fallback - manually dispatch events
                    try {
                        document.dispatchEvent(new CustomEvent('dataLoaded', { detail: { source: 'characterAdd' } }));
                        window.dispatchEvent(new Event('storage'));
                        console.log('Manually dispatched data load events');
                    } catch (e) {
                        console.error('Error dispatching events:', e);
                    }
                }
                
                // Force a complete reload of the page after a delay to go to dashboard
                setTimeout(() => {
                    console.log('Forcing complete page reload after adding characters');
                    // Add a URL parameter to indicate we should navigate to the dashboard after reload
                    window.location.href = window.location.href.split('?')[0] + '?tab=characters&reload=' + Date.now();
                }, 3000); // 3 second delay to allow user to see the success message
                
            } catch (e) {
                console.error('Error saving characters:', e);
                Core.showToast('Error saving characters to database: ' + e.message, 'error');
            }
        } else if (skippedCount > 0) {
            Core.showToast(`No characters added. ${skippedCount} duplicates were skipped.`, 'warning');
        } else {
            Core.showToast('No characters were added to the database', 'error');
        }
    };
    
    // Add to table
    BookAnalysis.addToTable = function() {
        // Get the series and book
        const seriesSelect = document.getElementById('analysisSeries');
        const bookSelect = document.getElementById('analysisBook');
        
        if (!seriesSelect || !bookSelect) {
            Core.showToast('Series or book selector not found', 'error');
            return;
        }
        
        const series = seriesSelect.value;
        const book = bookSelect.value;
        
        if (!series) {
            Core.showToast('Please select a series', 'warning');
            return;
        }
        
        if (!book) {
            Core.showToast('Please select a book', 'warning');
            return;
        }
        
        // Add the series and book to each character
        this.extractedCharacters.forEach(character => {
            character.series = series;
            character.book = book;
        });
        
        Core.showToast(`Set series to "${series}" and book to "${book}" for all characters`, 'success');
        
        // Refresh the table
        this.createCharactersTable();
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
    
    // Generate analysis report
    BookAnalysis.generateAnalysisReport = function(format = 'pdf') {
        if (!this.extractedCharacters || this.extractedCharacters.length === 0) {
            Core.showToast('No characters to generate report', 'warning');
            return;
        }
        
        console.log(`Generating ${format} analysis report...`);
        
        // Create report content
        const reportContent = document.createElement('div');
        reportContent.className = 'analysis-report';
        reportContent.style.padding = '20px';
        reportContent.style.fontFamily = 'Arial, sans-serif';
        
        // Add report header
        const header = document.createElement('div');
        header.innerHTML = `
            <h1 style="color: #2c3e50; text-align: center;">Book Character Analysis Report</h1>
            <p style="text-align: center; color: #7f8c8d;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
        `;
        reportContent.appendChild(header);
        
        // Add file info - with safety checks
        if (this.currentFile) {
            // Create a default fileStats object if it doesn't exist
            const fileStats = this.fileStats || { wordCount: 0, charCount: 0 };
            
            const fileInfo = document.createElement('div');
            fileInfo.innerHTML = `
                <h2 style="color: #3498db;">File Information</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Property</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Value</th>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">File Name</td>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${this.currentFile.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">File Size</td>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${(this.currentFile.size / 1024).toFixed(2)} KB</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">Word Count</td>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${fileStats.wordCount ? fileStats.wordCount.toLocaleString() : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">Character Count</td>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${fileStats.charCount ? fileStats.charCount.toLocaleString() : 'N/A'}</td>
                    </tr>
                </table>
            `;
            reportContent.appendChild(fileInfo);
        }
        
        // Add characters table
        const charactersSection = document.createElement('div');
        charactersSection.innerHTML = `
            <h2 style="color: #3498db;">Detected Characters</h2>
            <p>Total characters detected: ${this.extractedCharacters.length}</p>
        `;
        
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        
        // Add table header with Series and Book columns
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#f2f2f2';
        
        // Define all columns with their properties - REMOVED Name column from PDF report too
        const columns = [
            // Name column removed
            { name: 'Title', key: 'title' },
            { name: 'First Name', key: 'firstName' },
            { name: 'Last Name', key: 'lastName' },
            { name: 'Series', key: 'series' },
            { name: 'Book', key: 'book' },
            { name: 'Mentions', key: 'mentions' },
            { name: 'Variants', key: 'variants' }
        ];
        
        // Create header cells
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.name;
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            th.style.border = '1px solid #ddd';
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create tbody and add rows
        const tbody = document.createElement('tbody');
        
        this.extractedCharacters.forEach(character => {
            const row = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                td.style.padding = '8px';
                td.style.textAlign = 'left';
                td.style.border = '1px solid #ddd';
                
                // Special handling for different column types
                if (column.key === 'variants') {
                    td.textContent = character.variants ? character.variants.join(', ') : '';
                } else {
                    td.textContent = character[column.key] || '';
                }
                
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        charactersSection.appendChild(table);
        reportContent.appendChild(charactersSection);
        
        // Add options used
        const optionsSection = document.createElement('div');
        optionsSection.innerHTML = `
            <h2 style="color: #3498db;">Analysis Options Used</h2>
        `;
        
        const optionsTable = document.createElement('table');
        optionsTable.style.width = '100%';
        optionsTable.style.borderCollapse = 'collapse';
        optionsTable.style.marginBottom = '20px';
        
        // Add table header
        optionsTable.innerHTML = `
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Option</th>
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Value</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        // Add options to table
        const options = [
            { name: 'Minimum Mentions', id: 'minMentions' },
            { name: 'Dialogue Attribution', id: 'dialogueAttribution' },
            { name: 'Named Entity Recognition', id: 'namedEntityRecognition' },
            { name: 'Capitalized Word Analysis', id: 'capitalizedWordAnalysis' },
            { name: 'Title & Honorific Detection', id: 'titleHonorificDetection' },
            { name: 'Direct Address Pattern', id: 'directAddressPattern' },
            { name: 'Possessive Form Detection', id: 'possessiveFormDetection' },
            { name: 'Character Introduction', id: 'characterIntroduction' },
            { name: 'Combine Name Variants', id: 'combineVariants' },
            { name: 'Filter Common Words', id: 'filterCommonWords' }
        ];
        
        options.forEach(option => {
            const element = document.getElementById(option.id);
            const value = element ?
                (element.type === 'checkbox' ? element.checked : element.value) :
                'Not available';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${option.name}</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${value}</td>
            `;
            optionsTable.querySelector('tbody').appendChild(row);
        });
        
        optionsSection.appendChild(optionsTable);
        reportContent.appendChild(optionsSection);
        
        // Add footer
        const footer = document.createElement('div');
        footer.innerHTML = `
            <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
            <p style="text-align: center; color: #7f8c8d;">Generated by Story Database Character Analysis Tool</p>
        `;
        reportContent.appendChild(footer);
        
        // Generate report based on format
        if (format === 'pdf') {
            this.generatePdfReport(reportContent);
        } else if (format === 'docx') {
            this.generateDocxReport(reportContent);
        } else {
            Core.showToast(`Unsupported report format: ${format}`, 'error');
        }
    };
    
    // Generate PDF report
    BookAnalysis.generatePdfReport = function(reportContent) {
        try {
            const htmlContent = reportContent.outerHTML;
            
            // Use the Electron API to save as PDF if available
            if (window.api && window.api.savePdf) {
                window.api.savePdf(htmlContent, 'character-analysis-report.pdf')
                    .then(() => {
                        Core.showToast('PDF report saved successfully', 'success');
                    })
                    .catch(error => {
                        console.error('Error saving PDF via API:', error);
                        Core.showToast('Error generating PDF report: ' + error.message, 'error');
                        // Fall back to HTML if API fails
                        fallbackToHtml(htmlContent);
                    });
            } else {
                // Fallback to HTML if API not available
                fallbackToHtml(htmlContent);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Core.showToast('Error generating PDF report: ' + error.message, 'error');
        }
    };
    
    // Helper function to fall back to HTML download
    function fallbackToHtml(htmlContent) {
        // Create a blob with the HTML content
        const blob = new Blob([htmlContent], { type: 'text/html' });
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a link element
        const link = document.createElement('a');
        link.href = url;
        link.download = 'character-analysis-report.html';
        
        // Append the link to the body
        document.body.appendChild(link);
        
        // Click the link to download the file
        link.click();
        
        // Remove the link from the body
        document.body.removeChild(link);
        
        // Revoke the URL
        URL.revokeObjectURL(url);
        
        Core.showToast('Generating PDF report... (HTML format for now)', 'info');
        Core.showToast('You can open the HTML file in Word and save as PDF', 'info');
    }
    
    // Extract first names to a text file
    BookAnalysis.extractFirstNames = function() {
        if (!this.extractedCharacters || this.extractedCharacters.length === 0) {
            Core.showToast('No characters to extract names from', 'warning');
            return;
        }
        
        try {
            // Create a list of common words
            const commonWordsList = [
                // Original common words
                "About", "After", "Again", "Against", "All", "Almost", "Also", "Although", "Always",
                "Among", "Any", "Are", "Around", "Because", "Been", "Before", "Being", "Between",
                "Both", "Can", "Could", "Did", "Does", "Done", "During", "Each", "Even", "Ever",
                "Every", "First", "For", "From", "Good", "Great", "Had", "Has", "Have", "Having",
                "Her", "Here", "Him", "His", "How", "However", "Into", "Its", "Just", "Know",
                "Like", "Made", "Make", "Many", "More", "Most", "Much", "Must", "Never", "New",
                "Next", "Now", "Off", "Once", "One", "Only", "Other", "Our", "Out", "Over",
                "Perhaps", "Please", "Rather", "Right", "Said", "Same", "See", "Should", "Since",
                "Some", "Still", "Such", "Take", "Than", "That", "The", "Their", "Them", "Then",
                "There", "These", "They", "This", "Those", "Through", "Thus", "Too", "Two",
                "Under", "Until", "Very", "Was", "Were", "What", "When", "Where", "Which",
                "While", "Who", "Why", "Will", "With", "Would", "You", "Your", "Above", "Along",
                "Already", "Always", "Another", "Anyone", "Anything", "Around", "Available",
                "Away", "Back", "Basic", "Because", "Been", "Before", "Behind", "Below", "Besides",
                "Best", "Better", "Beyond", "Both", "Cannot", "Choose", "Close", "Coming", "Common",
                "Could", "Current", "Different", "Down", "Each", "Either", "Else", "Enough", "Even",
                "Ever", "Every", "Everything", "Exactly", "Finally", "Find", "Five", "Following",
                "Four", "From", "Getting", "Given", "Going", "Gone", "Half", "Having", "Here",
                "High", "Himself", "However", "Hundred", "Inside", "Instead", "Into", "Itself",
                "Just", "Keep", "Keeping", "Last", "Later", "Less", "Little", "Long", "Look",
                "Looking", "Made", "Make", "Making", "Many", "Maybe", "More", "Most", "Much",
                "Must", "Near", "Need", "Never", "Next", "Nine", "Nothing", "Often", "Once",
                "Only", "Other", "Others", "Over", "Past", "Perhaps", "Please", "Quite", "Rather",
                "Really", "Right", "Same", "Several", "Should", "Since", "Six", "Small", "Some",
                "Something", "Sometimes", "Soon", "Still", "Such", "Sure", "Take", "Taking",
                "Tell", "Ten", "Than", "Thank", "Thanks", "That", "Their", "Them", "Then",
                "There", "These", "They", "Thing", "Things", "Think", "Third", "This", "Those",
                "Three", "Through", "Thus", "Together", "Too", "Toward", "Turn", "Twenty",
                "Two", "Under", "Until", "Upon", "Using", "Very", "Want", "Well", "Were",
                "What", "Whatever", "When", "Where", "Whether", "Which", "While", "Who",
                "Whole", "Whom", "Whose", "Why", "Will", "With", "Within", "Without", "Would",
                "Yes", "Yet", "You", "Your", "Yourself",
                
                // Additional common words from user's list
                "Abilities", "Ability", "Absolutely", "Accepted", "Access", "Achievements", "Acquired",
                "Actually", "Additional", "Adventurer", "Adventurers", "Agreed", "Air", "Allows",
                "Alright", "Analysis", "Ancient", "Apparently", "Arbor", "Arcana", "Arcane", "Archers",
                "Area", "Armour", "Armsmaster", "Arts", "Assessment", "Assorted", "Assuming", "Attack",
                "Aye", "Badge", "Bard", "Bardic", "Bards", "Base", "Battle", "Bear", "Beast", "Begin",
                "Beginner", "Birds", "Black", "Blade", "Blades", "Blood", "Blue", "Bottomless", "Bound",
                "Bracer", "Brass", "Breaking", "Brigade", "Bring", "Build", "Burden", "Business", "Cant",
                "Captain", "Caravan", "Careful", "Cartography", "Casting", "Cataloged", "Chaos", "Character",
                "Charisma", "Charm", "Check", "Chieftain", "Chord", "Circlet", "Class", "Classification",
                "Clean", "Clearance", "Clothing", "Cold", "Collection", "Combat", "Come", "Command",
                "Commander", "Compass", "Complete", "Completed", "Completion", "Complex", "Conditions",
                "Confused", "Consecutive", "Consider", "Constitution", "Construction", "Cook", "Cooldown",
                "Core", "Corporal", "Corrupted", "Cost", "Council", "Count", "Counting", "Cove", "Create",
                "Creates", "Creating", "Critical", "Cross", "Crushing", "Crystal", "Curious", "Currency",
                "Cut", "Dad", "Daggers", "Damage", "Dance", "Dangerous", "Daring", "Dark", "Dash", "Dawn",
                "Day", "Decoder", "Deep", "Defeat", "Defeated", "Defence", "Defender", "Delicate", "Deliver",
                "Delivery", "Description", "Despite", "Detection", "Diary", "Didn", "Difficulty", "Dignity",
                "Dirge", "Discover", "Dissolution", "Dissonant", "Document", "Documents", "Dodge", "Don",
                "Double", "Dragon", "Dreadful", "Drift", "Drop", "Dual", "Duration", "Earth", "Eastern",
                "Eat", "Edge", "Effect", "Effects", "Eight", "Eighteen", "Elite", "Embrace", "Enchanted",
                "Enemies", "Enemy", "Energy", "Enhancement", "Epic", "Equipped", "Especially", "Establish",
                "Evasion", "Evening", "Eventually", "Everyone", "Excellent", "Exotic", "Experience",
                "Expired", "Explore", "Extreme", "Failed", "Failure", "Fall", "Fang", "Farm", "Farmstead",
                "Fascinating", "Fear", "Feast", "Feel", "Few", "Final", "Fine", "Finesse", "Flag", "Flow",
                "Focus", "Food", "Footwork", "Forces", "Form", "Found", "Free", "Fresh", "Full",
                "Fundamentals", "Gain", "Gained", "Garrison", "Gather", "Gathering", "General", "Get",
                "Giver", "Goblin", "Gods", "Gold", "Golden", "Got", "Grants", "Greedy", "Group", "Guard",
                "Guardian", "Guards", "Guess", "Guest", "Guild", "Guildmaster", "Hare", "Harmonic",
                "Harmony", "Haven", "Healing", "Heard", "Heaven", "Hey", "Hit", "Hmm", "Hold", "Hollow",
                "Hours", "Human", "Hunt", "Hunter", "Hunters", "Identify", "Imperial", "Impressive",
                "Increase", "Indeed", "Inn", "Instant", "Instrument", "Intelligence", "Interesting",
                "Inventory", "Iron", "Items", "Jab", "Joining", "Kandari", "Killed", "King", "Kitchen",
                "Knowledge", "Kobold", "Lady", "Law", "Leader", "Learn", "Learning", "Leather", "Leave",
                "Left", "Legendary", "Lessons", "Let", "Level", "Lieutenant", "Life", "Light", "Lightning",
                "Limit", "Limitations", "Line", "Listen", "Locate", "Location", "Lock", "Lockpicking",
                "Looks", "Loot", "Losses", "Lullaby", "Mage", "Magic", "Magical", "Main", "Maintaining",
                "Maker", "Makers", "Makes", "Mana", "Map", "Marked", "Market", "Master", "Material",
                "Meanwhile", "Meat", "Medic", "Memories", "Mental", "Merchant", "Met", "Might", "Mind",
                "Mister", "Misty", "Mithril", "Moderate", "Mom", "Morning", "Mostly", "Mountain",
                "Mountains", "Move", "Movement", "Moves", "Moving", "Mrs", "Multiple", "Music", "Musical",
                "Name", "Necklace", "News", "Nice", "Night", "Nimble", "Nobody", "None", "Northern", "Not",
                "Notable", "Note", "Notes", "Notice", "Novice", "Objective", "Objectives", "Officer",
                "Officers", "Official", "Okay", "Old", "Onlookers", "Optional", "Outworlder", "Panic",
                "Party", "Pass", "Passive", "Pattern", "Pelt", "Pendant", "Pendulum", "People", "Percussion",
                "Perfect", "Permanent", "Phase", "Physical", "Planning", "Plate", "Plus", "Point", "Points",
                "Poison", "Portal", "Possibly", "Pot", "Potion", "Potions", "Power", "Practice", "Primary",
                "Probably", "Profession", "Progress", "Property", "Protect", "Provides", "Pure", "Quality",
                "Quest", "Quests", "Quick", "Raider", "Raiders", "Rancher", "Range", "Rare", "Rat", "Rate",
                "Rations", "Ratman", "Ratmen", "Reach", "Reached", "Ready", "Real", "Received", "Recognition",
                "Reconnaissance", "Recovery", "Red", "Released", "Relief", "Remaining", "Remember", "Removed",
                "Removes", "Report", "Required", "Requirement", "Requirements", "Requirments", "Research",
                "Resistance", "Resistances", "Resonance", "Resonant", "Rest", "Results", "Return", "Reveals",
                "Rewards", "Rhythm", "Rhythmic", "Ring", "Riposte", "Rise", "Riverbed", "Riverhaven",
                "Rivers", "Road", "Round", "Run", "Running", "Satchel", "Save", "Scale", "Scales", "Scout",
                "Second", "Secondary", "Secure", "Security", "Seeker", "Seems", "Self", "Sense", "Sergeant",
                "Serpent", "Shaman", "Shattering", "She", "Short", "Shortsword", "Show", "Shows", "Side",
                "Sidestep", "Sidesteps", "Silence", "Simple", "Single", "Sir", "Skill", "Skilled", "Skills",
                "Slashing", "Sleep", "Slowly", "Smart", "Somehow", "Someone", "Somewhere", "Song", "Songs",
                "Sounds", "Sovereign", "Speaking", "Special", "Specialist", "Species", "Speech", "Speed",
                "Spymaster", "Stablemaster", "Staff", "Standing", "Stars", "Starting", "Statistics", "Status",
                "Stay", "Steel", "Stone", "Stop", "Storm", "Strain", "Strange", "Strength", "Strike",
                "Strikes", "String", "Study", "Success", "Successfully", "Suddenly", "Summary", "Sundering",
                "Sunlight", "Supply", "Support", "Supreme", "Survivor", "Sweat", "Sword", "System", "Target",
                "Technically", "Temporary", "Terrain", "Test", "Though", "Throwing", "Thunder", "Time",
                "Title", "Titles", "Today", "Tomorrow", "Total", "Touch", "Track", "Tracking", "Tracks",
                "Trade", "Training", "Translation", "Translator", "Trap", "Traps", "Tricky", "Triggered",
                "Trouble", "True", "Trust", "Truth", "Try", "Tumblers", "Tune", "Twice", "Twisted", "Type",
                "Uncommon", "Understanding", "Understood", "Unintentional", "Unknown", "Unlike", "Unseen",
                "Update", "Usage", "Use", "Vale", "Value", "Various", "Vial", "Victory", "Virtuoso", "Void",
                "Waistband", "Wait", "Walker", "Wanderer", "War", "Warning", "Warren", "Warrior", "Warriors",
                "Watch", "Water", "Wave", "Wayfinder", "Weaver", "Weight", "Welcome", "Wellspring", "Whisker",
                "Whisper", "Whispering", "Whispers", "Wield", "Wind", "Wing", "Wisdom", "Wolf", "Wonderful",
                "Woods", "Word", "World", "Wow", "Wrong", "Yeah",
                
                // Additional words from user's second list
                "You", "We", "My", "He", "It", "They", "She", "That", "This", "His",
                "Name", "Now", "Just", "What", "Will", "Each", "When", "No", "Common",
                "Her", "One", "There", "Weight", "Your", "Their", "Through", "Even",
                "Old", "Effect", "After", "Uncommon", "Well", "Requirement", "Let",
                "Oh", "Unseen", "Every", "If", "Scale", "Two", "Time", "Then", "New",
                
                // Additional words from user's third list
                "These", "How", "Type", "Not", "Whatever", "Guild", "Can", "Our", "While",
                "Maybe", "Yes", "Those", "Some", "Summary", "Three", "Like", "Do", "All",
                "Ah", "Its", "First", "Cost", "Loot", "Use", "Dad", "Good", "Perfect",
                "Find", "Get", "Once", "Only", "Most", "Usage", "See", "Still", "Why",
                "Which", "Are", "Wait", "Is", "Where", "Here", "Did", "Think", "Thanks",
                "Thank", "Next", "Feel", "Take", "Was", "Ready", "Alright", "Really",
                "Note", "Map", "Show", "Who", "Got", "Four", "Any", "Please", "Up",
                "Too", "Five", "Sir", "Stop", "Tell", "Aye", "Also", "Run", "Nice",
                "Look", "Word", "Notes", "Have", "Move", "Had", "Test", "Over", "Sure"
            ];
            
            // Add critical pronouns and articles that must be filtered
            const criticalWords = ['we', 'you', 'they', 'he', 'she', 'it', 'i', 'me', 'my', 'mine', 'your', 'yours',
                                  'his', 'her', 'hers', 'their', 'theirs', 'our', 'ours', 'its', 'the', 'a', 'an',
                                  'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being'];
            
            // Convert all words to lowercase and create a Set for efficient lookup
            const commonWords = new Set([
                ...commonWordsList.map(word => word.toLowerCase()),
                ...criticalWords
            ]);
            
            // Get all first names, filtering out common words
            let filteredCharacters = [];
            
            // First, create a filtered copy to avoid modifying the original
            for (let i = 0; i < this.extractedCharacters.length; i++) {
                const character = this.extractedCharacters[i];
                
                // Skip if no firstName or it's too short
                if (!character.firstName || character.firstName.length < 3) {
                    continue;
                }
                
                // Skip common words (case-insensitive check)
                if (character.firstName) {
                    // Convert to lowercase for case-insensitive comparison
                    const firstNameLower = character.firstName.toLowerCase();
                    
                    // More aggressive filtering approach:
                    
                    // 1. Check if lowercase version is in common words
                    if (commonWords.has(firstNameLower)) {
                        console.log(`Filtering out common word: ${character.firstName}`);
                        continue;
                    }
                    
                    // 2. Check if it's a capitalized common word (for words at beginning of sentences)
                    // This handles cases like "The" at the beginning of a sentence
                    if (character.firstName && character.firstName[0].toUpperCase() === character.firstName[0]) {
                        const decapitalized = character.firstName[0].toLowerCase() + character.firstName.slice(1);
                        if (commonWords.has(decapitalized.toLowerCase())) {
                            console.log(`Filtering out capitalized common word: ${character.firstName}`);
                            continue;
                        }
                    }
                    
                    // 3. Special handling for critical words that must be filtered regardless
                    const criticalWords = ['we', 'you', 'they', 'the', 'and', 'but', 'or', 'if', 'then', 'when', 'what', 'where', 'why', 'how'];
                    if (criticalWords.includes(firstNameLower)) {
                        console.log(`Filtering critical word: ${character.firstName}`);
                        continue;
                    }
                    
                    // 4. Filter very short words (likely not names)
                    if (character.firstName.length <= 2) {
                        console.log(`Filtering very short word: ${character.firstName}`);
                        continue;
                    }
                    
                    // 5. Filter words that are all uppercase (likely acronyms, not names)
                    if (character.firstName === character.firstName.toUpperCase() && character.firstName.length > 1) {
                        console.log(`Filtering all-caps word: ${character.firstName}`);
                        continue;
                    }
                }
                
                // Add to filtered list
                filteredCharacters.push(character);
            }
            
            // Extract and sort first names
            let firstNames = filteredCharacters
                .map(character => character.firstName)
                .filter(name => name && name.trim() !== '')
                .sort();
            
            // Create text content with one name per line
            const textContent = firstNames.join('\n');
            
            // Create a blob with the text content
            const blob = new Blob([textContent], { type: 'text/plain' });
            
            // Create a URL for the blob
            const url = URL.createObjectURL(blob);
            
            // Create a link element
            const link = document.createElement('a');
            link.href = url;
            link.download = 'character-first-names.txt';
            
            // Append the link to the body
            document.body.appendChild(link);
            
            // Click the link to download the file
            link.click();
            
            // Remove the link from the body
            document.body.removeChild(link);
            
            // Revoke the URL
            URL.revokeObjectURL(url);
            
            Core.showToast('First names extracted successfully', 'success');
        } catch (error) {
            console.error('Error extracting first names:', error);
            Core.showToast('Error extracting first names: ' + error.message, 'error');
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
        
        // Hide the results container
        const resultsContainer = document.querySelector('#analyze-book-tab .analysis-results-container');
        if (resultsContainer) {
            resultsContainer.classList.remove('active');
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
        
        // Disable all report buttons
        const reportButtons = [
            'generateReportBtn',
            'generateDocxReportBtn',
            'extractFirstNamesBtn'
        ];
        
        reportButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = true;
                button.classList.add('disabled');
            }
        });
        
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
        
        // Very simple extraction of capitalized words
        const words = text.match(/\b[A-Z][a-z]+\b/g) || [];
        const wordCounts = {};
        
        words.forEach(word => {
            if (wordCounts[word]) {
                wordCounts[word]++;
            } else {
                wordCounts[word] = 1;
            }
        });
        
        // Convert to array and sort by count
        const characters = Object.keys(wordCounts).map(word => {
            return {
                fullName: word,
                firstName: word,
                lastName: '',
                title: '',
                mentions: wordCounts[word],
                variants: []
            };
        });
        
        return characters.sort((a, b) => b.mentions - a.mentions);
    }

    // Remove the old function since we're embedding it directly
    BookAnalysis.createOverrideDuplicatesCheckbox = null;

    console.log('NameExtractor integration initialized successfully');
})();