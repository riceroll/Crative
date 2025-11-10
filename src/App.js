import React, { useContext } from 'react'
import LogoCard from './components/GUI/LogoCard'
import InputForm from './components/GUI/InputForm'
import OptionsList from './components/GUI/OptionsList'
import VisualizationOptions from './components/GUI/VisualizationOptions'
import BoardTypeFilter from './components/GUI/BoardTypeFilter'
import ComponentList from './components/GUI/ComponentList'
import ProgressSlider from './components/GUI/ProgressSlider'
import FloatingControls from './components/GUI/FloatingControls'
import SceneGraphTester from './components/SceneGraphTester'
import { DevThreeDView } from './components/NewThreeDView'
import { ProdThreeDView } from './components/NewThreeDView'
import { CrateContext } from './store/CrateContext'
import { useSimpleSceneGraph } from './hooks/useSceneGraph'
import './App.css'

export default function App() {
  // Check URL parameters
  const params = new URLSearchParams(window.location.search);
  const hideUI = params.get('hideUI') === 'true';
  const debugMode = params.get('debug') === 'true';
  const hideStepHUD = params.get('hideStepHUD') === 'true';

  // Get motion list for progress slider checkpoints
  const { selectedCandidate, assemblyProgress } = useContext(CrateContext);
  const { motionList } = useSimpleSceneGraph(selectedCandidate, assemblyProgress);

  // For development, you can switch between different views
  const isDevelopment = process.env.NODE_ENV === 'development'
  const useSceneGraphTester = true // Set to false to use the regular layout

  if (isDevelopment && useSceneGraphTester) {
    // Use the comprehensive testing interface during development
    // return <SceneGraphTester />
  }

  // Regular app layout with new scene graph system
  return (
    <div className='app-container' style={{ display: 'flex', height: '100vh' }}>
      <div className='main-content' style={{ flex: 1, position: 'relative' }}>
        {debugMode ? <DevThreeDView hideStepHUD={hideStepHUD} /> : <ProdThreeDView hideStepHUD={hideStepHUD} />}
        <ProgressSlider motionList={motionList} />
        <FloatingControls />
      </div>
      {!hideUI && (
        <div className='sidebar'>
          {/* <LogoCard /> */}
          <InputForm />
          <OptionsList />
          <VisualizationOptions /> 
          {/* <BoardTypeFilter /> */}
          <ComponentList />
        </div>
      )}
    </div>
  )
}
