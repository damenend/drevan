# Open design questions

Use this reference for unresolved gameplay decisions and candidate values. The [roadmap](roadmap.md) tracks milestone scope and the [gameplay references](../gameplay/README.md) describe established rules.

## Basic progression

- How should future encounter modes award XP, and does the current per-level cost still fit now that Floor 1 expeditions award XP?
- Should Defense be directly allocatable? How should point costs and gains fit future class attributes and Artificer refunds?

## Combat and PvP

- How should offensive and defensive stats compare at similar investment? Which builds trade enough for their strengths?
- How much of Speed's value should come from initiative versus attack frequency? Does fighter position affect later turns, and what should change after classes and gear modifiers are tested?
- Which fights should qualify for drops, contracts, competitive records, or titles? Would opt-in stakes improve duels?

- What observed problem would justify a PvP-only rule? Which rules must stay shared, how should differences be shown, and when should a capped fight count as a draw?

## Named NPCs

- How should boss difficulty compare with a training dummy? Should recommended levels be advisory, and should direct challenges require a bounty?
- What rewards justify the challenge, and how would repeat victories affect the economy? When would the NPC catalog benefit from database-backed definitions?

## Triggered equipment effects

- Which events qualify, including attempted attacks, successful hits, critical hits, incoming damage, or HP thresholds? How should critical hits interact with bonus damage?
- Can multiple effects activate on one action or trigger each other? If faster builds gain too many rolls, which adjustment preserves the item’s role?

## Temporary combat effects

- What counts toward duration, and should Poison tick before or after the affected fighter acts? How should the log and result handle a lethal tick?
- Which effects should stack, what limits make sense, and how should effects resolve when a fight hits the attack cap?

## Exploration

- How should deeper floors change difficulty, and how far will players push before returning to the entrance or using the Recall Beacon?
- What rewards make expeditions worth choosing over another training fight? The [current discovery rules](../gameplay/ruins.md#exploration-discoveries) implement the split limits tested in the [historical cache trial](../audits/balance-playtests.md#floor-1-live-cache-trial). Will players restart trips solely to stock potions, and would that change the value of Scavenger drops?

- After enemy and stair markers are reduced, how will players orient themselves and recognize discoveries? Compare narrow-screen and keyboard flows.
- At an enemy tile, how should current HP, enemy details, choices, and map compete for space? Can players find the result, remaining HP, and full log before resuming?
- How visible should normal exit and Recall be beside healing controls? Can players distinguish both from automatic return after defeat or a draw?

## Equipment and rarity

Base equipment has fixed, deliberately designed attributes. Progression tiers and rarity are separate concepts. Attribute preferences can vary by class or build, and universal equipment should remain viable. Future specialized gear may favor particular builds while remaining available across classes. Enchantments may eventually let players choose how to customize attributes. The current design leaves randomized modifiers and mandatory per-class gear variants out of scope.

- Do visible quality tiers help? Should category, quality, source, or enhancement level affect salvage yields?
- Should every salvage grant materials? Should higher-quality pieces guarantee uncommon rewards? Should previews show exact yields and odds?
- Should salvaging ever be available outside The Forge? How should inventory present stacked gear alongside several modified copies of the same item?

## Enchantments

- Should removal be free or carry a small fee? Should the enchantment name appear as an item prefix?
- Which slots accept each enchantment? Should recipes have class, level, or equipment requirements? Should any ingredients come only from The Ruins?
- How should bonuses scale with gear quality and player level?

## Economy

- How quickly should materials accumulate, and what makes a recipe worth its gathering time and gold cost?
- Would Curious Emporium benefit from a dedicated material-selling view? What keeps gold useful at higher levels?

## Provisional values and examples

- **Combat and progression.** A candidate Speed curve uses the current minimum and applies diminishing returns above 5 with `5 * sqrt(Speed / 5)`. A future class bonus could add extra Attack Power from the preferred attribute on top of the class-neutral sum. Revisit the starter attribute spread after the current progression and expedition playtests.
- **Material expansion.** Worn Components are salvaged device parts for mechanical or Speed effects. Beast Essence could support Strength or HP, Arcane Fragments Intellect, Ether Dust Speed or magic, and Reinforced Alloy Defense. Metal Scraps suit physical bonuses, Enchantment Powder binds recipes, and Power Cells could power physical or magical effects. Ancient Mechanisms, Void Crystals, Primal Essence, and Resonance Cores could come from dangerous expeditions or powerful enemies. Match salvage to the gear, such as alloy from heavy armor, Beast Essence from leather, Arcane Fragments from magical weapons, and Power Cells from technological items.
- **First enchantment candidates.** Mighty increases Strength, Arcane increases Intellect, Agile increases Agility, Swift increases Speed, Fortified increases Defense, and Vital increases max HP. Minor Might, Mighty, and Greater Might illustrate possible tiers.
- **Contract and title examples.** Supply the Settlement originally asked for three fish. A title could recognize 1,000 training wins or 1,000 qualifying PvP wins, with a possible earlier milestone at 100. Revisit thresholds once repeated matchups and actual play frequency can be measured.
