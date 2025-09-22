import React from 'react';

export default function OptionCard({ option, selected, onSelect }) {
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
              padding: '2px 4px'
            }}
          >
            {label === 'Balanced' ? label : 'Min '}
            {label === 'Balanced' ? '' : label}
          </div>
        ))}
        </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', lineHeight: '1.6' }}>
        <div className='option-label'>Dead Space (m³):</div>
        <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {(option.internalVolume - option.innerVolume).toFixed(2)}
        </div>
        <div className='option-label'>Total Price ($):</div>
        <div style={{ textAlign: 'right', color: '#666' }}>{option.totalPrice.toFixed(2)}</div>
        <div className='option-label'>Inner Dims (m):</div>
        <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {option.internalDims.width.toFixed(1)} x {option.internalDims.height.toFixed(1)} x{' '}
          {option.internalDims.depth.toFixed(1)}
        </div>
        <div className='option-label'>Board Count:</div>
        <div className='option-value' style={{ textAlign: 'right', color: '#666' }}>
          {option.numBoards}</div>
      </div>
    </div>
  );
}