import type { CharacterClass } from "../db/schema";

const characterClassLabels: Record<CharacterClass, string> = {
  unaligned: "Unaligned",
  melee: "Vanguard",
  ranged: "Ranger",
  caster: "Arcanist",
};

/** Returns the canonical player-facing name for a stored character class. */
export function formatCharacterClass(characterClass: CharacterClass) {
  return characterClassLabels[characterClass];
}
