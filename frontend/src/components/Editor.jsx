import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server'; // IMPORT ReactDOMServer
import { debounce } from 'lodash';
import EnhancedPageControls from './EnhancedPageControls';
import TableComponent from './TableComponent'; // IMPORT THE NEW TABLE COMPONENT
import './Editor.css';
import './LatexRenderer';

function EditorCanvas({
  pages,
  currentPageIndex,
  switchPage,
  editorRef,
  handleInput,
  handleFocus,
  handleBlur,
  handleMouseUp,
  handleKeyUp,
  pageSize = 'a4',
  deletePage,
  handlePaste,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  handleEditorClick
}) {
  return (
    <div className="editor-body">
      <aside className="editor-sidebar">
        <EnhancedPageControls
          pages={pages}
          currentPageIndex={currentPageIndex}
          switchPage={switchPage}
          deletePage={deletePage}
        />
      </aside>
      <div className="editor-canvas">
        <div
          ref={editorRef}
          className="editor-page"
          data-page-size={pageSize}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseUp={handleMouseUp}
          onKeyUp={handleKeyUp}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleEditorClick}
        />
      </div>
    </div>
  );
}


function switchPage(index, editorRef, pages, setPages, currentPageIndex, setCurrentPageIndex) {
  const html = editorRef.current.innerHTML;
    setPages(prev => {
      const updated = [...prev];
      if (updated[currentPageIndex]) {
        updated[currentPageIndex] = {
          ...updated[currentPageIndex],
          content: html
        };
      }
      return updated;
    });
    setCurrentPageIndex(index);
}

// Utility: Split a span at a given offset in a text node (handles edge cases)
function splitSpanAtOffset(textNode, offset) {
  if (!textNode || textNode.nodeType !== 3 || !textNode.parentNode || textNode.parentNode.tagName !== 'SPAN') return;
  const span = textNode.parentNode;
  if (offset === 0 || offset === textNode.length) return;
  const before = document.createTextNode(textNode.textContent.slice(0, offset));
  const after = document.createTextNode(textNode.textContent.slice(offset));
  const newSpan = span.cloneNode(false);
  span.parentNode.insertBefore(before, textNode);
  span.parentNode.insertBefore(newSpan, textNode);
  newSpan.appendChild(after);
  textNode.textContent = textNode.textContent.slice(offset, offset + (textNode.length - offset));
  span.parentNode.removeChild(textNode);
}

// Utility: Split spans at selection boundaries (handles multi-node selections)
function splitSpansAtRange(range) {
  const { startContainer, startOffset, endContainer, endOffset } = range;
  if (startContainer.nodeType === 3 && startContainer.parentNode.tagName === 'SPAN') {
    splitSpanAtOffset(startContainer, startOffset);
  }
  if (endContainer.nodeType === 3 && endContainer.parentNode.tagName === 'SPAN') {
    splitSpanAtOffset(endContainer, endOffset);
  }
}

// Utility: Normalize spans in a container (merge, unwrap, remove empty)
function normalizeSpans(container) {
  if (!container) return;
  let node = container.firstChild;
  while (node) {
    if (node.nodeType === 1 && node.tagName === 'SPAN') {
      let next = node.nextSibling;
      while (next && next.nodeType === 1 && next.tagName === 'SPAN' && node.getAttribute('style') === next.getAttribute('style')) {
        while (next.firstChild) node.appendChild(next.firstChild);
        let toRemove = next;
        next = next.nextSibling;
        toRemove.parentNode.removeChild(toRemove);
      }
      // Unwrap empty or styleless spans
      if (!node.textContent || node.textContent === '\u200B' || !node.getAttribute('style')) {
        let toRemove = node;
        node = node.nextSibling;
        while (toRemove.firstChild) toRemove.parentNode.insertBefore(toRemove.firstChild, toRemove);
        toRemove.parentNode.removeChild(toRemove);
        continue;
      }
    }
    node = node.nextSibling;
  }
}


function useEditor(docId) {
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const editorRef = useRef(null);
  const socketRef = useRef(null);

  // Utility: Save editor state after DOM changes (THIS IS THE CORRECT LOCATION)
  const saveEditorState = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setPages(prev => {
        const updated = [...prev];
        if (updated[currentPageIndex]) {
          updated[currentPageIndex] = {
            ...updated[currentPageIndex],
            content: html
          };
        }
        return updated;
      });
    }
  }, [currentPageIndex, setPages]);


  // WebSocket setup
  useEffect(() => { /* ... */ }, [docId, currentPageIndex]);

  // Load initial document content
  useEffect(() => { /* ... */ }, [docId]);

  // Debounced autosave
  const autoSavePage = useCallback(
    debounce(async (pageIndex, content) => {
      const token = localStorage.getItem('token');
      if (!token || pageIndex === undefined) return;
  
      try {
        const res = await fetch(`http://localhost:3000/api/documents/${docId}/pages/${pageIndex}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content })
        });
  
        if (!res.ok) {
          const data = await res.json();
          console.error('❌ Failed to save page:', data);
        } else {
          console.log('✅ Page saved (PUT by index)');
        }
      } catch (err) {
        console.error('❌ Auto-save error:', err);
      }
    }, 1000),
    [docId]
  );
  

  const sendWebSocketUpdate = useCallback(
    debounce((html) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'update',
          data: html,
          pageIndex: currentPageIndex
        }));
      }
    }, 300),
    [currentPageIndex]
  );

  const handleInput = useCallback((e) => {
    const html = e.target.innerHTML;
    
    setPages(prev => {
      const updated = [...prev];
      if (updated[currentPageIndex]) {
        updated[currentPageIndex] = {
          ...updated[currentPageIndex],
          content: html
        };
      }
      return updated;
    });

    // Auto-save the page
    autoSavePage(currentPageIndex, html);

    // Update history for undo/redo
    setHistory(prev => {
      const newHistory = [...prev];
      const pageHistory = newHistory[currentPageIndex] || [];
      newHistory[currentPageIndex] = [...pageHistory, html];
      return newHistory;
    });

    // Clear redo stack when new content is added
    setRedoStack(prev => {
      const newRedo = [...prev];
      newRedo[currentPageIndex] = [];
      return newRedo;
    });

    // Send WebSocket update
    sendWebSocketUpdate(html);
  }, [currentPageIndex, autoSavePage, sendWebSocketUpdate]);

  // FIXED: Wrapped addPage in useCallback to fix exhaustive-deps warning
  const addPage = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:3000/api/documents/${docId}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: '<p>New Page</p>' })
      });

      const data = await res.json();
      setPages(prev => [...prev, data]);
      setCurrentPageIndex(prev => prev + 1);

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'add-page',
          data
        }));
      }
    } catch (err) {
      console.error('Failed to add page:', err);
    }
  }, [docId, setPages, setCurrentPageIndex]);


  const switchPage = (index) => {
    const html = editorRef.current.innerHTML;
    setPages(prev => {
      const updated = [...prev];
      if (updated[currentPageIndex]) {
        updated[currentPageIndex] = {
          ...updated[currentPageIndex],
          content: html
        };
      }
      return updated;
    });
    setCurrentPageIndex(index);
  };

  const deletePage = async (indexToDelete) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      return;
    }

    // Prevent deleting the last page if it's the only page
    if (pages.length <= 1) {
      alert('Cannot delete the last page. A document must have at least one page.');
      return;
    }
  
    try {
      console.log(`🗑️ Attempting to delete page ${indexToDelete} from document ${docId}`);
      
      const res = await fetch(`http://localhost:3000/api/documents/${docId}/pages/${indexToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) {
        const data = await res.json();
        console.error('❌ Failed to delete page:', data);
        alert(`Failed to delete page: ${data.error || 'Unknown error'}`);
        return;
      }
  
      console.log('✅ Server confirmed page deletion');
  
      // Remove the page from local state
      setPages(prev => {
        const updated = [...prev];
        updated.splice(indexToDelete, 1);
        console.log(`📄 Updated local pages array, removed page ${indexToDelete}`);
        return updated;
      });
  
      // Update currentPageIndex
      setCurrentPageIndex(prev => {
        let newIndex = prev;
        if (indexToDelete < prev) {
          newIndex = prev - 1;
        } else if (indexToDelete === prev && prev > 0) {
          newIndex = prev - 1;
        } else if (indexToDelete === prev && prev === 0) {
          newIndex = 0;
        }
        console.log(`📄 Updated current page index from ${prev} to ${newIndex}`);
        return newIndex;
      });
  
      // Optional: notify others via WebSocket
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'delete-page',
          pageIndex: indexToDelete,
        }));
        console.log('📡 WebSocket notification sent');
      }
  
      console.log('✅ Page deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting page:', err);
      alert(`Error deleting page: ${err.message}`);
    }
  };

  // --- NEW: Table Insertion Handler ---
  const insertTable = useCallback(() => {
    if (!editorRef.current) return;
    
    // We bypass React components and insert the static, pre-rendered HTML string directly.
    try {
        const initialTableHTML = `
            <div class='resizable-table-wrapper' contenteditable='false' style='position: relative; padding: 5px; max-width: 100%; border: 1px solid #777; background-color: #333;'>
              <table style='border-collapse: collapse; width: 100%; min-width: 600px; color: white;'>
                <tbody>
                  <tr>
                    <td style='border: 1px solid #555; padding: 8px; background-color: #4b5563; font-weight: bold;'>Header 1</td>
                    <td style='border: 1px solid #555; padding: 8px; background-color: #4b5563; font-weight: bold;'>Header 2</td>
                    <td style='border: 1px solid #555; padding: 8px; background-color: #4b5563; font-weight: bold;'>Header 3</td>
                  </tr>
                  <tr>
                    <td style='border: 1px solid #555; padding: 8px; background-color: #374151;'>Cell 1</td>
                    <td style='border: 1px solid #555; padding: 8px; background-color: #374151;'>Cell 2</td>
                    <td style='border: 1px solid #555; padding: 8px; background-color: #374151;'>Cell 3</td>
                  </tr>
                </tbody>
              </table>
            </div><p><br></p>`;

        // Insert the HTML at the cursor position
        document.execCommand('insertHTML', false, initialTableHTML);
        
        // After insertion, save the state (or force handleInput if needed)
        saveEditorState(); 
        editorRef.current.focus();

    } catch (error) {
         console.error('❌ Table insertion failed:', error);
         alert('Table insertion failed: ExecCommand error.');
    }

  }, [editorRef, saveEditorState]); // ADDED saveEditorState dependency

  // Image upload functionality
  const insertImage = (imageUrl, altText = 'Image') => {
    if (!editorRef.current) return;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = altText;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '8px 0'; // Reduced margin
    img.style.cursor = 'pointer';
    img.className = 'resizable-image';

    // 🎓 LEARNING: Image Interaction Handling
    // We need to handle both selection and dragging
    let dragStartTime = 0;
    
    img.addEventListener('mousedown', (e) => {
      // 🎓 LEARNING: Prevent Default
      // Prevent text selection while dragging
      e.preventDefault();
      e.stopPropagation();
      
      // 🎓 LEARNING: Track Drag Start
      // Remember when we started
      dragStartTime = Date.now();
      img.dataset.hasDragged = 'false';
      
      // 🎓 LEARNING: Start Drag Operation
      // Only start dragging if clicking on the image itself, not on handles
      if (!e.target.classList.contains('resize-handle')) {
        startDrag(img, e);
      }
    });

    img.addEventListener('click', (e) => {
      // 🎓 LEARNING: Distinguish Between Click and Drag
      // Only select if it's a quick click (not a drag)
      const clickDuration = Date.now() - dragStartTime;
      const hasDragged = img.dataset.hasDragged === 'true';
      if (clickDuration < 200 && !hasDragged) {
        e.preventDefault();
        selectImage(img);
      }
    });

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // 🎓 LEARNING: Smart Image Insertion
      // Insert image at cursor position
      range.deleteContents();
      range.insertNode(img);
      range.collapse(false);
      
      // 🎓 LEARNING: Add Space After Image
      // Add a small space after the image for better readability
      const space = document.createTextNode('\u00A0'); // Non-breaking space
      range.insertNode(space);
      range.collapse(false);
    } else {
      // 🎓 LEARNING: Append to End
      // If no selection, append to the end of the editor
      editorRef.current.appendChild(img);
      
      // 🎓 LEARNING: Add Space After Image
      const space = document.createTextNode('\u00A0');
      editorRef.current.appendChild(space);
    }

    // 🎓 LEARNING: Smart Spacing
    // The image is now inserted with proper spacing using non-breaking spaces
    // This provides better control over spacing without excessive line breaks

    saveEditorState();
    editorRef.current.focus();
  };

  // 🎓 LEARNING: Image Selection Function
  // This function handles selecting an image and showing resize controls
  const selectImage = (img) => {
    // 🎓 LEARNING: DOM Querying
    // querySelectorAll finds all elements matching the selector
    // We remove selection from other images first
    const allImages = editorRef.current.querySelectorAll('.resizable-image');
    allImages.forEach(image => {
      image.classList.remove('selected');
    });

    // 🎓 LEARNING: CSS Classes for State
    // We use CSS classes to track which image is selected
    // This is a common pattern in web development
    img.classList.add('selected');
    
    // Create resize handles and toolbar
    createResizeHandles(img);
    createImageToolbar(img);
  };

  // 🎓 LEARNING: Dynamic UI Creation
  // This function creates a toolbar that appears above the selected image
  const createImageToolbar = (img) => {
    // 🎓 LEARNING: DOM Cleanup
    // Always remove existing elements before creating new ones
    // This prevents duplicate toolbars
    const existingToolbar = editorRef.current.querySelector('.image-toolbar');
    if (existingToolbar) {
      existingToolbar.remove();
    }

    // 🎓 LEARNING: Creating DOM Elements
    // document.createElement() creates new HTML elements
    const toolbar = document.createElement('div');
    toolbar.className = 'image-toolbar';
    
    // 🎓 LEARNING: Inline Styles vs CSS Classes
    // For dynamic positioning, we use inline styles
    // For consistent styling, we use CSS classes
    toolbar.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      display: flex;
      gap: 4px;
    `;

    // 🎓 LEARNING: Element Positioning
    // getBoundingClientRect() gives us the exact position and size of an element
    const rect = img.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    // Position toolbar above the image
    toolbar.style.left = `${rect.left - editorRect.left}px`;
    toolbar.style.top = `${rect.top - editorRect.top - 50}px`;

    // 🎓 LEARNING: Button Configuration
    // We define button properties in an array for easy management
    const buttons = [
      { text: '🗑️', title: 'Delete Image', action: () => deleteImage(img) },
      { text: '↔️', title: 'Reset Size', action: () => resetImageSize(img) },
      { text: '📏', title: 'Set Size', action: () => setImageSize(img) },
      { text: '🖱️', title: 'Drag to Move', action: () => {} }
    ];

    // 🎓 LEARNING: Dynamic Button Creation
    // We loop through the button config to create each button
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.title = btn.title;
      button.style.cssText = `
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      `;
      
      // 🎓 LEARNING: Event Handlers
      // We add mouse events for hover effects
      button.onmouseover = () => {
        button.style.background = '#e2e8f0';
      };
      button.onmouseout = () => {
        button.style.background = '#f8fafc';
      };
      button.onclick = btn.action;
      
      toolbar.appendChild(button);
    });

    editorRef.current.appendChild(toolbar);
  };

  // 🎓 LEARNING: Update Toolbar Position
  // This function updates the toolbar position when the image moves
  const updateImageToolbarPosition = (img) => {
    const toolbar = editorRef.current.querySelector('.image-toolbar');
    if (toolbar) {
      // 🎓 LEARNING: Recalculate Position
      // Get the current position of the image
      const rect = img.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      
      // 🎓 LEARNING: Update Toolbar Position
      // Position toolbar above the image
      toolbar.style.left = `${rect.left - editorRect.left}px`;
      toolbar.style.top = `${rect.top - editorRect.top - 50}px`;
    }
  };

  // 🎓 LEARNING: Image Action Functions
  // These functions handle different actions on the selected image
  
  const deleteImage = (img) => {
    // 🎓 LEARNING: User Confirmation
    // Always ask for confirmation before deleting
    if (window.confirm('Are you sure you want to delete this image?')) {
      img.remove();
      
      // 🎓 LEARNING: Cleanup
      // Always clean up related UI elements
      const toolbar = editorRef.current.querySelector('.image-toolbar');
      if (toolbar) toolbar.remove();
      
      const handles = editorRef.current.querySelectorAll('.resize-handle');
      handles.forEach(handle => handle.remove());
      
      saveEditorState();
    }
  };

  const resetImageSize = (img) => {
    // 🎓 LEARNING: Resetting Styles
    // Clear all custom size styles to return to original size
    img.style.width = '';
    img.style.height = '';
    img.style.left = '';
    img.style.top = '';
    
    // Recreate handles for the new size
    createResizeHandles(img);
    saveEditorState();
  };

  const setImageSize = (img) => {
    // 🎓 LEARNING: User Input
    // prompt() is a simple way to get user input
    // In production, you'd use a modal or form
    const width = window.prompt('Enter width (px):', img.offsetWidth);
    const height = window.prompt('Enter height (px):', img.offsetHeight);
    
    if (width && height) {
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      createResizeHandles(img);
      saveEditorState();
    }
  };

  // 🎓 LEARNING: Resize Handles Creation
  // This is the most complex part - creating the corner handles for resizing
  const createResizeHandles = (img) => {
    // 🎓 LEARNING: DOM Cleanup
    // Remove existing handles first
    const existingHandles = editorRef.current.querySelectorAll('.resize-handle');
    existingHandles.forEach(handle => handle.remove());

    // 🎓 LEARNING: Handle Positions
    // We create 4 handles: northwest, northeast, southwest, southeast
    const handles = ['nw', 'ne', 'sw', 'se'];
    
    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${position}`;
      
      // 🎓 LEARNING: Absolute Positioning
      // position: absolute removes the element from normal document flow
      // We position it relative to the editor container
      handle.style.position = 'absolute';
      handle.style.width = '8px';
      handle.style.height = '8px';
      handle.style.backgroundColor = '#3b82f6';
      handle.style.border = '1px solid white';
      handle.style.borderRadius = '50%';
      
      // 🎓 LEARNING: Cursor Styles
      // Different cursor styles for different resize directions
      handle.style.cursor = `${position === 'nw' || position === 'se' ? 'nw-resize' : 'ne-resize'}`;
      handle.style.zIndex = '1000';
      
      // 🎓 LEARNING: Positioning Logic
      // Calculate where each handle should be positioned
      const rect = img.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      
      let left, top;
      switch(position) {
        case 'nw': 
          left = rect.left - editorRect.left - 4; 
          top = rect.top - editorRect.top - 4; 
          break;
        case 'ne': 
          left = rect.right - editorRect.left - 4; 
          top = rect.top - editorRect.top - 4; 
          break;
        case 'sw': 
          left = rect.left - editorRect.left - 4; 
          top = rect.bottom - editorRect.top - 4; 
          break;
        case 'se': 
          left = rect.right - editorRect.left - 4; 
          top = rect.bottom - editorRect.top - 4; 
          break;
      }
      
      handle.style.left = `${left}px`;
      handle.style.top = `${top}px`;
      
      // 🎓 LEARNING: Event Delegation
      // We add mousedown event to start the resize operation
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startResize(img, position, e);
      });
      
      editorRef.current.appendChild(handle);
    });
  };

  // 🎓 LEARNING: The Resize Function
  // This is the heart of the resize functionality
  const startResize = (img, handle, e) => {
    // 🎓 LEARNING: Capturing Initial State
    // We need to remember where we started to calculate the change
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = img.offsetWidth;
    const startHeight = img.offsetHeight;
    const startLeft = img.offsetLeft;
    const startTop = img.offsetTop;
    
    // 🎓 LEARNING: Mouse Move Handler
    // This function runs every time the mouse moves
    const handleMouseMove = (e) => {
      // 🎓 LEARNING: Delta Calculation
      // Calculate how far the mouse has moved from the start
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth, newHeight;
      
      // 🎓 LEARNING: Handle-Specific Logic
      // Each corner handle behaves differently
      switch(handle) {
        case 'se': // Southeast - resize from bottom-right
          newWidth = Math.max(50, startWidth + deltaX);
          newHeight = Math.max(50, startHeight + deltaY);
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          break;
        case 'sw': // Southwest - resize from bottom-left
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(50, startHeight + deltaY);
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          img.style.left = `${startLeft + startWidth - newWidth}px`;
          break;
        case 'ne': // Northeast - resize from top-right
          newWidth = Math.max(50, startWidth + deltaX);
          newHeight = Math.max(50, startHeight - deltaY);
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          img.style.top = `${startTop + startHeight - newHeight}px`;
          break;
        case 'nw': // Northwest - resize from top-left
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(50, startHeight - deltaY);
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          img.style.left = `${startLeft + startWidth - newWidth}px`;
          img.style.top = `${startTop + startHeight - newHeight}px`;
          break;
      }
      
      // 🎓 LEARNING: Real-time Updates
      // Update handle positions as the image resizes
      createResizeHandles(img);
    };
    
    // 🎓 LEARNING: Mouse Up Handler
    // This function runs when the user stops dragging
    const handleMouseUp = () => {
      // 🎓 LEARNING: Event Cleanup
      // Always remove event listeners when done
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      saveEditorState();
    };
    
    // 🎓 LEARNING: Global Event Listeners
    // We add listeners to document, not just the handle
    // This ensures we catch mouse events even if the cursor moves outside the handle
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 🎓 LEARNING: Image Dragging Function
  // This function allows you to drag images around the document
  const startDrag = (img, e) => {
    // 🎓 LEARNING: Prevent Default Behavior
    // Prevent text selection while dragging
    e.preventDefault();
    e.stopPropagation();

    // 🎓 LEARNING: Visual Feedback
    // Add dragging class for visual feedback
    img.classList.add('dragging');

    // 🎓 LEARNING: Capture Initial State
    // Remember where the mouse started relative to the image
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = img.offsetLeft;
    const startTop = img.offsetTop;

    // 🎓 LEARNING: Mouse Move Handler for Dragging
    const handleMouseMove = (e) => {
      // 🎓 LEARNING: Calculate Movement
      // Calculate how far the mouse has moved
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // 🎓 LEARNING: Check if Actually Dragging
      // Only move if we've moved more than a few pixels
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        // Set the drag flag to prevent click selection
        img.dataset.hasDragged = 'true';
        
        // 🎓 LEARNING: Update Position
        // Move the image by the same amount as the mouse
        img.style.position = 'relative'; // Ensure positioning works
        img.style.left = `${startLeft + deltaX}px`;
        img.style.top = `${startTop + deltaY}px`;

        // 🎓 LEARNING: Real-time Updates
        // Update handles and toolbar position as image moves
        createResizeHandles(img);
        updateImageToolbarPosition(img);
      }
    };

    // 🎓 LEARNING: Mouse Up Handler
    const handleMouseUp = () => {
      // 🎓 LEARNING: Visual Feedback Cleanup
      // Remove dragging class
      img.classList.remove('dragging');
      
      // 🎓 LEARNING: Event Cleanup
      // Always remove event listeners when done
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 🎓 LEARNING: Save State
      // Save the new position to the document state
      saveEditorState();
    };

    // 🎓 LEARNING: Global Event Listeners
    // Add listeners to document for smooth dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 🎓 LEARNING: Click Outside to Deselect
  // This function handles deselecting images when clicking elsewhere
  const handleEditorClick = (e) => {
    // 🎓 LEARNING: Event Target Checking
    // Check if the click was on an image, handle, or toolbar
    if (!e.target.classList.contains('resizable-image') && 
        !e.target.classList.contains('resize-handle') &&
        !e.target.closest('.image-toolbar')) {
      
      // 🎓 LEARNING: Bulk DOM Operations
      // Remove selection from all images
      const allImages = editorRef.current.querySelectorAll('.resizable-image');
      allImages.forEach(image => {
        image.classList.remove('selected');
      });
      
      // 🎓 LEARNING: Cleanup UI Elements
      // Remove all resize handles
      const handles = editorRef.current.querySelectorAll('.resize-handle');
      handles.forEach(handle => handle.remove());
      
      // Remove toolbar
      const toolbar = editorRef.current.querySelector('.image-toolbar');
      if (toolbar) toolbar.remove();
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      // 🎓 LEARNING: User Feedback
      // Show loading message to user
      console.log('📤 Uploading image...');
      
      // 🎓 LEARNING: Proper Image Upload
      // Upload image to server and get a URL back
      const imageUrl = await uploadImageToServer(file);
      
      console.log('✅ Image uploaded successfully:', imageUrl);
      insertImage(imageUrl, file.name);
    } catch (err) {
      console.error('❌ Error uploading image:', err);
      alert(`Failed to upload image: ${err.message}`);
    }
  };

  // 🎓 LEARNING: Server Image Upload Function
  // This function uploads the image to the server and returns a URL
  const uploadImageToServer = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    // 🎓 LEARNING: FormData for File Upload
    // FormData is used to send files to the server
    const formData = new FormData();
    formData.append('image', file);
    formData.append('documentId', docId);

    const response = await fetch('http://localhost:3000/api/upload-image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // 🎓 LEARNING: Don't set Content-Type for FormData
        // The browser will set it automatically with the boundary
      },
      body: formData
    });

    if (!response.ok) {
      // 🎓 LEARNING: Better Error Handling
      // Try to parse JSON error, but handle HTML responses too
      let errorMessage = 'Failed to upload image';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch (parseError) {
        // If response is not JSON (like HTML error page), use status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.imageUrl; // Server returns the image URL
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        // 🎓 LEARNING: Handle Pasted Images
        // Upload pasted images to server just like uploaded files
        handleImageUpload(file);
        return;
      }
    }
  };



  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        alert('Please drop an image file');
      }
    }
  };
  


  // Utility: Split a span at a given offset in a text node (handles edge cases)
  function splitSpanAtOffset(textNode, offset) {
    if (!textNode || textNode.nodeType !== 3 || !textNode.parentNode || textNode.parentNode.tagName !== 'SPAN') return;
    const span = textNode.parentNode;
    if (offset === 0 || offset === textNode.length) return;
    const before = document.createTextNode(textNode.textContent.slice(0, offset));
    const after = document.createTextNode(textNode.textContent.slice(offset));
    const newSpan = span.cloneNode(false);
    span.parentNode.insertBefore(before, textNode);
    span.parentNode.insertBefore(newSpan, textNode);
    newSpan.appendChild(after);
    textNode.textContent = textNode.textContent.slice(offset, offset + (textNode.length - offset));
    span.parentNode.removeChild(textNode);
  }

  // Utility: Split spans at selection boundaries (handles multi-node selections)
  function splitSpansAtRange(range) {
    const { startContainer, startOffset, endContainer, endOffset } = range;
    if (startContainer.nodeType === 3 && startContainer.parentNode.tagName === 'SPAN') {
      splitSpanAtOffset(startContainer, startOffset);
    }
    if (endContainer.nodeType === 3 && endContainer.parentNode.tagName === 'SPAN') {
      splitSpanAtOffset(endContainer, endOffset);
    }
  }


  

  // Utility: Normalize spans in a container (merge, unwrap, remove empty)
  function normalizeSpans(container) {
    if (!container) return;
    let node = container.firstChild;
    while (node) {
      if (node.nodeType === 1 && node.tagName === 'SPAN') {
        let next = node.nextSibling;
        while (next && next.nodeType === 1 && next.tagName === 'SPAN' && node.getAttribute('style') === next.getAttribute('style')) {
          while (next.firstChild) node.appendChild(next.firstChild);
          let toRemove = next;
          next = next.nextSibling;
          toRemove.parentNode.removeChild(toRemove);
        }
        // Unwrap empty or styleless spans
        if (!node.textContent || node.textContent === '\u200B' || !node.getAttribute('style')) {
          let toRemove = node;
          node = node.nextSibling;
          while (toRemove.firstChild) toRemove.parentNode.insertBefore(toRemove.firstChild, toRemove);
          toRemove.parentNode.removeChild(toRemove);
          continue;
        }
      }
      node = node.nextSibling;
    }
  }

  // Utility: Save editor state after DOM changes
  // function saveEditorState() {
  //   if (editorRef.current) {
  //     const html = editorRef.current.innerHTML;
  //     setPages(prev => {
  //       const updated = [...prev];
  //       if (updated[currentPageIndex]) {
  //         updated[currentPageIndex] = {
  //           ...updated[currentPageIndex],
  //           content: html
  //         };
  //       }
  //       return updated;
  //     });
  //   }
  // }

  // Utility: Check if execCommand works for a command
  function canUseExecCommand(command) {
    try {
      document.execCommand(command, false, '#000000');
      return true;
    } catch (e) {
      return false;
    }
  }

  const format = (command, value = null) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      document.execCommand(command, false, value);
      return;
    }
    const range = selection.getRangeAt(0);
    // Hybrid: Try execCommand for color/highlight first
    if ((command === 'foreColor' || command === 'hiliteColor') && value && canUseExecCommand(command)) {
      document.execCommand(command, false, value);
      saveEditorState();
      return;
    }
    if (command === 'removeColor' || command === 'removeHighlight') {
      if (!range.collapsed) {
        splitSpansAtRange(range);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        let walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, null);
        let node;
        while ((node = walker.nextNode())) {
          if (node.tagName === 'SPAN') {
            if (command === 'removeColor') node.style.color = '';
            if (command === 'removeHighlight') node.style.backgroundColor = '';
            if (!node.getAttribute('style')) {
              const parent = node.parentNode;
              while (node.firstChild) parent.insertBefore(node.firstChild, node);
              parent.removeChild(node);
            }
          }
        }
        normalizeSpans(container);
        range.deleteContents();
        let lastNode = null;
        Array.from(container.childNodes).forEach(n => {
          lastNode = n;
          range.insertNode(n);
        });
        normalizeSpans(range.commonAncestorContainer);
        if (lastNode) {
          selection.removeAllRanges();
          const newRange = document.createRange();
          if (lastNode.nodeType === 3) {
            newRange.setStart(lastNode, lastNode.length);
          } else {
            newRange.selectNodeContents(lastNode);
            newRange.collapse(false);
          }
          selection.addRange(newRange);
        }
        saveEditorState();
        return;
      } else {
        let node = selection.anchorNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        if (node && node.tagName === 'SPAN') {
          if (command === 'removeColor') node.style.color = '';
          if (command === 'removeHighlight') node.style.backgroundColor = '';
          if (!node.getAttribute('style')) {
            const parent = node.parentNode;
            while (node.firstChild) parent.insertBefore(node.firstChild, node);
            parent.removeChild(node);
          }
        }
        saveEditorState();
        return;
      }
    }
    if ((command === 'foreColor' || command === 'hiliteColor') && value) {
      if (!range.collapsed) {
        splitSpansAtRange(range);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        let walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        let textNode;
        while ((textNode = walker.nextNode())) {
          if (textNode.textContent.trim() !== '') {
            let parent = textNode.parentNode;
            if (parent.tagName === 'SPAN') {
              if ((command === 'foreColor' && parent.style.color === value) ||
                  (command === 'hiliteColor' && parent.style.backgroundColor === value)) {
                continue;
              }
            }
            let span = document.createElement('span');
            if (command === 'foreColor') span.style.color = value;
            if (command === 'hiliteColor') span.style.backgroundColor = value;
            textNode.parentNode.replaceChild(span, textNode);
            span.appendChild(textNode);
          }
        }
        normalizeSpans(container);
        range.deleteContents();
        let lastNode = null;
        Array.from(container.childNodes).forEach(n => {
          lastNode = n;
          range.insertNode(n);
        });
        normalizeSpans(range.commonAncestorContainer);
        if (lastNode) {
          selection.removeAllRanges();
          const newRange = document.createRange();
          if (lastNode.nodeType === 3) {
            newRange.setStart(lastNode, lastNode.length);
          } else {
            newRange.selectNodeContents(lastNode);
            newRange.collapse(false);
          }
          selection.addRange(newRange);
        }
        saveEditorState();
        return;
      } else {
        const span = document.createElement('span');
        if (command === 'foreColor') span.style.color = value;
        if (command === 'hiliteColor') span.style.backgroundColor = value;
        span.appendChild(document.createTextNode('\u200B'));
        range.insertNode(span);
        normalizeSpans(span.parentNode);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStart(span.firstChild, 1);
        newRange.collapse(true);
        selection.addRange(newRange);
        setTimeout(() => {
          const editor = editorRef.current;
          if (!editor) return;
          editor.querySelectorAll('span').forEach(s => {
            if ((s.style.color || s.style.backgroundColor) && s.textContent === '\u200B') {
              s.parentNode.removeChild(s);
            }
          });
          normalizeSpans(editor);
          saveEditorState();
        }, 0);
        return;
      }
    }
    document.execCommand(command, false, value);
    saveEditorState();
  };
  
  

  const undo = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev];
      const pageHistory = newHistory[currentPageIndex] || [];

      if (pageHistory.length > 1) {
        const newRedo = [...redoStack];
        newRedo[currentPageIndex] = [...(redoStack[currentPageIndex] || []), pageHistory.pop()];
        setRedoStack(newRedo);

        const newContent = pageHistory[pageHistory.length - 1];
        newHistory[currentPageIndex] = pageHistory;

        setPages(p => {
          const updated = [...p];
          updated[currentPageIndex] = {
            ...updated[currentPageIndex],
            content: newContent
          };
          return updated;
        });

        if (editorRef.current) editorRef.current.innerHTML = newContent;
      }

      return newHistory;
    });
  }, [currentPageIndex, redoStack]);

  const redo = useCallback(() => {
    setRedoStack(prev => {
      const newRedo = [...prev];
      const pageRedo = newRedo[currentPageIndex] || [];

      if (pageRedo.length > 0) {
        const newHistory = [...history];
        const redoContent = pageRedo.pop();

        newHistory[currentPageIndex] = [...(newHistory[currentPageIndex] || []), redoContent];
        setHistory(newHistory);

        setPages(p => {
          const updated = [...p];
          updated[currentPageIndex] = {
            ...updated[currentPageIndex],
            content: redoContent
          };
          return updated;
        });

        if (editorRef.current) editorRef.current.innerHTML = redoContent;
      }

      return newRedo;
    });
  }, [currentPageIndex, history]);

  // FIXED: Wrapped addPage in useCallback
  // const addPage = useCallback(async () => {
  //   const token = localStorage.getItem('token');
  //   if (!token) return;

  //   try {
  //     const res = await fetch(`http://localhost:3000/api/documents/${docId}/pages`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${token}`
  //       },
  //       body: JSON.stringify({ content: '<p>New Page</p>' })
  //     });

  //     const data = await res.json();
  //     setPages(prev => [...prev, data]);
  //     setCurrentPageIndex(prev => prev + 1);

  //     if (socketRef.current?.readyState === WebSocket.OPEN) {
  //       socketRef.current.send(JSON.stringify({
  //         type: 'add-page',
  //         data
  //       }));
  //     }
  //   } catch (err) {
  //     console.error('Failed to add page:', err);
  //   }
  // }, [docId, setPages, setCurrentPageIndex]);


  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      addPage();
    }
  }, [addPage]); // Dependency on addPage is correct because it's wrapped in useCallback


  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const isCtrl = isMac ? e.metaKey : e.ctrlKey;

      // FIXED: Corrected the ternary operator that caused the syntax error
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (editorRef.current && pages[currentPageIndex]?.content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = pages[currentPageIndex]?.content || '';
      
      // Apply syntax highlighting after content is loaded
      setTimeout(() => {
        const codeBlocks = editorRef.current?.querySelectorAll('pre code');
        if (codeBlocks) {
          codeBlocks.forEach(codeBlock => {
            const language = codeBlock.className.replace('language-', '');
            if (language) {
              // Trigger a custom event for syntax highlighting
              const event = new CustomEvent('applySyntaxHighlighting', { 
                detail: { language, codeBlock } 
              });
              editorRef.current.dispatchEvent(event);
            }
          });
        }
      }, 10);
    }
  }, [pages, currentPageIndex]);

  return {
    pages,
    currentPageIndex,
    switchPage,
    format,
    undo,
    redo,
    addPage,
    deletePage,
    editorRef,
    handleInput,
    insertImage,
    handleImageUpload,
    handlePaste,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleEditorClick,
    insertTable,
  };
}

export { EditorCanvas , switchPage }
export default useEditor;