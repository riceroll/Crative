import React, { createContext, useState, useEffect } from 'react';
import { calculateCandidateCrates } from '../utils/candidateCrateCalculator';
import { convertToInches, convertToDisplay } from '../utils/utils';

export const CrateContext = createContext(null);

export function CrateProvider({ children }) {
  // Rename dims to innerDims to indicate these dimensions belong to the target object
  const [innerDims, setInnerDims] = useState({ width: 40, height: 40, depth: 40 });
  const [displayDims, setDisplayDims] = useState({ width: '40', height: '40', depth: '40' });

  const [candidateCrates, setCandidateCrates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [visualizeBoardTypes, setVisualizeBoardTypes] = useState(false);
  const [useInch, setUseInch] = useState(true);
  const [assemblyProgress, setAssemblyProgress] = useState(1.0);

  // Recompute candidate crates whenever innerDims change
  useEffect(() => {
    const candidates = calculateCandidateCrates(innerDims);
    setCandidateCrates(candidates);
    // Select the first candidate by default if available
    setSelectedCandidateId( (selectedCandidateId === null) || !candidates.some(c => c.id === selectedCandidateId) ? candidates[0]?.id : selectedCandidateId );
  }, [innerDims, visualizeBoardTypes]);

  const selectedCandidate = candidateCrates.find(c => c.id === selectedCandidateId) || null;

  // Function to toggle the visualization state
  const toggleVisualizeBoardTypes = () => {
    setVisualizeBoardTypes(prev => !prev);
  };

  const toggleUseInch = () => {
    setUseInch(prev => !prev);

    setDisplayDims({
      width: convertToDisplay(innerDims.width, !useInch),
      height: convertToDisplay(innerDims.height, !useInch),
      depth: convertToDisplay(innerDims.depth, !useInch)
    });

  };

  return (
    <CrateContext.Provider
      value={{
        innerDims, // the target object dimensions (the "cargo" inside the crate)
        setInnerDims,
        displayDims, // the dimensions displayed in the UI
        setDisplayDims,
        candidateCrates,
        selectedCandidateId,
        setSelectedCandidateId,
        selectedCandidate,
        visualizeBoardTypes, // <-- Expose state
        toggleVisualizeBoardTypes, // <-- Expose toggle function
        useInch,
        toggleUseInch, 
        assemblyProgress,
        setAssemblyProgress
      }}
    >
      {children}
    </CrateContext.Provider>
  );
}