import React from 'react';

function EditorPageContent({ editorRef, handleInput, handleFocus, handleBlur, handleMouseUp, handleKeyUp }) {
  return (
    <div
      ref={editorRef}
      className="editor-page"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseUp={handleMouseUp}
      onKeyUp={handleKeyUp}
    />
  );
}

export default EditorPageContent;
