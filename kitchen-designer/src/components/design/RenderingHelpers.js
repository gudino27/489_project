import React from 'react';
import { getDoorsOnWall, getCustomWallByNumber } from '../../utils/designer/wallViewUtils';
import { getMaterialById } from '../../constants/materials';

export const renderCornerCabinet = (element, scale, isDragging, handleMouseDown) => {
  const size = element.width * scale;
  
  // Get material color if set
  const materialData = element.materialId ? getMaterialById(element.materialId) : null;
  const fillColor = materialData ? materialData.hex : '#d3d3d3';
  
  // Create L-shaped path based on hinge direction (using relative coordinates)
  const path =
    element.hingeDirection === "left"
      ? `M 0 0
       L ${size} 0
       L ${size} ${size * 0.6}
       L ${size * 0.6} ${size * 0.6}
       L ${size * 0.6} ${size}
       L 0 ${size}
       Z`
      : `M 0 0
       L ${size} 0
       L ${size} ${size}
       L ${size * 0.4} ${size}
       L ${size * 0.4} ${size * 0.6}
       L 0 ${size * 0.6}
       Z`;
  return (
    <g>
      {/* Base cabinet shape */}
      <path
        d={path}
        fill={fillColor}
        stroke="#333"
        strokeWidth="1"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
      />
      {/* Wood grain texture overlay */}
      <path
        d={path}
        fill="url(#woodGrain)"
        stroke="none"
        style={{ pointerEvents: 'none' }}
      />
      {/* Door outlines and graphics */}
      {element.hingeDirection === "left" ? (
        <>
          {/* Door division lines */}
          <line
            x1={size * 0.6}
            y1={0}
            x2={size * 0.6}
            y2={size * 0.6}
            stroke="#333"
            strokeWidth="1"
          />
          <line
            x1={0}
            y1={size * 0.6}
            x2={size * 0.6}
            y2={size * 0.6}
            stroke="#333"
            strokeWidth="1"
          />

          {/* Door outline rectangles to show door locations */}
          {/* Top horizontal door */}
          <rect
            x={size * 0.6 + 2}
            y={2}
            width={size * 0.4 - 4}
            height={size * 0.6 - 4}
            fill="none"
            stroke="#666"
            strokeWidth="0.5"
            rx="2"
          />
          {/* Left vertical door */}
          <rect
            x={2}
            y={size * 0.6 + 2}
            width={size * 0.6 - 4}
            height={size * 0.4 - 4}
            fill="none"
            stroke="#666"
            strokeWidth="0.5"
            rx="2"
          />

          {/* Door swing arcs now handled by renderDoorGraphic in DraggableCabinet */}
        </>
      ) : (
        <>
          {/* Door division lines */}
          <line
            x1={size * 0.4}
            y1={0}
            x2={size * 0.4}
            y2={size * 0.6}
            stroke="#333"
            strokeWidth="1"
          />
          <line
            x1={size * 0.4}
            y1={size * 0.6}
            x2={size}
            y2={size * 0.6}
            stroke="#333"
            strokeWidth="1"
          />

          {/* Door outline rectangles to show door locations */}
          {/* Left horizontal door */}
          <rect
            x={2}
            y={2}
            width={size * 0.4 - 4}
            height={size * 0.6 - 4}
            fill="none"
            stroke="#666"
            strokeWidth="0.5"
            rx="2"
          />
          {/* Right vertical door */}
          <rect
            x={size * 0.4 + 2}
            y={size * 0.6 + 2}
            width={size * 0.6 - 4}
            height={size * 0.4 - 4}
            fill="none"
            stroke="#666"
            strokeWidth="0.5"
            rx="2"
          />

          {/* Door swing arcs now handled by renderDoorGraphic in DraggableCabinet */}
        </>
      )}
    </g>
  );
};
export const renderDoorGraphic = (x, y, width, depth, rotation) => {
  const cx =
    rotation === 0
      ? x
      : rotation === 90
      ? x + depth
      : rotation === 180
      ? x + width
      : x;
  const cy =
    rotation === 0
      ? y + depth
      : rotation === 90
      ? y
      : rotation === 180
      ? y
      : y + width;
  const radius = Math.min(width, depth) * 0.3;
  const startAngle = rotation;
  const endAngle = rotation + 90;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  return (
    <path
      d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
      fill="none"
      stroke="#666"
      strokeWidth="0.5"
      strokeDasharray="2,2"
    />
  );
};
export const renderWallWithDoors = (wallNumber, wallRect, currentRoomData, customWalls, scale) => {
  const doors = getDoorsOnWall(wallNumber, currentRoomData.doors);
  const { x, y, width, height, isHorizontal } = wallRect;

  if (doors.length === 0) {
    // No doors, render solid wall
    return (
      <rect
        key={`wall-${wallNumber}`}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#666"
      />
    );
  }

  // Sort doors by position for proper rendering
  const sortedDoors = doors.sort((a, b) => a.position - b.position);
  const wallElements = [];
  let currentPos = 0; // Position along wall (0-100%)

  sortedDoors.forEach((door, index) => {
    // Calculate door width as percentage of wall length
    let wallLengthInches;
    if (wallNumber <= 4) {
      // Room walls: wall represents room dimension in feet, so convert to inches
      wallLengthInches = isHorizontal
        ? parseFloat(currentRoomData.dimensions.width) * 12
        : parseFloat(currentRoomData.dimensions.height) * 12;
    } else {
      // Custom walls: calculate actual wall length from coordinates
      const customWall = getCustomWallByNumber(wallNumber, customWalls);
      if (customWall) {
        const wallLengthPixels = Math.sqrt(
          Math.pow(customWall.x2 - customWall.x1, 2) +
            Math.pow(customWall.y2 - customWall.y1, 2)
        );
        // Convert pixels to inches: pixels / (scale factor) gives feet, then * 12 for inches
        wallLengthInches = (wallLengthPixels / scale / 12) * 12; // This simplifies to wallLengthPixels / scale
      } else {
        // Fallback: assume 8 feet if custom wall not found
        wallLengthInches = 96;
      }
    }

    // Door width as percentage of wall length
    const doorWidthPercentage = (door.width / wallLengthInches) * 100;
    const halfDoorWidth = doorWidthPercentage / 2;

    // Ensure door doesn't go beyond wall boundaries
    const doorStart = Math.max(0, door.position - halfDoorWidth);
    const doorEnd = Math.min(100, door.position + halfDoorWidth);

    // Add wall segment before door
    if (currentPos < doorStart) {
      if (isHorizontal) {
        wallElements.push(
          <rect
            key={`wall-${wallNumber}-segment-${index}`}
            x={x + (currentPos / 100) * width}
            y={y}
            width={((doorStart - currentPos) / 100) * width}
            height={height}
            fill="#666"
          />
        );
      } else {
        wallElements.push(
          <rect
            key={`wall-${wallNumber}-segment-${index}`}
            x={x}
            y={y + (currentPos / 100) * height}
            width={width}
            height={((doorStart - currentPos) / 100) * height}
            fill="#666"
          />
        );
      }
    }

    // Add door opening visualization with drag handles
    const doorColor =
      door.type === "pantry"
        ? "#8B4513"
        : door.type === "room"
        ? "#4CAF50"
        : "#2196F3";
    const doorCenterX = isHorizontal
      ? x + (door.position / 100) * width
      : x + width / 2;
    const doorCenterY = isHorizontal
      ? y + height / 2
      : y + (door.position / 100) * height;

    if (isHorizontal) {
      wallElements.push(
        <g key={`door-${door.id}`}>
          {/* Door opening */}
          <rect
            x={x + (doorStart / 100) * width}
            y={y - 2}
            width={((doorEnd - doorStart) / 100) * width}
            height={height + 4}
            fill="white"
            stroke={doorColor}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          <text
            x={doorCenterX}
            y={y + height / 2 + 3}
            textAnchor="middle"
            fontSize="8"
            fill={doorColor}
            fontWeight="bold"
          >
            DOOR
          </text>
        </g>
      );
    } else {
      wallElements.push(
        <g key={`door-${door.id}`}>
          {/* Door opening */}
          <rect
            x={x - 2}
            y={y + (doorStart / 100) * height}
            width={width + 4}
            height={((doorEnd - doorStart) / 100) * height}
            fill="white"
            stroke={doorColor}
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          <text
            x={x + width / 2}
            y={doorCenterY + 3}
            textAnchor="middle"
            fontSize="8"
            fill={doorColor}
            fontWeight="bold"
          >
            DOOR
          </text>
        </g>
      );
    }

    // Move current position past this door
    currentPos = doorEnd;
  });
  // Add final wall segment after last door
  if (currentPos < 100) {
    if (isHorizontal) {
      wallElements.push(
        <rect
          key={`wall-${wallNumber}-final`}
          x={x + (currentPos / 100) * width}
          y={y}
          width={((100 - currentPos) / 100) * width}
          height={height}
          fill="#666"
        />
      );
    } else {
      wallElements.push(
        <rect
          key={`wall-${wallNumber}-final`}
          x={x}
          y={y + (currentPos / 100) * height}
          width={width}
          height={((100 - currentPos) / 100) * height}
          fill="#666"
        />
      );
    }
  }
  return wallElements;
};