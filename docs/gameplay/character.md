# Character and progression

The Quarters shows a player's character, equipment, HP, lifetime XP, and earned attribute points. The Registry derives player levels from that same lifetime XP.

## Signup and starting state

Names have 3–24 ASCII letters, digits, spaces, underscores, or hyphens. Spaces are allowed only inside the name. SQLite enforces case-insensitive uniqueness. Store the submitted spelling and use [`formatPlayerName`](../../src/utils/format-player-name.ts) to display names in title case.

Signup stores the selected `male` or `female` avatar model. The default is `male`, including for existing accounts. The Quarters and profiles use the [shared avatar partial](../../src/views/partials/player-avatar.ejs). New characters start with 125 gold and three Lesser Potions. Account creation and the starter inventory grant succeed together using the seeded catalog.

## Attributes and combat stats

| Value                        | Starting value | Rule                                                                                                                                                                                     |
| ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strength, Agility, Intellect | 5, 5, 0        | Each point in any of the three adds one base Attack Power.                                                                                                                               |
| Fortitude                    | 5              | Maximum HP is `10 + 3 * total Fortitude`. Starting current HP is 25.                                                                                                                     |
| Attack Power                 | 10             | Add applicable equipment bonuses to the base sum. Base and effective Attack Power each cap at half the maximum safe JavaScript integer, rounded down, to leave room for critical damage. |
| Speed                        | 5              | Stored independently of Agility. Sets opening initiative and attack frequency.                                                                                                           |
| Base Defense                 | 0              | Owned equipped gear can increase effective Defense.                                                                                                                                      |

Total attributes include allocated points. Use the [shared maximum HP expression](../../src/services/character-stats.ts) when validating or healing. Effective combat stats use [equipment calculations](../../src/services/equipment.ts).

The class is displayed as Unaligned by default. The database accepts `unaligned`, `melee`, `ranged`, and `caster`. Class selection and bonuses are tracked in [milestone 8](../planning/roadmap.md#8-add-class-specializations-p2--large).

## XP and attribute points

Level-up costs for levels 2 through 10 are 60, 150, 270, 420, 600, 810, 1,050, 1,320, and 1,620 XP. Excess XP carries forward. Level 10 begins at 6,300 lifetime XP. Lifetime XP remains visible and continues accumulating at the cap.

Each level-up grants one attribute point, up to nine. Spend one point on +1 Strength, Agility, Intellect, or Fortitude in The Quarters or The Ruins. Allocated points are saved separately from base attributes. Raising max HP by allocation preserves current HP. [Progression rules](../../src/services/progression.ts) · [Progression tests](../../tests/progression.test.ts)

## Admin playtest controls

Signed-in players can edit their own base attributes, gold, base Defense, and casts used on the current Central day. The fishing limit also caps that input. Current and maximum HP, class, Speed, and effective Attack Power are read-only. Changing base Fortitude refills HP to the new cap including allocated points. Other changes preserve HP. [Admin route](../../src/routes/game/admin.ts) · [Route tests](../../tests/game-routes.test.ts)
