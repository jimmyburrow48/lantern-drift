// Lantern Drift: play state (milestone 3). Pure functions, no DOM, so the tests run in node.
// A game is the level text the generator made, plus the mirrors the player has placed.
import { parseBoard, traceBeam } from './beam.js';

// Empty cell -> '/' -> '\' -> empty. Only cells that were empty in the level can change.
const CYCLE = { '.': '/', '/': '\\', '\\': '.' };

export const LIMITS = { seed: [1, 4294967295, 1], size: [3, 10, 6], lanterns: [1, 6, 3] };

export function createGame(levelText) {
  parseBoard(levelText); // throws on a bad board
  const rows = levelText.split(/\r?\n/).filter((row) => row.length > 0);
  return { fixed: rows, rows, history: [] };
}

export function isMovable(game, x, y) {
  return game.fixed[y][x] === '.';
}

// Turn the mirror on one cell. Returns a new game; the old one is kept for undo.
export function cycleCell(game, x, y) {
  if (!isMovable(game, x, y)) return game;
  const row = game.rows[y];
  const rows = game.rows.slice();
  rows[y] = row.slice(0, x) + CYCLE[row[x]] + row.slice(x + 1);
  return { ...game, rows, history: [...game.history, game.rows] };
}

export function undo(game) {
  if (game.history.length === 0) return game;
  return { ...game, rows: game.history[game.history.length - 1], history: game.history.slice(0, -1) };
}

export function reset(game) {
  return { ...game, rows: game.fixed, history: [] };
}

export function moveCount(game) {
  return game.history.length;
}

// What the player sees: the board, where the beam goes and which lanterns it lights.
// path lists the cells the beam enters, in order. The emitter is the first point of the beam.
export function gameStatus(game) {
  const board = parseBoard(game.rows.join('\n'));
  const trace = traceBeam(board);
  return {
    width: board.width,
    height: board.height,
    emitter: board.emitter,
    lanterns: board.lanterns,
    path: trace.path,
    lit: new Set(trace.lit),
    litCount: trace.lit.length,
    total: board.lanterns.length,
    solved: trace.lit.length === board.lanterns.length,
    stop: trace.stop,
  };
}

// The share link lives in the url hash: #seed=12&w=6&h=6&l=3.
// Anything missing or out of range falls back to the default, so a bad link still opens a level.
export function parseSettings(hash = '') {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const pick = (name, [min, max, fallback]) => {
    const text = params.get(name);
    if (text === null || !/^\d+$/.test(text)) return fallback;
    const n = Number(text);
    return n >= min && n <= max ? n : fallback;
  };
  return {
    seed: pick('seed', LIMITS.seed),
    width: pick('w', LIMITS.size),
    height: pick('h', LIMITS.size),
    lanterns: pick('l', LIMITS.lanterns),
  };
}

export function settingsToHash({ seed, width, height, lanterns }) {
  return `#seed=${seed}&w=${width}&h=${height}&l=${lanterns}`;
}
