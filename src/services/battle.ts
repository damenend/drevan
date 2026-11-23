export type Actor = "player" | "enemy";

export type BattleLogEntry =
  | {
      type: "encounter";
      target: string;
      player: string;
    }
  | {
      type: "attack";
      target: string;
      player: string;
      damage: number;
      hp: number;
      actor: Actor;
      critical: boolean;
    }
  | {
      type: "outcome";
      result: "win" | "loss" | "draw";
      reward?: number;
      player: string;
    };

export type Combatant = {
  name: string;
  hp: number;
  attackPower: number;
  speed: number;
  defense: number;
};

export type BattleResult = {
  battleLog: BattleLogEntry[];
  startingPlayerHp: number;
  startingEnemyHp: number;
  playerHp: number;
  enemyHp: number;
  goldEarned: number;
  elapsedTime: number;
};

export const MAX_TRAINING_LEVEL = 100;

const MAX_ATTACKS = 1000;
const BASE_CRIT_CHANCE = 0.05;
const CRIT_MULTIPLIER = 1.5;
const MAX_DAMAGE_REDUCTION = 0.6;
const HALF_MAX_REDUCTION_DEFENSE = 10;

/**
 * Builds a training opponent using the stats for the selected level.
 *
 * @param level - A whole number from 1 through MAX_TRAINING_LEVEL.
 */
export function createTrainingDummy(level: number): Combatant {
  return {
    name: "Training Dummy",
    hp: 10 + (level - 1) * 5,
    attackPower: 2 + (level - 1),
    speed: 2 + (level - 1),
    defense: Math.floor(level / 4),
  };
}

type DamageResult = {
  damage: number;
  critical: boolean;
};

/**
 * Rolls base damage, rounds up any critical bonus, then applies Defense.
 * Final damage rounds to the nearest whole number with a minimum of 1.
 */
function generateDamage(
  attackPower: number,
  defense: number,
  random: () => number,
  criticalChance: number,
): DamageResult {
  const maxDamage = Math.max(1, attackPower);
  const minDamage = Math.ceil(maxDamage * 0.5);

  // Generate base damage
  let damage = Math.floor(random() * (maxDamage - minDamage + 1)) + minDamage;

  // Determine whether this attack is critical
  const critical = random() < criticalChance;

  if (critical) {
    damage = Math.ceil(damage * CRIT_MULTIPLIER);
  }

  const effectiveDefense = Math.max(0, defense);
  const damageReduction =
    MAX_DAMAGE_REDUCTION *
    (effectiveDefense / (effectiveDefense + HALF_MAX_REDUCTION_DEFENSE));

  return {
    damage: Math.max(1, Math.round(damage * (1 - damageReduction))),
    critical,
  };
}

function createBattleState(combatant: Combatant) {
  const speed = Math.max(1, combatant.speed);
  return { ...combatant, speed, attackInterval: 100 / speed, nextAttack: 0 };
}

/**
 * Picks the earlier attack. An optional independent roll resolves later ties,
 * including times that differ only because of accumulated floating-point error.
 */
function nextAttacker(
  playerTime: number,
  enemyTime: number,
  rollTimingTie: (() => number) | null,
): Actor {
  const tolerance = Math.max(playerTime, enemyTime) * 1e-12;
  if (rollTimingTie && Math.abs(playerTime - enemyTime) <= tolerance) {
    return rollTimingTie() < 0.5 ? "player" : "enemy";
  }
  return playerTime <= enemyTime ? "player" : "enemy";
}

/**
 * Resolves a fight and records each attack for the battle log.
 * The simulation leaves the input combatants and database unchanged.
 *
 * @param goldReward - Gold included in the result if the player wins.
 * @param options - Playtest overrides for combat rolls, critical chance, and a separate
 * random source for resolving later ties. Pass null for the historical
 * player-first rule when reproducing old playtests.
 * @returns Battle log, HP totals, gold earned, and the last attack's time on the
 * simulator clock (an interval of 100 at Speed 1).
 */
export function simulateBattle(
  player: Combatant,
  enemy: Combatant,
  goldReward = 0,
  {
    random = Math.random,
    criticalChance = BASE_CRIT_CHANCE,
    rollTimingTie = random,
  }: {
    random?: () => number;
    criticalChance?: number;
    rollTimingTie?: (() => number) | null;
  } = {},
): BattleResult {
  const combatants = {
    player: createBattleState(player),
    enemy: createBattleState(enemy),
  };
  const battleLog: BattleLogEntry[] = [
    { type: "encounter", player: player.name, target: enemy.name },
  ];
  const playerInitiativeChance =
    combatants.player.speed /
    (combatants.player.speed + combatants.enemy.speed);
  const firstAttacker: Actor =
    random() < playerInitiativeChance ? "player" : "enemy";

  let elapsedTime = 0;
  for (let attackCount = 0; attackCount < MAX_ATTACKS; attackCount++) {
    if (combatants.player.hp <= 0 || combatants.enemy.hp <= 0) break;

    // Both opening attacks are due at time zero. The roll decides their order.
    const actor: Actor =
      attackCount === 0
        ? firstAttacker
        : nextAttacker(
            combatants.player.nextAttack,
            combatants.enemy.nextAttack,
            rollTimingTie,
          );
    const attacker = combatants[actor];
    const defender = combatants[actor === "player" ? "enemy" : "player"];
    const { damage, critical } = generateDamage(
      attacker.attackPower,
      defender.defense,
      random,
      criticalChance,
    );

    defender.hp = Math.max(0, defender.hp - damage);
    elapsedTime = Math.max(elapsedTime, attacker.nextAttack);
    attacker.nextAttack += attacker.attackInterval;

    battleLog.push({
      type: "attack",
      player: attacker.name,
      target: defender.name,
      damage,
      hp: defender.hp,
      actor,
      critical,
    });
  }

  const playerHp = combatants.player.hp;
  const enemyHp = combatants.enemy.hp;

  // Determine the outcome
  let outcome: "win" | "loss" | "draw";

  if (enemyHp <= 0) {
    outcome = "win";
  } else if (playerHp <= 0) {
    outcome = "loss";
  } else {
    outcome = "draw";
  }

  const goldEarned = outcome === "win" ? goldReward : 0;

  battleLog.push({
    type: "outcome",
    result: outcome,
    reward: outcome === "win" ? goldReward : undefined,
    player: player.name,
  });

  return {
    battleLog,
    startingPlayerHp: player.hp,
    startingEnemyHp: enemy.hp,
    playerHp,
    enemyHp,
    goldEarned,
    elapsedTime,
  };
}
