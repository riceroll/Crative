import React, { useContext, useState } from 'react';
import { CrateContext } from '../../store/CrateContext';
import {convertToInches, convertToDisplay} from '../../utils/utils';

export default function InputForm() {
  const { innerDims, setInnerDims } = useContext(CrateContext);
  const { displayDims, setDisplayDims } = useContext(CrateContext);
  const {useInch, toggleUseInch} = useContext(CrateContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDisplayDims((prev) => ({ ...prev, [name]: value }));
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

      <div 
        className='card-title'
      >
        Cargo Dimensions


          
        <label className="toggle-switch toggle-inches">

        <span className="toggle-label-cm" style={{
            display: useInch ? 'none' : 'inline'
          }}>cm</span>


          <input
            type="checkbox"
            checked={useInch}
            onChange={toggleUseInch}
          />


          <span className="slider slider-inch"></span>

          <span className="toggle-label-in" style={{
            display: useInch ? 'inline' : 'none'
          }}>in</span>
        </label>
        
      </div>

      {/* Grid container with two columns: one for labels, one for inputs */}
      <div
        className='input-form-grid'
      >
        <label className='input-form-label' htmlFor="width">
          Width {useInch ? '(inch)' : '(cm)'}:
        </label>
        <input
          className="number-input"
          id="width"
          type="number"
          name="width"
          value={ displayDims.width }
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur(e);
            }
          }}
        />

        <label className='input-form-label' htmlFor="depth">
          Depth {useInch ? '(inch)' : '(cm)'}:
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

        <label className='input-form-label' htmlFor="height">
          Height {useInch ? '(inch)' : '(cm)'}:
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
      </div>
    </form>
  );
}