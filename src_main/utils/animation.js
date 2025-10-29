/**
 * Calculate the progress for a specific phase based on phase proportions
 * @param {Object} phaseProportions - Object with phase names and their proportion values (0 to 1)
 * @param {number} totalProgress - Total progress (0 to 1)
 * @param {string} key - Phase key to get progress for
 * @returns {number} Progress within the specified phase (0 to 1)
 */
function getPhaseProgress(phaseProportions, totalProgress, key) {
    const phases = Object.keys(phaseProportions);
    let start = 0;
    
    for (const phase of phases) {
        const proportion = phaseProportions[phase];
        
        if (phase === key) {
            return proportion > 0 ? 
                Math.min(Math.max((totalProgress - start) / proportion, 0), 1) : 0;
        }
        
        start += proportion;
    }
    
    return 0;
}

export { getPhaseProgress };
