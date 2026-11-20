import { Router } from "express";

const router = Router();

// Arena page
router.get("/", (req, res) => {
  const player = res.locals.user;
  const level = req.query.level;

  return res.render("game/arena", {
    title: "Dominion",
    dead: player.hp <= 0,
    level,
  });
});

export default router;
