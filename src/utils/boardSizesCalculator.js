// Define the board sizes and gap (you can later replace these with values from window.global.boardSizes if preferred)
const sizeLarge    = 40;
const sizeMedium   = 24;
const sizeSmall    = 5;
const gap          = 1.5;
const thickness   = 1.5;

/**
 * Calculate the total size of a board array including gaps.
 * For an array of boards, total = sum(board lengths) + gap * (number_of_boards - 1)
 */
function getTotalSize(boards) {
  if (boards.length === 0) return 0;
  return boards.reduce((sum, b) => sum + b, 0) + gap * (boards.length - 1) - thickness * 2;
}

/**
 * For a given target dimension (D), generate a candidate configuration of boards.
 * The candidate is built by starting with as many large boards as we can, then optionally replacing
 * the last board with a medium board (if useMedium is true), and finally appending a given 
 * number of small boards.
 */
function generateCandidateForDimension(D, useMedium = false, smallCount = 0) {
  let boards = [];
  
  // Greedily add large boards while it does not exceed D.
  while ( getTotalSize(boards) + sizeLarge <= D ) {
    boards.push(sizeLarge);
  }

    // Try tweaking the candidate:
    // If we want to use a medium board and it fits, add it.
    if (useMedium) {
        boards.push(sizeMedium);
    }

    // Append small boards until the total exceeds D or the limit is reached.
    for (let i = 0; i < smallCount; i++) {

        if (getTotalSize(boards) >= D) {
            break;
        }

        boards.push(sizeSmall);
    }

    // If the total length is still smaller than D,
    // replace the candidate with a single large board (which will overshoot D).
    if (getTotalSize(boards) < D) {
        // Filter out medium and small boards, then append a large one.
        boards = boards.filter(board => board === sizeLarge);
        boards.push(sizeLarge);
    }

  return boards;
}

/**
 * Given an inner dimension value (D), generate a set of candidate board arrays.
 * We try two possibilities: with and without a medium board, and for each
 * possibility, try small boards count from 0 up to a maximum (say 7).
 */
function generateCandidatesForDimension(D) {
  const candidates = [];
  for (let useMedium of [false, true]) {
    for (let smallCount = 0; smallCount <= 7; smallCount++) {
      candidates.push( generateCandidateForDimension(D, useMedium, smallCount) );
    }
  }
  return candidates;
}

/**
 * Given innerDims (an object with width, height, and depth),
 * generate a candidate boardSizes object that contains arrays for x, y, and z.
 * We allow only one dimension to have a medium board (sizeMedium) candidate.
 * We try all combinations, calculate the error (difference from target),
 * and pick the candidate with the least total error.
 */
export function calculateBoardSizes(innerDims) {
  const xCandidates = generateCandidatesForDimension(innerDims.width);
  const yCandidates = generateCandidatesForDimension(innerDims.height);
  const zCandidates = generateCandidatesForDimension(innerDims.depth);

  const allCombinations = [];
  
  for (let x of xCandidates) {
    for (let y of yCandidates) {
      for (let z of zCandidates) {
        // Count the occurrences of medium board in each candidate.
        let mediumCount = 0;
        const countMedium = arr => arr.reduce((count, board) => board === sizeMedium ? count + 1 : count, 0);
        mediumCount = countMedium(x) + countMedium(y) + countMedium(z);
        
        // Allow only combinations where exactly one dimension uses a medium board.
        if (mediumCount === 1 || false) {
          allCombinations.push({ x, y, z });
        }
      }
    }
  }

  return allCombinations;
}