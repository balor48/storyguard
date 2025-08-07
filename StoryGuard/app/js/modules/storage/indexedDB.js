// IndexedDB-related functions
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        try {
            // Check if IndexedDB is supported
            if (!window.indexedDB) {
                console.error('Your browser does not support IndexedDB');
                reject(new Error('IndexedDB not supported'));
                return;
            }
            
            // Open the database
            const request = window.indexedDB.open('StoryDatabase', 1);
            
            // Handle database upgrade needed
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                console.log('Database upgrade needed');
                
                // Create object stores
                createObjectStores(db);
                
                // Add indexes to stores
                addIndexesToStores(db);
            };
            
            // Handle database open success
            request.onsuccess = function(event) {
                const db = event.target.result;
                console.log('Database opened successfully');
                
                // Check if we need to migrate data from localStorage
                checkAndMigrateFromLocalStorage(db)
                    .then(() => {
                        resolve(db);
                    })
                    .catch(error => {
                        console.error('Error migrating data:', error);
                        reject(error);
                    });
            };
            
            // Handle database open error
            request.onerror = function(event) {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            console.error('Error initializing IndexedDB:', error);
            reject(error);
        }
    });
}

function createObjectStores(db) {
    try {
        // Create object stores for each data type
        const storeNames = [
            'characters',
            'titles',
            'series',
            'books',
            'roles',
            'customFieldTypes',
            'relationships',
            'tags',
            'plots',
            'worldElements',
            'settings'
        ];
        
        // Create each store with an id key path
        for (const storeName of storeNames) {
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                console.log(`Created object store: ${storeName}`);
            }
        }
    } catch (error) {
        console.error('Error creating object stores:', error);
        throw error;
    }
}

function addIndexesToStores(db) {
    try {
        // Add indexes to stores for faster querying
        
        // Characters store
        if (db.objectStoreNames.contains('characters')) {
            const charactersStore = db.transaction('characters', 'readwrite').objectStore('characters');
            
            // Add name index if it doesn't exist
            if (!charactersStore.indexNames.contains('name')) {
                charactersStore.createIndex('name', 'name', { unique: false });
                console.log('Created name index for characters store');
            }
            
            // Add role index if it doesn't exist
            if (!charactersStore.indexNames.contains('role')) {
                charactersStore.createIndex('role', 'role', { unique: false });
                console.log('Created role index for characters store');
            }
        }
        
        // Titles store
        if (db.objectStoreNames.contains('titles')) {
            const titlesStore = db.transaction('titles', 'readwrite').objectStore('titles');
            
            // Add name index if it doesn't exist
            if (!titlesStore.indexNames.contains('name')) {
                titlesStore.createIndex('name', 'name', { unique: false });
                console.log('Created name index for titles store');
            }
        }
        
        // Add more indexes as needed for other stores
    } catch (error) {
        console.error('Error adding indexes to stores:', error);
        throw error;
    }
}

async function checkAndMigrateFromLocalStorage(db) {
    try {
        // Check if we've already migrated
        const migrated = localStorage.getItem('indexedDBMigrated');
        if (migrated === 'true') {
            console.log('Data already migrated from localStorage to IndexedDB');
            return;
        }
        
        console.log('Migrating data from localStorage to IndexedDB...');
        
        // Get data from localStorage
        const data = {
            characters: JSON.parse(localStorage.getItem('characters') || '[]'),
            titles: JSON.parse(localStorage.getItem('titles') || '[]'),
            seriesList: JSON.parse(localStorage.getItem('series') || '[]'),
            books: JSON.parse(localStorage.getItem('books') || '[]'),
            roles: JSON.parse(localStorage.getItem('roles') || '[]'),
            customFieldTypes: JSON.parse(localStorage.getItem('customFieldTypes') || '[]'),
            relationships: JSON.parse(localStorage.getItem('relationships') || '[]'),
            tags: JSON.parse(localStorage.getItem('tags') || '[]'),
            plots: JSON.parse(localStorage.getItem('plots') || '[]'),
            worldElements: JSON.parse(localStorage.getItem('worldElements') || '[]')
        };
        
        // Store data in IndexedDB
        const storePromises = [];
        
        // Characters
        if (data.characters.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'characters', data.characters));
        }
        
        // Titles
        if (data.titles.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'titles', data.titles));
        }
        
        // Series
        if (data.seriesList.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'series', data.seriesList));
        }
        
        // Books
        if (data.books.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'books', data.books));
        }
        
        // Roles
        if (data.roles.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'roles', data.roles));
        }
        
        // Custom Field Types
        if (data.customFieldTypes.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'customFieldTypes', data.customFieldTypes));
        }
        
        // Relationships
        if (data.relationships.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'relationships', data.relationships));
        }
        
        // Tags
        if (data.tags.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'tags', data.tags));
        }
        
        // Plots
        if (data.plots.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'plots', data.plots));
        }
        
        // World Elements
        if (data.worldElements.length > 0) {
            storePromises.push(storeDataInObjectStore(db, 'worldElements', data.worldElements));
        }
        
        // Wait for all stores to complete
        await Promise.all(storePromises);
        
        // Mark as migrated
        localStorage.setItem('indexedDBMigrated', 'true');
        
        console.log('Data migration from localStorage to IndexedDB completed');
    } catch (error) {
        console.error('Error migrating data from localStorage to IndexedDB:', error);
        throw error;
    }
}

function storeDataInObjectStore(db, storeName, data) {
    return new Promise((resolve, reject) => {
        try {
            // Start a transaction
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Clear existing data
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = function() {
                console.log(`Cleared existing data in ${storeName} store`);
                
                // Add each item to the store
                let count = 0;
                for (const item of data) {
                    const request = store.add(item);
                    
                    request.onsuccess = function() {
                        count++;
                        if (count === data.length) {
                            console.log(`Added ${count} items to ${storeName} store`);
                        }
                    };
                    
                    request.onerror = function(event) {
                        console.error(`Error adding item to ${storeName} store:`, event.target.error);
                    };
                }
            };
            
            // Handle transaction completion
            transaction.oncomplete = function() {
                console.log(`Transaction completed for ${storeName} store`);
                resolve();
            };
            
            // Handle transaction error
            transaction.onerror = function(event) {
                console.error(`Transaction error for ${storeName} store:`, event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            console.error(`Error storing data in ${storeName} store:`, error);
            reject(error);
        }
    });
}

async function storeData(storeName, data, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            // Open the database
            const request = window.indexedDB.open('StoryDatabase', 1);
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                
                // Start a transaction
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Clear existing data if specified
                if (options.clear) {
                    const clearRequest = store.clear();
                    
                    clearRequest.onsuccess = function() {
                        console.log(`Cleared existing data in ${storeName} store`);
                    };
                    
                    clearRequest.onerror = function(event) {
                        console.error(`Error clearing ${storeName} store:`, event.target.error);
                    };
                }
                
                // Add or update each item in the store
                let count = 0;
                const isArray = Array.isArray(data);
                const items = isArray ? data : [data];
                
                for (const item of items) {
                    // Use put to add or update
                    const request = store.put(item);
                    
                    request.onsuccess = function() {
                        count++;
                        if (count === items.length) {
                            console.log(`Stored ${count} items in ${storeName} store`);
                        }
                    };
                    
                    request.onerror = function(event) {
                        console.error(`Error storing item in ${storeName} store:`, event.target.error);
                    };
                }
                
                // Handle transaction completion
                transaction.oncomplete = function() {
                    console.log(`Transaction completed for ${storeName} store`);
                    resolve(true);
                };
                
                // Handle transaction error
                transaction.onerror = function(event) {
                    console.error(`Transaction error for ${storeName} store:`, event.target.error);
                    reject(event.target.error);
                };
            };
            
            request.onerror = function(event) {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            console.error(`Error storing data in ${storeName} store:`, error);
            reject(error);
        }
    });
}

async function retrieveData(storeName, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            // Open the database
            const request = window.indexedDB.open('StoryDatabase', 1);
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                
                // Start a transaction
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                // Get all data from the store
                const getRequest = store.getAll();
                
                getRequest.onsuccess = function() {
                    const data = getRequest.result;
                    console.log(`Retrieved ${data.length} items from ${storeName} store`);
                    
                    // Apply filters if specified
                    let filteredData = data;
                    
                    if (options.filter) {
                        filteredData = filteredData.filter(options.filter);
                    }
                    
                    // Apply sorting if specified
                    if (options.sort) {
                        filteredData.sort(options.sort);
                    }
                    
                    // Apply limit if specified
                    if (options.limit) {
                        filteredData = filteredData.slice(0, options.limit);
                    }
                    
                    resolve(filteredData);
                };
                
                getRequest.onerror = function(event) {
                    console.error(`Error retrieving data from ${storeName} store:`, event.target.error);
                    reject(event.target.error);
                };
            };
            
            request.onerror = function(event) {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            console.error(`Error retrieving data from ${storeName} store:`, error);
            reject(error);
        }
    });
}

async function getItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        try {
            // Open the database
            const request = window.indexedDB.open('StoryDatabase', 1);
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                
                // Start a transaction
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                // Get the item by ID
                const getRequest = store.get(id);
                
                getRequest.onsuccess = function() {
                    const item = getRequest.result;
                    console.log(`Retrieved item with ID ${id} from ${storeName} store`);
                    resolve(item);
                };
                
                getRequest.onerror = function(event) {
                    console.error(`Error retrieving item with ID ${id} from ${storeName} store:`, event.target.error);
                    reject(event.target.error);
                };
            };
            
            request.onerror = function(event) {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            console.error(`Error retrieving item with ID ${id} from ${storeName} store:`, error);
            reject(error);
        }
    });
}

// Export the functions
export {
    initIndexedDB,
    createObjectStores,
    addIndexesToStores,
    checkAndMigrateFromLocalStorage,
    storeDataInObjectStore,
    storeData,
    retrieveData,
    getItemById
}; 