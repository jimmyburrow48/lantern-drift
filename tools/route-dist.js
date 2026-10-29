// Route-count distribution for the route filter (milestone 6): for each tier, builds the boards
// for many seeds and prints the share with at most K routes, for a few K. A board whose route
// search passes the node budget is counted as "skipped" and left out of the shares.
// Usage: node tools/route-dist.js [seeds] [node budget]
import { generateLevel } from '../src/generate.js';
import { countRoutes } from '../src/solve.js';
import { TIERS } from '../src/packs.js';

const seeds = Number(process.argv[2] ?? 100);
const BUDGET = Number(process.argv[3] ?? 300000);
const KS = [1, 2, 4, 8, 16, 32];
const CAP = KS[KS.length - 1] + 1;

console.log(`tier        board  ${KS.map((k) => `<=${k}`.padEnd(7)).join('')}skipped  built`);
for (const tier of TIERS) {
  const counts = [];
  let skipped = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const level = generateLevel({ seed, ...tier });
    const routes = countRoutes(level.text, { maxRoutes: CAP, maxNodes: BUDGET });
    if (routes === null) skipped++;
    else counts.push(routes);
  }
  const shares = KS.map((k) => {
    const n = counts.filter((r) => r <= k).length;
    return `${((100 * n) / counts.length).toFixed(1)}%`.padEnd(7);
  });
  console.log(`${tier.name.padEnd(10)}  ${`${tier.width}x${tier.height}`.padEnd(6)} ${shares.join('')}${String(skipped).padEnd(8)} ${counts.length}`);
}
