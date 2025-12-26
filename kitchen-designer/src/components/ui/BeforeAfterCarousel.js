import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';

/**
 * BeforeAfterCarousel - Auto-rotating carousel for before/after photo pairs
 *
 * Features:
 * - Auto-rotation with pause/play controls
 * - Manual navigation with arrows
 * - Touch/swipe support
 * - Pagination indicators
 * - Keyboard navigation
 */
const BeforeAfterCarousel = ({ photoPairs, autoPlayInterval = 5000, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-rotation
  useEffect(() => {
    if (!isPlaying || photoPairs.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photoPairs.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, photoPairs.length, autoPlayInterval]);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photoPairs.length) % photoPairs.length);
    setIsPlaying(false); // Stop auto-play when manually navigating
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photoPairs.length);
    setIsPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsPlaying(!isPlaying);
    }
  };

  if (!photoPairs || photoPairs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No before/after photos available</p>
      </div>
    );
  }

  const currentPair = photoPairs[currentIndex];

  return (
    <div
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      {/* Main slider */}
      <div className="relative">
        <BeforeAfterSlider
          beforePhoto={currentPair.before}
          afterPhoto={currentPair.after}
        />

        {/* Navigation arrows */}
        {photoPairs.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="text-gray-800" size={24} />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="text-gray-800" size={24} />
            </button>
          </>
        )}
      </div>

      {/* Controls and pagination */}
      {photoPairs.length > 1 && (
        <div className="mt-6 flex items-center justify-between">
          {/* Pagination dots */}
          <div className="flex gap-2 flex-1 justify-center">
            {photoPairs.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>

          {/* Play/Pause button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="ml-4 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? (
              <>
                <Pause size={16} />
                <span className="text-sm font-medium">Pause</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span className="text-sm font-medium">Play</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Counter */}
      <div className="mt-4 text-center text-sm text-gray-600">
        {currentIndex + 1} of {photoPairs.length} transformations
      </div>
    </div>
  );
};

export default BeforeAfterCarousel;
