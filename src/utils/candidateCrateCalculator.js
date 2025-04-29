import { calculateFaceLayouts } from './faceLayoutsCalculator';
import { calculateBoardSizes } from './boardSizesCalculator';
// Import config and helpers
import { getBoardPrice, thickness, gap } from '../configs/boardConfig';

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
        const boardTypeCounts = {}; // <-- Initialize object for board type counts

        Object.values(faceLayouts).forEach(face => {
            if (face && face.boards) {
                boardCount += face.boards.length;
                face.boards.forEach(board => {
                    totalPrice += getBoardPrice(board.type); // Use helper from config

                    const boardType = board.type;
                    boardTypeCounts[boardType] = (boardTypeCounts[boardType] || 0) + 1;

                });
            }
        });

        // --- Calculate total cube count ---
        const cornerCubeCount = cubeLayouts?.cornerCubes?.length || 0;
        const edgeCubeCount = cubeLayouts?.edgeCubes?.length || 0;
        const totalCubeCount = cornerCubeCount + edgeCubeCount;
        // --------------------------------


        // 2c. Calculate outer dimensions and volume (example)
        // Note: Assumes simple box; adjust if thickness varies or overlaps complexly
        const outerWidth = getTotalSize(bs.x) + thickness * 2;
        const outerHeight = getTotalSize(bs.y) + thickness * 2;
        const outerDepth = getTotalSize(bs.z) + thickness * 2;
        const outerVolume = outerWidth * outerHeight * outerDepth;
        const innerVolume = innerDims.width * innerDims.height * innerDims.depth * 1e-6;
        const internalVolume = (outerWidth - thickness * 2) *
                            (outerHeight - thickness * 2) *
                            (outerDepth - thickness * 2) * 1e-6; // Convert to cubic meters


        // 2d. Assemble the CrateDesign object
        return {
            id: `candidate-${index}`, // Simple ID for now
            label: `Candidate ${index + 1}`, // Generic label
            boardSizes: bs,
            faceLayouts: faceLayouts,
            cubeLayouts: cubeLayouts,
            numBoards: boardCount,
            totalPrice: totalPrice,
            cubeCount: totalCubeCount,
            boardTypeCounts: boardTypeCounts,
            innerVolume: innerVolume,
            internalVolume: internalVolume,
            outerVolume: outerVolume,
            internalDims: { width: outerWidth - thickness * 2, height: outerHeight - thickness * 2, depth: outerDepth - thickness * 2 },
            outerDims: { width: outerWidth, height: outerHeight, depth: outerDepth }
            // Add other metrics as needed
        };
    });


    // 3. Select specific candidates based on criteria
    if (candidateDesigns.length === 0) return []; // Handle case where no designs were made



    // Assign ranks based on the metrics to each candidate
    const candidateDesignsRankedBasedOnPrice = candidateDesigns.slice().sort((a, b) => a.totalPrice - b.totalPrice);
    candidateDesignsRankedBasedOnPrice[0].rankPrice = 1;
    for (let i = 1; i < candidateDesignsRankedBasedOnPrice.length; i++) {
        candidateDesignsRankedBasedOnPrice[i].rankPrice =
            candidateDesignsRankedBasedOnPrice[i].totalPrice === candidateDesignsRankedBasedOnPrice[i - 1].totalPrice ? candidateDesignsRankedBasedOnPrice[i - 1].rankPrice : i + 1;
    }
    const candidateDesignsRankedBasedOnVolume = candidateDesigns.slice().sort((a, b) => a.internalVolume - b.internalVolume);
    candidateDesignsRankedBasedOnVolume[0].rankVolume = 1;
    for (let i = 1; i < candidateDesignsRankedBasedOnVolume.length; i++) {
        candidateDesignsRankedBasedOnVolume[i].rankVolume =
            candidateDesignsRankedBasedOnVolume[i].internalVolume === candidateDesignsRankedBasedOnVolume[i - 1].internalVolume ? candidateDesignsRankedBasedOnVolume[i - 1].rankVolume : i + 1;
    }
    const candidateDesignsRankedBasedOnBoards = candidateDesigns.slice().sort((a, b) => a.numBoards - b.numBoards);
    candidateDesignsRankedBasedOnBoards[0].rankBoards = 1;
    for (let i = 1; i < candidateDesignsRankedBasedOnBoards.length; i++) {
        candidateDesignsRankedBasedOnBoards[i].rankBoards =
            candidateDesignsRankedBasedOnBoards[i].numBoards === candidateDesignsRankedBasedOnBoards[i - 1].numBoards ? candidateDesignsRankedBasedOnBoards[i - 1].rankBoards : i + 1;
    }

    // Assign ranks to each candidate based on the metrics
    candidateDesigns.forEach(candidate => {
        candidate.rankPrice = candidateDesignsRankedBasedOnPrice.find(c => c.id === candidate.id).rankPrice;
        candidate.rankVolume = candidateDesignsRankedBasedOnVolume.find(c => c.id === candidate.id).rankVolume;
        candidate.rankBoards = candidateDesignsRankedBasedOnBoards.find(c => c.id === candidate.id).rankBoards;
    });

    // calculate the total ranking for each candidate
    candidateDesigns.forEach(candidate => {
        candidate.totalRank = candidate.rankPrice + candidate.rankVolume + candidate.rankBoards;
    });

    const candidateDesignsRankedBasedOnTotalRank = candidateDesigns.slice().sort((a, b) => a.totalRank - b.totalRank);
    candidateDesignsRankedBasedOnTotalRank[0].rankTotal = 1;
    for (let i = 1; i < candidateDesignsRankedBasedOnTotalRank.length; i++) {
        candidateDesignsRankedBasedOnTotalRank[i].rankTotal =
            candidateDesignsRankedBasedOnTotalRank[i].totalRank === candidateDesignsRankedBasedOnTotalRank[i - 1].totalRank ? candidateDesignsRankedBasedOnTotalRank[i - 1].rankTotal : i + 1;
    }

    // Assign ranks to each candidate based on the total rank
    candidateDesigns.forEach(candidate => {
        candidate.rankTotalrank = candidateDesignsRankedBasedOnTotalRank.find(c => c.id === candidate.id).rankTotal;
    });

    const selectedCandidateDesigns = {
        "bestTotalRank": null,
        "bestPrice": null,
        "bestVolume": null,
        "bestBoards": null
    }

    // until the selectedCandidateDesigns is not all assigned
    while (selectedCandidateDesigns.bestTotalRank === null || selectedCandidateDesigns.bestPrice === null || selectedCandidateDesigns.bestVolume === null || selectedCandidateDesigns.bestBoards === null) {
        // find the candidate with the most number of minimal hornors it hit with in the available attributes
        let maxHonors = 0;
        let maxCandidate = null;

        candidateDesigns.forEach(candidate => {
            let honors = 0;
            if (candidate.rankTotal === 1 && selectedCandidateDesigns.bestTotalRank === null) {
                honors++;
            }
            if (candidate.rankPrice === 1 && selectedCandidateDesigns.bestPrice === null) {
                honors++;
            }
            if (candidate.rankVolume === 1 && selectedCandidateDesigns.bestVolume === null) {
                honors++;
            }
            if (candidate.rankBoards === 1 && selectedCandidateDesigns.bestBoards === null) {
                honors++;
            }

            if (honors > maxHonors) {
                maxHonors = honors;
                maxCandidate = candidate;
            }
        });


        // Assign the candidate to the selectedCandidateDesigns object
        if (maxCandidate) {
            if (maxCandidate.rankTotal === 1 && selectedCandidateDesigns.bestTotalRank === null) {
                selectedCandidateDesigns.bestTotalRank = maxCandidate;
            }
            if (maxCandidate.rankPrice === 1 && selectedCandidateDesigns.bestPrice === null) {
                selectedCandidateDesigns.bestPrice = maxCandidate;
            }
            if (maxCandidate.rankVolume === 1 && selectedCandidateDesigns.bestVolume === null) {
                selectedCandidateDesigns.bestVolume = maxCandidate;
            }
            if (maxCandidate.rankBoards === 1 && selectedCandidateDesigns.bestBoards === null) {
                selectedCandidateDesigns.bestBoards = maxCandidate;
            }
        }

    }
    
    // recommended = selectedCandidateDesigns.minTotalRank;
    // minVolume = selectedCandidateDesigns.minTotalVolume;
    // minPrice = selectedCandidateDesigns.minTotalPrice;
    // minBoards = selectedCandidateDesigns.minTotalBoards;

    // 4. Create the final list/object of selected candidates
    // Using an object allows easy lookup by role, but ensure unique candidates
    const selectedMap = new Map(); // Use a Map to handle duplicates easily

    // Add candidates with specific labels, ensuring uniqueness by ID
    // selectedMap.set(minVolume.id, { ...minVolume, label: 'Minimum Dead Space' });
    // selectedMap.set(minPrice.id, { ...minPrice, label: 'Minimum Price' });
    // selectedMap.set(minBoards.id, { ...minBoards, label: 'Minimum Boards' });
    // selectedMap.set(recommended.id, { ...recommended, label: 'Balanced ' });

    // for each unique selectedCandidateDesigns, add it to the selectedMap

    // console.log("selectedCandidateDesigns", selectedCandidateDesigns);

    Object.values(selectedCandidateDesigns).forEach(candidate => {
        if (!selectedMap.has(candidate.id)) {
            let label = '';
            let labels = [];

            // for each honor, add the label

            if (candidate.rankTotal === 1 && candidate.rankPrice !== 1 && candidate.rankVolume !== 1 && candidate.rankBoards !== 1) {
                labels.push('Balanced');
            }
            else {
                // labels.push('Minimum')
            }

            if (candidate.rankPrice === 1) {
                labels.push('Price');
            }
            if (candidate.rankVolume === 1) {
                labels.push('Volume');
            }
            if (candidate.rankBoards === 1) {
                labels.push('Boards');
            }

            if (labels.length > 1) {
                // join with a new line in html
                label = labels.join(' ');
            } else {
                label = labels[0];
            }



            selectedMap.set(candidate.id, { ...candidate, labels: labels });
        }
    });



    // Return the unique selected candidates as an array
    return Array.from(selectedMap.values());

}