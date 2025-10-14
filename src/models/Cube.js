import React, { useContext } from 'react';
import { ModelContext } from '../store/ModelContext';
import { CrateContext } from '../store/CrateContext';
import * as THREE from 'three'; // Import THREE.js for matrix operations
import { assemblyDisplacementCube } from '../configs/globalConfigs';
import { getPhaseProgress } from '../utils/animation';

export default function Cube({ 
  progress, 
  final_position, 
  final_rotation,
  initial_position,
  initial_rotation
}) {
  const models = useContext(ModelContext);
  const { setFocusPosition } = useContext(CrateContext);

  // Clone the cube model from context
  const cubeModel = models.cube.clone();

  // Set the color of the cube
  const child = cubeModel.children[0];
  if (child.isMesh) {
    child.material = child.material.clone();
    child.material.color.set('#F6D33C');
  } else {
    console.warn(`Cube is not a mesh.`);
    console.warn(child);
  }


  // #region define and calculate progress
  const phaseProportions = {
    'appear': 0.4,
    'move': 0.6
  };
  const appearProgress = getPhaseProgress(phaseProportions, progress, 'appear');
  const moveProgress = getPhaseProgress(phaseProportions, progress, 'move');
  // #endregion


  // #region Calculate the current position and rotation of the cube using React.useMemo
  const [currentPos, currentRotation] = React.useMemo(() => {
    let finalPos = final_position.slice();
    let initialPos = initial_position.slice();
    let t = moveProgress;
    const pos = [
      initialPos[0] + (finalPos[0] - initialPos[0]) * t,
      initialPos[1] + (finalPos[1] - initialPos[1]) * t,
      initialPos[2] + (finalPos[2] - initialPos[2]) * t
    ];
    const rot = [
      initial_rotation[0] + (final_rotation[0] - initial_rotation[0]) * t,
      initial_rotation[1] + (final_rotation[1] - initial_rotation[1]) * t,
      initial_rotation[2] + (final_rotation[2] - initial_rotation[2]) * t
    ];

    const middlePos = [
      (initialPos[0] + finalPos[0]) / 2,
      (initialPos[1] + finalPos[1]) / 2,
      (initialPos[2] + finalPos[2]) / 2
    ];

    if (
      (appearProgress > 0 && appearProgress < 1) ||
      (moveProgress > 0 && moveProgress < 1)
    ) {
      setFocusPosition([middlePos[0] * 0.1, middlePos[1] * 0.1, middlePos[2] * 0.1]);
    }

    return [pos, rot];
  }, [initial_position, final_position, initial_rotation, final_rotation, moveProgress]);
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

  if (!models || !models.cube) {
    console.error('Cube model not found in ModelContext. Available models:', models ? Object.keys(models) : 'none');
    return (
      <mesh position={final_position} rotation={final_rotation}>
        <boxGeometry args={[5, 5, 5]} /> {/* Larger size for visibility */}
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }

  return (
    <primitive object={cubeModel} position={currentPos} rotation={currentRotation} />
  );
}