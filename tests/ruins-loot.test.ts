import assert from "node:assert/strict";
import { test } from "node:test";
import { materials } from "../src/db/ruins-loot-catalog";
import { rollRuinsLoot } from "../src/services/ruins-loot";

test("Scavenger entries roll independently and an exact cutoff misses", () => {
  const rolls = [0.2, 0.299, 0.25, 0.149, 0.99, 0.99, 0.99, 0.99, 0.99];
  assert.deepEqual(
    rollRuinsLoot("vault-scavenger", () => rolls.shift()!),
    [
      { item: "Metal Scraps", quantity: 1 },
      { item: "Shattered Alloy", quantity: 1 },
    ],
  );
  assert.deepEqual(rolls, []);
  assert.deepEqual(
    rollRuinsLoot("vault-scavenger", () => 0.99),
    [],
  );
  assert.equal(
    rollRuinsLoot("vault-scavenger", () => 0.199)[0]?.item,
    "Lesser Potion",
  );
});

test("Warden can drop every catalog material and Sentinel has no entries", () => {
  assert.deepEqual(
    rollRuinsLoot("alloy-warden", () => 0),
    materials.map(({ name }) => ({ item: name, quantity: 1 })),
  );
  assert.deepEqual(
    rollRuinsLoot("fractured-sentinel", () => assert.fail("Unexpected roll")),
    [],
  );
});
