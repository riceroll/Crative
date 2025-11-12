import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';
import { IoColorPalette } from 'react-icons/io5';
import { MdVideocam } from 'react-icons/md';
import '../../styles/floatingControls.css';

export default function FloatingControls({ show = false, hideAutoCamera = false }) {
  const { visualizeBoardTypes, toggleVisualizeBoardTypes, autoCameraEnabled, toggleAutoCameraEnabled } = useContext(CrateContext);

  // Don't render if show is false
  if (!show) {
    return null;
  }

  return (
    <div className="floating-controls">
      {/* Board Type Visualization Toggle */}
      <div className="floating-button-wrapper">
        <button
          className={`floating-button ${visualizeBoardTypes ? 'active' : ''}`}
          onClick={toggleVisualizeBoardTypes}
          title="Toggle Board Type Colors"
        >
          <IoColorPalette size={24} />
        </button>
        <span className="floating-button-label">Board Types</span>
      </div>

      {/* Auto Camera Toggle - hidden when hideAutoCamera is true */}
      {!hideAutoCamera && (
        <div className="floating-button-wrapper">
          <button
            className={`floating-button ${autoCameraEnabled ? 'active' : ''}`}
            onClick={toggleAutoCameraEnabled}
            title="Toggle Auto Camera"
          >
            <MdVideocam size={24} />
          </button>
          <span className="floating-button-label">Auto Camera</span>
        </div>
      )}
    </div>
  );
}
