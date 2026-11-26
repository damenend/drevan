import { and, eq, gt, or } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import { getGameDate } from "../utils/game-date";
import { resolvePlayerBattle, type PlayerBattleReport } from "./player-battle";
import { generateRuinsDiscoveries } from "./ruins-discoveries";
import {
  canMoveInRuins,
  getRuinsEncounter,
  RECALL_BEACON,
  RUINS_ENTRANCE,
} from "./ruins-map";
import { claimRuinsDiscovery, grantRuinsLoot } from "./ruins-rewards";

export type RuinsAction =
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

type ExpeditionPlayer = typeof users.$inferSelect;
type ExpeditionDatabase = Pick<typeof db, "select" | "insert">;

// Actions with changes advance the revision, including an exit with no extra fields.
type ActionResolution =
  | { message: string }
  | (ActionResult & { changes: Partial<typeof users.$inferInsert> });

const recallBeacon = and(
  eq(items.name, RECALL_BEACON),
  eq(items.type, "utility"),
);
const healingPotion = and(
  eq(items.type, "consumable"),
  eq(items.effect, "heal"),
);

/** Lists potions by HP restored and reports Beacon ownership. */
export function getRuinsSupplies(userId: number) {
  const owned = db
    .select({
      id: items.id,
      name: items.name,
      type: items.type,
      image: items.image,
      quantity: inventory.quantity,
    })
    .from(inventory)
    .innerJoin(items, eq(items.id, inventory.itemId))
    .where(
      and(
        eq(inventory.userId, userId),
        gt(inventory.quantity, 0),
        or(recallBeacon, healingPotion),
      ),
    )
    .orderBy(items.effectValue, items.name)
    .all();

  return {
    hasBeacon: owned.some(({ type }) => type === "utility"),
    potions: owned.filter(({ type }) => type === "consumable"),
  };
}

function enterRuins(
  database: ExpeditionDatabase,
  player: ExpeditionPlayer,
): ActionResolution {
  if (player.ruinsTile !== null) {
    return { message: "Your expedition is already underway." };
  }
  if (player.hp <= 0) {
    return { message: "Visit Sanctum to heal before entering." };
  }

  const beacon = database
    .select({ id: items.id })
    .from(items)
    .where(recallBeacon)
    .get();
  if (!beacon) {
    return { message: "Expedition supplies are currently unavailable." };
  }
  const grant = database
    .insert(inventory)
    .values({ userId: player.id, itemId: beacon.id })
    .onConflictDoNothing({ target: [inventory.userId, inventory.itemId] })
    .run();

  return {
    changes: {
      ruinsTile: RUINS_ENTRANCE,
      ruinsDiscoveries: generateRuinsDiscoveries(),
      ruinsEnemyPending: false,
    },
    message: grant.changes ? "You receive a Recall Beacon." : undefined,
  };
}

function recallFromRuins(
  database: ExpeditionDatabase,
  player: ExpeditionPlayer,
): ActionResolution {
  const today = getGameDate();
  if (player.recallDate === today) {
    return {
      message: "Your Recall Beacon recharges at midnight Central time.",
    };
  }

  const beacon = database
    .select({ id: items.id })
    .from(inventory)
    .innerJoin(items, eq(items.id, inventory.itemId))
    .where(
      and(
        eq(inventory.userId, player.id),
        gt(inventory.quantity, 0),
        recallBeacon,
      ),
    )
    .get();
  if (!beacon) return { message: "You do not have a Recall Beacon." };

  return {
    changes: { recallDate: today },
    left: true,
    message: "Your Recall Beacon returns you to Nexaris.",
  };
}

function resolveEncounter(
  database: ExpeditionDatabase,
  player: ExpeditionPlayer,
  position: number,
  action: "engage" | "ignore",
): ActionResolution {
  const encounter = getRuinsEncounter(position);
  if (!player.ruinsEnemyPending || !encounter) {
    return { message: "There is no enemy to fight here." };
  }

  if (action === "ignore") {
    return {
      changes: { ruinsEnemyPending: false },
      message: `You pass by the ${encounter.enemy.name}.`,
    };
  }
  if (player.hp <= 0) return { message: "You need to heal before fighting." };

  const { min, max } = encounter.goldReward;
  const gold = min + Math.floor(Math.random() * (max - min + 1));
  const { battle, changes } = resolvePlayerBattle(
    player,
    encounter.enemy,
    { gold, xp: encounter.xpReward },
    database,
  );
  const won = battle.outcome === "win";
  const loot = won
    ? grantRuinsLoot(database, player.id, encounter.enemyId)
    : [];
  return {
    changes: { ...changes, ruinsEnemyPending: false },
    left: !won,
    battle: { ...battle, enemyName: encounter.enemy.name, loot },
  };
}

function resolveAction(
  database: ExpeditionDatabase,
  player: ExpeditionPlayer,
  action: RuinsAction,
): ActionResolution {
  if (action.kind === "enter") return enterRuins(database, player);

  const position = player.ruinsTile;
  if (position === null) {
    return { message: "Enter The Ruins to begin exploring." };
  }

  switch (action.kind) {
    case "move": {
      const { destination } = action;
      if (!canMoveInRuins(position, destination)) {
        return { message: "Choose a square directly beside you." };
      }
      const discovery = claimRuinsDiscovery(database, player, destination);
      return {
        changes: {
          ruinsTile: destination,
          ruinsEnemyPending: Boolean(getRuinsEncounter(destination)),
          ...discovery?.changes,
        },
        message: discovery?.message,
      };
    }
    case "exit":
      return position === RUINS_ENTRANCE
        ? { changes: {}, left: true }
        : { message: "The exit is at the entrance square." };
    case "recall":
      return recallFromRuins(database, player);
    case "engage":
    case "ignore":
      return resolveEncounter(database, player, position, action.kind);
  }
}

/**
 * Checks the submitted revision and applies one expedition action atomically.
 * Advancing the revision prevents replay even after returning to the same tile.
 */
export function actInRuins(
  userId: number,
  revision: number,
  action: RuinsAction,
): ActionResult {
  return db.transaction(
    (tx) => {
      const playerFilter = eq(users.id, userId);
      const player = tx.select().from(users).where(playerFilter).get();
      if (!player || player.ruinsRevision !== revision) {
        return {
          message:
            "Your expedition has moved on. Choose an action from the current map.",
        };
      }

      const resolution = resolveAction(tx, player, action);
      if (!("changes" in resolution)) return resolution;

      const { changes, ...result } = resolution;
      if (result.left) {
        changes.ruinsTile = null;
        changes.ruinsDiscoveries = null;
        changes.ruinsEnemyPending = false;
      }
      tx.update(users)
        .set({ ...changes, ruinsRevision: revision + 1 })
        .where(playerFilter)
        .run();
      return result;
    },
    { behavior: "immediate" },
  );
}
