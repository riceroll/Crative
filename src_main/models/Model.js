// src/models/Model.js
import React, { useContext, useMemo } from 'react'
import { ModelContext } from '../store/ModelContext'

export default function Model({ name, ...props }) {
  const models = useContext(ModelContext)

  // Clone once when models or name changes
  const cloned = useMemo(() => {
    if (models && models[name]) {
      return models[name].clone(true)
    }
    return null
  }, [models, name])

  if (!cloned) return null
  return <primitive object={cloned} {...props} />
}
