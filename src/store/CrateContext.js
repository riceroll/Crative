import React, { createContext, useState, useEffect, useMemo } from 'react';
import { calculateCandidateCrates } from '../utils/candidateCrateCalculator';
import { convertToInches, convertToDisplay } from '../utils/utils';
import { getUrlConfig } from '../utils/urlConfig';


export const CrateContext = createContext(null);

export function CrateProvider({ children }) {
  // Initialize dimensions from URL parameters or use defaults
  const getInitialDimensions = () => {
    const config = getUrlConfig();
    
    return {
      width: config.width,
      height: config.height,
      depth: config.depth
    };
  };

  // Get background color from URL parameters
  const getInitialBgColor = () => {
    const config = getUrlConfig();
    return config.bgColor;
  };

  // Get camera distance factor from URL parameters
  const getInitialCameraDistanceFactor = () => {
    const config = getUrlConfig();
    return config.cameraDistanceFactor;
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
  const [advancedPlayerMode, setAdvancedPlayerMode] = useState(false); // Simple player by default
  const [useInch, setUseInch] = useState(() => {
    const config = getUrlConfig();
    return config.unit !== 'cm';
  });
  const [assemblyProgress, setAssemblyProgress] = useState(1.0);
  const [focusPosition, setFocusPosition] = useState([0, 0, 0]);
  const [bgColor, setBgColor] = useState(getInitialBgColor());
  const [cameraDistanceFactor, setCameraDistanceFactor] = useState(getInitialCameraDistanceFactor());
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

  const [hasInitializedDesign, setHasInitializedDesign] = useState(false);

  // Recompute candidate crates whenever innerDims or boardTypesToExclude change
  useEffect(() => {
    // Calculate new candidate crates
    const candidates = calculateCandidateCrates(innerDims, boardTypesToExclude);

    // Update the candidate crates state
    setCandidateCrates(candidates);

    // Select the candidate with minimum volume (rankVolume === 1) as default
    // If no selection exists or current selection is not in new candidates
    if ((selectedCandidateId === null) || !candidates.some(c => c.id === selectedCandidateId)) {
      let defaultId = null;
      
      if (!hasInitializedDesign) {
        const config = getUrlConfig();
        if (config.designIndex !== undefined && config.designIndex >= 0 && config.designIndex < candidates.length) {
          defaultId = candidates[config.designIndex].id;
        } else {
          const minVolumeCandidate = candidates.find(c => c.rankVolume === 1);
          defaultId = minVolumeCandidate?.id || candidates[0]?.id;
        }
        setHasInitializedDesign(true);
      } else {
        const minVolumeCandidate = candidates.find(c => c.rankVolume === 1);
        defaultId = minVolumeCandidate?.id || candidates[0]?.id;
      }
      
      setSelectedCandidateId(defaultId);
    }

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

  // Function to toggle advanced player mode
  const toggleAdvancedPlayerMode = () => {
    setAdvancedPlayerMode(prev => !prev);
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
        advancedPlayerMode, // <-- Expose advanced player mode state
        toggleAdvancedPlayerMode, // <-- Expose advanced player mode toggle
        useInch,
        toggleUseInch, 
        assemblyProgress,
        setAssemblyProgress,
        focusPosition,
        setFocusPosition,
        bgColor, // <-- Expose background color state
        setBgColor, // <-- Expose background color setter
        cameraDistanceFactor, // <-- Expose camera distance factor
        setCameraDistanceFactor, // <-- Expose camera distance factor setter
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
