// Import necessary config values
import { dFdx } from 'three/tsl';
import { gap, thickness, boardTypes } from '../configs/boardConfig';

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
        
        let rotation = [0, 0, 0];

        const absPos = pos.map(Math.abs);
        const maxAxis = absPos.indexOf(Math.max(...absPos));
        if (maxAxis === 0) {
          rotation = [0, pos[0] > 0 ? Math.PI / 2 : -Math.PI / 2, 0];
        } else if (maxAxis === 1) {
          rotation = [pos[1] > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0];
        } else {
          rotation = [0, pos[2] > 0 ? 0 : Math.PI, 0];
        }

        configs.push({
          position: pos,
          rotation: rotation
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
    position,
    rotation: cornerRotations[index]
  }));
  
  const edgeCubes = edgeConfigs.map((config, index) => ({
    position: config.position,
    rotation: config.rotation
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

  // Define positions relative to the crate origin (0,0,0)
  const frontPos = [0, 0, halfD];
  const backPos = [0, 0, -halfD];
  const leftPos = [-halfW, 0, 0];
  const rightPos = [halfW, 0, 0];
  const topPos = [0, halfH, 0];
  const bottomPos = [0, -halfH, 0];

  // Define configurations for each face
  const faceConfigs = {
      // Ensure sizesA/sizesB map correctly to how computeBoards determines type
      front:  { sizesA: boardSizes.x, sizesB: boardSizes.y, position: frontPos, rotation: [0, 0, 0] },
      back:   { sizesA: boardSizes.x.slice().reverse(), sizesB: boardSizes.y, position: backPos, rotation: [0, Math.PI, 0] },
      left:   { sizesA: boardSizes.z, sizesB: boardSizes.y, position: leftPos, rotation: [0, -Math.PI / 2, 0] },
      right:  { sizesA: boardSizes.z.slice().reverse(), sizesB: boardSizes.y, position: rightPos, rotation: [0, Math.PI / 2, 0] },
      top:    { sizesA: boardSizes.x, sizesB: boardSizes.z.slice().reverse(), position: topPos, rotation: [-Math.PI / 2, 0, 0] },
      bottom: { sizesA: boardSizes.x, sizesB: boardSizes.z, position: bottomPos, rotation: [Math.PI / 2, 0, 0] }
  };

  // Build the final faceLayouts object
  const faceLayouts = {};
  Object.entries(faceConfigs).forEach(([faceName, cfg]) => {
      faceLayouts[faceName] = {
          boards: computeBoards(cfg.sizesA, cfg.sizesB), // Get boards with type info
          position: cfg.position,
          rotation: cfg.rotation
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