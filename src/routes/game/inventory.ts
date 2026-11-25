import { getAuthenticatedPlayer } from "../../middleware/auth";
import { Router, type Response } from "express";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../../db";
import { effectiveMaxHp, users, items, inventory } from "../../db/schema";
import { equipmentSlots, getEquipmentColumn } from "../../services/equipment";
import { applyItemEffect } from "../../services/items";

import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

function inventoryEntry(userId: number, itemId: number) {
  return and(eq(inventory.userId, userId), eq(inventory.itemId, itemId));
}

/**
 * Looks up an item with positive owned quantity using the caller's database
 * or transaction, so item use can check ownership within the same transaction
 * that consumes the item.
 */
function findOwnedItem(
  database: Pick<typeof db, "select">,
  userId: number,
  itemId: number,
) {
  return database
    .select({
      type: items.type,
      effect: items.effect,
      effectValue: items.effectValue,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(inventoryEntry(userId, itemId), gt(inventory.quantity, 0)))
    .get();
}

/** Returns to The Ruins during an expedition or The Quarters otherwise. */
function redirectHome(res: Response, message: string) {
  const path =
    getAuthenticatedPlayer(res).ruinsTile === null ? "/game" : "/game/ruins";
  return res.redirect(`${path}?message=${encodeURIComponent(message)}`);
}

// Use an inventory item
router.post("/use", (req, res) => {
  const player = getAuthenticatedPlayer(res);
  const itemId = parseFormInteger(req.body?.itemId);

  if (itemId === null || itemId <= 0) {
    return res.redirect(player.ruinsTile === null ? "/game" : "/game/ruins");
  }

  const result = db.transaction(
    (tx) => {
      // Fetch the player's current stats inside the transaction
      const currentPlayer = tx
        .select({
          hp: users.hp,
          maxHp: effectiveMaxHp,
          ruinsTile: users.ruinsTile,
        })
        .from(users)
        .where(eq(users.id, player.id))
        .get();

      if (!currentPlayer) {
        return null;
      }

      const ownedItem = findOwnedItem(tx, player.id, itemId);

      if (!ownedItem || ownedItem.type !== "consumable") {
        return null;
      }

      if (!ownedItem.effect || ownedItem.effectValue === null) {
        return null;
      }

      if (
        ownedItem.effect === "heal"
          ? currentPlayer.hp <= 0
          : currentPlayer.ruinsTile !== null
      ) {
        return null;
      }

      // Calculate the item's effect
      const effectResult = applyItemEffect(
        currentPlayer,
        ownedItem.effect,
        ownedItem.effectValue,
      );

      if (!effectResult) {
        return null;
      }

      // Consume one item
      const consumed = tx
        .update(inventory)
        .set({
          quantity: sql`${inventory.quantity} - 1`,
        })
        .where(
          and(inventoryEntry(player.id, itemId), gt(inventory.quantity, 0)),
        )
        .run();

      if (consumed.changes !== 1) {
        return null;
      }

      // Apply the effect to the player
      tx.update(users)
        .set({
          hp: effectResult.hp,
        })
        .where(eq(users.id, player.id))
        .run();

      // Remove inventory rows with zero quantity
      tx.delete(inventory)
        .where(
          and(inventoryEntry(player.id, itemId), eq(inventory.quantity, 0)),
        )
        .run();

      return effectResult;
    },
    { behavior: "immediate" },
  );

  return redirectHome(res, result?.message ?? "This item had no effect.");
});

router.post("/equip", (req, res) => {
  const player = getAuthenticatedPlayer(res);
  const itemId = parseFormInteger(req.body?.itemId);

  if (itemId === null || itemId <= 0) {
    return redirectHome(res, "Invalid item.");
  }

  const message = db.transaction(
    (tx) => {
      const ownedItem = findOwnedItem(tx, player.id, itemId);

      if (!ownedItem) {
        return "You do not have that item in your inventory.";
      }

      const slot = getEquipmentColumn(ownedItem.type);
      if (!slot) return "This item cannot be equipped.";

      const equipped = tx
        .update(users)
        .set({ [slot]: itemId })
        .where(and(eq(users.id, player.id), isNull(users.ruinsTile)))
        .run();

      return equipped.changes
        ? "Item equipped."
        : "Leave The Ruins to change equipment.";
    },
    // Keep the ownership check and equip write together if a sale is in progress.
    { behavior: "immediate" },
  );

  return redirectHome(res, message);
});

router.post("/unequip", (req, res) => {
  const player = getAuthenticatedPlayer(res);
  const itemId = parseFormInteger(req.body?.itemId);

  if (itemId === null || itemId <= 0) {
    return redirectHome(res, "Invalid item.");
  }

  const slot = Object.values(equipmentSlots).find(
    (key) => player[key] === itemId,
  );
  if (!slot) return redirectHome(res, "Item is not equipped.");

  const unequipped = db
    .update(users)
    .set({ [slot]: null })
    .where(
      and(
        eq(users.id, player.id),
        eq(users[slot], itemId),
        isNull(users.ruinsTile),
      ),
    )
    .run();

  return redirectHome(
    res,
    unequipped.changes
      ? "Item unequipped."
      : "Equipment changed. Try again outside The Ruins.",
  );
});

export default router;
