import { LESSER_POTION } from "../db/ruins-loot-catalog";
import {
  getRuinsEncounter,
  RUINS_ENTRANCE,
  RUINS_NEXT_FLOOR,
  RUINS_SIZE,
} from "./ruins-map";

export const discoveryDefinitions = {
  "gold-cache": {
    kind: "gold",
    amount: 8,
    description: "Old coins lie wedged beneath a loose slab.",
  },
  "potion-cache": {
    kind: "item",
    item: LESSER_POTION,
    quantity: 1,
    description: "A sealed bottle survived inside a cracked supply case.",
  },
} as const;

type DiscoveryId = keyof typeof discoveryDefinitions;

export type RuinsDiscovery = {
  id: DiscoveryId;
  tile: number;
  claimed: boolean;
};

const floorDiscoveries: readonly DiscoveryId[] = ["gold-cache", "potion-cache"];

/** Samples distinct tiles from Floor 1's fully connected, walkable grid. */
export function generateRuinsDiscoveries(
  random = Math.random,
): RuinsDiscovery[] {
  const available = Array.from(
    { length: RUINS_SIZE ** 2 },
    (_, tile) => tile,
  ).filter(
    (tile) =>
      tile !== RUINS_ENTRANCE &&
      tile !== RUINS_NEXT_FLOOR &&
      !getRuinsEncounter(tile),
  );

  return floorDiscoveries.map((id) => {
    const [tile] = available.splice(Math.floor(random() * available.length), 1);
    return { id, tile, claimed: false };
  });
}

/** Reads only the discovery on the player's current or destination tile. */
export function getRuinsDiscovery(
  discoveries: RuinsDiscovery[] | null,
  tile: number | null,
) {
  return discoveries?.find((discovery) => discovery.tile === tile);
}

export function describeRuinsDiscovery(discovery: RuinsDiscovery) {
  const { description } = discoveryDefinitions[discovery.id];
  const status = discovery.claimed
    ? "You already collected this cache."
    : "Return to this square to try again.";
  return `${description} ${status}`;
}
