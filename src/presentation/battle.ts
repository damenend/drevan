import type { BattleLogEntry } from "../services/battle";
import { formatNumber } from "../utils/format-number";

type AttackEntry = Extract<BattleLogEntry, { type: "attack" }>;

export function formatBattleModifiers(entry: AttackEntry) {
  const modifiers = entry.critical ? ["Critical hit"] : [];

  for (const effect of entry.passiveEffects ?? []) {
    switch (effect.id) {
      case "arcane-surge":
        modifiers.push(
          `${effect.name} (+${formatNumber(effect.damage)} damage)`,
        );
        break;
      case "iron-resolve":
        modifiers.push(
          `${effect.name} (−${formatNumber(effect.damage)} damage taken)`,
        );
        break;
      case "precision":
        modifiers.push(`${effect.name} (made this hit critical)`);
        break;
    }
  }

  return modifiers.join(" · ");
}
