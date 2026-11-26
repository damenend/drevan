import { and, asc, eq, gt, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import { getStackAvailability, type EquipmentOwner } from "./equipment";
import { grantInventoryItem } from "./inventory";

export type ItemSelection = { itemId: number; quantity: number };

type Seller = EquipmentOwner & { id: number; gold: number };

const purchaseStock = and(gte(items.price, 0), ne(items.type, "material"));
const buybackStock = and(
  gt(items.sellPrice, 0),
  inArray(items.type, ["weapon", "armor", "fish", "material"]),
);

function getBuybackItems(
  database: Pick<typeof db, "select">,
  player: Seller,
  selectedIds?: number[],
) {
  return database
    .select({
      stackId: inventory.id,
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
        buybackStock,
        selectedIds && inArray(inventory.itemId, selectedIds),
      ),
    )
    .orderBy(asc(items.name))
    .all()
    .map((item) => ({ ...item, ...getStackAvailability(player, item) }));
}

function getGoldAfterSale(gold: number, payout: number) {
  const total = gold + payout;
  return Number.isSafeInteger(payout) && Number.isSafeInteger(total)
    ? total
    : null;
}

/** Loads purchase stock and previews a sale of all eligible spare copies. */
export function getEmporiumItems(player: Seller) {
  const purchaseItems = db
    .select()
    .from(items)
    .where(purchaseStock)
    .orderBy(asc(items.price))
    .all();

  const sellableItems = getBuybackItems(db, player);
  const sellAllTotal = sellableItems.reduce(
    (total, item) => total + item.available * (item.sellPrice ?? 0),
    0,
  );
  return {
    purchaseItems,
    sellableItems,
    hasSellableCopies: sellableItems.some((item) => item.available > 0),
    sellAllTotal,
    sellAllExceedsGoldLimit:
      getGoldAfterSale(player.gold, sellAllTotal) === null,
  };
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
        .select({
          id: items.id,
          price: items.price,
          owned: inventory.quantity,
        })
        .from(items)
        .leftJoin(
          inventory,
          and(eq(inventory.itemId, items.id), eq(inventory.userId, userId)),
        )
        .where(
          and(
            purchaseStock,
            inArray(
              items.id,
              selectedItems.map(({ itemId }) => itemId),
            ),
          ),
        )
        .all();
      const catalogById = new Map(catalog.map((item) => [item.id, item]));

      for (const purchase of selectedItems) {
        const item = catalogById.get(purchase.itemId);

        if (
          !item ||
          item.price === null ||
          !Number.isSafeInteger((item.owned ?? 0) + purchase.quantity)
        ) {
          return "invalid";
        }

        totalCost += item.price * purchase.quantity;
      }

      if (!Number.isSafeInteger(totalCost)) {
        return "invalid";
      }

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

      for (const { itemId, quantity } of selectedItems) {
        if (!grantInventoryItem(tx, userId, itemId, quantity)) {
          throw new Error("Purchased inventory stack could not be updated");
        }
      }

      return "success";
    },
    // Reserve write access before reading prices and quantities.
    { behavior: "immediate" },
  );
}

/**
 * Checks ownership and equipped copies before applying any sale. Credits gold
 * and updates all selected stacks in the same transaction. Manual sales
 * require distinct item IDs and positive safe-integer quantities. An "all"
 * sale uses every spare copy eligible for buyback at the time of the transaction.
 */
export function sellEmporiumItems(
  userId: number,
  selection: readonly ItemSelection[] | "all",
) {
  const playerFilter = eq(users.id, userId);
  return db.transaction(
    (tx) => {
      const player = tx
        .select({
          id: users.id,
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

      const stacks = getBuybackItems(
        tx,
        player,
        selection === "all" ? undefined : selection.map(({ itemId }) => itemId),
      );
      const stacksByItemId = new Map(stacks.map((stack) => [stack.id, stack]));

      const selectedItems =
        selection === "all"
          ? stacks
              .filter(({ available }) => available > 0)
              .map(({ id, available }) => ({ itemId: id, quantity: available }))
          : selection;

      if (selectedItems.length === 0) {
        return "empty";
      }

      let totalPayout = 0;
      const remainingStacks: { id: number; quantity: number }[] = [];
      for (const { itemId, quantity } of selectedItems) {
        const stack = stacksByItemId.get(itemId);

        if (
          !stack ||
          stack.sellPrice === null ||
          !Number.isSafeInteger(stack.sellPrice) ||
          !Number.isSafeInteger(stack.quantity) ||
          stack.quantity < quantity
        ) {
          return "unavailable";
        }

        if (quantity > stack.available) {
          return "equipped";
        }

        totalPayout += stack.sellPrice * quantity;
        remainingStacks.push({
          id: stack.stackId,
          quantity: stack.quantity - quantity,
        });
      }

      const gold = getGoldAfterSale(player.gold, totalPayout);
      if (gold === null) {
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
