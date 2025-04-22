import React, { useContext } from 'react';
import { ModelContext } from '../store/ModelContext';

export default function Cube({ position = [0, 0, 0], rotation = [0, 0, 0], ...props }) {
  const models = useContext(ModelContext);
  
  if (!models || !models.cube) {
    console.error('Cube model not found in ModelContext. Available models:', models ? Object.keys(models) : 'none');
    return (
      <mesh position={position} rotation={rotation} {...props}>
        <boxGeometry args={[5, 5, 5]} /> {/* Larger size for visibility */}
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }
  
  // Clone the cube model from context
  const cubeModel = models.cube.clone();

  // set the color of the cube
    const child = cubeModel.children[0];
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.color.set('#F6D33C');
    } else {
      console.warn(`Cube is not a mesh.`);
      console.warn(child);
    }
  
  return (
    <primitive object={cubeModel} position={position} rotation={rotation} {...props} />
  );
}