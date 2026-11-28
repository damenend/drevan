import { formatPlayerName } from "../utils/format-player-name";
import { simulateBattle, type BattleResult, type Combatant } from "./battle";
import { classPassives } from "./class-passives";
import { getEffectiveStats } from "./equipment";

export type PlayerBattleReport = BattleResult & { xpEarned: number };

type BattlePlayer = Parameters<typeof getEffectiveStats>[0] & {
  name: string;
  hp: number;
  gold: number;
  exp: number;
};

function capReward(balance: number, reward: number) {
  return Math.min(reward, Math.max(0, Number.MAX_SAFE_INTEGER - balance));
}

/**
 * Resolves a fight for a living player using owned equipment from the caller's
 * transaction. Returns the report and player changes. The caller saves the
 * changes together with any encounter-specific state.
 */
export function resolvePlayerBattle(
  player: BattlePlayer,
  enemy: Combatant,
  rewards: { gold: number; xp: number },
  database: NonNullable<Parameters<typeof getEffectiveStats>[1]>,
) {
  const result = simulateBattle(
    {
      name: formatPlayerName(player.name),
      hp: player.hp,
      ...getEffectiveStats(player, database),
      passive: classPassives[player.characterClass],
    },
    enemy,
    capReward(player.gold, rewards.gold),
  );
  const xpEarned =
    result.outcome === "win" ? capReward(player.exp, rewards.xp) : 0;
  const battle: PlayerBattleReport = { ...result, xpEarned };
  return {
    battle,
    changes: {
      hp: battle.playerHp,
      gold: player.gold + battle.goldEarned,
      exp: player.exp + battle.xpEarned,
    },
  };
}
