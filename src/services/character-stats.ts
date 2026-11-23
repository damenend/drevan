import { sql, type SQLWrapper } from "drizzle-orm";

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

/** Agility currently contributes one-for-one to combat Speed. */
export function getAgility(player: { agility: number; agilityPoints: number }) {
  return player.agility + player.agilityPoints;
}

/** Adds allocated points to base attributes before applying equipment. */
export function getPrimaryAttributes(player: AttributeBases & AttributePoints) {
  return {
    strength: player.strength + player.strengthPoints,
    agility: getAgility(player),
    intellect: player.intellect + player.intellectPoints,
    fortitude: player.fortitude + player.fortitudePoints,
  };
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
