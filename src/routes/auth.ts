import { Router, type Request } from "express";
import { db } from "../db";
import { inventory, items, users } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import argon2 from "argon2";
import { renderError } from "../middleware/errors";

const router = Router();
const playerNamePattern = /^[A-Za-z0-9_-][A-Za-z0-9 _-]{1,22}[A-Za-z0-9_-]$/;

/** Starts a fresh session and saves it before redirecting to the game. */
async function signIn(req: Request, userId: number) {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });

  req.session.userId = userId;
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

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

  await signIn(req, user.id);

  return res.redirect(user.ruinsTile === null ? "/game" : "/game/ruins");
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
    return renderError(res, 400, {
      message: "Check your account details and try again.",
    });
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
    return renderError(res, 400, { message: "Choose an avatar model." });
  }

  const passwordHash = await argon2.hash(password);
  // Save the account and its starter potions together.
  const signup = db.transaction(
    (tx) => {
      const potion = tx
        .select({ id: items.id })
        .from(items)
        .where(eq(items.name, "Lesser Potion"))
        .get();
      if (!potion) return { status: "catalog-unavailable" } as const;

      const player = tx
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
      if (!player) return { status: "conflict" } as const;

      tx.insert(inventory)
        .values({ userId: player.id, itemId: potion.id, quantity: 3 })
        .run();
      return { status: "created", id: player.id } as const;
    },
    { behavior: "immediate" },
  );

  if (signup.status === "catalog-unavailable") {
    return renderError(res, 503, {
      message: "Signup is temporarily unavailable. Please try again later.",
    });
  }

  if (signup.status === "conflict") {
    const nameTaken = db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.name}) = lower(${name})`)
      .get();

    return renderError(res, 409, {
      message: nameTaken
        ? "That player name is already taken."
        : "That email is already registered.",
    });
  }

  await signIn(req, signup.id);

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
