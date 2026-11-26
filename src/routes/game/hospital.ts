import { getAuthenticatedPlayer } from "../../middleware/auth";
import { Router } from "express";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../../db";
import { effectiveMaxHp, users } from "../../db/schema";
import { REVIVAL_FEE, revivePlayer } from "../../services/sanctum";
import { formatNumber } from "../../utils/format-number";

import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

// Hospital page
router.get("/", (req, res) => {
  const player = getAuthenticatedPlayer(res);

  const healed = parseFormInteger(req.query.healed) ?? 0;
  const revived = parseFormInteger(req.query.revived);
  let message;

  if (revived !== null) {
    message = `Revived with 1 HP for ${formatNumber(revived)} gold.`;
  } else if (healed > 0) {
    message = `Sanctum restored ${formatNumber(healed)} HP.`;
  } else if (req.query.err === "revive") {
    message = "Revival failed. You must have 0 HP to revive.";
  } else if (req.query.err) {
    message = "Healing failed. Check your HP and gold before trying again.";
  }

  return res.render("game/hospital", {
    title: "Sanctum",
    message,
    cost: Math.max(0, player.maxHp - player.hp),
    revivalCost: Math.min(player.gold, REVIVAL_FEE),
  });
});

// Heal player
router.post(["/", "/heal"], (req, res) => {
  const player = getAuthenticatedPlayer(res);
  if (player.hp <= 0) {
    return res.redirect("/game/hospital?err=heal");
  }
  const healed = Math.max(0, player.maxHp - player.hp);

  // No healing necessary
  if (healed === 0) {
    return res.redirect("/game/hospital");
  }

  // Heal only if the player's stats haven't changed
  // and they have enough gold
  const result = db
    .update(users)
    .set({
      hp: player.maxHp,
      gold: sql`${users.gold} - ${healed}`,
    })
    .where(
      and(
        eq(users.id, player.id),
        eq(users.hp, player.hp),
        eq(effectiveMaxHp, player.maxHp),
        lt(users.hp, effectiveMaxHp),
        gte(users.gold, healed),
      ),
    )
    .run();

  if (result.changes === 0) {
    return res.redirect("/game/hospital?err=gold");
  }

  return res.redirect(`/game/hospital?healed=${healed}`);
});

router.post("/revive", (_req, res) => {
  const result = revivePlayer(getAuthenticatedPlayer(res).id);
  if (!result) return res.redirect("/game/hospital?err=revive");
  return res.redirect(`/game/hospital?revived=${result.cost}`);
});

export default router;
