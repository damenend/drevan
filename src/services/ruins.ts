import { and, eq, gt, inArray, or } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import { formatNumber } from "../utils/format-number";
import { getGameDate } from "../utils/game-date";
import {
  discoveryDefinitions,
  generateRuinsDiscoveries,
  getRuinsDiscovery,
} from "./ruins-discoveries";
import { rollRuinsLoot } from "./ruins-loot";
import { grantInventoryItem } from "./inventory";
import { resolvePlayerBattle, type PlayerBattleReport } from "./player-battle";
import {
  canMoveInRuins,
  getRuinsEncounter,
  RECALL_BEACON,
  RUINS_ENTRANCE,
} from "./ruins-map";

type RuinsAction =
  | { kind: "move"; destination: number }
  | { kind: "enter" | "exit" | "recall" | "engage" | "ignore" };

export type RuinsBattle = PlayerBattleReport & {
  enemyName: string;
  loot: { name: string; quantity: number }[];
};

type ActionResult = {
  message?: string;
  left?: boolean;
  battle?: RuinsBattle;
};

/**
 * Lists owned healing potions in order of HP restored and reports Beacon
 * ownership. The caller checks the daily cooldown separately.
 */
export function getRuinsSupplies(userId: number) {
  const owned = db
    .select({
      id: items.id,
      name: items.name,
      type: items.type,
      effect: items.effect,
      image: items.image,
      quantity: inventory.quantity,
    })
    .from(inventory)
    .innerJoin(items, eq(items.id, inventory.itemId))
    .where(
      and(
        eq(inventory.userId, userId),
        gt(inventory.quantity, 0),
        or(
          and(eq(items.name, RECALL_BEACON), eq(items.type, "utility")),
          and(eq(items.type, "consumable"), eq(items.effect, "heal")),
        ),
      ),
    )
    .orderBy(items.effectValue, items.name)
    .all();
  return {
    hasBeacon: owned.some(
      ({ name, type }) => name === RECALL_BEACON && type === "utility",
    ),
    potions: owned.filter(
      ({ type, effect }) => type === "consumable" && effect === "heal",
    ),
  };
}

/**
 * Applies one exploration form to the saved expedition. An already used form
 * has an older revision, even if the player has returned to the same square.
 * The immediate transaction checks this revision before making any writes.
 */
export function actInRuins(
  userId: number,
  revision: number,
  action: RuinsAction,
): ActionResult {
  return db.transaction(
    (tx): ActionResult => {
      const player = tx.select().from(users).where(eq(users.id, userId)).get();
      if (!player || player.ruinsRevision !== revision) {
        return {
          message:
            "Your expedition has moved on. Choose an action from the current map.",
        };
      }

      // Every successful action invalidates the forms for the previous state.
      const changes: Partial<typeof users.$inferInsert> = {
        ruinsRevision: revision + 1,
      };
      let result: ActionResult = {};
      const position = player.ruinsTile;
      if (action.kind === "enter") {
        if (position !== null)
          return { message: "Your expedition is already underway." };
        if (player.hp <= 0)
          return { message: "Visit Sanctum to heal before entering." };
        const beacon = tx
          .select({ id: items.id })
          .from(items)
          .where(and(eq(items.name, RECALL_BEACON), eq(items.type, "utility")))
          .get();
        if (!beacon)
          return { message: "Expedition supplies are currently unavailable." };
        const grant = tx
          .insert(inventory)
          .values({ userId, itemId: beacon.id })
          .onConflictDoNothing({ target: [inventory.userId, inventory.itemId] })
          .run();
        changes.ruinsTile = RUINS_ENTRANCE;
        changes.ruinsDiscoveries = generateRuinsDiscoveries();
        changes.ruinsEnemyPending = false;
        if (grant.changes) result.message = "You receive a Recall Beacon.";
      } else {
        if (position === null)
          return { message: "Enter The Ruins to begin exploring." };

        switch (action.kind) {
          case "move": {
            const destination = action.destination;
            if (!canMoveInRuins(position, destination)) {
              return { message: "Choose a square directly beside you." };
            }
            changes.ruinsTile = destination;
            changes.ruinsEnemyPending = Boolean(getRuinsEncounter(destination));
            const discovery = getRuinsDiscovery(
              player.ruinsDiscoveries,
              destination,
            );
            if (!discovery) break;

            const definition = discoveryDefinitions[discovery.id];
            const { description } = definition;
            if (discovery.claimed) {
              result.message = `${description} You already collected this cache.`;
              break;
            }

            if (definition.kind === "gold") {
              const today = getGameDate();
              if (player.ruinsGoldClaimDate === today) {
                result.message = `${description} You can claim another gold cache after midnight Central time.`;
                break;
              }
              const awarded = Math.min(
                definition.amount,
                Number.MAX_SAFE_INTEGER - player.gold,
              );
              if (awarded <= 0) {
                result.message = `${description} You cannot carry any more gold.`;
                break;
              }
              changes.gold = player.gold + awarded;
              changes.ruinsGoldClaimDate = today;
              result.message = `${description} You collect ${formatNumber(awarded)} gold.`;
            } else {
              const item = tx
                .select({ id: items.id })
                .from(items)
                .where(eq(items.name, definition.item))
                .get();
              if (!item) {
                result.message = `${description} This discovery is currently unavailable.`;
                break;
              }
              if (
                !grantInventoryItem(tx, userId, item.id, definition.quantity)
              ) {
                result.message = `${description} You cannot carry any more of this item.`;
                break;
              }
              result.message = `${description} You collect ${formatNumber(definition.quantity)} × ${definition.item}.`;
            }
            changes.ruinsDiscoveries = player.ruinsDiscoveries?.map((entry) =>
              entry === discovery ? { ...entry, claimed: true } : entry,
            );
            break;
          }
          case "exit":
            if (position !== RUINS_ENTRANCE)
              return { message: "The exit is at the entrance square." };
            result.left = true;
            break;
          case "recall": {
            const today = getGameDate();
            if (player.recallDate === today)
              return {
                message:
                  "Your Recall Beacon recharges at midnight Central time.",
              };
            const beacon = tx
              .select({ id: items.id })
              .from(inventory)
              .innerJoin(items, eq(items.id, inventory.itemId))
              .where(
                and(
                  eq(inventory.userId, userId),
                  gt(inventory.quantity, 0),
                  eq(items.name, RECALL_BEACON),
                  eq(items.type, "utility"),
                ),
              )
              .get();
            if (!beacon) return { message: "You do not have a Recall Beacon." };
            changes.recallDate = today;
            result = {
              left: true,
              message: "Your Recall Beacon returns you to Nexaris.",
            };
            break;
          }
          case "engage":
          case "ignore": {
            const encounter = getRuinsEncounter(position);
            if (!player.ruinsEnemyPending || !encounter) {
              return {
                message: "There is no enemy to fight here.",
              };
            }
            changes.ruinsEnemyPending = false;
            if (action.kind === "ignore") {
              result.message = `You pass by the ${encounter.enemy.name}.`;
              break;
            }
            if (player.hp <= 0)
              return { message: "You need to heal before fighting." };
            const { min, max } = encounter.goldReward;
            const gold = min + Math.floor(Math.random() * (max - min + 1));
            const { battle, changes: rewards } = resolvePlayerBattle(
              player,
              encounter.enemy,
              { gold, xp: encounter.xpReward },
              tx,
            );
            const won = battle.outcome === "win";
            const drops = won ? rollRuinsLoot(encounter.enemyId) : [];
            const loot: RuinsBattle["loot"] = [];
            if (drops.length) {
              const catalog = tx
                .select({ id: items.id, name: items.name })
                .from(items)
                .where(
                  inArray(
                    items.name,
                    drops.map(({ item }) => item),
                  ),
                )
                .all();
              const idsByName = new Map(
                catalog.map(({ id, name }) => [name, id]),
              );
              for (const { item, quantity } of drops) {
                const id = idsByName.get(item);
                if (
                  id !== undefined &&
                  grantInventoryItem(tx, userId, id, quantity)
                ) {
                  loot.push({ name: item, quantity });
                }
              }
            }

            Object.assign(changes, rewards);
            result = {
              left: !won,
              battle: { ...battle, enemyName: encounter.enemy.name, loot },
            };
            break;
          }
        }
      }

      if (result.left) {
        changes.ruinsTile = null;
        changes.ruinsDiscoveries = null;
        changes.ruinsEnemyPending = false;
      }
      tx.update(users).set(changes).where(eq(users.id, userId)).run();
      return result;
    },
    { behavior: "immediate" },
  );
}
