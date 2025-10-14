import React, { useContext } from 'react';
import Face from './Face';
import Cube from './Cube';
import { CrateContext } from '../store/CrateContext';
import { getPhaseProgress } from '../utils/animation';

export default function Crate({ 
  faceLayouts, 
  cubeLayouts, 
  thickness, 
  scale,
  position,
  outerDims
}) {
  const { assemblyProgress } = useContext(CrateContext);
  const { setFocusPosition } = useContext(CrateContext);

  if (!faceLayouts || typeof faceLayouts !== 'object') {
    console.warn('Crate component requires a valid faceLayouts prop. Got:', faceLayouts);
    return null;
  }

  // Get corner and edge cubes from cubeLayouts
  const cornerCubes = cubeLayouts.cornerCubes;
  const edgeCubes = cubeLayouts.edgeCubes;

  // Create arrays to hold our components
  const components = [];

  let remainingProgress = assemblyProgress;

  let unitProgress = 1.0 / (Object.keys(faceLayouts).length + cornerCubes.length + edgeCubes.length);

  // #region define and calculate progress
  const phaseProportions = {
    'faces': 0.9,
    'cubes': 0.1
  }
  const facesProgress = getPhaseProgress(phaseProportions, assemblyProgress, 'faces');
  const cubesProgress = getPhaseProgress(phaseProportions, assemblyProgress, 'cubes');

  // Calculate the progress for for each face
  const perFaceProportion = 1.0 / Object.keys(faceLayouts).length;
  const faceProgresses = Object.keys(faceLayouts).map((faceName, index) => {
    // Calculate the progress for this face based on its index
    const faceStart = index * perFaceProportion;
    const faceEnd = (index + 1) * perFaceProportion;
    const faceProgress = Math.max(0, Math.min(1, (facesProgress - faceStart) / (faceEnd - faceStart)));
    
    return faceProgress;
  });

  // Calculate the progress for corner and edge cubes
  const perCubeProportion = 1.0 / (cornerCubes.length + edgeCubes.length);
  const cubeProgresses = [...cornerCubes, ...edgeCubes].map((_, index) => {
    // Calculate the progress for this cube based on its index
    const cubeStart = index * perCubeProportion;
    const cubeEnd = (index + 1) * perCubeProportion;
    const cubeProgress = Math.max(0, Math.min(1, (cubesProgress - cubeStart) / (cubeEnd - cubeStart)));
    
    return cubeProgress;
  });

  // #endregion



  // For loop for faces
  const faceEntriesArrayClone = Object.entries(faceLayouts);

  const faceEntriesArray = [faceEntriesArrayClone[5]]; // Start with the first face
  faceEntriesArray.push(faceEntriesArrayClone[0]); // Add the second face
  faceEntriesArray.push(faceEntriesArrayClone[2]); // Add the second face
  faceEntriesArray.push(faceEntriesArrayClone[1]); // Add the second face
  faceEntriesArray.push(faceEntriesArrayClone[3]); // Add the second face
  faceEntriesArray.push(faceEntriesArrayClone[4]); // Add the second face



  for (let i = 0; i < faceEntriesArray.length; i++) {
    const faceName = faceEntriesArray[i][0];
    const layout = faceEntriesArray[i][1];
    
    components.push(
      <Face
        key={faceName}
        name={faceName}
        progress={faceProgresses[i]}
        boards={layout.boards}
        final_position={layout.final_position}
        final_rotation={layout.final_rotation}
        initial_position={layout.initial_position}
        initial_rotation={layout.initial_rotation}
        flat_position={layout.flat_position}
        flat_rotation={layout.flat_rotation}
        thickness={thickness}
      />
    );
  }

  // For loop for corner cubes
  for (let i = 0; i < cornerCubes.length; i++) {
    const cube = cornerCubes[i];

    components.push(
      <Cube
        key={`corner-${i}`}
        progress={cubeProgresses[i]}
        final_position={cube.final_position}
        final_rotation={cube.final_rotation}
        initial_position={cube.initial_position}
        initial_rotation={cube.initial_rotation}
      />
    );
  }

  // For loop for edge cubes
  for (let i = 0; i < edgeCubes.length; i++) {
    const cube = edgeCubes[i];

    components.push(
      <Cube
        key={`edge-${i}`}
        progress={cubeProgresses[i + cornerCubes.length]}
        final_position={cube.final_position}
        final_rotation={cube.final_rotation}
        initial_position={cube.initial_position}
        initial_rotation={cube.initial_rotation}
      />
    );
  }


  return (
    <group 
      position={position} 
      scale={scale} 
      rotation={[0, 0, 0]} 
      outerDims={outerDims} // Pass outerDims to the group
    >
      {components}
    </group>
  );
}