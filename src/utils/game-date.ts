const gameDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Returns the current calendar date in America/Chicago. */
export function getGameDate(now = new Date()): string {
  return gameDate.format(now);
}
