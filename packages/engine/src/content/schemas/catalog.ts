/**
 * Zod schemas for catalogue content: resources, characters, difficulties, achievements,
 * tuning config, facts/tips and the campaign order.
 */
import { z } from 'zod';
import {
  FlagNameSchema,
  ResourceKeySchema,
  SchemaPointer,
  TextSchema,
  worldKeyed,
} from './common.js';
import { EffectsSchema } from './common.js';

/** Display data for a resource. `icon` is a key the UI maps to artwork. */
export const ResourceDefSchema = z
  .object({ key: ResourceKeySchema, name: TextSchema, color: TextSchema, icon: TextSchema })
  .strict();

/** Character art parameters (human) or special kind (`ai`, `earth`). */
export const CharacterDefSchema = z
  .object({
    id: z.string().min(1),
    name: TextSchema,
    role: TextSchema,
    color: TextSchema,
    kind: z.enum(['human', 'ai', 'earth']).default('human'),
    skin: z.string().optional(),
    hair: z.string().optional(),
    hairStyle: z.enum(['long', 'short', 'bun', 'curly', 'cap', 'bald']).optional(),
    hat: z.enum(['hard', 'chef']).optional(),
    glasses: z.boolean().optional(),
    headset: z.boolean().optional(),
  })
  .strict();

/** A difficulty. `retryLimit: null` means unlimited chapter retries. */
export const DifficultyDefSchema = z
  .object({
    id: z.string().min(1),
    name: TextSchema,
    description: TextSchema,
    drainMultiplier: z.number().positive(),
    hints: z.boolean(),
    retryLimit: z.number().int().min(0).nullable(),
  })
  .strict();

/** Declarative achievement rules. */
export const AchievementRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('dayAtLeast'), day: z.number().int() }).strict(),
  z
    .object({
      type: z.literal('counterAtLeast'),
      counter: z.enum(['science', 'facts']),
      value: z.number().int(),
    })
    .strict(),
  z
    .object({
      type: z.literal('event'),
      event: z.enum(['phaseWeathered', 'supplyLanded', 'missionWon']),
    })
    .strict(),
  z
    .object({ type: z.literal('balanced'), afterDay: z.number().int(), minEach: z.number() })
    .strict(),
]);

/** A badge the player can earn. */
export const AchievementDefSchema = z
  .object({
    id: z.string().min(1),
    name: TextSchema,
    description: TextSchema,
    rule: AchievementRuleSchema,
  })
  .strict();

/** A random event that can fire on any simulated day. */
export const RandomEventDefSchema = z
  .object({ effects: EffectsSchema, title: TextSchema, tone: z.enum(['good', 'bad']) })
  .strict();

/** Death/failure copy and ARIA tips, plus random events per world. */
export const FactsAndTipsSchema = z
  .object({
    ...SchemaPointer,
    deaths: z.record(
      ResourceKeySchema,
      z.object({ title: TextSchema, text: worldKeyed(TextSchema) }).strict(),
    ),
    tips: z.record(ResourceKeySchema, TextSchema),
    aria: z
      .object({
        night: TextSchema,
        storm: TextSchema,
        nominal: TextSchema,
        gambleHint: TextSchema,
      })
      .strict(),
    randomEvents: z.record(z.string(), z.array(RandomEventDefSchema).min(1)),
    ticker: TextSchema,
    messages: z
      .object({
        laterLanded: TextSchema,
        supplySubtitle: TextSchema,
      })
      .strict(),
  })
  .strict();

/** Global tuning values (no magic numbers in code). */
export const ConfigSchema = z
  .object({
    ...SchemaPointer,
    thresholds: z
      .object({
        low: z.number(),
        critical: z.number(),
        ariaAlert: z.number(),
        ariaTip: z.number(),
      })
      .strict(),
    daily: z.object({ criticalHealthPenalty: z.number() }).strict(),
    randomEvents: z
      .object({ chance: z.number().min(0).max(1), afterDay: z.number().int() })
      .strict(),
    interludes: z
      .object({
        recentMemoryMax: z.number().int(),
        recentMemoryReserve: z.number().int(),
        helpBias: z.number().min(0).max(1),
        winNextDelay: z.number().int(),
      })
      .strict(),
    scoring: z
      .object({
        perDay: z.number(),
        perFact: z.number(),
        perAchievement: z.number(),
        winBonus: z.number(),
        perChapterCleared: z.number(),
        perRetry: z.number(),
      })
      .strict(),
    notes: z.object({ max: z.number().int().min(1) }).strict(),
  })
  .strict();

/** Ordered chapter list per world, plus human labels for flags (used by the mission report). */
export const CampaignSchema = z
  .object({
    ...SchemaPointer,
    sequences: z.record(z.string(), z.array(z.string().min(1)).min(1)),
    flagLabels: z.record(FlagNameSchema, TextSchema).optional(),
  })
  .strict();

/** `resources.json`. */
export const ResourcesFileSchema = z
  .object({ ...SchemaPointer, resources: z.array(ResourceDefSchema).length(7) })
  .strict();
/** `characters.json`. */
export const CharactersFileSchema = z
  .object({ ...SchemaPointer, characters: z.array(CharacterDefSchema).min(1) })
  .strict();
/** `difficulties.json`. */
export const DifficultiesFileSchema = z
  .object({ ...SchemaPointer, difficulties: z.array(DifficultyDefSchema).min(1) })
  .strict();
/** `achievements.json`. */
export const AchievementsFileSchema = z
  .object({ ...SchemaPointer, achievements: z.array(AchievementDefSchema).min(1) })
  .strict();
