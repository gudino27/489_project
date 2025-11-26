import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { getMaterialById, MATERIAL_TYPES, FINISHES } from '../../constants/materials';

/**
 * ARSceneExporter - Renders a clean 3D scene for GLTF export
 * This component renders the scene without grids, gizmos, or selection highlights
 * specifically for AR viewing purposes.
 */

// Element3D component for AR export (simplified, no interaction)
// Professional cabinet colors matching main 3D view
const CABINET_COLORS = {
  white: '#f5f5f5',
};

const Element3DForExport = ({ element, scale, elementTypes }) => {
  const spec = elementTypes[element.type] || { color: '#999' };
  
  // Material Resolution - Default to white shaker style
  const materialData = element.materialId ? getMaterialById(element.materialId) : null;
  const baseColor = materialData ? materialData.hex : CABINET_COLORS.white;
  
  // Determine material properties based on type
  const materialProps = useMemo(() => {
    if (!materialData) return { roughness: 0.5, metalness: 0.1 };
    
    if (materialData.type === MATERIAL_TYPES.PAINT) {
      const finish = element.finish && FINISHES[element.finish] ? FINISHES[element.finish] : FINISHES.satin;
      return { roughness: finish.roughness, metalness: finish.metalness };
    } else if (materialData.type === MATERIAL_TYPES.APPLIANCE) {
      return { roughness: materialData.roughness, metalness: materialData.metalness };
    } else {
      return { roughness: 0.6, metalness: 0 };
    }
  }, [materialData, element.finish]);

  // Dimensions in inches
  const width = element.width;
  const depth = element.depth;
  const height = element.actualHeight || spec.defaultHeight || 30;
  const elevation = element.mountHeight || spec.mountHeight || 0;
  
  // Convert position from pixels to inches
  const xInches = element.x / scale;
  const yInches = element.y / scale;
  
  const rotationRad = -(element.rotation || 0) * (Math.PI / 180);

  // Determine element types
  const isBaseCabinet = element.category === 'cabinet' && height < 40 && !element.type.includes('wall') && !element.type.includes('tall') && !element.type.includes('linen');
  const isAppliance = element.category === 'appliance';
  const isCorner = (element.type.toLowerCase().includes('corner') || (width === depth && width > 30)) && !isAppliance;

  return (
    <group 
      position={[xInches + width / 2, elevation, yInches + depth / 2]} 
      rotation={[0, rotationRad, 0]}
    >
      {/* Main Body */}
      {isCorner ? (
        <group>
          {/* Back Rect */}
          <mesh position={[0, height / 2, 12 - depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width, height, 24]} />
            <meshStandardMaterial color={baseColor} metalness={materialProps.metalness} roughness={materialProps.roughness} />
          </mesh>
          {/* Side Extension */}
          <mesh position={[12 - width / 2, height / 2, 24 + (depth - 24) / 2 - depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[24, height, depth - 24]} />
            <meshStandardMaterial color={baseColor} metalness={materialProps.metalness} roughness={materialProps.roughness} />
          </mesh>
          {/* Countertop for corner - marble style */}
          {isBaseCabinet && (
            <group position={[0, height + 0.75, 0]}>
              <mesh position={[0, 0, 12 - depth / 2]} castShadow receiveShadow>
                <boxGeometry args={[width + 1, 1.5, 25]} />
                <meshStandardMaterial color="#e8e4df" roughness={0.15} metalness={0.05} />
              </mesh>
              <mesh position={[12 - width / 2, 0, 24 + (depth - 24) / 2 - depth / 2]} castShadow receiveShadow>
                <boxGeometry args={[25, 1.5, depth - 24 + 1]} />
                <meshStandardMaterial color="#e8e4df" roughness={0.15} metalness={0.05} />
              </mesh>
            </group>
          )}
        </group>
      ) : (
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial 
            color={baseColor} 
            metalness={isAppliance ? 0.6 : materialProps.metalness}
            roughness={isAppliance ? 0.2 : materialProps.roughness}
          />
        </mesh>
      )}

      {/* Countertop for standard base cabinets - marble style */}
      {isBaseCabinet && !isCorner && (
        <mesh position={[0, height + 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + 1, 1.5, depth + 1]} />
          <meshStandardMaterial color="#e8e4df" roughness={0.15} metalness={0.05} />
        </mesh>
      )}

      {/* Door/Drawer Detail for cabinets */}
      {!isAppliance && !isCorner && (
        <group position={[0, height / 2, depth / 2 + 0.1]}>
          <mesh>
            <planeGeometry args={[width - 2, height - 2]} />
            <meshStandardMaterial color={baseColor} metalness={materialProps.metalness} roughness={materialProps.roughness} />
          </mesh>
          {/* Handle */}
          <mesh position={[width > 24 ? width * 0.25 : width * 0.35, height * 0.3, 0.5]}>
            <cylinderGeometry args={[0.5, 0.5, 3, 8]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
          </mesh>
          {width > 24 && (
            <mesh position={[-width * 0.25, height * 0.3, 0.5]}>
              <cylinderGeometry args={[0.5, 0.5, 3, 8]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
};

// Room Floor for export - wood tone to match main view
const RoomFloorForExport = ({ width, depth }) => {
  const woodFloorColor = '#c8a27a'; // Light oak wood floor
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={woodFloorColor} roughness={0.6} />
    </mesh>
  );
};

// Room Walls for export (simplified) - sage green to match main view
const RoomWallsForExport = ({ width, depth, height, roomData, scale = 1 }) => {
  const wallThickness = 4;
  const wallColor = "#b8c4b8"; // Soft sage/green-gray to match main view
  const wallHeight = height || 96;
  const activeWalls = roomData?.walls || [1, 2, 3, 4];

  return (
    <group>
      {/* Wall 1 (Top/Back) */}
      {activeWalls.includes(1) && (
        <mesh position={[width / 2, wallHeight / 2, -wallThickness / 2]} receiveShadow castShadow>
          <boxGeometry args={[width + wallThickness * 2, wallHeight, wallThickness]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}

      {/* Wall 2 (Right) */}
      {activeWalls.includes(2) && (
        <mesh position={[width + wallThickness / 2, wallHeight / 2, depth / 2]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, depth]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}

      {/* Wall 3 (Bottom/Front) */}
      {activeWalls.includes(3) && (
        <mesh position={[width / 2, wallHeight / 2, depth + wallThickness / 2]} receiveShadow castShadow>
          <boxGeometry args={[width + wallThickness * 2, wallHeight, wallThickness]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}

      {/* Wall 4 (Left) */}
      {activeWalls.includes(4) && (
        <mesh position={[-wallThickness / 2, wallHeight / 2, depth / 2]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, depth]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}
    </group>
  );
};

// Scene Exporter component that captures and exports the scene
const SceneExporter = ({ onExport }) => {
  const { scene } = useThree();
  
  useEffect(() => {
    // Wait for scene to be fully rendered
    const timer = setTimeout(() => {
      const exporter = new GLTFExporter();
      
      exporter.parse(
        scene,
        (gltf) => {
          // Create blob from the exported data
          const blob = new Blob([gltf], { type: 'model/gltf-binary' });
          onExport(blob);
        },
        (error) => {
          console.error('GLTF Export Error:', error);
          onExport(null, error);
        },
        { binary: true } // Export as GLB (binary GLTF)
      );
    }, 500); // Give time for scene to render
    
    return () => clearTimeout(timer);
  }, [scene, onExport]);
  
  return null;
};

// Main ARSceneExporter component
const ARSceneExporter = ({ roomData, elementTypes, scale = 1, onExport }) => {
  if (!roomData) return null;

  const widthInches = parseFloat(roomData.dimensions.width) * 12;
  const depthInches = parseFloat(roomData.dimensions.height) * 12;
  const wallHeight = parseFloat(roomData.dimensions.wallHeight || 96);

  return (
    <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ position: [widthInches * 1.5, widthInches, depthInches * 1.5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[widthInches / 2, 100, depthInches / 2]} intensity={1} castShadow />
        
        <group>
          {/* Floor */}
          <RoomFloorForExport width={widthInches} depth={depthInches} />
          
          {/* Walls */}
          <RoomWallsForExport 
            width={widthInches} 
            depth={depthInches} 
            height={wallHeight} 
            roomData={roomData} 
            scale={scale} 
          />
          
          {/* Elements */}
          {roomData.elements.map((element) => (
            <Element3DForExport 
              key={element.id} 
              element={element} 
              elementTypes={elementTypes}
              scale={scale}
            />
          ))}
        </group>
        
        {/* Export handler */}
        <SceneExporter onExport={onExport} />
      </Canvas>
    </div>
  );
};

export default ARSceneExporter;
