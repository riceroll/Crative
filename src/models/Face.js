import React, { useContext } from 'react';
import Board from './Board';
import Strip from './Strip'; // Import Strip component
import Cube from './Cube';
import { ModelContext } from '../store/ModelContext';
import { assemblyDisplacement } from '../configs/globalConfigs';
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

// Helper function to calculate the explosion axis for strips in this face
function calculateExplosionAxis(stripsMap) {
  // We need to find the direction along which strips are aligned (strip-to-strip direction)
  // This is perpendicular to the board alignment within each strip
  
  if (stripsMap.size < 2) {
    // If there's only one strip, use default
    return [0, 0, 1];
  }
  
  // Get the positions of the first board from each strip to determine strip alignment
  const stripPositions = [];
  
  for (let [stripKey, boardsInStrip] of stripsMap) {
    if (boardsInStrip.length > 0 && boardsInStrip[0].position) {
      // Sort boards within strip by id_1 and take the first one
      const sortedBoards = [...boardsInStrip].sort((a, b) => (a.id_1 || 0) - (b.id_1 || 0));
      stripPositions.push({
        stripKey,
        position: sortedBoards[0].position
      });
    }
  }
  
  if (stripPositions.length < 2) {
    return [0, 0, 1];
  }
  
  // Sort strips by their id_0 to get proper strip ordering
  stripPositions.sort((a, b) => a.stripKey - b.stripKey);
  
  // Calculate the direction between strips (strip alignment direction)
  const firstStripPos = stripPositions[0].position;
  const lastStripPos = stripPositions[stripPositions.length - 1].position;
  
  const stripAlignmentVector = [
    lastStripPos[0] - firstStripPos[0],
    lastStripPos[1] - firstStripPos[1],
    lastStripPos[2] - firstStripPos[2]
  ];
  
  // Find the dominant axis of strip alignment
  const absX = Math.abs(stripAlignmentVector[0]);
  const absY = Math.abs(stripAlignmentVector[1]);
  const absZ = Math.abs(stripAlignmentVector[2]);
  
  // The explosion axis should be along the strip alignment direction
  // (strips move apart along the direction they're arranged in)
  if (absX > absY && absX > absZ) {
    return stripAlignmentVector[0] > 0 ? [1, 0, 0] : [-1, 0, 0];
  } else if (absY > absX && absY > absZ) {
    return stripAlignmentVector[1] > 0 ? [0, 1, 0] : [0, -1, 0];
  } else {
    return stripAlignmentVector[2] > 0 ? [0, 0, 1] : [0, 0, -1];
  }
}


export default function Face({ name, progress, boards, position, rotation, thickness, ...props }) {
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


  // calculate current position
  let finalPos = position.slice();
  let initialPos = finalPos.slice();


  let assemblyDisplacementVector = new THREE.Vector3(
    0,
    0,
    1
  );

  // Apply rotation to the displacement vector
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2], 'ZYX'));
  assemblyDisplacementVector.applyMatrix4(rotationMatrix);

  // Add the displacement to the initial position
  initialPos[0] += assemblyDisplacementVector.x * assemblyDisplacement;
  initialPos[1] += assemblyDisplacementVector.y * assemblyDisplacement;
  initialPos[2] += assemblyDisplacementVector.z * assemblyDisplacement;

  // get the current positon with progress

  let stripProgress = progress <= 0.5? progress * 2 : 1.0;
  let faceProgress = progress > 0.5? (progress - 0.5) * 2 : 0.0;

  let currentPos = [0, 0, 0];
  currentPos[0] = initialPos[0] + (finalPos[0] - initialPos[0]) * faceProgress;
  currentPos[1] = initialPos[1] + (finalPos[1] - initialPos[1]) * faceProgress;
  currentPos[2] = initialPos[2] + (finalPos[2] - initialPos[2]) * faceProgress;
  
  // --- Process boards into strips ---
  const stripsMap = new Map();
  if (boards && Array.isArray(boards)) {
    boards.forEach(board => {
      const stripKey = board.id_0 !== undefined ? board.id_0 : 0;
      if (!stripsMap.has(stripKey)) {
        stripsMap.set(stripKey, []);
      }
      stripsMap.get(stripKey).push(board);
    });
  }

  // --- Calculate explosion axis based on strip alignment ---
  const faceExplosionAxis = calculateExplosionAxis(stripsMap);

  console.log('Face Explosion Axis:', faceExplosionAxis);


  const processedStrips = [];
  // Sort strip keys to ensure consistent stripIndex if keys are numeric and represent order
  const sortedStripKeys = Array.from(stripsMap.keys()).sort((a, b) => a - b);
  const totalStripsOnFace = sortedStripKeys.length;

  sortedStripKeys.forEach((stripKey, index) => {
    const boardsInOriginalStrip = stripsMap.get(stripKey);
    // Sort boards within the strip by id_1
    boardsInOriginalStrip.sort((a, b) => (a.id_1 || 0) - (b.id_1 || 0));

    let stripFinalPosition = [0, 0, 0];
    if (boardsInOriginalStrip.length > 0 && boardsInOriginalStrip[0].position) {
      stripFinalPosition = boardsInOriginalStrip[0].position.slice();
    }
    
    const stripOwnRotation = [0, 0, 0]; 

    const boardsForThisStrip = boardsInOriginalStrip.map(board => {
      const boardGlobalPos = board.position || [0,0,0];
      const relativePos = [
        boardGlobalPos[0] - stripFinalPosition[0],
        boardGlobalPos[1] - stripFinalPosition[1],
        boardGlobalPos[2] - stripFinalPosition[2],
      ];
      return {
        ...board,
        position: relativePos,
      };
    });


    processedStrips.push({
      id: stripKey, // Keep original ID for keying if needed
      stripIndex: index, // Sequential index for animation order
      totalStrips: totalStripsOnFace,
      boardsInStrip: boardsForThisStrip,
      position: stripFinalPosition,
      rotation: stripOwnRotation,
    });
  });
  // --- End of strip processing ---

  return (
    <group position={currentPos} rotation={rotation} {...props}>
      {/* Render Strips */}
      {processedStrips.map((stripData) => (
        <Strip
          key={`${name}-strip-${stripData.id}`} // Use original id for key
          name={`${name}-strip-${stripData.id}`}
          progress={stripProgress}                 // Pass Face's progress down
          stripIndex={stripData.stripIndex}   // NEW: Index of this strip
          totalStrips={stripData.totalStrips} // NEW: Total strips in this face
          explosionAxis={faceExplosionAxis}   // NEW: Direction for initial displacement
          boardsInStrip={stripData.boardsInStrip}
          position={stripData.position}       // Strip's final position relative to this Face group
          rotation={stripData.rotation}       // Strip's final rotation relative to this Face group
        />
      ))}
      
      {/* Render cubes at corners (remains unchanged) */}
      {cornersToRender.map((corner, index) => (
        <Cube
          key={`${name}-corner-${index}`}
          position={corner.localPos}
          rotation={[0, 0, 0]} // Assuming cubes don't have specific rotation from this logic
        />
      ))}
    </group>
  );
}