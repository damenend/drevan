import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

/** Provisional flat fee. Players with less gold surrender only their balance. */
export const REVIVAL_FEE = 10;

/**
 * Revives a defeated player at 1 HP and charges at most their current gold.
 * The immediate transaction prevents concurrent submissions from charging twice.
 */
export function revivePlayer(userId: number) {
  return db.transaction(
    (tx) => {
      const player = tx
        .select({ gold: users.gold, hp: users.hp })
        .from(users)
        .where(eq(users.id, userId))
        .get();
      if (!player || player.hp !== 0) return null;

      const cost = Math.min(player.gold, REVIVAL_FEE);
      const revived = tx
        .update(users)
        .set({ hp: 1, gold: sql`${users.gold} - ${cost}` })
        .where(and(eq(users.id, userId), eq(users.hp, 0)))
        .run();

      return revived.changes === 1 ? { cost } : null;
    },
    { behavior: "immediate" },
  );
}
