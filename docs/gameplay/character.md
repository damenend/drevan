# Character and progression

The Quarters shows a player's character, equipment, HP, lifetime XP, and earned attribute points. The Registry derives player levels from that same lifetime XP.

## Signup and starting state

Names have 3–24 ASCII letters, digits, spaces, underscores, or hyphens. Spaces are allowed only inside the name. SQLite enforces case-insensitive uniqueness. Store the submitted spelling and use [`formatPlayerName`](../../src/utils/format-player-name.ts) to display names in title case.

Signup stores the selected `male` or `female` avatar model. The default is `male`, including for existing accounts. The Quarters and profiles use the [shared avatar partial](../../src/views/partials/player-avatar.ejs). New characters start with 125 gold, three Lesser Potions, and one Revival Potion. Account creation and the starter inventory grant succeed together using the seeded catalog.

## Attributes and combat stats

| Value                        | Starting value | Rule                                                                                                                                                                                     |
| ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strength, Agility, Intellect | 5, 5, 0        | Each point in any of the three adds one base Attack Power. A class's primary attribute adds two additional Attack Power per point, for three total.                                      |
| Fortitude                    | 5              | Maximum HP is `10 + 3 * total Fortitude`. Starting current HP is 25.                                                                                                                     |
| Attack Power                 | 10             | Add applicable equipment bonuses to the base sum. Base and effective Attack Power each cap at half the maximum safe JavaScript integer, rounded down, to leave room for critical damage. |
| Speed                        | 5              | Stored independently of Agility. Sets opening initiative and attack frequency.                                                                                                           |
| Base Defense                 | 0              | Owned equipped gear can increase effective Defense.                                                                                                                                      |

Total attributes and Speed include allocated points. Use the [shared maximum HP expression](../../src/services/character-stats.ts) when validating or healing. Effective combat stats use [equipment calculations](../../src/services/equipment.ts).

The class is displayed as Unaligned by default. After reaching level 10, players can visit The Conclave to choose Melee, Ranged, or Caster and may change between those classes freely. The server derives eligibility from lifetime XP and accepts only those three choices. Melee gains three Attack Power per Strength, Ranged gains three per Agility, and Caster gains three per Intellect. Their other offensive attributes remain worth one Attack Power per point. Unaligned characters receive one Attack Power per offensive attribute point and no primary-stat bonus.

Vanguard, Ranger, and Arcanist are the approved future player-facing names for those three classes. The application has not completed that [terminology migration](../planning/roadmap.md#8a-adopt-approved-class-names-small), so this implemented-behavior reference retains the names players currently see.

## XP and attribute points

Level-up costs follow `15 × (current level) × (current level + 3)` XP through level 100. The early costs remain 60 XP for level 2, 150 for level 3, and 270 for level 4. Level 10 begins at 6,300 lifetime XP, level 50 at 661,500, and level 100 at 5,148,000. Excess XP carries forward. Lifetime XP remains visible and continues accumulating at the cap. The [level XP reference](leveling-reference.md) lists every incremental cost and lifetime threshold.

Each level-up grants one attribute point, up to 99. Spend one point on +1 Strength, Agility, Intellect, Speed, or Fortitude in The Quarters or The Ruins. Allocated points are saved separately from base attributes. Raising max HP by allocation preserves current HP. Existing characters keep their lifetime XP, so raising the cap can immediately grant levels and unspent points beyond the former level-10 limit. [Progression rules](../../src/services/progression.ts) · [Progression tests](../../tests/progression.test.ts)

## Admin playtest controls

Signed-in players can edit their own base attributes, Speed, gold, base Defense, and casts used on the current Central day. The fishing limit also caps that input. Current and maximum HP, class, and effective Attack Power are read-only. Changing base Fortitude refills HP to the new cap including allocated points. Other changes preserve HP. [Admin route](../../src/routes/game/admin.ts) · [Route tests](../../tests/game-routes.test.ts)
