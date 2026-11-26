import { formatNumber } from "../utils/format-number";

type PlayerStats = {
  hp: number;
  maxHp: number;
};

type ItemEffectResult = {
  hp: number;
  message: string;
};

/**
 * Calculates an item's effect without updating the player or inventory.
 * Healing restores at most the player's missing HP. Revival works only at
 * zero HP and restores exactly 1 HP.
 *
 * @returns The new HP and display message, or null if the effect is unsupported
 * or would restore no HP.
 */
export function applyItemEffect(
  player: PlayerStats,
  effect: string,
  value: number,
): ItemEffectResult | null {
  switch (effect) {
    case "heal": {
      const healed = Math.min(value, Math.max(0, player.maxHp - player.hp));

      if (healed <= 0) {
        return null;
      }

      return {
        hp: player.hp + healed,
        message: `Restored ${formatNumber(healed)} HP.`,
      };
    }

    case "revive":
      return player.hp === 0 && value === 1
        ? { hp: 1, message: "Revived with 1 HP." }
        : null;

    default:
      return null;
  }
}
