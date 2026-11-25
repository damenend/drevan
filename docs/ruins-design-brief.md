# The Ruins gameplay and interface design brief

The Ruins is Drevan’s first playable dungeon. Players leave the settlement of Nexaris, explore a grid one step at a time, and decide whether to fight, use supplies, or retreat. Drevan is a text-driven browser RPG with an early-2000s web aesthetic. The Ruins pairs old stonework with buried machinery and belongs to the setting’s larger mystery around the Axiom Engine. The sealed passage to Floor 2 gives players a visible reason to wonder what lies deeper.

## Expedition loop

1. **Prepare in Nexaris.** Set equipment and bring healing potions. Entry requires positive HP. The first entry grants a permanent Recall Beacon.
2. **Explore Floor 1.** Start at the entrance at `(0, 0)`. Move one square north, south, east, or west on a fixed 7×7 grid. Gold and potion caches pay out on arrival. An enemy square offers a choice to fight, pass by, or move on.
3. **Decide how much farther to go.** A fight resolves automatically after choosing **Fight**. Current HP carries between fights. Players can use an owned healing potion while alive or spend earned attribute points during the expedition. Each Lesser Potion restores up to 10 missing HP. Changing equipment, healing at Sanctum, and selling items require a return to Nexaris.
4. **Leave or resume later.** Walk back to the entrance to use **Return to Nexaris**, or use the Recall Beacon from any square. The Beacon works once per Central calendar day and resets at midnight in America/Chicago. Logging out preserves the expedition position and login resumes it there.

A victory awards gold, XP, and any loot that reaches inventory, saves remaining HP, and leaves the player on the same square. The battle report appears once in The Ruins. Defeat and draw save remaining HP and rewards from earlier actions, award nothing for that fight, and send the player to Nexaris with a one-time report. A player at zero HP must recover before entering again. Sanctum costs one gold per HP restored.

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

Gold ranges include both endpoints and XP is fixed for each enemy. Loot appears in the battle summary when the item reaches inventory. A full potion stack leaves the other victory rewards intact. Floor 1 currently has one victory item drop. The next milestone uses full-expedition playtesting to guide additional loot and material drops. Material selling follows separately. [Gameplay roadmap](roadmap.md)

## Current interface

| Player state            | What the screen shows                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outside the dungeon     | An entrance illustration and **Enter The Ruins**. At zero HP, the entry action gives way to a link to Sanctum.                                                                                                                                                                                                                          |
| Exploring               | The floor and coordinates share a row above the square 7×7 map. The legend and keyboard instructions follow the map. Only adjacent squares are move buttons. The Map markers disclosure lists the visible symbols with their coordinates and meanings.                                                                                  |
| Arriving at a tile      | Surroundings contains discovery, enemy sighting, sealed stairs, and empty-square feedback. It also contains the enemy details and choices, normal exit, or disabled descent action when applicable.                                                                                                                                     |
| Managing the expedition | The HP meter displays current and maximum HP and shows a red fill and a Critical label below 25%. Character stats appear in a compact list with attribute allocation below. Consumables show a thumbnail, quantity, and Use action, with healing potions ordered by strength. The Recall Beacon has its own status and outlined action. |
| After combat            | The battle summary shows the outcome, HP before and after, and any rewards. Open **Battle log** to see each attack. The victory report appears within Surroundings, after the tile actions. Defeat and draw reports appear in Nexaris.                                                                                                  |

On wider screens the map and Surroundings sit to the left of the interior illustration and expedition resources. On narrow screens the HP meter appears just before the map, and the illustration follows the Recall Beacon. Movement, tile actions, and resource forms follow the same keyboard order at both widths.

### Map visibility and keyboard use

During manual playtesting the map shows `P` for the player, `E` for the exit, `2` for the sealed stairs, `G` for gold, `I` for an item, and `X` for an enemy. Markers can combine with the player marker, such as `PE` at the exit or `P2` on the stairs. The post-playtest plan is to remove the gold, item, and enemy markers and reveal the stairs marker only while standing on that square. Player and exit markers remain visible under that plan.

The player square is the map’s initial Tab stop. Arrow keys focus a neighboring destination relative to the player’s position. Enter or Space activates the focused move button. Focus goes to the player square on entry and after a move. With JavaScript disabled, the adjacent move buttons remain available through ordinary Tab navigation. Tiles use text markers alongside color, and the focused square has a visible outline.

### Visual language

The game uses dark surfaces, muted gold accents, Roboto body text, Rajdhani headings and buttons, and restrained illustration. Keep the map readable at narrow widths and keep discoveries, encounter choices, and escape controls easy to find. Use visible focus, plain action labels, and text or symbols alongside color to communicate state. The setting can come through in location art and short observations about physical objects.

## Design questions to explore

- **Orientation and mystery.** Once the temporary markers are removed, how can players tell where they are, find their way back, and recognize a discovery without revealing upcoming encounters?
- **Decision timing.** When the player reaches an enemy square, how should the map, current HP, enemy details, and choices compete for attention? Walk through the same moment on a narrow screen and with keyboard input.
- **Combat feedback.** After a fight, how quickly can players find remaining HP and rewards and resume exploration? Where does the full combat log fit when a player wants to inspect it?
- **Retreat and return.** Can players distinguish the walk back, the one-use-per-day Beacon, and automatic return after a loss or draw? How visible should escape options be alongside potion use?
- **Expedition pacing.** Compare a direct retreat, a route with consecutive fights, and a low-HP return. Track potion use, retreats, and net gold after healing alongside the value of drops. Use those results before expanding the floor or tuning rewards around full-health fights.

When evaluating a design, work through entry, a cache discovery, an optional fight, victory with loot, a low-HP decision, and return to Nexaris. Describe what the player sees first, what action they can take, and where keyboard focus goes. Call out any proposal that changes gameplay rules as well as presentation.

## Related references

- [Gameplay roadmap](roadmap.md)
- [Battle playtesting](battle-playtesting.md)
- [Lore reference](lore.md)
- [Writing guide](writing-guide.md)
