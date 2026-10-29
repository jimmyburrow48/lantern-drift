// Lantern Drift: route counter (milestone 5).
// countSolutions (generate.js) counts whole mirror layouts, so every spare mirror that
// the beam never meets multiplies the count. countRoutes counts beam routes instead: it
// only branches on the empty cells the beam reaches, and it stops at the step where the
// last lantern is lit. So a route is the shortest set of mirrors that lights every lantern,
// and any layout that holds the route solves the board. Two routes differ on a cell the
// beam reaches, so each is counted once. One route means the solution is forced.
import { parseBoard, reflect } from './beam.js';

const CHOICES = ['.', '/', '\\'];

// Returns the number of routes that light every lantern. Stops early once it has
// maxRoutes, so a result equal to maxRoutes means "at least that many". onRoute(decided) is
// called with each route; decided maps each empty cell the route reached to its choice (the entries that are not '.' are its mirrors). Choices are'/' or '\'. Returns null
// when the search passes maxNodes branches.
export function countRoutes(text, { maxRoutes = Infinity, maxNodes = 200000, onRoute = null } = {}) {
  const board = parseBoard(text);
  const { width, height, cells, emitter, lanterns } = board;
  let routes = 0;
  let nodes = 0;
  let stop = false;

  // The beam is in (x, y) heading (dx, dy) and has not yet entered the next cell.
  // state.decided maps each empty cell the beam has reached to its choice ('.', '/' or '\\');
  // state.lit and state.seen match traceBeam. A branch copies the state before it changes it.
  function run(x, y, dx, dy, state) {
    if (stop) return;
    for (;;) {
      x += dx;
      y += dy;
      if (x < 0 || y < 0 || x >= width || y >= height) return;

      let ch = cells[y][x];
      if (ch === '#') return;
      if (ch === '.') {
        const k = `${x},${y}`;
        if (!state.decided.has(k)) {
          // First time the beam reaches this empty cell: try each choice. The branch steps
          // back one cell so it enters (x, y) again, now with the choice made.
          for (const choice of CHOICES) {
            if (++nodes > maxNodes) {
              stop = true;
              return;
            }
            const next = {
              decided: new Map(state.decided).set(k, choice),
              lit: new Set(state.lit),
              seen: new Set(state.seen),
            };
            run(x - dx, y - dy, dx, dy, next);
          }
          return;
        }
        ch = state.decided.get(k);
      }

      if (ch === 'L') {
        state.lit.add(`${x},${y}`);
        // Every lantern is lit: this is a route. The rest of the beam does not matter.
        if (state.lit.size === lanterns.length) {
          routes++;
          if (onRoute) onRoute(state.decided);
          if (routes >= maxRoutes) stop = true;
          return;
        }
      }
      if (ch === '/' || ch === '\\') [dx, dy] = reflect(ch, [dx, dy]);

      // The same cell with the same heading means the beam is in a cycle: no more lanterns.
      const seenKey = `${x},${y},${dx},${dy}`;
      if (state.seen.has(seenKey)) return;
      state.seen.add(seenKey);
    }
  }

  run(emitter.x, emitter.y, emitter.dir[0], emitter.dir[1], {
    decided: new Map(),
    lit: new Set(),
    seen: new Set(),
  });
  return nodes > maxNodes ? null : routes;
}
