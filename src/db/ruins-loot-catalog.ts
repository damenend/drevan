import type { items } from "./schema";

export const LESSER_POTION = "Lesser Potion";

// The seed uses unique catalog names as stable keys across databases.
export const materials = [
  {
    name: "Metal Scraps",
    sellPrice: 2,
    description:
      "Twisted remnants of machinery from an age long forgotten. Still worth something to the right merchant.",
  },
  {
    name: "Frayed Circuitry",
    sellPrice: 3,
    description:
      "A tangled collection of conductive filaments. Whatever they once powered is unlikely to power anything again.",
  },
  {
    name: "Shattered Alloy",
    sellPrice: 4,
    description:
      "Fragments of an exceptionally durable alloy. Apparently, not durable enough.",
  },
  {
    name: "Dormant Microchip",
    sellPrice: 5,
    description:
      "A small component bearing microscopic inscriptions. Its original function remains a subject of considerable debate.",
  },
  {
    name: "Enchantment Powder",
    sellPrice: 8,
    description:
      "Fine particles that retain traces of arcane energy. Handle with care and refrain from inhaling.",
  },
  {
    name: "Power Cell",
    sellPrice: 10,
    description:
      "A compact energy vessel recovered from old-world machinery. A faint hum suggests it has not entirely exhausted its charge.",
  },
  {
    name: "Arcane Residue",
    sellPrice: 12,
    description:
      "A viscous substance left behind by unstable magical reactions. It occasionally moves against gravity.",
  },
  {
    name: "Crystallized Aether",
    sellPrice: 25,
    description:
      "Arcane energy condensed into a remarkably stable crystalline form. Its light persists even in absolute darkness.",
  },
  {
    name: "Fractured Energy Core",
    sellPrice: 35,
    description:
      "The damaged heart of an ancient machine. Despite its fractured casing, something within continues to pulse.",
  },
  {
    name: "Voidstone Fragment",
    sellPrice: 50,
    description:
      "A fragment of matter whose origin defies conventional explanation. Prolonged observation produces the unsettling sensation of being observed in return.",
  },
] as const satisfies readonly Pick<
  typeof items.$inferInsert,
  "name" | "sellPrice" | "description" | "image"
>[];

export const ruinsEquipment = [
  {
    name: "Wooden Axe",
    description:
      "A crude but dependable axe. Equally suited to harvesting timber and discouraging unwanted company.",
    type: "weapon",
    effect: "attack_power",
    effectValue: 2,
    sellPrice: 15,
    price: 30,
    level: 2,
  },
  {
    name: "Reinforced Sword",
    description: "A sturdy blade strengthened with salvaged alloy.",
    type: "weapon",
    effect: "attack_power",
    effectValue: 3,
    sellPrice: 25,
    price: 50,
    level: 4,
  },
  {
    name: "Ancient Blade",
    description:
      "A weapon of forgotten origin. Its edge has endured the passage of centuries.",
    type: "weapon",
    effect: "attack_power",
    effectValue: 4,
    sellPrice: 40,
    price: 80,
    level: 6,
  },
  {
    name: "Arcane Mace",
    description:
      "Faintly glowing inscriptions adorn the head of this unusual weapon.",
    type: "weapon",
    effect: "attack_power",
    effectValue: 5,
    sellPrice: 60,
    price: 120,
    level: 8,
  },
  {
    name: "Corrupt Staff",
    description:
      "A dark instrument that resonates with an unfamiliar and unsettling power.",
    type: "weapon",
    effect: "attack_power",
    effectValue: 6,
    sellPrice: 90,
    price: 180,
    level: 10,
  },
  {
    name: "Wooden Shield",
    description:
      "Bound wooden planks that offer a modest degree of protection.",
    type: "armor",
    effect: "defense",
    effectValue: 4,
    sellPrice: 15,
    price: 30,
    level: 2,
  },
  {
    name: "Reinforced Bracers",
    description: "Protective forearm guards reinforced with old-world metal.",
    type: "armor",
    effect: "defense",
    effectValue: 5,
    sellPrice: 25,
    price: 50,
    level: 4,
  },
  {
    name: "Ancient Plate",
    description:
      "Heavy protective plating recovered from the remnants of an ancient civilization.",
    type: "armor",
    effect: "defense",
    effectValue: 6,
    sellPrice: 40,
    price: 80,
    level: 6,
  },
  {
    name: "Arcane Bulwark",
    description:
      "A shield imbued with an energy that its original creators seemingly understood.",
    type: "armor",
    effect: "defense",
    effectValue: 7,
    sellPrice: 60,
    price: 120,
    level: 8,
  },
  {
    name: "Corrupt Armor",
    description:
      "Twisted armor bearing traces of an unknown corruption. It is surprisingly comfortable.",
    type: "armor",
    effect: "defense",
    effectValue: 8,
    sellPrice: 90,
    price: 180,
    level: 10,
  },
] as const satisfies readonly (typeof items.$inferInsert)[];
