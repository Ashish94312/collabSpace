import React, { useState } from 'react';
import PageControls from './PageControls';
import EnhancedPageControls from './EnhancedPageControls';
import './PaginationDemo.css';

function PaginationDemo() {
  const [currentPage, setCurrentPage] = useState(0);
  const [useEnhanced, setUseEnhanced] = useState(true);
  
  // Create sample pages with different content
  const samplePages = [
    { content: '<h1>Welcome to Page 1</h1><p>This is the first page of our document. It contains some introductory content.</p>' },
    { content: '<h2>Page 2 Content</h2><p>This page has some more detailed information about our topic.</p><ul><li>Point 1</li><li>Point 2</li></ul>' },
    { content: '<h3>Page 3</h3><p>Another page with different content structure.</p>' },
    { content: '' }, // Empty page
    { content: '<h2>Page 5</h2><p>This page has quite a bit of content to demonstrate how the pagination handles longer text and different content types.</p><p>It includes multiple paragraphs and various formatting options.</p>' },
    { content: '<h1>Page 6</h1><p>Final page with summary content.</p>' },
    { content: '<h2>Page 7</h2><p>Additional content for demonstration.</p>' },
    { content: '<h3>Page 8</h3><p>More sample content.</p>' },
    { content: '<h2>Page 9</h2><p>Almost there!</p>' },
    { content: '<h1>Page 10</h1><p>Final page with concluding thoughts.</p>' },
  ];

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="pagination-demo">
      <div className="demo-header">
        <h1>📄 Pagination System Demo</h1>
        <div className="demo-controls">
          <label>
            <input
              type="checkbox"
              checked={useEnhanced}
              onChange={(e) => setUseEnhanced(e.target.checked)}
            />
            Use Enhanced Pagination
          </label>
        </div>
      </div>

      <div className="demo-content">
        <div className="demo-sidebar">
          {useEnhanced ? (
            <EnhancedPageControls
              pages={samplePages}
              currentPageIndex={currentPage}
              switchPage={handlePageChange}
            />
          ) : (
            <PageControls
              pages={samplePages}
              currentPageIndex={currentPage}
              switchPage={handlePageChange}
            />
          )}
        </div>

        <div className="demo-main">
          <div className="page-display">
            <div className="page-header">
              <h2>Page {currentPage + 1} of {samplePages.length}</h2>
              <div className="page-info">
                <span>Content length: {samplePages[currentPage]?.content?.length || 0} characters</span>
                <span>Has content: {samplePages[currentPage]?.content ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <div 
              className="page-content"
              dangerouslySetInnerHTML={{ __html: samplePages[currentPage]?.content || '<p>Empty page</p>' }}
            />
          </div>

          <div className="demo-features">
            <h3>Features Available:</h3>
            <ul>
              {useEnhanced ? (
                <>
                  <li>✅ Smart pagination with ellipsis</li>
                  <li>✅ Keyboard navigation (↑/↓, Home/End, Ctrl+G)</li>
                  <li>✅ Page bookmarks (Ctrl+B)</li>
                  <li>✅ Page history (Ctrl+[/])</li>
                  <li>✅ Page previews with content indicators</li>
                  <li>✅ Analytics tracking</li>
                  <li>✅ Smart mode for intelligent page display</li>
                  <li>✅ Quick jump modal</li>
                  <li>✅ Bookmark navigation</li>
                  <li>✅ Content indicators (• for content, 🔥 for popular)</li>
                </>
              ) : (
                <>
                  <li>✅ Basic pagination with ellipsis</li>
                  <li>✅ Keyboard navigation (↑/↓, Home/End, Ctrl+G)</li>
                  <li>✅ Page previews</li>
                  <li>✅ Quick jump modal</li>
                  <li>✅ Content indicators</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="demo-footer">
        <h3>How to Use:</h3>
        <div className="usage-instructions">
          <div className="instruction-group">
            <h4>Navigation:</h4>
            <ul>
              <li>Click page numbers to jump directly</li>
              <li>Use arrow keys (↑/↓) for previous/next</li>
              <li>Press Home/End for first/last page</li>
              <li>Use Ctrl+G for quick jump</li>
            </ul>
          </div>
          
          {useEnhanced && (
            <div className="instruction-group">
              <h4>Enhanced Features:</h4>
              <ul>
                <li>Ctrl+B to bookmark current page</li>
                <li>Ctrl+[ to go back in history</li>
                <li>Ctrl+] to go forward</li>
                <li>Ctrl+Shift+N/P for bookmark navigation</li>
                <li>Click 🧠 to enable smart mode</li>
                <li>Click 📊 to view analytics</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaginationDemo; 