import React, { useContext, useRef, useEffect, useState } from 'react';
import { useReactToPrint } from 'react-to-print'; // Import useReactToPrint
import { CrateContext } from '../../store/CrateContext';
import { boardTypes, cubePrice, getBoardPrice, screwPrice, stickPrice, piecePrice } from '../../configs/boardConfig';
import '../../styles/ui.css';
import { LuPrinter } from 'react-icons/lu';
import { colors, defaultColor, cubeColor, screwColor, pieceColor, stickColor } from '../../configs/globalConfigs';


// Helper to format board type to image name (e.g., "board_40x40" -> "b40x40")
const getBoardImageName = (boardType) => {
  if (typeof boardType === 'string' && boardType.startsWith('board_')) {
    return 'b' + boardType.substring(6);
  }
  return boardType; // Fallback or handle other cases if needed
};

export default function ComponentList() {
  const { selectedCandidate, visualizeBoardTypes } = useContext(CrateContext);
  const componentRef = useRef();
  const triggerPrint = useReactToPrint({ contentRef: componentRef, documentTitle: `Component List – ${selectedCandidate?.id}` });
  const [hoveredImg, setHoveredImg] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // build items
  const components = [];
  if (selectedCandidate?.boardTypeCounts) {
    Object.entries(selectedCandidate.boardTypeCounts).forEach(([type, count]) => {
      const unitPrice = getBoardPrice(type);
      const colorIndex = Object.keys(boardTypes).indexOf(type);
      const color = visualizeBoardTypes ? colors[colorIndex] : defaultColor; // Use color from config or default
      const formattedName = type.replace('board_', '').replace('x', '\'\'x') + '\'\'';
      components.push({ type, name: formattedName, imageName: getBoardImageName(type), count, unitPrice, totalCost: unitPrice * count, color  });
    });
  }
  if (selectedCandidate?.cubeCount > 0) {
    const unitPrice = cubePrice;
    const color = cubeColor;
    components.push({ type: 'cube', name: 'Cube Connector', imageName: 'cube', count: selectedCandidate.cubeCount, unitPrice, totalCost: unitPrice * selectedCandidate.cubeCount, color });
  }
  if (selectedCandidate?.screwCount > 0) {
    const unitPrice = screwPrice;
    components.push({ type: 'screw', name: 'M8 Bolt', imageName: 'screw', count: selectedCandidate.screwCount, unitPrice, totalCost: unitPrice * selectedCandidate.screwCount, color: screwColor });
  }
  if (selectedCandidate?.barCount > 0) {
    const unitPrice = stickPrice;
    components.push({ type: 'bar', name: 'Bar', imageName: 'bar', count: selectedCandidate.barCount, unitPrice, totalCost: unitPrice * selectedCandidate.barCount, color: stickColor });
  }
  if (selectedCandidate?.pieceCount > 0) {
    const unitPrice = piecePrice;
    components.push({ type: 'piece', name: '4-panel Space Connector', imageName: 'piece', count: selectedCandidate.pieceCount, unitPrice, totalCost: unitPrice * selectedCandidate.pieceCount, color: pieceColor });
  }

  // grand total
  const totalAllCost = components.reduce((sum, c) => sum + c.totalCost, 0);

  return (
    <div className="card">
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <div className="card-title">Parts List</div>
        {components.length>0 && (
          <div onClick={triggerPrint} style={{background:'none',border:'none',cursor:'pointer'}}>
            <LuPrinter size="14px" color="#555"/>
          </div>
        )}
      </div>

      <div ref={componentRef} className="printable-component-list">
        {components.length===0
          ? <p style={{padding:'10px',color:'#888'}}>
              {selectedCandidate ? 'No components data.' : 'Select a crate design.'}
            </p>
          : <table id="component-list-table" className="component-table" style={{width:'100%'}}>
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Quantity</th>
                  <th className="unit-price-col">Unit Price</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {components.map((item, index)=>(
                  <tr key={item.type} style={{borderTop: index === 0 ? '1px solid #ccc' : 'none'}}>
                    <td className="component-table-cell component-table-image-cell">
                      <span
                        className="component-color-bar"
                        style={{
                          background: item.type === 'cube' ? cubeColor : item.color,
                          verticalAlign: 'middle'
                        }}></span>

                      <img
                        src={`./images/${item.imageName}.png`}
                        alt={item.name}
                        className="component-image"
                        onMouseEnter={e => {
                          setHoveredImg(`./images/${item.imageName}.png`);
                          setHoverPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={e => setHoverPos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredImg(null)}
                      />
                      <span>
                        {item.name}
                      </span>
                    </td>
                    <td className="component-table-cell component-table-count">{item.count}</td>
                    <td className="component-table-cell unit-price-col">$ {Math.round(item.unitPrice * 100) / 100}</td>
                    <td className="component-table-cell total-cost-col">$ {Math.round(item.totalCost * 100) / 100}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="component-table-cell" style={{fontWeight:'bold'}}>Grand Total:</td>

                  <td className="component-table-cell" style={{fontWeight:'bold'}}></td>
                  <td className="component-table-cell" style={{fontWeight:'bold'}}>$ {Math.round(totalAllCost * 100) / 100}</td>
                </tr>
              </tbody>
            </table>
        }
      </div>
      {hoveredImg && (
        <div
          className="hover-preview"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img src={hoveredImg} alt="Preview" />
        </div>
      )}
    </div>
  );
}