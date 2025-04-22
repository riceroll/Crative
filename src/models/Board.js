import React, { useContext } from 'react';
import { ModelContext } from '../store/ModelContext';
import { CrateContext } from '../store/CrateContext';
import { boardTypes } from '../configs/boardConfig';

export default function Board({ type, position, rotation, ...props }) {
  const models = useContext(ModelContext);
  const { visualizeBoardTypes } = useContext(CrateContext);

  // Convert the type string to a model key
  const modelKey = type && type.includes('board_') 
    ? 'b' + type.substring(6) // Convert "board_40x40" to "b40x40"
    : type;

  if (!models || !models[modelKey]) {
    console.error(`Model for type "${type}" (key: "${modelKey}") not found in:`, models);
    // Render a placeholder cube with conditional coloring for debugging
    const color = 'red';
    return (
      <mesh position={position} rotation={rotation} {...props}>
        <boxGeometry args={[5, 5, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }

  // Clone the model for this board
  const Model = models[modelKey].clone();

  // Apply conditional coloring to the model
  if (visualizeBoardTypes) {
    const child = Model.children[0];


    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.color.set(boardTypes[type]?.highlightColor);
    }
    else {
      console.warn(`Child of type ${child, modelKey} is not a mesh.`);
      console.warn(child);
    }
  }
  else {
    const child = Model.children[0];
    if (child.isMesh) {
      child.material.color.set(boardTypes[type]?.defaultColor);
    }
  }

  return (
    <primitive 
      object={Model} 
      position={position} 
      rotation={rotation} 
      {...props} 
    />
  );
}