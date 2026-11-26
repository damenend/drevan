import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { createTrainingDummy } from "./battle";
import { resolvePlayerBattle, type PlayerBattleReport } from "./player-battle";
import { getProgression } from "./progression";

export type TrainingBattle = PlayerBattleReport & {
  gainedLevel: number | null;
};

/**
 * Fights a validated training dummy level using the player's current
 * equipment and HP. Saves the result atomically, or returns null if the player
 * cannot fight.
 *
 * @param level - A whole number from 1 through MAX_TRAINING_LEVEL.
 */
export function trainAgainstDummy(
  playerId: number,
  level: number,
): TrainingBattle | null {
  const enemy = createTrainingDummy(level);
  const reward = level * 10;

  return db.transaction(
    (tx) => {
      const player = tx
        .select({
          id: users.id,
          name: users.name,
          hp: users.hp,
          exp: users.exp,
          gold: users.gold,
          characterClass: users.characterClass,
          strength: users.strength,
          strengthPoints: users.strengthPoints,
          agility: users.agility,
          agilityPoints: users.agilityPoints,
          intellect: users.intellect,
          intellectPoints: users.intellectPoints,
          fortitude: users.fortitude,
          fortitudePoints: users.fortitudePoints,
          speed: users.speed,
          speedPoints: users.speedPoints,
          defense: users.defense,
          equippedWeaponId: users.equippedWeaponId,
          equippedArmorId: users.equippedArmorId,
        })
        .from(users)
        .where(eq(users.id, playerId))
        .get();
      if (!player || player.hp <= 0) return null;

      const { battle, changes } = resolvePlayerBattle(
        player,
        enemy,
        { gold: reward, xp: reward },
        tx,
      );
      tx.update(users).set(changes).where(eq(users.id, player.id)).run();

      const newLevel = getProgression(changes.exp).level;
      return {
        ...battle,
        gainedLevel:
          newLevel > getProgression(player.exp).level ? newLevel : null,
      };
    },
    { behavior: "immediate" },
  );
}
