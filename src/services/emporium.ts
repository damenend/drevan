import { and, asc, eq, gt, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import { getAvailableQuantity } from "./equipment";

export type ItemSelection = { itemId: number; quantity: number };

// A catalog item needs a positive payout and an eligible type.
const buybackEligible = and(
  gt(items.sellPrice, 0),
  inArray(items.type, ["weapon", "armor", "fish"]),
);

/** Loads the shop catalog and counts spare copies the player can sell. */
export function getEmporiumItems(
  player: Pick<
    typeof users.$inferSelect,
    "id" | "equippedWeaponId" | "equippedArmorId"
  >,
) {
  const storeItems = db
    .select()
    .from(items)
    .where(gte(items.price, 0))
    .orderBy(asc(items.price))
    .all();

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
      available: getAvailableQuantity(player, item),
    }));

  return { storeItems, sellableItems };
}

/**
 * Prices the cart and updates gold and inventory together. The selection
 * contains distinct item IDs and positive whole quantities from the form.
 */
export function buyEmporiumItems(
  userId: number,
  selectedItems: readonly ItemSelection[],
) {
  return db.transaction(
    (tx) => {
      let totalCost = 0;

      const catalog = tx
        .select({ id: items.id, price: items.price, owned: inventory.quantity })
        .from(items)
        .leftJoin(
          inventory,
          and(eq(inventory.itemId, items.id), eq(inventory.userId, userId)),
        )
        .where(
          inArray(
            items.id,
            selectedItems.map(({ itemId }) => itemId),
          ),
        )
        .all();
      const catalogById = new Map(catalog.map((item) => [item.id, item]));

      for (const purchase of selectedItems) {
        const item = catalogById.get(purchase.itemId);

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
        .where(and(eq(users.id, userId), gte(users.gold, totalCost)))
        .run();

      if (deduction.changes !== 1) {
        return "gold";
      }

      // Add purchased items to inventory
      for (const purchase of selectedItems) {
        tx.insert(inventory)
          .values({
            userId: userId,
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
}

/**
 * Checks ownership and equipped copies before applying any sale. Credits gold
 * and updates all selected stacks in the same transaction.
 */
export function sellEmporiumItems(
  userId: number,
  selectedItems: readonly ItemSelection[],
) {
  const playerFilter = eq(users.id, userId);
  return db.transaction(
    (tx) => {
      const player = tx
        .select({
          gold: users.gold,
          equippedWeaponId: users.equippedWeaponId,
          equippedArmorId: users.equippedArmorId,
        })
        .from(users)
        .where(playerFilter)
        .get();
      if (!player) {
        return "unavailable";
      }

      let totalPayout = 0;
      const remainingStacks: { id: number; quantity: number }[] = [];

      const stacks = tx
        .select({
          id: inventory.id,
          itemId: inventory.itemId,
          quantity: inventory.quantity,
          type: items.type,
          sellPrice: items.sellPrice,
        })
        .from(inventory)
        .innerJoin(items, eq(items.id, inventory.itemId))
        .where(
          and(
            eq(inventory.userId, userId),
            inArray(
              inventory.itemId,
              selectedItems.map(({ itemId }) => itemId),
            ),
            buybackEligible,
          ),
        )
        .all();
      const stacksByItemId = new Map(
        stacks.map((stack) => [stack.itemId, stack]),
      );

      for (const { itemId, quantity } of selectedItems) {
        const stack = stacksByItemId.get(itemId);

        if (
          !stack ||
          stack.sellPrice === null ||
          !Number.isSafeInteger(stack.quantity) ||
          stack.quantity < quantity
        ) {
          return "unavailable";
        }

        const remaining = stack.quantity - quantity;
        if (quantity > getAvailableQuantity(player, { ...stack, id: itemId })) {
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
}
