import { Router } from "express";
import { and, eq, gt, gte, inArray, sql, asc } from "drizzle-orm";
import { db } from "../../db";
import { users, items, inventory } from "../../db/schema";

import { getEquippedSlot } from "../../services/equipment";
import { renderError } from "../../middleware/errors";
import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

// A catalog item needs a positive payout and an eligible type.
const buybackEligible = and(
  gt(items.sellPrice, 0),
  inArray(items.type, ["weapon", "armor", "fish"]),
);

// Store page
router.get("/", (req, res) => {
  const storeItems = db
    .select()
    .from(items)
    .where(gte(items.price, 0))
    .orderBy(asc(items.price))
    .all();

  const player = res.locals.user;
  const sellableItems = db
    .select({
      id: items.id,
      name: items.name,
      type: items.type,
      image: items.image,
      sellPrice: items.sellPrice,
      quantity: inventory.quantity,
    })
    .from(inventory)
    .innerJoin(items, eq(items.id, inventory.itemId))
    .where(
      and(
        eq(inventory.userId, player.id),
        gt(inventory.quantity, 0),
        buybackEligible,
      ),
    )
    .orderBy(asc(items.name))
    .all()
    .map((item) => ({
      ...item,
      available: item.quantity - Number(getEquippedSlot(player, item) !== null),
    }));

  const errorMessage = req.query.err === "gold" ? "Not enough gold" : undefined;

  return res.render("game/store", {
    title: "Curious Emporium",
    items: storeItems,
    sellableItems,
    sold: req.query.sold === "1",
    err: errorMessage,
  });
});

/**
 * Reads the quantity fields shared by the purchase and sale forms.
 * Blank and zero quantities leave an item out of the transaction.
 */
function parseItemSelection(requestedItems: unknown) {
  if (
    !requestedItems ||
    typeof requestedItems !== "object" ||
    Array.isArray(requestedItems)
  ) {
    return null;
  }

  const selectedItems: { itemId: number; quantity: number }[] = [];

  for (const [field, value] of Object.entries(requestedItems)) {
    const itemId = parseFormInteger(/^item-([1-9]\d*)$/.exec(field)?.[1]);
    const quantity = value === "" ? 0 : parseFormInteger(value);

    if (itemId === null || quantity === null) {
      return null;
    }

    if (quantity > 0) {
      selectedItems.push({ itemId, quantity });
    }
  }

  return selectedItems;
}

// Purchase items
router.post("/", (req, res) => {
  const selectedItems = parseItemSelection(req.body?.items);

  if (!selectedItems?.length) {
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

// Sell the selected items together.
router.post("/sell", (req, res) => {
  const selectedItems = parseItemSelection(req.body?.items);
  if (!selectedItems?.length) {
    return renderError(res, 400, {
      message: "Enter a positive whole quantity for at least one item to sell.",
    });
  }

  const userId = res.locals.user.id;
  const playerFilter = eq(users.id, userId);
  const result = db.transaction(
    (tx) => {
      const player = tx.select().from(users).where(playerFilter).get();
      if (!player) {
        return "unavailable";
      }

      let totalPayout = 0;
      const remainingStacks: { id: number; quantity: number }[] = [];

      for (const { itemId, quantity } of selectedItems) {
        const stack = tx
          .select({
            id: inventory.id,
            quantity: inventory.quantity,
            type: items.type,
            sellPrice: items.sellPrice,
          })
          .from(inventory)
          .innerJoin(items, eq(items.id, inventory.itemId))
          .where(
            and(
              eq(inventory.userId, userId),
              eq(inventory.itemId, itemId),
              buybackEligible,
            ),
          )
          .get();

        if (
          !stack ||
          stack.sellPrice === null ||
          !Number.isSafeInteger(stack.quantity) ||
          stack.quantity < quantity
        ) {
          return "unavailable";
        }

        const remaining = stack.quantity - quantity;
        if (
          remaining === 0 &&
          getEquippedSlot(player, { id: itemId, type: stack.type })
        ) {
          return "equipped";
        }

        totalPayout += stack.sellPrice * quantity;
        remainingStacks.push({ id: stack.id, quantity: remaining });
      }

      const gold = player.gold + totalPayout;
      if (!Number.isSafeInteger(totalPayout) || !Number.isSafeInteger(gold)) {
        return "overflow";
      }

      for (const stack of remainingStacks) {
        const stackFilter = eq(inventory.id, stack.id);
        if (stack.quantity === 0) {
          tx.delete(inventory).where(stackFilter).run();
        } else {
          tx.update(inventory)
            .set({ quantity: stack.quantity })
            .where(stackFilter)
            .run();
        }
      }

      tx.update(users).set({ gold }).where(playerFilter).run();
      return "sold";
    },
    // Lock writes before checking inventory, equipment, and gold.
    { behavior: "immediate" },
  );

  switch (result) {
    case "unavailable":
      return renderError(res, 409, {
        message:
          "You do not own that quantity of an item Curious Emporium buys.",
      });
    case "equipped":
      return renderError(res, 409, {
        message: "That quantity includes your equipped copy.",
        recoveryLink: {
          href: "/game#equipped",
          label: "Unequip in The Quarters",
        },
      });
    case "overflow":
      return renderError(res, 409, {
        message: "This sale would exceed the supported gold limit.",
      });
    case "sold":
      return res.redirect(303, "/game/store?sold=1#sell");
  }
});

export default router;
