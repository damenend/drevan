import { Router, type Response } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../../db";
import { effectiveMaxHp, users, items, inventory } from "../../db/schema";
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

function redirectHome(res: Response, message: string) {
  return res.redirect(`/game?message=${encodeURIComponent(message)}`);
}

// Use an inventory item
router.post("/use", (req, res) => {
  const player = res.locals.user;
  const itemId = parseFormInteger(req.body?.itemId);

  if (itemId === null || itemId <= 0) {
    return res.redirect("/game");
  }

  const result = db.transaction((tx) => {
    // Fetch the player's current stats inside the transaction
    const currentPlayer = tx
      .select({ hp: users.hp, maxHp: effectiveMaxHp })
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
      .where(and(inventoryEntry(player.id, itemId), gt(inventory.quantity, 0)))
      .run();

    if (consumed.changes !== 1) {
      tx.rollback();
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
      .where(and(inventoryEntry(player.id, itemId), eq(inventory.quantity, 0)))
      .run();

    return effectResult;
  });

  return redirectHome(res, result?.message ?? "No effect");
});

router.post("/equip", (req, res) => {
  const player = res.locals.user;
  const itemId = parseFormInteger(req.body?.itemId);

  if (itemId === null || itemId <= 0) {
    return redirectHome(res, "Invalid item.");
  }

  const message = db.transaction(
    (tx) => {
      const ownedItem = findOwnedItem(tx, player.id, itemId);

      if (!ownedItem) {
        return "Item not found in inventory.";
      }

      if (ownedItem.type === "weapon") {
        tx.update(users)
          .set({ equippedWeaponId: itemId })
          .where(eq(users.id, player.id))
          .run();
      } else if (ownedItem.type === "armor") {
        tx.update(users)
          .set({ equippedArmorId: itemId })
          .where(eq(users.id, player.id))
          .run();
      } else {
        return "This item cannot be equipped.";
      }

      return "Item equipped.";
    },
    // Keep the ownership check and equip write together if a sale is in progress.
    { behavior: "immediate" },
  );

  return redirectHome(res, message);
});

router.post("/unequip", (req, res) => {
  const player = res.locals.user;
  const itemId = parseFormInteger(req.body?.itemId);

  if (itemId === null || itemId <= 0) {
    return redirectHome(res, "Invalid item.");
  }

  if (player.equippedWeaponId === itemId) {
    db.update(users)
      .set({ equippedWeaponId: null })
      .where(eq(users.id, player.id))
      .run();
  } else if (player.equippedArmorId === itemId) {
    db.update(users)
      .set({ equippedArmorId: null })
      .where(eq(users.id, player.id))
      .run();
  } else {
    return redirectHome(res, "Item is not equipped.");
  }

  return redirectHome(res, "Item unequipped.");
});

export default router;
