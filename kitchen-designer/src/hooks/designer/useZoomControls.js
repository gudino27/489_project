export const useZoomControls = ({
  scale,
  setScale,
  isDragging,
  setIsDragging,
  dragCacheRef,
  isMobile,
  pinchState,
  setPinchState,
  lastTap,
  setLastTap,
}) => {
  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Two fingers - start pinch gesture
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setPinchState({ initialDistance: distance, initialScale: scale });
    } else if (e.touches.length === 1 && isMobile) {
      // Single finger - check for double-tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTap;
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double-tap detected
        handleDoubleTap(e);
      }
      setLastTap(now);
    }
  };
  const handleTouchMoveZoom = (e) => {
    if (e.touches.length === 2 && pinchState.initialDistance) {
      e.preventDefault();

      // Cancel any ongoing drag when pinch-zooming
      if (isDragging) {
        setIsDragging(false);
        dragCacheRef.current.pendingDrag = false;
      }

      const currentDistance = getTouchDistance(e.touches);
      const scaleFactor = currentDistance / pinchState.initialDistance;
      const newScale = Math.max(
        0.5,
        Math.min(3, pinchState.initialScale * scaleFactor)
      );
      setScale(newScale);
    }
  };
  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      // Reset pinch state when fingers are lifted
      setPinchState({ initialDistance: null, initialScale: scale });
    }
  };
  const handleDoubleTap = (e) => {
    e.preventDefault();
    // Cancel any ongoing drag when zooming via double-tap
    if (isDragging) {
      setIsDragging(false);
      dragCacheRef.current.pendingDrag = false;
    }
    // Toggle between 1x and 2x zoom
    const newScale = scale === 1 ? 2 : 1;
    setScale(newScale);
  };

  const handleZoomIn = () => {
    // Cancel any ongoing drag when zooming via buttons
    if (isDragging) {
      setIsDragging(false);
      dragCacheRef.current.pendingDrag = false;
    }
    setScale((prev) => Math.min(3, prev + 0.2));
  };

  const handleZoomOut = () => {
    // Cancel any ongoing drag when zooming via buttons
    if (isDragging) {
      setIsDragging(false);
      dragCacheRef.current.pendingDrag = false;
    }
    setScale((prev) => Math.max(0.5, prev - 0.2));
  };

  return {
    getTouchDistance,
    handleTouchStart,
    handleTouchMoveZoom,
    handleTouchEnd,
    handleDoubleTap,
    handleZoomIn,
    handleZoomOut,
  };
};