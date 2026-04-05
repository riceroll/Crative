// New ThreeDView Component
// Uses the new scene graph system for rendering

import React, { useContext, useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, RandomizedLight, AccumulativeShadows, useEnvironment, Environment } from '@react-three/drei';
import { EffectComposer, N8AO, ToneMapping, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ModelContext } from '../store/ModelContext';
import { CrateContext } from '../store/CrateContext';
import { CameraProvider, useCameraContext } from '../store/CameraContext';
import { useSimpleSceneGraph } from '../hooks/useSceneGraph';
import SceneRenderer, { SceneGraphDebugger, ScenePerformanceMonitor } from './SceneRenderer';
import CameraController from './CameraController';
import AdaptiveZoom from './AdaptiveZoom';
import { getCameraParameters, precomputeCameraTargetsFromAnimation } from '../utils/animationEngine';
import { cubeColor } from '../configs/globalConfigs';
import { getUrlConfig } from '../utils/urlConfig';

export default function NewThreeDView({ enableDebug = false, showPerformanceStats = false, hideStepHUD = false }) {
  return (
    <CameraProvider>
      <ThreeDViewContent enableDebug={enableDebug} showPerformanceStats={showPerformanceStats} hideStepHUD={hideStepHUD} />
    </CameraProvider>
  );
}

// Helper component to capture Three.js scene and pre-compute camera targets
function SceneCapturer({ motionSequence, sceneGraph, onCameraTargetsComputed, setProgressCallback, autoCameraEnabled, onComputingProgress, bgColor }) {
  const { setThreeScene } = useCameraContext();
  const { scene, gl } = useThree();
  const hasComputedRef = useRef(false);
  const lastAutoCameraRef = useRef(autoCameraEnabled);
  
  useEffect(() => {
    if (scene) {
      setThreeScene(scene);
    }
  }, [scene, setThreeScene]);
  
  // Set background color
  useEffect(() => {
    if (scene) {
      const color = bgColor || '#ffffff';
      scene.background = new THREE.Color(color);
    }
  }, [scene, bgColor]);
  
  // Reset hasComputedRef when scene graph or motion sequence changes
  useEffect(() => {
    // When scene graph or motion sequence changes, mark as not computed
    hasComputedRef.current = false;
  }, [sceneGraph, motionSequence]);
  
  // Pre-compute camera targets when all dependencies are ready and auto camera is enabled
  useEffect(() => {
    if (scene && motionSequence && sceneGraph && setProgressCallback && autoCameraEnabled && !hasComputedRef.current) {
      hasComputedRef.current = true;
      
      // Wait for next frame to ensure scene is rendered
      requestAnimationFrame(async () => {
        const updatedSequence = await precomputeCameraTargetsFromAnimation(
          motionSequence,
          scene,
          sceneGraph,
          setProgressCallback,
          onComputingProgress
        );
        
        if (onCameraTargetsComputed) {
          onCameraTargetsComputed(updatedSequence);
        }
      });
    }
  }, [scene, motionSequence, sceneGraph, setProgressCallback, onCameraTargetsComputed, autoCameraEnabled, onComputingProgress]);
  
  return null;
}

// Helper component to load and apply environment
function EnvironmentSetup() {
  const env = useEnvironment({ files: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/peppermint_powerplant_2_1k.hdr' });
  return <Environment map={env} background blur={1} />;
}

function ThreeDViewContent({ enableDebug, showPerformanceStats, hideStepHUD }) {
  const models = useContext(ModelContext);
  const { 
    innerDims, 
    selectedCandidate, 
    assemblyProgress,
    setAssemblyProgress,
    focusPosition,
    autoCameraEnabled,
    bgColor,
    cameraDistanceFactor 
  } = useContext(CrateContext);
  const { setMotionSequenceData, updateAssemblyProgress } = useCameraContext();
  const controlsRef = useRef();
  const [computedMotionSequence, setComputedMotionSequence] = useState(null);
  const originalProgressRef = useRef(assemblyProgress);
  const [isComputingCamera, setIsComputingCamera] = useState(false);
  const [computeProgress, setComputeProgress] = useState(0);

  // Get URL parameters for post-processing effects
  const getUrlParam = (param, defaultValue = true) => {
    const config = getUrlConfig();
    if (param === 'useN8AO') return config.useN8AO;
    if (param === 'useToneMapping') return config.useToneMapping;
    return defaultValue;
  };

  const useN8AO = getUrlParam('useN8AO', true);
  const useToneMapping = getUrlParam('useToneMapping', false);

  // Use the scene graph hook
  const { sceneGraph, activePart, motionSequence, motionList, currentStepInfo, isLoading, error } = useSimpleSceneGraph(selectedCandidate, assemblyProgress);

  // Handle when camera targets are computed
  const handleCameraTargetsComputed = (updatedSequence) => {
    setComputedMotionSequence(updatedSequence);
    setMotionSequenceData(updatedSequence);
    
    // Restore original progress after computing
    setAssemblyProgress(originalProgressRef.current);
    
    // Hide loading overlay
    setIsComputingCamera(false);
    setComputeProgress(0);
  };
  
  // Handle computing progress updates
  const handleComputingProgress = (current, total) => {
    setIsComputingCamera(true);
    setComputeProgress(Math.round((current / total) * 100));
  };

  // Save original progress before computation starts
  useEffect(() => {
    originalProgressRef.current = assemblyProgress;
  }, [assemblyProgress]);

  // Pass motion sequence to camera context (prefer computed version)
  useEffect(() => {
    const sequenceToUse = computedMotionSequence || motionSequence;
    if (sequenceToUse) {
      setMotionSequenceData(sequenceToUse);
    }
  }, [computedMotionSequence, motionSequence, setMotionSequenceData]);

  // Update assembly progress in camera context when it changes
  useEffect(() => {
    updateAssemblyProgress(assemblyProgress);
  }, [assemblyProgress, updateAssemblyProgress]);

  // Handle performance monitoring
  const handlePerformanceUpdate = (stats) => {
    if (showPerformanceStats) {
      // console.log('[NewThreeDView] Performance Stats:', stats);
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
        color: '#666',
        fontSize: '14px',
        fontFamily: "'Lato', 'Roboto', 'Arial', sans-serif"
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
      {/* Loading overlay during camera computation */}
      {isComputingCamera && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          color: 'white',
          fontSize: '18px',
          fontFamily: "'Lato', 'Roboto', 'Arial', sans-serif"
        }}>
          <div>Computing Camera Positions...</div>
          <div style={{ marginTop: '20px', fontSize: '28px', fontWeight: 'bold' }}>
            {computeProgress}%
          </div>
        </div>
      )}
      
      <Canvas camera={{ position: [50 * cameraDistanceFactor, 50 * cameraDistanceFactor, 50 * cameraDistanceFactor], fov: 15 }} style={{ opacity: isComputingCamera ? 0.3 : 1 }}>
        {/* Capture Three.js scene and pre-compute camera targets */}
        <SceneCapturer 
          motionSequence={motionSequence}
          sceneGraph={sceneGraph}
          onCameraTargetsComputed={handleCameraTargetsComputed}
          setProgressCallback={setAssemblyProgress}
          autoCameraEnabled={autoCameraEnabled}
          onComputingProgress={handleComputingProgress}
          bgColor={bgColor}
        />
        
        <React.Suspense fallback={null}>
          {/* <EnvironmentSetup /> */}
        </React.Suspense>
        
        {/* Basic lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[-2, 2, 2]} intensity={2} castShadow />
        <directionalLight position={[-1, 1, -1]} intensity={1} castShadow/>
        <directionalLight position={[1, -1, 1]} intensity={0.5} castShadow />
        {/* <directionalLight position={[-1, -1, -1]} intensity={0.5} castShadow /> */}

        
        
        {/* Camera controller - manages automatic camera movement */}
        <CameraController enabled={autoCameraEnabled} distanceFactor={cameraDistanceFactor} />
        
        {/* Adaptive zoom - computes optimal camera distance for any screen size */}
        <AdaptiveZoom 
          enabled={!autoCameraEnabled} 
          fillFraction={0.65} 
          transitionDuration={0.8} 
          deps={[selectedCandidate?.id, cameraDistanceFactor, innerDims.width, innerDims.height, innerDims.depth]}
        />
        
        {/* Camera controls - manual controls, works best when auto-camera is disabled */}
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
        
        {/* Post-processing effects */}
        <EffectComposer>
          {useN8AO && (
            <>
              <N8AO aoRadius={0.15} intensity={4} distanceFalloff={2} />
              <BrightnessContrast brightness={0.1} contrast={0.25} />
            </>
          )}
          {useToneMapping && <ToneMapping />}
        </EffectComposer>
      </Canvas>

      {/* Debug overlay - always show the assembly step info unless hideStepHUD is true */}
      {!hideStepHUD && <DebugOverlay sceneGraph={sceneGraph} assemblyProgress={assemblyProgress} activePart={activePart} currentStepInfo={currentStepInfo} />}
    </div>
  );
}

/**
 * Helper function to generate assembly instruction from part ID
 */
function getAssemblyInstruction(partId) {
  if (!partId) {
    return "Assembly Instructions";
  }

  // Helper to capitalize first letter
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Check for Face pattern first (face_NAME...)
  const faceMatch = partId.match(/^face_([a-z]+)/);
  
  if (faceMatch) {
    const faceName = capitalize(faceMatch[1]);
    
    if (partId.includes('_board_') || partId.includes('_strip_')) {
      return `Assembling: Board on ${faceName} Face`;
    } else if (partId.includes('_cube_')) {
      return `Assembling: Cube on ${faceName} Face`;
    } else if (partId.includes('_piece_')) {
      return `Assembling: Connect on ${faceName} Face`;
    } else {
      // Just the face itself
      return `Assembling: ${faceName} Face`;
    }
  }
  
  // Check for standalone Cube pattern
  if (partId.startsWith('cube_')) {
    return 'Assembling: Cube';
  }

  // Fallback
  return `Assembling: ${partId}`;
}

/**
 * Debug overlay component
 */
function DebugOverlay({ sceneGraph, assemblyProgress, activePart, currentStepInfo }) {
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

  const isInIframe = React.useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // If we can't access window.top due to CORS, we're definitely in a cross-origin iframe
    }
  }, []);

  if (isInIframe) {
    return null;
  }

  return (
    <a href="https://crative.com" target="_blank" rel="noopener noreferrer" style={{
      position: 'absolute',
      top: '12px',
      left: '12px',
      zIndex: 1000,
      textDecoration: 'none',
      outline: 'none',
      cursor: 'pointer'
    }}>
      <img 
        src="./images/logo_black.png" 
        alt="Crative Logo" 
        style={{ height: '36px', width: 'auto', display: 'block', opacity: 0.85, transition: 'opacity 0.2s' }}
        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
        onMouseOut={(e) => e.currentTarget.style.opacity = 0.85}
      />
    </a>
  );
}

/**
 * Development version with full debugging enabled
 */
export function DevThreeDView({ hideStepHUD = false }) {
  return <NewThreeDView enableDebug={true} showPerformanceStats={true} hideStepHUD={hideStepHUD} />;
}

/**
 * Production version with minimal overhead
 */
export function ProdThreeDView({ hideStepHUD = false }) {
  return <NewThreeDView enableDebug={false} showPerformanceStats={false} hideStepHUD={hideStepHUD} />;
}
