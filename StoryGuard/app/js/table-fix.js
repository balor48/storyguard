// JavaScript to apply inline styles to all tables in the application

document.addEventListener('DOMContentLoaded', function() {
    // Function to apply styles to all tables
    function applyTableStyles() {
        console.log("Table Fix Script Running");
        
        // Find all tables in the document
        const tables = document.querySelectorAll('table');
        console.log(`Found ${tables.length} tables`);
        
        tables.forEach((table, index) => {
            console.log(`Styling table ${index + 1}`);
            
            // Apply styles to the table
            Object.assign(table.style, {
                width: 'auto',
                minWidth: '600px',
                maxWidth: '90%',
                borderCollapse: 'collapse',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginBottom: '20px',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            });
            
            // Find and style the table header
            const thead = table.querySelector('thead');
            if (thead) {
                Object.assign(thead.style, {
                    backgroundColor: '#3498db',
                    color: 'white'
                });
                
                // Style all header cells
                const headerCells = thead.querySelectorAll('th');
                headerCells.forEach(cell => {
                    Object.assign(cell.style, {
                        padding: '15px',
                        textAlign: 'left',
                        fontWeight: '600',
                        position: 'sticky',
                        top: '0',
                        zIndex: '10',
                        backgroundColor: '#3498db'
                    });
                });
            }
            
            // Find and style the table body
            const tbody = table.querySelector('tbody');
            if (tbody) {
                const rows = tbody.querySelectorAll('tr');
                
                rows.forEach((row, rowIndex) => {
                    Object.assign(row.style, {
                        borderBottom: '1px solid #ddd',
                        transition: 'background-color 0.2s ease'
                    });
                    
                    // Apply alternating row colors
                    const cells = row.querySelectorAll('td');
                    const bgColor = rowIndex % 2 === 0 ? 'white' : '#f5f5f5';
                    
                    cells.forEach(cell => {
                        Object.assign(cell.style, {
                            padding: '12px 15px',
                            verticalAlign: 'middle',
                            backgroundColor: bgColor
                        });
                    });
                    
                    // Add hover effect
                    row.addEventListener('mouseenter', function() {
                        cells.forEach(cell => {
                            cell.style.backgroundColor = '#e3f2fd';
                        });
                    });
                    
                    row.addEventListener('mouseleave', function() {
                        cells.forEach(cell => {
                            cell.style.backgroundColor = bgColor;
                        });
                    });
                });
            }
        });
    }
    
    // Apply styles initially
    applyTableStyles();
    
    // Re-apply styles when tabs are switched
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Wait a bit for the DOM to update
            setTimeout(applyTableStyles, 100);
        });
    });
    
    // Also apply styles periodically to catch dynamically added tables
    setInterval(applyTableStyles, 2000);
});