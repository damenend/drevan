import { sql } from "drizzle-orm";
import { db } from "./index";
import { items } from "./schema";

type Item = typeof items.$inferInsert;

/**
 * Inserts starter items and updates matching names while preserving their IDs
 * and any inventory rows that refer to them.
 */
async function seed() {
  const potions: Item[] = [
    {
      name: "Lesser Potion",
      description: "A lesser healing potion.",
      price: 5,
      type: "consumable",
      effect: "heal",
      effectValue: 10,
      image: "/images/lesser-potion.webp",
    },
    {
      name: "Potion",
      description: "A healing potion.",
      price: 25,
      type: "consumable",
      effect: "heal",
      effectValue: 50,
      image: "/images/potion.webp",
    },
    {
      name: "Greater Potion",
      description: "A greater healing potion.",
      price: 50,
      type: "consumable",
      effect: "heal",
      effectValue: 100,
      image: "/images/greater-potion.webp",
    },
  ];

  const weapons: Item[] = [
    {
      name: "Rusted Sword",
      description: "A basic sword",
      price: 100,
      sellPrice: 50,
      type: "weapon",
      effect: "strength",
      effectValue: 1,
      image: "/images/rusted-sword.webp",
    },
  ];

  const armor: Item[] = [
    {
      name: "Worn Leather Armor",
      description: "A basic armor",
      price: 100,
      sellPrice: 50,
      type: "armor",
      effect: "defense",
      effectValue: 3,
      image: "/images/worn-leather-armor.webp",
    },
  ];

  const fish: Item[] = [
    {
      name: "Murkfin",
      description: "A common fish",
      image: "/images/murkfin.webp",
      price: null,
      sellPrice: 1,
      type: "fish",
      effect: null,
      effectValue: null,
    },
    {
      name: "Glassscale",
      description: "An uncommon fish",
      image: "/images/glassscale.webp",
      price: null,
      sellPrice: 3,
      type: "fish",
      effect: null,
      effectValue: null,
    },
    {
      name: "Astral Koi",
      description: "A rare fish",
      image: "/images/astral-koi.webp",
      price: null,
      sellPrice: 10,
      type: "fish",
      effect: null,
      effectValue: null,
    },
  ];

  await db
    .insert(items)
    .values([...potions, ...weapons, ...armor, ...fish])
    .onConflictDoUpdate({
      target: items.name,
      set: {
        description: sql`excluded.description`,
        price: sql`excluded.price`,
        sellPrice: sql`excluded.sell_price`,
        type: sql`excluded.type`,
        effect: sql`excluded.effect`,
        effectValue: sql`excluded.effect_value`,
        image: sql`excluded.image`,
      },
    });

  console.log("Database seeded!");
}

seed();
