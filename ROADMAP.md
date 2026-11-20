# Drevan gameplay roadmap

Drevan is a browser RPG side project. Start by making the current loop of training, shopping, and healing more rewarding. Each milestone should be playable on its own, and fishing or a small content addition can move up whenever it sounds fun to build. Formulas and values below are starting points for playtesting.

## Next up

### Make equipment matter

- Give the Rusted Sword a small Strength bonus and Worn Leather Armor a small Defense bonus. Strength remains the sole offensive stat until classes arrive.
- Try flat Defense first. Subtract it from rolled damage after critical-hit bonuses, with a minimum of one damage per hit. Keep early Defense bonuses small so low-level fights stay short.
- Calculate effective stats from the player's base stats and equipped items. Reuse the calculation for Home and combat, and show gear bonuses in the Curious Emporium.
- Compare the same few dummies with and without gear. A sword should make a win easier to reach, and armor should leave the player with noticeably more HP.

### Add a fishing spot

- Start with one location and a **Cast** button. Include a few common catches, an occasional rare catch, and a chance to reel in nothing.
- Sell catches automatically for a little gold. Aim for a few casts to help pay for healing or contribute toward starter gear. Compare gold earned over a short fishing session with gold earned from training before tuning payouts.

## Build on combat

### Give Speed diminishing returns

- Keep Speed useful for both opening odds and attack frequency. For effective Speed, keep the current minimum of 1, use the stat directly through 5, and try `5 * sqrt(Speed / 5)` above 5.
- Use effective Speed in both the weighted opener and the interval between attacks. Under this curve, 20 Speed gives twice the attack frequency of 5 Speed and roughly a two-thirds chance to open.
- Before adding allocation points, simulate three builds that each spend five points using the costs below. Compare Speed, primary-stat damage, and max HP against the same fast and slow dummies. Look at wins, remaining HP, and how many attacks fights take.

### Battle another player in Dominion

- Let a signed-in player choose another living registered player. Check that both players are alive and distinct when the fight starts.
- Resolve a practice duel in one request using the same combat rules and equipment calculations as training. Show the familiar battle log and leave both players' persistent HP, gold, and gear intact.
- Use practice duels to try different gear matchups. Consider opt-in duels with lasting HP loss later if the stakes would make fights more fun.

## Add character progression in layers

### Pick a class and build around a primary stat

- Let players pick or switch class on Home while the system is being tuned. Give each class Strength, Agility, Intellect, Speed, and HP. HP and Speed work the same across classes, and switching preserves allocated stats.
- Try 5 Strength, 5 Agility, 5 Intellect, 5 Speed, and 25 max HP for new characters who choose a class. Preserve existing characters' earned stats and use the new defaults for newly added attributes.
- Derive **Attack Power** from effective offensive stats after gear bonuses. Count the primary stat in full and each secondary at one quarter, then round down once. The Warrior favors Strength, the Wizard Intellect, and the Archer Agility. The Wizard can also get a small critical-hit bonus.
- Feed Attack Power into the existing damage roll. An Archer gets 4 Attack Power from +4 Agility and 1 from +4 Intellect. The proposed starting spread gives 7 Attack Power, up from today's 5, so test starter fights before settling on the defaults. Keep classless players and training dummies on Strength-based damage.
- Show Attack Power and the class's primary stat on Home. Show equipment bonuses and any requirements in the shop so players can compare gear before buying it.

### Earn levels and spend allocation points

- Start by awarding XP for training wins. Tune the first level so players can reach it in a short play session. Show XP progress and unspent allocation points on Home.
- Try one allocation point per level. One point buys +1 Strength, Agility, Intellect, or Speed, or +5 max HP. Let players save points for later.
- Compare damage, health, and Speed investments once players have several points to spend. A Wizard should have a reason to consider all three, with secondary offensive stats opening up some gear choices.

### Add a few items with cross-stat requirements

- Try one or two items after players can allocate points. A **Titanium Warlock Robe** could require 8 Strength and grant Intellect plus substantial Defense. A Wizard starting at 5 Strength could spend three points to unlock it.
- Check requirements against permanent stats, including allocated points. Apply equipment bonuses after checking eligibility.
- Offer a comparable robe with an easier requirement and a different benefit, such as more Intellect and lighter protection. Test whether both robes are worth choosing for different builds.

## Ideas for later

- Give each class one signature move to try once per battle. A Warrior could brace for the next hit, a Wizard could pierce some armor, and an Archer could take extra time to line up a stronger shot.
- Add a sidegrade weapon that trades Speed for Strength, or a named Dominion opponent that makes a particular build shine.
- Add a small repeatable errand, such as catching three fish for a bonus payout.
