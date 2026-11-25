import { Router } from "express";

import authRouter from "./auth";
import gameRouter from "./game";

const router = Router();

// Public homepage
router.get("/", (req, res) => {
  const registering = req.query.view === "register";
  return res.render("index", {
    title: registering ? "Create an account" : "Log in",
    authView: registering ? "register" : "login",
  });
});

// Application routes
router.use("/", authRouter);
router.use("/game", gameRouter);

export default router;
