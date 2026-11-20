import { Router } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../../db";
import { users, items, inventory } from "../../db/schema";
import { applyItemEffect } from "../../services/items";

const router = Router();

// Use an inventory item
router.post("/use", (req, res) => {
  const player = res.locals.user;
  const itemId = Number(req.body.itemId);

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    return res.redirect("/game");
  }

  const result = db.transaction((tx) => {
    // Fetch the player's current stats inside the transaction
    const currentPlayer = tx
      .select()
      .from(users)
      .where(eq(users.id, player.id))
      .get();

    if (!currentPlayer) {
      return null;
    }

    // Verify the player owns the item
    const ownedItem = tx
      .select({
        itemId: items.id,
        type: items.type,
        effect: items.effect,
        effectValue: items.effectValue,
        quantity: inventory.quantity,
      })
      .from(inventory)
      .innerJoin(items, eq(inventory.itemId, items.id))
      .where(
        and(
          eq(inventory.userId, player.id),
          eq(inventory.itemId, itemId),
          gt(inventory.quantity, 0),
        ),
      )
      .get();

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
      .where(
        and(
          eq(inventory.userId, player.id),
          eq(inventory.itemId, itemId),
          gt(inventory.quantity, 0),
        ),
      )
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
      .where(
        and(
          eq(inventory.userId, player.id),
          eq(inventory.itemId, itemId),
          eq(inventory.quantity, 0),
        ),
      )
      .run();

    return effectResult;
  });

  if (!result) {
    return res.redirect(`/game?message=${encodeURIComponent("No effect")}`);
  }

  return res.redirect(`/game?message=${encodeURIComponent(result.message)}`);
});

router.post("/equip", (req, res) => {
  const player = res.locals.user;
  const itemId = Number(req.body.itemId);

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    return res.redirect("/game?message=Invalid item.");
  }

  const ownedItem = db
    .select({
      id: items.id,
      type: items.type,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(
      and(
        eq(inventory.userId, player.id),
        eq(inventory.itemId, itemId),
        gt(inventory.quantity, 0),
      ),
    )
    .get();

  if (!ownedItem) {
    return res.redirect("/game?message=Item not found in inventory.");
  }

  if (ownedItem.type === "weapon") {
    db.update(users)
      .set({ equippedWeaponId: ownedItem.id })
      .where(eq(users.id, player.id))
      .run();
  } else if (ownedItem.type === "armor") {
    db.update(users)
      .set({ equippedArmorId: ownedItem.id })
      .where(eq(users.id, player.id))
      .run();
  } else {
    return res.redirect("/game?message=This item cannot be equipped.");
  }

  return res.redirect("/game?message=Item equipped.");
});

router.post("/unequip", (req, res) => {
  const player = res.locals.user;
  const itemId = Number(req.body.itemId);

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    return res.redirect("/game?message=Invalid item.");
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
    return res.redirect("/game?message=Item is not equipped.");
  }

  return res.redirect("/game?message=Item unequipped.");
});

export default router;
