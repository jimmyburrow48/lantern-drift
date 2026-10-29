// Lantern Drift: level generator (milestone 2).
// Answer first: a beam walk from the emitter lays down the mirrors and the lanterns,
// so the walk itself is the answer key. The board shows the mirror cells as empty.
// The tracer checks the answer before a level is returned.
import { parseBoard, traceBeam, isSolved, reflect } from './beam.js';
import { countRoutes } from './solve.js';

const EMITTER_CHAR = { '1,0': '>', '-1,0': '<', '0,-1': '^', '0,1': 'v' };
const TURN_MIRRORS = ['/', '\\'];

// Seeded PRNG (mulberry32, the same one tiny biome lab uses): same seed, same level.
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (x, y) => `${x},${y}`;

function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// One walk from a random edge cell. Each cell is used once, so the beam never
// crosses its own path. Returns null when the walk gets stuck.
function walkBeam({ width, height, rng, pMirror }) {
  const inside = (x, y) => x >= 0 && y >= 0 && x < width && y < height;

  const side = Math.floor(rng() * 4);
  const along = rng();
  const emitter =
    side === 0 ? { x: Math.floor(along * width), y: 0, dir: [0, 1] }
      : side === 1 ? { x: Math.floor(along * width), y: height - 1, dir: [0, -1] }
        : side === 2 ? { x: 0, y: Math.floor(along * height), dir: [1, 0] }
          : { x: width - 1, y: Math.floor(along * height), dir: [-1, 0] };

  const used = new Set([key(emitter.x, emitter.y)]);
  const cells = []; // { x, y, mirror } in beam order; mirror is null on a straight cell
  let { x, y } = emitter;
  let [dx, dy] = emitter.dir;

  for (;;) {
    const nx = x + dx;
    const ny = y + dy;
    if (!inside(nx, ny)) break; // the beam leaves the board: the walk is complete
    if (used.has(key(nx, ny))) return null;

    // Options for leaving (nx, ny): straight on, or turn with either mirror.
    // Only options whose next cell is free (or off the board) are allowed.
    const options = [{ mirror: null, dir: [dx, dy], weight: 1 - pMirror }];
    for (const m of TURN_MIRRORS) options.push({ mirror: m, dir: reflect(m, [dx, dy]), weight: pMirror / 2 });
    const valid = options.filter((o) => {
      const ax = nx + o.dir[0];
      const ay = ny + o.dir[1];
      return !inside(ax, ay) || !used.has(key(ax, ay));
    });
    if (valid.length === 0) return null;

    const total = valid.reduce((sum, o) => sum + o.weight, 0);
    let r = rng() * total;
    let choice = valid[valid.length - 1];
    for (const o of valid) {
      r -= o.weight;
      if (r < 0) {
        choice = o;
        break;
      }
    }

    used.add(key(nx, ny));
    cells.push({ x: nx, y: ny, mirror: choice.mirror });
    x = nx;
    y = ny;
    [dx, dy] = choice.dir;
  }
  return { emitter, cells, used };
}

// Build one level. Same seed and settings always give the same level.
// maxRoutes (milestone 6) rejects boards with more beam routes than that (countRoutes, with
// a node budget; a board over the budget is rejected too). Infinity keeps every board.
// Returns the board the player sees (mirror cells empty), the answer board
// (mirrors filled in) and a few stats. Throws if no level is found in maxAttempts.
export function generateLevel({
  seed = 1,
  width = 6,
  height = 6,
  lanterns = 3,
  minMirrors = 2,
  pMirror = 0.35,
  pWall = 0.08,
  maxRoutes = Infinity,
  routeBudget = 200000,
  maxAttempts = 500,
} = {}) {
  if (width < 3 || height < 3) throw new Error('board must be at least 3x3');
  const rng = makeRng(seed);
  let rejected = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const walk = walkBeam({ width, height, rng, pMirror });
    if (!walk) {
      rejected++;
      continue;
    }
    const mirrors = walk.cells.filter((c) => c.mirror);
    const straight = walk.cells.filter((c) => !c.mirror);
    if (mirrors.length < minMirrors || straight.length < lanterns) {
      rejected++;
      continue;
    }

    // Lanterns sit on straight cells: the beam passes through them without turning.
    const lanternSet = new Set(shuffle(straight, rng).slice(0, lanterns).map((c) => key(c.x, c.y)));

    const player = Array.from({ length: height }, () => Array(width).fill('.'));
    const answer = Array.from({ length: height }, () => Array(width).fill('.'));
    player[walk.emitter.y][walk.emitter.x] = EMITTER_CHAR[walk.emitter.dir.join(',')];
    answer[walk.emitter.y][walk.emitter.x] = player[walk.emitter.y][walk.emitter.x];
    for (const c of walk.cells) {
      if (c.mirror) answer[c.y][c.x] = c.mirror;
      else if (lanternSet.has(key(c.x, c.y))) player[c.y][c.x] = answer[c.y][c.x] = 'L';
    }
    // Walls go only on cells the beam never touches, so they cannot break the answer.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!walk.used.has(key(x, y)) && rng() < pWall) player[y][x] = answer[y][x] = '#';
      }
    }

    const playerText = player.map((row) => row.join('')).join('\n');
    const answerText = answer.map((row) => row.join('')).join('\n');
    // A level the player can solve with no mirrors at all is not a puzzle.
    if (isSolved(parseBoard(playerText))) {
      rejected++;
      continue;
    }
    const lit = traceBeam(parseBoard(answerText)).lit.length;
    if (!isSolved(parseBoard(answerText)) || lit !== lanterns) {
      throw new Error(`generator bug at seed ${seed}: the answer lights ${lit} of ${lanterns} lanterns`);
    }
    if (maxRoutes < Infinity) {
      const routes = countRoutes(playerText, { maxRoutes: maxRoutes + 1, maxNodes: routeBudget });
      if (routes === null || routes > maxRoutes) {
        rejected++;
        continue;
      }
    }

    return {
      seed,
      attempts: attempt,
      rejected,
      text: playerText,
      answer: answerText,
      mirrors: mirrors.length,
      lanterns,
      pathLength: walk.cells.length,
    };
  }
  throw new Error(`no level for seed ${seed} after ${maxAttempts} attempts`);
}

// Count the mirror layouts that solve a board. Tries every empty cell as empty,
// '/' or '\\'. Returns null when the board has more than maxFree empty cells.
export function countSolutions(text, maxFree = 9) {
  const board = parseBoard(text);
  const free = [];
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      if (board.cells[y][x] === '.') free.push([x, y]);
    }
  }
  if (free.length > maxFree) return null;

  const options = ['.', '/', '\\'];
  const total = 3 ** free.length;
  let count = 0;
  for (let n = 0; n < total; n++) {
    let m = n;
    for (const [x, y] of free) {
      board.cells[y][x] = options[m % 3];
      m = Math.floor(m / 3);
    }
    if (isSolved(board)) count++;
  }
  return count;
}
