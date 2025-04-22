import React, { useContext, useState } from 'react';
import { CrateContext } from '../../store/CrateContext';

export default function InputForm() {
  const { innerDims, setInnerDims } = useContext(CrateContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInnerDims((prev) => ({ ...prev, [name]: Number(value) }));
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
      </div>

      {/* Grid container with two columns: one for labels, one for inputs */}
      <div
        className='input-form-grid'
      >
        <label className='input-form-label' htmlFor="width">
          Width:
        </label>
        <input
          className="number-input"
          id="width"
          type="number"
          name="width"
          value={innerDims.width}
          onChange={handleChange}
        />

        <label className='input-form-label' htmlFor="depth">
          Depth:
        </label>
        <input
          className="number-input"
          id="depth"
          type="number"
          name="depth"
          value={innerDims.depth}
          onChange={handleChange}
        />

        <label className='input-form-label' htmlFor="height">
          Height:
        </label>
        <input
          className="number-input"
          id="height"
          type="number"
          name="height"
          value={innerDims.height}
          onChange={handleChange}
        />
      </div>
    </form>
  );
}