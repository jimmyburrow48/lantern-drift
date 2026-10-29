// Lantern Drift: play state (milestone 3). Pure functions, no DOM, so the tests run in node.
// A game is the level text the generator made, plus the mirrors the player has placed.
import { parseBoard, traceBeam } from './beam.js';
import { LEVEL_COUNT, levelSettings } from './packs.js';

// Empty cell -> '/' -> '\' -> empty. Only cells that were empty in the level can change.
const CYCLE = { '.': '/', '/': '\\', '\\': '.' };

export const LIMITS = { seed: [1, 4294967295, 1], size: [3, 10, 6], lanterns: [1, 6, 3] };

// The answer key (milestone 10) is optional: the page passes the generator's answer so the hint can use it.
export function createGame(levelText, answerText = null) {
  parseBoard(levelText); // throws on a bad board
  const rows = levelText.split(/\r?\n/).filter((row) => row.length > 0);
  return { fixed: rows, rows, history: [], answer: answerText };
}

export function isMovable(game, x, y) {
  return game.fixed[y][x] === '.';
}

// Keyboard play (milestone 9): the next movable cell from (x, y) in one direction, or null at the edge.
// Walks past walls, lanterns, the emitter and the fixed mirrors, so arrow keys skip cells you cannot change.
export function nextMovable(game, x, y, dx, dy) {
  const height = game.fixed.length;
  const width = game.fixed[0].length;
  let cx = x + dx;
  let cy = y + dy;
  while (cx >= 0 && cy >= 0 && cx < width && cy < height) {
    if (isMovable(game, cx, cy)) return { x: cx, y: cy };
    cx += dx;
    cy += dy;
  }
  return null;
}

// Turn the mirror on one cell. Returns a new game; the old one is kept for undo.
export function cycleCell(game, x, y) {
  if (!isMovable(game, x, y)) return game;
  const row = game.rows[y];
  const rows = game.rows.slice();
  rows[y] = row.slice(0, x) + CYCLE[row[x]] + row.slice(x + 1);
  return { ...game, rows, history: [...game.history, game.rows] };
}

// Hint (milestone 10): sets the first cell that differs from the answer key to the key's choice.
// The key may clear a wrong mirror, so each hint moves the board closer to a solution.
// A hint is a move in the history (undo takes it back). No hint on a solved board, or without a key.
export function hint(game) {
  if (!game.answer || gameStatus(game).solved) return game;
  const answer = game.answer.split(/\r?\n/);
  for (let y = 0; y < game.rows.length; y++) {
    for (let x = 0; x < game.rows[y].length; x++) {
      if (!isMovable(game, x, y) || game.rows[y][x] === answer[y][x]) continue;
      const row = game.rows[y];
      const rows = game.rows.slice();
      rows[y] = row.slice(0, x) + answer[y][x] + row.slice(x + 1);
      return { ...game, rows, history: [...game.history, game.rows] };
    }
  }
  return game;
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

// The share link lives in the url hash: #seed=12&w=6&h=6&l=3, or #level=7 for a ladder level.
// Anything missing or out of range falls back to the default, so a bad link still opens a level.
export function parseSettings(hash = '') {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const pick = (name, [min, max, fallback]) => {
    const text = params.get(name);
    if (text === null || !/^\d+$/.test(text)) return fallback;
    const n = Number(text);
    return n >= min && n <= max ? n : fallback;
  };
  const level = pick('level', [1, LEVEL_COUNT, 0]);
  const hasBoard = ['seed', 'w', 'h', 'l'].some((name) => params.has(name));
  if (level && !hasBoard) return levelSettings(level);

  const settings = {
    seed: pick('seed', LIMITS.seed),
    width: pick('w', LIMITS.size),
    height: pick('h', LIMITS.size),
    lanterns: pick('l', LIMITS.lanterns),
  };
  return level ? { ...settings, level } : settings;
}

export function settingsToHash({ seed, width, height, lanterns, level }) {
  const board = `#seed=${seed}&w=${width}&h=${height}&l=${lanterns}`;
  return level ? `${board}&level=${level}` : board;
}

// The text a player can copy when a board is solved (milestone 11). It has the level, the move count and the link to the level.
// It never has the player's mirrors, the same as the copy link button.
export function resultCard({ label, moves, link }) {
  const count = `${moves} move${moves === 1 ? '' : 's'}`;
  return `lantern drift · ${label} · solved in ${count}\n${link}`;
}
