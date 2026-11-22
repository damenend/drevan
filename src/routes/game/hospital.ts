import { Router } from "express";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { formatNumber } from "../../utils/format-number";
import { formatPlayerName } from "../../utils/format-player-name";

const router = Router();

// Hospital page
router.get("/", (req, res) => {
  const player = res.locals.user;

  const healed =
    typeof req.query.healed === "string" ? Number(req.query.healed) : 0;
  let message;

  if (Number.isSafeInteger(healed) && healed > 0) {
    message = `${formatPlayerName(player.name)} was healed for ${formatNumber(healed)} HP`;
  } else if (req.query.err) {
    message = "Unable to heal. Please check your gold and try again.";
  }

  return res.render("game/hospital", {
    title: "Sanctum",
    message,
    cost: Math.max(0, player.maxHp - player.hp),
  });
});

// Heal player
router.post("/", (req, res) => {
  const player = res.locals.user;
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
        eq(users.maxHp, player.maxHp),
        lt(users.hp, users.maxHp),
        gte(users.gold, healed),
      ),
    )
    .run();

  if (result.changes === 0) {
    return res.redirect("/game/hospital?err=gold");
  }

  return res.redirect(`/game/hospital?healed=${healed}`);
});

export default router;
