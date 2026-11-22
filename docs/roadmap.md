# Drevan gameplay roadmap

Drevan is a browser RPG side project. Start by making the current loop of training, shopping, and healing more rewarding. Build each milestone as a small, server-rendered activity that can be played on its own. Reuse combat, inventory, and reward handling as features grow. The order is flexible, and proposed formulas, values, and rewards are starting points for playtesting.

## Next up

### Make equipment matter

- The starter catalog defines +1 Strength for the Rusted Sword and +1 Defense for Worn Leather Armor. Strength remains the sole offensive stat until classes arrive.
- Playtest Defense with diminishing returns. Ten Defense reduces damage by 30% before rounding, and the reduction approaches 60% as Defense increases. Check how small armor bonuses affect low-level fights, where rounding can make them harder to notice.
- Home and training share the calculation for equipped Strength and Defense bonuses, and the Curious Emporium shows item effects and values.
- Compare the same few dummies with and without gear. A sword should make a win easier to reach, and armor should leave the player with noticeably more HP.

### Add a fishing spot

- Start with one location and a **Cast** button. Include a few common catches, an occasional rare catch, and a chance to reel in nothing.
- Sell catches automatically for a little gold. Aim for a few casts to help pay for healing or contribute toward starter gear. Compare gold earned over a short fishing session with gold earned from training before tuning payouts.

### Add basic item drops

- After the first equipment playtest and fishing milestone, try awarding an extra item on eligible combat wins alongside the usual gold or XP. Roll on the server against fixed reward lists and grant the item once per qualifying completed fight. Start with existing consumables and a few items with fixed stats.

| Outcome  | Proposed chance | Example rewards                 |
| -------- | --------------: | ------------------------------- |
| No item  |             85% | —                               |
| Common   |             10% | Lesser Potion, Metal Scraps     |
| Uncommon |              4% | Reinforced Bracers, Power Cells |
| Rare     |              1% | Ancient Blade                   |

- Lesser Potion already exists. The other items are ideas for a future catalog. Tie valuable rewards to opponent difficulty so the easiest opponent stays a poor source of rare gear. Measure how many items enter the economy over repeated fights, especially equipment.
- Decide which training wins qualify for the first version and whether future PvP and exploration encounters need their own reward lists. The practice duels below are for testing matchups and leave player gold and gear intact.

### Add material drops, then material selling

- Establish merchant buyback for unwanted weapons and armor as an early equipment milestone. Set a guaranteed gold payout per item, check ownership and quantity, and protect equipped gear. These prices give players a cash option and a baseline for tuning salvage later.
- Use the same fixed reward lists for stackable materials. Start with a few common drops and grow to roughly five to eight materials as they gain sources and uses. Try Metal Scraps and occasional Enchantment Powder in low-level training, then add Power Cells and Worn Components to tougher fights. Keep common materials useful in later recipes and reserve advanced drops for harder encounters.
- Give each material a short description and a sell value. Follow the first drops with a small selling milestone so players can turn surplus materials into gold before The Forge opens. Keep early quantities modest until selling is available. Later, players can choose between selling for healing or gear and saving ingredients for an enchantment.
- As the catalog grows, group inventory into **Equipment**, **Consumables**, **Materials**, and eventually **Collectibles** in the existing server-rendered interface. Keep stacks simple and defer banks, weight, and capacity limits.

| Proposed material  | Description and potential use                                    | Example sell value per unit |
| ------------------ | ---------------------------------------------------------------- | --------------------------: |
| Metal Scraps       | Broken gear and machine fragments for Strength and Defense       |                      2 gold |
| Enchantment Powder | Refined powder that binds enchantments                           |                      3 gold |
| Worn Components    | Salvaged device parts for Speed and mechanical effects           |                      3 gold |
| Beast Essence      | Residual creature energy for Strength and maximum HP             |                      4 gold |
| Power Cells        | Old-world energy stores for advanced physical or magical bonuses |                      5 gold |
| Arcane Fragments   | Crystalline remnants of magical technology for Intellect         |                      6 gold |
| Ether Dust         | Unstable particles for Speed, critical hits, or magic            |                      6 gold |
| Reinforced Alloy   | Recovered old-world metal for armor and Defense                  |                      8 gold |

### Open The Bounty Board

- Add a Nexaris destination for short, repeatable contracts using activities players can already do. Start with one or two objectives, such as beginner training wins and **Supply the Settlement**, the fishing errand to catch three fish.
- Players explicitly accept one active contract at a time. Count qualifying events automatically, once per event. On completion, award bonus gold and let the player accept another contract. Keep contracts available without deadlines or daily resets. Consider XP and item bonuses once those rewards are established.
- Five level-one training wins currently pay 50 gold before healing. Try a 25–40 gold bonus for five beginner wins and compare the total with healing costs and other activities. Decide which combat modes count before attaching rewards to their wins.
- Later contracts could include **Trial by Combat** for five qualifying Dominion wins, **Relics of the Old World** for five completed Ruins expeditions, and **The Unbroken** for three wins without visiting Sanctum. Define qualifying wins and when the streak resets before adding that last contract.
- Once reagents are useful, try small bundles of common or uncommon materials as contract rewards.

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
- When Forge services arrive, show base, enhancement, and enchantment bonuses clearly so players can see how each contributes to their effective stats.
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

## Expand beyond Nexaris

### Explore The Ruins

- Once combat and character progression have settled, add a text-based expedition into the remnants of Drevan's lost civilizations. One action rolls one event. Show the result immediately unless it triggers a fight, and reuse the existing battle system for encounters. Keep the first version to a simple action and results page, with no map, stamina, or daily allowance.

| Event                    | Proposed chance |
| ------------------------ | --------------: |
| Find gold                |             40% |
| Find nothing             |             25% |
| Encounter an enemy       |             20% |
| Discover an item         |             12% |
| Discover a rare artifact |              3% |

- Use Dominion for combat progression and fishing for relatively safe, steady gold. Give The Ruins unpredictable payouts, with HP loss and healing costs making hostile encounters matter. Playtest how dangerous encounters should be and decide whether players can retreat, what defeat costs, and when an expedition counts as complete.
- Expand item rewards once the basic expedition works. A **Fractured Energy Core**, a damaged device whose original purpose is unknown, could start as a collectible or valuable artifact. Later, The Reliquary could identify artifacts and reveal their lore.
- Try Power Cells, Arcane Fragments, and Ether Dust as exploration finds, with Reinforced Alloy and intricate Ancient Mechanisms from dangerous encounters. Later, powerful enemies could drop volatile Void Crystals, concentrated Primal Essence, or Resonance Cores that amplify ancient technology. Treat rarity as a guide for the reward lists and keep lore collectibles distinct from recipe ingredients in the inventory.
- Example sale prices for those later finds are 15 gold per Ancient Mechanism and 20 gold per Void Crystal. Test how often players find them and whether recipes give players a reason to keep them.

## Equipment services at The Forge

### Start with gold-only enhancements

- After equipment balancing, classes, and stat allocation have been playtested, let players spend gold at the Nexaris workshop to improve eligible weapons and armor. Start with guaranteed upgrades through +3, with rising gold costs and no materials or item loss. Improve existing bonuses so each item keeps its role.

| Rusted Sword enhancement | Total Strength bonus | Cost for this step |
| ------------------------ | -------------------: | -----------------: |
| Base                     |                   +1 |                  — |
| +1                       |                   +2 |            25 gold |
| +2                       |                   +3 |            75 gold |
| +3                       |                   +4 |           150 gold |

- Compare these example costs with shop prices, gold earnings, and the combat benefit of the upgrade. Check how bonuses interact with Speed, Defense, and class-based Attack Power. Starter items should stay worth improving while leaving reasons to buy new gear.
- Inventory currently stores a quantity per player and item, and equipped slots store the catalog item ID. Individually enhanced or enchanted gear needs a persistent way to distinguish two copies of the same sword and identify the equipped copy. Resolve how modified copies coexist with stacked gear during the basic Forge milestone so both services can use the same representation.

### Salvage unwanted equipment

- Once equipment buyback and stackable, sellable materials are playable, try salvaging as a separate Forge service. Basic salvaging can open The Forge with ordinary gear before enhancements and enchantments are ready. An extra Rusted Sword could be sold for guaranteed gold or permanently dismantled for 1–3 Metal Scraps. Salvage gives players another way to gather reagents alongside combat drops, Ruins discoveries, and Bounty Board rewards.
- Start with predefined yields for a few existing weapons and pieces of armor. Each action consumes one owned, unequipped piece, even when several copies share an inventory row. Require players to unequip gear before salvaging it. Consumables, materials, and collectibles are ineligible.
- Show the selected piece and potential rewards, ask the player to confirm its permanent destruction, and list the materials recovered. Recheck the selected piece and roll rewards on the server. Remove the piece and grant the materials in one database transaction so a failed action leaves the item intact and grants nothing. A duplicate submission must never grant rewards twice for the same action.
- Support individually tracked equipment once Forge modifications are available. Keep the selected copy identifiable through confirmation and remove exactly that copy on success. Use its base item to determine the yield. Its enhancements and enchantment are lost, and spent gold and recipe ingredients are never refunded. Salvaged materials can feed future recipes through the same inventory stacks as other drops.

#### Expand yields after basic salvaging is playable

Use predefined rewards by item or category. These proposed quality bands illustrate how yields could scale. A visible rarity system can wait.

| Equipment quality | Common materials | Uncommon materials | Chance of a rare component |
| ----------------- | ---------------: | ------------------ | -------------------------: |
| Starter           |              1–3 | None               |                         0% |
| Basic             |              2–5 | Occasional         |                         0% |
| Improved          |              4–8 | 1–2 possible       |                         2% |
| Advanced          |             6–12 | 1–3 possible       |                         5% |
| Exceptional       |            10–18 | 2–5 possible       |                        10% |

- Match yields to the equipment. Metal weapons and heavy armor could give Metal Scraps or Reinforced Alloy, leather armor Worn Components or Beast Essence, magical weapons Arcane Fragments or Enchantment Powder, and technological gear Power Cells or Worn Components. Ancient equipment could occasionally yield Ancient Mechanisms or Resonance Cores.

#### Open salvage questions

- Should basic salvaging be available before a Forge visit? Should players see exact reward ranges and odds in the preview?
- Should every action yield materials? Should higher-quality gear guarantee uncommon materials? Do predefined item properties suffice, or would visible tiers help players choose?
- Should merchant-bought and discovered copies have the same yield? Should enhancements ever affect yields, and would players benefit from bulk salvaging later?

### Add removable attribute enchantments

- After basic enhancements, material selling, and combat and character stat playtesting, start with a few guaranteed enchantments for established attributes. Each piece can hold one active enchantment. Applying one adds a defined bonus alongside its base properties and ordinary enhancement level. Charge gold and fixed quantities of reagents, with no separate crafting skill or profession.
- Let players remove, replace, or later reapply an enchantment at The Forge. Replacing **Mighty Rusted Sword +3** with **Arcane Rusted Sword +3** swaps the Strength bonus for Intellect and keeps the +3 enhancement. Replacing or reapplying costs the full new recipe, and earlier spending is final. Removal and replacement preserve the equipment and its base properties.
- Show the selected piece, its enhancement level and active enchantment, and available effects. Display recipe quantities alongside owned amounts, the gold fee, affordability, and what will change before confirmation. Validate eligibility and costs on the server, then save the equipment change and resource deductions together so a failed service costs nothing.

These recipes illustrate the range of options. Start with a small selection and tune bonuses and ingredient counts against class builds, gear, and drop frequency. A +15 bonus may overwhelm early builds, and equal increases to Speed, Defense, and offensive stats can have very different effects on fight results.

| Enchantment | Example bonus  | Example reagents                                             | Example fee |
| ----------- | -------------- | ------------------------------------------------------------ | ----------: |
| Mighty      | +15 Strength   | 20 Metal Scraps, 20 Power Cells, 30 Enchantment Powder       |    500 gold |
| Arcane      | +15 Intellect  | 20 Arcane Fragments, 20 Power Cells, 30 Enchantment Powder   |    500 gold |
| Agile       | +15 Agility    | 20 Worn Components, 20 Ether Dust, 30 Enchantment Powder     |    500 gold |
| Swift       | +15 Speed      | 20 Power Cells, 10 Ancient Mechanisms, 30 Enchantment Powder |    650 gold |
| Fortified   | +15 Defense    | 30 Metal Scraps, 10 Reinforced Alloy, 30 Enchantment Powder  |    500 gold |
| Vital       | +25 maximum HP | 20 Beast Essence, 10 Arcane Fragments, 30 Enchantment Powder |    500 gold |

### Expand after basic enchantments are playable

- Try stronger recipes or optional tiers once drop rates and early bonuses are understood. Minor Might (+2 Strength), Mighty (+8), and Greater Might (+15) illustrate how tiers could span progression. Add specialized sources and rare reagents as recipes gain a use.
- Consider advanced effects after combat stats are stable. Keen could raise critical-hit chance, Brutal critical-hit damage, Piercing could bypass some Defense, Resilient could reduce incoming damage, Vampiric could restore HP on a hit, and Resonant could raise Attack Power under specific conditions. Keep elemental and old-world effects such as Ember, Frostbound, Voltaic, Voidtouched, Ethereal, and Overcharged as low-priority ideas.

### Open questions for materials and enchantments

- Should removal be free or cost a small gold fee? Should the enchantment name appear as a prefix?
- Which gear slots can take each enchantment? Should recipes unlock through progression, and should advanced options have class, equipment, or level requirements?
- How should bonuses scale with gear quality and player level? How should inventory show several modified copies of the same base item?
- Should some recipes use ingredients found only in The Ruins?
- Should Curious Emporium have a dedicated material-selling view?

## Playtest the gold economy across activities

- Compare gold earned across short sessions after healing costs. Training already pays gold, and fishing, contracts, exploration, and material sales would add new sources. Compare reagent sale prices with the time it takes to earn recipe quantities and keep the Forge gold fee meaningful even after players collect the ingredients. If shops later stock basic materials, keep rare reagents primarily tied to gameplay. Compare Forge and Artificer fees with spending at Sanctum and Curious Emporium.
- Check that higher-risk activities can justify better rewards and that a single safe activity does not dominate. Test drops, contracts, expeditions, and enhancements on their own before linking them. Keep these milestones on the existing gold economy, with multiple currencies, durability, mandatory stamina, and elaborate crafting outside their scope.
- Keep the average resale value of salvage materials at or below the equipment's merchant sell price. An occasional rare result can exceed it. Check that buying equipment, dismantling it, and selling the materials loses gold on average. Compare salvage yields with shop prices, combat and exploration drops, and the time needed to collect a recipe so players have several viable ways to earn ingredients.

## Ideas for later

- **Track combat records.** Start with wins and losses against training dummies. Save the result together with the player's remaining HP and any gold reward. Count draws as neither a win nor a loss. Add a separate win and loss record when PvP arrives, and decide which fights qualify before practice duels can count toward titles.
- **Earn titles through feats.** Award distinct titles for 1,000 training wins and 1,000 qualifying PvP wins. Consider an earlier milestone at 100 wins. Revisit the PvP thresholds once there is enough activity to judge how long they take and whether repeated matchups make them too easy to earn. Show progress toward each feat and let players choose an earned title to display on their player profile.
- **Add a playable alien race.** Give it a place in Drevan’s lore and two character models. Start with appearance and lore so players can choose a race for character flavor.
- Give each class one signature move to try once per battle. A Warrior could brace for the next hit, a Wizard could pierce some armor, and an Archer could take extra time to line up a stronger shot.
- Add a sidegrade weapon that trades Speed for Strength, or a named Dominion opponent that makes a particular build shine.
