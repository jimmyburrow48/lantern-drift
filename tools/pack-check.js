// Batch check for the level ladder: builds the levels of every tier for many seeds and
// prints one row per tier, so the ladder can be tuned from numbers. Usage: node tools/pack-check.js [seeds]
import { generateLevel } from '../src/generate.js';
import { parseBoard, isSolved } from '../src/beam.js';
import { TIERS } from '../src/packs.js';

const seeds = Number(process.argv[2] ?? 100);
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(0)}%` : 'n/a');

console.log('tier        board  lant  built  rejected  open cells  mirrors  beam cells  slowest');
for (const tier of TIERS) {
  let built = 0;
  let rejected = 0;
  let tries = 0;
  let open = 0;
  let mirrors = 0;
  let beam = 0;
  let slowest = 0;
  let failed = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const t0 = Date.now();
    let level;
    try {
      level = generateLevel({ seed, width: tier.width, height: tier.height, lanterns: tier.lanterns });
    } catch {
      failed++;
      continue;
    }
    slowest = Math.max(slowest, Date.now() - t0);
    if (!isSolved(parseBoard(level.answer))) throw new Error(`answer does not solve: ${tier.name} seed ${seed}`);
    built++;
    rejected += level.rejected;
    tries += level.attempts;
    open += [...level.text].filter((ch) => ch === '.').length;
    mirrors += level.mirrors;
    beam += level.pathLength;
  }
  const name = tier.name.padEnd(10);
  const size = `${tier.width}x${tier.height}`.padEnd(6);
  const row = [
    name,
    size,
    String(tier.lanterns).padEnd(5),
    `${built}/${seeds}`.padEnd(6),
    pct(rejected, tries).padEnd(9),
    (built ? (open / built).toFixed(1) : 'n/a').padEnd(11),
    (built ? (mirrors / built).toFixed(1) : 'n/a').padEnd(8),
    (built ? (beam / built).toFixed(1) : 'n/a').padEnd(11),
    `${slowest} ms`,
  ];
  console.log(row.join(' '));
  if (failed) console.log(`  ${failed} seeds failed to build`);
}
