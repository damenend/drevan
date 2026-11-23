import { and, eq, gt, or } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import { getBaseAttackPower, getPrimaryAttributes } from "./character-stats";

type EquippedPlayer = Pick<
  typeof users.$inferSelect,
  | "id"
  | "strength"
  | "strengthPoints"
  | "agility"
  | "agilityPoints"
  | "intellect"
  | "intellectPoints"
  | "fortitude"
  | "fortitudePoints"
  | "speed"
  | "defense"
  | "equippedWeaponId"
  | "equippedArmorId"
>;

export const equipmentSlots = {
  weapon: "equippedWeaponId",
  armor: "equippedArmorId",
} as const;

/** Maps a catalog item type to its player equipment column. */
export function getEquipmentColumn(type: string) {
  if (type === "weapon" || type === "armor") return equipmentSlots[type];
  return null;
}

/**
 * Identifies the slot that reserves one copy of this inventory stack.
 */
export function getEquippedSlot(
  player: Pick<EquippedPlayer, "equippedWeaponId" | "equippedArmorId">,
  item: Pick<typeof items.$inferSelect, "id" | "type">,
) {
  if (item.type === "weapon" || item.type === "armor") {
    if (item.id === player[equipmentSlots[item.type]]) return item.type;
  }
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
 * Adds bonuses from confirmed equipment to Attack Power and Defense.
 * Speed comes directly from the player record.
 */
export function applyEquipmentBonuses(
  player: Omit<EquippedPlayer, "id" | "equippedWeaponId" | "equippedArmorId">,
  equipment: Pick<typeof items.$inferSelect, "effect" | "effectValue">[],
) {
  const stats = {
    attackPower: getBaseAttackPower(getPrimaryAttributes(player)),
    speed: player.speed,
    defense: player.defense,
  };

  for (const { effect, effectValue } of equipment) {
    if (
      effectValue !== null &&
      (effect === "attack_power" || effect === "defense")
    ) {
      const stat = effect === "attack_power" ? "attackPower" : effect;
      stats[stat] += effectValue;
    }
  }

  return stats;
}
