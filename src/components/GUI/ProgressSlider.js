import React, { useContext, useState, useRef, useEffect } from 'react';
import { MdSkipPrevious, MdSkipNext, MdPlayArrow, MdPause, MdUnfoldMore, MdUnfoldLess } from 'react-icons/md';
import { CrateContext } from '../../store/CrateContext';
import '../../styles/ui.css';

// Base speed multiplier - adjust this to make animations faster/slower globally
// Higher values = slower animation, Lower values = faster animation
const BASE_SPEED_MULTIPLIER = 8.0;

export default function ProgressSlider({ motionList = [], hideAssemble = false }) {
  const { assemblyProgress, setAssemblyProgress } = useContext(CrateContext);
  const [sliderPosition, setSliderPosition] = useState('bottom');
  const [mobileOrientation, setMobileOrientation] = useState('horizontal'); // 'vertical' or 'horizontal'
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [targetProgress, setTargetProgress] = useState(null);
  const sliderRef = useRef(null);
  const animationRef = useRef(null);

  const handleChange = (e) => {
    setAssemblyProgress(parseFloat(e.target.value));
    setTargetProgress(null);
    setIsPlaying(false);
  };

  const handlePlay = () => {
    // If we are at the end (or very close to it), restart from beginning
    if (assemblyProgress >= 0.999) {
      setAssemblyProgress(0);
    }
    
    setIsPlaying(true);
    setTargetProgress(null);
    if (playSpeed === 1) {
      setPlaySpeed(1);
    }
  };

  const handleCycleSpeed = () => {
    // Cycle through speeds: 1 → 2 → 4 → 8 → 1
    setPlaySpeed(prevSpeed => {
      if (prevSpeed === 1) return 2;
      if (prevSpeed === 2) return 4;
      // if (prevSpeed === 4) return 8;
      return 1;
    });
  };

  const handlePause = () => {
    setIsPlaying(false);
    setTargetProgress(null);
  };

  const handleNext = () => {
    if (motionList.length === 0) return;
    const nextCheckpoint = motionList.find(cp => cp.startProgress > assemblyProgress);
    if (nextCheckpoint) {
      setTargetProgress(nextCheckpoint.startProgress);
      setIsPlaying(false); // Ensure normal playback is off
    }
  };

  const handlePrev = () => {
    if (motionList.length === 0) return;
    
    // Find checkpoints that are clearly before current position (with small threshold)
    const threshold = 0.001;
    const prevCheckpoints = motionList.filter(cp => cp.startProgress < assemblyProgress - threshold);
    
    if (prevCheckpoints.length > 0) {
      const prevCheckpoint = prevCheckpoints[prevCheckpoints.length - 1];
      setTargetProgress(prevCheckpoint.startProgress);
      setIsPlaying(false); // Ensure normal playback is off
    } else {
      // No previous checkpoint, go to start
      setTargetProgress(0);
      setIsPlaying(false); // Ensure normal playback is off
    }
  };

  useEffect(() => {
    if (isPlaying || targetProgress !== null) {
      // Calculate total duration from motionList
      const totalDuration = motionList.length > 0 
        ? Math.max(...motionList.map(m => m.endTime))
        : 30; // Fallback to 30 seconds if no motions
      
      // Apply base speed multiplier
      const adjustedDuration = totalDuration * BASE_SPEED_MULTIPLIER;
      
      const startTime = performance.now();
      const startProgress = assemblyProgress;
      
      // Determine effective speed and direction
      let effectiveSpeed = playSpeed;
      let isSeeking = false;
      
      if (targetProgress !== null) {
        isSeeking = true;
        // Direction: 1 for forward, -1 for backward
        const direction = targetProgress > startProgress ? 1 : -1;
        // Use 4x speed for seeking
        effectiveSpeed = 4 * direction;
      }

      const animate = (currentTime) => {
        const elapsed = (currentTime - startTime) / 1000; // Convert to seconds
        const progressIncrement = (elapsed / adjustedDuration) * effectiveSpeed;
        const newProgress = startProgress + progressIncrement;
        
        let finished = false;
        let finalProgress = newProgress;

        if (isSeeking) {
          // Check if we reached or passed the target
          if ((effectiveSpeed > 0 && newProgress >= targetProgress) || 
              (effectiveSpeed < 0 && newProgress <= targetProgress)) {
            finalProgress = targetProgress;
            finished = true;
          }
        } else {
          // Normal playback limits
          if (newProgress >= 1.0) {
            finalProgress = 1.0;
            finished = true;
          } else if (newProgress <= 0.0) {
            finalProgress = 0.0;
            finished = true;
          }
        }
        
        setAssemblyProgress(finalProgress);

        if (finished) {
          setIsPlaying(false);
          setTargetProgress(null);
        } else {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playSpeed, assemblyProgress, setAssemblyProgress, motionList, targetProgress]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Space':
          e.preventDefault();
          if (isPlaying || targetProgress !== null) {
            handlePause();
          } else {
            handlePlay();
          }
          break;
        case 'Digit1':
          setPlaySpeed(1);
          break;
        case 'Digit2':
          setPlaySpeed(2);
          break;
        case 'Digit3':
          setPlaySpeed(4);
          break;
        case 'Digit4':
          setPlaySpeed(8);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, assemblyProgress, motionList, targetProgress]);

  const handleCheckpointClick = (checkpoint) => {
    // Add tiny offset to ensure motion becomes active (currentTime > startTime)
    setAssemblyProgress(Math.min(checkpoint.startProgress + 0.0001, 1.0));
  };

  const handleCheckpointHover = (checkpoint, event) => {
    if (!sliderRef.current) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    
    // Position tooltip based on orientation
    if (mobileOrientation === 'vertical' && window.innerWidth <= 768) {
      setTooltipPosition({
        x: Math.round(sliderRect.right + 10),
        y: Math.round(event.clientY)
      });
    } else {
      setTooltipPosition({
        x: Math.round(event.clientX),
        y: Math.round(sliderRect.top - 10)
      });
    }
    setHoveredCheckpoint(checkpoint);
  };

  const handleCheckpointLeave = () => {
    setHoveredCheckpoint(null);
  };

  // Helper to get assembly instruction from part ID
  const getAssemblyInstruction = (partId) => {
    const parts = partId.split('_');
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === 'face' && i + 1 < parts.length) {
        result.push('Face');
        result.push(parts[++i].charAt(0).toUpperCase() + parts[i].slice(1));
      } else if (part === 'strip' && i + 1 < parts.length) {
        result.push('Strip');
        result.push(parts[++i]);
      } else if (part === 'piece' && i + 1 < parts.length) {
        result.push('Piece');
        result.push(parts[++i]);
      } else if (part === 'bar' && i + 1 < parts.length) {
        result.push('Bar');
        result.push(parts[++i]);
      } else if (part === 'cube' && i + 1 < parts.length) {
        result.push('Cube');
        result.push(parts[++i]);
      }
    }
    
    return result.length > 0 ? result.join(' ') : partId;
  };

  return (
    <>
      <div className={`card ${sliderPosition === 'bottom' ? 'fullscreen-slider' : ''} ${sliderPosition === 'right' ? 'vertical-slider' : ''} ${mobileOrientation === 'vertical' ? 'mobile-vertical' : 'mobile-horizontal'}`}>
        <div className="card-title">Assembly Progress</div>

        <div className="slider-container" style={{ position: 'relative' }}>
          {/* Orientation Toggle Button (Mobile Only) */}
          <button
            onClick={() => setMobileOrientation(mobileOrientation === 'vertical' ? 'horizontal' : 'vertical')}
            className="orientation-toggle-button"
            title={mobileOrientation === 'vertical' ? 'Switch to horizontal' : 'Switch to vertical'}
          >
            {mobileOrientation === 'vertical' ? <MdUnfoldLess /> : <MdUnfoldMore />}
          </button>

          {/* Disassemble label - positioned before controls and slider */}
          {hideAssemble && (
            <div className="slider-value hide-on-mobile" style={{ flexShrink: 0 }}>Disassemble</div>
          )}

          {/* Playback Controls (only show here if NOT mobile vertical) */}
          {!hideAssemble && (
            <div className="playback-controls" id="tutorial-video-controls">
              <button
                onClick={handlePrev}
                className="playback-button"
                title="Previous checkpoint"
              >
                <MdSkipPrevious />
              </button>
              
              {!isPlaying ? (
                <button
                  onClick={handlePlay}
                  className="playback-button"
                  title="Play"
                >
                  <MdPlayArrow />
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="playback-button"
                  title="Pause"
                >
                  <MdPause />
                </button>
              )}
              
              <button
                onClick={handleCycleSpeed}
                className="playback-button speed-button"
                title="Cycle playback speed"
              >
                ×{playSpeed}
              </button>
              
              <button
                onClick={handleNext}
                className="playback-button"
                title="Next checkpoint"
              >
                <MdSkipNext />
              </button>
            </div>
          )}

          {/* Wrapper for slider and checkpoints */}
          <div ref={sliderRef} id="tutorial-slider-bar" style={{ position: 'relative', flex: 1, marginRight: '0px', display: 'flex', alignItems: 'center' }}>
          <input
            id="progress-slider"
            type="range"
            min="0"
            max="1"
            step="0.000001"
            value={assemblyProgress}
            onChange={handleChange}
            className="progress-slider"
            orient={(sliderPosition === 'right' || (mobileOrientation === 'vertical' && window.innerWidth <= 768)) ? "vertical" : "horizontal"}
            style={{ marginRight: 0, width: '100%' }}
          />
          
          {/* Checkpoints */}
          {!hideAssemble && motionList
            .filter((checkpoint, idx, arr) => {
              // Only show first checkpoint for each part (hide subsequent lines for same part)
              if (idx === 0) return true;
              const prevCheckpoint = arr[idx - 1];
              // Extract the main part identifier (e.g., "face_front" from "face_front_strip_0_board_0_1")
              const getMainPart = (partId) => {
                // Match face_XXX pattern
                const faceMatch = partId.match(/^(face_\w+)/);
                if (faceMatch) return faceMatch[1];
                // Match cube_XXX pattern
                const cubeMatch = partId.match(/^(cube_\w+_\d+)/);
                if (cubeMatch) return cubeMatch[1];
                return partId;
              };
              return getMainPart(checkpoint.partId) !== getMainPart(prevCheckpoint.partId);
            })
            .map((checkpoint, idx) => {
            // Account for thumb radius (16px / 2 = 8px)
            const thumbRadius = 8;
            const isVertical = sliderPosition === 'right' || (mobileOrientation === 'vertical' && window.innerWidth <= 768);
            
            if (isVertical) {
              // Vertical positioning (bottom to top, so invert)
              const bottomPosition = `calc(${thumbRadius}px + ${checkpoint.startProgress} * (100% - ${thumbRadius * 2}px))`;
              return (
                <div
                  key={idx}
                  className="progress-checkpoint"
                  style={{
                    position: 'absolute',
                    left: '-4px',
                    right: '-4px',
                    bottom: bottomPosition,
                    margin: 'auto',
                    width: 'calc(100% + 4px)',
                    height: '3px',
                    transform: 'translateY(50%)',
                    borderRadius: '1px',
                    backgroundColor: 'rgba(255, 176, 4, 0.4)',
                    cursor: 'pointer',
                    zIndex: 1,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleCheckpointClick(checkpoint)}
                  onMouseEnter={(e) => handleCheckpointHover(checkpoint, e)}
                  onMouseMove={(e) => handleCheckpointHover(checkpoint, e)}
                  onMouseLeave={handleCheckpointLeave}
                />
              );
            } else {
              // Horizontal positioning
              const leftPosition = `calc(${thumbRadius}px + ${checkpoint.startProgress} * (100% - ${thumbRadius * 2}px))`;
              return (
                <div
                  key={idx}
                  className="progress-checkpoint"
                  style={{
                    position: 'absolute',
                    left: leftPosition,
                    top: '-4px',
                    bottom: '-4px',
                    margin: 'auto',
                    height: 'calc(100% + 8px)',
                    transform: 'translateX(-50%)',
                    width: '3px',
                    borderRadius: '1px',
                    backgroundColor: 'rgba(255, 176, 4, 0.4)',
                    cursor: 'pointer',
                    zIndex: 1,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleCheckpointClick(checkpoint)}
                  onMouseEnter={(e) => handleCheckpointHover(checkpoint, e)}
                  onMouseMove={(e) => handleCheckpointHover(checkpoint, e)}
                  onMouseLeave={handleCheckpointLeave}
                />
              );
            }
          })}
        </div>

        {/* Tooltip */}
        {hoveredCheckpoint && (
          <div
            className="checkpoint-tooltip"
            style={{
              position: 'fixed',
              left: mobileOrientation === 'vertical' && window.innerWidth <= 768 ? `${tooltipPosition.x}px` : `${tooltipPosition.x}px`,
              top: mobileOrientation === 'vertical' && window.innerWidth <= 768 ? `${tooltipPosition.y - 20}px` : `${tooltipPosition.y - 40}px`,
              transform: mobileOrientation === 'vertical' && window.innerWidth <= 768 ? 'translateY(-50%)' : 'none',
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
              Step {hoveredCheckpoint.stepNumber}/{hoveredCheckpoint.totalSteps}
            </div>
            <div style={{ fontSize: '11px', color: '#FFB004' }}>
              {getAssemblyInstruction(hoveredCheckpoint.partId)}
            </div>
          </div>
        )}

        {hideAssemble ? (
          <div className="slider-value hide-on-mobile">Assemble</div>
        ) : (
          <div className="slider-value hide-on-mobile">{Math.round(assemblyProgress * 100)}%</div>
        )}
      </div>
    </div>
    
    {/* Separate playback controls below vertical slider (mobile only) */}
    {!hideAssemble && mobileOrientation === 'vertical' && window.innerWidth <= 768 && (
      <div className="mobile-vertical-controls">
        <button
          onClick={handlePrev}
          className="playback-button"
          title="Previous checkpoint"
        >
          <MdSkipPrevious />
        </button>
        
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="playback-button"
            title="Play"
          >
            <MdPlayArrow />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="playback-button"
            title="Pause"
          >
            <MdPause />
          </button>
        )}
        
        <button
          onClick={handleCycleSpeed}
          className="playback-button speed-button"
          title="Cycle playback speed"
        >
          ×{playSpeed}
        </button>
        
        <button
          onClick={handleNext}
          className="playback-button"
          title="Next checkpoint"
        >
          <MdSkipNext />
        </button>
      </div>
    )}
    </>
  );
}
