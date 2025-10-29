// React Hook for Scene Graph Management
// Manages scene graph computation, animation, and state updates

import { useState, useEffect, useMemo, useCallback } from 'react';
import { computeSceneGraph, exportSceneState } from '../utils/sceneGraphComputer';
import { 
  createMotionSequence, 
  updateCurrentStates, 
  debugMotionSequence, 
  debugCurrentStates 
} from '../utils/animationEngine';

/**
 * Main hook for scene graph management
 * @param {Object} selectedCandidate - Selected candidate from CrateContext
 * @param {number} assemblyProgress - Animation progress from CrateContext
 * @param {Object} options - Configuration options
 * @returns {Object} Scene graph data and control functions
 */
export function useSceneGraph(selectedCandidate, assemblyProgress, options = {}) {
  const {
    enableDebugLogging = false,
    enablePerformanceMonitoring = false,
    autoExportOnChange = false
  } = options;

  // Core state
  const [sceneGraph, setSceneGraph] = useState({});
  const [motionSequence, setMotionSequence] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const [computationError, setComputationError] = useState(null);
  const [performanceStats, setPerformanceStats] = useState(null);

  // Compute scene graph when selectedCandidate changes
  const computedSceneGraph = useMemo(() => {
    if (!selectedCandidate) {
      if (enableDebugLogging) {
        console.log('[useSceneGraph] No selectedCandidate provided');
      }
      return {};
    }

    setIsComputing(true);
    setComputationError(null);

    try {
      const startTime = performance.now();
      const graph = computeSceneGraph(selectedCandidate);
      const endTime = performance.now();

      if (enablePerformanceMonitoring) {
        setPerformanceStats(prev => ({
          ...prev,
          sceneGraphComputationTime: endTime - startTime,
          lastComputationTime: new Date().toISOString()
        }));
      }

      if (enableDebugLogging) {
        console.log('[useSceneGraph] Scene graph computed:', {
          totalParts: Object.keys(graph).length,
          computationTime: endTime - startTime
        });
      }

      return graph;
    } catch (error) {
      console.error('[useSceneGraph] Error computing scene graph:', error);
      setComputationError(error);
      return {};
    } finally {
      setIsComputing(false);
    }
  }, [selectedCandidate, enableDebugLogging, enablePerformanceMonitoring]);

  // Compute motion sequence when scene graph changes
  const computedMotionSequence = useMemo(() => {
    if (!computedSceneGraph || Object.keys(computedSceneGraph).length === 0) {
      return null;
    }

    try {
      const startTime = performance.now();
      const sequence = createMotionSequence(computedSceneGraph);
      window.motionSequence = sequence; // For debugging
      const endTime = performance.now();

      if (enablePerformanceMonitoring) {
        setPerformanceStats(prev => ({
          ...prev,
          motionSequenceComputationTime: endTime - startTime
        }));
      }

      if (enableDebugLogging) {
        debugMotionSequence(sequence);
      }

      return sequence;
    } catch (error) {
      console.error('[useSceneGraph] Error computing motion sequence:', error);
      setComputationError(error);
      return null;
    }
  }, [computedSceneGraph, enableDebugLogging, enablePerformanceMonitoring]);

  // Update scene graph and motion sequence state
  useEffect(() => {
    setSceneGraph(computedSceneGraph);
    setMotionSequence(computedMotionSequence);
  }, [computedSceneGraph, computedMotionSequence]);

  // Update current states when progress changes
  useEffect(() => {
    // if (!sceneGraph || !motionSequence || Object.keys(sceneGraph).length === 0) {
    //   return;
    // }

    try {
      const startTime = performance.now();
      const updatedGraph = updateCurrentStates(sceneGraph, assemblyProgress, motionSequence);

      window.sceneGraph = updatedGraph; // For debugging
      window.motionSequence = motionSequence; // For debugging
      
      const endTime = performance.now();

      if (enablePerformanceMonitoring) {
        setPerformanceStats(prev => ({
          ...prev,
          stateUpdateTime: endTime - startTime,
          lastUpdateTime: new Date().toISOString()
        }));
      }

      if (enableDebugLogging) {
        debugCurrentStates(updatedGraph, assemblyProgress);
      }

      setSceneGraph(updatedGraph);
    } catch (error) {
      console.error('[useSceneGraph] Error updating current states:', error);
      setComputationError(error);
    }
  }, [assemblyProgress, motionSequence, enableDebugLogging, enablePerformanceMonitoring]);

  // Auto-export scene state when it changes (for debugging)
  useEffect(() => {
    if (autoExportOnChange && sceneGraph && Object.keys(sceneGraph).length > 0) {
      const exportData = exportSceneState(sceneGraph);
      console.log('[useSceneGraph] Auto-exported scene state:', exportData);
      
      // Optionally save to localStorage for debugging
      try {
        localStorage.setItem('sceneGraphDebug', JSON.stringify(exportData));
      } catch (e) {
        console.warn('[useSceneGraph] Could not save to localStorage:', e);
      }
    }
  }, [sceneGraph, autoExportOnChange]);

  // Manual export function
  const exportCurrentState = useCallback(() => {
    if (!sceneGraph || Object.keys(sceneGraph).length === 0) {
      console.warn('[useSceneGraph] No scene graph to export');
      return null;
    }

    const exportData = exportSceneState(sceneGraph);
    
    // Create downloadable JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scene-graph-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return exportData;
  }, [sceneGraph]);

  // Debug functions
  const debugFunctions = useMemo(() => ({
    logSceneGraph: () => {
      console.log('[useSceneGraph] Current scene graph:', sceneGraph);
      return sceneGraph;
    },
    logMotionSequence: () => {
      if (motionSequence) {
        debugMotionSequence(motionSequence);
      } else {
        console.log('[useSceneGraph] No motion sequence available');
      }
      return motionSequence;
    },
    logCurrentStates: () => {
      debugCurrentStates(sceneGraph, assemblyProgress);
      return sceneGraph;
    },
    exportState: exportCurrentState,
    getPerformanceStats: () => performanceStats
  }), [sceneGraph, motionSequence, assemblyProgress, performanceStats, exportCurrentState]);

  // Computed properties
  const sceneInfo = useMemo(() => {
    if (!sceneGraph || Object.keys(sceneGraph).length === 0) {
      return {
        totalParts: 0,
        visibleParts: 0,
        activeParts: 0,
        partTypes: {}
      };
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

    const partTypes = parts.reduce((acc, part) => {
      const type = part.properties.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalParts: parts.length,
      visibleParts: visibleParts.length,
      activeParts: activeParts.length,
      partTypes
    };
  }, [sceneGraph]);

  const animationInfo = useMemo(() => {
    if (!motionSequence) {
      return {
        totalDuration: 0,
        totalMotions: 0,
        currentTime: 0,
        activeMotions: 0
      };
    }

    const currentTime = assemblyProgress * motionSequence.totalDuration;
    const activeMotions = motionSequence.motions.filter(motion => 
      currentTime >= motion.startTime && currentTime <= motion.endTime
    );

    return {
      totalDuration: motionSequence.totalDuration,
      totalMotions: motionSequence.motions.length,
      currentTime,
      activeMotions: activeMotions.length
    };
  }, [motionSequence, assemblyProgress]);

  return {
    // Core data
    sceneGraph,
    motionSequence,
    
    // State
    isComputing,
    computationError,
    
    // Info
    sceneInfo,
    animationInfo,
    performanceStats,
    
    // Debug functions
    debug: debugFunctions
  };
}

/**
 * Simplified hook for basic scene graph usage
 * @param {Object} selectedCandidate - Selected candidate
 * @param {number} assemblyProgress - Animation progress
 * @returns {Object} Basic scene graph data
 */
export function useSimpleSceneGraph(selectedCandidate, assemblyProgress) {
  const { sceneGraph, isComputing, computationError } = useSceneGraph(
    selectedCandidate, 
    assemblyProgress, 
    { enableDebugLogging: false, enablePerformanceMonitoring: false }
  );

  return {
    sceneGraph,
    isLoading: isComputing,
    error: computationError
  };
}

/**
 * Hook for debugging scene graph
 * @param {Object} selectedCandidate - Selected candidate
 * @param {number} assemblyProgress - Animation progress
 * @returns {Object} Scene graph with full debugging capabilities
 */
export function useDebugSceneGraph(selectedCandidate, assemblyProgress) {
  return useSceneGraph(selectedCandidate, assemblyProgress, {
    enableDebugLogging: true,
    enablePerformanceMonitoring: true,
    autoExportOnChange: false
  });
}
