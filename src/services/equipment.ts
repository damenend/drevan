import { and, eq, gt, or } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";

type EquippedPlayer = Pick<
  typeof users.$inferSelect,
  "id" | "strength" | "defense" | "equippedWeaponId" | "equippedArmorId"
>;

/**
 * Returns base Strength and Defense plus bonuses from owned gear in the
 * matching equipment slots. Each slot contributes once, regardless of quantity.
 */
export function getEffectiveStats(player: EquippedPlayer) {
  const stats = { strength: player.strength, defense: player.defense };
  const { equippedWeaponId, equippedArmorId } = player;

  if (equippedWeaponId === null && equippedArmorId === null) {
    return stats;
  }

  const equipment = db
    .select({ effect: items.effect, value: items.effectValue })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(
      and(
        eq(inventory.userId, player.id),
        gt(inventory.quantity, 0),
        or(
          equippedWeaponId === null
            ? undefined
            : and(eq(items.id, equippedWeaponId), eq(items.type, "weapon")),
          equippedArmorId === null
            ? undefined
            : and(eq(items.id, equippedArmorId), eq(items.type, "armor")),
        ),
      ),
    )
    .all();

  for (const { effect, value } of equipment) {
    if (value !== null && (effect === "strength" || effect === "defense")) {
      stats[effect] += value;
    }
  }

  return stats;
}
