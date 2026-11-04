/**
 * Request schemas of every endpoint (body, params, query). Controllers receive only data that has
 * passed these schemas, so no handler performs ad-hoc input checks.
 */
import { z } from 'zod';
import { LEADERBOARD_DEFAULT_LIMIT, LEADERBOARD_MAX_LIMIT } from '../config/constants.js';
import {
  CallsignSchema,
  CommandLogSchema,
  ContentIdSchema,
  SeedSchema,
  UuidSchema,
} from './common.js';

/** `POST /api/players` body. */
export const CreatePlayerBody = z.strictObject({ callsign: CallsignSchema });

/** `/api/progress/:playerId`. */
export const PlayerParams = z.object({ playerId: UuidSchema });

/** `/api/progress/:playerId/:runId`. */
export const RunParams = z.object({ playerId: UuidSchema, runId: UuidSchema });

/** `GET /api/leaderboard` query. */
export const LeaderboardQuerySchema = z.object({
  world: ContentIdSchema.optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LEADERBOARD_MAX_LIMIT)
    .default(LEADERBOARD_DEFAULT_LIMIT),
});

/**
 * `POST /api/leaderboard` body. Strict: the client may only send the inputs of the run, never a
 * score or any other derived value; unknown keys are rejected with 400.
 */
export const SubmitScoreBody = z.strictObject({
  playerId: UuidSchema,
  runId: UuidSchema,
  seed: SeedSchema,
  world: ContentIdSchema,
  difficulty: ContentIdSchema,
  commands: CommandLogSchema,
});

export type CreatePlayerInput = z.infer<typeof CreatePlayerBody>;
export type RunParamsInput = z.infer<typeof RunParams>;
export type PlayerParamsInput = z.infer<typeof PlayerParams>;
export type LeaderboardQueryInput = z.infer<typeof LeaderboardQuerySchema>;
export type SubmitScoreInput = z.infer<typeof SubmitScoreBody>;
