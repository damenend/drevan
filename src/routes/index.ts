import { Router } from "express";

import authRouter from "./auth";
import gameRouter from "./game";

const router = Router();

// Public homepage
router.get("/", (req, res) => {
  return res.render("index", {
    title: null,
  });
});

// Application routes
router.use("/", authRouter);
router.use("/game", gameRouter);

export default router;
