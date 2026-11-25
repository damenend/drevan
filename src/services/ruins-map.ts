import type { RuinsEnemyId } from "./ruins-loot";
import type { Combatant } from "./battle";

export const RUINS_SIZE = 7;
export const RUINS_ENTRANCE = 0;
export const RECALL_BEACON = "Recall Beacon";

type RuinsEncounter = {
  enemyId: RuinsEnemyId;
  enemy: Combatant;
  goldReward: { min: number; max: number };
  xpReward: number;
  trainingLevel: number;
  description: string;
};

function tile(x: number, y: number) {
  return y * RUINS_SIZE + x;
}

export const RUINS_NEXT_FLOOR = tile(2, 0);

const encounters: ReadonlyMap<number, RuinsEncounter> = new Map([
  [
    tile(2, 1),
    {
      enemyId: "vault-scavenger",
      enemy: {
        name: "Vault Scavenger",
        hp: 18,
        attackPower: 4,
        speed: 4,
        defense: 0,
      },
      xpReward: 30,
      goldReward: {
        min: 25,
        max: 35,
      },
      trainingLevel: 3,
      description:
        "Claws rake through a heap of wiring. The scavenger pauses when you draw near.",
    },
  ],
  [
    tile(4, 3),
    {
      enemyId: "fractured-sentinel",
      enemy: {
        name: "Fractured Sentinel",
        hp: 24,
        attackPower: 5,
        speed: 5,
        defense: 2,
      },
      xpReward: 40,
      goldReward: {
        min: 35,
        max: 45,
      },
      trainingLevel: 4,
      description:
        "The damaged sentinel turns with a scrape of metal. Its red eye follows you.",
    },
  ],
  [
    tile(6, 6),
    {
      enemyId: "alloy-warden",
      enemy: {
        name: "Alloy Warden",
        hp: 28,
        attackPower: 6,
        speed: 6,
        defense: 2,
      },
      xpReward: 50,
      goldReward: {
        min: 45,
        max: 55,
      },
      trainingLevel: 5,
      description:
        "The warden stands before the buried vault. Its armor shifts as it turns toward you.",
    },
  ],
]);

export const ruinsEnemies = Array.from(encounters.values());

/** Returns the fixed encounter for a tile, or undefined for an empty tile. */
export function getRuinsEncounter(
  position: number,
): RuinsEncounter | undefined {
  return encounters.get(position);
}

/** Checks whether a destination is inside the grid and next to a valid saved tile. */
export function canMoveInRuins(from: number, to: number): boolean {
  if (!Number.isInteger(to) || to < 0 || to >= RUINS_SIZE ** 2) return false;

  const dx = Math.abs((from % RUINS_SIZE) - (to % RUINS_SIZE));
  const dy = Math.abs(
    Math.floor(from / RUINS_SIZE) - Math.floor(to / RUINS_SIZE),
  );
  return dx + dy === 1;
}
