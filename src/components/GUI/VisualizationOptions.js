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

  const viewOptions = [
    { id: 'board-colors', label: 'Board colors', checked: visualizeBoardTypes, onChange: toggleVisualizeBoardTypes },
    { id: 'auto-camera', label: 'Auto camera', checked: autoCameraEnabled, onChange: toggleAutoCameraEnabled },
    { id: 'advanced-player', label: 'Advanced player', checked: advancedPlayerMode, onChange: toggleAdvancedPlayerMode }
  ];

  return (
    <div className="card options-sharing-card" id="tutorial-toggles-panel">
      <div className="card-title">Options & Sharing</div>

      <section className="view-settings" aria-labelledby="view-settings-heading">
        <h3 className="settings-section-title" id="view-settings-heading">View & playback</h3>
        <div className="settings-list">
          {viewOptions.map(({ id, label, checked, onChange }) => (
            <label key={id} className="settings-control">
              <span id={`${id}-label`}>{label}</span>
              <input
                className="settings-switch-input"
                type="checkbox"
                role="switch"
                checked={checked}
                onChange={onChange}
                aria-labelledby={`${id}-label`}
              />
              <span className="settings-switch-track" aria-hidden="true" />
            </label>
          ))}
        </div>
      </section>

      <div className="settings-share">
        <ShareLinkButton />
      </div>
    </div>
  );
}
