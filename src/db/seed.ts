import { sql } from "drizzle-orm";
import { db } from "./index";
import { items } from "./schema";

type Item = typeof items.$inferInsert;

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
      type: "weapon",
      image: "/images/rusted-sword.webp",
    },
  ];

  const armor: Item[] = [
    {
      name: "Worn Leather Armor",
      description: "A basic armor",
      price: 100,
      type: "armor",
      image: "/images/worn-leather-armor.webp",
    },
  ];

  await db
    .insert(items)
    .values([...potions, ...weapons, ...armor])
    .onConflictDoUpdate({
      target: items.name,
      set: {
        description: sql`excluded.description`,
        price: sql`excluded.price`,
        type: sql`excluded.type`,
        effect: sql`excluded.effect`,
        effectValue: sql`excluded.effect_value`,
        image: sql`excluded.image`,
      },
    });

  console.log("Database seeded!");
}

seed();
