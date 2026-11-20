import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";

const router = Router();

router.get("/", (req, res) => {
  const allUsers = db
    .select({ name: users.name, email: users.email })
    .from(users)
    .all();

  return res.render("users/index", {
    title: "Registered Players",
    users: allUsers,
  });
});

export default router;
