import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getDailyCastsUsed,
  getFishingDate,
  rollFishingCatch,
} from "../src/services/fishing";

test("a cast at the bite cutoff comes up empty and uses only one roll", () => {
  let rolls = 0;

  assert.equal(
    rollFishingCatch(() => {
      rolls += 1;
      return 0.8;
    }),
    null,
  );
  assert.equal(rolls, 1);
});

test("a bite rolls for species using the 70% and 95% cutoffs", () => {
  const outcomes: [number, string][] = [
    [0, "Murkfin"],
    [0.69999, "Murkfin"],
    [0.7, "Glassscale"],
    [0.94999, "Glassscale"],
    [0.95, "Astral Koi"],
    [0.99999, "Astral Koi"],
  ];

  for (const [speciesRoll, expected] of outcomes) {
    const rolls = [0.79999, speciesRoll].values();
    const caught = rollFishingCatch(() => {
      const roll = rolls.next();
      assert.equal(roll.done, false);
      return roll.value;
    });

    assert.equal(caught, expected);
    assert.equal(rolls.next().done, true);
  }
});

test("the fishing date changes at Central midnight in summer and winter", () => {
  assert.equal(getFishingDate(new Date("2026-07-02T04:59:59Z")), "2026-07-01");
  assert.equal(getFishingDate(new Date("2026-07-02T05:00:00Z")), "2026-07-02");
  assert.equal(getFishingDate(new Date("2026-01-02T05:59:59Z")), "2026-01-01");
  assert.equal(getFishingDate(new Date("2026-01-02T06:00:00Z")), "2026-01-02");
});

test("only casts saved for the current fishing day count", () => {
  const today = "2026-07-02";

  assert.equal(getDailyCastsUsed(49, today, today), 49);
  assert.equal(getDailyCastsUsed(50, "2026-07-01", today), 0);
  assert.equal(getDailyCastsUsed(0, null, today), 0);
});
