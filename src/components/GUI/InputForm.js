import React, { useContext, useState } from 'react';
import { CrateContext } from '../../store/CrateContext';
import {convertToInches, convertToDisplay} from '../../utils/utils';

export default function InputForm() {
  const { innerDims, setInnerDims } = useContext(CrateContext);
  const { displayDims, setDisplayDims } = useContext(CrateContext);
  const {useInch, toggleUseInch} = useContext(CrateContext);
  const { assemblyProgress, setAssemblyProgress } = useContext(CrateContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDisplayDims((prev) => ({ ...prev, [name]: value }));
    setAssemblyProgress(1.0);
  };


  const handleBlur = (e) => {
    const { name, value } = e.target;
    setInnerDims((prev) => ({ ...prev, [name]: useInch? Number( convertToInches(value, useInch) ).toFixed(2) : Number( convertToInches(value, useInch) ).toFixed(1) }));
    setDisplayDims((prev) => ({ ...prev, [name]: useInch ? parseFloat(Number(value).toFixed(2)).toString() : parseFloat(Number(value).toFixed(1)).toString() }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // setInnerDims(localDims);
  };

  return (
    <form
      className='card'
      onSubmit={handleSubmit}
    >
      <div className='card-title'>
        Cargo Dimensions

        <div className="unit-selector dropdown-switch toggle-inches">
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

      {/* Grid container with two columns: one for labels, one for inputs */}
      <div className='input-form-grid'>
        <label className='input-form-label' htmlFor="width">
          Width :
        </label>
        <input
          className="number-input"
          id="width"
          type="number"
          name="width"
          value={displayDims.width}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur(e);
            }
          }}
        />
        <label>
          {useInch ? 'in' : 'cm'}
        </label>

        <label className='input-form-label' htmlFor="depth">
          Depth :
        </label>
        <input
          className="number-input"
          id="depth"
          type="number"
          name="depth"
          value={displayDims.depth}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur(e);
            }
          }}
        />
        <label>
          {useInch ? 'in' : 'cm'}
        </label>

        <label className='input-form-label' htmlFor="height">
          Height :
        </label>
        <input
          className="number-input"
          id="height"
          type="number"
          name="height"
          value={displayDims.height}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur(e);
            }
          }}
        />
        <label>
          {useInch ? 'in' : 'cm'}
        </label>
      </div>
    </form>
  );
}