// Import necessary config values
import { dFdx, directPointLight } from 'three/tsl';
import { gap, thickness, boardTypes } from '../configs/boardConfig';
import { assemblyDisplacementCube } from '../configs/globalConfigs';

// Helper function: lay out boards, now returning type information
// Needs refinement based on how board types are determined from sizesA/sizesB
function computeBoards(sizesA, sizesB) {
    const boards = [];
    let currentOffsetA = 0;

    // --- This logic needs to be adapted ---
    // --- How do you determine the 'type' (e.g., 'board_LxM') ---
    // --- from the sizes in sizesA and sizesB? ---
    // Example: Assume sizesA maps to width, sizesB maps to height for simplicity
    // You'll need a more robust way to map the input sizes to your defined boardTypes keys

    for (let i = 0; i < sizesA.length; i++) {
        const sizeA = sizesA[i];
        const halfSizeA = sizeA / 2;
        let currentOffsetB = 0;

        for (let j = 0; j < sizesB.length; j++) {
            const sizeB = sizesB[j];
            const halfSizeB = sizeB / 2;
            // Ensure the larger dimension is treated as sizeA and the smaller as sizeB.
            // If swapped, rotate by 90 degrees (around the Z axis in this example).
            let finalSizeA = sizeA;
            let finalSizeB = sizeB;
            let boardRotation = [0, 0, 0];

            if (sizeA < sizeB) {
              finalSizeA = sizeB;
              finalSizeB = sizeA;
              boardRotation = [0, 0, Math.PI / 2]; // Rotate 90° if swapped.
            }

            // Determine the board type string using the correct order.
            const boardTypeKey = `board_${finalSizeA}x${finalSizeB}`;

            // Check if this type exists in config
            if (boardTypes[boardTypeKey]) {
              boards.push({
                type: boardTypeKey, // Use the key from boardConfig.js.
                position: [
                  currentOffsetA + halfSizeA - (sizesA.reduce((a, b) => a + b, 0) + gap * (sizesA.length - 1)) / 2, // Centering logic might need review.
                  currentOffsetB + halfSizeB - (sizesB.reduce((a, b) => a + b, 0) + gap * (sizesB.length - 1)) / 2,
                  0 // Z is 0 relative to the face plane.
                ],
                id_0: i,
                id_1: j,
                width: finalSizeA,
                height: finalSizeB,
                rotation: boardRotation // Apply rotation if dimensions were swapped.
              });
            } else {
              console.warn(`Board type key "${boardTypeKey}" not found in boardConfig.js`);
            }

            currentOffsetB += sizeB + gap;
        }
        currentOffsetA += sizeA + gap;
    }
    // --- End of adaptation needed ---

    return boards;
}

function calculateCubePositions(halfWidth, halfHeight, halfDepth, boardSizes) {

  // adjust sizes with half thickness
  const halfWidthWithOffset = halfWidth + thickness / 2;
  const halfHeightWithOffset = halfHeight + thickness / 2;
  const halfDepthWithOffset = halfDepth + thickness / 2;

  // Calculate all 8 corner positions
  const cornerCubePositions = [
      // Front face corners (anticlockwise from bottom-left)
      [-halfWidthWithOffset, -halfHeightWithOffset, halfDepthWithOffset], // Bottom-left
      [ halfWidthWithOffset, -halfHeightWithOffset, halfDepthWithOffset], // Bottom-right
      [ halfWidthWithOffset,  halfHeightWithOffset, halfDepthWithOffset], // Top-right
      [-halfWidthWithOffset,  halfHeightWithOffset, halfDepthWithOffset], // Top-left
      // Back face corners (anticlockwise from bottom-left)
      [-halfWidthWithOffset, -halfHeightWithOffset, -halfDepthWithOffset], // Bottom-left
      [ halfWidthWithOffset, -halfHeightWithOffset, -halfDepthWithOffset], // Bottom-right
      [ halfWidthWithOffset,  halfHeightWithOffset, -halfDepthWithOffset], // Top-right
      [-halfWidthWithOffset,  halfHeightWithOffset, -halfDepthWithOffset]  // Top-left
  ];


  const cornerRotations = [
    [0, -Math.PI / 2, 0],  // Bottom-left front: point left
    [0, Math.PI / 2, 0],   // Bottom-right front: point right
    [-Math.PI / 2, 0, 0],             // Top-right front: point upwards
    [-Math.PI / 2, 0, 0],             // Top-left front: point upwards
    [0, -Math.PI / 2, 0],  // Bottom-left back: point left
    [0, Math.PI / 2, 0],   // Bottom-right back: point right
    [-Math.PI / 2, 0, 0],             // Top-right back: point upwards
    [-Math.PI / 2, 0, 0]              // Top-left back: point upwards
  ];


  const cornerCubeInitPositions = cornerCubePositions.map(pos => [...pos]);

  cornerCubeInitPositions[0][0] -= assemblyDisplacementCube; // Bottom-left front: point left
  cornerCubeInitPositions[1][0] += assemblyDisplacementCube; // Bottom-right front: point right
  cornerCubeInitPositions[2][1] += assemblyDisplacementCube; // Top-right front: point upwards
  cornerCubeInitPositions[3][1] += assemblyDisplacementCube; // Top-left front: point upwards
  cornerCubeInitPositions[4][0] -= assemblyDisplacementCube; // Bottom-left back: point left
  cornerCubeInitPositions[5][0] += assemblyDisplacementCube; // Bottom-right back: point right
  cornerCubeInitPositions[6][1] += assemblyDisplacementCube; // Top-right back: point upwards
  cornerCubeInitPositions[7][1] += assemblyDisplacementCube; // Top-left back: point upwards


  // --- Corrected Helper ---

  // Calculate edge positions based on board sizes
  const edgeConfigs = [];
  const epsilon = 0.01; // For floating point comparisons

  function addEdgeConfigs(start, end, edgeBoardSizes) {
    const configs = [];

    const vec = [
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2]
    ];

    if (!edgeBoardSizes || edgeBoardSizes.length <= 1) {
        return configs;
    }

    // total length occupied by boards + gaps
    const edgeLength =
      edgeBoardSizes.reduce((a,b) => a + b, 0)
      + gap * edgeBoardSizes.length;

    // precompute a unit‐direction vector along this edge
    const dir = vec.map(v => v / edgeLength);

    // shift start and end by half thickness
    // start = start.map((v, i) => v + dir[i] * thickness / 2);
    // end = end.map((v, i) => v - dir[i] * thickness / 2);

    let accumulated = thickness / 2;
    for (let i = 0; i < edgeBoardSizes.length - 1; i++) {
        // skip over board i
        accumulated += edgeBoardSizes[i];
        // center of the gap after board i
        const centerOffset = accumulated + gap/2;
        // **normalize** against the *content* length, not the raw vector length
        const t = centerOffset / edgeLength;
        // position along the actual geometric vector
        const pos = [
          start[0] + dir[0] * (edgeLength * t),
          start[1] + dir[1] * (edgeLength * t),
          start[2] + dir[2] * (edgeLength * t)
        ];
        
        let direction = [0, 0, 0];

        let rotation = [0, 0, 0];
        
        // Calculate direction based on rotation
        if ( (Math.abs(dir[0]) < epsilon) && (start[0] > epsilon) ) { // direction along Z, on the X positive side

          direction = [1, 0, 0];
          rotation = [0, Math.PI / 2, 0];
        } else if ( (Math.abs(dir[0]) < epsilon) && (start[0] < epsilon) ) { // direction along Z, on the X negative side
          direction = [-1, 0, 0];
          rotation = [0, -Math.PI / 2, 0];
        } else if ( (Math.abs(dir[2]) < epsilon) && (start[2] > epsilon) ) { // direction along X, on the Z positive side
          direction = [0, 0, 1];
          rotation = [0, 0, 0];
        } else if ( (Math.abs(dir[2]) < epsilon) && (start[2] < epsilon) ) { // direction along X, on the Z negative side
          direction = [0, 0, -1];
          rotation = [Math.PI, 0, 0];
        }

        let initPos = pos.map((v, i) => v + direction[i] * assemblyDisplacementCube);

        configs.push({
          final_position: pos,
          final_rotation: rotation,
          initial_position: initPos,
          initial_rotation: rotation,
        })

        // skip over the gap
        accumulated += gap;
    }

    return configs;
}
  // --- End of Corrected Helper ---

  // Determine which boardSizes array corresponds to which edge direction
  const edgeDefs = [
      // Edges along X
      { startIdx: 0, endIdx: 1, sizes: boardSizes.x }, { startIdx: 3, endIdx: 2, sizes: boardSizes.x },
      { startIdx: 4, endIdx: 5, sizes: boardSizes.x }, { startIdx: 7, endIdx: 6, sizes: boardSizes.x },
      // Edges along Y
      { startIdx: 0, endIdx: 3, sizes: boardSizes.y }, { startIdx: 1, endIdx: 2, sizes: boardSizes.y },
      { startIdx: 4, endIdx: 7, sizes: boardSizes.y }, { startIdx: 5, endIdx: 6, sizes: boardSizes.y },
      // Edges along Z
      { startIdx: 4, endIdx: 0, sizes: boardSizes.z }, { startIdx: 5, endIdx: 1, sizes: boardSizes.z },
      { startIdx: 6, endIdx: 2, sizes: boardSizes.z }, { startIdx: 7, endIdx: 3, sizes: boardSizes.z }
  ];

  // Calculate all intermediate edge positions
  edgeDefs.forEach(def => {
      // Ensure the sizes array is correctly oriented if start/end indices imply reversal
      // Example: If edge goes from index 3 to 2, reverse the sizes array
      let sizesForEdge = def.sizes;
      // Basic check: if start index > end index for X or Z, or if Y direction is decreasing
      // This logic might need refinement based on your corner indexing convention
      // For now, assuming the provided 'sizes' array matches the edge direction in 'edgeDefs'
      edgeConfigs.push(
          ...addEdgeConfigs(cornerCubePositions[def.startIdx], cornerCubePositions[def.endIdx], sizesForEdge)
      );
  });

  // Map positions to cube objects (still using default rotation)
  const cornerCubes = cornerCubePositions.map((position, index) => ({
    final_position: position,
    final_rotation: cornerRotations[index],
    initial_position: cornerCubeInitPositions[index],
    initial_rotation: cornerRotations[index]
  }));
  
  const edgeCubes = edgeConfigs.map((config, index) => ({
    final_position: config.final_position,
    final_rotation: config.final_rotation,
    initial_position: config.initial_position,
    initial_rotation: config.initial_rotation,
  }));

  return { cornerCubes, edgeCubes };
}

// Main function
export function calculateFaceLayouts(boardSizes) {

  // Calculate overall dimensions based on boardSizes and gap
  const width = boardSizes.x.reduce((acc, size) => acc + size, 0) + (boardSizes.x.length > 1 ? gap * (boardSizes.x.length - 1) : 0);
  const height = boardSizes.y.reduce((acc, size) => acc + size, 0) + (boardSizes.y.length > 1 ? gap * (boardSizes.y.length - 1) : 0);
  const depth = boardSizes.z.reduce((acc, size) => acc + size, 0) + (boardSizes.z.length > 1 ? gap * (boardSizes.z.length - 1) : 0);

  // Calculate face positions (using outer dimensions including thickness)
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  // Calculate assembly displacement based on the largest dimension
  let assemblyDisplacementAdjusted = Math.max(halfD, halfH, halfW) * 1.0 + 50;

  // Define positions relative to the crate origin (0,0,0)
  const frontPos = [0, 0, halfD];
  const frontRot = [0, 0, 0];
  const frontInitialPos = [0, 0, halfD + assemblyDisplacementAdjusted];
  const frontFlatPos = [0, -halfH, halfD + assemblyDisplacementAdjusted];
  const frontFlatRot = [-Math.PI / 2, 0, 0];

  const backPos = [0, 0, -halfD];
  const backRot = [0, Math.PI, 0];
  const backInitialPos = [0, 0, -halfD - assemblyDisplacementAdjusted];
  const backFlatPos = [0, -halfH, -halfD - assemblyDisplacementAdjusted];
  const backFlatRot = [Math.PI / 2, Math.PI, 0];

  const leftPos = [-halfW, 0, 0];
  const leftRot = [-Math.PI/2 , -Math.PI / 2, -Math.PI / 2];
  const leftInitialPos = [-halfW - assemblyDisplacementAdjusted, 0, 0];
  const leftFlatPos = [-halfW - assemblyDisplacementAdjusted, -halfH, 0];
  const leftFlatRot = [-Math.PI/2 , 0, -Math.PI / 2];

  const rightPos = [halfW, 0, 0];
  const rightRot = [-Math.PI / 2, Math.PI / 2, Math.PI / 2];
  const rightInitialPos = [halfW + assemblyDisplacementAdjusted, 0, 0];
  const rightFlatPos = [halfW + assemblyDisplacementAdjusted, -halfH, 0];
  const rightFlatRot = [-Math.PI / 2, 0, Math.PI / 2];

  const topPos = [0, halfH, 0];
  const topRot = [-Math.PI / 2, 0, 0];
  const topInitialPos = [0, halfH + assemblyDisplacementAdjusted, 0];
  const topFlatPos = [rightFlatPos[0], -halfH, 0];
  const topFlatRot = [-Math.PI / 2, 0, 0];

  const bottomPos = [0, -halfH, 0];
  const bottomRot = [Math.PI / 2, 0, 0];
  const bottomInitialPos = [0, -halfH, 0];
  const bottomFlatPos = [0, -halfH, 0];
  const bottomFlatRot = [-Math.PI / 2, 0, 0];
  

  // Define configurations for each face
  const faceConfigs = {
      // Ensure sizesA/sizesB map correctly to how computeBoards determines type
      front:  { sizesA: boardSizes.x, sizesB: boardSizes.y, 
        final_position: frontPos, final_rotation: frontRot,
        initial_position: frontInitialPos, initial_rotation: frontRot,
        flat_position: frontFlatPos, flat_rotation: frontFlatRot },
      back:   { sizesA: boardSizes.x.slice().reverse(), sizesB: boardSizes.y, 
        final_position: backPos, final_rotation: backRot, 
        initial_position: backInitialPos, initial_rotation: backRot,
        flat_position: backFlatPos, flat_rotation: backFlatRot },
      left:   { sizesA: boardSizes.z, sizesB: boardSizes.y, 
        final_position: leftPos, final_rotation: leftRot ,
        initial_position: leftInitialPos, initial_rotation: leftRot,
        flat_position: leftFlatPos, flat_rotation: leftFlatRot },
      right:  { sizesA: boardSizes.z.slice().reverse(), sizesB: boardSizes.y, 
        final_position: rightPos, final_rotation: rightRot, 
        initial_position: rightInitialPos, initial_rotation: rightRot,
        flat_position: rightFlatPos, flat_rotation: rightFlatRot },
      top:    { sizesA: boardSizes.x, sizesB: boardSizes.z.slice().reverse(), 
        final_position: topPos, final_rotation: topRot, 
        initial_position: topInitialPos, initial_rotation: topRot,
        flat_position: topFlatPos, flat_rotation: topFlatRot },
      bottom: { sizesA: boardSizes.x, sizesB: boardSizes.z, 
        final_position: bottomPos, final_rotation: bottomRot,
        initial_position: bottomInitialPos, initial_rotation: bottomRot,
        flat_position: bottomFlatPos, flat_rotation: bottomFlatRot }
  };

  // Build the final faceLayouts object
  const faceLayouts = {};
  Object.entries(faceConfigs).forEach(([faceName, cfg]) => {
      faceLayouts[faceName] = {
          boards: computeBoards(cfg.sizesA, cfg.sizesB), // Get boards with type info
          final_position: cfg.final_position,
          final_rotation: cfg.final_rotation,
          initial_position: cfg.initial_position, 
          initial_rotation: cfg.initial_rotation, 
          flat_position: cfg.flat_position,
          flat_rotation: cfg.flat_rotation
      };
  });

  // Calculate cube positions for corners and edges
  const cubeLayouts = calculateCubePositions(halfW, halfH, halfD, boardSizes);
  
  // Return both face layouts and cube layouts
  return {
      faceLayouts,
      cubeLayouts
  };
}