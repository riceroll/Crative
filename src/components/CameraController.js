import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useCameraContext } from '../store/CameraContext';
import * as THREE from 'three';

/**
 * Camera Controller Component
 * Smoothly transitions camera based on pre-computed motion sequence targets
 * 
 * This component does not render anything visible - it manages the
 * camera position and orientation each frame based on the camera state
 * which is automatically updated by CameraContext using pre-computed targets.
 * 
 * @param {boolean} enabled - Whether auto-camera control is enabled
 * @param {number} distanceFactor - Multiplier for camera distance (default: 1.0)
 */
export default function CameraController({ enabled = true, distanceFactor = 1.0 }) {
  const { cameraState, autoCameraEnabled } = useCameraContext();
  const { camera } = useThree();
  
  // Store target and current position for smooth interpolation
  const targetRef = useRef(new THREE.Vector3(...cameraState.target));
  const currentPosRef = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3(...cameraState.target));
  
  // Initialize camera position on first render
  useEffect(() => {
    if (!enabled || !autoCameraEnabled) return;
    
    const { target, distance, angle } = cameraState;
    const adjustedDistance = distance * distanceFactor;
    const initialPosition = new THREE.Vector3(
      target[0] + Math.cos(angle[1]) * Math.cos(angle[0]) * adjustedDistance,
      target[1] + Math.sin(angle[0]) * adjustedDistance,
      target[2] + Math.sin(angle[1]) * Math.cos(angle[0]) * adjustedDistance
    );
    currentPosRef.current.copy(initialPosition);
    camera.position.copy(initialPosition);
    camera.lookAt(...target);
  }, [enabled, autoCameraEnabled, distanceFactor]); // Re-initialize when enabled state changes
  
  // Update target reference when camera state changes
  useEffect(() => {
    if (!enabled || !autoCameraEnabled) return;
    
    targetRef.current.set(...cameraState.target);
    targetLookAt.current.set(...cameraState.target);
  }, [cameraState.target, enabled, autoCameraEnabled]);
  
  // Smooth camera movement on each frame
  useFrame(() => {
    if (!enabled || !autoCameraEnabled) return; // Don't control camera if disabled
    
    const { target, distance, angle, transitionSpeed } = cameraState;
    const adjustedDistance = distance * distanceFactor;
    
    // Calculate desired camera position based on target, distance, and angle
    // Using spherical coordinates: distance * [cos(yaw)*cos(pitch), sin(pitch), sin(yaw)*cos(pitch)]
    const desiredPosition = new THREE.Vector3(
      target[0] + Math.cos(angle[1]) * Math.cos(angle[0]) * adjustedDistance,
      target[1] + Math.sin(angle[0]) * adjustedDistance,
      target[2] + Math.sin(angle[1]) * Math.cos(angle[0]) * adjustedDistance
    );
    
    // Directly apply position and look-at target
    // The smoothing is now handled by the animation engine's interpolation
    // This ensures the camera moves exactly in sync with the animation
    camera.position.copy(desiredPosition);
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  });
  
  return null; // This component doesn't render anything
}
