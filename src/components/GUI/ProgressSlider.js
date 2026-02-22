import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { MdSkipPrevious, MdSkipNext, MdPlayArrow, MdPause } from 'react-icons/md';
import { CrateContext } from '../../store/CrateContext';
import '../../styles/ui.css';

// Base speed multiplier - adjust this to make animations faster/slower globally
// Higher values = slower animation, Lower values = faster animation
const BASE_SPEED_MULTIPLIER = 12.0;

// Default speed for simple player mode
const SIMPLE_PLAYER_SPEED = 1;

export default function ProgressSlider({ motionList = [], hideAssemble = false }) {
  const { assemblyProgress, setAssemblyProgress, advancedPlayerMode } = useContext(CrateContext);
  const [sliderPosition, setSliderPosition] = useState('bottom');
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [playDirection, setPlayDirection] = useState(1); // 1 = forward (assemble), -1 = backward (disassemble)
  const [targetProgress, setTargetProgress] = useState(null);
  const sliderRef = useRef(null);
  const animationRef = useRef(null);
  const startProgressRef = useRef(0);

  const handleChange = (e) => {
    const val = parseFloat(e.target.value);
    setAssemblyProgress(val);
    startProgressRef.current = val;
    setTargetProgress(null);
    setIsPlaying(false);
  };

  // --- Simple player handlers ---
  const handleAssemble = () => {
    // If at the end, reset to beginning and play (always, even if "playing")
    if (assemblyProgress >= 0.999) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setAssemblyProgress(0);
      startProgressRef.current = 0;
      setPlayDirection(1);
      setPlaySpeed(SIMPLE_PLAYER_SPEED);
      setIsPlaying(false); // force false first
      setTargetProgress(null);
      // Use timeout to ensure state resets before re-triggering
      setTimeout(() => setIsPlaying(true), 0);
      return;
    }
    
    // If already playing forward, pause
    if (isPlaying && playDirection === 1) {
      handleSimplePause();
      return;
    }
    
    startProgressRef.current = assemblyProgress;
    setPlayDirection(1);
    setPlaySpeed(SIMPLE_PLAYER_SPEED);
    setIsPlaying(true);
    setTargetProgress(null);
  };

  const handleDisassemble = () => {
    // If at the start, reset to end and play (always, even if "playing")
    if (assemblyProgress <= 0.001) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setAssemblyProgress(1.0);
      startProgressRef.current = 1.0;
      setPlayDirection(-1);
      setPlaySpeed(SIMPLE_PLAYER_SPEED);
      setIsPlaying(false); // force false first
      setTargetProgress(null);
      setTimeout(() => setIsPlaying(true), 0);
      return;
    }
    
    // If already playing backward, pause
    if (isPlaying && playDirection === -1) {
      handleSimplePause();
      return;
    }
    
    startProgressRef.current = assemblyProgress;
    setPlayDirection(-1);
    setPlaySpeed(SIMPLE_PLAYER_SPEED);
    setIsPlaying(true);
    setTargetProgress(null);
  };

  const handleSimplePause = () => {
    setIsPlaying(false);
    setTargetProgress(null);
  };

  // --- Advanced player handlers ---
  const handlePlay = () => {
    if (assemblyProgress >= 0.999) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setAssemblyProgress(0);
      startProgressRef.current = 0;
      setPlayDirection(1);
      setIsPlaying(false);
      setTargetProgress(null);
      if (playSpeed === 0) setPlaySpeed(1);
      setTimeout(() => setIsPlaying(true), 0);
      return;
    }
    
    startProgressRef.current = assemblyProgress;
    setPlayDirection(1);
    setIsPlaying(true);
    setTargetProgress(null);
    if (playSpeed === 0) {
      setPlaySpeed(1);
    }
  };

  const handleCycleSpeed = () => {
    setPlaySpeed(prevSpeed => {
      if (prevSpeed === 1) return 2;
      if (prevSpeed === 2) return 4;
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
      startProgressRef.current = assemblyProgress;
      setTargetProgress(nextCheckpoint.startProgress);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (motionList.length === 0) return;
    
    const threshold = 0.001;
    const prevCheckpoints = motionList.filter(cp => cp.startProgress < assemblyProgress - threshold);
    
    if (prevCheckpoints.length > 0) {
      const prevCheckpoint = prevCheckpoints[prevCheckpoints.length - 1];
      startProgressRef.current = assemblyProgress;
      setTargetProgress(prevCheckpoint.startProgress);
      setIsPlaying(false);
    } else {
      startProgressRef.current = assemblyProgress;
      setTargetProgress(0);
      setIsPlaying(false);
    }
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying || targetProgress !== null) {
      const totalDuration = motionList.length > 0 
        ? Math.max(...motionList.map(m => m.endTime))
        : 30;
      
      const adjustedDuration = totalDuration * BASE_SPEED_MULTIPLIER;
      
      const startTime = performance.now();
      const startProgress = startProgressRef.current;
      
      let effectiveSpeed = playSpeed * playDirection;
      let isSeeking = false;
      
      if (targetProgress !== null) {
        isSeeking = true;
        const direction = targetProgress > startProgress ? 1 : -1;
        effectiveSpeed = 4 * direction;
      }

      const animate = (currentTime) => {
        const elapsed = (currentTime - startTime) / 1000;
        const progressIncrement = (elapsed / adjustedDuration) * effectiveSpeed;
        const newProgress = startProgress + progressIncrement;
        
        let finished = false;
        let finalProgress = newProgress;

        if (isSeeking) {
          if ((effectiveSpeed > 0 && newProgress >= targetProgress) || 
              (effectiveSpeed < 0 && newProgress <= targetProgress)) {
            finalProgress = targetProgress;
            finished = true;
          }
        } else {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playSpeed, playDirection, targetProgress]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          if (advancedPlayerMode) {
            handlePrev();
          } else {
            handleDisassemble();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (advancedPlayerMode) {
            handleNext();
          } else {
            handleAssemble();
          }
          break;
        case 'Space':
          e.preventDefault();
          if (isPlaying || targetProgress !== null) {
            handleSimplePause();
          } else if (advancedPlayerMode) {
            handlePlay();
          } else {
            handleAssemble();
          }
          break;
        case 'Digit1':
          if (advancedPlayerMode) setPlaySpeed(1);
          break;
        case 'Digit2':
          if (advancedPlayerMode) setPlaySpeed(2);
          break;
        case 'Digit3':
          if (advancedPlayerMode) setPlaySpeed(4);
          break;
        case 'Digit4':
          if (advancedPlayerMode) setPlaySpeed(8);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, assemblyProgress, motionList, targetProgress, advancedPlayerMode, playDirection]);

  const handleCheckpointClick = (checkpoint) => {
    // Add tiny offset to ensure motion becomes active (currentTime > startTime)
    setAssemblyProgress(Math.min(checkpoint.startProgress + 0.0001, 1.0));
  };

  const handleCheckpointHover = (checkpoint, event) => {
    if (!sliderRef.current) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    
    // Position tooltip
    setTooltipPosition({
      x: Math.round(event.clientX),
      y: Math.round(sliderRect.top - 10)
    });
    setHoveredCheckpoint(checkpoint);
  };

  const handleCheckpointLeave = () => {
    setHoveredCheckpoint(null);
  };

  // Generate chapters from motionList
  const chapters = useMemo(() => {
    if (!motionList || motionList.length === 0) return [];
    
    // Filter to get unique start points
    const uniqueCheckpoints = motionList.filter((checkpoint, idx, arr) => {
      if (idx === 0) return true;
      const prevCheckpoint = arr[idx - 1];
      const getMainPart = (partId) => {
        // Match face_XXX pattern
        const faceMatch = partId.match(/^(face_\w+)/);
        if (faceMatch) {
            const facePrefix = faceMatch[1];
            if (partId.includes('_piece_')) return `${facePrefix}_piece`;
            if (partId.includes('_cube_')) return `${facePrefix}_cube`;
            if (partId.includes('_board_') || partId.includes('_strip_')) return `${facePrefix}_board`;
            return `${facePrefix}_main`;
        }
        // Match cube_XXX pattern
        const cubeMatch = partId.match(/^(cube_\w+_\d+)/);
        if (cubeMatch) return 'standalone_cube'; // Group all standalone cubes
        return partId;
      };
      return getMainPart(checkpoint.partId) !== getMainPart(prevCheckpoint.partId);
    });

    // Map to segments
    return uniqueCheckpoints.map((cp, i) => {
      const nextCp = uniqueCheckpoints[i + 1];
      return {
        ...cp,
        endProgress: nextCp ? nextCp.startProgress : 1.0
      };
    });
  }, [motionList]);

  const handleContainerMouseMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const isVertical = sliderPosition === 'right';
    
    let progress;
    if (isVertical) {
        // Bottom to top (slider value 0 is at bottom)
        // clientY increases downwards. rect.bottom is the bottom edge.
        // distance from bottom = rect.bottom - e.clientY
        const distanceFromBottom = rect.bottom - e.clientY;
        progress = distanceFromBottom / rect.height;
    } else {
        // Left to right
        const x = e.clientX - rect.left;
        progress = x / rect.width;
    }
    
    // Clamp
    progress = Math.max(0, Math.min(1, progress));
    
    // Find chapter
    const chapter = chapters.find(c => progress >= c.startProgress && progress < c.endProgress);
    
    if (chapter) {
        setHoveredCheckpoint(chapter);
        // Update tooltip position
        if (isVertical && window.innerWidth <= 768) {
             setTooltipPosition({
                x: Math.round(rect.right + 10),
                y: Math.round(e.clientY)
             });
        } else {
             setTooltipPosition({
                x: Math.round(e.clientX),
                y: Math.round(rect.top - 10)
             });
        }
    } else {
        setHoveredCheckpoint(null);
    }
  };

  const handleContainerMouseLeave = () => {
      setHoveredCheckpoint(null);
  };

  // Helper to get assembly instruction from part ID
  const getAssemblyInstruction = (partId) => {
    // Helper to capitalize first letter
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    // Check for Face pattern first (face_NAME...)
    const faceMatch = partId.match(/^face_([a-z]+)/);
    
    if (faceMatch) {
      const faceName = capitalize(faceMatch[1]);
      
      if (partId.includes('_board_') || partId.includes('_strip_')) {
        return `Board on ${faceName} Face`;
      } else if (partId.includes('_cube_')) {
        return `Cube on ${faceName} Face`;
      } else if (partId.includes('_piece_')) {
        return `Connect on ${faceName} Face`;
      } else {
        // Just the face itself
        return `${faceName} Face`;
      }
    }
    
    // Check for standalone Cube pattern
    if (partId.startsWith('cube_')) {
      return 'Cube';
    }

    // Fallback to original logic if no match
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
      <div className={`card fullscreen-slider mobile-horizontal`}>
        <div className="card-title">Assembly Progress</div>

        <div className="slider-container" style={{ position: 'relative' }}>
          {/* LEFT SIDE: Simple mode = Disassemble text, Advanced mode = playback controls */}
          {advancedPlayerMode ? (
            <div className="playback-controls" id="tutorial-video-controls">
              <button onClick={handlePrev} className="playback-button" title="Previous checkpoint">
                <MdSkipPrevious />
              </button>
              
              {!isPlaying ? (
                <button onClick={handlePlay} className="playback-button" title="Play">
                  <MdPlayArrow />
                </button>
              ) : (
                <button onClick={handlePause} className="playback-button" title="Pause">
                  <MdPause />
                </button>
              )}
              
              <button onClick={handleCycleSpeed} className="playback-button speed-button" title="Cycle playback speed">
                ×{playSpeed}
              </button>
              
              <button onClick={handleNext} className="playback-button" title="Next checkpoint">
                <MdSkipNext />
              </button>
            </div>
          ) : (
            <div 
              className="slider-action-label"
              onClick={isPlaying && playDirection === -1 ? handleSimplePause : handleDisassemble}
              style={{ cursor: 'pointer' }}
            >
              {isPlaying && playDirection === -1 ? 'Pause' : 'Disassemble'}
            </div>
          )}

          {/* Slider and checkpoints */}
          <div 
            ref={sliderRef} 
            id="tutorial-slider-bar" 
            style={{ position: 'relative', flex: 1, marginRight: '0px', display: 'flex', alignItems: 'center' }}
            onMouseMove={handleContainerMouseMove}
            onMouseLeave={handleContainerMouseLeave}
          >
            <input
              id="progress-slider"
              type="range"
              min="0"
              max="1"
              step="0.000001"
              value={assemblyProgress}
              onChange={handleChange}
              className="progress-slider"
              orient={sliderPosition === 'right' ? "vertical" : "horizontal"}
              style={{ 
                marginRight: 0, 
                width: '100%',
                background: sliderPosition === 'right'
                  ? `linear-gradient(to top, #FFB004 0%, #FFB004 ${assemblyProgress * 100}%, rgba(255, 255, 255, 0.3) ${assemblyProgress * 100}%, rgba(255, 255, 255, 0.3) 100%)`
                  : `linear-gradient(to right, #FFB004 0%, #FFB004 ${assemblyProgress * 100}%, rgba(255, 255, 255, 0.3) ${assemblyProgress * 100}%, rgba(255, 255, 255, 0.3) 100%)`
              }}
            />
            
            {/* Chapter Separators */}
            {chapters.map((chapter, idx) => {
              if (idx === 0) return null;
              const isMobile = window.innerWidth <= 768;
              const isVertical = sliderPosition === 'right';
              const thickness = isMobile ? '2px' : '4px';
              
              if (isVertical) {
                return (
                  <div
                    key={`sep-${idx}`}
                    style={{
                      position: 'absolute',
                      left: 0, right: 0,
                      bottom: `${chapter.startProgress * 100}%`,
                      height: thickness,
                      transform: 'translateY(50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      pointerEvents: 'none',
                      zIndex: 2
                    }}
                  />
                );
              } else {
                return (
                  <div
                    key={`sep-${idx}`}
                    style={{
                      position: 'absolute',
                      top: 0, bottom: 0,
                      left: `${chapter.startProgress * 100}%`,
                      width: thickness,
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      pointerEvents: 'none',
                      zIndex: 2
                    }}
                  />
                );
              }
            })}

            {/* Hover Highlight */}
            {hoveredCheckpoint && (
              (() => {
                const isVertical = sliderPosition === 'right';
                const start = hoveredCheckpoint.startProgress * 100;
                const end = hoveredCheckpoint.endProgress * 100;
                const size = end - start;
                
                if (isVertical) {
                  return (
                    <div style={{
                      position: 'absolute',
                      left: 0, right: 0,
                      bottom: `${start}%`,
                      height: `${size}%`,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }} />
                  );
                } else {
                  return (
                    <div style={{
                      position: 'absolute',
                      top: 0, bottom: 0,
                      left: `${start}%`,
                      width: `${size}%`,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }} />
                  );
                }
              })()
            )}
          </div>

          {/* Tooltip */}
          {hoveredCheckpoint && (
            <div
              className="checkpoint-tooltip"
              style={{
                position: 'fixed',
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y - 40}px`,
                transform: 'none',
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

          {/* RIGHT SIDE: Simple mode = Assemble text, Advanced mode = percentage */}
          {advancedPlayerMode ? (
            <div className="slider-value">{Math.round(assemblyProgress * 100)}%</div>
          ) : (
            <div 
              className="slider-action-label"
              onClick={isPlaying && playDirection === 1 ? handleSimplePause : handleAssemble}
              style={{ cursor: 'pointer' }}
            >
              {isPlaying && playDirection === 1 ? 'Pause' : 'Assemble'}
            </div>
          )}
        </div>
      </div>
      
    </>
  );
}
