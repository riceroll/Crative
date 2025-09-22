// Scene Graph Tester Component
// For testing and demonstrating the new scene graph system

import React, { useState, useContext } from 'react';
import { CrateContext } from '../store/CrateContext';
import { useDebugSceneGraph } from '../hooks/useSceneGraph';
import { DevThreeDView } from './NewThreeDView';

export default function SceneGraphTester() {
  const { selectedCandidate, assemblyProgress, setAssemblyProgress } = useContext(CrateContext);
  const [showOldSystem, setShowOldSystem] = useState(false);
  const [debugMode, setDebugMode] = useState(true);

  // Use the debug version of the scene graph hook
  const {
    sceneGraph,
    motionSequence,
    isComputing,
    computationError,
    sceneInfo,
    animationInfo,
    performanceStats,
    debug
  } = useDebugSceneGraph(selectedCandidate, assemblyProgress);

  const handleExportSceneGraph = () => {
    const exportData = debug.exportState();
    console.log('Exported scene graph:', exportData);
  };

  const handleLogSceneGraph = () => {
    debug.logSceneGraph();
  };

  const handleLogMotionSequence = () => {
    debug.logMotionSequence();
  };

  const handleLogCurrentStates = () => {
    debug.logCurrentStates();
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Control Panel */}
      <div style={{
        width: '300px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #ddd',
        overflowY: 'auto'
      }}>
        <h3>Scene Graph Tester</h3>
        
        {/* System Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label>
            <input
              type="checkbox"
              checked={showOldSystem}
              onChange={(e) => setShowOldSystem(e.target.checked)}
            />
            Use Old System (for comparison)
          </label>
        </div>

        {/* Debug Mode Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label>
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
            />
            Enable Debug Mode
          </label>
        </div>

        {/* Animation Controls */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Animation Control</h4>
          <div style={{ marginBottom: '10px' }}>
            <label>Progress: {(assemblyProgress * 100).toFixed(1)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={assemblyProgress}
              onChange={(e) => setAssemblyProgress(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setAssemblyProgress(0)}>Start</button>
            <button onClick={() => setAssemblyProgress(0.5)}>Middle</button>
            <button onClick={() => setAssemblyProgress(1)}>End</button>
          </div>
        </div>

        {/* Scene Info */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Scene Information</h4>
          <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            <div>Status: {isComputing ? 'Computing...' : 'Ready'}</div>
            <div>Total Parts: {sceneInfo.totalParts}</div>
            <div>Visible Parts: {sceneInfo.visibleParts}</div>
            <div>Active Parts: {sceneInfo.activeParts}</div>
            {computationError && (
              <div style={{ color: 'red' }}>Error: {computationError.message}</div>
            )}
          </div>
        </div>

        {/* Animation Info */}
        {animationInfo && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Animation Information</h4>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <div>Total Duration: {animationInfo.totalDuration.toFixed(2)}</div>
              <div>Total Motions: {animationInfo.totalMotions}</div>
              <div>Current Time: {animationInfo.currentTime.toFixed(2)}</div>
              <div>Active Motions: {animationInfo.activeMotions}</div>
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {performanceStats && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Performance Stats</h4>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <div>Scene Graph: {performanceStats.sceneGraphComputationTime?.toFixed(2)}ms</div>
              <div>Motion Sequence: {performanceStats.motionSequenceComputationTime?.toFixed(2)}ms</div>
              <div>State Update: {performanceStats.stateUpdateTime?.toFixed(2)}ms</div>
            </div>
          </div>
        )}

        {/* Debug Controls */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Debug Controls</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button onClick={handleLogSceneGraph} style={{ fontSize: '12px' }}>
              Log Scene Graph
            </button>
            <button onClick={handleLogMotionSequence} style={{ fontSize: '12px' }}>
              Log Motion Sequence
            </button>
            <button onClick={handleLogCurrentStates} style={{ fontSize: '12px' }}>
              Log Current States
            </button>
            <button onClick={handleExportSceneGraph} style={{ fontSize: '12px' }}>
              Export Scene Graph
            </button>
          </div>
        </div>

        {/* Part Types Breakdown */}
        {sceneInfo.partTypes && Object.keys(sceneInfo.partTypes).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Part Types</h4>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              {Object.entries(sceneInfo.partTypes).map(([type, count]) => (
                <div key={type}>{type}: {count}</div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{ fontSize: '11px', color: '#666', marginTop: '20px' }}>
          <h5>Instructions:</h5>
          <ul style={{ paddingLeft: '15px', margin: 0 }}>
            <li>Use the progress slider to control animation</li>
            <li>Check console for detailed debug logs</li>
            <li>Export scene graph to download JSON file</li>
            <li>Toggle debug mode to see visual helpers</li>
            <li>Compare with old system using checkbox</li>
          </ul>
        </div>
      </div>

      {/* 3D View */}
      <div style={{ flex: 1 }}>
        {showOldSystem ? (
          <OldSystemPlaceholder />
        ) : (
          <DevThreeDView />
        )}
      </div>
    </div>
  );
}

/**
 * Placeholder for old system comparison
 */
function OldSystemPlaceholder() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: '#f9f9f9',
      color: '#666',
      fontSize: '18px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h3>Old System View</h3>
        <p>Switch back to see the old ThreeDView component</p>
        <p style={{ fontSize: '14px', color: '#999' }}>
          (You would import and use the original ThreeDView here)
        </p>
      </div>
    </div>
  );
}

/**
 * Minimal tester for quick testing
 */
export function QuickSceneGraphTester() {
  const { selectedCandidate, assemblyProgress, setAssemblyProgress } = useContext(CrateContext);
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Simple controls */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f0f0f0', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <label>
          Animation Progress: {(assemblyProgress * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={assemblyProgress}
          onChange={(e) => setAssemblyProgress(parseFloat(e.target.value))}
          style={{ width: '200px' }}
        />
        <button onClick={() => setAssemblyProgress(0)}>Reset</button>
      </div>
      
      {/* 3D View */}
      <div style={{ flex: 1 }}>
        <DevThreeDView />
      </div>
    </div>
  );
}
