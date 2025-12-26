import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

/**
 * BeforeAfterSlider - Interactive comparison slider for before/after photos
 *
 * Features:
 * - Draggable slider to reveal before/after
 * - Touch/swipe support for mobile
 * - Keyboard navigation
 * - Responsive design
 */
const BeforeAfterSlider = ({ beforePhoto, afterPhoto, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Handle mouse/touch move
  const handleMove = (clientX) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Clamp between 0 and 100
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
    setSliderPosition(clampedPercentage);
  };

  // Mouse event handlers
  const handleMouseDown = () => setIsDragging(true);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch event handlers
  const handleTouchStart = () => setIsDragging(true);

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition(Math.max(sliderPosition - 5, 0));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition(Math.min(sliderPosition + 5, 100));
    }
  };

  // Global mouse/touch listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, sliderPosition]);

  // Prevent text selection while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-96 overflow-hidden rounded-lg cursor-ew-resize select-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(sliderPosition)}
    >
      {/* After image (full) */}
      <div className="absolute inset-0">
        <img
          src={`${API_BASE}${afterPhoto.url}`}
          alt={afterPhoto.title || 'After'}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute bottom-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          After
        </div>
      </div>

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={`${API_BASE}${beforePhoto.url}`}
          alt={beforePhoto.title || 'Before'}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute bottom-4 left-4 bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Before
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-12 h-12 shadow-xl flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform">
          <ChevronLeft className="absolute left-1 text-gray-700" size={16} />
          <ChevronRight className="absolute right-1 text-gray-700" size={16} />
        </div>
      </div>

      {/* Keyboard hint (appears on focus) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none">
        Use arrow keys or drag to compare
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
