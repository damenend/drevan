import { Router, type Request, type Response } from "express";
import { getAuthenticatedPlayer } from "../../middleware/auth";
import { getInventoryCategory } from "../../presentation/items";
import {
  equipInventoryItem,
  unequipInventoryItem,
  useInventoryItem,
} from "../../services/inventory";
import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

const equipMessages = {
  missing: "You do not have that item in your inventory.",
  unsupported: "This item cannot be equipped.",
  "in-expedition": "Leave The Ruins to change equipment.",
  equipped: "Item equipped.",
};

const unequipMessages = {
  missing: "Item is not equipped.",
  changed: "Equipment changed. Try again outside The Ruins.",
  unequipped: "Item unequipped.",
};

/** Returns to the expedition or the current Quarters inventory category. */
function redirectToInventory(req: Request, res: Response, message?: string) {
  const inRuins = getAuthenticatedPlayer(res).ruinsTile !== null;
  const path = inRuins ? "/game/ruins" : "/game";
  const category = getInventoryCategory(req.query.category);
  const query = [
    message && `message=${encodeURIComponent(message)}`,
    !inRuins && category !== "all" && `category=${category}`,
  ]
    .filter(Boolean)
    .join("&");
  return res.redirect(query ? `${path}?${query}` : path);
}

router.post("/use", (req, res) => {
  const itemId = parseFormInteger(req.body?.itemId);
  if (!itemId) return redirectToInventory(req, res);

  const result = useInventoryItem(getAuthenticatedPlayer(res).id, itemId);
  return redirectToInventory(
    req,
    res,
    result?.message ?? "This item had no effect.",
  );
});

router.post("/equip", (req, res) => {
  const itemId = parseFormInteger(req.body?.itemId);
  if (!itemId) return redirectToInventory(req, res, "Invalid item.");

  const result = equipInventoryItem(getAuthenticatedPlayer(res).id, itemId);
  return redirectToInventory(req, res, equipMessages[result]);
});

router.post("/unequip", (req, res) => {
  const itemId = parseFormInteger(req.body?.itemId);
  if (!itemId) return redirectToInventory(req, res, "Invalid item.");

  const result = unequipInventoryItem(getAuthenticatedPlayer(res), itemId);
  return redirectToInventory(req, res, unequipMessages[result]);
});

export default router;
