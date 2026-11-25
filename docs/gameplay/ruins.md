# The Ruins

The Ruins is Drevan’s first playable dungeon. Players leave the settlement of Nexaris, explore a grid one step at a time, and decide whether to fight, use supplies, or retreat.

## Expedition loop

1. **Prepare in Nexaris.** Set equipment and bring healing potions. Entry requires positive HP. The first entry grants a permanent Recall Beacon.
2. **Explore Floor 1.** Start at the entrance at `(0, 0)`. Move one square north, south, east, or west on a fixed 7×7 grid. Gold and potion caches pay out on arrival. An enemy square offers a choice to fight, pass by, or move on.
3. **Decide how much farther to go.** A fight resolves automatically after choosing **Fight**. Current HP carries between fights. Players can use an owned healing potion while alive or spend earned attribute points during the expedition. Changing equipment, healing at Sanctum, and selling items require a return to Nexaris.
4. **Leave or resume later.** Walk back to the entrance to use **Return to Nexaris**, or use the Recall Beacon from any square. The Beacon works once per Central calendar day and resets at midnight in America/Chicago. Logging out preserves the expedition position and login resumes it there.

A victory awards gold, XP, and any loot that reaches inventory, saves remaining HP, and leaves the player on the same square. The battle report appears once in The Ruins. Defeat and draw save remaining HP and rewards from earlier actions, award nothing for that fight, and send the player to Nexaris with a one-time report. A player at zero HP must recover before entering again.

Fixed discoveries and enemy offers return on a new arrival at their tiles. A player can revisit a cache or choose to fight the same enemy again by leaving its square and returning. Each successful expedition action saves its result and advances the form revision, so resubmitting an old form cannot repeat the payout.

## Floor 1 reference

Coordinates start at the upper left. X increases to the right and Y increases downward. This table includes the playtest map’s spoilers and provisional rewards.

| Square   | Location or encounter   | Reward or action                                                   |
| -------- | ----------------------- | ------------------------------------------------------------------ |
| `(0, 0)` | Entrance and exit       | Walk here to leave without using the Recall Beacon.                |
| `(1, 0)` | Gold cache              | 8 gold on arrival.                                                 |
| `(2, 0)` | Sealed Floor 2 entrance | Shows a disabled **Descend to Floor 2** button from this square.   |
| `(2, 1)` | Vault Scavenger         | 25–35 gold, 30 XP, and a 20% chance of one Lesser Potion on a win. |
| `(0, 2)` | Potion cache            | One Lesser Potion on arrival.                                      |
| `(4, 3)` | Fractured Sentinel      | 35–45 gold and 40 XP on a win.                                     |
| `(6, 6)` | Alloy Warden            | 45–55 gold and 50 XP on a win.                                     |

Gold ranges include both endpoints and XP is fixed for each enemy. Loot appears in the battle summary when the item reaches inventory. A full potion stack leaves the other victory rewards intact. Floor 1 currently has one victory item drop. The Scavenger drop rate is provisional. See the [roadmap](../planning/roadmap.md) for expansion plans.

## Map visibility and persistence

The playtest map shows `P` for the player, `E` for the exit, `2` for the sealed stairs, `G` for gold, `I` for an item, and `X` for an enemy. Markers combine, for example `PE` at the exit. See the [design system](../design/design-system.md#ruins-map) for layout and the [accessibility guide](../design/accessibility.md#maps-and-combat-reports) for keyboard behavior.

The player record stores the current tile (null outside), whether the encounter is available on this visit, and the revision. Movement, discovery rewards, combat, and exits save with the corresponding expedition state. The game router redirects other gameplay pages to The Ruins while the player is inside. It allows the existing potion and allocation actions.

[Map and encounter values](../../src/services/ruins-map.ts) · [Expedition service](../../src/services/ruins.ts) · [Route tests](../../tests/game-routes.test.ts)
