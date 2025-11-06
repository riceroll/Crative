import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getInterpolatedCameraParameters } from '../utils/animationEngine';
import * as THREE from 'three';

export const CameraContext = createContext();

/**
 * Camera Provider Component
 * Manages camera state for the entire application
 */
export function CameraProvider({ children }) {
  const [cameraState, setCameraState] = useState({
    target: [0, 0, 0],          // What the camera is looking at [x, y, z]
    distance: 100,               // Distance from target
    angle: [Math.PI / 4, Math.PI / 4, 0], // Camera angle (pitch, yaw, roll)
    transitionSpeed: 0.8         // How fast camera moves (0-1, higher = faster)
  });

  // Store motion sequence and progress for automatic camera updates
  const [motionSequence, setMotionSequence] = useState(null);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const [autoCameraEnabled, setAutoCameraEnabled] = useState(true);
  const [threeScene, setThreeScene] = useState(null); // Store Three.js scene reference

  /**
   * Update camera target position and optionally distance/angle
   * @param {Array} target - Target position [x, y, z]
   * @param {number} distance - Optional distance from target
   * @param {Array} angle - Optional camera angle [pitch, yaw, roll]
   */
  const updateCameraTarget = useCallback((target, distance = null, angle = null) => {
    setCameraState(prev => ({
      ...prev,
      target: target || prev.target,
      distance: distance !== null ? distance : prev.distance,
      angle: angle || prev.angle
    }));
  }, []);

  /**
   * Set motion sequence for automatic camera control
   * @param {Object} sequence - Motion sequence from animationEngine
   */
  const setMotionSequenceData = useCallback((sequence) => {
    setMotionSequence(sequence);
  }, []);

  /**
   * Update assembly progress for camera calculation
   * @param {number} progress - Progress from 0 to 1
   */
  const updateAssemblyProgress = useCallback((progress) => {
    setAssemblyProgress(progress);
  }, []);

  /**
   * Toggle automatic camera control
   * @param {boolean} enabled - Whether auto-camera is enabled
   */
  const setAutoCamera = useCallback((enabled) => {
    setAutoCameraEnabled(enabled);
  }, []);

  /**
   * Automatically update camera based on motion sequence and progress
   * Uses actual Three.js world positions when available
   */
  useEffect(() => {
    if (!autoCameraEnabled || !motionSequence || motionSequence.motions.length === 0) {
      return;
    }

    const cameraParams = getInterpolatedCameraParameters(motionSequence, assemblyProgress);
    
    if (!cameraParams) return;

    // Try to get actual Three.js world position if scene is available
    if (false && threeScene) { // Disabled: using pre-computed fixed positions per phase
      const currentTime = assemblyProgress * motionSequence.totalDuration;
      
      // Find the current active motion
      const activeMotion = motionSequence.motions.find(motion => 
        currentTime >= motion.startTime && currentTime <= motion.endTime
      );
      
      if (activeMotion) {
        // Try to find the Three.js mesh for this part
        let targetMesh = null;
        threeScene.traverse((object) => {
          if (object.userData && object.userData.part_id === activeMotion.part_id) {
            targetMesh = object;
          }
        });
        
        if (targetMesh) {
          // Get actual world position from Three.js
          const worldPos = new THREE.Vector3();
          targetMesh.getWorldPosition(worldPos);
          
          setCameraState(prev => ({
            ...prev,
            target: [worldPos.x, worldPos.y, worldPos.z],
            distance: cameraParams.distance,
            angle: cameraParams.angle
          }));
          return;
        }
      }
    }
    
    // Fallback to pre-computed target if Three.js object not found
    setCameraState(prev => ({
      ...prev,
      target: cameraParams.target,
      distance: cameraParams.distance,
      angle: cameraParams.angle
    }));
  }, [motionSequence, assemblyProgress, autoCameraEnabled, threeScene]);

  /**
   * Reset camera to default position
   */
  const resetCamera = useCallback(() => {
    setCameraState({
      target: [0, 0, 0],
      distance: 300,
      angle: [Math.PI / 4, Math.PI / 4, 0],
      transitionSpeed: 0.8
    });
  }, []);

  return (
    <CameraContext.Provider value={{ 
      cameraState, 
      updateCameraTarget, 
      resetCamera,
      setMotionSequenceData,
      updateAssemblyProgress,
      setAutoCamera,
      autoCameraEnabled,
      setThreeScene // Expose setter for Three.js scene
    }}>
      {children}
    </CameraContext.Provider>
  );
}

/**
 * Hook to use camera context
 * @returns {Object} Camera context with state and update functions
 */
export function useCameraContext() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
}
