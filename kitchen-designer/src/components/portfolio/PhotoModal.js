import React, { useState } from 'react';

// PhotoModal Component
// Full-screen modal for viewing photos and videos
const PhotoModal = ({
  isOpen,
  onClose,
  src,
  isVideo,
  videoQualities
}) => {
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [currentSrc, setCurrentSrc] = useState(src);

  // Update current src when src prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  if (!isOpen) return null;

  const handleQualityChange = (e) => {
    const quality = e.target.value;
    setSelectedQuality(quality);
    if (videoQualities && videoQualities[quality]) {
      setCurrentSrc(videoQualities[quality]);
    }
  };

  return (
    <div
      className="modal active"
      onClick={onClose}
      style={{ display: "block" }}
    >
      <span className="modal-close" onClick={onClose}>
        &times;
      </span>
      {isVideo ? (
        <div onClick={(e) => e.stopPropagation()}>
          {/* Quality selector */}
          {videoQualities && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '20px',
              zIndex: 10
            }}>
              <select
                value={selectedQuality}
                onChange={handleQualityChange}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="720p">720p (HD)</option>
                <option value="480p">480p (SD)</option>
                <option value="360p">360p (Low)</option>
              </select>
            </div>
          )}
          <video
            className="modal-content"
            controls
            autoPlay
            loop
            preload="metadata"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            key={currentSrc}
          >
            <source src={currentSrc} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <img className="modal-content" src={currentSrc} alt="Preview" />
      )}
    </div>
  );
};

export default PhotoModal;
