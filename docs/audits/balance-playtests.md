# Balance playtest results

These trials record the builds, rules, and results used for earlier balance decisions. Explicit fixtures preserve older rules where the scripts support them. Use the [playtesting guide](../planning/playtesting.md) for current procedures and the [gameplay index](../gameplay/README.md) for live rules.

- [Starter equipment](#starter-equipment-results)
- [Combat stat audit](#combat-stat-audit)
- [Early XP pacing trial](#early-xp-pacing-trial)
- [Level 10 progression playtest](#level-10-progression-playtest)
- [Ruins comparison](#class-neutral-attack-power-comparison)
- [Full Floor 1 expeditions](#full-floor-1-expeditions)
- [Floor 1 repeat-cache comparison](#floor-1-repeat-cache-comparison)
- [Floor 1 live cache trial](#floor-1-live-cache-trial)

## Historical combat playtests

The simulations below record the earlier Strength-based rules. Their scripts
keep the original combat ratings for reproducibility. The class-neutral Ruins and Dominion comparison appears at the end of this report.

### Starter equipment results

Each fight started at full HP. For each dummy level, the simulation used the
same 1,000 random seeds across all eight loadouts. The original +1 armor and
no armor produced identical outcomes and HP at levels 1–5.

| Loadout                      | Level 3 mean HP on wins | Level 4 win rate | Level 4 mean HP on wins | Level 5 win rate |
| ---------------------------- | ----------------------: | ---------------: | ----------------------: | ---------------: |
| No gear                      |                   12.77 |            69.1% |                    4.18 |             0.8% |
| Sword and original +1 armor  |                   13.64 |            89.5% |                    5.81 |             6.1% |
| Sword and candidate +2 armor |                   13.70 |            91.5% |                    5.82 |             8.8% |
| Sword and adopted +3 armor   |                   14.96 |            99.5% |                    8.41 |            21.6% |
| Adopted +3 armor alone       |                   14.19 |            96.2% |                    6.34 |             2.8% |

The sword alone reduced the average attack count from 9.22 to 8.41 at
level 3 and from 11.59 to 10.54 at level 4. With the sword equipped at
level 4, +2 armor reduced 162 of 4,824 matched incoming hits, while +3 armor
reduced 3,326. All loadouts won every fight at levels 1–3 and lost every
fight at levels 6–8. This supports +3 as the starter bonus if level 4 is
intended to become reliable once a player is equipped.

## Combat stat audit

Run this from the repository root after `nvm use`.

```sh
node --import tsx scripts/audit-battle.ts > /tmp/drevan-battle-audit.csv
```

Expect 2,880 data rows, each summarized from 5,000 fights using seeds 1–5,000.
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

### Historical player-first baseline

The table shows win rates with the tested build in the player slot. The
`player-first` CSV rows reproduce the original timing rule. The original
`no-crits` and `speed-curve` comparisons use that same rule.

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

| Player-slot matchup  | Player-first win rate | Random ties | Player-first HP on wins | Random ties HP on wins |
| -------------------- | --------------------: | ----------: | ----------------------: | ---------------------: |
| Starter mirror       |                 70.4% |       49.6% |                    4.17 |                   3.80 |
| Starter vs. dummy 3  |                  100% |        100% |                   12.84 |                  12.38 |
| Starter vs. dummy 4  |                 70.4% |       49.6% |                    4.17 |                   3.80 |
| Equipped vs. dummy 4 |                 99.4% |       96.0% |                    8.43 |                   6.98 |
| Equipped vs. dummy 5 |                 20.7% |       13.6% |                    3.21 |                   3.10 |
| +4 Speed vs. dummy 5 |                 74.7% |       70.6% |                    4.86 |                   4.14 |

The enemy-slot mirror won 50.4% of the trial fights. Both slots averaged
5.78 attacks, compared with 6.15 for the player and 5.45 for the enemy in
the player-first baseline. Mean fight duration moved from 102.98 to 102.72 clock
units. The trial brought the slots close to even with little change in pace.
The equipped starter still won most level 4 fights, with about 1.45 less
HP left on wins. That matters for the cost of repeated training.

### Training gold after healing

The CSV includes average training reward, Sanctum cost, and net gold per
fight for training dummies in the enemy slot. The calculation uses the
[training reward](../../src/services/training.ts) of 10 gold per dummy level
on a win and the [Sanctum rate](../../src/routes/game/hospital.ts) of one gold
per missing HP after every fight. A loss pays zero gold and healing from
zero HP costs the build's full max HP. Each run starts at full HP and
assumes the player can afford to heal. This measures gold per fight.
Session duration and the upfront cost of gear need a separate playtest.

| Build    | Dummy level | Player-first reward | Player-first healing | Player-first net | Trial reward | Trial healing | Trial net |
| -------- | ----------: | ------------------: | -------------------: | ---------------: | -----------: | ------------: | --------: |
| Starter  |           2 |               20.00 |                 5.56 |            14.44 |        20.00 |          5.56 |     14.44 |
| Starter  |           3 |               30.00 |                12.16 |            17.84 |        30.00 |         12.62 |     17.38 |
| Starter  |           4 |               28.14 |                22.06 |             6.08 |        19.82 |         23.12 |     -3.29 |
| Equipped |           3 |               30.00 |                10.01 |            19.99 |        30.00 |         10.13 |     19.87 |
| Equipped |           4 |               39.76 |                16.62 |            23.14 |        38.41 |         18.30 |     20.11 |
| Equipped |           5 |               10.33 |                24.34 |           -14.01 |         6.81 |         24.58 |    -17.77 |

Net gold is calculated before rounding the three averages. Under both
rules, the starter earned the most per fight at level 3 and the equipped
starter at level 4. The trial narrowed the equipped advantage of choosing
level 4 over level 3 to 0.24 gold per fight. At level 4, a starter with
+1 Speed improved from 6.84 to 12.44 net gold under the trial, while +1
Strength fell from 16.12 to 7.64. The adjusted order can help a build
when it takes away a timing advantage from the dummy.

The timing change uses the existing training payouts. If the goal is for equipped players to earn meaningfully more at
level 4 than at level 3, test that margin in a timed training session.

### Stat allocation trial with random ties

The following rows use random timing ties and the adopted Speed formula. For
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
adopted Speed formula for later allocation tests. Compare +3 HP in
mixed builds, and test Defense around the points where one more point
actually reduces damage.

### Mixed builds and Defense breakpoints

This trial uses the adopted Speed formula and random timing ties. Each mixed
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

### Defense allocation with starter gear

The same four-point builds fought under random ties with Worn Leather
Armor alone, then with both starter items. The armor adds +3 Defense and
the Rusted Sword adds +1 Strength. The table shows wins and net gold
after a full Sanctum heal.

| Fourth point | Armor only, level 5 wins | Armor only, level 5 net | Both items, level 5 wins | Both items, level 5 net | Both items, level 6 wins |
| ------------ | -----------------------: | ----------------------: | -----------------------: | ----------------------: | -----------------------: |
| +1 Defense   |                    82.6% |                  +18.51 |                    98.0% |                  +30.02 |                    22.5% |
| +2 Defense   |                    83.3% |                  +18.89 |                    98.2% |                  +30.20 |                    22.9% |
| +1 Strength  |                    96.7% |                  +28.10 |                    98.7% |                  +30.64 |                    41.9% |
| +1 Speed     |                    92.6% |                  +23.96 |                    99.3% |                  +31.29 |                    43.0% |
| +3 HP        |                    90.5% |                  +20.69 |                    99.4% |                  +29.40 |                    41.2% |

Wearing armor made all five builds profitable at level 5. Raising total
Defense from 4 to 5 barely moved the results there because all four
ordinary damage rolls from the level 5 dummy land for the same amount at
both values. Fully equipped, the HP build won the most level 5 fights and
kept about two gold less per fight than the Speed build. The Speed build
lost slightly more often and paid less to heal overall. All five builds
still lost gold on average at level 6.

Start the allocation prototype with +1 Strength, +1 Speed, or +3 max HP
per point. Keep Defense as a gear bonus for the prototype. That gives
armor a clear role while avoiding an allocation choice whose value
depends heavily on damage rounding. Revisit direct Defense allocation
with stronger enemies or a wider gear catalog.

### Dominion and Sanctum route playtest

A temporary copy of the app ran both tie rules over HTTP using migrated
disposable SQLite databases. Each session began at full HP with 100 gold
after gear purchases. The equipped runs bought and equipped both starter
items through the Emporium and inventory routes. Each session opened
Dominion, submitted a training fight, then visited Sanctum to heal.
Sessions ran up to 50 bouts or stopped when a full heal was unaffordable.
Both rules used the audit's combat seeds 1–50 and random ties used the
separate tie stream. This was an automated route playtest. Time spent by a
player reading, choosing actions, or switching activities was outside its
scope.

| Starter gear | Dummy level | Player-first wins / bouts | Player-first ending gold | Random ties wins / bouts | Random ties ending gold |
| ------------ | ----------: | ------------------------: | -----------------------: | -----------------------: | ----------------------: |
| None         |           3 |                   50 / 50 |                    1,008 |                  50 / 50 |                     987 |
| None         |           4 |                   34 / 50 |                      373 |                  18 / 36 |                      12 |
| Both items   |           3 |                   50 / 50 |                    1,117 |                  50 / 50 |                   1,115 |
| Both items   |           4 |                   50 / 50 |                    1,278 |                  48 / 50 |                   1,089 |

Under random ties, unequipped level 4 training ended at 0 HP with 12 gold,
short of the 25 gold required to heal. A follow-up request confirmed that
Dominion blocks another fight at 0 HP. The player could still fish, sell
the catch, and heal. The route test forced 13 Murkfin catches to verify
that recovery path without depending on fishing luck.

The route results support describing level 3 as the repeatable starter
fight and level 4 as a gear check with random ties. With both
items, level 3 kept slightly more gold than level 4 in this 50-bout
sample. The larger audit put level 4 ahead by 0.24 gold per fight, so
treat their returns as close. Random timing ties are now the default in
the shared simulator.

## Early XP pacing trial

From the repository root, run this after `nvm use`.

```sh
node --import tsx scripts/playtest-progression.ts > /tmp/drevan-progression.csv
```

Expect 57 data rows. The first 30 model two candidate rewards for training
wins. Flat pays 30 XP and scaled pays 10 XP per dummy level. Both use
cumulative thresholds of 60, 150, and 270 XP for character levels 2, 3,
and 4. Losses and draws grant zero XP.

Each matchup runs 1,000 seeded sessions with the adopted combat rules. A
session starts with 100 gold and full HP. The equipped build starts with
both starter items already owned. Each session sticks to one dummy and
pays Sanctum after each bout before fighting again. It stops at character
level 4, after 30 bouts, or when it cannot afford the next full heal.
The model saves all stat points so this comparison isolates XP pacing.
Results measure bouts. A timed player session is still needed to measure
how long a level takes.

| Training plan       | Flat bouts to level 4 | Scaled bouts to level 2 | Scaled bouts to level 3 | Scaled bouts to level 4 | Scaled sessions reaching level 4 |
| ------------------- | --------------------: | ----------------------: | ----------------------: | ----------------------: | -------------------------------: |
| Level 1, no gear    |                  9.00 |                    6.00 |                   15.00 |                   27.00 |                             100% |
| Level 2, no gear    |                  9.00 |                    3.00 |                    8.00 |                   14.00 |                             100% |
| Level 3, no gear    |                  9.00 |                    2.00 |                    5.00 |                    9.00 |                             100% |
| Level 4, no gear    |                 15.11 |                    3.45 |                    6.80 |                   11.74 |                            61.6% |
| Level 4, both items |                  9.36 |                    2.09 |                    4.16 |                    7.29 |                             100% |

Mean bouts to each level include only sessions that reached that level.
Of 1,000 unequipped level 4 sessions, 384 could no longer afford healing
before reaching character level 4 under scaled XP. Under flat XP, 460
ran out of healing gold before reaching the same goal. The scaled run
typically stops earlier when it succeeds, so these totals compare failure
to reach the goal and are not per-bout affordability rates.

Prototype scaled XP with these early thresholds. Flat XP gives the three
easiest dummies the same progression pace. Scaled XP makes level 3 a
reliable starter route and gives equipped players a faster route at
level 4, while an unequipped player can still earn XP from easier fights.

### Spending the first stat point

The remaining rows use scaled XP. Each session starts with the level 3
dummy. After reaching character level 2, the build moves to the level 4
dummy and either saves its first point or spends it on +1 Strength,
+1 Speed, or +3 max HP. Later points are saved. Spending on max HP raises
the amount needed for a full heal. Current HP increases only through
healing. Staying at level 3 and saving the point is the comparison.

| First point                | No gear, reached character level 4 | No gear, mean bouts on reach | Both items, mean bouts on reach |
| -------------------------- | ---------------------------------: | ---------------------------: | ------------------------------: |
| Save and stay at level 3   |                               100% |                         9.00 |                            9.00 |
| Save and switch to level 4 |                              77.9% |                        12.50 |                            8.22 |
| +1 Strength and switch     |                              99.7% |                        10.14 |                            8.02 |
| +1 Speed and switch        |                               100% |                         9.14 |                            8.01 |
| +3 max HP and switch       |                              99.6% |                         9.84 |                            8.03 |

All equipped sessions reached character level 4. Without gear, 221 of
1,000 sessions that saved the point and switched ran out of healing
gold. Spending the point brought that down to three for Strength, zero
for Speed, and four for max HP. Speed performed best in this particular
level 4 matchup. The earlier mixed-build audit found that Strength led
at level 5 before gear. Keep all three options for the prototype.

The first point changes which encounters an unequipped player can
repeat. Staying at level 3 leaves saving points viable. Use cumulative
thresholds of 60, 150, and 270 XP and one point per level-up for the
first prototype. Validate earning and spending in the app, then use
timed play to decide later thresholds.

### Fresh-character progression route playtest

Thirty new accounts played through the prototype on a migrated disposable
database, with five seeds for each plan below. Every account signed up
with the normal 100 gold and 25 HP. A session opened Dominion, submitted a
training form, and used Sanctum after every bout, including the final one
if affordable. At 60 XP it either stayed at dummy level 3 or switched to
level 4. One plan bought and equipped the Rusted Sword through the normal
routes while saving its point. Every account signed in again at the end
to verify its level and unspent points persisted.

| Choice at character level 2              | Reached character level 4 | Mean bouts on reach | Mean ending gold on reach |
| ---------------------------------------- | ------------------------: | ------------------: | ------------------------: |
| Save point and stay at dummy level 3     |                     5 / 5 |                 9.0 |                     258.6 |
| Save point and switch to dummy level 4   |                     4 / 5 |               12.75 |                    130.25 |
| +1 Strength and switch                   |                     5 / 5 |                 9.2 |                     226.4 |
| +1 Speed and switch                      |                     5 / 5 |                 9.4 |                     218.4 |
| +3 max HP and switch                     |                     5 / 5 |                10.2 |                     174.4 |
| Buy Rusted Sword, save point, and switch |                     5 / 5 |                 9.2 |                     126.4 |

All accounts reached character level 2 after two bouts. The sessions
played 303 bouts with 59 defeats. Each defeat granted zero XP. The
session that ran out of healing gold stopped at 260 XP with 9 gold.
Rusted Sword matched the Strength point's fight outcomes on the same
seeds, and the 100-gold purchase preserved the point for later. Buying
max HP kept current HP steady until the player paid Sanctum to heal.

The original thresholds worked through the actual routes, and dummy level 3
gave players a reliable way to bank points. These automated sessions measured
actions and outcomes before the switch to per-level XP costs.

### Level 10 progression playtest

Run the baseline from the repository root with the Node version pinned in
`.nvmrc`:

```sh
node --import tsx scripts/playtest-level-cap.ts > /tmp/drevan-level-cap.csv
```

Expect 15 data rows with checkpoints at character levels 2, 4, 6, 8, and 10.
The script uses the shared combat simulator and the progression rules at the time,
including XP carryover and the 6,300 lifetime XP needed for level 10. It runs
1,000 seeded sessions per plan, each capped at 250 bouts. Every session starts
with 100 gold, the Rusted Sword, and Worn Leather Armor already equipped. It
buys a full Sanctum heal after every fight and stops if the player cannot
afford one. Starting with both items isolates training and allocation from
the time and gold needed to acquire gear.

| Training plan                                                              | Reached level 6 | Reached level 10 | Mean bouts to level 10 | Mean defeats through level 10 | Mean gold after final heal |
| -------------------------------------------------------------------------- | --------------: | ---------------: | ---------------------: | ----------------------------: | -------------------------: |
| Dummy level 4, save all points                                             |           1,000 |            1,000 |                 164.26 |                          6.26 |                   3,416.42 |
| Dummy level 4, spend all points on Strength                                |           1,000 |            1,000 |                 158.11 |                          0.11 |                   4,857.37 |
| Raise dummy level every two character levels, spend all points on Strength |             255 |                0 |                      — |                             — |                          — |

The rising plan starts at dummy level 4 and switches to levels 5 and 6 at
character levels 3 and 5, respectively. Every session on that plan ran out of
healing gold before character level 8. At fixed dummy level 4, Strength cut
defeats and healing costs, but saved only about six bouts on the way to the
cap. This baseline covers a single stat choice and two difficulty plans.

#### Fresh-account route check

Ten fresh accounts ran through the actual game routes on a migrated,
seeded disposable database. Each account bought and equipped a Rusted
Sword with its starting gold, trained against dummy level 2 below 25 gold
and level 3 otherwise, and spent all earned points on Strength. After
buying Worn Leather Armor with at least 25 gold left, it switched to its
assigned dummy. Both plans used seeds 1–5 and attempted a full Sanctum
heal after every fight.

| Dummy after buying armor | Reached character level 10 | Bouts to cap | Gold after the final heal |
| ------------------------ | -------------------------: | -----------: | ------------------------: |
| 4                        |                        5/5 |          160 |               4,626–4,741 |
| 5                        |                        4/5 |      130–134 |               4,259–4,317 |

All accounts reached character level 2 after three bouts and bought armor
after seven or eight. The fifth dummy-level-5 account lost its first two
fights after buying armor and could no longer afford a full heal. The nine
accounts that reached the cap had spent nine stat points each. Every account
signed in again, and The Quarters showed the saved level and the expected
XP display.

The route check confirms that the starter gear can be earned in play and
that dummy level 5 can shorten the run at a higher risk of losing the healing
reserve. The requests ran back-to-back, so their elapsed time measures local
request execution. Human session pacing still needs to be measured.

#### Starter supplies rerun

The same two plans and seeds ran again with 125 starting gold and three
Lesser Potions. Each account used a potion whenever it was missing at least
10 HP, then paid Sanctum for any remaining healing. All ten accounts used
all three potions, and each potion restored 10 HP. Armor was affordable
after four or five bouts, compared with seven or eight before.

| Dummy after buying armor | Reached character level 10 | Bouts to cap | Defeats per account |
| ------------------------ | -------------------------: | -----------: | ------------------: |
| 4                        |                        5/5 |          159 |                   0 |
| 5                        |                        5/5 |      131–134 |                 3–6 |

The seed that previously ran out of healing gold on dummy level 5 reached
level 10 in 131 bouts. The rerun measures the combined effect of extra gold,
potions, and switching dummies earlier when armor becomes affordable.

## Historical Ruins Floor 1 comparison

Run from the repository root after selecting the pinned Node version.

```sh
node --import tsx scripts/playtest-ruins.ts --historical > /tmp/drevan-ruins-historical.csv
```

The historical run prints 18 data rows, with 1,000 full-health fights per row. The three
builds are a fresh player, a player with both starter items, and a level 4 player
with both items and one point in each of Strength, Speed, and max HP. Every
Ruins enemy is paired with its Dominion baseline on the same seeds. Both
script modes use the midpoint of each Ruins gold range, which matches the
original fixed payout. Dominion uses its fixed reward of 10 gold per dummy
level. This keeps the expected payout comparable without adding a reward roll
to the seeded combat sequence. Net gold
subtracts one gold per missing HP for a full Sanctum heal, including after a
loss. Mean remaining HP includes defeats as zero. All survivors won in this
run. This isolates the fights and excludes travel, discoveries, equipment
purchase costs, potions, and healing affordability.

| Build                    | Opponent pair | Survival (Ruins / Dominion) | Mean HP (Ruins / Dominion) | Mean net gold (Ruins / Dominion) |
| ------------------------ | ------------- | --------------------------: | -------------------------: | -------------------------------: |
| Fresh                    | Scavenger / 3 |             100.0% / 100.0% |              13.38 / 12.26 |                  +18.39 / +17.26 |
| Fresh                    | Sentinel / 4  |               56.6% / 49.6% |                2.26 / 1.83 |                    −0.10 / −3.33 |
| Fresh                    | Warden / 5    |                 1.0% / 0.4% |                0.01 / 0.01 |                  −24.48 / −24.79 |
| Starter gear             | Scavenger / 3 |             100.0% / 100.0% |              15.86 / 14.86 |                  +20.86 / +19.86 |
| Starter gear             | Sentinel / 4  |               96.3% / 95.7% |                6.41 / 6.70 |                  +19.93 / +19.98 |
| Starter gear             | Warden / 5    |               11.9% / 14.1% |                0.35 / 0.42 |                  −18.70 / −17.53 |
| Level 4 with gear and AP | Scavenger / 3 |             100.0% / 100.0% |              21.59 / 21.10 |                  +23.59 / +23.10 |
| Level 4 with gear and AP | Sentinel / 4  |             100.0% / 100.0% |              14.03 / 14.64 |                  +26.03 / +26.64 |
| Level 4 with gear and AP | Warden / 5    |               95.5% / 95.3% |                7.18 / 7.76 |                  +26.93 / +27.41 |

The Scavenger was a reliable fresh-character fight. The Sentinel became
profitable with starter gear. The Warden still defeated 88.1% of geared
starters, while the level 4 build survived 95.5% of fights from full HP.
These results establish a combat baseline. A timed play session can measure
how carrying damage between encounters and spending potions affect the
decision to fight, walk back, or use the Recall Beacon.

## Class-neutral Attack Power comparison

Run the same Ruins and Dominion matchups with the live player builds.

```sh
node --import tsx scripts/playtest-ruins.ts > /tmp/drevan-ruins.csv
```

Each matchup uses the same 1,000 seeds and starts both sides at full HP.
The fresh and geared builds go from 5 to 10 and from 6 to 11 offensive power,
respectively. The level 4 build uses 13 Attack Power, 5 Speed, and 28 HP after
two offensive points and one Fortitude point. Opponent stats, rewards, and
damage rules are identical across the two script modes. The live expedition rolls gold across the full range.

| Matchup                       | Historical win rate | Class-neutral win rate |
| ----------------------------- | ------------------: | ---------------------: |
| Fresh vs. Fractured Sentinel  |               56.6% |                  99.8% |
| Fresh vs. Alloy Warden        |                1.0% |                  83.6% |
| Fresh vs. level 5 dummy       |                0.4% |                  86.6% |
| Starter gear vs. Alloy Warden |               11.9% |                  99.1% |

The fresh build's base damage range rises from 3–5 to 5–10 before critical
hits and Defense. In these full-health simulations, the easier wins and higher
remaining HP also improve gold after healing. The fresh build's mean net gold
against the Warden rose from −24.48 to +21.22 per fight.

## Historical economy comparison

At the starter fish prices, 50 casts returned an expected 78 gold before any stack limits. In the Strength-based training comparison over 1,000 seeded fights per matchup with a full Sanctum heal after every fight, an unequipped starter averaged 8.43 net gold at level 1 and 17.77 at level 3. A starter with both gear pieces averaged 23.17 at level 4. Session duration remained unmeasured in this comparison.

## Full Floor 1 expeditions

The November 24, 2026 playtest covered revision `82d4285`. The live route runs used a migrated, seeded disposable SQLite database, fresh accounts, and the game's normal random rolls. Each of three groups made 16 expeditions on the same account, restoring to 25 HP at Sanctum between trips and saving earned attribute points. All accounts began with 125 gold and three Lesser Potions. The geared account received the Rusted Sword and Worn Leather Armor as test fixtures, then equipped them through The Quarters. The Quarters showed 11 Attack Power and 3 Defense, compared with 10 and 0 for the unequipped build. A separate geared smoke fight beat a level 3 Dominion dummy with 22 HP remaining. The payout comparison excludes equipment acquisition costs.

Each trip collected the potion cache at (0, 2) and the 8-gold cache at (1, 0), passed the sealed stairs, and fought the Scavenger, Sentinel, and Warden in that order. Survivors walked home, crossing the gold cache again on the way out. The healing groups used one Lesser Potion before each fight if HP was 15 or lower. The push group used no potions. Every failed expedition ended in defeat at zero HP.

| Build and policy    | Scavenger wins | Sentinel wins | Warden wins | Potions used | Mean gross gold | Mean Sanctum cost | Mean net gold |
| ------------------- | -------------: | ------------: | ----------: | -----------: | --------------: | ----------------: | ------------: |
| Unequipped, push    |          16/16 |         15/16 |        0/15 |            0 |           75.62 |             25.00 |         50.62 |
| Unequipped, heal    |          16/16 |         14/16 |        0/14 |           14 |           73.44 |             25.00 |         48.44 |
| Sword + armor, heal |          16/16 |         16/16 |       15/16 |           16 |          133.25 |             18.25 |        115.00 |

The unequipped groups reached the Warden with 7.2 HP on average without a potion and 15.1 HP after using one. The sword and armor group arrived with 20.6 HP after healing and finished the fight with 6.8 HP on average across all attempts. One unequipped run went from 25 to 19 HP against the Scavenger, then to 8 against the Sentinel. The next decision was whether to retreat or spend a potion to fight at 18 HP. That run spent the potion, lost to the Warden, kept the earlier rewards, and paid 25 gold at Sanctum. The existing full-health simulation gave the unequipped build an 83.6% Warden win rate over 1,000 fights. The expedition results show how strongly that matchup depends on carried HP. The groups used independent rolls, so their small differences at the Sentinel cannot isolate the effects of a potion.

The Scavenger granted a Lesser Potion on **8 of 48 wins (16.7%)** against the configured 20% chance. Each drop added one to the existing stack and appeared in the battle report. The sample gives a route-level check of the live drop and is too small to justify changing the rate. The potion cache added 16 potions per group on its own. The two healing groups ended with six potions each, and identical potions share a stack, so individual uses have no source attribution. The cache delivered six times as many potions as all the victory rolls in this trial.

### Repeat income and activity comparison

- Five consecutive arrivals at the entrance cache paid 40 gold across 10 movement actions with no combat, healing, or supplies spent. Two arrivals at the potion cache raised the starter stack from three to five. Both caches also paid on successive expeditions. A Scavenger victory paid 25–35 gold and 30 XP, with the potion roll on top.
- The unequipped Dominion comparison used eight fights per dummy level and healed to full after each. Levels 3, 4, and 5 won 8, 8, and 6 times and averaged 24.38, 28.38, and 15.50 net gold per fight. The level 5 mean includes recovery from both defeats. The combined mean was 68.25 gold for a set of three fights, with full HP at the start of each.
- One allowance of 50 Driftwater casts produced 29 Murkfin, 12 Glassscale, and two Astral Koi. Selling them at Curious Emporium yielded 85 gold with zero healing cost.
- The comparisons use action counts and route payouts. They do not establish gold per minute or measure how people choose routes. Expeditions require travel, and the geared group's result includes one potion per trip and the return-path gold cache on successful runs.

### Keyboard and narrow-screen observations

A separate Chromium walkthrough at 320 CSS pixels exercised entry, both cache discoveries, the sealed stairs, Pass by, fighting after returning to the enemy tile, battle-log expansion with Space, stale fight-form rejection in the disposable game, walking out, and using Recall. Entry and movement focused the current tile. Victory focused **Battle summary**. Recall focused its confirmation in Nexaris and was disabled on re-entry that day. The normal exit landed in Nexaris with focus on the document body. In a separate browser run, a potion raised HP from 7 to 17 before the Warden fight. Defeat returned the player to Nexaris, focused **Battle summary**, and offered a Sanctum link.

After arrival at the Scavenger, the HP value was in view above the map. The **Fight** and **Pass by** choices required scrolling below the map, and Recall sat farther down after the consumables. After a cache arrival, the discovery message was below the viewport even though focus had returned to the tile. At the entrance, the normal exit and Recall also started below the viewport. The keyboard walkthrough used the current playtest markers and did not measure unaided discovery or screen-reader announcements. The Chromium and axe regression suite passed separately.

Keep the Warden as the tougher encounter for the next pass and retain the 20% Scavenger rate for now. Before expanding the tables, settle how freely caches should pay on repeat arrivals. The gold cache supplies income without risk, and the potion cache largely determines supply in this route. Compare a less generous cache rule on the same route before using these payouts to price future materials. Check encounter, discovery, and exit visibility again on a narrow screen when testing reduced map markers.

## Floor 1 repeat-cache comparison

The November 24, 2026 follow-up used the rules at `ab85a8e` and varied only the cache claim rules in a simulation. For each build, rule, and trip schedule, 1,000 paired sessions ran 16 trips each. Each session began with three Lesser Potions. Each trip began at 25 HP, with Sanctum charging for any missing HP after every trip. The sessions omitted attribute spending, equipment purchases, potion purchases, and Recall. Survivors returned on foot. The builds, healing threshold, and route matched the full expedition playtest. The outward route visited the potion and gold caches once each, then fought the Scavenger, Sentinel, and Warden. The return route crossed the gold cache a second time.

The simulation used the live map, combat simulator, and Scavenger drop chance. For each fight, the existing seeded generator used `(sessionSeed * 16 + tripIndex) * 49 + tile` with session seeds 1–1,000, trip indices 0–15, and tile indices 9, 25, and 48 for the fights. Each fight drew gold first, then combat, then the drop on eligible victories, matching the live order. Resetting the stream for each fight kept later rolls paired when potion availability changed a fight's length. Daily claims reset between modeled Central days. A per-expedition claim reset at each entry, including after defeat.

### Four trips per Central day

| Cache rule                  | Unequipped net gold per trip | Unequipped Warden clears | Geared net gold per trip | Geared Warden clears | Cache potions per session |
| --------------------------- | ---------------------------: | -----------------------: | -----------------------: | -------------------: | ------------------------: |
| Every arrival (live rule)   |                        56.51 |                    13.2% |                   103.00 |                78.9% |                        16 |
| Both once per expedition    |                        55.45 |                    13.2% |                    96.69 |                78.9% |                        16 |
| Both once per day           |                        47.09 |                     9.1% |                    77.56 |                55.4% |                         4 |
| Daily gold, potion per trip |                        49.45 |                    13.2% |                    90.69 |                78.9% |                        16 |

Net gold subtracts Sanctum costs. Warden clears use all trips as the denominator, including trips ended by earlier defeats. With both caches daily, the geared build reached the Warden at 15 HP or less without a potion on 31.1% of all trips. Daily gold with a potion per trip produced the same fight outcomes as the live-rule simulation and reduced geared net gold by 12.31 per trip. When all 16 trips were compressed into one modeled day, the daily rule for both caches dropped Warden clears to 6.6% unequipped and 41.4% geared. The split rule held clears at 13.2% and 78.9% while yielding 47.95 and 89.19 net gold per trip, respectively.

### Short cache routes and candidate rule

- On the five-arrival gold-cache loop from the live trial, the current rule yields 40 gold over 10 moves. Both a per-expedition claim and a daily claim yield 8 gold on that loop. Leaving and re-entering between each visit restores the per-expedition payout to 40 gold, at a cost of five entries and five exits in addition to the same 10 moves. Daily gold stays at 8 across those re-entries.
- The split rule still allows a player to leave and re-enter to collect another potion without fighting. The cache contributes one potion per full trip, while the Scavenger contributes about 0.19. The split rule preserves that supply while controlling repeat gold. Making both caches daily would increase the importance of the drop, but it sharply reduces completion under the tested healing policy.
- Advance **one gold-cache claim per Central day and one potion-cache claim per expedition** to a live trial before expanding loot. Verify that walking out, Recall, and defeat start a new potion claim on re-entry, that logging out preserves the current claim, and that gold can be claimed again after Central midnight. Recheck discovery and exit visibility with reduced markers as planned.

These results use fixed routes and healing decisions. The candidate rules were simulated and have no live persistence or UI measurements. Players may buy potions, skip empty caches, farm supplies, or retreat instead of continuing to the Warden. The simulation measures payouts and clears under identical route choices and leaves those adaptations for live testing.

## Floor 1 live cache trial

The November 24, 2026 trial used a disposable copy of `27024ce` with the real Express routes, migrated and seeded SQLite, and two temporary claim fields. The gold claim stored the Central game date. The potion claim reset on entry and persisted in the expedition. A successful award saved the claim alongside the movement revision in the existing transaction. The copy also hid gold, item, and enemy map markers and showed the Floor 2 marker only on its square.

The trial ran 64 full expeditions through the normal routes. Each of four accounts ran 16 trips at four per modeled Central day. Each build had an every-arrival account and a split-rule account. The builds, route, starting supplies, and HP threshold matched the earlier trials. Each fight used the seed-1 stream from the cache simulation for its trip and tile. Sanctum restored HP between trips, and gear was supplied as a fixture. Both rules produced identical per-fight HP, combat rewards and XP, potion use and drops, and exit outcomes in every matched pair.

| Build and cache rule        | Warden clears | Potions used | Scavenger drops | Mean Sanctum cost | Mean net gold per trip |
| --------------------------- | ------------: | -----------: | --------------: | ----------------: | ---------------------: |
| Unequipped, each arrival    |          0/16 |           13 |               1 |             25.00 |                  47.44 |
| Unequipped, split           |          0/16 |           13 |               1 |             25.00 |                  41.44 |
| Sword + armor, each arrival |         13/16 |           15 |               2 |             21.25 |                 105.50 |
| Sword + armor, split        |         13/16 |           15 |               2 |             21.25 |                  93.00 |

Both split-rule accounts received four gold-cache payouts and 16 cache potions. A separate route check capped the same-day five-arrival gold loop at 8 gold. Moving off a claimed potion cache and back left the stock unchanged. A stale form could not repeat a move, and logging out and back in preserved both position and the claimed potion. Walking out, recalling, and recovering after a staged Warden defeat each allowed a fresh potion claim on re-entry. Gold stayed claimed through walkout and Recall, paid again after crossing Central midnight while still inside, and stayed claimed after defeat and re-entry on the new day. The staged defeat used a one-HP fixture. The potion could still be collected again by repeatedly starting an expedition and walking to the cache without fighting.

### Reduced markers at 320 CSS pixels

The Chromium walkthrough confirmed that the map and direction labels revealed no undiscovered caches or enemies. The Floor 2 marker and disabled descent action appeared only at the stairs. The map still restored focus to the current tile after movement. The tile referenced the current feedback in its accessible description, but both the first gold discovery and the empty-cache message were visually below the viewport. At the Scavenger, HP was in view while **Fight**, **Pass by**, and Recall required scrolling. The Battle summary received focus on victory, the log opened with Space, and Recall focused its Nexaris confirmation. The normal exit left focus on the document body. Targeted axe scans found no violations or horizontal overflow on discovery, empty-cache, encounter, and Recall pages at this width.

The paired route trial supports adopting the split cache rule. Before shipping the reduced markers, bring discovery feedback and encounter choices into view on narrow screens, and verify announcements with a screen reader. Keyboard checks followed a known route and cannot establish how a first-time player will navigate without markers. The combat sample used one session's seed stream per build and rule and is a persistence and payout check. The larger simulation remains the better estimate of clear rates. The prototype and its temporary schema changes were confined to the disposable copy.
