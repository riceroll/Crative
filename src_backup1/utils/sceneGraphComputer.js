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
      console.log(`[SceneGraph] ${step}:`, data);
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

  if (!selectedCandidate || !selectedCandidate.faceLayouts || !selectedCandidate.cubeLayouts) {
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

  debugLogger.log('computeSceneGraph_complete', {
    totalParts: Object.keys(sceneGraph).length,
    faceChildren: faceChildren.length,
    cubeChildren: cubeChildren.length
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

    // Generate board parts for this face
    const boardChildren = generateBoardParts(faceData.boards, faceId, faceName, sceneGraph);
    sceneGraph[faceId].properties.children.push(...boardChildren);

    debugLogger.log('generateFaceParts_face', {
      faceId,
      boardCount: boardChildren.length,
      finalPos: faceData.final_position,
      initialPos: faceData.initial_position
    });
  });

  return faceChildren;
}

/**
 * Generate board parts from face boards
 * @param {Array} boards - Array of board data from face
 * @param {string} faceId - Parent face ID
 * @param {string} faceName - Face name (front, back, etc.)
 * @param {Object} sceneGraph - Scene graph being built
 * @returns {Array} Array of board part IDs
 */
function generateBoardParts(boards, faceId, faceName, sceneGraph) {
  debugLogger.log('generateBoardParts_start', { 
    faceId, 
    boardCount: boards.length 
  });

  const boardChildren = [];

  boards.forEach((board, index) => {
    const boardId = `${faceId}_board_${board.id_0}_${board.id_1}`;
    boardChildren.push(boardId);

    // Calculate explosion direction for board assembly animation
    const explosionDirection = calculateBoardExplosionDirection(board, boards, faceName);

    sceneGraph[boardId] = {
      part_id: boardId,
      properties: {
        current_state: { rel_pos: [0, 0, 0], rel_rot: [0, 0, 0], alpha: 0 },
        type: 'model',
        model_id: convertBoardTypeToModelKey(board.type),
        pos: board.position,
        rot: board.rotation || [0, 0, 0],
        children: [],
        keyframes: generateBoardKeyframes(boardId, board, explosionDirection)
      }
    };

    debugLogger.log('generateBoardParts_board', {
      boardId,
      type: board.type,
      position: board.position,
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
          keyframes: generateCubeKeyframes(cubeId, cube)
        }
      };
    });
  }

  debugLogger.log('generateCubeParts_complete', { totalCubes: cubeChildren.length });
  return cubeChildren;
}

/**
 * Generate keyframes for face animation
 * @param {string} faceId - Face part ID
 * @param {Object} faceData - Face data from faceLayouts
 * @param {number} assemblyDisplacement - Calculated assembly displacement
 * @returns {Array} Array of keyframes
 */
function generateFaceKeyframes(faceId, faceData, assemblyDisplacement) {
  return [
    {
      keyframe_id: `${faceId}_flat`,
      pos: calculateRelativePosition(faceData.flat_position, faceData.final_position),
      rot: calculateRelativeRotation(faceData.flat_rotation, faceData.final_rotation),
      alpha: 1,
      duration: 0.1
    },
    {
      keyframe_id: `${faceId}_initial`,
      pos: calculateRelativePosition(faceData.initial_position, faceData.final_position),
      rot: calculateRelativeRotation(faceData.initial_rotation, faceData.final_rotation),
      alpha: 1,
      duration: 0.1
    },
    {
      keyframe_id: `${faceId}_final`,
      pos: [0, 0, 0], // Final position is relative to itself
      rot: [0, 0, 0],
      alpha: 1,
      duration: 0.8
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
      duration: 0.4
    },
    {
      keyframe_id: `${boardId}_final`,
      pos: [0, 0, 0],
      rot: [0, 0, 0],
      alpha: 1,
      duration: 0.6
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
      alpha: 1,
      duration: 0.2
    },
    {
      keyframe_id: `${cubeId}_final`,
      pos: [0, 0, 0],
      rot: [0, 0, 0],
      alpha: 1,
      duration: 0.8
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
  
  return explosionDirections[faceName] || [0, 0, 1];
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
