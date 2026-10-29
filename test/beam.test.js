import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseBoard, traceBeam, isSolved } from '../src/beam.js';

test('parse: reads size, emitter and lanterns', () => {
  const board = parseBoard('.L.\n>..\n');
  assert.equal(board.width, 3);
  assert.equal(board.height, 2);
  assert.deepEqual(board.emitter, { x: 0, y: 1, dir: [1, 0] });
  assert.deepEqual(board.lanterns, [{ x: 1, y: 0 }]);
});

test('parse: rejects bad boards', () => {
  assert.throws(() => parseBoard(''), /empty/);
  assert.throws(() => parseBoard('.L\n>'), /same width/);
  assert.throws(() => parseBoard('.L\n..'), /needs one emitter/);
  assert.throws(() => parseBoard('>>L'), /one emitter/);
  assert.throws(() => parseBoard('>..'), /at least one lantern/);
  assert.throws(() => parseBoard('>x.L'), /unknown cell "x"/);
});

test('straight beam lights a lantern and leaves by the edge', () => {
  const result = traceBeam(parseBoard('>L.L'));
  assert.deepEqual(result.lit, ['1,0', '3,0']);
  assert.equal(result.stop, 'edge');
});

test('a wall stops the beam before a lantern', () => {
  const result = traceBeam(parseBoard('>#L'));
  assert.deepEqual(result.lit, []);
  assert.equal(result.stop, 'wall');
});

test('"/" turns a beam going right into a beam going up', () => {
  const board = parseBoard('.L..\n>/..');
  const result = traceBeam(board);
  assert.deepEqual(result.lit, ['1,0']);
  assert.equal(result.stop, 'edge');
});

test('"\\" turns a beam going right into a beam going down', () => {
  const board = parseBoard('>\\..\n.L..');
  const result = traceBeam(board);
  assert.deepEqual(result.lit, ['1,1']);
  assert.equal(result.stop, 'edge');
});

test('two mirrors in a row: "/" sends the beam up, then "\\" sends it left onto a lantern', () => {
  const board = parseBoard('L\\.\n>/.');
  const result = traceBeam(board);
  assert.deepEqual(result.lit, ['0,0']);
  assert.equal(result.stop, 'edge');
});

test('isSolved needs every lantern lit', () => {
  assert.equal(isSolved(parseBoard('>L.L')), true);
  assert.equal(isSolved(parseBoard('>L.#L')), false);
});

test('a beam that cycles back to its start stops with "loop"', () => {
  // the beam passes the emitter cell again, heading right, so the state repeats.
  const board = parseBoard('\\/L\n/>\\\n\\./');
  const result = traceBeam(board);
  assert.equal(result.stop, 'loop');
});

test('random boards always terminate', () => {
  // cheap fuzz: any board must stop in a finite number of steps
  const chars = ['.', '.', '.', '#', '/', '\\'];
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let n = 0; n < 300; n++) {
    const w = 3 + Math.floor(rand() * 5);
    const h = 3 + Math.floor(rand() * 5);
    const rows = [];
    for (let y = 0; y < h; y++) {
      let row = '';
      for (let x = 0; x < w; x++) row += chars[Math.floor(rand() * chars.length)];
      rows.push(row);
    }
    const ex = Math.floor(rand() * w);
    const ey = Math.floor(rand() * h);
    rows[ey] = rows[ey].slice(0, ex) + '>' + rows[ey].slice(ex + 1);
    const lx = (ex + 1) % w;
    const ly = (ey + 1) % h;
    rows[ly] = rows[ly].slice(0, lx) + 'L' + rows[ly].slice(lx + 1);
    const result = traceBeam(parseBoard(rows.join('\n')), 10000);
    assert.ok(['edge', 'wall', 'loop'].includes(result.stop), `stop ${result.stop}`);
  }
});

test('the first level file is solved by its fixed mirror', () => {
  const file = fileURLToPath(new URL('../levels/first.txt', import.meta.url));
  const board = parseBoard(readFileSync(file, 'utf8'));
  assert.equal(isSolved(board), true);
});
