import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";

const router = Router();

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).send("Email and password are required.");
    }

    const user = db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .get();

    if (!user) {
      return res.status(401).send("Invalid email or password.");
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);

    if (!passwordMatches) {
      return res.status(401).send("Invalid email or password.");
    }

    req.session.userId = user.id;

    return res.redirect("/game");
  } catch (error) {
    return next(error);
  }
});

// Signup
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).send("Invalid signup information.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .get();

    if (existingUser) {
      return res.status(409).send("Email already registered.");
    }

    const passwordHash = await argon2.hash(password);

    db.insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      })
      .run();

    return res.redirect("/");
  } catch (error) {
    return next(error);
  }
});

// Logout
router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("connect.sid");

    return res.redirect("/");
  });
});

export default router;
