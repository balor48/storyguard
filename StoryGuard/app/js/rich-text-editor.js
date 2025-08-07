// Enhanced Rich Text Editor Functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log("Rich Text Editor Enhancement script loaded");
    
    // Initialize all rich text editors on the page
    initializeRichTextEditors();
    
    // Re-initialize when tabs are switched
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Wait a bit for the DOM to update
            setTimeout(initializeRichTextEditors, 100);
        });
    });
    
    // Function to initialize all rich text editors
    function initializeRichTextEditors() {
        // Find all existing rich text toolbars
        const toolbars = document.querySelectorAll('.rich-text-toolbar');
        
        toolbars.forEach(toolbar => {
            // Skip if already enhanced
            if (toolbar.classList.contains('enhanced')) return;
            
            // Mark as enhanced
            toolbar.classList.add('enhanced');
            
            // Find the associated editor
            const editorId = toolbar.nextElementSibling?.id;
            if (!editorId) return;
            
            const editor = document.getElementById(editorId);
            if (!editor) return;
            
            // Clear existing buttons
            toolbar.innerHTML = '';
            
            // Create button groups and add buttons
            
            // Text style group
            const styleGroup = document.createElement('div');
            styleGroup.className = 'rich-text-group';
            
            // Bold button
            addButton(styleGroup, 'bold', 'B', 'Bold (Ctrl+B)');
            
            // Italic button
            addButton(styleGroup, 'italic', 'I', 'Italic (Ctrl+I)');
            
            // Underline button
            addButton(styleGroup, 'underline', 'U', 'Underline (Ctrl+U)');
            
            toolbar.appendChild(styleGroup);
            
            // Paragraph style group
            const paragraphGroup = document.createElement('div');
            paragraphGroup.className = 'rich-text-group';
            
            // Heading buttons
            addButton(paragraphGroup, 'formatBlock', 'H1', 'Heading 1', '<h1>');
            addButton(paragraphGroup, 'formatBlock', 'H2', 'Heading 2', '<h2>');
            addButton(paragraphGroup, 'formatBlock', 'H3', 'Heading 3', '<h3>');
            
            toolbar.appendChild(paragraphGroup);
            
            // Alignment group
            const alignGroup = document.createElement('div');
            alignGroup.className = 'rich-text-group';
            
            // Left align
            addButton(alignGroup, 'justifyLeft', '<i class="fas fa-align-left"></i>', 'Align Left');
            
            // Center align
            addButton(alignGroup, 'justifyCenter', '<i class="fas fa-align-center"></i>', 'Align Center');
            
            // Right align
            addButton(alignGroup, 'justifyRight', '<i class="fas fa-align-right"></i>', 'Align Right');
            
            toolbar.appendChild(alignGroup);
            
            // List group
            const listGroup = document.createElement('div');
            listGroup.className = 'rich-text-group';
            
            // Bullet list
            addButton(listGroup, 'insertUnorderedList', '<i class="fas fa-list-ul"></i>', 'Bullet List');
            
            // Numbered list
            addButton(listGroup, 'insertOrderedList', '<i class="fas fa-list-ol"></i>', 'Numbered List');
            
            toolbar.appendChild(listGroup);
            
            // Insert group
            const insertGroup = document.createElement('div');
            insertGroup.className = 'rich-text-group';
            
            // Link
            addButton(insertGroup, 'createLink', '<i class="fas fa-link"></i>', 'Insert Link');
            
            // Image (placeholder - actual implementation would need file upload)
            addButton(insertGroup, 'insertImage', '<i class="fas fa-image"></i>', 'Insert Image');
            
            // Code
            addButton(insertGroup, 'formatBlock', '<i class="fas fa-code"></i>', 'Code Block', '<pre>');
            
            toolbar.appendChild(insertGroup);
            
            // Add word counter
            const wordCount = document.createElement('div');
            wordCount.className = 'word-count';
            wordCount.textContent = 'Words: 0';
            editor.parentNode.insertBefore(wordCount, editor.nextSibling);
            
            // Update word count on input
            editor.addEventListener('input', function() {
                const text = editor.innerText || '';
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                wordCount.textContent = `Words: ${words}`;
                
                // Update hidden textarea if it exists
                const textareaId = editor.getAttribute('data-target') || editorId.replace('RichTextEditor', '');
                const textarea = document.getElementById(textareaId);
                if (textarea) {
                    textarea.value = editor.innerHTML;
                }
            });
            
            // Add keyboard shortcuts
            editor.addEventListener('keydown', function(e) {
                // Ctrl+B for bold
                if (e.ctrlKey && e.key === 'b') {
                    e.preventDefault();
                    document.execCommand('bold', false, null);
                }
                
                // Ctrl+I for italic
                if (e.ctrlKey && e.key === 'i') {
                    e.preventDefault();
                    document.execCommand('italic', false, null);
                }
                
                // Ctrl+U for underline
                if (e.ctrlKey && e.key === 'u') {
                    e.preventDefault();
                    document.execCommand('underline', false, null);
                }
                
                // Tab key for indentation
                if (e.key === 'Tab') {
                    e.preventDefault();
                    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                }
            });
        });
    }
    
    // Helper function to add a button to a group
    function addButton(group, command, html, title, value) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'rich-text-btn';
        button.innerHTML = html;
        button.title = title;
        button.dataset.command = command;
        if (value) button.dataset.value = value;
        
        button.addEventListener('click', function() {
            const command = this.dataset.command;
            const value = this.dataset.value || null;
            
            if (command === 'createLink') {
                const url = prompt('Enter the URL:');
                if (url) document.execCommand(command, false, url);
            } else if (command === 'insertImage') {
                const url = prompt('Enter the image URL:');
                if (url) document.execCommand(command, false, url);
            } else if (command === 'formatBlock' && value) {
                document.execCommand(command, false, value);
            } else {
                document.execCommand(command, false, value);
            }
            
            // Toggle active state for applicable commands
            if (['bold', 'italic', 'underline'].includes(command)) {
                this.classList.toggle('active', document.queryCommandState(command));
            }
        });
        
        group.appendChild(button);
        return button;
    }
});