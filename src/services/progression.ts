import { HP_PER_FORTITUDE } from "./character-stats";
import type { CharacterClass } from "../db/schema";

export const MAX_PLAYER_LEVEL = 100;

const levelXpCosts = Array.from(
  { length: MAX_PLAYER_LEVEL - 1 },
  (_, index) => {
    const currentLevel = index + 1;
    return 15 * currentLevel * (currentLevel + 3);
  },
);

export const statAllocations = {
  strength: { label: "+1 Strength (+1 Attack Power)" },
  agility: { label: "+1 Agility (+1 Attack Power)" },
  intellect: { label: "+1 Intellect (+1 Attack Power)" },
  speed: { label: "+1 Speed" },
  fortitude: { label: `+1 Fortitude (+${HP_PER_FORTITUDE} max HP)` },
} as const;

type AllocationStat = keyof typeof statAllocations;

const classPrimaryStats: Record<
  CharacterClass,
  "strength" | "agility" | "intellect" | null
> = {
  unaligned: null,
  melee: "strength",
  ranged: "agility",
  caster: "intellect",
};

/** Labels allocation choices with the Attack Power granted by the player's class. */
export function getStatAllocations(characterClass: CharacterClass) {
  const primaryStat = classPrimaryStats[characterClass];

  return Object.fromEntries(
    Object.entries(statAllocations).map(([stat, option]) => [
      stat,
      stat === primaryStat
        ? { label: option.label.replace("+1 Attack Power", "+3 Attack Power") }
        : option,
    ]),
  ) as Record<AllocationStat, { label: string }>;
}

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
