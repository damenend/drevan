import type { Request, Response } from "express";
import { getAuthenticatedPlayer } from "../../middleware/auth";
import {
  describeItemEffect,
  getInventoryCategory,
  inventoryCategories,
  matchesItemCategory,
} from "../../presentation/items";
import {
  getBaseAttackPower,
  getPrimaryAttributes,
  getSpentPoints,
} from "../../services/character-stats";
import {
  applyEquipmentBonuses,
  equipmentSlots,
  getEquipmentColumn,
  getStackAvailability,
} from "../../services/equipment";
import { getPlayerInventory } from "../../services/inventory";
import { getProgression, getStatAllocations } from "../../services/progression";

function getInventoryAction(item: {
  type: string;
  equippedSlot: string | null;
}) {
  if (item.type === "consumable") return "Use";
  if (!item.equippedSlot && getEquipmentColumn(item.type)) return "Equip";
  return null;
}

export function renderQuarters(req: Request, res: Response) {
  const player = getAuthenticatedPlayer(res);

  const playerInventory = getPlayerInventory(player.id).map((item) => ({
    ...item,
    ...getStackAvailability(player, item),
  }));

  const attributes = getPrimaryAttributes(player);
  const equipped = playerInventory.filter((item) => item.equippedSlot);

  const category = getInventoryCategory(req.query.category);
  const available = playerInventory.filter((item) => item.available > 0);

  return res.render("game/index", {
    title: "The Quarters",
    level: getProgression(player.exp).level,
    equipment: Object.keys(equipmentSlots).map((slot) => ({
      slot,
      item: equipped.find((item) => item.equippedSlot === slot),
    })),
    inventory: available
      .filter((item) => matchesItemCategory(item.type, category))
      .map((item) => ({ ...item, action: getInventoryAction(item) })),
    inventoryEmpty: available.length === 0,
    inventoryCategories,
    category,
    actionQuery: category === "all" ? "" : `?category=${category}`,
    describeItemEffect,
    effectiveStats: applyEquipmentBonuses(player, equipped),
    attributes,
    baseAttackPower: getBaseAttackPower({
      ...attributes,
      characterClass: player.characterClass,
    }),
    progression: getProgression(player.exp, getSpentPoints(player)),
    statAllocations: getStatAllocations(player.characterClass),
    message:
      typeof req.query.message === "string" ? req.query.message : undefined,
  });
}
