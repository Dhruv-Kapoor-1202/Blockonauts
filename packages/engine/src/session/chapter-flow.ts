/**
 * ChapterFlow: moves the campaign forward. It starts chapters (with checkpoints), routes a
 * `goto` target to a node / ending / interlude, handles chapter endings and retries, and
 * builds the final mission report.
 */
import { EngineError } from '../errors.js';
import { localizeText } from '../content/world-keyed.js';
import type { CardRef } from '../domain/snapshot.js';
import { INTERLUDES_TARGET, type ResourceDelta, type ResourceKey } from '../domain/ids.js';
import type { EndingView, MissionReport } from '../domain/view.js';
import type { SessionContext } from './session-context.js';
import type { ViewBuilder } from './view-builder.js';

/** A normalised ending, whether declared or produced by a resource failure. */
interface EndingSpec {
  id: string;
  outcome: 'advance' | 'retry' | 'missionEnd';
  title: string;
  text: string;
  lesson?: string;
  setFlags?: string[];
  carryEffects?: ResourceDelta;
  result?: 'win' | 'loss';
}

/** Sentinel ending id used when a resource hits zero. */
const RESOURCE_FAILURE_ID = '$resourceFailure';

/** Drives chapter transitions. */
export class ChapterFlow {
  constructor(
    private readonly ctx: SessionContext,
    private readonly views: ViewBuilder,
  ) {}

  /** Starts a chapter fresh (taking a checkpoint) or restarts it from its checkpoint. */
  startChapter(index: number, retry: boolean): void {
    const { state } = this.ctx;
    const before = this.ctx.phases();
    state.chapterIndex = index;
    const runner = this.ctx.runner;
    if (retry) {
      if (!state.checkpoint) throw new EngineError('No checkpoint to restore');
      state.loadProgress(state.checkpoint);
    } else {
      const startDay = runner.startDay ?? state.clock.day;
      const shift = startDay - state.clock.day;
      state.pending.rebase(shift);
      state.followUps.rebase(shift);
      state.clock.set(startDay);
      state.weather.storm = 0;
      state.weather.nightCycle = -1;
      state.recent = [];
      state.checkpoint = state.progress();
    }
    Object.assign(state, {
      chapterDecisions: 0,
      interludesLeft: 0,
      afterInterludes: null,
      ending: null,
      endingId: null,
      status: 'playing',
    });
    this.ctx.emit({ type: 'ChapterStarted', chapterId: runner.id, index });
    this.ctx.emitPhaseChanges(before);
    this.presentCard({ kind: 'node', id: runner.def.startNode });
  }

  /** Follows a resolved `goto` target. */
  moveTo(target: string): void {
    const { runner, state, services } = this.ctx;
    switch (runner.classify(target)) {
      case 'ending':
        this.endChapter(target);
        return;
      case 'interludes':
        state.afterInterludes = INTERLUDES_TARGET;
        state.interludesLeft = 0;
        if (!this.drawInterlude())
          throw new EngineError(`No interlude card is eligible in "${runner.id}"`);
        return;
      case 'node': {
        const config = runner.def.interludes;
        if (runner.usesInterludes && config) {
          state.afterInterludes = target;
          state.interludesLeft = services.rng.int(config.every[0], config.every[1]);
          if (this.drawInterlude()) return;
        }
        state.afterInterludes = null;
        state.interludesLeft = 0;
        this.presentCard({ kind: 'node', id: target });
        return;
      }
      case 'unknown':
        throw new EngineError(`Chapter "${runner.id}" has no node or ending "${target}"`);
    }
  }

  /** Called after an interlude is resolved: draw another or return to the story. */
  afterInterlude(): void {
    const { state } = this.ctx;
    state.interludesLeft = Math.max(0, state.interludesLeft - 1);
    const keepDrawing = state.afterInterludes === INTERLUDES_TARGET || state.interludesLeft > 0;
    if (keepDrawing && this.drawInterlude()) return;
    const next = state.afterInterludes;
    state.afterInterludes = null;
    state.interludesLeft = 0;
    if (!next || next === INTERLUDES_TARGET) throw new EngineError('No interlude card is eligible');
    this.presentCard({ kind: 'node', id: next });
  }

  /** Ends the chapter because a resource reached zero. */
  failResource(key: ResourceKey): void {
    const { runner, worldDef, services } = this.ctx;
    const failure = runner.def.resourceFailure;
    const death = services.bundle.data.factsAndTips.deaths[key];
    this.finish({
      id: RESOURCE_FAILURE_ID,
      outcome: failure.outcome,
      title: failure.title ?? death.title,
      text: failure.text ?? localizeText(death.text, worldDef.id),
      lesson: failure.lesson,
      result: 'loss',
    });
  }

  /** Ends the chapter at a declared ending. */
  endChapter(endingId: string): void {
    const ending = this.ctx.runner.ending(endingId);
    if (!ending) throw new EngineError(`Unknown ending "${endingId}"`);
    this.finish({ id: endingId, ...ending });
  }

  /** Leaves the result screen: continue to the next chapter or retry the current one. */
  proceed(): void {
    const { state } = this.ctx;
    if (state.status !== 'chapterResult' || !state.ending) {
      throw new EngineError('There is no chapter result to proceed from');
    }
    if (state.ending.next === 'retry') {
      const id = this.ctx.runner.id;
      state.retries[id] = (state.retries[id] ?? 0) + 1;
      this.startChapter(state.chapterIndex, true);
    } else {
      this.startChapter(state.chapterIndex + 1, false);
    }
  }

  private drawInterlude(): boolean {
    const { runner, state, services, worldDef } = this.ctx;
    const config = runner.def.interludes;
    if (!config) return false;
    const drawn = services.selector.draw({
      worldId: worldDef.id,
      pools: config.pools,
      conditions: this.ctx.conditionContext(),
      recent: state.recent,
      followUps: state.followUps,
      day: state.clock.day,
      lowest: state.resources.lowest(),
    });
    if (!drawn) return false;
    state.recent = drawn.recent;
    this.presentCard({ kind: 'interlude', id: drawn.card.id });
    return true;
  }

  private presentCard(ref: CardRef): void {
    this.ctx.state.card = ref;
    this.ctx.emit({ type: 'NodePresented', card: this.views.card() });
  }

  private finish(spec: EndingSpec): void {
    const { state, services } = this.ctx;
    const campaignEnds = services.campaign.isLast(state.chapterIndex);
    const outcome = spec.outcome === 'advance' && campaignEnds ? 'missionEnd' : spec.outcome;
    const won = outcome === 'missionEnd' && spec.result !== 'loss';
    const chapterId = this.ctx.runner.id;
    const used = state.retries[chapterId] ?? 0;
    const limit = services.difficulty.retryLimit;
    const exhausted = outcome === 'retry' && limit !== null && used >= limit;

    if (outcome !== 'retry' && spec.id !== RESOURCE_FAILURE_ID) {
      spec.setFlags?.forEach((flag) => state.flags.add(flag));
      if (spec.carryEffects) this.ctx.applyResources(spec.carryEffects, 'carry');
    }
    if (won || outcome === 'advance') state.chaptersCleared.push(chapterId);

    const view: EndingView = {
      id: spec.id,
      title: spec.title,
      text: spec.text,
      lesson: spec.lesson,
      outcome,
      next:
        outcome === 'advance' ? 'continue' : outcome === 'retry' && !exhausted ? 'retry' : 'report',
      retriesLeft: limit === null ? null : Math.max(0, limit - used),
    };
    state.ending = view;
    state.endingId = spec.id;
    this.ctx.emit({ type: 'ChapterEnded', chapterId, ending: view });

    if (outcome === 'advance') state.status = 'chapterResult';
    else if (outcome === 'retry' && !exhausted) state.status = 'chapterResult';
    else this.endMission(won, view);
  }

  private endMission(won: boolean, ending: EndingView): void {
    const { state, services, worldDef } = this.ctx;
    if (won) state.achievements.markEvent('missionWon');
    this.ctx.checkAchievements();
    const retries = Object.values(state.retries).reduce((sum, n) => sum + n, 0);
    const labels = services.bundle.data.campaign.flagLabels ?? {};
    const report: MissionReport = {
      result: won ? 'win' : 'loss',
      title: ending.title,
      text: ending.text,
      lesson: ending.lesson,
      worldId: worldDef.id,
      worldName: worldDef.name,
      day: state.clock.day,
      unitsLabel: this.ctx.units().units,
      score: services.scorer.compute({
        day: state.clock.day,
        factsLogged: state.facts.length,
        achievements: state.achievements.count,
        won,
        chaptersCleared: state.chaptersCleared.length,
        retries,
      }),
      factsLogged: state.facts.length,
      learned: state.facts.slice(0, 3),
      achievements: state.achievements.ids(),
      chaptersCleared: state.chaptersCleared.length,
      chaptersTotal: services.campaign.count,
      retries,
      keyDecisions: state.flags
        .all()
        .filter((flag) => labels[flag])
        .map((flag) => ({ flag, text: labels[flag] as string })),
    };
    state.status = 'missionOver';
    state.report = report;
    this.ctx.emit({ type: 'MissionEnded', report });
  }
}
