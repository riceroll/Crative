import React, { useState, useEffect, useCallback } from 'react';
import { tutorialSteps, tutorialDefaults } from './tutorialConfig';
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

      // Get settings from config
      const { popupWidth: desktopWidth, popupWidthMobile, popupHeight, margin, mobileBreakpoint } = tutorialDefaults;
      const isMobile = window.innerWidth < mobileBreakpoint;
      
      // Get position config for current device
      const positionConfig = isMobile ? step.mobile : step.desktop;
      const popupWidth = isMobile ? Math.min(popupWidthMobile, window.innerWidth - 40) : desktopWidth;
      
      let effectivePosition = positionConfig.position;
      const centerOnScreen = isMobile && positionConfig.centerOnScreen;
      const arrowPositionConfig = positionConfig.arrowPosition;

      // Auto-adjust position if not enough room
      if (effectivePosition === 'top' && rect.top < popupHeight + margin) {
        effectivePosition = 'bottom';
      } else if (effectivePosition === 'bottom' && rect.bottom + popupHeight + margin > window.innerHeight) {
        effectivePosition = 'top';
      }

      let top, left, arrowTop, arrowLeft;

      if (effectivePosition === 'right') {
        top = rect.top + (rect.height / 2) - (popupHeight / 2);
        left = rect.right + margin;
        arrowTop = arrowPositionConfig;
        arrowLeft = '-6px';
        
        if (top < 10) top = 10;
        if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10;
      } else if (effectivePosition === 'left') {
        top = rect.top + (rect.height / 2) - (popupHeight / 2);
        left = rect.left - popupWidth - margin;
        arrowTop = arrowPositionConfig;
        arrowLeft = 'calc(100% - 6px)';
        
        if (top < 10) top = 10;
        if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10;
      } else if (effectivePosition === 'top') {
        top = rect.top - popupHeight - margin;
        left = centerOnScreen 
          ? (window.innerWidth - popupWidth) / 2 
          : rect.left + (rect.width / 2) - (popupWidth / 2);
        
        arrowTop = '100%';
        if (arrowPositionConfig === 'auto') {
          const targetCenterX = rect.left + (rect.width / 2);
          const arrowPosFromLeft = targetCenterX - left;
          const clampedArrowPos = Math.max(20, Math.min(popupWidth - 20, arrowPosFromLeft));
          arrowLeft = `${clampedArrowPos}px`;
        } else {
          arrowLeft = arrowPositionConfig;
        }
        
        if (left < 10) left = 10;
        if (left + popupWidth > window.innerWidth) left = window.innerWidth - popupWidth - 10;
        if (top < 10) top = 10;
      } else {
        // bottom
        top = rect.bottom + margin;
        left = centerOnScreen 
          ? (window.innerWidth - popupWidth) / 2 
          : rect.left + (rect.width / 2) - (popupWidth / 2);
        
        arrowTop = '-6px';
        if (arrowPositionConfig === 'auto') {
          const targetCenterX = rect.left + (rect.width / 2);
          const arrowPosFromLeft = targetCenterX - left;
          const clampedArrowPos = Math.max(20, Math.min(popupWidth - 20, arrowPosFromLeft));
          arrowLeft = `${clampedArrowPos}px`;
        } else {
          arrowLeft = arrowPositionConfig;
        }
        
        if (left < 10) left = 10;
        if (left + popupWidth > window.innerWidth) left = window.innerWidth - popupWidth - 10;
      }

      setPopupStyle({ top, left, width: popupWidth });
      setArrowStyle({ 
        top: arrowTop, 
        left: arrowLeft, 
        marginTop: effectivePosition === 'top' ? '-6px' : '0',
        marginLeft: arrowPositionConfig === 'auto' ? '-6px' : '0'
      });
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
