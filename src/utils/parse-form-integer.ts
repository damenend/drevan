/**
 * Accepts a nonnegative whole number from JSON or decimal digits from a form
 * field. Returns null for other values and integers outside JavaScript's
 * exact range.
 */
export function parseFormInteger(value: unknown): number | null {
  if (typeof value === "string" && /^\d+$/.test(value)) {
    value = Number(value);
  }

  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}
