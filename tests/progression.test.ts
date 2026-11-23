import assert from "node:assert/strict";
import test from "node:test";
import { getProgression } from "../src/services/progression";

test("progression grants one point per level through level 10", () => {
  const costs = [60, 150, 270, 420, 600, 810, 1050, 1320, 1620];
  const thresholds = [60, 210, 480, 900, 1500, 2310, 3360, 4680, 6300];

  for (const [index, threshold] of thresholds.entries()) {
    assert.deepEqual(getProgression(threshold - 1), {
      level: index + 1,
      currentLevelXp: costs[index] - 1,
      nextLevelXp: costs[index],
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

test("lifetime XP above the cap grants no further levels or points", () => {
  assert.deepEqual(getProgression(6300, 3), {
    level: 10,
    currentLevelXp: 0,
    nextLevelXp: null,
    unspentPoints: 6,
  });
  assert.deepEqual(getProgression(7000, 9), {
    level: 10,
    currentLevelXp: 700,
    nextLevelXp: null,
    unspentPoints: 0,
  });
});
