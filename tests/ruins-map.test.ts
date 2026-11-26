import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateRuinsEnemies,
  RUINS_ENCOUNTER_WEIGHTS,
  RUINS_ENTRANCE,
  RUINS_NEXT_FLOOR,
} from "../src/services/ruins-map";

test("Ruins generation creates a distinct finite population off reserved tiles", () => {
  for (const roll of [0, 0.5, 0.999]) {
    const enemies = generateRuinsEnemies(() => roll);
    assert.equal(enemies.length, 12);
    assert.equal(new Set(enemies.map(({ tile }) => tile)).size, enemies.length);
    assert.ok(enemies.every(({ tile }) => tile !== RUINS_ENTRANCE));
    assert.ok(enemies.every(({ tile }) => tile !== RUINS_NEXT_FLOOR));
  }
  assert.notDeepEqual(
    generateRuinsEnemies(() => 0),
    generateRuinsEnemies(() => 0.999),
  );
});

test("Ruins generation uses the configured relative weight cutoffs", () => {
  const rolls = [0, 0, 0, 0.6, 0, 0.9, ...Array.from({ length: 18 }, () => 0)];
  const enemies = generateRuinsEnemies(() => rolls.shift() ?? 0);
  assert.deepEqual(
    enemies.slice(0, 3).map(({ enemyId }) => enemyId),
    ["vault-scavenger", "fractured-sentinel", "alloy-warden"],
  );
  assert.deepEqual(RUINS_ENCOUNTER_WEIGHTS, {
    "vault-scavenger": 6,
    "fractured-sentinel": 3,
    "alloy-warden": 1,
  });
});
