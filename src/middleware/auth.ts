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
      email: users.email,
      gold: users.gold,
      hp: users.hp,
      maxHp: effectiveMaxHp,
      baseMaxHp: users.maxHp,
      maxHpPoints: users.maxHpPoints,
      speedPoints: users.speedPoints,
      strengthPoints: users.strengthPoints,
      speed: users.speed,
      strength: users.strength,
      exp: users.exp,
      equippedWeaponId: users.equippedWeaponId,
      equippedArmorId: users.equippedArmorId,
      defense: users.defense,
      fishingCastsUsed: users.fishing_casts_used,
      fishingCastDate: users.fishing_cast_date,
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
