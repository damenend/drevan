const levelXpCosts = [60, 150, 270, 420, 600, 810, 1050, 1320, 1620] as const;

export const statAllocations = {
  strength: { label: "+1 Strength", amount: 1 },
  speed: { label: "+1 Speed", amount: 1 },
  maxHp: { label: "+3 max HP", amount: 3 },
} as const;

type AllocationStat = keyof typeof statAllocations;

export function isAllocationStat(value: unknown): value is AllocationStat {
  return typeof value === "string" && Object.hasOwn(statAllocations, value);
}

/**
 * Derives level, XP toward the next level, and spendable points from lifetime XP.
 * Each level-up deducts its cost from the displayed progress and grants one
 * point. Excess XP carries over, and nextLevelXp is null at the cap.
 */
export function getProgression(exp: number, spent = 0) {
  let level = 1;
  let currentLevelXp = exp;
  for (const cost of levelXpCosts) {
    if (currentLevelXp < cost) break;
    currentLevelXp -= cost;
    level++;
  }

  return {
    level,
    currentLevelXp,
    nextLevelXp: levelXpCosts[level - 1] ?? null,
    unspentPoints: Math.max(0, level - 1 - spent),
  };
}
