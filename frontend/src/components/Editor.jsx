import React, { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import EnhancedPageControls from './EnhancedPageControls';
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
  handleEditorClick,
  columns = 1,
  headerEnabled = false, footerEnabled = false,
  headerHTML = '', footerHTML = '',
  onHeaderInput, onFooterInput,
  headerHeight = 72, footerHeight = 56,
}) {
  const pageVars = {
    '--header-h': headerEnabled ? `${headerHeight}px` : '0px',
    '--footer-h': footerEnabled ? `${footerHeight}px` : '0px',
  };

  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const pageContainerRef = useRef(null);

  useEffect(() => {
    if (headerRef.current && headerHTML != null) {
      headerRef.current.innerHTML = headerHTML || '';
    }
    if (footerRef.current && footerHTML != null) {
      footerRef.current.innerHTML = footerHTML || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHeaderInputLocal = () => {
    onHeaderInput?.(headerRef.current?.innerHTML || '');
  };
  const handleFooterInputLocal = () => {
    onFooterInput?.(footerRef.current?.innerHTML || '');
  };

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

      <div
        className="editor-canvas"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          ref={pageContainerRef}
          className="editor-page editor-columns"
          data-page-size={pageSize}
          style={{
            ...pageVars,
            ['--cols']: String(columns),
            ['--col-gap']: '2rem',
          }}
          onClick={handleEditorClick}
        >
          {headerEnabled && (
            <div
              className="page-header"
              ref={headerRef}
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              onInput={handleHeaderInputLocal}
              data-placeholder="Header (title • date • page)"
            />
          )}

          <div
            className="page-body"
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            dir="ltr"
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseUp={handleMouseUp}
            onKeyUp={handleKeyUp}
            onPaste={handlePaste}
          />

          {footerEnabled && (
            <div
              className="page-footer"
              ref={footerRef}
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              onInput={handleFooterInputLocal}
              data-placeholder="Footer (author • Page X)"
            />
          )}
        </div>
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



function useEditor(docId) {
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [columns, setColumns] = useState(1); 
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !docId) return;

    const ws = new WebSocket(`ws://localhost:3001?docId=${docId}&token=${token}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (err) {
        console.error('Invalid WebSocket message:', err);
        return;
      }

      const { type, data, pageIndex } = message;

      if (type === 'update') {
        setPages(prev => {
          const updated = [...prev];
          if (typeof pageIndex === 'number' && updated[pageIndex]?.content !== data) {
            updated[pageIndex] = { ...updated[pageIndex], content: data };
          }
          return updated;
        });

        if (pageIndex === currentPageIndex && editorRef.current?.innerHTML !== data) {
          editorRef.current.innerHTML = data;
        }
      }

      if (type === 'add-page') {
        setPages(prev => [...prev, data]);
      }
    };

    return () => ws.close();
  }, [docId, currentPageIndex]);

  // Load initial document content
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !docId) return;

    const fetchDoc = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/documents/${docId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPages(data.pages);
        setCurrentPageIndex(0);
        setHistory([data.pages.map(p => p.content)]);
      } catch (err) {
        console.error('Failed to load document:', err);
      }
    };

    fetchDoc();
  }, [docId]);

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

    autoSavePage(currentPageIndex, html);

    setHistory(prev => {
      const newHistory = [...prev];
      const pageHistory = newHistory[currentPageIndex] || [];
      newHistory[currentPageIndex] = [...pageHistory, html];
      return newHistory;
    });

    setRedoStack(prev => {
      const newRedo = [...prev];
      newRedo[currentPageIndex] = [];
      return newRedo;
    });

    sendWebSocketUpdate(html);
  }, [currentPageIndex, autoSavePage, sendWebSocketUpdate]);

  const addPage = async () => {
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
  };

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

    if (pages.length <= 1) {
      alert('Cannot delete the last page. A document must have at least one page.');
      return;
    }
  
    try {
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
  
      setPages(prev => {
        const updated = [...prev];
        updated.splice(indexToDelete, 1);
        return updated;
      });
  
      setCurrentPageIndex(prev => {
        let newIndex = prev;
        if (indexToDelete < prev) {
          newIndex = prev - 1;
        } else if (indexToDelete === prev && prev > 0) {
          newIndex = prev - 1;
        } else if (indexToDelete === prev && prev === 0) {
          newIndex = 0;
        }
        return newIndex;
      });
  
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'delete-page',
          pageIndex: indexToDelete,
        }));
      }
    } catch (err) {
      console.error('❌ Error deleting page:', err);
      alert(`Error deleting page: ${err.message}`);
    }
  };

  const insertImage = (imageUrl, altText = 'Image') => {
    if (!editorRef.current) return;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = altText;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '8px 0';
    img.style.cursor = 'pointer';
    img.className = 'resizable-image';

    let dragStartTime = 0;
    
    img.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      dragStartTime = Date.now();
      img.dataset.hasDragged = 'false';
      
      if (!e.target.classList.contains('resize-handle')) {
        startDrag(img, e);
      }
    });

    img.addEventListener('click', (e) => {
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
      
      range.deleteContents();
      range.insertNode(img);
      range.collapse(false);
      
      const space = document.createTextNode('\u00A0');
      range.insertNode(space);
      range.collapse(false);
    } else {
      editorRef.current.appendChild(img);
      
      const space = document.createTextNode('\u00A0');
      editorRef.current.appendChild(space);
    }

    saveEditorState();
    editorRef.current.focus();
  };

  const selectImage = (img) => {
    const allImages = editorRef.current.querySelectorAll('.resizable-image');
    allImages.forEach(image => {
      image.classList.remove('selected');
    });

    img.classList.add('selected');
    
    createResizeHandles(img);
    createImageToolbar(img);
  };

  const createImageToolbar = (img) => {
    const existingToolbar = editorRef.current.querySelector('.image-toolbar');
    if (existingToolbar) {
      existingToolbar.remove();
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'image-toolbar';
    
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

    const rect = img.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    toolbar.style.left = `${rect.left - editorRect.left}px`;
    toolbar.style.top = `${rect.top - editorRect.top - 50}px`;

    const buttons = [
      { text: '🗑️', title: 'Delete Image', action: () => deleteImage(img) },
      { text: '↔️', title: 'Reset Size', action: () => resetImageSize(img) },
      { text: '📏', title: 'Set Size', action: () => setImageSize(img) },
      { text: '🖱️', title: 'Drag to Move', action: () => {} }
    ];

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

  const updateImageToolbarPosition = (img) => {
    const toolbar = editorRef.current.querySelector('.image-toolbar');
    if (toolbar) {
      const rect = img.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      
      toolbar.style.left = `${rect.left - editorRect.left}px`;
      toolbar.style.top = `${rect.top - editorRect.top - 50}px`;
    }
  };
  
  const deleteImage = (img) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      img.remove();
      
      const toolbar = editorRef.current.querySelector('.image-toolbar');
      if (toolbar) toolbar.remove();
      
      const handles = editorRef.current.querySelectorAll('.resize-handle');
      handles.forEach(handle => handle.remove());
      
      saveEditorState();
    }
  };

  const resetImageSize = (img) => {
    img.style.width = '';
    img.style.height = '';
    img.style.left = '';
    img.style.top = '';
    
    createResizeHandles(img);
    saveEditorState();
  };

  const setImageSize = (img) => {
    const width = window.prompt('Enter width (px):', img.offsetWidth);
    const height = window.prompt('Enter height (px):', img.offsetHeight);
    
    if (width && height) {
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      createResizeHandles(img);
      saveEditorState();
    }
  };

  const createResizeHandles = (img) => {
    const existingHandles = editorRef.current.querySelectorAll('.resize-handle');
    existingHandles.forEach(handle => handle.remove());

    const handles = ['nw', 'ne', 'sw', 'se'];
    
    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${position}`;
      
      handle.style.position = 'absolute';
      handle.style.width = '8px';
      handle.style.height = '8px';
      handle.style.backgroundColor = '#3b82f6';
      handle.style.border = '1px solid white';
      handle.style.borderRadius = '50%';
      
      handle.style.cursor = `${position === 'nw' || position === 'se' ? 'nw-resize' : 'ne-resize'}`;
      handle.style.zIndex = '1000';
      
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
      
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startResize(img, position, e);
      });
      
      editorRef.current.appendChild(handle);
    });
  };

  const startResize = (img, handle, e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = img.offsetWidth;
    const startHeight = img.offsetHeight;
    const startLeft = img.offsetLeft;
    const startTop = img.offsetTop;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth, newHeight;
      
      switch(handle) {
        case 'se':
          newWidth = Math.max(50, startWidth + deltaX);
          newHeight = Math.max(50, startHeight + deltaY);
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          break;
        case 'sw':
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(50, startHeight + deltaY);
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          img.style.left = `${startLeft + startWidth - newWidth}px`;
          break;
        case 'ne':
          newWidth = Math.max(50, startWidth + deltaX);
          newHeight = Math.max(50, startHeight - deltaY);
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          img.style.top = `${startTop + startHeight - newHeight}px`;
          break;
        case 'nw':
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(50, startHeight - deltaY);
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          img.style.left = `${startLeft + startWidth - newWidth}px`;
          img.style.top = `${startTop + startHeight - newHeight}px`;
          break;
      }
      
      createResizeHandles(img);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      saveEditorState();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startDrag = (img, e) => {
    e.preventDefault();
    e.stopPropagation();

    img.classList.add('dragging');

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = img.offsetLeft;
    const startTop = img.offsetTop;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        img.dataset.hasDragged = 'true';
        
        img.style.position = 'relative';
        img.style.left = `${startLeft + deltaX}px`;
        img.style.top = `${startTop + deltaY}px`;

        createResizeHandles(img);
        updateImageToolbarPosition(img);
      }
    };

    const handleMouseUp = () => {
      img.classList.remove('dragging');
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      saveEditorState();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleEditorClick = (e) => {
    let targetElement = e.target;
    while (targetElement != null && targetElement.tagName !== 'A') {
        targetElement = targetElement.parentElement;
    }

    if (targetElement && targetElement.tagName === 'A' && targetElement.hasAttribute('href')) {
        const href = targetElement.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/'))) {
            e.preventDefault();
            window.open(href, '_blank', 'noopener,noreferrer');
            return;
        }
    }
    
    if (!e.target.closest('.resizable-image') &&
        !e.target.closest('.resize-handle') &&
        !e.target.closest('.image-toolbar')) {

        // Remove selection from all images
        const allImages = editorRef.current?.querySelectorAll('.resizable-image');
        allImages?.forEach(image => {
            image.classList.remove('selected');
        });

        // Remove all resize handles
        const handles = editorRef.current?.querySelectorAll('.resize-handle');
        handles?.forEach(handle => handle.remove());

        // Remove toolbar
        const toolbar = editorRef.current?.querySelector('.image-toolbar');
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
      console.log('📤 Uploading image...');
      
      const imageUrl = await uploadImageToServer(file);
      
      console.log('✅ Image uploaded successfully:', imageUrl);
      insertImage(imageUrl, file.name);
    } catch (err) {
      console.error('❌ Error uploading image:', err);
      alert(`Failed to upload image: ${err.message}`);
    }
  };

  const uploadImageToServer = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('documentId', docId);

    const response = await fetch('http://localhost:3000/api/upload-image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      let errorMessage = 'Failed to upload image';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch (parseError) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.imageUrl;
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
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

  function splitSpansAtRange(range) {
    const { startContainer, startOffset, endContainer, endOffset } = range;
    if (startContainer.nodeType === 3 && startContainer.parentNode.tagName === 'SPAN') {
      splitSpanAtOffset(startContainer, startOffset);
    }
    if (endContainer.nodeType === 3 && endContainer.parentNode.tagName === 'SPAN') {
      splitSpanAtOffset(endContainer, endOffset);
    }
  }


  

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

  function saveEditorState() {
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
  }

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

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      addPage();
    }
  }, [addPage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const isCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }

      if (isCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();

        const url = window.prompt('Enter URL: (include https://)');
        if (url) { 
            const selection = window.getSelection();
            if (selection && editorRef.current?.contains(selection.anchorNode)) {
                
                if (!selection.isCollapsed) {
                    document.execCommand('createLink', false, url);
                }
                else {
                    document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
                }
                
                if (editorRef.current) {
                    handleInput({ target: editorRef.current });
                }
            }
        }
        return;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
}, [undo, redo, handleInput, editorRef]);

  useEffect(() => {
    if (editorRef.current && pages[currentPageIndex]?.content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = pages[currentPageIndex]?.content || '';
      
      setTimeout(() => {
        const codeBlocks = editorRef.current?.querySelectorAll('pre code');
        if (codeBlocks) {
          codeBlocks.forEach(codeBlock => {
            const language = codeBlock.className.replace('language-', '');
            if (language) {
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
    columns,
    setColumns,
  };
}

export { EditorCanvas , switchPage }
export default useEditor;

