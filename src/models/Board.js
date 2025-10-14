import React, { useContext } from 'react';
import { ModelContext } from '../store/ModelContext';
import { CrateContext } from '../store/CrateContext';
import { boardTypes } from '../configs/boardConfig';
import { getPhaseProgress } from '../utils/animation';
import { useEffect } from 'react';

export default function Board({ 
  type, 
  progress,
  final_position, 
  final_rotation,
  initial_position,
  initial_rotation
}) {
  const models = useContext(ModelContext);
  const { visualizeBoardTypes } = useContext(CrateContext);
  const { setFocusPosition } = useContext(CrateContext);

  // Convert the type string to a model key
  const modelKey = type && type.includes('board_') 
    ? 'b' + type.substring(6) // Convert "board_40x40" to "b40x40"
    : type;


  // #region define and calculate progress
  const phaseProportions = {
    'appear': 0.4,
    'move': 0.6
  };

  const appearProgress = getPhaseProgress(phaseProportions, progress, 'appear');
  const moveProgress = getPhaseProgress(phaseProportions, progress, 'move');

  // #endregion

  // #region Calculate the current position and rotation of the board
  let finalPos = final_position.slice();
  let finalRotation = final_rotation.slice();
  let initialPos = initial_position.slice();
  let initialRotation = initial_rotation.slice();
  let t = moveProgress;

  const currentPos = [
    initialPos[0] + (finalPos[0] - initialPos[0]) * t,
    initialPos[1] + (finalPos[1] - initialPos[1]) * t,
    initialPos[2] + (finalPos[2] - initialPos[2]) * t
  ];

  const currentRotation = [
    initialRotation[0] + (finalRotation[0] - initialRotation[0]) * t,
    initialRotation[1] + (finalRotation[1] - initialRotation[1]) * t,
    initialRotation[2] + (finalRotation[2] - initialRotation[2]) * t
  ];
  // #endregion

  useEffect(() => {
    if (
      (appearProgress > 0 && appearProgress < 1) ||
      (moveProgress > 0 && moveProgress < 1)
    ) {
      let middlePos = [
        (initialPos[0] + finalPos[0]) * 0.5,
        (initialPos[1] + finalPos[1]) * 0.5,
        (initialPos[2] + finalPos[2]) * 0.5
      ];

      setFocusPosition([middlePos[0] * 0.1, middlePos[1] * 0.1, middlePos[2] * 0.1]);
    }
    
  }, [appearProgress, moveProgress, initialPos, finalPos, setFocusPosition]);

  // Clone the model for this board
  const Model = models[modelKey].clone();

  // #region Apply conditional coloring to the model
  const child = Model.children[0];
  child.material = child.material.clone();
  if (visualizeBoardTypes) {
    if (child.isMesh) {
      child.material.color.set(boardTypes[type]?.highlightColor);
    }
  }
  else {
    if (child.isMesh) {
      child.material.color.set(boardTypes[type]?.defaultColor);
    }
  }
  // #endregion

  // #region update opacity based on progress
  if (child.isMesh) {
    child.material.transparent = true; // Ensure transparency is enabled
    child.material.opacity = appearProgress;
  }
  // #endregion

  if (appearProgress === 0) {
    return null;
  }

  if (!models || !models[modelKey]) {
    console.error(`Model for type "${type}" (key: "${modelKey}") not found in:`, models);
    // Render a placeholder cube with conditional coloring for debugging
    const color = 'red';
    return (
      <mesh position={final_position} rotation={final_rotation}>
        <boxGeometry args={[5, 5, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }

  return (
    <primitive 
      object={Model} 
      position={currentPos} 
      rotation={currentRotation} 
    />
  );
}