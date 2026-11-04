/**
 * Serialisable session state and the Memento (`SessionSnapshot`) used for save/resume and
 * chapter checkpoints.
 */
import type { ResourceDelta, ResourceValues } from './ids.js';
import type { ChoiceCommand } from './commands.js';
import type { EndingView, MissionReport, SessionStatus } from './view.js';

/** A delayed effect waiting for its day. */
export interface ScheduledEffect {
  day: number;
  effects: ResourceDelta;
  message: string;
}

/** A follow-up interlude card waiting for its day. */
export interface FollowUp {
  day: number;
  id: string;
}

/** Reference to the card currently on the table. */
export interface CardRef {
  kind: 'node' | 'interlude';
  id: string;
}

/** The part of the state that a chapter checkpoint restores on retry. */
export interface ChapterProgress {
  day: number;
  resources: ResourceValues;
  flags: string[];
  pending: ScheduledEffect[];
  followUps: FollowUp[];
  recent: string[];
  storm: number;
  nightCycle: number;
}

/** Full serialisable game state. */
export interface GameState extends ChapterProgress {
  status: SessionStatus;
  chapterIndex: number;
  card: CardRef | null;
  /** Interlude cards still to draw before the next story node. */
  interludesLeft: number;
  /** Story node to show after the interludes, or `$interludes` to keep drawing until the goal. */
  afterInterludes: string | null;
  facts: string[];
  scienceCount: number;
  achievements: string[];
  achievementEvents: string[];
  cardCount: number;
  chapterDecisions: number;
  retries: Record<string, number>;
  chaptersCleared: string[];
  rng: number;
  ending: EndingView | null;
  endingId: string | null;
  report: MissionReport | null;
}

/** Memento of a whole run. */
export interface SessionSnapshot {
  version: 1;
  seed: number;
  worldId: string;
  difficultyId: string;
  callsign: string;
  commands: ChoiceCommand[];
  state: GameState;
  checkpoint: ChapterProgress | null;
}
