import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  gold: integer("gold").notNull().default(100),
  strength: integer("strength").notNull().default(5),
  speed: integer("speed").notNull().default(5),
  hp: integer("hp").notNull().default(25),
  maxHp: integer("max_hp").notNull().default(25),
  exp: integer("exp").notNull().default(0),
  equippedWeaponId: integer("equipped_weapon_id"),
  equippedArmorId: integer("equipped_armor_id"),
  defense: integer("defense").notNull().default(0),
});

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
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
