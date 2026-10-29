import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateLevel } from '../src/generate.js';
import { countRoutes } from '../src/solve.js';
import { parseBoard, isSolved } from '../src/beam.js';
import { TIERS, LEVELS_PER_TIER, LEVEL_COUNT, levelSettings } from '../src/packs.js';
import { parseSettings, settingsToHash } from '../src/play.js';

test('levelSettings: level 1 is the first tier, the last level is the last tier, out of range is clamped', () => {
  assert.equal(LEVEL_COUNT, TIERS.length * LEVELS_PER_TIER);
  assert.deepEqual(levelSettings(1), { seed: 1, width: 4, height: 4, lanterns: 2, level: 1, tier: 'first light' });
  const last = levelSettings(LEVEL_COUNT);
  assert.equal(last.tier, TIERS[TIERS.length - 1].name);
  assert.equal(levelSettings(0).level, 1);
  assert.equal(levelSettings(999).level, LEVEL_COUNT);
});

test('the ladder goes up: the board never shrinks and the lanterns never drop', () => {
  for (let i = 1; i < TIERS.length; i++) {
    assert.ok(TIERS[i].width >= TIERS[i - 1].width, `tier ${i} is narrower`);
    assert.ok(TIERS[i].height >= TIERS[i - 1].height, `tier ${i} is shorter`);
    assert.ok(TIERS[i].lanterns >= TIERS[i - 1].lanterns, `tier ${i} has fewer lanterns`);
  }
});

test('every ladder level builds, and its answer lights every lantern', () => {
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const settings = levelSettings(n);
    const level = generateLevel(settings);
    assert.ok(isSolved(parseBoard(level.answer)), `level ${n}: answer does not solve`);
    assert.equal([...level.text].filter((ch) => ch === 'L').length, settings.lanterns, `level ${n}: lantern count`);
  }
});

test('the deep tiers keep their route cap: every level there has at most 8 beam routes', () => {
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const settings = levelSettings(n);
    if (!settings.maxRoutes) continue;
    const level = generateLevel(settings);
    const routes = countRoutes(level.text, { maxRoutes: 9, maxNodes: 200000 });
    assert.ok(routes !== null && routes <= 8, `level ${n}: ${routes} routes`);
  }
});

test('level links: #level=N opens the ladder level, and a board link keeps working', () => {
  assert.deepEqual(parseSettings('#level=7'), levelSettings(7));
  const board = { seed: 42, width: 5, height: 5, lanterns: 2, level: 7 };
  const hash = settingsToHash(board);
  assert.equal(hash, '#seed=42&w=5&h=5&l=2&level=7');
  assert.deepEqual(parseSettings(hash), board);
  assert.equal(parseSettings('#level=99').level, undefined);
});
