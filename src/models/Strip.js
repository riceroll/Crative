import React from 'react';
import Board from './Board';
import { assemblyDisplacement } from '../configs/globalConfigs';
import * as THREE from 'three';

export default function Strip({
  name,
  progress, // Overall progress from Face (0 to 1)
  stripIndex, // This strip's index (e.g., 0, 1, 2...)
  totalStrips, // Total number of strips in the parent Face
  explosionAxis, // Axis for initial displacement [x,y,z], relative to Face's group
  boardsInStrip,
  position, // Final position of this strip, relative to Face's group
  rotation, // Final rotation of this strip, relative to Face's group
  ...props
}) {
  // Calculate this strip's local progress for sequential animation
  let stripLocalProgress = 0;
  if (totalStrips > 0 && stripIndex !== undefined) {
    const durationPerStrip = 1 / totalStrips;
    const myStartTime = stripIndex * durationPerStrip;
    const myEndTime = (stripIndex + 1) * durationPerStrip;

    if (progress <= myStartTime) {
      stripLocalProgress = 0; // Animation for this strip hasn't started
    } else if (progress >= myEndTime) {
      stripLocalProgress = 1; // Animation for this strip is complete
    } else {
      // Animation is in progress for this strip
      stripLocalProgress = (progress - myStartTime) / durationPerStrip;
    }
  } else {
    // Fallback if sequencing info is missing: animate all at once
    stripLocalProgress = progress;
  }
  
  // Define the displacement vector based on the provided explosionAxis
  // Default to [0,0,1] if explosionAxis is not provided
  const actualDisplacementVector = new THREE.Vector3().fromArray(explosionAxis || [0, 0, 1]);

  const finalRelativePosVec = new THREE.Vector3().fromArray(position);
  
  // Calculate the initial "apart" position: final position + displacement
  const initialRelativePosVec = finalRelativePosVec.clone().addScaledVector(actualDisplacementVector, assemblyDisplacement);

  // Interpolate current position from 'initialRelativePosVec' to 'finalRelativePosVec'
  // based on 'stripLocalProgress'
  const currentPosVec = new THREE.Vector3().lerpVectors(initialRelativePosVec, finalRelativePosVec, stripLocalProgress);

  return (
    // The group's rotation is its final rotation. Its position is animated.
    <group position={currentPosVec.toArray()} rotation={rotation} {...props}>
      {boardsInStrip.map((board, index) => (
        <Board
          // Use board.id_1 if available and unique within strip, otherwise index
          key={`${name}-board-${board.id_1 !== undefined ? board.id_1 : index}`}
          type={board.type}
          position={board.position} // Already relative to this strip's origin
          rotation={board.rotation || [0, 0, 0]}
        />
      ))}
    </group>
  );
}