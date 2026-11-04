/**
 * Tiny class-name joiner: drops falsy parts so recipes and caller classes can be combined.
 */

/** Joins the truthy class strings with spaces. */
export function cx(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
