import { getAuthenticatedPlayer } from "../../middleware/auth";
import { Router, type Request, type Response } from "express";
import { MAX_TRAINING_LEVEL } from "../../services/battle";
import { getEffectiveStats } from "../../services/equipment";
import { getProgression } from "../../services/progression";
import type { TrainingBattle } from "../../services/training";

import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

type TrainingReport = { level: number; battle: TrainingBattle | null };

/** Renders Dominion with current readiness and an optional one-time result. */
export function renderArena(
  req: Request,
  res: Response,
  report?: TrainingReport,
) {
  const player = getAuthenticatedPlayer(res);
  const requestedLevel = parseFormInteger(req.query.level);
  const level =
    report?.level ??
    (requestedLevel !== null &&
    requestedLevel >= 1 &&
    requestedLevel <= MAX_TRAINING_LEVEL
      ? requestedLevel
      : 1);

  return res.render("game/arena", {
    title: "Dominion",
    dead: player.hp <= 0,
    level,
    maxTrainingLevel: MAX_TRAINING_LEVEL,
    effectiveStats: getEffectiveStats(player),
    progression: getProgression(player.exp),
    battle: report?.battle,
  });
}

// Arena page
router.get("/", (req, res) => renderArena(req, res));

export default router;
