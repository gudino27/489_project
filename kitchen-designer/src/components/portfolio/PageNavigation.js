import React from 'react';

// PageNavigation Component
// Pagination controls for the 3D carousel view
const PageNavigation = ({
  totalPages,
  currentPage,
  changePage,
  resetToBeginning,
  savedPositions,
  currentCategory,
  allCategoryPhotos,
  isTransitioning,
  PHOTOS_PER_PAGE
}) => {
  if (totalPages <= 1 || !currentCategory) return null;

  return (
    <div className="page-navigation enhanced">
      <div className="page-header">
        <div className="page-info">
          <span className="current-range">
            Photos {currentPage * PHOTOS_PER_PAGE + 1}-
            {Math.min((currentPage + 1) * PHOTOS_PER_PAGE, allCategoryPhotos.length)}{" "}
            of {allCategoryPhotos.length}
          </span>
          {savedPositions[currentCategory] > 0 && (
            <span className="saved-indicator" title="Position saved">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </span>
          )}
        </div>
        {currentPage > 0 && (
          <button
            onClick={resetToBeginning}
            className="reset-button"
            title="Start from beginning (Ctrl+Home)"
            disabled={isTransitioning}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Start Over
          </button>
        )}
      </div>
      <div className="page-controls">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 0 || isTransitioning}
          className="page-nav-button"
          title="Previous set (arrow up)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="page-dots">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => changePage(index)}
              className={`page-dot ${index === currentPage ? "active" : ""}`}
              title={`Page ${index + 1}${savedPositions[currentCategory] === index ? " (saved position)" : ""}`}
              disabled={isTransitioning}
            >
              <span className="page-number">{index + 1}</span>
              {savedPositions[currentCategory] === index && index !== currentPage && (
                <span className="saved-dot"></span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages - 1 || isTransitioning}
          className="page-nav-button"
          title="Next set (PageDown)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="keyboard-hint">
        arrow up / arrow down to switch pages,
        <span className="keyboard-shortcut">Ctrl + Home</span> to reset to beginning
      </div>
    </div>
  );
};

export default PageNavigation;
