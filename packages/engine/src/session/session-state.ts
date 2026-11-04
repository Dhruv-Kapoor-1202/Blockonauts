/**
 * SessionState: the mutable, serialisable state of one run. It owns the small state objects
 * (resources, flags, clock, queues, achievements) and converts to/from the plain `GameState`
 * used by snapshots (Memento).
 */
import type { AchievementDef } from '../content/schemas/index.js';
import type { ResourceValues } from '../domain/ids.js';
import type { CardRef, ChapterProgress, GameState } from '../domain/snapshot.js';
import type { EndingView, MissionReport, SessionStatus } from '../domain/view.js';
import { FlagSet } from '../narrative/flag-set.js';
import { AchievementTracker } from '../systems/achievement-tracker.js';
import { MissionClock } from '../systems/mission-clock.js';
import { FollowUpQueue, ScheduledEffectQueue } from '../systems/queues.js';
import { ResourcePool } from '../systems/resource-pool.js';
import type { WeatherState } from '../worlds/world.js';

/** Everything that changes during play. */
export class SessionState {
  readonly resources: ResourcePool;
  readonly flags = new FlagSet();
  readonly clock = new MissionClock();
  readonly pending = new ScheduledEffectQueue();
  readonly followUps = new FollowUpQueue();
  readonly achievements: AchievementTracker;
  readonly weather: WeatherState = { storm: 0, nightCycle: -1 };

  status: SessionStatus = 'idle';
  chapterIndex = 0;
  card: CardRef | null = null;
  interludesLeft = 0;
  afterInterludes: string | null = null;
  recent: string[] = [];
  /** Field notes, newest first. */
  facts: string[] = [];
  scienceCount = 0;
  cardCount = 0;
  chapterDecisions = 0;
  retries: Record<string, number> = {};
  chaptersCleared: string[] = [];
  ending: EndingView | null = null;
  endingId: string | null = null;
  report: MissionReport | null = null;
  checkpoint: ChapterProgress | null = null;

  /** @param start starting resources. @param achievementDefs badge definitions. */
  constructor(start: ResourceValues, achievementDefs: readonly AchievementDef[]) {
    this.resources = new ResourcePool(start);
    this.achievements = new AchievementTracker(achievementDefs);
  }

  /** The part of the state a chapter checkpoint captures. */
  progress(): ChapterProgress {
    return {
      day: this.clock.day,
      resources: this.resources.snapshot(),
      flags: this.flags.all(),
      pending: this.pending.snapshot(),
      followUps: this.followUps.snapshot(),
      recent: [...this.recent],
      storm: this.weather.storm,
      nightCycle: this.weather.nightCycle,
    };
  }

  /** Restores a checkpoint. */
  loadProgress(progress: ChapterProgress): void {
    this.clock.set(progress.day);
    this.resources.restore(progress.resources);
    this.flags.restore(progress.flags);
    this.pending.restore(progress.pending);
    this.followUps.restore(progress.followUps);
    this.recent = [...progress.recent];
    this.weather.storm = progress.storm;
    this.weather.nightCycle = progress.nightCycle;
  }

  /** Serialises everything. */
  toState(rng: number): GameState {
    const achievements = this.achievements.snapshot();
    return {
      ...this.progress(),
      status: this.status,
      chapterIndex: this.chapterIndex,
      card: this.card ? { ...this.card } : null,
      interludesLeft: this.interludesLeft,
      afterInterludes: this.afterInterludes,
      facts: [...this.facts],
      scienceCount: this.scienceCount,
      achievements: achievements.unlocked,
      achievementEvents: achievements.events,
      cardCount: this.cardCount,
      chapterDecisions: this.chapterDecisions,
      retries: { ...this.retries },
      chaptersCleared: [...this.chaptersCleared],
      rng,
      ending: this.ending,
      endingId: this.endingId,
      report: this.report,
    };
  }

  /** Loads a serialised state (everything except the RNG, which the session owns). */
  load(state: GameState, checkpoint: ChapterProgress | null): void {
    this.loadProgress(state);
    this.status = state.status;
    this.chapterIndex = state.chapterIndex;
    this.card = state.card ? { ...state.card } : null;
    this.interludesLeft = state.interludesLeft;
    this.afterInterludes = state.afterInterludes;
    this.facts = [...state.facts];
    this.scienceCount = state.scienceCount;
    this.achievements.restore({ unlocked: state.achievements, events: state.achievementEvents });
    this.cardCount = state.cardCount;
    this.chapterDecisions = state.chapterDecisions;
    this.retries = { ...state.retries };
    this.chaptersCleared = [...state.chaptersCleared];
    this.ending = state.ending;
    this.endingId = state.endingId;
    this.report = state.report;
    this.checkpoint = checkpoint;
  }
}
