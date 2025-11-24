import React, { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { getMaterialById, MATERIAL_TYPES, FINISHES } from '../../constants/materials';

const Element3D = ({ element, scale, elementTypes, isSelected, onSelect, interactive }) => {
  const spec = elementTypes[element.type] || { color: '#999' };
  
  // Material Resolution
  const materialData = element.materialId ? getMaterialById(element.materialId) : null;
  const baseColor = materialData ? materialData.hex : (spec.color || '#ccc');
  
  // Determine material properties based on type
  const materialProps = useMemo(() => {
    if (!materialData) return { roughness: 0.5, metalness: 0.1 };
    
    if (materialData.type === MATERIAL_TYPES.PAINT) {
        // Use the finish from the element if specified, otherwise default to Satin
        const finish = element.finish && FINISHES[element.finish] ? FINISHES[element.finish] : FINISHES.satin;
        return { roughness: finish.roughness, metalness: finish.metalness };
    } else {
        // Stain properties
        return { roughness: 0.6, metalness: 0 };
    }
  }, [materialData, element.finish]);

  // Dimensions are in inches
  const width = element.width;
  const depth = element.depth;
  const height = element.actualHeight || spec.defaultHeight || 30;
  const elevation = element.mountHeight || spec.mountHeight || 0;
  
  // Position needs to be converted from pixels (scaled) to inches
  // element.x is in pixels, scale is pixels/inch
  const xInches = element.x / scale;
  const yInches = element.y / scale;
  
  const rotationRad = -(element.rotation || 0) * (Math.PI / 180);

  // Determine if it's a base cabinet (needs countertop)
  const isBaseCabinet = element.category === 'cabinet' && height < 40 && !element.type.includes('wall') && !element.type.includes('tall') && !element.type.includes('linen');
  const isAppliance = element.category === 'appliance';
  
  return (
    <group 
      position={[xInches + width / 2, elevation, yInches + depth / 2]} 
      rotation={[0, rotationRad, 0]}
      onClick={(e) => {
        if (interactive) {
          e.stopPropagation();
          onSelect(element.id);
        }
      }}
    >
      {/* Main Body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
            color={isSelected ? '#4a90e2' : baseColor} 
            metalness={isAppliance ? 0.6 : materialProps.metalness}
            roughness={isAppliance ? 0.2 : materialProps.roughness}
        />
      </mesh>
      
      {/* Countertop for base cabinets */}
      {isBaseCabinet && (
          <mesh position={[0, height + 0.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[width + 1, 1.5, depth + 1]} />
            <meshStandardMaterial color="#f5f5dc" roughness={0.5} />
          </mesh>
      )}

      {/* Door/Drawer Detail for cabinets */}
      {!isAppliance && (
        <group position={[0, height / 2, depth / 2 + 0.1]}>
            <mesh>
                <planeGeometry args={[width - 2, height - 2]} />
                <meshStandardMaterial 
                    color={baseColor} 
                    toneMapped={false}
                    metalness={materialProps.metalness}
                    roughness={materialProps.roughness}
                />
            </mesh>
            {/* Handle */}
            <mesh position={[width > 24 ? width * 0.25 : width * 0.35, height * 0.3, 0.5]}>
                <cylinderGeometry args={[0.5, 0.5, 3, 8]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Second handle for wide cabinets */}
            {width > 24 && (
                <mesh position={[-width * 0.25, height * 0.3, 0.5]}>
                    <cylinderGeometry args={[0.5, 0.5, 3, 8]} />
                    <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
                </mesh>
            )}
        </group>
      )}
      
      {/* Wireframe for definition */}
      <lineSegments position={[0, height / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color="#000" transparent opacity={0.1} />
      </lineSegments>
    </group>
  );
};

const RoomFloor = ({ width, depth }) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  );
};

const Door3D = ({ door, width, depth, height, scale, activeWalls, customWalls }) => {
  const doorWidthInches = door.width || 32;
  const doorHeightInches = 80; // Standard door height
  const wallThickness = 4;
  const doorThickness = 1.75; // Standard door thickness
  
  // Check if this door's wall is active
  if (!activeWalls.includes(door.wallNumber)) return null;

  // For standard walls (1-4)
  if (door.wallNumber <= 4) {
    const position = door.position / 100; // Convert percentage to 0-1
    let doorPosition, doorRotation;

    switch (door.wallNumber) {
      case 1: // Top wall
        doorPosition = [width * position, doorHeightInches / 2, 0];
        doorRotation = [0, 0, 0];
        break;
      case 2: // Right wall
        doorPosition = [width, doorHeightInches / 2, depth * position];
        doorRotation = [0, Math.PI / 2, 0];
        break;
      case 3: // Bottom wall
        doorPosition = [width * position, doorHeightInches / 2, depth];
        doorRotation = [0, 0, 0];
        break;
      case 4: // Left wall
        doorPosition = [0, doorHeightInches / 2, depth * position];
        doorRotation = [0, Math.PI / 2, 0];
        break;
      default:
        return null;
    }

    return (
      <group position={doorPosition} rotation={doorRotation}>
        {/* Door panel */}
        <mesh>
          <boxGeometry args={[doorWidthInches, doorHeightInches, doorThickness]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} metalness={0.1} />
        </mesh>
        
        {/* Doorknob */}
        <mesh position={[doorWidthInches * 0.35, 0, doorThickness / 2 + 1]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#C0C0C0" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    );
  } else {
    // Custom wall door
    const customWall = customWalls.find(w => w.wallNumber === door.wallNumber);
    if (!customWall) return null;

    // Convert pixel coordinates to inches
    const x1Inches = customWall.x1 / scale;
    const y1Inches = customWall.y1 / scale;
    const x2Inches = customWall.x2 / scale;
    const y2Inches = customWall.y2 / scale;

    const wallLength = Math.sqrt(
      Math.pow(x2Inches - x1Inches, 2) + Math.pow(y2Inches - y1Inches, 2)
    );
    const wallAngle = Math.atan2(y2Inches - y1Inches, x2Inches - x1Inches);
    
    const position = door.position / 100;
    const doorPosAlongWall = position * wallLength;
    
    const doorX = x1Inches + Math.cos(wallAngle) * doorPosAlongWall;
    const doorY = y1Inches + Math.sin(wallAngle) * doorPosAlongWall;

    return (
      <group position={[doorX, doorHeightInches / 2, doorY]} rotation={[0, -wallAngle, 0]}>
        {/* Door panel */}
        <mesh>
          <boxGeometry args={[doorWidthInches, doorHeightInches, doorThickness]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} metalness={0.1} />
        </mesh>
        
        {/* Doorknob */}
        <mesh position={[doorWidthInches * 0.35, 0, doorThickness / 2 + 1]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#C0C0C0" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    );
  }
};

const RoomWalls = ({ width, depth, height, roomData, scale = 1 }) => {
  const wallThickness = 4; // 4 inches thick walls
  const wallColor = "#e0e0e0";
  const wallHeight = height || 96; // Default 8ft walls
  
  const activeWalls = roomData?.walls || [1, 2, 3, 4];
  const customWalls = roomData?.customWalls || [];

  return (
    <group>
      {/* Standard Walls - only render if in activeWalls array */}
      {/* Wall 1 (Top/Back) - spans width */}
      {activeWalls.includes(1) && (
        <mesh position={[width / 2, wallHeight / 2, -wallThickness / 2]} receiveShadow castShadow>
          <boxGeometry args={[width + wallThickness * 2, wallHeight, wallThickness]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}

      {/* Wall 2 (Right) - spans depth */}
      {activeWalls.includes(2) && (
        <mesh position={[width + wallThickness / 2, wallHeight / 2, depth / 2]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, depth]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}

      {/* Wall 3 (Bottom/Front) - spans width */}
      {activeWalls.includes(3) && (
        <mesh position={[width / 2, wallHeight / 2, depth + wallThickness / 2]} receiveShadow castShadow>
          <boxGeometry args={[width + wallThickness * 2, wallHeight, wallThickness]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}

      {/* Wall 4 (Left) - spans depth */}
      {activeWalls.includes(4) && (
        <mesh position={[-wallThickness / 2, wallHeight / 2, depth / 2]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, depth]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}
      
      {/* Custom Walls */}
      {customWalls.map((wall) => {
        if (!activeWalls.includes(wall.wallNumber)) return null;
        
        // Convert pixel coordinates to inches
        // Custom wall coordinates are in pixels, need to divide by scale
        const x1Inches = wall.x1 / scale;
        const y1Inches = wall.y1 / scale;
        const x2Inches = wall.x2 / scale;
        const y2Inches = wall.y2 / scale;
        
        // Calculate wall length and angle in inches
        const wallLength = Math.sqrt(
          Math.pow(x2Inches - x1Inches, 2) + Math.pow(y2Inches - y1Inches, 2)
        );
        const wallAngle = Math.atan2(y2Inches - y1Inches, x2Inches - x1Inches);
        
        // Center position in inches
        const centerX = (x1Inches + x2Inches) / 2;
        const centerY = (y1Inches + y2Inches) / 2;
        
        return (
          <mesh 
            key={wall.id || wall.wallNumber}
            position={[centerX, wallHeight / 2, centerY]}
            rotation={[0, -wallAngle, 0]}
            receiveShadow 
            castShadow
          >
            <boxGeometry args={[wallLength, wallHeight, wall.thickness || wallThickness]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        );
      })}
    </group>
  );
};

const DesignPreview3D = ({ 
  roomData, 
  elementTypes, 
  scale = 1, 
  interactive = false, 
  selectedElement: parentSelectedElement,
  setSelectedElement: parentSetSelectedElement,
  onUpdateElement 
}) => {
  // Use parent's selected element if provided, otherwise use internal state
  const [internalSelectedId, setInternalSelectedId] = React.useState(null);
  const selectedId = parentSelectedElement !== undefined ? parentSelectedElement : internalSelectedId;
  const setSelectedId = parentSetSelectedElement || setInternalSelectedId;
  
  if (!roomData) return null;

  const widthInches = parseFloat(roomData.dimensions.width) * 12;
  const depthInches = parseFloat(roomData.dimensions.height) * 12;

  return (
    <div className="  bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative" style={{ height: '400px' }}>
      <Canvas
        shadows
        camera={{ position: [widthInches * 1.5, widthInches, depthInches * 1.5], fov: 45 }}
        onClick={() => interactive && setSelectedId(null)} // Deselect on background click
      >
        <color attach="background" args={['#f5f5f5']} />
        
        <OrbitControls 
          target={[widthInches / 2, 0, depthInches / 2]} 
          maxPolarAngle={Math.PI / 2} // Prevent going below floor
        />
        
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[widthInches / 2, 100, depthInches / 2]} 
          intensity={1} 
          castShadow 
        />
        
        <group>
            {/* Floor */}
            <RoomFloor width={widthInches} depth={depthInches} />
            
            {/* Walls */}
            <RoomWalls width={widthInches} depth={depthInches} height={parseFloat(roomData.dimensions.wallHeight || 96)} roomData={roomData} scale={scale} />
            
            {/* Doors */}
            {(roomData.doors || []).map((door, index) => (
              <Door3D
                key={door.id || index}
                door={door}
                width={widthInches}
                depth={depthInches}
                height={parseFloat(roomData.dimensions.wallHeight || 96)}
                scale={scale}
                activeWalls={roomData.walls || [1, 2, 3, 4]}
                customWalls={roomData.customWalls || []}
              />
            ))}
            
            {/* Grid Helper */}
            <gridHelper 
                args={[Math.max(widthInches, depthInches) * 2, 20, 0xcccccc, 0xe5e5e5]} 
                position={[widthInches / 2, 0.1, depthInches / 2]} 
            />

            {/* Elements */}
            {roomData.elements.map((element) => (
            <Element3D 
                key={element.id} 
                element={element} 
                elementTypes={elementTypes}
                scale={scale}
                interactive={interactive}
                isSelected={selectedId === element.id}
                onSelect={setSelectedId}
            />
            ))}
        </group>
      </Canvas>
      
      {/* Controls UI */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
        <div className="bg-white/80 backdrop-blur px-3 py-1 rounded text-xs text-gray-600">
            Left Click: Rotate • Right Click: Pan • Scroll: Zoom
        </div>
      </div>
    </div>
  );
};

export default DesignPreview3D;
