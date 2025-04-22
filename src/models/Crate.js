import React from 'react';
import Face from './Face';
import Cube from './Cube';
export default function Crate({ faceLayouts, cubeLayouts, thickness, ...props }) {
  if (!faceLayouts || typeof faceLayouts !== 'object') {
    console.warn('Crate component requires a valid faceLayouts prop. Got:', faceLayouts);
    return null;
  }

  // Get corner and edge cubes from cubeLayouts
  const cornerCubes = cubeLayouts?.cornerCubes || [];
  const edgeCubes = cubeLayouts?.edgeCubes || [];

  return (
    <group {...props}>
      {/* Render all faces */}
      {Object.entries(faceLayouts).map(([faceName, layout]) => {
        if (layout && layout.boards && layout.position && layout.rotation) {
          return (
            <Face
              key={faceName}
              name={faceName}
              boards={layout.boards}
              position={layout.position}
              rotation={layout.rotation}
              thickness={thickness}
            />
          );
        }
        console.warn(`Invalid layout data for face: ${faceName}`, layout);
        return null;
      })}

      {/* Render corner cubes */}
      {cornerCubes.map((cube, idx) => (
        <Cube
          key={`corner-${idx}`}
          position={cube.position}
          rotation={cube.rotation}
        />
      ))}
      
      {/* Render edge cubes */}
      {edgeCubes.map((cube, idx) => (
        <Cube
          key={`edge-${idx}`}
          position={cube.position}
          rotation={cube.rotation}
        />
      ))}
    </group>
  );
}