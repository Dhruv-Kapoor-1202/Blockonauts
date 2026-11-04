/**
 * Public API of the COMMANDER engine. Everything the client, server and scripts need is exported
 * from here; internal modules should not be imported directly.
 */
export * from './domain/ids.js';
export * from './domain/commands.js';
export * from './domain/events.js';
export * from './domain/snapshot.js';
export * from './domain/view.js';
export { EngineError } from './errors.js';
export { EventBus } from './events/event-bus.js';
export { SeededRandom, type RandomSource } from './random/seeded-random.js';

export * from './content/schemas/index.js';
export { ContentBundle, type ChapterContent, type ContentData } from './content/bundle.js';
export {
  ContentLoadError,
  ContentLoader,
  formatIssue,
  sourceKey,
  type ContentIssue,
  type LoadedContent,
  type SourceIndex,
} from './content/loader.js';
export { ContentValidator, type ValidationReport } from './content/validator.js';
export { ChapterGraph, type GraphEdge } from './content/chapter-graph.js';
export { chapterToMermaid } from './content/mermaid.js';
export { localizeChoice, localizeDays, localizeText } from './content/world-keyed.js';

export { Campaign } from './narrative/campaign.js';
export { ChapterRunner } from './narrative/chapter-runner.js';
export { ConditionEvaluator, type ConditionContext } from './narrative/condition-evaluator.js';
export { FlagSet } from './narrative/flag-set.js';
export { NodeResolver } from './narrative/node-resolver.js';
export { TextTemplater, type TemplateVars } from './narrative/text-templater.js';

export { AchievementTracker } from './systems/achievement-tracker.js';
export { AriaAdvisor } from './systems/aria-advisor.js';
export { EffectResolver } from './systems/effect-resolver.js';
export { InterludeSelector } from './systems/interlude-selector.js';
export { MissionClock } from './systems/mission-clock.js';
export { FollowUpQueue, ScheduledEffectQueue } from './systems/queues.js';
export { RandomEventTable } from './systems/random-event-table.js';
export { ResourcePool, clampResource } from './systems/resource-pool.js';
export { ScoreCalculator } from './systems/score-calculator.js';
export { SupplySchedule } from './systems/supply-schedule.js';

export { MarsWorld } from './worlds/mars-world.js';
export { MoonWorld } from './worlds/moon-world.js';
export { createWorld } from './worlds/world-registry.js';
export type { World, WeatherState } from './worlds/world.js';

export { GameSession } from './session/game-session.js';
export { GameSessionFactory, type SessionOptions } from './session/game-session-factory.js';
