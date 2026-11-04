/**
 * TurnProcessor: resolves one player choice end to end: effects, gambles, delayed effects,
 * facts, the passage of time (daily world rules), random events and the hand-off to the next
 * card. The order of steps intentionally mirrors the original prototype.
 */
import { localizeDays } from '../content/world-keyed.js';
import type { Choice } from '../content/schemas/index.js';
import { EngineError } from '../errors.js';
import { HEALTH_KEY, INTERLUDES_TARGET, type ResourceDelta, type Side } from '../domain/ids.js';
import type { ChapterFlow } from './chapter-flow.js';
import type { SessionContext } from './session-context.js';
import type { ViewBuilder } from './view-builder.js';

/** Processes choices. */
export class TurnProcessor {
  constructor(
    private readonly ctx: SessionContext,
    private readonly flow: ChapterFlow,
    private readonly views: ViewBuilder,
  ) {}

  /** Resolves the chosen side of the current card. */
  choose(side: Side): void {
    const { ctx } = this;
    const { state, services } = ctx;
    if (state.status !== 'playing') throw new EngineError('No card is waiting for a choice');
    const current = ctx.currentCard();
    const choice = ctx.choiceOf(current.card, side);
    const days = localizeDays(choice.days, ctx.worldDef.id);
    const fact = this.views.fact();

    const resolved = services.effects.resolve(choice, services.rng);
    this.setFlags(choice, 'setFlags' in current.card ? current.card.setFlags : undefined);
    ctx.applyResources(resolved.effects, 'choice');
    if (resolved.gamble) {
      ctx.sticker(resolved.gamble.message, undefined, resolved.gamble.tone);
      if (resolved.gamble.winNext) {
        state.followUps.push({
          day: state.clock.day + services.bundle.config.interludes.winNextDelay,
          id: resolved.gamble.winNext,
        });
      }
    }
    if (choice.later) {
      state.pending.schedule({
        day: state.clock.day + choice.later.in + days - 1,
        effects: choice.later.effects,
        message: choice.later.message,
      });
    }
    if (choice.next)
      state.followUps.push({ day: state.clock.day + choice.next.in, id: choice.next.id });
    if (choice.sci) state.scienceCount += 1;
    this.logFact(fact);
    state.cardCount += 1;
    state.chapterDecisions += 1;

    const target =
      current.kind === 'node'
        ? services.resolver.resolveGoto(
            resolved.gamble?.goto ?? choice.goto,
            ctx.conditionContext(),
          )
        : undefined;
    if (current.kind === 'node' && target === undefined) {
      throw new EngineError(`Node "${current.card.id}" (${side}) has no matching goto`);
    }

    if (this.failIfDepleted()) return;
    for (let i = 0; i < days; i += 1) {
      this.tick();
      if (state.status !== 'playing') return;
    }
    ctx.checkAchievements();

    if (ctx.runner.simulate && this.goalReached()) return;
    if (ctx.runner.simulate) this.maybeRandomEvent();
    if (this.failIfDepleted()) return;

    if (current.kind === 'interlude') this.flow.afterInterlude();
    else this.flow.moveTo(target ?? INTERLUDES_TARGET);
  }

  private setFlags(choice: Choice, cardFlags: string[] | undefined): void {
    const { flags } = this.ctx.state;
    cardFlags?.forEach((flag) => flags.add(flag));
    choice.setFlags?.forEach((flag) => flags.add(flag));
    choice.clearFlags?.forEach((flag) => flags.remove(flag));
  }

  private logFact(fact: string): void {
    const { state } = this.ctx;
    if (!fact || state.facts.includes(fact)) return;
    state.facts.unshift(fact);
    this.ctx.emit({ type: 'FactLogged', fact });
  }

  private failIfDepleted(): boolean {
    const depleted = this.ctx.state.resources.depleted();
    if (!depleted) return false;
    this.flow.failResource(depleted);
    return true;
  }

  private goalReached(): boolean {
    const { runner, state } = this.ctx;
    const config = runner.def.interludes;
    if (!config || state.clock.day < this.ctx.goalDay) return false;
    this.flow.endChapter(config.goalEnding);
    return true;
  }

  private maybeRandomEvent(): void {
    const { state, services, worldDef } = this.ctx;
    const tuning = services.bundle.config.randomEvents;
    if (!services.rng.chance(tuning.chance) || state.clock.day <= tuning.afterDay) return;
    const event = services.randomEvents.roll(worldDef.id, services.rng);
    if (!event) return;
    this.ctx.applyResources(event.effects, 'event');
    this.ctx.sticker(event.title, undefined, event.tone);
  }

  /** Advances one day, applying the world's daily rules in simulated chapters. */
  private tick(): void {
    const { ctx } = this;
    const { state, services, worldDef } = ctx;
    const before = ctx.phases();
    const day = state.clock.advance();

    if (ctx.runner.simulate) {
      const multiplier = services.difficulty.drainMultiplier;
      const delta: ResourceDelta = {};
      for (const [key, rate] of Object.entries(worldDef.drain) as [keyof ResourceDelta, number][]) {
        delta[key] = -rate * multiplier;
      }
      services.world.applyDay({
        day,
        multiplier,
        delta,
        weather: state.weather,
        rng: services.rng,
        sink: {
          sticker: (title, subtitle, tone) => ctx.sticker(title, subtitle, tone),
          injectCard: (cardId) => state.followUps.unshift({ day, id: cardId }),
          phaseWeathered: () => state.achievements.markEvent('phaseWeathered'),
        },
      });
      const critical = state.resources.criticalCount(services.bundle.config.thresholds.critical);
      if (critical > 0) {
        delta[HEALTH_KEY] =
          (delta[HEALTH_KEY] ?? 0) - critical * services.bundle.config.daily.criticalHealthPenalty;
      }
      ctx.applyResources(delta, 'tick');
      this.deliverSupplies(day);
    }

    this.deliverScheduled(day);
    ctx.emit({
      type: 'DayAdvanced',
      day,
      dayText: this.views.dayText(),
      chips: this.views.chips(),
      timeline: this.views.timeline(),
    });
    ctx.emitPhaseChanges(before);
    this.failIfDepleted();
  }

  private deliverSupplies(day: number): void {
    const { services, worldDef } = this.ctx;
    if (!services.supply.isSupplyDay(day)) return;
    this.ctx.applyResources(worldDef.supply.resources, 'supply');
    const subtitle =
      worldDef.supply.subtitle ?? services.bundle.data.factsAndTips.messages.supplySubtitle;
    this.ctx.sticker(worldDef.supply.message, subtitle, 'good');
    this.ctx.state.achievements.markEvent('supplyLanded');
  }

  private deliverScheduled(day: number): void {
    const { state, services } = this.ctx;
    for (const due of state.pending.takeDue(day)) {
      const good = Object.values(due.effects).reduce((sum, n) => sum + n, 0) >= 0;
      this.ctx.applyResources(due.effects, 'scheduled');
      this.ctx.sticker(
        due.message,
        services.bundle.data.factsAndTips.messages.laterLanded,
        good ? 'good' : 'bad',
      );
    }
  }
}
