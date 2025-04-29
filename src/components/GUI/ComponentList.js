import React, { useContext, useRef, useEffect } from 'react'; // Import useRef
import { useReactToPrint } from 'react-to-print'; // Import useReactToPrint
import { CrateContext } from '../../store/CrateContext';
import { boardPrices, cubePrice, getBoardPrice } from '../../configs/boardConfig';
import '../../styles/ui.css';
import { LuPrinter } from 'react-icons/lu';


// Helper to format board type to image name (e.g., "board_40x40" -> "b40x40")
const getBoardImageName = (boardType) => {
  if (typeof boardType === 'string' && boardType.startsWith('board_')) {
    return 'b' + boardType.substring(6);
  }
  return boardType; // Fallback or handle other cases if needed
};



export default function ComponentList() {
  const { selectedCandidate } = useContext(CrateContext);
  const componentRef = useRef();
  const triggerPrint = useReactToPrint({ contentRef: componentRef, documentTitle: `Component List – ${selectedCandidate?.id}` });

  // build items
  const components = [];
  if (selectedCandidate?.boardTypeCounts) {
    Object.entries(selectedCandidate.boardTypeCounts).forEach(([type, count]) => {
      const unitPrice = getBoardPrice(type);
      components.push({ type, name: type.replace('board_', 'Board '), imageName: getBoardImageName(type), count, unitPrice, totalCost: unitPrice * count });
    });
  }
  if (selectedCandidate?.cubeCount > 0) {
    const unitPrice = cubePrice;
    components.push({ type: 'cube', name: 'Cube', imageName: 'cube', count: selectedCandidate.cubeCount, unitPrice, totalCost: unitPrice * selectedCandidate.cubeCount });
  }

  // grand total
  const totalAllCost = components.reduce((sum, c) => sum + c.totalCost, 0);

  return (
    <div className="card">
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <div className="card-title">Part List</div>
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
                  <th className="unit-price-col">Unit Price ($)</th>
                  <th>Subtotal ($)</th>
                </tr>
              </thead>
              <tbody>
                {components.map((item, index)=>(
                  <tr key={item.type} style={{borderTop: index === 0 ? '1px solid #ccc' : 'none'}}>
                    <td className="component-table-cell component-table-image-cell">
                      <img src={`./images/${item.imageName}.png`} alt={item.name} className="component-image"/>
                      <span>{item.name}</span>
                    </td>
                    <td className="component-table-cell">{item.count}</td>
                    <td className="component-table-cell unit-price-col">{item.unitPrice.toFixed(2)}</td>
                    <td className="component-table-cell">{item.totalCost.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="component-table-cell" style={{fontWeight:'bold'}}>Grand Total:</td>

                  <td className="component-table-cell" style={{fontWeight:'bold'}}></td>
                  <td className="component-table-cell" style={{fontWeight:'bold'}}>{totalAllCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}