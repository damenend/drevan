import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { renderError } from "../../middleware/errors";
import { formatPlayerName } from "../../utils/format-player-name";

import { getProgression } from "../../services/progression";

const router = Router();

const playerFields = { id: users.id, name: users.name, exp: users.exp };

router.get("/", (req, res) => {
  const players = db.select(playerFields).from(users).all();

  return res.render("users/index", {
    title: "The Registry",
    players: players.map(({ exp, ...player }) => ({
      ...player,
      level: getProgression(exp).level,
    })),
  });
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const player =
    /^[1-9]\d*$/.test(req.params.id) && Number.isSafeInteger(id)
      ? db
          .select({ ...playerFields, avatarModel: users.avatarModel })
          .from(users)
          .where(eq(users.id, id))
          .get()
      : undefined;

  if (!player) {
    return renderError(res, 404, {
      title: "Player not found",
      message: "The Registry lists available player profiles.",
    });
  }

  return res.render("users/profile", {
    title: formatPlayerName(player.name),
    player,
    playerLevel: getProgression(player.exp).level,
  });
});

export default router;
