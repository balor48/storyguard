// Logging Control Script
// Controls console logging to prevent excessive logs in production

(function() {
    // ONLY log the script loading message
    console.log('Logging control script loaded - Normal filtering enabled');
    
    // Store original console methods
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
    };
    
    // Critical messages that should always be logged regardless of filtering
    const criticalMessages = [
        'database',
        'Database',
        'error',
        'Error',
        'exception', 
        'Exception',
        'crash',
        'Crash',
        'toast',
        'Toast',
        'Storage',
        'storage'
    ];
    
    // Always let these critical logs through
    function isCriticalLog(args) {
        if (!args || args.length === 0) return false;
        
        // Convert first argument to string if possible
        const firstArg = args[0];
        const message = typeof firstArg === 'string' ? firstArg : 
                      (firstArg && typeof firstArg.toString === 'function') ? firstArg.toString() : '';
        
        // Check if the message contains any of the critical keywords
        return criticalMessages.some(keyword => message.includes(keyword));
    }
    
    // Filtered console.log that only shows important messages
    console.log = function() {
        // Always log database-related messages and errors
        if (isCriticalLog(arguments)) {
            originalConsole.log.apply(console, arguments);
        }
        // Let through very short status messages which are likely important
        else if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].length < 50) {
            originalConsole.log.apply(console, arguments);
        }
        // Log very important story database messages
        else if (arguments[0] && typeof arguments[0] === 'string' && 
                (arguments[0].includes('Story Database'))) {
            originalConsole.log.apply(console, arguments);
        }
    };
    
    // Always log errors
    console.error = function() {
        originalConsole.error.apply(console, arguments);
    };
    
    // Always log warnings
    console.warn = function() {
        originalConsole.warn.apply(console, arguments);
    };
    
    // Filter info logs similar to regular logs
    console.info = function() {
        if (isCriticalLog(arguments) || 
            (arguments[0] && typeof arguments[0] === 'string' && arguments[0].length < 50)) {
            originalConsole.info.apply(console, arguments);
        }
    };
    
    // Filter debug logs (most aggressive filtering)
    console.debug = function() {
        if (isCriticalLog(arguments)) {
            originalConsole.debug.apply(console, arguments);
        }
    };
    
    // Log a few important startup messages
    console.log('Story Database v2.1.0 initializing...');
    
    // Add more generous console.debug during initialization
    setTimeout(() => {
        console.log('Story Database initialization complete');
    }, 5000);
})();
