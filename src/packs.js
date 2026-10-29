// Lantern Drift: the level ladder (milestone 4).
// The ladder is a fixed list of tiers. Each tier has three levels, and level n uses
// seed n on the tier it falls in. Bigger boards and more lanterns come later, so the
// curve goes up. Tier numbers come from tools/pack-check.js (every seed in the ladder builds).
export const TIERS = [
  { name: 'first light', width: 4, height: 4, lanterns: 2 },
  { name: 'dusk', width: 5, height: 5, lanterns: 2 },
  { name: 'night', width: 5, height: 5, lanterns: 3 },
  { name: 'deep', width: 6, height: 6, lanterns: 3 },
  { name: 'midnight', width: 6, height: 6, lanterns: 4 },
  { name: 'abyss', width: 7, height: 7, lanterns: 4 },
];
export const LEVELS_PER_TIER = 3;
export const LEVEL_COUNT = TIERS.length * LEVELS_PER_TIER;

// The settings for ladder level n (1-based). Out-of-range numbers are clamped.
export function levelSettings(n) {
  const level = Math.min(Math.max(1, Math.floor(n) || 1), LEVEL_COUNT);
  const tierIndex = Math.floor((level - 1) / LEVELS_PER_TIER);
  const tier = TIERS[tierIndex];
  return {
    seed: level,
    width: tier.width,
    height: tier.height,
    lanterns: tier.lanterns,
    level,
    tier: tier.name,
  };
}
