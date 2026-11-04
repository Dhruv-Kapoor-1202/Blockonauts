/**
 * Zod building blocks shared by every request schema: identifiers, callsigns and the command log
 * entries of the engine's `ChoiceCommand` union.
 */
import { z } from 'zod';
import {
  CALLSIGN_MAX_LENGTH,
  CALLSIGN_MIN_LENGTH,
  MAX_COMMANDS,
  MAX_ID_LENGTH,
} from '../config/constants.js';

/** Id minted by the server or the client with `crypto.randomUUID()`. */
export const UuidSchema = z.uuid();

/** World, difficulty, chapter and card identifiers (`moon`, `ch0-launch-day`...). */
export const ContentIdSchema = z
  .string()
  .min(1)
  .max(MAX_ID_LENGTH)
  .regex(/^[A-Za-z0-9_.-]+$/, 'must contain only letters, digits, dot, underscore or dash');

/** Callsign as typed by a player: trimmed, 1-12 characters, upper-cased. */
export const CallsignSchema = z
  .string()
  .trim()
  .min(CALLSIGN_MIN_LENGTH, 'callsign is required')
  .max(CALLSIGN_MAX_LENGTH, `callsign must be at most ${CALLSIGN_MAX_LENGTH} characters`)
  .regex(/^[A-Za-z0-9 _-]+$/, 'callsign may only contain letters, digits, space, _ and -')
  .transform((value) => value.toUpperCase());

/** One player input; strict so unknown keys are rejected. */
export const CommandSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('choose'), side: z.enum(['left', 'right']) }),
  z.strictObject({ kind: z.literal('proceed') }),
]);

/** A bounded command log. */
export const CommandLogSchema = z.array(CommandSchema).max(MAX_COMMANDS);

/** Integer seed (the engine coerces it to uint32). */
export const SeedSchema = z.number().int();
