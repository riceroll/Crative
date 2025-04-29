import { all } from 'three/tsl';
import { sizeLarge, sizeMedium, sizeSmall, gap, thickness } from '../configs/boardConfig';

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
  D = D + 1e-6;
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
  
  // keep adding sizeLarge boards right before exceeding D
  let basicLargeBoards = [];
  while (getTotalSize(basicLargeBoards) + sizeLarge <= D) {
    basicLargeBoards.push(sizeLarge);
  }

  // 1. pure large, copy the boards array to a new array and append one sizeLarge board
  let boards = [...basicLargeBoards];
  boards.push(sizeLarge);
  candidates.push(boards);
  
  // 2. one sizeMedium board, copy the boards array to a new array and append one sizeMedium board
  boards = [...basicLargeBoards];
  boards.push(sizeMedium);

  // keep adding sizeSmall boards until the total exceeds D
  let numSmallBoards = 0;
  while (getTotalSize(boards) <= D && numSmallBoards < 7) {
    boards.push(sizeSmall);
    numSmallBoards++;
  }
  candidates.push(boards);

  // 3. keep adding sizeSmall boards until the total exceeds D
  boards = [...basicLargeBoards];
  numSmallBoards = 0;
  while (getTotalSize(boards) <= D && numSmallBoards < 7) {
    boards.push(sizeSmall);
    numSmallBoards++;
  }
  candidates.push(boards);

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
        mediumCount += x.includes(sizeMedium) ? 1 : 0;
        mediumCount += y.includes(sizeMedium) ? 1 : 0;
        mediumCount += z.includes(sizeMedium) ? 1 : 0;
        
        // Allow only combinations where exactly one dimension uses a medium board.
        if ( mediumCount <= 1 ) {
          allCombinations.push({ x, y, z });
        }
      }
    }
  }

  return allCombinations;
}