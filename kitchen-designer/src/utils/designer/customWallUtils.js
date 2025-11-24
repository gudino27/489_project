export const snapCabinetToCustomWall = (
  x,
  y,
  width,
  depth,
  customWalls,
  activeWalls,
  excludeId = null
) => {
  const snapDistance = 8;
  let bestSnap = { x, y, snapped: false };
  let minDistance = snapDistance + 1;

  for (const wall of customWalls) {
    // Skip walls that are not currently active in the room
    if (!(activeWalls || []).includes(wall.wallNumber)) continue;

    // Calculate wall angle
    const wallAngle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

    // Calculate cabinet center position
    const cabinetCenterX = x + width / 2;
    const cabinetCenterY = y + depth / 2;

    // Find closest point on wall to cabinet center
    const wallLength = Math.sqrt(
      Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2)
    );

    // Calculate parametric t value (0 to 1) for closest point on wall segment
    const t = Math.max(
      0,
      Math.min(
        1,
        ((cabinetCenterX - wall.x1) * (wall.x2 - wall.x1) +
          (cabinetCenterY - wall.y1) * (wall.y2 - wall.y1)) /
          (wallLength * wallLength)
      )
    );

    // Calculate closest point on wall
    const closestX = wall.x1 + t * (wall.x2 - wall.x1);
    const closestY = wall.y1 + t * (wall.y2 - wall.y1);

    // Calculate distance from cabinet center to closest wall point
    const distance = Math.sqrt(
      Math.pow(cabinetCenterX - closestX, 2) +
        Math.pow(cabinetCenterY - closestY, 2)
    );

    // If this is the closest wall within snap distance
    if (distance < minDistance) {
      // Calculate offset distance: wall thickness + cabinet size + small gap
      const offsetDistance =
        wall.thickness / 2 + Math.min(width, depth) / 2 + 2;

      // Calculate normal vector perpendicular to wall
      const normalX = -Math.sin(wallAngle);
      const normalY = Math.cos(wallAngle);

      // Calculate snapped cabinet center position
      const snappedCenterX = closestX + normalX * offsetDistance;
      const snappedCenterY = closestY + normalY * offsetDistance;

      // Convert to top-left corner position
      bestSnap = {
        x: snappedCenterX - width / 2,
        y: snappedCenterY - depth / 2,
        snapped: true,
        wallAngle: (wallAngle * 180) / Math.PI, // Convert to degrees
      };

      minDistance = distance;
    }
  }

  return bestSnap;
};