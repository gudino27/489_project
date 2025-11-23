import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Trash2, X, Move } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const panelRef = useRef(null);
  
  // Use persisted position from module-level variable
  const [position, setPosition] = useState(persistedPosition);
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCacheRef = useRef({
    lastPosition: null,
    rafId: null,
    initialOffset: { x: 0, y: 0 }
  });

  // Hybrid drag handler - direct DOM manipulation for zero-lag, state update on mouse up
  const handleMouseDown = (e) => {
    e.preventDefault();
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    dragCacheRef.current.initialOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Disable transitions during drag for smooth movement
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
    
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !panelRef.current) return;

    // Calculate new position directly - no RAF needed for simple position updates
    const newX = e.clientX - dragCacheRef.current.initialOffset.x;
    const newY = e.clientY - dragCacheRef.current.initialOffset.y;
    
    // Store position in cache
    dragCacheRef.current.lastPosition = { x: newX, y: newY };
    
    // Direct DOM manipulation for instant visual feedback
    panelRef.current.style.left = `${newX}px`;
    panelRef.current.style.top = `${newY}px`;
  };

  const handleMouseUp = () => {
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

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Find the actual element object
  const element = currentRoomData.elements.find(el => el.id === selectedElement);
  
  if (!element) return null;
  
  const elementSpec = elementTypes[element.type];
  if (!elementSpec) return null;



  return (
    <div 
      ref={panelRef}
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-72 overflow-hidden flex flex-col"
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxHeight: 'calc(100vh - 140px)'
      }}
    >
      {/* Header */}
      <div 
        className="bg-gray-50 p-3 border-b flex justify-between items-center cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <h3 className="font-semibold text-gray-700 truncate pr-2">{elementSpec.name}</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          
          {/* Material selection for cabinets */}
          {element.category === 'cabinet' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Material</label>
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
                className="w-full p-2 text-sm border rounded bg-gray-50 focus:bg-white transition-colors"
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
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Width (in)</label>
                <input
                  type="number"
                  step="0.5"
                  value={element.width}
                  onChange={(e) => updateElement(element.id, { width: parseFloat(e.target.value) })}
                  className="w-full p-2 text-sm border rounded"
                  min="12"
                  max="60"
                />
              </div>
            )}

            {/* Depth */}
            {elementSpec.category === 'cabinet' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Depth (in)</label>
                <input
                  type="number"
                  step="0.5"
                  value={element.depth}
                  onChange={(e) => updateElement(element.id, { depth: parseFloat(e.target.value) })}
                  className="w-full p-2 text-sm border rounded"
                  min="12"
                  max="36"
                />
              </div>
            )}
          </div>

          {/* Height - for variable height elements */}
          {elementSpec.category === 'cabinet' && !elementSpec.fixedHeight && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Height (in)</label>
              <input
                type="number"
                step="0.5"
                value={element.actualHeight || elementSpec.defaultHeight}
                onChange={(e) => updateElement(element.id, { actualHeight: parseFloat(e.target.value) })}
                className="w-full p-2 text-sm border rounded"
                min={elementSpec.minHeight || (elementSpec.mountType === 'wall' ? 12 : 40)}
                max={elementSpec.mountType === 'wall' ? currentRoomData.dimensions.wallHeight - element.mountHeight : currentRoomData.dimensions.wallHeight}
              />
            </div>
          )}

          {/* Mount height for wall-mounted elements */}
          {elementSpec.mountHeight !== undefined && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mount Height (in)</label>
              <input
                type="number"
                step="0.5"
                value={element.mountHeight}
                onChange={(e) => updateElement(element.id, { mountHeight: parseFloat(e.target.value) })}
                className="w-full p-2 text-sm border rounded"
                min="0"
                max={parseFloat(currentRoomData.dimensions.wallHeight) - (element.actualHeight || elementSpec.fixedHeight || elementSpec.defaultHeight)}
              />
            </div>
          )}

          {/* Rotation Controls */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Rotation ({element.rotation}°)</label>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => rotateElement(element.id, -90)}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
                title="Rotate -90°"
              >
                <RotateCw size={14} className="transform scale-x-[-1]" />
              </button>
              <button
                onClick={() => rotateElement(element.id, -15)}
                className="p-2 bg-blue-50 rounded hover:bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600"
                title="Rotate -15°"
              >
                -15°
              </button>
              <button
                onClick={() => rotateElement(element.id, 15)}
                className="p-2 bg-blue-50 rounded hover:bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600"
                title="Rotate +15°"
              >
                +15°
              </button>
              <button
                onClick={() => rotateElement(element.id, 90)}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
                title="Rotate +90°"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>

          {/* Corner cabinet hinge direction */}
          {element.type && element.type.includes('corner') && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Hinge Direction</label>
              <div className="flex gap-1">
                <button
                  onClick={() => rotateCornerCabinet(element.id, 'left')}
                  className={`flex-1 px-2 py-1 text-xs rounded ${element.hingeDirection === 'left' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}
                >
                  Left
                </button>
                <button
                  onClick={() => rotateCornerCabinet(element.id, 'right')}
                  className={`flex-1 px-2 py-1 text-xs rounded ${element.hingeDirection === 'right' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}
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
              className="w-full p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Trash2 size={16} />
              Remove Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingPropertiesPanel;
