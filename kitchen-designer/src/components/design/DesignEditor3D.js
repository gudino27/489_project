import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, Environment, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { getMaterialById, MATERIAL_TYPES, FINISHES } from '../../constants/materials';

const Element3D = ({ element, scale, elementTypes, isSelected, onSelect, onUpdate, interactive, transformMode, orbitControlsRef, roomWidth, roomDepth, onTransformChange }) => {
  const [elementObj, setElementObj] = useState(null);
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
    } else if (materialData.type === MATERIAL_TYPES.APPLIANCE) {
        return { roughness: materialData.roughness, metalness: materialData.metalness };
    } else {
        // Stain properties
        return { roughness: 0.6, metalness: 0 };
    }
  }, [materialData, element.finish]);

  useEffect(() => {
    if (isSelected) {
      console.log('Element selected:', element.id, 'Interactive:', interactive, 'Obj:', !!elementObj);
    }
  }, [isSelected, interactive, elementObj, element.id]);

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
  const isCorner = (element.type.toLowerCase().includes('corner') || (width === depth && width > 30)) && !isAppliance;
  const standardDepth = 24;

  const handleElementClick = (e) => {
    if (interactive) {
        e.stopPropagation();
        onSelect(element.id);
    }
  };
  
  return (
    <>
      <group 
        ref={setElementObj}
        position={[xInches + width / 2, elevation, yInches + depth / 2]} 
        rotation={[0, rotationRad, 0]}
      >
      {/* Main Body */}
      {isCorner ? (
        <group>
            {/* Back Rect (Main width) */}
            <mesh 
                position={[0, height / 2, 12 - depth / 2]} 
                castShadow 
                receiveShadow
                onClick={handleElementClick}
            >
                <boxGeometry args={[width, height, 24]} />
                <meshStandardMaterial 
                    color={baseColor} 
                    metalness={materialProps.metalness}
                    roughness={materialProps.roughness}
                    emissive={isSelected ? '#4a90e2' : '#000000'}
                    emissiveIntensity={isSelected ? 0.3 : 0}
                />
            </mesh>
            {/* Side Extension (Remaining depth) */}
            <mesh 
                position={[12 - width / 2, height / 2, 24 + (depth - 24) / 2 - depth / 2]} 
                castShadow 
                receiveShadow
                onClick={handleElementClick}
            >
                <boxGeometry args={[24, height, depth - 24]} />
                <meshStandardMaterial 
                    color={baseColor} 
                    metalness={materialProps.metalness}
                    roughness={materialProps.roughness}
                    emissive={isSelected ? '#4a90e2' : '#000000'}
                    emissiveIntensity={isSelected ? 0.3 : 0}
                />
            </mesh>
            {/* Countertop for corner */}
            {isBaseCabinet && (
                <group position={[0, height + 0.75, 0]}>
                    <mesh position={[0, 0, 12 - depth / 2]} castShadow receiveShadow onClick={handleElementClick}>
                        <boxGeometry args={[width + 1, 1.5, 25]} />
                        <meshStandardMaterial color="#f5f5dc" roughness={0.5} />
                    </mesh>
                    <mesh position={[12 - width / 2, 0, 24 + (depth - 24) / 2 - depth / 2]} castShadow receiveShadow onClick={handleElementClick}>
                        <boxGeometry args={[25, 1.5, depth - 24 + 1]} />
                        <meshStandardMaterial color="#f5f5dc" roughness={0.5} />
                    </mesh>
                </group>
            )}
        </group>
      ) : (
        <mesh 
            position={[0, height / 2, 0]} 
            castShadow 
            receiveShadow
            onClick={handleElementClick}
        >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial 
                color={baseColor} 
                metalness={isAppliance ? 0.6 : materialProps.metalness}
                roughness={isAppliance ? 0.2 : materialProps.roughness}
                emissive={isSelected ? '#4a90e2' : '#000000'}
                emissiveIntensity={isSelected ? 0.3 : 0}
            />
        </mesh>
      )}

        {/* Countertop for standard base cabinets */}
        {isBaseCabinet && !isCorner && (
            <mesh 
                position={[0, height + 0.75, 0]} 
                castShadow 
                receiveShadow
                onClick={handleElementClick}
            >
              <boxGeometry args={[width + 1, 1.5, depth + 1]} />
              <meshStandardMaterial color="#f5f5dc" roughness={0.5} />
            </mesh>
        )}

        {/* Door/Drawer Detail for cabinets */}
        {!isAppliance && !isCorner && (
          <group position={[0, height / 2, depth / 2 + 0.1]}>
              <mesh
                onClick={handleElementClick}
              >
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
      {!isCorner && (
        <lineSegments position={[0, height / 2, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
            <lineBasicMaterial color="#000" transparent opacity={0.1} />
        </lineSegments>
      )}

      {/* Debug Selection Indicator */}
      {isSelected && (
        <mesh position={[0, height + 5, 0]}>
            <sphereGeometry args={[2]} />
            <meshBasicMaterial color="#4a90e2" />
        </mesh>
      )}
    </group>

    {interactive && isSelected && elementObj && (
        <TransformControls
          object={elementObj}
          size={1}
          mode={transformMode}
          rotationSnap={Math.PI / 12} // 15 degrees snap
          showX={transformMode === 'translate'}
          showZ={transformMode === 'translate'}
          showY={transformMode === 'rotate'} // Only allow Y-axis rotation
          onDraggingChanged={(isDragging) => {
             if (orbitControlsRef && orbitControlsRef.current) {
                 orbitControlsRef.current.enabled = !isDragging;
             }
          }}
          onChange={(e) => {
             const object = e?.target?.object || elementObj;
             if (!object || !roomWidth || !roomDepth) return;

             // Calculate effective width/depth based on rotation
             const rotation = object.rotation.y;
             const absCos = Math.abs(Math.cos(rotation));
             const absSin = Math.abs(Math.sin(rotation));
             
             const currentWidth = width * absCos + depth * absSin;
             const currentDepth = width * absSin + depth * absCos;
             
             // Add a small buffer to prevent z-fighting with walls
             const buffer = 0.5;
             
             const minX = currentWidth / 2 + buffer;
             const maxX = roomWidth - currentWidth / 2 - buffer;
             const minZ = currentDepth / 2 + buffer;
             const maxZ = roomDepth - currentDepth / 2 - buffer;
             
             // Clamp position
             // Check if room is too small for object, if so, center it or clamp to min
             if (minX > maxX) {
                 object.position.x = roomWidth / 2;
             } else {
                 if (object.position.x < minX) object.position.x = minX;
                 if (object.position.x > maxX) object.position.x = maxX;
             }

             if (minZ > maxZ) {
                 object.position.z = roomDepth / 2;
             } else {
                 if (object.position.z < minZ) object.position.z = minZ;
                 if (object.position.z > maxZ) object.position.z = maxZ;
             }

             // Real-time update for UI
             if (onTransformChange) {
                const newRotation = -object.rotation.y * (180 / Math.PI);
                const normalizedRotation = ((newRotation % 360) + 360) % 360;
                onTransformChange(element.id, { 
                    rotation: normalizedRotation,
                    mountHeight: object.position.y
                });
             }
          }}
          onMouseUp={(e) => {
             // Only trigger update on mouse up to avoid excessive state updates
             if (onUpdate && elementObj) {
                const object = elementObj;
                
                if (transformMode === 'translate') {
                    // Convert 3D position (inches) back to 2D pixels
                    // 3D X = xInches + width/2  => xInches = 3D X - width/2
                    // xPixels = xInches * scale
                    const newXInches = object.position.x - width / 2;
                    const newYInches = object.position.z - depth / 2;
                    
                    const newX = newXInches * scale;
                    const newY = newYInches * scale;
                    
                    onUpdate(element.id, { x: newX, y: newY });
                } else if (transformMode === 'rotate') {
                    // Convert 3D rotation (radians) back to degrees
                    // rotationRad = -rotation * (PI/180)
                    // rotation = -rotationRad * (180/PI)
                    // We use object.rotation.y
                    const newRotation = -object.rotation.y * (180 / Math.PI);
                    // Normalize to 0-360
                    const normalizedRotation = ((newRotation % 360) + 360) % 360;
                    onUpdate(element.id, { rotation: Math.round(normalizedRotation) }); // Round to whole number
                }
             }
          }}
        />
      )}
    </>
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

  // Door color based on type
  const doorColor = door.type === 'pantry' ? '#6B4423' : door.type === 'room' ? '#8B7355' : '#7D6E5F';

  // Render detailed door with panels, frame, and hardware
  const renderDoorDetails = () => (
    <>
      {/* Main door panel */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[doorWidthInches, doorHeightInches, doorThickness]} />
        <meshStandardMaterial color={doorColor} roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Door frame/trim */}
      <group position={[0, 0, doorThickness / 2 + 0.1]}>
        {/* Top rail */}
        <mesh position={[0, doorHeightInches / 2 - 3, 0]}>
          <boxGeometry args={[doorWidthInches - 4, 1, 0.3]} />
          <meshStandardMaterial color={doorColor} roughness={0.5} />
        </mesh>
        {/* Bottom rail */}
        <mesh position={[0, -doorHeightInches / 2 + 3, 0]}>
          <boxGeometry args={[doorWidthInches - 4, 1, 0.3]} />
          <meshStandardMaterial color={doorColor} roughness={0.5} />
        </mesh>
        {/* Left stile */}
        <mesh position={[-doorWidthInches / 2 + 3, 0, 0]}>
          <boxGeometry args={[1, doorHeightInches - 8, 0.3]} />
          <meshStandardMaterial color={doorColor} roughness={0.5} />
        </mesh>
        {/* Right stile */}
        <mesh position={[doorWidthInches / 2 - 3, 0, 0]}>
          <boxGeometry args={[1, doorHeightInches - 8, 0.3]} />
          <meshStandardMaterial color={doorColor} roughness={0.5} />
        </mesh>

        {/* Decorative panels */}
        {/* Upper panel */}
        <mesh position={[0, doorHeightInches / 4, 0.15]}>
          <boxGeometry args={[doorWidthInches - 10, doorHeightInches / 2 - 10, 0.2]} />
          <meshStandardMaterial color={doorColor} roughness={0.7} />
        </mesh>
        {/* Lower panel */}
        <mesh position={[0, -doorHeightInches / 4, 0.15]}>
          <boxGeometry args={[doorWidthInches - 10, doorHeightInches / 2 - 10, 0.2]} />
          <meshStandardMaterial color={doorColor} roughness={0.7} />
        </mesh>
      </group>

      {/* Door handle assembly */}
      <group position={[doorWidthInches * 0.35, 0, doorThickness / 2]}>
        {/* Handle base plate */}
        <mesh position={[0, 0, 0.5]}>
          <cylinderGeometry args={[2, 2, 0.3, 16]} />
          <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Handle lever */}
        <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.4, 4, 8, 16]} />
          <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Lock cylinder */}
        <mesh position={[0, -3, 0.8]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#4A4A4A" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Hinges (3 hinges on opposite side) */}
      {[0.7, 0, -0.7].map((yOffset, i) => (
        <group key={i} position={[-doorWidthInches / 2 + 1, doorHeightInches * yOffset / 2, doorThickness / 2]}>
          <mesh>
            <boxGeometry args={[1.5, 3, 0.5]} />
            <meshStandardMaterial color="#4A4A4A" roughness={0.4} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );

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
        {renderDoorDetails()}
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
        {renderDoorDetails()}
      </group>
    );
  }
};

// Helper to render wall with door opening
const WallWithDoorOpening = ({
  wallNumber,
  wallPosition,
  wallSize,
  wallRotation,
  doors,
  wallThickness,
  wallHeight,
  wallColor
}) => {
  const doorsOnWall = doors.filter(d => d.wallNumber === wallNumber);

  // If no doors, render solid wall
  if (doorsOnWall.length === 0) {
    return (
      <mesh position={wallPosition} receiveShadow castShadow>
        <boxGeometry args={wallSize} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
    );
  }

  // For walls with doors, split into segments
  const door = doorsOnWall[0]; // Handle first door for now
  const doorWidthInches = door.width || 32;
  const doorHeightInches = 80;
  const doorPosition = door.position / 100; // Convert to 0-1
  const wallLength = wallRotation[1] === 0 ? wallSize[0] : wallSize[2]; // width or depth
  const frameWidth = 4; // Door frame trim width

  // Calculate door center position along wall
  const doorCenter = doorPosition * wallLength;
  const doorHalfWidth = doorWidthInches / 2;

  // Left/bottom segment
  const leftSegmentWidth = doorCenter - doorHalfWidth - frameWidth;
  // Right/top segment
  const rightSegmentWidth = wallLength - doorCenter - doorHalfWidth - frameWidth;

  return (
    <group>
      {/* Left/Bottom wall segment */}
      {leftSegmentWidth > 0 && (
        <mesh
          position={
            wallRotation[1] === 0
              ? [wallPosition[0] - wallLength / 2 + leftSegmentWidth / 2, wallPosition[1], wallPosition[2]]
              : [wallPosition[0], wallPosition[1], wallPosition[2] - wallLength / 2 + leftSegmentWidth / 2]
          }
          receiveShadow
          castShadow
        >
          <boxGeometry args={
            wallRotation[1] === 0
              ? [leftSegmentWidth, wallHeight, wallThickness]
              : [wallThickness, wallHeight, leftSegmentWidth]
          } />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}

      {/* Top header above door */}
      <mesh
        position={
          wallRotation[1] === 0
            ? [wallPosition[0] - wallLength / 2 + doorCenter, wallPosition[1] + doorHeightInches / 2 + (wallHeight - doorHeightInches) / 4, wallPosition[2]]
            : [wallPosition[0], wallPosition[1] + doorHeightInches / 2 + (wallHeight - doorHeightInches) / 4, wallPosition[2] - wallLength / 2 + doorCenter]
        }
        receiveShadow
        castShadow
      >
        <boxGeometry args={
          wallRotation[1] === 0
            ? [doorWidthInches + frameWidth * 2, wallHeight - doorHeightInches, wallThickness]
            : [wallThickness, wallHeight - doorHeightInches, doorWidthInches + frameWidth * 2]
        } />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Right/Top wall segment */}
      {rightSegmentWidth > 0 && (
        <mesh
          position={
            wallRotation[1] === 0
              ? [wallPosition[0] + wallLength / 2 - rightSegmentWidth / 2, wallPosition[1], wallPosition[2]]
              : [wallPosition[0], wallPosition[1], wallPosition[2] + wallLength / 2 - rightSegmentWidth / 2]
          }
          receiveShadow
          castShadow
        >
          <boxGeometry args={
            wallRotation[1] === 0
              ? [rightSegmentWidth, wallHeight, wallThickness]
              : [wallThickness, wallHeight, rightSegmentWidth]
          } />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}

      {/* Door Frame / Trim around opening */}
      <group>
        {/* Left jamb */}
        <mesh
          position={
            wallRotation[1] === 0
              ? [wallPosition[0] - wallLength / 2 + doorCenter - doorHalfWidth - frameWidth / 2, wallPosition[1] - wallHeight / 2 + doorHeightInches / 2, wallPosition[2]]
              : [wallPosition[0], wallPosition[1] - wallHeight / 2 + doorHeightInches / 2, wallPosition[2] - wallLength / 2 + doorCenter - doorHalfWidth - frameWidth / 2]
          }
          receiveShadow
          castShadow
        >
          <boxGeometry args={
            wallRotation[1] === 0
              ? [frameWidth, doorHeightInches, wallThickness + 2]
              : [wallThickness + 2, doorHeightInches, frameWidth]
          } />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Right jamb */}
        <mesh
          position={
            wallRotation[1] === 0
              ? [wallPosition[0] - wallLength / 2 + doorCenter + doorHalfWidth + frameWidth / 2, wallPosition[1] - wallHeight / 2 + doorHeightInches / 2, wallPosition[2]]
              : [wallPosition[0], wallPosition[1] - wallHeight / 2 + doorHeightInches / 2, wallPosition[2] - wallLength / 2 + doorCenter + doorHalfWidth + frameWidth / 2]
          }
          receiveShadow
          castShadow
        >
          <boxGeometry args={
            wallRotation[1] === 0
              ? [frameWidth, doorHeightInches, wallThickness + 2]
              : [wallThickness + 2, doorHeightInches, frameWidth]
          } />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Top header trim */}
        <mesh
          position={
            wallRotation[1] === 0
              ? [wallPosition[0] - wallLength / 2 + doorCenter, wallPosition[1] - wallHeight / 2 + doorHeightInches + frameWidth / 2, wallPosition[2]]
              : [wallPosition[0], wallPosition[1] - wallHeight / 2 + doorHeightInches + frameWidth / 2, wallPosition[2] - wallLength / 2 + doorCenter]
          }
          receiveShadow
          castShadow
        >
          <boxGeometry args={
            wallRotation[1] === 0
              ? [doorWidthInches + frameWidth * 2, frameWidth, wallThickness + 2]
              : [wallThickness + 2, frameWidth, doorWidthInches + frameWidth * 2]
          } />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>
    </group>
  );
};

const RoomWalls = ({ width, depth, height, roomData, scale = 1 }) => {
  const wallThickness = 4; // 4 inches thick walls
  const wallColor = "#e0e0e0";
  const wallHeight = height || 96; // Default 8ft walls

  const activeWalls = roomData?.walls || [1, 2, 3, 4];
  const customWalls = roomData?.customWalls || [];
  const doors = roomData?.doors || [];

  return (
    <group>
      {/* Standard Walls - only render if in activeWalls array */}
      {/* Wall 1 (Top/Back) - spans width */}
      {activeWalls.includes(1) && (
        <WallWithDoorOpening
          wallNumber={1}
          wallPosition={[width / 2, wallHeight / 2, -wallThickness / 2]}
          wallSize={[width + wallThickness * 2, wallHeight, wallThickness]}
          wallRotation={[0, 0, 0]}
          doors={doors}
          wallThickness={wallThickness}
          wallHeight={wallHeight}
          wallColor={wallColor}
        />
      )}

      {/* Wall 2 (Right) - spans depth */}
      {activeWalls.includes(2) && (
        <WallWithDoorOpening
          wallNumber={2}
          wallPosition={[width + wallThickness / 2, wallHeight / 2, depth / 2]}
          wallSize={[wallThickness, wallHeight, depth]}
          wallRotation={[0, Math.PI / 2, 0]}
          doors={doors}
          wallThickness={wallThickness}
          wallHeight={wallHeight}
          wallColor={wallColor}
        />
      )}

      {/* Wall 3 (Bottom/Front) - spans width */}
      {activeWalls.includes(3) && (
        <WallWithDoorOpening
          wallNumber={3}
          wallPosition={[width / 2, wallHeight / 2, depth + wallThickness / 2]}
          wallSize={[width + wallThickness * 2, wallHeight, wallThickness]}
          wallRotation={[0, 0, 0]}
          doors={doors}
          wallThickness={wallThickness}
          wallHeight={wallHeight}
          wallColor={wallColor}
        />
      )}

      {/* Wall 4 (Left) - spans depth */}
      {activeWalls.includes(4) && (
        <WallWithDoorOpening
          wallNumber={4}
          wallPosition={[-wallThickness / 2, wallHeight / 2, depth / 2]}
          wallSize={[wallThickness, wallHeight, depth]}
          wallRotation={[0, Math.PI / 2, 0]}
          doors={doors}
          wallThickness={wallThickness}
          wallHeight={wallHeight}
          wallColor={wallColor}
        />
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

const DesignEditor3D = ({ 
  roomData, 
  elementTypes, 
  scale = 1, 
  interactive = false, 
  selectedElement: parentSelectedElement,
  setSelectedElement: parentSetSelectedElement,
  onUpdateElement,
  onTransformChange
}) => {
  const [transformMode, setTransformMode] = React.useState('translate'); // 'translate' | 'rotate'

  // Use parent's selected element if provided, otherwise use internal state
  const [internalSelectedId, setInternalSelectedId] = React.useState(null);
  const selectedId = parentSelectedElement !== undefined ? parentSelectedElement : internalSelectedId;
  const setSelectedId = parentSetSelectedElement || setInternalSelectedId;
  
  const orbitControlsRef = useRef();

  if (!roomData) return null;

  const widthInches = parseFloat(roomData.dimensions.width) * 12;
  const depthInches = parseFloat(roomData.dimensions.height) * 12;

  return (
    <div className="w-full h-full bg-gray-100 relative">
      <Canvas
        shadows
        camera={{ position: [widthInches * 1.5, widthInches, depthInches * 1.5], fov: 45 }}
        onPointerMissed={() => interactive && setSelectedId(null)}
      >
        <color attach="background" args={['#f5f5f5']} />
        
        <OrbitControls 
          ref={orbitControlsRef}
          target={[widthInches / 2, 0, depthInches / 2]} 
          maxPolarAngle={Math.PI / 2} // Prevent going below floor
          enabled={true} // Controlled by TransformControls
          makeDefault
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
                onUpdate={onUpdateElement}
                transformMode={transformMode}
                orbitControlsRef={orbitControlsRef}
                roomWidth={widthInches}
                roomDepth={depthInches}
                onTransformChange={onTransformChange}
            />
            ))}
        </group>
      </Canvas>
      
      {/* Controls UI */}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
        {interactive && selectedId && (
            <div className="bg-white/90 backdrop-blur shadow-lg rounded-lg p-2 pointer-events-auto flex gap-2">
                <button 
                    onClick={() => setTransformMode('translate')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${transformMode === 'translate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Move
                </button>
                <button 
                    onClick={() => setTransformMode('rotate')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${transformMode === 'rotate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Rotate
                </button>
            </div>
        )}
        <div className="bg-white/80 backdrop-blur px-3 py-1 rounded text-xs text-gray-600">
            Left Click: Rotate • Right Click: Pan • Scroll: Zoom {interactive && "• Click Object to Edit"}
        </div>
      </div>
    </div>
  );
};

export default DesignEditor3D;