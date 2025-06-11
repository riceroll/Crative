import React, { useContext } from 'react';
import Face from './Face';
import Cube from './Cube';
import { CrateContext } from '../store/CrateContext';

export default function Crate({ faceLayouts, cubeLayouts, thickness, ...props }) {
  const { assemblyProgress } = useContext(CrateContext);

  if (!faceLayouts || typeof faceLayouts !== 'object') {
    console.warn('Crate component requires a valid faceLayouts prop. Got:', faceLayouts);
    return null;
  }

  // Get corner and edge cubes from cubeLayouts
  const cornerCubes = cubeLayouts?.cornerCubes || [];
  const edgeCubes = cubeLayouts?.edgeCubes || [];

  // Create arrays to hold our components
  const components = [];

  let remainingProgress = assemblyProgress;

  let unitProgress = 1.0 / (Object.keys(faceLayouts).length + cornerCubes.length + edgeCubes.length);





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

    let usedProgress = unitProgress;
    if (remainingProgress < usedProgress) {
      usedProgress = remainingProgress;
    }
    remainingProgress -= usedProgress;
    
    components.push(
      <Face
        key={faceName}
        name={faceName}
        progress={usedProgress / unitProgress}
        boards={layout.boards}
        position={layout.position}
        rotation={layout.rotation}
        thickness={thickness}
      />
    );
  }

  // For loop for corner cubes
  for (let i = 0; i < cornerCubes.length; i++) {
    const cube = cornerCubes[i];

    let usedProgress = unitProgress;
    if (remainingProgress < usedProgress) {
      usedProgress = remainingProgress;
    }
    remainingProgress -= usedProgress;
    

    components.push(
      <Cube
        key={`corner-${i}`}
        progress={usedProgress / unitProgress}
        position={cube.position}
        rotation={cube.rotation}
      />
    );
  }

  // For loop for edge cubes
  for (let i = 0; i < edgeCubes.length; i++) {
    const cube = edgeCubes[i];

    let usedProgress = unitProgress;
    if (remainingProgress < usedProgress) {
      usedProgress = remainingProgress;
    }
    remainingProgress -= usedProgress;
    

    components.push(
      <Cube
        key={`edge-${i}`}
        progress={usedProgress / unitProgress}
        position={cube.position}
        rotation={cube.rotation}
      />
    );
  }


  return (
    <group {...props}>
      {components}
    </group>
  );
}