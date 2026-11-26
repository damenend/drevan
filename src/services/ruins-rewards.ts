import { eq, inArray } from "drizzle-orm";
import type { db } from "../db";
import { items, type users } from "../db/schema";
import { formatNumber } from "../utils/format-number";
import { getGameDate } from "../utils/game-date";
import { grantInventoryItem } from "./inventory";
import {
  describeRuinsDiscovery,
  discoveryDefinitions,
  getRuinsDiscovery,
} from "./ruins-discoveries";
import { rollRuinsLoot, type RuinsEnemyId } from "./ruins-loot";

type RewardDatabase = Pick<typeof db, "select" | "insert">;
type GoldCacheState = Pick<
  typeof users.$inferSelect,
  "gold" | "ruinsGoldClaimDate"
>;
type DiscoveryPlayer = GoldCacheState &
  Pick<typeof users.$inferSelect, "id" | "ruinsDiscoveries">;
type AwardedItem = {
  id: number;
  name: string;
  image: string | null;
  quantity: number;
};
type CacheAward = {
  message: string;
  granted: boolean;
  goldChanges?: GoldCacheState;
  awardedGold?: number;
  awardedItem?: AwardedItem;
};

function awardGoldCache(player: GoldCacheState, amount: number): CacheAward {
  const today = getGameDate();
  if (player.ruinsGoldClaimDate === today) {
    return {
      granted: false,
      message: "You can claim another gold cache after midnight Central time.",
    };
  }

  const awarded = Math.min(amount, Number.MAX_SAFE_INTEGER - player.gold);
  if (awarded <= 0) {
    return { granted: false, message: "You cannot carry any more gold." };
  }
  return {
    granted: true,
    goldChanges: { gold: player.gold + awarded, ruinsGoldClaimDate: today },
    awardedGold: awarded,
    message: `You collect ${formatNumber(awarded)} gold.`,
  };
}

function awardItemCache(
  database: RewardDatabase,
  userId: number,
  definition: { item: string; quantity: number },
): CacheAward {
  const { item: name, quantity } = definition;
  const item = database
    .select({ id: items.id, image: items.image })
    .from(items)
    .where(eq(items.name, name))
    .get();
  if (!item) {
    return {
      granted: false,
      message: "This discovery is currently unavailable.",
    };
  }
  if (!grantInventoryItem(database, userId, item.id, quantity)) {
    return {
      granted: false,
      message: "You cannot carry any more of this item.",
    };
  }
  return {
    granted: true,
    awardedItem: { id: item.id, name, image: item.image, quantity },
    message: `You collect ${formatNumber(quantity)} × ${name}.`,
  };
}

/**
 * Resolves the destination's cache. Item grants use the caller's transaction.
 * Save the returned changes with the move. A refused award leaves the cache
 * available for a later visit.
 */
export function claimRuinsDiscovery(
  database: RewardDatabase,
  player: DiscoveryPlayer,
  destination: number,
) {
  const discovery = getRuinsDiscovery(player.ruinsDiscoveries, destination);
  if (!discovery) return;
  if (discovery.claimed) return { message: describeRuinsDiscovery(discovery) };

  const definition = discoveryDefinitions[discovery.id];
  const award =
    definition.kind === "gold"
      ? awardGoldCache(player, definition.amount)
      : awardItemCache(database, player.id, definition);
  const message = `${definition.description} ${award.message}`;
  if (!award.granted) return { message };

  return {
    message,
    changes: {
      ...award.goldChanges,
      ruinsDiscoveries: player.ruinsDiscoveries?.map((entry) =>
        entry === discovery ? { ...entry, claimed: true } : entry,
      ),
    },
    awardedGold: award.awardedGold,
    awardedItem: award.awardedItem,
  };
}

/**
 * Rolls victory drops inside the caller's movement/fight transaction. The report lists
 * only catalog items that fit in inventory and were added successfully.
 */
export function grantRuinsLoot(
  database: RewardDatabase,
  userId: number,
  enemyId: RuinsEnemyId,
) {
  const drops = rollRuinsLoot(enemyId);
  const awarded: AwardedItem[] = [];
  if (drops.length === 0) return awarded;

  const catalog = database
    .select({ id: items.id, name: items.name, image: items.image })
    .from(items)
    .where(
      inArray(
        items.name,
        drops.map(({ item }) => item),
      ),
    )
    .all();
  const catalogByName = new Map(catalog.map((item) => [item.name, item]));

  for (const { item, quantity } of drops) {
    const catalogItem = catalogByName.get(item);
    if (
      catalogItem &&
      grantInventoryItem(database, userId, catalogItem.id, quantity)
    ) {
      awarded.push({ ...catalogItem, quantity });
    }
  }
  return awarded;
}
