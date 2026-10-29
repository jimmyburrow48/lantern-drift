// Lantern Drift: headless beam tracer (milestone 1).
// Board: rows of chars. See README.md for the legend.

const EMITTERS = {
  '>': [1, 0],
  '<': [-1, 0],
  '^': [0, -1],
  'v': [0, 1],
};

// '/' sends a beam right -> up, up -> right, left -> down, down -> left.
// '\' sends a beam right -> down, down -> right, left -> up, up -> left.
const MIRRORS = {
  '/': ([dx, dy]) => [-dy, -dx],
  '\\': ([dx, dy]) => [dy, dx],
};

// Turn a beam heading with a mirror ('/' or '\\'). The level generator uses this.
export function reflect(ch, dir) {
  return MIRRORS[ch](dir);
}

export function parseBoard(text) {
  const rows = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (rows.length === 0) throw new Error('empty board');
  const width = rows[0].length;
  if (rows.some((row) => row.length !== width)) throw new Error('rows must have the same width');

  let emitter = null;
  const lanterns = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x];
      if (ch in EMITTERS) {
        if (emitter) throw new Error('a board has one emitter');
        emitter = { x, y, dir: EMITTERS[ch] };
      } else if (ch === 'L') {
        lanterns.push({ x, y });
      } else if (!'.#/\\'.includes(ch)) {
        throw new Error(`unknown cell "${ch}" at ${x},${y}`);
      }
    }
  }
  if (!emitter) throw new Error('a board needs one emitter');
  if (lanterns.length === 0) throw new Error('a board needs at least one lantern');

  return { width, height: rows.length, cells: rows.map((row) => [...row]), emitter, lanterns };
}

// Trace the beam from the emitter. Returns the cells it passes, the lanterns it
// lights, and why it stopped: 'edge', 'wall', or 'loop'.
export function traceBeam(board, maxSteps = 10000) {
  const { width, height, cells, emitter } = board;
  let { x, y } = emitter;
  let [dx, dy] = emitter.dir;
  const path = [];
  const seen = new Set();
  const lit = new Set();

  for (let step = 0; step < maxSteps; step++) {
    x += dx;
    y += dy;
    if (x < 0 || y < 0 || x >= width || y >= height) return { path, lit: [...lit], stop: 'edge' };

    const ch = cells[y][x];
    if (ch === '#') return { path, lit: [...lit], stop: 'wall' };

    // A lantern lights up and the beam keeps going through it.
    if (ch === 'L') lit.add(`${x},${y}`);

    if (ch in MIRRORS) {
      [dx, dy] = MIRRORS[ch]([dx, dy]);
    }

    // The same cell with the same heading means the beam is in a cycle.
    const key = `${x},${y},${dx},${dy}`;
    if (seen.has(key)) return { path, lit: [...lit], stop: 'loop' };
    seen.add(key);
    path.push({ x, y });
  }
  return { path, lit: [...lit], stop: 'loop' };
}

// A level is solved when the beam reaches every lantern.
export function isSolved(board) {
  const result = traceBeam(board);
  return result.lit.length === board.lanterns.length;
}
