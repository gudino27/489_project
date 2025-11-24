import { useRef } from 'react';
export const useDesignerRefs = () => {
  // Drag operation cache for touch/mouse handling
  // Stores drag state to prevent re-renders during drag operations
  const dragCacheRef = useRef({
    lastPosition: null,
    rafId: null,
    startPosition: null,
    hasMoved: false,
    pendingDrag: false,
    potentialSelection: null,
  });

  // Canvas DOM references for different views
  const canvasRef = useRef(null); // Main floor plan canvas (SVG element)
  const floorPlanRef = useRef(null); // Floor plan container for PDF export
  const wallViewRef = useRef(null); // Wall elevation view canvas

  return {
    dragCacheRef,
    canvasRef,
    floorPlanRef,
    wallViewRef,
  };
};