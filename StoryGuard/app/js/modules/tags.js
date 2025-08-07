/**
 * Tagging system for Story Database
 * Allows adding tags to characters, locations, and other entities
 */

// Initialize tags
function initializeTags() {
    console.log("Tags.initializeTags() called");
    
    // Load tags from localStorage if not already loaded
    if (tags.length === 0) {
        tags = JSON.parse(localStorage.getItem('tags') || '[]');
        console.log(`Loaded ${tags.length} tags from localStorage`);
    }
    
    // Initialize tag selectors for all entity types
    setTimeout(() => {
        console.log("Initializing tag selectors for all entity types");
        
        // Character tag selector
        const characterTagSelector = document.getElementById('characterTagSelector');
        console.log("Character tag selector found:", !!characterTagSelector);
        if (characterTagSelector) {
            createTagSelector('character', characterTagSelector.getAttribute('data-entity-id') || '', characterTagSelector);
        }
        
        // Location tag selector
        const locationTagSelector = document.getElementById('locationTagSelector');
        console.log("Location tag selector found:", !!locationTagSelector);
        if (locationTagSelector) {
            createTagSelector('location', locationTagSelector.getAttribute('data-entity-id') || '', locationTagSelector);
        }
        
        // Plot tag selector
        const plotTagSelector = document.getElementById('plotTagSelector');
        console.log("Plot tag selector found:", !!plotTagSelector);
        if (plotTagSelector) {
            createTagSelector('plot', plotTagSelector.getAttribute('data-entity-id') || '', plotTagSelector);
        }
        
        // World element tag selector
        const worldElementTagSelector = document.getElementById('worldElementTagSelector');
        console.log("World element tag selector found:", !!worldElementTagSelector);
        if (worldElementTagSelector) {
            createTagSelector('worldElement', worldElementTagSelector.getAttribute('data-entity-id') || '', worldElementTagSelector);
        }
        
        // Initialize tag clouds
        updateTagClouds();
        
        // Force a re-initialization after a longer delay to ensure everything is loaded
        setTimeout(() => {
            console.log("Forcing re-initialization of tag selectors");
            
            // Re-initialize all tag selectors to ensure they're properly created
            document.querySelectorAll('.tag-selector').forEach(selector => {
                const entityType = selector.getAttribute('data-entity-type');
                const entityId = selector.getAttribute('data-entity-id') || '';
                
                if (entityType) {
                    console.log(`Re-initializing ${entityType} tag selector`);
                    createTagSelector(entityType, entityId, selector);
                }
            });
        }, 1000);
    }, 500); // Small delay to ensure DOM is ready
}

// Add a new tag
function addTag(name, color = '#3498db') {
    // Format tag name - capitalize first letter, lowercase rest
    let formattedName = name.trim();
    if (formattedName.length > 0) {
        formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1).toLowerCase();
    }
    
    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === formattedName.toLowerCase())) {
        Core.showToast(`Tag "${formattedName}" already exists`, 'error');
        return false;
    }
    
    // Create new tag
    const newTag = {
        id: Core.generateId(),
        name: formattedName,
        color,
        createdAt: new Date().toISOString()
    };
    
    // Add to tags array
    tags.push(newTag);
    
    // Save to localStorage
    if (Core.safelyStoreItem('tags', JSON.stringify(tags))) {
        Core.showToast(`Tag "${formattedName}" added successfully`);
        return true;
    }
    
    return false;
}

// Delete a tag
function deleteTag(tagId) {
    // Find tag index
    const tagIndex = tags.findIndex(tag => tag.id === tagId);
    if (tagIndex === -1) {
        Core.showToast('Tag not found', 'error');
        return false;
    }
    
    // Remove tag from array
    const deletedTag = tags.splice(tagIndex, 1)[0];
    
    // Save to localStorage
    if (Core.safelyStoreItem('tags', JSON.stringify(tags))) {
        // Remove tag from all entities
        removeTagFromAllEntities(tagId);
        
        Core.showToast(`Tag "${deletedTag.name}" deleted successfully`);
        return true;
    }
    
    return false;
}

// Remove tag from all entities
function removeTagFromAllEntities(tagId) {
    // Remove from characters
    characters.forEach(character => {
        if (character.tags) {
            character.tags = character.tags.filter(id => id !== tagId);
        }
    });
    Core.safelyStoreItem('characters', JSON.stringify(characters));
    
    // Remove from locations
    locations.forEach(location => {
        if (location.tags) {
            location.tags = location.tags.filter(id => id !== tagId);
        }
    });
    Core.safelyStoreItem('locations', JSON.stringify(locations));
    
    // Remove from plots
    plots.forEach(plot => {
        if (plot.tags) {
            plot.tags = plot.tags.filter(id => id !== tagId);
        }
    });
    Core.safelyStoreItem('plots', JSON.stringify(plots));
    
    // Remove from world elements
    worldElements.forEach(element => {
        if (element.tags) {
            element.tags = element.tags.filter(id => id !== tagId);
        }
    });
    Core.safelyStoreItem('worldElements', JSON.stringify(worldElements));
}

// Add tag to entity
function addTagToEntity(entityType, entityId, tagId) {
    console.log(`addTagToEntity - entityType: ${entityType}, entityId: ${entityId}, tagId: ${tagId}`);
    
    let entity;
    let entityArray;
    
    // Get the tag being added
    const tagToAdd = tags.find(t => t.id === tagId);
    if (!tagToAdd) {
        console.log(`addTagToEntity - Tag not found`);
        Core.showToast('Tag not found', 'error');
        return false;
    }
    
    // Find entity based on type
    if (entityType === 'character') {
        entityArray = characters;
        entity = characters.find(c => c.id === entityId);
        console.log(`addTagToEntity - Found character:`, entity ? true : false);
    } else if (entityType === 'location') {
        entityArray = locations;
        entity = locations.find(l => l.id === entityId);
        console.log(`addTagToEntity - Found location:`, entity ? true : false);
        
        // Check if we're in edit mode for a location
        if (!entity && window.originalEditLocation && window.originalEditLocation.id === entityId) {
            console.log(`addTagToEntity - Location is being edited, using originalEditLocation`);
            // We're editing a location, so we need to add the tag to originalEditLocation
            if (!window.originalEditLocation.tags) {
                window.originalEditLocation.tags = [];
            }
            
            // Check if a tag with the same name already exists
            const existingTags = window.originalEditLocation.tags
                .map(id => tags.find(t => t.id === id))
                .filter(Boolean);
            
            const duplicateTag = existingTags.find(t =>
                t.name.toLowerCase() === tagToAdd.name.toLowerCase());
            
            if (duplicateTag) {
                console.log(`addTagToEntity - Tag with same name already exists:`, duplicateTag.name);
                Core.showToast(`Tag "${tagToAdd.name}" already exists on this entity`, 'error');
                return false;
            }
            
            if (!window.originalEditLocation.tags.includes(tagId)) {
                window.originalEditLocation.tags.push(tagId);
                console.log(`addTagToEntity - Added tag to originalEditLocation:`, window.originalEditLocation.tags);
                Core.showToast(`Tag "${tagToAdd.name}" added successfully (will be saved when location is updated)`);
                return true;
            } else {
                Core.showToast('Tag already added to this entity', 'error');
                return false;
            }
        }
    } else if (entityType === 'plot') {
        entityArray = plots;
        entity = plots.find(p => p.id === entityId);
        console.log(`addTagToEntity - Found plot:`, entity ? true : false);
    } else if (entityType === 'worldElement') {
        entityArray = worldElements;
        entity = worldElements.find(e => e.id === entityId);
        console.log(`addTagToEntity - Found worldElement:`, entity ? true : false);
    }
    
    if (!entity) {
        console.log(`addTagToEntity - Entity not found`);
        Core.showToast('Entity not found', 'error');
        return false;
    }
    
    // Initialize tags array if it doesn't exist
    if (!entity.tags) {
        console.log(`addTagToEntity - Initializing tags array`);
        entity.tags = [];
    }
    
    // Check if tag is already added
    if (entity.tags.includes(tagId)) {
        console.log(`addTagToEntity - Tag already added`);
        Core.showToast('Tag already added to this entity', 'error');
        return false;
    }
    
    // Check if a tag with the same name already exists
    const existingTags = entity.tags
        .map(id => tags.find(t => t.id === id))
        .filter(Boolean);
    
    const duplicateTag = existingTags.find(t =>
        t.name.toLowerCase() === tagToAdd.name.toLowerCase());
    
    if (duplicateTag) {
        console.log(`addTagToEntity - Tag with same name already exists:`, duplicateTag.name);
        Core.showToast(`Tag "${tagToAdd.name}" already exists on this entity`, 'error');
        return false;
    }
    
    // Add tag to entity
    entity.tags.push(tagId);
    console.log(`addTagToEntity - Added tag, new tags array:`, entity.tags);
    
    // Save to localStorage
    if (Core.safelyStoreItem(entityType + 's', JSON.stringify(entityArray))) {
        console.log(`addTagToEntity - Saved to localStorage successfully`);
        
        // DIRECT FIX: Also update the entity in localStorage directly
        if (entityType === 'location') {
            try {
                console.log(`addTagToEntity - Directly updating location in localStorage with tag ${tagId}`);
                const storedLocations = JSON.parse(localStorage.getItem('locations') || '[]');
                const storedLocationIndex = storedLocations.findIndex(l => l.id === entity.id);
                
                if (storedLocationIndex !== -1) {
                    console.log(`addTagToEntity - Found location in localStorage, updating directly`);
                    if (!storedLocations[storedLocationIndex].tags) {
                        storedLocations[storedLocationIndex].tags = [];
                    }
                    if (!storedLocations[storedLocationIndex].tags.includes(tagId)) {
                        storedLocations[storedLocationIndex].tags.push(tagId);
                        localStorage.setItem('locations', JSON.stringify(storedLocations));
                        console.log(`addTagToEntity - Updated location in localStorage directly with tag ${tagId}`);
                    }
                }
            } catch (error) {
                console.error('addTagToEntity - Error updating location in localStorage directly:', error);
            }
        }
        
        Core.showToast(`Tag "${tagToAdd.name}" added successfully`);
        return true;
    }
    
    console.log(`addTagToEntity - Failed to save to localStorage`);
    return false;
}

// Remove tag from entity
function removeTagFromEntity(entityType, entityId, tagId) {
    console.log(`removeTagFromEntity - entityType: ${entityType}, entityId: ${entityId}, tagId: ${tagId}`);
    
    let entity;
    let entityArray;
    
    // Find entity based on type
    if (entityType === 'character') {
        entityArray = characters;
        entity = characters.find(c => c.id === entityId);
        console.log(`removeTagFromEntity - Found character:`, entity ? true : false);
    } else if (entityType === 'location') {
        entityArray = locations;
        entity = locations.find(l => l.id === entityId);
        console.log(`removeTagFromEntity - Found location:`, entity ? true : false);
        
        // Check if we're in edit mode for a location
        if (!entity && window.originalEditLocation && window.originalEditLocation.id === entityId) {
            console.log(`removeTagFromEntity - Location is being edited, using originalEditLocation`);
            // We're editing a location, so we need to remove the tag from originalEditLocation
            if (window.originalEditLocation.tags && window.originalEditLocation.tags.includes(tagId)) {
                window.originalEditLocation.tags = window.originalEditLocation.tags.filter(id => id !== tagId);
                console.log(`removeTagFromEntity - Removed tag from originalEditLocation:`, window.originalEditLocation.tags);
                const tag = tags.find(t => t.id === tagId);
                Core.showToast(`Tag "${tag.name}" removed successfully (will be saved when location is updated)`);
                return true;
            } else {
                Core.showToast('Tag not found on this entity', 'error');
                return false;
            }
        }
    } else if (entityType === 'plot') {
        entityArray = plots;
        entity = plots.find(p => p.id === entityId);
        console.log(`removeTagFromEntity - Found plot:`, entity ? true : false);
    } else if (entityType === 'worldElement') {
        entityArray = worldElements;
        entity = worldElements.find(e => e.id === entityId);
        console.log(`removeTagFromEntity - Found worldElement:`, entity ? true : false);
    }
    
    if (!entity || !entity.tags) {
        console.log(`removeTagFromEntity - Entity or tags not found`);
        Core.showToast('Entity or tags not found', 'error');
        return false;
    }
    
    // Check if tag exists on entity
    if (!entity.tags.includes(tagId)) {
        Core.showToast('Tag not found on this entity', 'error');
        return false;
    }
    
    // Remove tag from entity
    entity.tags = entity.tags.filter(id => id !== tagId);
    
    // Save to localStorage
    if (Core.safelyStoreItem(entityType + 's', JSON.stringify(entityArray))) {
        const tag = tags.find(t => t.id === tagId);
        
        // DIRECT FIX: Also update the entity in localStorage directly
        if (entityType === 'location') {
            try {
                console.log(`removeTagFromEntity - Directly updating location in localStorage to remove tag ${tagId}`);
                const storedLocations = JSON.parse(localStorage.getItem('locations') || '[]');
                const storedLocationIndex = storedLocations.findIndex(l => l.id === entity.id);
                
                if (storedLocationIndex !== -1) {
                    console.log(`removeTagFromEntity - Found location in localStorage, updating directly`);
                    if (storedLocations[storedLocationIndex].tags) {
                        storedLocations[storedLocationIndex].tags = storedLocations[storedLocationIndex].tags.filter(id => id !== tagId);
                        localStorage.setItem('locations', JSON.stringify(storedLocations));
                        console.log(`removeTagFromEntity - Updated location in localStorage directly to remove tag ${tagId}`);
                    }
                }
            } catch (error) {
                console.error('removeTagFromEntity - Error updating location in localStorage directly:', error);
            }
        }
        
        Core.showToast(`Tag "${tag.name}" removed successfully`);
        return true;
    }
    
    return false;
}

// Get entity tags
function getEntityTags(entityType, entityId) {
    console.log(`getEntityTags - entityType: ${entityType}, entityId: ${entityId}`);
    
    let entity;
    
    // Find entity based on type
    if (entityType === 'character') {
        entity = characters.find(c => c.id === entityId);
        console.log(`getEntityTags - Found character:`, entity ? true : false);
    } else if (entityType === 'location') {
        entity = locations.find(l => l.id === entityId);
        console.log(`getEntityTags - Found location:`, entity ? true : false);
        
        // Check if we have the original edit location
        if (!entity && window.originalEditLocation && window.originalEditLocation.id === entityId) {
            console.log(`getEntityTags - Using originalEditLocation instead`);
            entity = window.originalEditLocation;
        }
        
        // If we still don't have the entity, try to find it in localStorage
        if (!entity) {
            console.log(`getEntityTags - Trying to find location in localStorage`);
            const storedLocations = JSON.parse(localStorage.getItem('locations') || '[]');
            const storedLocation = storedLocations.find(l => l.id === entityId);
            if (storedLocation) {
                console.log(`getEntityTags - Found location in localStorage:`, storedLocation);
                entity = storedLocation;
            }
        }
    } else if (entityType === 'plot') {
        entity = plots.find(p => p.id === entityId);
        console.log(`getEntityTags - Found plot:`, entity ? true : false);
    } else if (entityType === 'worldElement') {
        entity = worldElements.find(e => e.id === entityId);
        console.log(`getEntityTags - Found worldElement:`, entity ? true : false);
    }
    
    if (!entity) {
        console.log(`getEntityTags - Entity not found`);
        return [];
    }
    
    if (!entity.tags) {
        console.log(`getEntityTags - Entity has no tags array`);
        return [];
    }
    
    console.log(`getEntityTags - Entity tags:`, entity.tags);
    
    // Return tag objects
    const tagObjects = entity.tags.map(tagId => tags.find(tag => tag.id === tagId)).filter(Boolean);
    console.log(`getEntityTags - Returning tag objects:`, tagObjects);
    return tagObjects;
}

// Find entities by tag
function findEntitiesByTag(tagId) {
    const results = {
        characters: [],
        locations: [],
        plots: [],
        worldElements: []
    };
    
    // Find characters with tag
    results.characters = characters.filter(c => c.tags && c.tags.includes(tagId));
    
    // Find locations with tag
    results.locations = locations.filter(l => l.tags && l.tags.includes(tagId));
    
    // Find plots with tag
    results.plots = plots.filter(p => p.tags && p.tags.includes(tagId));
    
    // Find world elements with tag
    results.worldElements = worldElements.filter(e => e.tags && e.tags.includes(tagId));
    
    return results;
}

// Create tag selector UI
function createTagSelector(entityType, entityId, container) {
    if (!container) return;
    
    console.log(`createTagSelector - entityType: ${entityType}, entityId: ${entityId}`);
    
    // Clear container
    container.innerHTML = '';
    
    // Set data attributes for proper CSS targeting
    container.setAttribute('data-entity-type', entityType);
    if (entityId) {
        container.setAttribute('data-entity-id', entityId);
    } else {
        container.setAttribute('data-entity-id', '');
    }
    
    // Create tag selector header
    const header = document.createElement('div');
    header.className = 'tag-selector-header';
    
    // DEBUG: Log header creation
    console.log(`Creating tag selector header for ${entityType}`);
    
    // Create header content with explicit DOM elements instead of innerHTML
    const headerTitle = document.createElement('h4');
    headerTitle.textContent = 'Tags';
    header.appendChild(headerTitle);
    
    const addTagBtn = document.createElement('button');
    addTagBtn.type = 'button';
    addTagBtn.className = 'add-tag-btn';
    addTagBtn.textContent = 'Add Tag';
    addTagBtn.onclick = function() {
        Tags.showAddTagDialog(entityType, entityId || '');
    };
    
    // DEBUG: Log button creation
    console.log(`Creating Add Tag button for ${entityType}`);
    
    // Add button to header
    header.appendChild(addTagBtn);
    
    // Add header to container
    container.appendChild(header);
    
    // DEBUG: Verify button was added
    console.log(`Tag selector header added. Button exists: ${!!container.querySelector('.add-tag-btn')}`);
    
    // Get entity tags
    const entityTags = getEntityTags(entityType, entityId || '');
    console.log(`createTagSelector - entityTags:`, entityTags);
    
    // Check if we're in edit mode for a location
    if (entityType === 'location' && window.originalEditLocation && window.originalEditLocation.id === entityId) {
        console.log(`createTagSelector - originalEditLocation tags:`, window.originalEditLocation.tags);
        
        // If we have tags in originalEditLocation but not in entityTags, something is wrong
        if (window.originalEditLocation.tags && window.originalEditLocation.tags.length > 0 && entityTags.length === 0) {
            console.log(`createTagSelector - WARNING: originalEditLocation has tags but entityTags is empty!`);
            
            // Try to get the tags directly from originalEditLocation
            const directTags = window.originalEditLocation.tags.map(tagId => tags.find(tag => tag.id === tagId)).filter(Boolean);
            console.log(`createTagSelector - Direct tags from originalEditLocation:`, directTags);
            
            // Use these tags instead if available
            if (directTags.length > 0) {
                console.log(`createTagSelector - Using direct tags from originalEditLocation`);
                entityTags.push(...directTags);
            }
        }
    }
    
    // Create tags container
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'entity-tags';
    
    if (entityTags.length === 0) {
        tagsContainer.innerHTML = '<div class="no-tags">No tags added</div>';
        console.log(`createTagSelector - No tags found for ${entityType} ${entityId}`);
    } else {
        console.log(`createTagSelector - Found ${entityTags.length} tags for ${entityType} ${entityId}`);
        entityTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'entity-tag';
            tagElement.style.backgroundColor = tag.color;
            tagElement.setAttribute('data-tag-id', tag.id);
            
            // Create tag name span
            const tagNameSpan = document.createElement('span');
            tagNameSpan.className = 'tag-name';
            tagNameSpan.textContent = tag.name;
            tagElement.appendChild(tagNameSpan);
            
            // Create remove button
            const removeButton = document.createElement('span');
            removeButton.className = 'tag-remove';
            removeButton.textContent = '×';
            removeButton.addEventListener('click', function() {
                // First try to remove from database if entity exists
                let entityExists = false;
                if (entityType === 'character') {
                    entityExists = characters.some(c => c.id === entityId);
                } else if (entityType === 'location') {
                    entityExists = locations.some(l => l.id === entityId);
                    
                    // Check if we're in edit mode for a location
                    if (!entityExists && window.originalEditLocation && window.originalEditLocation.id === entityId) {
                        console.log(`Tag remove clicked - Location is being edited, using originalEditLocation`);
                        entityExists = true; // Treat as if the entity exists
                    }
                } else if (entityType === 'plot') {
                    entityExists = plots.some(p => p.id === entityId);
                } else if (entityType === 'worldElement') {
                    entityExists = worldElements.some(e => e.id === entityId);
                }
                
                console.log(`Tag remove clicked - entityType: ${entityType}, entityId: ${entityId}, tagId: ${tag.id}, entityExists: ${entityExists}`);
                
                if (entityExists) {
                    // Entity exists, remove tag normally
                    const success = removeTagFromEntity(entityType, entityId, tag.id);
                    console.log(`Tag remove clicked - removeTagFromEntity result:`, success);
                    
                    // Check if we're in edit mode for a location
                    if (entityType === 'location' && window.originalEditLocation && window.originalEditLocation.id === entityId) {
                        console.log(`Tag remove clicked - Checking originalEditLocation tags after removal:`, window.originalEditLocation.tags);
                    }
                }
                
                // Always remove from UI
                tagElement.remove();
                
                // If no tags left, show "No tags added" message
                if (tagsContainer.querySelectorAll('.entity-tag').length === 0) {
                    tagsContainer.innerHTML = '<div class="no-tags">No tags added</div>';
                }
                
                // Update tag clouds
                updateTagClouds();
                
                // Toast notification removed to prevent duplicate notifications
                // The removeTagFromEntity function already shows a toast
            });
            tagElement.appendChild(removeButton);
            
            tagsContainer.appendChild(tagElement);
        });
    }
    
    container.appendChild(tagsContainer);
}

// Show add tag dialog
function showAddTagDialog(entityType, entityId) {
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'tag-dialog';
    
    // Get entity tags
    const entityTags = getEntityTags(entityType, entityId || '');
    const entityTagIds = entityTags.map(tag => tag.id);
    
    // Check if we're in create mode (no entityId)
    const isCreateMode = !entityId;
    let dialogTitle = 'Add Tag';
    let dialogMessage = '';
    
    if (isCreateMode) {
        dialogTitle = 'Manage Tags';
        dialogMessage = '<div style="margin-bottom: 15px; color: #e67e22; font-style: italic;">Note: You are creating/managing tags. To add tags to an entity, first select or create an entity.</div>';
    }
    
    // Create dialog content
    dialog.innerHTML = `
        <div class="tag-dialog-content">
            <h3>${dialogTitle}</h3>
            ${dialogMessage}
            <div class="tag-dialog-body">
                <div class="existing-tags">
                    <h4>Existing Tags</h4>
                    <div class="tags-list">
                        ${tags.length === 0 ? '<div class="no-tags">No tags created yet</div>' : ''}
                        ${tags.map(tag => `
                            <div class="tag-item ${entityTagIds.includes(tag.id) ? 'tag-selected' : ''}"
                                 data-tag-id="${tag.id}"
                                 style="background-color: ${tag.color};"
                                 onclick="Tags.toggleTagSelection(this, '${entityType}', '${entityId || ''}', '${tag.id}')">
                                <span class="tag-name">${tag.name}</span>
                                ${entityTagIds.includes(tag.id) ? '<span class="tag-check">✓</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="create-tag">
                    <h4>Create New Tag</h4>
                    <div class="tag-form">
                        <div class="input-group">
                            <label for="newTagName">Tag Name</label>
                            <input type="text" id="newTagName" placeholder="Enter tag name">
                        </div>
                        <div class="input-group">
                            <label for="newTagColor">Tag Color</label>
                            <input type="color" id="newTagColor" value="#3498db">
                        </div>
                        <button type="button" onclick="Tags.createAndAddTag('${entityType}', '${entityId || ''}')">Create Tag</button>
                    </div>
                </div>
            </div>
            <div class="tag-dialog-footer">
                <button type="button" onclick="Tags.closeTagDialog()">Close</button>
            </div>
        </div>
    `;
    
    // Add dialog to body
    document.body.appendChild(dialog);
    
    // Add event listener to close dialog when clicking outside
    dialog.addEventListener('click', function(e) {
        if (e.target === dialog) {
            closeTagDialog();
        }
    });
}

// Toggle tag selection
function toggleTagSelection(element, entityType, entityId, tagId) {
    const isSelected = element.classList.contains('tag-selected');
    const tag = tags.find(t => t.id === tagId);
    
    if (!tag) {
        Core.showToast('Tag not found', 'error');
        return;
    }
    
    // Check if we're in creation mode (no entityId)
    const isCreationMode = !entityId;
    
    if (isCreationMode) {
        // Handle tag selection during entity creation
        if (isSelected) {
            // Remove tag from UI
            element.classList.remove('tag-selected');
            const checkElement = element.querySelector('.tag-check');
            if (checkElement) {
                checkElement.remove();
            }
            
            // Update tag selector UI
            const tagSelector = document.querySelector(`.tag-selector[data-entity-type="${entityType}"]`);
            if (tagSelector) {
                const tagsContainer = tagSelector.querySelector('.entity-tags');
                if (tagsContainer) {
                    const tagElements = tagsContainer.querySelectorAll('.entity-tag');
                    tagElements.forEach(tagElement => {
                        const tagNameElement = tagElement.querySelector('.tag-name');
                        if (tagNameElement && tagNameElement.textContent === tag.name) {
                            tagElement.remove();
                        }
                    });
                    
                    // If no tags left, show "No tags added" message
                    if (tagsContainer.querySelectorAll('.entity-tag').length === 0) {
                        tagsContainer.innerHTML = '<div class="no-tags">No tags added</div>';
                    }
                }
            }
            
            Core.showToast(`Tag "${tag.name}" removed`, 'info');
        } else {
            // Add tag to UI
            element.classList.add('tag-selected');
            const checkElement = document.createElement('span');
            checkElement.className = 'tag-check';
            checkElement.textContent = '✓';
            element.appendChild(checkElement);
            
            // Update tag selector UI
            const tagSelector = document.querySelector(`.tag-selector[data-entity-type="${entityType}"]`);
            if (tagSelector) {
                const tagsContainer = tagSelector.querySelector('.entity-tags');
                if (tagsContainer) {
                    // Remove "No tags added" message if it exists
                    const noTagsElement = tagsContainer.querySelector('.no-tags');
                    if (noTagsElement) {
                        noTagsElement.remove();
                    }
                    
                    // Add tag element
                    const tagElement = document.createElement('div');
                    tagElement.className = 'entity-tag';
                    tagElement.style.backgroundColor = tag.color;
                    tagElement.setAttribute('data-tag-id', tag.id);
                    
                    // Create tag name span
                    const tagNameSpan = document.createElement('span');
                    tagNameSpan.className = 'tag-name';
                    tagNameSpan.textContent = tag.name;
                    tagElement.appendChild(tagNameSpan);
                    
                    // Create remove button
                    const removeButton = document.createElement('span');
                    removeButton.className = 'tag-remove';
                    removeButton.textContent = '×';
                    removeButton.addEventListener('click', function() {
                        // Remove tag from UI
                        tagElement.remove();
                        
                        // Remove selection from tag in dialog
                        const dialogTagItem = document.querySelector(`.tag-item[data-tag-id="${tag.id}"]`);
                        if (dialogTagItem) {
                            dialogTagItem.classList.remove('tag-selected');
                            const checkElement = dialogTagItem.querySelector('.tag-check');
                            if (checkElement) {
                                checkElement.remove();
                            }
                        }
                        
                        // If no tags left, show "No tags added" message
                        if (tagsContainer.querySelectorAll('.entity-tag').length === 0) {
                            tagsContainer.innerHTML = '<div class="no-tags">No tags added</div>';
                        }
                        
                        Core.showToast(`Tag "${tag.name}" removed`, 'info');
                        
                        // Update tag clouds
                        updateTagClouds();
                    });
                    tagElement.appendChild(removeButton);
                    
                    tagsContainer.appendChild(tagElement);
                }
            }
            
            Core.showToast(`Tag "${tag.name}" added`, 'info');
        }
    } else {
        // Normal tag selection for existing entities
        // First check if the entity exists in the array
        let entity;
        if (entityType === 'character') {
            entity = characters.find(c => c.id === entityId);
        } else if (entityType === 'location') {
            entity = locations.find(l => l.id === entityId);
            
            // Special handling for locations being edited
            if (!entity && window.originalEditLocation && window.originalEditLocation.id === entityId) {
                console.log(`toggleTagSelection - Using originalEditLocation for location ${entityId}`);
                entity = window.originalEditLocation;
                
                // For locations being edited, we need special handling
                if (isSelected) {
                    // Remove tag
                    if (removeTagFromEntity(entityType, entityId, tagId)) {
                        element.classList.remove('tag-selected');
                        const checkElement = element.querySelector('.tag-check');
                        if (checkElement) {
                            checkElement.remove();
                        }
                        
                        // Update tag selector if it exists
                        const tagSelector = document.querySelector(`.tag-selector[data-entity-type="${entityType}"][data-entity-id="${entityId}"]`);
                        if (tagSelector) {
                            createTagSelector(entityType, entityId, tagSelector);
                        }
                    }
                } else {
                    // Add tag
                    if (addTagToEntity(entityType, entityId, tagId)) {
                        element.classList.add('tag-selected');
                        const checkElement = document.createElement('span');
                        checkElement.className = 'tag-check';
                        checkElement.textContent = '✓';
                        element.appendChild(checkElement);
                        
                        // Update tag selector if it exists
                        const tagSelector = document.querySelector(`.tag-selector[data-entity-type="${entityType}"][data-entity-id="${entityId}"]`);
                        if (tagSelector) {
                            createTagSelector(entityType, entityId, tagSelector);
                        }
                    }
                }
                
                // Update tag clouds
                updateTagClouds();
                return; // Exit early since we've handled the special case
            }
        } else if (entityType === 'plot') {
            entity = plots.find(p => p.id === entityId);
        } else if (entityType === 'worldElement') {
            entity = worldElements.find(e => e.id === entityId);
        }
        
        if (!entity) {
            // Entity is being edited and not in the array
            // Just update the UI without trying to modify the entity
            if (isSelected) {
                // Remove tag from UI
                element.classList.remove('tag-selected');
                const checkElement = element.querySelector('.tag-check');
                if (checkElement) {
                    checkElement.remove();
                }
                
                // Update tag selector UI
                const tagSelector = document.querySelector(`.tag-selector[data-entity-type="${entityType}"][data-entity-id="${entityId}"]`);
                if (tagSelector) {
                    const tagsContainer = tagSelector.querySelector('.entity-tags');
                    if (tagsContainer) {
                        const tagElements = tagsContainer.querySelectorAll('.entity-tag');
                        tagElements.forEach(tagElement => {
                            const tagNameElement = tagElement.querySelector('.tag-name');
                            if (tagNameElement && tagNameElement.textContent === tag.name) {
                                tagElement.remove();
                            }
                        });
                        
                        // If no tags left, show "No tags added" message
                        if (tagsContainer.querySelectorAll('.entity-tag').length === 0) {
                            tagsContainer.innerHTML = '<div class="no-tags">No tags added</div>';
                        }
                    }
                }
                
                Core.showToast(`Tag "${tag.name}" removed`, 'info');
            } else {
                // Add tag to UI
                element.classList.add('tag-selected');
                const checkElement = document.createElement('span');
                checkElement.className = 'tag-check';
                checkElement.textContent = '✓';
                element.appendChild(checkElement);
                
                // Update tag selector UI
                const tagSelector = document.querySelector(`.tag-selector[data-entity-type="${entityType}"][data-entity-id="${entityId}"]`);
                if (tagSelector) {
                    const tagsContainer = tagSelector.querySelector('.entity-tags');
                    if (tagsContainer) {
                        // Remove "No tags added" message if it exists
                        const noTagsElement = tagsContainer.querySelector('.no-tags');
                        if (noTagsElement) {
                            noTagsElement.remove();
                        }
                        
                        // Add tag element
                        const tagElement = document.createElement('div');
                        tagElement.className = 'entity-tag';
                        tagElement.style.backgroundColor = tag.color;
                        tagElement.setAttribute('data-tag-id', tag.id);
                        
                        // Create tag name span
                        const tagNameSpan = document.createElement('span');
                        tagNameSpan.className = 'tag-name';
                        tagNameSpan.textContent = tag.name;
                        tagElement.appendChild(tagNameSpan);
                        
                        // Create remove button
                        const removeButton = document.createElement('span');
                        removeButton.className = 'tag-remove';
                        removeButton.textContent = '×';
                        removeButton.addEventListener('click', function() {
                            // Remove tag from UI
                            tagElement.remove();
                            
                            // Remove selection from tag in dialog
                            const dialogTagItem = document.querySelector(`.tag-item[data-tag-id="${tag.id}"]`);
                            if (dialogTagItem) {
                                dialogTagItem.classList.remove('tag-selected');
                                const checkElement = dialogTagItem.querySelector('.tag-check');
                                if (checkElement) {
                                    checkElement.remove();
                                }
                            }
                            
                            // If no tags left, show "No tags added" message
                            if (tagsContainer.querySelectorAll('.entity-tag').length === 0) {
                                tagsContainer.innerHTML = '<div class="no-tags">No tags added</div>';
                            }
                            
                            Core.showToast(`Tag "${tag.name}" removed`, 'info');
                            
                            // Update tag clouds
                            updateTagClouds();
                        });
                        tagElement.appendChild(removeButton);
                        
                        tagsContainer.appendChild(tagElement);
                    }
                }
                
                Core.showToast(`Tag "${tag.name}" added`, 'info');
            }
        } else {
            // Normal flow for existing entities
            if (isSelected) {
                // Remove tag
                if (removeTagFromEntity(entityType, entityId, tagId)) {
                    element.classList.remove('tag-selected');
                    const checkElement = element.querySelector('.tag-check');
                    if (checkElement) {
                        checkElement.remove();
                    }
                }
            } else {
                // Add tag
                if (addTagToEntity(entityType, entityId, tagId)) {
                    element.classList.add('tag-selected');
                    const checkElement = document.createElement('span');
                    checkElement.className = 'tag-check';
                    checkElement.textContent = '✓';
                    element.appendChild(checkElement);
                }
            }
            
            // Update tag selector if it exists
            const tagSelector = document.querySelector(`.tag-selector[data-entity-type="${entityType}"][data-entity-id="${entityId}"]`);
            if (tagSelector) {
                createTagSelector(entityType, entityId, tagSelector);
            }
        }
    }
    
    // Update tag clouds
    updateTagClouds();
}

// Create and add tag
function createAndAddTag(entityType, entityId) {
    const nameInput = document.getElementById('newTagName');
    const colorInput = document.getElementById('newTagColor');
    
    if (!nameInput || !colorInput) return;
    
    const name = nameInput.value.trim();
    const color = colorInput.value;
    
    if (!name) {
        Core.showToast('Tag name is required', 'error');
        return;
    }
    
    // Create tag
    if (addTag(name, color)) {
        // Get the new tag
        const newTag = tags.find(tag => tag.name === name);
        
        if (newTag) {
            // Check if entity exists in the array
            let entityExists = false;
            if (entityId) {
                if (entityType === 'character') {
                    entityExists = characters.some(c => c.id === entityId);
                } else if (entityType === 'location') {
                    entityExists = locations.some(l => l.id === entityId);
                    
                    // Check if we're in edit mode for a location
                    if (!entityExists && window.originalEditLocation && window.originalEditLocation.id === entityId) {
                        console.log(`createAndAddTag - Location is being edited, using originalEditLocation`);
                        entityExists = true; // Treat as if the entity exists
                    }
                } else if (entityType === 'plot') {
                    entityExists = plots.some(p => p.id === entityId);
                } else if (entityType === 'worldElement') {
                    entityExists = worldElements.some(e => e.id === entityId);
                }
            }
            
            if (entityId && entityExists) {
                // Entity exists, add tag normally
                addTagToEntity(entityType, entityId, newTag.id);
            } else if (entityId) {
                // Entity is being edited, just update UI
                // Find the tag item in the dialog
                const tagItem = document.querySelector(`.tag-item[data-tag-id="${newTag.id}"]`);
                if (tagItem) {
                    console.log(`createAndAddTag - Entity is being edited, simulating click on tag item`);
                    
                    // Check if we're in edit mode for a location
                    if (entityType === 'location' && window.originalEditLocation && window.originalEditLocation.id === entityId) {
                        console.log(`createAndAddTag - Adding tag directly to originalEditLocation`);
                        if (!window.originalEditLocation.tags) {
                            window.originalEditLocation.tags = [];
                        }
                        if (!window.originalEditLocation.tags.includes(newTag.id)) {
                            window.originalEditLocation.tags.push(newTag.id);
                            console.log(`createAndAddTag - Updated originalEditLocation tags:`, window.originalEditLocation.tags);
                        }
                    }
                    
                    // Simulate a click on the tag item to update UI
                    toggleTagSelection(tagItem, entityType, entityId, newTag.id);
                }
                Core.showToast(`Tag "${name}" created and added to UI`, 'info');
            } else {
                Core.showToast(`Tag "${name}" created successfully`);
            }
        }
        
        // Refresh tag dialog
        closeTagDialog();
        showAddTagDialog(entityType, entityId);
        
        // Update all tag selectors for this entity type
        document.querySelectorAll(`.tag-selector[data-entity-type="${entityType}"]`).forEach(selector => {
            const selectorEntityId = selector.getAttribute('data-entity-id') || '';
            createTagSelector(entityType, selectorEntityId, selector);
        });
        
        // Update tag clouds
        updateTagClouds();
    }
}

// Update all tag clouds
function updateTagClouds() {
    const characterTagCloud = document.getElementById('characterTagCloud');
    const locationTagCloud = document.getElementById('locationTagCloud');
    const plotTagCloud = document.getElementById('plotTagCloud');
    const worldTagCloud = document.getElementById('worldTagCloud');
    
    if (characterTagCloud) {
        renderTagCloud(characterTagCloud, (tagId) => {
            const entities = findEntitiesByTag(tagId);
            if (entities.characters.length > 0) {
                const tag = tags.find(t => t.id === tagId);
                if (tag) {
                    // Filter the character table to show only characters with this tag
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    // Reset filters
                    const filterSelects = ['filterSeries', 'filterBook', 'filterRole', 'filterRace'];
                    filterSelects.forEach(id => {
                        const select = document.getElementById(id);
                        if (select) {
                            select.value = '';
                        }
                    });
                    
                    // Store the tag ID in a global variable for filtering
                    window.currentTagFilter = tagId;
                    
                    Core.showToast(`Showing characters tagged with "${tag.name}"`);
                    
                    // Refresh the display with the tag filter
                    Characters.displayCharacters();
                }
            } else {
                Core.showToast('No characters found with this tag');
            }
        });
    }
    
    if (locationTagCloud) {
        renderTagCloud(locationTagCloud, (tagId) => {
            const entities = findEntitiesByTag(tagId);
            if (entities.locations.length > 0) {
                const tag = tags.find(t => t.id === tagId);
                if (tag) {
                    // Filter the location table to show only locations with this tag
                    const searchInput = document.getElementById('locationSearchInput');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    // Reset filters
                    const filterSelects = ['filterLocationSeries', 'filterLocationType'];
                    filterSelects.forEach(id => {
                        const select = document.getElementById(id);
                        if (select) {
                            select.value = '';
                        }
                    });
                    
                    // Store the tag ID in a global variable for filtering
                    window.currentLocationTagFilter = tagId;
                    
                    Core.showToast(`Showing locations tagged with "${tag.name}"`);
                    
                    // Refresh the display with the tag filter
                    Locations.displayLocations();
                }
            } else {
                Core.showToast('No locations found with this tag');
            }
        });
    }
    
    if (plotTagCloud) {
        renderTagCloud(plotTagCloud, (tagId) => {
            const entities = findEntitiesByTag(tagId);
            if (entities.plots.length > 0) {
                const tag = tags.find(t => t.id === tagId);
                if (tag) {
                    // Filter the plot table to show only plots with this tag
                    const searchInput = document.getElementById('plotSearchInput');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    // Reset filters
                    const filterSelects = ['filterPlotSeries', 'filterPlotBook', 'filterPlotType', 'filterPlotStatus'];
                    filterSelects.forEach(id => {
                        const select = document.getElementById(id);
                        if (select) {
                            select.value = '';
                        }
                    });
                    
                    // Store the tag ID in a global variable for filtering
                    window.currentPlotTagFilter = tagId;
                    
                    Core.showToast(`Showing plots tagged with "${tag.name}"`);
                    
                    // Refresh the display with the tag filter
                    Plots.displayPlots();
                }
            } else {
                Core.showToast('No plots found with this tag');
            }
        });
    }
    
    if (worldTagCloud) {
        renderTagCloud(worldTagCloud, (tagId) => {
            const entities = findEntitiesByTag(tagId);
            if (entities.worldElements.length > 0) {
                const tag = tags.find(t => t.id === tagId);
                if (tag) {
                    // Filter the world element table to show only elements with this tag
                    const searchInput = document.getElementById('worldSearchInput');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    // Reset filters
                    const filterSelects = ['filterWorldSeries', 'filterWorldCategory'];
                    filterSelects.forEach(id => {
                        const select = document.getElementById(id);
                        if (select) {
                            select.value = '';
                        }
                    });
                    
                    // Store the tag ID in a global variable for filtering
                    window.currentWorldElementTagFilter = tagId;
                    
                    Core.showToast(`Showing world elements tagged with "${tag.name}"`);
                    
                    // Refresh the display with the tag filter
                    WorldBuilding.displayWorldBuilding();
                }
            } else {
                Core.showToast('No world elements found with this tag');
            }
        });
    }
}

// Close tag dialog
function closeTagDialog() {
    const dialog = document.querySelector('.tag-dialog');
    if (dialog) {
        dialog.remove();
    }
}

// Render tag cloud
function renderTagCloud(container, onTagClick) {
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create tag cloud header with clear button
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'flex-start'; // Changed from space-between to flex-start
    headerContainer.style.alignItems = 'center';
    headerContainer.style.marginBottom = '10px';
    
    const header = document.createElement('h3');
    header.textContent = 'Tag Cloud';
    headerContainer.appendChild(header);
    
    // Add clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Filter';
    clearButton.className = 'tag-clear-btn';
    clearButton.style.padding = '5px 10px';
    clearButton.style.backgroundColor = '#e74c3c';
    clearButton.style.color = 'white';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '4px';
    clearButton.style.cursor = 'pointer';
    clearButton.style.marginLeft = '50px'; // Increased from 20px to 50px (30px more to the right)
    clearButton.style.marginTop = '8px'; // Increased from 5px to 8px (3px more down)
    clearButton.onclick = function() {
        // Clear the tag filter
        if (container.id === 'locationTagCloud') {
            window.currentLocationTagFilter = null;
            Locations.displayLocations();
            Core.showToast('Tag filter cleared');
        } else if (container.id === 'characterTagCloud') {
            window.currentTagFilter = null;
            Characters.displayCharacters();
            Core.showToast('Tag filter cleared');
        } else if (container.id === 'plotTagCloud') {
            window.currentPlotTagFilter = null;
            Plots.displayPlots();
            Core.showToast('Tag filter cleared');
        } else if (container.id === 'worldTagCloud') {
            window.currentWorldElementTagFilter = null;
            WorldBuilding.displayWorldBuilding();
            Core.showToast('Tag filter cleared');
        }
    };
    headerContainer.appendChild(clearButton);
    
    container.appendChild(headerContainer);
    
    // Create tag cloud container
    const cloudContainer = document.createElement('div');
    cloudContainer.className = 'tag-cloud';
    
    if (tags.length === 0) {
        cloudContainer.innerHTML = '<div class="no-tags">No tags created yet</div>';
    } else {
        // Count entities per tag
        const tagCounts = {};
        tags.forEach(tag => {
            const entities = findEntitiesByTag(tag.id);
            const count = entities.characters.length + entities.locations.length + 
                          entities.plots.length + entities.worldElements.length;
            tagCounts[tag.id] = count;
        });
        
        // Calculate font sizes based on counts
        const minCount = Math.min(...Object.values(tagCounts));
        const maxCount = Math.max(...Object.values(tagCounts));
        const minSize = 0.8;
        const maxSize = 2;
        
        // Create tag elements
        tags.forEach(tag => {
            const count = tagCounts[tag.id];
            
            // Format tag name - capitalize first letter, lowercase rest, truncate if too long
            let displayName = tag.name;
            if (displayName.length > 0) {
                displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
                if (displayName.length > 8) {
                    displayName = displayName.substring(0, 8) + '...';
                }
            }
            
            const tagElement = document.createElement('div');
            tagElement.className = 'cloud-tag';
            tagElement.style.backgroundColor = tag.color;
            tagElement.style.width = '70px';
            tagElement.style.height = '70px';
            tagElement.style.display = 'flex';
            tagElement.style.flexDirection = 'column';
            tagElement.style.justifyContent = 'space-between';
            tagElement.style.alignItems = 'center';
            tagElement.style.margin = '5px';
            tagElement.style.padding = '5px 5px';
            tagElement.style.borderRadius = '5px';
            tagElement.style.textAlign = 'center';
            tagElement.style.fontSize = '1em';
            tagElement.style.boxSizing = 'border-box';
            tagElement.style.overflow = 'hidden'; // Prevent content from overflowing
            
            // Create tag name span
            const tagNameSpan = document.createElement('span');
            tagNameSpan.className = 'tag-name';
            tagNameSpan.textContent = displayName;
            tagNameSpan.style.fontWeight = 'bold';
            tagNameSpan.style.marginTop = '2px'; // Adjusted to 2px as requested
            tagNameSpan.style.width = '100%'; // Ensure it stays within the container
            tagNameSpan.style.overflow = 'hidden'; // Prevent text overflow
            tagNameSpan.style.textOverflow = 'ellipsis'; // Add ellipsis for overflow
            tagNameSpan.style.whiteSpace = 'nowrap'; // Prevent wrapping
            tagElement.appendChild(tagNameSpan);
            // Create tag count span
            const tagCountSpan = document.createElement('span');
            tagCountSpan.className = 'tag-count';
            tagCountSpan.textContent = count;
            tagCountSpan.style.fontSize = '1.2em';
            tagCountSpan.style.marginBottom = '2px'; // Adjusted to 2px as requested
            tagCountSpan.style.marginTop = '2px'; // Keep the small top margin
            tagCountSpan.style.width = '70%'; // Reduce width to make highlight narrower
            tagCountSpan.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; // Semi-transparent background
            tagCountSpan.style.borderRadius = '12px'; // Rounded corners
            tagCountSpan.style.padding = '2px 0'; // Add some vertical padding
            tagCountSpan.style.display = 'inline-block'; // Allow for centering
            tagCountSpan.style.textAlign = 'center'; // Center the text
            tagElement.appendChild(tagCountSpan);
            tagElement.appendChild(tagCountSpan);
            
            // Add click handler if provided
            if (onTagClick) {
                tagElement.addEventListener('click', () => onTagClick(tag.id));
                tagElement.style.cursor = 'pointer';
            }
            
            cloudContainer.appendChild(tagElement);
        });
    }
    
    container.appendChild(cloudContainer);
}

// Export tags functions
window.Tags = {
    initializeTags,
    addTag,
    deleteTag,
    addTagToEntity,
    removeTagFromEntity,
    getEntityTags,
    findEntitiesByTag,
    createTagSelector,
    showAddTagDialog,
    toggleTagSelection,
    createAndAddTag,
    closeTagDialog,
    renderTagCloud,
    updateTagClouds
};