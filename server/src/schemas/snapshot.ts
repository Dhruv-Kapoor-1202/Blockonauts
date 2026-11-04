/**
 * Zod schema of the engine's `SessionSnapshot` memento. Fields the server reads or that the
 * client relies on are checked precisely (status, chapter, day, the seven resources in 0..100,
 * flags, queues, command log); engine-internal nested view models (`ending`, `report`) are only
 * required to be objects so engine changes do not break saving.
 */
import type { EndingView, MissionReport } from '@commander/engine';
import { RESOURCE_KEYS } from '@commander/engine';
import { z } from 'zod';
import {
  MAX_ID_LENGTH,
  MAX_SNAPSHOT_LIST,
  RESOURCE_MAX_VALUE,
  RESOURCE_MIN_VALUE,
} from '../config/constants.js';
import { CommandLogSchema, ContentIdSchema, SeedSchema } from './common.js';

const resource = z.number().min(RESOURCE_MIN_VALUE).max(RESOURCE_MAX_VALUE);
const text = z.string().max(MAX_SNAPSHOT_LIST);
const textList = z.array(text).max(MAX_SNAPSHOT_LIST);
const count = z.number().int().min(0);
const isObject = (value: unknown): boolean => typeof value === 'object' && value !== null;

/** Resource values: exactly the seven keys P F W R M C H, each 0..100. */
export const ResourceValuesSchema = z.strictObject({
  P: resource,
  F: resource,
  W: resource,
  R: resource,
  M: resource,
  C: resource,
  H: resource,
});

const EffectsSchema = z.partialRecord(z.enum(RESOURCE_KEYS), z.number());

const chapterProgressShape = {
  day: z.number().int(),
  resources: ResourceValuesSchema,
  flags: z.array(z.string().max(MAX_ID_LENGTH)).max(MAX_SNAPSHOT_LIST),
  pending: z
    .array(z.object({ day: z.number().int(), effects: EffectsSchema, message: text }))
    .max(MAX_SNAPSHOT_LIST),
  followUps: z
    .array(z.object({ day: z.number().int(), id: ContentIdSchema }))
    .max(MAX_SNAPSHOT_LIST),
  recent: textList,
  storm: z.number(),
  nightCycle: z.number(),
};

/** The part of the state restored when a chapter is retried. */
export const ChapterProgressSchema = z.object(chapterProgressShape);

const GameStateSchema = z.looseObject({
  ...chapterProgressShape,
  status: z.enum(['idle', 'playing', 'chapterResult', 'missionOver']),
  chapterIndex: count,
  card: z.object({ kind: z.enum(['node', 'interlude']), id: ContentIdSchema }).nullable(),
  interludesLeft: count,
  afterInterludes: z.string().max(MAX_ID_LENGTH).nullable(),
  facts: textList,
  scienceCount: count,
  achievements: textList,
  achievementEvents: textList,
  cardCount: count,
  chapterDecisions: count,
  retries: z.record(z.string().max(MAX_ID_LENGTH), count),
  chaptersCleared: textList,
  rng: z.number().int(),
  ending: z.custom<EndingView>(isObject).nullable(),
  endingId: z.string().max(MAX_ID_LENGTH).nullable(),
  report: z.custom<MissionReport>(isObject).nullable(),
});

/** Body of `PUT /api/progress/:playerId/:runId`. */
export const SnapshotSchema = z.object({
  version: z.literal(1),
  seed: SeedSchema,
  worldId: ContentIdSchema,
  difficultyId: ContentIdSchema,
  callsign: z.string().min(1).max(MAX_ID_LENGTH),
  commands: CommandLogSchema,
  state: GameStateSchema,
  checkpoint: ChapterProgressSchema.nullable(),
});

/** Validated snapshot body. */
export type SnapshotInput = z.infer<typeof SnapshotSchema>;
