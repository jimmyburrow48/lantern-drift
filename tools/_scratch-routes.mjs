import { generateLevel, countSolutions } from '../src/generate.js';
import { countRoutes } from '../src/solve.js';
import { TIERS } from '../src/packs.js';
console.log(countRoutes(">L.."), countRoutes(">L.\n..."), countRoutes(">.\n.L"));
// small cross-check: routes <= full layouts
for (let seed = 1; seed <= 60; seed++) {
  const lv = generateLevel({ seed, width: 3, height: 4, lanterns: 1 });
  const r = countRoutes(lv.text);
  const s = countSolutions(lv.text, 12);
  if (s !== null && r > s) console.log('BAD', seed, r, s);
}
console.log('cross-check ok');
for (const tier of TIERS) {
  const hist = {};
  let budget = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const lv = generateLevel({ seed, width: tier.width, height: tier.height, lanterns: tier.lanterns });
    const r = countRoutes(lv.text, { maxNodes: 2000000 });
    if (r === null) budget++;
    hist[r] = (hist[r] ?? 0) + 1;
  }
  console.log(tier.name, JSON.stringify(hist), 'over budget', budget);
}
