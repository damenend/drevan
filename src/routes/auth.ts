import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import argon2 from "argon2";
import { renderError } from "../middleware/errors";

const router = Router();
const playerNamePattern = /^[A-Za-z0-9_-][A-Za-z0-9 _-]{1,22}[A-Za-z0-9_-]$/;

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
  const {
    name,
    email,
    password,
    passwordConfirmation,
    avatarModel = "male",
  } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return renderError(res, 400, { message: "Invalid signup information." });
  }

  if (passwordConfirmation !== password) {
    return renderError(res, 400, { message: "Passwords must match." });
  }

  if (typeof name !== "string" || !playerNamePattern.test(name)) {
    return renderError(res, 400, {
      message:
        "Player names must be 3–24 characters and use only letters A–Z, numbers, spaces, underscores, or hyphens. Spaces cannot appear at either end.",
    });
  }

  if (avatarModel !== "male" && avatarModel !== "female") {
    return renderError(res, 400, { message: "Choose a valid gender." });
  }

  const passwordHash = await argon2.hash(password);
  const signup = db
    .insert(users)
    .values({
      name,
      avatarModel,
      email: email.trim().toLowerCase(),
      passwordHash,
    })
    .onConflictDoNothing()
    .returning({ id: users.id })
    .get();

  if (!signup) {
    const nameTaken = db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.name}) = lower(${name})`)
      .get();

    return renderError(res, 409, {
      message: nameTaken
        ? "Player name already taken."
        : "Email already registered.",
    });
  }

  req.session.userId = signup.id;

  return res.redirect("/game");
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
