import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { getEffectiveStats } from "../../services/equipment";
import { formatPlayerName } from "../../utils/format-player-name";

import {
  createTrainingDummy,
  simulateBattle,
  MAX_TRAINING_LEVEL,
} from "../../services/battle";

import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

// Training battle
router.post("/", (req, res) => {
  const player = res.locals.user;

  // Prevent dead players from fighting
  if (player.hp <= 0) {
    return res.render("game/battle", {
      title: "Training Battle",
      dead: true,
    });
  }

  // Validate training level
  const level = parseFormInteger(req.body?.level);

  if (level === null || level < 1 || level > MAX_TRAINING_LEVEL) {
    return res.redirect("/game/arena");
  }

  // Generate training dummy and reward
  const enemy = createTrainingDummy(level);
  const goldReward = level * 10;

  // Simulate battle
  const result = simulateBattle(
    {
      name: formatPlayerName(player.name),
      hp: player.hp,
      speed: player.speed,
      ...getEffectiveStats(player),
    },
    enemy,
    goldReward,
  );

  // Save player stats
  db.update(users)
    .set({
      hp: result.playerHp,
      gold: sql`${users.gold} + ${result.goldEarned}`,
    })
    .where(eq(users.id, player.id))
    .run();

  // Display battle results
  return res.render("game/battle", {
    title: "Training Battle",
    dead: false,
    level,
    ...result,
  });
});

export default router;
