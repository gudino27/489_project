// SwappableOverlay - Renders material overlays in 3D space
// Uses Three.js ShapeGeometry for proper polygon triangulation on curved surfaces
import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';

// Convert UV coordinates (from equirectangular panorama) to 3D position on sphere
// ACCOUNTS FOR texture.repeat.x = -1 flip used in PanoramaSphere
const uvTo3D = (u, v, radius = 500) => {
  // The panorama texture has repeat.x = -1 (horizontal flip for inside viewing)
  // With texture flip: image u appears at theta = (1-u) * 2π
  // u=0 (left of image) → theta=2π ≈ 0 (looking at +Z)
  // u=0.5 (center) → theta=π (looking at -Z, initial camera direction)
  // u=1 (right of image) → theta=0 (back to +Z)
  const theta = (1 - u) * Math.PI * 2;
  const phi = v * Math.PI;

  // Standard spherical to Cartesian conversion
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  );
};

// Ear-clipping triangulation for proper concave polygon support
// Works on 2D UV coordinates, returns triangle indices
const triangulatePolygon = (uvPoints) => {
  if (uvPoints.length < 3) return [];
  if (uvPoints.length === 3) return [0, 1, 2];

  // Helper: calculate signed area of triangle (for winding order)
  const signedArea = (p1, p2, p3) => {
    return (p2.u - p1.u) * (p3.v - p1.v) - (p3.u - p1.u) * (p2.v - p1.v);
  };

  // Helper: check if point is inside triangle
  const pointInTriangle = (p, a, b, c) => {
    const d1 = signedArea(p, a, b);
    const d2 = signedArea(p, b, c);
    const d3 = signedArea(p, c, a);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  };

  // Determine polygon winding (clockwise or counter-clockwise)
  let totalArea = 0;
  for (let i = 0; i < uvPoints.length; i++) {
    const j = (i + 1) % uvPoints.length;
    totalArea += uvPoints[i].u * uvPoints[j].v;
    totalArea -= uvPoints[j].u * uvPoints[i].v;
  }
  const isClockwise = totalArea < 0;

  // Create working list of vertex indices
  const remaining = uvPoints.map((_, i) => i);
  const triangles = [];

  // Ear clipping loop
  let safety = remaining.length * 2;
  while (remaining.length > 3 && safety-- > 0) {
    let earFound = false;

    for (let i = 0; i < remaining.length; i++) {
      const prev = remaining[(i - 1 + remaining.length) % remaining.length];
      const curr = remaining[i];
      const next = remaining[(i + 1) % remaining.length];

      const pPrev = uvPoints[prev];
      const pCurr = uvPoints[curr];
      const pNext = uvPoints[next];

      // Check if this is a convex vertex (potential ear)
      const cross = signedArea(pPrev, pCurr, pNext);
      const isConvex = isClockwise ? cross < 0 : cross > 0;

      if (!isConvex) continue;

      // Check if any other vertex is inside this triangle
      let isEar = true;
      for (let j = 0; j < remaining.length; j++) {
        const testIdx = remaining[j];
        if (testIdx === prev || testIdx === curr || testIdx === next) continue;
        if (pointInTriangle(uvPoints[testIdx], pPrev, pCurr, pNext)) {
          isEar = false;
          break;
        }
      }

      if (isEar) {
        triangles.push(prev, curr, next);
        remaining.splice(i, 1);
        earFound = true;
        break;
      }
    }

    if (!earFound) break;
  }

  // Add final triangle
  if (remaining.length === 3) {
    triangles.push(remaining[0], remaining[1], remaining[2]);
  }

  return triangles;
};

// Handle polygon that crosses the u=0/u=1 seam (panorama wrap-around)
// Returns adjusted points where all u values are in a continuous range
const handlePolygonWrapAround = (points) => {
  if (!points || points.length < 3) return points;

  // Find min and max u values
  const uValues = points.map(p => p.u);
  const minU = Math.min(...uValues);
  const maxU = Math.max(...uValues);
  const uRange = maxU - minU;

  // If the u range is less than 0.5, no wrap-around issue
  if (uRange < 0.5) {
    return points;
  }

  // Check if we have points on both extremes (near 0 and near 1)
  const hasLowU = uValues.some(u => u < 0.3);
  const hasHighU = uValues.some(u => u > 0.7);

  if (!hasLowU || !hasHighU) {
    return points;
  }

  // Calculate which way to shift: add 1 to low values or subtract 1 from high values
  // Shift whichever group is smaller (fewer points)
  const lowPointCount = uValues.filter(u => u < 0.5).length;
  const highPointCount = uValues.filter(u => u >= 0.5).length;

  let adjusted;
  if (lowPointCount <= highPointCount) {
    // Shift low u values up by 1
    adjusted = points.map(p => ({
      ...p,
      u: p.u < 0.5 ? p.u + 1.0 : p.u
    }));
  } else {
    // Shift high u values down by 1
    adjusted = points.map(p => ({
      ...p,
      u: p.u >= 0.5 ? p.u - 1.0 : p.u
    }));
  }

  return adjusted;
};

// Create filled polygon geometry using ear-clipping triangulation
// Creates flat triangles that match the outline's straight chord connections
const createFilledPolygonGeometry = (originalPoints) => {
  if (!originalPoints || originalPoints.length < 3) return null;

  // Handle wrap-around polygons (crossing u=0/u=1 seam)
  const points = handlePolygonWrapAround(originalPoints);

  // Calculate UV bounding box for texture mapping
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const p of points) {
    minU = Math.min(minU, p.u);
    maxU = Math.max(maxU, p.u);
    minV = Math.min(minV, p.v);
    maxV = Math.max(maxV, p.v);
  }
  const width = maxU - minU;
  const height = maxV - minV;

  // Use ear-clipping to triangulate the polygon
  const triangleIndices = triangulatePolygon(points);

  if (triangleIndices.length < 3) {
    return null;
  }

  // Convert polygon vertices to 3D positions
  // Use the same positions as the outline for exact alignment
  const vertices = [];
  const uvs = [];

  for (const p of points) {
    const pos = uvTo3D(p.u, p.v);
    // Move inward - match the line depth (-3) for exact alignment with outline
    const inward = pos.clone().normalize().multiplyScalar(-3);
    pos.add(inward);

    vertices.push(pos.x, pos.y, pos.z);

    // UV for texture mapping
    const texU = (p.u - minU) / width;
    const texV = 1 - ((p.v - minV) / height);
    uvs.push(texU, texV);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(triangleIndices);
  geometry.computeVertexNormals();

  return geometry;
};

// Calculate flat plane geometry from UV bounds
const calculatePlaneTransform = (uvBounds) => {
  const { minU, maxU, minV, maxV } = uvBounds;

  // Get the 4 corners in 3D space
  const topLeft = uvTo3D(minU, minV);
  const topRight = uvTo3D(maxU, minV);
  const bottomLeft = uvTo3D(minU, maxV);
  const bottomRight = uvTo3D(maxU, maxV);

  // Calculate center position (average of corners)
  const center = new THREE.Vector3()
    .add(topLeft)
    .add(topRight)
    .add(bottomLeft)
    .add(bottomRight)
    .divideScalar(4);

  // Calculate plane dimensions
  // Width: average of top and bottom edge lengths
  const topWidth = topLeft.distanceTo(topRight);
  const bottomWidth = bottomLeft.distanceTo(bottomRight);
  const width = (topWidth + bottomWidth) / 2;

  // Height: average of left and right edge lengths
  const leftHeight = topLeft.distanceTo(bottomLeft);
  const rightHeight = topRight.distanceTo(bottomRight);
  const height = (leftHeight + rightHeight) / 2;

  // Calculate plane orientation
  // Normal should point toward center (inward for inside-sphere viewing)
  const normal = center.clone().normalize().negate();

  // Calculate up vector (approximate vertical in plane's local space)
  // Use the direction from bottom to top center
  const bottomCenter = bottomLeft.clone().add(bottomRight).divideScalar(2);
  const topCenter = topLeft.clone().add(topRight).divideScalar(2);
  const upDir = topCenter.clone().sub(bottomCenter).normalize();

  // Calculate right vector
  const rightDir = new THREE.Vector3().crossVectors(upDir, normal).normalize();

  // Recalculate up to ensure orthogonality
  const correctedUp = new THREE.Vector3().crossVectors(normal, rightDir).normalize();

  // Create rotation matrix from these vectors
  const rotationMatrix = new THREE.Matrix4().makeBasis(rightDir, correctedUp, normal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);

  // Move center slightly toward camera (inward) to prevent z-fighting
  const position = center.clone().add(normal.clone().multiplyScalar(2));

  return {
    position,
    quaternion,
    width,
    height,
    corners: { topLeft, topRight, bottomLeft, bottomRight }
  };
};

const SwappableOverlay = ({
  element,
  material,
  onClick,
  apiUrl
}) => {
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [texture, setTexture] = useState(null);

  // Parse polygon points from element (new 3D selection method)
  const polygonPoints = useMemo(() => {
    let points = element.polygon_points;
    if (typeof points === 'string') {
      try {
        points = JSON.parse(points);
      } catch (e) {
        points = null;
      }
    }
    return (points && Array.isArray(points) && points.length >= 3) ? points : null;
  }, [element.polygon_points, element.id]);

  // Parse UV bounds from element (legacy bounding box method)
  const uvBounds = useMemo(() => {
    let bounds = element.uv_bounds;
    if (typeof bounds === 'string') {
      try {
        bounds = JSON.parse(bounds);
      } catch (e) {
        bounds = { minU: 0, maxU: 1, minV: 0, maxV: 1 };
      }
    }
    return bounds || { minU: 0, maxU: 1, minV: 0, maxV: 1 };
  }, [element.uv_bounds]);

  // Calculate plane transform from UV bounds (used when no polygon points)
  const planeTransform = useMemo(() => {
    return calculatePlaneTransform(uvBounds);
  }, [uvBounds]);

  // Create filled polygon geometry that follows sphere surface
  const polygonGeometry = useMemo(() => {
    if (!polygonPoints) return null;
    return createFilledPolygonGeometry(polygonPoints);
  }, [polygonPoints]);

  // Load texture when material changes
  useEffect(() => {
    if (material?.texture_url) {
      const textureUrl = material.texture_url.startsWith('http')
        ? material.texture_url
        : `${apiUrl}${material.texture_url}`;

      const loader = new THREE.TextureLoader();
      loader.load(textureUrl, (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.colorSpace = THREE.SRGBColorSpace;

        // Apply texture repeat
        const repeatX = material?.repeat_scale_x || 1.0;
        const repeatY = material?.repeat_scale_y || 1.0;
        loadedTexture.repeat.set(repeatX, repeatY);

        setTexture(loadedTexture);
      }, undefined, (error) => {
        console.warn('Failed to load overlay texture:', error);
        setTexture(null);
      });
    } else {
      setTexture(null);
    }
  }, [material, apiUrl]);

  // Parse highlight color
  const highlightColor = useMemo(() => {
    const hex = element.highlight_color || '#f59e0b';
    return new THREE.Color(hex);
  }, [element.highlight_color]);

  // Parse fallback color from material
  const fallbackColor = useMemo(() => {
    if (material?.color_hex) {
      return new THREE.Color(material.color_hex);
    }
    return new THREE.Color('#cccccc');
  }, [material]);

  // Create material for the flat plane
  const planeMaterial = useMemo(() => {
    if (!material && !isHovered) {
      // No material selected - show subtle highlight so area is visible
      return new THREE.MeshBasicMaterial({
        color: highlightColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
    }

    if (!material && isHovered) {
      // Hovered but no material - show highlight
      return new THREE.MeshBasicMaterial({
        color: highlightColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
    }

    // Has material
    if (texture) {
      return new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: isHovered ? 1.0 : 0.95,
        side: THREE.DoubleSide
      });
    } else {
      return new THREE.MeshBasicMaterial({
        color: fallbackColor,
        transparent: true,
        opacity: isHovered ? 1.0 : 0.95,
        side: THREE.DoubleSide
      });
    }
  }, [material, texture, isHovered, highlightColor, fallbackColor]);

  // Create border geometry for highlight effect
  const borderMaterial = useMemo(() => {
    if (!isHovered) return null;
    return new THREE.LineBasicMaterial({
      color: highlightColor,
      linewidth: 3
    });
  }, [isHovered, highlightColor]);

  // Render filled polygon (no outline in production for cleaner look)
  if (polygonPoints && polygonGeometry) {
    return (
      <mesh
        ref={meshRef}
        geometry={polygonGeometry}
        renderOrder={1}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <primitive object={planeMaterial} attach="material" />
      </mesh>
    );
  }

  // Fallback: Render bounding box plane (legacy method)
  return (
    <group>
      {/* Main overlay plane */}
      <mesh
        ref={meshRef}
        position={planeTransform.position}
        quaternion={planeTransform.quaternion}
        renderOrder={1}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <planeGeometry args={[planeTransform.width, planeTransform.height]} />
        <primitive object={planeMaterial} attach="material" />
      </mesh>

      {/* Highlight border when hovered */}
      {isHovered && borderMaterial && (
        <lineLoop
          position={planeTransform.position}
          quaternion={planeTransform.quaternion}
          renderOrder={2}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={4}
              array={new Float32Array([
                -planeTransform.width/2, -planeTransform.height/2, 0.1,
                planeTransform.width/2, -planeTransform.height/2, 0.1,
                planeTransform.width/2, planeTransform.height/2, 0.1,
                -planeTransform.width/2, planeTransform.height/2, 0.1
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <primitive object={borderMaterial} attach="material" />
        </lineLoop>
      )}

      {/* Show subtle outline when no material is selected */}
      {!material && (
        <lineLoop
          position={planeTransform.position}
          quaternion={planeTransform.quaternion}
          renderOrder={2}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={4}
              array={new Float32Array([
                -planeTransform.width/2, -planeTransform.height/2, 0.1,
                planeTransform.width/2, -planeTransform.height/2, 0.1,
                planeTransform.width/2, planeTransform.height/2, 0.1,
                -planeTransform.width/2, planeTransform.height/2, 0.1
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={highlightColor}
            transparent
            opacity={isHovered ? 0.9 : 0.5}
          />
        </lineLoop>
      )}
    </group>
  );
};

export default SwappableOverlay;
