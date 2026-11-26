import { getEquipmentColumn } from "../services/equipment";
import { formatNumber } from "../utils/format-number";

export const inventoryCategories = {
  all: "All items",
  equipment: "Equipment",
  weapon: "Weapons",
  armor: "Armor",
  consumables: "Consumables",
  fish: "Fish",
  materials: "Materials",
  other: "Other",
} as const;

type ItemCategory = keyof typeof inventoryCategories;

/** Resolves the requested category against the filters available on this page. */
export function getInventoryCategory(
  value: unknown,
  categories: Partial<Record<ItemCategory, string>> = inventoryCategories,
): ItemCategory {
  return typeof value === "string" && Object.hasOwn(categories, value)
    ? (value as keyof typeof inventoryCategories)
    : "all";
}

/** Groups supported gear slots under Equipment and unrecognized types under Other. */
function getItemCategory(type: string) {
  if (getEquipmentColumn(type)) return "equipment";
  if (type === "consumable") return "consumables";
  if (type === "fish") return "fish";
  if (type === "material") return "materials";
  return "other";
}

/** Checks both grouped categories and individual equipment slots. */
export function matchesItemCategory(type: string, category: ItemCategory) {
  return (
    category === "all" ||
    category === type ||
    getItemCategory(type) === category
  );
}

const itemEffectLabels = {
  attack_power: "Attack Power",
  defense: "Defense",
  heal: "Restore HP",
  revive: "Revive",
} as const;

export function getItemEffectLabel(effect: string | null) {
  if (effect === null) return "—";
  return Object.hasOwn(itemEffectLabels, effect)
    ? itemEffectLabels[effect as keyof typeof itemEffectLabels]
    : effect;
}

/**
 * Formats a catalog effect and supplies its signed stat modifier for styling.
 * Consumable effects have no stat modifier. Unset or unsupported effects
 * return null.
 */
export function describeItemEffect(
  effect: string | null,
  value: number | null,
) {
  if (value === null) return null;
  if (effect === "heal") {
    return { text: `Restores ${formatNumber(value)} HP`, modifier: 0 };
  }
  if (effect === "revive" && value === 1) {
    return { text: "Revives with 1 HP (requires 0 HP)", modifier: 0 };
  }
  if (effect !== "attack_power" && effect !== "defense") return null;

  const label = itemEffectLabels[effect];
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return {
    text: `${sign}${formatNumber(Math.abs(value))} ${label}`,
    modifier: value,
  };
}
