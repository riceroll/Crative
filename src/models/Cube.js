import React, { useContext } from 'react';
import { ModelContext } from '../store/ModelContext';
import * as THREE from 'three'; // Import THREE.js for matrix operations
import { assemblyDisplacement } from '../configs/globalConfigs';

export default function Cube({ progress, position = [0, 0, 0], rotation = [0, 0, 0], ...props }) {
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

  // Set the color of the cube
  const child = cubeModel.children[0];
  if (child.isMesh) {
    child.material = child.material.clone();
    child.material.color.set('#F6D33C');
  } else {
    console.warn(`Cube is not a mesh.`);
    console.warn(child);
  }

  // Calculate positions for animation
  let finalPos = position.slice();
  let initialPos = finalPos.slice();

  // Create displacement vector (pointing in +Z direction by default)
  let assemblyDisplacementVector = new THREE.Vector3(0, 0, 1);

  // Apply rotation to the displacement vector
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2], 'ZYX'));
  assemblyDisplacementVector.applyMatrix4(rotationMatrix);

  // Apply the rotated displacement to calculate initial position
  initialPos[0] += assemblyDisplacementVector.x * assemblyDisplacement;
  initialPos[1] += assemblyDisplacementVector.y * assemblyDisplacement;
  initialPos[2] += assemblyDisplacementVector.z * assemblyDisplacement;

  // Calculate current position based on progress
  let currentPos = [0, 0, 0];
  currentPos[0] = initialPos[0] + (finalPos[0] - initialPos[0]) * progress;
  currentPos[1] = initialPos[1] + (finalPos[1] - initialPos[1]) * progress;
  currentPos[2] = initialPos[2] + (finalPos[2] - initialPos[2]) * progress;
  
  return (
    <primitive object={cubeModel} position={currentPos} rotation={rotation} {...props} />
  );
}