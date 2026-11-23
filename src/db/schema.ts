import { sql } from "drizzle-orm";
import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  maximumHp,
  STARTING_FORTITUDE,
  STARTING_HP,
} from "../services/character-stats";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    avatarModel: text("avatar_model", { enum: ["male", "female"] })
      .notNull()
      .default("male"),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    gold: integer("gold").notNull().default(125),
    strength: integer("strength").notNull().default(5),
    agility: integer("speed").notNull().default(5),
    intellect: integer("intellect").notNull().default(0),
    fortitude: integer("fortitude").notNull().default(STARTING_FORTITUDE),
    hp: integer("hp").notNull().default(STARTING_HP),
    exp: integer("exp").notNull().default(0),
    strengthPoints: integer("strength_points").notNull().default(0),
    agilityPoints: integer("speed_points").notNull().default(0),
    intellectPoints: integer("intellect_points").notNull().default(0),
    fortitudePoints: integer("fortitude_points").notNull().default(0),
    equippedWeaponId: integer("equipped_weapon_id"),
    equippedArmorId: integer("equipped_armor_id"),
    defense: integer("defense").notNull().default(0),
    fishing_casts_used: integer("fishing_casts_used").notNull().default(0),
    fishing_cast_date: text("fishing_cast_date"),
    ruinsTile: integer("ruins_tile"),
    ruinsRevision: integer("ruins_revision").notNull().default(0),
    ruinsEnemyPending: integer("ruins_enemy_pending", { mode: "boolean" })
      .notNull()
      .default(false),
    recallDate: text("recall_date"),
  },
  (table) => [
    uniqueIndex("users_name_lower_unique").on(sql`lower(${table.name})`),
  ],
);

export const effectiveMaxHp = maximumHp(
  sql`(${users.fortitude} + ${users.fortitudePoints})`,
);

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price"),
  sellPrice: integer("sell_price"),
  type: text("type").notNull().default("consumable"),
  effect: text("effect"),
  effectValue: integer("effect_value"),
  image: text("image"),
});

export const inventory = sqliteTable(
  "inventory",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [
    uniqueIndex("inventory_user_item_unique").on(table.userId, table.itemId),
  ],
);
