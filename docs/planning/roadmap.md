# Drevan gameplay roadmap

**Next milestone.** Finish the reduced-marker map (6b). Floor 1 now has hidden, randomized caches with split claim limits (6a), plus equipment and material drops and buyback (7 and 13). Economy tuning and longer playtests can follow in a later milestone.

Build complete loops that connect combat, progression, exploration, rewards, inventory, and the economy. Reuse shared systems. Keep multiple currencies, mandatory stamina, durability, crafting professions, procedural gear, and recurring task schedules outside the initial scope.

Statuses are **Complete**, **Active**, **Planned**, and **Exploratory**. Dependencies give the order for independent work. Small, Medium, and Large are relative estimates.

## Release verification

The November 2026 UI pass updated authentication, The Quarters, The Driftwater, The Ruins, and Curious Emporium. The Chromium suite covers hidden cache discovery, mixed victory loot, inventory categories, purchase filters, and shop feedback. The [accessibility audit](../audits/2026-11-24-accessibility.md#follow-up-verification) records the remaining manual checks. For a wider playtest or launch, verify the affected flows with screen readers, real browser zoom and text resizing, Windows High Contrast, and touch and orientation in addition to the Chromium suite. Follow the [regression procedure](../design/accessibility.md#regression-procedure).

Before a public alpha, use the [launch architecture proposal](launch-architecture.md) to plan persistent sessions, HTTPS, off-server backups with a tested restore, monitoring, and a burst test for signup and training.

## P0 — Critical: Combat foundations and basic progression

### 1. Finish equipment effectiveness playtesting (P0 · Small)

- **Status.** Complete.
- Starter gear effectiveness was measured in seeded matchups. See the [equipment results](../audits/balance-playtests.md#starter-equipment-results).

### 2. Add basic fishing (P0 · Small)

- **Status.** Complete.
- The Driftwater supports daily casts, catch reports, and inventory rewards. Rods, reels, and bait remain future ideas.

### 3. Establish equipment and fish buyback (P0 · Medium)

- **Status.** Complete.
- Buyback supports spare gear and fish. See the [economy rules](../gameplay/economy.md) and [historical comparison](../audits/balance-playtests.md#historical-economy-comparison).

### 4. Combat stat audit and balancing (P0 · Medium)

- **Status.** Complete.
- The audit led to even rolls for later tied attacks. See [combat stat audit results](../audits/balance-playtests.md#combat-stat-audit).
- **Dependencies.** Starter equipment playtest (1) and the existing battle simulator.
- **Scope.** Compare offensive power, Defense, Speed, critical hits, and max HP in repeated fights. Match balanced and specialized builds at comparable investment. Use controlled or seeded rolls. Measure win rate, HP remaining, total attacks, encounter duration, and how many turns the slower side gets. Check Speed's effect on both initiative and attack frequency. Swap fighter positions to measure timing bias and validate the random tie rule.
- **Done when.** Results document where stats and combinations excel, including timing bias and low-impact bonuses. Tune one rule or bonus at a time and rerun the same matchups before expanding progression or PvE encounters.

### 4a. Prototype a named Dominion boss (P0 · Small, optional)

- **Status.** Exploratory.
- **Dependencies.** Initial combat audit (4), the training simulator, and reliable equipment calculations (1). This optional prototype can proceed independently after the audit. The Ruins can proceed without it.
- **Scope.** Start with one opponent, such as The Blighted Guardian. Define its ID, name, lore, recommended level, fixed attributes, and basic rewards in TypeScript. Tune its stat spread against a comparable training dummy so it has a recognizable matchup. Resolve challenges automatically through the shared simulator and show the existing battle log. The first encounter uses ordinary attacks and keeps its difficulty fixed. Revisit database-backed definitions if the catalog, location-specific rewards, or administrative tools warrant them. Track player progress separately from the opponent definition.
- **Done when.** Players can challenge and defeat the boss. Starter characters are clearly outmatched through combat itself, and prepared characters have a realistic path to victory. Compare win rate, remaining HP, and battle length across differently equipped builds. Verify the same boss stats are used for every challenger and training still resolves as before.

### 5. Add basic XP, leveling, and stat allocation (P0 · Large)

- **Status.** Complete.
- **Dependencies.** Combat audit (4), Dominion training, and player attributes.
- **Delivered.** Level 10 progression and persistent allocations, visible in The Quarters and through level displays in The Registry. Class effects and refunds follow later. See the [historical starter-supplies run](../audits/balance-playtests.md#starter-supplies-rerun).
- **Follow-up.** Rerun fresh-account progression with current Attack Power, then compare timed Dominion, Driftwater, and Ruins sessions after the cache change (6a). Record time to level and first gear purchase, potions used, and net gold after healing before tuning XP, activity payouts, or material prices. The existing expedition comparisons measure route payouts and action counts. See the [playtest procedure](playtesting.md#recurring-session-checks).

## P1 — High: Ruins exploration and loot

### 6. Open The Ruins for basic exploration and PvE (P1 · Large)

- **Status.** Complete.
- **Delivered.** [Floor 1](../gameplay/ruins.md) has persistent exploration, discoveries, optional fights, walkout, and Recall. The map supports keyboard movement, and battle results summarize rewards and remaining HP above the expandable log. [Route tests](../../tests/game-routes.test.ts) cover expedition state, outcomes, and stale submissions.
- **Deferred.** Additional floors, random encounters, and per-player encounter completion.

### 6a. Adopt split Floor 1 cache claims (P1 · Medium)

- **Status.** Complete.
- **Delivered.** Floor 1 places a hidden gold cache and potion cache when an expedition starts. Claims follow [the discovery rules](../gameplay/ruins.md#exploration-discoveries) and save with movement. Existing expeditions retain earned rewards and receive randomized caches on their next entry.
- **Deferred.** Measure route efficiency, potion supply, and realized income in a dedicated playtest.

### 6b. Playtest Floor 1 with reduced map markers (P1 · Medium)

- **Status.** Planned.
- **Dependencies.** Floor 1 exploration (6) and hidden caches (6a).
- **Current behavior.** [Floor 1](../gameplay/ruins.md#map-visibility-and-persistence) already hides enemy markers from the map, marker list, and movement labels. The sealed stairs are visible before arrival, and the discovery notice and descent control appear at the stair tile.
- **Scope.** Hide enemy spoilers in the map, marker list, and movement labels. Reveal the sealed stairs on arrival. At narrow widths, bring discovery and empty-cache feedback, current HP, and **Fight** and **Pass by** into view when relevant. Make walkout and Recall easy to locate and verify focus after both exits.
- **Done when.** First-time players can orient themselves without a known route, notice discoveries, make a fight or retreat decision, and return to Nexaris. Check keyboard and screen-reader discovery and encounter feedback, battle summary and log, and return focus. Repeat the 320 CSS pixel walkthrough and browser regression checks. The [reduced-marker trial](../audits/balance-playtests.md#reduced-markers-at-320-css-pixels) records the baseline.

### 7. Add basic Ruins loot and material drops (P1 · Medium)

- **Status.** Complete.
- **Delivered.** The Scavenger and Warden award stackable materials and fixed-stat gear through [Floor 1 victory loot tables](../gameplay/ruins.md#victory-loot). The Scavenger keeps its Lesser Potion roll. Drops save with the fight and appear in the battle report. All ten gear pieces are available for purchase at Curious Emporium and use the existing slots and buyback rules. Purchase categories organize the expanded stock. Materials can be sold through milestone 13.
- **Deferred.** Evaluate equipment effectiveness, sale prices, and drop rates in a dedicated playtest. Arcane and Corrupt gear have no Ruins drops yet. Shop pagination remains future work.

## P2 — Medium: Character depth and supporting gameplay

### 8. Add class specializations (P2 · Large)

- **Status.** Planned.
- **Progress.** [Class storage and class-neutral stats](../gameplay/character.md) are available. Class selection and bonuses remain planned.
- **Dependencies.** Combat audit (4) and basic stat allocation (5).
- **Scope.** Add Melee (Strength), Ranged (Agility), and Caster (Intellect) specializations. Each will receive additional offensive scaling from its preferred attribute. All three offensive attributes will still contribute to Attack Power for every class.
- **Done when.** Players can select an implemented specialization, The Quarters shows their selected class and calculated Attack Power, and the shared simulator applies the same damage rules across encounter modes. PvE matchups show distinct class strengths and weaknesses. Recheck them in practice PvP (11) when available.

### 9. Add gear with multiple modifiers and requirements (P2 · Medium)

- **Status.** Planned.
- **Dependencies.** Classes (8) and stat allocation (5).
- **Scope.** Add a few items with signed modifiers and requirements checked against permanent stats, including allocated points, before applying gear bonuses. A Titanium Warlock Robe could require Strength and trade Speed for Intellect and Defense. Compare it with a lighter robe with an easier requirement.
- **Done when.** The shop and inventory show requirements and tradeoffs, the server enforces eligibility, and The Quarters and combat reflect the same bonuses. Different builds have reasons to choose different items.

### 10. Open The Bounty Board (P2 · Medium)

- **Status.** Planned.
- **Dependencies.** Nexaris, Dominion training, and fishing (2).
- **Scope.** Start with two repeatable contracts. One counts training dummy wins in Dominion, and **Supply the Settlement** counts fish caught in The Driftwater. Players accept one active contract at a time. Start with bonus gold and keep contracts available without expiration or daily resets. Define qualifying events so future Ruins and boss objectives can use the same tracking.
- **Done when.** Each qualifying event advances the active contract once, completion pays the reward once, and the player can accept another contract.

### 11. Introduce practice PvP in Dominion (P2 · Medium)

- **Status.** Planned.
- **Dependencies.** Initial combat audit (4), The Registry, and shared combat and equipment calculations.
- **Scope.** Let a living player select another living registered player for a practice duel. Show the shared battle log and use the results to compare established builds.
- **Done when.** The server validates both fighters at the start and rejects self-matches. Results render correctly, and both players keep their persistent HP, gold, XP, and equipment.

### 12. Open The Artificer for respecs (P2 · Medium)

- **Status.** Planned.
- **Dependencies.** Classes (8), refundable point accounting (5), and gear eligibility (9).
- **Scope.** Offer three repeatable paid services under the working name **The Artificer**. Players can reset spent points, change class, or do both. Preview gold cost, stat changes, and gear that will be unequipped. Check eligibility against the resulting character.
- **Done when.** A reset restores spent points to the unspent pool and removes only the increases they bought. XP, level, and other permanent gains are preserved. Ineligible gear returns to inventory as unequipped gear. Current HP is capped at the new maximum without healing. Charges and character updates succeed together.

### 13. Add material selling and a Materials inventory filter (P2 · Medium)

- **Status.** Complete.
- Players can view Materials in The Quarters and sell owned quantities at Curious Emporium. The sale updates gold and inventory together at the [catalog prices](../gameplay/economy.md#ruins-materials). Collectibles remain a future category.

### 13a. Pilot a boss bounty (P2 · Medium)

- **Status.** Planned.
- **Dependencies.** The Bounty Board (10) and a named Dominion boss (4a). XP rewards depend on milestone 5.
- **Scope.** Add a contract for defeating a named boss. Try allowing direct challenges and using the contract to pay an additional reward while keeping the encounter identical. Start with a simple reward and consider XP, reagents, rare equipment, or unique items as their supporting systems mature.
- **Done when.** A qualifying victory satisfies the objective once and the contract pays once. Compare repeat boss payouts after healing with training, fishing, and exploration. Use that evidence to decide whether rewards need repeat restrictions.

## P3 — Low: Equipment economy and advanced systems

### 14. Add basic equipment salvaging (P3 · Medium)

- **Status.** Planned.
- **Dependencies.** Emporium buyback (3), a starter material catalog, and material selling (13).
- **Scope.** Open The Forge with a service for a few ordinary weapons and armor pieces. Preview predefined yields, ask for confirmation, and show recovered materials. A spare Rusted Sword can become Metal Scraps or be sold for guaranteed gold.
- **Done when.** A confirmed action consumes exactly one eligible unequipped piece and grants materials in the same transaction. Failed or duplicate actions cannot consume extra gear or grant extra rewards. Selling and salvaging each have a purpose, and buying gear to salvage loses gold on average.

### 15. Expand loot tables and reagent sources (P3 · Medium)

- **Status.** Planned.
- **Dependencies.** Basic Ruins loot and material drops (7), material selling (13), and named uses for new rewards.
- **Scope.** Differentiate enemy and exploration rewards by difficulty and activity. Add uncommon and rare materials gradually. Keep lore collectibles distinct from recipe ingredients.
- **Done when.** Tougher encounters and exploration offer distinct rewards, added reagents have a practical use, and the easiest activity remains a poor source of rare materials.

### 16. Track equipment copies and add guaranteed enhancements (P3 · Large)

- **Status.** Planned.
- **Dependencies.** Equipment playtesting (1), tested allocation (5) and classes (8), and a decision on how modified copies coexist with stacks.
- **Scope.** Track the specific equipment copy a player modifies or equips. At The Forge, offer a short series of guaranteed gold-only upgrades with rising costs. Improve existing bonuses so gear keeps its role. Upgrading carries no risk of destruction.
- **Done when.** Two copies of the same item can hold different upgrades and combat uses the equipped copy's bonuses. Ordinary gear remains usable. Starter gear is worth improving while new gear still has a purpose.

### 17. Add removable attribute enchantments (P3 · Large)

- **Status.** Planned.
- **Dependencies.** Starter reagents (7), material selling (13), tested allocation, class, and gear builds (5, 8, and 9), and per-copy enhancements (16). Initial recipes can use starter reagents.
- **Scope.** At The Forge, offer deterministic attribute bonuses with fixed gold and reagent recipes. Allow one enchantment per piece. Preview the current effect, new effect, recipe, owned quantities, and costs. Allow removal, replacement, and reapplication. Replacement and reapplication cost the full new recipe.
- **Done when.** Changing an enchantment preserves the original item and its ordinary enhancement level. Previous gold and reagents are nonrefundable. Costs and effects update together. The Quarters, shop, and inventory distinguish base, enhancement, and enchantment bonuses where applicable, and PvE playtests show viable alternatives. Check PvP balance once practice duels are available.

### 18. Expand equipment salvaging (P3 · Medium)

- **Status.** Planned.
- **Dependencies.** Basic salvaging (14), broader material sources (15), and tracked equipment copies (16). Enchanted gear support depends on milestone 17.
- **Scope.** Use base-item or category yields for more valuable gear, with occasional uncommon or rare materials. Materials go into the same stacks as drops. Salvaging a modified piece consumes its enhancements and enchantment along with the item.
- **Done when.** Confirmation identifies the exact copy and only that copy is consumed. Earlier spending and enchantment ingredients are never recovered. Better gear can yield better materials while purchase-and-salvage loops lose gold on average.

### 18a. Pilot an intrinsic equipment proc (P3 · Medium)

- **Status.** Planned.
- **Dependencies.** Combat audit (4), shared equipment calculations (1), and reliable equipped-item identification. Use per-copy tracking (16) if the effect must vary by copy.
- **Scope.** Static modifiers always apply. Passive combat effects apply whenever their condition is met. A proc rolls a chance on a qualifying event. Start with one intrinsic effect on the Flaming Great Axe of Ravenspire, a weapon that independently rolls on each qualifying successful attack to deal bonus damage. Use ordinary damage rules and treat fire as flavor. Resolve and log it automatically. The effect belongs to the item. Forge enchantments (17) are separately applied, removable, and use their own gold and reagent costs.
- **Done when.** Controlled rolls reproduce results, each activation logs and applies its bonus damage once, and bonus damage cannot trigger another proc. Compare fast and slow builds and verify training with ordinary gear still behaves as before.

### 18b. Pilot Poison as a temporary combat effect (P3 · Medium)

- **Status.** Planned.
- **Dependencies.** Named Dominion boss (4a) and a tested baseline for its ordinary fight. Playtest Poison separately from the first equipment proc (18a).
- **Scope.** Try letting a successful enemy attack apply Poison to its target in a rematch with The Blighted Guardian. Define its duration and test ticking on the affected fighter’s actions. Log application, damage ticks, and any defeat caused by a tick. Keep all temporary effects and stat changes in the simulation and clear them at encounter end. Save remaining HP and ordinary rewards according to the encounter’s existing rules.
- **Done when.** The log shows when Poison applies and deals damage, the effect expires as specified, and a new fight starts with no effects carried over. Compare fast and slow builds to check how action frequency affects damage and duration. Verify that lethal ticks end the encounter correctly and that the combat cap still applies.

## P4 — Backlog: Future concepts

These entries are candidates for design and playtesting. Their completion criteria describe what would justify or validate a first playable version.

### 19. Advanced enchantments (P4 · Large)

- **Status.** Exploratory.
- **Dependencies.** Basic enchantments (17) and stable training and PvP results.
- **Scope.** Consider tiers, rare recipes, unique ingredients, and specialized effects. Candidates include Keen and Brutal for critical hits, Piercing for armor penetration, Resilient for damage reduction, Vampiric for life drain, and Resonant for conditional Attack Power. Explore Ember, Frostbound, Voltaic, Voidtouched, Ethereal, and Overcharged as elemental or old-world options.
- **Done when.** A selected effect or tier adds a distinct build choice, its ingredients have a suitable source, and training and duels show counterplay.

### 20. Advanced exploration and relic identification (P4 · Large)

- **Status.** Exploratory.
- **Dependencies.** Basic Ruins expeditions (6), the [discovery foundation](../gameplay/ruins.md#exploration-discoveries) (6a), and The Reliquary.
- **Scope.** Consider deeper encounters, discoveries, and exploration-specific rewards. The Fractured Energy Core could begin as a collectible or valuable artifact, then gain identification and lore at The Reliquary.
- **Done when.** A first expanded encounter or relic gives players a reason to return and a clear way to discover its outcome or lore.

### 21. Equipment rarity and quality (P4 · Medium)

- **Status.** Exploratory.
- **Dependencies.** Emporium buyback (3), differentiated drops (15), and expanded salvage (18).
- **Scope.** Compare visible tiers with item-specific properties for communicating drop value, buyback prices, and salvage rewards. Color-based rarity needs a demonstrated gameplay benefit.
- **Done when.** Playtesting shows what information helps players choose what to use, sell, or salvage and supports a decision about visible tiers.

### 22. Combat records, titles, and achievements (P4 · Medium)

- **Status.** Exploratory.
- **Dependencies.** Training results and practice PvP (11) for evaluating PvP records.
- **Scope.** Record training and qualifying PvP wins and losses separately. Record remaining HP and gold with training results. Draws count toward neither total. Consider opt-in duels with lasting HP loss or competitive PvP after practice duels. Explore earned titles, profile displays, and whether leaderboards add value.
- **Done when.** Qualifying fights count once, title thresholds reflect real play, and players can see progress and select earned titles for their profiles.

### 23. Additional character content (P4 · Large)

- **Status.** Exploratory.
- **Dependencies.** Class playtesting (8) for moves and build-specific encounters. A playable alien race needs lore and avatar models.
- **Scope.** Consider an alien race with two models, appearance and lore first. Explore further customization, a weapon that trades Speed for Attack Power, and once-per-battle signatures such as a Melee brace, Caster armor pierce, or Ranged aimed shot.
- **Done when.** A chosen addition fits Drevan's lore or creates a distinct, tested combat choice.

### 24. Optional economy and contract expansion (P4 · Medium)

- **Status.** Exploratory.
- **Dependencies.** The relevant activity and economy playtests, including The Bounty Board (10) for contracts and The Ruins (6) for expedition objectives.
- **Scope.** Consider specialized material sources, rare traveling merchants, gold sinks, and dismantling variations such as bulk salvage. Later contracts could offer XP, items, or reagent bundles. Preserve **Trial by Combat** for qualifying Dominion wins, **Relics of the Old World** for finished expeditions, and **The Unbroken** for wins without visiting Sanctum.
- **Done when.** A selected addition serves a clear purpose in the gold economy. Expanded contracts define qualifying events, streak resets where applicable, and rewards players can use.

### 24a. Explore advanced bosses and temporary effects (P4 · Large)

- **Status.** Exploratory.
- **Dependencies.** Named boss (4a), boss bounty pilot (13a) for contract expansion, and Poison (18b) for effects.
- **Scope.** Consider the fast, fragile Phantom Duelist, the strong, slow Iron Tyrant, and the defensive Hollow Oracle. Explore boss-specific rewards and bounties. Try one new mechanic at a time, such as a once-per-battle Enrage below an HP threshold or Regeneration that tests sustained damage. Other candidates include Bleeding, Burning, Corrosion, and temporary Defense loss from Armor Break.
- **Done when.** A selected boss or effect gives players a distinct reason to adjust their build, its reward fits the challenge, and the shared log explains the result.

### 24b. Explore advanced equipment effects (P4 · Large)

- **Status.** Exploratory.
- **Dependencies.** First intrinsic proc (18a). Poison weapons depend on 18b, and combining an intrinsic effect with a Forge enchantment depends on 17.
- **Scope.** Consider the Hel Staff of Corruption for thematic dark bonus damage and the Bulwark of the Ancients for temporary Defense stacks gained on qualifying incoming attacks. Other candidates include Reflect Damage, Life Drain, conditional offense, and Poison application. Evaluate multiple effects and combinations with enchantments as separate decisions, including which events may trigger each effect.
- **Done when.** A chosen effect gives a named item a distinct role and has understandable trigger and stacking rules. Test long fights and fast and slow attackers for runaway damage or survivability.

### 24c. Evaluate PvP-specific balance rules (P4 · Medium)

- **Status.** Exploratory.
- **Dependencies.** Practice PvP (11) and evidence from shared matchups. Proc and status tuning depends on 18a and 18b.
- **Scope.** Keep shared calculations and consider explicit encounter settings only for demonstrated problems. Candidates include proc effectiveness, stack limits, status duration, healing or damage adjustments, and how capped duels resolve. Consider drawing unresolved duels at the cap. Publish any mode differences where players choose gear or start a fight.
- **Done when.** A selected rule addresses a measured problem, preserves the intended PvE matchups, and is explained clearly to players.

See [open design questions](open-questions.md) for unresolved decisions and provisional values.
