/**
 * Tunable limits and defaults of the API in one place so no module hides a magic number. Values
 * that operators may change at deploy time live in `env.ts`; these are product decisions.
 */

/** Default HTTP port. */
export const DEFAULT_PORT = 3001;

/** Default allowed browser origin (the Vite dev server). */
export const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

/** Maximum JSON request body accepted by the API. */
export const JSON_BODY_LIMIT = '1mb';

/** Maximum saved runs per player (updating an existing run never counts against the limit). */
export const MAX_RUNS_PER_PLAYER = 20;

/** Callsign length bounds (after trimming). */
export const CALLSIGN_MIN_LENGTH = 1;
export const CALLSIGN_MAX_LENGTH = 12;

/** Leaderboard page size bounds. */
export const LEADERBOARD_DEFAULT_LIMIT = 10;
export const LEADERBOARD_MAX_LIMIT = 50;

/** Hard cap for a command log; far above any real campaign, it only stops abusive payloads. */
export const MAX_COMMANDS = 5000;

/** Hard cap for string arrays embedded in a snapshot (flags, facts, achievements...). */
export const MAX_SNAPSHOT_LIST = 1000;

/** Maximum length of identifiers such as world ids, difficulty ids or flag names. */
export const MAX_ID_LENGTH = 64;

/** Resource bounds enforced on snapshots (mirrors the engine's clamp). */
export const RESOURCE_MIN_VALUE = 0;
export const RESOURCE_MAX_VALUE = 100;

/** Maximum number of validation issues echoed back in one error message. */
export const MAX_REPORTED_ISSUES = 5;

/** Attempts and delay used when an atomic rename is briefly blocked (typical on Windows). */
export const RENAME_RETRIES = 5;
export const RENAME_RETRY_DELAY_MS = 20;

/** Grace period before a shutdown is forced. */
export const SHUTDOWN_TIMEOUT_MS = 10_000;

/** HTTP status codes used by the error hierarchy. */
export const HTTP = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  NOT_MODIFIED: 304,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE: 422,
  INTERNAL: 500,
} as const;
