/**
 * Formats a display name with an initial capital after spaces, hyphens,
 * and underscores, while preserving the separators.
 */
export function formatPlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(
      /(^|[\s_-])(\p{L})/gu,
      (_match, separator: string, letter: string) =>
        separator + letter.toUpperCase(),
    );
}
