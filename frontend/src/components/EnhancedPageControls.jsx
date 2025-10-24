import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePagination } from '../hooks/usePagination';
import './PageControls.css';

function EnhancedPageControls({ pages, currentPageIndex, switchPage, deletePage }) {
  const {
    currentPage,
    goToPage,
    goBack,
    goForward,
    toggleBookmark,
    goToNextBookmark,
    goToPreviousBookmark,
    getPageStats,
    getSmartPageNumbers,
    isBookmarked,
    canGoBack,
    hasBookmarks,
  } = usePagination(pages.length, currentPageIndex);

  const [showQuickJump, setShowQuickJump] = useState(false);
  const [jumpToPage, setJumpToPage] = useState('');
  const [showPagePreviews, setShowPagePreviews] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSmartMode, setShowSmartMode] = useState(false);
  const quickJumpRef = useRef(null);
  const containerRef = useRef(null);

  // Sync with parent component
  useEffect(() => {
    if (currentPage !== currentPageIndex) {
      switchPage(currentPage);
    }
  }, [currentPage, currentPageIndex, switchPage]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const isCtrl = isMac ? e.metaKey : e.ctrlKey;
      const isShift = e.shiftKey;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          goToPage(currentPage - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToPage(currentPage + 1);
          break;
        case 'PageUp':
          e.preventDefault();
          if (isCtrl) {
            goToPage(0);
          } else {
            goToPage(currentPage - 1);
          }
          break;
        case 'PageDown':
          e.preventDefault();
          if (isCtrl) {
            goToPage(pages.length - 1);
          } else {
            goToPage(currentPage + 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          goToPage(0);
          break;
        case 'End':
          e.preventDefault();
          goToPage(pages.length - 1);
          break;
        case 'g':
          if (isCtrl) {
            e.preventDefault();
            setShowQuickJump(true);
          }
          break;
        case 'b':
          if (isCtrl) {
            e.preventDefault();
            toggleBookmark();
          }
          break;
        case '[':
          if (isCtrl) {
            e.preventDefault();
            goBack();
          }
          break;
        case ']':
          if (isCtrl) {
            e.preventDefault();
            goForward();
          }
          break;
        case 'n':
          if (isCtrl && isShift) {
            e.preventDefault();
            goToNextBookmark();
          }
          break;
        case 'p':
          if (isCtrl && isShift) {
            e.preventDefault();
            goToPreviousBookmark();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, goToPage, toggleBookmark, goBack, goForward, goToNextBookmark, goToPreviousBookmark]);

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
      goToPage(pageNum);
      setShowQuickJump(false);
      setJumpToPage('');
    }
  }, [jumpToPage, pages.length, goToPage]);

  // Get page content preview
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

  // Get visible pages based on mode
  const getVisiblePages = () => {
    if (showSmartMode) {
      return getSmartPageNumbers();
    }

    const totalPages = pages.length;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const visible = [];
    const current = currentPage;
    const total = totalPages;

    visible.push(0);

    if (current <= 3) {
      for (let i = 1; i <= 4; i++) {
        visible.push(i);
      }
      visible.push('ellipsis');
      visible.push(total - 1);
    } else if (current >= total - 4) {
      visible.push('ellipsis');
      for (let i = total - 5; i < total; i++) {
        visible.push(i);
      }
    } else {
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
  const stats = getPageStats();

  return (
    <div className="page-controls-container" ref={containerRef}>
      {/* Enhanced Header */}
      <div className="page-controls-header">
        <div className="page-counter">
          <span className="page-counter-text">
            Page {currentPage + 1} of {pages.length}
          </span>
          {isBookmarked && <span className="bookmark-indicator">🔖</span>}
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
            onClick={toggleBookmark}
            title={`${isBookmarked ? 'Remove' : 'Add'} bookmark (Ctrl+B)`}
          >
            {isBookmarked ? '🔖' : '📌'}
          </button>
          <button
            className="page-control-btn"
            onClick={() => setShowSmartMode(!showSmartMode)}
            title={`${showSmartMode ? 'Disable' : 'Enable'} smart mode`}
          >
            {showSmartMode ? '🧠' : '💡'}
          </button>
          <button
            className="page-control-btn"
            onClick={() => setShowPagePreviews(!showPagePreviews)}
            title="Toggle page previews"
          >
            {showPagePreviews ? '📄' : '👁️'}
          </button>
          <button
            className="page-control-btn"
            onClick={() => setShowAnalytics(!showAnalytics)}
            title="Show analytics"
          >
            📊
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

      {/* Enhanced Navigation Controls */}
      <div className="page-navigation">
        <button
          className="page-control-btn nav-btn"
          onClick={() => goToPage(0)}
          disabled={currentPage === 0}
          title="First page (Home)"
        >
          ⏮️
        </button>
        
        <button
          className="page-control-btn nav-btn"
          onClick={goBack}
          disabled={!canGoBack}
          title="Go back ([)"
        >
          ↩️
        </button>
        
        <button
          className="page-control-btn nav-btn"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
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
                  onClick={() => goToPage(page)}
                  className={`page-number-btn ${currentPage === page ? 'active' : ''}`}
                  title={`Page ${page + 1}${hasContent(pages[page]?.content) ? ' - Has content' : ' - Empty'}`}
                >
                  {page + 1}
                  {hasContent(pages[page]?.content) && <span className="content-indicator">•</span>}
                  {stats.mostVisited.includes(page) && <span className="popular-indicator">🔥</span>}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          className="page-control-btn nav-btn"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === pages.length - 1}
          title="Next page (↓)"
        >
          ⬇️
        </button>
        
        <button
          className="page-control-btn nav-btn"
          onClick={goForward}
          title="Go forward (])"
        >
          ↪️
        </button>
        
        <button
          className="page-control-btn nav-btn"
          onClick={() => goToPage(pages.length - 1)}
          disabled={currentPage === pages.length - 1}
          title="Last page (End)"
        >
          ⏭️
        </button>
      </div>


      <div className="page-controls-actions">
        <button 
          className="page-control-btn delete-btn"
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete page ${currentPageIndex + 1}? This action cannot be undone.`)) {
              deletePage(currentPageIndex);
            }
          }}
          disabled={pages.length <= 1}
          title="Delete current page"
        >
          🗑️ Delete Page
        </button>
      </div>

      {/* Bookmark Navigation */}
      {hasBookmarks && (
        <div className="bookmark-navigation">
          <button
            className="page-control-btn"
            onClick={goToPreviousBookmark}
            title="Previous bookmark (Ctrl+Shift+P)"
          >
            🔖⬅️
          </button>
          <span className="bookmark-label">Bookmarks</span>
          <button
            className="page-control-btn"
            onClick={goToNextBookmark}
            title="Next bookmark (Ctrl+Shift+N)"
          >
            🔖➡️
          </button>
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="analytics-panel">
          <h4>📊 Page Analytics</h4>
          <div className="analytics-content">
            <div>Total visits: {stats.totalVisits}</div>
            <div>Most visited: {stats.mostVisited.map(p => p + 1).join(', ')}</div>
            <div>Bookmarks: {stats.bookmarkedPages.length}</div>
            <div>Current page visits: {stats[currentPage] || 0}</div>
          </div>
        </div>
      )}

      {/* Page Previews */}
      {showPagePreviews && (
        <div className="page-previews">
          <h4>Page Previews</h4>
          <div className="preview-list">
            {pages.map((page, index) => (
              <div
                key={index}
                className={`page-preview ${currentPage === index ? 'active' : ''}`}
                onClick={() => goToPage(index)}
              >
                <div className="preview-header">
                  <span className="preview-number">Page {index + 1}</span>
                  <div className="preview-indicators">
                    {hasContent(page?.content) && <span className="content-badge">📝</span>}
                    {stats.mostVisited.includes(index) && <span className="popular-badge">🔥</span>}
                    {stats.bookmarkedPages.includes(index) && <span className="bookmark-badge">🔖</span>}
                  </div>
                </div>
                <div className="preview-content">
                  {getPagePreview(page?.content)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts">
        <details>
          <summary>⌨️ Enhanced Shortcuts</summary>
          <div className="shortcuts-list">
            <div>↑/↓ - Previous/Next page</div>
            <div>Home/End - First/Last page</div>
            <div>Ctrl+G - Quick jump</div>
            <div>Ctrl+B - Toggle bookmark</div>
            <div>Ctrl+[ - Go back</div>
            <div>Ctrl+] - Go forward</div>
            <div>Ctrl+Shift+N/P - Next/Previous bookmark</div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default EnhancedPageControls; 