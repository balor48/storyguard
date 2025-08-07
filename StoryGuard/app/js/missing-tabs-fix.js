// Missing Tabs Fix Script
console.log('Missing Tabs Fix script loaded');

// Create missing tab containers for all tabs
document.addEventListener('DOMContentLoaded', () => {
    console.log('Checking for missing tab containers');
    
    // List of all expected tabs
    const expectedTabs = [
        'dashboard',
        'characters',
        'locations',
        'relationships',
        'plots',
        'worldbuilding',
        'timeline',
        'statistics',
        'analyze-book'
    ];
    
    // Container for all tabs
    const container = document.querySelector('.container');
    if (!container) {
        console.error('Container element not found!');
        return;
    }
    
    // Check and create each missing tab
    expectedTabs.forEach(tabName => {
        const tabId = `${tabName}-tab`;
        let tabElement = document.getElementById(tabId);
        
        // If tab doesn't exist, create it
        if (!tabElement) {
            console.log(`Creating missing tab container: ${tabId}`);
            tabElement = document.createElement('div');
            tabElement.id = tabId;
            tabElement.className = 'tab-content';
            container.appendChild(tabElement);
            
            // For locations and relationships tabs, add minimal required structure
            if (tabName === 'locations') {
                tabElement.innerHTML = `
                    <h2>Location Database</h2>
                    <table id="locationTable" class="data-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Size</th>
                                <th>Series</th>
                                <th>Book</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                    <form id="locationForm" class="entity-form"></form>
                `;
            } else if (tabName === 'relationships') {
                tabElement.innerHTML = `
                    <div class="relationships-container">
                        <h2>Character Relationships</h2>
                        <div id="relationshipList" class="relationship-list"></div>
                        <div id="relationshipNetwork" class="relationship-network" style="display: none;">
                            <canvas id="relationshipCanvas"></canvas>
                        </div>
                    </div>
                `;
            } else if (tabName === 'plots') {
                tabElement.innerHTML = `
                    <h2>Plot Database</h2>
                    <table id="plotTable" class="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Series</th>
                                <th>Book</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                    <form id="plotForm" class="entity-form"></form>
                `;
            } else if (tabName === 'worldbuilding') {
                tabElement.innerHTML = `
                    <h2>World-Building Database</h2>
                    <table id="worldElementTable" class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Series</th>
                                <th>Book</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                    <form id="worldElementForm" class="entity-form"></form>
                `;
            } else if (tabName === 'timeline') {
                tabElement.innerHTML = `
                    <h2>Timeline</h2>
                    <div id="timelineContent"></div>
                `;
            } else if (tabName === 'statistics') {
                tabElement.innerHTML = `
                    <h2>Statistics</h2>
                    <div id="statisticsContent"></div>
                `;
            }
        }
    });
    
    console.log('Tab container check complete');
});
