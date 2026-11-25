# Inventory and economy

Prepare in The Quarters, trade at Curious Emporium, and restore missing HP at Sanctum. The [seed catalog](../../src/db/seed.ts) supplies current item effects and prices. Gameplay can grant items that the shop does not sell.

## Items and equipment

Inventory keeps one stack per player and item. Actions require positive owned quantity. Equipping reserves one copy in the matching weapon or armor slot. The Quarters shows that copy under Equipment and counts spares in Inventory. Effective stats include the bonuses of owned gear in the correct slots. Equipment changes preserve base stats. Rusted Sword grants +1 Attack Power and Worn Leather Armor grants +3 Defense.

The Quarters filters available items by Equipment, Weapons, Armor, Consumables, Fish, Materials, or Other. Missing or unknown `category` values show all. Use, Equip, and Unequip retain the selected category on redirect.

### Ruins equipment

[Floor 1 victories](ruins.md#victory-loot) can award Wooden, Reinforced, and Ancient equipment. Shields and bracers use the armor slot. The shared prefixes indicate intended progression. Each item defines its own fixed modifier and buyback price in the [Ruins catalog](../../src/db/ruins-loot-catalog.ts).

| Tier       | Weapon           | Attack Power | Armor              | Defense | Buyback (gold) | Future level |
| ---------- | ---------------- | -----------: | ------------------ | ------: | -------------: | -----------: |
| Wooden     | Wooden Axe       |           +2 | Wooden Shield      |      +4 |             15 |            2 |
| Reinforced | Reinforced Sword |           +3 | Reinforced Bracers |      +5 |             25 |            4 |
| Ancient    | Ancient Blade    |           +4 | Ancient Plate      |      +6 |             40 |            6 |
| Arcane     | Arcane Mace      |           +5 | Arcane Bulwark     |      +7 |             60 |            8 |
| Corrupt    | Corrupt Staff    |           +6 | Corrupt Armor      |      +8 |             90 |           10 |

Armor starts one point above Worn Leather Armor and increases by one point per tier. The future levels are design references. New weapons use the Rusted Sword image and new armor uses the Worn Leather Armor image until individual art is ready. Curious Emporium stocks all ten items at provisional purchase prices of 30, 50, 80, 120, and 180 gold per piece, from Wooden through Corrupt. Arcane and Corrupt gear are currently shop purchases. Modifiers, payouts, and drop rates are provisional pending dedicated balance playtesting.

## Buy and sell

The Emporium uses server-side catalog prices. A null purchase price keeps the item off the purchase list. A blank quantity counts as zero. Purchases read current prices, balance, and owned counts, then deduct gold and add inventory in one transaction. Reject totals or stacks outside JavaScript's safe integer range and show the result after redirect.

Buyback has its own catalog sell price. The Emporium accepts owned weapons, armor, fish, and materials with positive sell prices. An equipped copy stays reserved. Selling checks current quantities, equipped slots, and available gold balance capacity before reducing stacks and crediting the payout together.

## Ruins materials

[Floor 1 victories](ruins.md#victory-loot) can award stackable materials. In The Quarters, use the **Materials** filter to see each stack, its description, and its sale price. Materials have no equipment or use actions. The Emporium buys them at the listed price per unit and keeps them out of purchase stock. For example, three Metal Scraps sell for six gold.

Rarities are provisional design labels. The game uses the same inventory rules and shared placeholder icon for all ten materials. Individual icons can be assigned in the [material catalog](../../src/db/ruins-loot-catalog.ts). Fractured Energy Core currently serves as a sellable material. Relic identification and economic balancing remain future work.

| Material              | Design rarity | Buyback (gold) | Description                                                                                                                                             |
| --------------------- | ------------- | -------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metal Scraps          | Common        |              2 | Twisted remnants of machinery from an age long forgotten. Still worth something to the right merchant.                                                  |
| Frayed Circuitry      | Common        |              3 | A tangled collection of conductive filaments. Whatever they once powered is unlikely to power anything again.                                           |
| Shattered Alloy       | Common        |              4 | Fragments of an exceptionally durable alloy. Apparently, not durable enough.                                                                            |
| Dormant Microchip     | Common        |              5 | A small component bearing microscopic inscriptions. Its original function remains a subject of considerable debate.                                     |
| Enchantment Powder    | Uncommon      |              8 | Fine particles that retain traces of arcane energy. Handle with care and refrain from inhaling.                                                         |
| Power Cell            | Uncommon      |             10 | A compact energy vessel recovered from old-world machinery. A faint hum suggests it has not entirely exhausted its charge.                              |
| Arcane Residue        | Uncommon      |             12 | A viscous substance left behind by unstable magical reactions. It occasionally moves against gravity.                                                   |
| Crystallized Aether   | Rare          |             25 | Arcane energy condensed into a remarkably stable crystalline form. Its light persists even in absolute darkness.                                        |
| Fractured Energy Core | Rare          |             35 | The damaged heart of an ancient machine. Despite its fractured casing, something within continues to pulse.                                             |
| Voidstone Fragment    | Rare          |             50 | A fragment of matter whose origin defies conventional explanation. Prolonged observation produces the unsettling sensation of being observed in return. |

## Heal

Lesser Potion, Potion, and Greater Potion restore up to 10, 50, and 100 HP respectively. Potions require positive HP and restore at most the missing amount. Healing and consumption save together. At full HP there is no item effect to save.

Sanctum can heal a character from zero HP. It restores all missing HP for one gold per HP. The update requires enough gold and current matching HP and max HP, so the charge and heal are applied together.

[Equipment rules](../../src/services/equipment.ts) · [Item actions](../../src/routes/game/inventory.ts) · [Category and effect display](../../src/routes/game/quarters-inventory.ts) · [Emporium transactions](../../src/services/emporium.ts) · [Sanctum route](../../src/routes/game/hospital.ts) · [Transaction tests](../../tests/game-routes.test.ts)
