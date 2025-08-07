/**
 * Title Additions
 * 
 * This file contains additional titles to be recognized in character detection.
 * To integrate these, copy and paste these titles into the name-extractor.js file
 * where titles are defined.
 */

// Common titles to add to the title list:
// Master, Mayor, Old, Lady

// Find the following arrays in name-extractor.js and add the titles:

// 1. For the shorter titles list (usually around line 28-30):
const shortTitles = [
    "Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Prof", "Rev", "Capt", "Cpt", 
    "Lt", "Gen", "Col", "Sgt", "Sir", "Lady", "Lord", "Master", "Mayor", "Old"
];

// 2. For the formal titles list (usually around line 570-580):
const formalTitles = [
    'Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Sir', 'Lady', 'Lord', 'Master', 'Mayor', 'Old'
];

// 3. For the main titles list (usually around line 695-705):
const titles = [
    'Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Professor', 'Sir', 'Dame', 'Lord',
    'Lady', 'Captain', 'Capt', 'Lieutenant', 'Lt', 'Sergeant', 'Sgt', 'General',
    'Admiral', 'Colonel', 'Major', 'Commander', 'Officer', 'Reverend', 'Rev',
    'Father', 'Sister', 'Brother', 'Master', 'Mayor', 'Old', 'Chief',
    'King', 'Queen', 'Prince', 'Princess', 'Duke', 'Duchess', 'Baron', 'Baroness',
    'Count', 'Countess', 'Emperor', 'Empress', 'President', 'Governor', 'Chancellor'
];

/**
 * Instructions:
 * 
 * 1. Open name-extractor.js file in your editor
 * 2. Search for title definitions (look for arrays containing "Mr", "Mrs", etc.)
 * 3. Make sure "Master", "Mayor", "Old", and "Lady" are included in all title lists
 * 4. Save the file and refresh the application
 */ 