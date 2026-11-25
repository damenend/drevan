import { LESSER_POTION, type materials } from "../db/ruins-loot-catalog";

export type RuinsEnemyId =
  "vault-scavenger" | "fractured-sentinel" | "alloy-warden";

type LootItem = typeof LESSER_POTION | (typeof materials)[number]["name"];
type LootEntry = {
  item: LootItem;
  chance: number;
  quantity: number | readonly [min: number, max: number];
};

const lootTables: Record<RuinsEnemyId, readonly LootEntry[]> = {
  "vault-scavenger": [
    { item: LESSER_POTION, chance: 0.2, quantity: 1 },
    { item: "Metal Scraps", chance: 0.3, quantity: 1 },
    { item: "Frayed Circuitry", chance: 0.25, quantity: 1 },
    { item: "Shattered Alloy", chance: 0.15, quantity: 1 },
    { item: "Dormant Microchip", chance: 0.1, quantity: 1 },
    { item: "Enchantment Powder", chance: 0.08, quantity: 1 },
    { item: "Power Cell", chance: 0.05, quantity: 1 },
    { item: "Arcane Residue", chance: 0.04, quantity: 1 },
    { item: "Crystallized Aether", chance: 0.01, quantity: 1 },
  ],
  "fractured-sentinel": [],
  "alloy-warden": [
    { item: "Metal Scraps", chance: 0.4, quantity: 1 },
    { item: "Frayed Circuitry", chance: 0.25, quantity: 1 },
    { item: "Shattered Alloy", chance: 0.3, quantity: 1 },
    { item: "Dormant Microchip", chance: 0.2, quantity: 1 },
    { item: "Enchantment Powder", chance: 0.1, quantity: 1 },
    { item: "Power Cell", chance: 0.15, quantity: 1 },
    { item: "Arcane Residue", chance: 0.08, quantity: 1 },
    { item: "Crystallized Aether", chance: 0.03, quantity: 1 },
    { item: "Fractured Energy Core", chance: 0.02, quantity: 1 },
    { item: "Voidstone Fragment", chance: 0.01, quantity: 1 },
  ],
};

for (const entries of Object.values(lootTables)) {
  for (const { item, chance, quantity } of entries) {
    const [min, max] =
      typeof quantity === "number" ? [quantity, quantity] : quantity;
    if (
      !(chance >= 0 && chance <= 1) ||
      !Number.isSafeInteger(min) ||
      !Number.isSafeInteger(max) ||
      min < 1 ||
      max < min
    ) {
      throw new Error(`Invalid Ruins loot entry for ${item}`);
    }
  }
}

export type RuinsLoot = { item: LootItem; quantity: number };

/** Rolls each entry independently. The random source returns values in [0, 1). */
export function rollRuinsLoot(
  enemyId: RuinsEnemyId,
  random = Math.random,
): RuinsLoot[] {
  const drops: RuinsLoot[] = [];
  for (const { item, chance, quantity } of lootTables[enemyId]) {
    if (random() >= chance) continue;
    const [min, max] =
      typeof quantity === "number" ? [quantity, quantity] : quantity;
    drops.push({
      item,
      quantity:
        min === max ? min : min + Math.floor(random() * (max - min + 1)),
    });
  }
  return drops;
}
