/**
 * PDFManager.js
 * 
 * A centralized PDF management module for the Story Database Desktop application.
 * This module handles all PDF generation and export functionality for different
 * content types (characters, locations, plots, world building).
 *
 * Part of the application's modular architecture refactoring.
 */

// Import dependencies
import { ErrorHandlingManager, tryCatch } from './ErrorHandlingManager.js';

/**
 * PDFManager - Centralizes all PDF operations
 */
class PDFManager {
    constructor() {
        this.isInitialized = false;
        this.pdfDirectory = '';
        this.html2pdfInstance = null;
    }

    /**
     * Initialize the PDF manager
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('PDFManager already initialized');
            return this;
        }

        // Set PDF directory if provided
        this.pdfDirectory = options.pdfDirectory || '';
        
        // Load directory from settings if not provided
        if (!this.pdfDirectory) {
            this._loadPdfDirectory();
        }
        
        // Set the html2pdf instance if available
        this.html2pdfInstance = window.html2pdf || null;
        
        // Check if html2pdf is available
        if (!this.html2pdfInstance && typeof html2pdf !== 'undefined') {
            this.html2pdfInstance = html2pdf;
        }
        
        if (!this.html2pdfInstance) {
            console.warn('html2pdf library not found, PDF generation may not work');
        }
        
        this.isInitialized = true;
        
        // Register for settings changes
        if (window.SettingsManager) {
            window.SettingsManager.on('settings-updated', this._handleSettingsUpdated.bind(this));
        }
        
        return this;
    }
    
    /**
     * Load PDF directory from settings
     * @private
     */
    _loadPdfDirectory() {
        return tryCatch(async () => {
            // Try to get paths from API first
            if (window.api && window.api.getPaths) {
                try {
                    const paths = await window.api.getPaths();
                    this.pdfDirectory = paths.pdf || paths.documents || '';
                    return this.pdfDirectory;
                } catch (error) {
                    ErrorHandlingManager.handleWarning(error, 'pdf-manager', {
                        message: 'Failed to get PDF directory from API, falling back to settings'
                    });
                }
            }
            
            // Fall back to settings
            const settings = JSON.parse(localStorage.getItem('settings') || '{}');
            this.pdfDirectory = settings.pdfDirectory || '';
            
            return this.pdfDirectory;
        }, '', 'pdf-manager');
    }
    
    /**
     * Handle settings update event
     * @private
     */
    _handleSettingsUpdated(settings) {
        if (settings && settings.pdfDirectory) {
            this.pdfDirectory = settings.pdfDirectory;
        }
    }

    /**
     * Create a detailed PDF with each item on a separate page
     * @param {Array} items - Array of data items
     * @param {Function} generateItemHTML - Function to generate HTML for each item
     * @param {string} filename - Name of the output file
     * @returns {Promise} - Promise resolving to the result of the PDF generation
     */
    createDetailedPDF(items, generateItemHTML, filename) {
        return tryCatch(async () => {
            if (!this.isInitialized) {
                this.initialize();
            }
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new Error('No items provided for PDF generation');
            }
            
            if (!generateItemHTML || typeof generateItemHTML !== 'function') {
                throw new Error('No HTML generator function provided');
            }
            
            if (!filename) {
                throw new Error('No filename provided');
            }
            
            console.log(`Creating PDF for ${items.length} items with filename ${filename}`);
            
            // Check if we have a large dataset
            const isLargeDataset = items.length > 20;
            console.log(`PDF generation started. Large dataset: ${isLargeDataset}`);
            
            // For large datasets, use a simpler approach with batching
            if (isLargeDataset) {
                return this._createBatchedPDF(items, generateItemHTML, filename);
            }
            
            // Create a container for all items
            const container = document.createElement('div');
            container.className = 'pdf-container';
            container.style.cssText = 'font-family: Arial, sans-serif; color: #333;';
            
            // Add each item to the container
            items.forEach((item, index) => {
                // Create item container
                const itemContainer = document.createElement('div');
                itemContainer.className = 'pdf-item';
                itemContainer.style.cssText = 'margin-bottom: 20px; page-break-after: always; padding: 20px;';
                
                // Add item HTML
                itemContainer.innerHTML = generateItemHTML(item);
                
                // Add to main container
                container.appendChild(itemContainer);
            });
            
            // Temporarily add to document to render
            document.body.appendChild(container);
            
            // Configure PDF options
            const opt = {
                margin: 10,
                filename: filename, // For html2pdf internal handling
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // Show loading indicator if available
            if (window.UI && typeof window.UI.showLoading === 'function') {
                window.UI.showLoading(true);
            }
            
            try {
                // Generate PDF using the html2pdf library
                if (!this.html2pdfInstance) {
                    throw new Error('html2pdf library not available');
                }
                
                // First try the direct blob output approach
                const pdfBlob = await this.html2pdfInstance()
                    .set(opt)
                    .from(container)
                    .outputPdf('blob');
                
                // Convert blob to binary using FileReader
                const pdfBinary = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(pdfBlob);
                });
                
                // Save to PDF directory using API
                const result = await window.api.invoke('save-pdf', {
                    content: new Uint8Array(pdfBinary),
                    filename: filename
                });
                
                // Remove container after PDF is generated
                document.body.removeChild(container);
                
                // Hide loading indicator if available
                if (window.UI && typeof window.UI.showLoading === 'function') {
                    window.UI.showLoading(false);
                }
                
                if (!result.success) {
                    throw new Error(result.error || 'Unknown error saving PDF');
                }
                
                // Show success notification
                if (window.Core && typeof window.Core.showToast === 'function') {
                    window.Core.showToast(`PDF saved to ${result.path}`, 'success');
                }
                
                return {
                    success: true,
                    path: result.path
                };
            } catch (error) {
                // Remove container on error
                if (container.parentNode) {
                    document.body.removeChild(container);
                }
                
                // Hide loading indicator if available
                if (window.UI && typeof window.UI.showLoading === 'function') {
                    window.UI.showLoading(false);
                }
                
                // Show error notification
                ErrorHandlingManager.handleError(error, 'pdf-manager', ErrorHandlingManager.ERROR_LEVELS.ERROR, {
                    message: 'Error creating PDF',
                    filename: filename
                });
                
                return {
                    success: false,
                    error: error.message
                };
            }
        }, { success: false, error: 'PDF generation failed' }, 'pdf-manager');
    }

    /**
     * Create a PDF for large datasets by processing in batches
     * @param {Array} items - Array of data items
     * @param {Function} generateItemHTML - Function to generate HTML for each item
     * @param {string} filename - Name of the output file
     * @returns {Promise} - Promise resolving to the result of the PDF generation
     * @private
     */
    _createBatchedPDF(items, generateItemHTML, filename) {
        return tryCatch(async () => {
            console.log(`Creating batched PDF for ${items.length} items`);
            
            // Max items per batch
            const BATCH_SIZE = 10;
            
            // Create a container for all items
            const container = document.createElement('div');
            container.className = 'pdf-container';
            container.style.cssText = 'font-family: Arial, sans-serif; color: #333;';
            
            // Process items in batches
            const numBatches = Math.ceil(items.length / BATCH_SIZE);
            console.log(`Processing in ${numBatches} batches of ${BATCH_SIZE} items each`);
            
            // Add items to container in simplified format
            items.forEach((item, index) => {
                // Create simple item container with minimal styling
                const itemContainer = document.createElement('div');
                itemContainer.className = 'pdf-item-compact';
                itemContainer.style.cssText = 'margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 10px;';
                
                // Add page break every few items
                if (index > 0 && index % 5 === 0) {
                    itemContainer.style.pageBreakBefore = 'always';
                }
                
                // Generate simplified HTML
                itemContainer.innerHTML = this._generateSimplifiedHTML(item, generateItemHTML);
                
                // Add to main container
                container.appendChild(itemContainer);
            });
            
            // Temporarily add to document to render
            document.body.appendChild(container);
            
            // Configure PDF options
            const opt = {
                margin: 10,
                filename: filename,
                image: { type: 'jpeg', quality: 0.9 }, // Lower quality for performance
                html2canvas: { scale: 1.5 },           // Lower scale for performance
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // Show loading indicator if available
            if (window.UI && typeof window.UI.showLoading === 'function') {
                window.UI.showLoading(true);
            }
            
            try {
                // Generate PDF using the html2pdf library
                if (!this.html2pdfInstance) {
                    throw new Error('html2pdf library not available');
                }
                
                // Generate PDF blob
                const pdfBlob = await this.html2pdfInstance()
                    .set(opt)
                    .from(container)
                    .outputPdf('blob');
                
                // Convert blob to binary using FileReader
                const pdfBinary = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(pdfBlob);
                });
                
                // Save to PDF directory using API
                const result = await window.api.invoke('save-pdf', {
                    content: new Uint8Array(pdfBinary),
                    filename: filename
                });
                
                // Remove container after PDF is generated
                document.body.removeChild(container);
                
                // Hide loading indicator if available
                if (window.UI && typeof window.UI.showLoading === 'function') {
                    window.UI.showLoading(false);
                }
                
                if (!result.success) {
                    throw new Error(result.error || 'Unknown error saving PDF');
                }
                
                // Show success notification
                if (window.Core && typeof window.Core.showToast === 'function') {
                    window.Core.showToast(`PDF saved to ${result.path}`, 'success');
                }
                
                return {
                    success: true,
                    path: result.path
                };
            } catch (error) {
                // Remove container on error
                if (container.parentNode) {
                    document.body.removeChild(container);
                }
                
                // Hide loading indicator if available
                if (window.UI && typeof window.UI.showLoading === 'function') {
                    window.UI.showLoading(false);
                }
                
                // Show error notification
                ErrorHandlingManager.handleError(error, 'pdf-manager', ErrorHandlingManager.ERROR_LEVELS.ERROR, {
                    message: 'Error creating batched PDF',
                    filename: filename
                });
                
                return {
                    success: false,
                    error: error.message
                };
            }
        }, { success: false, error: 'Batched PDF generation failed' }, 'pdf-manager');
    }
    
    /**
     * Generate simplified HTML for large datasets
     * @param {Object} item - The data item
     * @param {Function} generateItemHTML - The original HTML generator function
     * @returns {string} - Simplified HTML
     * @private
     */
    _generateSimplifiedHTML(item, generateItemHTML) {
        // Try to use the original generator but simplify the result
        const originalHTML = generateItemHTML(item);
        
        // Extract the main content from the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHTML;
        
        // Keep only essential elements and remove excessive styling
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const paragraphs = tempDiv.querySelectorAll('p');
        
        // Create a new div for the simplified content
        const simplifiedDiv = document.createElement('div');
        
        // Add title (first heading)
        if (headings.length > 0) {
            const titleElem = document.createElement('h3');
            titleElem.style.cssText = 'margin: 5px 0; color: #2c3e50; font-size: 16px;';
            titleElem.textContent = headings[0].textContent;
            simplifiedDiv.appendChild(titleElem);
        }
        
        // Add key information (first few paragraphs)
        const maxParagraphs = 3;
        const paraCount = Math.min(paragraphs.length, maxParagraphs);
        
        for (let i = 0; i < paraCount; i++) {
            const paraElem = document.createElement('p');
            paraElem.style.cssText = 'margin: 3px 0; font-size: 12px;';
            paraElem.textContent = paragraphs[i].textContent.substring(0, 150);
            if (paragraphs[i].textContent.length > 150) {
                paraElem.textContent += '...';
            }
            simplifiedDiv.appendChild(paraElem);
        }
        
        return simplifiedDiv.innerHTML;
    }
    
    /**
     * Export characters to PDF
     * @returns {Promise} - Promise resolving to the result of the PDF generation
     */
    exportCharactersToPDF() {
        return tryCatch(async () => {
            if (!this.isInitialized) {
                this.initialize();
            }
            
            console.log('Exporting characters to PDF...');
            
            // Get the current database name for the filename
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            const filename = `${dbName}-characters.pdf`;
            
            // Ensure we have characters data
            if (!window.characters || !Array.isArray(window.characters)) {
                throw new Error('No characters data available');
            }
            
            const characters = window.characters;
            console.log(`Found ${characters.length} characters to export`);
            
            // Function to generate HTML for a character
            const generateCharacterHTML = (character) => {
                return `
                    <div>
                        <h2 style="color: #3498db; margin: 0 0 15px 0;">${character.firstName || ''} ${character.lastName || ''}</h2>
                        <div style="display: flex; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px; margin-right: 20px;">
                                <h3 style="color: #555; margin: 10px 0;">Personal Information</h3>
                                <p><strong>Age:</strong> ${character.age || 'N/A'}</p>
                                <p><strong>Gender:</strong> ${character.gender || 'N/A'}</p>
                                <p><strong>Occupation:</strong> ${character.occupation || 'N/A'}</p>
                            </div>
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555; margin: 10px 0;">Story Context</h3>
                                <p><strong>Role:</strong> ${character.role || 'N/A'}</p>
                                <p><strong>Series:</strong> ${character.series || 'N/A'}</p>
                                <p><strong>Book:</strong> ${character.book || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Description</h3>
                            <p>${character.description || 'No description available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Notes</h3>
                            <p>${character.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                `;
            };
            
            // Call the createDetailedPDF function
            return this.createDetailedPDF(characters, generateCharacterHTML, filename);
        }, { success: false, error: 'Failed to export characters to PDF' }, 'pdf-manager');
    }
    
    /**
     * Export locations to PDF
     * @returns {Promise} - Promise resolving to the result of the PDF generation
     */
    exportLocationsToPDF() {
        return tryCatch(async () => {
            if (!this.isInitialized) {
                this.initialize();
            }
            
            console.log('Exporting locations to PDF...');
            
            // Get the current database name for the filename
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            const filename = `${dbName}-locations.pdf`;
            
            // Ensure we have locations data
            if (!window.locations || !Array.isArray(window.locations)) {
                throw new Error('No locations data available');
            }
            
            const locations = window.locations;
            console.log(`Found ${locations.length} locations to export`);
            
            // Function to generate HTML for a location
            const generateLocationHTML = (location) => {
                return `
                    <div>
                        <h2 style="color: #3498db; margin: 0 0 15px 0;">${location.name || 'Unnamed Location'}</h2>
                        <div style="display: flex; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px; margin-right: 20px;">
                                <h3 style="color: #555; margin: 10px 0;">Basic Information</h3>
                                <p><strong>Type:</strong> ${location.type || 'N/A'}</p>
                                <p><strong>Region:</strong> ${location.region || 'N/A'}</p>
                                <p><strong>Country:</strong> ${location.country || 'N/A'}</p>
                            </div>
                            <div style="flex: 1; min-width: 300px;">
                                <h3 style="color: #555; margin: 10px 0;">Story Context</h3>
                                <p><strong>Series:</strong> ${location.series || 'N/A'}</p>
                                <p><strong>Book:</strong> ${location.book || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Description</h3>
                            <p>${location.description || 'No description available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Notes</h3>
                            <p>${location.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                `;
            };
            
            // Call the createDetailedPDF function
            return this.createDetailedPDF(locations, generateLocationHTML, filename);
        }, { success: false, error: 'Failed to export locations to PDF' }, 'pdf-manager');
    }
    
    /**
     * Export plots to PDF
     * @returns {Promise} - Promise resolving to the result of the PDF generation
     */
    exportPlotsToPDF() {
        return tryCatch(async () => {
            if (!this.isInitialized) {
                this.initialize();
            }
            
            console.log('Exporting plots to PDF...');
            
            // Get the current database name for the filename
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            const filename = `${dbName}-plots.pdf`;
            
            // Ensure we have plots data
            if (!window.plots || !Array.isArray(window.plots)) {
                throw new Error('No plots data available');
            }
            
            const plots = window.plots;
            console.log(`Found ${plots.length} plots to export`);
            
            // Function to generate HTML for a plot
            const generatePlotHTML = (plot) => {
                return `
                    <div>
                        <h2 style="color: #3498db; margin: 0 0 15px 0;">${plot.title || 'Unnamed Plot'}</h2>
                        <div style="display: flex; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px; margin-right: 20px;">
                                <h3 style="color: #555; margin: 10px 0;">Basic Information</h3>
                                <p><strong>Type:</strong> ${plot.type || 'N/A'}</p>
                                <p><strong>Series:</strong> ${plot.series || 'N/A'}</p>
                                <p><strong>Book:</strong> ${plot.book || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Summary</h3>
                            <p>${plot.summary || 'No summary available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Details</h3>
                            <p>${plot.details || 'No details available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Notes</h3>
                            <p>${plot.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                `;
            };
            
            // Call the createDetailedPDF function
            return this.createDetailedPDF(plots, generatePlotHTML, filename);
        }, { success: false, error: 'Failed to export plots to PDF' }, 'pdf-manager');
    }
    
    /**
     * Export world building elements to PDF
     * @returns {Promise} - Promise resolving to the result of the PDF generation
     */
    exportWorldBuildingToPDF() {
        return tryCatch(async () => {
            if (!this.isInitialized) {
                this.initialize();
            }
            
            console.log('Exporting world building to PDF...');
            
            // Get the current database name for the filename
            const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
            const filename = `${dbName}-world-building.pdf`;
            
            // Ensure we have world building data
            if (!window.worldBuilding || !Array.isArray(window.worldBuilding)) {
                throw new Error('No world building data available');
            }
            
            const worldBuilding = window.worldBuilding;
            console.log(`Found ${worldBuilding.length} world building elements to export`);
            
            // Function to generate HTML for a world building element
            const generateWorldBuildingHTML = (element) => {
                return `
                    <div>
                        <h2 style="color: #3498db; margin: 0 0 15px 0;">${element.name || 'Unnamed Element'}</h2>
                        <div style="display: flex; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px; margin-right: 20px;">
                                <h3 style="color: #555; margin: 10px 0;">Basic Information</h3>
                                <p><strong>Category:</strong> ${element.category || 'N/A'}</p>
                                <p><strong>Series:</strong> ${element.series || 'N/A'}</p>
                                <p><strong>Book:</strong> ${element.book || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Description</h3>
                            <p>${element.description || 'No description available.'}</p>
                        </div>
                        <div>
                            <h3 style="color: #555; margin: 15px 0 10px 0;">Notes</h3>
                            <p>${element.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                `;
            };
            
            // Call the createDetailedPDF function
            return this.createDetailedPDF(worldBuilding, generateWorldBuildingHTML, filename);
        }, { success: false, error: 'Failed to export world building to PDF' }, 'pdf-manager');
    }
}

// Create a singleton instance
const pdfManager = new PDFManager();

// Initialize with default settings
pdfManager.initialize();

// Export the singleton instance
export { pdfManager as PDFManager };

// Also make available globally
window.PDFManager = pdfManager;
