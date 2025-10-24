import { useState, useCallback, useRef, useEffect } from 'react';

export const usePagination = (totalPages, initialPage = 0) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageHistory, setPageHistory] = useState([initialPage]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [pageStats, setPageStats] = useState({});
  const lastPageRef = useRef(initialPage);

  // Track page visits for analytics
  useEffect(() => {
    if (currentPage !== lastPageRef.current) {
      setPageStats(prev => ({
        ...prev,
        [currentPage]: (prev[currentPage] || 0) + 1
      }));
      lastPageRef.current = currentPage;
    }
  }, [currentPage]);

  // Navigate to page with history tracking
  const goToPage = useCallback((pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalPages && pageIndex !== currentPage) {
      setPageHistory(prev => [...prev, pageIndex]);
      setCurrentPage(pageIndex);
    }
  }, [currentPage, totalPages]);

  // Navigate to previous page in history
  const goBack = useCallback(() => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];
      setPageHistory(newHistory);
      setCurrentPage(previousPage);
    }
  }, [pageHistory]);

  // Navigate to next page in history
  const goForward = useCallback(() => {
    // This would require tracking forward history
    // For now, just go to next page
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  // Toggle bookmark for current page
  const toggleBookmark = useCallback(() => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(currentPage)) {
        newBookmarks.delete(currentPage);
      } else {
        newBookmarks.add(currentPage);
      }
      return newBookmarks;
    });
  }, [currentPage]);

  // Jump to next/previous bookmarked page
  const goToNextBookmark = useCallback(() => {
    const bookmarkedPages = Array.from(bookmarks).sort((a, b) => a - b);
    const nextBookmark = bookmarkedPages.find(page => page > currentPage);
    if (nextBookmark !== undefined) {
      goToPage(nextBookmark);
    }
  }, [bookmarks, currentPage, goToPage]);

  const goToPreviousBookmark = useCallback(() => {
    const bookmarkedPages = Array.from(bookmarks).sort((a, b) => a - b);
    const prevBookmark = bookmarkedPages.reverse().find(page => page < currentPage);
    if (prevBookmark !== undefined) {
      goToPage(prevBookmark);
    }
  }, [bookmarks, currentPage, goToPage]);

  // Get page statistics
  const getPageStats = useCallback(() => {
    const mostVisited = Object.entries(pageStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([page]) => parseInt(page));

    return {
      totalVisits: Object.values(pageStats).reduce((sum, visits) => sum + visits, 0),
      mostVisited,
      bookmarkedPages: Array.from(bookmarks).sort((a, b) => a - b),
      canGoBack: pageHistory.length > 1,
      canGoForward: false, // Would need forward history tracking
    };
  }, [pageStats, bookmarks, pageHistory]);

  // Smart pagination - show relevant pages based on usage
  const getSmartPageNumbers = useCallback(() => {
    const stats = getPageStats();
    const smartPages = new Set();

    // Always include current page and adjacent pages
    smartPages.add(currentPage);
    if (currentPage > 0) smartPages.add(currentPage - 1);
    if (currentPage < totalPages - 1) smartPages.add(currentPage + 1);

    // Include most visited pages
    stats.mostVisited.forEach(page => smartPages.add(page));

    // Include bookmarked pages
    stats.bookmarkedPages.forEach(page => smartPages.add(page));

    // Include first and last page
    smartPages.add(0);
    smartPages.add(totalPages - 1);

    return Array.from(smartPages).sort((a, b) => a - b);
  }, [currentPage, totalPages, getPageStats]);

  return {
    currentPage,
    goToPage,
    goBack,
    goForward,
    toggleBookmark,
    goToNextBookmark,
    goToPreviousBookmark,
    getPageStats,
    getSmartPageNumbers,
    isBookmarked: bookmarks.has(currentPage),
    canGoBack: pageHistory.length > 1,
    hasBookmarks: bookmarks.size > 0,
  };
}; 