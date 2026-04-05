import React, { useContext, useEffect } from 'react'
import LogoCard from './components/GUI/LogoCard'
import InputForm from './components/GUI/InputForm'
import OptionsList from './components/GUI/OptionsList'
import VisualizationOptions from './components/GUI/VisualizationOptions'
import BoardTypeFilter from './components/GUI/BoardTypeFilter'
import ComponentList from './components/GUI/ComponentList'
import ProgressSlider from './components/GUI/ProgressSlider'
import FloatingControls from './components/GUI/FloatingControls'
import HelpButton from './components/GUI/HelpButton'
import SceneGraphTester from './components/SceneGraphTester'
import { DevThreeDView } from './components/NewThreeDView'
import { ProdThreeDView } from './components/NewThreeDView'
import { CrateContext } from './store/CrateContext'
import { useSimpleSceneGraph } from './hooks/useSceneGraph'
import { getUrlConfig } from './utils/urlConfig'
import TutorialOverlay from './components/Tutorial/TutorialOverlay'
import './App.css'

export default function App() {
  // If embedded in an iframe on crative.com, attempt to steal parent URL parameters
  // from the referrer on load, because Shopify deletes injected script tags.
  useEffect(() => {
    try {
      if (window.self !== window.top && document.referrer) {
        const parentUrl = new URL(document.referrer);
        // Check if parent has parameters (like ?width=30&height=20)
        // And if we ourselves don't have them yet
        if (parentUrl.search && parentUrl.search.length > 1) {
          const myCurrentSearch = window.location.search;
          const myTargetSearch = parentUrl.search;
          
          // To prevent infinite reloading loops, only reload if our params don't match the parent's
          if (myCurrentSearch !== myTargetSearch) {
              // Extract the new parameters and append our default like useN8AO if needed
              // Let's simply redirect our own frame to have those same parameters
              const newSelfParams = new URLSearchParams(myTargetSearch);
              // preserve existing if you want, but sticking to parent is safer
              
              const newUrl = window.location.pathname + "?" + newSelfParams.toString();
              window.location.replace(newUrl); 
          }
        }
      }
    } catch (e) {
      console.warn("Cross-origin or referrer block when checking parent params:", e);
    }
  }, []);

  // Get URL parameters from centralized config
  const urlConfig = getUrlConfig();
  const { hideUI, debugMode, hideStepHUD, hideAssemble } = urlConfig;

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
      {!hideUI && <TutorialOverlay />}
      <HelpButton />
      <div className='main-content' style={{ flex: 1, position: 'relative' }}>
        {debugMode ? <DevThreeDView hideStepHUD={hideStepHUD || hideAssemble} /> : <ProdThreeDView hideStepHUD={hideStepHUD || hideAssemble} />}
        <ProgressSlider motionList={motionList} hideAssemble={hideAssemble} />
        <FloatingControls show={hideUI} hideAutoCamera={hideUI} />
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
