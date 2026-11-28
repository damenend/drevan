# Drevan gameplay philosophy

Drevan is a persistent, text-driven science-fantasy RPG about building a character worth caring about. Players progress through combat, exploration, equipment acquisition, wealth, discovery, and competition. The game should create lasting accomplishment, aspiration, and personal investment while retaining the accessibility and technical simplicity of an early-2000s browser RPG.

Diablo II, World of Warcraft, and Alien Adoption Agency are useful references for character investment and progression, not production scope. Drevan should pursue the satisfaction of becoming stronger, acquiring desirable possessions, accumulating wealth, overcoming challenges, optimizing builds, and earning recognition without recreating the mechanics or scale of an AAA game.

> **Combat tests your character. The rest of the game is about building that character.**

This document owns durable design direction. The [roadmap](roadmap.md) owns commitments and sequence, [open questions](open-questions.md) owns unresolved mechanics, and the [gameplay references](../gameplay/README.md) describe implemented rules.

## Design principles

- **Meaningful progression.** Improvements should be noticeable, consequential, and reflected in the challenges a character can overcome.
- **Aspiration.** Players need goals beyond the next level: rare equipment, formidable opponents, wealth, deeper exploration, and prestigious accomplishments.
- **Reliable and exceptional progression.** Productive play should consistently advance an objective while preserving the possibility of an exceptional discovery.
- **Character identity.** Classes, attributes, equipment, and enhancements should support distinct, viable builds, including unconventional ones.
- **Meaningful decisions.** Preparation, resource allocation, equipment, and progression paths should involve understandable tradeoffs.
- **Economic purpose.** Gold, equipment, fish, and materials should have useful roles beyond immediate sale value.
- **Accomplishment and prestige.** Players should be able to recognize, measure, and demonstrate what they have achieved.
- **Respect for player time.** Players should return from desire, not obligation. Avoid unnecessary chores, punitive absence mechanics, and artificial restrictions.
- **Depth over breadth.** Deepen and connect existing systems before adding unrelated activities.
- **Incremental complexity.** Add a mechanic when it creates demonstrated gameplay value, not merely because another RPG has it.
- **Optimization as opportunity.** General-purpose builds should remain viable for ordinary content. Specialization and preparation may provide an advantage without requiring constant gear changes or attribute resets.

Automated combat is a defining constraint, not a missing feature. Combat depth should come primarily from preparation, character construction, attributes, equipment, passives, enemy characteristics, and clearly explained automatic effects. Drevan should not require active ability selection or real-time input to make builds meaningful.

## Progression pillars

1. **Character power** grows through levels, attributes, and combat effectiveness.
2. **Equipment** grows through acquisition, specialization, enhancement, and customization.
3. **Wealth** provides gold, resources, and long-term economic objectives.
4. **Discovery** rewards exploration, rare encounters, artifacts, and collections.
5. **Prestige** records personal bests, achievements, titles, and competition.

The pillars should reinforce one another without making every activity mandatory. Combat and exploration can produce equipment and resources; better equipment and deliberate builds open harder challenges; useful resources create economic choices; harder challenges produce discoveries and accomplishments; prestige makes that history visible. Alternative paths should let a player pursue the same broad objective through different parts of the game.

At any point, a player should ideally see objectives at several horizons: an immediate decision or reward, a short-term purchase or encounter, a medium-term build or exploration goal, and a long-term possession or accomplishment. New work should strengthen at least one horizon and, where practical, connect more than one progression pillar.

## Character and itemization direction

Equipment should support both vertical progression toward greater power and horizontal progression through stat distributions, specialized roles, and tradeoffs. A higher-level item need not invalidate every lower-level one. Merchant equipment provides a reliable baseline; PvE equipment should be more desirable, specialized, or occasionally exclusive; named equipment should carry an association with a boss, rare enemy, or discovery; enhancements and enchantments should make owned equipment worth investing in.

Near-term items should be handcrafted with deliberate, fixed modifiers. Progression tier, rarity, mechanical identity, and the quality of an individual copy are separate concepts. Procedural affixes are not a priority. Per-copy quality can remain exploratory and should not force individual equipment tracking before an actual enhancement, enchantment, or quality feature requires it.

Equipment may favor an attribute or class without rigid class restrictions. Useful tradeoffs include offense for Speed, offense for Defense and Fortitude, frequent attacks versus strong individual attacks, and unusual attribute requirements that invite alternative allocations. Players should have reasons to retain more than one useful piece, but ordinary play should not demand constant swapping.

The approved class identities are **Vanguard** (Strength; endurance and sustained combat), **Ranger** (Agility; precision and opening burst), and **Arcanist** (Intellect; escalating or sustained magical offense). Every class should continue to benefit from all offensive attributes, with stronger scaling from its preferred attribute. These names and identities are direction; the [roadmap](roadmap.md) must track any implementation migration and the gameplay references must continue to report the names actually shipped.

## World and economy direction

The Ruins should expand vertically. Permanent access to deeper floors should represent exploration progress, while temporary keys, sealed rooms, and discoveries can create choices within an expedition. Fixed encounter characteristics should let players return to old challenges and feel their growth; universal player-level scaling would undermine that recognition.

The Driftwater should become a supporting progression activity through environment, equipment, bait, targeted catches, and processing choices rather than grid movement. A simple Cast action can remain. Net casting should remain convenient for quick income, while future preparation can enable more targeted rewards.

Resource acquisition and consumption should arrive as small, complete loops. Selling, salvaging, fish processing, equipment enhancement, enchantment, and stronger encounters should give resources competing uses. Do not create a broad reagent catalog before those reagents have practical purposes, and do not make every valuable recipe require every activity. As items gain uses beyond sale, inventory protection and bulk-sale safety become part of the feature rather than optional polish.

## Accomplishment and competition

Foundational lifetime statistics and personal records should precede a broad achievements system. Record qualifying outcomes atomically with the gameplay event, distinguish practice from competitive PvP, and prevent repeated or stale submissions from duplicating progress. Draws are neither wins nor losses.

Practice PvP should help players compare builds without changing either character's persistent HP, gold, XP, or equipment. Rankings, competitive rewards, and player trading require stronger integrity controls and are later commitments. Achievements, titles, collections, and relic records can eventually turn personal history and discovery into visible prestige.

## Evaluating additions

Before expanding scope, ask:

- What desirable objective does this create or strengthen?
- How does productive play advance that objective?
- What decision, tradeoff, or character identity does it support?
- Which progression pillar does it deepen, and how does it connect to another?
- Does it respect optional play and the player's time?
- Can it be delivered as a small, understandable loop with reliable persistence?

Provisional values are useful for making a feature playable. Comprehensive numerical balance should follow enough equipment, class, enemy, and resource systems to make the comparison meaningful. Simulation can expose dominant strategies and edge cases, but it complements rather than replaces real sessions and player experience.
