# Drevan gameplay roadmap

**Next milestone.** Finish Floor 1 exploration, usability, and accessibility verification (6b), then implement the named Dominion boss and its first persistent victory record (4a). The approved Vanguard, Ranger, and Arcanist names are now in place. The first boss should establish an aspirational PvE reward path; multiple-modifier equipment and requirements (9) follow as the next character-building layer.

The [gameplay philosophy](gameplay-philosophy.md) owns durable design direction. This roadmap owns commitments, priorities, dependencies, and completion criteria. Technical prerequisites enable work; they do not by themselves determine gameplay priority. Prefer small, complete loops that connect an objective, acquisition, use, and visible progress.

Statuses are **Complete**, **Active**, **Planned**, and **Exploratory**. A milestone with shipped behavior and outstanding verification remains **Active**; balance follow-up does not make an otherwise complete feature active. Small, Medium, and Large are relative estimates.

## Release verification and integrity

The November 2026 UI pass updated authentication, The Quarters, The Driftwater, The Ruins, and Curious Emporium. The Chromium suite covers hidden cache discovery, mixed victory loot, inventory categories, purchase filters, and shop feedback. The [accessibility audit](../audits/2026-11-24-accessibility.md#follow-up-verification) owns the remaining manual checks.

Before an external alpha, provide persistent sessions, HTTPS, off-server backups with a tested restore, monitoring, deployment validation, and appropriate burst testing as described in the [launch architecture](launch-architecture.md). Also restrict the self-editing Admin portal on the server. Hiding its navigation link is not authorization. This restriction is required before persistent progression, competitive records, public rankings, or player trading can be treated as trustworthy.

## Completed foundations

These milestones preserve delivered history and remain dependencies for later work.

### 1. Finish starter equipment effectiveness playtesting (Small)

- **Status.** Complete.
- Starter equipment was measured in seeded matchups. See the [equipment results](../audits/balance-playtests.md#starter-equipment-results).

### 2. Add basic fishing (Small)

- **Status.** Complete.
- The Driftwater supports 50 daily casts, line and net casting, catch reports, and inventory rewards. Environments, rods, bait, and processing are future work.

### 3. Establish equipment and fish buyback (Medium)

- **Status.** Complete.
- Curious Emporium buys spare equipment, fish, and eligible materials under the [implemented economy rules](../gameplay/economy.md).

### 4. Audit core combat stats (Medium)

- **Status.** Complete.
- The audit led to independent rolls for later tied attacks. Historical methods and results remain in the [balance audit](../audits/balance-playtests.md#combat-stat-audit).
- **Follow-up.** Revisit numerical balance after modifiers, passives, and additional enemies create meaningful matchups. It is not a prerequisite for ordinary feature work.

### 5. Add XP, leveling, and stat allocation (Large)

- **Status.** Complete.
- Level 100 progression, lifetime XP, five allocatable stats, and persistent point accounting are implemented. Fresh-character progression remains useful experience evidence, not unfinished functional scope.

### 6. Open Floor 1 of The Ruins (Large)

- **Status.** Complete.
- Floor 1 has persistent fog of war, randomized finite enemy populations, mandatory fights, discoveries, walkout, Recall, and durable expedition summaries. Victories permanently clear generated enemies for that expedition.

### 6a. Adopt split Floor 1 cache claims (Medium)

- **Status.** Complete.
- A hidden gold cache and potion cache are placed per expedition and follow the [implemented discovery rules](../gameplay/ruins.md#exploration-discoveries).

### 7. Add basic Ruins loot and material drops (Medium)

- **Status.** Complete.
- Floor 1 enemies grant fixed-stat equipment and materials through fixed loot tables. The ten-item equipment progression spans levels 2–10 and remains available at Curious Emporium. Arcane and Corrupt equipment are not current Ruins drops.

### 13. Add material selling and inventory filtering (Medium)

- **Status.** Complete.
- Materials have an inventory category and can be sold at their catalog prices. They do not yet have crafting or processing uses.

## Phase 1 — Establish aspirational progression

Give players desirable equipment, formidable opponents, and meaningful character-building decisions.

**Recommended order:** finish 6b; deliver 4a and 22a together; then implement 9 and the free reset slice of 12. PvE-exclusive rewards can start with 4a and expand through 9 without waiting for advanced equipment infrastructure.

### 6b. Verify Floor 1 exploration and reduced markers (Medium)

- **Status.** Active.
- **Dependencies.** Floor 1 (6) and hidden caches (6a).
- **Delivered.** Unexplored and cleared squares are distinct; enemy locations and identities are absent from map markup and movement labels; the sealed stairs appear after arrival.
- **Remaining scope.** Playtest at narrow widths and verify that discoveries, cache feedback, HP, battle outcomes, walkout, Recall, and post-action focus are understandable by keyboard and screen reader. Repeat the 320 CSS pixel walkthrough and documented browser regression checks.
- **Done when.** First-time players can orient without a known route, notice rewards, judge whether to continue, and return to Nexaris. Record the remaining manual accessibility results separately from later balance work.

### 4a. Introduce The Blighted Guardian (Small)

- **Status.** Planned.
- **Dependencies.** Shared battle resolution and effective equipment calculations (1 and 4). Persistent victory recording uses 22a.
- **Scope.** Add one repeatable named Dominion opponent with a stable ID, recognizable lore, fixed attributes, an advisory recommended level, and desirable rewards including the first PvE-exclusive named equipment. Use ordinary automated attacks and the existing battle report. Let living players attempt it without a level gate. Keep its definition separate from player progress.
- **Done when.** The same fixed opponent is used for every challenger; underprepared characters are outmatched through combat rather than a gate; prepared characters have a realistic path to victory; rewards and one victory record save atomically; training remains unchanged.
- **Deferred.** Unique mechanics, database-backed enemy catalogs, exhaustive tuning, bounties, and additional bosses.

### 8a. Adopt approved class names (Small)

- **Status.** Complete.
- **Dependencies.** Existing class selection and calculations (8).
- The Conclave, Quarters, Admin, and profiles use Vanguard, Ranger, and Arcanist consistently. The original stored identifiers remain internal so existing characters retain their classes without a data migration. Class calculations are unchanged.

### 9. Add fixed multi-modifier equipment and requirements (Medium)

- **Status.** Planned.
- **Dependencies.** Stat allocation (5), implemented class scaling (8), and approved class terminology (8a).
- **Scope.** Add a small handcrafted set with signed modifiers, deliberate tradeoffs, visible acquisition sources, and requirements checked against permanent attributes before equipment bonuses. Include baseline merchant choices and more desirable PvE choices. Keep progression tier, rarity, identity, and individual quality distinct; do not add randomized affixes or per-copy storage.
- **Done when.** The shop, rewards, inventory, comparison UI, Quarters, and combat show the same modifiers and requirements; the server enforces eligibility; at least two pieces create a real build tradeoff; PvE rewards are desirable without making merchant gear useless.

### 12. Open The Artificer for alpha experimentation (Medium)

- **Status.** Planned.
- **Dependencies.** Refundable point accounting (5) and equipment eligibility (9).
- **Scope.** First provide free, repeatable attribute resets and retain free class changes during alpha. A reset removes only allocated gains, returns those points, preserves XP, level, and permanent gains, unequips newly ineligible gear, and caps current HP at the new maximum without healing. Preview the result.
- **Done when.** Preview and update agree; point, equipment, and HP changes succeed together; stale or repeated submissions cannot duplicate points; existing permanent gains are preserved.
- **Deferred.** Gold costs and other friction until the economy and build system are mature enough to justify them.

### 22a. Record foundational lifetime statistics (Medium)

- **Status.** Planned.
- **Dependencies.** Stable identifiers for each qualifying event. Begin with the event introduced by 4a.
- **Scope.** Establish direct, transactional counters and personal records without a general event-processing framework. Candidate records include training wins and defeats, highest successful training difficulty, Ruins encounters and victories, expeditions completed, deepest floor, named boss victories, lifetime gold earned, and significant discoveries. Define each qualifying event before adding its counter. Draws are neither wins nor losses.
- **Done when.** The first selected statistics update once in the same transaction as their outcome, stale or repeated submissions cannot double-count, and players can inspect the values on an appropriate profile or activity page.
- **Deferred.** Achievements, rewards for thresholds, earned titles, collection logs, broad backfilling, and public rankings.

## Phase 2 — Character identity and measurable accomplishment

Let players compare builds, recognize strengths, and establish personal goals.

**Recommended order.** Practice PvP can proceed once profiles expose useful equipment and stats. Floor 2 depends on a permanent unlock model. Contracts should follow stable qualifying events.

### 8. Complete class specialization with one passive per class (Large)

- **Status.** Complete.
- **Delivered.** Each specialization gains one [automatic passive](../gameplay/character.md#class-passives) alongside preferred-attribute Attack Power scaling. Dominion and The Ruins resolve and log these effects. The Conclave previews all three and the Registry profile shows the active passive. Controlled tests cover activation, damage limits, and class changes.
- **Deferred.** Secondary universal attribute benefits, active abilities, skill trees, and exact balance targets.

### 11. Introduce practice PvP in Dominion (Medium)

- **Status.** Planned.
- **Dependencies.** The Registry, shared combat and equipment calculations, and useful profile comparisons (22b). Passives (8) should be included if already shipped but need not block the first practice slice.
- **Scope.** Let a living player select another living player for a practice duel using the shared simulator. Validate both fighters and reject self-matches. Preserve both players' persistent HP, gold, XP, equipment, and resources. Keep practice records distinct from future competitive records.
- **Done when.** Results render correctly, neither fighter's persistent resources change, draws count as neither wins nor losses, and one submission cannot create duplicate records.
- **Deferred.** Stakes, matchmaking, ratings, competitive rewards, anti-farming rules, and public rankings.

### 22b. Improve profiles and equipment comparison (Medium)

- **Status.** Planned.
- **Dependencies.** Foundational records (22a) and multi-modifier equipment (9).
- **Scope.** Show selected lifetime records, equipped items, acquisition or rarity context where useful, and a clear comparison between owned equipment. Avoid exposing private account information or untrusted implementation identifiers.
- **Done when.** A player can understand another character's demonstrated accomplishments and compare an owned candidate with the currently equipped item without manually reconstructing modifiers.

### 20a. Add Floor 2 and permanent floor access (Large)

- **Status.** Planned.
- **Dependencies.** Floor 1 verification (6b), a durable floor-unlock representation, and rewards with a defined use.
- **Scope.** Unlock Floor 2 permanently through a guardian, key discovery, or another explicit exploration objective. Keep temporary keys and sealed discoveries expedition-specific and optional. Add a distinct fixed enemy population, challenge range, discoveries, and desirable equipment or materials. Generalize only the Floor 1 assumptions required by the delivered floor.
- **Done when.** A qualifying player unlocks ordinary Floor 2 access once and need not rediscover a mandatory random key on every expedition; Floor 1 remains functional; returning to earlier content demonstrates character growth; summaries distinguish the deepest floor reached.

### 10. Open The Bounty Board with repeatable contracts (Medium)

- **Status.** Planned.
- **Dependencies.** Stable qualifying events and foundational records (22a); boss objectives also depend on 4a.
- **Scope.** Start with a small set of repeatable, non-expiring contracts and one active contract at a time. Use established events such as training victories rather than inventing a general event bus. Begin with useful, bounded rewards and no daily reset.
- **Done when.** Each qualifying event advances the active contract once, completion pays once, and the player can accept another contract. Refreshes and stale submissions cannot duplicate progress or payment.

### 13a. Add a boss bounty (Medium)

- **Status.** Planned.
- **Dependencies.** Bounty Board (10) and named boss (4a).
- **Scope.** Add a contract for defeating The Blighted Guardian while keeping direct challenges available. The contract may add a simple reward; use later evidence to decide whether repeat restrictions are necessary.
- **Done when.** A qualifying victory advances the objective once and payment occurs once. Record repeat payout and healing evidence without making comprehensive economy balance part of delivery.

### 24a. Add differentiated named opponents (Medium per opponent)

- **Status.** Planned.
- **Dependencies.** Named boss foundation (4a), records (22a), and enough equipment choices to support preparation (9).
- **Scope.** Add opponents one at a time using contrasting existing stats: durable and defensive, fast and fragile, slow with powerful individual attacks, or demanding sustained offense. Give each a recognizable reward and advisory preparation information. Strategies should emerge from shared mechanics, not class-specific counters.
- **Done when.** The opponent produces a different matchup from prior bosses, its meaningful traits are explained to players, and more than one viable build can overcome it.

## Phase 3 — Equipment investment and connected resources

Turn unwanted equipment, fish, gold, and materials into useful choices. Deliver acquisition and consumption together where practical instead of stockpiling purposeless reagents.

**Recommended order:** basic salvage can use current materials; per-copy tracking should arrive only with enhancements; enchantments then create a material sink; expand sources alongside recipes. Fishing equipment and processing should ship in slices that produce something already useful.

### 14. Add basic equipment salvaging (Medium)

- **Status.** Planned.
- **Dependencies.** Buyback (3), material inventory and selling (13), and at least one useful material sink or an immediately following enhancement slice.
- **Scope.** Open The Forge for predefined yields from a small set of ordinary unequipped items. Preview the yield and require confirmation. Selling offers guaranteed gold; salvaging supports equipment investment.
- **Done when.** One confirmed action consumes exactly one eligible unequipped item and grants its materials atomically; duplicate actions cannot repeat either side; buying equipment solely to salvage loses gold on average.

### 16. Track equipment instances and add guaranteed enhancements (Large)

- **Status.** Planned.
- **Dependencies.** Stable equipment rules (9) and a reviewed migration for current inventory stacks and equipped catalog IDs.
- **Scope.** Introduce individual storage because the feature requires per-copy state. Offer a short sequence of guaranteed gold-funded upgrades with increasing costs and no destruction risk. Preserve the item's designed identity.
- **Done when.** Two copies of one catalog item can hold different enhancement levels, the equipped copy is unambiguous, combat uses its values, and migration preserves existing ownership and equipment.

### 17. Add removable material-based enchantments (Large)

- **Status.** Planned.
- **Dependencies.** Equipment instances and enhancements (16), fixed equipment tradeoffs (9), and named reagent sources with useful recipes.
- **Scope.** Offer deterministic bonuses with explicit gold and material costs. Start with one removable enchantment per eligible piece. Preview replacement and removal; replacement consumes the full new recipe while the base item and enhancement level remain.
- **Done when.** Costs and effects update atomically, inventory and combat identify base modifiers, enhancement, and enchantment, and at least two recipes create viable choices rather than one universal best option.

### 15. Expand material acquisition with actual uses (Medium)

- **Status.** Planned.
- **Dependencies.** A consuming feature such as 14 or 17 and the relevant reward source.
- **Scope.** Add uncommon and rare materials only alongside recipes, salvage yields, or processing outputs that use them. Differentiate sources by activity and challenge. Keep lore collectibles separate from ingredients.
- **Done when.** Each introduced reagent has a practical use, difficult content offers a meaningful advantage without becoming the sole mandatory path, and sale remains a valid alternative.

### 18. Expand salvage and inventory protection (Medium)

- **Status.** Planned.
- **Dependencies.** Basic salvage (14), equipment instances (16), and expanded materials (15). Enchanted-item handling depends on 17.
- **Scope.** Extend yields by item or category, identify the exact copy consumed, and add item locking or equivalent bulk-sale and salvage protection before valuable modified items are easy to liquidate accidentally.
- **Done when.** Confirmation and protection make the target unambiguous; modified spending is not refunded through salvage; useful selling and salvage paths remain.

### 2a. Add fishing environments, rods, and bait (Large)

- **Status.** Planned.
- **Dependencies.** Basic fishing (2), itemized preparation choices, and catch-table support.
- **Scope.** Keep the Cast action while adding a small number of environments with distinct catch tables, rods with clear capabilities, and bait that influences targeted catches. Preserve net casting as a convenient broad-income option. Do not add grid movement or change the current allowance merely to deliver this milestone.
- **Done when.** Preparation changes the available or likely catches in an understandable way, line and net casting retain distinct useful roles, and server-side rules derive every result from owned and selected equipment.

### 2b. Add fish processing (Medium)

- **Status.** Planned.
- **Dependencies.** Basic fishing (2) and at least one real use for its outputs (15 or 17).
- **Scope.** Add a Fishmonger or equivalent service that competes with guaranteed Emporium sale. Processing should give a useful common yield with a possibility of an exceptional yield. Names, costs, probabilities, and exact reagents remain unresolved until paired with recipes.
- **Done when.** The player can compare sale with processing, input fish and successful outputs update atomically, repeated submissions cannot duplicate yields, and every output has a present use.

### 18a. Pilot one intrinsic equipment effect (Medium)

- **Status.** Planned.
- **Dependencies.** Shared equipment identification and combat hooks; per-copy tracking (16) only if the effect varies by copy.
- **Scope.** Add one automatic, fixed identity effect to a named item. Define qualifying events, critical interaction, and whether bonus damage can trigger effects. Log every activation. Keep intrinsic effects separate from removable Forge enchantments.
- **Done when.** Controlled rolls reproduce the result, one event cannot recurse into itself, battle reports explain the consequence, and fast and slow builds have been checked for accidental runaway value.

### 18b. Pilot one temporary combat effect (Medium)

- **Status.** Planned.
- **Dependencies.** A stable ordinary boss baseline (4a) and explicit duration, stacking, and encounter-termination rules.
- **Scope.** Introduce one effect such as Poison in a later encounter. Keep temporary state inside the simulation and clear it after combat. Log application, ticks, expiration, and lethal consequences.
- **Done when.** Controlled tests cover timing, expiration, lethal effects, attack-cap behavior, and a clean subsequent encounter.

## Phase 4 — Long-term progression and community

These concepts are **Exploratory**, not implementation commitments. Promote one only after its prerequisites and player value are demonstrated.

### 19. Advanced automatic combat effects (Large)

- **Status.** Exploratory.
- **Dependencies.** A proven intrinsic effect (18a), temporary effect (18b), passives (8), and readable battle reports.
- Consider Enrage, Regeneration, Armor Break, Retaliation, damage over time, temporary defense, conditional offense, life drain, and bounded stacking. Add one behavior at a time and disclose meaningful enemy behavior before a player commits.

### 20. Additional Ruins floors, rare encounters, and relics (Large)

- **Status.** Exploratory.
- **Dependencies.** Floor 2 and permanent access (20a), useful reward systems, and The Reliquary for identification or lore.
- Consider deeper floors, direct-entry shortcuts earned through mastery, rare encounters, artifact identification, and permanent collection records. Avoid an elaborate generic dungeon framework until more than one delivered floor demonstrates the common shape.

### 21. Visible rarity and variable equipment quality (Medium to Large)

- **Status.** Exploratory.
- **Dependencies.** Differentiated acquisition sources and equipment comparison (9 and 22b). Per-copy variation requires 16.
- Visible rarity and acquisition-source cues may be inexpensive ways to communicate significance. Variable quality, if justified, should use bounded variation while preserving a handcrafted item's identity. Procedural affixes remain outside the current direction.

### 22. Achievements, earned titles, and collections (Large)

- **Status.** Exploratory.
- **Dependencies.** Trusted foundational statistics (22a), profiles (22b), and stable qualifying events.
- Consider achievements, selectable titles, personal bests, and collection logs for rare fish, named equipment, artifacts, and discovered enemies. A discovery record may persist after an item is sold or consumed.

### 23. Additional equipment slots and character options (Large)

- **Status.** Exploratory.
- **Dependencies.** Evidence that existing itemization and classes need more build dimensions.
- Consider additional slots, appearance options, or secondary universal attribute benefits only when they add meaningful choices without needless inventory management. Active combat inputs and rigid class-exclusive equipment remain outside the direction.

### 24. Competitive PvP and rankings (Large)

- **Status.** Exploratory.
- **Dependencies.** Practice PvP (11), server-restricted Admin access, trusted records, and evidence from real shared matchups.
- Address opponent selection, power disparity, repeated opponents, alternate accounts, farming, rating integrity, mode-specific rules, and public explanations before rewards or rankings matter.

### 25. Player-driven marketplace (Large)

- **Status.** Exploratory.
- **Dependencies.** Valuable differentiated items, equipment instances where needed, inventory protection, server-restricted Admin access, economic integrity controls, and a population that justifies trading.
- Do not prioritize an auction house or direct trade while the core economy still lacks mature item and resource uses.

### 26. Guilds and cooperative objectives (Large)

- **Status.** Exploratory.
- **Dependencies.** A sustained player population, trusted identity and moderation boundaries, and compelling individual progression.
- Cooperative systems should reinforce existing objectives instead of adding mandatory recurring chores.

See [open design questions](open-questions.md) for unresolved mechanics and provisional examples. See [playtesting](playtesting.md) for functional verification, manual experience evaluation, and the later role of simulations.
