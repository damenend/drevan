export const DAILY_CAST_LIMIT = 50;
const BITE_CHANCE = 0.8;

const gameDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Returns the Central calendar date used to decide which day a cast belongs to. */
export function getFishingDate(now = new Date()): string {
  return gameDate.format(now);
}

/** Counts saved casts only when they belong to the current fishing day. */
export function getDailyCastsUsed(
  castsUsed: number,
  castDate: string | null,
  today = getFishingDate(),
): number {
  return castDate === today ? castsUsed : 0;
}

/** Rolls for a bite first, then rolls for the species only if a fish bites. */
export function rollFishingCatch(random = Math.random): string | null {
  if (random() >= BITE_CHANCE) return null;

  // The species thresholds are cumulative: 70%, then 70% + 25%.
  const fishRoll = random();
  if (fishRoll < 0.7) return "Murkfin";
  if (fishRoll < 0.95) return "Glassscale";
  return "Astral Koi";
}
