import React from 'react';

const API_BASE = process.env.REACT_APP_API_URL || "https://api.gudinocustom.com";

// Carousel3D Component
// 3D rotating carousel for displaying portfolio photos
const Carousel3D = ({
  photos,
  currentIndex,
  rotationAngle,
  isTransitioning,
  goToSlide,
  openModal,
  handleImageLoad,
  radius = 350
}) => {
  const angleStep = photos.length > 0 ? 360 / photos.length : 0;

  return (
    <div
      className={`carousel-3d-container ${photos.length > 0 ? "active" : ""} ${isTransitioning ? "loading" : ""}`}
      id="carousel3dContainer"
    >
      <div
        className="carousel-3d"
        id="carousel3d"
        style={{
          transform: `rotateY(${-rotationAngle}deg)`,
          transformStyle: "preserve-3d",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {photos.map((photo, i) => {
          const itemAngle = angleStep * i;
          const zIndex = i === currentIndex ? 999 : 100 - Math.abs(i - currentIndex) * 10;
          const isVideo = photo.mime_type && photo.mime_type.startsWith('video/');
          const imgSrc = `${API_BASE}${photo.thumbnail || photo.url}`;
          const fullSrc = `${API_BASE}${photo.url}`;
          const caption = "";

          return (
            <div
              key={`${photo.id || i}`}
              className={`carousel-item-3d ${i === currentIndex ? "active" : ""} ${isVideo ? "video-item" : ""}`}
              style={{
                transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                zIndex,
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "400px",
                height: "200px",
                marginLeft: "-200px",
                marginTop: "-100px",
                backgroundColor: "transparent",
              }}
              data-orientation="landscape"
              onClick={() => openModal(fullSrc, caption, isVideo)}
            >
              {isVideo ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={imgSrc}
                    alt={caption}
                    loading="lazy"
                    width="400"
                    height="300"
                    onLoad={(e) => handleImageLoad(e, i)}
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "transparent",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                  {/* Video play icon overlay */}
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
                </div>
              ) : (
                <img
                  src={imgSrc}
                  alt={caption}
                  loading={i === 0 ? "eager" : "lazy"}
                  width="400"
                  height="300"
                  onLoad={(e) => handleImageLoad(e, i)}
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "transparent",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              )}
              <div className="caption">{caption}</div>
            </div>
          );
        })}
      </div>

      <div className="dots-3d-container" id="dots3dContainer">
        {photos.map((_, i) => (
          <span
            key={i}
            className={`dot-3d ${i === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(i)}
          ></span>
        ))}
      </div>

      {photos.length > 0 && (
        <div className="carousel-hint">
          <span className="desktop-hint">← → arrow keys or swipe to navigate photos</span>
          <span className="mobile-hint">← Swipe to browse →</span>
        </div>
      )}
    </div>
  );
};

export default Carousel3D;
