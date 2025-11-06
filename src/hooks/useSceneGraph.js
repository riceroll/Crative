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

  // Compute updated scene graph with current states based on progress
  const { updatedSceneGraph, activePart } = useMemo(() => {
    if (!computedSceneGraph || !computedMotionSequence || Object.keys(computedSceneGraph).length === 0) {
      return { updatedSceneGraph: computedSceneGraph, activePart: null };
    }

    try {
      const startTime = performance.now();
      const { sceneGraph: updatedGraph, activePart: currentActivePart } = updateCurrentStates(
        computedSceneGraph, 
        assemblyProgress, 
        computedMotionSequence
      );

      window.sceneGraph = updatedGraph; // For debugging
      window.motionSequence = computedMotionSequence; // For debugging
      window.activePart = currentActivePart; // For debugging
      
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
        if (currentActivePart) {
          console.log('[useSceneGraph] Active part:', currentActivePart);
        }
      }

      return { updatedSceneGraph: updatedGraph, activePart: currentActivePart };
    } catch (error) {
      console.error('[useSceneGraph] Error updating current states:', error);
      setComputationError(error);
      return { updatedSceneGraph: computedSceneGraph, activePart: null };
    }
  }, [computedSceneGraph, computedMotionSequence, assemblyProgress, enableDebugLogging, enablePerformanceMonitoring]);

  // Auto-export scene state when it changes (for debugging)
  useEffect(() => {
    if (autoExportOnChange && updatedSceneGraph && Object.keys(updatedSceneGraph).length > 0) {
      const exportData = exportSceneState(updatedSceneGraph);
      console.log('[useSceneGraph] Auto-exported scene state:', exportData);
      
      // Optionally save to localStorage for debugging
      try {
        localStorage.setItem('sceneGraphDebug', JSON.stringify(exportData));
      } catch (e) {
        console.warn('[useSceneGraph] Could not save to localStorage:', e);
      }
    }
  }, [updatedSceneGraph, autoExportOnChange]);

  // Manual export function
  const exportCurrentState = useCallback(() => {
    if (!updatedSceneGraph || Object.keys(updatedSceneGraph).length === 0) {
      console.warn('[useSceneGraph] No scene graph to export');
      return null;
    }

    const exportData = exportSceneState(updatedSceneGraph);
    
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
  }, [updatedSceneGraph]);

  // Debug functions
  const debugFunctions = useMemo(() => ({
    logSceneGraph: () => {
      console.log('[useSceneGraph] Current scene graph:', updatedSceneGraph);
      return updatedSceneGraph;
    },
    logMotionSequence: () => {
      if (computedMotionSequence) {
        debugMotionSequence(computedMotionSequence);
      } else {
        console.log('[useSceneGraph] No motion sequence available');
      }
      return computedMotionSequence;
    },
    logCurrentStates: () => {
      debugCurrentStates(updatedSceneGraph, assemblyProgress);
      return updatedSceneGraph;
    },
    exportState: exportCurrentState,
    getPerformanceStats: () => performanceStats
  }), [updatedSceneGraph, computedMotionSequence, assemblyProgress, performanceStats, exportCurrentState]);

  // Computed properties
  const sceneInfo = useMemo(() => {
    if (!updatedSceneGraph || Object.keys(updatedSceneGraph).length === 0) {
      return {
        totalParts: 0,
        visibleParts: 0,
        activeParts: 0,
        partTypes: {}
      };
    }

    const parts = Object.values(updatedSceneGraph);
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
  }, [updatedSceneGraph]);

  const animationInfo = useMemo(() => {
    if (!computedMotionSequence) {
      return {
        totalDuration: 0,
        totalMotions: 0,
        currentTime: 0,
        activeMotions: 0
      };
    }

    const currentTime = assemblyProgress * computedMotionSequence.totalDuration;
    const activeMotions = computedMotionSequence.motions.filter(motion => 
      currentTime >= motion.startTime && currentTime <= motion.endTime
    );

    return {
      totalDuration: computedMotionSequence.totalDuration,
      totalMotions: computedMotionSequence.motions.length,
      currentTime,
      activeMotions: activeMotions.length
    };
  }, [computedMotionSequence, assemblyProgress]);

  return {
    // Core data
    sceneGraph: updatedSceneGraph,
    motionSequence: computedMotionSequence,
    activePart,
    
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
  const { sceneGraph, activePart, motionSequence, isComputing, computationError } = useSceneGraph(
    selectedCandidate, 
    assemblyProgress, 
    { enableDebugLogging: false, enablePerformanceMonitoring: false }
  );

  return {
    sceneGraph,
    activePart,
    motionSequence,
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
