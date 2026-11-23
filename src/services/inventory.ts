import { lt, sql } from "drizzle-orm";
import type { db } from "../db";
import { inventory } from "../db/schema";

/**
 * Adds one item without exceeding the supported stack size. Returns false
 * when the stack is full. Pass the transaction that resolves the reward.
 */
export function grantInventoryItem(
  database: Pick<typeof db, "insert">,
  userId: number,
  itemId: number,
) {
  return (
    database
      .insert(inventory)
      .values({ userId, itemId })
      .onConflictDoUpdate({
        target: [inventory.userId, inventory.itemId],
        set: { quantity: sql`${inventory.quantity} + 1` },
        setWhere: lt(inventory.quantity, Number.MAX_SAFE_INTEGER),
      })
      .run().changes === 1
  );
}
