import { and, eq, gt, or } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import {
  getBaseAttackPower,
  getPrimaryAttributes,
  MAX_ATTACK_POWER,
} from "./character-stats";

export const equipmentSlots = {
  weapon: "equippedWeaponId",
  armor: "equippedArmorId",
} as const;

type EquipmentSlot = keyof typeof equipmentSlots;
export type EquipmentOwner = Pick<
  typeof users.$inferSelect,
  (typeof equipmentSlots)[EquipmentSlot]
>;

type EquippedPlayer = EquipmentOwner &
  Pick<
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
  >;

function isEquipmentSlot(type: string): type is EquipmentSlot {
  return Object.hasOwn(equipmentSlots, type);
}

/** Maps a catalog item type to its player equipment column. */
export function getEquipmentColumn(type: string) {
  return isEquipmentSlot(type) ? equipmentSlots[type] : null;
}

/** Identifies the equipped copy and counts the remaining copies in an owned stack. */
export function getStackAvailability(
  player: EquipmentOwner,
  item: Pick<typeof items.$inferSelect, "id" | "type"> & { quantity: number },
) {
  const { id, type, quantity } = item;
  const equippedSlot =
    isEquipmentSlot(type) && id === player[equipmentSlots[type]] ? type : null;
  return { equippedSlot, available: quantity - Number(equippedSlot !== null) };
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

  return {
    ...stats,
    attackPower: Math.min(MAX_ATTACK_POWER, stats.attackPower),
  };
}
