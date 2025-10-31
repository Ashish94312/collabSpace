import React from 'react';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../utils/pageSizes';

const pageContainerStyle = {
  width: PAGE_WIDTH,
  height: PAGE_HEIGHT,
  minWidth: PAGE_WIDTH,
  maxWidth: PAGE_WIDTH,
  minHeight: PAGE_HEIGHT,
  maxHeight: PAGE_HEIGHT,
  overflow: 'hidden', // Crucial for cropping content that extends beyond page boundaries
  backgroundColor: 'white', // Visual distinction for the page
  boxShadow: '0 0 8px rgba(0,0,0,0.1)', // Subtle shadow for page separation
  margin: '20px auto', // Center the page and provide vertical spacing
  position: 'relative', // Allows absolute positioning of children if needed, though transform is used
};

function EditorPageContent({ children }) {
  return (
    <div
      className="editor-page" // Retain existing class name
      style={pageContainerStyle}
    >
      {children}
    </div>
  );
}

export default EditorPageContent;