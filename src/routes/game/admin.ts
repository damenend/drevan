import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";

type EditableStat = "gold" | "strength" | "speed" | "maxHp";

const router = Router();

const allowedStats: EditableStat[] = ["gold", "strength", "speed", "maxHp"];

// Admin page
router.get("/", (req, res) => {
  const message = req.query.message;
  return res.render("game/admin", {
    title: "Admin",
    message: message ?? null,
  });
});

// Update player stats
router.post("/", (req, res) => {
  const requestedChanges = req.body.stats;

  // Validate submitted data
  if (
    !requestedChanges ||
    typeof requestedChanges !== "object" ||
    Array.isArray(requestedChanges)
  ) {
    return res.redirect("/game/admin?message=err");
  }

  const updates: Partial<Record<EditableStat, number>> = {};

  for (const [key, value] of Object.entries(requestedChanges)) {
    if (!allowedStats.includes(key as EditableStat)) continue;

    const stat = key as EditableStat;
    const parsedValue = Number(value);

    if (!Number.isSafeInteger(parsedValue) || parsedValue < 0) {
      return res.redirect("/game/admin?message=err");
    }

    updates[stat] = parsedValue;
  }

  // Nothing valid to update
  if (Object.keys(updates).length === 0) {
    return res.redirect("/game/admin?message=err");
  }

  // Update the logged-in player's stats
  const player = res.locals.user;

  db.update(users).set(updates).where(eq(users.id, player.id)).run();

  return res.redirect("/game/admin?message=success");
});

export default router;
