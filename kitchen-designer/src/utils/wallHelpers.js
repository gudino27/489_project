// Wall management utilities for kitchen/bathroom designer
// Handles wall collision detection, snapping, and push-away mechanics

// Check if cabinet would collide with custom walls using proper line-rectangle intersection
export const checkWallCollision = (x, y, width, depth, customWalls, currentRoomData) => {
  console.log('Checking wall collision for position:', { 
    x, y, width, depth, 
    customWalls: customWalls?.length || 0, 
    roomWalls: currentRoomData?.walls?.length || 0,
    customWallsArray: customWalls,
    roomWallsArray: currentRoomData?.walls
  });
  
  if (!customWalls || customWalls.length === 0) {
    console.log('No custom walls to check');
    return false;
  }
  
  if (!currentRoomData?.walls || currentRoomData.walls.length === 0) {
    console.log('No room walls defined');
    return false;
  }
  
  for (const wall of customWalls) {
    // Only check walls that are present
    if (!(currentRoomData.walls || []).includes(wall.wallNumber)) continue;
    
    // Debug logging for vertical walls (2 and 4) specifically
    if (wall.wallNumber === 2 || wall.wallNumber === 4) {
      const cabinetCenterX = x + width / 2;
      const cabinetCenterY = y + depth / 2;
      const A = wall.y2 - wall.y1;
      const B = wall.x1 - wall.x2;
      const C = wall.x2 * wall.y1 - wall.x1 * wall.y2;
      const distance = Math.abs(A * cabinetCenterX + B * cabinetCenterY + C) / Math.sqrt(A * A + B * B);
      const buffer = 50;
      const minDistance = (wall.thickness + Math.min(width, depth)) / 2 + buffer;
      
      console.log(`Wall ${wall.wallNumber} collision check:`, {
        wallNumber: wall.wallNumber,
        wallCoords: { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 },
        cabinetPos: { x, y, width, depth },
        cabinetCenter: { x: cabinetCenterX, y: cabinetCenterY },
        distance,
        minDistance,
        willCollide: distance < minDistance
      });
    }
    
    // Check if wall line intersects with any cabinet edge or if cabinet overlaps wall
    const wallThickness = wall.thickness;
    
    // Check if cabinet center is too close to wall
    const cabinetCenterX = x + width / 2;
    const cabinetCenterY = y + depth / 2;
    
    // Distance from cabinet center to wall line
    const A = wall.y2 - wall.y1;
    const B = wall.x1 - wall.x2;
    const C = wall.x2 * wall.y1 - wall.x1 * wall.y2;
    const distance = Math.abs(A * cabinetCenterX + B * cabinetCenterY + C) / Math.sqrt(A * A + B * B);
    
    // Check if cabinet is too close to wall (considering both wall thickness and cabinet size)
    // Use a more conservative buffer for collision detection
    const buffer = 50; // Buffer for collision detection
    const minDistance = (wallThickness + Math.min(width, depth)) / 2 + buffer; // Use precise calculation without aggressive rounding
    
    if (distance < minDistance) {
      // Also check if the collision point is within the wall segment bounds
      const t = ((cabinetCenterX - wall.x1) * (wall.x2 - wall.x1) + (cabinetCenterY - wall.y1) * (wall.y2 - wall.y1)) /
        (Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
      if (t >= -0.05 && t <= 1.05) { // Full wall segment bounds - no clipping allowed
        return true; // Collision detected
      }
    }
  }
  return false; // No collision
};

// Smart cabinet positioning based on which side touches the wall
export const pushAwayFromWall = (x, y, width, depth, customWalls, currentRoomData, scale, elementRotation = 0) => {
  const cabinetCenter = { x: x + width / 2, y: y + depth / 2 };
  
  for (const wall of customWalls) {
    if (!(currentRoomData.walls || []).includes(wall.wallNumber)) continue;
    
    const wallThickness = wall.thickness;
    
    // Calculate wall line equation
    const A = wall.y2 - wall.y1;
    const B = wall.x1 - wall.x2;
    const C = wall.x2 * wall.y1 - wall.x1 * wall.y2;
    const wallLength = Math.sqrt(A * A + B * B);
    
    // Check distance from cabinet center to wall
    const centerDistance = Math.abs(A * cabinetCenter.x + B * cabinetCenter.y + C) / wallLength;
    
    // Check if collision occurs within wall segment bounds
    const t = ((cabinetCenter.x - wall.x1) * (wall.x2 - wall.x1) + (cabinetCenter.y - wall.y1) * (wall.y2 - wall.y1)) /
      (Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
    
    if (t < -0.05 || t > 1.05) continue; // Outside wall segment
    
    const collisionThreshold = wallThickness / 2 + 60; // Reduced threshold to prevent over-aggressive pushing
    
    if (centerDistance < collisionThreshold) {
      // Calculate wall normal vector pointing away from cabinet
      let wallNormalX = -A / wallLength;
      let wallNormalY = -B / wallLength;
      
      const closestPointX = wall.x1 + t * (wall.x2 - wall.x1);
      const closestPointY = wall.y1 + t * (wall.y2 - wall.y1);
      const toCenterX = cabinetCenter.x - closestPointX;
      const toCenterY = cabinetCenter.y - closestPointY;
      
      // Ensure normal points away from cabinet center
      if (wallNormalX * toCenterX + wallNormalY * toCenterY < 0) {
        wallNormalX = -wallNormalX;
        wallNormalY = -wallNormalY;
      }
      
      // Determine which side of cabinet is closest to wall for any rotation angle
      const rotationRadians = ((elementRotation || 0) * Math.PI) / 180;
      
      // Cabinet back direction vector (initially pointing "up" at rotation 0)
      const backDirectionX = Math.sin(rotationRadians);  // Back direction X component
      const backDirectionY = -Math.cos(rotationRadians); // Back direction Y component (negative because Y increases downward)
      
      // Wall normal vector (pointing away from cabinet)
      const wallToCenter = { x: wallNormalX, y: wallNormalY };
      
      // Calculate dot product between wall normal and cabinet back direction
      // If positive, wall is behind cabinet (back side closest)
      // If negative, wall is in front of cabinet (front side closest)
      const dotProduct = wallToCenter.x * backDirectionX + wallToCenter.y * backDirectionY;
      const isBackSide = dotProduct > 0;
      
      // Debug logging for 90-degree rotations
      if (Math.abs((elementRotation || 0) % 360 - 90) < 1) {
        console.log('90-degree cabinet collision:', {
          rotation: elementRotation,
          backDirection: { x: backDirectionX, y: backDirectionY },
          wallNormal: wallToCenter,
          dotProduct,
          isBackSide,
          centerDistance,
          collisionThreshold
        });
      }
      
      let newX = x;
      let newY = y;
      
      if (isBackSide) {
        // Back side - move cabinet so back edge touches the wall
        const targetDistance = wallThickness / 2 + 5; // Small buffer to avoid clipping
        const moveDistance = centerDistance - targetDistance;
        newX = x - wallNormalX * moveDistance;
        newY = y - wallNormalY * moveDistance;
        console.log('Back side collision - moving closer to wall:', { moveDistance, newX, newY });
      } else {
        // Front side - push cabinet away to provide door clearance
        const targetDistance = wallThickness / 2 + 50; // Extra space for door opening
        const moveDistance = targetDistance - centerDistance;
        newX = x + wallNormalX * moveDistance;
        newY = y + wallNormalY * moveDistance;
        console.log('Front side collision - pushing away from wall:', { moveDistance, newX, newY });
      }
      
      // Keep within room bounds and prevent pushing through walls
      const roomWidth = parseFloat(currentRoomData.dimensions.width) * 12 * scale;
      const roomHeight = parseFloat(currentRoomData.dimensions.height) * 12 * scale;
      const clampedX = Math.max(0, Math.min(newX, roomWidth - width));
      const clampedY = Math.max(0, Math.min(newY, roomHeight - depth));
      
      return { x: clampedX, y: clampedY };
    }
  }
  
  return null; // No adjustment needed
};

// Snap cabinet to room walls
export const snapToWall = (x, y, width, depth, currentRoomData, scale, customWalls, checkWallCollision, pushAwayFromWall) => {
  const roomWidth = parseFloat(currentRoomData.dimensions.width) * 12 * scale;
  const roomHeight = parseFloat(currentRoomData.dimensions.height) * 12 * scale;
  const snapDistance = 12; // Increased snap distance for walls
  let snappedX = x;
  let snappedY = y;
  
  // Snap to each wall if within snap distance
  if (x < snapDistance) snappedX = 0;                                    // Left wall
  if (x + width > roomWidth - snapDistance) snappedX = roomWidth - width; // Right wall
  if (y < snapDistance) snappedY = 0;                                    // Top wall
  if (y + depth > roomHeight - snapDistance) snappedY = roomHeight - depth; // Bottom wall
  
  // Ensure element stays within room bounds
  snappedX = Math.max(0, Math.min(snappedX, roomWidth - width));
  snappedY = Math.max(0, Math.min(snappedY, roomHeight - depth));
  
  // Check for wall collision and push away from wall if needed
  if (checkWallCollision(snappedX, snappedY, width, depth, customWalls, currentRoomData)) {
    // Push cabinet away from the colliding wall
    const pushedPosition = pushAwayFromWall(snappedX, snappedY, width, depth, customWalls, currentRoomData, scale);
    if (pushedPosition) {
      return pushedPosition;
    }
    
    // Fallback: Try to find a nearby position that doesn't collide
    const searchRadius = 20;
    for (let offsetX = -searchRadius; offsetX <= searchRadius; offsetX += 5) {
      for (let offsetY = -searchRadius; offsetY <= searchRadius; offsetY += 5) {
        const testX = Math.max(0, Math.min(snappedX + offsetX, roomWidth - width));
        const testY = Math.max(0, Math.min(snappedY + offsetY, roomWidth - depth));
        if (!checkWallCollision(testX, testY, width, depth, customWalls, currentRoomData)) {
          return { x: testX, y: testY };
        }
      }
    }
  }
  
  return { x: snappedX, y: snappedY };
};