import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * AdaptiveZoom Component
 * 
 * Computes the bounding box of the rendered scene and smoothly
 * animates the camera to an optimal distance so the model fills
 * a proper portion of the viewport, regardless of screen size or aspect ratio.
 * 
 * @param {boolean} enabled - Whether adaptive zoom is active
 * @param {number} fillFraction - Target fraction of screen the model should occupy (0-1, default 0.65)
 * @param {number} transitionDuration - Duration of zoom transition in seconds (default 0.8)
 * @param {Array} deps - Dependencies that trigger a re-calculation (e.g. sceneGraph identity)
 */
export default function AdaptiveZoom({ 
  enabled = true, 
  fillFraction = 0.65, 
  transitionDuration = 0.8,
  deps = []
}) {
  const { camera, scene, size } = useThree();
  const hasComputed = useRef(false);
  const isAnimating = useRef(false);
  const animationStart = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  // Track last dependency fingerprint to re-trigger on scene graph changes
  const lastDepsRef = useRef(null);

  // Reset when dependencies change so we recompute
  useEffect(() => {
    const depsKey = JSON.stringify(deps);
    if (lastDepsRef.current !== depsKey) {
      lastDepsRef.current = depsKey;
      hasComputed.current = false;
    }
  }, [deps]);

  // Compute optimal zoom after scene is ready
  useEffect(() => {
    if (!enabled) return;
    if (hasComputed.current) return;

    // Wait a couple frames for the scene to be fully rendered
    let frameCount = 0;
    let rafId;

    const waitAndCompute = () => {
      frameCount++;
      if (frameCount < 3) {
        rafId = requestAnimationFrame(waitAndCompute);
        return;
      }

      // Find the scene group that contains our model (the SceneRenderer group)
      // It's at scale [0.1, 0.1, 0.1]
      const boundingBox = new THREE.Box3();
      let hasGeometry = false;

      scene.traverse((object) => {
        if (object.isMesh && object.geometry) {
          object.geometry.computeBoundingBox();
          const meshBox = object.geometry.boundingBox.clone();
          meshBox.applyMatrix4(object.matrixWorld);
          boundingBox.expandByObject(object);
          hasGeometry = true;
        }
      });

      if (!hasGeometry || boundingBox.isEmpty()) {
        // Retry next frame
        rafId = requestAnimationFrame(waitAndCompute);
        return;
      }

      // Calculate bounding sphere for the model
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      const boundingSphere = boundingBox.getBoundingSphere(new THREE.Sphere());
      const radius = boundingSphere.radius;

      if (radius < 0.001) return; // degenerate

      // Calculate optimal camera distance based on viewport and FOV
      const fov = camera.fov * (Math.PI / 180); // vertical FOV in radians
      const aspect = size.width / size.height;

      // We want the model to fill `fillFraction` of the viewport
      // Calculate distance needed for vertical and horizontal fit
      const verticalDistance = radius / (Math.sin(fov / 2) * fillFraction);
      const horizontalDistance = radius / (Math.sin(fov / 2) * aspect * fillFraction);

      // Use the larger distance to ensure the model fits in both dimensions
      const optimalDistance = Math.max(verticalDistance, horizontalDistance);

      // Compute the target camera position: keep the same viewing direction,
      // but move to the optimal distance from center
      const currentDir = new THREE.Vector3();
      camera.getWorldDirection(currentDir);
      // Camera looks along -Z in its local frame, so direction is from camera to target
      // We want to position camera at center - direction * distance
      const dirFromCenter = camera.position.clone().sub(center).normalize();
      const newPosition = center.clone().add(dirFromCenter.multiplyScalar(optimalDistance));

      // Store animation parameters
      startPosition.current.copy(camera.position);
      targetPosition.current.copy(newPosition);
      
      // Current look-at: approximate from camera direction
      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.multiplyScalar(10).add(camera.position);
      startLookAt.current.copy(currentLookAt);
      targetLookAt.current.copy(center);

      // Start animation
      animationStart.current = performance.now() / 1000;
      isAnimating.current = true;
      hasComputed.current = true;
    };

    rafId = requestAnimationFrame(waitAndCompute);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, scene, camera, size, fillFraction, deps]);

  // Smooth animation each frame
  useFrame(() => {
    if (!isAnimating.current) return;

    const elapsed = (performance.now() / 1000) - animationStart.current;
    // Ease-out cubic: t' = 1 - (1-t)^3
    let t = Math.min(elapsed / transitionDuration, 1);
    const easedT = 1 - Math.pow(1 - t, 3);

    // Interpolate position
    camera.position.lerpVectors(startPosition.current, targetPosition.current, easedT);

    // Interpolate look-at
    const currentLookAt = new THREE.Vector3().lerpVectors(
      startLookAt.current,
      targetLookAt.current,
      easedT
    );
    camera.lookAt(currentLookAt);
    camera.updateProjectionMatrix();

    if (t >= 1) {
      isAnimating.current = false;
    }
  });

  return null;
}
