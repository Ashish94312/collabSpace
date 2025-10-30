import { useState, useEffect, useMemo } from 'react';

/**
 * A React hook for paginating content based on its measured height.
 * It uses a ResizeObserver to detect changes in the content element's size
 * and calculates the number of pages and scroll offsets needed to display it
 * across fixed-height pages.
 *
 * @param {React.RefObject<HTMLElement>} contentRef A ref to the content element whose height needs to be observed.
 * @param {number} pageHeight The fixed height of a single page in pixels.
 * @returns {{numPages: number, pageScrollOffsets: number[]}} Pagination state including total pages and offsets.
 */
export const usePagination = (contentRef, pageHeight) => {
  const [numPages, setNumPages] = useState(1);

  useEffect(() => {
    const contentElement = contentRef.current;

    // Ensure we have a valid element and page height to proceed
    if (!contentElement || pageHeight <= 0) {
      setNumPages(1);
      return;
    }

    const updatePagination = () => {
      // scrollHeight accurately reflects the total height of the content,
      // including content that is not visible due to overflow.
      const totalContentHeight = contentElement.scrollHeight;
      // Calculate the number of pages, ensuring a minimum of 1 page.
      const newNumPages = Math.max(1, Math.ceil(totalContentHeight / pageHeight));

      // Update state. React will bail out of rendering if the new value is the same,
      // so an explicit check isn't necessary.
      setNumPages(newNumPages);
    };

    // Initial calculation when the component mounts or dependencies change
    updatePagination();

    // Set up a ResizeObserver to listen for changes in the content element's dimensions.
    // This is crucial for dynamically updating pagination as content is added/removed.
    const observer = new ResizeObserver(updatePagination);

    observer.observe(contentElement);

    // Cleanup function: disconnect the observer when the component unmounts or
    // dependencies change, preventing memory leaks.
    return () => {
      observer.disconnect();
    };
  }, [contentRef, pageHeight]); // Re-run effect if contentRef or pageHeight changes

  // Calculate the scroll offsets for each page.
  // This is memoized to avoid recalculating the array unless numPages or pageHeight changes.
  const pageScrollOffsets = useMemo(() => {
    return Array.from({ length: numPages }, (_, i) => i * pageHeight);
  }, [numPages, pageHeight]);

  return {
    numPages,
    pageScrollOffsets,
  };
};