import {
  getBaseAttackPower,
  getPrimaryAttributes,
  getSpentPoints,
} from "../../services/character-stats";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { and, eq, gt, asc } from "drizzle-orm";
import { db } from "../../db";
import { items, inventory } from "../../db/schema";
import {
  applyEquipmentBonuses,
  getEquippedSlot,
} from "../../services/equipment";

import arenaRouter from "./arena";
import hospitalRouter from "./hospital";
import storeRouter from "./store";
import adminRouter from "./admin";
import trainingRouter from "./training";
import inventoryRouter from "./inventory";
import usersRouter from "./users";
import fishingRouter from "./fishing";
import progressionRouter from "./progression";
import ruinsRouter from "./ruins";
import { getProgression, statAllocations } from "../../services/progression";

const router = Router();

// Require authentication for all game routes
router.use(requireAuth);
router.use("/ruins", ruinsRouter);

// An expedition permits only potion use and point allocation outside its router.
router.use((req, res, next) => {
  if (
    res.locals.user.ruinsTile !== null &&
    !(
      req.method === "POST" &&
      /^\/(inventory\/use|progression)\/?$/i.test(req.path)
    )
  ) {
    return res.redirect(
      303,
      "/game/ruins?message=Leave+The+Ruins+to+visit+Nexaris+locations.",
    );
  }
  next();
});

// Game homepage
router.get("/", (req, res) => {
  const player = res.locals.user;

  const playerInventory = db
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      image: items.image,
      type: items.type,
      quantity: inventory.quantity,
      effect: items.effect,
      effectValue: items.effectValue,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.userId, player.id), gt(inventory.quantity, 0)))
    .orderBy(asc(items.name))
    .all()
    .map((item) => {
      const equippedSlot = getEquippedSlot(player, item);
      return {
        ...item,
        equippedSlot,
        quantity: item.quantity - Number(equippedSlot !== null),
      };
    });

  const attributes = getPrimaryAttributes(player);
  const equipped = playerInventory.filter((item) => item.equippedSlot);

  return res.render("game/index", {
    title: "The Quarters",
    equipped,
    inventory: playerInventory.filter((item) => item.quantity > 0),
    effectiveStats: applyEquipmentBonuses(player, equipped),
    attributes,
    baseAttackPower: getBaseAttackPower(attributes),
    progression: getProgression(player.exp, getSpentPoints(player)),
    statAllocations,
    message:
      typeof req.query.message === "string" ? req.query.message : undefined,
  });
});

// Location directory
router.get("/nexaris", (req, res) => {
  const latestBattle = req.session.ruinsBattle;
  const battle =
    latestBattle && latestBattle.enemyHp > 0 ? latestBattle : undefined;
  if (battle) delete req.session.ruinsBattle;
  return res.render("game/nexaris", {
    title: "Nexaris",
    battle,
    message:
      typeof req.query.message === "string" ? req.query.message : undefined,
  });
});

// Lore library
router.get("/reliquary", (_req, res) => {
  return res.render("game/reliquary", { title: "The Reliquary" });
});

// Game locations
router.use("/arena", arenaRouter);
router.use("/training", trainingRouter);
router.use("/hospital", hospitalRouter);
router.use("/store", storeRouter);
router.use("/admin", adminRouter);
router.use("/inventory", inventoryRouter);
router.use("/users", usersRouter);
router.use("/fishing", fishingRouter);
router.use("/progression", progressionRouter);

export default router;
