/**
 * Tuning values of the client in one place (timings, thresholds, storage keys, limits) so no
 * component hides a magic number. Durations are the prototype's, in milliseconds.
 */

/** Pauses used while playing back the events of one choice. */
export const PLAYBACK = {
  /** Wait before the first day ticks when no gamble sticker was shown. */
  beforeDaysMs: 420,
  /** Wait before the first day ticks after a gamble result sticker. */
  beforeDaysAfterGambleMs: 700,
  /** Pause after each day for ordinary choices. */
  dayMs: 320,
  /** Pause after each day for long choices (see `longChoiceDays`). */
  longDayMs: 240,
  /** A choice taking at least this many days is "long": it gets a "N days pass…" sticker. */
  longChoiceDays: 3,
  /** Pause before leaving the game screen after a failure. */
  failureExitMs: 1100,
  /** Pause before leaving the game screen after a success. */
  successExitMs: 1500,
} as const;

/** Resource meter animation timings. */
export const METER = {
  countUpMs: 450,
  gainFlashMs: 700,
  hitMs: 600,
  popMs: 1500,
  /** Change from which a dot is drawn big. */
  bigDotDelta: 10,
} as const;

/** ARIA speech bubble. */
export const ARIA_BUBBLE_MS = 6000;

/** Pointer-drag tuning of the card. */
export const DRAG = {
  /** Maximum distance that commits a swipe. */
  maxThresholdPx: 110,
  /** Fraction of the card width that commits a swipe (the smaller of the two wins). */
  thresholdRatio: 0.28,
  /** Rotation in degrees per pixel dragged is 1 / this. */
  rotationDivisor: 14,
  /** Vertical follow factor. */
  verticalFactor: 0.12,
  /** Below this horizontal distance no preview is shown. */
  deadZonePx: 14,
  /** The stamp reaches full opacity at `1 / stampBoost` of the threshold. */
  stampBoost: 1.3,
} as const;

/** Card fly-out transform. */
export const FLY_OUT = { distancePercent: 130, dropPx: 60, rotationDeg: 24 } as const;

/** An option taking at least this many days gets the accented duration badge. */
export const LONG_OPTION_DAYS = 2;

/** The "◀ DRAG ▶" hint shows on cards with a file number below this. */
export const DRAG_HINT_CARDS = 2;

/** Width of the zero-padded file number. */
export const FILE_NUMBER_DIGITS = 3;

/** Callsign rules. */
export const CALLSIGN = { maxLength: 12, fallback: 'COMMANDER' } as const;

/** Timeout of the first content request before falling back to the bundled content. */
export const CONTENT_TIMEOUT_MS = 2500;

/** Default timeout of every other API request. */
export const API_TIMEOUT_MS = 6000;

/** Entries shown in TOP COMMANDERS. */
export const LEADERBOARD_SIZE = 5;

/** Saved runs kept in localStorage while offline. */
export const LOCAL_RUN_LIMIT = 10;

/** localStorage keys (all namespaced `commander.`). */
export const STORAGE_KEYS = {
  theme: 'commander.theme',
  player: 'commander.player',
  runs: 'commander.runs',
  leaderboard: 'commander.leaderboard',
  callsign: 'commander.callsign',
} as const;

/** Value at which a meter starts its count-up when the game screen mounts. */
export const METER_START_VALUE = 0;
