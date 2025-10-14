import React, { useContext, useState } from 'react';
import { CrateContext } from '../../store/CrateContext';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md'; // Material Design icons
import '../../styles/ui.css';

export default function ProgressSlider() {
  const { assemblyProgress, setAssemblyProgress } = useContext(CrateContext);
  const [isFullscreen, setIsFullscreen] = useState(false);

  

  const handleChange = (e) => {
    const newProgress = parseFloat(e.target.value);
    setAssemblyProgress(newProgress);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
    <div className={`card ${isFullscreen ? 'fullscreen-slider' : ''}`}>
      <div className="card-title">
        Assembly Progress
      </div>


      <div className="slider-container">

        <div 
          onClick={toggleFullscreen}
          className="toggle-fullscreen-btn"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen slider"}
        >
          {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
        </div>

        <input
          id="progress-slider"
          type="range"
          min="0"
          max="1"
          step="0.000001"
          value={assemblyProgress}
          onChange={handleChange}
          className="progress-slider"
        />
        <div className="slider-value">{Math.round(assemblyProgress * 100)}%</div>

      </div>
    </div>
  );
}