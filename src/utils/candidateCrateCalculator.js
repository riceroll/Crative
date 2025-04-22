import { calculateFaceLayouts } from './faceLayoutsCalculator';
import { calculateBoardSizes } from './boardSizesCalculator';
// Import config and helpers
import { getBoardPrice, defaultThickness, gap } from '../configs/boardConfig';

// Helper to calculate total size (can likely be removed if not needed outside boardSizesCalculator)
function getTotalSize(boards) {
    if (!boards || boards.length === 0) return 0;
    return boards.reduce((sum, b) => sum + b, 0) + (boards.length > 1 ? gap * (boards.length - 1) : 0);
}

// Main calculation function
export function calculateCandidateCrates(innerDims) {
    // 1. Get all potential board size combinations
    const boardSizesCandidates = calculateBoardSizes(innerDims);

    if (!boardSizesCandidates || boardSizesCandidates.length === 0) {
        console.warn("No board size candidates generated for:", innerDims);
        return []; // Return empty if no candidates
    }

    // 2. Process each boardSize candidate into a full CrateDesign object
    const candidateDesigns = boardSizesCandidates.map((bs, index) => {
        // 2a. Calculate face layouts for this specific boardSize candidate
        const { faceLayouts, cubeLayouts } = calculateFaceLayouts(bs);

        // 2b. Calculate metrics based on faceLayouts and boardSizes
        let boardCount = 0;
        let totalPrice = 0;
        Object.values(faceLayouts).forEach(face => {
            if (face && face.boards) {
                boardCount += face.boards.length;
                face.boards.forEach(board => {
                    totalPrice += getBoardPrice(board.type); // Use helper from config
                });
            }
        });

        // 2c. Calculate outer dimensions and volume (example)
        // Note: Assumes simple box; adjust if thickness varies or overlaps complexly
        const outerWidth = getTotalSize(bs.x) + defaultThickness * 2;
        const outerHeight = getTotalSize(bs.y) + defaultThickness * 2;
        const outerDepth = getTotalSize(bs.z) + defaultThickness * 2;
        const outerVolume = outerWidth * outerHeight * outerDepth;
        const innerVolume = innerDims.width * innerDims.height * innerDims.depth * 1e-6;
        const internalVolume = (outerWidth - defaultThickness * 2) *
                            (outerHeight - defaultThickness * 2) *
                            (outerDepth - defaultThickness * 2) * 1e-6; // Convert to cubic meters


        // 2d. Assemble the CrateDesign object
        return {
            id: `candidate-${index}`, // Simple ID for now
            label: `Candidate ${index + 1}`, // Generic label
            boardSizes: bs,
            faceLayouts: faceLayouts,
            cubeLayouts: cubeLayouts,
            numBoards: boardCount,
            totalPrice: totalPrice,
            innerVolume: innerVolume,
            internalVolume: internalVolume,
            outerVolume: outerVolume,
            internalDims: { width: outerWidth - defaultThickness * 2, height: outerHeight - defaultThickness * 2, depth: outerDepth - defaultThickness * 2 },
            outerDims: { width: outerWidth, height: outerHeight, depth: outerDepth }
            // Add other metrics as needed
        };
    });

    // 3. Select specific candidates based on criteria
    if (candidateDesigns.length === 0) return []; // Handle case where no designs were made


    let recommended = 0; // balanced
    let minVolume = 0;
    let minPrice = 0;
    let minBoards = 0;

    // update recommended
    // Helper to assign ranking for a given metric; lower values get lower (better) rank,
    // and tied values receive the same rank.
    function assignRank(metricKey, rankProp) {
        const sorted = candidateDesigns.slice().sort((a, b) => a[metricKey] - b[metricKey]);
        sorted[0][rankProp] = 1;
        for (let i = 1; i < sorted.length; i++) {
            sorted[i][rankProp] =
                sorted[i][metricKey] === sorted[i - 1][metricKey] ? sorted[i - 1][rankProp] : i + 1;
        }
    }

    // Rank candidates on each metric.
    // Note: totalPrice, outerVolume, and numBoards are the metrics considered.
    assignRank("totalPrice", "rankPrice");
    assignRank("outerVolume", "rankVolume");
    assignRank("numBoards", "rankBoards");

    // Sum up the rankings for every candidate.
    candidateDesigns.forEach(candidate => {
        candidate.totalRank = candidate.rankPrice + candidate.rankVolume + candidate.rankBoards;
    });

    // Select the candidate with the minimum total ranking sum.
    let bestCandidate = candidateDesigns[0];
    for (let i = 1; i < candidateDesigns.length; i++) {
        if (candidateDesigns[i].totalRank < bestCandidate.totalRank) {
            bestCandidate = candidateDesigns[i];
        }
    }
    recommended = bestCandidate;

    // Select the candidate with the minimum outer volume.
    minVolume = candidateDesigns.reduce((prev, curr) => {
        return prev.outerVolume < curr.outerVolume ? prev : curr;
    });
    // Select the candidate with the minimum total price.
    minPrice = candidateDesigns.reduce((prev, curr) => {
        return prev.totalPrice < curr.totalPrice ? prev : curr;
    });
    // Select the candidate with the minimum number of boards.
    minBoards = candidateDesigns.reduce((prev, curr) => {
        return prev.numBoards < curr.numBoards ? prev : curr;
    });






    // 4. Create the final list/object of selected candidates
    // Using an object allows easy lookup by role, but ensure unique candidates
    const selectedMap = new Map(); // Use a Map to handle duplicates easily

    // Add candidates with specific labels, ensuring uniqueness by ID
    selectedMap.set(recommended.id, { ...recommended, label: 'Recommended ' });
    selectedMap.set(minVolume.id, { ...minVolume, label: 'Minimum Dead Space' });
    selectedMap.set(minPrice.id, { ...minPrice, label: 'Minimum Price' });
    selectedMap.set(minBoards.id, { ...minBoards, label: 'Minimum Boards' });

    // Return the unique selected candidates as an array
    return Array.from(selectedMap.values());
}