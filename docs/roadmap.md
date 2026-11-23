# Drevan gameplay roadmap

Equipment playtesting, basic fishing, and Curious Emporium buyback are complete. Next, audit and balance combat before adding basic character progression. Then open The Ruins for exploration and PvE, and build loot and rewards on the playable expedition.

Build complete loops that connect combat, progression, exploration, rewards, inventory, and the economy. Reuse the existing combat simulator, equipment, inventory, and gold systems. Start with independently playable features and use repeatable simulations and actual play to guide expansion. Keep multiple currencies, mandatory stamina, durability, crafting professions, procedural gear, and recurring task schedules outside the initial scope.

| Priority | Focus                                    | Readiness                                        |
| -------- | ---------------------------------------- | ------------------------------------------------ |
| P0       | Combat foundations and basic progression | Start with the combat audit                      |
| P1       | Ruins exploration and starter loot       | Playtest expeditions before expanding rewards    |
| P2       | Character depth and supporting gameplay  | Start when each feature's prerequisites are met  |
| P3       | Equipment economy and advanced systems   | Build on established systems and balance results |
| P4       | Future concepts                          | Needs further design before scheduling           |

Milestone numbers show the recommended order. Dependencies list the systems or design decisions each feature needs. The recommended order reflects playtest and development priorities. Independent work can move ahead when those prerequisites are met. Each heading gives the priority and relative complexity. **Small** means a limited change to an existing system, **Medium** spans a few systems, and **Large** includes substantial data changes, multiple systems, or unresolved design.

## Combat design

Players make their choices before the fight through class, attributes, stat allocation, gear, and eventually enchantments and equipment effects. A single action starts the fight. The server resolves it automatically and shows what happened in the battle log. Training, named NPC fights, and practice PvP share one simulator, while each encounter mode controls what results it saves and what rewards it grants.

Balance PvE first so progression feels rewarding, upgrades matter, and stronger opponents justify their rewards. Specialized enemies give different builds room to excel. Use practice PvP to check competitive fairness as it becomes relevant. Introduce one mechanic at a time and use observed matchups to decide whether a mode needs different rules.

## P0 — Critical: Combat foundations and basic progression

### 1. Finish equipment effectiveness playtesting (P0 · Small)

- **Status.** Complete. The Rusted Sword stays at +1 Strength. Worn Leather Armor now grants +3 Defense so it can preserve HP against starter opponents.
- **Results.** With both pieces equipped, the starter won 99.5% of level 4 fights and 21.6% of level 5 fights. The [battle playtest guide](battle-playtesting.md) records the comparison, rules, and rerun command.

### 2. Add basic fishing (P0 · Small)

- **Status.** Complete. Players can visit The Driftwater from Nexaris, cast, and see the result. A successful catch adds one fish to the corresponding inventory stack. Saving the fish and spending the cast happen in one transaction.
- **Playtest rules.** Each cast has an 80% chance of a bite. Successful catches are 70% Murkfin, 25% Glassscale, and 5% Astral Koi. Players get 50 casts per day, including empty casts, with a midnight Central reset. Admin can edit today's casts used for playtesting.
- **Related feature.** Sell caught fish at Curious Emporium. Rods, reels, and bait are future ideas.

### 3. Establish equipment and fish buyback (P0 · Medium)

- **Status.** Complete. The Emporium buys owned weapons, armor, and fish. Players can sell several stacks in one transaction and see the combined payout before submitting. An equipped slot reserves one copy, and the Emporium can buy the rest of the stack.
- **Starting payouts.** Rusted Sword and Worn Leather Armor sell for 50 gold each, giving future salvage a guaranteed gold alternative. Murkfin sells for 1 gold, Glassscale for 3, and Astral Koi for 10. The fish remain available only through gameplay.
- **Economy comparison.** A full 50-cast allowance averages 78 gold at these payouts. Across 1,000 seeded fights per matchup with a full heal at Sanctum after each fight, an unequipped starter averaged 8.43 net gold at level 1 and 17.77 at level 3. A starter wearing both gear pieces averaged 23.17 net gold at level 4. That puts a full fishing allowance near nine level-1 fights or three to four equipped level-4 fights in gold terms. Session duration still needs a playtest.

### 4. Combat stat audit and balancing (P0 · Medium)

- **Status.** In progress. The [combat audit](battle-playtesting.md#combat-stat-audit) documents the live baseline and trials for critical hits, Speed, and timing ties. The random tie trial brought identical fighters close to even. After healing, level 3 still earned the most for an unequipped starter and level 4 for an equipped starter. Reassess Speed and test larger HP increments with the candidate timing rule.
- **Dependencies.** Starter equipment playtest (1) and the existing battle simulator.
- **Scope.** Compare Strength, Defense, Speed, critical hits, and max HP in repeated fights. Match balanced and specialized builds at comparable investment. Use controlled or seeded rolls. Measure win rate, HP remaining, total attacks, encounter duration, and how many turns the slower side gets. Check Speed's effect on both initiative and attack frequency. Swap fighter positions to test the current tie rule, which favors the player on equal attack times.
- **Done when.** Results document where stats and combinations excel, including timing bias and low-impact bonuses. Tune one rule or bonus at a time and rerun the same matchups before expanding progression or PvE encounters.

### 4a. Prototype a named Dominion boss (P0 · Small, optional)

- **Dependencies.** Initial combat audit (4), the training simulator, and reliable equipment calculations (1). This optional prototype can proceed independently after the audit.
- **Scope.** Start with one opponent, such as The Blighted Guardian. Define its ID, name, lore, recommended level, fixed attributes, and basic rewards in TypeScript. Tune its stat spread against a comparable training dummy so it has a recognizable matchup. Resolve challenges automatically through the shared simulator and show the existing battle log. The first encounter uses ordinary attacks and keeps its difficulty fixed. Revisit database-backed definitions if the catalog, location-specific rewards, or administrative tools warrant them. Track player progress separately from the opponent definition.
- **Done when.** Players can challenge and defeat the boss. Starter characters are clearly outmatched through combat itself, and prepared characters have a realistic path to victory. Compare win rate, remaining HP, and battle length across differently equipped builds. Verify the same boss stats are used for every challenger and training still resolves as before.

### 5. Add basic XP, leveling, and stat allocation (P0 · Large)

- **Dependencies.** Combat audit (4), Dominion training, and existing player attributes.
- **Scope.** Award XP for qualifying Dominion training victories. Set level thresholds and grant allocation points on level-up. Players can spend or save points. Start with Strength, Speed, and max HP as allocation candidates and evaluate whether Defense should also be directly allocatable. Track base attributes, permanent gains, point-funded increases, and equipment bonuses separately so classes, Intellect, Agility, and Artificer refunds can build on the same records.
- **Done when.** Players can reach an early level in a short session, see XP, level, and unspent points on Home, and see earned levels in The Registry and on player profiles. They can spend or save points across sessions and see the effect of their choices in training.

## P1 — High: Ruins exploration and loot

### 6. Open The Ruins for basic exploration and PvE (P1 · Large)

- **Dependencies.** Combat audit (4), the shared simulator, and existing gold and inventory systems.
- **Scope.** Add a text-based expedition into Drevan's lost civilizations. An exploration action can yield an empty result, a simple discovery such as gold or an existing item, or a hostile encounter. Use a small set of fixed-stat enemies and resolve fights automatically with the existing simulator. Define the consequences of combat, how retreat and defeat work, and when expeditions end. Start without maps, mandatory stamina, daily limits, or complex procedural generation.
- **Done when.** Players can resolve every event type and return to Nexaris. Encounter consequences and expedition completion are clear, and a playtest measures survival, encounter difficulty, and rewards after Sanctum healing.

### 7. Add basic Ruins loot and material drops (P1 · Medium)

- **Dependencies.** Playable Ruins expeditions (6), the item catalog, and stackable inventory.
- **Basic item drops.** Use fixed server-side loot tables for eligible Ruins victories. Start with existing consumables such as Lesser Potion and a few fixed-stat items. Reinforced Bracers and Ancient Blade are candidate gear. Review drop probabilities and rarity tiers during Ruins playtesting. Reserve better drops for tougher enemies and compare payouts after healing costs. Training dummies award their existing gold rewards and grant no random loot.
- **Material drops.** Start with stackable Metal Scraps, Enchantment Powder, and Power Cells. Give each a description, a planned sell value, and a near-term source or use. Keep early quantities modest until selling is available. Materials can support future crafting, salvaging, and services at The Forge.
- **Scope limits.** Use fixed item stats and keep procedural gear, elaborate rarity systems, and crafting for later design. Players return to Nexaris to equip, use, or sell eligible rewards. Material selling follows in milestone 13.
- **Done when.** Each qualifying victory allows at most one loot roll and repeated submissions cannot grant the reward twice. Players can identify materials and their quantities, and repeat drops add to existing stacks.

## P2 — Medium: Character depth and supporting gameplay

### 8. Add classes and primary attributes (P2 · Large)

- **Dependencies.** Combat audit (4) and basic stat allocation (5).
- **Scope.** Add Warrior (Strength), Wizard (Intellect), and Archer (Agility). Calculate Attack Power after gear bonuses, weighting each class's primary attribute most heavily and letting the two secondary offensive attributes contribute. Give Speed and HP the same role across classes. Playtest a Wizard critical-hit bonus. Allow switching on Home during tuning while preserving permanent gains and any allocated stats.
- **Done when.** Home shows the primary stat and Attack Power. The shared simulator uses the same damage rules across encounter modes, with classless players and dummies retaining Strength-based damage. PvE matchups show distinct class strengths and weaknesses. Recheck them in practice PvP (11) when available.

### 9. Add gear with multiple modifiers and requirements (P2 · Medium)

- **Dependencies.** Classes (8) and stat allocation (5).
- **Scope.** Add a few items with signed modifiers and requirements checked against permanent stats, including allocated points, before applying gear bonuses. A Titanium Warlock Robe could require Strength and trade Speed for Intellect and Defense. Compare it with a lighter robe with an easier requirement.
- **Done when.** The shop and inventory show requirements and tradeoffs, the server enforces eligibility, and Home and combat reflect the same bonuses. Different builds have reasons to choose different items.

### 10. Open The Bounty Board (P2 · Medium)

- **Dependencies.** Nexaris, Dominion training, and fishing (2).
- **Scope.** Start with two repeatable contracts. One counts training dummy wins in Dominion, and **Supply the Settlement** counts fish caught in The Driftwater. Players accept one active contract at a time. Start with bonus gold and keep contracts available without expiration or daily resets. Define qualifying events so future Ruins and boss objectives can use the same tracking.
- **Done when.** Each qualifying event advances the active contract once, completion pays the reward once, and the player can accept another contract.

### 11. Introduce practice PvP in Dominion (P2 · Medium)

- **Dependencies.** Initial combat audit (4), The Registry, and shared combat and equipment calculations.
- **Scope.** Let a living player select another living registered player for a practice duel. Show the shared battle log and use the results to compare established builds.
- **Done when.** The server validates both fighters at the start and rejects self-matches. Results render correctly, and both players keep their persistent HP, gold, XP, and equipment.

### 12. Open The Artificer for respecs (P2 · Medium)

- **Dependencies.** Classes (8), refundable point accounting (5), and gear eligibility (9).
- **Scope.** Offer three repeatable paid services under the working name **The Artificer**. Players can reset spent points, change class, or do both. Preview gold cost, stat changes, and gear that will be unequipped. Check eligibility against the resulting character.
- **Done when.** A reset restores spent points to the unspent pool and removes only the increases they bought. XP, level, and other permanent gains are preserved. Ineligible gear returns to inventory as unequipped gear. Current HP is capped at the new maximum without healing. Charges and character updates succeed together.

### 13. Add material selling and inventory grouping (P2 · Medium)

- **Dependencies.** Emporium buyback (3) and a meaningful source of materials, planned for basic Ruins material drops (7). Revisit the timing if an earlier feature provides such a source.
- **Scope.** Extend merchant selling to materials. Group inventory into Equipment, Consumables, and Materials as needed, with Collectibles available as a future category. Keep the existing stacks.
- **Done when.** Players can find their materials and sell a valid quantity at the listed price. Gold and inventory update together, and failed sales leave both intact.

### 13a. Pilot a boss bounty (P2 · Medium)

- **Dependencies.** The Bounty Board (10) and a named Dominion boss (4a). XP rewards depend on milestone 5.
- **Scope.** Add a contract for defeating a named boss. Try allowing direct challenges and using the contract to pay an additional reward while keeping the encounter identical. Start with a simple reward and consider XP, reagents, rare equipment, or unique items as their supporting systems mature.
- **Done when.** A qualifying victory satisfies the objective once and the contract pays once. Compare repeat boss payouts after healing with training, fishing, and exploration. Use that evidence to decide whether rewards need repeat restrictions.

## P3 — Low: Equipment economy and advanced systems

### 14. Add basic equipment salvaging (P3 · Medium)

- **Dependencies.** Emporium buyback (3), a starter material catalog, and material selling (13).
- **Scope.** Open The Forge with a service for a few ordinary weapons and armor pieces. Preview predefined yields, ask for confirmation, and show recovered materials. A spare Rusted Sword can become Metal Scraps or be sold for guaranteed gold.
- **Done when.** A confirmed action consumes exactly one eligible unequipped piece and grants materials in the same transaction. Failed or duplicate actions cannot consume extra gear or grant extra rewards. Selling and salvaging each have a purpose, and buying gear to salvage loses gold on average.

### 15. Expand loot tables and reagent sources (P3 · Medium)

- **Dependencies.** Basic Ruins loot and material drops (7), material selling (13), and named uses for new rewards.
- **Scope.** Differentiate enemy and exploration rewards by difficulty and activity. Add uncommon and rare materials gradually. Keep lore collectibles distinct from recipe ingredients.
- **Done when.** Tougher encounters and exploration offer distinct rewards, added reagents have a practical use, and the easiest activity remains a poor source of rare materials.

### 16. Track equipment copies and add guaranteed enhancements (P3 · Large)

- **Dependencies.** Equipment playtesting (1), tested allocation (5) and classes (8), and a decision on how modified copies coexist with stacks.
- **Scope.** Track the specific equipment copy a player modifies or equips. At The Forge, offer a short series of guaranteed gold-only upgrades with rising costs. Improve existing bonuses so gear keeps its role. Upgrading carries no risk of destruction.
- **Done when.** Two copies of the same item can hold different upgrades and combat uses the equipped copy's bonuses. Ordinary gear remains usable. Starter gear is worth improving while new gear still has a purpose.

### 17. Add removable attribute enchantments (P3 · Large)

- **Dependencies.** Starter reagents (7), material selling (13), tested allocation, class, and gear builds (5, 8, and 9), and per-copy enhancements (16). Initial recipes can use starter reagents.
- **Scope.** At The Forge, offer deterministic attribute bonuses with fixed gold and reagent recipes. Allow one enchantment per piece. Preview the current effect, new effect, recipe, owned quantities, and costs. Allow removal, replacement, and reapplication. Replacement and reapplication cost the full new recipe.
- **Done when.** Changing an enchantment preserves the original item and its ordinary enhancement level. Previous gold and reagents are nonrefundable. Costs and effects update together. Home, shop, and inventory distinguish base, enhancement, and enchantment bonuses where applicable, and PvE playtests show viable alternatives. Check PvP balance once practice duels are available.

### 18. Expand equipment salvaging (P3 · Medium)

- **Dependencies.** Basic salvaging (14), broader material sources (15), and tracked equipment copies (16). Enchanted gear support depends on milestone 17.
- **Scope.** Use base-item or category yields for more valuable gear, with occasional uncommon or rare materials. Materials go into the same stacks as drops. Salvaging a modified piece consumes its enhancements and enchantment along with the item.
- **Done when.** Confirmation identifies the exact copy and only that copy is consumed. Earlier spending and enchantment ingredients are never recovered. Better gear can yield better materials while purchase-and-salvage loops lose gold on average.

### 18a. Pilot an intrinsic equipment proc (P3 · Medium)

- **Dependencies.** Combat audit (4), shared equipment calculations (1), and reliable equipped-item identification. Use per-copy tracking (16) if the effect must vary by copy.
- **Scope.** Static modifiers always apply. Passive combat effects apply whenever their condition is met. A proc rolls a chance on a qualifying event. Start with one intrinsic effect on the Flaming Great Axe of Ravenspire, a weapon that independently rolls on each qualifying successful attack to deal bonus damage. Use ordinary damage rules and treat fire as flavor. Resolve and log it automatically. The effect belongs to the item. Forge enchantments (17) are separately applied, removable, and use their own gold and reagent costs.
- **Done when.** Controlled rolls reproduce results, each activation logs and applies its bonus damage once, and bonus damage cannot trigger another proc. Compare fast and slow builds and verify training with ordinary gear still behaves as before.

### 18b. Pilot Poison as a temporary combat effect (P3 · Medium)

- **Dependencies.** Named Dominion boss (4a) and a tested baseline for its ordinary fight. Playtest Poison separately from the first equipment proc (18a).
- **Scope.** Try letting a successful enemy attack apply Poison to its target in a rematch with The Blighted Guardian. Define its duration and test ticking on the affected fighter’s actions. Log application, damage ticks, and any defeat caused by a tick. Keep all temporary effects and stat changes in the simulation and clear them at encounter end. Save remaining HP and ordinary rewards according to the encounter’s existing rules.
- **Done when.** The log shows when Poison applies and deals damage, the effect expires as specified, and a new fight starts with no effects carried over. Compare fast and slow builds to check how action frequency affects damage and duration. Verify that lethal ticks end the encounter correctly and that the combat cap still applies.

## P4 — Backlog: Future concepts and open design questions

These entries are candidates for design and playtesting. Their completion criteria describe what would justify or validate a first playable version.

### 19. Advanced enchantments (P4 · Large)

- **Dependencies.** Basic enchantments (17) and stable training and PvP results.
- **Scope.** Consider tiers, rare recipes, unique ingredients, and specialized effects. Candidates include Keen and Brutal for critical hits, Piercing for armor penetration, Resilient for damage reduction, Vampiric for life drain, and Resonant for conditional Attack Power. Explore Ember, Frostbound, Voltaic, Voidtouched, Ethereal, and Overcharged as elemental or old-world options.
- **Done when.** A selected effect or tier adds a distinct build choice, its ingredients have a suitable source, and training and duels show counterplay.

### 20. Advanced exploration and relic identification (P4 · Large)

- **Dependencies.** Basic Ruins expeditions (6) and The Reliquary.
- **Scope.** Consider deeper encounters, discoveries, and exploration-specific rewards. The Fractured Energy Core could begin as a collectible or valuable artifact, then gain identification and lore at The Reliquary.
- **Done when.** A first expanded encounter or relic gives players a reason to return and a clear way to discover its outcome or lore.

### 21. Equipment rarity and quality (P4 · Medium)

- **Dependencies.** Emporium buyback (3), differentiated drops (15), and expanded salvage (18).
- **Scope.** Compare visible tiers with item-specific properties for communicating drop value, buyback prices, and salvage rewards. Color-based rarity needs a demonstrated gameplay benefit.
- **Done when.** Playtesting shows what information helps players choose what to use, sell, or salvage and supports a decision about visible tiers.

### 22. Combat records, titles, and achievements (P4 · Medium)

- **Dependencies.** Training results and practice PvP (11) for evaluating PvP records.
- **Scope.** Record training and qualifying PvP wins and losses separately. Record remaining HP and gold with training results. Draws count toward neither total. Consider opt-in duels with lasting HP loss or competitive PvP after practice duels. Explore earned titles, profile displays, and whether leaderboards add value.
- **Done when.** Qualifying fights count once, title thresholds reflect real play, and players can see progress and select earned titles for their profiles.

### 23. Additional character content (P4 · Large)

- **Dependencies.** Class playtesting (8) for moves and build-specific encounters. A playable alien race needs lore and avatar models.
- **Scope.** Consider an alien race with two models, appearance and lore first. Explore further customization, a weapon that trades Speed for Strength, and once-per-battle signatures such as a Warrior brace, Wizard armor pierce, or Archer aimed shot.
- **Done when.** A chosen addition fits Drevan's lore or creates a distinct, tested combat choice.

### 24. Optional economy and contract expansion (P4 · Medium)

- **Dependencies.** The relevant activity and economy playtests, including The Bounty Board (10) for contracts and The Ruins (6) for expedition objectives.
- **Scope.** Consider specialized material sources, rare traveling merchants, gold sinks, and dismantling variations such as bulk salvage. Later contracts could offer XP, items, or reagent bundles. Preserve **Trial by Combat** for qualifying Dominion wins, **Relics of the Old World** for finished expeditions, and **The Unbroken** for wins without visiting Sanctum.
- **Done when.** A selected addition serves a clear purpose in the gold economy. Expanded contracts define qualifying events, streak resets where applicable, and rewards players can use.

### 24a. Explore advanced bosses and temporary effects (P4 · Large)

- **Dependencies.** Named boss (4a), boss bounty pilot (13a) for contract expansion, and Poison (18b) for effects.
- **Scope.** Consider the fast, fragile Phantom Duelist, the strong, slow Iron Tyrant, and the defensive Hollow Oracle. Explore boss-specific rewards and bounties. Try one new mechanic at a time, such as a once-per-battle Enrage below an HP threshold or Regeneration that tests sustained damage. Other candidates include Bleeding, Burning, Corrosion, and temporary Defense loss from Armor Break.
- **Done when.** A selected boss or effect gives players a distinct reason to adjust their build, its reward fits the challenge, and the shared log explains the result.

### 24b. Explore advanced equipment effects (P4 · Large)

- **Dependencies.** First intrinsic proc (18a). Poison weapons depend on 18b, and combining an intrinsic effect with a Forge enchantment depends on 17.
- **Scope.** Consider the Hel Staff of Corruption for thematic dark bonus damage and the Bulwark of the Ancients for temporary Defense stacks gained on qualifying incoming attacks. Other candidates include Reflect Damage, Life Drain, conditional offense, and Poison application. Evaluate multiple effects and combinations with enchantments as separate decisions, including which events may trigger each effect.
- **Done when.** A chosen effect gives a named item a distinct role and has understandable trigger and stacking rules. Test long fights and fast and slow attackers for runaway damage or survivability.

### 24c. Evaluate PvP-specific balance rules (P4 · Medium)

- **Dependencies.** Practice PvP (11) and evidence from shared matchups. Proc and status tuning depends on 18a and 18b.
- **Scope.** Keep shared calculations and consider explicit encounter settings only for demonstrated problems. Candidates include proc effectiveness, stack limits, status duration, healing or damage adjustments, and how capped duels resolve. Consider drawing unresolved duels at the cap. Publish any mode differences where players choose gear or start a fight.
- **Done when.** A selected rule addresses a measured problem, preserves the intended PvE matchups, and is explained clearly to players.

## Recurring playtest checks

- **Early progression.** Establish combat baselines before adding XP. Measure time and wins to the first few levels, how often players spend or save points, and how those choices affect training.
- **Ruins expeditions.** Track enemy difficulty, survival, retreat and defeat rates, and net gold after Sanctum healing. Once loot lands, measure item acquisition and material accumulation before expanding tables or adding sources.
- **Economy.** Compare short, realistic sessions across training, fishing, contracts, exploration, equipment and material sales, and salvage. Account for Sanctum healing, gear purchases, and future Forge and Artificer fees. Compare recipe costs with reagent sale values and gathering time. Keep rare ingredients tied primarily to gameplay if shops eventually stock basics.
- **Starter economy playtest.** Run separate 10-minute fishing and training sessions with fresh characters and the same starting gear. Record actions completed, gold earned, Sanctum costs, and gold kept after healing. Note how long it takes to earn 100 additional gold, the price of one starter gear piece. Characters already start with 100 gold, so track earned gold separately. If a session ends before the player earns 100 gold, record their progress and ask whether either activity felt required to afford upgrades. Repeat once Ruins drops add another source of items to sell.
- **Activity roles.** Training builds combat progression, fishing offers steadier income, contracts reward bonus objectives, salvage supplies materials, exploration offers uncertain payouts, and The Forge gives players a place to invest in gear. Check that each activity has a reason to play. Keep average salvage resale at or below equipment buyback value even when a rare result can exceed it.
- **Combat builds.** Repeat the audit matchups with each new attribute, class bonus, allocation option, equipment modifier, enhancement, and enchantment. Include Speed and initiative, Defense, critical hits, and max HP. Start with training and repeat in practice PvP as soon as available. Compare equal investment and observed fight outcomes. Equal numerical bonuses can have very different effects.

- **PvE first.** Compare starter and better-prepared builds against ordinary and specialized foes. Repeat in practice PvP to look for competitive problems. For boss rewards, compare net payouts after healing across activities before adding cooldowns or limits.
- **Repeatable simulations.** As part of the combat audit (4), use a small script or test utility to run batches with controlled or seeded randomness. Reuse the same matchups before and after each change and swap fighter positions. Track win rates, remaining HP, attack counts, encounter duration, damage dealt and received, and how often fights reach the cap. For later effects, track activations per attack and per battle, bonus damage, peak stacks, and interactions with critical hits and long fights. Consider chance, magnitude, or explicit trigger and stack limits if the results show a problem with Speed or survivability. Keep the existing attack cap and define the outcome when a fight reaches it.

## Open Design Questions

### Basic progression

- Which Dominion victories should earn XP, and how many wins should the first few levels take?
- Should Defense be directly allocatable? How should point costs and gains fit future class attributes and Artificer refunds?

### Combat and PvP

- How should offensive and defensive stats compare at similar investment? Which builds trade enough for their strengths?
- How much of Speed's value should come from initiative versus attack frequency? Does fighter position affect later turns, and what should change after classes and gear modifiers are tested?
- Which fights should qualify for drops, contracts, competitive records, or titles? Would opt-in stakes improve duels?

- What observed problem would justify a PvP-only rule? Which rules must stay shared, how should differences be shown, and when should a capped fight count as a draw?

### Named NPCs

- How should boss difficulty compare with a training dummy? Should recommended levels be advisory, and should direct challenges require a bounty?
- What rewards justify the challenge, and how would repeat victories affect the economy? When would the NPC catalog benefit from database-backed definitions?

### Triggered equipment effects

- Which events qualify, including attempted attacks, successful hits, critical hits, incoming damage, or HP thresholds? How should critical hits interact with bonus damage?
- Can multiple effects activate on one action or trigger each other? If faster builds gain too many rolls, which adjustment preserves the item’s role?

### Temporary combat effects

- What counts toward duration, and should Poison tick before or after the affected fighter acts? How should the log and result handle a lethal tick?
- Which effects should stack, what limits make sense, and how should effects resolve when a fight hits the attack cap?

### Exploration

- How dangerous should The Ruins be? Can players retreat? What does defeat cost and when does an expedition count as complete?
- What rewards make expeditions worth choosing over another training fight?

### Equipment and rarity

- Do visible quality tiers help? Should category, quality, source, or enhancement level affect salvage yields?
- Should every salvage grant materials? Should higher-quality pieces guarantee uncommon rewards? Should previews show exact yields and odds?
- Should salvaging ever be available outside The Forge? How should inventory present stacked gear alongside several modified copies of the same item?

### Enchantments

- Should removal be free or carry a small fee? Should the enchantment name appear as an item prefix?
- Which slots accept each enchantment? Should recipes have class, level, or equipment requirements? Should any ingredients come only from The Ruins?
- How should bonuses scale with gear quality and player level?

### Economy

- How quickly should materials accumulate, and what makes a recipe worth its gathering time and gold cost?
- Would Curious Emporium benefit from a dedicated material-selling view? What keeps gold useful at higher levels?

## Design Reference / Provisional Values

These concepts are playtest candidates. See [AGENTS.md](../AGENTS.md#established-gameplay-concepts) for live rules.

- **Combat and progression.** A candidate Speed curve uses the current minimum and applies diminishing returns above 5 with `5 * sqrt(Speed / 5)`. A candidate Attack Power formula uses the full primary stat plus one quarter of each secondary stat, rounded down. Try one point per level, with max HP bought in larger increments than offensive stats, and review the starter spread before setting defaults.
- **Material expansion.** Worn Components are salvaged device parts for mechanical or Speed effects. Beast Essence could support Strength or HP, Arcane Fragments Intellect, Ether Dust Speed or magic, and Reinforced Alloy Defense. Metal Scraps suit physical bonuses, Enchantment Powder binds recipes, and Power Cells could power physical or magical effects. Ancient Mechanisms, Void Crystals, Primal Essence, and Resonance Cores could come from dangerous expeditions or powerful enemies. Match salvage to the gear, such as alloy from heavy armor, Beast Essence from leather, Arcane Fragments from magical weapons, and Power Cells from technological items.
- **First enchantment candidates.** Mighty increases Strength, Arcane increases Intellect, Agile increases Agility, Swift increases Speed, Fortified increases Defense, and Vital increases max HP. Minor Might, Mighty, and Greater Might illustrate possible tiers.
- **Contract and title examples.** Supply the Settlement originally asked for three fish. A title could recognize 1,000 training wins or 1,000 qualifying PvP wins, with a possible earlier milestone at 100. Revisit thresholds once repeated matchups and actual play frequency can be measured.
