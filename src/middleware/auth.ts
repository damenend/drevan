import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

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
      email: users.email,
      gold: users.gold,
      hp: users.hp,
      maxHp: users.maxHp,
      speed: users.speed,
      strength: users.strength,
      exp: users.exp,
      equippedWeaponId: users.equippedWeaponId,
      equippedArmorId: users.equippedArmorId,
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
