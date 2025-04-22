import React, { createContext, useState, useEffect } from 'react';
import { calculateCandidateCrates } from '../utils/candidateCrateCalculator';

export const CrateContext = createContext(null);

export function CrateProvider({ children }) {
  // Rename dims to innerDims to indicate these dimensions belong to the target object
  const [innerDims, setInnerDims] = useState({ width: 40, height: 40, depth: 40 });
  const [candidateCrates, setCandidateCrates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [visualizeBoardTypes, setVisualizeBoardTypes] = useState(false); // <-- New state

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

  return (
    <CrateContext.Provider
      value={{
        innerDims, // the target object dimensions (the "cargo" inside the crate)
        setInnerDims,
        candidateCrates,
        selectedCandidateId,
        setSelectedCandidateId,
        selectedCandidate,
        visualizeBoardTypes, // <-- Expose state
        toggleVisualizeBoardTypes // <-- Expose toggle function
      }}
    >
      {children}
    </CrateContext.Provider>
  );
}