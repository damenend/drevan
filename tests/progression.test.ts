import assert from "node:assert/strict";
import test from "node:test";
import { getProgression, MAX_PLAYER_LEVEL } from "../src/services/progression";

test("progression grants one point per level through level 100", () => {
  const costs = Array.from(
    { length: MAX_PLAYER_LEVEL - 1 },
    (_, index) => 15 * (index + 1) * (index + 4),
  );
  let threshold = 0;

  for (const [index, cost] of costs.entries()) {
    threshold += cost;
    assert.deepEqual(getProgression(threshold - 1), {
      level: index + 1,
      currentLevelXp: cost - 1,
      nextLevelXp: cost,
      unspentPoints: index,
    });
    assert.deepEqual(getProgression(threshold), {
      level: index + 2,
      currentLevelXp: 0,
      nextLevelXp: costs[index + 1] ?? null,
      unspentPoints: index + 1,
    });
  }
});

test("excess XP carries over even when a win crosses multiple levels", () => {
  assert.deepEqual(getProgression(110), {
    level: 2,
    currentLevelXp: 50,
    nextLevelXp: 150,
    unspentPoints: 1,
  });
  assert.deepEqual(getProgression(500), {
    level: 4,
    currentLevelXp: 20,
    nextLevelXp: 420,
    unspentPoints: 3,
  });
});

test("lifetime XP above level 100 grants no further levels or points", () => {
  assert.deepEqual(getProgression(5_148_000, 3), {
    level: 100,
    currentLevelXp: 0,
    nextLevelXp: null,
    unspentPoints: 96,
  });
  assert.deepEqual(getProgression(5_148_700, 99), {
    level: 100,
    currentLevelXp: 700,
    nextLevelXp: null,
    unspentPoints: 0,
  });
});
