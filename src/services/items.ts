type PlayerStats = {
  hp: number;
  maxHp: number;
};

type ItemEffectResult = {
  hp: number;
  message: string;
};

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
        message: `Restored ${healed} HP.`,
      };
    }

    default:
      return null;
  }
}
