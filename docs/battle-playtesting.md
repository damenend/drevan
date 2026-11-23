# Battle rules and playtesting

Worn Leather Armor grants **+3 Defense** so it can save HP in fights a starter
can win. The Rusted Sword grants **+1 Strength**. With both pieces, level 4
training is a reliable win and level 5 is still difficult. Each piece costs
100 gold. The [item seed](../src/db/seed.ts) controls these values.

## Rerun the starter equipment playtest

1. From the repository root, select the pinned Node version with `nvm use`.
   Run `yarn install` if you need to set up this clone.
2. Run the simulation and open the CSV in a spreadsheet.

   ```sh
   node --import tsx scripts/playtest-battle.ts > /tmp/drevan-battle-playtest.csv
   ```

   Expect 64 data rows. Each row reports 1,000 fights for one combination of
   dummy level, Strength, and Defense. The script uses the production battle
   simulator and runs without a database. The loadouts are explicit so you can
   compare the original armor with a candidate even after the catalog changes.

3. To verify the player flow on an existing development database, run
   `yarn db:seed` with the app's local database setup. The seed updates the
   matching catalog row, so owned and equipped copies receive the new bonus.
   Open Curious Emporium and verify the item values, then equip both pieces on
   a fresh character. Home should show 6 Strength and 3 Defense. Start a
   Dominion training fight and inspect the attack log. Use a disposable
   database for repeatable checks that need fixed stats or gold.

## How battles work

- A new character starts with 25 HP, 5 Strength, 5 Speed, and 0 Defense. Home
  and training use the same effective stats, which add the bonuses from owned,
  equipped gear to the stored base values.
- The opening attacker is picked once. Each side's chance is its share of
  combined Speed, with a minimum effective Speed of 1. After the opening
  roll, attacks follow intervals of `100 / speed`. The player takes priority
  on equal scheduled times after the opening attack.
- Base damage is drawn uniformly from half of Strength rounded up through
  full Strength, with a minimum of 1. A critical hit occurs on 5% of attacks
  and multiplies the roll by 1.5 before rounding up.
- Defense cuts damage after the critical bonus. The reduction for nonnegative
  Defense is `0.6 * defense / (defense + 10)`. Final damage rounds to the
  nearest whole number with a minimum of 1. Each additional point of Defense
  contributes a smaller reduction. For example, a 4-damage hit lands for 4 at
  +1 or +2 Defense and for 3 at +3.
- A combatant at zero HP stops the fight. The simulator caps fights at 1,000
  attacks and records a draw if both sides survive. The log records the actor,
  damage, target HP, and critical-hit flag for each attack.

Dominion requires positive starting HP and accepts dummy levels 1–100.
At level `L`, a dummy has `10 + 5 * (L - 1)` HP, `L + 1` Strength,
`L + 1` Speed, and `floor(L / 4)` Defense. Training saves remaining HP and
awards `10 * L` gold on a win. Future encounter modes can use the simulator
with their own persistence and reward rules.
[Simulator](../src/services/battle.ts) ·
[Training route](../src/routes/game/training.ts) ·
[Equipment stats](../src/services/equipment.ts)

## Starter equipment results

Each fight started at full HP. For each dummy level, the simulation used the
same 1,000 random seeds across all eight loadouts. The original +1 armor and
no armor produced identical outcomes and HP at levels 1–5.

| Loadout                      | Level 3 mean HP on wins | Level 4 win rate | Level 4 mean HP on wins | Level 5 win rate |
| ---------------------------- | ----------------------: | ---------------: | ----------------------: | ---------------: |
| No gear                      |                   12.77 |            69.1% |                    4.18 |             0.8% |
| Sword and original +1 armor  |                   13.64 |            89.5% |                    5.81 |             6.1% |
| Sword and candidate +2 armor |                   13.70 |            91.5% |                    5.82 |             8.8% |
| Sword and current +3 armor   |                   14.96 |            99.5% |                    8.41 |            21.6% |
| Current +3 armor alone       |                   14.19 |            96.2% |                    6.34 |             2.8% |

The sword alone reduced the average attack count from 9.22 to 8.41 at
level 3 and from 11.59 to 10.54 at level 4. With the sword equipped at
level 4, +2 armor reduced 162 of 4,824 matched incoming hits, while +3 armor
reduced 3,326. All loadouts won every fight at levels 1–3 and lost every
fight at levels 6–8. This supports +3 as the starter bonus if level 4 is
intended to become reliable once a player is equipped.

## Compare future changes

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
- Keep deterministic rule checks in the [battle unit tests](../tests/battle.test.ts).
  Record balance decisions with the matchups that support them in this guide.
