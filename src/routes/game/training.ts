import { Router } from "express";
import { getAuthenticatedPlayer } from "../../middleware/auth";
import { MAX_TRAINING_LEVEL } from "../../services/battle";
import { trainAgainstDummy } from "../../services/training";
import { parseFormInteger } from "../../utils/parse-form-integer";
import { renderArena } from "./arena";

const router = Router();

router.get("/", (req, res) => {
  const report = req.session.trainingReport;
  if (!report) return res.redirect("/game/arena");

  delete req.session.trainingReport;
  return renderArena(req, res, report);
});

// Training battle
router.post("/", (req, res) => {
  const level = parseFormInteger(req.body?.level);

  if (level === null || level < 1 || level > MAX_TRAINING_LEVEL) {
    return res.redirect("/game/arena");
  }

  const battle = trainAgainstDummy(getAuthenticatedPlayer(res).id, level);
  req.session.trainingReport = { level, battle };
  return res.redirect(303, "/game/training");
});

export default router;
