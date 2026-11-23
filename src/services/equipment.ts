import { and, eq, gt, or } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";

type EquippedPlayer = Pick<
  typeof users.$inferSelect,
  | "id"
  | "strength"
  | "strengthPoints"
  | "defense"
  | "equippedWeaponId"
  | "equippedArmorId"
>;

/**
 * Identifies the slot that reserves one copy of this inventory stack.
 */
export function getEquippedSlot(
  player: Pick<EquippedPlayer, "equippedWeaponId" | "equippedArmorId">,
  item: Pick<typeof items.$inferSelect, "id" | "type">,
) {
  if (item.type === "weapon" && item.id === player.equippedWeaponId)
    return "weapon";
  if (item.type === "armor" && item.id === player.equippedArmorId)
    return "armor";
  return null;
}

/**
 * Loads owned gear bonuses for the equipped slots and returns combat stats.
 * Each slot contributes once, regardless of quantity. Pass the current
 * transaction to read equipment alongside other combat state.
 */
export function getEffectiveStats(
  player: EquippedPlayer,
  database: Pick<typeof db, "select"> = db,
) {
  const { equippedWeaponId, equippedArmorId } = player;

  if (equippedWeaponId === null && equippedArmorId === null) {
    return applyEquipmentBonuses(player, []);
  }

  const equipment = database
    .select({ effect: items.effect, effectValue: items.effectValue })
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

  return applyEquipmentBonuses(player, equipment);
}

/**
 * Adds point-funded Strength and bonuses from items already confirmed as equipped.
 */
export function applyEquipmentBonuses(
  player: Pick<EquippedPlayer, "strength" | "strengthPoints" | "defense">,
  equipment: Pick<typeof items.$inferSelect, "effect" | "effectValue">[],
) {
  const stats = {
    strength: player.strength + player.strengthPoints,
    defense: player.defense,
  };

  for (const { effect, effectValue } of equipment) {
    if (
      effectValue !== null &&
      (effect === "strength" || effect === "defense")
    ) {
      stats[effect] += effectValue;
    }
  }

  return stats;
}
