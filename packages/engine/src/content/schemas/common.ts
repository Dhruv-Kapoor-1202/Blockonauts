/**
 * Zod building blocks reused by every content schema: resource keys, effect maps,
 * world-keyed values (text that differs per world) and the condition language.
 */
import { z } from 'zod';
import { RESOURCE_KEYS } from '../../domain/ids.js';

/** Resource key enum (`P`, `F`, `W`, `R`, `M`, `C`, `H`). */
export const ResourceKeySchema = z.enum(RESOURCE_KEYS);

/** A sparse map of resource deltas, e.g. `{ "P": -4, "M": 3 }`. */
export const EffectsSchema = z.partialRecord(ResourceKeySchema, z.number());

/** camelCase flag name. */
export const FlagNameSchema = z
  .string()
  .regex(/^[a-z][A-Za-z0-9]*$/, 'flags must be camelCase, e.g. skippedLeakTest');

/** Non-empty text. */
export const TextSchema = z.string().min(1);

/** A value that can optionally differ per world: either a plain value or `{ moon: ..., mars: ... }`. */
export function worldKeyed<T extends z.ZodType>(inner: T) {
  return z.union([inner, z.record(z.string(), inner)]);
}

/** Days a choice consumes (0 = no time). */
export const DaysSchema = worldKeyed(z.number().int().min(0));

/** All fields optional and AND-ed. Used by variants, conditional gotos and interlude eligibility. */
export const ConditionSchema = z
  .object({
    flags: z.array(FlagNameSchema).optional(),
    notFlags: z.array(FlagNameSchema).optional(),
    anyFlags: z.array(FlagNameSchema).optional(),
    world: z.union([z.string(), z.array(z.string())]).optional(),
    minDay: z.number().int().optional(),
    maxDay: z.number().int().optional(),
    resourceAbove: EffectsSchema.optional(),
    resourceBelow: EffectsSchema.optional(),
    chapterRetries: z.number().int().min(0).optional(),
  })
  .strict();

/** Optional `$schema` pointer that gives teammates VS Code autocomplete. */
export const SchemaPointer = { $schema: z.string().optional() };
