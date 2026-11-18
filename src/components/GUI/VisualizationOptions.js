import React, { useContext, useMemo, useState } from 'react';
import { CrateContext } from '../../store/CrateContext';
import { ModelContext } from '../../store/ModelContext';
import { useSimpleSceneGraph } from '../../hooks/useSceneGraph';
import ShareLinkButton from './ShareLinkButton';
import CollapsiblePanel from './CollapsiblePanel';
import { IoDownloadOutline } from 'react-icons/io5';
import { exportScenePartsZip } from '../../utils/modelExport';
import '../../styles/ui.css';

export default function VisualizationOptions() {
  const models = useContext(ModelContext);
  const { 
    visualizeBoardTypes, 
    toggleVisualizeBoardTypes,
    autoCameraEnabled,
    toggleAutoCameraEnabled,
    advancedPlayerMode,
    toggleAdvancedPlayerMode,
    selectedCandidate,
    assemblyProgress
  } = useContext(CrateContext);
  const { sceneGraph, isLoading } = useSimpleSceneGraph(selectedCandidate, assemblyProgress);
  const [exportFormat, setExportFormat] = useState('obj');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const canExport = useMemo(() => {
    return !isLoading && models && sceneGraph && Object.keys(sceneGraph).length > 0;
  }, [isLoading, models, sceneGraph]);

  const handleExport = async () => {
    if (!canExport || isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      setExportMessage('Preparing download...');

      const result = await exportScenePartsZip({
        sceneGraph,
        models,
        format: exportFormat,
        filePrefix: 'crative-build'
      });

      setExportMessage(`Downloaded ${result.partCount} parts as ${result.format.toUpperCase()} ZIP`);
    } catch (err) {
      console.error('Model export failed:', err);
      setExportMessage(err?.message || 'Model export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const viewOptions = [
    { id: 'board-colors', label: 'Board colors', checked: visualizeBoardTypes, onChange: toggleVisualizeBoardTypes },
    { id: 'auto-camera', label: 'Auto camera', checked: autoCameraEnabled, onChange: toggleAutoCameraEnabled },
    { id: 'advanced-player', label: 'Advanced player', checked: advancedPlayerMode, onChange: toggleAdvancedPlayerMode }
  ];

  return (
    <CollapsiblePanel id="tutorial-toggles-panel" title="Options & Sharing" stateKey="visualizationOptions" className="options-sharing-card">

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

        <div className="export-controls">
          <div className="export-row">
            <label htmlFor="export-format" className="export-format-label">
              Format
            </label>
            <select
              id="export-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              disabled={isExporting}
              className="export-format-select"
            >
              <option value="obj">OBJ (recommended)</option>
              <option value="stl">STL</option>
            </select>
          </div>

          <button
            type="button"
            className="share-link-button export-button"
            onClick={handleExport}
            disabled={!canExport || isExporting}
            title="Download each visible part as a separate model file in one ZIP"
          >
            <IoDownloadOutline size={18} aria-hidden="true" />
            {isExporting ? 'Exporting...' : 'Download model ZIP'}
          </button>

          {exportMessage && (
            <p className="settings-note" role="status" aria-live="polite" style={{ marginTop: '8px' }}>
              {exportMessage}
            </p>
          )}
        </div>
      </div>
    </CollapsiblePanel>
  );
}
