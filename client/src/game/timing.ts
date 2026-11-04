/**
 * Timing: the single place where the client waits. Every delay (playback pauses, sticker slots,
 * count-ups, pop lifetimes) goes through it, so `?fast` (and tests) can make them all zero.
 */

/** Scales and awaits durations. */
export interface Timing {
  /** True when every delay is zero. */
  readonly fast: boolean;
  /** Converts a nominal duration into the effective one. */
  scale(ms: number): number;
  /** Resolves after the effective duration. */
  wait(ms: number): Promise<void>;
}

/** Real-time timing. */
export const REAL_TIMING: Timing = {
  fast: false,
  scale: (ms) => ms,
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** Zero-delay timing (`?fast`, tests). Waits still yield to the event loop once. */
export const FAST_TIMING: Timing = {
  fast: true,
  scale: () => 0,
  wait: () => Promise.resolve(),
};

/** Parameter that turns every delay off. */
export const FAST_QUERY_PARAM = 'fast';

/** Picks the timing for a URL query string (`?fast` => zero delays). */
export function timingFromSearch(search: string): Timing {
  return new URLSearchParams(search).has(FAST_QUERY_PARAM) ? FAST_TIMING : REAL_TIMING;
}
