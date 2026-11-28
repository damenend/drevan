import type { CharacterClass } from "../db/schema";

const ironResolvePercent = 10;
const precisionPoints = 5;
const arcaneSurgeChancePercent = 10;
const arcaneSurgeDamagePercent = 25;

export const classPassives = {
  unaligned: undefined,
  melee: {
    id: "iron-resolve",
    name: "Iron Resolve",
    flavor: "The Vanguard endures where others falter.",
    description: `Reduces incoming attack damage by ${ironResolvePercent}% after Defense.`,
    damageReduction: ironResolvePercent / 100,
  },
  ranged: {
    id: "precision",
    name: "Precision",
    flavor: "Every opening is an opportunity.",
    description: `Increases critical strike chance by ${precisionPoints} percentage points.`,
    criticalChanceBonus: precisionPoints / 100,
  },
  caster: {
    id: "arcane-surge",
    name: "Arcane Surge",
    flavor:
      "Even the smallest fracture in reality can unleash tremendous power.",
    description: `Each hit has a ${arcaneSurgeChancePercent}% chance to deal ${arcaneSurgeDamagePercent}% additional damage.`,
    chance: arcaneSurgeChancePercent / 100,
    damageBonus: arcaneSurgeDamagePercent / 100,
  },
} as const satisfies Record<CharacterClass, object | undefined>;

export type ClassPassive = NonNullable<(typeof classPassives)[CharacterClass]>;
