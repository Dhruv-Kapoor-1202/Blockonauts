/**
 * Barrel for all content schemas plus the inferred TypeScript types used across the engine.
 */
import type { z } from 'zod';
import type {
  AchievementDefSchema,
  CampaignSchema,
  CharacterDefSchema,
  ConfigSchema,
  DifficultyDefSchema,
  FactsAndTipsSchema,
  RandomEventDefSchema,
  ResourceDefSchema,
} from './catalog.js';
import type {
  ChapterSchema,
  ChoiceSchema,
  EndingSchema,
  GambleSchema,
  GotoBranchSchema,
  InterludeSchema,
  StoryNodeSchema,
  VariantSchema,
} from './narrative.js';
import type { ConditionSchema } from './common.js';
import type { WorldDefSchema } from './world.js';

export * from './common.js';
export * from './narrative.js';
export * from './catalog.js';
export * from './world.js';

export type Condition = z.infer<typeof ConditionSchema>;
export type GotoBranch = z.infer<typeof GotoBranchSchema>;
export type Goto = string | GotoBranch[];
export type Gamble = z.infer<typeof GambleSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type StoryNode = z.infer<typeof StoryNodeSchema>;
export type Interlude = z.infer<typeof InterludeSchema>;
export type Ending = z.infer<typeof EndingSchema>;
export type ChapterDef = z.infer<typeof ChapterSchema>;
export type WorldDef = z.infer<typeof WorldDefSchema>;
export type ResourceDef = z.infer<typeof ResourceDefSchema>;
export type CharacterDef = z.infer<typeof CharacterDefSchema>;
export type DifficultyDef = z.infer<typeof DifficultyDefSchema>;
export type AchievementDef = z.infer<typeof AchievementDefSchema>;
export type RandomEventDef = z.infer<typeof RandomEventDefSchema>;
export type FactsAndTips = z.infer<typeof FactsAndTipsSchema>;
export type GameConfig = z.infer<typeof ConfigSchema>;
export type CampaignDef = z.infer<typeof CampaignSchema>;
