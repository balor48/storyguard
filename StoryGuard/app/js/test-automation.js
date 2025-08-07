/**
 * Test Automation Script
 * 
 * This script provides utilities for automated testing of the Story Database application.
 * It is only loaded in development/test environments.
 */

(function() {
    // Set up test automation namespace
    window.TestAutomation = window.TestAutomation || {};
    
    // Store the original console methods to avoid interference with testing
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };
    
    // Configuration for test environment
    const config = {
        isTestMode: false,
        captureConsole: false,
        logBuffer: [],
        maxLogBufferSize: 1000
    };
    
    /**
     * Enable or disable test mode
     * @param {boolean} enabled - Whether to enable test mode
     */
    function setTestMode(enabled) {
        config.isTestMode = !!enabled;
        console.log(`Test mode ${config.isTestMode ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Start capturing console output for test assertions
     */
    function startCapturingConsole() {
        if (config.captureConsole) return;
        
        config.captureConsole = true;
        config.logBuffer = [];
        
        // Override console methods to capture output
        console.log = function(...args) {
            config.logBuffer.push({type: 'log', args: [...args], timestamp: Date.now()});
            if (config.logBuffer.length > config.maxLogBufferSize) {
                config.logBuffer.shift();
            }
            originalConsole.log(...args);
        };
        
        console.error = function(...args) {
            config.logBuffer.push({type: 'error', args: [...args], timestamp: Date.now()});
            if (config.logBuffer.length > config.maxLogBufferSize) {
                config.logBuffer.shift();
            }
            originalConsole.error(...args);
        };
        
        console.warn = function(...args) {
            config.logBuffer.push({type: 'warn', args: [...args], timestamp: Date.now()});
            if (config.logBuffer.length > config.maxLogBufferSize) {
                config.logBuffer.shift();
            }
            originalConsole.warn(...args);
        };
        
        console.info = function(...args) {
            config.logBuffer.push({type: 'info', args: [...args], timestamp: Date.now()});
            if (config.logBuffer.length > config.maxLogBufferSize) {
                config.logBuffer.shift();
            }
            originalConsole.info(...args);
        };
        
        console.log('Console capture started');
    }
    
    /**
     * Stop capturing console output
     */
    function stopCapturingConsole() {
        if (!config.captureConsole) return;
        
        // Restore original console methods
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
        
        config.captureConsole = false;
        console.log('Console capture stopped');
    }
    
    /**
     * Get captured console logs
     * @returns {Array} - The captured console logs
     */
    function getCapturedLogs() {
        return [...config.logBuffer];
    }
    
    /**
     * Clear captured console logs
     */
    function clearCapturedLogs() {
        config.logBuffer = [];
    }
    
    /**
     * Generate a test database with sample data
     * @param {string} name - Name for the test database
     * @returns {Object} - The generated test database object
     */
    function generateTestDatabase(name = 'Test Database') {
        const timestamp = new Date().toISOString();
        return {
            metadata: {
                databaseName: name,
                created: timestamp,
                version: '2.1.0'
            },
            characters: [
                {
                    id: 'test-char-1',
                    firstName: 'John',
                    lastName: 'Doe',
                    age: 30,
                    gender: 'Male',
                    occupation: 'Protagonist',
                    description: 'Test character description',
                    notes: 'Test character notes',
                    created: timestamp
                }
            ],
            locations: [
                {
                    id: 'test-loc-1',
                    name: 'Test Location',
                    type: 'City',
                    description: 'Test location description',
                    notes: 'Test location notes',
                    created: timestamp
                }
            ],
            plots: [
                {
                    id: 'test-plot-1',
                    title: 'Test Plot',
                    description: 'Test plot description',
                    notes: 'Test plot notes',
                    created: timestamp
                }
            ],
            worldElements: [
                {
                    id: 'test-world-1',
                    name: 'Test World Element',
                    type: 'Concept',
                    description: 'Test world element description',
                    notes: 'Test world element notes',
                    created: timestamp
                }
            ],
            relationships: [],
            tags: []
        };
    }
    
    /**
     * Run automated tests to verify core functionality
     */
    function runAutomatedTests() {
        console.log('Running automated tests...');
        
        let allTestsPassed = true;
        const testResults = [];
        
        // Helper function to track test results
        function recordTestResult(name, passed, details = '') {
            testResults.push({
                name,
                passed,
                details,
                timestamp: new Date().toISOString()
            });
            
            if (!passed) {
                allTestsPassed = false;
                console.error(`Test failed: ${name}`, details);
            } else {
                console.log(`Test passed: ${name}`);
            }
        }
        
        // Test 1: Verify Storage object exists
        try {
            const hasStorage = typeof window.Storage === 'object' && window.Storage !== null;
            recordTestResult('Storage object exists', hasStorage);
        } catch (error) {
            recordTestResult('Storage object exists', false, error.message);
        }
        
        // Test 2: Verify core storage functions exist
        try {
            const requiredFunctions = [
                'saveDatabase', 
                'loadDatabase', 
                'exportDatabase', 
                'importDatabase', 
                'backupDatabase'
            ];
            
            const missingFunctions = requiredFunctions.filter(
                func => typeof window.Storage[func] !== 'function'
            );
            
            recordTestResult(
                'Core storage functions exist', 
                missingFunctions.length === 0,
                missingFunctions.length > 0 ? `Missing functions: ${missingFunctions.join(', ')}` : ''
            );
        } catch (error) {
            recordTestResult('Core storage functions exist', false, error.message);
        }
        
        // Test 3: Verify UI elements
        try {
            const requiredElements = [
                document.getElementById('dashboard-tab'),
                document.getElementById('characters-tab'),
                document.getElementById('locations-tab'),
                document.getElementById('plots-tab')
            ];
            
            const allElementsExist = requiredElements.every(el => el !== null);
            recordTestResult('UI elements exist', allElementsExist);
        } catch (error) {
            recordTestResult('UI elements exist', false, error.message);
        }
        
        // Report final results
        console.log(`Automated tests completed. ${allTestsPassed ? 'All tests passed!' : 'Some tests failed!'}`);
        return {
            success: allTestsPassed,
            results: testResults,
            timestamp: new Date().toISOString()
        };
    }
    
    // Expose public API
    window.TestAutomation = {
        setTestMode,
        startCapturingConsole,
        stopCapturingConsole,
        getCapturedLogs,
        clearCapturedLogs,
        generateTestDatabase,
        runAutomatedTests,
        getConfig: () => ({...config})
    };
    
    console.log('Test automation utilities loaded successfully');
})();
