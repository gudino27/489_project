import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Trash2, X, Move } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useIsMobile } from '../../hooks/useResponsive';

// Module-level variable to persist panel position across component mounts
let persistedPosition = { x: 20, y: 120 };

const FloatingPropertiesPanel = ({
  selectedElement,
  currentRoomData,
  setCurrentRoomData,
  elementTypes,
  updateElement,
  deleteElement,
  rotateElement,
  rotateCornerCabinet,
  materialMultipliers,
  onClose
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile(); // Detect mobile for modal mode
  const panelRef = useRef(null);

  // Use persisted position from module-level variable
  const [position, setPosition] = useState(persistedPosition);

  const [isDragging, setIsDragging] = useState(false);
  const dragCacheRef = useRef({
    lastPosition: null,
    rafId: null,
    initialOffset: { x: 0, y: 0 }
  });

  // Helper function to get coordinates from mouse or touch event
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Hybrid drag handler - direct DOM manipulation for zero-lag, state update on mouse/touch up
  const handlePointerDown = (e) => {
    // Don't drag on mobile (modal mode)
    if (isMobile) return;

    e.preventDefault();
    if (!panelRef.current) return;

    const { clientX, clientY } = getEventCoordinates(e);
    const rect = panelRef.current.getBoundingClientRect();
    dragCacheRef.current.initialOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };

    // Disable transitions during drag for smooth movement
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }

    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !panelRef.current) return;

    const { clientX, clientY } = getEventCoordinates(e);

    // Calculate new position directly - no RAF needed for simple position updates
    const newX = clientX - dragCacheRef.current.initialOffset.x;
    const newY = clientY - dragCacheRef.current.initialOffset.y;

    // Store position in cache
    dragCacheRef.current.lastPosition = { x: newX, y: newY };

    // Direct DOM manipulation for instant visual feedback
    panelRef.current.style.left = `${newX}px`;
    panelRef.current.style.top = `${newY}px`;
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    // Re-enable transitions
    if (panelRef.current) {
      panelRef.current.style.transition = '';
    }

    // Update React state with final position for persistence
    if (dragCacheRef.current.lastPosition) {
      setPosition(dragCacheRef.current.lastPosition);
    }

    // Clear drag cache
    dragCacheRef.current = {
      lastPosition: null,
      rafId: null,
      initialOffset: { x: 0, y: 0 }
    };

    setIsDragging(false);
  };

  // Sync position changes to module-level variable for persistence
  useEffect(() => {
    persistedPosition = position;
  }, [position]);

  // Add global mouse and touch event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchmove', handlePointerMove);
      document.addEventListener('touchend', handlePointerUp);
      return () => {
        document.removeEventListener('mousemove', handlePointerMove);
        document.removeEventListener('mouseup', handlePointerUp);
        document.removeEventListener('touchmove', handlePointerMove);
        document.removeEventListener('touchend', handlePointerUp);
      };
    }
  }, [isDragging]);

  // Find the actual element object
  const element = currentRoomData.elements.find(el => el.id === selectedElement);

  if (!element) return null;

  const elementSpec = elementTypes[element.type];
  if (!elementSpec) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          aria-label="Close properties panel"
        />
      )}

      {/* Properties Panel */}
      <div
        ref={panelRef}
        className={`
          bg-white shadow-xl border border-gray-200 overflow-hidden flex flex-col
          ${isMobile
            ? 'fixed bottom-4 right-4 z-50 rounded-xl w-80 max-w-[calc(100vw-2rem)]'
            : 'absolute z-50 rounded-lg w-72'
          }
        `}
        style={isMobile ? {
          maxHeight: 'calc(50vh - 2rem)',
          marginBottom: 'env(safe-area-inset-bottom, 0px)'
        } : {
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxHeight: 'calc(100vh - 140px)'
        }}
      >
        {/* Header */}
        <div
          className={`bg-gray-50 p-3 border-b flex justify-between items-center select-none ${!isMobile ? 'cursor-move' : ''}`}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          <h3 className="font-semibold text-gray-700 truncate pr-2 text-sm">{elementSpec.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 active:text-gray-800 p-2 min-h-10 min-w-10 rounded-full hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all flex items-center justify-center"
            aria-label="Close properties"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">

            {/* Material selection for cabinets */}
            {element.category === 'cabinet' && (
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Material</label>
                <select
                  value={currentRoomData.materials?.[element.id] || 'laminate'}
                  onChange={(e) => {
                    setCurrentRoomData({
                      ...currentRoomData,
                      materials: {
                        ...currentRoomData.materials,
                        [element.id]: e.target.value
                      }
                    });
                  }}
                  className="w-full p-3 min-h-12 text-sm border rounded bg-gray-50 focus:bg-white transition-colors"
                >
                  {Object.entries(materialMultipliers).map(([material, multiplier]) => (
                    <option key={material} value={material}>
                      {material.charAt(0).toUpperCase() + material.slice(1)} ({multiplier === 1 ? 'Included' : `+${Math.round((multiplier - 1) * 100)}%`})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dimensions Group */}
            <div className="grid grid-cols-2 gap-3">
              {/* Width */}
              {elementSpec.category === 'cabinet' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Width (in)</label>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={element.width}
                    onChange={(e) => updateElement(element.id, { width: parseFloat(e.target.value) })}
                    className="w-full p-3 min-h-12 text-sm border rounded"
                    min="12"
                    max="60"
                  />
                </div>
              )}

              {/* Depth */}
              {elementSpec.category === 'cabinet' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Depth (in)</label>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={element.depth}
                    onChange={(e) => updateElement(element.id, { depth: parseFloat(e.target.value) })}
                    className="w-full p-3 min-h-12 text-sm border rounded"
                    min="12"
                    max="36"
                  />
                </div>
              )}
            </div>

            {/* Height - for variable height elements */}
            {elementSpec.category === 'cabinet' && !elementSpec.fixedHeight && (
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Height (in)</label>
                <input
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  value={element.actualHeight || elementSpec.defaultHeight}
                  onChange={(e) => updateElement(element.id, { actualHeight: parseFloat(e.target.value) })}
                  className="w-full p-3 min-h-12 text-sm border rounded"
                  min={elementSpec.minHeight || (elementSpec.mountType === 'wall' ? 12 : 40)}
                  max={elementSpec.mountType === 'wall' ? currentRoomData.dimensions.wallHeight - element.mountHeight : currentRoomData.dimensions.wallHeight}
                />
              </div>
            )}

            {/* Mount height for wall-mounted elements */}
            {elementSpec.mountHeight !== undefined && (
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Mount Height (in)</label>
                <input
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  value={element.mountHeight}
                  onChange={(e) => updateElement(element.id, { mountHeight: parseFloat(e.target.value) })}
                  className="w-full p-3 min-h-12 text-sm border rounded"
                  min="0"
                  max={parseFloat(currentRoomData.dimensions.wallHeight) - (element.actualHeight || elementSpec.fixedHeight || elementSpec.defaultHeight)}
                />
              </div>
            )}

            {/* Rotation Controls */}
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-2">Rotation ({element.rotation}°)</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => rotateElement(element.id, -90)}
                  className="p-3 min-h-12 bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all flex items-center justify-center"
                  title="Rotate -90°"
                >
                  <RotateCw size={16} className="transform scale-x-[-1]" />
                </button>
                <button
                  onClick={() => rotateElement(element.id, -15)}
                  className="p-3 min-h-12 bg-blue-50 rounded hover:bg-blue-100 active:bg-blue-200 active:scale-95 transition-all flex items-center justify-center text-sm font-medium text-blue-600"
                  title="Rotate -15°"
                >
                  -15°
                </button>
                <button
                  onClick={() => rotateElement(element.id, 15)}
                  className="p-3 min-h-12 bg-blue-50 rounded hover:bg-blue-100 active:bg-blue-200 active:scale-95 transition-all flex items-center justify-center text-sm font-medium text-blue-600"
                  title="Rotate +15°"
                >
                  +15°
                </button>
                <button
                  onClick={() => rotateElement(element.id, 90)}
                  className="p-3 min-h-12 bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all flex items-center justify-center"
                  title="Rotate +90°"
                >
                  <RotateCw size={16} />
                </button>
              </div>
            </div>

            {/* Corner cabinet hinge direction */}
            {element.type && element.type.includes('corner') && (
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-2">Hinge Direction</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => rotateCornerCabinet(element.id, 'left')}
                    className={`flex-1 p-3 min-h-12 text-sm font-medium rounded active:scale-95 transition-all ${element.hingeDirection === 'left' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 active:bg-blue-200'}`}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => rotateCornerCabinet(element.id, 'right')}
                    className={`flex-1 p-3 min-h-12 text-sm font-medium rounded active:scale-95 transition-all ${element.hingeDirection === 'right' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 active:bg-blue-200'}`}
                  >
                    Right
                  </button>
                </div>
              </div>
            )}

            {/* Delete Action */}
            <div className="pt-2 border-t mt-2">
              <button
                onClick={() => deleteElement(element.id)}
                className="w-full p-3 min-h-12 bg-red-50 text-red-600 rounded hover:bg-red-100 active:bg-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Trash2 size={16} />
                Remove Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingPropertiesPanel;
