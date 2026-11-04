/**
 * Zod schemas for story content: choices, nodes, interlude cards and chapters.
 * These are the contract teammates author against; they are strict so typos fail loudly.
 */
import { z } from 'zod';
import {
  ConditionSchema,
  DaysSchema,
  EffectsSchema,
  FlagNameSchema,
  SchemaPointer,
  TextSchema,
  worldKeyed,
} from './common.js';

/** One conditional branch of a `goto` list. */
export const GotoBranchSchema = z
  .object({ when: ConditionSchema.optional(), to: z.string().min(1) })
  .strict();

/** `goto`: a node/ending id, `$interludes`, or an ordered list where the first match wins. */
export const GotoSchema = z.union([z.string().min(1), z.array(GotoBranchSchema).min(1)]);

/** Gamble settings (the prototype's `ch`). */
export const GambleSchema = z
  .object({
    p: z.number().min(0).max(1),
    win: EffectsSchema,
    lose: EffectsSchema,
    winText: TextSchema,
    loseText: TextSchema,
    winGoto: GotoSchema.optional(),
    loseGoto: GotoSchema.optional(),
    winNext: z.string().optional(),
  })
  .strict();

/** A delayed effect that lands `in` days after the choice resolves. */
export const LaterSchema = z
  .object({ in: z.number().int().min(0), effects: EffectsSchema, message: TextSchema })
  .strict();

/** Queues a follow-up interlude card `in` days from now. */
export const NextCardSchema = z
  .object({ id: z.string().min(1), in: z.number().int().min(0) })
  .strict();

/** One option of a card. */
export const ChoiceSchema = z
  .object({
    label: TextSchema,
    days: DaysSchema.optional(),
    effects: EffectsSchema.optional(),
    setFlags: z.array(FlagNameSchema).optional(),
    clearFlags: z.array(FlagNameSchema).optional(),
    gamble: GambleSchema.optional(),
    later: LaterSchema.optional(),
    next: NextCardSchema.optional(),
    sci: z.boolean().optional(),
    goto: GotoSchema.optional(),
  })
  .strict();

/** A choice, or a `{ moon: choice, mars: choice }` pair. */
export const ChoiceOrWorldsSchema = worldKeyed(ChoiceSchema);

/** Conditional text variant (first match wins). */
export const VariantSchema = z
  .object({ when: ConditionSchema, text: worldKeyed(TextSchema) })
  .strict();

const cardShape = {
  id: z.string().min(1),
  speaker: z.string().min(1),
  tag: z.string().optional(),
  text: worldKeyed(TextSchema),
  variants: z.array(VariantSchema).optional(),
  fact: worldKeyed(TextSchema),
  left: ChoiceOrWorldsSchema,
  right: ChoiceOrWorldsSchema,
};

/** A story node: one card of a chapter's branching graph. */
export const StoryNodeSchema = z.object(cardShape).strict();

/** An interlude card: a survival side-card drawn from a tagged pool. */
export const InterludeSchema = z
  .object({
    ...cardShape,
    pool: z.string().min(1),
    worlds: z.array(z.string()).optional(),
    when: ConditionSchema.optional(),
    followUp: z.boolean().optional(),
    setFlags: z.array(FlagNameSchema).optional(),
  })
  .strict();

/** File shape of `nodes/*.json`. */
export const NodesFileSchema = z
  .object({ ...SchemaPointer, nodes: z.array(StoryNodeSchema).min(1) })
  .strict();

/** File shape of `interludes/*.json`. */
export const InterludesFileSchema = z
  .object({ ...SchemaPointer, interludes: z.array(InterludeSchema).min(1) })
  .strict();

/** What happens to the campaign when an ending is reached. */
export const OutcomeSchema = z.enum(['advance', 'retry', 'missionEnd']);

/** A declared chapter ending. */
export const EndingSchema = z
  .object({
    outcome: OutcomeSchema,
    title: TextSchema,
    text: TextSchema,
    lesson: z.string().optional(),
    setFlags: z.array(FlagNameSchema).optional(),
    carryEffects: EffectsSchema.optional(),
    result: z.enum(['win', 'loss']).optional(),
  })
  .strict();

/** What fires when any resource reaches zero during a chapter. */
export const ResourceFailureSchema = z
  .object({
    outcome: z.enum(['retry', 'missionEnd']),
    title: z.string().optional(),
    text: z.string().optional(),
    lesson: z.string().optional(),
  })
  .strict();

/** Survival settings: interlude cards drawn between story nodes. */
export const InterludeConfigSchema = z
  .object({
    pools: z.array(z.string().min(1)).min(1),
    every: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
    untilDay: z.number().int().optional(),
    goalEnding: z.string().min(1),
  })
  .strict();

/** Chapter clock overrides. `simulate` turns on the daily world rules (drain, phases, supply). */
export const ChapterClockSchema = z
  .object({
    startDay: z.number().int().optional(),
    unitOverride: z.string().optional(),
    simulate: z.boolean().optional(),
  })
  .strict();

/** File shape of `chapter.json`. */
export const ChapterSchema = z
  .object({
    ...SchemaPointer,
    id: z.string().min(1),
    title: TextSchema,
    worlds: z.array(z.string()).min(1),
    goal: TextSchema,
    startNode: z.string().min(1),
    clock: ChapterClockSchema.optional(),
    endings: z.record(z.string().min(1), EndingSchema),
    resourceFailure: ResourceFailureSchema,
    interludes: InterludeConfigSchema.nullable().optional(),
  })
  .strict();
