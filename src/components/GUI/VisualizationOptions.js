import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';
import '../../styles/ui.css';

export default function VisualizationOptions() {
  const { 
    visualizeBoardTypes, 
    toggleVisualizeBoardTypes,
    autoCameraEnabled,
    toggleAutoCameraEnabled
  } = useContext(CrateContext);

  return (
    <div className="card">
      <div className="toggle-container" style={{ marginBottom: '12px' }}> 
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={visualizeBoardTypes}
            onChange={toggleVisualizeBoardTypes}
          />
          <span className="slider"></span>
        </label>
        <span className="toggle-label">Visualize Board Types</span>
      </div>
      
      <div className="toggle-container">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={autoCameraEnabled}
            onChange={toggleAutoCameraEnabled}
          />
          <span className="slider"></span>
        </label>
        <span className="toggle-label">Auto Camera</span>
      </div>
    </div>
  );
}