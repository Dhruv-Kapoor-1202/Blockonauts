/**
 * GameSessionFactory (Factory pattern): wires every collaborator of a session so callers only
 * supply content, world, difficulty, seed and callsign. Also rebuilds sessions from snapshots
 * and replays command logs (used by the server to verify leaderboard scores).
 */
import type { ContentBundle } from '../content/bundle.js';
import type { ChoiceCommand } from '../domain/commands.js';
import type { GameEvent } from '../domain/events.js';
import type { DifficultyId, WorldId } from '../domain/ids.js';
import type { SessionSnapshot } from '../domain/snapshot.js';
import { EventBus } from '../events/event-bus.js';
import { Campaign } from '../narrative/campaign.js';
import { ConditionEvaluator } from '../narrative/condition-evaluator.js';
import { NodeResolver } from '../narrative/node-resolver.js';
import { TextTemplater } from '../narrative/text-templater.js';
import { SeededRandom } from '../random/seeded-random.js';
import { AriaAdvisor } from '../systems/aria-advisor.js';
import { EffectResolver } from '../systems/effect-resolver.js';
import { InterludeSelector } from '../systems/interlude-selector.js';
import { RandomEventTable } from '../systems/random-event-table.js';
import { ScoreCalculator } from '../systems/score-calculator.js';
import { SupplySchedule } from '../systems/supply-schedule.js';
import { createWorld } from '../worlds/world-registry.js';
import { ChapterFlow } from './chapter-flow.js';
import { GameSession } from './game-session.js';
import { SessionContext } from './session-context.js';
import { SessionState } from './session-state.js';
import { TurnProcessor } from './turn-processor.js';
import { ViewBuilder } from './view-builder.js';

/** Everything needed to create a run. */
export interface SessionOptions {
  bundle: ContentBundle;
  worldId: WorldId;
  difficultyId: DifficultyId;
  seed: number;
  callsign: string;
}

/** Builds sessions. */
export class GameSessionFactory {
  /** Creates a session and starts it at the first chapter. */
  static create(options: SessionOptions): GameSession {
    const session = GameSessionFactory.createIdle(options);
    session.start();
    return session;
  }

  /** Creates a session that has not started (used before `restore`). */
  static createIdle(options: SessionOptions): GameSession {
    const { bundle, worldId, difficultyId, seed, callsign } = options;
    const worldDef = bundle.world(worldId);
    const config = bundle.config;
    const rng = new SeededRandom(seed);
    const conditions = new ConditionEvaluator();
    const state = new SessionState(worldDef.startResources, bundle.data.achievements);
    const ctx = new SessionContext(
      {
        bundle,
        world: createWorld(worldDef),
        difficulty: bundle.difficulty(difficultyId),
        campaign: new Campaign(bundle, worldId),
        supply: new SupplySchedule(worldDef.supply.every, worldDef.supply.offset),
        rng,
        bus: new EventBus<GameEvent>(),
        conditions,
        resolver: new NodeResolver(conditions),
        templater: new TextTemplater(),
        effects: new EffectResolver(),
        selector: new InterludeSelector(bundle.data.interludes, conditions, rng, config.interludes),
        randomEvents: new RandomEventTable(bundle.data.factsAndTips.randomEvents),
        scorer: new ScoreCalculator(config.scoring),
        aria: new AriaAdvisor(bundle.data.factsAndTips),
        seed,
        callsign,
      },
      state,
    );
    const views = new ViewBuilder(ctx);
    const flow = new ChapterFlow(ctx, views);
    return new GameSession(ctx, flow, new TurnProcessor(ctx, flow, views), views);
  }

  /** Rebuilds a session from a snapshot. */
  static restore(bundle: ContentBundle, snapshot: SessionSnapshot): GameSession {
    const session = GameSessionFactory.createIdle({
      bundle,
      worldId: snapshot.worldId,
      difficultyId: snapshot.difficultyId,
      seed: snapshot.seed,
      callsign: snapshot.callsign,
    });
    session.restore(snapshot);
    return session;
  }

  /** Replays a command log from scratch. @throws EngineError when a command is invalid. */
  static replay(options: SessionOptions, commands: readonly ChoiceCommand[]): GameSession {
    const session = GameSessionFactory.create(options);
    for (const command of commands) session.apply(command);
    return session;
  }
}
