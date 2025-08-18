import React, { useContext } from 'react';
import Board from './Board';
import Strip from './Strip'; // Import Strip component
import Cube from './Cube';
import { ModelContext } from '../store/ModelContext';
import { CrateContext } from '../store/CrateContext';
import { assemblyDisplacement } from '../configs/globalConfigs';
import { getPhaseProgress } from '../utils/animation'; // Import the animation utility
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



export default function Face({ 
  name,
  progress, 
  boards, 
  final_position, 
  final_rotation, 
  initial_position,
  initial_rotation,
  flat_position,
  flat_rotation,  
  thickness
}) {
  const models = useContext(ModelContext);

  const { setFocusPosition } = useContext(CrateContext);


  // #region Define and calculate progress for each phase
  const phaseProportions = {
    'strips': 0.6,
    'cubes': 0.2,
    'pre_move': 0.1,
    'final_move': 0.1
  };
  
  const { stripsProgress, cubesProgress, preMoveProgress, finalMoveProgress } = React.useMemo(() => ({
    stripsProgress: getPhaseProgress(phaseProportions, progress, 'strips'),
    cubesProgress: getPhaseProgress(phaseProportions, progress, 'cubes'),
    preMoveProgress: getPhaseProgress(phaseProportions, progress, 'pre_move'),
    finalMoveProgress: getPhaseProgress(phaseProportions, progress, 'final_move'),
  }), [progress]);



  // #endregion

  
  // #region Calculate current position and rotation

  // calculate current position
  let finalPos = final_position.slice();
  let finalRotation = final_rotation.slice();
  let initialPos = initial_position.slice();
  let initialRotation = initial_rotation.slice();
  let flatPos = flat_position.slice();
  let flatRotation = flat_rotation.slice();

  let posA, posB, rotA, rotB, t;
  if (finalMoveProgress > 0) {
    // If final move is in progress, calculate the current position
    posA = initialPos;
    posB = finalPos;
    rotA = initialRotation;
    rotB = finalRotation;
    t = finalMoveProgress; // Use final move progress for position
  }
  else if (preMoveProgress > 0) {
    // If pre-move is in progress, calculate the current position
    posA = flatPos;
    posB = initialPos;
    rotA = flatRotation;
    rotB = initialRotation;
    t = preMoveProgress; // Use pre-move progress for position
  }
  else {
    // If no pre-move or final move, use flat position
    posA = flatPos;
    posB = flatPos; // No change in flat position
    rotA = flatRotation;
    rotB = flatRotation; // No change in flat rotation
    t = 0; // No progress
  }
  // Interpolate current position based on progress
  const currentPos = [
    posA[0] + (posB[0] - posA[0]) * t,
    posA[1] + (posB[1] - posA[1]) * t,
    posA[2] + (posB[2] - posA[2]) * t
  ];

  // Calculate the middle position of the trajectory
  let middlePos = [
    posA[0] + (posB[0] - posA[0]) * 0.5,
    posA[1] + (posB[1] - posA[1]) * 0.5,
    posA[2] + (posB[2] - posA[2]) * 0.5
  ];

  // Interpolate current rotation based on progress
  const currentRotation = [
    rotA[0] + (rotB[0] - rotA[0]) * t,
    rotA[1] + (rotB[1] - rotA[1]) * t,
    rotA[2] + (rotB[2] - rotA[2]) * t
  ];

  // #endregion Caclulate current position and rotation

  // Focus camera on this board when it's visible
  React.useEffect(() => {
    if (
      (preMoveProgress > 0 && preMoveProgress < 1) ||
      (finalMoveProgress > 0 && finalMoveProgress < 1)
    ) {
      setFocusPosition([middlePos[0] * 0.1, middlePos[1] * 0.1, middlePos[2] * 0.1]);
    }

  }, [preMoveProgress, finalMoveProgress, setFocusPosition]);


  // #region Prepare corners to render
  const cornersToRender = [];
  { 
    
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

    let indexCorner = 0;
    uniqueCorners.forEach(cornerStr => {
      const cornerPos = JSON.parse(cornerStr);

      // calculate progress
      const cornerProgress = Math.max(0, Math.min(1, (cubesProgress - indexCorner * (1.0 / allCornerPositions.length)) / (1.0 / allCornerPositions.length)));
      
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

      let initialLocalPos = [
        cornerPos[0],
        cornerPos[1],
        cornerPos[2] + assemblyDisplacement
      ]
      
      if (isInteriorCorner) {
        cornersToRender.push({
          localPos: cornerPos,
          initialLocalPos: initialLocalPos,
          progress : cornerProgress
        });
      }

      indexCorner++;
    });
  } 
  // #endregion Prepare corners to render

  
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


  const processedStrips = [];
  // Sort strip keys to ensure consistent stripIndex if keys are numeric and represent order
  const sortedStripKeys = Array.from(stripsMap.keys()).sort((a, b) => a - b);
  const totalStripsOnFace = sortedStripKeys.length;



  const perStripProportion = 1.0 / totalStripsOnFace;

  sortedStripKeys.forEach((stripKey, index) => {
    const boardsInOriginalStrip = stripsMap.get(stripKey);
    // Sort boards within the strip by id_1
    boardsInOriginalStrip.sort((a, b) => (a.id_1 || 0) - (b.id_1 || 0));

    let stripFinalPosition = boardsInOriginalStrip[0].position.slice();

    let stripInitialPosition = [0, 0, 0]; // Initialize initial position
    // shift with explosion axis
    stripInitialPosition[0] = stripFinalPosition[0] + faceExplosionAxis[0] * assemblyDisplacement;
    stripInitialPosition[1] = stripFinalPosition[1] + faceExplosionAxis[1] * assemblyDisplacement;
    stripInitialPosition[2] = stripFinalPosition[2] + faceExplosionAxis[2] * assemblyDisplacement;

    // calculate progress, given index
    const stripProgress = Math.max(0, Math.min(1, (stripsProgress - index * perStripProportion) / perStripProportion));

    
    const stripOwnRotation = [0, 0, 0]; 

    const boardsForThisStrip = boardsInOriginalStrip.map(board => {
      const boardGlobalPos = board.position;
      const relativePos = [
        boardGlobalPos[0] - stripFinalPosition[0],
        boardGlobalPos[1] - stripFinalPosition[1],
        boardGlobalPos[2] - stripFinalPosition[2],
      ];


      let boxAssemblyDirection = [0, 0, 0];

      // Rotate faceExplosionAxis by 90 degrees counter-clockwise from top view
      // This creates a perpendicular direction for board assembly within strips
      if (Math.abs(faceExplosionAxis[0]) > Math.abs(faceExplosionAxis[2])) {
        // if primary axis is X
        boxAssemblyDirection = [0, 0, -1];

        // if primary axis is Z
      } else if (Math.abs(faceExplosionAxis[2]) > Math.abs(faceExplosionAxis[0])) {
        boxAssemblyDirection = [1, 0, 0];
      } else {
        // if primary axis is Y
        // warning
        let warning_string = "Warning: Face explosion axis is not aligned with any primary axis.";
        console.warn(warning_string, faceExplosionAxis);
      }

      let initialRelativePos = [
        relativePos[0] - boxAssemblyDirection[0] * assemblyDisplacement * 0.5,
        relativePos[1] - boxAssemblyDirection[1] * assemblyDisplacement * 0.5,
        relativePos[2] - boxAssemblyDirection[2] * assemblyDisplacement * 0.5
      ];



      return {
        ...board,
        position: relativePos,
        rotation: board.rotation,
        initial_position: initialRelativePos, // Assuming initial position is the same as final for now
        initial_rotation: board.rotation
      };
    });


    processedStrips.push({
      id: stripKey, // Keep original ID for keying if needed
      stripIndex: index, // Sequential index for animation order
      totalStrips: totalStripsOnFace,
      progress: stripProgress, // Progress for this strip
      boardsInStrip: boardsForThisStrip,
      final_position: stripFinalPosition,
      final_rotation: stripOwnRotation,
      initial_position: stripInitialPosition,
      initial_rotation: stripOwnRotation
    });
  });
  // --- End of strip processing ---

  return (
    <group position={currentPos} rotation={currentRotation}>
      {/* Render Strips */}
      {processedStrips.map((stripData) => (
        <Strip
          key={`${name}-strip-${stripData.id}`} // Use original id for key
          name={`${name}-strip-${stripData.id}`}
          progress={stripData.progress} // Progress for this strip
          stripIndex={stripData.stripIndex}   // NEW: Index of this strip
          totalStrips={stripData.totalStrips} // NEW: Total strips in this face
          explosionAxis={faceExplosionAxis}   // NEW: Direction for initial displacement
          boardsInStrip={stripData.boardsInStrip}
          final_position={stripData.final_position}       // Strip's final position relative to this Face group
          final_rotation={stripData.final_rotation}       // Strip's final rotation relative to this Face group
          initial_position={stripData.initial_position} // Assuming initial position is the same as final for now
          initial_rotation={stripData.initial_rotation} // Assuming initial rotation is the same as final for now
        />
      ))}
      
      {/* Render cubes at corners (remains unchanged) */}

      {cornersToRender.map((corner, index) => (
        <Cube
          key={`${name}-corner-${index}`}
          progress={corner.progress} // Use the overall face progress
          final_position={corner.localPos}
          final_rotation={[0, 0, 0]} // Assuming cubes don't have specific rotation from this logic
          initial_position={corner.initialLocalPos}
          initial_rotation={[0, 0, 0]} // Assuming cubes don't have specific rotation from this logic
        />
      ))}

      
    </group>
  );
}