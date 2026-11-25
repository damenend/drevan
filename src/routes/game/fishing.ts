import { Router } from "express";
import { getAuthenticatedPlayer } from "../../middleware/auth";
import { DAILY_CAST_LIMIT, getDailyCastsUsed } from "../../services/fishing";
import { castFishingLine } from "../../services/fishing-cast";

const router = Router();

// Fishing page
router.get("/", (req, res) => {
  const player = getAuthenticatedPlayer(res);
  const castsUsed = getDailyCastsUsed(
    player.fishingCastsUsed,
    player.fishingCastDate,
  );

  const report = req.query.cast === "1" ? req.session.fishingReport : undefined;
  if (report) delete req.session.fishingReport;

  return res.render("game/fishing", {
    title: "The Driftwater",
    report,
    castsRemaining: Math.max(0, DAILY_CAST_LIMIT - castsUsed),
  });
});

router.post("/", (req, res) => {
  const result = castFishingLine(getAuthenticatedPlayer(res).id);
  if (!result) return res.redirect(303, "/game/fishing");
  req.session.fishingReport = result;
  return res.redirect(303, "/game/fishing?cast=1");
});

export default router;
