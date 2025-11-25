// src/components/Loader.js
import React from 'react'

export default function Loader() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#F2F3F5', 
      color: '#555', 
      fontSize: '18px',
      fontFamily: "'Lato', 'Roboto', 'Arial', sans-serif",
      zIndex: 999
    }}>
      <div className="loader-spinner"></div>
      <div style={{ marginTop: '20px' }}>Loading 3D assets…</div>
    </div>
  )
}
