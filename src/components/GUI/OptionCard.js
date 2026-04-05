import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';
import { convertToDisplay } from '../../utils/utils';

export default function OptionCard({ option, selected, onSelect }) {
  const { useInch } = useContext(CrateContext);

  return (
    <div
      className="option-card"
      onClick={onSelect}
      data-selected={selected}
    >
      <div style={{ marginBottom: '8px' }}>
        {option.labels.map((label, index) => (
          <div
            key={index}
            className={`option-label-${label}`}
            style={{
              display: 'inline-flex',
              margin: '0 4px',
              marginLeft: '0',
              padding: '2px 4px',
              backgroundColor: 'rgb(255, 176, 4, 0.6)'
            }}
          >
            {label === 'Balanced' ? label : 'Min '}
            {label === 'Balanced' ? '' : label}
          </div>
        ))}
        </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4px 12px', lineHeight: '1.6' }}>
        {/* <div className='option-label'>Dead Space (m³):</div> */}
        {/* <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {(option.internalVolume - option.innerVolume).toFixed(2)}
        </div> */}
        <div className='option-label'>Total Price:</div>
        <div style={{ textAlign: 'right', color: '#666' }}>${option.totalPrice}</div>
        {/* <div className='option-label'>Inner Dims (m):</div> */}
        {/* <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {option.internalDims.width.toFixed(1)} x {option.internalDims.height.toFixed(1)} x{' '}
          {option.internalDims.depth.toFixed(1)}
        </div> */}
        <div className='option-label'>Board Count:</div>
        <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {option.numBoards}</div>
        <div className='option-label'>Outer Dims:</div>
        <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {convertToDisplay(option.outerDims.width, useInch)} x {convertToDisplay(option.outerDims.height, useInch)} x{' '}
          {convertToDisplay(option.outerDims.depth, useInch)}
        </div>
      </div>
    </div>
  );
}