import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../../db";
import { getAuthenticatedPlayer } from "../../middleware/auth";
import { getProgression } from "../../services/progression";
import { users } from "../../db/schema";
import type { CharacterClass } from "../../db/schema";

type SelectableClass = Exclude<CharacterClass, "unaligned">;

const selectableClasses = new Set<string>(["melee", "ranged", "caster"]);

function isSelectableClass(value: unknown): value is SelectableClass {
  return typeof value === "string" && selectableClasses.has(value);
}

const router = Router();

router.get("/", (req, res) => {
  const player = getAuthenticatedPlayer(res);
  let message;
  if (req.query.update === "true") {
    message = "Your class has been updated.";
  } else if (req.query.unchanged === "true") {
    message = "You already belong to that class.";
  } else if (req.query.err === "true") {
    message = "Choose a valid class after reaching level 10.";
  }

  return res.render("game/conclave", {
    title: "The Conclave",
    level: getProgression(player.exp).level,
    message,
  });
});

router.post("/", (req, res) => {
  const { id } = getAuthenticatedPlayer(res);
  const characterClass: unknown = req.body?.characterClass;

  if (!isSelectableClass(characterClass)) {
    return res.redirect(303, "/game/conclave?err=true");
  }

  const result = db.transaction(
    (tx) => {
      const player = tx
        .select({
          characterClass: users.characterClass,
          exp: users.exp,
        })
        .from(users)
        .where(eq(users.id, id))
        .get();

      if (!player || getProgression(player.exp).level < 10) return "error";
      if (player.characterClass === characterClass) return "unchanged";

      const update = tx
        .update(users)
        .set({ characterClass })
        .where(
          and(
            eq(users.id, id),
            eq(users.characterClass, player.characterClass),
          ),
        )
        .run();

      return update.changes === 1 ? "updated" : "error";
    },
    { behavior: "immediate" },
  );

  if (result === "unchanged") {
    return res.redirect(303, "/game/conclave?unchanged=true");
  }
  if (result === "error") {
    return res.redirect(303, "/game/conclave?err=true");
  }

  return res.redirect(303, "/game/conclave?update=true");
});

export default router;
