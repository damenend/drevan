import assert from "node:assert/strict";
import { test } from "node:test";
import { applyItemEffect } from "../src/services/items";

test("a healing item restores its listed amount when enough HP is missing", () => {
  const player = Object.freeze({ hp: 25, maxHp: 100 });

  assert.deepEqual(applyItemEffect(player, "heal", 50), {
    hp: 75,
    message: "Restored 50 HP.",
  });
});

test("healing caps at maximum HP and reports the actual amount restored", () => {
  assert.deepEqual(applyItemEffect({ hp: 93, maxHp: 100 }, "heal", 50), {
    hp: 100,
    message: "Restored 7 HP.",
  });
});

test("effects that restore no HP and unsupported effects return null", () => {
  const injured = { hp: 50, maxHp: 100 };

  assert.equal(applyItemEffect({ hp: 100, maxHp: 100 }, "heal", 50), null);
  assert.equal(applyItemEffect(injured, "heal", 0), null);
  assert.equal(applyItemEffect(injured, "heal", -10), null);
  assert.equal(applyItemEffect(injured, "strength", 10), null);
});
