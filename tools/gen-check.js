// Batch check for the level generator: builds many levels, traces each answer,
// and prints a rate table. Usage: node tools/gen-check.js [count] [width] [height] [lanterns]
import { generateLevel, countSolutions } from '../src/generate.js';
import { parseBoard, isSolved } from '../src/beam.js';

const [count = 200, width = 6, height = 6, lanterns = 3] = process.argv.slice(2).map(Number);

let built = 0;
let answerSolves = 0;
let trivial = 0; // the empty board (no mirrors) already lights every lantern
let rejected = 0;
let tries = 0;
let mirrors = 0;
let path = 0;
let tiny = 0; // boards with few enough empty cells to count every layout
let unique = 0;
const failures = [];
const started = Date.now();

for (let seed = 1; seed <= count; seed++) {
  let level;
  try {
    level = generateLevel({ seed, width, height, lanterns });
  } catch (err) {
    failures.push(err.message);
    continue;
  }
  built++;
  rejected += level.rejected;
  tries += level.attempts;
  mirrors += level.mirrors;
  path += level.pathLength;
  if (isSolved(parseBoard(level.answer))) answerSolves++;
  if (isSolved(parseBoard(level.text))) trivial++;
  const solutions = countSolutions(level.text);
  if (solutions !== null) {
    tiny++;
    if (solutions === 1) unique++;
  }
}

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : 'n/a');
console.log(`board ${width}x${height}, ${lanterns} lanterns, seeds 1..${count}`);
console.log(`built ${built} of ${count} (${failures.length} failed)`);
console.log(`walk attempts that were rejected: ${pct(rejected, tries)}`);
console.log(`answer lights every lantern: ${answerSolves} of ${built}`);
console.log(`solved by the empty board (trivial): ${trivial} of ${built}`);
console.log(`mean mirrors ${(mirrors / built).toFixed(2)}, mean beam cells ${(path / built).toFixed(1)}`);
console.log(`small boards (<=9 empty cells): ${tiny}, one solution only: ${unique} (${pct(unique, tiny)})`);
console.log(`time ${Date.now() - started} ms`);
for (const f of failures.slice(0, 5)) console.log(`failure: ${f}`);
