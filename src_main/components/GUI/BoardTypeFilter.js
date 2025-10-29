import React, { useContext, useState } from 'react';
import { CrateContext } from '../../store/CrateContext';
import { boardTypes } from '../../configs/boardConfig';

export default function BoardTypeFilter() {
  const { boardTypesToExclude, setBoardTypesToExclude } = useContext(CrateContext);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get all available board type keys
  const allBoardTypes = Object.keys(boardTypes);
  
  // Define required board types that cannot be disabled
  const requiredBoardTypes = ['board_40x40', 'board_40x5'];

  // Handle individual board type toggle
  const handleBoardTypeToggle = (boardType) => {
    // Don't allow toggling required board types
    if (requiredBoardTypes.includes(boardType)) {
      return;
    }

    setBoardTypesToExclude(prev => {
      if (prev.includes(boardType)) {
        // Remove from exclusion list (enable the board type)
        return prev.filter(type => type !== boardType);
      } else {
        // Add to exclusion list (disable the board type)
        return [...prev, boardType];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    // Only exclude non-required board types can be affected
    setBoardTypesToExclude(requiredBoardTypes.filter(type => !allBoardTypes.includes(type)));
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    // Exclude all except required board types
    const nonRequiredTypes = allBoardTypes.filter(type => !requiredBoardTypes.includes(type));
    setBoardTypesToExclude(nonRequiredTypes);
  };

  // Format board type name for display
  const formatBoardTypeName = (boardType) => {
    // Convert 'board_40x24' to '40×24'
    return boardType.replace('board_', '').replace('x', '×');
  };

  // Check if board type is required (always enabled)
  const isBoardTypeRequired = (boardType) => {
    return requiredBoardTypes.includes(boardType);
  };

  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="card">
      <div className="card-title collapsible-title" onClick={toggleCollapse}>
        Board Types
        {/* <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span> */}
      </div>
      
      {!isCollapsed && (
        <>
          {/* Select All / Deselect All buttons */}
          <div className="filter-controls">
            <button 
              onClick={handleSelectAll}
              className="filter-button"
            >
              Select All
            </button>
            <button 
              onClick={handleDeselectAll}
              className="filter-button"
            >
              Deselect All
            </button>
          </div>

          {/* Board type checkboxes */}
          <div className="board-type-list">
            {allBoardTypes.map(boardType => {
              const boardInfo = boardTypes[boardType];
              const isEnabled = !boardTypesToExclude.includes(boardType);
              const isRequired = isBoardTypeRequired(boardType);
              
              return (
                <div key={boardType} className="board-type-item">
                  <label className={`board-type-label ${isRequired ? 'required' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleBoardTypeToggle(boardType)}
                      className="board-type-checkbox"
                      disabled={isRequired}
                    />
                    
                    {/* Color indicator */}
                    <div
                      className="board-color-indicator"
                      style={{ backgroundColor: boardInfo.highlightColor }}
                    />
                    
                    {/* Board type info */}
                    <div className="board-type-info">
                      <span className="board-type-name">
                        {formatBoardTypeName(boardType)}
                        {/* {isRequired && <span className="required-indicator"> (Required)</span>} */}
                      </span>
                      <span className="board-type-price">
                        ${boardInfo.price.toFixed(2)}
                      </span>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {/* <div className="filter-summary">
            {allBoardTypes.length - boardTypesToExclude.length} of {allBoardTypes.length} board types enabled
          </div> */}
        </>
      )}
    </div>
  );
}
