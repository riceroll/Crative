// Centralized URL parameter configuration
export function getUrlConfig() {
  const params = new URLSearchParams(window.location.search);
  
  const getBoolParam = (param, defaultValue = false) => {
    const value = params.get(param);
    if (value === null) return defaultValue;
    return value === 'true' || value === '1';
  };

  return {
    // UI visibility
    hideUI: getBoolParam('hideUI'),
    hideStepHUD: getBoolParam('hideStepHUD'),
    hideAssemble: getBoolParam('hideAssemble'),
    
    // Debug options
    debugMode: getBoolParam('debug'),
    
    // Post-processing effects
    useN8AO: getBoolParam('useN8AO', false),
    useToneMapping: getBoolParam('useToneMapping', false),
  };
}
