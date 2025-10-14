# Scene Graph Architecture Implementation

## Overview

This document describes the new scene graph architecture that separates computation from visualization, providing better debugging capabilities and cleaner code organization.

## Architecture Components

### 1. Core Computation Module (`src/utils/sceneGraphComputer.js`)

**Purpose**: Transforms `selectedCandidateDesign` into a flat dictionary structure for animation and visualization.

**Key Functions**:
- `computeSceneGraph(selectedCandidate)` - Main entry point
- `generateFaceParts()` - Converts face layouts to parts
- `generateBoardParts()` - Converts board data to parts  
- `generateCubeParts()` - Converts cube layouts to parts
- `exportSceneState()` - JSON export for debugging

**Data Structure**:
```javascript
{
  'part_id': 'face_front_board_0_1',
  'properties': {
    'current_state': {
      'rel_pos': [x, y, z],  // displacement from final position
      'rel_rot': [rx, ry, rz], 
      'alpha': a
    },
    'type': 'model' | 'group',
    'model_id': 'b40x40', // only for model type
    'pos': [x, y, z],     // final position relative to parent
    'rot': [rx, ry, rz],  // final rotation relative to parent
    'children': [...],    // child part IDs
    'keyframes': [
      {
        'keyframe_id': 'face_front_board_0_1_appear',
        'pos': [x, y, z],
        'rot': [rx, ry, rz],
        'alpha': a,
        'duration': d
      }
    ]
  }
}
```

### 2. Animation Engine (`src/utils/animationEngine.js`)

**Purpose**: Handles motion sequences, progress calculations, and current state updates.

**Key Functions**:
- `createMotionSequence(sceneGraph)` - Creates ordered animation timeline
- `updateCurrentStates(sceneGraph, globalProgress, motionSequence)` - Updates all part states
- `debugMotionSequence()` - Debug motion timing
- `getActiveMotions()` - Get currently animating parts

**Animation Phases**:
1. Face movements (flat → initial → final)
2. Board appearances (staggered by face)
3. Cube movements
4. Final assembly

### 3. Visualization Layer (`src/components/SceneRenderer.js`)

**Purpose**: Renders 3D scene based on scene graph data structure.

**Components**:
- `SceneRenderer` - Main renderer component
- `PartRenderer` - Generic part renderer (groups/models)
- `GroupRenderer` - Renders groups with children
- `ModelRenderer` - Renders 3D model primitives
- `SceneGraphDebugger` - Debug visualization helpers
- `ScenePerformanceMonitor` - Performance tracking

### 4. React Integration (`src/hooks/useSceneGraph.js`)

**Purpose**: React hook for scene graph management with automatic recomputation and state updates.

**Hooks**:
- `useSceneGraph()` - Full-featured hook with debugging
- `useSimpleSceneGraph()` - Basic usage
- `useDebugSceneGraph()` - Debug version with full logging

**Features**:
- Automatic recomputation when selectedCandidate changes
- Real-time state updates based on assemblyProgress
- Performance monitoring
- Debug logging and export capabilities

### 5. New ThreeDView (`src/components/NewThreeDView.js`)

**Purpose**: Replacement for the original ThreeDView using the new architecture.

**Features**:
- Uses scene graph system
- Built-in error handling and loading states
- Debug overlay
- Performance monitoring
- Development and production variants

### 6. Testing Components (`src/components/SceneGraphTester.js`)

**Purpose**: Comprehensive testing and debugging interface.

**Features**:
- Side-by-side comparison with old system
- Real-time animation controls
- Performance statistics
- Debug function access
- Scene graph export
- Visual debugging tools

## Key Benefits

### 1. **Separation of Concerns**
- Computation completely separate from visualization
- Clean data flow: Input → Computation → Animation → Rendering

### 2. **Debuggability**
- Step-by-step computation logging
- JSON export of complete scene state
- Visual debugging helpers
- Performance monitoring
- Real-time state inspection

### 3. **Flexibility**
- Easy to modify animations without touching React components
- Keyframe-based animation system
- Configurable debug levels
- Modular architecture

### 4. **Performance**
- Only recompute what changes
- Efficient state updates
- Performance tracking
- Optimized rendering

### 5. **Maintainability**
- Clear data structures
- Well-documented APIs
- Comprehensive error handling
- Extensive testing tools

## Usage Examples

### Basic Usage
```javascript
import { useSimpleSceneGraph } from '../hooks/useSceneGraph';
import SceneRenderer from './SceneRenderer';

function MyComponent() {
  const { selectedCandidate, assemblyProgress } = useContext(CrateContext);
  const { sceneGraph, isLoading, error } = useSimpleSceneGraph(selectedCandidate, assemblyProgress);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <SceneRenderer sceneGraph={sceneGraph} />;
}
```

### Debug Usage
```javascript
import { useDebugSceneGraph } from '../hooks/useSceneGraph';

function DebugComponent() {
  const { selectedCandidate, assemblyProgress } = useContext(CrateContext);
  const { sceneGraph, debug, performanceStats } = useDebugSceneGraph(selectedCandidate, assemblyProgress);
  
  const handleExport = () => {
    debug.exportState(); // Downloads JSON file
  };
  
  return (
    <div>
      <button onClick={handleExport}>Export Scene Graph</button>
      <button onClick={debug.logCurrentStates}>Log States</button>
      <SceneRenderer sceneGraph={sceneGraph} />
    </div>
  );
}
```

### Testing
```javascript
import SceneGraphTester from './SceneGraphTester';

// Full testing interface
<SceneGraphTester />

// Quick testing
import { QuickSceneGraphTester } from './SceneGraphTester';
<QuickSceneGraphTester />
```

## Integration Steps

### 1. **Test the New System**
```javascript
// Replace your current ThreeDView with:
import { DevThreeDView } from './components/NewThreeDView';
// or
import SceneGraphTester from './components/SceneGraphTester';
```

### 2. **Compare Performance**
Use the SceneGraphTester to compare old vs new system side-by-side.

### 3. **Debug Issues**
- Use debug hooks for detailed logging
- Export scene graphs for analysis
- Monitor performance statistics
- Use visual debugging helpers

### 4. **Production Deployment**
```javascript
// Use production version for final deployment
import { ProdThreeDView } from './components/NewThreeDView';
```

## Debugging Guide

### 1. **Console Logging**
```javascript
const { debug } = useDebugSceneGraph(selectedCandidate, assemblyProgress);

debug.logSceneGraph();      // Log complete scene graph
debug.logMotionSequence();  // Log animation timeline
debug.logCurrentStates();   // Log current part states
```

### 2. **JSON Export**
```javascript
debug.exportState(); // Downloads complete scene state as JSON
```

### 3. **Performance Monitoring**
```javascript
const { performanceStats } = useDebugSceneGraph(selectedCandidate, assemblyProgress);
console.log('Computation time:', performanceStats.sceneGraphComputationTime);
```

### 4. **Visual Debugging**
```javascript
<SceneGraphDebugger 
  sceneGraph={sceneGraph}
  showBoundingBoxes={true}
  showAxes={true}
/>
```

## Migration Path

1. **Phase 1**: Test new system alongside old system using SceneGraphTester
2. **Phase 2**: Fix any positioning or animation issues using debug tools
3. **Phase 3**: Replace old ThreeDView with NewThreeDView in production
4. **Phase 4**: Remove old system components and models

## File Structure

```
src/
├── utils/
│   ├── sceneGraphComputer.js    # Core computation
│   └── animationEngine.js       # Animation system
├── components/
│   ├── SceneRenderer.js         # Visualization layer
│   ├── NewThreeDView.js         # New ThreeDView component
│   └── SceneGraphTester.js      # Testing interface
├── hooks/
│   └── useSceneGraph.js         # React integration
└── README_SceneGraph.md         # This documentation
```

This architecture provides a solid foundation for your 3D crate visualization with excellent debugging capabilities and clean separation of concerns.
