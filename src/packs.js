// Lantern Drift: the level ladder (milestone 4, route cap in milestone 6).
// The ladder is a fixed list of tiers. Each tier has three levels, and level n uses
// seed n on the tier it falls in. Bigger boards and more lanterns come later, so the
// curve goes up. Tier numbers come from tools/pack-check.js (every seed in the ladder builds).
// The deep tiers add walls and a route cap (milestone 6): without them most boards from 6x6
// up have hundreds of beam routes (tools/route-dist.js). The first three tiers stay open.
const WALLS_AND_CAP = { pWall: 0.4, maxRoutes: 8 };
export const TIERS = [
  { name: 'first light', width: 4, height: 4, lanterns: 2 },
  { name: 'dusk', width: 5, height: 5, lanterns: 2 },
  { name: 'night', width: 5, height: 5, lanterns: 3 },
  { name: 'deep', width: 6, height: 6, lanterns: 3, ...WALLS_AND_CAP },
  { name: 'midnight', width: 6, height: 6, lanterns: 4, ...WALLS_AND_CAP },
  { name: 'abyss', width: 7, height: 7, lanterns: 4, ...WALLS_AND_CAP },
];
export const LEVELS_PER_TIER = 3;
export const LEVEL_COUNT = TIERS.length * LEVELS_PER_TIER;

// The settings for ladder level n (1-based). Out-of-range numbers are clamped.
export function levelSettings(n) {
  const level = Math.min(Math.max(1, Math.floor(n) || 1), LEVEL_COUNT);
  const tierIndex = Math.floor((level - 1) / LEVELS_PER_TIER);
  const { name, ...board } = TIERS[tierIndex];
  return { seed: level, ...board, level, tier: name };
}
