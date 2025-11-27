import React, { useContext, useState, useEffect } from 'react';
import { CrateContext } from '../../store/CrateContext';
import {convertToInches, convertToDisplay} from '../../utils/utils';

export default function InputForm() {
  const { innerDims, setInnerDims } = useContext(CrateContext);
  const { displayDims, setDisplayDims } = useContext(CrateContext);
  const {useInch, toggleUseInch} = useContext(CrateContext);
  const { assemblyProgress, setAssemblyProgress } = useContext(CrateContext);
  
  // Pending values that haven't been confirmed yet
  const [pendingDims, setPendingDims] = useState(displayDims);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Sync pendingDims when displayDims changes externally (e.g., unit toggle)
  useEffect(() => {
    setPendingDims(displayDims);
    setHasChanges(false);
  }, [displayDims]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPendingDims((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleConfirm = () => {
    if (!hasChanges) return;
    
    // Apply all pending changes
    Object.keys(pendingDims).forEach((name) => {
      const value = pendingDims[name];
      setInnerDims((prev) => ({ 
        ...prev, 
        [name]: useInch ? Number(convertToInches(value, useInch)).toFixed(2) : Number(convertToInches(value, useInch)).toFixed(1) 
      }));
      setDisplayDims((prev) => ({ 
        ...prev, 
        [name]: useInch ? parseFloat(Number(value).toFixed(2)).toString() : parseFloat(Number(value).toFixed(1)).toString() 
      }));
    });
    
    setAssemblyProgress(1.0);
    setHasChanges(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleConfirm();
  };

  return (
    <form
      className='card'
      onSubmit={handleSubmit}
      id="tutorial-dimensions-panel"
    >
      <div className='card-title' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Cargo Dimensions</span>

        <div className="unit-selector dropdown-switch">
          <select
            value={useInch ? 'inch' : 'cm'}
            onChange={(e) => {
              if ((e.target.value === 'inch' && !useInch) || (e.target.value === 'cm' && useInch)) {
                toggleUseInch();
              }
            }}
            className="unit-dropdown"
          >
            <option value="cm">cm</option>
            <option value="inch">in</option>
          </select>
        </div>

      </div>

      {/* Two column layout: inputs column + button column */}
      <div className='input-form-container'>
        {/* Left column: inputs grid */}
        <div className='input-form-grid'>
          <label className='input-form-label' htmlFor="width">
            Width:
          </label>
          <input
            className="number-input"
            id="width"
            type="number"
            name="width"
            value={pendingDims.width}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <label className='input-unit-label'>
            {useInch ? 'in' : 'cm'}
          </label>

          <label className='input-form-label' htmlFor="depth">
            Depth:
          </label>
          <input
            className="number-input"
            id="depth"
            type="number"
            name="depth"
            value={pendingDims.depth}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <label className='input-unit-label'>
            {useInch ? 'in' : 'cm'}
          </label>

          <label className='input-form-label' htmlFor="height">
            Height:
          </label>
          <input
            className="number-input"
            id="height"
            type="number"
            name="height"
            value={pendingDims.height}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <label className='input-unit-label'>
            {useInch ? 'in' : 'cm'}
          </label>
        </div>
        
        {/* Right column: confirm button */}
        <div className='input-form-button-column'>
          <button
            type="button"
            className={`confirm-dims-btn ${hasChanges ? 'has-changes' : ''}`}
            onClick={handleConfirm}
            disabled={!hasChanges}
          >
            Apply
          </button>
        </div>
      </div>
    </form>
  );
}