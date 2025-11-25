// Animation Engine Module
// Handles motion sequences, progress calculations, and current state updates

import * as THREE from 'three';

/**
 * Animation Configuration
 * Adjust these values to tweak the animation feel
 */
export const ANIMATION_TWEAKS = {
  // Fraction of the total motion duration to stay still at the start (0-1)
  START_PAUSE: 0.1,
  // Fraction of the total motion duration to stay still at the end (0-1)
  END_PAUSE: 0.1,
  // Exponent for the easing curve (higher = sharper acceleration/deceleration)
  // 3 = Cubic, 4 = Quartic, 5 = Quintic
  EASING_POWER: 4
};

/**
 * Create ordered motion sequence from scene graph keyframes
 * @param {Object} sceneGraph - Complete scene graph with all parts
 * @returns {Array} Ordered array of motion objects with timing information
 */
export function createMotionSequence(sceneGraph) {
  const motions = [];
  let cumulativeDuration = 0;

  const faceOrder = ['bottom', 'front', 'back', 'left', 'right', 'top'];

  const phaseMotions = [];

  // Helper function to collect keyframes matching a pattern
  function collectKeyframesMatchingPattern(pattern) {
    Object.values(sceneGraph).forEach(part => {
      if (part.properties.keyframes) {
        part.properties.keyframes.forEach(keyframe => {
          if (pattern.test(keyframe.keyframe_id)) {
            phaseMotions.push({
              keyframe_id: keyframe.keyframe_id,
              part_id: part.part_id,
              keyframe: keyframe
            });
          }
        });
      }
    });
  }

  for (const faceName of faceOrder) {
    // board appear phase
    let pattern = new RegExp(`face_${faceName}_strip_\\d+_board_\\d+_\\d+_appear$`);
    collectKeyframesMatchingPattern(pattern);

    // strip displaced phase
    pattern = new RegExp(`face_${faceName}_strip_\\d+_displaced$`);
    collectKeyframesMatchingPattern(pattern);

    // in-face piece initial phase
    pattern = new RegExp(`face_${faceName}_piece_\\d+_initial$`);
    collectKeyframesMatchingPattern(pattern);

    // in-face bar initial phase - HIDDEN: commented out to hide bars
    // pattern = new RegExp(`face_${faceName}_bar_\\d+_initial$`);
    // collectKeyframesMatchingPattern(pattern);

    // face flat phase
    pattern = new RegExp(`^face_${faceName}_flat$`);
    collectKeyframesMatchingPattern(pattern);

    // face cube initial phase
    pattern = new RegExp(`face_${faceName}_cube_\\d+_initial$`);
    collectKeyframesMatchingPattern(pattern);

    // face screw initial phase - HIDDEN: commented out to hide screws
    // pattern = new RegExp(`face_${faceName}_screw_\\d+_initial$`);
    // collectKeyframesMatchingPattern(pattern);

  }

  for ( const faceName of faceOrder) {

    if (faceName === 'bottom') {
      continue; // Skip bottom face for flipped and initial phases
    }

    // face flipped phase
    let pattern = new RegExp(`face_${faceName}_flipped$`);
    collectKeyframesMatchingPattern(pattern);

    // face initial phase
    pattern = new RegExp(`^face_${faceName}_initial$`);
    collectKeyframesMatchingPattern(pattern);
  }

  // cube initial phase
  let pattern = /^cube_(corner|edge)_\d+_initial$/;
  collectKeyframesMatchingPattern(pattern);

  // screw initial phase - HIDDEN: commented out to hide screws
  // pattern = /^screw_(corner|edge)_\d+_initial$/;
  // collectKeyframesMatchingPattern(pattern);

  // Add motions to sequence with timing and pre-computed camera targets
  phaseMotions.forEach((motion, index) => {
    const startTime = cumulativeDuration;
    let duration = motion.keyframe.duration;

    // Slow down cube animations
    if (motion.part_id.includes('cube')) {
      duration *= 3.0; // Make it 3x slower
    }

    const endTime = startTime + duration;

    const part = sceneGraph[motion.part_id];
    
    // Filter out motions with no actual movement
    const currentKeyframe = motion.keyframe;
    const nextKeyframe = getNextKeyframe(part, motion.keyframe_id);
    
    if (nextKeyframe) {
      // Check if position and rotation are identical
      const posIdentical = currentKeyframe.pos[0] === nextKeyframe.pos[0] &&
                          currentKeyframe.pos[1] === nextKeyframe.pos[1] &&
                          currentKeyframe.pos[2] === nextKeyframe.pos[2];
      
      const rotIdentical = currentKeyframe.rot[0] === nextKeyframe.rot[0] &&
                          currentKeyframe.rot[1] === nextKeyframe.rot[1] &&
                          currentKeyframe.rot[2] === nextKeyframe.rot[2];
      
      // Skip this motion if both position and rotation are identical
      if (posIdentical && rotIdentical) {
        return; // Skip adding this motion
      }
    }
    
    // Pre-compute camera focus target (world position) for this motion
    const cameraFocusTarget = computeCameraFocusTargetForMotion(part, motion.keyframe, sceneGraph);
    const cameraDistance = calculateOptimalDistanceForMotion(part, motion.keyframe);
    const cameraAngle = getCameraAngleForMotionPhase(part, motion.keyframe);

    motions.push({
      ...motion,
      startTime,
      duration,
      endTime,
      index: motions.length,
      // Pre-computed camera parameters
      cameraFocusTarget,  // World position to look at
      cameraDistance,     // Optimal viewing distance
      cameraAngle        // Optimal viewing angle [pitch, yaw, roll]
    });

    cumulativeDuration = Math.max(cumulativeDuration, endTime);
  });

  return {
    motions,
    totalDuration: cumulativeDuration
  };
}

/**
 * Update current states of all parts based on global progress
 * @param {Object} sceneGraph - Scene graph to update
 * @param {number} globalProgress - Progress from 0 to 1
 * @param {Object} motionSequence - Motion sequence from createMotionSequence
 * @returns {Object} { sceneGraph, activePart } - Updated scene graph and currently active part info
 */
export function updateCurrentStates(sceneGraph, globalProgress, motionSequence) {
  const currentTime = globalProgress * motionSequence.totalDuration;
  let activePart = null;
  
  // Reset all parts to their default final state
  Object.values(sceneGraph).forEach(part => {
    part.properties.current_state = {
      rel_pos: [0, 0, 0],
      rel_rot: [0, 0, 0],
      alpha: part.properties.type === 'model' ? 1 : 1
    };
  });
    
    // Pass 1: Forward - apply only completed motions (progress = 1.0)
    motionSequence.motions.forEach(motion => {
        if (currentTime >= motion.endTime) {
            applyMotionToState(sceneGraph, motion, 1.0);
        }
    });

    // Pass 2: Backward - apply only not-yet-started motions (progress = 0.0)
    for (let i = motionSequence.motions.length - 1; i >= 0; i--) {
        const motion = motionSequence.motions[i];
        if (currentTime <= motion.startTime) {
            applyMotionToState(sceneGraph, motion, 0.0);
        }
    }

    // Pass 3: Forward - apply only active/in-progress motions (0 < progress < 1)
    motionSequence.motions.forEach(motion => {
        if (currentTime > motion.startTime && currentTime <= motion.endTime) {
            const motionProgress = (currentTime - motion.startTime) / motion.duration;
            const clampedProgress = Math.max(0, Math.min(1, motionProgress));
            if (clampedProgress > 0 && clampedProgress < 1) {
                applyMotionToState(sceneGraph, motion, clampedProgress);
                
                // Track the active part for camera (use the last active motion for camera focus)
                const part = sceneGraph[motion.part_id];
                if (part) {
                  activePart = {
                    partId: motion.part_id,
                    part: part,
                    motion: motion,
                    progress: clampedProgress
                  };
                }
            }
        }
    });

  return { sceneGraph, activePart };
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

  // Apply easing to the progress for smoother animation
  const easedProgress = customEase(progress);

  // Get the next keyframe for interpolation
  const nextKeyframe = getNextKeyframe(part, motion.keyframe_id);
  
  if (nextKeyframe) {
    // Interpolate between current and next keyframe
    currentState.rel_pos = interpolateVector(keyframe.pos, nextKeyframe.pos, easedProgress);
    currentState.rel_rot = interpolateVector(keyframe.rot, nextKeyframe.rot, easedProgress);
    currentState.alpha = interpolateScalar(keyframe.alpha, nextKeyframe.alpha, easedProgress);
  } else {
    // No next keyframe - interpolate from default state
    const defaultState = { pos: [0, 0, 0], rot: [0, 0, 0], alpha: part.properties.type === 'model' ? 1 : 1 };
    currentState.rel_pos = interpolateVector(keyframe.pos, defaultState.pos, easedProgress);
    currentState.rel_rot = interpolateVector(keyframe.rot, defaultState.rot, easedProgress);
    currentState.alpha = interpolateScalar(keyframe.alpha, defaultState.alpha, easedProgress);
  }
}

/**
 * Get the Next keyframe in sequence for a part
 * @param {Object} part - Part object
 * @param {string} currentKeyframeId - Current keyframe ID
 * @returns {Object|null} Next keyframe or null if none
 */
function getNextKeyframe(part, currentKeyframeId) {
  const keyframes = part.properties.keyframes;
  const currentIndex = keyframes.findIndex(kf => kf.keyframe_id === currentKeyframeId);
  
  if (currentIndex < keyframes.length - 1) {
    return keyframes[currentIndex + 1];
  }
  
  return null;
}

/**
 * Custom easing function with pauses and configurable curve
 * @param {number} t - Linear progress (0 to 1)
 * @returns {number} Eased progress
 */
function customEase(t) {
  const { START_PAUSE, END_PAUSE, EASING_POWER } = ANIMATION_TWEAKS;
  
  // Handle start pause
  if (t <= START_PAUSE) return 0;
  
  // Handle end pause
  if (t >= 1 - END_PAUSE) return 1;
  
  // Normalize t to the active range [0, 1]
  const activeDuration = 1 - START_PAUSE - END_PAUSE;
  const activeT = (t - START_PAUSE) / activeDuration;
  
  // Apply Ease In Out with configurable power
  // Formula: t < 0.5 ? 2^(n-1) * t^n : 1 - (-2t + 2)^n / 2
  return activeT < 0.5 
    ? Math.pow(2, EASING_POWER - 1) * Math.pow(activeT, EASING_POWER) 
    : 1 - Math.pow(-2 * activeT + 2, EASING_POWER) / 2;
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

/**
 * Camera Helper Functions
 */

/**
 * Compute camera focus target (world position) for a motion's keyframe
 * This calculates where the camera should look during this specific animation phase
 * Returns the midpoint of the trajectory for this motion
 * @param {Object} part - Part from scene graph
 * @param {Object} keyframe - Keyframe data
 * @param {Object} sceneGraph - Full scene graph for parent traversal
 * @returns {Array} World position [x, y, z] to focus camera on
 */
function computeCameraFocusTargetForMotion(part, keyframe, sceneGraph) {
  if (!part || !keyframe) {
    return [0, 0, 0];
  }

  // Calculate the start position (current keyframe)
  const startWorldPos = calculateWorldPositionForKeyframe(part, keyframe, sceneGraph);
  
  // Calculate the end position (next keyframe)
  const nextKeyframe = getNextKeyframe(part, keyframe.keyframe_id);
  let endWorldPos = startWorldPos;
  
  if (nextKeyframe) {
    endWorldPos = calculateWorldPositionForKeyframe(part, nextKeyframe, sceneGraph);
  }
  
  // Calculate midpoint of the trajectory
  const midWorldPos = [
    (startWorldPos[0] + endWorldPos[0]) / 2,
    (startWorldPos[1] + endWorldPos[1]) / 2,
    (startWorldPos[2] + endWorldPos[2]) / 2
  ];
  
  // Scale the position to match the scene scale (0.1)
  const scaledPos = [
    midWorldPos[0] * 0.1,
    midWorldPos[1] * 0.1,
    midWorldPos[2] * 0.1
  ];
  
  return scaledPos;
}

/**
 * Calculate world position for a part at a specific keyframe state
 * @param {Object} part - Part from scene graph
 * @param {Object} keyframe - Keyframe data with pos/rot
 * @param {Object} sceneGraph - Full scene graph for parent traversal
 * @returns {Array} World position [x, y, z]
 */
function calculateWorldPositionForKeyframe(part, keyframe, sceneGraph) {
  // Build the path from root to this part
  const path = [];
  let currentPart = part;
  
  // Traverse up to build the path
  while (currentPart) {
    path.unshift(currentPart); // Add to beginning
    
    if (currentPart.properties.parent && currentPart.properties.parent.part_id !== 'crate_root') {
      currentPart = currentPart.properties.parent;
    } else {
      break;
    }
  }
  
  // Start with world origin
  let worldPos = [0, 0, 0];
  
  // Apply transforms from root to target
  for (let i = 0; i < path.length; i++) {
    const partInPath = path[i];
    
    // For the target part, use its base position + keyframe position
    if (partInPath === part) {
      const totalPos = [
        partInPath.properties.pos[0] + keyframe.pos[0],
        partInPath.properties.pos[1] + keyframe.pos[1],
        partInPath.properties.pos[2] + keyframe.pos[2]
      ];
      worldPos[0] += totalPos[0];
      worldPos[1] += totalPos[1];
      worldPos[2] += totalPos[2];
    } else {
      // For parent parts, just use their base position
      worldPos[0] += partInPath.properties.pos[0];
      worldPos[1] += partInPath.properties.pos[1];
      worldPos[2] += partInPath.properties.pos[2];
    }
  }
  
  return worldPos;
}

/**
 * Calculate optimal camera distance for a motion's keyframe
 * @param {Object} part - Part from scene graph
 * @param {Object} keyframe - Keyframe data
 * @returns {number} Optimal camera distance
 */
function calculateOptimalDistanceForMotion(part, keyframe) {
  const partId = part.part_id;

  // Distance based on part type for optimal framing
  if (partId.includes('cube') || partId.includes('screw') || partId.includes('piece')) {
    return 20;
  }

  if (partId.includes('bar')) {
    return 80;
  }

  if (partId.includes('board')) {
    return 80;
  }

  if (partId.includes('strip')) {
    return 80;
  }
  
  if (partId.startsWith('face_')) {
    return 80;
  }

  // Default distance
  return 80;
}

/**
 * Get camera angle for a motion phase
 * @param {Object} part - Part from scene graph
 * @param {Object} keyframe - Keyframe data
 * @returns {Array} Camera angle [pitch, yaw, roll]
 */
function getCameraAngleForMotionPhase(part, keyframe) {
  return [Math.PI / 4, Math.PI / 4, 0];
  const keyframeId = keyframe.keyframe_id;
  const partId = part.part_id;
  
  // Determine face orientation for better viewing angle
  if (partId.includes('face_top')) {
    return [Math.PI / 2.5, 0, 0]; // Look from above for top face
  }
  
  if (partId.includes('face_bottom')) {
    return [Math.PI / 6, Math.PI / 4, 0]; // Slight angle for bottom
  }
  
  if (partId.includes('face_front')) {
    return [Math.PI / 6, 0, 0]; // Straight on for front
  }
  
  if (partId.includes('face_back')) {
    return [Math.PI / 6, Math.PI, 0]; // Look from behind
  }
  
  if (partId.includes('face_left')) {
    return [Math.PI / 6, -Math.PI / 2, 0]; // Look from left
  }
  
  if (partId.includes('face_right')) {
    return [Math.PI / 6, Math.PI / 2, 0]; // Look from right
  }
  
  // Animation phase-based angles
  if (keyframeId.includes('_appear')) {
    return [Math.PI / 6, Math.PI / 4, 0]; // Slightly elevated for appear
  }
  
  if (keyframeId.includes('_displaced')) {
    return [Math.PI / 4, Math.PI / 3, 0]; // More angled for displaced
  }
  
  if (keyframeId.includes('_initial')) {
    return [Math.PI / 3, Math.PI / 4, 0]; // Higher view for initial
  }
  
  if (keyframeId.includes('_flat')) {
    return [Math.PI / 4, Math.PI / 4, 0]; // Standard angle for flat
  }
  
  if (keyframeId.includes('_flipped')) {
    return [Math.PI / 3, Math.PI / 6, 0]; // Higher for flipped
  }
  
  // Default angle - 45 degrees on both axes
  return [Math.PI / 4, Math.PI / 4, 0];
}

/**
 * Calculate world position for a part
 * @param {Object} part - Part from scene graph
 * @param {Object} sceneGraph - Full scene graph for parent traversal
 * @returns {Array} World position [x, y, z]
 */
export function calculateWorldPosition_backup(part, sceneGraph) {
  const worldPos = [part.properties.pos[0], part.properties.pos[1], part.properties.pos[2]];
  const currentState = part.properties.current_state;
  
  // // Add current relative position
  // worldPos[0] += currentState.rel_pos[0];
  // worldPos[1] += currentState.rel_pos[1];
  // worldPos[2] += currentState.rel_pos[2];
  
  // Traverse parent hierarchy if needed
  let currentPart = part;
  while (currentPart.properties.parent && currentPart.properties.parent.part_id !== 'crate_root') {
    const parentPart = currentPart.properties.parent;
    if (parentPart) {
      worldPos[0] += parentPart.properties.pos[0];
      worldPos[1] += parentPart.properties.pos[1];
      worldPos[2] += parentPart.properties.pos[2];
      currentPart = parentPart;
    } else {
      break;
    }
  }

  console.log('Calculated world position for', part.part_id, ':', worldPos);
  
  return worldPos;
}

/**
 * Calculate world position for a part (applying rotations and positions in hierarchy)
 * @param {Object} part - Part from scene graph
 * @param {Object} sceneGraph - Full scene graph for parent traversal
 * @returns {Array} World position [x, y, z]
 */
export function calculateWorldPosition(part, sceneGraph) {
  // Build the path from root to this part
  const path = [];
  let currentPart = part;
  
  // Traverse up to build the path
  while (currentPart) {
    path.unshift(currentPart); // Add to beginning
    
    if (currentPart.properties.parent && currentPart.properties.parent.part_id !== 'crate_root') {
      currentPart = currentPart.properties.parent;
    } else {
      break;
    }
  }
  
  // Collect all relative positions and rotations from root to target
  const transforms = path.map(partInPath => {
    const localPos = [...partInPath.properties.pos];
    const localRot = [...partInPath.properties.rot];
        
    return { pos: localPos, rot: localRot };
  });
  
  // Apply transforms from root to target
  let worldPos = [0, 0, 0];
  
  for (let i = 0; i < transforms.length; i++) {
    const transform = transforms[i];
    
    // If not the first (root), apply parent's rotation to this position
    if (i > 0) {
      const parentRot = transforms[i - 1].rot;
      const rotatedPos = applyRotation(transform.pos, parentRot);
      worldPos[0] += rotatedPos[0];
      worldPos[1] += rotatedPos[1];
      worldPos[2] += rotatedPos[2];
    } else {
      // Root node - just add position directly
      worldPos[0] += transform.pos[0];
      worldPos[1] += transform.pos[1];
      worldPos[2] += transform.pos[2];
    }
  }
  
  console.log('Calculated world position for', part.part_id, ':', worldPos);
  
  return worldPos;
}

/**
 * Apply rotation to a position vector
 * Assumes rotation order: Z, Y, X (Euler angles in radians)
 * @param {Array} pos - Position [x, y, z]
 * @param {Array} rot - Rotation [rx, ry, rz] in radians
 * @returns {Array} Rotated position
 */
function applyRotation(pos, rot) {
  const [x, y, z] = pos;
  const [rx, ry, rz] = rot;
  
  // Rotation around Z axis
  let x1 = x * Math.cos(rz) - y * Math.sin(rz);
  let y1 = x * Math.sin(rz) + y * Math.cos(rz);
  let z1 = z;
  
  // Rotation around Y axis
  let x2 = x1 * Math.cos(ry) + z1 * Math.sin(ry);
  let y2 = y1;
  let z2 = -x1 * Math.sin(ry) + z1 * Math.cos(ry);
  
  // Rotation around X axis
  let x3 = x2;
  let y3 = y2 * Math.cos(rx) - z2 * Math.sin(rx);
  let z3 = y2 * Math.sin(rx) + z2 * Math.cos(rx);
  
  return [x3, y3, z3];
}

/**
 * Get camera target position for active part
 * @param {Object} activePart - Active part info from updateCurrentStates
 * @param {Object} sceneGraph - Full scene graph
 * @returns {Array|null} Target position [x, y, z] or null if no active part
 */
export function getCameraTargetForActivePart(activePart, sceneGraph) {
  if (!activePart) return null;
  
  const { part, motion, progress } = activePart;
  const keyframe = motion.keyframe;
  const nextKeyframe = getNextKeyframe(part, motion.keyframe_id);

  const currentWorldPos = calculateWorldPosition(part, sceneGraph);
  
  // Calculate end position by adding the displacement between keyframes
  const endWorldPos = [
    currentWorldPos[0] + (nextKeyframe.pos[0] - keyframe.pos[0]),
    currentWorldPos[1] + (nextKeyframe.pos[1] - keyframe.pos[1]),
    currentWorldPos[2] + (nextKeyframe.pos[2] - keyframe.pos[2])
  ];

  const outPos = currentWorldPos;


  const scaledPos = [
    outPos[0] * 0.1,
    outPos[1] * 0.1,
    outPos[2] * 0.1
      ];

  return scaledPos;
  
}

/**
 * Calculate optimal camera distance based on part type
 * @param {Object} part - Part from scene graph
 * @returns {number} Optimal camera distance
 */
export function calculateOptimalDistance(part, motion) {
  return 300;
  const partType = part.properties.type;
  const partId = part.part_id;

  if (partId.includes('cube') || partId.includes('screw') || partId.includes('piece')) {
    return 30;
  }

  if (partId.includes('bar')) {
    return 50;
  }

  if (partId.includes('board')) {
    return 80;
  }

  if (partId.includes('strip')) {
    return 120;
  }
  
  if (partId.startsWith('face_')) {
    return 200;
  }

  // get start and end position, calculate the distance and return a value based on that
  const keyframe = motion.keyframe;
  const nextKeyframe = getNextKeyframe(part, motion.keyframe_id);
  const startPos = [...part.properties.pos];
  startPos[0] += keyframe.pos[0];
  startPos[1] += keyframe.pos[1];
  startPos[2] += keyframe.pos[2];
  
  let endPos;
  if (nextKeyframe) {
    endPos = [...part.properties.pos];
    endPos[0] += nextKeyframe.pos[0];
    endPos[1] += nextKeyframe.pos[1];
    endPos[2] += nextKeyframe.pos[2];
  } else {
    endPos = [...part.properties.pos];
  }
  
  const distance = Math.sqrt(
    Math.pow(endPos[0] - startPos[0], 2) +
    Math.pow(endPos[1] - startPos[1], 2) +
    Math.pow(endPos[2] - startPos[2], 2)
  );
  
  return distance * 1; // Scale factor for better framing
  
  
}

/**
 * Get camera angle based on part type and motion phase
 * @param {Object} part - Part from scene graph
 * @param {Object} motion - Motion object
 * @returns {Array} Camera angle [pitch, yaw, roll]
 */
export function getCameraAngleForMotion(part, motion) {
  return [Math.PI / 4, Math.PI / 4, 0]; // Default angle

  const keyframeId = motion.keyframe_id;
  const partId = part.part_id;
  
  // Determine face orientation for better viewing angle
  if (partId.includes('face_top')) {
    return [Math.PI / 2.5, 0, 0]; // Look from above for top face
  }
  
  if (partId.includes('face_bottom')) {
    return [Math.PI / 6, Math.PI / 4, 0]; // Slight angle for bottom
  }
  
  if (partId.includes('face_front')) {
    return [Math.PI / 6, 0, 0]; // Straight on for front
  }
  
  if (partId.includes('face_back')) {
    return [Math.PI / 6, Math.PI, 0]; // Look from behind
  }
  
  if (partId.includes('face_left')) {
    return [Math.PI / 6, -Math.PI / 2, 0]; // Look from left
  }
  
  if (partId.includes('face_right')) {
    return [Math.PI / 6, Math.PI / 2, 0]; // Look from right
  }
  
  // Animation phase-based angles
  if (keyframeId.includes('_appear')) {
    return [Math.PI / 6, Math.PI / 4, 0]; // Slightly elevated for appear
  }
  
  if (keyframeId.includes('_displaced')) {
    return [Math.PI / 4, Math.PI / 3, 0]; // More angled for displaced
  }
  
  if (keyframeId.includes('_initial')) {
    return [Math.PI / 3, Math.PI / 4, 0]; // Higher view for initial
  }
  
  if (keyframeId.includes('_flat')) {
    return [Math.PI / 4, Math.PI / 4, 0]; // Standard angle for flat
  }
  
  if (keyframeId.includes('_flipped')) {
    return [Math.PI / 3, Math.PI / 6, 0]; // Higher for flipped
  }
  
  // Default angle - 45 degrees on both axes
  return [Math.PI / 4, Math.PI / 4, 0];
}

/**
 * Get camera parameters for active part
 * @param {Object} activePart - Active part info from updateCurrentStates
 * @param {Object} sceneGraph - Full scene graph
 * @returns {Object|null} { target, distance, angle } or null if no active part
 */
export function getCameraParameters(activePart, sceneGraph) {
  if (!activePart) return null;
  
  const target = getCameraTargetForActivePart(activePart, sceneGraph);
  const distance = calculateOptimalDistance(activePart.part, activePart.motion);
  const angle = getCameraAngleForMotion(activePart.part, activePart.motion);
  
  return { target, distance, angle };
}

/**
 * Get camera parameters from motion sequence based on global progress
 * Interpolates between previous motion's target and current motion's target
 * @param {Object} motionSequence - Motion sequence with pre-computed camera targets
 * @param {number} globalProgress - Progress from 0 to 1
 * @returns {Object} { target, distance, angle } - Camera parameters for current phase
 */
export function getInterpolatedCameraParameters(motionSequence, globalProgress) {
  if (!motionSequence || !motionSequence.motions || motionSequence.motions.length === 0) {
    // Default camera parameters
    return {
      target: [0, 0, 0],
      distance: 150,
      angle: [Math.PI / 4, Math.PI / 4, 0]
    };
  }

  const currentTime = globalProgress * motionSequence.totalDuration;
  
  // Find the active motion that covers the current time
  const activeMotion = motionSequence.motions.find(motion => 
    currentTime >= motion.startTime && currentTime <= motion.endTime
  );

  if (activeMotion) {
    // Determine start parameters (from previous motion or default)
    let startParams = {
      target: [0, 0, 0],
      distance: 150,
      angle: [Math.PI / 4, Math.PI / 4, 0]
    };

    // If there is a previous motion, use its end parameters
    if (activeMotion.index > 0) {
      const prevMotion = motionSequence.motions[activeMotion.index - 1];
      startParams = {
        target: prevMotion.cameraFocusTarget,
        distance: prevMotion.cameraDistance,
        angle: prevMotion.cameraAngle
      };
    } else {
        // For the very first motion, use the current target as start to avoid jump
        startParams = {
            target: activeMotion.cameraFocusTarget,
            distance: activeMotion.cameraDistance,
            angle: activeMotion.cameraAngle
        };
    }

    // End parameters are the current motion's target
    const endParams = {
      target: activeMotion.cameraFocusTarget,
      distance: activeMotion.cameraDistance,
      angle: activeMotion.cameraAngle
    };

    // Calculate progress within this motion
    const timeInMotion = currentTime - activeMotion.startTime;
    const linearProgress = timeInMotion / activeMotion.duration;
    
    // Make camera move faster than the object to settle earlier
    // Finish the camera move in the first 60% of the motion duration
    const cameraFinishFactor = 0.6; 
    const acceleratedProgress = Math.min(1, linearProgress / cameraFinishFactor);
    
    // Apply the same easing as the parts
    const easedProgress = customEase(acceleratedProgress);

    // Interpolate
    return {
      target: interpolateVector(startParams.target, endParams.target, easedProgress),
      distance: interpolateScalar(startParams.distance, endParams.distance, easedProgress),
      angle: interpolateVector(startParams.angle, endParams.angle, easedProgress)
    };
  }

  // No active motions - find the nearest motion
  // Either we're before all motions or after all motions
  if (currentTime <= motionSequence.motions[0].startTime) {
    // Before first motion - use first motion's camera
    const firstMotion = motionSequence.motions[0];
    return {
      target: firstMotion.cameraFocusTarget,
      distance: firstMotion.cameraDistance,
      angle: firstMotion.cameraAngle
    };
  }

  // After all motions - use last motion's camera
  const lastMotion = motionSequence.motions[motionSequence.motions.length - 1];
  return {
    target: lastMotion.cameraFocusTarget,
    distance: lastMotion.cameraDistance,
    angle: lastMotion.cameraAngle
  };
}

/**
 * Pre-compute camera targets by running animation to each phase's end and capturing Three.js positions
 * Uses activePart to determine which part to focus on at each phase
 * @param {Object} motionSequence - Motion sequence to update
 * @param {Object} threeScene - Three.js scene
 * @param {Object} sceneGraph - Scene graph
 * @param {Function} setProgressCallback - Function to set animation progress
 * @returns {Promise<Object>} Updated motion sequence with real camera targets
 */
export async function precomputeCameraTargetsFromAnimation(
  motionSequence,
  threeScene,
  sceneGraph,
  setProgressCallback,
  onProgressUpdate
) {
  if (!motionSequence || !threeScene || !sceneGraph || !setProgressCallback) {
    return motionSequence;
  }

  const updatedMotions = [];
  const totalMotions = motionSequence.motions.length;

  for (let i = 0; i < totalMotions; i++) {
    const motion = motionSequence.motions[i];
    
    // Report progress
    if (onProgressUpdate) {
      onProgressUpdate(i + 1, totalMotions);
    }
    
    // Calculate progress for the END of this motion (slightly before absolute end)
    const targetTime = Math.max(0, motion.endTime - 0.01);
    const targetProgress = Math.min(1, Math.max(0, targetTime / motionSequence.totalDuration));
    
    // Set animation to this progress - triggers re-render
    setProgressCallback(targetProgress);
    
    // Wait for React and Three.js to render (2 frames)
    await new Promise(resolve => requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    }));
    
    // Update scene graph to get the activePart at this progress
    const { activePart } = updateCurrentStates(
      JSON.parse(JSON.stringify(sceneGraph)),
      targetProgress,
      motionSequence
    );
    
    let cameraFocusTarget = [0, 0, 0]; // Default fallback
    
    // If we have an activePart, find its Three.js mesh and get world position
    if (activePart) {
      const targetPartId = activePart.partId;
      
      // Find the Three.js mesh for this part
      let targetMesh = null;
      threeScene.traverse((object) => {
        if (object.userData && object.userData.part_id === targetPartId) {
          targetMesh = object;
        }
      });
      
      if (targetMesh) {
        // Get actual world position from Three.js
        const worldPos = new THREE.Vector3();
        targetMesh.getWorldPosition(worldPos);
        cameraFocusTarget = [worldPos.x, worldPos.y, worldPos.z];
      }
    }
    
    // Store this position as the camera focus target
    updatedMotions.push({
      ...motion,
      cameraFocusTarget: cameraFocusTarget
    });
  }

  return {
    ...motionSequence,
    motions: updatedMotions
  };
}
