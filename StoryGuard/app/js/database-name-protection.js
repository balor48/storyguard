// Database Name Protection Script
// This script provides an extra layer of protection for database names
// It runs after everything else has loaded and ensures names don't get reset

(function() {
    console.log('Database name protection script loaded');
    
    // Define last known good database name variable
    let lastKnownGoodDatabaseName = null;
    
    // Create a more aggressive protection mechanism
    const PROTECTED_DATABASE_STORAGE_KEY = '__PROTECTED_DB_NAME__';
    
    // Save the current good name immediately if we have one
    const initialSavedName = localStorage.getItem('currentDatabaseName');
    if (initialSavedName && 
        initialSavedName !== 'Default' && 
        initialSavedName !== 'default' && 
        !initialSavedName.includes('Imported DB')) {
        console.log('Saving initial protected database name:', initialSavedName);
        localStorage.setItem(PROTECTED_DATABASE_STORAGE_KEY, initialSavedName);
        lastKnownGoodDatabaseName = initialSavedName;
    }
    
    // Function to check and fix database name with extreme protection
    function checkAndFixDatabaseName() {
        // Get the current database name from localStorage
        const currentName = localStorage.getItem('currentDatabaseName');
        
        // Get the protected name we've saved
        const protectedName = localStorage.getItem(PROTECTED_DATABASE_STORAGE_KEY);
        
        // Get the displayed name from the UI
        const displayedNameElement = document.getElementById('currentDatabaseName');
        const displayedName = displayedNameElement ? displayedNameElement.textContent : null;
        
        console.log('Database name check - stored:', currentName, 'protected:', protectedName, 'displayed:', displayedName);
        
        // STRICT PROTECTION: If we have a protected name, always enforce it
        if (protectedName && 
            protectedName !== 'Default' && 
            protectedName !== 'default' && 
            !protectedName.includes('Imported DB')) {
            
            // If the current name is 'Default' or doesn't match our protected name, restore it
            if (currentName === 'Default' || 
                currentName === 'default' || 
                displayedName === 'Default' || 
                displayedName === 'default') {
                
                console.log(`STRICT PROTECTION: Restoring database name to "${protectedName}" from "${currentName}"`);
                
                // Update localStorage
                localStorage.setItem('currentDatabaseName', protectedName);
                
                // Update UI
                if (displayedNameElement) {
                    displayedNameElement.textContent = protectedName;
                }
                
                // Update via UI function if available
                if (window.UI && window.UI.updateDatabaseIndicator) {
                    window.UI.updateDatabaseIndicator(protectedName);
                }
                
                console.log('Database name restored successfully from protected storage');
                return;
            }
        }
        
        // If we have a good name stored in our variable
        if (lastKnownGoodDatabaseName && 
            lastKnownGoodDatabaseName !== 'Default' && 
            lastKnownGoodDatabaseName !== 'default') {
            
            // If the current name is 'Default' or doesn't match our good name, restore it
            if (currentName === 'Default' || currentName === 'default' || 
                displayedName === 'Default' || displayedName === 'default' ||
                (document.importedDatabaseName && document.importedDatabaseName !== currentName)) {
                
                console.log(`Restoring database name to "${lastKnownGoodDatabaseName}" from "${currentName}"`);
                
                // Update localStorage
                localStorage.setItem('currentDatabaseName', lastKnownGoodDatabaseName);
                
                // Update UI
                if (displayedNameElement) {
                    displayedNameElement.textContent = lastKnownGoodDatabaseName;
                }
                
                // Update via UI function if available
                if (window.UI && window.UI.updateDatabaseIndicator) {
                    window.UI.updateDatabaseIndicator(lastKnownGoodDatabaseName);
                }
                
                console.log('Database name restored successfully');
            }
        } else if (document.importedDatabaseName && 
                   document.importedDatabaseName !== 'Default' && 
                   document.importedDatabaseName !== 'default') {
            // If we don't have a good name stored but do have one on the document, use that
            lastKnownGoodDatabaseName = document.importedDatabaseName;
            console.log(`Using document.importedDatabaseName as lastKnownGoodDatabaseName: ${lastKnownGoodDatabaseName}`);
            
            // IMPORTANT: Save this to our protected storage
            localStorage.setItem(PROTECTED_DATABASE_STORAGE_KEY, lastKnownGoodDatabaseName);
            
            // Call ourselves again to perform the check and fix
            checkAndFixDatabaseName();
        } else if (currentName && 
                   currentName !== 'Default' && 
                   currentName !== 'default') {
            // If we don't have a good name stored but the current name is good, use that
            lastKnownGoodDatabaseName = currentName;
            console.log(`Using currentName as lastKnownGoodDatabaseName: ${lastKnownGoodDatabaseName}`);
            
            // IMPORTANT: Save this to our protected storage
            localStorage.setItem(PROTECTED_DATABASE_STORAGE_KEY, lastKnownGoodDatabaseName);
        }
    }
    
    // Watch for changes to localStorage and fix immediately
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        // Call original first
        originalSetItem.call(localStorage, key, value);
        
        // If setting the database name
        if (key === 'currentDatabaseName') {
            console.log(`localStorage.setItem detected for ${key}:`, value);
            
            // If setting to Default but we have a protected name, override it
            if ((value === 'Default' || value === 'default') && 
                localStorage.getItem(PROTECTED_DATABASE_STORAGE_KEY)) {
                
                const protectedName = localStorage.getItem(PROTECTED_DATABASE_STORAGE_KEY);
                console.log(`INTERCEPTED attempt to set database name to Default, using ${protectedName} instead`);
                originalSetItem.call(localStorage, key, protectedName);
                
                // Also update UI
                setTimeout(() => {
                    const displayedNameElement = document.getElementById('currentDatabaseName');
                    if (displayedNameElement) {
                        displayedNameElement.textContent = protectedName;
                    }
                    
                    // Update via UI function if available
                    if (window.UI && window.UI.updateDatabaseIndicator) {
                        window.UI.updateDatabaseIndicator(protectedName);
                    }
                }, 0);
            }
            // If setting to something other than Default, save it as protected
            else if (value && value !== 'Default' && value !== 'default' && !value.includes('Imported DB')) {
                console.log(`Saving new protected database name: ${value}`);
                originalSetItem.call(localStorage, PROTECTED_DATABASE_STORAGE_KEY, value);
            }
            
            // Run our fix routine
            setTimeout(checkAndFixDatabaseName, 0);
        }
    };
    
    // Prevent the database name from being cleared
    const originalClear = localStorage.clear;
    localStorage.clear = function() {
        // Save our protected name
        const protectedName = localStorage.getItem(PROTECTED_DATABASE_STORAGE_KEY);
        const currentName = localStorage.getItem('currentDatabaseName');
        
        // Call original
        originalClear.call(localStorage);
        
        // Restore our protected values
        if (protectedName) {
            console.log(`Restoring protected database name after localStorage.clear(): ${protectedName}`);
            localStorage.setItem(PROTECTED_DATABASE_STORAGE_KEY, protectedName);
            localStorage.setItem('currentDatabaseName', protectedName);
        } else if (currentName && currentName !== 'Default' && currentName !== 'default') {
            console.log(`Saving current database name after localStorage.clear(): ${currentName}`);
            localStorage.setItem(PROTECTED_DATABASE_STORAGE_KEY, currentName);
            localStorage.setItem('currentDatabaseName', currentName);
        }
    };
    
    // Check frequently for issues
    function startDatabaseProtection() {
        // Check immediately
        checkAndFixDatabaseName();
        
        // Then check periodically
        setInterval(checkAndFixDatabaseName, 2000);
        
        // Set up a MutationObserver to watch for changes to the database name element
        const displayedNameElement = document.getElementById('currentDatabaseName');
        if (displayedNameElement) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        if (displayedNameElement.textContent === 'Default' || 
                            displayedNameElement.textContent === 'default') {
                            checkAndFixDatabaseName();
                        }
                    }
                });
            });
            
            observer.observe(displayedNameElement, {
                childList: true,
                characterData: true,
                subtree: true
            });
            
            console.log('Set up MutationObserver for database name element');
        }
        
        // Also monitor the UI when switching tabs, as that's when the name often gets reset
        document.addEventListener('click', function(event) {
            // If clicking a tab button
            if (event.target.classList && 
                (event.target.classList.contains('tab-button') || 
                 event.target.closest('.tab-button'))) {
                console.log('Tab button clicked, scheduling database name check');
                setTimeout(checkAndFixDatabaseName, 100);
                setTimeout(checkAndFixDatabaseName, 500);
                setTimeout(checkAndFixDatabaseName, 1000);
            }
            
            // If clicking the "Switch" button
            if (event.target.textContent === 'Switch' || 
                (event.target.closest('button') && event.target.closest('button').textContent === 'Switch')) {
                console.log('Switch button clicked, scheduling multiple database name checks');
                for (let i = 1; i <= 10; i++) {
                    setTimeout(checkAndFixDatabaseName, i * 500);
                }
            }
        }, true);
        
        console.log('Database name protection active');
    }
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'complete') {
        startDatabaseProtection();
    } else {
        window.addEventListener('load', startDatabaseProtection);
    }
})();
