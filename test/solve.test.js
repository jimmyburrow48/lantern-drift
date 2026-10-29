import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countRoutes } from '../src/solve.js';
import { generateLevel } from '../src/generate.js';
import { parseBoard, reflect } from '../src/beam.js';

// Brute force oracle for small boards: try every layout of the empty cells, trace the beam
// and stop at the step where the last lantern is lit. Each layout that lights every lantern
// gives the list of empty cells the beam reached (with their choice) up to that step. Distinct
// lists are the routes.
function oracleRoutes(text) {
  const board = parseBoard(text);
  const free = [];
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      if (board.cells[y][x] === '.') free.push([x, y]);
    }
  }
  const options = ['.', '/', '\\'];
  const routes = new Set();
  for (let n = 0; n < 3 ** free.length; n++) {
    const cells = board.cells.map((row) => [...row]);
    const choice = new Map();
    let m = n;
    for (const [x, y] of free) {
      const c = options[m % 3];
      cells[y][x] = c;
      choice.set(`${x},${y}`, c);
      m = Math.floor(m / 3);
    }
    let { x, y } = board.emitter;
    let [dx, dy] = board.emitter.dir;
    const lit = new Set();
    const visited = [];
    const seen = new Set();
    for (let step = 0; step < 10000; step++) {
      x += dx;
      y += dy;
      if (x < 0 || y < 0 || x >= board.width || y >= board.height) break;
      const ch = cells[y][x];
      if (ch === '#') break;
      if (choice.has(`${x},${y}`)) visited.push(`${x},${y}=${ch}`);
      if (ch === 'L') lit.add(`${x},${y}`);
      if (lit.size === board.lanterns.length) {
        routes.add(visited.join(' '));
        break;
      }
      if (ch === '/' || ch === '\\') [dx, dy] = reflect(ch, [dx, dy]);
      const key = `${x},${y},${dx},${dy}`;
      if (seen.has(key)) break;
      seen.add(key);
    }
  }
  return routes.size;
}

test('countRoutes: a lantern on the straight line is one route with no mirrors', () => {
  assert.equal(countRoutes('>L..'), 1);
});

test('countRoutes: one route when only a single mirror turns the beam onto the lantern', () => {
  // right: '.' goes on to the edge (no lantern), '/' goes up (edge), '\' goes down onto L.
  assert.equal(countRoutes('>.\n.L'), 1);
});

test('countRoutes: a board with no way to light the lanterns has no route', () => {
  assert.equal(countRoutes('>#L'), 0);
  assert.equal(countRoutes('>#.\n..L'), 0);
});

test('countRoutes: an open board has several routes', () => {
  // a 3x3 board with the emitter in the top-left and a lantern in the bottom-right corner
  assert.ok(countRoutes('>..\n...\n..L') > 1);
});

test('countRoutes: stops at maxRoutes and says so', () => {
  assert.equal(countRoutes('>..\n...\n..L', { maxRoutes: 1 }), 1);
});

test('countRoutes: matches the brute force oracle on small generated boards', () => {
  let checked = 0;
  for (let seed = 1; seed <= 40 && checked < 25; seed++) {
    const lv = generateLevel({ seed, width: 3, height: 3, lanterns: 1 + (seed % 2) });
    const freeCount = [...lv.text].filter((ch) => ch === '.').length;
    if (freeCount > 7) continue;
    assert.equal(countRoutes(lv.text), oracleRoutes(lv.text), `seed ${seed}\n${lv.text}`);
    checked++;
  }
  assert.ok(checked >= 10, `only ${checked} boards were small enough to check`);
});

test('countRoutes: the generator answer is always one of the routes', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const lv = generateLevel({ seed, width: 4, height: 4, lanterns: 2 });
    assert.ok(countRoutes(lv.answer) >= 1, `seed ${seed}`);
  }
});

test('featured levels: the generator still builds the same board and the route count matches', async () => {
  const { FEATURED } = await import('../src/featured.js');
  for (const f of FEATURED) {
    const lv = generateLevel({ seed: f.seed, width: f.width, height: f.height, lanterns: f.lanterns });
    assert.equal(lv.text, f.text, f.name);
    assert.equal(countRoutes(f.text), f.routes, f.name);
  }
});

test('featured level first light (seed 157): the brute force oracle agrees it has one route', async () => {
  const { FEATURED } = await import('../src/featured.js');
  const f = FEATURED.find((x) => x.seed === 157);
  assert.equal(oracleRoutes(f.text), 1);
});
