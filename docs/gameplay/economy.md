# Inventory and economy

Prepare in The Quarters, trade at Curious Emporium, and restore missing HP at Sanctum. The [seed catalog](../../src/db/seed.ts) supplies current item effects and prices. Gameplay can grant items that the shop does not sell.

## Items and equipment

Inventory keeps one stack per player and item. Actions require positive owned quantity. Equipping reserves one copy in the matching weapon or armor slot. The Quarters shows that copy under Equipment and counts spares in Inventory. Effective stats include the bonuses of owned gear in the correct slots. Equipment changes preserve base stats. Rusted Sword grants +1 Attack Power and Worn Leather Armor grants +3 Defense.

The Quarters filters available items by Equipment, Consumables, Fish, or Other. Missing or unknown `category` values show all. Use, Equip, and Unequip retain the selected category on redirect.

## Buy and sell

The Emporium uses server-side catalog prices. A null purchase price keeps the item off the purchase list. A blank quantity counts as zero. Purchases read current prices, balance, and owned counts, then deduct gold and add inventory in one transaction. Reject totals or stacks outside JavaScript's safe integer range and show the result after redirect.

Buyback has its own catalog sell price. The Emporium accepts owned weapons, armor, and fish with positive sell prices. An equipped copy stays reserved. Selling checks current quantities, equipped slots, and available gold balance capacity before reducing stacks and crediting the payout together.

## Heal

Lesser Potion, Potion, and Greater Potion restore up to 10, 50, and 100 HP respectively. Potions require positive HP and restore at most the missing amount. Healing and consumption save together. At full HP there is no item effect to save.

Sanctum can heal a character from zero HP. It restores all missing HP for one gold per HP. The update requires enough gold and current matching HP and max HP, so the charge and heal are applied together.

[Equipment rules](../../src/services/equipment.ts) · [Item actions](../../src/routes/game/inventory.ts) · [Category and effect display](../../src/routes/game/quarters-inventory.ts) · [Emporium transactions](../../src/services/emporium.ts) · [Sanctum route](../../src/routes/game/hospital.ts) · [Transaction tests](../../tests/game-routes.test.ts)
