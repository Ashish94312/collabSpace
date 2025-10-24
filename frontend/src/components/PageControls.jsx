import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PageControls.css';

function PageControls({ pages, currentPageIndex, switchPage , deletePage}) {
  const [showQuickJump, setShowQuickJump] = useState(false);
  const [jumpToPage, setJumpToPage] = useState('');
  const [showPagePreviews, setShowPagePreviews] = useState(false);
  const quickJumpRef = useRef(null);
  const containerRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields
      
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const isCtrl = isMac ? e.metaKey : e.ctrlKey;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentPageIndex > 0) {
            switchPage(currentPageIndex - 1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentPageIndex < pages.length - 1) {
            switchPage(currentPageIndex + 1);
          }
          break;
        case 'PageUp':
          e.preventDefault();
          if (isCtrl) {
            // Jump to first page
            switchPage(0);
          } else if (currentPageIndex > 0) {
            switchPage(currentPageIndex - 1);
          }
          break;
        case 'PageDown':
          e.preventDefault();
          if (isCtrl) {
            // Jump to last page
            switchPage(pages.length - 1);
          } else if (currentPageIndex < pages.length - 1) {
            switchPage(currentPageIndex + 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          switchPage(0);
          break;
        case 'End':
          e.preventDefault();
          switchPage(pages.length - 1);
          break;
        case 'g':
          if (isCtrl) {
            e.preventDefault();
            setShowQuickJump(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, pages.length, switchPage]);

  // Focus quick jump input when shown
  useEffect(() => {
    if (showQuickJump && quickJumpRef.current) {
      quickJumpRef.current.focus();
    }
  }, [showQuickJump]);

  // Handle quick jump
  const handleQuickJump = useCallback((e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage) - 1;
    if (pageNum >= 0 && pageNum < pages.length) {
      switchPage(pageNum);
      setShowQuickJump(false);
      setJumpToPage('');
    }
  }, [jumpToPage, pages.length, switchPage]);

  // Get page content preview (first 50 characters)
  const getPagePreview = (content) => {
    if (!content) return 'Empty page';
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent || 'Empty page';
  };

  // Check if page has content
  const hasContent = (content) => {
    if (!content) return false;
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 0;
  };

  // Smart pagination - show limited page numbers with ellipsis
  const getVisiblePages = () => {
    const totalPages = pages.length;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const visible = [];
    const current = currentPageIndex;
    const total = totalPages;

    // Always show first page
    visible.push(0);

    if (current <= 3) {
      // Show first 5 pages + ellipsis + last page
      for (let i = 1; i <= 4; i++) {
        visible.push(i);
      }
      visible.push('ellipsis');
      visible.push(total - 1);
    } else if (current >= total - 4) {
      // Show first page + ellipsis + last 5 pages
      visible.push('ellipsis');
      for (let i = total - 5; i < total; i++) {
        visible.push(i);
      }
    } else {
      // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
      visible.push('ellipsis');
      visible.push(current - 1);
      visible.push(current);
      visible.push(current + 1);
      visible.push('ellipsis');
      visible.push(total - 1);
    }

    return visible;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="page-controls-container" ref={containerRef}>
      {/* Page Counter and Quick Actions */}
      <div className="page-controls-header">
        <div className="page-counter">
          <span className="page-counter-text">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          {pages.length > 10 && (
            <button
              className="quick-jump-btn"
              onClick={() => setShowQuickJump(true)}
              title="Quick jump to page (Ctrl+G)"
            >
              ⌨️
            </button>
          )}
        </div>
        
        <div className="page-controls-actions">
          <button
            className="page-control-btn"
            onClick={() => setShowPagePreviews(!showPagePreviews)}
            title="Toggle page previews"
          >
            {showPagePreviews ? '📄' : '👁️'}
          </button>
        </div>
      </div>

      {/* Quick Jump Modal */}
      {showQuickJump && (
        <div className="quick-jump-modal">
          <div className="quick-jump-content">
            <h3>Jump to Page</h3>
            <form onSubmit={handleQuickJump}>
              <input
                ref={quickJumpRef}
                type="number"
                min="1"
                max={pages.length}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                placeholder={`1-${pages.length}`}
                className="quick-jump-input"
              />
              <div className="quick-jump-buttons">
                <button type="submit" className="quick-jump-submit">
                  Go
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickJump(false);
                    setJumpToPage('');
                  }}
                  className="quick-jump-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="page-navigation">
        <button
          className="page-control-btn nav-btn"
          onClick={() => switchPage(0)}
          disabled={currentPageIndex === 0}
          title="First page (Home)"
        >
          ⏮️
        </button>
        
        <button
          className="page-control-btn nav-btn"
          onClick={() => switchPage(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          title="Previous page (↑)"
        >
          ⬆️
        </button>

        {/* Page Numbers */}
        <div className="page-numbers">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === 'ellipsis' ? (
                <span className="page-ellipsis">...</span>
              ) : (
                <button
                  onClick={() => switchPage(page)}
                  className={`page-number-btn ${currentPageIndex === page ? 'active' : ''}`}
                  title={`Page ${page + 1}${hasContent(pages[page]?.content) ? ' - Has content' : ' - Empty'}`}
                >
                  {page + 1}
                  {hasContent(pages[page]?.content) && <span className="content-indicator">•</span>}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          className="page-control-btn nav-btn"
          onClick={() => switchPage(currentPageIndex + 1)}
          disabled={currentPageIndex === pages.length - 1}
          title="Next page (↓)"
        >
          ⬇️
        </button>
        
        <button
          className="page-control-btn nav-btn"
          onClick={() => switchPage(pages.length - 1)}
          disabled={currentPageIndex === pages.length - 1}
          title="Last page (End)"
        >
          ⏭️
        </button>
      </div>

      {/* Page Previews */}
      {showPagePreviews && (
        <div className="page-previews">
          <h4>Page Previews</h4>
          <div className="preview-list">
            {pages.map((page, index) => (
              <div
                key={index}
                className={`page-preview ${currentPageIndex === index ? 'active' : ''}`}
                onClick={() => switchPage(index)}
              >
                <div className="preview-header">
                  <span className="preview-number">Page {index + 1}</span>
                  {hasContent(page?.content) && <span className="content-badge">📝</span>}
                </div>
                <div className="preview-content">
                  {getPagePreview(page?.content)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts">
        <details>
          <summary>⌨️ Keyboard Shortcuts</summary>
          <div className="shortcuts-list">
            <div>↑/↓ - Previous/Next page</div>
            <div>Home/End - First/Last page</div>
            <div>Ctrl+G - Quick jump</div>
            <div>Ctrl+Page Up/Down - First/Last page</div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default PageControls;
