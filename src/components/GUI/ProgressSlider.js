import React, { useContext, useState } from 'react';
import { CrateContext } from '../../store/CrateContext';
import { MdFullscreen, MdFullscreenExit, MdViewAgenda } from 'react-icons/md'; // Material Design icons
import '../../styles/ui.css';

export default function ProgressSlider() {
  const { assemblyProgress, setAssemblyProgress } = useContext(CrateContext);
  const [sliderPosition, setSliderPosition] = useState('bottom'); // 'card', 'bottom', 'right'

  

  const handleChange = (e) => {
    const newProgress = parseFloat(e.target.value);
    setAssemblyProgress(newProgress);
  };

  const togglePosition = () => {
    setSliderPosition(prev => {
      // if (prev === 'card') return 'bottom';
      // if (prev === 'bottom') return 'right';
      // return 'card';
      if (prev === 'card') return 'right';
      return 'card';
    });
  };

  const getPositionIcon = () => {
    if (sliderPosition === 'card') return <MdFullscreen />;
    // if (sliderPosition === 'bottom') return <MdViewAgenda />;
    return <MdFullscreenExit />;
  };

  const getPositionTitle = () => {
    if (sliderPosition === 'card') return 'Move to right';
    // if (sliderPosition === 'bottom') return 'Move to right';
    return 'Move to card';
  };

  // return (
  //   <div className="card">
  //     <div className="card-title">Assembly Progress</div>
  //     <div className="slider-container">
  //       <input
  //         id="progress-slider"
  //         type="range"
  //         min="0"
  //         max="1"
  //         step="0.001"
  //         value={assemblyProgress}
  //         onChange={handleChange}
  //         className="progress-slider"
  //       />
  //       <div className="slider-value">{Math.round(assemblyProgress * 100)}%</div>
  //     </div>
  //   </div>
  // );


  return (
    <div className={`card ${sliderPosition === 'bottom' ? 'fullscreen-slider' : ''} ${sliderPosition === 'right' ? 'vertical-slider' : ''}`}>
      <div className="card-title">
        Assembly Progress
      </div>


      <div className="slider-container">

        {/* <div 
          onClick={togglePosition}
          className="toggle-fullscreen-btn"
          title={getPositionTitle()}
        >
          {getPositionIcon()}
        </div> */}

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
          style={sliderPosition === 'right' ? { writingMode: 'bt-lr' } : {}}
        />
        <div className="slider-value">{Math.round(assemblyProgress * 100)}%</div>

      </div>
    </div>
  );
}