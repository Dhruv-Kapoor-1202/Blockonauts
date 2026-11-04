/**
 * Callsign handling. Whatever the player types is reduced to a safe, upper-case, at most 12
 * character string made of letters, digits, spaces, `_` and `-` (the set the server accepts), so it
 * can never carry markup. React escapes text on render as a second line of defence, and the
 * client never uses `dangerouslySetInnerHTML`.
 */
import { CALLSIGN } from '../game/constants';

const DISALLOWED = /[^A-Z0-9 _-]/g;

/** Live input filter: upper-case, safe characters only, at most 12 characters (no trimming). */
export function filterCallsignInput(raw: string): string {
  return raw.toUpperCase().replace(DISALLOWED, '').slice(0, CALLSIGN.maxLength);
}

/** Normalises raw input: upper-case, safe characters only, trimmed, at most 12 characters. */
export function sanitizeCallsign(raw: string): string {
  return raw.toUpperCase().replace(DISALLOWED, '').trim().slice(0, CALLSIGN.maxLength).trim();
}

/** The callsign to use for a run: the sanitised input, or `COMMANDER` when nothing usable remains. */
export function callsignOrDefault(raw: string): string {
  return sanitizeCallsign(raw) || CALLSIGN.fallback;
}
