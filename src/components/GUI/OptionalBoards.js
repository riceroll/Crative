import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';

const optionalBoards = [
  { type: 'board_24x5', label: '24 × 5', status: 'Coming soon' },
  { type: 'board_5x5', label: '5 × 5' }
];

export default function OptionalBoards() {
  const { boardTypesToExclude, setBoardTypesToExclude } = useContext(CrateContext);

  const toggleOptionalBoard = (boardType) => {
    setBoardTypesToExclude((excludedBoards) => (
      excludedBoards.includes(boardType)
        ? excludedBoards.filter((type) => type !== boardType)
        : [...excludedBoards, boardType]
    ));
  };

  return (
    <section className="optional-boards" aria-labelledby="optional-boards-heading">
      <h3 className="settings-section-title" id="optional-boards-heading">Optional boards <span>(in)</span></h3>
      <div className="optional-board-grid">
        {optionalBoards.map(({ type, label, status }) => (
          <label key={type} className="optional-board-control">
            <input
              type="checkbox"
              checked={!boardTypesToExclude.includes(type)}
              onChange={() => toggleOptionalBoard(type)}
              aria-labelledby={`${type}-name`}
            />
            <span className="optional-board-name" id={`${type}-name`}>{label}</span>
            {status && <span className="optional-board-status">{status}</span>}
          </label>
        ))}
      </div>
    </section>
  );
}