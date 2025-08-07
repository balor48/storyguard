/**
 * Name Extractor Utility
 * Handles character name extraction from book files using various detection methods
 */

// Make sure the NameExtractor is initialized immediately
window.NameExtractor = {
    // Lists of different types of titles to handle first/last name extraction properly
    titleCategories: {
        // Military, law enforcement titles typically use LAST names
        lastNameTitles: [
            "Captain", "Capt", "Lieutenant", "Lt", "General", "Gen", "Colonel", "Col",
            "Major", "Maj", "Sergeant", "Sgt", "Corporal", "Corp", "Officer", "Constable", 
            "Detective", "Inspector", "Chief", "Commander", "Admiral", "Private", "Pvt",
            "Ensign", "Commodore", "Marshal", "Sheriff", "Agent", "Trooper", "Deputy"
        ],
        // Academic and religious titles could go either way, but often use LAST names
        ambiguousTitles: [
            "Dr", "Doctor", "Professor", "Prof", "Rev", "Reverend", "Judge", "Justice",
            "Principal", "Dean", "President", "Director", "Senator", "Councillor", "Minister"
        ],
        // Nobility and honorific titles often use FIRST names or full names
        firstNameTitles: [
            "Sir", "Dame", "King", "Queen", "Prince", "Princess", "Duke", "Duchess", 
            "Baron", "Baroness", "Count", "Countess", "Earl", "Lord", "Lady", "Master"
        ],
        // Formal titles almost always use LAST names unless a full name follows
        formalTitles: [
            "Mr", "Mrs", "Ms", "Miss", "Mx"
        ]
    },
    
    // Main API method used for character extraction
    extractCharacters: function(text) {
        console.log('NameExtractor.extractCharacters called with text length:', text.length);
        // Get selected options from the UI
        const options = {
            dialogueAttribution: document.getElementById('dialogueAttribution') ?
                               document.getElementById('dialogueAttribution').checked : true,
            namedEntityRecognition: document.getElementById('namedEntityRecognition') ?
                                  document.getElementById('namedEntityRecognition').checked : true,
            capitalizedWordAnalysis: document.getElementById('capitalizedWordAnalysis') ?
                                   document.getElementById('capitalizedWordAnalysis').checked : true,
            frequencyAnalysis: document.getElementById('frequencyAnalysis2') ?
                              document.getElementById('frequencyAnalysis2').checked : true,
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
        
        // Delegate to the detailed implementation method
        return this.extractCharactersFromText(text, options);
    },
    
    /**
     * Extracts character names from text content using selected patterns
     * @param {string} text - The full text content of the book
     * @param {Object} options - Selected extraction options
     * @returns {Array} Extracted characters with name components and mentions
     */
    extractCharactersFromText: function(text, options) {
        const characterMentions = {};
        
        console.log('NameExtractor: Starting extraction with options:', options);
        
        // Always run dialogue attribution if selected
        if (options.dialogueAttribution) {
            console.log('NameExtractor: Running dialogue attribution');
            this.extractFromDialogue(text, characterMentions);
        }
        
        // Run named entity recognition if selected
        if (options.namedEntityRecognition) {
            console.log('NameExtractor: Running named entity recognition');
            this.extractNamedEntities(text, characterMentions);
        }
        
        // Run capitalized word analysis if selected
        if (options.capitalizedWordAnalysis) {
            console.log('NameExtractor: Running capitalized word analysis');
            this.extractCapitalizedWords(text, characterMentions);
        }
        
        // Run frequency analysis if selected
        if (options.frequencyAnalysis) {
            console.log('NameExtractor: Running frequency analysis');
            this.analyzeFrequency(text, characterMentions);
        }
        
        // Run direct address pattern if selected
        if (options.directAddressPattern) {
            console.log('NameExtractor: Running direct address pattern detection');
            this.extractDirectAddress(text, characterMentions);
        }
        
        // Run possessive form detection if selected
        if (options.possessiveFormDetection) {
            console.log('NameExtractor: Running possessive form detection');
            this.extractPossessiveForms(text, characterMentions);
        }
        
        // Run character introduction if selected
        if (options.characterIntroduction) {
            console.log('NameExtractor: Running character introduction detection');
            this.extractCharacterIntroductions(text, characterMentions);
        }
        
        // Filter common words if selected
        if (options.filterCommonWords) {
            console.log('NameExtractor: Filtering common words');
            this.filterCommonWords(characterMentions);
        }
        
        // Combine name variants if selected
        if (options.combineNameVariants) {
            console.log('NameExtractor: Combining name variants');
            characterMentions = this.combineNameVariants(characterMentions);
        }
        
        console.log('NameExtractor: Found', Object.keys(characterMentions).length, 'potential characters');
        
        // Process each character to extract first/last names and title
        return this.processCharacterNames(characterMentions, options.titleDetection);
    },
    
    /**
     * Extract character names from dialogue patterns
     */
    extractFromDialogue: function(text, characterMentions) {
        // List of dialog indicators (verbs that often follow character names)
        const dialogIndicators = [
            'said', 'whispered', 'asked', 'replied', 'shouted', 'murmured',
            'exclaimed', 'responded', 'called', 'muttered', 'answered', 'stated',
            'declared', 'announced', 'remarked', 'noted', 'added', 'continued',
            'interrupted', 'inquired', 'yelled', 'explained', 'insisted', 'sighed',
            'laughed', 'cried', 'groaned', 'argued', 'agreed', 'disagreed'
        ];
        
        // Create a regex pattern for all indicators
        const indicatorPattern = dialogIndicators.join('|');
        
        // Pattern for: capitalized name/names followed by dialog indicator
        // Example: "John said", "Mary Smith whispered", etc.
        const beforePattern = new RegExp(`\\b([A-Z][a-zA-Z]*(?:\\s[A-Z][a-zA-Z]*){0,3})\\s(${indicatorPattern})\\b`, 'gi');
        
        // Pattern for: dialog indicator followed by capitalized name/names
        // Example: "said John", "whispered Mary Smith", etc.
        const afterPattern = new RegExp(`\\b(${indicatorPattern})\\s([A-Z][a-zA-Z]*(?:\\s[A-Z][a-zA-Z]*){0,3})\\b`, 'gi');
        
        // Find names before dialog indicators
        let match;
        let beforeCount = 0;
        let afterCount = 0;
        
        while ((match = beforePattern.exec(text)) !== null) {
            const fullName = match[1].trim();
            if (this.isLikelyCharacterName(fullName)) {
                if (!characterMentions[fullName]) {
                    characterMentions[fullName] = { mentions: 0 };
                }
                characterMentions[fullName].mentions++;
                beforeCount++;
            }
        }
        
        // Find names after dialog indicators
        while ((match = afterPattern.exec(text)) !== null) {
            const fullName = match[2].trim();
            if (this.isLikelyCharacterName(fullName)) {
                if (!characterMentions[fullName]) {
                    characterMentions[fullName] = { mentions: 0 };
                }
                characterMentions[fullName].mentions++;
                afterCount++;
            }
        }
        
        console.log(`NameExtractor: Dialogue Attribution found ${beforeCount} names before dialogue and ${afterCount} names after dialogue`);
    },
    
    /**
     * Extract named entities (simplified approach)
     */
    extractNamedEntities: function(text, characterMentions) {
        // Very simplified named entity extraction
        // Look for capitalized words that aren't at the start of sentences
        const namedEntityPattern = /(?<=[.!?]\s+|\n\s*)[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3}\b/g;
        
        let match;
        let count = 0;
        
        while ((match = namedEntityPattern.exec(text)) !== null) {
            const fullName = match[0].trim();
            if (this.isLikelyCharacterName(fullName)) {
                if (!characterMentions[fullName]) {
                    characterMentions[fullName] = { mentions: 0 };
                }
                characterMentions[fullName].mentions++;
                count++;
            }
        }
        
        console.log(`NameExtractor: Named Entity Recognition found ${count} potential names`);
    },
    
    /**
     * Extract all capitalized words as potential character names
     */
    extractCapitalizedWords: function(text, characterMentions) {
        // Look for any capitalized words
        const capitalizedPattern = /\b[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3}\b/g;
        
        let match;
        let count = 0;
        
        while ((match = capitalizedPattern.exec(text)) !== null) {
            const fullName = match[0].trim();
            if (this.isLikelyCharacterName(fullName)) {
                if (!characterMentions[fullName]) {
                    characterMentions[fullName] = { mentions: 0 };
                }
                characterMentions[fullName].mentions++;
                count++;
            }
        }
        
        console.log(`NameExtractor: Capitalized Word Analysis found ${count} potential names`);
    },
    
    /**
     * Extract character names from direct address patterns
     */
    extractDirectAddress: function(text, characterMentions) {
        // Pattern for direct address in quotes or with commas
        // Examples: "Hello, John", "John, please come here"
        const directAddressPatterns = [
            /["'](?:[^,"']+),\s+([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3})["']/g,
            /\b([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3}),\s+(?:please|would you|could you|can you)/gi
        ];
        
        let totalCount = 0;
        
        directAddressPatterns.forEach((pattern, index) => {
            let match;
            let count = 0;
            
            while ((match = pattern.exec(text)) !== null) {
                const fullName = match[1].trim();
                if (this.isLikelyCharacterName(fullName)) {
                    if (!characterMentions[fullName]) {
                        characterMentions[fullName] = { mentions: 0 };
                    }
                    characterMentions[fullName].mentions++;
                    count++;
                }
            }
            
            totalCount += count;
            console.log(`NameExtractor: Direct Address Pattern ${index+1} found ${count} potential names`);
        });
        
        console.log(`NameExtractor: Direct Address Pattern found ${totalCount} total potential names`);
    },
    
    /**
     * Extract character names from possessive forms
     */
    extractPossessiveForms: function(text, characterMentions) {
        // Pattern for possessive forms: "John's", "Mary Smith's"
        const possessivePattern = /\b([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3})['']s\b/g;
        
        let match;
        let count = 0;
        
        while ((match = possessivePattern.exec(text)) !== null) {
            const fullName = match[1].trim();
            if (this.isLikelyCharacterName(fullName)) {
                if (!characterMentions[fullName]) {
                    characterMentions[fullName] = { mentions: 0 };
                }
                characterMentions[fullName].mentions++;
                count++;
            }
        }
        
        console.log(`NameExtractor: Possessive Form Detection found ${count} potential names`);
    },
    
    /**
     * Extract character names from introduction patterns
     */
    extractCharacterIntroductions: function(text, characterMentions) {
        // Patterns for character introductions
        const introPatterns = [
            /\b(?:a|the)\s+(?:man|woman|boy|girl|person|gentleman|lady)\s+named\s+([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3})\b/gi,
            /\b([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3})\s+was\s+(?:a|an|the)\s+(?:man|woman|boy|girl|person|gentleman|lady)\b/gi,
            /\bintroduced\s+(?:(?:him|her)self|as)\s+([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3})\b/gi,
            /\bcalled\s+(?:him|her)self\s+([A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*){0,3})\b/gi
        ];
        
        let totalCount = 0;
        
        introPatterns.forEach((pattern, index) => {
            let match;
            let count = 0;
            
            while ((match = pattern.exec(text)) !== null) {
                const fullName = match[1].trim();
                if (this.isLikelyCharacterName(fullName)) {
                    if (!characterMentions[fullName]) {
                        characterMentions[fullName] = { mentions: 0 };
                    }
                    characterMentions[fullName].mentions++;
                    count++;
                }
            }
            
            totalCount += count;
            console.log(`NameExtractor: Character Introduction Pattern ${index+1} found ${count} potential names`);
        });
        
        console.log(`NameExtractor: Character Introduction found ${totalCount} total potential names`);
    },
    
    /**
     * Filter out common words that might be mistaken for character names
     */
    filterCommonWords: function(characterMentions) {
        const commonWords = [
            // Days of the week
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
            // Months
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
            // Common place names
            "America", "England", "London", "Paris", "New York", "Chicago", "Boston",
            // Common words often capitalized
            "The", "I", "A", "An", "And", "But", "Or", "For", "Nor", "So", "Yet",
            "Chapter", "Book", "Volume", "Part", "Section", "Page", "House", "Street",
            // Directions
            "North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest",
            
            // Pronouns and articles (critical to filter out)
            "We", "You", "They", "He", "She", "It", "Me", "My", "Mine", "Your", "Yours",
            "His", "Her", "Hers", "Their", "Theirs", "Our", "Ours", "Its", "This", "That",
            "These", "Those", "Am", "Is", "Are", "Was", "Were", "Be", "Been", "Being",
            
            // Common verbs and prepositions
            "Do", "Does", "Did", "Have", "Has", "Had", "Can", "Could", "Will", "Would",
            "Should", "May", "Might", "Must", "Shall", "About", "Above", "Across", "After",
            "Against", "Along", "Among", "Around", "At", "Before", "Behind", "Below",
            "Beneath", "Beside", "Between", "Beyond", "By", "Down", "During", "Except",
            "From", "In", "Inside", "Into", "Like", "Near", "Of", "Off", "On", "Out",
            "Outside", "Over", "Past", "Since", "Through", "Throughout", "To", "Toward",
            "Under", "Underneath", "Until", "Up", "Upon", "With", "Within", "Without",
            
            // Question words
            "What", "When", "Where", "Why", "Who", "Whom", "Whose", "Which", "How",
            
            // Common adverbs
            "Very", "Really", "Quite", "Rather", "Too", "Enough", "Just", "Almost",
            "Also", "Even", "Still", "Already", "Yet", "Now", "Then", "Here", "There",
            "Always", "Never", "Often", "Sometimes", "Seldom", "Usually", "Again",
            
            // Common adjectives
            "Good", "Bad", "Big", "Small", "Old", "New", "High", "Low", "Long", "Short",
            "Many", "Few", "Much", "Little", "Same", "Different", "Other", "Another",
            "Such", "Next", "Last", "First", "Second", "Third", "All", "Any", "Each",
            "Every", "Some", "No", "Only", "Own", "Sure", "More", "Most", "Less", "Least",
            
            // Additional 500+ words from the comprehensive list
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
            
            // Additional words from user's second and third lists
            "My", "If", "Oh", "Ah", "Its", "Whatever", "While", "Maybe", "Yes", "Three", "Like",
            "Do", "All", "Cost", "Loot", "Usage", "Which", "Is", "Where", "Did", "Think",
            "Feel", "Ready", "Alright", "Map", "Show", "Who", "Got", "Four", "Any", "Please",
            "Up", "Five", "Tell", "Run", "Look", "Move", "Had", "Over", "Sure"
        ];
        
        // Convert all common words to lowercase for case-insensitive matching
        const lowercaseCommonWords = commonWords.map(word => word.toLowerCase());
        
        // Create a Set for faster lookups
        const commonWordsSet = new Set(lowercaseCommonWords);
        
        // Filter out common words (case-insensitive)
        Object.keys(characterMentions).forEach(name => {
            // Check if the name (case-insensitive) is in the common words list
            if (commonWordsSet.has(name.toLowerCase())) {
                console.log(`Filtering out common word: ${name}`);
                delete characterMentions[name];
            }
        });
    },
    
    /**
     * Combine variants of the same name
     */
    combineNameVariants: function(characterMentions) {
        const combinedMentions = { ...characterMentions };
        const processedNames = new Set();
        
        // Map of common nicknames to full names
        const nicknameMap = {
            "Bob": "Robert",
            "Rob": "Robert",
            "Bobby": "Robert",
            "Jim": "James",
            "Jimmy": "James",
            "Bill": "William",
            "Will": "William",
            "Billy": "William",
            "Tom": "Thomas",
            "Tommy": "Thomas",
            "Mike": "Michael",
            "Mikey": "Michael",
            "Dave": "David",
            "Davey": "David",
            "Joe": "Joseph",
            "Joey": "Joseph",
            "Chris": "Christopher",
            "Kate": "Katherine",
            "Katie": "Katherine",
            "Kathy": "Katherine",
            "Beth": "Elizabeth",
            "Liz": "Elizabeth",
            "Lizzy": "Elizabeth",
            "Eliza": "Elizabeth",
            "Maggie": "Margaret",
            "Peggy": "Margaret",
            "Meg": "Margaret",
            "Alex": "Alexander",
            "Al": "Albert",
            "Dan": "Daniel",
            "Danny": "Daniel",
            "Nate": "Nathan",
            "Nat": "Nathaniel",
            "Sam": "Samuel",
            "Sammy": "Samuel",
            "Tony": "Anthony",
            "Dick": "Richard",
            "Rick": "Richard",
            "Ricky": "Richard",
            "Rich": "Richard",
            "Gabe": "Gabriel",
            "Gus": "Augustus",
            "Vicky": "Victoria",
            "Vic": "Victor",
            "Ollie": "Oliver",
            "Ed": "Edward",
            "Eddie": "Edward",
            "Ted": "Theodore",
            "Teddy": "Theodore",
            "Theo": "Theodore",
            "Jon": "Jonathan",
            "Jonny": "Jonathan",
            "Jack": "John",
            "Johnny": "John",
            "Matt": "Matthew",
            "Matty": "Matthew",
            "Nick": "Nicholas",
            "Pat": "Patrick",
            "Patty": "Patricia",
            "Pam": "Pamela",
            "Ray": "Raymond",
            "Ronnie": "Ronald",
            "Ron": "Ronald",
            "Steph": "Stephanie",
            "Steve": "Stephen",
            "Stevie": "Stephen",
            "Sue": "Susan",
            "Susie": "Susan",
            "Suzy": "Susan",
            "Zach": "Zachary",
            "Zack": "Zachary"
        };
        
        // First, try to combine full names with first names
        Object.keys(combinedMentions).forEach(fullName => {
            if (processedNames.has(fullName)) return;
            
            const nameParts = fullName.split(' ');
            if (nameParts.length <= 1) return; // Skip single-word names for this part
            
            const firstName = nameParts[0];
            
            // Check if the first name exists as a standalone entry
            if (combinedMentions[firstName] && !processedNames.has(firstName)) {
                // Combine mentions
                combinedMentions[fullName].mentions += combinedMentions[firstName].mentions;
                // Mark the first name as processed
                processedNames.add(firstName);
                // Store the variant
                if (!combinedMentions[fullName].variants) {
                    combinedMentions[fullName].variants = [];
                }
                combinedMentions[fullName].variants.push(firstName);
                // Delete the first name entry
                delete combinedMentions[firstName];
            }
        });
        
        // Then, try to combine nicknames with full names
        Object.keys(combinedMentions).forEach(name => {
            if (processedNames.has(name)) return;
            
            const nameParts = name.split(' ');
            const firstName = nameParts[0];
            
            // Check if this is a nickname and has a full name mapping
            if (nicknameMap[firstName]) {
                const fullFirstName = nicknameMap[firstName];
                
                // Look for a matching full name entry
                Object.keys(combinedMentions).forEach(otherName => {
                    if (otherName === name || processedNames.has(otherName)) return;
                    
                    const otherNameParts = otherName.split(' ');
                    const otherFirstName = otherNameParts[0];
                    
                    // If full name found, combine mentions
                    if (otherFirstName === fullFirstName) {
                        // Use the full name as the main entry
                        combinedMentions[otherName].mentions += combinedMentions[name].mentions;
                        // Mark the nickname as processed
                        processedNames.add(name);
                        // Store the variant
                        if (!combinedMentions[otherName].variants) {
                            combinedMentions[otherName].variants = [];
                        }
                        combinedMentions[otherName].variants.push(name);
                        // Delete the nickname entry
                        delete combinedMentions[name];
                    }
                });
            }
        });
        
        return combinedMentions;
    },
    
    /**
     * Checks if a string is likely a character name
     * @param {string} name - The potential character name
     * @returns {boolean} True if it's likely a character name
     */
    isLikelyCharacterName: function(name) {
        // Skip very short strings (less than 3 characters)
        if (name.length < 3) return false;
        
        // Skip if it doesn't start with a capital letter
        if (!/^[A-Z]/.test(name)) return false;
        
        // Skip all-caps words (likely abbreviations or emphasis)
        if (name === name.toUpperCase() && name.length > 1) return false;
        
        // Check for numbers or special characters (unlikely in names)
        if (/[0-9@#$%^&*()_+=\[\]{}|\\;:"<>?]/.test(name)) return false;
        
        // Check against common English words that are often capitalized
        const commonCapitalizedWords = [
            "The", "A", "An", "And", "But", "Or", "For", "Nor", "So", "Yet",
            "In", "On", "At", "To", "By", "As", "Of", "From", "With", "About"
        ];
        if (commonCapitalizedWords.includes(name)) return false;
        
        return true;
    },
    
    /**
     * Processes raw character mentions to extract first/last names and titles
     * @param {Object} characterMentions - Raw character mentions object
     * @param {boolean} detectTitles - Whether to detect and process titles
     * @returns {Array} Processed character names with title, first name, last name, and mentions
     */
    processCharacterNames: function(characterMentions, detectTitles) {
        const processedCharacters = [];
        
        // Process each potential character name
        for (const [fullName, data] of Object.entries(characterMentions)) {
            // Split the name into parts
            const nameParts = fullName.split(' ');
            
            // Initialize character data
            const character = {
                fullName: fullName,
                title: '',
                firstName: '',
                lastName: '',
                mentions: data.mentions,
                variants: data.variants || []
            };
            
            // Handle single-word names
            if (nameParts.length === 1) {
                character.firstName = nameParts[0];
                processedCharacters.push(character);
                continue;
            }
            
            // Check if first word is a title (if title detection is enabled)
            if (detectTitles) {
                const firstWord = nameParts[0];
                const possibleTitle = firstWord.replace(/\.$/, ''); // Remove any trailing period
                
                // Check which title category it belongs to
                if (this.isTitleInCategory(possibleTitle, this.titleCategories.lastNameTitles)) {
                    // Military/law enforcement titles - use LAST name
                    character.title = firstWord;
                    
                    if (nameParts.length === 2) {
                        // Format: "Captain Smith"
                        character.lastName = nameParts[1];
                    } else if (nameParts.length >= 3) {
                        // Format: "Captain John Smith" or longer
                        character.firstName = nameParts[1];
                        character.lastName = nameParts.slice(2).join(' ');
                    }
                } 
                else if (this.isTitleInCategory(possibleTitle, this.titleCategories.formalTitles)) {
                    // Formal titles (Mr, Mrs, etc.) - typically use LAST name
                    character.title = firstWord;
                    
                    if (nameParts.length === 2) {
                        // Format: "Mr. Smith"
                        character.lastName = nameParts[1];
                    } else if (nameParts.length >= 3) {
                        // Format: "Mr. John Smith" or longer
                        character.firstName = nameParts[1];
                        character.lastName = nameParts.slice(2).join(' ');
                    }
                }
                else if (this.isTitleInCategory(possibleTitle, this.titleCategories.firstNameTitles)) {
                    // Nobility titles - often use FIRST name or full name
                    character.title = firstWord;
                    
                    if (nameParts.length === 2) {
                        // Format: "Lady Mary"
                        character.firstName = nameParts[1];
                    } else if (nameParts.length >= 3) {
                        // Format: "Lady Mary Smith" or longer
                        character.firstName = nameParts[1];
                        character.lastName = nameParts.slice(2).join(' ');
                    }
                }
                else if (this.isTitleInCategory(possibleTitle, this.titleCategories.ambiguousTitles)) {
                    // Ambiguous titles could go either way
                    character.title = firstWord;
                    
                    if (nameParts.length === 2) {
                        // Format: "Professor Smith" - assume last name
                        character.lastName = nameParts[1];
                    } else if (nameParts.length >= 3) {
                        // Format: "Professor John Smith" or longer
                        character.firstName = nameParts[1];
                        character.lastName = nameParts.slice(2).join(' ');
                    }
                }
                else {
                    // No title - standard name format
                    this.processStandardName(character, nameParts);
                }
            } else {
                // No title detection - standard name format
                this.processStandardName(character, nameParts);
            }
            
            processedCharacters.push(character);
        }
        
        // Sort by mentions (most mentioned first)
        return processedCharacters.sort((a, b) => b.mentions - a.mentions);
    },
    
    /**
     * Process a standard name format (no title)
     */
    processStandardName: function(character, nameParts) {
        character.firstName = nameParts[0];
        
        if (nameParts.length === 2) {
            // Format: "John Smith"
            character.lastName = nameParts[1];
        } else if (nameParts.length > 2) {
            // Format: "John Alan Smith" or longer - assume last word is surname
            character.lastName = nameParts[nameParts.length - 1];
            // If there are more parts, add them to firstName (middle names)
            if (nameParts.length > 2) {
                character.firstName += ' ' + nameParts.slice(1, nameParts.length - 1).join(' ');
            }
        }
    },
    
    /**
     * Checks if a title is in a specific category
     * @param {string} title - The title to check
     * @param {Array} category - Array of titles in the category
     * @returns {boolean} True if the title is in the category
     */
    isTitleInCategory: function(title, category) {
        return category.some(t => 
            t.toLowerCase() === title.toLowerCase() || 
            t.toLowerCase() + '.' === title.toLowerCase()
        );
    },
    
    /**
     * Analyze text for frequency of capitalized words to identify potential character names
     */
    analyzeFrequency: function(text, characterMentions) {
        console.log('NameExtractor: Running frequency analysis');
        
        // Get all capitalized words
        const capitalizedWords = text.match(/\b[A-Z][a-zA-Z]*\b/g) || [];
        
        // Count occurrences of each word
        const wordCounts = {};
        capitalizedWords.forEach(word => {
            if (this.isLikelyCharacterName(word)) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
        
        // Filter to words that appear frequently (more than 3 times)
        // and are likely to be character names
        const frequentWords = Object.entries(wordCounts)
            .filter(([word, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1]);
        
        // Add to character mentions
        let addedCount = 0;
        frequentWords.forEach(([word, count]) => {
            if (!characterMentions[word]) {
                characterMentions[word] = { mentions: 0 };
                addedCount++;
            }
            characterMentions[word].mentions += count;
        });
        
        console.log(`NameExtractor: Frequency Analysis found ${addedCount} new potential names from ${frequentWords.length} frequent words`);
    },

    // Add titles to the title detection logic
    detectTitles: function(name) {
        // Common titles and honorifics
        const titles = [
            'Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Professor', 'Sir', 'Dame', 'Lord',
            'Lady', 'Captain', 'Capt', 'Lieutenant', 'Lt', 'Sergeant', 'Sgt', 'General',
            'Admiral', 'Colonel', 'Major', 'Commander', 'Officer', 'Reverend', 'Rev',
            'Father', 'Sister', 'Brother', 'Master', 'Mayor', 'Old', 'Elder', 'Chief',
            'King', 'Queen', 'Prince', 'Princess', 'Duke', 'Duchess', 'Baron', 'Baroness',
            'Count', 'Countess', 'Emperor', 'Empress', 'President', 'Governor', 'Chancellor',
            'Judge', 'Justice', 'Senator', 'Councillor', 'Ambassador', 'Honorable', 'Hon'
        ];
        
        // Check if name starts with a title
        let title = '';
        let nameWithoutTitle = name;
        
        for (const t of titles) {
            // Check for title with or without a period
            const patterns = [
                new RegExp(`^${t}\\s+`, 'i'),
                new RegExp(`^${t}\\.\\s+`, 'i')
            ];
            
            for (const pattern of patterns) {
                if (pattern.test(name)) {
                    title = name.match(pattern)[0].trim();
                    nameWithoutTitle = name.replace(pattern, '');
                    return { title, nameWithoutTitle };
                }
            }
        }
        
        return { title, nameWithoutTitle };
    },

    /**
     * Improved title detection function to properly detect titles (including Mayor and Old)
     * and separate them from the name
     */
    detectAndSeparateTitles: function(fullName) {
        if (!fullName) return { title: '', firstName: '', lastName: '' };
        
        // List of all possible titles - make sure Mayor, Old, Master, Lady are included
        const allTitles = [
            'Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Professor', 'Sir', 'Dame', 'Lord',
            'Lady', 'Captain', 'Capt', 'Lieutenant', 'Lt', 'Sergeant', 'Sgt', 'General',
            'Admiral', 'Colonel', 'Major', 'Commander', 'Officer', 'Reverend', 'Rev',
            'Father', 'Sister', 'Brother', 'Master', 'Mayor', 'Old', 'Chief',
            'King', 'Queen', 'Prince', 'Princess', 'Duke', 'Duchess', 'Baron', 'Baroness',
            'Count', 'Countess', 'Emperor', 'Empress', 'President', 'Governor', 'Chancellor'
        ];
        
        // Check for title pattern at start of name
        for (const title of allTitles) {
            // Check both with and without period
            const patterns = [
                new RegExp(`^${title}\\s+(.+)$`, 'i'),
                new RegExp(`^${title}\\.\\s+(.+)$`, 'i')
            ];
            
            for (const pattern of patterns) {
                const match = fullName.match(pattern);
                if (match) {
                    // Found a title, now process the remaining name part
                    const nameAfterTitle = match[1].trim();
                    const nameParts = nameAfterTitle.split(/\s+/);
                    
                    // Handle different name patterns
                    if (nameParts.length === 1) {
                        // Just a single name like "Mayor Tom"
                        return {
                            title: fullName.substring(0, fullName.length - nameAfterTitle.length).trim(),
                            firstName: nameParts[0],
                            lastName: ''
                        };
                    } else {
                        // Multiple name parts like "Dr. John Smith"
                        return {
                            title: fullName.substring(0, fullName.length - nameAfterTitle.length).trim(),
                            firstName: nameParts[0],
                            lastName: nameParts.slice(1).join(' ')
                        };
                    }
                }
            }
        }
        
        // If no title found, parse as regular name
        const nameParts = fullName.split(/\s+/);
        if (nameParts.length === 1) {
            return { title: '', firstName: nameParts[0], lastName: '' };
        } else {
            return { title: '', firstName: nameParts[0], lastName: nameParts.slice(1).join(' ') };
        }
    },

    // Add a hook to process character names properly
    processExtractedNames: function(extractedNames) {
        return extractedNames.map(name => {
            // Apply title detection
            const { title, firstName, lastName } = this.detectAndSeparateTitles(name.fullName || name.name);
            
            // Update the name object with the detected parts
            return {
                ...name,
                title: title,
                firstName: firstName,
                lastName: lastName,
                fullName: name.fullName || name.name
            };
        });
    },

    // Add a hook to the extraction process to post-process names
    extract: function(text, options) {
        const extractedNames = this.extractCharactersFromText(text, options);
        return this.processExtractedNames(extractedNames);
    }
};

// Export the NameExtractor object for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NameExtractor;
} 