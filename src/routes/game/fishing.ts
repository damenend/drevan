import { Router } from "express";
import { db } from "../../db";
import { and, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import { inventory, items, users } from "../../db/schema";
import {
  DAILY_CAST_LIMIT,
  getDailyCastsUsed,
  getFishingDate,
  rollFishingCatch,
} from "../../services/fishing";

const router = Router();

// Fishing page
router.get("/", (req, res) => {
  const player = res.locals.user;
  const castsUsed = getDailyCastsUsed(
    player.fishingCastsUsed,
    player.fishingCastDate,
  );

  return res.render("game/fishing", {
    title: "The Driftwater",
    caughtFish: undefined,
    castsRemaining: Math.max(0, DAILY_CAST_LIMIT - castsUsed),
  });
});

router.post("/", (req, res) => {
  const player = res.locals.user;
  const today = getFishingDate();

  const result = db.transaction((tx) => {
    // Check and spend the cast in one update so two requests can't claim the last cast.
    const cast = tx
      .update(users)
      .set({
        fishing_cast_date: today,
        fishing_casts_used: sql`CASE WHEN ${users.fishing_cast_date} = ${today}
          THEN ${users.fishing_casts_used} + 1 ELSE 1 END`,
      })
      .where(
        and(
          eq(users.id, player.id),
          or(
            isNull(users.fishing_cast_date),
            ne(users.fishing_cast_date, today),
            lt(users.fishing_casts_used, DAILY_CAST_LIMIT),
          ),
        ),
      )
      .returning({ castsUsed: users.fishing_casts_used })
      .get();

    if (!cast) {
      return { caughtFish: undefined, castsRemaining: 0 };
    }

    const caughtFish = rollFishingCatch();

    if (caughtFish) {
      const fish = tx
        .select({ id: items.id })
        .from(items)
        .where(and(eq(items.name, caughtFish), eq(items.type, "fish")))
        .get();

      if (!fish) {
        throw new Error(`Missing fish in the item catalog: ${caughtFish}`);
      }

      tx.insert(inventory)
        .values({ userId: player.id, itemId: fish.id, quantity: 1 })
        .onConflictDoUpdate({
          target: [inventory.userId, inventory.itemId],
          set: { quantity: sql`${inventory.quantity} + 1` },
        })
        .run();
    }

    return { caughtFish, castsRemaining: DAILY_CAST_LIMIT - cast.castsUsed };
  });

  return res.render("game/fishing", {
    title: "The Driftwater",
    ...result,
  });
});

export default router;
