/**
 * Read-only view models the engine hands to the UI. They contain everything a presentational
 * component needs (already templated text, chips, timeline) so the UI holds no game logic.
 */
import type { ResourceDelta, ResourceKey, ResourceValues, WorldId } from './ids.js';

/** Preview of one option's consequences, shown while the card is dragged or hovered. */
export interface ChoicePreview {
  label: string;
  days: number;
  /** Certain immediate deltas. */
  effects: ResourceDelta;
  /** Keys that might change (gamble or delayed effects) but are not certain. */
  uncertain: ResourceKey[];
  hasGamble: boolean;
}

/** A card as presented to the player. */
export interface CardView {
  kind: 'node' | 'interlude';
  id: string;
  speakerId: string;
  tag: string;
  text: string;
  /** Running count of cards shown this mission (the prototype's FILE number). */
  fileNumber: number;
  left: ChoicePreview;
  right: ChoicePreview;
}

/** A small status chip (night/dawn, supply ETA, storm, comms delay, goal countdown). */
export interface ChipView {
  id: string;
  text: string;
  hot: boolean;
}

/** One cell of the timeline strip. */
export interface TimelineCell {
  kind: 'lit' | 'dark';
  past: boolean;
  now: boolean;
  supply: boolean;
  storm: boolean;
}

/** Where the player is in the campaign. */
export interface ChapterView {
  index: number;
  count: number;
  id: string;
  title: string;
  goal: string;
  simulate: boolean;
  retries: number;
  /** `null` means unlimited. */
  retryLimit: number | null;
  /** 0..1 progress toward the chapter goal (survival) or through decisions (story). */
  progress: number;
  decisions: number;
}

/** A chapter ending presented on the result screen. */
export interface EndingView {
  id: string;
  title: string;
  text: string;
  lesson?: string;
  outcome: 'advance' | 'retry' | 'missionEnd';
  /** What the primary button does. */
  next: 'continue' | 'retry' | 'report';
  retriesLeft: number | null;
}

/** A key decision recalled in the mission report. */
export interface KeyDecision {
  flag: string;
  text: string;
}

/** End-of-mission summary. */
export interface MissionReport {
  result: 'win' | 'loss';
  title: string;
  text: string;
  lesson?: string;
  worldId: WorldId;
  worldName: string;
  day: number;
  unitsLabel: string;
  score: number;
  factsLogged: number;
  learned: string[];
  achievements: string[];
  chaptersCleared: number;
  chaptersTotal: number;
  retries: number;
  keyDecisions: KeyDecision[];
}

/** Lifecycle of a session. */
export type SessionStatus = 'idle' | 'playing' | 'chapterResult' | 'missionOver';

/** Everything the UI renders. */
export interface GameView {
  status: SessionStatus;
  worldId: WorldId;
  worldName: string;
  unit: string;
  units: string;
  unitLabel: string;
  day: number;
  dayText: string;
  resources: ResourceValues;
  chapter: ChapterView;
  card: CardView | null;
  chips: ChipView[];
  timeline: TimelineCell[];
  night: boolean;
  storm: boolean;
  alert: boolean;
  notes: string[];
  ending: EndingView | null;
  report: MissionReport | null;
}
