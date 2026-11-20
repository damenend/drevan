import { Router } from "express";
import { MAX_TRAINING_LEVEL } from "../../services/battle";

const router = Router();

// Arena page
router.get("/", (req, res) => {
  const player = res.locals.user;
  const level = req.query.level;

  return res.render("game/arena", {
    title: "Dominion",
    dead: player.hp <= 0,
    level,
    maxTrainingLevel: MAX_TRAINING_LEVEL,
  });
});

export default router;
