import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../../db";
import { users, type CharacterClass } from "../../db/schema";
import { getAuthenticatedPlayer } from "../../middleware/auth";
import { formatCharacterClass } from "../../presentation/characters";
import { classPrimaryStats } from "../../services/character-stats";
import { classPassives } from "../../services/class-passives";
import { getProgression } from "../../services/progression";

type SelectableClass = Exclude<CharacterClass, "unaligned">;

const selectableClasses = {
  vanguard: {
    characterClass: "melee",
    description:
      "Master the art of close-quarters combat, overcoming adversaries through raw power and martial prowess.",
  },
  arcanist: {
    characterClass: "caster",
    description:
      "Harness the enigmatic energies of the old world, bending forgotten forces to your will.",
  },
  ranger: {
    characterClass: "ranged",
    description:
      "Strike from afar, relying on precision, dexterity, and calculated execution.",
  },
} as const satisfies Record<
  string,
  { characterClass: SelectableClass; description: string }
>;

const classOptions = Object.entries(selectableClasses).map(
  ([id, { characterClass, description }]) => {
    const attribute = classPrimaryStats[characterClass];
    return {
      id,
      characterClass,
      description,
      name: formatCharacterClass(characterClass),
      preferredAttribute: attribute[0].toUpperCase() + attribute.slice(1),
      passive: classPassives[characterClass],
    };
  },
);

function getSelectableClass(value: unknown): SelectableClass | undefined {
  return typeof value === "string" && Object.hasOwn(selectableClasses, value)
    ? selectableClasses[value as keyof typeof selectableClasses].characterClass
    : undefined;
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
    classOptions,
    message,
  });
});

router.post("/", (req, res) => {
  const { id } = getAuthenticatedPlayer(res);
  const characterClass = getSelectableClass(req.body?.characterClass);

  if (!characterClass) {
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
