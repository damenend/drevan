import { Router } from "express";
import { db } from "../../db";
import { and, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import { users } from "../../db/schema";

const router = Router();
const BITE_CHANCE = 0.8;
const DAILY_CAST_LIMIT = 50;
const gameDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Fishing page
router.get("/", (req, res) => {
  const player = res.locals.user;
  const today = gameDate.format(new Date());
  const castsUsed =
    player.fishingCastDate === today ? player.fishingCastsUsed : 0;

  return res.render("game/fishing", {
    title: "The Driftwater",
    caughtFish: undefined,
    castsRemaining: Math.max(0, DAILY_CAST_LIMIT - castsUsed),
  });
});

router.post("/", (req, res) => {
  const player = res.locals.user;
  const today = gameDate.format(new Date());

  // Check and spend the cast in one update so two requests can't claim the last cast.
  const cast = db
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
    return res.render("game/fishing", {
      title: "The Driftwater",
      caughtFish: undefined,
      castsRemaining: 0,
    });
  }

  let caughtFish = null;
  if (Math.random() < BITE_CHANCE) {
    const fishRoll = Math.random();

    // Once a fish bites, the first 70% goes to Murkfin and the next 25% to Glassscale.
    if (fishRoll < 0.7) {
      caughtFish = "Murkfin";
    } else if (fishRoll < 0.95) {
      caughtFish = "Glassscale";
    } else {
      caughtFish = "Astral Koi";
    }
  }

  return res.render("game/fishing", {
    title: "The Driftwater",
    caughtFish,
    castsRemaining: DAILY_CAST_LIMIT - cast.castsUsed,
  });
});

export default router;
