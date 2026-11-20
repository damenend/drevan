import { Router } from "express";
import { and, eq, gte, sql, asc } from "drizzle-orm";
import { db } from "../../db";
import { users, items, inventory } from "../../db/schema";

const router = Router();

// Store page
router.get("/", (req, res) => {
  const storeItems = db.select().from(items).orderBy(asc(items.price)).all();

  const errorMessage = req.query.err === "gold" ? "Not enough gold" : undefined;

  return res.render("game/store", {
    title: "Curious Emporium",
    items: storeItems,
    err: errorMessage,
  });
});

// Purchase items
router.post("/", (req, res) => {
  const requestedItems = req.body?.items;

  // Validate submitted form data
  if (
    !requestedItems ||
    typeof requestedItems !== "object" ||
    Array.isArray(requestedItems)
  ) {
    return res.redirect("/game/store");
  }

  // Convert submitted values into purchase objects
  const purchases = Object.entries(requestedItems).map(([id, quantity]) => ({
    itemId: Number(id.replace("item-", "")),
    quantity: Number(quantity),
  }));

  // Validate item IDs and quantities
  if (
    purchases.some(
      (entry) =>
        !Number.isSafeInteger(entry.itemId) ||
        entry.itemId <= 0 ||
        !Number.isSafeInteger(entry.quantity) ||
        entry.quantity < 0,
    )
  ) {
    return res.redirect("/game/store");
  }

  // Ignore zero-quantity items
  const selectedItems = purchases.filter((entry) => entry.quantity > 0);

  if (selectedItems.length === 0) {
    return res.redirect("/game/store");
  }

  // Retrieve item details and calculate total
  let totalCost = 0;

  for (const purchase of selectedItems) {
    const item = db
      .select({ price: items.price })
      .from(items)
      .where(eq(items.id, purchase.itemId))
      .get();

    if (!item) {
      return res.redirect("/game/store");
    }

    totalCost += item.price * purchase.quantity;
  }

  if (!Number.isSafeInteger(totalCost)) {
    return res.redirect("/game/store");
  }

  const player = res.locals.user;

  // Process purchase within a transaction
  const purchased = db.transaction((tx) => {
    // Deduct gold only if the player can afford the purchase
    const result = tx
      .update(users)
      .set({
        gold: sql`${users.gold} - ${totalCost}`,
      })
      .where(and(eq(users.id, player.id), gte(users.gold, totalCost)))
      .run();

    if (result.changes !== 1) {
      return false;
    }

    // Add purchased items to inventory
    for (const purchase of selectedItems) {
      tx.insert(inventory)
        .values({
          userId: player.id,
          itemId: purchase.itemId,
          quantity: purchase.quantity,
        })
        .onConflictDoUpdate({
          target: [inventory.userId, inventory.itemId],
          set: {
            quantity: sql`${inventory.quantity} + ${purchase.quantity}`,
          },
        })
        .run();
    }

    return true;
  });

  // Redirect with an error if the player lacks gold
  if (!purchased) {
    return res.redirect("/game/store?err=gold");
  }

  return res.redirect("/game/store");
});

export default router;
