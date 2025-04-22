// filepath: /Users/Roll/Desktop/crative/src/components/ThreeDView.js
import React, { useContext } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Crate from '../models/Crate'
import { ModelContext } from '../store/ModelContext'
import { CrateContext } from '../store/CrateContext'
import { gap } from '../configs/boardConfig'

export default function ThreeDView() {
  const models = useContext(ModelContext)
  // Use innerDims and selectedCandidate from CrateContext
  const { innerDims, selectedCandidate } = useContext(CrateContext)

  const layouts = selectedCandidate?.faceLayouts;

  if (!models) return null // Keep this check for models

  return (
    <Canvas camera={{ position: [50, 50, 50], fov: 15 }}>
      <directionalLight position={[500, 500, 500]} intensity={1} />
      <directionalLight position={[-500, 500, -500]} intensity={1} />
      <directionalLight position={[500, 500, -500]} intensity={1} />
      <directionalLight position={[-500, 500, 500]} intensity={1} />
      <directionalLight position={[0, -500, 0]} intensity={1} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={500}
        enableDamping={true}
        dampingFactor={0.2}
        rotateSpeed={0.5}
      />
      {/* Pass the extracted layouts to the Crate */}
      <Crate
        thickness={gap} 
        faceLayouts={layouts} // Pass the extracted layouts variable
        cubeLayouts={selectedCandidate?.cubeLayouts}
        scale={[0.1, 0.1, 0.1]}
        position={[0, 0, 0]}
        outerDims={selectedCandidate?.outerDims}
      />
    </Canvas>
  )
}
