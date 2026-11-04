/**
 * SessionContext: the collaborators and shared state of one run, plus small helpers that
 * several session components need (apply resources, raise stickers, resolve the current card).
 * Components receive this object by constructor injection instead of reaching for globals.
 */
import type { ContentBundle } from '../content/bundle.js';
import { localizeChoice } from '../content/world-keyed.js';
import type {
  Choice,
  DifficultyDef,
  Interlude,
  StoryNode,
  WorldDef,
} from '../content/schemas/index.js';
import type { GameEvent, ChangeSource } from '../domain/events.js';
import type { ResourceDelta, Side, Tone } from '../domain/ids.js';
import type { Campaign } from '../narrative/campaign.js';
import type { ChapterRunner } from '../narrative/chapter-runner.js';
import type { ConditionContext, ConditionEvaluator } from '../narrative/condition-evaluator.js';
import type { NodeResolver } from '../narrative/node-resolver.js';
import type { TemplateVars, TextTemplater } from '../narrative/text-templater.js';
import type { EventBus } from '../events/event-bus.js';
import type { SeededRandom } from '../random/seeded-random.js';
import type { AriaAdvisor } from '../systems/aria-advisor.js';
import type { EffectResolver } from '../systems/effect-resolver.js';
import type { InterludeSelector } from '../systems/interlude-selector.js';
import type { RandomEventTable } from '../systems/random-event-table.js';
import type { ScoreCalculator } from '../systems/score-calculator.js';
import type { SupplySchedule } from '../systems/supply-schedule.js';
import type { World, PhaseFlags, WorldViewContext } from '../worlds/world.js';
import { EngineError } from '../errors.js';
import type { SessionState } from './session-state.js';

/** Collaborators injected into the context. */
export interface SessionServices {
  bundle: ContentBundle;
  world: World;
  difficulty: DifficultyDef;
  campaign: Campaign;
  supply: SupplySchedule;
  rng: SeededRandom;
  bus: EventBus<GameEvent>;
  conditions: ConditionEvaluator;
  resolver: NodeResolver;
  templater: TextTemplater;
  effects: EffectResolver;
  selector: InterludeSelector;
  randomEvents: RandomEventTable;
  scorer: ScoreCalculator;
  aria: AriaAdvisor;
  seed: number;
  callsign: string;
}

/** The card currently on the table, fully looked up. */
export interface CurrentCard {
  kind: 'node' | 'interlude';
  card: StoryNode | Interlude;
}

/** Display names for the clock unit in the current chapter. */
export interface UnitNames {
  unit: string;
  units: string;
  label: string;
}

/** Shared state and helpers for session components. */
export class SessionContext {
  constructor(
    readonly services: SessionServices,
    readonly state: SessionState,
  ) {}

  get worldDef(): WorldDef {
    return this.services.world.def;
  }

  /** Runner of the chapter being played. */
  get runner(): ChapterRunner {
    return this.services.campaign.runner(this.state.chapterIndex);
  }

  /** Goal day of the current chapter. */
  get goalDay(): number {
    return this.runner.goalDay(this.worldDef.goalDay);
  }

  /** Unit naming, honouring a chapter's `clock.unit` override. */
  units(): UnitNames {
    const override = this.runner.def.clock?.unitOverride;
    if (!override)
      return {
        unit: this.worldDef.unit,
        units: this.worldDef.units,
        label: this.worldDef.unitLabel,
      };
    return { unit: override, units: `${override}s`, label: override.toUpperCase() };
  }

  /** Context for evaluating conditions right now. */
  conditionContext(): ConditionContext {
    const { state } = this;
    return {
      hasFlag: (flag) => state.flags.has(flag),
      worldId: this.worldDef.id,
      day: state.clock.day,
      resources: state.resources.snapshot(),
      chapterRetries: state.retries[this.runner.id] ?? 0,
    };
  }

  /** Placeholder values for text templates. */
  templateVars(): TemplateVars {
    const names = this.units();
    return {
      unit: names.unit,
      units: names.units,
      planet: this.worldDef.planet,
      nightIn: this.services.world.nightInDays(this.state.clock.day),
    };
  }

  /** Context for world presentation helpers (chips, timeline). */
  worldView(): WorldViewContext {
    return {
      day: this.state.clock.day,
      weather: this.state.weather,
      goalDay: this.goalDay,
      supply: this.services.supply,
    };
  }

  /** The card on the table. @throws EngineError when there is none. */
  currentCard(): CurrentCard {
    const ref = this.state.card;
    if (!ref) throw new EngineError('There is no card on the table');
    const card =
      ref.kind === 'node'
        ? this.services.bundle.node(this.runner.id, ref.id)
        : this.services.bundle.interlude(ref.id);
    if (!card) throw new EngineError(`Card "${ref.id}" not found`);
    return { kind: ref.kind, card };
  }

  /** The concrete choice for a side, resolved for the active world. */
  choiceOf(card: StoryNode | Interlude, side: Side): Choice {
    const choice = localizeChoice(card[side], this.worldDef.id);
    if (!choice)
      throw new EngineError(
        `Card "${card.id}" has no ${side} option for world "${this.worldDef.id}"`,
      );
    return choice;
  }

  /** Applies a delta to the resources and publishes one ResourceChanged per change. */
  applyResources(delta: ResourceDelta, source: ChangeSource): void {
    for (const change of this.state.resources.apply(delta)) {
      this.emit({ type: 'ResourceChanged', ...change, source });
    }
  }

  /** Raises a sticker. */
  sticker(title: string, subtitle: string | undefined, tone: Tone): void {
    this.emit({ type: 'StickerRaised', title, subtitle, tone });
  }

  /** Publishes an event. */
  emit(event: GameEvent): void {
    this.services.bus.emit(event);
  }

  /** Current phase flags (night / storm). */
  phases(): PhaseFlags {
    return this.services.world.phases(this.state.clock.day, this.state.weather);
  }

  /** Publishes PhaseChanged for every flag that differs from `before`. */
  emitPhaseChanges(before: PhaseFlags): void {
    const after = this.phases();
    for (const phase of ['night', 'storm'] as const) {
      if (before[phase] !== after[phase])
        this.emit({ type: 'PhaseChanged', phase, active: after[phase] });
    }
  }

  /** Unlocks any badges whose rules now hold and announces them. */
  checkAchievements(): void {
    const { state } = this;
    const fresh = state.achievements.evaluate({
      day: state.clock.day,
      scienceCount: state.scienceCount,
      factsCount: state.facts.length,
      resources: state.resources,
    });
    for (const def of fresh) this.emit({ type: 'AchievementUnlocked', id: def.id, name: def.name });
  }
}
