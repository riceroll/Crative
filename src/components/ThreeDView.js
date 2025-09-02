// filepath: /Users/Roll/Desktop/crative/src/components/ThreeDView.js
import React, { useContext, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Crate from '../models/Crate'
import { ModelContext } from '../store/ModelContext'
import { CrateContext } from '../store/CrateContext'
import { gap } from '../configs/boardConfig'

export default function ThreeDView() {
  const models = useContext(ModelContext)
  // Use innerDims and selectedCandidate from CrateContext
  const { innerDims, selectedCandidate } = useContext(CrateContext);
  const { focusPosition } = useContext(CrateContext);

  const controlsRef = useRef();

  useEffect(() => {
    if (controlsRef.current && focusPosition && false) {
        
      controlsRef.current.target.set(...focusPosition);

      // Set the camera position (zoom)
      const camera = controlsRef.current.object;
      // Calculate direction from camera to target
      const dir = [
        camera.position.x - focusPosition[0],
        camera.position.y - focusPosition[1],
        camera.position.z - focusPosition[2]
      ];
      // Set new distance (e.g., 20 units away)
      const newDistance = 85; // Change this value for more/less zoom
      const length = Math.sqrt(dir[0]**2 + dir[1]**2 + dir[2]**2);
      if (length > 0) {
        camera.position.set(
          focusPosition[0] + (dir[0] / length) * newDistance,
          focusPosition[1] + (dir[1] / length) * newDistance,
          focusPosition[2] + (dir[2] / length) * newDistance
        );
      }

      controlsRef.current.update();
    }
  }, [focusPosition]);

  return (
    <Canvas camera={{ position: [50, 50, 50], fov: 15 }}>
      <directionalLight position={[500, 500, 500]} intensity={1} />
      <directionalLight position={[-500, 500, -500]} intensity={1} />
      <directionalLight position={[500, 500, -500]} intensity={1} />
      <directionalLight position={[-500, 500, 500]} intensity={1} />
      <directionalLight position={[0, -500, 0]} intensity={1} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={500}
        enableDamping={true}
        dampingFactor={1}
        rotateSpeed={0.5}
      />
      {/* Pass the extracted layouts to the Crate */}
      <Crate
        thickness={gap} 
        faceLayouts={selectedCandidate?.faceLayouts} // Pass the extracted layouts variable
        cubeLayouts={selectedCandidate?.cubeLayouts}
        scale={[0.1, 0.1, 0.1]}
        position={[0, 0, 0]}
        outerDims={selectedCandidate?.outerDims}
      />
    </Canvas>
  )
}
