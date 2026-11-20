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
  startingDummyHp: number;
  playerHp: number;
  dummyHp: number;
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

// Simulate combat between two combatants
export function simulateBattle(
  player: Combatant,
  enemy: Combatant,
  goldReward = 0,
): BattleResult {
  const startingPlayerHp = player.hp;
  const startingDummyHp = enemy.hp;

  let playerHp = startingPlayerHp;
  let dummyHp = startingDummyHp;

  const battleLog: BattleLogEntry[] = [];

  battleLog.push({
    type: "encounter",
    player: player.name,
    target: enemy.name,
  });

  // Calculate attack frequency based on speed
  const playerAttackInterval = 100 / Math.max(1, player.speed);
  const enemyAttackInterval = 100 / Math.max(1, enemy.speed);

  console.log("playerAttackInterval", playerAttackInterval);
  console.log("enemyAttackInterval", enemyAttackInterval);

  // Schedule the first attacks
  let nextPlayerAttack = playerAttackInterval;
  let nextEnemyAttack = enemyAttackInterval;

  let attackCount = 0;

  // Continue until someone is defeated or the attack limit is reached
  while (playerHp > 0 && dummyHp > 0 && attackCount < MAX_ATTACKS) {
    const playerAttacks = nextPlayerAttack <= nextEnemyAttack;

    if (playerAttacks) {
      const { damage, critical } = generateDamage(player.strength);

      dummyHp = Math.max(0, dummyHp - damage);

      battleLog.push({
        type: "attack",
        player: player.name,
        target: enemy.name,
        damage,
        hp: dummyHp,
        actor: "player",
        critical,
      });

      nextPlayerAttack += playerAttackInterval;
    } else {
      const { damage, critical } = generateDamage(enemy.strength);

      playerHp = Math.max(0, playerHp - damage);

      battleLog.push({
        type: "attack",
        player: enemy.name,
        target: player.name,
        damage,
        hp: playerHp,
        actor: "enemy",
        critical,
      });

      nextEnemyAttack += enemyAttackInterval;
    }

    attackCount++;
  }

  // Determine the outcome
  let outcome: "win" | "loss" | "draw";

  if (dummyHp <= 0) {
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
    startingPlayerHp,
    startingDummyHp,
    playerHp,
    dummyHp,
    goldEarned,
  };
}
