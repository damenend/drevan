import assert from "node:assert/strict";
import { test } from "node:test";
import { generateRuinsDiscoveries } from "../src/services/ruins-discoveries";
import {
  canMoveInRuins,
  RUINS_ENTRANCE,
  RUINS_NEXT_FLOOR,
  RUINS_SIZE,
} from "../src/services/ruins-map";

test("discovery placement samples distinct reachable non-reserved tiles", () => {
  const tiles = Array.from({ length: RUINS_SIZE ** 2 }, (_, tile) => tile);
  const reachable = new Set([RUINS_ENTRANCE]);
  for (const from of reachable) {
    for (const tile of tiles) {
      if (canMoveInRuins(from, tile)) reachable.add(tile);
    }
  }

  for (const roll of [0, 0.5, 0.999]) {
    const discoveries = generateRuinsDiscoveries(() => roll);
    assert.deepEqual(
      discoveries.map(({ id }) => id),
      ["gold-cache", "potion-cache"],
    );
    assert.equal(new Set(discoveries.map(({ tile }) => tile)).size, 2);
    for (const { claimed, tile } of discoveries) {
      assert.equal(claimed, false);
      assert.ok(reachable.has(tile));
      assert.notEqual(tile, RUINS_ENTRANCE);
      assert.notEqual(tile, RUINS_NEXT_FLOOR);
    }
  }
  assert.notDeepEqual(
    generateRuinsDiscoveries(() => 0),
    generateRuinsDiscoveries(() => 0.999),
  );
});
