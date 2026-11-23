import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import {
  getPrimaryAttributes,
  HP_PER_FORTITUDE,
  maximumHp,
} from "../../services/character-stats";
import {
  DAILY_CAST_LIMIT,
  getDailyCastsUsed,
  getFishingDate,
} from "../../services/fishing";

import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

const statLabels = {
  fortitude: "Base Fortitude",
  strength: "Base Strength",
  agility: "Base Agility",
  intellect: "Base Intellect",
  defense: "Defense",
  gold: "Gold",
  fishing_casts_used: "Fishing casts used today",
} as const;
type EditableStat = keyof typeof statLabels;
const editableStats = Object.keys(statLabels) as EditableStat[];

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
    statLabels,
    fortitude: getPrimaryAttributes(player).fortitude,
    hpPerFortitude: HP_PER_FORTITUDE,
    statValues: {
      ...player,
      fishing_casts_used: castsUsed,
    },
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

  const { id } = res.locals.user;
  const saved = db.transaction(
    (tx) => {
      const player = tx
        .select({
          fortitude: users.fortitude,
          strengthPoints: users.strengthPoints,
          agilityPoints: users.agilityPoints,
          intellectPoints: users.intellectPoints,
          maxHp: maximumHp(
            sql`(${updates.fortitude ?? users.fortitude} + ${users.fortitudePoints})`,
          ),
        })
        .from(users)
        .where(eq(users.id, id))
        .get();

      if (!player || !Number.isSafeInteger(player.maxHp)) return false;
      for (const stat of ["strength", "agility", "intellect"] as const) {
        const base = updates[stat];
        if (
          base !== undefined &&
          !Number.isSafeInteger(base + player[`${stat}Points`])
        ) {
          return false;
        }
      }

      tx.update(users)
        .set({
          ...updates,
          hp:
            updates.fortitude !== undefined &&
            updates.fortitude !== player.fortitude
              ? player.maxHp
              : undefined,
          fishing_cast_date:
            updates.fishing_casts_used === undefined
              ? undefined
              : getFishingDate(),
        })
        .where(eq(users.id, id))
        .run();
      return true;
    },
    { behavior: "immediate" },
  );

  return res.redirect(
    saved ? "/game/admin?message=success" : "/game/admin?message=err",
  );
});

export default router;
