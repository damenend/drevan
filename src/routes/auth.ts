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

  /** Restores the submitted email so the player can correct their credentials. */
  const renderLoginError = (status: number, message: string) =>
    res.status(status).render("index", {
      title: "Log in",
      authView: "login",
      authError: { message },
      formValues: { email: typeof email === "string" ? email : "" },
    });

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return renderLoginError(400, "Email and password are required.");
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .get();

  if (!user) {
    return renderLoginError(401, "Invalid email or password.");
  }

  const passwordMatches = await argon2.verify(user.passwordHash, password);

  if (!passwordMatches) {
    return renderLoginError(401, "Invalid email or password.");
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

  /**
   * Restores the submitted name, email, and valid avatar choice. The optional
   * field identifies the control that receives the feedback.
   */
  const renderSignupError = (
    status: number,
    message: string,
    field?: "name" | "avatarModel" | "email" | "passwordConfirmation",
  ) =>
    res.status(status).render("index", {
      title: "Create an account",
      authView: "register",
      authError: { message, field },
      formValues: {
        name: typeof name === "string" ? name : "",
        email: typeof email === "string" ? email : "",
        avatarModel: avatarModel === "female" ? "female" : "male",
      },
    });

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return renderSignupError(400, "Check your account details and try again.");
  }

  if (passwordConfirmation !== password) {
    return renderSignupError(
      400,
      "Passwords must match.",
      "passwordConfirmation",
    );
  }

  if (typeof name !== "string" || !playerNamePattern.test(name)) {
    return renderSignupError(
      400,
      "Enter a player name that follows the rules below.",
      "name",
    );
  }

  if (avatarModel !== "male" && avatarModel !== "female") {
    return renderSignupError(400, "Choose an avatar model.", "avatarModel");
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
      recoveryLink: {
        href: "/?view=register",
        label: "Return to account creation",
      },
    });
  }

  if (signup.status === "conflict") {
    const nameTaken = db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.name}) = lower(${name})`)
      .get();

    return nameTaken
      ? renderSignupError(409, "That player name is already taken.", "name")
      : renderSignupError(409, "That email is already registered.", "email");
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
