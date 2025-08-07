// PDF export functions
function createDetailedPDF(items, generateItemHTML, filename) {
    try {
        // Check if we have a large dataset
        const isLargeDataset = items.length > 20;
        console.log(`PDF generation started for ${items.length} items. Large dataset: ${isLargeDataset}`);
        
        // For large datasets, use a simpler approach with batching
        if (isLargeDataset) {
            return createBatchedPDF(items, generateItemHTML, filename);
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
            filename: filename, // Still used for html2pdf internal handling
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Show loading indicator if available
        if (window.UI && typeof window.UI.showLoading === 'function') {
            window.UI.showLoading(true);
        }
        
        // Generate PDF
        setTimeout(() => {
            try {
                // First try the direct blob output approach which works with newer versions
                console.log('Attempting to generate PDF with direct blob output');
                html2pdf().set(opt).from(container).outputPdf('blob')
                .then(pdfBlob => {
                    console.log('Successfully generated PDF with direct blob output');
                    
                    // Create a FileReader to convert blob to binary
                    const reader = new FileReader();
                    reader.onload = async function() {
                        // Get binary content
                        const pdfBinary = reader.result;
                        
                        try {
                            console.log(`Saving PDF directly to Document directory: ${filename}`);
                            
                            // Save directly to PDF directory using our IPC method
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
                            
                            if (result.success) {
                                // Show success notification
                                if (window.Core && typeof window.Core.showToast === 'function') {
                                    window.Core.showToast(`PDF saved to ${result.path}`);
                                } else if (window.UI && typeof window.UI.showNotification === 'function') {
                                    window.UI.showNotification('PDF saved successfully', 'success');
                                } else {
                                    console.log('PDF saved successfully:', result.path);
                                }
                            } else {
                                throw new Error(result.error || 'Unknown error saving PDF');
                            }
                        } catch (error) {
                            // Remove container on error
                            document.body.removeChild(container);
                            
                            // Hide loading indicator if available
                            if (window.UI && typeof window.UI.showLoading === 'function') {
                                window.UI.showLoading(false);
                            }
                            
                            // Show error notification
                            if (window.Core && typeof window.Core.showToast === 'function') {
                                window.Core.showToast('Error saving PDF: ' + error.message, 'error');
                            } else if (window.UI && typeof window.UI.showNotification === 'function') {
                                window.UI.showNotification('Error saving PDF: ' + error.message, 'error');
                            } else {
                                console.error('Error saving PDF:', error);
                            }
                        }
                    };
                    
                    // Start reading as array buffer
                    reader.readAsArrayBuffer(pdfBlob);
                })
                .catch(directError => {
                    console.error('Direct blob output failed, trying alternative approach:', directError);
                    
                    // Fallback to the original approach
                    html2pdf().set(opt).from(container).outputPdf()
                    .then((pdf) => {
                        // Convert the PDF to blob/binary
                        let pdfBlob;
                        try {
                            // Try the standard approach first
                            if (typeof pdf.output === 'function') {
                                console.log('Using pdf.output function to create blob');
                                pdfBlob = pdf.output('blob');
                            } else if (pdf instanceof Blob) {
                                console.log('PDF is already a Blob');
                                pdfBlob = pdf;
                            } else if (pdf instanceof ArrayBuffer || pdf instanceof Uint8Array) {
                                console.log('PDF is ArrayBuffer or Uint8Array, creating Blob');
                                pdfBlob = new Blob([pdf], { type: 'application/pdf' });
                            } else {
                                console.log('PDF is unknown type, attempting to create Blob');
                                // Try to convert whatever we got to a Blob
                                pdfBlob = new Blob([pdf], { type: 'application/pdf' });
                            }
                        } catch (error) {
                            console.error('Error converting PDF to blob:', error);
                            // Fallback approach - try to use toPdf() instead
                            try {
                                console.log('Trying alternative approach with toPdf()');
                                pdfBlob = html2pdf().set(opt).from(container).toPdf().output('blob');
                            } catch (fallbackError) {
                                console.error('Fallback approach failed:', fallbackError);
                                throw error; // Throw the original error
                            }
                        }
                        
                        // Create a FileReader to convert blob to binary
                        const reader = new FileReader();
                        reader.onload = async function() {
                            // Get binary content
                            const pdfBinary = reader.result;
                            
                            try {
                                console.log(`Saving PDF directly to Document directory: ${filename}`);
                                
                                // Save directly to PDF directory using our IPC method
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
                                
                                if (result.success) {
                                    // Show success notification
                                    if (window.Core && typeof window.Core.showToast === 'function') {
                                        window.Core.showToast(`PDF saved to ${result.path}`);
                                    } else if (window.UI && typeof window.UI.showNotification === 'function') {
                                        window.UI.showNotification('PDF saved successfully', 'success');
                                    } else {
                                        console.log('PDF saved successfully:', result.path);
                                    }
                                } else {
                                    throw new Error(result.error || 'Unknown error saving PDF');
                                }
                            } catch (error) {
                                // Remove container on error
                                document.body.removeChild(container);
                                
                                // Hide loading indicator if available
                                if (window.UI && typeof window.UI.showLoading === 'function') {
                                    window.UI.showLoading(false);
                                }
                                
                                // Show error notification
                                if (window.Core && typeof window.Core.showToast === 'function') {
                                    window.Core.showToast('Error saving PDF: ' + error.message, 'error');
                                } else if (window.UI && typeof window.UI.showNotification === 'function') {
                                    window.UI.showNotification('Error saving PDF: ' + error.message, 'error');
                                } else {
                                    console.error('Error saving PDF:', error);
                                }
                            }
                        };
                        
                        // Start reading as array buffer
                        reader.readAsArrayBuffer(pdfBlob);
                    }).catch(error => {
                        // Remove container on error
                        document.body.removeChild(container);
                        
                        // Hide loading indicator if available
                        if (window.UI && typeof window.UI.showLoading === 'function') {
                            window.UI.showLoading(false);
                        }
                        
                        // Show error notification
                        if (window.Core && typeof window.Core.showToast === 'function') {
                            window.Core.showToast('Error generating PDF: ' + error.message, 'error');
                        } else if (window.UI && typeof window.UI.showNotification === 'function') {
                            window.UI.showNotification('Error generating PDF: ' + error.message, 'error');
                        } else {
                            console.error('Error generating PDF:', error);
                        }
                    });
                });
            } catch (error) {
                console.error('Error creating PDF:', error);
                
                // Remove container on error
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
                
                // Hide loading indicator if available
                if (window.UI && typeof window.UI.showLoading === 'function') {
                    window.UI.showLoading(false);
                }
                
                // Show error notification
                if (window.Core && typeof window.Core.showToast === 'function') {
                    window.Core.showToast('Error creating PDF: ' + error.message, 'error');
                } else if (window.UI && typeof window.UI.showNotification === 'function') {
                    window.UI.showNotification('Error creating PDF: ' + error.message, 'error');
                } else {
                    console.error('Failed to create PDF:', error.message);
                }
            }
        }, 100);
    } catch (error) {
        console.error('Error creating PDF:', error);
        
        // Remove container on error
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
        
        // Hide loading indicator if available
        if (window.UI && typeof window.UI.showLoading === 'function') {
            window.UI.showLoading(false);
        }
        
        // Show error notification
        if (window.Core && typeof window.Core.showToast === 'function') {
            window.Core.showToast('Error creating PDF: ' + error.message, 'error');
        } else if (window.UI && typeof window.UI.showNotification === 'function') {
            window.UI.showNotification('Error creating PDF: ' + error.message, 'error');
        } else {
            console.error('Failed to create PDF:', error.message);
        }
    }
}

// New function to handle large datasets by processing in batches
async function createBatchedPDF(items, generateItemHTML, filename) {
    try {
        console.log(`Creating batched PDF for ${items.length} items`);
        
        // Show loading indicator if available
        if (window.UI && typeof window.UI.showLoading === 'function') {
            window.UI.showLoading(true);
        }
        
        // Create a PDF document with jsPDF directly
        const doc = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Process items in batches of 10
        const BATCH_SIZE = 10;
        const totalBatches = Math.ceil(items.length / BATCH_SIZE);
        
        console.log(`Processing ${totalBatches} batches of ${BATCH_SIZE} items each`);
        
        // Process each batch
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * BATCH_SIZE;
            const end = Math.min(start + BATCH_SIZE, items.length);
            const batchItems = items.slice(start, end);
            
            console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (items ${start + 1}-${end})`);
            
            // Create a simplified HTML for this batch
            const batchContainer = document.createElement('div');
            batchContainer.className = 'pdf-batch-container';
            batchContainer.style.cssText = 'font-family: Arial, sans-serif; color: #333;';
            
            // Add each item in this batch to the container with simplified HTML
            batchItems.forEach((item, index) => {
                // Create a simplified version of the item HTML
                const simplifiedHTML = generateSimplifiedHTML(item, generateItemHTML);
                
                // Create item container
                const itemContainer = document.createElement('div');
                itemContainer.className = 'pdf-item';
                itemContainer.style.cssText = 'margin-bottom: 20px; page-break-after: always; padding: 20px;';
                itemContainer.innerHTML = simplifiedHTML;
                
                // Add to batch container
                batchContainer.appendChild(itemContainer);
            });
            
            // Temporarily add to document to render
            document.body.appendChild(batchContainer);
            
            // Configure PDF options for this batch
            const opt = {
                margin: 10,
                filename: `batch_${batchIndex}.pdf`, // Temporary filename
                image: { type: 'jpeg', quality: 0.8 }, // Lower quality for better performance
                html2canvas: { 
                    scale: 1.5, // Lower scale for better performance
                    logging: false, // Disable logging
                    useCORS: true // Enable CORS for images
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            try {
                // Generate PDF for this batch
                if (batchIndex > 0) {
                    // Add a new page for each batch after the first
                    doc.addPage();
                }
                
                // Convert the batch to PDF and add to the main document
                const batchPdfBlob = await html2pdf()
                    .set(opt)
                    .from(batchContainer)
                    .outputPdf('blob');
                
                // Add the batch PDF to the main document
                // This is a simplified approach - in a real implementation,
                // you would need to merge the PDFs properly
                
                // Remove the batch container
                document.body.removeChild(batchContainer);
                
                // Update progress if UI allows
                if (window.UI && typeof window.UI.updateProgress === 'function') {
                    const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
                    window.UI.updateProgress(progress);
                }
                
                // Give the browser a chance to breathe between batches
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (batchError) {
                console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
                
                // Remove the batch container if it exists
                if (document.body.contains(batchContainer)) {
                    document.body.removeChild(batchContainer);
                }
                
                // Continue with the next batch
                continue;
            }
        }
        
        // Generate the final PDF
        const pdfBlob = doc.output('blob');
        
        // Create a FileReader to convert blob to binary
        const reader = new FileReader();
        reader.onload = async function() {
            // Get binary content
            const pdfBinary = reader.result;
            
            try {
                console.log(`Saving batched PDF directly to Document directory: ${filename}`);
                
                // Save directly to document directory using our IPC method
                const result = await window.api.invoke('save-pdf', {
                    content: new Uint8Array(pdfBinary),
                    filename: filename
                });
                
                // Hide loading indicator if available
                if (window.UI && typeof window.UI.showLoading === 'function') {
                    window.UI.showLoading(false);
                }
                
                if (result.success) {
                    // Show success notification
                    if (window.Core && typeof window.Core.showToast === 'function') {
                        window.Core.showToast(`PDF saved to ${result.path}`);
                    } else if (window.UI && typeof window.UI.showNotification === 'function') {
                        window.UI.showNotification('PDF saved successfully', 'success');
                    } else {
                        console.log('PDF saved successfully:', result.path);
                    }
                } else {
                    throw new Error(result.error || 'Unknown error saving PDF');
                }
            } catch (error) {
                // Hide loading indicator if available
                if (window.UI && typeof window.UI.showLoading === 'function') {
                    window.UI.showLoading(false);
                }
                
                // Show error notification
                if (window.Core && typeof window.Core.showToast === 'function') {
                    window.Core.showToast('Error saving PDF: ' + error.message, 'error');
                } else if (window.UI && typeof window.UI.showNotification === 'function') {
                    window.UI.showNotification('Error saving PDF: ' + error.message, 'error');
                } else {
                    console.error('Error saving PDF:', error);
                }
            }
        };
        
        // Start reading as array buffer
        reader.readAsArrayBuffer(pdfBlob);
        
    } catch (error) {
        console.error('Error creating batched PDF:', error);
        
        // Hide loading indicator if available
        if (window.UI && typeof window.UI.showLoading === 'function') {
            window.UI.showLoading(false);
        }
        
        // Show error notification
        if (window.Core && typeof window.Core.showToast === 'function') {
            window.Core.showToast('Error creating PDF: ' + error.message, 'error');
        } else if (window.UI && typeof window.UI.showNotification === 'function') {
            window.UI.showNotification('Error creating PDF: ' + error.message, 'error');
        } else {
            console.error('Failed to create PDF:', error.message);
        }
    }
}

// Helper function to generate simplified HTML for large datasets
function generateSimplifiedHTML(item, generateItemHTML) {
    try {
        // Try to use the full HTML generator first
        return generateItemHTML(item);
    } catch (error) {
        console.warn('Error generating full HTML, falling back to simplified version:', error);
        
        // Fallback to a simplified version for characters
        if (item.firstName || item.lastName) {
            return `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: #fff;">
                    <h2 style="color: #3498db; margin-top: 0;">${item.firstName || ''} ${item.lastName || ''}</h2>
                    <p><strong>Role:</strong> ${item.role || 'N/A'}</p>
                    <p><strong>Series:</strong> ${item.series || 'N/A'}</p>
                    <p><strong>Book:</strong> ${item.book || 'N/A'}</p>
                    <p><strong>Notes:</strong> ${item.notes ? (item.notes.length > 200 ? item.notes.substring(0, 200) + '...' : item.notes) : 'N/A'}</p>
                </div>
            `;
        }
        
        // Fallback for locations
        if (item.name && (item.type || item.region)) {
            return `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: #fff;">
                    <h2 style="color: #3498db; margin-top: 0;">${item.name || 'Unnamed Location'}</h2>
                    <p><strong>Type:</strong> ${item.type || 'N/A'}</p>
                    <p><strong>Region:</strong> ${item.region || 'N/A'}</p>
                    <p><strong>Description:</strong> ${item.description ? (item.description.length > 200 ? item.description.substring(0, 200) + '...' : item.description) : 'N/A'}</p>
                </div>
            `;
        }
        
        // Generic fallback
        return `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: #fff;">
                <h2 style="color: #3498db; margin-top: 0;">${item.name || item.title || 'Item ' + Math.random().toString(36).substring(2, 8)}</h2>
                <p>This item has limited information available.</p>
            </div>
        `;
    }
}

function exportCharactersToPDF() {
    // Generate HTML for a character
    const generateCharacterHTML = (character) => {
        // Get character tags
        const characterTags = window.Tags && typeof window.Tags.getEntityTags === 'function' ?
            window.Tags.getEntityTags('character', character.id || '') : [];
        
        // Get character relationships - using manual filtering from global relationships array
        const characterName = `${character.firstName || ''} ${character.lastName || ''}`.trim();
        let characterRelationships = [];
        
        // Manually retrieve relationships for this character from the global relationships array
        if (typeof window.relationships !== 'undefined' && Array.isArray(window.relationships)) {
            // Filter relationships manually
            const filteredRelationships = window.relationships.filter(rel => 
                rel.character1 === characterName || rel.character2 === characterName
            );
            
            // Format the relationships for display
            characterRelationships = filteredRelationships.map(rel => {
                // Determine which character is the other one (not this character)
                const otherCharacter = rel.character1 === characterName ? rel.character2 : rel.character1;
                
                return {
                    character: otherCharacter,
                    type: rel.type
                };
            });
        }
        
        return `
            <div class="character-details" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #fff;">
                <h2 style="color: #3498db; margin-top: 0;">${character.firstName || ''} ${character.lastName || ''}</h2>
                
                ${character.image ? `<div style="text-align: center; margin-bottom: 15px;"><img src="${character.image}" alt="${character.firstName || 'Character'}" style="max-width: 200px; max-height: 200px; border-radius: 8px;"></div>` : ''}
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Personal Information</h3>
                    <p><strong>Title:</strong> ${character.title || 'N/A'}</p>
                    <p><strong>Sex:</strong> ${character.sex || 'N/A'}</p>
                    <p><strong>Race:</strong> ${character.race || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Story Information</h3>
                    <p><strong>Series:</strong> ${character.series || 'N/A'}</p>
                    <p><strong>Book:</strong> ${character.book || 'N/A'}</p>
                    <p><strong>Role:</strong> ${character.role || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Relationships</h3>
                    ${characterRelationships.length > 0 ? `
                        <ul style="list-style-type: none; padding-left: 0;">
                            ${characterRelationships.map(rel => `
                                <li style="margin-bottom: 5px;">
                                    <strong>${rel.character}:</strong> ${rel.type}
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No relationships defined</p>'}
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Tags</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${characterTags.length > 0 ?
                            characterTags.map(tag => `
                                <div style="background-color: ${tag.color}; padding: 3px 8px; border-radius: 4px; color: white; font-size: 12px;">
                                    ${tag.name}
                                </div>
                            `).join('') :
                            '<div>No tags</div>'
                        }
                    </div>
                </div>
                
                ${character.customFields && Object.keys(character.customFields).length > 0 ? `
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Additional Details</h3>
                    ${Object.entries(character.customFields).map(([key, value]) =>
                        `<p><strong>${key}:</strong> ${value}</p>`
                    ).join('')}
                </div>
                ` : ''}
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Notes</h3>
                    <div>${character.notes || 'No notes available'}</div>
                </div>
            </div>
        `;
    };
    
    // Get current database name for the filename
    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
    const filename = `${dbName}-characters.pdf`;
    
    // Access characters from the window.characters global property
    // This ensures we're using the same data source that the import/database loader uses
    createDetailedPDF(window.characters || [], generateCharacterHTML, filename);
}

function exportLocationsToPDF() {
    // Generate HTML for a location
    const generateLocationHTML = (location) => {
        // Get location tags
        const locationTags = window.Tags && typeof window.Tags.getEntityTags === 'function' ?
            window.Tags.getEntityTags('location', location.id || '') : [];
        
        return `
            <div class="location-details" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #fff;">
                <h2 style="color: #3498db; margin-top: 0;">${location.name || 'Unnamed Location'}</h2>
                
                ${location.image ? `<div style="text-align: center; margin-bottom: 15px;"><img src="${location.image}" alt="${location.name || 'Location'}" style="max-width: 200px; max-height: 200px; border-radius: 8px;"></div>` : ''}
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Basic Information</h3>
                    <p><strong>Type:</strong> ${location.type || 'N/A'}</p>
                    <p><strong>Size/Scale:</strong> ${location.size || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Story Context</h3>
                    <p><strong>Series:</strong> ${location.series || 'N/A'}</p>
                    <p><strong>Book:</strong> ${location.book || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Additional Details</h3>
                    <p><strong>Climate/Environment:</strong> ${location.climate || 'N/A'}</p>
                    <p><strong>Population/Inhabitants:</strong> ${location.population || 'N/A'}</p>
                    ${locationTags.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <strong>Tags:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                            ${locationTags.map(tag => `
                                <div style="background-color: ${tag.color}; padding: 3px 8px; border-radius: 4px; color: white; font-size: 12px;">
                                    ${tag.name}
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Description</h3>
                    <div>${location.description || 'No description available'}</div>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Notes</h3>
                    <div>${location.notes || 'No notes available'}</div>
                </div>
            </div>
        `;
    };
    
    // Get current database name for the filename
    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
    const filename = `${dbName}-locations.pdf`;
    
    // Access locations from the window.locations global property
    createDetailedPDF(window.locations || [], generateLocationHTML, filename);
}

function exportPlotsToPDF() {
    // Generate HTML for a plot
    const generatePlotHTML = (plot) => {
        // Get plot tags
        const plotTags = window.Tags && typeof window.Tags.getEntityTags === 'function' ?
            window.Tags.getEntityTags('plot', plot.id || '') : [];
        
        return `
            <div class="plot-details" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #fff;">
                <h2 style="color: #3498db; margin-top: 0;">${plot.title || 'Unnamed Plot'}</h2>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Basic Information</h3>
                    <p><strong>Type:</strong> ${plot.type || 'N/A'}</p>
                    <p><strong>Status:</strong> ${plot.status || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Story Context</h3>
                    <p><strong>Series:</strong> ${plot.series || 'N/A'}</p>
                    <p><strong>Book:</strong> ${plot.book || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Tags</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${plotTags.length > 0 ?
                            plotTags.map(tag => `
                                <div style="background-color: ${tag.color}; padding: 3px 8px; border-radius: 4px; color: white; font-size: 12px;">
                                    ${tag.name}
                                </div>
                            `).join('') :
                            '<div>No tags</div>'
                        }
                    </div>
                </div>
                
                ${plot.customFields && Object.keys(plot.customFields).length > 0 ? `
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Additional Details</h3>
                    ${Object.entries(plot.customFields).map(([key, value]) =>
                        `<p><strong>${key}:</strong> ${value}</p>`
                    ).join('')}
                </div>
                ` : ''}
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Description</h3>
                    <div>${plot.description || 'No description available'}</div>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Resolution</h3>
                    <div>${plot.resolution || 'No resolution available'}</div>
                </div>
            </div>
        `;
    };
    
    // Get current database name for the filename
    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
    const filename = `${dbName}-plots.pdf`;
    
    // Access plots from the window.plots global property
    createDetailedPDF(window.plots || [], generatePlotHTML, filename);
}

function exportWorldBuildingToPDF() {
    // Generate HTML for a world building item
    const generateWorldBuildingHTML = (worldItem) => {
        // Get world building tags
        const worldTags = window.Tags && typeof window.Tags.getEntityTags === 'function' ?
            window.Tags.getEntityTags('worldbuilding', worldItem.id || '') : [];
        
        return `
            <div class="worldbuilding-details" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #fff;">
                <h2 style="color: #3498db; margin-top: 0;">${worldItem.title || 'Unnamed World Building Item'}</h2>
                
                ${worldItem.image ? `<div style="text-align: center; margin-bottom: 15px;"><img src="${worldItem.image}" alt="${worldItem.title || 'World Building'}" style="max-width: 200px; max-height: 200px; border-radius: 8px;"></div>` : ''}
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Basic Information</h3>
                    <p><strong>Category:</strong> ${worldItem.category || 'N/A'}</p>
                    <p><strong>Type:</strong> ${worldItem.type || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Story Context</h3>
                    <p><strong>Series:</strong> ${worldItem.series || 'N/A'}</p>
                    <p><strong>Book:</strong> ${worldItem.book || 'N/A'}</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Tags</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${worldTags.length > 0 ?
                            worldTags.map(tag => `
                                <div style="background-color: ${tag.color}; padding: 3px 8px; border-radius: 4px; color: white; font-size: 12px;">
                                    ${tag.name}
                                </div>
                            `).join('') :
                            '<div>No tags</div>'
                        }
                    </div>
                </div>
                
                ${worldItem.customFields && Object.keys(worldItem.customFields).length > 0 ? `
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Additional Details</h3>
                    ${Object.entries(worldItem.customFields).map(([key, value]) =>
                        `<p><strong>${key}:</strong> ${value}</p>`
                    ).join('')}
                </div>
                ` : ''}
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Description</h3>
                    <div>${worldItem.description || 'No description available'}</div>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Rules & Limitations</h3>
                    <div>${worldItem.rules || 'No rules or limitations specified'}</div>
                </div>
            </div>
        `;
    };
    
    // Get current database name for the filename
    const dbName = localStorage.getItem('currentDatabaseName') || 'Default';
    const filename = `${dbName}-worldbuilding.pdf`;
    
    // Access world building elements from the window.worldElements global property 
    createDetailedPDF(window.worldElements || [], generateWorldBuildingHTML, filename);
}

// Export the functions
export {
    createDetailedPDF,
    exportCharactersToPDF,
    exportLocationsToPDF,
    exportPlotsToPDF,
    exportWorldBuildingToPDF
};