import { Router, type Response } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../../db";
import { users, items, inventory } from "../../db/schema";
import { applyItemEffect } from "../../services/items";

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
  const itemId = Number(req.body?.itemId);

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    return res.redirect("/game");
  }

  const result = db.transaction((tx) => {
    // Fetch the player's current stats inside the transaction
    const currentPlayer = tx
      .select({ hp: users.hp, maxHp: users.maxHp })
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
  const itemId = Number(req.body?.itemId);

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    return redirectHome(res, "Invalid item.");
  }

  const ownedItem = findOwnedItem(db, player.id, itemId);

  if (!ownedItem) {
    return redirectHome(res, "Item not found in inventory.");
  }

  if (ownedItem.type === "weapon") {
    db.update(users)
      .set({ equippedWeaponId: itemId })
      .where(eq(users.id, player.id))
      .run();
  } else if (ownedItem.type === "armor") {
    db.update(users)
      .set({ equippedArmorId: itemId })
      .where(eq(users.id, player.id))
      .run();
  } else {
    return redirectHome(res, "This item cannot be equipped.");
  }

  return redirectHome(res, "Item equipped.");
});

router.post("/unequip", (req, res) => {
  const player = res.locals.user;
  const itemId = Number(req.body?.itemId);

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
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
