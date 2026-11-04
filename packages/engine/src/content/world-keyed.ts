/**
 * World-keyed value resolution. Content may give text, days or a whole choice either as a plain
 * value or as `{ moon: ..., mars: ... }`. These helpers collapse them for the active world.
 */
import type { WorldId } from '../domain/ids.js';
import type { Choice } from './schemas/index.js';

/** Default number of days a choice takes when `days` is omitted. */
export const DEFAULT_CHOICE_DAYS = 1;

/** Resolves world-keyed text. Returns an empty string when the world has no entry. */
export function localizeText(
  value: string | Record<string, string> | undefined,
  world: WorldId,
): string {
  if (value === undefined) return '';
  return typeof value === 'string' ? value : (value[world] ?? '');
}

/** Resolves world-keyed days, applying the default of one day. */
export function localizeDays(
  value: number | Record<string, number> | undefined,
  world: WorldId,
): number {
  if (value === undefined) return DEFAULT_CHOICE_DAYS;
  return typeof value === 'number' ? value : (value[world] ?? DEFAULT_CHOICE_DAYS);
}

/** True when the value is a concrete choice rather than a per-world map of choices. */
export function isChoice(value: Choice | Record<string, Choice>): value is Choice {
  return typeof (value as Choice).label === 'string';
}

/** Resolves a choice that may differ per world. Returns undefined when the world has no variant. */
export function localizeChoice(
  value: Choice | Record<string, Choice>,
  world: WorldId,
): Choice | undefined {
  return isChoice(value) ? value : value[world];
}
