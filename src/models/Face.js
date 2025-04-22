import React, { useContext } from 'react';
import Board from './Board';
import Cube from './Cube';
import { ModelContext } from '../store/ModelContext';
import * as THREE from 'three'; // Import THREE.js for matrix operations

// Helper function to rotate a point around a center
function rotatePoint(point, rotation, center = [0, 0, 0]) {
  // Create a Three.js matrix for the rotation
  const matrix = new THREE.Matrix4();
  
  // Apply rotations in the correct order
  const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2], 'ZYX');
  matrix.makeRotationFromEuler(euler);
  
  // Create vectors for the operation
  const pointVec = new THREE.Vector3(
    point[0] - center[0],
    point[1] - center[1],
    point[2] - center[2]
  );
  
  // Apply rotation
  pointVec.applyMatrix4(matrix);
  
  // Return rotated point, adding back the center
  return [
    pointVec.x + center[0],
    pointVec.y + center[1],
    pointVec.z + center[2]
  ];
}

function arePointsClose(point1, point2, epsilon = 0.1) {
  return (
    Math.abs(point1[0] - point2[0]) < epsilon &&
    Math.abs(point1[1] - point2[1]) < epsilon &&
    Math.abs(point1[2] - point2[2]) < epsilon
  );
}


// Helper to determine which face owns a corner or edge
function shouldFaceRenderCorner(faceName, cornerPos) {
  // Define which face is responsible for which corners/edges
  // based on the corner's position relative to the origin
  
  // For corners at [±X, ±Y, ±Z]:
  // - front (+Z) face: handles corners where Z > 0 
  // - right (+X) face: handles corners where Z <= 0 and X > 0
  // - left (-X) face: handles corners where Z <= 0, X <= 0, and Y > 0
  // - bottom (-Y) face: handles all remaining corners (Z <= 0, X <= 0, Y <= 0)
  
  // This ensures each corner is rendered by exactly one face
  
  const [x, y, z] = cornerPos;
  const epsilon = 0.1; // Small tolerance for floating point comparison
  
  switch(faceName) {
    case 'front':
      return z > -epsilon; // Front face handles all corners with Z >= 0
      
    case 'right':
      return z <= epsilon && x > -epsilon; // Right face handles corners with Z < 0 and X >= 0
      
    case 'left':
      return z <= epsilon && x <= epsilon && y > -epsilon; // Left handles Z < 0, X < 0, Y >= 0
      
    case 'back':
      return false; // Back doesn't render any corners (handled by others)
      
    case 'top':
      return false; // Top doesn't render any corners (handled by others)
      
    case 'bottom':
      return z <= epsilon && x <= epsilon && y <= epsilon; // Bottom handles remaining corners
      
    default:
      return false;
  }
}


export default function Face({ name, boards, position, rotation, thickness, ...props }) {
  const models = useContext(ModelContext);
  
  // Early return if no boards
  if (!boards || !Array.isArray(boards) || boards.length === 0) {
    console.warn(`No boards for face ${name}`);
    return (
      <group position={position} rotation={rotation} {...props}>
        {/* Optional: Add a placeholder for empty faces */}
      </group>
    );
  }
  
  // Calculate board corners and create a set to deduplicate them
  const cornerSet = new Set();
  
  // First pass: find overall face boundaries and calculate all corners
  boards.forEach((board) => {
    if (!board.position) return;
    
    const [x, y, z] = board.position;
    const boardRotation = board.rotation || [0, 0, 0];
    
    // Use the width and height directly from the board object
    const boardWidth = board.width || 5; // Fallback to 5 if not provided
    const boardHeight = board.height || 5; // Fallback to 5 if not provided
    
    const halfWidth = boardWidth / 2;
    const halfHeight = boardHeight / 2;
    
    // Calculate all four corners (unrotated positions relative to board center)
    const unrotatedCorners = [
      [x - halfWidth - thickness / 2, y - halfHeight - thickness / 2, z + thickness / 2], // bottom-left
      [x + halfWidth + thickness / 2, y - halfHeight - thickness / 2, z + thickness / 2], // bottom-right
      [x + halfWidth + thickness / 2, y + halfHeight + thickness / 2, z + thickness / 2], // top-right
      [x - halfWidth - thickness / 2, y + halfHeight + thickness / 2, z + thickness / 2]  // top-left
    ];
    
    // Apply board rotation to each corner
    const rotatedCorners = unrotatedCorners.map(corner => 
      rotatePoint(corner, boardRotation, [x, y, z])
    );
    
    // Add rotated corners to the set
    rotatedCorners.forEach(corner => {
      cornerSet.add(JSON.stringify(corner.map(v => Math.round(v * 100) / 100))); // Round to 2 decimal places
    });
  });
  
  // Second pass: filter out near-duplicates
  const uniqueCorners = [];
  [...cornerSet].forEach(cornerStr => {
    const cornerPos = JSON.parse(cornerStr);
    // Check if this corner is too close to any already-accepted corner
    const isDuplicate = uniqueCorners.some(existingCorner => 
      arePointsClose(cornerPos, JSON.parse(existingCorner))
    );
    
    if (!isDuplicate) {
      uniqueCorners.push(cornerStr);
    }
  });


  // Third pass: filter out corners and edges (which will be handled at crate level)
  const cornersToRender = [];

  // Parse all corner positions
  const allCornerPositions = uniqueCorners.map(cornerStr => JSON.parse(cornerStr));

  // Find min and max for each coordinate across all corners
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  allCornerPositions.forEach(pos => {
    minX = Math.min(minX, pos[0]);
    maxX = Math.max(maxX, pos[0]);
    minY = Math.min(minY, pos[1]);
    maxY = Math.max(maxY, pos[1]);
    minZ = Math.min(minZ, pos[2]);
    maxZ = Math.max(maxZ, pos[2]);
  });

  // Identify the face's plane dimension (the one with min ≈ max)
  const epsilon = 0.2;
  const xRange = maxX - minX;
  const yRange = maxY - minY;
  const zRange = maxZ - minZ;

  // Identify which dimension has the smallest range (that's our face plane)
  const minRange = Math.min(xRange, yRange, zRange);
  // The other two dimensions define the bounds of the face
  let facePlaneAxis = null;
  if (minRange === xRange) facePlaneAxis = 'x';
  else if (minRange === yRange) facePlaneAxis = 'y';
  else facePlaneAxis = 'z';

  // For each corner, check if it's at an edge/corner of the face
  uniqueCorners.forEach(cornerStr => {
    const cornerPos = JSON.parse(cornerStr);
    
    // Count how many coordinates are at extremes
    let extremeCoordinateCount = 0;
    
    // Check X coordinate (if it's not the face plane dimension)
    if (facePlaneAxis !== 'x') {
      if (Math.abs(cornerPos[0] - minX) < epsilon || Math.abs(cornerPos[0] - maxX) < epsilon) {
        extremeCoordinateCount++;
      }
    }
    
    // Check Y coordinate (if it's not the face plane dimension)
    if (facePlaneAxis !== 'y') {
      if (Math.abs(cornerPos[1] - minY) < epsilon || Math.abs(cornerPos[1] - maxY) < epsilon) {
        extremeCoordinateCount++;
      }
    }
    
    // Check Z coordinate (if it's not the face plane dimension)
    if (facePlaneAxis !== 'z') {
      if (Math.abs(cornerPos[2] - minZ) < epsilon || Math.abs(cornerPos[2] - maxZ) < epsilon) {
        extremeCoordinateCount++;
      }
    }
    
    // If the corner has less than 2 coordinates at extremes, it's an interior corner
    // (If it has 2, it's at an edge; if it has 3, it's at a corner of the crate)
    const isInteriorCorner = extremeCoordinateCount < 1;
    
    if (isInteriorCorner) {
      cornersToRender.push({
        localPos: cornerPos
      });
    }
  });

  
  return (
    <group position={position} rotation={rotation} {...props}>
      {/* Render all boards */}
      {boards.map((board, index) => (
        <Board
          key={`${name}-board-${index}`}
          type={board.type}
          position={board.position}
          rotation={board.rotation || [0, 0, 0]}
        />
      ))}
      
      {/* Render cubes at corners */}
      {cornersToRender.map((corner, index) => (
        <Cube
          key={`${name}-corner-${index}`}
          position={corner.localPos}
          rotation={[0, 0, 0]}
        />
      ))}
    </group>
  );
}