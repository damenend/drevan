import { and, asc, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { effectiveMaxHp, inventory, items, users } from "../db/schema";
import {
  equipmentSlots,
  getEquipmentColumn,
  type EquipmentOwner,
} from "./equipment";
import { applyItemEffect } from "./items";
import { addSummaryItem, emptyRuinsStats } from "./ruins-summary";
import { getProgression } from "./progression";

/** Lists stacks by item name. Quantities include equipped copies. */
export function getPlayerInventory(userId: number) {
  return db
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      image: items.image,
      sellPrice: items.sellPrice,
      type: items.type,
      quantity: inventory.quantity,
      effect: items.effect,
      effectValue: items.effectValue,
      level: items.level,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.userId, userId), gt(inventory.quantity, 0)))
    .orderBy(asc(items.name))
    .all();
}

function inventoryStack(userId: number, itemId: number) {
  return and(eq(inventory.userId, userId), eq(inventory.itemId, itemId));
}

function findOwnedItem(
  database: Pick<typeof db, "select">,
  userId: number,
  itemId: number,
) {
  return database
    .select({
      id: items.id,
      name: items.name,
      image: items.image,
      type: items.type,
      effect: items.effect,
      effectValue: items.effectValue,
      level: items.level,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(inventoryStack(userId, itemId), gt(inventory.quantity, 0)))
    .get();
}

/**
 * Adds a positive whole quantity and returns true only when the full grant
 * was saved. Pass the transaction that is saving the purchase or reward.
 */
export function grantInventoryItem(
  database: Pick<typeof db, "insert">,
  userId: number,
  itemId: number,
  quantity = 1,
) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError("Inventory grants require a positive whole quantity");
  }

  return (
    database
      .insert(inventory)
      .values({ userId, itemId, quantity })
      .onConflictDoUpdate({
        target: [inventory.userId, inventory.itemId],
        set: { quantity: sql`${inventory.quantity} + ${quantity}` },
        setWhere: lte(inventory.quantity, Number.MAX_SAFE_INTEGER - quantity),
      })
      .run().changes === 1
  );
}

/**
 * Applies a consumable and removes one copy in the same transaction.
 * Returns null when no effect was saved.
 */
export function useInventoryItem(userId: number, itemId: number) {
  return db.transaction(
    (tx) => {
      const playerFilter = eq(users.id, userId);
      const player = tx
        .select({
          hp: users.hp,
          maxHp: effectiveMaxHp,
          ruinsTile: users.ruinsTile,
          ruinsStats: users.ruinsStats,
        })
        .from(users)
        .where(playerFilter)
        .get();
      if (!player) return null;

      const item = findOwnedItem(tx, userId, itemId);
      if (
        item?.type !== "consumable" ||
        !item.effect ||
        item.effectValue === null
      ) {
        return null;
      }

      const canUseItem =
        item.effect === "heal"
          ? player.hp > 0
          : item.effect === "revive"
            ? player.hp === 0
            : player.ruinsTile === null;
      if (!canUseItem) return null;

      const result = applyItemEffect(player, item.effect, item.effectValue);
      if (!result) return null;

      const stack = inventoryStack(userId, itemId);
      const consumed = tx
        .update(inventory)
        .set({ quantity: sql`${inventory.quantity} - 1` })
        .where(and(stack, gt(inventory.quantity, 0)))
        .run();
      if (consumed.changes !== 1) return null;

      const ruinsStats =
        player.ruinsTile === null
          ? undefined
          : {
              ...(player.ruinsStats ?? emptyRuinsStats()),
              consumablesUsed: addSummaryItem(
                player.ruinsStats?.consumablesUsed ?? [],
                {
                  id: item.id,
                  name: item.name,
                  image: item.image,
                  quantity: 1,
                },
              ),
            };
      tx.update(users)
        .set({ hp: result.hp, ...(ruinsStats && { ruinsStats }) })
        .where(playerFilter)
        .run();
      tx.delete(inventory)
        .where(and(stack, eq(inventory.quantity, 0)))
        .run();
      return result;
    },
    { behavior: "immediate" },
  );
}

/** Reserves a copy of owned gear outside The Ruins. */
export function equipInventoryItem(userId: number, itemId: number) {
  return db.transaction(
    (tx) => {
      const item = findOwnedItem(tx, userId, itemId);
      if (!item) return "missing";

      const column = getEquipmentColumn(item.type);
      if (!column) return "unsupported";

      const player = tx
        .select({ exp: users.exp, ruinsTile: users.ruinsTile })
        .from(users)
        .where(eq(users.id, userId))
        .get();
      if (!player) return "missing";
      if (player.ruinsTile !== null) return "in-expedition";
      if (
        item.level !== null &&
        getProgression(player.exp).level < item.level
      ) {
        return "level";
      }

      const equipped = tx
        .update(users)
        .set({ [column]: itemId })
        .where(and(eq(users.id, userId), isNull(users.ruinsTile)))
        .run();

      return equipped.changes ? "equipped" : "in-expedition";
    },
    { behavior: "immediate" },
  );
}

/** Clears the slot only if it still holds this item and the player is outside The Ruins. */
export function unequipInventoryItem(
  player: EquipmentOwner & { id: number },
  itemId: number,
) {
  const column = Object.values(equipmentSlots).find(
    (key) => player[key] === itemId,
  );
  if (!column) return "missing";

  const unequipped = db
    .update(users)
    .set({ [column]: null })
    .where(
      and(
        eq(users.id, player.id),
        eq(users[column], itemId),
        isNull(users.ruinsTile),
      ),
    )
    .run();

  return unequipped.changes ? "unequipped" : "changed";
}
