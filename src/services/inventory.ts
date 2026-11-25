import { lte, sql } from "drizzle-orm";
import type { db } from "../db";
import { inventory } from "../db/schema";

/**
 * Adds a positive whole quantity if the entire award fits. Returns false
 * when the stack lacks room. Pass the transaction that resolves the reward.
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
