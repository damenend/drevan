import { sql, type SQLWrapper } from "drizzle-orm";
import type { CharacterClass } from "../db/schema";

// Leave room for critical and passive damage bonuses in integer calculations.
export const MAX_ATTACK_POWER = Math.floor(Number.MAX_SAFE_INTEGER / 2);

export const HP_PER_FORTITUDE = 3;
export const STARTING_FORTITUDE = 5;
const MINIMUM_MAX_HP = 10;
export const STARTING_HP =
  MINIMUM_MAX_HP + STARTING_FORTITUDE * HP_PER_FORTITUDE;

type AttributePoints = {
  strengthPoints: number;
  agilityPoints: number;
  intellectPoints: number;
  fortitudePoints: number;
  speedPoints: number;
};

type AttributeBases = {
  strength: number;
  agility: number;
  intellect: number;
  fortitude: number;
  speed: number;
};

type OffensiveAttribute = "strength" | "agility" | "intellect";

export const classPrimaryStats = {
  unaligned: null,
  melee: "strength",
  ranged: "agility",
  caster: "intellect",
} as const satisfies Record<CharacterClass, OffensiveAttribute | null>;

type AttackPowerStats = Pick<AttributeBases, OffensiveAttribute> & {
  characterClass: CharacterClass;
};

/** Adds allocated points to base attributes before applying equipment. */
export function getPrimaryAttributes(player: AttributeBases & AttributePoints) {
  return {
    strength: player.strength + player.strengthPoints,
    agility: player.agility + player.agilityPoints,
    intellect: player.intellect + player.intellectPoints,
    fortitude: player.fortitude + player.fortitudePoints,
    speed: player.speed + player.speedPoints,
  };
}

/**
 * Converts offensive attribute totals to base Attack Power. An aligned
 * character gains two additional contributions from their class's primary
 * attribute: Strength for Vanguard, Agility for Ranger, or Intellect for
 * Arcanist. Stored class identifiers remain internal implementation details.
 */
export function getBaseAttackPower(stats: AttackPowerStats) {
  const primaryStat = classPrimaryStats[stats.characterClass];
  const classBonus = primaryStat ? stats[primaryStat] * 2 : 0;

  return Math.min(
    MAX_ATTACK_POWER,
    stats.strength + stats.agility + stats.intellect + classBonus,
  );
}

/** Counts spent attribute points across all five allocatable stats. */
export function getSpentPoints(player: AttributePoints) {
  return (
    player.strengthPoints +
    player.agilityPoints +
    player.intellectPoints +
    player.fortitudePoints +
    player.speedPoints
  );
}

/** Builds a SQL health cap expression from total Fortitude, including spent AP. */
export function maximumHp(fortitude: SQLWrapper | number) {
  return sql<number>`(${MINIMUM_MAX_HP} + ${fortitude} * ${HP_PER_FORTITUDE})`;
}

/** Calculates the same maximum HP rule for an already loaded Fortitude value. */
export function getMaximumHp(fortitude: number) {
  return MINIMUM_MAX_HP + fortitude * HP_PER_FORTITUDE;
}
