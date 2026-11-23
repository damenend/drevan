import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createTrainingDummy,
  MAX_TRAINING_LEVEL,
  simulateBattle,
  type Combatant,
} from "../src/services/battle";

const player: Combatant = {
  name: "Player",
  hp: 100,
  strength: 10,
  speed: 1,
  defense: 0,
};

const enemy: Combatant = { ...player, name: "Enemy" };

test("training dummies scale from the starter to the highest level", () => {
  assert.deepEqual(createTrainingDummy(1), {
    name: "Training Dummy",
    hp: 10,
    strength: 2,
    speed: 2,
    defense: 0,
  });
  assert.equal(createTrainingDummy(3).defense, 0);
  assert.equal(createTrainingDummy(4).defense, 1);
  assert.deepEqual(createTrainingDummy(MAX_TRAINING_LEVEL), {
    name: "Training Dummy",
    hp: 505,
    strength: 101,
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
  const stats = { hp: 2000, strength: 1, defense: 100 };

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

test("playtest overrides preserve roll order and report simulated duration", () => {
  const rolls = [0.75, 0, 0, 0, 0, 0, 0];
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
      ["player", 5, false],
    ],
  );
  assert.equal(rolls.length, 0);
  assert.equal(result.elapsedTime, 100);
});
