import { sql } from "drizzle-orm";
import { db } from "./index";
import { RECALL_BEACON } from "../services/ruins-map";
import { LESSER_POTION, materials, ruinsEquipment } from "./ruins-loot-catalog";
import { items } from "./schema";

type Item = typeof items.$inferInsert;

const equipmentImages = {
  weapon: "/images/rusted-sword.webp",
  armor: "/images/worn-leather-armor.webp",
} as const;

/**
 * Inserts starter items and updates matching names while preserving their IDs
 * and any inventory rows that refer to them.
 */
async function seed() {
  const potions: Item[] = [
    {
      name: LESSER_POTION,
      description: "A mild restorative in a travel-sized vial.",
      price: 5,
      type: "consumable",
      effect: "heal",
      effectValue: 10,
      image: "/images/lesser-potion.webp",
    },
    {
      name: "Potion",
      description:
        "A restorative brewed from local plants. The metallic aftertaste is apparently normal.",
      price: 25,
      type: "consumable",
      effect: "heal",
      effectValue: 50,
      image: "/images/potion.webp",
    },
    {
      name: "Greater Potion",
      description:
        "A concentrated restorative in a thick glass bottle. The seal takes both hands to break.",
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
      description: "A weathered blade with a sound edge beneath the rust.",
      price: 100,
      sellPrice: 50,
      type: "weapon",
      effect: "attack_power",
      effectValue: 1,
      image: equipmentImages.weapon,
    },
  ];

  const armor: Item[] = [
    {
      name: "Worn Leather Armor",
      description:
        "Leather armor patched with hide from an unidentified beast. The previous owner is equally unidentified.",
      price: 100,
      sellPrice: 50,
      type: "armor",
      effect: "defense",
      effectValue: 3,
      image: equipmentImages.armor,
    },
  ];

  const fish: Item[] = [
    {
      name: "Murkfin",
      description:
        "A hardy bottom-dweller from The Driftwater. A local staple, chiefly among people who have run out of other fish.",
      image: "/images/murkfin.webp",
      price: null,
      sellPrice: 1,
      type: "fish",
      effect: null,
      effectValue: null,
    },
    {
      name: "Glassscale",
      description:
        "A translucent fish whose scales split the light into shifting colors.",
      image: "/images/glassscale.webp",
      price: null,
      sellPrice: 3,
      type: "fish",
      effect: null,
      effectValue: null,
    },
    {
      name: "Astral Koi",
      description:
        "A rare fish with luminous markings like constellations. Scholars disagree on whether any of them match the sky.",
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
    .values([
      ...potions,
      ...weapons,
      ...armor,
      ...ruinsEquipment.map((item) => ({
        image: equipmentImages[item.type],
        ...item,
      })),
      ...fish,
      ...materials.map((material) => ({
        type: "material",
        price: null,
        effect: null,
        effectValue: null,
        image: "/images/material-placeholder.webp",
        ...material,
      })),
      {
        name: RECALL_BEACON,
        description:
          "The mechanism is a mystery, but the destination is reliable. Returns you to Nexaris from The Ruins once per day, resetting at midnight Central time.",
        type: "utility",
        image: "/images/recall-beacon.webp",
      },
    ])
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
