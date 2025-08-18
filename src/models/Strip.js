import React, { useContext, useEffect } from 'react';
import Board from './Board';
import { CrateContext } from '../store/CrateContext';
import { assemblyDisplacement } from '../configs/globalConfigs';
import { getPhaseProgress } from '../utils/animation';
import * as THREE from 'three';

export default function Strip({
  name,
  progress, // Overall progress from Face (0 to 1)
  stripIndex, // This strip's index (e.g., 0, 1, 2...)
  totalStrips, // Total number of strips in the parent Face
  explosionAxis, // Axis for initial displacement [x,y,z], relative to Face's group
  boardsInStrip,
  final_position, // Final position of this strip, relative to Face's group
  final_rotation, // Final rotation of this strip, relative to Face's group
  initial_position, // Initial position of this strip, relative to Face's group
  initial_rotation // Initial rotation of this strip, relative to Face's group

}) {
  const { setFocusPosition } = useContext(CrateContext);

  // #region define and calculate progress
  const phaseProportions = {
    'boards': 0.8,
    'move': 0.2
  }

  const boardsProgress = getPhaseProgress(phaseProportions, progress, 'boards');
  const moveProgress = getPhaseProgress(phaseProportions, progress, 'move');


  const perBoardProportion = 1.0 / boardsInStrip.length;

  // calculate board progress for each board in the strip
  const boardProgresses = boardsInStrip.map((board, index) => {
    // Calculate the progress for this board based on its index
    const boardStart = index * perBoardProportion;
    const boardEnd = (index + 1) * perBoardProportion;
    const boardProgress = Math.max(0, Math.min(1, (boardsProgress - boardStart) / (boardEnd - boardStart)));
    
    return boardProgress;
  });
  
  // #endregion


  // #region Calculate the current position and rotation of the strip
  let finalPos = final_position.slice();
  let finalRotation = final_rotation.slice();
  let initialPos = initial_position.slice();
  let initialRotation = initial_rotation.slice();

  let posA, posB, rotA, rotB, t;
  if (moveProgress > 0) {
    // If move is in progress, interpolate from initial to final
    posA = initialPos;
    posB = finalPos;
    rotA = initialRotation;
    rotB = finalRotation;
    t = moveProgress;
  } else {
    // If move hasn't started, use initial position
    posA = initialPos;
    posB = initialPos;
    rotA = initialRotation;
    rotB = initialRotation;
    t = 0;
  }

  // Interpolate current position based on progress
  const currentPos = [
    posA[0] + (posB[0] - posA[0]) * t,
    posA[1] + (posB[1] - posA[1]) * t,
    posA[2] + (posB[2] - posA[2]) * t
  ];

  let middlePos = [
    (posA[0] + posB[0]) / 2,
    (posA[1] + posB[1]) / 2,
    (posA[2] + posB[2]) / 2
  ];

  // Interpolate current rotation based on progress
  const currentRotation = [
    rotA[0] + (rotB[0] - rotA[0]) * t,
    rotA[1] + (rotB[1] - rotA[1]) * t,
    rotA[2] + (rotB[2] - rotA[2]) * t
  ];

  // #endregion
  useEffect(() => {
    if (
      (moveProgress > 0 && moveProgress < 1)
    ) {

      setFocusPosition([middlePos[0] * 0.1, middlePos[1] * 0.1, middlePos[2] * 0.1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveProgress, boardProgresses, middlePos, setFocusPosition]);

  return (
    // The group's rotation is its final rotation. Its position is animated.
    <group position={currentPos} rotation={currentRotation}>
      {boardsInStrip.map((board, index) => (
        <Board
          // Use board.id_1 if available and unique within strip, otherwise index
          key={`${name}-board-${board.id_1 !== undefined ? board.id_1 : index}`}
          type={board.type}
          progress={boardProgresses[index]} // Progress for this specific board
          final_position={board.position} // Already relative to this strip's origin
          final_rotation={board.rotation}
          initial_position={board.initial_position} // Already relative to this strip's origin
          initial_rotation={board.initial_rotation}
        />
      ))}
    </group>
  );
}