import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, cycleCell, undo, reset, moveCount, gameStatus, isMovable, nextMovable, hint, parseSettings, settingsToHash, resultCard,
} from '../src/play.js';
import { generateLevel } from '../src/generate.js';

const SAMPLE = '......\n......\n......\n>L.\\..\n...L..\n......';

test('createGame: keeps the level and starts with no moves', () => {
  const game = createGame(SAMPLE);
  assert.equal(moveCount(game), 0);
  assert.equal(game.rows.join('\n'), SAMPLE);
});

test('createGame: a bad board throws', () => {
  assert.throws(() => createGame('>>\n..'));
});

test('isMovable: only empty cells of the level can take a mirror', () => {
  const game = createGame(SAMPLE);
  assert.equal(isMovable(game, 0, 0), true);
  assert.equal(isMovable(game, 1, 3), false); // lantern
  assert.equal(isMovable(game, 3, 3), false); // fixed mirror
  assert.equal(isMovable(game, 0, 3), false); // emitter
});

test('cycleCell: empty -> / -> \\ -> empty, and fixed cells do not change', () => {
  let game = createGame(SAMPLE);
  game = cycleCell(game, 2, 0);
  assert.equal(game.rows[0][2], '/');
  game = cycleCell(game, 2, 0);
  assert.equal(game.rows[0][2], '\\');
  game = cycleCell(game, 2, 0);
  assert.equal(game.rows[0][2], '.');

  const before = createGame(SAMPLE);
  const after = cycleCell(before, 3, 3);
  assert.equal(after, before, 'a fixed mirror is not changed');
});

test('undo and reset go back', () => {
  const start = createGame(SAMPLE);
  let game = cycleCell(start, 0, 0);
  game = cycleCell(game, 1, 0);
  assert.equal(moveCount(game), 2);
  game = undo(game);
  assert.equal(game.rows[0][1], '.');
  assert.equal(game.rows[0][0], '/');
  game = undo(undo(game));
  assert.deepEqual(game.rows, start.rows);
  assert.equal(undo(game), game, 'undo with no history does nothing');
  game = cycleCell(cycleCell(start, 0, 0), 4, 4);
  assert.deepEqual(reset(game).rows, start.rows);
  assert.equal(moveCount(reset(game)), 0);
});

test('gameStatus: the sample level is solved by its fixed mirror, the empty board is not', () => {
  const solved = gameStatus(createGame(SAMPLE));
  assert.equal(solved.solved, true);
  assert.equal(solved.litCount, 2);
  assert.equal(solved.total, 2);

  const empty = createGame(SAMPLE.replace('\\', '.'));
  const status = gameStatus(empty);
  assert.equal(status.solved, false);
  assert.equal(status.litCount, 1);
});

test('gameStatus: the beam path starts at the emitter side and tells why it stopped', () => {
  const status = gameStatus(createGame(SAMPLE));
  assert.equal(status.stop, 'edge');
  assert.deepEqual(status.emitter, { x: 0, y: 3, dir: [1, 0] });
  assert.deepEqual(status.path[0], { x: 1, y: 3 });
  assert.ok(status.lit.has('1,3'));
});

test('a generated level is unsolved before the player moves it', () => {
  for (const seed of [1, 7, 42]) {
    const level = generateLevel({ seed, width: 6, height: 6, lanterns: 3 });
    assert.equal(gameStatus(createGame(level.text)).solved, false, `seed ${seed}`);
  }
});

test('parseSettings: a full link round-trips', () => {
  const settings = { seed: 12345, width: 7, height: 5, lanterns: 4 };
  const hash = settingsToHash(settings);
  assert.equal(hash, '#seed=12345&w=7&h=5&l=4');
  assert.deepEqual(parseSettings(hash), settings);
});

test('parseSettings: missing or bad values fall back to the defaults', () => {
  assert.deepEqual(parseSettings(''), { seed: 1, width: 6, height: 6, lanterns: 3 });
  assert.deepEqual(parseSettings('#seed=abc&w=99&h=2&l=0'), { seed: 1, width: 6, height: 6, lanterns: 3 });
  assert.deepEqual(parseSettings('#seed=-5&w=8'), { seed: 1, width: 8, height: 6, lanterns: 3 });
});

test('nextMovable: arrow steps skip cells the player cannot change', () => {
  // SAMPLE: the emitter is (0,3), a lantern (1,3), a fixed mirror (3,3), a lantern (3,4)
  const game = createGame(SAMPLE);
  assert.deepEqual(nextMovable(game, 0, 0, 1, 0), { x: 1, y: 0 });
  assert.equal(nextMovable(game, 2, 3, -1, 0), null); // the lantern and the emitter block the way
  assert.deepEqual(nextMovable(game, 2, 3, 1, 0), { x: 4, y: 3 }); // the fixed mirror at (3,3) is skipped
  assert.equal(nextMovable(game, 0, 0, 0, -1), null); // off the top edge
  assert.equal(nextMovable(game, 5, 5, 1, 0), null); // off the right edge
});

test('nextMovable: walks down a column past a fixed mirror and a lantern', () => {
  const game = createGame(SAMPLE);
  assert.deepEqual(nextMovable(game, 3, 0, 0, 1), { x: 3, y: 1 });
  assert.deepEqual(nextMovable(game, 3, 2, 0, 1), { x: 3, y: 5 }); // (3,3) mirror and (3,4) lantern are skipped
});

test('hint: a hint walk solves the level in exactly as many hints as the key has mirrors', () => {
  const level = generateLevel({ seed: 7, width: 5, height: 5, lanterns: 3 });
  let game = createGame(level.text, level.answer);
  let steps = 0;
  while (!gameStatus(game).solved && steps < 100) {
    const next = hint(game);
    assert.notEqual(next, game, 'an unsolved board always gets a hint');
    game = next;
    steps++;
  }
  assert.equal(gameStatus(game).solved, true);
  assert.equal(steps, level.mirrors);
});

test('hint: no key, or a solved board, gives the same game back', () => {
  const level = generateLevel({ seed: 7, width: 5, height: 5, lanterns: 3 });
  const bare = createGame(level.text);
  assert.equal(hint(bare), bare);
  const solved = createGame(SAMPLE, SAMPLE);
  assert.equal(hint(solved), solved);
});

test('hint: it is a move, so undo takes it back', () => {
  const level = generateLevel({ seed: 7, width: 5, height: 5, lanterns: 3 });
  const start = createGame(level.text, level.answer);
  const after = hint(start);
  assert.equal(moveCount(after), 1);
  assert.deepEqual(undo(after).rows, start.rows);
});

test('resultCard: level, moves and the level link, never the mirrors', () => {
  const card = resultCard({ label: 'level 7 of 18 · night · 5x5, 3 lanterns', moves: 4, link: 'https://example.test/#seed=165&w=5&h=5&l=3&level=8' });
  assert.equal(card, 'lantern drift · level 7 of 18 · night · 5x5, 3 lanterns · solved in 4 moves\nhttps://example.test/#seed=165&w=5&h=5&l=3&level=8');
});

test('resultCard: one move reads as one move', () => {
  const card = resultCard({ label: 'custom level', moves: 1, link: 'x' });
  assert.match(card, /solved in 1 move\nx$/);
});
