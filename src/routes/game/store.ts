import { Router, type Response } from "express";
import { getAuthenticatedPlayer } from "../../middleware/auth";
import { renderError } from "../../middleware/errors";
import {
  getInventoryCategory,
  getItemEffectLabel,
  inventoryCategories,
  matchesItemCategory,
} from "../../presentation/items";
import {
  buyEmporiumItems,
  getEmporiumItems,
  sellEmporiumItems,
  type ItemSelection,
} from "../../services/emporium";
import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

const purchaseCategories = {
  all: inventoryCategories.all,
  equipment: inventoryCategories.equipment,
  weapon: inventoryCategories.weapon,
  armor: inventoryCategories.armor,
  consumables: inventoryCategories.consumables,
};

const purchaseErrors = {
  gold: "You do not have enough gold.",
  quantity: "Enter a whole quantity of at least 1 for an item you want to buy.",
  invalid:
    "This purchase could not be completed. Check the items and quantities and try again.",
};

const saleGoldLimitMessage = "This sale would exceed the supported gold limit.";

// Store page
router.get("/", (req, res) => {
  const player = getAuthenticatedPlayer(res);
  const { purchaseItems, ...salePreview } = getEmporiumItems(player);
  const category = getInventoryCategory(req.query.category, purchaseCategories);
  const error = req.query.err;
  const purchaseError =
    typeof error === "string" && Object.hasOwn(purchaseErrors, error)
      ? purchaseErrors[error as keyof typeof purchaseErrors]
      : undefined;

  return res.render("game/store", {
    title: "Curious Emporium",
    purchaseItems: purchaseItems.filter((item) =>
      matchesItemCategory(item.type, category),
    ),
    category,
    purchaseCategories,
    ...salePreview,
    getItemEffectLabel,
    purchaseGoldLimit: player.gold,
    purchaseGoldLimitMessage: purchaseErrors.gold,
    saleGoldLimit: Number.MAX_SAFE_INTEGER - player.gold,
    saleGoldLimitMessage,
    sold: req.query.sold === "1",
    emptySale: req.query.sold === "empty",
    purchased: req.query.purchased === "1",
    purchaseError,
  });
});

/**
 * Reads the quantity fields shared by the purchase and sale forms.
 * Blank and zero quantities leave an item out of the transaction.
 */
function parseItemSelection(requestedItems: unknown) {
  if (
    !requestedItems ||
    typeof requestedItems !== "object" ||
    Array.isArray(requestedItems)
  ) {
    return null;
  }

  const selectedItems: ItemSelection[] = [];

  for (const [field, value] of Object.entries(requestedItems)) {
    const itemId = parseFormInteger(/^item-([1-9]\d*)$/.exec(field)?.[1]);
    const quantity = value === "" ? 0 : parseFormInteger(value);

    if (itemId === null || quantity === null) {
      return null;
    }

    if (quantity > 0) {
      selectedItems.push({ itemId, quantity });
    }
  }

  return selectedItems;
}

// Purchase items
router.post("/", (req, res) => {
  const category = getInventoryCategory(req.query.category, purchaseCategories);
  const redirectToPurchase = (feedback: Record<string, string>) => {
    const query = new URLSearchParams(feedback);
    if (category !== "all") query.set("category", category);
    return res.redirect(303, `/game/store?${query}`);
  };
  const selectedItems = parseItemSelection(req.body?.items);

  if (!selectedItems?.length) {
    return redirectToPurchase({ err: "quantity" });
  }

  const result = buyEmporiumItems(
    getAuthenticatedPlayer(res).id,
    selectedItems,
  );

  return redirectToPurchase(
    result === "success" ? { purchased: "1" } : { err: result },
  );
});

// Both sale routes use the same validation and feedback.
function sellItems(res: Response, selection: ItemSelection[] | "all" | null) {
  if (selection !== "all" && !selection?.length) {
    return renderError(res, 400, {
      message:
        "Enter a whole quantity of at least 1 for an item you want to sell.",
    });
  }

  const userId = getAuthenticatedPlayer(res).id;
  const result = sellEmporiumItems(userId, selection);

  switch (result) {
    case "unavailable":
      return renderError(res, 409, {
        message:
          "You do not own that quantity of an item Curious Emporium buys.",
      });
    case "equipped":
      return renderError(res, 409, {
        message: "That quantity includes your equipped copy.",
        recoveryLink: {
          href: "/game#equipped",
          label: "Unequip in The Quarters",
        },
      });
    case "overflow":
      return renderError(res, 409, {
        message: saleGoldLimitMessage,
      });
    case "empty":
      return res.redirect(303, "/game/store?sold=empty#sale-result");
    case "sold":
      return res.redirect(303, "/game/store?sold=1#sale-result");
  }
}

router.post("/sell", (req, res) =>
  sellItems(res, parseItemSelection(req.body?.items)),
);
router.post("/sell-all", (_req, res) => sellItems(res, "all"));

export default router;
