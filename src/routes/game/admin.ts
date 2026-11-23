import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import {
  DAILY_CAST_LIMIT,
  getDailyCastsUsed,
  getFishingDate,
} from "../../services/fishing";

import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

const editableStats = [
  "gold",
  "strength",
  "speed",
  "maxHp",
  "defense",
  "fishing_casts_used",
] as const;
type EditableStat = (typeof editableStats)[number];

// Admin page
router.get("/", (req, res) => {
  const message = req.query.message;
  const player = res.locals.user;
  const castsUsed = getDailyCastsUsed(
    player.fishingCastsUsed,
    player.fishingCastDate,
  );

  return res.render("game/admin", {
    title: "Admin",
    editableStats,
    statValues: { ...player, fishing_casts_used: castsUsed },
    dailyCastLimit: DAILY_CAST_LIMIT,
    message: message ?? null,
  });
});

// Update player stats
router.post("/", (req, res) => {
  const requestedChanges = req.body?.stats;

  // Validate submitted data
  if (
    !requestedChanges ||
    typeof requestedChanges !== "object" ||
    Array.isArray(requestedChanges)
  ) {
    return res.redirect("/game/admin?message=err");
  }

  const updates: Partial<Record<EditableStat, number>> = {};

  for (const stat of editableStats) {
    if (!Object.hasOwn(requestedChanges, stat)) continue;

    const parsedValue = parseFormInteger(requestedChanges[stat]);
    if (
      parsedValue === null ||
      (stat === "fishing_casts_used" && parsedValue > DAILY_CAST_LIMIT)
    ) {
      return res.redirect("/game/admin?message=err");
    }

    updates[stat] = parsedValue;
  }

  // Nothing valid to update
  if (Object.keys(updates).length === 0) {
    return res.redirect("/game/admin?message=err");
  }

  // Update the logged-in player's stats
  const player = res.locals.user;

  db.update(users)
    .set({
      ...updates,
      // Lower current HP with the cap in the same update. Raising the cap leaves existing HP alone.
      hp:
        updates.maxHp === undefined
          ? undefined
          : sql`min(${users.hp}, ${updates.maxHp})`,
      fishing_cast_date:
        updates.fishing_casts_used === undefined ? undefined : getFishingDate(),
    })
    .where(eq(users.id, player.id))
    .run();

  return res.redirect("/game/admin?message=success");
});

export default router;
