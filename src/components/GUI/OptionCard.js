import React, { useContext } from 'react';
import { CrateContext } from '../../store/CrateContext';
import { convertToDisplay } from '../../utils/utils';

export default function OptionCard({ option, selected, onSelect }) {
  const { useInch } = useContext(CrateContext);

  return (
    <button
      type="button"
      className="option-card"
      onClick={onSelect}
      data-selected={selected}
      aria-pressed={selected}
    >
      <div className="design-badges">
        {option.labels.map((label, index) => (
          <div
            key={index}
            className={`design-badge option-label-${label}`}
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
        <div style={{ textAlign: 'right', color: '#666' }}>${option.totalPrice.toFixed(2)}</div>
        
        {option.totalWeight > 0 && (
          <>
            <div className='option-label'>Total Weight:</div>
            <div style={{ textAlign: 'right', color: '#666' }}>{option.totalWeight.toFixed(1)} lbs</div>
          </>
        )}

        <div className='option-label'>Board Count:</div>
        <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {option.numBoards}</div>
        <div className='option-label'>Interior Dims:</div>
        <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {convertToDisplay(option.internalDims.width, useInch)} x {convertToDisplay(option.internalDims.height, useInch)} x{' '}
          {convertToDisplay(option.internalDims.depth, useInch)}
        </div>
        <div className='option-label'>Outer Dims:</div>
        <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {convertToDisplay(option.outerDims.width, useInch)} x {convertToDisplay(option.outerDims.height, useInch)} x{' '}
          {convertToDisplay(option.outerDims.depth, useInch)}
        </div>
      </div>
    </button>
  );
}