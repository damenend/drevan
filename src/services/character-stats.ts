import { sql, type SQLWrapper } from "drizzle-orm";

// Leave room for the 1.5× critical multiplier in integer damage calculations.
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
};

type AttributeBases = {
  strength: number;
  agility: number;
  intellect: number;
  fortitude: number;
};

/** Adds allocated points to base attributes before applying equipment. */
export function getPrimaryAttributes(player: AttributeBases & AttributePoints) {
  return {
    strength: player.strength + player.strengthPoints,
    agility: player.agility + player.agilityPoints,
    intellect: player.intellect + player.intellectPoints,
    fortitude: player.fortitude + player.fortitudePoints,
  };
}

/**
 * Converts offensive attribute totals, including allocated points, to base
 * Attack Power at one per point.
 */
export function getBaseAttackPower(
  attributes: Pick<AttributeBases, "strength" | "agility" | "intellect">,
) {
  return Math.min(
    MAX_ATTACK_POWER,
    attributes.strength + attributes.agility + attributes.intellect,
  );
}

/** Counts spent AP across all attributes. Each Fortitude purchase costs one AP. */
export function getSpentPoints(player: AttributePoints) {
  return (
    player.strengthPoints +
    player.agilityPoints +
    player.intellectPoints +
    player.fortitudePoints
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
