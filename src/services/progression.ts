const levelThresholds = [0, 60, 150, 270] as const;

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
 * Derives the prototype level and spendable points from lifetime XP.
 * Each level after the first grants one point up to the current level cap.
 */
export function getProgression(exp: number, spent = 0) {
  const level = levelThresholds.filter((threshold) => exp >= threshold).length;
  return {
    level,
    nextLevelXp: levelThresholds[level] ?? null,
    unspentPoints: Math.max(0, level - 1 - spent),
  };
}
