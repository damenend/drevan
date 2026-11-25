import { and, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import { items, users } from "../db/schema";
import { DAILY_CAST_LIMIT, getFishingDate, rollFishingCatch } from "./fishing";
import { grantInventoryItem } from "./inventory";

export type FishingReport =
  | { kind: "caught"; name: string; image: string | null }
  | { kind: "released"; name: string }
  | { kind: "empty" };

/**
 * Spends one cast and saves the catch in the same transaction. A full inventory
 * stack releases the fish and still spends the cast. Returns null when the
 * player has no casts left today.
 */
export function castFishingLine(playerId: number): FishingReport | null {
  const today = getFishingDate();

  return db.transaction((tx): FishingReport | null => {
    // The guarded update lets only one request claim the last cast.
    const cast = tx
      .update(users)
      .set({
        fishing_cast_date: today,
        fishing_casts_used: sql`CASE WHEN ${users.fishing_cast_date} = ${today}
          THEN ${users.fishing_casts_used} + 1 ELSE 1 END`,
      })
      .where(
        and(
          eq(users.id, playerId),
          or(
            isNull(users.fishing_cast_date),
            ne(users.fishing_cast_date, today),
            lt(users.fishing_casts_used, DAILY_CAST_LIMIT),
          ),
        ),
      )
      .run();

    if (!cast.changes) return null;

    const caughtFish = rollFishingCatch();
    if (!caughtFish) return { kind: "empty" };

    const fish = tx
      .select({ id: items.id, name: items.name, image: items.image })
      .from(items)
      .where(and(eq(items.name, caughtFish), eq(items.type, "fish")))
      .get();

    if (!fish) {
      throw new Error(`Missing fish in the item catalog: ${caughtFish}`);
    }

    if (!grantInventoryItem(tx, playerId, fish.id)) {
      return { kind: "released", name: fish.name };
    }
    return { kind: "caught", name: fish.name, image: fish.image };
  });
}
