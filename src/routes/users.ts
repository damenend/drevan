import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { renderError } from "../middleware/errors";
import { formatPlayerName } from "../utils/format-player-name";

const router = Router();

const publicPlayerFields = { id: users.id, name: users.name };
// Players display the starting level until XP progression is implemented.
const playerLevel = 1;

router.get("/", (req, res) => {
  const players = db.select(publicPlayerFields).from(users).all();

  return res.render("users/index", {
    title: "Registered Players",
    players,
    playerLevel,
  });
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const player =
    /^[1-9]\d*$/.test(req.params.id) && Number.isSafeInteger(id)
      ? db.select(publicPlayerFields).from(users).where(eq(users.id, id)).get()
      : undefined;

  if (!player) {
    return renderError(res, 404, {
      title: "Player not found",
      message: "The Players directory lists available profiles.",
    });
  }

  return res.render("users/profile", {
    title: formatPlayerName(player.name),
    player,
    playerLevel,
  });
});

export default router;
