# Combat

Dominion training and The Ruins share a turn-based simulator. The server resolves the fight after one action and returns a structured log showing the actor, damage, target HP, and critical-hit flag. Each encounter mode defines the rewards and saves the relevant player state. Practice PvP is planned separately.

## Resolve attacks

1. Treat Speed below 1 as 1. Pick the first attacker once. Each side's chance is its share of combined Speed.
2. Schedule attacks at intervals of `100 / speed`. Later attacks due together use an even roll for order. The second fighter attacks if they survive.
3. Roll base damage uniformly from half Attack Power rounded up to full Attack Power, with a minimum of 1. A critical hit has a baseline 5% chance and multiplies damage by 1.5, rounded up.
4. Apply Defense after the critical bonus. For nonnegative Defense, the damage reduction is `0.6 * defense / (defense + 10)`. Round the result to the nearest integer with a minimum of 1. A 4-damage roll still deals 4 at 1 or 2 Defense and deals 3 at 3 Defense.
5. End the fight at zero HP or after 1,000 attacks. If both fighters survive the cap, record a draw.

## Dominion training

Start with positive HP. The form defaults to level 1 for a missing or invalid selection and accepts levels 1 through `MAX_TRAINING_LEVEL` (currently 100). At level `L`, a dummy has `10 + 5 * (L - 1)` HP, `L + 1` Attack Power, `L + 1` Speed, and `floor(L / 4)` Defense.

Training keeps remaining HP on every outcome. A win grants `10 * L` gold and XP, each limited to what fits in its balance up to JavaScript's maximum safe integer. Losses and draws grant zero. The result appears once after redirect. For threats with their own rewards or exit rules, see [The Ruins](ruins.md).

[Simulator and dummy definition](../../src/services/battle.ts) · [Training persistence](../../src/services/training.ts) · [Battle tests](../../tests/battle.test.ts) · [Playtesting](../planning/playtesting.md)
