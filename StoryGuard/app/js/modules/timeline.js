/**
 * Timeline management functionality for Story Database
 * Handles timeline visualization and events
 */

// Store current filter values
const timelineFilters = {
    series: 'all',
    book: 'all',
    character: 'all'
};

// Display timeline
function displayTimeline() {
    const timelineContent = document.getElementById('timelineContent');
    if (!timelineContent) return;
    
    // Clear previous content
    timelineContent.innerHTML = '';
    
    // Get filter values - ensure we're using the correct element IDs
    const filterSeries = timelineFilters.series;
    const filterBook = timelineFilters.book;
    const filterCharacter = timelineFilters.character;
    
    console.log('Applying timeline filters:', { filterSeries, filterBook, filterCharacter });
    
    // Create timeline events from character data
    const timelineEvents = [];
    
    // Add character creation events
    characters.forEach(char => {
        if (char.book) {
            timelineEvents.push({
                character: `${char.firstName} ${char.lastName}`,
                book: char.book,
                series: char.series || 'Unknown Series',
                event: `${char.firstName} ${char.lastName} appears`,
                image: char.image,
                id: char.id
            });
        }
    });
    
    // Add plot events if available
    if (typeof plots !== 'undefined' && plots.length > 0) {
        plots.forEach(plot => {
            if (plot.book) {
                timelineEvents.push({
                    plot: plot.title,
                    book: plot.book,
                    series: plot.series || 'Unknown Series',
                    event: plot.title,
                    type: plot.type,
                    id: plot.id
                });
            }
        });
    }
    
    // Apply filters
    let filteredEvents = timelineEvents;
    
    if (filterSeries !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.series === filterSeries);
    }
    
    if (filterBook !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.book === filterBook);
    }
    
    if (filterCharacter !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.character === filterCharacter);
    }
    
    // Log filtered events for debugging
    console.log(`Timeline filtered events: ${filteredEvents.length} events after filtering`);
    
    // Sort by series and book
    filteredEvents.sort((a, b) => {
        if (a.series !== b.series) {
            return a.series.localeCompare(b.series);
        }
        return a.book.localeCompare(b.book);
    });
    
    if (filteredEvents.length === 0) {
        timelineContent.innerHTML = '<div class="no-data">No timeline data available. Add characters with book information to see them on the timeline.</div>';
        return;
    }
    
    // Group by series
    const seriesGroups = {};
    filteredEvents.forEach(event => {
        if (!seriesGroups[event.series]) {
            seriesGroups[event.series] = [];
        }
        seriesGroups[event.series].push(event);
    });
    
    // Create timeline
    Object.entries(seriesGroups).forEach(([series, events]) => {
        const seriesHeader = document.createElement('h3');
        seriesHeader.textContent = series;
        seriesHeader.className = 'timeline-series-header';
        timelineContent.appendChild(seriesHeader);
        
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        
        // Add timeline line
        const timelineLine = document.createElement('div');
        timelineLine.className = 'timeline-line';
        timelineContainer.appendChild(timelineLine);
        
        // Group events by book
        const bookGroups = {};
        events.forEach(event => {
            if (!bookGroups[event.book]) {
                bookGroups[event.book] = [];
            }
            bookGroups[event.book].push(event);
        });
        
        // Create timeline items
        Object.entries(bookGroups).forEach(([book, bookEvents], bookIndex) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.classList.add(bookIndex % 2 === 0 ? 'left' : 'right');
            
            const timelineContent = document.createElement('div');
            timelineContent.className = 'timeline-content';
            
            const bookTitle = document.createElement('h4');
            bookTitle.textContent = book;
            timelineContent.appendChild(bookTitle);
            
            // Add characters in this book
            const charactersList = document.createElement('div');
            charactersList.className = 'timeline-characters';
            
            // Group by type (character or plot)
            const characterEvents = bookEvents.filter(event => event.character);
            const plotEvents = bookEvents.filter(event => event.plot);
            
            // Add characters
            if (characterEvents.length > 0) {
                const charactersHeader = document.createElement('h5');
                charactersHeader.textContent = 'Characters';
                charactersList.appendChild(charactersHeader);
                
                characterEvents.forEach(event => {
                    const characterItem = document.createElement('div');
                    characterItem.className = 'timeline-character';
                    characterItem.setAttribute('data-id', event.id || '');
                    characterItem.onclick = function() {
                        try {
                            // Find the character index by ID
                            const charIndex = characters.findIndex(c => c.id === event.id);
                            if (charIndex !== -1) {
                                // Use the detailed character view
                                if (typeof Characters !== 'undefined' && typeof Characters.showCharacterDetails === 'function') {
                                    Characters.showCharacterDetails(charIndex);
                                } else if (typeof window.Characters !== 'undefined' && typeof window.Characters.showCharacterDetails === 'function') {
                                    window.Characters.showCharacterDetails(charIndex);
                                } else {
                                    console.error('Characters.showCharacterDetails function not available');
                                }
                            } else {
                                console.error('Character not found with ID:', event.id);
                            }
                        } catch (error) {
                            console.error('Error showing character details:', error);
                        }
                    };
                    
                    if (event.image) {
                        const img = document.createElement('img');
                        img.src = event.image;
                        img.alt = event.character;
                        img.width = 40;
                        img.height = 40;
                        characterItem.appendChild(img);
                    }
                    
                    const characterName = document.createElement('span');
                    characterName.textContent = event.character;
                    characterItem.appendChild(characterName);
                    
                    charactersList.appendChild(characterItem);
                });
            }
            
            // Add plots
            if (plotEvents.length > 0) {
                const plotsHeader = document.createElement('h5');
                plotsHeader.textContent = 'Plot Points';
                charactersList.appendChild(plotsHeader);
                
                plotEvents.forEach(event => {
                    const plotItem = document.createElement('div');
                    plotItem.className = 'timeline-plot';
                    plotItem.setAttribute('data-id', event.id || '');
                    plotItem.onclick = function() {
                        try {
                            // Make sure Plots module is available globally
                            if (typeof window.Plots === 'undefined' && typeof Plots !== 'undefined') {
                                window.Plots = Plots;
                            }
                            
                            // Try to find the plot by ID
                            if (typeof window.Plots !== 'undefined' && typeof window.Plots.showPlotDetails === 'function') {
                                window.Plots.showPlotDetails(event.id);
                            } else if (typeof Plots !== 'undefined' && typeof Plots.showPlotDetails === 'function') {
                                Plots.showPlotDetails(event.id);
                            } else {
                                console.error('Plots module not available to show plot details');
                            }
                        } catch (error) {
                            console.error('Error displaying plot details:', error);
                        }
                    };
                    
                    const plotTypeIcon = document.createElement('span');
                    plotTypeIcon.className = 'plot-type-icon';
                    plotTypeIcon.textContent = getPlotTypeIcon(event.type);
                    plotItem.appendChild(plotTypeIcon);
                    
                    const plotTitle = document.createElement('span');
                    plotTitle.textContent = event.plot;
                    plotItem.appendChild(plotTitle);
                    
                    charactersList.appendChild(plotItem);
                });
            }
            
            timelineContent.appendChild(charactersList);
            timelineItem.appendChild(timelineContent);
            timelineContainer.appendChild(timelineItem);
        });
        
        timelineContent.appendChild(timelineContainer);
    });
    
    // Update filter dropdowns
    updateTimelineFilterDropdowns();
}

// Get icon for plot type
function getPlotTypeIcon(type) {
    const iconMap = {
        'Plot Point': '📌',
        'Story Arc': '🔄',
        'Chapter': '📖',
        'Scene': '🎬',
        'Conflict': '⚔️',
        'Resolution': '🏆',
        'Twist': '😲',
        'Subplot': '📝'
    };
    
    return iconMap[type] || '📍';
}

// Update timeline filter dropdowns
function updateTimelineFilterDropdowns() {
    // Series filter
    const seriesFilter = document.getElementById('timelineFilterSeries');
    if (seriesFilter) {
        // Save current selection
        const currentSeries = seriesFilter.value;
        
        // Clear options except first one
        while (seriesFilter.options.length > 1) {
            seriesFilter.remove(1);
        }
        
        // Get unique series
        const uniqueSeries = new Set();
        characters.forEach(char => {
            if (char.series) {
                uniqueSeries.add(char.series);
            }
        });
        
        if (typeof plots !== 'undefined') {
            plots.forEach(plot => {
                if (plot.series) {
                    uniqueSeries.add(plot.series);
                }
            });
        }
        
        // Add options
        Array.from(uniqueSeries).sort().forEach(series => {
            const option = document.createElement('option');
            option.value = series;
            option.textContent = series;
            seriesFilter.appendChild(option);
        });
        
        // Restore selection if possible
        if (Array.from(seriesFilter.options).some(opt => opt.value === currentSeries)) {
            seriesFilter.value = currentSeries;
        }
    }
    
    // Book filter
    const bookFilter = document.getElementById('timelineFilterBook');
    if (bookFilter) {
        // Save current selection
        const currentBook = bookFilter.value;
        
        // Clear options except first one
        while (bookFilter.options.length > 1) {
            bookFilter.remove(1);
        }
        
        // Get unique books
        const uniqueBooks = new Set();
        characters.forEach(char => {
            if (char.book) {
                uniqueBooks.add(char.book);
            }
        });
        
        if (typeof plots !== 'undefined') {
            plots.forEach(plot => {
                if (plot.book) {
                    uniqueBooks.add(plot.book);
                }
            });
        }
        
        // Add options
        Array.from(uniqueBooks).sort().forEach(book => {
            const option = document.createElement('option');
            option.value = book;
            option.textContent = book;
            bookFilter.appendChild(option);
        });
        
        // Restore selection if possible
        if (Array.from(bookFilter.options).some(opt => opt.value === currentBook)) {
            bookFilter.value = currentBook;
        }
    }
    
    // Character filter
    const characterFilter = document.getElementById('timelineFilterCharacter');
    if (characterFilter) {
        // Save current selection
        const currentCharacter = characterFilter.value;
        
        // Clear options except first one
        while (characterFilter.options.length > 1) {
            characterFilter.remove(1);
        }
        
        // Get characters with book info
        const charactersWithBooks = characters.filter(char => char.book);
        
        // Add options
        charactersWithBooks.sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.trim();
            const nameB = `${b.firstName} ${b.lastName}`.trim();
            return nameA.localeCompare(nameB);
        }).forEach(char => {
            const fullName = `${char.firstName} ${char.lastName}`.trim();
            const option = document.createElement('option');
            option.value = fullName;
            option.textContent = fullName;
            characterFilter.appendChild(option);
        });
        
        // Restore selection if possible
        if (Array.from(characterFilter.options).some(opt => opt.value === currentCharacter)) {
            characterFilter.value = currentCharacter;
        }
    }
}

// Function to apply filters from the UI
function applyFiltersFromUI() {
    // Get filter values from the UI
    timelineFilters.series = document.getElementById('timelineFilterSeries')?.value || 'all';
    timelineFilters.book = document.getElementById('timelineFilterBook')?.value || 'all';
    timelineFilters.character = document.getElementById('timelineFilterCharacter')?.value || 'all';
    
    // Display timeline with new filters
    displayTimeline();
}

// Initialize timeline
function initializeTimeline() {
    // Set up filter change handlers
    const filterSeries = document.getElementById('timelineFilterSeries');
    const filterBook = document.getElementById('timelineFilterBook');
    const filterCharacter = document.getElementById('timelineFilterCharacter');
    const applyFiltersBtn = document.getElementById('applyTimelineFilters');
    
    // Remove automatic filter application on dropdown change
    // Instead, apply filters only when the Apply Filters button is clicked
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFiltersFromUI);
    }
    
    // Display timeline initially
    displayTimeline();
}

// Export timeline functions
window.Timeline = {
    displayTimeline,
    updateTimelineFilterDropdowns,
    initializeTimeline,
    applyFiltersFromUI
};