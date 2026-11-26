# The Ruins

The Ruins is Drevan’s first playable dungeon. Players leave Nexaris, explore a grid one step at a time, survive hidden mandatory encounters, and decide when to use supplies or retreat.

## Expedition loop

1. **Prepare in Nexaris.** Set equipment and bring healing potions. Entry requires positive HP. The first entry grants a permanent Recall Beacon.
2. **Explore Floor 1.** Start at the entrance at `(0, 0)`. Move one square north, south, east, or west on a fixed 7×7 grid. Unexplored squares conceal enemies and caches. The entered square becomes explored, its cache resolves once if present, and an undefeated enemy immediately starts combat.
3. **Decide how much farther to go.** Current HP carries between mandatory fights. A victory permanently clears that enemy from the expedition. Players can safely retrace cleared squares, use an owned healing potion while alive, or spend earned attribute points during the expedition. Changing equipment, healing at Sanctum, and selling items require a return to Nexaris.
4. **Leave or resume later.** Walk back to the entrance to use **Return to Nexaris**, or use the Recall Beacon from any square. The Beacon works once per Central calendar day and resets at midnight in America/Chicago. Logging out preserves the expedition position and login resumes it there.

A victory awards gold, XP, and any loot that reaches inventory, saves remaining HP, and leaves the player on the same square. The battle report appears once in The Ruins. Defeat and draw save remaining HP and rewards from earlier actions, award nothing for that fight, and send the player to Nexaris with a one-time report. A player at zero HP must recover before entering again.

Enemy instances, cleared enemies, explored squares, and cache claims persist for the expedition. Entering, moving (including its combat), walking out, and recalling each advance the form revision when successful. That prevents an old form from repeating a move, fight, or reward. Potion use and attribute allocation have their own forms and leave the expedition revision unchanged.

## Floor 1 population

Coordinates start at the upper left. X increases to the right and Y increases downward. Each new expedition creates a finite population equal to 25% of eligible squares, rounded to a whole enemy. Floor 1 has 47 eligible squares after reserving the entrance and sealed stairs, so it places 12 enemies on distinct squares.

| Enemy              | Weight | Win reward                                 |
| ------------------ | -----: | ------------------------------------------ |
| Vault Scavenger    |      6 | 25–35 gold, 30 XP, and victory loot rolls. |
| Fractured Sentinel |      3 | 35–45 gold and 40 XP.                      |
| Alloy Warden       |      1 | 45–55 gold, 50 XP, and victory loot rolls. |

Weights select each identity independently, so an expedition can contain several of the same enemy. They do not change the population count. Gold ranges include both endpoints and XP is fixed for each enemy. The population remains unchanged across reloads, logout, and resume; the next expedition generates a new population.

### Exploration discoveries

On entry, the server places one gold cache and one potion cache on distinct, reachable tiles. The entrance, sealed stairs, and generated enemy tiles are reserved. The map, movement controls, and marker list omit cache locations. **Surroundings** reveals the cache and its result when the player arrives.

- **Gold cache.** Awards up to 8 gold, limited by how much the player can carry. Any positive payout uses the player's gold claim for that Central calendar day. A full balance leaves the cache unclaimed. An unclaimed cache blocked by the daily limit can be retried after midnight by leaving the tile and returning. A cache already collected during the expedition stays empty after midnight.
- **Potion cache.** Awards one Lesser Potion per expedition. A full stack or unavailable item leaves it unclaimed, so the player can return and try again.

Placement and claims survive reloads, logout, movement, and combat. Rewards, claims, and movement revisions save together. Walking out, Recall, defeat, and draw clear the expedition's caches and preserve the player's daily gold claim. A new expedition draws two new locations.

Discovery definitions hold the reward and description. An expedition stores which definitions were placed, their tiles, and whether they were claimed. Future discoveries can use gold or item rewards, including stacks of materials, equipment, or relics, without changing the fixed map. These sources and their balance remain future work.

### Victory loot

The server rolls each listed item independently after a win. Each successful roll awards one unit, so one fight can award several items or none. Fractured Sentinel and Dominion training have no item rolls. Leaving, defeat, and draws do not roll loot.

| Item                  | Vault Scavenger | Alloy Warden |
| --------------------- | --------------: | -----------: |
| Lesser Potion         |             20% |            — |
| Metal Scraps          |             30% |          40% |
| Frayed Circuitry      |             25% |          25% |
| Shattered Alloy       |             15% |          30% |
| Dormant Microchip     |             10% |          20% |
| Enchantment Powder    |              8% |          10% |
| Power Cell            |              5% |          15% |
| Arcane Residue        |              4% |           8% |
| Crystallized Aether   |              1% |           3% |
| Fractured Energy Core |               — |           2% |
| Voidstone Fragment    |               — |           1% |

Equipment rolls are independent of the material and potion rolls. Each success grants one copy.

| Equipment          | Vault Scavenger | Alloy Warden |
| ------------------ | --------------: | -----------: |
| Wooden Axe         |              5% |            — |
| Wooden Shield      |              5% |            — |
| Reinforced Sword   |              1% |           5% |
| Reinforced Bracers |              1% |           5% |
| Ancient Blade      |               — |           2% |
| Ancient Plate      |               — |           2% |

Arcane and Corrupt equipment are available at Curious Emporium and are outside the current victory loot tables. See the [equipment catalog reference](economy.md#ruins-equipment) for stats and buyback prices.

The expedition checks the submitted revision before rolling. Drops create or increase normal inventory stacks in the same transaction as HP, gold, XP, and expedition state. An award that would exceed the stack limit is skipped in full. The battle summary lists only items successfully added. If a database write fails, the entire fight update rolls back.

At the provisional [Emporium prices](economy.md#ruins-materials), the theoretical material sale value per victory is 4.32 gold for Vault Scavenger and 8.96 for Alloy Warden. Each total adds the drop probability times the sale price for each material. These figures exclude ordinary gold, potions, healing costs, and the chance of winning. Economic balancing remains open.

## Map visibility and persistence

The map shows `P` for the player and `E` for the exit. Markers can combine, as in `PE` at the exit. Unexplored and explored squares have distinct surfaces. The sealed stairs marker appears after entering that square. Enemy locations and identities never appear in map markup, movement labels, or the marker list; entering one resolves combat and shows the normal battle report. A cleared square remains visibly explored. See the [design system](../design/design-system.md#ruins-map) for layout and the [accessibility guide](../design/accessibility.md#maps-and-combat-reports) for keyboard behavior.

The player record stores the current tile (null outside), revision, generated enemy instances, explored tile IDs, placed discoveries, and last gold claim date. See the [database guide](../development/database.md#persistent-ruins-population-migration) for existing expeditions. Movement, discovery rewards, automatic combat, enemy removal, and exits save with the corresponding expedition state. The game router redirects other gameplay pages to The Ruins while the player is inside. It allows the existing potion and allocation actions.

[Map and encounter values](../../src/services/ruins-map.ts) · [Discovery placement](../../src/services/ruins-discoveries.ts) · [Loot tables](../../src/services/ruins-loot.ts) · [Cache and loot grants](../../src/services/ruins-rewards.ts) · [Expedition service](../../src/services/ruins.ts) · [Route tests](../../tests/game-routes.test.ts)
