import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';
import '../../styles/ui.css';

export default function VisualizationOptions() {
  const { visualizeBoardTypes, toggleVisualizeBoardTypes } = useContext(CrateContext);

  return (
    <div className="card">
      <div className="toggle-container">
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
    </div>
  );
}