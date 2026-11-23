import assert from "node:assert/strict";
import test from "node:test";
import { getProgression } from "../src/services/progression";

test("progression grants one point per level through level 10", () => {
  const thresholds = [60, 150, 270, 420, 600, 810, 1050, 1320, 1620];

  for (const [index, threshold] of thresholds.entries()) {
    assert.deepEqual(getProgression(threshold - 1), {
      level: index + 1,
      nextLevelXp: threshold,
      unspentPoints: index,
    });
    assert.equal(getProgression(threshold).level, index + 2);
    assert.equal(getProgression(threshold).unspentPoints, index + 1);
  }
});

test("lifetime XP above the cap grants no further levels or points", () => {
  assert.deepEqual(getProgression(1620, 3), {
    level: 10,
    nextLevelXp: null,
    unspentPoints: 6,
  });
  assert.deepEqual(getProgression(5000, 9), {
    level: 10,
    nextLevelXp: null,
    unspentPoints: 0,
  });
});
