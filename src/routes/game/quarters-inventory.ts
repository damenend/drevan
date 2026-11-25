import { getEquipmentColumn } from "../../services/equipment";
import { formatNumber } from "../../utils/format-number";

export const inventoryCategories = {
  all: "All items",
  equipment: "Equipment",
  consumables: "Consumables",
  fish: "Fish",
  other: "Other",
} as const;

/** Resolves a category query value, falling back to All items for missing or unknown values. */
export function getInventoryCategory(value: unknown) {
  return typeof value === "string" && Object.hasOwn(inventoryCategories, value)
    ? (value as keyof typeof inventoryCategories)
    : "all";
}

/** Groups supported gear slots under Equipment and unrecognized types under Other. */
export function getItemCategory(type: string) {
  if (getEquipmentColumn(type)) return "equipment";
  if (type === "consumable") return "consumables";
  if (type === "fish") return "fish";
  return "other";
}

/**
 * Formats a catalog effect and supplies its signed stat modifier for styling.
 * Healing has no stat modifier. Unset or unsupported effects return null.
 */
export function describeItemEffect(
  effect: string | null,
  value: number | null,
) {
  if (value === null) return null;
  if (effect === "heal") {
    return { text: `Restores ${formatNumber(value)} HP`, modifier: 0 };
  }
  if (effect !== "attack_power" && effect !== "defense") return null;

  const label = effect === "attack_power" ? "Attack Power" : "Defense";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return {
    text: `${sign}${formatNumber(Math.abs(value))} ${label}`,
    modifier: value,
  };
}
