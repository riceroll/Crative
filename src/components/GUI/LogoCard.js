import React from 'react';
import '../../styles/ui.css';

export default function LogoCard() {
  return (
    <div className="card logo-card" style={{ justifyContent: 'center' }}>
      <img 
        src="/images/logo_black.png" 
        alt="Logo" 
        className="logo-image"
      />
    </div>
  );
}
