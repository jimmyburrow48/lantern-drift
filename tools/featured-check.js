// Route check for the level ladder: for each tier, builds the boards for many seeds, counts
// the beam routes of each (countRoutes, capped at CAP) and prints one row per tier. A board
// whose search passes the node budget is skipped and counted. It also picks the featured seed
// of each tier: the seed with the fewest routes (ties go to the smaller seed).
// Usage: node tools/featured-check.js [seeds] [cap] [node budget]
import { generateLevel } from '../src/generate.js';
import { countRoutes } from '../src/solve.js';
import { TIERS } from '../src/packs.js';

const seeds = Number(process.argv[2] ?? 60);
const CAP = Number(process.argv[3] ?? 50);
const BUDGET = Number(process.argv[4] ?? 300000);

console.log('tier        board  forced(1)  skipped  fewest  seed  median  slowest');
for (const tier of TIERS) {
  const counts = [];
  let skipped = 0;
  let best = { routes: Infinity, seed: 0 };
  let slowest = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const level = generateLevel({ seed, width: tier.width, height: tier.height, lanterns: tier.lanterns });
    const t0 = Date.now();
    const routes = countRoutes(level.text, { maxRoutes: CAP, maxNodes: BUDGET });
    slowest = Math.max(slowest, Date.now() - t0);
    if (routes === null) {
      skipped++;
      continue;
    }
    counts.push(routes);
    if (routes < best.routes) best = { routes, seed };
  }
  const sorted = [...counts].sort((a, b) => a - b);
  const forced = counts.filter((r) => r === 1).length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const cells = [
    tier.name.padEnd(10),
    `${tier.width}x${tier.height}`.padEnd(6),
    `${forced}/${counts.length}`.padEnd(10),
    String(skipped).padEnd(8),
    `${best.routes}${best.routes === CAP ? '+' : ''}`.padEnd(7),
    String(best.seed).padEnd(5),
    `${median}${median === CAP ? '+' : ''}`.padEnd(7),
    `${slowest} ms`,
  ];
  console.log(cells.join(' '));
}
