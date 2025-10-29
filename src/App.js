import React from 'react'
import InputForm from './components/GUI/InputForm'
import OptionsList from './components/GUI/OptionsList'
import VisualizationOptions from './components/GUI/VisualizationOptions'
import BoardTypeFilter from './components/GUI/BoardTypeFilter'
import ComponentList from './components/GUI/ComponentList'
import ProgressSlider from './components/GUI/ProgressSlider'
import SceneGraphTester from './components/SceneGraphTester'
import { DevThreeDView } from './components/NewThreeDView'
import { ProdThreeDView } from './components/NewThreeDView'
import './App.css'

export default function App() {
  // For development, you can switch between different views
  const isDevelopment = process.env.NODE_ENV === 'development'
  const useSceneGraphTester = true // Set to false to use the regular layout

  if (isDevelopment && useSceneGraphTester) {
    // Use the comprehensive testing interface during development
    // return <SceneGraphTester />
  }

  // Regular app layout with new scene graph system
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div className='sidebar'>
        <InputForm />
        <OptionsList />
        <VisualizationOptions /> 
        <BoardTypeFilter />
        <ComponentList />
        <ProgressSlider />
      </div>
      <div style={{ flex: 1 }}>
        {isDevelopment ? <DevThreeDView /> : <ProdThreeDView />}
      </div>
    </div>
  )
}
