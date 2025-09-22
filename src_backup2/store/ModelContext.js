// src/store/ModelContext.js
import React, { createContext, useState, useEffect } from 'react'
import { preloadModels } from '../utils/modelPreload'
import Loader from '../components/Loader'

export const ModelContext = createContext(null)

export function ModelProvider({ children }) {
  const [models, setModels] = useState(null)

  useEffect(() => {
    preloadModels().then(loaded => setModels(loaded))
  }, [])

  if (!models) return <Loader />

  return (
    <ModelContext.Provider value={models}>
      {children}
    </ModelContext.Provider>
  )
}
