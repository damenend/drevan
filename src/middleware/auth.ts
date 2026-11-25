import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { effectiveMaxHp, users } from "../db/schema";

type AuthenticatedPlayer = NonNullable<ReturnType<typeof findPlayer>>;
type PlayerLocals = { user?: AuthenticatedPlayer | null };
type PlayerResponse = Response<unknown, PlayerLocals>;

/**
 * Loads the user identified by the session into `res.locals.user`.
 * Sets it to null when there is no session user or the account no longer exists.
 */
export function loadUser(
  req: Request,
  res: PlayerResponse,
  next: NextFunction,
) {
  const userId = req.session.userId;
  res.locals.user = userId ? (findPlayer(userId) ?? null) : null;
  next();
}

/** Selects gameplay fields for the request and its views. */
function findPlayer(userId: number) {
  return db
    .select({
      id: users.id,
      name: users.name,
      avatarModel: users.avatarModel,
      characterClass: users.characterClass,
      speed: users.speed,
      gold: users.gold,
      hp: users.hp,
      maxHp: effectiveMaxHp,
      fortitude: users.fortitude,
      fortitudePoints: users.fortitudePoints,
      intellect: users.intellect,
      intellectPoints: users.intellectPoints,
      agilityPoints: users.agilityPoints,
      strengthPoints: users.strengthPoints,
      agility: users.agility,
      strength: users.strength,
      exp: users.exp,
      equippedWeaponId: users.equippedWeaponId,
      equippedArmorId: users.equippedArmorId,
      defense: users.defense,
      fishingCastsUsed: users.fishing_casts_used,
      fishingCastDate: users.fishing_cast_date,
      ruinsTile: users.ruinsTile,
      ruinsRevision: users.ruinsRevision,
      ruinsEnemyPending: users.ruinsEnemyPending,
      ruinsDiscoveries: users.ruinsDiscoveries,
      recallDate: users.recallDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();
}

/**
 * Reads the player after requireAuth. A missing player here indicates a route
 * was mounted without the authentication guard.
 */
export function getAuthenticatedPlayer(
  res: PlayerResponse,
): AuthenticatedPlayer {
  const { user } = res.locals;
  if (!user) throw new Error("Authenticated route is missing its player");
  return user;
}

/** Sends guests to the sign-in page before any game handler runs. */
export function requireAuth(
  _req: Request,
  res: PlayerResponse,
  next: NextFunction,
) {
  if (!res.locals.user) {
    return res.redirect("/");
  }

  next();
}
