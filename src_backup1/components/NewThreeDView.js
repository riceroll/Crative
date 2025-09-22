// New ThreeDView Component
// Uses the new scene graph system for rendering

import React, { useContext, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ModelContext } from '../store/ModelContext';
import { CrateContext } from '../store/CrateContext';
import { useSimpleSceneGraph } from '../hooks/useSceneGraph';
import SceneRenderer, { SceneGraphDebugger, ScenePerformanceMonitor } from './SceneRenderer';

export default function NewThreeDView({ enableDebug = false, showPerformanceStats = false }) {
  const models = useContext(ModelContext);
  const { innerDims, selectedCandidate, assemblyProgress, focusPosition } = useContext(CrateContext);
  const controlsRef = useRef();

  // Use the scene graph hook
  const { sceneGraph, isLoading, error } = useSimpleSceneGraph(selectedCandidate, assemblyProgress);

  // Handle camera focus
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

  // Handle performance monitoring
  const handlePerformanceUpdate = (stats) => {
    if (showPerformanceStats) {
      console.log('[NewThreeDView] Performance Stats:', stats);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: '#666'
      }}>
        Computing scene graph...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: '#ff6b6b',
        padding: '20px'
      }}>
        <h3>Scene Graph Error</h3>
        <p>{error.message}</p>
        <details style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
          <summary>Error Details</summary>
          <pre>{error.stack}</pre>
        </details>
      </div>
    );
  }

  // Show empty state
  if (!sceneGraph || Object.keys(sceneGraph).length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: '#666'
      }}>
        No crate design selected
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [50, 50, 50], fov: 15 }}>
        {/* Lighting setup */}
        <directionalLight position={[500, 500, 500]} intensity={1} />
        <directionalLight position={[-500, 500, -500]} intensity={1} />
        <directionalLight position={[500, 500, -500]} intensity={1} />
        <directionalLight position={[-500, 500, 500]} intensity={1} />
        <directionalLight position={[0, -500, 0]} intensity={1} />
        
        {/* Camera controls */}
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

        {/* Main scene renderer */}
        <SceneRenderer 
          sceneGraph={sceneGraph}
          scale={[0.1, 0.1, 0.1]}
          position={[0, 0, 0]}
        />

        {/* Debug visualization */}
        {enableDebug && (
          <SceneGraphDebugger 
            sceneGraph={sceneGraph}
            showBoundingBoxes={false}
            showAxes={true}
          />
        )}

        {/* Performance monitoring */}
        {showPerformanceStats && (
          <ScenePerformanceMonitor 
            sceneGraph={sceneGraph}
            onUpdate={handlePerformanceUpdate}
          />
        )}
      </Canvas>

      {/* Debug overlay */}
      {enableDebug && <DebugOverlay sceneGraph={sceneGraph} assemblyProgress={assemblyProgress} />}
    </div>
  );
}

/**
 * Debug overlay component
 */
function DebugOverlay({ sceneGraph, assemblyProgress }) {
  const sceneInfo = React.useMemo(() => {
    if (!sceneGraph || Object.keys(sceneGraph).length === 0) {
      return { totalParts: 0, visibleParts: 0, activeParts: 0 };
    }

    const parts = Object.values(sceneGraph);
    const visibleParts = parts.filter(part => 
      part.properties.current_state.alpha > 0
    );
    const activeParts = parts.filter(part => {
      const state = part.properties.current_state;
      return state.rel_pos.some(v => Math.abs(v) > 0.01) || 
             state.rel_rot.some(v => Math.abs(v) > 0.01) ||
             Math.abs(state.alpha - 1) > 0.01;
    });

    return {
      totalParts: parts.length,
      visibleParts: visibleParts.length,
      activeParts: activeParts.length
    };
  }, [sceneGraph]);

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Scene Graph Debug</h4>
      <div>Progress: {(assemblyProgress * 100).toFixed(1)}%</div>
      <div>Total Parts: {sceneInfo.totalParts}</div>
      <div>Visible Parts: {sceneInfo.visibleParts}</div>
      <div>Active Parts: {sceneInfo.activeParts}</div>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#ccc' }}>
        <div>Press F12 to open console for detailed logs</div>
        <div>Use browser dev tools to inspect scene graph</div>
      </div>
    </div>
  );
}

/**
 * Development version with full debugging enabled
 */
export function DevThreeDView() {
  return <NewThreeDView enableDebug={true} showPerformanceStats={true} />;
}

/**
 * Production version with minimal overhead
 */
export function ProdThreeDView() {
  return <NewThreeDView enableDebug={false} showPerformanceStats={false} />;
}
