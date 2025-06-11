import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';
import '../../styles/ui.css';

export default function ProgressSlider() {
  const { assemblyProgress, setAssemblyProgress } = useContext(CrateContext);

  const handleChange = (e) => {
    const newProgress = parseFloat(e.target.value);
    setAssemblyProgress(newProgress);
  };

  return (
    <div className="card">
      <div className="card-title">Assembly Progress</div>
      <div className="slider-container">
        <input
          id="progress-slider"
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={assemblyProgress}
          onChange={handleChange}
          className="progress-slider"
        />
        <div className="slider-value">{Math.round(assemblyProgress * 100)}%</div>
      </div>
    </div>
  );
}