// Print a board with the beam path drawn in. Usage: node tools/trace.js levels/first.txt
import { readFileSync } from 'node:fs';
import { parseBoard, traceBeam, isSolved } from '../src/beam.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: node tools/trace.js <level file>');
  process.exit(1);
}

const board = parseBoard(readFileSync(file, 'utf8'));
const result = traceBeam(board);
const drawn = board.cells.map((row) => [...row]);
for (const { x, y } of result.path) {
  if (drawn[y][x] === '.') drawn[y][x] = '*';
}

console.log(drawn.map((row) => row.join('')).join('\n'));
console.log(`lit ${result.lit.length} of ${board.lanterns.length} lanterns, stopped: ${result.stop}`);
console.log(isSolved(board) ? 'solved' : 'not solved');
