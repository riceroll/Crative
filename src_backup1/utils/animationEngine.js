// Animation Engine Module
// Handles motion sequences, progress calculations, and current state updates

/**
 * Create ordered motion sequence from scene graph keyframes
 * @param {Object} sceneGraph - Complete scene graph with all parts
 * @returns {Array} Ordered array of motion objects with timing information
 */
export function createMotionSequence(sceneGraph) {
  const motions = [];
  let cumulativeDuration = 0;

  // Define animation phases and their order
  const animationPhases = [
    // Phase 1: Face movements (flat -> initial -> final)
    { phase: 'face_flat', pattern: /_flat$/, duration: 0.1 },
    { phase: 'face_initial', pattern: /_initial$/, duration: 0.1 },
    
    // Phase 2: Board appearances (staggered by face)
    { phase: 'board_appear', pattern: /_appear$/, duration: 0.4 },
    
    // Phase 3: Cube movements
    { phase: 'cube_initial', pattern: /cube_.*_initial$/, duration: 0.2 },
    
    // Phase 4: Final movements (faces and boards to final positions)
    { phase: 'face_final', pattern: /face_.*_final$/, duration: 0.8 },
    { phase: 'board_final', pattern: /_final$/, duration: 0.6 },
    { phase: 'cube_final', pattern: /cube_.*_final$/, duration: 0.8 }
  ];

  // Process each animation phase
  animationPhases.forEach(phaseConfig => {
    const phaseMotions = [];
    
    // Collect all keyframes matching this phase
    Object.values(sceneGraph).forEach(part => {
      if (part.properties.keyframes) {
        part.properties.keyframes.forEach(keyframe => {
          if (phaseConfig.pattern.test(keyframe.keyframe_id)) {
            phaseMotions.push({
              keyframe_id: keyframe.keyframe_id,
              part_id: part.part_id,
              keyframe: keyframe,
              phase: phaseConfig.phase
            });
          }
        });
      }
    });

    // Sort motions within phase (e.g., by face order, board order)
    phaseMotions.sort((a, b) => {
      // Custom sorting logic for different phases
      if (phaseConfig.phase.startsWith('face_')) {
        return sortFaceMotions(a, b);
      } else if (phaseConfig.phase.startsWith('board_')) {
        return sortBoardMotions(a, b);
      } else if (phaseConfig.phase.startsWith('cube_')) {
        return sortCubeMotions(a, b);
      }
      return 0;
    });

    // Add motions to sequence with timing
    phaseMotions.forEach((motion, index) => {
      const startTime = cumulativeDuration;
      const duration = motion.keyframe.duration;
      const endTime = startTime + duration;

      motions.push({
        ...motion,
        startTime,
        duration,
        endTime,
        index: motions.length
      });

      // For staggered animations, add small delays between items
      if (phaseConfig.phase === 'board_appear') {
        cumulativeDuration += duration * 0.1; // 10% overlap
      } else {
        cumulativeDuration = Math.max(cumulativeDuration, endTime);
      }
    });
  });

  return {
    motions,
    totalDuration: cumulativeDuration,
    phaseCount: animationPhases.length
  };
}

/**
 * Update current states of all parts based on global progress
 * @param {Object} sceneGraph - Scene graph to update
 * @param {number} globalProgress - Progress from 0 to 1
 * @param {Object} motionSequence - Motion sequence from createMotionSequence
 * @returns {Object} Updated scene graph with current_state values
 */
export function updateCurrentStates(sceneGraph, globalProgress, motionSequence) {
  const currentTime = globalProgress * motionSequence.totalDuration;
  
  // Reset all parts to their default final state
  Object.values(sceneGraph).forEach(part => {
    part.properties.current_state = {
      rel_pos: [0, 0, 0],
      rel_rot: [0, 0, 0],
      alpha: part.properties.type === 'model' ? 1 : 1
    };
  });

  // Find active motions and apply interpolation
  motionSequence.motions.forEach(motion => {
    if (currentTime >= motion.startTime && currentTime <= motion.endTime) {
      // Motion is active - interpolate between keyframes
      const motionProgress = (currentTime - motion.startTime) / motion.duration;
      const clampedProgress = Math.max(0, Math.min(1, motionProgress));
      
      applyMotionToState(sceneGraph, motion, clampedProgress);
    } else if (currentTime > motion.endTime) {
      // Motion is complete - apply final state
      applyMotionToState(sceneGraph, motion, 1.0);
    }
    // If currentTime < motion.startTime, motion hasn't started yet (keep default state)
  });

  return sceneGraph;
}

/**
 * Apply a specific motion to a part's current state
 * @param {Object} sceneGraph - Scene graph to modify
 * @param {Object} motion - Motion object with keyframe data
 * @param {number} progress - Progress within this motion (0 to 1)
 */
function applyMotionToState(sceneGraph, motion, progress) {
  const part = sceneGraph[motion.part_id];
  if (!part) return;

  const keyframe = motion.keyframe;
  const currentState = part.properties.current_state;

  // Get the previous keyframe for interpolation
  const prevKeyframe = getPreviousKeyframe(part, motion.keyframe_id);
  
  if (prevKeyframe) {
    // Interpolate between previous and current keyframe
    currentState.rel_pos = interpolateVector(prevKeyframe.pos, keyframe.pos, progress);
    currentState.rel_rot = interpolateVector(prevKeyframe.rot, keyframe.rot, progress);
    currentState.alpha = interpolateScalar(prevKeyframe.alpha, keyframe.alpha, progress);
  } else {
    // No previous keyframe - interpolate from default state
    const defaultState = { pos: [0, 0, 0], rot: [0, 0, 0], alpha: part.properties.type === 'model' ? 1 : 1 };
    currentState.rel_pos = interpolateVector(defaultState.pos, keyframe.pos, progress);
    currentState.rel_rot = interpolateVector(defaultState.rot, keyframe.rot, progress);
    currentState.alpha = interpolateScalar(defaultState.alpha, keyframe.alpha, progress);
  }
}

/**
 * Get the previous keyframe in sequence for a part
 * @param {Object} part - Part object
 * @param {string} currentKeyframeId - Current keyframe ID
 * @returns {Object|null} Previous keyframe or null if none
 */
function getPreviousKeyframe(part, currentKeyframeId) {
  const keyframes = part.properties.keyframes;
  const currentIndex = keyframes.findIndex(kf => kf.keyframe_id === currentKeyframeId);
  
  if (currentIndex > 0) {
    return keyframes[currentIndex - 1];
  }
  
  return null;
}

/**
 * Interpolate between two 3D vectors
 * @param {Array} from - Starting vector [x, y, z]
 * @param {Array} to - Ending vector [x, y, z]
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {Array} Interpolated vector
 */
function interpolateVector(from, to, t) {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t
  ];
}

/**
 * Interpolate between two scalar values
 * @param {number} from - Starting value
 * @param {number} to - Ending value
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {number} Interpolated value
 */
function interpolateScalar(from, to, t) {
  return from + (to - from) * t;
}

/**
 * Sorting functions for different motion types
 */

function sortFaceMotions(a, b) {
  // Sort faces in assembly order: bottom, front, back, left, right, top
  const faceOrder = ['bottom', 'front', 'back', 'left', 'right', 'top'];
  
  const getFaceType = (partId) => {
    const match = partId.match(/face_(\w+)/);
    return match ? match[1] : '';
  };
  
  const aFace = getFaceType(a.part_id);
  const bFace = getFaceType(b.part_id);
  
  const aIndex = faceOrder.indexOf(aFace);
  const bIndex = faceOrder.indexOf(bFace);
  
  return aIndex - bIndex;
}

function sortBoardMotions(a, b) {
  // Sort boards by face first, then by strip and board indices
  const parsePartId = (partId) => {
    const match = partId.match(/face_(\w+)_board_(\d+)_(\d+)/);
    if (match) {
      return {
        face: match[1],
        strip: parseInt(match[2]),
        board: parseInt(match[3])
      };
    }
    return { face: '', strip: 0, board: 0 };
  };
  
  const aParts = parsePartId(a.part_id);
  const bParts = parsePartId(b.part_id);
  
  // First sort by face
  const faceComparison = sortFaceMotions(
    { part_id: `face_${aParts.face}` },
    { part_id: `face_${bParts.face}` }
  );
  
  if (faceComparison !== 0) return faceComparison;
  
  // Then by strip
  if (aParts.strip !== bParts.strip) {
    return aParts.strip - bParts.strip;
  }
  
  // Finally by board
  return aParts.board - bParts.board;
}

function sortCubeMotions(a, b) {
  // Sort cubes: corners first, then edges
  const isCorner = (partId) => partId.includes('corner');
  
  const aIsCorner = isCorner(a.part_id);
  const bIsCorner = isCorner(b.part_id);
  
  if (aIsCorner && !bIsCorner) return -1;
  if (!aIsCorner && bIsCorner) return 1;
  
  // Within same type, sort by index
  const getIndex = (partId) => {
    const match = partId.match(/_(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  };
  
  return getIndex(a.part_id) - getIndex(b.part_id);
}

/**
 * Debug functions
 */

export function debugMotionSequence(motionSequence) {
  console.log('[AnimationEngine] Motion Sequence Debug:');
  console.log(`Total Duration: ${motionSequence.totalDuration}`);
  console.log(`Total Motions: ${motionSequence.motions.length}`);
  
  motionSequence.motions.forEach((motion, index) => {
    console.log(`${index}: ${motion.keyframe_id} (${motion.startTime.toFixed(2)} - ${motion.endTime.toFixed(2)})`);
  });
  
  return motionSequence;
}

export function debugCurrentStates(sceneGraph, globalProgress) {
  console.log(`[AnimationEngine] Current States at progress ${globalProgress}:`);
  
  Object.entries(sceneGraph).forEach(([partId, part]) => {
    const state = part.properties.current_state;
    if (state.rel_pos.some(v => Math.abs(v) > 0.01) || 
        state.rel_rot.some(v => Math.abs(v) > 0.01) || 
        Math.abs(state.alpha - 1) > 0.01) {
      console.log(`${partId}:`, {
        pos: state.rel_pos.map(v => v.toFixed(2)),
        rot: state.rel_rot.map(v => v.toFixed(2)),
        alpha: state.alpha.toFixed(2)
      });
    }
  });
}

/**
 * Get active motions at a specific time
 * @param {Object} motionSequence - Motion sequence
 * @param {number} globalProgress - Global progress (0 to 1)
 * @returns {Array} Array of currently active motions
 */
export function getActiveMotions(motionSequence, globalProgress) {
  const currentTime = globalProgress * motionSequence.totalDuration;
  
  return motionSequence.motions.filter(motion => 
    currentTime >= motion.startTime && currentTime <= motion.endTime
  );
}

/**
 * Get motion progress for a specific motion
 * @param {Object} motion - Motion object
 * @param {number} globalProgress - Global progress (0 to 1)
 * @param {number} totalDuration - Total animation duration
 * @returns {number} Progress within the motion (0 to 1)
 */
export function getMotionProgress(motion, globalProgress, totalDuration) {
  const currentTime = globalProgress * totalDuration;
  
  if (currentTime < motion.startTime) return 0;
  if (currentTime > motion.endTime) return 1;
  
  return (currentTime - motion.startTime) / motion.duration;
}
