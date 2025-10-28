// This is the MAIN component that connects your useEditor hook to your EditorToolbar
// Copy this file into your project and use it as your main editor component

import React, { useState } from 'react';
import useEditor from './Editor';  // Your useEditor hook
import EditorToolbar from './EditorToolbar';  // Your toolbar component
import { EditorCanvas } from './Editor';  // Your editor canvas
import './Editor.css';

function DocumentEditor({ docId }) {
  const [activeFormats, setActiveFormats] = useState([]);
  const [pageSize, setPageSize] = useState('a4');

  // THIS IS THE KEY PART - Destructure ALL values from useEditor, INCLUDING insertTable
  const {
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
    insertTable,  // <-- THIS IS THE MISSING PIECE!
  } = useEditor(docId);

  // Update active formats on selection change
  const updateActiveFormats = () => {
    const formats = [];
    if (document.queryCommandState('bold')) formats.push('bold');
    if (document.queryCommandState('italic')) formats.push('italic');
    if (document.queryCommandState('underline')) formats.push('underline');
    if (document.queryCommandState('strikeThrough')) formats.push('strikethrough');
    setActiveFormats(formats);
  };

  // Clear formatting
  const clearFormatting = () => {
    format('removeFormat');
    format('unlink');
  };

  // Insert code block (you'll need to add this to useEditor if you don't have it)
  const insertCodeBlock = (language) => {
    const codeHTML = `
      <div class="code-block" style="position: relative; margin: 16px 0; border-radius: 6px; background-color: #2d2d2d; padding: 16px; font-family: monospace; font-size: 14px; color: #f8f8f2;">
        <div style="position: absolute; top: 8px; right: 8px; font-size: 12px; color: #888;">${language}</div>
        <pre contenteditable="true" style="margin: 0; outline: none;"><code>// Your ${language} code here</code></pre>
      </div>
      <p><br></p>`;
    
    format('insertHTML', codeHTML);
  };

  // Convert selected text to inline code
  const convertToInlineCode = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const selectedText = selection.toString();
      const codeHTML = `<code style="background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">${selectedText}</code>`;
      format('insertHTML', codeHTML);
    }
  };

  return (
    <div className="document-editor">
      {/* TOOLBAR - Now with insertTable prop! */}
      <EditorToolbar
        format={format}
        undo={undo}
        redo={redo}
        addPage={addPage}
        insertCodeBlock={insertCodeBlock}
        activeFormats={activeFormats}
        clearFormatting={clearFormatting}
        pages={pages}
        currentPageIndex={currentPageIndex}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        updateActiveFormats={updateActiveFormats}
        handleImageUpload={handleImageUpload}
        insertImage={insertImage}
        convertToInlineCode={convertToInlineCode}
        insertTable={insertTable}  // <-- PASS IT HERE!
      />

      {/* EDITOR CANVAS */}
      <EditorCanvas
        pages={pages}
        currentPageIndex={currentPageIndex}
        switchPage={switchPage}
        editorRef={editorRef}
        handleInput={handleInput}
        handleFocus={() => {}}
        handleBlur={() => {}}
        handleMouseUp={updateActiveFormats}
        handleKeyUp={updateActiveFormats}
        pageSize={pageSize}
        deletePage={deletePage}
        handlePaste={handlePaste}
        handleDrop={handleDrop}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleEditorClick={handleEditorClick}
      />
    </div>
  );
}

export default DocumentEditor;
