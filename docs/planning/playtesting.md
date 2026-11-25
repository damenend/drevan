# Gameplay playtesting

Use controlled simulations to compare individual rules, then play real sessions to measure decisions, recovery, and time. Run commands from the repository root with the pinned Node and installed dependencies.

## Repeatable simulations

- Record the player build, opponent, rules under test, seed range, and fights
  per matchup. Change one rule or item value at a time and rerun the same fights.
- Read win rate alongside **mean HP on wins** and **mean attacks across all
  fights**. A higher win rate brings new fights into the winning group. More
  attacks can also mean a losing player survived longer.
- The CSV matches incoming hits by seed and attack order up to the point
  where either fight ends. The comparison isolates damage changes here
  because only Defense varies within each pair. For changes to Speed, attack
  order can change, so compare outcomes and each side's share of attacks.
- For economy comparisons, account for gold earned and missing HP on every
  outcome. At Sanctum, each HP restored costs one gold. The starter run
  resets HP between fights, so use a separate session playtest to assess how
  quickly someone can afford gear or recover after a loss.
- Keep deterministic rule checks in the [battle unit tests](../../tests/battle.test.ts).
  Record balance decisions with the matchups that support them. The [balance reports](../audits/balance-playtests.md) contain past results.

| Script in `scripts/`                                             | What it measures                                                                                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [playtest-ruins.ts](../../scripts/playtest-ruins.ts)             | Live player builds against each Floor 1 enemy and paired dummy. The optional `--historical` flag selects the earlier builds. |
| [playtest-battle.ts](../../scripts/playtest-battle.ts)           | Historical starter gear comparison with player-first ties.                                                                   |
| [audit-battle.ts](../../scripts/audit-battle.ts)                 | Historical stat, timing, and build sensitivity experiments.                                                                  |
| [playtest-progression.ts](../../scripts/playtest-progression.ts) | Historical early XP pacing.                                                                                                  |
| [playtest-level-cap.ts](../../scripts/playtest-level-cap.ts)     | Historical paths to level 10.                                                                                                |

```sh
node --import tsx scripts/playtest-ruins.ts > /tmp/drevan-ruins.csv
```

For the historical starter equipment trial, run `node --import tsx scripts/playtest-battle.ts`. Expect 64 data rows, each covering 1,000 fights per combination of dummy level, offensive rating, and Defense. Explicit loadouts keep the trial reproducible after catalog changes.

The Ruins run prints 18 data rows with 1,000 seeded fights per row. It imports live enemy definitions without opening SQLite. Both modes start at full HP and use midpoint gold payouts so a separate reward roll cannot shift the combat rolls. This comparison omits travel, supplies, and drops.

## Full expeditions

Use a disposable, seeded game. Record starting gear and supplies, route, fights, carried HP, potions found and used, retreat or defeat, and net gold after healing. Include repeat visits to compare cache and encounter income with Dominion and The Driftwater. Check entry, a cache discovery, an optional fight, victory with loot, a low-HP decision, and return to Nexaris. Note which actions are visible, where focus goes, and whether the Warden still feels like a tougher fight.

For a starter gear smoke check, equip both pieces on a fresh character after seeding. The Quarters should show 11 Attack Power and 3 Defense. Start a Dominion fight to confirm it uses those stats.

## Timed Dominion session

Start with a fresh account and play for 10 minutes
without Admin changes. Record character level, XP toward the next level,
stat choices, dummy levels, wins, defeats, gear purchases, and gold after
healing. Note when a harder dummy feels worth trying and when repeating the
same fight starts to feel slow. Use those observations to decide whether to
test a different XP curve or a less aggressive path to harder dummies.

## Recurring session checks

- **Early progression.** Repeat the starter-supplies playtest with the current Attack Power formula. Measure time and wins to the first few levels and to level 10, when players move up in dummy difficulty, how often they spend or save points, and how much they spend on healing.
- **Ruins expeditions.** Track enemy difficulty, survival, retreat and defeat rates, and net gold after Sanctum healing. Record how often the Scavenger drop supplies usable healing. Once materials are available, measure how quickly they accumulate before expanding tables or adding sources.
- **Economy.** Compare short, realistic sessions across training, fishing, contracts, exploration, equipment and material sales, and salvage. Account for Sanctum healing, gear purchases, and future Forge and Artificer fees. Compare recipe costs with reagent sale values and gathering time. Keep rare ingredients tied primarily to gameplay if shops eventually stock basics.
- **Starter economy playtest.** Run separate 10-minute fishing and training sessions with fresh characters and the same starting gear. Record actions completed, gold earned, Sanctum costs, starter potions used, and gold kept after healing. Note how long it takes to earn 100 additional gold, the price of one starter gear piece. Characters start with 125 gold and three Lesser Potions, so track earned gold separately. If a session ends before the player earns 100 gold, record their progress and ask whether either activity felt required to afford upgrades. Repeat once Ruins drops add another source of items to sell.
- **Activity roles.** Training builds combat progression, fishing offers steadier income, contracts reward bonus objectives, salvage supplies materials, exploration offers uncertain payouts, and The Forge gives players a place to invest in gear. Check that each activity has a reason to play. Keep average salvage resale at or below equipment buyback value even when a rare result can exceed it.
- **Combat builds.** Repeat the audit matchups with each new attribute, class bonus, allocation option, equipment modifier, enhancement, and enchantment. Include Speed and initiative, Defense, critical hits, and max HP. Start with training and repeat in practice PvP as soon as available. Compare equal investment and observed fight outcomes. Equal numerical bonuses can have very different effects.

- **PvE first.** Compare starter and better-prepared builds against ordinary and specialized foes. Repeat in practice PvP to look for competitive problems. For boss rewards, compare net payouts after healing across activities before adding cooldowns or limits.
- **Repeatable simulations.** As part of the combat audit (4), use a small script or test utility to run batches with controlled or seeded randomness. Reuse the same matchups before and after each change and swap fighter positions. Track win rates, remaining HP, attack counts, encounter duration, damage dealt and received, and how often fights reach the cap. For later effects, track activations per attack and per battle, bonus damage, peak stacks, and interactions with critical hits and long fights. Consider chance, magnitude, or explicit trigger and stack limits if the results show a problem with Speed or survivability. Keep the existing attack cap and define the outcome when a fight reaches it.
