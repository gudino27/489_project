export const checkWallCollision = (x, y, width, depth, wallsArray = [], roomData = {}, rotation = 0) => {
  for (const wall of wallsArray) {
    // Only check walls that are present
    if (!(roomData.walls || []).includes(wall.wallNumber)) continue;

    // Create cabinet rectangle corners
    const corners = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width, y: y + depth },
      { x: x, y: y + depth }
    ];

    // Check if wall line intersects with any cabinet edge or if cabinet overlaps wall
    const wallThickness = wall.thickness;

    // Calculate wall as a thick line (rectangle)
    const wallLength = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
    const wallAngle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

    // Wall center point
    const wallCenterX = (wall.x1 + wall.x2) / 2;
    const wallCenterY = (wall.y1 + wall.y2) / 2;

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
    const buffer = 60; // Reduced buffer to prevent over-aggressive collision detection
    const minDistance = (wallThickness + Math.min(width, depth)) / 2 + buffer;

    if (distance < minDistance) {
      // Also check if the collision point is within the wall segment bounds
      const t = ((cabinetCenterX - wall.x1) * (wall.x2 - wall.x1) + (cabinetCenterY - wall.y1) * (wall.y2 - wall.y1)) /
        (Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));

      if (t >= 0.0 && t <= 1.0) { // Exact wall bounds - no clipping allowed
        return true; // Collision detected
      }
    }
  }
  return false; // No collision
};
export const pushAwayFromWall = (x, y, width, depth, customWalls, roomData, scale) => {
  // Get all four corners of the cabinet
  const cabinetCorners = [
    { x: x, y: y }, // top-left
    { x: x + width, y: y }, // top-right
    { x: x + width, y: y + depth }, // bottom-right
    { x: x, y: y + depth } // bottom-left
  ];

  for (const wall of customWalls) {
    if (!(roomData.walls || []).includes(wall.wallNumber)) continue;

    const wallThickness = wall.thickness;
    const buffer = 20; // Safe distance from wall
    let closestDistance = Infinity;
    let closestCorner = null;
    let wallNormalX = 0;
    let wallNormalY = 0;

    // Find the closest corner to the wall
    for (const corner of cabinetCorners) {
      const A = wall.y2 - wall.y1;
      const B = wall.x1 - wall.x2;
      const C = wall.x2 * wall.y1 - wall.x1 * wall.y2;
      const distance = Math.abs(A * corner.x + B * corner.y + C) / Math.sqrt(A * A + B * B);

      // Check if this corner is within the wall segment bounds
      const t = ((corner.x - wall.x1) * (wall.x2 - wall.x1) + (corner.y - wall.y1) * (wall.y2 - wall.y1)) /
        (Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));

      if (t >= -0.05 && t <= 1.05 && distance < closestDistance) {
        closestDistance = distance;
        closestCorner = corner;

        // Calculate wall normal vector (perpendicular to wall)
        const wallLength = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
        wallNormalX = -(wall.y2 - wall.y1) / wallLength;
        wallNormalY = (wall.x2 - wall.x1) / wallLength;

        // Ensure normal points away from the cabinet center
        const cabinetCenterX = x + width / 2;
        const cabinetCenterY = y + depth / 2;
        const closestPointX = wall.x1 + t * (wall.x2 - wall.x1);
        const closestPointY = wall.y1 + t * (wall.y2 - wall.y1);

        const toCenterX = cabinetCenterX - closestPointX;
        const toCenterY = cabinetCenterY - closestPointY;

        // If normal is pointing toward cabinet center, flip it
        if (wallNormalX * toCenterX + wallNormalY * toCenterY < 0) {
          wallNormalX = -wallNormalX;
          wallNormalY = -wallNormalY;
        }
      }
    }

    const minDistance = wallThickness / 2 + buffer;

    if (closestDistance < minDistance && closestCorner) {
      // Push the entire cabinet away from the wall
      const pushDistance = minDistance - closestDistance + 10; // Extra safety margin
      const newX = x + wallNormalX * pushDistance;
      const newY = y + wallNormalY * pushDistance;

      // Make sure the new position is within room bounds
      const roomWidth = parseFloat(roomData.dimensions.width) * 12 * scale;
      const roomHeight = parseFloat(roomData.dimensions.height) * 12 * scale;
      const clampedX = Math.max(0, Math.min(newX, roomWidth - width));
      const clampedY = Math.max(0, Math.min(newY, roomHeight - depth));

      return { x: clampedX, y: clampedY };
    }
  }

  return null; // No push needed or possible
};
export const checkElementCollision = (
  elementX,
  elementY,
  elementWidth,
  elementHeight,
  draggedElement,
  allElements,
  elementTypes,
  scale
) => {
  const overlapBuffer = 5; // Allow 5px overlap (negative means elements can touch/slightly overlap)

  return allElements.some(otherElement => {
    // Skip self and non-cabinet elements
    if (otherElement.id === draggedElement.id || otherElement.category !== 'cabinet') {
      return false;
    }

    // Get element specifications for height information
    const draggedSpec = elementTypes[draggedElement.type];
    const otherSpec = elementTypes[otherElement.type];

    if (!draggedSpec || !otherSpec) {
      return false;
    }

    // Calculate heights and mount positions
    const draggedHeight = draggedElement.actualHeight || draggedSpec.fixedHeight || draggedSpec.defaultHeight;
    const draggedMountHeight = draggedElement.mountHeight || draggedSpec.mountHeight || 0;
    const draggedTopHeight = draggedMountHeight + draggedHeight;

    const otherHeight = otherElement.actualHeight || otherSpec.fixedHeight || otherSpec.defaultHeight;
    const otherMountHeight = otherElement.mountHeight || otherSpec.mountHeight || 0;
    const otherTopHeight = otherMountHeight + otherHeight;

    // Check if elements don't conflict vertically (can coexist at different heights)
    const verticalClearance = Math.max(
      draggedMountHeight - otherTopHeight,  // Distance from dragged bottom to other top
      otherMountHeight - draggedTopHeight   // Distance from other bottom to dragged top
    );

    // If there's sufficient vertical clearance (>= 3 inches), allow horizontal overlap
    if (verticalClearance >= 3) {
      return false; // No collision - elements at different heights
    }

    // Calculate other element's dimensions based on rotation
    const otherWidth = (otherElement.rotation === 0 || otherElement.rotation === 180) ? otherElement.width * scale : otherElement.depth * scale;
    const otherDepth = (otherElement.rotation === 0 || otherElement.rotation === 180) ? otherElement.depth * scale : otherElement.width * scale;

    // AABB collision detection with overlap buffer
    const collision = !(
      elementX + elementWidth < otherElement.x + overlapBuffer ||
      elementX > otherElement.x + otherWidth - overlapBuffer ||
      elementY + elementHeight < otherElement.y + overlapBuffer ||
      elementY > otherElement.y + otherDepth - overlapBuffer
    );

    return collision;
  });
};
export const checkRotatedRectCollision = (
  ax, ay, aWidth, aHeight, aRotation,
  bx, by, bWidth, bHeight, bRotation
) => {
  // For simplicity, we'll use a conservative approach:
  // Calculate the bounding box of the rotated clearance zone and check against that
  const angleRad = (bRotation || 0) * Math.PI / 180;

  // Calculate corners of rotated rectangle
  const halfWidth = bWidth / 2;
  const halfHeight = bHeight / 2;
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight }
  ];

  // Rotate corners and find bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  corners.forEach(corner => {
    const rotatedX = corner.x * Math.cos(angleRad) - corner.y * Math.sin(angleRad) + bx;
    const rotatedY = corner.x * Math.sin(angleRad) + corner.y * Math.cos(angleRad) + by;
    minX = Math.min(minX, rotatedX);
    maxX = Math.max(maxX, rotatedX);
    minY = Math.min(minY, rotatedY);
    maxY = Math.max(maxY, rotatedY);
  });

  // Check collision with expanded bounding box
  return !(ax + aWidth < minX ||
    ax > maxX ||
    ay + aHeight < minY ||
    ay > maxY);
};