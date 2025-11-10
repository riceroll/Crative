// Scene Graph Computation Module
// Transforms selectedCandidateDesign into flat dictionary structure for animation and visualization

import { gap, thickness, boardTypes } from '../configs/boardConfig';
import { assemblyDisplacementCube, assemblyDisplacement } from '../configs/globalConfigs';

/**
 * Debug logger for step-by-step computation tracking
 */
class DebugLogger {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.logs = [];
  }

  log(step, data) {
    if (this.enabled) {
      const logEntry = {
        timestamp: Date.now(),
        step,
        data: JSON.parse(JSON.stringify(data)) // Deep clone for safety
      };
      this.logs.push(logEntry);
      // console.log(`[SceneGraph] ${step}:`, data);
    }
  }

  exportLogs() {
    return {
      logs: this.logs,
      summary: {
        totalSteps: this.logs.length,
        computationTime: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp - this.logs[0].timestamp : 0
      }
    };
  }

  clear() {
    this.logs = [];
  }
}

// Global debug logger instance
const debugLogger = new DebugLogger();

/**
 * Main computation function - transforms selectedCandidateDesign into scene graph
 * @param {Object} selectedCandidate - The selected crate design from candidateCrateCalculator
 * @returns {Object} Flat dictionary of all parts with their properties and keyframes
 */
export function computeSceneGraph(selectedCandidate) {
  debugLogger.clear();
  debugLogger.log('computeSceneGraph_start', { 
    candidateId: selectedCandidate?.id,
    outerDims: selectedCandidate?.outerDims 
  });

  if (!selectedCandidate || !selectedCandidate.faceLayouts || !selectedCandidate.cubeLayouts || !selectedCandidate.screwLayouts) {
    debugLogger.log('computeSceneGraph_error', 'Invalid selectedCandidate provided');
    return {};
  }

  const sceneGraph = {};

  // Create root crate part
  sceneGraph['crate_root'] = {
    part_id: 'crate_root',
    properties: {
      current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
      type: 'group',
      pos: [0, 0, 0],
      rot: [0, 0, 0],
      children: [],
      keyframes: []
    }
  };

  // Generate face parts
  const faceChildren = generateFaceParts(selectedCandidate.faceLayouts, sceneGraph);
  sceneGraph['crate_root'].properties.children.push(...faceChildren);

  // Generate cube parts
  const cubeChildren = generateCubeParts(selectedCandidate.cubeLayouts, sceneGraph);
  sceneGraph['crate_root'].properties.children.push(...cubeChildren);

  // Generate screw parts - HIDDEN: commented out to hide screws
  // const screwChildren = generateScrewParts(selectedCandidate.screwLayouts, sceneGraph);
  // sceneGraph['crate_root'].properties.children.push(...screwChildren);

  debugLogger.log('computeSceneGraph_complete', {
    totalParts: Object.keys(sceneGraph).length,
    faceChildren: faceChildren.length,
    cubeChildren: cubeChildren.length,
    // screwChildren: screwChildren.length
  });

  return sceneGraph;
}

/**
 * Generate face parts from faceLayouts
 * @param {Object} faceLayouts - Face layouts from selectedCandidate
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of face part IDs
 */
function generateFaceParts(faceLayouts, sceneGraph) {
  debugLogger.log('generateFaceParts_start', { faceCount: Object.keys(faceLayouts).length });
  
  const faceChildren = [];
  
  Object.entries(faceLayouts).forEach(([faceName, faceData]) => {
    const faceId = `face_${faceName}`;
    faceChildren.push(faceId);

    // Calculate assembly displacement for this face
    const assemblyDisplacementAdjusted = calculateAssemblyDisplacement(faceData);

    // Create face part
    sceneGraph[faceId] = {
      part_id: faceId,
      properties: {
        current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
        type: 'group',
        pos: faceData.final_position,
        rot: faceData.final_rotation,
        children: [],
        keyframes: generateFaceKeyframes(faceId, faceData, assemblyDisplacementAdjusted)
      }
    };

    // Generate strip parts for this face
    const stripChildren = generateStripParts(faceData.boards, faceId, faceName, sceneGraph);
    sceneGraph[faceId].properties.children.push(...stripChildren);

    // Generate cube parts for inner corners of this face, directly using faceData.cubes
    const cubeChildren = generateInFaceCubeParts(faceData.cubes, faceId, faceName, sceneGraph);
    sceneGraph[faceId].properties.children.push(...cubeChildren);

    // Generate piece parts for this face
    const pieceChildren = generatePieceParts(faceData.pieces, faceId, faceName, sceneGraph);
    sceneGraph[faceId].properties.children.push(...pieceChildren);

    // Generate bar parts for this face - HIDDEN: commented out to hide bars
    // const barChildren = generateBarParts(faceData.bars, faceId, faceName, sceneGraph);
    // sceneGraph[faceId].properties.children.push(...barChildren);

    // Generate screw parts for this face - HIDDEN: commented out to hide screws
    // const screwChildren = generateInFaceScrewParts(faceData.screws, faceId, faceName, sceneGraph);
    // sceneGraph[faceId].properties.children.push(...screwChildren);

    debugLogger.log('generateFaceParts_face', {
      faceId,
      // boardCount: boardChildren.length,
      finalPos: faceData.final_position,
      initialPos: faceData.initial_position
    });
  });

  return faceChildren;
}

/**
 * Generate strip parts from face boards
 * @param {Array} boards - Array of board data from face
 * @param {string} faceId - Parent face ID
 * @param {string} faceName - Face name (front, back, etc.)
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of strip part IDs
 */
function generateStripParts(boards, faceId, faceName, sceneGraph) {
  debugLogger.log('generateStripParts_start', { 
    faceId, 
    boardCount: boards.length 
  });

  const stripChildren = [];

  // Group boards by id_0 (strip/row index)
  const stripGroups = {};
  boards.forEach(board => {
    const stripIndex = board.id_0;
    if (!stripGroups[stripIndex]) {
      stripGroups[stripIndex] = [];
    }
    stripGroups[stripIndex].push(board);
  });

  // Generate strip parts
  Object.entries(stripGroups).forEach(([stripIndex, stripBoards]) => {
    const stripId = `${faceId}_strip_${stripIndex}`;
    stripChildren.push(stripId);

    // Calculate strip center position from its boards
    const stripCenterPos = calculateStripCenterPosition(stripBoards);
    
    // Calculate perpendicular direction for strip keyframes
    const perpendicularDirection = calculateStripPerpendicularDirection(stripBoards, faceName);

    // Create strip part
    sceneGraph[stripId] = {
      part_id: stripId,
      properties: {
        current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
        type: 'group',
        pos: stripCenterPos,
        rot: [0, 0, 0],
        children: [],
        parent: sceneGraph[faceId],
        keyframes: generateStripKeyframes(stripId, stripCenterPos, perpendicularDirection, parseInt(stripIndex) + 1)
      }
    };

    // Generate board parts for this strip
    const boardChildren = generateBoardParts(stripBoards, stripId, faceName, sceneGraph);
    sceneGraph[stripId].properties.children.push(...boardChildren);

    debugLogger.log('generateStripParts_strip', {
      stripId,
      boardCount: stripBoards.length,
      centerPos: stripCenterPos,
      perpendicularDirection
    });
  });

  return stripChildren;
}

/**
 * Generate cube parts for inner corners of a face
 * @param {Array} cubes - Array of cube data from face
 * @param {string} faceId - Parent face ID
 * @param {string} faceName - Face name (front, back, etc.)
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of cube part IDs
 */
function generateInFaceCubeParts(cubes, faceId, faceName, sceneGraph) {
  const cubeChildren = [];

  cubes.forEach((cube, index) => {
    // example naming for strip:     const stripId = `${faceId}_strip_${stripIndex}`;
    const cubeId = `${faceId}_cube_${index}`;

    cubeChildren.push(cubeId);

    sceneGraph[cubeId] = {
      part_id: cubeId,
      properties: {
        current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
        type: 'model',
        model_id: 'cube',
        pos: cube.final_position,
        rot: cube.final_rotation,
        children: [],
        parent: sceneGraph[faceId],
        keyframes: generateCubeKeyframes(cubeId, cube)
      }
    };
  });

  return cubeChildren;
}

/**
 * Generate screw parts for a face
 * @param {Array} screws - Array of screw data from face
 * @param {string} faceId - Parent face ID
 * @param {string} faceName - Face name (front, back, etc.)
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of screw part IDs
 */
function generateInFaceScrewParts(screws, faceId, faceName, sceneGraph) {
  const screwChildren = [];

  screws.forEach((screw, index) => {
    const screwId = `${faceId}_screw_${index}`;
    screwChildren.push(screwId);

    sceneGraph[screwId] = {
      part_id: screwId,
      properties: {
        current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
        type: 'model',
        model_id: 'screw',
        pos: screw.final_position,
        rot: screw.final_rotation,
        children: [],
        parent: sceneGraph[faceId],
        keyframes: generateScrewKeyframes(screwId, screw)
      }
    };
  });

  return screwChildren;
}

/**
 * Generate piece parts for a face
 * @param {Array} pieces - Array of piece data from face
 * @param {string} faceId - Parent face ID
 * @param {string} faceName - Face name (front, back, etc.)
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of piece part IDs
 */
function generatePieceParts(pieces, faceId, faceName, sceneGraph) {
  const pieceChildren = [];

  pieces.forEach((piece, index) => {
    const pieceId = `${faceId}_piece_${index}`;
    pieceChildren.push(pieceId);

    sceneGraph[pieceId] = {
      part_id: pieceId,
      properties: {
        current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
        type: 'model',
        model_id: 'piece',
        pos: piece.final_position,
        rot: piece.final_rotation,
        children: [],
        parent: sceneGraph[faceId],
        keyframes: generatePieceKeyframes(pieceId, piece)
      }
    };
  });

  return pieceChildren;
}

/**
 * Generate bar parts for a face
 * @param {Array} bars - Array of bar data from face
 * @param {string} faceId - Parent face ID
 * @param {string} faceName - Face name (front, back, etc.)
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of bar part IDs
 */
function generateBarParts(bars, faceId, faceName, sceneGraph) {
  const barChildren = [];

  bars.forEach((bar, index) => {
    const barId = `${faceId}_bar_${index}`;
    barChildren.push(barId);

    sceneGraph[barId] = {
      part_id: barId,
      properties: {
        current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
        type: 'model',
        model_id: 'bar',
        pos: bar.final_position,
        rot: bar.final_rotation,
        children: [],
        parent: sceneGraph[faceId],
        keyframes: generateBarKeyframes(barId, bar)
      }
    };
  });

  return barChildren;
}

/**
 * Generate board parts from strip boards (modified for strip children)
 * @param {Array} boards - Array of board data from strip
 * @param {string} stripId - Parent strip ID
 * @param {string} faceName - Face name (front, back, etc.)
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of board part IDs
 */
function generateBoardParts(boards, stripId, faceName, sceneGraph) {
  debugLogger.log('generateBoardParts_start', { 
    stripId, 
    boardCount: boards.length 
  });

  const boardChildren = [];

  boards.forEach((board, index) => {
    const boardId = `${stripId}_board_${board.id_0}_${board.id_1}`;
    boardChildren.push(boardId);

    // Calculate explosion direction for board assembly animation
    const explosionDirection = calculateBoardExplosionDirection(board, boards, faceName);

    // Calculate relative position from strip center
    const stripCenterPos = calculateStripCenterPosition(boards);
    const relativeBoardPos = calculateRelativePosition(board.position, stripCenterPos);

    sceneGraph[boardId] = {
      part_id: boardId,
      properties: {
        current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
        type: 'model',
        model_id: convertBoardTypeToModelKey(board.type),
        pos: relativeBoardPos,
        rot: board.rotation || [0, 0, 0],
        children: [],
        parent: sceneGraph[stripId],
        keyframes: generateBoardKeyframes(boardId, board, explosionDirection)
      }
    };

    debugLogger.log('generateBoardParts_board', {
      boardId,
      type: board.type,
      position: relativeBoardPos,
      explosionDirection
    });
  });

  return boardChildren;
}

/**
 * Generate cube parts from cubeLayouts
 * @param {Object} cubeLayouts - Cube layouts from selectedCandidate
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of cube part IDs
 */
function generateCubeParts(cubeLayouts, sceneGraph) {
  debugLogger.log('generateCubeParts_start', {
    cornerCubes: cubeLayouts.cornerCubes?.length || 0,
    edgeCubes: cubeLayouts.edgeCubes?.length || 0
  });

  const cubeChildren = [];

  // Generate corner cubes
  if (cubeLayouts.cornerCubes) {
    cubeLayouts.cornerCubes.forEach((cube, index) => {
      const cubeId = `cube_corner_${index}`;
      cubeChildren.push(cubeId);

      sceneGraph[cubeId] = {
        part_id: cubeId,
        properties: {
          current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
          type: 'model',
          model_id: 'cube',
          pos: cube.final_position,
          rot: cube.final_rotation,
          children: [],
          parent: sceneGraph.crate_root,
          keyframes: generateCubeKeyframes(cubeId, cube)
        }
      };
    });
  }

  // Generate edge cubes
  if (cubeLayouts.edgeCubes) {
    cubeLayouts.edgeCubes.forEach((cube, index) => {
      const cubeId = `cube_edge_${index}`;
      cubeChildren.push(cubeId);

      sceneGraph[cubeId] = {
        part_id: cubeId,
        properties: {
          current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
          type: 'model',
          model_id: 'cube',
          pos: cube.final_position,
          rot: cube.final_rotation,
          children: [],
          parent: sceneGraph.crate_root,
          keyframes: generateCubeKeyframes(cubeId, cube)
        }
      };
    });
  }

  debugLogger.log('generateCubeParts_complete', { totalCubes: cubeChildren.length });
  return cubeChildren;
}

/**
 * Generate screw parts from screwLayouts
 * @param {Object} screwLayouts - Screw layouts from selectedCandidate
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of screw part IDs
 */
function generateScrewParts(screwLayouts, sceneGraph) {
  debugLogger.log('generateScrewParts_start', {
    cornerScrews: screwLayouts.cornerScrews?.length || 0,
    edgeScrews: screwLayouts.edgeScrews?.length || 0
  });

  const screwChildren = [];

  // Generate corner screws
  if (screwLayouts.cornerScrews) {
    screwLayouts.cornerScrews.forEach((screw, index) => {
      const screwId = `screw_corner_${index}`;
      screwChildren.push(screwId);

      sceneGraph[screwId] = {
        part_id: screwId,
        properties: {
          current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
          type: 'model',
          model_id: 'screw',
          pos: screw.final_position,
          rot: screw.final_rotation,
          children: [],
          parent: sceneGraph.crate_root,
          keyframes: generateScrewKeyframes(screwId, screw)
        }
      };
    });
  }

  // Generate edge screws
  if (screwLayouts.edgeScrews) {
    screwLayouts.edgeScrews.forEach((screw, index) => {
      const screwId = `screw_edge_${index}`;
      screwChildren.push(screwId);

      sceneGraph[screwId] = {
        part_id: screwId,
        properties: {
          current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 1 },
          type: 'model',
          model_id: 'screw',
          pos: screw.final_position,
          rot: screw.final_rotation,
          children: [],
          parent: sceneGraph.crate_root,
          keyframes: generateScrewKeyframes(screwId, screw)
        }
      };
    });
  }

  debugLogger.log('generateScrewParts_complete', { totalScrews: screwChildren.length });
  return screwChildren;
}

/**
 * Generate keyframes for face animation
 * @param {string} faceId - Face part ID
 * @param {Object} faceData - Face data from faceLayouts
 * @param {number} assemblyDisplacement - Calculated assembly displacement
 * @returns {Array} Array of keyframes
 */
function generateFaceKeyframes(faceId, faceData, assemblyDisplacement) {
  return [    {
      keyframe_id: `${faceId}_flat`,
      pos: calculateRelativePosition(faceData.flat_position, faceData.final_position),
      rot: calculateRelativeRotation(faceData.flat_rotation, faceData.final_rotation),
      alpha: 1,
      duration: 0.1
    },
    {
      keyframe_id: `${faceId}_flipped`,
      pos: calculateRelativePosition(faceData.flipped_position, faceData.final_position),
      rot: calculateRelativeRotation(faceData.flipped_rotation, faceData.final_rotation),
      alpha: 1,
      duration: 0.15
    },
    {
      keyframe_id: `${faceId}_initial`,
      pos: calculateRelativePosition(faceData.initial_position, faceData.final_position),
      rot: calculateRelativeRotation(faceData.initial_rotation, faceData.final_rotation),
      alpha: 1,
      duration: 0.2
    },
    {
      keyframe_id: `${faceId}_final`,
      pos: [0, 0, 0], // Final position is relative to itself
      rot: [0, 0, 0],
      alpha: 1,
      duration: null
    }
  ];
}

/**
 * Generate keyframes for board animation
 * @param {string} boardId - Board part ID
 * @param {Object} board - Board data
 * @param {Array} explosionDirection - Direction for initial displacement
 * @returns {Array} Array of keyframes
 */
function generateBoardKeyframes(boardId, board, explosionDirection) {
  const explosionDistance = assemblyDisplacement * 0.5;
  const explosionPos = [
    explosionDirection[0] * explosionDistance,
    explosionDirection[1] * explosionDistance,
    explosionDirection[2] * explosionDistance
  ];

  return [
    {
      keyframe_id: `${boardId}_appear`,
      pos: explosionPos,
      rot: [0, 0, 0],
      alpha: 0,
      duration: 0.1
    },
    {
      keyframe_id: `${boardId}_final`,
      pos: [0, 0, 0],
      rot: [0, 0, 0],
      alpha: 1,
      duration: null
    }
  ];
}

/**
 * Generate keyframes for cube animation
 * @param {string} cubeId - Cube part ID
 * @param {Object} cube - Cube data
 * @returns {Array} Array of keyframes
 */
function generateCubeKeyframes(cubeId, cube) {
  return [
    {
      keyframe_id: `${cubeId}_initial`,
      pos: calculateRelativePosition(cube.initial_position, cube.final_position),
      rot: calculateRelativeRotation(cube.initial_rotation, cube.final_rotation),
      alpha: 0,
      duration: 0.1
    },
    {
      keyframe_id: `${cubeId}_final`,
      pos: [0, 0, 0],
      rot: [0, 0, 0],
      alpha: 1,
      duration: null
    }
  ];
}

/**
 * Generate keyframes for screw animation
 * @param {string} screwId - Screw part ID
 * @param {Object} screw - Screw data
 * @returns {Array} Array of keyframes
 */
function generateScrewKeyframes(screwId, screw) {
  return [
    {
      keyframe_id: `${screwId}_initial`,
      pos: calculateRelativePosition(screw.initial_position, screw.final_position),
      rot: calculateRelativeRotation(screw.initial_rotation, screw.final_rotation),
      alpha: 0,
      duration: 0.1
    },
    {
      keyframe_id: `${screwId}_final`,
      pos: [0, 0, 0],
      rot: [0, 0, 0],
      alpha: 1,
      duration: null
    }
  ];
}

/**
 * Generate keyframes for piece animation
 * @param {string} pieceId - Piece part ID
 * @param {Object} piece - Piece data
 * @returns {Array} Array of keyframes
 */
function generatePieceKeyframes(pieceId, piece) {
  return [
    {
      keyframe_id: `${pieceId}_initial`,
      pos: calculateRelativePosition(piece.initial_position, piece.final_position),
      rot: calculateRelativeRotation(piece.initial_rotation, piece.final_rotation),
      alpha: 0,
      duration: 0.1
    },
    {
      keyframe_id: `${pieceId}_final`,
      pos: [0, 0, 0],
      rot: [0, 0, 0],
      alpha: 1,
      duration: null
    }
  ];
}

/**
 * Generate keyframes for bar animation
 * @param {string} barId - Bar part ID
 * @param {Object} bar - Bar data
 * @returns {Array} Array of keyframes
 */
function generateBarKeyframes(barId, bar) {
  return [
    {
      keyframe_id: `${barId}_initial`,
      pos: calculateRelativePosition(bar.initial_position, bar.final_position),
      rot: calculateRelativeRotation(bar.initial_rotation, bar.final_rotation),
      alpha: 0,
      duration: 0.1
    },
    {
      keyframe_id: `${barId}_final`,
      pos: [0, 0, 0],
      rot: [0, 0, 0],
      alpha: 1,
      duration: null
    }
  ];
}

/**
 * Helper functions
 */

function calculateAssemblyDisplacement(faceData) {
  // Extract displacement from initial position vs final position
  const finalPos = faceData.final_position;
  const initialPos = faceData.initial_position;
  
  const displacement = Math.sqrt(
    Math.pow(initialPos[0] - finalPos[0], 2) +
    Math.pow(initialPos[1] - finalPos[1], 2) +
    Math.pow(initialPos[2] - finalPos[2], 2)
  );
  
  return displacement;
}

function calculateBoardExplosionDirection(board, allBoards, faceName) {
  // Simple explosion direction based on face orientation
  const explosionDirections = {
    front: [0, 0, 1],
    back: [0, 0, -1],
    left: [-1, 0, 0],
    right: [1, 0, 0],
    top: [0, 1, 0],
    bottom: [0, -1, 0]
  };
  
  // return explosionDirections[faceName] || [0, 0, 1];
  return [0, 0, 1]; // Default explosion direction for simplicity
}

function calculateRelativePosition(absolutePos, parentPos) {
  return [
    absolutePos[0] - parentPos[0],
    absolutePos[1] - parentPos[1],
    absolutePos[2] - parentPos[2]
  ];
}

function calculateRelativeRotation(absoluteRot, parentRot) {
  return [
    absoluteRot[0] - parentRot[0],
    absoluteRot[1] - parentRot[1],
    absoluteRot[2] - parentRot[2]
  ];
}

function convertBoardTypeToModelKey(boardType) {
  // Convert "board_40x40" to "b40x40"
  return boardType && boardType.includes('board_') 
    ? 'b' + boardType.substring(6)
    : boardType;
}

/**
 * Calculate the center position of a strip from its boards
 * @param {Array} stripBoards - Array of boards in the strip
 * @returns {Array} Center position [x, y, z]
 */
function calculateStripCenterPosition(stripBoards) {
  if (stripBoards.length === 0) return [0, 0, 0];
  
  const sum = stripBoards.reduce((acc, board) => {
    return [
      acc[0] + board.position[0],
      acc[1] + board.position[1],
      acc[2] + board.position[2]
    ];
  }, [0, 0, 0]);
  
  return [
    sum[0] / stripBoards.length,
    sum[1] / stripBoards.length,
    sum[2] / stripBoards.length
  ];
}

/**
 * Calculate perpendicular direction for strip animation in XZ plane
 * @param {Array} stripBoards - Array of boards in the strip
 * @param {string} faceName - Face name (front, back, etc.)
 * @returns {Array} Perpendicular direction [x, y, z]
 */
function calculateStripPerpendicularDirection(stripBoards, faceName) {
  return [1, 0, 0]; // Default perpendicular direction for simplicity

  if ( (stripBoards.length < 2) || 1) {
    // Default perpendicular directions for each face
    const defaultDirections = {
      front: [1, 0, 0],   // X direction
      back: [1, 0, 0],    // X direction
      left: [1, 0, 0],    // Y direction
      right: [1, 0, 0],   // Y direction
      top: [1, 0, 0],     // X direction
      bottom: [1, 0, 0]   // X direction
    };
    return defaultDirections[faceName] || [1, 0, 0];
  }

  // Calculate strip direction from first two boards
  const board1 = stripBoards[0];
  const board2 = stripBoards[1];
  
  const stripDirection = [
    board2.position[0] - board1.position[0],
    board2.position[1] - board1.position[1],
    board2.position[2] - board1.position[2]
  ];

  // Normalize strip direction
  const stripLength = Math.sqrt(
    stripDirection[0] * stripDirection[0] +
    stripDirection[1] * stripDirection[1] +
    stripDirection[2] * stripDirection[2]
  );

  if (stripLength === 0) {
    return [1, 0, 0]; // Default direction
  }

  const normalizedStrip = [
    stripDirection[0] / stripLength,
    stripDirection[1] / stripLength,
    stripDirection[2] / stripLength
  ];

  // Calculate perpendicular direction in XZ plane
  // If strip is primarily in X direction, perpendicular is Z
  // If strip is primarily in Z direction, perpendicular is X
  if (Math.abs(normalizedStrip[0]) > Math.abs(normalizedStrip[2])) {
    // Strip is more X-oriented, perpendicular is Y
    return [0, 1, 0];
  } else {
    // Strip is more Z-oriented, perpendicular is X
    return [1, 0, 0];
  }
}

/**
 * Generate keyframes for strip animation with progressive displacement
 * @param {string} stripId - Strip part ID
 * @param {Array} stripCenterPos - Strip center position
 * @param {Array} perpendicularDirection - Perpendicular direction for animation
 * @param {number} stripMultiplier - Multiplier for displacement (1x, 2x, 3x, etc.)
 * @returns {Array} Array of keyframes
 */
function generateStripKeyframes(stripId, stripCenterPos, perpendicularDirection, stripMultiplier = 1) {
  // Progressive displacement: first strip = 1x, second = 2x, third = 3x, etc.
  const baseStripDisplacement = assemblyDisplacement * 0.3;
  const stripDisplacement = baseStripDisplacement * (stripMultiplier - 1);
  
  const displacementPos = [
    perpendicularDirection[0] * stripDisplacement,
    perpendicularDirection[1] * stripDisplacement,
    perpendicularDirection[2] * stripDisplacement
  ];

  return [
    {
      keyframe_id: `${stripId}_displaced`,
      pos: displacementPos,
      rot: [0, 0, 0],
      alpha: 1,
      duration: 0.1
    },
    {
      keyframe_id: `${stripId}_final`,
      pos: [0, 0, 0], // Final position is relative to itself
      rot: [0, 0, 0],
      alpha: 1,
      duration: null
    }
  ];
}

/**
 * Export debug logs
 */
export function exportDebugLogs() {
  return debugLogger.exportLogs();
}

/**
 * Export scene state as JSON for debugging
 */
export function exportSceneState(sceneGraph) {
  return {
    timestamp: new Date().toISOString(),
    sceneGraph,
    debugLogs: debugLogger.exportLogs(),
    metadata: {
      totalParts: Object.keys(sceneGraph).length,
      partTypes: Object.values(sceneGraph).reduce((acc, part) => {
        acc[part.properties.type] = (acc[part.properties.type] || 0) + 1;
        return acc;
      }, {})
    }
  };
}
