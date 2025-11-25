import React, { useState, useEffect } from 'react';
import '../../styles/ui.css';

export default function HelpButton() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Only show button if user has previously dismissed the tutorial
    const completed = localStorage.getItem('tutorial_completed');
    setShowButton(completed === 'true');
  }, []);

  const handleShowTutorial = () => {
    localStorage.removeItem('tutorial_completed');
    window.location.reload();
  };

  if (!showButton) return null;

  return (
    <button 
      className="help-button" 
      onClick={handleShowTutorial}
      aria-label="Show Tutorial"
    >
      ?
    </button>
  );
}
