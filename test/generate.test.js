import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateLevel, countSolutions, makeRng } from '../src/generate.js';
import { parseBoard, isSolved } from '../src/beam.js';

test('makeRng: same seed gives the same numbers, another seed differs', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  const c = makeRng(43);
  const first = [a(), a(), a()];
  assert.deepEqual([b(), b(), b()], first);
  assert.notDeepEqual([c(), c(), c()], first);
  for (const n of first) assert.ok(n >= 0 && n < 1);
});

test('generateLevel: same seed and settings give the same level', () => {
  const one = generateLevel({ seed: 9, width: 6, height: 6, lanterns: 3 });
  const two = generateLevel({ seed: 9, width: 6, height: 6, lanterns: 3 });
  assert.deepEqual(one, two);
});

test('generateLevel: the answer lights every lantern, the player board hides the mirrors', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const level = generateLevel({ seed, width: 5, height: 5, lanterns: 3 });
    assert.ok(isSolved(parseBoard(level.answer)), `seed ${seed}: answer does not solve`);
    assert.ok(!/[/\\]/.test(level.text), `seed ${seed}: mirror shown on the player board`);
    assert.equal([...level.text].filter((ch) => ch === 'L').length, 3, `seed ${seed}: lantern count`);
    assert.ok(level.mirrors >= 2, `seed ${seed}: too few mirrors`);
  }
});

test('generateLevel: no level is solved by the empty board', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const level = generateLevel({ seed, width: 3, height: 3, lanterns: 1 });
    assert.equal(isSolved(parseBoard(level.text)), false, `seed ${seed}: trivial level`);
  }
});

test('generateLevel: each board keeps its width and height', () => {
  const level = generateLevel({ seed: 3, width: 7, height: 4, lanterns: 2 });
  const rows = level.text.split('\n');
  assert.equal(rows.length, 4);
  assert.ok(rows.every((row) => row.length === 7));
});

test('generateLevel: throws when the settings cannot make a level', () => {
  assert.throws(() => generateLevel({ seed: 1, width: 3, height: 3, lanterns: 20, maxAttempts: 50 }), /no level/);
  assert.throws(() => generateLevel({ seed: 1, width: 2, height: 5 }), /at least 3x3/);
});

test('countSolutions: one open cell, and only leaving it empty lights the lantern', () => {
  // '/' sends the beam up off the board, '\' sends it down off the board.
  assert.equal(countSolutions('>.L'), 1);
});

test('countSolutions: no empty cells means one answer if the board is solved', () => {
  assert.equal(countSolutions('>L'), 1);
  assert.equal(countSolutions('>#L'), 0);
});

test('countSolutions: gives up on big boards', () => {
  assert.equal(countSolutions('>.........\n..........\n.........L', 9), null);
});
