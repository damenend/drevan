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
  strength: number;
  speed: number;
};

export type BattleResult = {
  battleLog: BattleLogEntry[];
  startingPlayerHp: number;
  startingEnemyHp: number;
  playerHp: number;
  enemyHp: number;
  goldEarned: number;
};

export const MAX_TRAINING_LEVEL = 100;

const MAX_ATTACKS = 1000;
const BASE_CRIT_CHANCE = 0.05;
const CRIT_MULTIPLIER = 1.5;

// Create a training dummy based on its level
export function createTrainingDummy(level: number): Combatant {
  return {
    name: "Training Dummy",
    hp: 10 + (level - 1) * 5,
    strength: 2 + (level - 1),
    speed: 2 + (level - 1),
  };
}

type DamageResult = {
  damage: number;
  critical: boolean;
};

function generateDamage(strength: number): DamageResult {
  const maxDamage = Math.max(1, strength);
  const minDamage = Math.ceil(maxDamage * 0.5);

  // Generate base damage
  let damage =
    Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;

  // Determine whether this attack is critical
  const critical = Math.random() < BASE_CRIT_CHANCE;

  if (critical) {
    damage = Math.ceil(damage * CRIT_MULTIPLIER);
  }

  return {
    damage,
    critical,
  };
}

function createBattleState(combatant: Combatant) {
  const speed = Math.max(1, combatant.speed);
  return { ...combatant, speed, attackInterval: 100 / speed, nextAttack: 0 };
}

// Simulate combat between two combatants
export function simulateBattle(
  player: Combatant,
  enemy: Combatant,
  goldReward = 0,
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
    Math.random() < playerInitiativeChance ? "player" : "enemy";

  for (let attackCount = 0; attackCount < MAX_ATTACKS; attackCount++) {
    if (combatants.player.hp <= 0 || combatants.enemy.hp <= 0) break;

    // Both opening attacks are due at time zero. The roll decides their order.
    const actor: Actor =
      attackCount === 0
        ? firstAttacker
        : combatants.player.nextAttack <= combatants.enemy.nextAttack
          ? "player"
          : "enemy";
    const attacker = combatants[actor];
    const defender = combatants[actor === "player" ? "enemy" : "player"];
    const { damage, critical } = generateDamage(attacker.strength);

    defender.hp = Math.max(0, defender.hp - damage);
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
  };
}
