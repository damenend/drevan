import { Router } from "express";
import { and, eq, gte, sql, asc } from "drizzle-orm";
import { db } from "../../db";
import { users, items, inventory } from "../../db/schema";

import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

// Store page
router.get("/", (req, res) => {
  const storeItems = db
    .select()
    .from(items)
    .where(gte(items.price, 0))
    .orderBy(asc(items.price))
    .all();

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

  const selectedItems: { itemId: number; quantity: number }[] = [];

  for (const [field, value] of Object.entries(requestedItems)) {
    const itemId = parseFormInteger(/^item-([1-9]\d*)$/.exec(field)?.[1]);
    const quantity = value === "" ? 0 : parseFormInteger(value);

    if (itemId === null || quantity === null) {
      return res.redirect("/game/store");
    }

    if (quantity > 0) {
      selectedItems.push({ itemId, quantity });
    }
  }

  if (selectedItems.length === 0) {
    return res.redirect("/game/store");
  }

  const player = res.locals.user;

  const result = db.transaction(
    (tx) => {
      let totalCost = 0;

      for (const purchase of selectedItems) {
        const item = tx
          .select({ price: items.price, owned: inventory.quantity })
          .from(items)
          .leftJoin(
            inventory,
            and(
              eq(inventory.itemId, items.id),
              eq(inventory.userId, player.id),
            ),
          )
          .where(eq(items.id, purchase.itemId))
          .get();

        if (
          !item ||
          item.price === null ||
          item.price < 0 ||
          !Number.isSafeInteger((item.owned ?? 0) + purchase.quantity)
        ) {
          return "invalid";
        }

        totalCost += item.price * purchase.quantity;
      }

      if (!Number.isSafeInteger(totalCost)) {
        return "invalid";
      }

      // Deduct gold only if the player can afford the purchase
      const deduction = tx
        .update(users)
        .set({
          gold: sql`${users.gold} - ${totalCost}`,
        })
        .where(and(eq(users.id, player.id), gte(users.gold, totalCost)))
        .run();

      if (deduction.changes !== 1) {
        return "gold";
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

      return "success";
    },
    // Reserve write access before reading prices and quantities.
    { behavior: "immediate" },
  );

  // Redirect with an error if the player lacks gold
  if (result === "gold") {
    return res.redirect("/game/store?err=gold");
  }

  return res.redirect("/game/store");
});

export default router;
