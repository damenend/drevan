import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { eq, asc } from "drizzle-orm";
import { db } from "../../db";
import { items, inventory } from "../../db/schema";

import arenaRouter from "./arena";
import hospitalRouter from "./hospital";
import storeRouter from "./store";
import adminRouter from "./admin";
import trainingRouter from "./training";
import inventoryRouter from "./inventory";

const router = Router();

// Require authentication for all game routes
router.use(requireAuth);

// Game homepage
router.get("/", (req, res) => {
  const player = res.locals.user;

  console.log({
    equippedWeaponId: player.equippedWeaponId,
    equippedArmorId: player.equippedArmorId,
  });

  const playerInventory = db
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      image: items.image,
      type: items.type,
      quantity: inventory.quantity,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(eq(inventory.userId, player.id))
    .orderBy(asc(items.name))
    .all();

  return res.render("game/index", {
    title: "Home",
    inventory: playerInventory,
    message:
      typeof req.query.message === "string" ? req.query.message : undefined,
  });
});

// Game locations
router.use("/arena", arenaRouter);
router.use("/training", trainingRouter);
router.use("/hospital", hospitalRouter);
router.use("/store", storeRouter);
router.use("/admin", adminRouter);
router.use("/inventory", inventoryRouter);

export default router;
