/**
 * Statistics functionality for Story Database
 * Handles statistics, charts, and data visualization
 */

// Update statistics
function updateStatistics() {
    // Basic stats
    const stats = {
        totalCharacters: characters.length,
        totalSeries: new Set(characters.map(c => c.series).filter(Boolean)).size,
        totalBooks: new Set(characters.map(c => c.book).filter(Boolean)).size,
        totalRelationships: relationships.length,
        totalLocations: locations.length,
        totalPlots: typeof plots !== 'undefined' ? plots.length : 0,
        totalWorldElements: typeof worldElements !== 'undefined' ? worldElements.length : 0
    };

    // Update basic stats in UI
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    // Update charts with a small delay to ensure DOM is ready
    setTimeout(() => {
        updateSeriesChart();
        updateRoleDistributionChart();
        updateRelationshipTypeChart();
        updateGenderDistributionChart();
        
        // Log chart rendering for debugging
        console.log('Charts updated');
    }, 100);
}

// Series Chart
function updateSeriesChart() {
    const container = document.getElementById('seriesChart');
    if (!container) return;

    // Check if dark mode is enabled
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#fff' : '#333';
    const gridColor = isDarkMode ? '#555' : '#ddd';

    const seriesCounts = characters.reduce((acc, char) => {
        const series = (char.series || 'Unassigned').trim();
        if (series) {
            acc[series] = (acc[series] || 0) + 1;
        }
        return acc;
    }, {});

    const chartData = Object.entries(seriesCounts)
        .map(([series, count]) => ({ series, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Clear previous content
    container.innerHTML = '';

    if (chartData.length === 0) {
        container.innerHTML = `<div class="no-data" style="color: ${textColor}; text-align: center; padding: 50px 0;">No character data available</div>`;
        return;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 800 400');

    // Add grid lines
    for (let i = 0; i <= 5; i++) {
        const y = 350 - (i * 60);
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', '50');
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('x2', '750');
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('stroke', gridColor);
        gridLine.setAttribute('stroke-width', '1');
        gridLine.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(gridLine);
    }

    const maxCount = Math.max(...chartData.map(d => d.count));
    // Brighter colors for better visibility in dark mode
    const colors = ['#3B82F6', '#10B981', '#6366F1', '#F43F5E', '#8B5CF6', '#F59E0B',
                   '#EC4899', '#14B8A6', '#8B5CF6', '#F97316'];

    chartData.forEach((item, index) => {
        const barWidth = 60;
        const barSpacing = 20;
        const x = index * (barWidth + barSpacing) + 50;
        const height = (item.count / maxCount) * 300;
        const y = 350 - height;

        // Add bar
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', colors[index % colors.length]);
        rect.setAttribute('rx', '5');
        rect.setAttribute('ry', '5');
        
        // Add hover effect
        rect.setAttribute('opacity', '0.9');
        rect.addEventListener('mouseover', () => rect.setAttribute('opacity', '1'));
        rect.addEventListener('mouseout', () => rect.setAttribute('opacity', '0.9'));

        // Add series label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + barWidth / 2);
        text.setAttribute('y', 380);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', textColor);
        text.textContent = item.series.length > 15
            ? item.series.substring(0, 12) + '...'
            : item.series;

        // Add count label
        const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        countText.setAttribute('x', x + barWidth / 2);
        countText.setAttribute('y', y - 10);
        countText.setAttribute('text-anchor', 'middle');
        countText.setAttribute('font-size', '14');
        countText.setAttribute('fill', textColor);
        countText.setAttribute('font-weight', 'bold');
        countText.textContent = item.count;

        svg.appendChild(rect);
        svg.appendChild(text);
        svg.appendChild(countText);
    });

    container.appendChild(svg);
    
    // Add title and legend
    const title = document.createElement('div');
    title.style.textAlign = 'center';
    title.style.marginTop = '10px';
    title.style.fontWeight = 'bold';
    title.style.color = textColor;
    title.textContent = 'Character Distribution by Series';
    container.appendChild(title);
}

// Role Distribution Chart (Pie Chart)
function updateRoleDistributionChart() {
    const container = document.getElementById('roleChart');
    if (!container) return;

    const roleCounts = characters.reduce((acc, char) => {
        const role = (char.role || 'Unassigned').trim();
        if (role) {
            acc[role] = (acc[role] || 0) + 1;
        }
        return acc;
    }, {});

    const chartData = Object.entries(roleCounts)
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count);

    // Clear previous content
    container.innerHTML = '';

    if (chartData.length === 0) {
        container.innerHTML = '<div class="no-data">No role data available</div>';
        return;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 400 400');

    const centerX = 200;
    const centerY = 200;
    const radius = 150;
    const total = chartData.reduce((sum, item) => sum + item.count, 0);
    
    const colors = ['#3B82F6', '#10B981', '#6366F1', '#F43F5E', '#8B5CF6', '#F59E0B',
                   '#EF4444', '#14B8A6', '#8B5CF6', '#F97316', '#06B6D4', '#EC4899'];

    let startAngle = 0;
    const legend = document.createElement('div');
    legend.className = 'chart-legend';

    chartData.forEach((item, index) => {
        const percentage = item.count / total;
        const endAngle = startAngle + percentage * 2 * Math.PI;
        
        // Calculate arc path
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        
        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', colors[index % colors.length]);
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '1');
        
        // Add tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${item.role}: ${item.count} (${Math.round(percentage * 100)}%)`;
        path.appendChild(title);
        
        svg.appendChild(path);
        
        // Add to legend
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${colors[index % colors.length]}"></span>
            <span class="legend-text">${item.role}: ${item.count} (${Math.round(percentage * 100)}%)</span>
        `;
        legend.appendChild(legendItem);
        
        startAngle = endAngle;
    });

    container.appendChild(svg);
    container.appendChild(legend);
}

// Relationship Type Chart
function updateRelationshipTypeChart() {
    const container = document.getElementById('relationshipTypeChart');
    if (!container) return;

    const typeCounts = relationships.reduce((acc, rel) => {
        const type = rel.type || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

    // Clear previous content
    container.innerHTML = '';

    if (chartData.length === 0) {
        container.innerHTML = '<div class="no-data">No relationship data available</div>';
        return;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '300');
    svg.setAttribute('viewBox', '0 0 800 300');

    const maxCount = Math.max(...chartData.map(d => d.count));
    
    // Relationship colors (matching the ones used in the relationship visualization)
    const relationshipColors = {
        'friend': '#4CAF50',
        'family': '#2196F3',
        'ally': '#8BC34A',
        'enemy': '#F44336',
        'mentor': '#9C27B0',
        'student': '#FF9800',
        'lover': '#E91E63',
        'rival': '#FF5722',
        'other': '#607D8B'
    };

    chartData.forEach((item, index) => {
        const barWidth = 60;
        const barSpacing = 20;
        const x = index * (barWidth + barSpacing) + 50;
        const height = (item.count / maxCount) * 200;
        const y = 250 - height;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', relationshipColors[item.type] || '#607D8B');
        rect.setAttribute('rx', '5');
        rect.setAttribute('ry', '5');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + barWidth / 2);
        text.setAttribute('y', 280);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#333');
        text.textContent = item.type;

        const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        countText.setAttribute('x', x + barWidth / 2);
        countText.setAttribute('y', y - 10);
        countText.setAttribute('text-anchor', 'middle');
        countText.setAttribute('font-size', '14');
        countText.setAttribute('fill', '#333');
        countText.setAttribute('font-weight', 'bold');
        countText.textContent = item.count;

        svg.appendChild(rect);
        svg.appendChild(text);
        svg.appendChild(countText);
    });

    container.appendChild(svg);
}

// Gender Distribution Chart
function updateGenderDistributionChart() {
    const container = document.getElementById('genderChart');
    if (!container) return;

    const genderCounts = characters.reduce((acc, char) => {
        const gender = (char.sex || 'Unspecified').trim();
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.entries(genderCounts)
        .map(([gender, count]) => ({ gender, count }))
        .sort((a, b) => b.count - a.count);

    // Clear previous content
    container.innerHTML = '';

    if (chartData.length === 0) {
        container.innerHTML = '<div class="no-data">No gender data available</div>';
        return;
    }

    // Create a donut chart
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '300');
    svg.setAttribute('viewBox', '0 0 300 300');

    const centerX = 150;
    const centerY = 150;
    const outerRadius = 100;
    const innerRadius = 50;  // For donut hole
    const total = chartData.reduce((sum, item) => sum + item.count, 0);
    
    const genderColors = {
        'Male': '#3B82F6',
        'Female': '#EC4899',
        'Non-binary': '#8B5CF6',
        'Unspecified': '#9CA3AF'
    };
    
    const defaultColors = ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F97316', '#06B6D4'];

    let startAngle = 0;
    const legend = document.createElement('div');
    legend.className = 'chart-legend';

    chartData.forEach((item, index) => {
        const percentage = item.count / total;
        const endAngle = startAngle + percentage * 2 * Math.PI;
        
        // Calculate outer arc points
        const outerX1 = centerX + outerRadius * Math.cos(startAngle);
        const outerY1 = centerY + outerRadius * Math.sin(startAngle);
        const outerX2 = centerX + outerRadius * Math.cos(endAngle);
        const outerY2 = centerY + outerRadius * Math.sin(endAngle);
        
        // Calculate inner arc points
        const innerX1 = centerX + innerRadius * Math.cos(endAngle);
        const innerY1 = centerY + innerRadius * Math.sin(endAngle);
        const innerX2 = centerX + innerRadius * Math.cos(startAngle);
        const innerY2 = centerY + innerRadius * Math.sin(startAngle);
        
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        
        // Create donut segment path
        const pathData = [
            `M ${outerX1} ${outerY1}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}`,
            `L ${innerX1} ${innerY1}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX2} ${innerY2}`,
            'Z'
        ].join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', genderColors[item.gender] || defaultColors[index % defaultColors.length]);
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '1');
        
        // Add tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${item.gender}: ${item.count} (${Math.round(percentage * 100)}%)`;
        path.appendChild(title);
        
        svg.appendChild(path);
        
        // Add percentage text in the middle of the segment
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        const textRadius = (outerRadius + innerRadius) / 2;
        const textX = centerX + textRadius * Math.cos(midAngle);
        const textY = centerY + textRadius * Math.sin(midAngle);
        
        if (percentage > 0.08) {  // Only show text if segment is large enough
            const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            percentText.setAttribute('x', textX);
            percentText.setAttribute('y', textY);
            percentText.setAttribute('text-anchor', 'middle');
            percentText.setAttribute('dominant-baseline', 'middle');
            percentText.setAttribute('fill', 'white');
            percentText.setAttribute('font-size', '14');
            percentText.setAttribute('font-weight', 'bold');
            percentText.textContent = `${Math.round(percentage * 100)}%`;
            svg.appendChild(percentText);
        }
        
        // Add to legend
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${genderColors[item.gender] || defaultColors[index % defaultColors.length]}"></span>
            <span class="legend-text">${item.gender}: ${item.count} (${Math.round(percentage * 100)}%)</span>
        `;
        legend.appendChild(legendItem);
        
        startAngle = endAngle;
    });

    // Add total in center
    const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalText.setAttribute('x', centerX);
    totalText.setAttribute('y', centerY - 10);
    totalText.setAttribute('text-anchor', 'middle');
    totalText.setAttribute('font-size', '16');
    totalText.setAttribute('font-weight', 'bold');
    totalText.textContent = 'Total';
    
    const totalCount = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalCount.setAttribute('x', centerX);
    totalCount.setAttribute('y', centerY + 15);
    totalCount.setAttribute('text-anchor', 'middle');
    totalCount.setAttribute('font-size', '20');
    totalCount.setAttribute('font-weight', 'bold');
    totalCount.textContent = total;
    
    svg.appendChild(totalText);
    svg.appendChild(totalCount);

    container.appendChild(svg);
    container.appendChild(legend);
}

// Create statistics dashboard
function createStatisticsDashboard() {
    const statsTab = document.getElementById('statistics-tab');
    if (!statsTab) return;
    
    // Clear previous content
    statsTab.innerHTML = '';
    
    // Create basic stats cards
    const statsCards = document.createElement('div');
    statsCards.className = 'stats-dashboard';
    
    // Add stat cards
    const stats = [
        { id: 'totalCharacters', label: 'Characters', value: characters.length },
        { id: 'totalSeries', label: 'Series', value: new Set(characters.map(c => c.series).filter(Boolean)).size },
        { id: 'totalBooks', label: 'Books', value: new Set(characters.map(c => c.book).filter(Boolean)).size },
        { id: 'totalRelationships', label: 'Relationships', value: relationships.length },
        { id: 'totalLocations', label: 'Locations', value: locations.length },
        { id: 'totalPlots', label: 'Plots', value: typeof plots !== 'undefined' ? plots.length : 0 },
        { id: 'totalWorldElements', label: 'World Elements', value: typeof worldElements !== 'undefined' ? worldElements.length : 0 }
    ];
    
    stats.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-content vertical-layout">
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value" id="${stat.id}">${stat.value}</div>
            </div>
        `;
        statsCards.appendChild(card);
    });
    
    statsTab.appendChild(statsCards);
    
    // Check if dark mode is enabled
    const isDarkMode = document.body.classList.contains('dark-mode');
    const backgroundColor = isDarkMode ? '#333' : '#fff';
    const textColor = isDarkMode ? '#fff' : '#333';
    const borderColor = isDarkMode ? '#555' : '#ddd';
    
    // Create charts grid with explicit dimensions
    const chartsGrid = document.createElement('div');
    chartsGrid.className = 'stats-grid';
    chartsGrid.style.display = 'grid';
    chartsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    chartsGrid.style.gap = '20px';
    chartsGrid.style.marginTop = '20px';
    chartsGrid.style.marginBottom = '20px';
    
    // Series distribution chart
    const seriesChartContainer = document.createElement('div');
    seriesChartContainer.className = 'chart-container';
    seriesChartContainer.style.minHeight = '400px';
    seriesChartContainer.style.border = `1px solid ${borderColor}`;
    seriesChartContainer.style.borderRadius = '8px';
    seriesChartContainer.style.padding = '15px';
    seriesChartContainer.style.backgroundColor = backgroundColor;
    seriesChartContainer.style.color = textColor;
    seriesChartContainer.innerHTML = `
        <h3>Characters by Series</h3>
        <div id="seriesChart" style="width: 100%; height: 350px;"></div>
    `;
    chartsGrid.appendChild(seriesChartContainer);
    
    // Role distribution chart
    const roleChartContainer = document.createElement('div');
    roleChartContainer.className = 'chart-container';
    roleChartContainer.style.minHeight = '400px';
    roleChartContainer.style.border = `1px solid ${borderColor}`;
    roleChartContainer.style.borderRadius = '8px';
    roleChartContainer.style.padding = '15px';
    roleChartContainer.style.backgroundColor = backgroundColor;
    roleChartContainer.style.color = textColor;
    roleChartContainer.innerHTML = `
        <h3>Character Roles</h3>
        <div id="roleChart" style="width: 100%; height: 350px;"></div>
    `;
    chartsGrid.appendChild(roleChartContainer);
    
    // Gender distribution chart
    const genderChartContainer = document.createElement('div');
    genderChartContainer.className = 'chart-container';
    genderChartContainer.style.minHeight = '400px';
    genderChartContainer.style.border = `1px solid ${borderColor}`;
    genderChartContainer.style.borderRadius = '8px';
    genderChartContainer.style.padding = '15px';
    genderChartContainer.style.backgroundColor = backgroundColor;
    genderChartContainer.style.color = textColor;
    genderChartContainer.innerHTML = `
        <h3>Gender Distribution</h3>
        <div id="genderChart" style="width: 100%; height: 350px;"></div>
    `;
    chartsGrid.appendChild(genderChartContainer);
    
    // Relationship types chart
    const relationshipChartContainer = document.createElement('div');
    relationshipChartContainer.className = 'chart-container';
    relationshipChartContainer.style.minHeight = '400px';
    relationshipChartContainer.style.border = `1px solid ${borderColor}`;
    relationshipChartContainer.style.borderRadius = '8px';
    relationshipChartContainer.style.padding = '15px';
    relationshipChartContainer.style.backgroundColor = backgroundColor;
    relationshipChartContainer.style.color = textColor;
    relationshipChartContainer.innerHTML = `
        <h3>Relationship Types</h3>
        <div id="relationshipTypeChart" style="width: 100%; height: 350px;"></div>
    `;
    chartsGrid.appendChild(relationshipChartContainer);
    
    // Character Network Analysis
    const networkAnalysisContainer = document.createElement('div');
    networkAnalysisContainer.className = 'chart-container full-width';
    networkAnalysisContainer.innerHTML = `
        <h3>Character Network Analysis</h3>
        <div class="network-controls">
            <select id="networkFilterSeries">
                <option value="">All Series</option>
                ${[...new Set(characters.map(c => c.series).filter(Boolean))]
                    .map(series => `<option value="${series}">${series}</option>`)
                    .join('')}
            </select>
            <button id="runNetworkAnalysis" class="analyze-btn">Analyze Network</button>
        </div>
        <div id="networkAnalysisResults" class="network-results"></div>
    `;
    statsTab.appendChild(networkAnalysisContainer);
    
    // Add event listener for network analysis
    setTimeout(() => {
        const analyzeBtn = document.getElementById('runNetworkAnalysis');
        const seriesFilter = document.getElementById('networkFilterSeries');
        
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                const selectedSeries = seriesFilter?.value || '';
                analyzeCharacterNetwork(selectedSeries);
            });
        }
    }, 100);
    
    statsTab.appendChild(chartsGrid);
    
    // Update all charts
    updateStatistics();
}

// Character Network Analysis
function analyzeCharacterNetwork(seriesFilter = '') {
    const resultsContainer = document.getElementById('networkAnalysisResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="loading">Analyzing character network...</div>';
    
    // Short delay to show loading message
    setTimeout(() => {
        // Filter characters by series if needed
        const filteredCharacters = seriesFilter
            ? characters.filter(c => c.series === seriesFilter)
            : characters;
            
        // Filter relationships to only include characters in our filtered set
        const filteredRelationships = relationships.filter(rel => {
            const char1 = filteredCharacters.find(c => `${c.firstName} ${c.lastName}`.trim() === rel.character1);
            const char2 = filteredCharacters.find(c => `${c.firstName} ${c.lastName}`.trim() === rel.character2);
            return char1 && char2;
        });
        
        if (filteredCharacters.length === 0 || filteredRelationships.length === 0) {
            resultsContainer.innerHTML = '<div class="no-data">Not enough data for network analysis. Add more characters and relationships.</div>';
            return;
        }
        
        // Build character network
        const network = {};
        const characterNames = filteredCharacters.map(c => `${c.firstName} ${c.lastName}`.trim());
        
        // Initialize network with all characters
        characterNames.forEach(name => {
            network[name] = { connections: [], relationshipCount: 0 };
        });
        
        // Add relationships to network
        filteredRelationships.forEach(rel => {
            if (network[rel.character1]) {
                network[rel.character1].connections.push({
                    character: rel.character2,
                    type: rel.type
                });
                network[rel.character1].relationshipCount++;
            }
            
            if (network[rel.character2]) {
                network[rel.character2].connections.push({
                    character: rel.character1,
                    type: rel.type
                });
                network[rel.character2].relationshipCount++;
            }
        });
        
        // Calculate network metrics
        const metrics = {
            // Most connected characters (highest number of relationships)
            mostConnected: Object.entries(network)
                .sort((a, b) => b[1].relationshipCount - a[1].relationshipCount)
                .slice(0, 5)
                .map(([name, data]) => ({ name, count: data.relationshipCount })),
                
            // Relationship clusters
            clusters: findRelationshipClusters(network),
            
            // Character pairs with most relationship types
            diverseRelationships: findDiverseRelationships(filteredRelationships),
            
            // Isolated characters (no relationships)
            isolatedCharacters: characterNames.filter(name => network[name].relationshipCount === 0)
        };
        
        // Render results
        renderNetworkAnalysisResults(metrics, resultsContainer);
    }, 500);
}

// Find clusters of characters that are closely connected
function findRelationshipClusters(network) {
    const visited = new Set();
    const clusters = [];
    
    // Simple breadth-first search to find connected components
    Object.keys(network).forEach(character => {
        if (!visited.has(character)) {
            const cluster = [];
            const queue = [character];
            visited.add(character);
            
            while (queue.length > 0) {
                const current = queue.shift();
                cluster.push(current);
                
                network[current].connections.forEach(conn => {
                    if (!visited.has(conn.character)) {
                        visited.add(conn.character);
                        queue.push(conn.character);
                    }
                });
            }
            
            if (cluster.length > 1) {
                clusters.push(cluster);
            }
        }
    });
    
    // Sort clusters by size (largest first)
    return clusters.sort((a, b) => b.length - a.length).slice(0, 3);
}

// Find character pairs with diverse relationship types
function findDiverseRelationships(relationships) {
    const pairCounts = {};
    
    relationships.forEach(rel => {
        // Create a consistent key for the pair regardless of order
        const pair = [rel.character1, rel.character2].sort().join(' & ');
        
        if (!pairCounts[pair]) {
            pairCounts[pair] = new Set();
        }
        
        pairCounts[pair].add(rel.type);
    });
    
    // Convert to array and sort by number of relationship types
    return Object.entries(pairCounts)
        .map(([pair, types]) => ({ pair, count: types.size, types: Array.from(types) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
}

// Render network analysis results
function renderNetworkAnalysisResults(metrics, container) {
    let html = '<div class="network-analysis-grid">';
    
    // Most connected characters
    html += `
        <div class="analysis-card">
            <h4>Most Connected Characters</h4>
            <ul class="analysis-list">
                ${metrics.mostConnected.map(char =>
                    `<li><span class="character-name">${char.name}</span> <span class="count-badge">${char.count} connections</span></li>`
                ).join('')}
                ${metrics.mostConnected.length === 0 ? '<li>No connected characters found</li>' : ''}
            </ul>
        </div>
    `;
    
    // Character clusters
    html += `
        <div class="analysis-card">
            <h4>Character Clusters</h4>
            <ul class="analysis-list">
                ${metrics.clusters.map((cluster, i) =>
                    `<li>
                        <div class="cluster-name">Cluster ${i+1} (${cluster.length} characters)</div>
                        <div class="cluster-members">${cluster.join(', ')}</div>
                    </li>`
                ).join('')}
                ${metrics.clusters.length === 0 ? '<li>No character clusters found</li>' : ''}
            </ul>
        </div>
    `;
    
    // Diverse relationships
    html += `
        <div class="analysis-card">
            <h4>Complex Character Dynamics</h4>
            <ul class="analysis-list">
                ${metrics.diverseRelationships.map(rel =>
                    `<li>
                        <div class="pair-names">${rel.pair}</div>
                        <div class="relationship-types">
                            ${rel.types.map(type =>
                                `<span class="relationship-type ${type}">${type}</span>`
                            ).join(' ')}
                        </div>
                    </li>`
                ).join('')}
                ${metrics.diverseRelationships.length === 0 ? '<li>No complex dynamics found</li>' : ''}
            </ul>
        </div>
    `;
    
    // Isolated characters
    html += `
        <div class="analysis-card">
            <h4>Isolated Characters</h4>
            <ul class="analysis-list isolated-list">
                ${metrics.isolatedCharacters.map(char =>
                    `<li>${char}</li>`
                ).join('')}
                ${metrics.isolatedCharacters.length === 0 ? '<li>No isolated characters found</li>' : ''}
            </ul>
        </div>
    `;
    
    html += '</div>';
    
    // Add network insights
    html += `
        <div class="network-insights">
            <h4>Network Insights</h4>
            <p>
                ${generateNetworkInsights(metrics)}
            </p>
        </div>
    `;
    
    container.innerHTML = html;
}

// Generate insights based on network analysis
function generateNetworkInsights(metrics) {
    const insights = [];
    
    // Insight about central characters
    if (metrics.mostConnected.length > 0) {
        const topCharacter = metrics.mostConnected[0];
        insights.push(`<strong>${topCharacter.name}</strong> is the most connected character with ${topCharacter.count} relationships, making them central to your story's social network.`);
    }
    
    // Insight about clusters
    if (metrics.clusters.length > 0) {
        const largestCluster = metrics.clusters[0];
        insights.push(`Your story has ${metrics.clusters.length} distinct social groups, with the largest containing ${largestCluster.length} characters.`);
    }
    
    // Insight about isolated characters
    if (metrics.isolatedCharacters.length > 0) {
        insights.push(`There are ${metrics.isolatedCharacters.length} isolated characters with no defined relationships. Consider connecting them to your story's social network.`);
    }
    
    // Insight about relationship complexity
    if (metrics.diverseRelationships.length > 0) {
        const complexPair = metrics.diverseRelationships[0];
        insights.push(`The relationship between <strong>${complexPair.pair}</strong> is the most complex, with ${complexPair.count} different relationship types.`);
    }
    
    // General network insight
    const totalCharacters = Object.keys(metrics.mostConnected).length + metrics.isolatedCharacters.length;
    const connectedPercent = Math.round((totalCharacters - metrics.isolatedCharacters.length) / totalCharacters * 100);
    
    insights.push(`Overall, ${connectedPercent}% of your characters are connected in the relationship network.`);
    
    return insights.join(' ');
}

// Export statistics functions
window.Statistics = {
    updateStatistics,
    updateSeriesChart,
    updateRoleDistributionChart,
    updateRelationshipTypeChart,
    updateGenderDistributionChart,
    createStatisticsDashboard,
    analyzeCharacterNetwork
};