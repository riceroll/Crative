import React from 'react'
import InputForm from './components/GUI/InputForm'
import OptionsList from './components/GUI/OptionsList'
import VisualizationOptions from './components/GUI/VisualizationOptions'
import ComponentList from './components/GUI/ComponentList'
import ThreeDView from './components/ThreeDView'

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div
        className='sidebar'      
      >
        <InputForm />
        <VisualizationOptions /> 
        <OptionsList />
        <ComponentList />
      </div>
      <div style={{ flex: 1 }}>
        <ThreeDView />
      </div>
    </div>
  )
}
