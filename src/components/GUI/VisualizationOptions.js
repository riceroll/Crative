import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';
import ShareLinkButton from './ShareLinkButton';
import '../../styles/ui.css';

export default function VisualizationOptions() {
  const { 
    visualizeBoardTypes, 
    toggleVisualizeBoardTypes,
    autoCameraEnabled,
    toggleAutoCameraEnabled,
    advancedPlayerMode,
    toggleAdvancedPlayerMode
  } = useContext(CrateContext);

  return (
    <div className="card" id="tutorial-toggles-panel">
      <div className="card-title" style={{ marginBottom: '12px' }}>
        <span>Options & Sharing</span>
      </div>
      
      <div className="visualization-options-mobile">
        <div className="toggle-container">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={visualizeBoardTypes} 
              onChange={toggleVisualizeBoardTypes} 
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">Board Types</span>
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

        <div className="toggle-container">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={advancedPlayerMode} 
              onChange={toggleAdvancedPlayerMode} 
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">Advanced Player</span>
        </div>

        {/* Share Button acting as the 4th item */}
        <div className="toggle-container" style={{ marginTop: '8px', width: '100%' }}>
          <ShareLinkButton />
        </div>
      </div>
    </div>
  );
}
