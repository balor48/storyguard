# StoryGuard UI Components Guide

## Overview

This document provides guidance on using the new standardized UI component system in the StoryGuard application. The UI component system has been designed to provide consistent styling, behavior, and functionality across all UI elements, eliminating duplicate code and ensuring a coherent user experience.

## Key Benefits

- **Consistency**: All UI elements have unified styling and behavior
- **Reusability**: Eliminates duplicate code across the application
- **Maintainability**: Centralized styling and behavior makes updates easier
- **Accessibility**: Built-in accessibility features for all components
- **Error Integration**: Components work with the error handling system

## Available Components

### Button

Standardized button component with consistent styling and behavior.

```javascript
// Create a button programmatically
const button = UIManager.createButton({
  content: 'Save Changes',
  variant: 'primary', // primary, danger, text, default
  size: 'default',    // small, default, large
  onClick: () => saveChanges()
});

document.getElementById('buttonContainer').appendChild(button.element);

// Handle events
button.on('click', () => console.log('Button clicked'));

// Update button state
button.setLoading(true); // Show loading spinner
button.setDisabled(true); // Disable the button
button.setContent('Saved!'); // Change button text
```

### FormInput

Standardized input field component with validation and error handling.

```javascript
// Create an input field
const input = UIManager.createInput({
  label: 'Character Name',
  required: true,
  placeholder: 'Enter character name',
  value: character.name,
  helpText: 'Full name of your character',
  validation: {
    minLength: 2,
    maxLength: 50
  }
});

document.getElementById('formContainer').appendChild(input.element);

// Handle input changes
input.on('input', (e) => {
  character.name = e.target.value;
});

// Validate input
if (!input.validate()) {
  console.log('Input validation failed:', input.error);
}
```

### Dropdown

Standardized dropdown/select component for selecting from lists of options.

```javascript
// Create a dropdown
const dropdown = UIManager.createDropdown({
  label: 'Character Role',
  options: [
    { value: 'protagonist', label: 'Protagonist' },
    { value: 'antagonist', label: 'Antagonist' },
    { value: 'supporting', label: 'Supporting Character' }
  ],
  value: character.role,
  required: true,
  searchable: true // Enable search filtering
});

document.getElementById('formContainer').appendChild(dropdown.element);

// Handle selection changes
dropdown.on('sg-dropdown-change', (e) => {
  character.role = e.detail.value;
});
```

### Modal

Standardized modal dialog component for displaying dialogs and popups.

```javascript
// Create and show a modal
const modal = UIManager.createModal({
  title: 'Edit Character Details',
  content: '<form id="characterForm">...</form>',
  size: 'default', // small, default, large, fullscreen
  buttons: [
    {
      text: 'Save',
      variant: 'primary',
      onClick: () => saveCharacter()
    },
    {
      text: 'Cancel',
      variant: 'text',
      onClick: () => modal.close()
    }
  ]
});

// Add to document and open
document.body.appendChild(modal.element);
modal.open();

// Use helper method for confirmation dialog
UIManager.showConfirmation(
  'Delete Character',
  'Are you sure you want to delete this character? This action cannot be undone.',
  {
    confirmText: 'Delete',
    confirmVariant: 'danger'
  }
).then(confirmed => {
  if (confirmed) {
    deleteCharacter();
  }
});
```

### Card

Standardized card component for displaying content in a visually appealing way.

```javascript
// Create a card
const card = UIManager.createCard({
  title: 'John Smith',
  subtitle: 'Protagonist',
  content: '<div class="character-summary">...</div>',
  image: './assets/character-portraits/john-smith.jpg',
  imagePosition: 'top', // top, left, right, bottom, cover
  elevation: 2, // 0-5, determines shadow depth
  clickable: true,
  actions: [
    {
      text: 'Edit',
      onClick: () => editCharacter(character.id)
    },
    {
      text: 'Delete',
      variant: 'danger',
      onClick: () => deleteCharacter(character.id)
    }
  ]
});

document.getElementById('charactersContainer').appendChild(card.element);

// Handle card selection
card.on('sg-card-click', () => {
  selectCharacter(character.id);
});

// Update card content
card.setContent(updatedSummaryHTML);
```

## Upgrading Existing UI Elements

The UI component system includes tools to upgrade existing UI elements to use the standardized components:

```javascript
// Import the upgrade function
import { upgradeExistingUI } from './modules/ui-components-integration.js';

// Upgrade all UI elements in a container
upgradeExistingUI(document.getElementById('characterPanel'));

// Or use the global helper (available after initialization)
window.SGUpgradeUI.upgradeContainer(document.getElementById('characterPanel'));

// Upgrade specific types of elements only
upgradeExistingUI(container, {
  buttons: true,
  inputs: true,
  dropdowns: true,
  cards: false // Skip upgrading cards
});
```

## Integration with Existing UIManager

The UI component system is fully integrated with the existing UIManager:

- `UIManager.createButton()` - Creates a Button component
- `UIManager.createInput()` - Creates a FormInput component
- `UIManager.createDropdown()` - Creates a Dropdown component
- `UIManager.createModal()` - Creates a Modal component
- `UIManager.createCard()` - Creates a Card component

Enhanced UIManager methods that use the components:

- `UIManager.showModal()` - Uses the Modal component
- `UIManager.showConfirmation()` - Uses the Modal component for confirmation dialogs

## Initialization

The UI component system is automatically initialized when the application starts via the `ui-components-init.js` script. You don't need to manually initialize it in most cases.

## Styling

All components use the `sg-` prefix for CSS classes to avoid conflicts with existing styles. The styling is automatically injected when the component system initializes.

## Best Practices

1. **Use factory methods**: Always create components using the UIManager factory methods rather than directly instantiating component classes.

2. **Centralize component creation**: Create components in a centralized location when possible, rather than scattered throughout the application.

3. **Leverage data attributes**: Use data attributes like `data-ui-role="button"` to mark elements for automatic upgrading.

4. **Consistent styling**: Stick to the provided variants and sizes for consistent styling.

5. **Clean up components**: When removing a component from the DOM, call its `destroy()` method to clean up event listeners.

## Extending the Component System

To add new component types:

1. Create a new component class in the `app/js/modules/ui/` directory
2. Make it extend the `UIComponent` base class
3. Add the component to the `index.js` exports
4. Add a factory method to the UIManager integration
5. Add appropriate styling to the `initializeComponentStyles` function

## Working with the Drag and Drop System

The existing drag and drop system in UIManager can be used with the new UI components:

```javascript
// Make a card draggable
UIManager.makeDraggable(card.element, {
  handle: card.headerElement,
  onDragStart: () => console.log('Started dragging card'),
  onDrop: (dropTarget) => console.log('Dropped card on', dropTarget)
});

// Create a sortable list of cards
UIManager.createSortable(cardsContainer, {
  itemSelector: '.sg-card',
  onSort: (newOrder) => updateCharactersOrder(newOrder)
});
```
