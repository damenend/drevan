import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createTrainingDummy,
  MAX_TRAINING_LEVEL,
  simulateBattle,
  type Combatant,
} from "../src/services/battle";
import { classPassives } from "../src/services/class-passives";

const player: Combatant = {
  name: "Player",
  hp: 100,
  attackPower: 10,
  speed: 1,
  defense: 0,
};

const enemy: Combatant = { ...player, name: "Enemy" };

function openingAttack(
  attacker: Combatant,
  defender: Combatant,
  actor: "player" | "enemy",
  ...damageRolls: number[]
) {
  const rolls = [actor === "player" ? 0 : 0.75, ...damageRolls];
  const target = { ...defender, hp: 1 };
  const [first, second] =
    actor === "player" ? [attacker, target] : [target, attacker];
  const { battleLog } = simulateBattle(first, second, 0, {
    random: () => {
      const roll = rolls.shift();
      assert.ok(roll !== undefined, "Unexpected combat roll");
      return roll;
    },
  });
  assert.equal(rolls.length, 0);
  const attacks = battleLog.filter((entry) => entry.type === "attack");
  assert.equal(attacks.length, 1);
  assert.equal(attacks[0].actor, actor);
  return attacks[0];
}

test("Iron Resolve reduces damage for the defender after Defense", () => {
  const attacker = { ...enemy, attackPower: 60 };
  const defender = { ...player, defense: 10 };
  const normal = openingAttack(attacker, defender, "enemy", 0, 0.5);
  assert.equal(normal.damage, 21);
  assert.equal(normal.passiveEffects, undefined);

  const vanguard = { ...defender, passive: classPassives.melee };
  const reduced = openingAttack(attacker, vanguard, "enemy", 0, 0.5);
  assert.equal(reduced.damage, 19);
  assert.deepEqual(reduced.passiveEffects, [
    { id: "iron-resolve", name: "Iron Resolve", damage: 2 },
  ]);
  const minimum = openingAttack(
    { ...attacker, attackPower: 1 },
    vanguard,
    "enemy",
    0,
    0.5,
  );
  assert.equal(minimum.damage, 1);
  assert.equal(minimum.passiveEffects, undefined);
});

test("Precision only appears in the log when its bonus turns a roll critical", () => {
  const ranger = { ...player, passive: classPassives.ranged };
  const unaligned = { ...player, passive: classPassives.unaligned };
  const ordinary = openingAttack(unaligned, enemy, "player", 0, 0.05);
  assert.equal(ordinary.critical, false);
  assert.equal(ordinary.damage, 5);
  assert.equal(ordinary.passiveEffects, undefined);

  const natural = openingAttack(ranger, enemy, "player", 0, 0.049);
  assert.equal(natural.critical, true);
  assert.equal(natural.damage, 8);
  assert.equal(natural.passiveEffects, undefined);

  const precise = openingAttack(ranger, enemy, "enemy", 0, 0.05);
  assert.equal(precise.critical, true);
  assert.equal(precise.damage, 8);
  assert.deepEqual(precise.passiveEffects, [
    { id: "precision", name: "Precision" },
  ]);

  const missed = openingAttack(ranger, enemy, "player", 0, 0.1);
  assert.equal(missed.critical, false);
  assert.equal(missed.damage, 5);
  assert.equal(missed.passiveEffects, undefined);
});

test("Arcane Surge rolls once per attack and records its damage after mitigation", () => {
  const arcanist = {
    ...player,
    attackPower: 20,
    passive: classPassives.caster,
  };
  const vanguard = { ...enemy, defense: 10, passive: classPassives.melee };
  const surged = openingAttack(arcanist, vanguard, "player", 0, 0, 0.099);
  assert.equal(surged.critical, true);
  assert.equal(surged.damage, 12);
  assert.deepEqual(surged.passiveEffects, [
    { id: "arcane-surge", name: "Arcane Surge", damage: 2 },
    { id: "iron-resolve", name: "Iron Resolve", damage: 1 },
  ]);

  const missed = openingAttack(arcanist, vanguard, "player", 0, 0, 0.1);
  assert.equal(missed.damage, 10);
  assert.deepEqual(missed.passiveEffects, [
    { id: "iron-resolve", name: "Iron Resolve", damage: 1 },
  ]);

  const roundedAway = openingAttack(
    { ...arcanist, attackPower: 1 },
    vanguard,
    "player",
    0,
    0.5,
    0,
  );
  assert.equal(roundedAway.damage, 1);
  assert.equal(roundedAway.passiveEffects, undefined);
});

test("training dummies scale from the starter to the highest level", () => {
  assert.deepEqual(createTrainingDummy(1), {
    name: "Training Dummy",
    hp: 10,
    attackPower: 2,
    speed: 2,
    defense: 0,
  });
  assert.equal(createTrainingDummy(3).defense, 0);
  assert.equal(createTrainingDummy(4).defense, 1);
  assert.deepEqual(createTrainingDummy(MAX_TRAINING_LEVEL), {
    name: "Training Dummy",
    hp: 505,
    attackPower: 101,
    speed: 101,
    defense: 25,
  });
});

test("Defense reduces critical damage before final rounding", (t) => {
  const rolls = [0, 0, 0.049]; // Initiative, minimum base damage, critical hit
  t.mock.method(Math, "random", () => rolls.shift());
  const defender = Object.freeze({ ...enemy, hp: 4, defense: 10 });
  const attacker = Object.freeze({ ...player });

  const result = simulateBattle(attacker, defender, 40);

  assert.deepEqual(result.battleLog, [
    { type: "encounter", player: "Player", target: "Enemy" },
    {
      type: "attack",
      player: "Player",
      target: "Enemy",
      damage: 6,
      hp: 0,
      actor: "player",
      critical: true,
    },
    { type: "outcome", result: "win", reward: 40, player: "Player" },
  ]);
  assert.equal(result.startingEnemyHp, 4);
  assert.equal(result.enemyHp, 0);
  assert.equal(result.goldEarned, 40);
});

test("Speed determines the opening odds and later attack frequency", (t) => {
  const rolls = t.mock.method(Math, "random", () => 0.25);

  const result = simulateBattle(
    { ...player, speed: 0, hp: 40 },
    { ...enemy, speed: 3 },
    40,
    { rollTimingTie: () => 0.25 },
  );
  const attacks = result.battleLog.filter((entry) => entry.type === "attack");

  assert.deepEqual(
    attacks.slice(0, 5).map((entry) => entry.actor),
    ["enemy", "player", "enemy", "enemy", "player"],
  );
  assert.equal(rolls.mock.callCount(), 1 + 2 * attacks.length);
  assert.equal(result.playerHp, 0);
  assert.equal(result.goldEarned, 0);
  assert.deepEqual(result.battleLog.at(-1), {
    type: "outcome",
    result: "loss",
    reward: undefined,
    player: "Player",
  });
});

test("combat ends in a draw after 1,000 attacks and damage stays at least 1", (t) => {
  t.mock.method(Math, "random", () => 0.5);
  const stats = { hp: 2000, attackPower: 1, defense: 100 };

  const result = simulateBattle(
    { ...player, ...stats },
    { ...enemy, ...stats },
    40,
  );
  const attacks = result.battleLog.filter((entry) => entry.type === "attack");

  assert.equal(attacks.length, 1000);
  assert.ok(attacks.every((entry) => entry.damage === 1));
  assert.deepEqual(result.battleLog.at(-1), {
    type: "outcome",
    result: "draw",
    reward: undefined,
    player: "Player",
  });
  assert.equal(result.goldEarned, 0);
});

test("default timing ties use an even roll and can end a fight before the reply", () => {
  const rolls = [0.75, 0, 0, 0, 0, 0.5, 0, 0];
  const result = simulateBattle(
    { ...player, hp: 10 },
    { ...enemy, hp: 10 },
    0,
    { random: () => rolls.shift() ?? 0, criticalChance: 0 },
  );
  const attacks = result.battleLog.filter((entry) => entry.type === "attack");

  assert.deepEqual(
    attacks.map(({ actor, damage, critical }) => [actor, damage, critical]),
    [
      ["enemy", 5, false],
      ["player", 5, false],
      ["enemy", 5, false],
    ],
  );
  assert.equal(rolls.length, 0);
  assert.equal(result.elapsedTime, 100);
});

test("the simulator rolls at later ties, including rounded intervals", (t) => {
  const rollTimingTie = t.mock.fn(() => 0.75);
  const result = simulateBattle(
    { ...player, speed: 3, hp: 25 },
    { ...enemy, speed: 9 },
    0,
    { random: () => 0, criticalChance: 0, rollTimingTie },
  );
  const attacks = result.battleLog.filter((entry) => entry.type === "attack");

  // At 100 / 3, the enemy's fourth attack and the player's second are due.
  // The enemy wins the tie and lands the fifth hit before the next player attack.
  assert.deepEqual(
    attacks.map(({ actor }) => actor),
    ["player", "enemy", "enemy", "enemy", "enemy", "player", "enemy"],
  );
  assert.equal(rollTimingTie.mock.callCount(), 1);
  assert.equal(result.playerHp, 0);
});
