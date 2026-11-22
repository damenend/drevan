# Drevan gameplay roadmap

Start with equipment playtesting, then add fishing and equipment buyback. Build small, independently playable features for a server-rendered, early-2000s science-fantasy RPG. Reuse the existing combat, inventory, and gold systems. Keep multiple currencies, mandatory stamina, durability, crafting professions, procedural gear, and recurring task schedules outside the initial scope.

| Priority | Focus                                     | Readiness                                               |
| -------- | ----------------------------------------- | ------------------------------------------------------- |
| P0       | Existing gameplay and economy foundations | Ready to tackle now                                     |
| P1       | Drops, materials, salvage, and contracts  | Build as the listed dependencies land                   |
| P2       | Combat and character progression          | Start with an audit, then validate each new layer       |
| P3       | Exploration and advanced equipment        | Depends on earlier systems and focused design decisions |
| P4       | Future concepts                           | Needs further design before scheduling                  |

Milestone numbers show the recommended order. Dependencies are prerequisites. Independent work can move ahead when those prerequisites are met. Each heading gives the priority and relative complexity. **Small** means a limited change to an existing system, **Medium** spans a few systems, and **Large** includes substantial data changes, multiple systems, or unresolved design.

## P0 — Critical: Immediate development priorities

### 1. Finish equipment effectiveness playtesting (P0 · Small)

- **Dependencies.** Existing equipment, Home, Curious Emporium, and Dominion training.
- **Scope.** Compare starter encounters with and without the Rusted Sword (+1 Strength) and Worn Leather Armor (+1 Defense). Home and training already share effective-stat calculations, and the shop lists item effects. Check how rounding and Defense's diminishing returns affect starter armor. See the [current combat rules](../AGENTS.md#combat).
- **Done when.** Repeated matchups show where a weapon improves win odds or ends a fight sooner and where armor preserves HP. The shop's listed bonuses agree with Home and the stats used in Dominion training.

### 2. Add basic fishing (P0 · Small)

- **Dependencies.** Nexaris, the existing gold balance, and training and Sanctum as comparison points.
- **Scope.** Add one server-rendered fishing spot with a **Cast** action, common catches, occasional rare catches, and empty attempts. Automatically sell catches for modest gold.
- **Done when.** Players can cast and see the outcome and payout. A short session helps pay for healing or starter gear, and its income has been compared with training after healing costs.

### 3. Establish equipment buyback (P0 · Medium)

- **Dependencies.** Curious Emporium, inventory quantities, and equipped slots.
- **Scope.** Buy back owned weapons and armor at guaranteed server-set gold values. Require players to unequip an item before selling that catalog item while equipped gear is tracked by catalog ID.
- **Done when.** A valid sale deducts the selected quantity and credits gold together. Equipped gear, unowned items, and invalid quantities leave player state intact. Buyback prices establish the cash alternative to salvage.

## P1 — High: Near-term gameplay improvements

### 4. Introduce basic combat item drops (P1 · Medium)

- **Dependencies.** Starter equipment playtest (1), training, and inventory.
- **Scope.** Use fixed server-side reward lists for eligible training wins. Start with existing consumables such as Lesser Potion and a few fixed-stat items. Reinforced Bracers and Ancient Blade are candidate gear. Reserve better drops for tougher opponents.
- **Done when.** A qualifying encounter grants at most one roll, including on repeat submissions. Existing gold rewards still work, and repeated easy fights are a poor source of valuable gear.

### 5. Introduce a minimal reagent catalog (P1 · Small)

- **Dependencies.** Basic drops (4) and stackable inventory.
- **Scope.** Start with Metal Scraps, Enchantment Powder, and Power Cells. Give each a description, a sell value for milestone 6, and a near-term source or use. Keep early drops modest until selling is available.
- **Done when.** Players can acquire the starter reagents and repeated drops add to the existing stacks. Players can identify each material and its quantity.

### 6. Add material selling and inventory grouping (P1 · Medium)

- **Dependencies.** Equipment buyback (3) and the starter reagents (5).
- **Scope.** Extend merchant selling to materials. Group inventory into Equipment, Consumables, and Materials as needed, with Collectibles available as a future category. Keep the existing stacks.
- **Done when.** Players can find their materials and sell a valid quantity at the listed price. Gold and inventory update together, and failed sales leave both intact.

### 7. Add basic equipment salvaging (P1 · Medium)

- **Dependencies.** Equipment buyback (3), starter reagents (5), and material selling (6).
- **Scope.** Open The Forge with a service for a few ordinary weapons and armor pieces. Preview predefined yields, ask for confirmation, and show recovered materials. A spare Rusted Sword can become Metal Scraps or be sold for guaranteed gold.
- **Done when.** A confirmed action consumes exactly one eligible unequipped piece and grants materials in the same transaction. Failed or duplicate actions cannot consume extra gear or grant extra rewards. Selling and salvaging each have a purpose, and buying gear to salvage loses gold on average.

### 8. Open The Bounty Board (P1 · Medium)

- **Dependencies.** Nexaris and whichever activities the initial contracts count. **Supply the Settlement** requires fishing (2).
- **Scope.** Offer one or two repeatable contracts, such as beginner training wins and catching fish for Supply the Settlement. Players accept one active contract at a time. Start with bonus gold and keep contracts available without expiration or daily resets.
- **Done when.** Each qualifying event advances the active contract once, completion pays the reward once, and the player can accept another contract.

## P2 — Medium: Core character and combat progression

### 9. Audit and tune the combat system (P2 · Medium)

- **Dependencies.** Starter equipment playtest (1) and the existing battle simulator.
- **Scope.** Compare Strength, Defense, Speed, critical hits, and max HP in repeated fights. Match balanced and specialized builds at comparable investment. Measure win rate, HP remaining, total attacks, and how many turns the slower side gets. Check Speed's effect on both initiative and attack frequency. Swap fighter positions to test the current tie rule, which favors the player on equal attack times.
- **Done when.** Results document where stats and combinations excel, including timing bias and low-impact bonuses. Tune one rule or bonus at a time and rerun the same matchups before opening practice PvP.

### 10. Introduce practice PvP in Dominion (P2 · Medium)

- **Dependencies.** Initial combat audit (9), The Registry, and shared combat and equipment calculations.
- **Scope.** Let a living player select another living registered player for a practice duel. Show the shared battle log and use the results to compare builds.
- **Done when.** The server validates both fighters at the start and rejects self-matches. Results render correctly, and both players keep their persistent HP, gold, XP, and equipment.

### 11. Add classes and primary attributes (P2 · Large)

- **Dependencies.** Combat audit (9) and practice PvP (10) for comparison.
- **Scope.** Add Warrior (Strength), Wizard (Intellect), and Archer (Agility). Calculate Attack Power after gear bonuses, weighting each class's primary attribute most heavily and letting the two secondary offensive attributes contribute. Give Speed and HP the same role across classes. Playtest a Wizard critical-hit bonus. Allow switching on Home during tuning while preserving permanent gains and any allocated stats.
- **Done when.** Home shows the primary stat and Attack Power. Training and PvP use the same damage rules, with classless players and dummies retaining Strength-based damage. Starter fights and duels show distinct class strengths and weaknesses.

### 12. Add XP, levels, and stat allocation (P2 · Large)

- **Dependencies.** Classes (11) and practice PvP (10).
- **Scope.** Start with XP from training wins. Award points at level-up and let players spend or save them. Offer Strength, Agility, Intellect, Speed, and max HP. Track point-funded increases separately so The Artificer can refund them later. The Registry and player profiles currently display level 1.
- **Done when.** Players can reach an early level in a short session, see XP and unspent points on Home and earned levels in The Registry and profiles, and spend points without losing saved ones. Comparable training and PvP builds show viable alternatives.

### 13. Add gear with multiple modifiers and requirements (P2 · Medium)

- **Dependencies.** Classes (11) and stat allocation (12).
- **Scope.** Add a few items with signed modifiers and requirements checked against permanent stats, including allocated points, before applying gear bonuses. A Titanium Warlock Robe could require Strength and trade Speed for Intellect and Defense. Compare it with a lighter robe with an easier requirement.
- **Done when.** The shop and inventory show requirements and tradeoffs, the server enforces eligibility, and Home and combat reflect the same bonuses. Different builds have reasons to choose different items.

### 14. Open The Artificer for respecs (P2 · Medium)

- **Dependencies.** Classes (11), refundable point accounting (12), and gear eligibility (13).
- **Scope.** Offer three repeatable paid services under the working name **The Artificer**. Players can reset spent points, change class, or do both. Preview gold cost, stat changes, and gear that will be unequipped. Check eligibility against the resulting character.
- **Done when.** A reset restores spent points to the unspent pool and removes only the increases they bought. XP, level, and other permanent gains are preserved. Ineligible gear returns to inventory as unequipped gear. Current HP is capped at the new maximum without healing. Charges and character updates succeed together.

## P3 — Low: Advanced and interconnected systems

### 15. Introduce The Ruins (P3 · Large)

- **Dependencies.** Combat audit (9), shared combat and inventory, and decisions on danger, retreat, defeat, and expedition completion.
- **Scope.** Add a text-based expedition into Drevan's lost civilizations. One action rolls a discovery of gold or an existing item, an empty result, or a hostile encounter. Reuse the battle system and start without maps, stamina, or daily limits.
- **Done when.** Players see and can resolve every event type. Encounter consequences and expedition completion are clear, and rewards offer a reason to explore after accounting for HP loss and healing.

### 16. Expand loot tables and reagent sources (P3 · Medium)

- **Dependencies.** Drops and materials (4–6) and named uses for new rewards. Exploration-specific sources require The Ruins (15).
- **Scope.** Differentiate enemy and exploration rewards by difficulty and activity. Add uncommon and rare materials gradually. Keep lore collectibles distinct from recipe ingredients.
- **Done when.** Tougher encounters and exploration offer distinct rewards, added reagents have a practical use, and the easiest activity remains a poor source of rare materials.

### 17. Track equipment copies and add guaranteed enhancements (P3 · Large)

- **Dependencies.** Equipment playtesting (1), tested classes and allocation (11–12), and a decision on how modified copies coexist with stacks.
- **Scope.** Track the specific equipment copy a player modifies or equips. At The Forge, offer a short series of guaranteed gold-only upgrades with rising costs. Improve existing bonuses so gear keeps its role. Upgrading carries no risk of destruction.
- **Done when.** Two copies of the same item can hold different upgrades and combat uses the equipped copy's bonuses. Ordinary gear remains usable. Starter gear is worth improving while new gear still has a purpose.

### 18. Add removable attribute enchantments (P3 · Large)

- **Dependencies.** Reagent sources and selling (5–6), tested builds (10–13), and per-copy enhancements (17). Initial recipes can use starter reagents.
- **Scope.** At The Forge, offer deterministic attribute bonuses with fixed gold and reagent recipes. Allow one enchantment per piece. Preview the current effect, new effect, recipe, owned quantities, and costs. Allow removal, replacement, and reapplication. Replacement and reapplication cost the full new recipe.
- **Done when.** Changing an enchantment preserves the original item and its ordinary enhancement level. Previous gold and reagents are nonrefundable. Costs and effects update together. Home, shop, and inventory distinguish base, enhancement, and enchantment bonuses where applicable, and training and PvP show viable alternatives.

### 19. Expand equipment salvaging (P3 · Medium)

- **Dependencies.** Basic salvaging (7), broader material sources (16), and tracked equipment copies (17). Enchanted gear support depends on milestone 18.
- **Scope.** Use base-item or category yields for more valuable gear, with occasional uncommon or rare materials. Materials go into the same stacks as drops. Salvaging a modified piece consumes its enhancements and enchantment along with the item.
- **Done when.** Confirmation identifies the exact copy and only that copy is consumed. Earlier spending and enchantment ingredients are never recovered. Better gear can yield better materials while purchase-and-salvage loops lose gold on average.

## P4 — Backlog: Future concepts and open design questions

These entries are candidates for design and playtesting. Their completion criteria describe what would justify or validate a first playable version.

### 20. Advanced enchantments (P4 · Large)

- **Dependencies.** Basic enchantments (18) and stable training and PvP results.
- **Scope.** Consider tiers, rare recipes, unique ingredients, and specialized effects. Candidates include Keen and Brutal for critical hits, Piercing for armor penetration, Resilient for damage reduction, Vampiric for life drain, and Resonant for conditional Attack Power. Explore Ember, Frostbound, Voltaic, Voidtouched, Ethereal, and Overcharged as elemental or old-world options.
- **Done when.** A selected effect or tier adds a distinct build choice, its ingredients have a suitable source, and training and duels show counterplay.

### 21. Advanced exploration and relic identification (P4 · Large)

- **Dependencies.** Basic Ruins expeditions (15) and The Reliquary.
- **Scope.** Consider deeper encounters, discoveries, and exploration-specific rewards. The Fractured Energy Core could begin as a collectible or valuable artifact, then gain identification and lore at The Reliquary.
- **Done when.** A first expanded encounter or relic gives players a reason to return and a clear way to discover its outcome or lore.

### 22. Equipment rarity and quality (P4 · Medium)

- **Dependencies.** Equipment buyback (3), differentiated drops (16), and expanded salvage (19).
- **Scope.** Compare visible tiers with item-specific properties for communicating drop value, buyback prices, and salvage rewards. Color-based rarity needs a demonstrated gameplay benefit.
- **Done when.** Playtesting shows what information helps players choose what to use, sell, or salvage and supports a decision about visible tiers.

### 23. Combat records, titles, and achievements (P4 · Medium)

- **Dependencies.** Training results and practice PvP (10) for evaluating PvP records.
- **Scope.** Record training and qualifying PvP wins and losses separately. Record remaining HP and gold with training results. Draws count toward neither total. Consider opt-in duels with lasting HP loss or competitive PvP after practice duels. Explore earned titles, profile displays, and whether leaderboards add value.
- **Done when.** Qualifying fights count once, title thresholds reflect real play, and players can see progress and select earned titles for their profiles.

### 24. Additional character content (P4 · Large)

- **Dependencies.** Class playtesting (11) for moves and build-specific encounters. A playable alien race needs lore and avatar models.
- **Scope.** Consider an alien race with two models, appearance and lore first. Explore further customization, named Dominion opponents, a weapon that trades Speed for Strength, and once-per-battle signatures such as a Warrior brace, Wizard armor pierce, or Archer aimed shot.
- **Done when.** A chosen addition fits Drevan's lore or creates a distinct, tested combat choice.

### 25. Optional economy and contract expansion (P4 · Medium)

- **Dependencies.** The relevant activity and economy playtests, including The Bounty Board (8) for contracts and The Ruins (15) for expedition objectives.
- **Scope.** Consider specialized material sources, rare traveling merchants, gold sinks, and dismantling variations such as bulk salvage. Later contracts could offer XP, items, or reagent bundles. Preserve **Trial by Combat** for qualifying Dominion wins, **Relics of the Old World** for finished expeditions, and **The Unbroken** for wins without visiting Sanctum.
- **Done when.** A selected addition serves a clear purpose in the gold economy. Expanded contracts define qualifying events, streak resets where applicable, and rewards players can use.

## Recurring playtest checks

- **Economy.** Compare short, realistic sessions across training, fishing, contracts, exploration, equipment and material sales, and salvage. Account for Sanctum healing, gear purchases, and future Forge and Artificer fees. Compare recipe costs with reagent sale values and gathering time. Keep rare ingredients tied primarily to gameplay if shops eventually stock basics.
- **Activity roles.** Training builds combat progression, fishing offers steadier income, contracts reward bonus objectives, salvage supplies materials, exploration offers uncertain payouts, and The Forge gives players a place to invest in gear. Check that each activity has a reason to play. Keep average salvage resale at or below equipment buyback value even when a rare result can exceed it.
- **Combat builds.** Repeat the audit matchups with each new attribute, class bonus, allocation option, equipment modifier, enhancement, and enchantment. Include Speed and initiative, Defense, critical hits, and max HP. Start with training and repeat in practice PvP as soon as available. Compare equal investment and observed fight outcomes. Equal numerical bonuses can have very different effects.

## Open Design Questions

### Combat and PvP

- How should offensive and defensive stats compare at similar investment? Which builds trade enough for their strengths?
- How much of Speed's value should come from initiative versus attack frequency? Does fighter position affect later turns, and what should change after classes and gear modifiers are tested?
- Which fights should qualify for drops, contracts, competitive records, or titles? Would opt-in stakes improve duels?

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
