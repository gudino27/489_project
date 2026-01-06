import React from 'react';

const API_BASE = process.env.REACT_APP_API_URL || "https://api.gudinocustom.com";

// VideoHeroSection Component
// Full-screen video player with thumbnail navigation
const VideoHeroSection = ({
  categoryVideos,
  currentVideoIndex,
  setCurrentVideoIndex,
  openModal
}) => {
  if (categoryVideos.length === 0) return null;

  const video = categoryVideos[currentVideoIndex];
  if (!video) return null;

  // Parse video qualities from label field
  let qualities = null;
  try {
    if (video.label) {
      const parsed = JSON.parse(video.label);
      qualities = {};
      Object.keys(parsed).forEach(q => {
        qualities[q] = `${API_BASE}/photos/${video.category}/${parsed[q]}`;
      });
    }
  } catch (e) {
    // No qualities found, using original
  }

  // Determine video source with proper fallback chain
  let videoSrc = `${API_BASE}${video.url}`;
  let fallbackSrc = null;

  if (qualities) {
    if (qualities['720p']) {
      videoSrc = qualities['720p'];
      fallbackSrc = qualities['480p'] || qualities['360p'];
    } else if (qualities['480p']) {
      videoSrc = qualities['480p'];
      fallbackSrc = qualities['360p'];
    } else if (qualities['360p']) {
      videoSrc = qualities['360p'];
    }
  }

  const thumbnail = `${API_BASE}${video.thumbnail || video.url}`;

  return (
    <div className="video-hero-fullscreen">
      <div className="video-hero-container">
        {/* Main Video Player */}
        <div className="video-player-wrapper">
          <video
            key={videoSrc}
            className="hero-video-player"
            autoPlay
            loop
            muted
            playsInline
            poster={thumbnail}
            onClick={() => openModal(videoSrc, video.title || `Video ${currentVideoIndex + 1}`, true, qualities)}
            onError={(e) => {
              if (fallbackSrc && e.target.src !== fallbackSrc) {
                e.target.src = fallbackSrc;
              }
            }}
          >
            <source src={videoSrc} type="video/webm" />
            {fallbackSrc && <source src={fallbackSrc} type="video/webm" />}
            Your browser does not support the video tag.
          </video>

          {/* Click to expand hint */}
          <div className="video-expand-hint">
            Click to view fullscreen
          </div>

          {/* Navigation Buttons */}
          {categoryVideos.length > 1 && (
            <>
              <button
                className="video-nav-btn video-nav-prev"
                onClick={() => setCurrentVideoIndex((prev) =>
                  prev === 0 ? categoryVideos.length - 1 : prev - 1
                )}
                disabled={categoryVideos.length <= 1}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                className="video-nav-btn video-nav-next"
                onClick={() => setCurrentVideoIndex((prev) =>
                  prev === categoryVideos.length - 1 ? 0 : prev + 1
                )}
                disabled={categoryVideos.length <= 1}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {categoryVideos.length > 1 && (
          <div className="video-thumbnails-nav">
            {categoryVideos.map((vid, idx) => {
              const thumbSrc = `${API_BASE}${vid.thumbnail || vid.url}`;
              return (
                <div
                  key={vid.id || idx}
                  className={`video-thumb ${idx === currentVideoIndex ? 'active' : ''}`}
                  onClick={() => setCurrentVideoIndex(idx)}
                >
                  <img src={thumbSrc} alt={vid.title || `Video ${idx + 1}`} loading="lazy" width="120" height="90" />
                  {idx === currentVideoIndex && (
                    <div className="video-thumb-active-indicator" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoHeroSection;
