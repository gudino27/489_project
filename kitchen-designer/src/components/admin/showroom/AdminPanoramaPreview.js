// AdminPanoramaPreview - Real-time 3D preview AND selection of swappable element masks
// Allows drawing masks directly in 3D for accurate positioning
import React, { useMemo, useRef, useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// FOV-based zoom controller for panorama viewing
// Changes field of view on scroll instead of moving camera position
const FovZoomController = ({ enabled = true, minFov = 20, maxFov = 100 }) => {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!enabled) return;

    const handleWheel = (event) => {
      event.preventDefault();

      // Adjust FOV based on scroll direction
      const delta = event.deltaY * 0.05;
      const newFov = Math.max(minFov, Math.min(maxFov, camera.fov + delta));

      camera.fov = newFov;
      camera.updateProjectionMatrix();
    };

    const canvas = gl.domElement;
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, camera, gl, minFov, maxFov]);

  return null;
};

// Convert 3D position on sphere back to UV coordinates
// This is the INVERSE of uvTo3D - used when clicking on the 3D sphere
// ACCOUNTS FOR texture.repeat.x = -1 flip
const positionToUV = (position, radius = 500) => {
  // Normalize position to unit sphere
  const normalized = position.clone().normalize();

  // Calculate phi (vertical angle from top, 0 to π)
  // y = radius * cos(phi), so phi = acos(y/radius)
  const phi = Math.acos(Math.max(-1, Math.min(1, normalized.y)));

  // Calculate theta (horizontal angle)
  // x = radius * sin(phi) * sin(theta)
  // z = radius * sin(phi) * cos(theta)
  // theta = atan2(x, z)
  let theta = Math.atan2(normalized.x, normalized.z);
  if (theta < 0) theta += Math.PI * 2; // Normalize to 0-2π

  // Convert back to UV - accounting for texture flip
  // With texture.repeat.x = -1, image u appears at theta = (1-u) * 2π
  // So: u = 1 - (theta / 2π)
  const u = 1 - (theta / (Math.PI * 2));
  const v = phi / Math.PI;

  console.log('[AdminPreview positionToUV]', {
    pos: { x: position.x.toFixed(1), y: position.y.toFixed(1), z: position.z.toFixed(1) },
    theta: theta.toFixed(3),
    phi: phi.toFixed(3),
    uv: { u: u.toFixed(4), v: v.toFixed(4) }
  });

  return { u, v };
};

// Convert UV coordinates to 3D position
// ACCOUNTS FOR texture.repeat.x = -1 flip
const uvTo3D = (u, v, radius = 500) => {
  // With texture flip: image u appears at theta = (1-u) * 2π
  // u=0 (left of image) → theta=2π ≈ 0 (looking at +Z)
  // u=0.5 (center) → theta=π (looking at -Z, initial camera direction)
  // u=1 (right of image) → theta=0 (back to +Z)
  const theta = (1 - u) * Math.PI * 2;
  const phi = v * Math.PI;

  const pos = new THREE.Vector3(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  );

  return pos;
};

// Calculate flat plane geometry from UV bounds
const calculatePlaneTransform = (uvBounds) => {
  const { minU, maxU, minV, maxV } = uvBounds;
  console.log('[AdminPreview calculatePlaneTransform] UV Bounds:', { minU, maxU, minV, maxV });

  const topLeft = uvTo3D(minU, minV);
  const topRight = uvTo3D(maxU, minV);
  const bottomLeft = uvTo3D(minU, maxV);
  const bottomRight = uvTo3D(maxU, maxV);

  const center = new THREE.Vector3()
    .add(topLeft)
    .add(topRight)
    .add(bottomLeft)
    .add(bottomRight)
    .divideScalar(4);

  const topWidth = topLeft.distanceTo(topRight);
  const bottomWidth = bottomLeft.distanceTo(bottomRight);
  const width = (topWidth + bottomWidth) / 2;

  const leftHeight = topLeft.distanceTo(bottomLeft);
  const rightHeight = topRight.distanceTo(bottomRight);
  const height = (leftHeight + rightHeight) / 2;

  const normal = center.clone().normalize().negate();

  const bottomCenter = bottomLeft.clone().add(bottomRight).divideScalar(2);
  const topCenter = topLeft.clone().add(topRight).divideScalar(2);
  const upDir = topCenter.clone().sub(bottomCenter).normalize();

  const rightDir = new THREE.Vector3().crossVectors(upDir, normal).normalize();
  const correctedUp = new THREE.Vector3().crossVectors(normal, rightDir).normalize();

  const rotationMatrix = new THREE.Matrix4().makeBasis(rightDir, correctedUp, normal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);

  const position = center.clone().add(normal.clone().multiplyScalar(2));

  console.log('[AdminPreview calculatePlaneTransform] Result:', {
    center: { x: center.x.toFixed(1), y: center.y.toFixed(1), z: center.z.toFixed(1) },
    position: { x: position.x.toFixed(1), y: position.y.toFixed(1), z: position.z.toFixed(1) },
    width: width.toFixed(1),
    height: height.toFixed(1)
  });

  return { position, quaternion, width, height };
};

// Clickable panorama sphere component for 3D selection
const ClickablePanoramaSphere = ({ imageUrl, isDrawMode, onPointClick }) => {
  const meshRef = useRef();
  const { raycaster, camera, gl } = useThree();

  const texture = useMemo(() => {
    if (!imageUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    // Flip texture horizontally for correct inside-sphere viewing
    tex.repeat.x = -1;
    return tex;
  }, [imageUrl]);

  const handleClick = useCallback((event) => {
    if (!isDrawMode || !onPointClick) return;

    // Get click position on sphere
    event.stopPropagation();
    const point = event.point;

    // Convert 3D position to UV
    const uv = positionToUV(point);
    onPointClick(uv);
  }, [isDrawMode, onPointClick]);

  if (!texture) return null;

  return (
    <mesh
      ref={meshRef}
      scale={[1, 1, 1]}
      onClick={handleClick}
      onPointerOver={() => {
        if (isDrawMode) {
          gl.domElement.style.cursor = 'crosshair';
        }
      }}
      onPointerOut={() => {
        gl.domElement.style.cursor = 'grab';
      }}
    >
      <sphereGeometry args={[500, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

// Non-interactive panorama sphere for preview only
const PanoramaSphere = ({ imageUrl }) => {
  const texture = useMemo(() => {
    if (!imageUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    // Flip texture horizontally for correct inside-sphere viewing
    tex.repeat.x = -1;
    return tex;
  }, [imageUrl]);

  if (!texture) return null;

  return (
    <mesh scale={[1, 1, 1]}>
      <sphereGeometry args={[500, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

// Single line segment as a tube mesh (for reliable rendering)
const TubeLine = ({ start, end, color, radius = 1.5 }) => {
  const tubeRef = useRef();

  const { position, quaternion, length } = useMemo(() => {
    const startVec = new THREE.Vector3(start[0], start[1], start[2]);
    const endVec = new THREE.Vector3(end[0], end[1], end[2]);
    const midpoint = startVec.clone().add(endVec).multiplyScalar(0.5);
    const direction = endVec.clone().sub(startVec);
    const len = direction.length();

    // Calculate rotation to align cylinder with line direction
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

    return {
      position: [midpoint.x, midpoint.y, midpoint.z],
      quaternion: quat,
      length: len
    };
  }, [start, end]);

  return (
    <mesh ref={tubeRef} position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

// Visual markers for clicked points during 3D selection
const PointMarkers = ({ points, highlightColor }) => {
  // Pre-calculate line positions (must be before any early returns for hooks rules)
  const lineSegments = useMemo(() => {
    if (!points || points.length < 2) return [];

    const segments = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length]; // Wrap to first point

      const pos1 = uvTo3D(p1.u, p1.v);
      const pos2 = uvTo3D(p2.u, p2.v);
      const inward1 = pos1.clone().normalize().multiplyScalar(-3);
      const inward2 = pos2.clone().normalize().multiplyScalar(-3);

      segments.push({
        start: [pos1.x + inward1.x, pos1.y + inward1.y, pos1.z + inward1.z],
        end: [pos2.x + inward2.x, pos2.y + inward2.y, pos2.z + inward2.z]
      });
    }
    return segments;
  }, [points]);

  // Early return after hooks
  if (!points || points.length === 0) return null;

  return (
    <group>
      {/* Point spheres */}
      {points.map((point, idx) => {
        const pos = uvTo3D(point.u, point.v);
        const inward = pos.clone().normalize().multiplyScalar(-5);
        const markerPos = pos.clone().add(inward);

        return (
          <mesh key={`point-${idx}`} position={[markerPos.x, markerPos.y, markerPos.z]}>
            <sphereGeometry args={[8, 16, 16]} />
            <meshBasicMaterial color={highlightColor || '#f59e0b'} />
          </mesh>
        );
      })}

      {/* Lines connecting points as tube meshes */}
      {lineSegments.map((seg, idx) => (
        <TubeLine
          key={`line-${idx}`}
          start={seg.start}
          end={seg.end}
          color={highlightColor || '#f59e0b'}
          radius={2}
        />
      ))}
    </group>
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
  let safety = remaining.length * 2; // Prevent infinite loop
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
        // Add triangle and remove the ear vertex
        triangles.push(prev, curr, next);
        remaining.splice(i, 1);
        earFound = true;
        break;
      }
    }

    // If no ear found, fall back to simple fan (shouldn't happen for valid polygons)
    if (!earFound) break;
  }

  // Add final triangle
  if (remaining.length === 3) {
    triangles.push(remaining[0], remaining[1], remaining[2]);
  }

  return triangles;
};

// Polygon overlay that follows exact clicked points (not bounding box)
const PolygonOverlay = ({ points, highlightColor, isPreview = false }) => {
  const geometry = useMemo(() => {
    if (!points || points.length < 3) return null;

    // Convert all points to 3D positions
    const positions3D = points.map(p => {
      const pos = uvTo3D(p.u, p.v);
      // Move slightly inward to prevent z-fighting
      const inward = pos.clone().normalize().multiplyScalar(-2);
      return pos.add(inward);
    });

    // Create vertices array
    const vertices = [];
    for (let i = 0; i < positions3D.length; i++) {
      vertices.push(positions3D[i].x, positions3D[i].y, positions3D[i].z);
    }

    // Use ear-clipping triangulation for proper concave polygon support
    const indices = triangulatePolygon(points);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [points]);

  const color = useMemo(() => {
    return new THREE.Color(highlightColor || '#f59e0b');
  }, [highlightColor]);

  // Border geometry (line loop around polygon)
  const borderPositions = useMemo(() => {
    if (!points || points.length < 3) return null;

    const positions = [];
    [...points, points[0]].forEach(p => {
      const pos = uvTo3D(p.u, p.v);
      const inward = pos.clone().normalize().multiplyScalar(-1);
      const linePos = pos.add(inward);
      positions.push(linePos.x, linePos.y, linePos.z);
    });

    return new Float32Array(positions);
  }, [points]);

  if (!geometry || !points || points.length < 3) return null;

  return (
    <group>
      {/* Filled polygon */}
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isPreview ? 0.4 : 0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Border outline */}
      {borderPositions && (
        <line renderOrder={2}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={points.length + 1}
              array={borderPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={color} linewidth={2} />
        </line>
      )}
    </group>
  );
};

// Preview overlay plane
const PreviewOverlay = ({ uvBounds, highlightColor }) => {
  const planeTransform = useMemo(() => {
    return calculatePlaneTransform(uvBounds);
  }, [uvBounds]);

  const color = useMemo(() => {
    return new THREE.Color(highlightColor || '#f59e0b');
  }, [highlightColor]);

  return (
    <group>
      {/* Main plane with semi-transparent fill */}
      <mesh
        position={planeTransform.position}
        quaternion={planeTransform.quaternion}
        renderOrder={1}
      >
        <planeGeometry args={[planeTransform.width, planeTransform.height]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Border outline */}
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
        <lineBasicMaterial color={color} linewidth={2} />
      </lineLoop>
    </group>
  );
};

// Calculate UV bounds from polygon points
const calculateBoundsFromPoints = (points) => {
  if (!points || points.length < 2) return null;
  const minU = Math.min(...points.map(p => p.u));
  const maxU = Math.max(...points.map(p => p.u));
  const minV = Math.min(...points.map(p => p.v));
  const maxV = Math.max(...points.map(p => p.v));
  return { minU, maxU, minV, maxV };
};

// Main preview component with optional 3D drawing mode
const AdminPanoramaPreview = ({
  panoramaUrl,
  uvBounds,
  highlightColor,
  elementName,
  existingElements = [],
  // New props for 3D drawing mode
  isDrawMode = false,
  drawingPoints = [],
  onPointAdded,
  onBoundsUpdate
}) => {
  const controlsRef = useRef();

  // Handle point click in 3D draw mode
  const handlePointClick = useCallback((uv) => {
    console.log('[AdminPreview] 3D Point clicked:', uv);
    if (onPointAdded) {
      onPointAdded(uv);
    }

    // Calculate and send bounds update
    if (onBoundsUpdate && drawingPoints) {
      const newPoints = [...drawingPoints, uv];
      const bounds = calculateBoundsFromPoints(newPoints);
      if (bounds) {
        onBoundsUpdate(bounds);
      }
    }
  }, [onPointAdded, onBoundsUpdate, drawingPoints]);

  // Calculate live bounds from drawing points
  const liveBounds = useMemo(() => {
    if (drawingPoints && drawingPoints.length >= 2) {
      return calculateBoundsFromPoints(drawingPoints);
    }
    return uvBounds;
  }, [drawingPoints, uvBounds]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-3 py-2 flex items-center justify-between">
        <span className="text-white text-sm font-medium">
          {isDrawMode ? '3D Selection Mode' : '3D Preview'}
        </span>
        <span className="text-gray-400 text-xs">
          {isDrawMode
            ? 'Click to add points • Scroll to zoom in/out'
            : 'Drag to rotate • Scroll to zoom in/out'}
        </span>
      </div>

      <div style={{ height: '400px' }}>
        <Canvas
          camera={{
            fov: 75,
            position: [0, 0, 0.01],
            near: 0.1,
            far: 1100
          }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            {/* Panorama sphere - clickable in draw mode */}
            <ClickablePanoramaSphere
              imageUrl={panoramaUrl}
              isDrawMode={isDrawMode}
              onPointClick={handlePointClick}
            />

            {/* Point markers when drawing */}
            {isDrawMode && drawingPoints && (
              <PointMarkers
                points={drawingPoints}
                highlightColor={highlightColor || '#f59e0b'}
              />
            )}

            {/* Current element overlay - show outline only while drawing to avoid fill artifacts */}
            {/* The filled polygon will be shown after saving */}

            {/* Existing elements - show as outlines to avoid fill artifacts on curved surface */}
            {existingElements.map((el) => {
              // Check if element has polygon points
              let polygonPoints = el.polygon_points;
              if (typeof polygonPoints === 'string') {
                try {
                  polygonPoints = JSON.parse(polygonPoints);
                } catch (e) {
                  polygonPoints = null;
                }
              }

              if (polygonPoints && Array.isArray(polygonPoints) && polygonPoints.length >= 3) {
                // Use PointMarkers to show outline only (no fill artifacts)
                return (
                  <PointMarkers
                    key={el.id}
                    points={polygonPoints}
                    highlightColor="#3b82f6"
                  />
                );
              }

              // Fall back to bounding box for old elements
              const bounds = typeof el.uv_bounds === 'string'
                ? JSON.parse(el.uv_bounds)
                : el.uv_bounds;
              return (
                <PreviewOverlay
                  key={el.id}
                  uvBounds={bounds}
                  highlightColor="#3b82f6"
                />
              );
            })}
          </Suspense>

          {/* FOV-based zoom for panorama viewing - works in draw mode too */}
          <FovZoomController enabled={true} minFov={20} maxFov={100} />

          {/* Orbit controls - rotation only, zoom handled by FovZoomController */}
          <OrbitControls
            ref={controlsRef}
            enableZoom={false}
            enablePan={false}
            rotateSpeed={-0.5}
            minDistance={0.01}
            maxDistance={0.01}
            enabled={!isDrawMode}
            target={[0, 0, -0.001]}
          />

          <ambientLight intensity={1} />
        </Canvas>
      </div>

      {/* Info bar */}
      <div className="bg-gray-800 px-3 py-2 text-xs text-gray-400">
        {isDrawMode ? (
          <span>
            <span className="text-amber-400">{drawingPoints?.length || 0} points</span>
            {' • Click to add points • Zoom in for precise corners'}
          </span>
        ) : elementName ? (
          <span>
            Previewing: <span className="text-amber-400">{elementName}</span>
          </span>
        ) : (
          <span>Select an area on the panorama to see 3D preview</span>
        )}
      </div>
    </div>
  );
};

export default AdminPanoramaPreview;
