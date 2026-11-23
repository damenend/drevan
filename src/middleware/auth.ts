import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { effectiveMaxHp, users } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Loads the user identified by the session into `res.locals.user`.
 * Sets it to null when there is no session user or the account no longer exists.
 */
export function loadUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;

  if (!userId) {
    res.locals.user = null;
    return next();
  }

  const user = db
    .select({
      id: users.id,
      name: users.name,
      avatarModel: users.avatarModel,
      characterClass: users.characterClass,
      speed: users.speed,
      email: users.email,
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
      recallDate: users.recallDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  res.locals.user = user ?? null;

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!res.locals.user) {
    return res.redirect("/");
  }

  next();
}
