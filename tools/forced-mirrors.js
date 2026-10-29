// Forced-route mirror count (milestone 8): for each tier, builds the boards for many seeds and
// looks at the boards with exactly one route. For those, counts the mirrors on the route (the
// empty cells the beam reaches that take a mirror). A forced board with one or two mirrors is
// the "too easy" case the playtest question is about. Prints a count per mirror number.
// Usage: node tools/forced-mirrors.js [seeds] [node budget]
import { generateLevel } from '../src/generate.js';
import { countRoutes } from '../src/solve.js';
import { TIERS } from '../src/packs.js';

const seeds = Number(process.argv[2] ?? 100);
const BUDGET = Number(process.argv[3] ?? 300000);

console.log(`tier        board  forced  skipped  mirrors on the forced route (count of boards)`);
for (const tier of TIERS) {
  const mirrorCounts = new Map();
  let forced = 0;
  let skipped = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const level = generateLevel({ seed, ...tier });
    let mirrors = null;
    const routes = countRoutes(level.text, {
      maxRoutes: 2,
      maxNodes: BUDGET,
      onRoute: (decided) => {
        mirrors = [...decided.values()].filter((c) => c !== '.').length;
      },
    });
    if (routes === null) skipped++;
    else if (routes === 1) {
      forced++;
      mirrorCounts.set(mirrors, (mirrorCounts.get(mirrors) ?? 0) + 1);
    }
  }
  const dist = [...mirrorCounts.keys()]
    .sort((a, b) => a - b)
    .map((m) => `${m}:${mirrorCounts.get(m)}`)
    .join('  ');
  console.log(`${tier.name.padEnd(10)}  ${`${tier.width}x${tier.height}`.padEnd(6)} ${String(forced).padEnd(7)} ${String(skipped).padEnd(8)} ${dist || '-'}`);
}
