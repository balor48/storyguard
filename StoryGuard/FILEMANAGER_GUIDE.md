# FileManager System Guide

This guide explains the new FileManager system implemented as part of our refactoring efforts for the Story Database Desktop application.

## Overview

The FileManager system provides a centralized, consistent approach to file operations throughout the application. It addresses several key issues from our refactoring plan:

- **Code organization and modularization**: All file operations now flow through a single system
- **Removing duplicate code**: Eliminates multiple implementations of file operations
- **Consistent error handling**: All file operations include retry mechanisms and proper error reporting
- **Improving file operations**: Adds reliability with retries, path normalization, and directory creation

## Components

### 1. FileManager.js

The core file management module that handles all direct file operations. It provides:

- Retry mechanisms for handling transient file system errors
- Path normalization for cross-platform compatibility
- Consistent error handling and reporting
- Directory creation and validation
- File operations (read, write, delete, copy)

### 2. FileManagerBridge.js

A bridge module that connects the renderer process to file operations in the main process:

- Provides a renderer-safe API for file operations
- Handles IPC communication with the main process
- Maintains path information synchronized with the main process
- Falls back to local storage when needed

### 3. main-file-handlers.js

Sets up IPC handlers in the main process to route file operations through the FileManager:

- Creates safe IPC endpoints for all file operations
- Provides consistent error handling
- Ensures proper parameter handling

## How to Use

### In Main Process

To use the FileManager in the main process, add this to your main.js:

```javascript
// Import the FileManager
const fileManager = require('./app/js/modules/FileManager').default;

// Import the IPC handlers
const { initializeFileHandlers } = require('./main-file-handlers');

// Initialize FileManager with protected paths
fileManager.initialize({
  paths: global.protectedPaths
});

// Set up IPC handlers
initializeFileHandlers({
  fileManager
});
```

### In Renderer Process

To use the FileManagerBridge in renderer processes:

```javascript
// Import the FileManagerBridge
import fileManagerBridge from './modules/FileManagerBridge';

// Initialize with ErrorManager if available
fileManagerBridge.initialize({
  errorManager: window.errorManager 
});

// Example: Read a file
async function readDocumentFile(filename) {
  try {
    const documentsPath = fileManagerBridge.getPath('documents');
    const filePath = require('path').join(documentsPath, filename);
    
    const content = await fileManagerBridge.readFile(filePath);
    return content;
  } catch (error) {
    console.error('Failed to read document:', error);
    return null;
  }
}
```

## Key Benefits

1. **Reliability**: All file operations include retry mechanisms and proper error handling
2. **Consistency**: File paths are consistent across the application
3. **Maintainability**: File operation bugs can be fixed in one place
4. **Performance**: Optimized file operations with proper resource management
5. **Extensibility**: Easy to add new file operation types

## Migration Guide

To migrate existing file operations to the new system:

1. Replace direct `fs` calls with `fileManager` calls in the main process
2. Replace direct IPC calls with `fileManagerBridge` calls in the renderer process
3. Use `getPath()` instead of directly accessing `global.protectedPaths`
4. Let the FileManager handle directory creation and path normalization

## Example Migrations

### Before:

```javascript
// In renderer
try {
  const filePath = path.join(global.protectedPaths.documents, filename);
  fs.writeFileSync(filePath, content);
} catch (error) {
  console.error('Error writing file:', error);
}
```

### After:

```javascript
// In renderer
try {
  const documentsPath = fileManagerBridge.getPath('documents');
  const filePath = path.join(documentsPath, filename);
  await fileManagerBridge.writeFile(filePath, content);
} catch (error) {
  console.error('Error writing file:', error);
}
```

## Next Steps

With the FileManager system in place, the next refactoring steps should focus on:

1. Migrating existing file operations to use the new system
2. Centralizing database operations into a similar DatabaseManager
3. Further enhancing the UI Manager with standardized components

---

This file operation refactoring addresses key aspects of our overall refactoring plan, particularly items 1, 2, 3, and 4 (code organization, duplicate code removal, consistent error handling, and improved file operations).
