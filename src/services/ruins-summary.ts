import { getProgression } from "./progression";
import {
  RECALL_BEACON,
  RUINS_ENTRANCE,
  RUINS_NEXT_FLOOR,
  RUINS_SIZE,
} from "./ruins-map";

export type RuinsSummaryItem = {
  id: number;
  name: string;
  image: string | null;
  quantity: number;
};

export type RuinsExpeditionStats = {
  goldAcquired: number;
  xpGained: number;
  itemsAcquired: RuinsSummaryItem[];
  levelsGained: number;
  enemiesEncountered: number;
  enemiesDefeated: number;
  discoveriesMade: number;
  hpLost: number;
  consumablesUsed: RuinsSummaryItem[];
};

export type RuinsExpeditionOutcome = "exit" | "recall" | "defeat" | "draw";

export type RuinsExpeditionSummary = RuinsExpeditionStats & {
  outcome: RuinsExpeditionOutcome;
  tilesExplored: number;
  totalTiles: number;
  remainingHp: number;
  maximumHp: number;
};

export const RUINS_EXPLORABLE_TILES = RUINS_SIZE ** 2 - 2;

export function emptyRuinsStats(): RuinsExpeditionStats {
  return {
    goldAcquired: 0,
    xpGained: 0,
    itemsAcquired: [],
    levelsGained: 0,
    enemiesEncountered: 0,
    enemiesDefeated: 0,
    discoveriesMade: 0,
    hpLost: 0,
    consumablesUsed: [],
  };
}

/** Returns a new grouped list, adding the quantity to an existing item ID. */
export function addSummaryItem(
  entries: RuinsSummaryItem[],
  item: RuinsSummaryItem,
) {
  const existing = entries.find(({ id }) => id === item.id);
  return existing
    ? entries.map((entry) =>
        entry.id === item.id
          ? { ...entry, quantity: entry.quantity + item.quantity }
          : entry,
      )
    : [...entries, item];
}

/** Counts level boundaries crossed by this award without relying on ending XP. */
export function levelsGained(startingXp: number, xpGained: number) {
  return (
    getProgression(startingXp + xpGained).level -
    getProgression(startingXp).level
  );
}

/** Counts unique Floor 1 exploration tiles, excluding entrance and sealed stairs. */
export function countExploredRuinsTiles(tiles: number[] | null) {
  return Math.max(
    0,
    new Set(tiles ?? []).size -
      Number(tiles?.includes(RUINS_ENTRANCE) ?? false) -
      Number(tiles?.includes(RUINS_NEXT_FLOOR) ?? false),
  );
}

export const recallBeaconSummaryItem = (id: number, image: string | null) => ({
  id,
  name: RECALL_BEACON,
  image,
  quantity: 1,
});
