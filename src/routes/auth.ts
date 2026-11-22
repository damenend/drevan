import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { renderError } from "../middleware/errors";

const router = Router();

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return renderError(res, 400, {
      message: "Email and password are required.",
    });
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .get();

  if (!user) {
    return renderError(res, 401, { message: "Invalid email or password." });
  }

  const passwordMatches = await argon2.verify(user.passwordHash, password);

  if (!passwordMatches) {
    return renderError(res, 401, { message: "Invalid email or password." });
  }

  req.session.userId = user.id;

  return res.redirect("/game");
});

// Signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return renderError(res, 400, { message: "Invalid signup information." });
  }

  const passwordHash = await argon2.hash(password);
  const signup = db
    .insert(users)
    .values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    })
    .onConflictDoNothing({ target: users.email })
    .run();

  if (signup.changes === 0) {
    return renderError(res, 409, { message: "Email already registered." });
  }

  return res.redirect("/");
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
