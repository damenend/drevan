import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import { formatNumber } from "../utils/format-number";
import { formatPlayerName } from "../utils/format-player-name";
import { getGameDate } from "../utils/game-date";
import { simulateBattle, type BattleResult } from "./battle";
import { getAgility } from "./character-stats";
import { getEffectiveStats } from "./equipment";
import {
  canMoveInRuins,
  getRuinsEncounter,
  RECALL_BEACON,
  RUINS_ENTRANCE,
} from "./ruins-map";

type RuinsAction =
  | { kind: "move"; destination: number }
  | { kind: "enter" | "exit" | "recall" | "engage" | "ignore" };

export type RuinsBattle = BattleResult & {
  enemyName: string;
  xpEarned: number;
};

type ActionResult = {
  message?: string;
  discovery?: "gold" | "item";
  left?: boolean;
  battle?: RuinsBattle;
};

/** Lists owned healing potions and Beacon ownership. The caller checks the daily cooldown separately. */
export function getRuinsSupplies(userId: number) {
  const owned = db
    .select({
      id: items.id,
      name: items.name,
      type: items.type,
      effect: items.effect,
      quantity: inventory.quantity,
    })
    .from(inventory)
    .innerJoin(items, eq(items.id, inventory.itemId))
    .where(and(eq(inventory.userId, userId), gt(inventory.quantity, 0)))
    .orderBy(items.name)
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
        return { message: "That expedition action is out of date." };
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
            const encounter = getRuinsEncounter(destination);
            changes.ruinsTile = destination;
            changes.ruinsEnemyPending = encounter?.kind === "enemy";
            if (encounter?.kind === "gold") {
              const awarded = Math.min(
                encounter.amount,
                Number.MAX_SAFE_INTEGER - player.gold,
              );
              changes.gold = player.gold + awarded;
              if (awarded > 0) result.discovery = "gold";
              result.message = `${encounter.description} You collect ${formatNumber(awarded)} gold.`;
            } else if (encounter?.kind === "item") {
              const item = tx
                .select({ id: items.id })
                .from(items)
                .where(eq(items.name, encounter.item))
                .get();
              if (!item)
                return { message: "This discovery is currently unavailable." };
              const grant = tx
                .insert(inventory)
                .values({ userId, itemId: item.id })
                .onConflictDoUpdate({
                  target: [inventory.userId, inventory.itemId],
                  set: { quantity: sql`${inventory.quantity} + 1` },
                  setWhere: sql`${inventory.quantity} < ${Number.MAX_SAFE_INTEGER}`,
                })
                .run();
              if (grant.changes) result.discovery = "item";
              result.message = grant.changes
                ? `${encounter.description} You collect a ${encounter.item}.`
                : "You cannot carry any more of this item.";
            }
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
              return { message: "Your Recall Beacon is on cooldown." };
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
            if (!player.ruinsEnemyPending || encounter?.kind !== "enemy") {
              return {
                message: "There is no enemy waiting to be engaged here.",
              };
            }
            changes.ruinsEnemyPending = false;
            if (action.kind === "ignore") {
              result.message = `You pass by the ${encounter.enemy.name}.`;
              break;
            }
            if (player.hp <= 0)
              return { message: "You need to heal before fighting." };
            const battle = simulateBattle(
              {
                name: formatPlayerName(player.name),
                hp: player.hp,
                speed: getAgility(player),
                ...getEffectiveStats(player, tx),
              },
              encounter.enemy,
              Math.min(encounter.reward, Number.MAX_SAFE_INTEGER - player.gold),
            );
            const won = battle.enemyHp === 0;
            const xpEarned = won
              ? Math.min(encounter.reward, Number.MAX_SAFE_INTEGER - player.exp)
              : 0;
            changes.hp = battle.playerHp;
            changes.gold = player.gold + battle.goldEarned;
            changes.exp = player.exp + xpEarned;
            result = {
              left: !won,
              battle: { ...battle, enemyName: encounter.enemy.name, xpEarned },
            };
            break;
          }
        }
      }

      if (result.left) {
        changes.ruinsTile = null;
        changes.ruinsEnemyPending = false;
      }
      tx.update(users).set(changes).where(eq(users.id, userId)).run();
      return result;
    },
    { behavior: "immediate" },
  );
}
