import type { ClassPassive } from "./class-passives";

export type Actor = "player" | "enemy";

type PassiveEffect =
  | { id: "precision"; name: string }
  | { id: "iron-resolve" | "arcane-surge"; name: string; damage: number };

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
      passiveEffects?: PassiveEffect[];
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
  passive?: ClassPassive;
};

export type BattleResult = {
  outcome: "win" | "loss" | "draw";
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
  passiveEffects?: PassiveEffect[];
};

function roundDamage(damage: number) {
  return Math.max(1, Math.round(damage));
}

/**
 * Applies outgoing bonuses before Defense and Iron Resolve after Defense.
 * Logs only effects that change the critical result or rounded damage.
 */
function generateDamage(
  attacker: Combatant,
  defender: Combatant,
  random: () => number,
  criticalChance: number,
): DamageResult {
  const maxDamage = Math.max(1, attacker.attackPower);
  const minDamage = Math.ceil(maxDamage * 0.5);

  let damage = Math.floor(random() * (maxDamage - minDamage + 1)) + minDamage;
  const passiveEffects: PassiveEffect[] = [];
  const { passive } = attacker;
  const criticalRoll = random();
  const precision =
    passive?.id === "precision" &&
    criticalRoll >= criticalChance &&
    criticalRoll < criticalChance + passive.criticalChanceBonus;
  const critical = criticalRoll < criticalChance || precision;

  if (critical) {
    damage = Math.ceil(damage * CRIT_MULTIPLIER);
  }
  if (precision) {
    passiveEffects.push({ id: passive.id, name: passive.name });
  }

  const effectiveDefense = Math.max(0, defender.defense);
  const damageReduction =
    MAX_DAMAGE_REDUCTION *
    (effectiveDefense / (effectiveDefense + HALF_MAX_REDUCTION_DEFENSE));
  const surged = passive?.id === "arcane-surge" && random() < passive.chance;
  const attackDamage = surged ? damage * (1 + passive.damageBonus) : damage;
  const defendedDamage = roundDamage(attackDamage * (1 - damageReduction));

  const ironResolve = defender.passive;
  const incomingMultiplier =
    ironResolve?.id === "iron-resolve" ? 1 - ironResolve.damageReduction : 1;
  const finalDamage = roundDamage(defendedDamage * incomingMultiplier);

  if (surged) {
    const damageWithoutSurge = roundDamage(
      roundDamage(damage * (1 - damageReduction)) * incomingMultiplier,
    );
    if (finalDamage > damageWithoutSurge) {
      passiveEffects.push({
        id: passive.id,
        name: passive.name,
        damage: finalDamage - damageWithoutSurge,
      });
    }
  }
  if (ironResolve?.id === "iron-resolve" && finalDamage < defendedDamage) {
    passiveEffects.push({
      id: ironResolve.id,
      name: ironResolve.name,
      damage: defendedDamage - finalDamage,
    });
  }

  return {
    damage: finalDamage,
    critical,
    ...(passiveEffects.length ? { passiveEffects } : {}),
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
    const hit = generateDamage(attacker, defender, random, criticalChance);

    defender.hp = Math.max(0, defender.hp - hit.damage);
    elapsedTime = Math.max(elapsedTime, attacker.nextAttack);
    attacker.nextAttack += attacker.attackInterval;

    battleLog.push({
      type: "attack",
      player: attacker.name,
      target: defender.name,
      ...hit,
      hp: defender.hp,
      actor,
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
    outcome,
    battleLog,
    startingPlayerHp: player.hp,
    startingEnemyHp: enemy.hp,
    playerHp,
    enemyHp,
    goldEarned,
    elapsedTime,
  };
}
