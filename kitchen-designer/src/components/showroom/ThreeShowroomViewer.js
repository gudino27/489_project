// ThreeShowroomViewer - Three.js based 360 panorama viewer with material swapping
// Replaces Pannellum viewer for enhanced material swapping capabilities
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useLanguage } from '../../contexts/LanguageContext';
import translations from '../../utils/translations';
import PanoramaSphere from './PanoramaSphere';
import PanoramaControls from './PanoramaControls';
import ShowroomHotspots3D from './ShowroomHotspots3D';
import MaterialSwapPanel from './MaterialSwapPanel';
import ShowroomNavigation from './ShowroomNavigation';

const ThreeShowroomViewer = ({
  showroomData,
  currentRoom,
  onRoomChange,
  onHotspotClick
}) => {
  const { language } = useLanguage();
  const t = translations[language]?.showroom || translations.en.showroom;
  const containerRef = useRef(null);

  // State for material swapping
  const [selectedElement, setSelectedElement] = useState(null);
  const [materialSelections, setMaterialSelections] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMaterialPanel, setShowMaterialPanel] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Initialize material selections with defaults when room changes
  useEffect(() => {
    if (currentRoom?.swappable_elements) {
      const defaults = {};
      currentRoom.swappable_elements.forEach(element => {
        if (element.default_material_id) {
          defaults[element.id] = element.default_material_id;
        } else if (element.available_materials?.length > 0) {
          // Use first available material as default
          const defaultMat = element.available_materials.find(m => m.is_default) || element.available_materials[0];
          if (defaultMat) {
            defaults[element.id] = defaultMat.id;
          }
        }
      });
      setMaterialSelections(defaults);
    }
  }, [currentRoom]);

  // Handle element click - toggle material panel
  const handleElementClick = useCallback((element) => {
    // If clicking the same element, toggle the panel off
    if (selectedElement?.id === element.id && showMaterialPanel) {
      setShowMaterialPanel(false);
      setSelectedElement(null);
    } else {
      // Otherwise, select this element and show panel
      setSelectedElement(element);
      setShowMaterialPanel(true);
    }
  }, [selectedElement, showMaterialPanel]);

  // Handle material selection
  const handleMaterialSelect = useCallback((elementId, materialId) => {
    setMaterialSelections(prev => ({
      ...prev,
      [elementId]: materialId
    }));
  }, []);

  // Close material panel
  const handleCloseMaterialPanel = useCallback(() => {
    setShowMaterialPanel(false);
    setSelectedElement(null);
  }, []);

  // Handle hotspot click - delegate to parent or handle room navigation
  const handleHotspotClick = useCallback((hotspot) => {
    if (hotspot.hotspot_type === 'link_room' && hotspot.link_room_id) {
      const targetRoom = showroomData?.rooms?.find(r => r.id === hotspot.link_room_id);
      if (targetRoom) {
        onRoomChange(targetRoom);
      }
    } else if (onHotspotClick) {
      onHotspotClick(hotspot);
    }
  }, [showroomData, onRoomChange, onHotspotClick]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Build full image URL
  const panoramaUrl = currentRoom?.image_360_url
    ? (currentRoom.image_360_url.startsWith('http')
        ? currentRoom.image_360_url
        : `${API_URL}${currentRoom.image_360_url}`)
    : null;

  // Get current room name
  const roomName = language === 'es' ? currentRoom?.room_name_es : currentRoom?.room_name_en;
  const roomDescription = language === 'es' ? currentRoom?.room_description_es : currentRoom?.room_description_en;

  if (!currentRoom || !panoramaUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <p className="text-white">{t?.loading || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-900"
    >
      {/* Three.js Canvas */}
      <Canvas
        camera={{
          fov: currentRoom.default_hfov || 75,
          position: [0.01, 0, 0],
          near: 0.1,
          far: 1100
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#111' }}
      >
        <Suspense fallback={null}>
          {/* Main panorama sphere */}
          <PanoramaSphere
            imageUrl={panoramaUrl}
            swappableElements={currentRoom.swappable_elements || []}
            materialSelections={materialSelections}
            onElementClick={handleElementClick}
            onBackgroundClick={handleCloseMaterialPanel}
            apiUrl={API_URL}
          />

          {/* 3D Hotspots */}
          <ShowroomHotspots3D
            hotspots={currentRoom.hotspots || []}
            onHotspotClick={handleHotspotClick}
            language={language}
          />
        </Suspense>

        {/* Camera controls for panorama navigation */}
        <PanoramaControls
          initialYaw={currentRoom.default_yaw || 0}
          initialPitch={currentRoom.default_pitch || 0}
          sensitivity={showroomData?.settings?.mouse_sensitivity || 1.0}
          autoRotate={showroomData?.settings?.auto_rotate_enabled}
          autoRotateSpeed={showroomData?.settings?.auto_rotate_speed || 0.5}
        />

        {/* Ambient light for visibility */}
        <ambientLight intensity={1} />
      </Canvas>

      {/* Loading overlay */}
      <div id="loading-overlay" className="absolute inset-0 bg-gray-900 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white">{t?.loading || 'Loading...'}</p>
        </div>
      </div>

      {/* Top Bar - Room Info and Navigation */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-white text-xl font-semibold">{roomName}</h2>
            {roomDescription && (
              <p className="text-gray-300 text-sm">{roomDescription}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Room Navigation */}
            {showroomData?.rooms?.length > 1 && (
              <ShowroomNavigation
                rooms={showroomData.rooms}
                currentRoom={currentRoom}
                onRoomChange={onRoomChange}
                language={language}
                style={showroomData?.settings?.navigation_style || 'dropdown'}
              />
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
              title={isFullscreen ? t?.exitFullscreen : t?.fullscreen}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Material Swap Panel */}
      {showMaterialPanel && selectedElement && (
        <MaterialSwapPanel
          element={selectedElement}
          currentMaterialId={materialSelections[selectedElement.id]}
          onMaterialSelect={(materialId) => handleMaterialSelect(selectedElement.id, materialId)}
          onClose={handleCloseMaterialPanel}
          language={language}
          apiUrl={API_URL}
        />
      )}

      {/* Bottom Controls Hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-lg z-10">
        {t?.controlsHint || 'Drag to look around • Scroll to zoom • Click elements to change materials'}
      </div>

      {/* Swappable Elements Legend - Clickable to open material panel */}
      {currentRoom.swappable_elements?.length > 0 && (
        <div className="absolute bottom-16 left-4 bg-black/70 text-white text-sm px-4 py-3 rounded-xl z-10 shadow-lg">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            {language === 'es' ? 'Personalizar materiales:' : 'Customize materials:'}
          </p>
          <ul className="space-y-1">
            {currentRoom.swappable_elements.map(el => {
              const isSelected = selectedElement?.id === el.id && showMaterialPanel;
              return (
                <li key={el.id}>
                  <button
                    onClick={() => handleElementClick(el)}
                    className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded transition-colors ${
                      isSelected ? 'bg-amber-500/30 ring-1 ring-amber-400' : 'hover:bg-white/10'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${isSelected ? 'ring-2 ring-white' : 'border border-white/50'}`}
                      style={{ backgroundColor: el.highlight_color || '#f59e0b' }}
                    />
                    <span className="flex-1">{language === 'es' ? el.element_name_es : el.element_name_en}</span>
                    {isSelected ? (
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-gray-400 mt-2">{language === 'es' ? 'Click para cerrar' : 'Click again to close'}</p>
        </div>
      )}
    </div>
  );
};

export default ThreeShowroomViewer;
