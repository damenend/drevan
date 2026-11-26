import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { items, users } from "../db/schema";
import {
  DAILY_CAST_LIMIT,
  getDailyCastsUsed,
  getFishingDate,
  rollFishingCatch,
} from "./fishing";
import { grantInventoryItem } from "./inventory";

type LineReport =
  | { kind: "caught"; name: string; image: string | null }
  | { kind: "released"; name: string }
  | { kind: "empty" };

export type FishingReport =
  | LineReport
  | {
      kind: "net";
      casts: number;
      caught: Record<string, number>;
      released: Record<string, number>;
      empty: number;
    };

/**
 * Spends one cast or the entire remaining daily allowance. Each cast rolls
 * independently. Spent casts and catches commit together, including when
 * empty casts or full stacks leave the inventory unchanged.
 */
export function castFishingLine(
  playerId: number,
  mode: "line" | "net" = "line",
): FishingReport | null {
  return db.transaction(
    (tx): FishingReport | null => {
      const today = getFishingDate();
      const player = tx
        .select({
          castsUsed: users.fishing_casts_used,
          castDate: users.fishing_cast_date,
        })
        .from(users)
        .where(eq(users.id, playerId))
        .get();
      if (!player) return null;

      const used = getDailyCastsUsed(player.castsUsed, player.castDate, today);
      const remaining = DAILY_CAST_LIMIT - used;
      if (remaining <= 0) return null;

      const casts = mode === "net" ? remaining : 1;
      tx.update(users)
        .set({ fishing_cast_date: today, fishing_casts_used: used + casts })
        .where(eq(users.id, playerId))
        .run();

      function resolveCast(): LineReport {
        const caughtFish = rollFishingCatch();
        if (!caughtFish) return { kind: "empty" };

        const fish = tx
          .select({ id: items.id, name: items.name, image: items.image })
          .from(items)
          .where(and(eq(items.name, caughtFish), eq(items.type, "fish")))
          .get();

        if (!fish) {
          throw new Error(`Missing fish in the item catalog: ${caughtFish}`);
        }

        if (!grantInventoryItem(tx, playerId, fish.id)) {
          return { kind: "released", name: fish.name };
        }
        return { kind: "caught", name: fish.name, image: fish.image };
      }

      if (mode === "line") return resolveCast();

      const caught: Record<string, number> = {};
      const released: Record<string, number> = {};
      let empty = 0;
      for (let index = 0; index < casts; index++) {
        const result = resolveCast();
        if (result.kind === "empty") {
          empty++;
        } else {
          const counts = result.kind === "caught" ? caught : released;
          counts[result.name] = (counts[result.name] ?? 0) + 1;
        }
      }
      return { kind: "net", casts, caught, released, empty };
    },
    { behavior: "immediate" },
  );
}
