/**
 * Storage Utilities
 * 
 * This module provides standardized access to storage functions used throughout the application.
 * It ensures a single source of truth for critical operations like local storage access.
 */

/**
 * Safely get an item from localStorage with error handling
 * @param {string} key - Key to retrieve from storage
 * @returns {string|null} - Retrieved value or null if not found/error
 */
export function safeGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error(`Error getting ${key} from localStorage:`, error);
        return null;
    }
}

/**
 * Safely store an item in localStorage with error handling
 * @param {string} key - Key to store the value under
 * @param {string} value - Value to store
 * @returns {boolean} - Success status
 */
export function safeStore(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error(`Error storing ${key} in localStorage:`, error);
        return false;
    }
}

/**
 * Safely remove an item from localStorage with error handling
 * @param {string} key - Key to remove from storage
 * @returns {boolean} - Success status
 */
export function safeRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing ${key} from localStorage:`, error);
        return false;
    }
}

/**
 * Check if a key exists in localStorage
 * @param {string} key - Key to check
 * @returns {boolean} - Whether the key exists
 */
export function keyExists(key) {
    return safeGet(key) !== null;
}

/**
 * Clear all items from localStorage
 * @returns {boolean} - Success status
 */
export function clearStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
    }
}

// Add compatibility layer for existing code that uses window.Storage
if (typeof window !== 'undefined') {
    // Ensure Storage object exists
    if (!window.Storage) {
        window.Storage = {};
    }
    
    // Add methods if they don't exist
    if (!window.Storage.safeGet) {
        window.Storage.safeGet = safeGet;
    }
    
    if (!window.Storage.safeStore) {
        window.Storage.safeStore = safeStore;
    }
    
    if (!window.Storage.safeRemove) {
        window.Storage.safeRemove = safeRemove;
    }
}
