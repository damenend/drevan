import { and, eq, gt, or } from "drizzle-orm";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import { getGameDate } from "../utils/game-date";
import { resolvePlayerBattle, type PlayerBattleReport } from "./player-battle";
import { generateRuinsDiscoveries } from "./ruins-discoveries";
import {
  canMoveInRuins,
  generateRuinsEnemies,
  getRuinsEncounter,
  getRuinsEnemy,
  RECALL_BEACON,
  RUINS_ENTRANCE,
  type RuinsEnemy,
} from "./ruins-map";
import { claimRuinsDiscovery, grantRuinsLoot } from "./ruins-rewards";

export type RuinsAction =
  { kind: "move"; destination: number } | { kind: "enter" | "exit" | "recall" };

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
  const enemies = generateRuinsEnemies();

  return {
    changes: {
      ruinsTile: RUINS_ENTRANCE,
      ruinsEnemies: enemies,
      ruinsExploredTiles: [RUINS_ENTRANCE],
      ruinsDiscoveries: generateRuinsDiscoveries(
        Math.random,
        new Set(enemies.map(({ tile }) => tile)),
      ),
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
  enemyInstance: RuinsEnemy,
): ActionResolution {
  const encounter = getRuinsEncounter(enemyInstance.enemyId);
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
    changes: {
      ...changes,
      ruinsEnemies: won
        ? player.ruinsEnemies?.filter(({ tile }) => tile !== enemyInstance.tile)
        : player.ruinsEnemies,
    },
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
      const explored = new Set(player.ruinsExploredTiles ?? [position]);
      explored.add(destination);
      const enemy = getRuinsEnemy(player.ruinsEnemies, destination);
      if (enemy) {
        const resolution = resolveEncounter(database, player, enemy);
        if (!("changes" in resolution)) return resolution;
        return {
          ...resolution,
          changes: {
            ruinsTile: destination,
            ruinsExploredTiles: [...explored],
            ...resolution.changes,
          },
        };
      }
      return {
        changes: {
          ruinsTile: destination,
          ruinsExploredTiles: [...explored],
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

      // Expeditions created before migration resume safely without surprise
      // encounters; their next expedition receives the randomized population.
      const legacyEnemies =
        player.ruinsTile !== null && player.ruinsEnemies === null ? [] : null;
      const expeditionPlayer = legacyEnemies
        ? {
            ...player,
            ruinsEnemies: legacyEnemies,
            ruinsExploredTiles: [player.ruinsTile!],
          }
        : player;
      const resolution = resolveAction(tx, expeditionPlayer, action);
      if (!("changes" in resolution)) return resolution;

      const { changes, ...result } = resolution;
      if (legacyEnemies) {
        changes.ruinsEnemies ??= legacyEnemies;
        changes.ruinsExploredTiles ??= expeditionPlayer.ruinsExploredTiles;
      }
      if (result.left) {
        changes.ruinsTile = null;
        changes.ruinsDiscoveries = null;
        changes.ruinsEnemies = null;
        changes.ruinsExploredTiles = null;
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
