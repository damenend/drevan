import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import {
  getProgression,
  isAllocationStat,
  statAllocations,
} from "../../services/progression";

const router = Router();

router.post("/", (req, res) => {
  const stat = req.body?.stat;
  if (!isAllocationStat(stat)) {
    return res.redirect(303, "/game?message=Choose+a+stat+to+increase.");
  }

  const pointColumn = `${stat}Points` as const;
  const { id } = res.locals.user;
  const message = db.transaction(
    (tx) => {
      const player = tx
        .select({
          exp: users.exp,
          strength: users.strength,
          speed: users.speed,
          maxHp: users.maxHp,
          strengthPoints: users.strengthPoints,
          speedPoints: users.speedPoints,
          maxHpPoints: users.maxHpPoints,
        })
        .from(users)
        .where(eq(users.id, id))
        .get();
      if (!player) return "Player not found.";

      const spent =
        player.strengthPoints + player.speedPoints + player.maxHpPoints;
      if (!getProgression(player.exp, spent).unspentPoints) {
        return "You have no points to spend.";
      }
      const purchasedPoints = player[pointColumn] + 1;
      if (
        !Number.isSafeInteger(
          player[stat] + purchasedPoints * statAllocations[stat].amount,
        )
      ) {
        return "That stat is already at its limit.";
      }

      tx.update(users)
        .set({ [pointColumn]: sql`${users[pointColumn]} + 1` })
        .where(eq(users.id, id))
        .run();
      return `Point spent. ${statAllocations[stat].label}.`;
    },
    { behavior: "immediate" },
  );

  return res.redirect(303, `/game?message=${encodeURIComponent(message)}`);
});

export default router;
