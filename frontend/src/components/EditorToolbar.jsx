import React from 'react';
import { getPageSizeOptions } from '../utils/pageSizes';
// import './LatexRenderer';

function EditorToolbar({ format, undo, redo, addPage, insertCodeBlock, activeFormats = [], clearFormatting, pages = [], currentPageIndex = 0, pageSize = 'a4', onPageSizeChange, updateActiveFormats, handleImageUpload, insertImage, convertToInlineCode }) {
  // NOTE: document.execCommand is deprecated and may not work in all browsers. Consider migrating to a modern rich text editor library.
  const isActive = (cmd) => {
    const normalized = cmd.toLowerCase();
    return activeFormats.includes(normalized) || activeFormats.includes(`<${normalized}>`);
  };

  const buttonClass = (cmd) => isActive(cmd) ? 'editor-button active' : 'editor-button';

  const pageSizeOptions = getPageSizeOptions();

  // Helper to call format and then update active formats if provided
  const handleFormat = (command, value = null) => {
    format(command, value);
    if (typeof updateActiveFormats === 'function') {
      setTimeout(updateActiveFormats, 0);
    }
  };

  return (
    <div className="floating-toolbar-container">
      <div className="editor-toolbar">
        {/* Text Formatting Group */}
        <div className="toolbar-group">
          <select
            className="toolbar-select font-family-select"
            defaultValue=""
            onChange={e => {
              if (e.target.value) {
                handleFormat('fontName', e.target.value);
                e.target.value = '';
              }
            }}
            title="Font Family"
          >
            <option value="" disabled>Font</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Impact">Impact</option>
          </select>
          <select
            className="toolbar-select font-size-select"
            defaultValue=""
            onChange={e => {
              if (e.target.value) {
                handleFormat('fontSize', e.target.value);
                e.target.value = '';
              }
            }}
            title="Font Size"
          >
            <option value="" disabled>Size</option>
            <option value="1">8pt</option>
            <option value="2">10pt</option>
            <option value="3">12pt</option>
            <option value="4">14pt</option>
            <option value="5">18pt</option>
            <option value="6">24pt</option>
            <option value="7">36pt</option>
          </select>
        </div>

        <div className="toolbar-divider"></div>

        {/* Basic Formatting Group */}
        <div className="toolbar-group">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }}
            className={buttonClass('bold')}
            title="Bold (Ctrl+B)"
          ><strong>B</strong></button>

          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }}
            className={buttonClass('italic')}
            title="Italic (Ctrl+I)"
          ><em>I</em></button>

          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }}
            className={buttonClass('underline')}
            title="Underline (Ctrl+U)"
          ><u>U</u></button>

          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('strikeThrough'); }}
            className={buttonClass('strikeThrough')}
            title="Strikethrough"
          ><span style={{ textDecoration: 'line-through' }}>S</span></button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Advanced Text Formatting Group */}
        {/* <div className="toolbar-group">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('subscript'); }}
            className={buttonClass('subscript')}
            title="Subscript"
          ><sub>A₂</sub></button>

          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('superscript'); }}
            className={buttonClass('superscript')}
            title="Superscript"
          ><sup>A²</sup></button>
        </div> */}

        <div className="toolbar-divider"></div>

        {/* Headings Group */}
        <div className="toolbar-group">
          {['h1', 'h2', 'h3'].map(h => (
            <button
              key={h}
              onMouseDown={(e) => { e.preventDefault(); handleFormat('formatBlock', `<${h}>`); }}
              className={buttonClass(h)}
              title={`Heading ${h[1]}`}
            >{h.toUpperCase()}</button>
          ))}
        </div>

        <div className="toolbar-divider"></div>

        {/* Lists Group */}
        <div className="toolbar-group">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('insertUnorderedList'); }}
            className={buttonClass('insertUnorderedList')}
            title="Bullet List"
          >• • •</button>

          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('insertOrderedList'); }}
            className={buttonClass('insertOrderedList')}
            title="Numbered List"
          >1. 2. 3.</button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Image Upload Group */}
        <div className="toolbar-group">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && handleImageUpload) {
                handleImageUpload(file);
              }
              e.target.value = ''; // Reset input
            }}
          />
          <button
            type="button"
            className="editor-button"
            title="Insert Image"
            onClick={() => document.getElementById('image-upload').click()}
          >
            🖼️
          </button>
          
          <button
            type="button"
            className="editor-button"
            title="Insert Image from URL"
            onClick={() => {
              const url = prompt('Enter image URL:');
              if (url && insertImage) {
                insertImage(url);
              }
            }}
          >
            🔗
          </button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Alignment Group */}
        <div className="toolbar-group">
          {['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'].map(cmd => (
            <button
              key={cmd}
              onMouseDown={(e) => { e.preventDefault(); handleFormat(cmd); }}
              className={buttonClass(cmd)}
              title={`Align ${cmd.replace('justify', '')}`}
            >{cmd === 'justifyLeft' ? '⬅️' : cmd === 'justifyCenter' ? '↔️' : cmd === 'justifyRight' ? '➡️' : '🔳'}</button>
          ))}
        </div>

        <div className="toolbar-divider"></div>

        {/* Color Group */}
        <div className="toolbar-group">
          <div className="color-picker-group">
            <label title="Text Color" className="color-label">
              <span style={{ color: '#374151' }}>A</span>
              <input
                type="color"
                className="color-input"
                onChange={(e) => handleFormat('foreColor', e.target.value)}
                title="Text Color"
              />
            </label>
            <button
              type="button"
              className="editor-button"
              title="Remove Text Color"
              onMouseDown={e => { e.preventDefault(); handleFormat('removeColor'); }}
              style={{ marginLeft: 4 }}
            >
              <span style={{ color: '#374151', textDecoration: 'line-through' }}>A</span>
            </button>
            <label title="Highlight Color" className="color-label">
              <span style={{ backgroundColor: '#fbbf24', padding: '2px 4px', borderRadius: '2px' }}>A</span>
              <input
                type="color"
                className="color-input"
                onChange={(e) => handleFormat('hiliteColor', e.target.value)}
                title="Highlight Color"
              />
            </label>
            <button
              type="button"
              className="editor-button"
              title="Remove Highlight"
              onMouseDown={e => { e.preventDefault(); handleFormat('removeHighlight'); }}
              style={{ marginLeft: 4 }}
            >
              <span style={{ backgroundColor: '#fbbf24', padding: '2px 4px', borderRadius: '2px', textDecoration: 'line-through' }}>A</span>
            </button>
          </div>
        </div>

        <div className="toolbar-divider"></div>

        {/* Insert Group */}
        <div className="toolbar-group">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('insertHorizontalRule'); }}
            title="Insert Line"
            className="editor-button"
          >─</button>

          <select
            className="toolbar-select code-type-select"
            defaultValue=""
            onChange={e => {
              if (e.target.value) {
                insertCodeBlock(e.target.value);
                if (typeof updateActiveFormats === 'function') setTimeout(updateActiveFormats, 0);
                e.target.value = '';
              }
            }}
            title="Insert Code Block"
          >
            <option value="" disabled>Code Block</option>
            <option value="javascript">🖥️ JavaScript</option>
            <option value="python">🐍 Python</option>
            <option value="html">🌐 HTML</option>
            <option value="css">🎨 CSS</option>
            <option value="sql">🗄️ SQL</option>
            <option value="bash">💻 Bash</option>
          </select>

         <button
  onMouseDown={(e) => {
    e.preventDefault();
    const formula = prompt("Enter LaTeX formula (e.g., E = mc^2):");
    if (formula) {
      const editorDiv = document.querySelector('.editor-page'); // find editable div
      if (editorDiv) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const node = document.createTextNode(`\\(${formula}\\)`);
        range.insertNode(node);

        // move cursor to the end of inserted node
        range.setStartAfter(node);
        range.setEndAfter(node);
        selection.removeAllRanges();
        selection.addRange(range);

        // ✅ re-rendering and refocus fix
        editorDiv.focus();

        // ✅ trigger input event manually to update React state
        const event = new Event("input", { bubbles: true });
        editorDiv.dispatchEvent(event);
      }
    } else {
      // if cancelled, make sure editor stays focused
      const editorDiv = document.querySelector('.editor-page');
      if (editorDiv) editorDiv.focus();
    }
  }}
  title="Insert LaTeX Code"
  className="editor-button"
>
  ∑ƒ(x)
</button>





          <button
            onMouseDown={(e) => { 
              e.preventDefault(); 
              if (convertToInlineCode) {
                convertToInlineCode();
              }
            }}
            title="Convert Selected Text to Inline Code"
            className="editor-button"
          >📝</button>

        </div>

        <div className="toolbar-divider"></div>

        {/* Actions Group */}
        <div className="toolbar-group">
          <button
            onMouseDown={(e) => { e.preventDefault(); clearFormatting(); if (typeof updateActiveFormats === 'function') setTimeout(updateActiveFormats, 0); }}
            title="Clear Formatting"
            className="editor-button"
          >❌</button>

          <button
            onMouseDown={(e) => { e.preventDefault(); undo(); if (typeof updateActiveFormats === 'function') setTimeout(updateActiveFormats, 0); }}
            title="Undo (Ctrl+Z)"
          >↺</button>

          <button
            onMouseDown={(e) => { e.preventDefault(); redo(); if (typeof updateActiveFormats === 'function') setTimeout(updateActiveFormats, 0); }}
            title="Redo (Ctrl+Shift+Z)"
          >↻</button>

          <button
            onMouseDown={(e) => { e.preventDefault(); addPage(); }}
            title="Add New Page"
          >➕</button>
        </div>

        {/* Page Counter */}
        <div className="page-counter" title="Page information">
          <span className="page-counter-text">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
        </div>

        {/* Page Size Selector */}
        <div className="toolbar-group">
          <select
            className="toolbar-select page-size-select"
            value={pageSize}
            onChange={e => {
              if (e.target.value && onPageSizeChange) {
                onPageSizeChange(e.target.value);
              }
            }}
            title="Page Size"
          >
            {pageSizeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
      </div>
    </div>
  );
}

export default EditorToolbar;
