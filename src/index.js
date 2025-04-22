import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ModelProvider } from './store/ModelContext'
import { CrateProvider } from './store/CrateContext'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ModelProvider>
      <CrateProvider>
        <App />
      </CrateProvider>
    </ModelProvider>
  </React.StrictMode>
)