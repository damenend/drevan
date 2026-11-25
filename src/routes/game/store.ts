import { Router } from "express";
import { getAuthenticatedPlayer } from "../../middleware/auth";
import { renderError } from "../../middleware/errors";
import {
  buyEmporiumItems,
  getEmporiumItems,
  sellEmporiumItems,
  type ItemSelection,
} from "../../services/emporium";
import { parseFormInteger } from "../../utils/parse-form-integer";

const router = Router();

// Store page
router.get("/", (req, res) => {
  const { storeItems, sellableItems } = getEmporiumItems(
    getAuthenticatedPlayer(res),
  );

  const errorMessage =
    req.query.err === "gold" ? "You do not have enough gold." : undefined;

  return res.render("game/store", {
    title: "Curious Emporium",
    items: storeItems,
    sellableItems,
    sold: req.query.sold === "1",
    err: errorMessage,
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
  const selectedItems = parseItemSelection(req.body?.items);

  if (!selectedItems?.length) {
    return res.redirect("/game/store");
  }

  const result = buyEmporiumItems(
    getAuthenticatedPlayer(res).id,
    selectedItems,
  );

  // Redirect with an error if the player lacks gold
  if (result === "gold") {
    return res.redirect("/game/store?err=gold");
  }

  return res.redirect("/game/store");
});

// Sell the selected items together.
router.post("/sell", (req, res) => {
  const selectedItems = parseItemSelection(req.body?.items);
  if (!selectedItems?.length) {
    return renderError(res, 400, {
      message:
        "Enter a whole quantity of at least 1 for an item you want to sell.",
    });
  }

  const userId = getAuthenticatedPlayer(res).id;
  const result = sellEmporiumItems(userId, selectedItems);

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
        message: "This sale would exceed the supported gold limit.",
      });
    case "sold":
      return res.redirect(303, "/game/store?sold=1#sell");
  }
});

export default router;
