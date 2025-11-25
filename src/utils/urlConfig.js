import defaultSettings from '../configs/defaultSettings.json';

// Centralized URL parameter configuration
export function getUrlConfig() {
  const params = new URLSearchParams(window.location.search);
  
  const getBoolParam = (param, defaultValue) => {
    const value = params.get(param);
    if (value === null) return defaultValue;
    return value === 'true' || value === '1';
  };

  const getStringParam = (param, defaultValue) => {
    return params.get(param) || defaultValue;
  };

  const getNumberParam = (param, defaultValue) => {
    const value = params.get(param);
    return value ? Number(value) : defaultValue;
  };

  return {
    // UI visibility
    hideUI: getBoolParam('hideUI', defaultSettings.ui.hideUI),
    hideStepHUD: getBoolParam('hideStepHUD', defaultSettings.ui.hideStepHUD),
    hideAssemble: getBoolParam('hideAssemble', defaultSettings.ui.hideAssemble),
    
    // Debug options
    debugMode: getBoolParam('debug', defaultSettings.debug.enabled),
    
    // Post-processing effects
    useN8AO: getBoolParam('useN8AO', defaultSettings.rendering.useN8AO),
    useToneMapping: getBoolParam('useToneMapping', defaultSettings.rendering.useToneMapping),

    // Camera
    cameraDistanceFactor: getNumberParam('cameraDistance', defaultSettings.camera.distanceFactor),

    // Rendering
    bgColor: getStringParam('bgColor', defaultSettings.rendering.bgColor),

    // Dimensions
    width: getNumberParam('width', defaultSettings.dimensions.width),
    height: getNumberParam('height', defaultSettings.dimensions.height),
    depth: getNumberParam('depth', defaultSettings.dimensions.depth),
  };
}
