import { Router } from "express";
import { MAX_TRAINING_LEVEL } from "../../services/battle";

import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

// Arena page
router.get("/", (req, res) => {
  const player = res.locals.user;
  const requestedLevel = parseFormInteger(req.query.level);
  const level =
    requestedLevel !== null &&
    requestedLevel >= 1 &&
    requestedLevel <= MAX_TRAINING_LEVEL
      ? requestedLevel
      : 1;

  return res.render("game/arena", {
    title: "Dominion",
    dead: player.hp <= 0,
    level,
    maxTrainingLevel: MAX_TRAINING_LEVEL,
  });
});

export default router;
