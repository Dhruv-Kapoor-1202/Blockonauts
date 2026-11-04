/**
 * ViewBuilder: assembles the read-only view models (card, chips, timeline, whole game view)
 * handed to the UI. All text templating and variant resolution happens here.
 */
import { localizeText } from '../content/world-keyed.js';
import type { CardView, ChipView, GameView, TimelineCell } from '../domain/view.js';
import { MissionClock } from '../systems/mission-clock.js';
import type { SessionContext } from './session-context.js';

const FALLBACK_TAG = '';

/** Builds view models from the session context. */
export class ViewBuilder {
  constructor(private readonly ctx: SessionContext) {}

  /** The card on the table as the player sees it. */
  card(): CardView {
    const { ctx } = this;
    const { kind, card } = ctx.currentCard();
    const { resolver, templater, effects } = ctx.services;
    const worldId = ctx.worldDef.id;
    const raw = resolver.resolveText(card, worldId, ctx.conditionContext());
    return {
      kind,
      id: card.id,
      speakerId: card.speaker,
      tag: card.tag ?? FALLBACK_TAG,
      text: templater.render(raw, ctx.templateVars()),
      fileNumber: ctx.state.cardCount,
      left: effects.preview(ctx.choiceOf(card, 'left'), worldId),
      right: effects.preview(ctx.choiceOf(card, 'right'), worldId),
    };
  }

  /** The fact attached to the current card, templated. */
  fact(): string {
    const { card } = this.ctx.currentCard();
    return this.ctx.services.templater.render(
      localizeText(card.fact, this.ctx.worldDef.id),
      this.ctx.templateVars(),
    );
  }

  /** The day counter text (`T-3`, `007`). */
  dayText(): string {
    return MissionClock.format(this.ctx.state.clock.day);
  }

  /** Status chips for the time panel. */
  chips(): ChipView[] {
    const { ctx } = this;
    if (ctx.runner.simulate) return ctx.services.world.chips(ctx.worldView());
    return [
      { id: 'chapter', text: `CHAPTER ${ctx.state.chapterIndex}`, hot: false },
      { id: 'decisions', text: `DECISION ${ctx.state.chapterDecisions + 1}`, hot: false },
    ];
  }

  /** Timeline strip cells (empty outside survival chapters). */
  timeline(): TimelineCell[] {
    return this.ctx.runner.simulate ? this.ctx.services.world.timeline(this.ctx.worldView()) : [];
  }

  /** 0..1 progress toward the chapter goal. */
  progress(): number {
    const { ctx } = this;
    if (ctx.runner.simulate) return Math.max(0, Math.min(1, ctx.state.clock.day / ctx.goalDay));
    const ref = ctx.state.card;
    const distance = ref?.kind === 'node' ? (ctx.runner.graph.distanceToEnding(ref.id) ?? 0) : 0;
    const done = ctx.state.chapterDecisions;
    return done + distance === 0 ? 1 : done / (done + distance);
  }

  /** The whole game view. */
  game(): GameView {
    const { ctx } = this;
    const { state, services } = ctx;
    const names = ctx.units();
    const retryLimit = services.difficulty.retryLimit;
    const phases = services.world.phases(state.clock.day, state.weather);
    const playing = state.status === 'playing' && state.card !== null;
    return {
      status: state.status,
      worldId: ctx.worldDef.id,
      worldName: ctx.worldDef.name,
      unit: names.unit,
      units: names.units,
      unitLabel: names.label,
      day: state.clock.day,
      dayText: MissionClock.format(state.clock.day),
      resources: state.resources.snapshot(),
      chapter: {
        index: state.chapterIndex,
        count: services.campaign.count,
        id: ctx.runner.id,
        title: ctx.runner.def.title,
        goal: ctx.runner.def.goal,
        simulate: ctx.runner.simulate,
        retries: state.retries[ctx.runner.id] ?? 0,
        retryLimit,
        progress: this.progress(),
        decisions: state.chapterDecisions,
      },
      card: playing ? this.card() : null,
      chips: this.chips(),
      timeline: this.timeline(),
      night: phases.night,
      storm: phases.storm,
      alert: state.resources.anyBelow(services.bundle.config.thresholds.ariaAlert),
      notes: state.facts.slice(0, services.bundle.config.notes.max),
      ending: state.ending,
      report: state.report,
    };
  }
}
