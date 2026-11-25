# Activities in Nexaris

Nexaris at `/game/nexaris` is the signed-in location directory. Start at [The Quarters](character.md) to prepare, then choose [Dominion](combat.md), [the Emporium or Sanctum](economy.md), The Driftwater, or [The Ruins](ruins.md). [The Reliquary](../../src/views/game/reliquary.ejs) preserves Drevan's lore. [The Registry](../../src/routes/game/users.ts) at `/game/users` lists players and links to their profiles.

## The Driftwater

Players can cast 50 times per day. The allowance resets at midnight in `America/Chicago`, the same calendar used by the Recall Beacon. Empty casts count.

Each cast has an 80% chance of a bite. On a bite, a second roll picks Murkfin (70%), Glassscale (25%), or Astral Koi (5%). A catch adds one owned fish and saves the spent cast in the same transaction. A full stack releases the fish and still spends the cast. Fishing and Ruins discoveries use the same stack-limit rule.

The result appears once after redirect. Owned fish can be sold at Curious Emporium when they have a positive catalog sell price.

[Fishing rules](../../src/services/fishing.ts) · [Cast transaction](../../src/services/fishing-cast.ts) · [Central date helper](../../src/utils/game-date.ts) · [Roll tests](../../tests/fishing.test.ts) · [Route tests](../../tests/game-routes.test.ts)
