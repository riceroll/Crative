import React, { createContext, useState, useEffect, useMemo } from 'react';
import { calculateCandidateCrates } from '../utils/candidateCrateCalculator';
import { convertToInches, convertToDisplay } from '../utils/utils';


export const CrateContext = createContext(null);

export function CrateProvider({ children }) {
  // Initialize dimensions from URL parameters or use defaults
  const getInitialDimensions = () => {
    const params = new URLSearchParams(window.location.search);
    const width = params.get('width');
    const height = params.get('height');
    const depth = params.get('depth');
    
    return {
      width: width ? Number(width) : 40,
      height: height ? Number(height) : 40,
      depth: depth ? Number(depth) : 40
    };
  };

  // Rename dims to innerDims to indicate these dimensions belong to the target object
  const [innerDims, setInnerDims] = useState(getInitialDimensions());
  const [displayDims, setDisplayDims] = useState(() => {
    const initial = getInitialDimensions();
    return {
      width: String(initial.width),
      height: String(initial.height),
      depth: String(initial.depth)
    };
  });

  const [candidateCrates, setCandidateCrates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [visualizeBoardTypes, setVisualizeBoardTypes] = useState(false);
  const [autoCameraEnabled, setAutoCameraEnabled] = useState(false); // Off by default
  const [useInch, setUseInch] = useState(true);
  const [assemblyProgress, setAssemblyProgress] = useState(1.0);
  const [focusPosition, setFocusPosition] = useState([0, 0, 0]);
  const [boardTypesToExclude, setBoardTypesToExclude] = useState([
    'board_24x5',
    'board_24x24',
    'board_40x24',
    'board_5x5'
  ]);

  // Collapsible cards state - detect mobile on mount
  const [collapsedCards, setCollapsedCards] = useState(() => {
    const isMobile = window.innerWidth <= 768;
    return {
      inputForm: false,
      optionsList: isMobile, // Collapsed by default on mobile
      visualizationOptions: false,
      componentList: isMobile // Collapsed by default on mobile
    };
  });

  const toggleCardCollapse = (cardName) => {
    setCollapsedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  // Recompute candidate crates whenever innerDims or boardTypesToExclude change
  useEffect(() => {
    // Calculate new candidate crates
    const candidates = calculateCandidateCrates(innerDims, boardTypesToExclude);

    // Update the candidate crates state
    setCandidateCrates(candidates);

    // Select the first candidate by default if available
    setSelectedCandidateId( (selectedCandidateId === null) || !candidates.some(c => c.id === selectedCandidateId) ? candidates[0]?.id : selectedCandidateId );

    // Turn off auto camera when dimensions change
    setAutoCameraEnabled(false);

  }, [innerDims, boardTypesToExclude, visualizeBoardTypes]);

  // Turn off auto camera when crate design changes
  useEffect(() => {
    setAutoCameraEnabled(false);
  }, [selectedCandidateId]);

  // useEffect(() => {
  //   setAssemblyProgress(1.0);
  // }, [selectedCandidateId]);

  const selectedCandidate = useMemo(
    () => candidateCrates.find(c => c.id === selectedCandidateId) || null,

    [candidateCrates, selectedCandidateId]
  );

  useEffect(() => {
    // For debugging: expose selectedCandidate globally
    window.candidate = selectedCandidate;
  }, [selectedCandidate]);

  // Function to toggle the visualization state
  const toggleVisualizeBoardTypes = () => {
    setVisualizeBoardTypes(prev => !prev);
  };

  // Function to toggle auto camera
  const toggleAutoCameraEnabled = () => {
    setAutoCameraEnabled(prev => !prev);
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
        autoCameraEnabled, // <-- Expose auto camera state
        toggleAutoCameraEnabled, // <-- Expose auto camera toggle function
        useInch,
        toggleUseInch, 
        assemblyProgress,
        setAssemblyProgress,
        focusPosition,
        setFocusPosition,
        boardTypesToExclude, // <-- Expose board exclusion state
        setBoardTypesToExclude, // <-- Expose board exclusion setter
        collapsedCards, // <-- Expose collapsed cards state
        toggleCardCollapse // <-- Expose toggle function
      }}
    >
      {children}
    </CrateContext.Provider>
  );
}
