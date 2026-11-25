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
