/**
 * Zod schemas for worlds. A world is a JSON file plus one Strategy class selected by `strategy`.
 */
import { z } from 'zod';
import { EffectsSchema, ResourceKeySchema, SchemaPointer, TextSchema } from './common.js';

/** Sticker copy (`{n}` is replaced by the world with a number where relevant). */
export const StickerCopySchema = z
  .object({ title: TextSchema, subtitle: z.string().optional() })
  .strict();

/** Starting values for all seven resources. */
export const ResourceValuesSchema = z
  .object({
    P: z.number(),
    F: z.number(),
    W: z.number(),
    R: z.number(),
    M: z.number(),
    C: z.number(),
    H: z.number(),
  })
  .strict();

/** Tuning for the lunar day/night strategy. */
export const LunarParamsSchema = z
  .object({
    cycleLength: z.number().int().min(2),
    nightStartsAt: z.number().int().min(1),
    nightPowerDrain: z.number(),
    dayPowerGain: z.number(),
    warningFrom: z.number().int(),
    warningTo: z.number().int(),
    warningCard: z.string().min(1),
    nightMessage: StickerCopySchema,
    sunriseMessage: StickerCopySchema,
  })
  .strict();

/** Tuning for the Martian dust-storm strategy. */
export const DustParamsSchema = z
  .object({
    stormStartsAfterDay: z.number().int(),
    stormChance: z.number().min(0).max(1),
    stormMinLength: z.number().int().min(1),
    stormLengthSpread: z.number().int().min(1),
    stormPowerDrain: z.number(),
    stormCommsDrain: z.number(),
    stormCard: z.string().min(1),
    timelineWindow: z.number().int().min(4),
    timelineLookBehind: z.number().int().min(0),
    commsDelay: z.object({ base: z.number(), step: z.number(), modulo: z.number() }).strict(),
    stormMessage: StickerCopySchema,
    clearMessage: StickerCopySchema,
  })
  .strict();

const worldShape = {
  ...SchemaPointer,
  id: z.string().min(1),
  name: TextSchema,
  title: TextSchema,
  location: TextSchema,
  planet: TextSchema,
  unit: TextSchema,
  units: TextSchema,
  unitLabel: TextSchema,
  goalDay: z.number().int().min(1),
  goalName: TextSchema,
  supply: z
    .object({
      every: z.number().int().min(1),
      offset: z.number().int().min(0),
      resources: EffectsSchema,
      message: TextSchema,
      chipLabel: TextSchema,
      subtitle: z.string().optional(),
    })
    .strict(),
  startResources: ResourceValuesSchema,
  drain: z.partialRecord(ResourceKeySchema, z.number()),
  spec: z.array(z.object({ label: TextSchema, value: TextSchema }).strict()),
};

/** A world file; `strategy` selects which `World` implementation interprets `params`. */
export const WorldDefSchema = z.discriminatedUnion('strategy', [
  z.object({ ...worldShape, strategy: z.literal('lunar'), params: LunarParamsSchema }).strict(),
  z.object({ ...worldShape, strategy: z.literal('dust'), params: DustParamsSchema }).strict(),
]);
