import type { Combatant } from "./battle";
import type { RuinsEnemyId } from "./ruins-loot";

export const RUINS_SIZE = 7;
export const RUINS_ENTRANCE = 0;
export const RECALL_BEACON = "Recall Beacon";

export type RuinsEncounter = {
  enemyId: RuinsEnemyId;
  enemy: Combatant;
  goldReward: { min: number; max: number };
  xpReward: number;
  trainingLevel: number;
  description: string;
};

export type RuinsEnemy = { enemyId: RuinsEnemyId; tile: number };

function tile(x: number, y: number) {
  return y * RUINS_SIZE + x;
}

export const RUINS_NEXT_FLOOR = tile(2, 0);

export const ruinsEncounterDefinitions: Readonly<
  Record<RuinsEnemyId, RuinsEncounter>
> = {
  "vault-scavenger": {
    enemyId: "vault-scavenger",
    enemy: {
      name: "Vault Scavenger",
      hp: 18,
      attackPower: 4,
      speed: 4,
      defense: 0,
    },
    xpReward: 30,
    goldReward: { min: 25, max: 35 },
    trainingLevel: 3,
    description:
      "Claws rake through a heap of wiring. The scavenger pauses when you draw near.",
  },
  "fractured-sentinel": {
    enemyId: "fractured-sentinel",
    enemy: {
      name: "Fractured Sentinel",
      hp: 24,
      attackPower: 5,
      speed: 5,
      defense: 2,
    },
    xpReward: 40,
    goldReward: { min: 35, max: 45 },
    trainingLevel: 4,
    description:
      "The damaged sentinel turns with a scrape of metal. Its red eye follows you.",
  },
  "alloy-warden": {
    enemyId: "alloy-warden",
    enemy: {
      name: "Alloy Warden",
      hp: 28,
      attackPower: 6,
      speed: 6,
      defense: 2,
    },
    xpReward: 50,
    goldReward: { min: 45, max: 55 },
    trainingLevel: 5,
    description:
      "The warden stands before the buried vault. Its armor shifts as it turns toward you.",
  },
};

export const ruinsEnemies = Object.values(ruinsEncounterDefinitions);
export const RUINS_ENEMY_DENSITY = 0.25;

/** Floor-specific relative weights; dangerous enemies are progressively rarer. */
export const RUINS_ENCOUNTER_WEIGHTS: Readonly<Record<RuinsEnemyId, number>> = {
  "vault-scavenger": 6,
  "fractured-sentinel": 3,
  "alloy-warden": 1,
};

export function getRuinsEncounter(enemyId: RuinsEnemyId) {
  return ruinsEncounterDefinitions[enemyId];
}

export function getRuinsEnemy(enemies: RuinsEnemy[] | null, position: number) {
  return enemies?.find(({ tile }) => tile === position);
}

function weightedEnemy(random: () => number): RuinsEnemyId {
  const entries = Object.entries(RUINS_ENCOUNTER_WEIGHTS) as [
    RuinsEnemyId,
    number,
  ][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [enemyId, weight] of entries) {
    roll -= weight;
    if (roll < 0) return enemyId;
  }
  return entries.at(-1)![0];
}

/** Generates a finite Floor 1 population on distinct, traversable tiles. */
export function generateRuinsEnemies(random = Math.random): RuinsEnemy[] {
  const available = Array.from(
    { length: RUINS_SIZE ** 2 },
    (_, position) => position,
  ).filter(
    (position) => position !== RUINS_ENTRANCE && position !== RUINS_NEXT_FLOOR,
  );
  const count = Math.round(available.length * RUINS_ENEMY_DENSITY);
  return Array.from({ length: count }, () => {
    const [position] = available.splice(
      Math.floor(random() * available.length),
      1,
    );
    return { tile: position, enemyId: weightedEnemy(random) };
  });
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
