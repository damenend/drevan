import assert from "node:assert/strict";
import { test } from "node:test";
import { materials, ruinsEquipment } from "../src/db/ruins-loot-catalog";
import { rollRuinsLoot } from "../src/services/ruins-loot";

test("Scavenger entries roll independently and an exact cutoff misses", () => {
  const rolls = [
    0.2, 0.299, 0.25, 0.149, 0.99, 0.99, 0.99, 0.99, 0.99, 0.05, 0.049, 0.01,
    0.009,
  ];
  assert.deepEqual(
    rollRuinsLoot("vault-scavenger", () => rolls.shift()!),
    [
      { item: "Metal Scraps", quantity: 1 },
      { item: "Shattered Alloy", quantity: 1 },
      { item: "Wooden Shield", quantity: 1 },
      { item: "Reinforced Bracers", quantity: 1 },
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

test("Warden can drop every material and its four equipment rewards", () => {
  assert.deepEqual(
    rollRuinsLoot("alloy-warden", () => 0),
    [
      ...materials.map(({ name }) => name),
      "Reinforced Sword",
      "Reinforced Bracers",
      "Ancient Blade",
      "Ancient Plate",
    ].map((item) => ({ item, quantity: 1 })),
  );
  assert.deepEqual(
    rollRuinsLoot("fractured-sentinel", () => assert.fail("Unexpected roll")),
    [],
  );
});

test("Scavenger equipment is limited to the Wooden and Reinforced tiers", () => {
  assert.deepEqual(
    rollRuinsLoot("vault-scavenger", () => 0).filter(({ item }) =>
      ruinsEquipment.some(({ name }) => name === item),
    ),
    [
      "Wooden Axe",
      "Wooden Shield",
      "Reinforced Sword",
      "Reinforced Bracers",
    ].map((item) => ({ item, quantity: 1 })),
  );
});
