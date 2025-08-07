/**
 * Utility functions for handling images in Story Database
 * Handles image saving and retrieval for characters and locations
 */

// Ensure Storage module is available
if (typeof window.Storage === 'undefined') {
    window.Storage = window.Storage || {};
}

// Define ImagesUtils namespace
const ImagesUtils = (function() {
    // Generate a unique filename for an image
    function generateUniqueImageFilename(entityType, entityId, extension) {
        const timestamp = new Date().getTime();
        const randomStr = Math.random().toString(36).substring(2, 10);
        return `${entityType}-${entityId}-${timestamp}-${randomStr}${extension}`;
    }
    
    // Save an image to the images directory
    async function saveImage(imageData, entityType, entityId) {
        try {
            console.log('Saving image for', entityType, entityId);
            
            // Determine file extension based on data URL format
            let extension = '.png';
            if (imageData.startsWith('data:image/jpeg')) {
                extension = '.jpg';
            } else if (imageData.startsWith('data:image/gif')) {
                extension = '.gif';
            }
            
            // Get the base64 data without the header
            const base64Data = imageData.split(',')[1];
            
            // Generate a unique filename
            const filename = generateUniqueImageFilename(entityType, entityId, extension);
            
            // Get the images directory from settings
            const imagesDir = localStorage.getItem('imagePath') || 'D:\\StoryBoard\\images';
            
            // Save the image file using the main process
            const result = await window.api.saveImageFile({
                filename: filename,
                data: base64Data,
                directory: imagesDir
            });
            
            if (result && result.success) {
                console.log('Image saved successfully:', result.path);
                return result.path;
            } else {
                console.error('Error saving image:', result?.error);
                throw new Error(result?.error || 'Unknown error saving image');
            }
        } catch (error) {
            console.error('Error in saveImage:', error);
            throw error;
        }
    }
    
    // Load an image from a path
    function loadImage(imagePath) {
        return new Promise((resolve, reject) => {
            if (!imagePath) {
                reject(new Error('No image path provided'));
                return;
            }
            
            // Request the image data from main process
            window.api.loadImageFile(imagePath)
                .then(result => {
                    if (result && result.success) {
                        resolve(result.data);
                    } else {
                        reject(new Error(result?.error || 'Failed to load image'));
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    
    // Handle image upload from input
    function handleImageUpload(input, callback) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageData = e.target.result;
                callback(imageData);
            };
            
            reader.onerror = function(error) {
                console.error('Error reading image file:', error);
                callback(null, error);
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // Process an image upload for an entity (character or location)
    async function processEntityImageUpload(input, entityType, entityId) {
        return new Promise((resolve, reject) => {
            console.log('processEntityImageUpload called for', entityType, entityId);
            
            // Handle both direct file objects and file input elements
            if (input.files && input.files[0]) {
                // Standard file input
                console.log('Processing from standard input element');
                handleImageUpload(input, processResult);
            } else if (input instanceof File) {
                // Direct File object
                console.log('Processing from direct File object');
                const reader = new FileReader();
                reader.onload = function(e) {
                    processResult(e.target.result);
                };
                reader.onerror = function(error) {
                    console.error('Error reading direct File:', error);
                    reject(error);
                };
                reader.readAsDataURL(input);
            } else if (input && input.files && input.files[0] instanceof File) {
                // Mock input object with files property
                console.log('Processing from mock input object');
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    processResult(e.target.result);
                };
                reader.onerror = function(error) {
                    console.error('Error reading from mock input:', error);
                    reject(error);
                };
                reader.readAsDataURL(file);
            } else {
                console.error('Invalid input type for image upload', input);
                reject(new Error('Invalid input for image upload'));
                return;
            }
            
            // Common processing function to avoid duplicated code
            async function processResult(imageData, error) {
                if (error) {
                    console.error('Error reading image:', error);
                    reject(error);
                    return;
                }
                
                if (!imageData) {
                    console.error('No image data received');
                    reject(new Error('No image data received'));
                    return;
                }
                
                try {
                    console.log('Image data received, saving...');
                    const imagePath = await saveImage(imageData, entityType, entityId);
                    console.log('Image saved successfully:', imagePath);
                    resolve(imagePath);
                } catch (saveError) {
                    console.error('Error saving image:', saveError);
                    reject(saveError);
                }
            }
        });
    }
    
    // Ensure the images directory exists
    async function ensureImagesDirectory() {
        try {
            // Get the images directory from settings
            const imagesDir = localStorage.getItem('imagePath') || 'D:\\StoryBoard\\images';
            
            // Request the main process to ensure the directory exists
            const result = await window.api.ensureDirectory(imagesDir);
            
            if (result && result.success) {
                console.log('Images directory confirmed:', imagesDir);
                return true;
            } else {
                console.error('Error ensuring images directory:', result?.error);
                return false;
            }
        } catch (error) {
            console.error('Error checking/creating images directory:', error);
            return false;
        }
    }
    
    // Public API
    return {
        saveImage,
        loadImage,
        handleImageUpload,
        processEntityImageUpload,
        ensureImagesDirectory
    };
})();

// Export to global scope
window.ImagesUtils = ImagesUtils; 