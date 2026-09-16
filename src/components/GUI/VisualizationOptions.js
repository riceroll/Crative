import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';
import ShareLinkButton from './ShareLinkButton';
import '../../styles/ui.css';

const optionalBoards = [
  { type: 'board_24x5', label: '24 × 5', status: 'Coming soon' },
  { type: 'board_5x5', label: '5 × 5' }
];

export default function VisualizationOptions() {
  const { 
    visualizeBoardTypes, 
    toggleVisualizeBoardTypes,
    autoCameraEnabled,
    toggleAutoCameraEnabled,
    advancedPlayerMode,
    toggleAdvancedPlayerMode,
    boardTypesToExclude,
    setBoardTypesToExclude
  } = useContext(CrateContext);

  const toggleOptionalBoard = (boardType) => {
    setBoardTypesToExclude((excludedBoards) => (
      excludedBoards.includes(boardType)
        ? excludedBoards.filter((type) => type !== boardType)
        : [...excludedBoards, boardType]
    ));
  };

  const viewOptions = [
    { id: 'board-colors', label: 'Board colors', checked: visualizeBoardTypes, onChange: toggleVisualizeBoardTypes },
    { id: 'auto-camera', label: 'Auto camera', checked: autoCameraEnabled, onChange: toggleAutoCameraEnabled },
    { id: 'advanced-player', label: 'Advanced player', checked: advancedPlayerMode, onChange: toggleAdvancedPlayerMode }
  ];

  return (
    <div className="card options-sharing-card" id="tutorial-toggles-panel">
      <div className="card-title">Options & Sharing</div>

      <section className="optional-boards" aria-labelledby="optional-boards-heading">
        <h3 className="settings-section-title" id="optional-boards-heading">Optional boards <span>(in)</span></h3>
        <div className="optional-board-grid">
          {optionalBoards.map(({ type, label, status }) => {
            const isEnabled = !boardTypesToExclude.includes(type);

            return (
              <label key={type} className="optional-board-control">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleOptionalBoard(type)}
                  aria-labelledby={`${type}-name`}
                />
                <span className="optional-board-name" id={`${type}-name`}>{label}</span>
                {status && <span className="optional-board-status">{status}</span>}
              </label>
            );
          })}
        </div>
      </section>

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
