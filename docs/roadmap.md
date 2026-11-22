# Drevan gameplay roadmap

Drevan is a browser RPG side project. Start by making the current loop of training, shopping, and healing more rewarding. Each milestone should be playable on its own, and fishing or a small content addition can move up whenever it sounds fun to build. Formulas and values below are starting points for playtesting.

## Next up

### Make equipment matter

- The starter catalog defines +1 Strength for the Rusted Sword and +1 Defense for Worn Leather Armor. Strength remains the sole offensive stat until classes arrive.
- Playtest Defense with diminishing returns. Ten Defense reduces damage by 30% before rounding, and the reduction approaches 60% as Defense increases. Check how small armor bonuses affect low-level fights, where rounding can make them harder to notice.
- Home and training share the calculation for equipped Strength and Defense bonuses, and the Curious Emporium shows item effects and values.
- Compare the same few dummies with and without gear. A sword should make a win easier to reach, and armor should leave the player with noticeably more HP.

### Add a fishing spot

- Start with one location and a **Cast** button. Include a few common catches, an occasional rare catch, and a chance to reel in nothing.
- Sell catches automatically for a little gold. Aim for a few casts to help pay for healing or contribute toward starter gear. Compare gold earned over a short fishing session with gold earned from training before tuning payouts.

## Build on combat

### Audit and tune all combat stats

- **Scope.** Review the full battle loop before introducing stat allocation. Evaluate every stat that affects combat, including stats calculated from other stats, such as Attack Power, as they arrive. Check how each stat performs on its own and in combination with others. Include max HP in the comparison to measure how much survivability it buys for the same investment. Small bonuses should matter, and specializing should come with a trade-off. A build can excel in some matchups while giving another build a chance elsewhere.
- **Speed curve.** Try diminishing returns for Speed. Keep the minimum of 1, use Speed directly through 5, and try `5 * sqrt(Speed / 5)` above 5. Use the adjusted Speed both to decide who is more likely to attack first and to set the time between attacks. Under this curve, 20 Speed gives twice the attack frequency of 5 Speed and roughly a two-thirds chance to open. Check whether those benefits together let fast builds win too often before slower opponents can act.
- **Matchups.** Run repeated fights with the existing battle simulator. Start with a balanced build, then test builds that concentrate their investment in each available combat stat. Compare builds with similar investment using the proposed point costs below or comparable gear where bonuses come from equipment. Test against the same few opponents, including a fast attacker and a slower, harder hitter. Once practice duels exist, repeat the comparison in player matchups.
- **Results.** Compare win rate, remaining HP, and attacks per fight. Read a few battle logs at starter values and at the high end of what players can realistically equip. Watch for bonuses that rarely make a difference, builds that let opponents take too few turns, and combinations that reliably dominate across matchups.
- **Tuning.** Tune one rule or gear bonus at a time and rerun the same matchups. Start with the simplest change that addresses a problem seen in playtests, such as adjusting the Speed curve, the Defense reduction limit, or the gear bonus that makes stacking too cheap.

#### Watch for these during playtesting

- **Speed and damage stacking.** Speed improves both opening odds and attack frequency. Paired with high damage, it can end a fight before the opponent gets much chance to respond. Compare a fast, hard-hitting build with a balanced build at similar investment. Track how many attacks the losing side gets alongside win rate.
- **Ties in attack timing.** The opening roll decides who goes first, but later ties currently favor the player. At equal Speed, an enemy opener can lead to enemy → player → player → enemy. Check this before practice duels by swapping the two combatants and seeing whether either side has a consistent advantage.

### Battle another player in Dominion

- Let a signed-in player choose another living registered player. Check that both players are alive and distinct when the fight starts.
- Resolve a practice duel in one request using the same combat rules and equipment calculations as training. Show the familiar battle log and leave both players' persistent HP, gold, and gear intact.
- Use practice duels to try different gear matchups. Consider opt-in duels with lasting HP loss later if the stakes would make fights more fun.

## Add character progression in layers

### Pick a class and build around a primary stat

- Let players pick or switch class on Home while the system is being tuned. Give each class Strength, Agility, Intellect, Speed, and HP. HP and Speed work the same across classes, and switching preserves allocated stats.
- Try 5 Strength, 5 Agility, 5 Intellect, 5 Speed, and 25 max HP for new characters who choose a class. Preserve existing characters' earned stats and use the new defaults for newly added attributes.
- Calculate **Attack Power** from Strength, Agility, and Intellect after gear bonuses. Add the full value of the class's main stat and one quarter of each of the other two, then round the total down. The Warrior favors Strength, the Wizard Intellect, and the Archer Agility. The Wizard can also get a small critical-hit bonus.
- Feed Attack Power into the existing damage roll. An Archer gets 4 Attack Power from +4 Agility and 1 from +4 Intellect. The proposed starting spread gives 7 Attack Power, up from today's 5, so test starter fights before settling on the defaults. Keep classless players and training dummies on Strength-based damage.
- Show Attack Power and the class's primary stat on Home. Show equipment bonuses and any requirements in the shop so players can compare gear before buying it.

### Earn levels and spend allocation points

- Start by awarding XP for training wins. Tune the first level so players can reach it in a short play session. Show XP progress and unspent allocation points on Home.
- Try one allocation point per level. One point buys +1 Strength, Agility, Intellect, or Speed, or +5 max HP. Let players save points for later.
- Repeat the combat balance comparison once players have several points to spend. Check that each class has meaningful choices and that secondary offensive stats open up some gear options.

### Add a few items with cross-stat requirements

- Let weapons and armor apply multiple stat modifiers, including both increases and reductions on the same item. Show signed modifiers in the shop and inventory, and reflect their combined effect on Home and in combat.
- Try one or two items after players can allocate points. A **Titanium Warlock Robe** could require 8 Strength and grant **+5 Intellect**, **+15 Defense**, and **−5 Speed**. Its weight trades attack speed for protection. A Wizard starting at 5 Strength could spend three points to unlock it.
- Check requirements against permanent stats, including allocated points. Apply equipment modifiers after checking eligibility.
- Offer a comparable robe with an easier requirement and a different benefit, such as more Intellect and lighter protection. Test whether both robes are worth choosing for different builds.

### Let players reset their class and allocation points

- After classes and allocation points are playable, give **The Artificer** (working name) three repeatable services:
  - **Reset allocation points.** Refund spent points for redistribution and keep the player's current class.
  - **Change class.** Let the player select another class they qualify for and keep their existing point allocations.
  - **Change class and reset allocation points.** Let the player choose another eligible class and refund their spent points in one visit.
- Charge a small gold fee for each option. Playtest the fees against early training rewards so players can afford to experiment more than once. Show the selected service's cost and effects before confirmation.
- When a service refunds points, return every spent point to the unspent pool and remove the stat increases bought with those points. Preserve existing unspent points, level, XP, and permanent stat gains from other sources. Track point-funded increases separately when adding allocation so the refund is accurate.
- Recheck equipped items against the resulting stats and class. Preview any gear that will be unequipped and keep it in inventory. If max HP falls below current HP, lower current HP to the new cap. The reset grants no healing.
- On confirmation, validate the selected service, available gold, and any new class on the server. Check class eligibility using the stats the selected service will leave the player with. Save the gold deduction and all character changes in one database transaction so the entire service succeeds or the player's state stays as it was.

## Ideas for later

- **Track combat records.** Start with wins and losses against training dummies. Save the result together with the player's remaining HP and any gold reward. Count draws as neither a win nor a loss. Add a separate win and loss record when PvP arrives, and decide which fights qualify before practice duels can count toward titles.
- **Earn titles through feats.** Award distinct titles for 1,000 training wins and 1,000 qualifying PvP wins. Consider an earlier milestone at 100 wins. Revisit the PvP thresholds once there is enough activity to judge how long they take and whether repeated matchups make them too easy to earn. Show progress toward each feat and let players choose an earned title to display on their player profile.
- **Add a playable alien race.** Give it a place in Drevan’s lore and two character models. Start with appearance and lore so players can choose a race for character flavor.
- Give each class one signature move to try once per battle. A Warrior could brace for the next hit, a Wizard could pierce some armor, and an Archer could take extra time to line up a stronger shot.
- Add a sidegrade weapon that trades Speed for Strength, or a named Dominion opponent that makes a particular build shine.
- Add a small repeatable errand, such as catching three fish for a bonus payout.
