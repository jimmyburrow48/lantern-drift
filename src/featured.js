// Lantern Drift: featured levels (milestone 5).
// Two ladder-shaped boards that the route counter (src/solve.js) checked by hand. Each one
// is a seed the generator builds with the tier's settings, so the share link opens the same
// board: #seed=<seed>&w=<width>&h=<height>&l=<lanterns>. The routes are the counts from
// countRoutes, not the generator's answer key. Neither board is in the ladder (levels 1 to 18).
// Not featured: dusk, deep, midnight and abyss. In 200 seeds each, no board of those tiers
// needed two or more mirrors on every route and had fewer than 12 routes.
export const FEATURED = [
  {
    name: 'first light, forced route',
    seed: 157,
    width: 4,
    height: 4,
    lanterns: 2,
    routes: 1,
    text: ['.#.L', '#.L.', '.#.<', '....'].join('\n'),
    note: 'one route: the beam must turn at the emitter row, then once more at the top row.',
  },
  {
    name: 'night, three routes',
    seed: 165,
    width: 5,
    height: 5,
    lanterns: 3,
    routes: 3,
    text: ['.....', '>L.L#', '.#..L', '..#..', '.#...'].join('\n'),
    note: 'three routes: all of them start with the same three mirrors, then part ways near the right edge.',
  },
];
