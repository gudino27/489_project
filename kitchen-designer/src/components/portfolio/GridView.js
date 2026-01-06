import React from 'react';

const API_BASE = process.env.REACT_APP_API_URL || "https://api.gudinocustom.com";

// GridView Component
// Grid layout for displaying portfolio photos
const GridView = ({ photos, openModal }) => {
  return (
    <div className="portfolio-grid" style={{
      maxWidth: '1200px',
      margin: '3rem auto',
      padding: '0 1rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {photos.map((photo, index) => {
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
                loading="lazy"
              />
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
    </div>
  );
};

export default GridView;
