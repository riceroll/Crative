// src/components/Loader.js
import React from 'react'

export default function Loader() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#111', color: '#fff', fontSize: '1.5rem',
      zIndex: 999
    }}>
      Loading 3D assets…
    </div>
  )
}
