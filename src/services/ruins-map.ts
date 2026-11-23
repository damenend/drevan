import type { Combatant } from "./battle";

export const RUINS_SIZE = 7;
export const RUINS_ENTRANCE = 0;
export const RECALL_BEACON = "Recall Beacon";

type RuinsEncounter =
  | { kind: "gold"; amount: number; description: string }
  | { kind: "item"; item: string; description: string }
  | {
      kind: "enemy";
      enemy: Combatant;
      reward: number;
      trainingLevel: number;
      description: string;
    };

function tile(x: number, y: number) {
  return y * RUINS_SIZE + x;
}

export const RUINS_NEXT_FLOOR = tile(2, 0);

const encounters: ReadonlyMap<number, RuinsEncounter> = new Map([
  [
    tile(1, 0),
    {
      kind: "gold",
      amount: 8,
      description: "You pry loose a cache of old coins.",
    },
  ],
  [
    tile(0, 2),
    {
      kind: "item",
      item: "Lesser Potion",
      description: "A sealed bottle survived inside a cracked supply case.",
    },
  ],
  [
    tile(2, 1),
    {
      kind: "enemy",
      enemy: {
        name: "Vault Scavenger",
        hp: 18,
        attackPower: 4,
        speed: 4,
        defense: 0,
      },
      reward: 30,
      trainingLevel: 3,
      description: "A clawed scavenger digs through a heap of ancient wiring.",
    },
  ],
  [
    tile(4, 3),
    {
      kind: "enemy",
      enemy: {
        name: "Fractured Sentinel",
        hp: 24,
        attackPower: 5,
        speed: 5,
        defense: 2,
      },
      reward: 40,
      trainingLevel: 4,
      description: "A damaged guardian tracks you with a flickering red eye.",
    },
  ],
  [
    tile(6, 6),
    {
      kind: "enemy",
      enemy: {
        name: "Alloy Warden",
        hp: 28,
        attackPower: 6,
        speed: 6,
        defense: 2,
      },
      reward: 50,
      trainingLevel: 5,
      description: "An armored warden stands watch over the buried vault.",
    },
  ],
]);

export const ruinsEnemies = Array.from(encounters.values()).filter(
  (encounter) => encounter.kind === "enemy",
);

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
