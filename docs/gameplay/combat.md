# Combat

Dominion training and The Ruins share a turn-based simulator. The server resolves the fight after one action and records the attacker, target, damage, remaining target HP, critical-hit flag, and any [class passive](character.md#class-passives) effects. The combat ledger shows the chronological attacks, final damage, and modifiers. Each encounter mode defines the rewards and saves the relevant player state. Practice PvP is planned separately.

## Resolve attacks

1. Treat Speed below 1 as 1. Pick the first attacker once. Each side's chance is its share of combined Speed.
2. Schedule attacks at intervals of `100 / speed`. Later attacks due together use an even roll for order. The second fighter attacks if they survive.
3. Roll base damage uniformly from half Attack Power rounded up to full Attack Power, with a minimum of 1. Roll once for a critical hit against the baseline 5% chance plus any Precision bonus. A critical hit multiplies damage by 1.5, rounded up.
4. Roll Arcane Surge once for an attacker with that passive. On success, increase the same attack's damage after any critical bonus. The extra damage is part of the original hit.
5. Apply Defense. For nonnegative Defense, the damage reduction is `0.6 * defense / (defense + 10)`. Round the result to the nearest integer with a minimum of 1. A 4-damage roll still deals 4 at 1 or 2 Defense and deals 3 at 3 Defense. Apply the defender's Iron Resolve to this rounded amount, then round again with the same minimum.
6. End the fight at zero HP or after 1,000 attacks. If both fighters survive the cap, record a draw.

The battle log reports Precision when its bonus turns the roll into a critical hit. It reports Iron Resolve and Arcane Surge when they change final rounded damage and gives the difference in damage.

## Dominion training

Start with positive HP. The form defaults to level 1 for a missing or invalid selection and accepts levels 1 through `MAX_TRAINING_LEVEL` (currently 100). At level `L`, a dummy has `10 + 5 * (L - 1)` HP, `L + 1` Attack Power, `L + 1` Speed, and `floor(L / 4)` Defense.

Training keeps remaining HP on every outcome. A win grants `10 * L` gold and XP, each limited to what fits in its balance up to JavaScript's maximum safe integer. Losses and draws grant zero. The result appears once after redirect. For threats with their own rewards or exit rules, see [The Ruins](ruins.md).

Dominion shows current HP, level progress, and effective equipment-aware combat stats before training. After a fight, it reloads those values before showing the one-time result. At 0 HP, the training action is unavailable and Dominion directs the player to revival at Sanctum.

[Simulator and dummy definition](../../src/services/battle.ts) · [Training persistence](../../src/services/training.ts) · [Battle tests](../../tests/battle.test.ts) · [Playtesting](../planning/playtesting.md)
