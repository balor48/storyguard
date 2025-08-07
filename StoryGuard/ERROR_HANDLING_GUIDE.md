# Error Handling System Integration Guide

## Overview

As part of our comprehensive refactoring plan for the Story Database Desktop application, we've implemented a standardized error handling system. This system ensures consistent error handling, reporting, and user notification throughout the application.

## Components

### 1. ErrorHandlingManager

The core error management module that centralizes error handling:

- Consistent error logging and reporting
- Error categorization by level (critical, error, warning, info)
- Support for custom error handlers
- Error persistence for debugging

### 2. NotificationManager

Provides standardized UI notifications for errors and other messages:

- Consistent styling for different message types
- Automatic integration with ErrorHandlingManager
- Customizable notification duration and appearance
- Priority handling for critical errors

### 3. Error Handling Utilities

Simplifies implementation of error handling throughout the codebase:

- `tryCatch` and `tryCatchAsync` functions for easy error wrapping
- `withErrorHandling` and `withAsyncErrorHandling` higher-order functions
- `safeEventListener` for DOM event error handling

### 4. Integration Layer

Automatically applies error handling to key modules:

- UIManager integration
- FileManager integration
- DatabaseManager integration
- SettingsManager integration

## How to Use

### Basic Setup

The error handling system is initialized via the `error-handler-init.js` script. Include this script early in your application's startup sequence:

```html
<script type="module" src="./js/error-handler-init.js"></script>
```

### Handling Errors in Functions

Use the `tryCatch` utility for synchronous functions:

```javascript
import { tryCatch } from './modules/error-handling-util.js';

function riskyOperation() {
  return tryCatch(() => {
    // Your code that might throw errors
    const result = someRiskyFunction();
    return result;
  }, defaultValueIfError, 'source-name', 'error', { additionalContext: 'value' });
}
```

For async functions, use `tryCatchAsync`:

```javascript
import { tryCatchAsync } from './modules/error-handling-util.js';

async function asyncRiskyOperation() {
  return tryCatchAsync(async () => {
    // Your async code that might throw errors
    const result = await someAsyncRiskyFunction();
    return result;
  }, defaultValueIfError, 'source-name', 'error', { additionalContext: 'value' });
}
```

### Applying Error Handling to Existing Functions

Wrap existing functions with error handling:

```javascript
import { withErrorHandling } from './modules/error-handling-util.js';

// Original function
function originalFunction(arg1, arg2) {
  // Implementation
}

// Create error-handling version
const safeFunction = withErrorHandling(
  originalFunction, 
  defaultReturnValue,
  'module-name',
  'error',
  { function: 'originalFunction' }
);
```

### Safe DOM Event Handling

Use `safeEventListener` for DOM events:

```javascript
import { safeEventListener } from './modules/error-handling-util.js';

// Instead of element.addEventListener('click', handler)
const removeListener = safeEventListener(element, 'click', handler, {
  source: 'button-click',
  level: 'error',
  capture: false // other addEventListener options
});

// Later, if needed
removeListener(); // Removes the event listener
```

### Showing User Notifications

Use the NotificationManager to display user notifications:

```javascript
import notificationManager from './modules/NotificationManager.js';

// Show different types of notifications
notificationManager.showError('Something went wrong', 'Error Title', 8000);
notificationManager.showWarning('Proceed with caution', 'Warning', 5000);
notificationManager.showSuccess('Operation completed', 'Success', 3000);
notificationManager.showInfo('Just FYI', 'Information', 4000);

// For quick access from any module
window.showToast('Success message', 'success'); // type: error, warning, success, info
```

### Custom Error Handlers

Register custom error handlers for specific scenarios:

```javascript
import { ErrorHandlingManager } from './modules/error-handling-util.js';

// Register a custom handler
ErrorHandlingManager.registerErrorHandler('my-handler', 
  (errorInfo) => {
    // Handle the error in a custom way
    console.log('Custom handling for:', errorInfo);
    // Perform recovery actions
  },
  { 
    // Filter options
    source: 'specific-source',  // Only for this source
    levels: ['critical', 'error'] // Only for these levels
  }
);
```

## Migration Strategy

To integrate existing code with the error handling system:

1. **Identify error-prone areas** - Focus on file operations, database operations, and UI interactions first

2. **Apply appropriate patterns** - Use `tryCatch` for simple functions, `withErrorHandling` for complex modules

3. **Add descriptive context** - Include meaningful source names and additional context in error handlers

4. **Replace direct error handling** - Convert `try/catch` blocks to use the centralized system

5. **Add user notifications** - Replace custom alerts/toasts with NotificationManager

## Best Practices

1. **Be specific with error sources** - Use consistent, descriptive source names

2. **Include context** - Add relevant context in the `additionalInfo` parameter

3. **Choose appropriate error levels**:
   - `critical` - Application cannot continue functioning
   - `error` - Operation failed but application can continue
   - `warning` - Potential issue but operation succeeded
   - `info` - Informational message, not an error

4. **Don't swallow important errors** - Critical errors should still interrupt the flow

5. **Use meaningful default values** - Consider what makes sense to return if an operation fails

## Benefits

- **Consistent user experience** - Standardized error notifications
- **Easier debugging** - Centralized error logging and context
- **Improved reliability** - Better error recovery mechanisms
- **Code reduction** - Less duplicate error handling logic
- **Better maintenance** - Clear patterns for error handling
