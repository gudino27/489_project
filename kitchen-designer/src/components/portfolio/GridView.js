import { useState, useEffect, useMemo } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || "https://api.gudinocustom.com";

// GridView Component
// Grid layout for displaying portfolio photos with pagination
const GridView = ({ photos, openModal, itemsPerPage = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  // Calculate total pages
  const totalPages = useMemo(() => Math.ceil(photos.length / itemsPerPage), [photos.length, itemsPerPage]);
  // Reset to page 1 when photos change (category switch)
  useEffect(() => {
    setCurrentPage(1);
  }, [photos]);
  // Get current page photos
  const currentPhotos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return photos.slice(startIndex, endIndex);
  }, [photos, currentPage, itemsPerPage]);
  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Scroll to the photo count text
    const countElement = document.getElementById('portfolio-photo-count');
    if (countElement) {
      countElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };
  // Pagination button styles
  const buttonStyle = {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    minWidth: '40px'
  };
  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#b08d57',
    color: '#fff'
  };
  const inactiveButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#e5e7eb',
    backdropFilter: 'blur(10px)'
  };
  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#6b7280',
    cursor: 'not-allowed'
  };
  return (
    <div className="portfolio-grid" style={{
      maxWidth: '1200px',
      margin: '3rem auto',
      padding: '0 1rem'
    }}>
      {/* Photo count indicator */}
      <div
        id="portfolio-photo-count"
        style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#9ca3af',
          fontSize: '14px',
          scrollMarginTop: '450px' // Account for fixed navigation
        }}>
        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, photos.length)} of {photos.length} photos
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {currentPhotos.map((photo, index) => {
          const imgSrc = `${API_BASE}${photo.thumbnail || photo.url}`;
          const fullSrc = `${API_BASE}${photo.url}`;
          const isVideo = photo.mime_type && photo.mime_type.startsWith('video/');
          return (
            <div
              key={photo.id || index}
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                position: 'relative'
              }}
              onClick={() => openModal(fullSrc, photo.title || '', isVideo)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img
                src={imgSrc}
                alt={photo.title || ''}
                style={{
                  width: '100%',
                  height: '250px',
                  objectFit: 'cover'
                }}
                loading="lazy"/>
              {isVideo && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '3rem',
          flexWrap: 'wrap'
        }}>
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={currentPage === 1 ? disabledButtonStyle : inactiveButtonStyle}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.backgroundColor = 'rgba(176, 141, 87, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}>
            ← Prev
          </button>
          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={page === currentPage ? activeButtonStyle : inactiveButtonStyle}
                onMouseEnter={(e) => {
                  if (page !== currentPage) {
                    e.currentTarget.style.backgroundColor = 'rgba(176, 141, 87, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== currentPage) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}>
                {page}
              </button>
            )
          ))}
          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={currentPage === totalPages ? disabledButtonStyle : inactiveButtonStyle}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.backgroundColor = 'rgba(176, 141, 87, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
export default GridView;