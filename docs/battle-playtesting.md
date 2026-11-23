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

## Combat stat audit

Run this from the repository root after `nvm use`.

```sh
node --import tsx scripts/audit-battle.ts > /tmp/drevan-battle-audit.csv
```

Expect 1,980 data rows, each summarized from 5,000 fights using seeds 1–5,000.
Every matchup repeats with the build in each fighter slot. The audit starts at
full HP and uses dummies 1–6, a starter mirror, a slow heavy opponent, and a
quick opponent. The CSV includes win, loss, and draw counts, mean remaining HP
on wins, per-side attack and critical counts, and rolled damage (including any
damage beyond the target's remaining HP). Mean duration uses the simulator
clock, where a Speed 1 attack interval is 100. It measures combat pacing in the
rules. Every draw in this full-HP matrix would represent a fight reaching the
1,000-attack cap. No fights reached it.

The starter has 25 HP, 5 Strength, 5 Speed, and 0 Defense. The balanced build
adds one of each. The specialized builds each add four to one stat. These
equal numerical increases are a diagnostic. Progression point costs and HP
gains still need to be designed.

### Live baseline

The table shows win rates with the tested build in the player slot.

| Build       | Dummy 4 | Dummy 5 | Heavy | Quick |
| ----------- | ------: | ------: | ----: | ----: |
| Starter     |   70.4% |    0.5% |  2.5% | 41.0% |
| +4 Strength |    100% |   79.4% | 96.6% | 99.9% |
| +4 Speed    |    100% |   74.7% | 85.0% |  100% |
| +4 Defense  |   98.8% |    6.7% | 29.6% | 97.0% |
| +4 HP       |   95.2% |    1.9% | 20.5% | 82.9% |
| Balanced    |   93.9% |   34.8% | 61.8% | 96.4% |

- Against dummy 4, +1 Strength raised the win rate from 70.4% to 89.7% and
  cut the average fight from 11.59 to 10.55 attacks. +1 HP raised it to 79.4%.
  +1 Defense produced identical results to the starter because of damage
  rounding in this matchup. +1 Speed raised wins to 72.2% and shortened mean
  duration from 102.98 to 90.63 clock units.
- Strength and Speed opened the clearest path through dummy 5. Defense and
  HP helped substantially against the quick foe, where surviving more hits
  gave the build more chances to answer. Even the specialized builds won
  fewer than 1% of dummy 6 fights.
- In the starter mirror, the same build won 70.4% in the player slot and
  29.6% in the enemy slot. The player averaged 6.15 attacks and the enemy
  averaged 5.45. The opening roll is even in this matchup. Later attacks
  are due at the same times, and repeated player-first ties let the player
  land a lethal hit before the opponent can respond.

### One-rule experiments

- **Critical hits.** Turning off critical hits on both sides raised the
  unequipped dummy 4 win rate from 70.4% to 71.8% and lowered the equipped
  dummy 5 win rate from 20.7% to 15.1%. Critical hits can swing close fights
  in either direction. The audit keeps the same seed and consumes the
  critical roll even when its chance is zero.
- **Speed.** The candidate curve uses `5 * sqrt(Speed / 5)` above Speed 5 and
  applies to both initiative and attack frequency. Against dummy 5, the
  +4 Speed build's opening odds fell from 60.0% to 55.1%, its attack count
  fell from 7.40 to 6.45, and the slower dummy's rose from 4.70 to 5.43.
  The build's win rate fell from 74.7% to 34.2%. Against the quick opponent,
  the starter's win rate rose from 41.0% to 96.2%. Both sides use the curve,
  so fast enemies can lose much of their advantage too.

### Timing tie trial

The `random-ties` run keeps the opening Speed-weighted roll and the same
attack intervals. When two later attacks are due together, an even coin
flip decides who goes first. The simulator treats tiny differences from
floating-point rounding as ties. The tie rolls have their own seed stream
so they leave the sequence of initiative, damage, and critical rolls intact.
If a fighter dies on the first hit at a shared time, its pending attack is
lost, just as in live combat.

| Player-slot matchup  | Live win rate | Random ties | Live HP on wins | Random ties HP on wins |
| -------------------- | ------------: | ----------: | --------------: | ---------------------: |
| Starter mirror       |         70.4% |       49.6% |            4.17 |                   3.80 |
| Starter vs. dummy 3  |          100% |        100% |           12.84 |                  12.38 |
| Starter vs. dummy 4  |         70.4% |       49.6% |            4.17 |                   3.80 |
| Equipped vs. dummy 4 |         99.4% |       96.0% |            8.43 |                   6.98 |
| Equipped vs. dummy 5 |         20.7% |       13.6% |            3.21 |                   3.10 |
| +4 Speed vs. dummy 5 |         74.7% |       70.6% |            4.86 |                   4.14 |

The enemy-slot mirror won 50.4% of the trial fights. Both slots averaged
5.78 attacks, compared with 6.15 for the player and 5.45 for the enemy in
the live baseline. Mean fight duration moved from 102.98 to 102.72 clock
units. The trial brought the slots close to even with little change in pace.
The equipped starter still won most level 4 fights, with about 1.45 less
HP left on wins. That matters for the cost of repeated training.

### Training gold after healing

The CSV includes average training reward, Sanctum cost, and net gold per
fight for training dummies in the enemy slot. The calculation uses the
[training reward](../src/routes/game/training.ts) of 10 gold per dummy level
on a win and the [Sanctum rate](../src/routes/game/hospital.ts) of one gold
per missing HP after every fight. A loss pays zero gold and healing from
zero HP costs the build's full max HP. Each run starts at full HP and
assumes the player can afford to heal. This measures gold per fight.
Session duration and the upfront cost of gear need a separate playtest.

| Build    | Dummy level | Live reward | Live healing | Live net | Trial reward | Trial healing | Trial net |
| -------- | ----------: | ----------: | -----------: | -------: | -----------: | ------------: | --------: |
| Starter  |           2 |       20.00 |         5.56 |    14.44 |        20.00 |          5.56 |     14.44 |
| Starter  |           3 |       30.00 |        12.16 |    17.84 |        30.00 |         12.62 |     17.38 |
| Starter  |           4 |       28.14 |        22.06 |     6.08 |        19.82 |         23.12 |     -3.29 |
| Equipped |           3 |       30.00 |        10.01 |    19.99 |        30.00 |         10.13 |     19.87 |
| Equipped |           4 |       39.76 |        16.62 |    23.14 |        38.41 |         18.30 |     20.11 |
| Equipped |           5 |       10.33 |        24.34 |   -14.01 |         6.81 |         24.58 |    -17.77 |

Net gold is calculated before rounding the three averages. Under both
rules, the starter earned the most per fight at level 3 and the equipped
starter at level 4. The trial narrowed the equipped advantage of choosing
level 4 over level 3 to 0.24 gold per fight. At level 4, a starter with
+1 Speed improved from 6.84 to 12.44 net gold under the trial, while +1
Strength fell from 16.12 to 7.64. The adjusted order can help a build
when it takes away a timing advantage from the dummy.

The audit supports keeping random ties as a candidate at current training
payouts. If the goal is for equipped players to earn meaningfully more at
level 4 than at level 3, test that margin in a timed training session.

### Stat allocation trial with random ties

The following rows use random timing ties and the live Speed formula. For
the HP budget, compare +2 or +3 max HP for one point with +1 to another
stat. At four points, compare +8 or +12 max HP with +4 to another stat.
These are candidate exchange rates. Every build starts at full HP.

| Candidate investment | Level 4 wins | Level 5 wins | Heavy wins | Quick wins | Level 4 net gold |
| -------------------- | -----------: | -----------: | ---------: | ---------: | ---------------: |
| Starter              |        49.6% |         0.4% |       2.7% |      39.4% |            -3.29 |
| +1 Strength          |        72.6% |         3.3% |      10.6% |      62.1% |             7.64 |
| +1 Speed             |        84.1% |         4.8% |      24.5% |      79.5% |            12.44 |
| +1 Defense           |        49.6% |         0.4% |       2.7% |      39.4% |            -3.29 |
| +2 HP                |        67.4% |         0.7% |       9.2% |      60.0% |             3.10 |
| +3 HP                |        75.0% |         0.9% |      14.5% |      69.2% |             5.90 |
| +4 Strength          |        99.8% |        79.1% |      88.7% |      99.9% |            25.62 |
| +4 Speed             |         100% |        70.6% |      91.4% |      99.9% |            25.58 |
| +4 Defense           |        94.1% |         6.2% |      29.6% |      92.7% |            19.06 |
| +8 HP                |        96.5% |         6.2% |      54.7% |      94.4% |            14.01 |
| +12 HP               |        99.8% |        23.6% |      81.2% |      99.3% |            15.26 |

Start further allocation tests at +3 max HP per point. That bonus was
competitive with +1 Strength for surviving the level 4, heavy, and quick
matchups. Even +12 HP fell behind offensive builds against level 5. When
the player loses, Sanctum charges for the extra missing HP as well. The
starter with +12 HP won almost every level 4 fight yet kept less gold than
the +4 Defense build, which reduced the damage taken per hit. +1 Defense
still left the level 4 result unchanged, so direct Defense allocation
needs a separate look at when it starts reducing actual damage.

### Speed curve with random ties

Compare `random-ties` with `random-ties-speed-curve` to isolate the existing
square-root Speed candidate under the same tie policy and seeds.

| Matchup                 | Random ties | Random ties with Speed curve |
| ----------------------- | ----------: | ---------------------------: |
| +4 Speed vs. level 5    |       70.6% |                        34.2% |
| +4 Speed vs. heavy      |       91.4% |                        38.3% |
| Starter vs. quick       |       39.4% |                        96.2% |
| +4 Strength vs. level 5 |       79.1% |                        79.4% |

With the curve, the +4 Speed build went from 7.27 to 6.45 attacks per
level 5 fight, and the dummy went from 4.86 to 5.43. The Speed build's net
gold there went from +13.24 to -6.88. The heavy and quick results show how
much the same curve changes the roles of different enemies. Keep the
current Speed formula for the next allocation tests. Compare +3 HP in
mixed builds, and test Defense around the points where one more point
actually reduces damage.

### Mixed builds and Defense breakpoints

This trial uses the live Speed formula and random timing ties. Each mixed
build starts at 28 HP, 6 Strength, 6 Speed, and 0 Defense. That models
spending three points on +3 HP, +1 Strength, and +1 Speed. The table shows
where the fourth point goes, including a trial where it buys +2 Defense.

| Fourth point | Level 4 wins | Level 4 net gold | Level 5 wins | Level 5 net gold | Heavy wins |
| ------------ | -----------: | ---------------: | -----------: | ---------------: | ---------: |
| +1 Defense   |        98.9% |           +19.96 |        35.3% |            -8.93 |      72.5% |
| +2 Defense   |        99.4% |           +20.31 |        47.1% |            -2.52 |      88.5% |
| +1 Strength  |       99.98% |           +24.03 |        75.9% |           +14.19 |      90.8% |
| +1 Speed     |       99.98% |           +24.13 |        55.8% |            +2.17 |      89.6% |
| +3 HP        |        99.8% |           +20.33 |        57.1% |            +0.43 |      87.5% |

Strength gave the strongest level 5 result. Spending the last point on HP helped the
build turn level 5 from a loss into a small profit compared with either
Defense option. Against the heavy opponent, +2 Defense and +3 HP came
within about a percentage point of each other.

Defense is applied after the critical bonus and damage rounds to a whole
number. Against the level 4 dummy, these are the final damage values for
each possible base roll, in order from 3 through 5.

| Total Defense | Ordinary damage | Critical damage | Starter win rate |
| ------------- | --------------- | --------------- | ---------------: |
| 0             | 3, 4, 5         | 5, 6, 8         |            49.6% |
| 1             | 3, 4, 5         | 5, 6, 8         |            49.6% |
| 2             | 3, 4, 5         | 5, 5, 7         |            50.9% |
| 3             | 3, 3, 4         | 4, 5, 7         |            88.1% |
| 4             | 2, 3, 4         | 4, 5, 7         |            94.1% |

At 2 Defense, only critical rolls change against this dummy. At 3,
two of the three ordinary rolls each lose a point of damage. The
level 5 dummy hits harder, so 2 Defense already cuts its highest
ordinary roll from 6 to 5. These thresholds depend on the enemy's
damage range and the player's total Defense, including gear.

For the initial allocation prototype, test Strength, Speed, and +3 HP
per point. Keep direct Defense allocation provisional until the same
point increments have been tested on top of Worn Leather Armor's +3
Defense. That comparison will show how much the breakpoint at 3
contributes to the value of the first piece of armor.
