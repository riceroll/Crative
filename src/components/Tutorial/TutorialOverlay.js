import React, { useState, useEffect, useCallback } from 'react';
import { tutorialSteps } from './tutorialConfig';
import '../../styles/tutorial.css';

export default function TutorialOverlay() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [popupStyle, setPopupStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});

  // Check localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem('tutorial_completed');
    if (!completed) {
      // Small delay to ensure UI is rendered
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!isVisible) return;

    const step = tutorialSteps[currentStepIndex];
    const target = document.getElementById(step.targetId);

    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate popup position
      const popupWidth = 300;
      const popupHeight = 150; // Approximate
      const margin = 15;

      let top, left, arrowTop, arrowLeft;

      if (step.position === 'right') {
        top = rect.top + (rect.height / 2) - (popupHeight / 2);
        left = rect.right + margin;
        
        // Arrow
        arrowTop = '50%';
        arrowLeft = '-6px';
        
        // Adjust if off screen
        if (top < 10) top = 10;
        if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10;
      } else if (step.position === 'left') {
        top = rect.top + (rect.height / 2) - (popupHeight / 2);
        left = rect.left - popupWidth - margin;
        
        // Arrow
        arrowTop = '50%';
        arrowLeft = 'calc(100% - 6px)'; // Position on the right edge
        
        // Adjust if off screen
        if (top < 10) top = 10;
        if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10;
      } else if (step.position === 'top') {
        top = rect.top - popupHeight - margin; // This might need dynamic height calculation
        left = rect.left + (rect.width / 2) - (popupWidth / 2);
        
        // Arrow
        arrowTop = '100%'; // Point down
        arrowLeft = '50%';
        
        // Adjust if off screen
        if (left < 10) left = 10;
        if (left + popupWidth > window.innerWidth) left = window.innerWidth - popupWidth - 10;
      } else {
        // Default or bottom
        top = rect.bottom + margin;
        left = rect.left + (rect.width / 2) - (popupWidth / 2);
        
        arrowTop = '-6px';
        arrowLeft = '50%';
      }

      setPopupStyle({ top, left });
      setArrowStyle({ top: arrowTop, left: arrowLeft, marginTop: step.position === 'top' ? '-6px' : '0' });
    }
  }, [currentStepIndex, isVisible]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    setIsVisible(false);
    if (neverShowAgain) {
      localStorage.setItem('tutorial_completed', 'true');
    }
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStepIndex];

  return (
    <div className="tutorial-overlay-container">
      {/* Highlight Mask - Optional, creates a spotlight effect */}
      {targetRect && (
        <div 
          className="tutorial-highlight-mask"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height
          }}
        />
      )}

      <div className="tutorial-popup" style={popupStyle}>
        <div className="tutorial-arrow" style={arrowStyle} />
        
        <div className="tutorial-header">
          <span className="tutorial-title">{step.title}</span>
          <span className="tutorial-step-counter">
            {currentStepIndex + 1} / {tutorialSteps.length}
          </span>
        </div>

        <div className="tutorial-content">
          {step.content}
        </div>

        <div className="tutorial-footer">
          <label className="tutorial-checkbox">
            <input 
              type="checkbox" 
              checked={neverShowAgain}
              onChange={(e) => setNeverShowAgain(e.target.checked)}
            />
            Never show again
          </label>

          <div className="tutorial-buttons">
            <button className="tutorial-btn tutorial-btn-secondary" onClick={handleSkip}>
              Skip
            </button>
            
            {currentStepIndex > 0 && (
              <button className="tutorial-btn tutorial-btn-secondary" onClick={handlePrev}>
                Prev
              </button>
            )}
            
            <button className="tutorial-btn tutorial-btn-primary" onClick={handleNext}>
              {currentStepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
