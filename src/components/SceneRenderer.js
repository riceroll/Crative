// Scene Renderer Component
// Renders 3D scene based on scene graph data structure

import React, { useContext } from 'react';
import { ModelContext } from '../store/ModelContext';
import { CrateContext } from '../store/CrateContext';
import { boardTypes } from '../configs/boardConfig';
import { cubeColor, screwColor, stickColor, pieceColor} from '../configs/globalConfigs';

/**
 * Main scene renderer component
 * @param {Object} sceneGraph - Scene graph with all parts and current states
 * @param {number} scale - Scale factor for the entire scene
 * @param {Array} position - Position offset for the entire scene
 */
export default function SceneRenderer({ sceneGraph, scale = [0.1, 0.1, 0.1], position = [0, 0, 0] }) {
  if (!sceneGraph || Object.keys(sceneGraph).length === 0) {
    console.warn('SceneRenderer: Empty or invalid scene graph provided');
    return null;
  }

  // Start rendering from the root
  const rootPart = sceneGraph['crate_root'];
  if (!rootPart) {
    console.warn('SceneRenderer: No crate_root found in scene graph');
    return null;
  }

  return (
    <group position={position} scale={scale}>
      <PartRenderer 
        part={rootPart} 
        sceneGraph={sceneGraph}
        parentPosition={[0, 0, 0]}
        parentRotation={[0, 0, 0]}
      />
    </group>
  );
}

/**
 * Generic part renderer - handles both groups and models
 * @param {Object} part - Part data from scene graph
 * @param {Object} sceneGraph - Complete scene graph for child lookup
 * @param {Array} parentPosition - Parent's world position
 * @param {Array} parentRotation - Parent's world rotation
 */
function PartRenderer({ part, sceneGraph, parentPosition, parentRotation }) {
  const models = useContext(ModelContext);
  const { visualizeBoardTypes } = useContext(CrateContext);

  if (!part || !part.properties) {
    return null;
  }

  const props = part.properties;
  const currentState = props.current_state;

  // Calculate final position and rotation
  const finalPosition = [
    props.pos[0] + currentState.rel_pos[0],
    props.pos[1] + currentState.rel_pos[1],
    props.pos[2] + currentState.rel_pos[2]
  ];

  const finalRotation = [
    props.rot[0] + currentState.rel_rot[0],
    props.rot[1] + currentState.rel_rot[1],
    props.rot[2] + currentState.rel_rot[2]
  ];

  if (props.type === 'group') {
    return (
      <GroupRenderer
        part={part}
        sceneGraph={sceneGraph}
        position={finalPosition}
        rotation={finalRotation}
        alpha={currentState.alpha}
      />
    );
  } else if (props.type === 'model') {
    return (
      <ModelRenderer
        part={part}
        models={models}
        position={finalPosition}
        rotation={finalRotation}
        alpha={currentState.alpha}
        visualizeBoardTypes={visualizeBoardTypes}
      />
    );
  }

  return null;
}

/**
 * Group renderer - renders a group with its children
 */
function GroupRenderer({ part, sceneGraph, position, rotation, alpha }) {
  const props = part.properties;

  // Don't render if completely transparent
  if (alpha <= 0) {
    return null;
  }

  return (
    <group 
      position={position} 
      rotation={rotation}
      userData={{ part_id: part.part_id }}
    >
      {props.children.map(childId => {
        const childPart = sceneGraph[childId];
        if (!childPart) {
          console.warn(`GroupRenderer: Child part ${childId} not found in scene graph`);
          return null;
        }

        return (
          <PartRenderer
            key={childId}
            part={childPart}
            sceneGraph={sceneGraph}
            parentPosition={position}
            parentRotation={rotation}
          />
        );
      })}
    </group>
  );
}

/**
 * Model renderer - renders a 3D model primitive
 */
function ModelRenderer({ part, models, position, rotation, alpha, visualizeBoardTypes }) {
  const props = part.properties;

  // Don't render if completely transparent
  if (alpha <= 0) {
    return null;
  }

  // Get the model from the model context
  const modelKey = props.model_id;
  if (!models || !models[modelKey]) {
    console.warn(`ModelRenderer: Model ${modelKey} not found in models context`);
    
    // Render a placeholder cube for debugging
    return (
      <mesh position={position} rotation={rotation}>
        <boxGeometry args={[5, 5, 0.5]} />
        <meshStandardMaterial color="red" transparent opacity={alpha} />
      </mesh>
    );
  }

  // Clone the model to avoid modifying the original
  const Model = models[modelKey].clone();
  const child = Model.children[0];

  if (child && child.isMesh) {
    // Clone the material to avoid affecting other instances
    child.material = child.material.clone();
    child.material.transparent = true;
    child.material.opacity = alpha;
    
    // Maintain enhanced material properties
    child.material.roughness = child.material.roughness || 0.8;
    child.material.metalness = child.material.metalness || 0.1;
    child.material.envMapIntensity = child.material.envMapIntensity || 1.0;

    // Apply board type coloring if this is a board
    if (modelKey.startsWith('b') && props.model_id) {
      const boardType = convertModelKeyToBoardType(modelKey);
      const boardConfig = boardTypes[boardType];
      
      if (boardConfig) {
        const color = visualizeBoardTypes ? boardConfig.highlightColor : boardConfig.defaultColor;
        child.material.color.set(color);
      }
    }

    // Apply special coloring for screws, sticks, pieces, cubes
    if (modelKey.startsWith('screw')) {
      child.material.color.set(screwColor);
    } else if (modelKey.startsWith('stick')) {
      child.material.color.set(stickColor);
    } else if (modelKey.startsWith('piece')) {
      child.material.color.set(pieceColor);
    } else if (modelKey === 'cube') {
      child.material.color.set(cubeColor);
    }
  }

  // Add part_id to userData for camera tracking
  Model.userData = { part_id: part.part_id };

  return (
    <primitive 
      object={Model} 
      position={position} 
      rotation={rotation}
    />
  );
}

/**
 * Helper function to convert model key back to board type
 * @param {string} modelKey - Model key like "b40x40"
 * @returns {string} Board type like "board_40x40"
 */
function convertModelKeyToBoardType(modelKey) {
  if (modelKey.startsWith('b')) {
    return 'board_' + modelKey.substring(1);
  }
  return modelKey;
}

/**
 * Debug component to visualize scene graph structure
 */
export function SceneGraphDebugger({ sceneGraph, showBoundingBoxes = false, showAxes = false }) {
  if (!sceneGraph) return null;

  return (
    <group>
      {showAxes && <axesHelper args={[10]} />}
      {Object.entries(sceneGraph).map(([partId, part]) => {
        if (showBoundingBoxes && part.properties.type === 'model') {
          const props = part.properties;
          const currentState = props.current_state;
          
          const position = [
            props.pos[0] + currentState.rel_pos[0],
            props.pos[1] + currentState.rel_pos[1],
            props.pos[2] + currentState.rel_pos[2]
          ];

          return (
            <mesh key={`debug-${partId}`} position={position}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="yellow" wireframe />
            </mesh>
          );
        }
        return null;
      })}
    </group>
  );
}

/**
 * Performance monitoring component
 */
export function ScenePerformanceMonitor({ sceneGraph, onUpdate }) {
  React.useEffect(() => {
    if (onUpdate && sceneGraph) {
      const stats = {
        totalParts: Object.keys(sceneGraph).length,
        visibleParts: Object.values(sceneGraph).filter(part => 
          part.properties.current_state.alpha > 0
        ).length,
        activeParts: Object.values(sceneGraph).filter(part => {
          const state = part.properties.current_state;
          return state.rel_pos.some(v => Math.abs(v) > 0.01) || 
                 state.rel_rot.some(v => Math.abs(v) > 0.01) ||
                 Math.abs(state.alpha - 1) > 0.01;
        }).length
      };
      
      onUpdate(stats);
    }
  }, [sceneGraph, onUpdate]);

  return null;
}
