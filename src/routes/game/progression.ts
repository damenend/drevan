import { getAuthenticatedPlayer } from "../../middleware/auth";
import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { getSpentPoints, maximumHp } from "../../services/character-stats";
import {
  getProgression,
  isAllocationStat,
  statAllocations,
} from "../../services/progression";

const router = Router();

router.post("/", (req, res) => {
  const { id, ruinsTile } = getAuthenticatedPlayer(res);
  const path = ruinsTile === null ? "/game" : "/game/ruins";
  const stat = req.body?.stat;
  if (!isAllocationStat(stat)) {
    return res.redirect(303, `${path}?message=Choose+a+stat+to+increase.`);
  }

  const pointColumn = `${stat}Points` as const;
  const message = db.transaction(
    (tx) => {
      const player = tx
        .select({
          exp: users.exp,
          strength: users.strength,
          agility: users.agility,
          intellect: users.intellect,
          fortitude: users.fortitude,
          strengthPoints: users.strengthPoints,
          agilityPoints: users.agilityPoints,
          intellectPoints: users.intellectPoints,
          fortitudePoints: users.fortitudePoints,
          nextMaxHp: maximumHp(
            sql`(${users.fortitude} + ${users.fortitudePoints} + 1)`,
          ),
        })
        .from(users)
        .where(eq(users.id, id))
        .get();
      if (!player) return "Player not found.";

      if (!getProgression(player.exp, getSpentPoints(player)).unspentPoints) {
        return "You have no attribute points to spend.";
      }
      const nextValue =
        stat === "fortitude"
          ? player.nextMaxHp
          : player[stat] + player[pointColumn] + 1;
      if (!Number.isSafeInteger(nextValue)) {
        return "That attribute is already at its limit.";
      }

      tx.update(users)
        .set({ [pointColumn]: sql`${users[pointColumn]} + 1` })
        .where(eq(users.id, id))
        .run();
      return `Point spent. ${statAllocations[stat].label}.`;
    },
    { behavior: "immediate" },
  );

  return res.redirect(303, `${path}?message=${encodeURIComponent(message)}`);
});

export default router;
