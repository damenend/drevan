import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { getEffectiveStats } from "../../services/equipment";
import { getProgression } from "../../services/progression";
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
  if (res.locals.user.hp <= 0) {
    return res.render("game/battle", { title: "Training Battle", dead: true });
  }

  // Validate training level
  const level = parseFormInteger(req.body?.level);

  if (level === null || level < 1 || level > MAX_TRAINING_LEVEL) {
    return res.redirect("/game/arena");
  }

  // Generate training dummy and reward
  const enemy = createTrainingDummy(level);
  const goldReward = level * 10;

  const { id } = res.locals.user;
  const savedBattle = db.transaction(
    (tx) => {
      const player = tx
        .select({
          id: users.id,
          name: users.name,
          hp: users.hp,
          exp: users.exp,
          strength: users.strength,
          strengthPoints: users.strengthPoints,
          agility: users.agility,
          agilityPoints: users.agilityPoints,
          intellect: users.intellect,
          intellectPoints: users.intellectPoints,
          fortitude: users.fortitude,
          fortitudePoints: users.fortitudePoints,
          speed: users.speed,
          defense: users.defense,
          equippedWeaponId: users.equippedWeaponId,
          equippedArmorId: users.equippedArmorId,
        })
        .from(users)
        .where(eq(users.id, id))
        .get();
      if (!player || player.hp <= 0) return null;

      const result = simulateBattle(
        {
          name: formatPlayerName(player.name),
          hp: player.hp,
          ...getEffectiveStats(player, tx),
        },
        enemy,
        goldReward,
      );

      // Commit HP loss and any victory rewards together.
      const xpEarned =
        result.enemyHp === 0
          ? Math.min(level * 10, Number.MAX_SAFE_INTEGER - player.exp)
          : 0;
      const exp = player.exp + xpEarned;
      tx.update(users)
        .set({
          hp: result.playerHp,
          gold: sql`${users.gold} + ${result.goldEarned}`,
          exp,
        })
        .where(eq(users.id, player.id))
        .run();

      const newLevel = getProgression(exp).level;
      return {
        ...result,
        xpEarned,
        gainedLevel:
          newLevel > getProgression(player.exp).level ? newLevel : null,
      };
    },
    { behavior: "immediate" },
  );

  return res.render("game/battle", {
    title: "Training Battle",
    dead: savedBattle === null,
    level,
    ...savedBattle,
  });
});

export default router;
