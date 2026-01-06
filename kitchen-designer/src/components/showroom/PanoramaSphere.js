// PanoramaSphere - Renders an inverted sphere with equirectangular panorama texture
// Includes swappable element overlays for material swapping
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import SwappableOverlay from './SwappableOverlay';

const PanoramaSphere = ({
  imageUrl,
  swappableElements = [],
  materialSelections = {},
  onElementClick,
  onBackgroundClick,
  apiUrl
}) => {
  const sphereRef = useRef();
  const [textureLoaded, setTextureLoaded] = useState(false);

  // Load panorama texture
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl, () => {
      setTextureLoaded(true);
      // Hide loading overlay
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.style.opacity = '0';
    });
    // Configure texture for equirectangular mapping
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [imageUrl]);

  // Setup texture wrapping - flip horizontally to correct for inside-sphere viewing
  useEffect(() => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      // Flip texture to match 2D preview (BackSide viewing inverts the image)
      texture.repeat.x = -1;
    }
  }, [texture]);

  // Get materials for swappable elements
  const getElementMaterial = (element) => {
    const materialId = materialSelections[element.id];
    if (!materialId || !element.available_materials) return null;
    return element.available_materials.find(m => m.id === materialId);
  };

  return (
    <group>
      {/* Main panorama sphere - viewed from inside */}
      <mesh
        ref={sphereRef}
        scale={[1, 1, 1]}
        renderOrder={0}
        onClick={(e) => {
          // Only trigger if clicking directly on the panorama, not on an overlay
          if (onBackgroundClick) {
            onBackgroundClick();
          }
        }}
      >
        <sphereGeometry args={[500, 64, 32]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.BackSide}
          transparent={false}
        />
      </mesh>

      {/* Swappable element overlays */}
      {swappableElements.map((element) => {
        const material = getElementMaterial(element);
        return (
          <SwappableOverlay
            key={element.id}
            element={element}
            material={material}
            onClick={() => onElementClick(element)}
            apiUrl={apiUrl}
          />
        );
      })}
    </group>
  );
};

export default PanoramaSphere;
