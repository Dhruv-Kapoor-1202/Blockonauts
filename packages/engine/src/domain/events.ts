/**
 * Events emitted by the engine (Observer pattern). The UI subscribes and plays them back;
 * the engine never calls UI code.
 */
import type { ResourceKey, Tone } from './ids.js';
import type { CardView, ChipView, EndingView, MissionReport, TimelineCell } from './view.js';

/** Why a resource changed; the UI only pops numbers for non-`tick` sources. */
export type ChangeSource = 'choice' | 'tick' | 'supply' | 'scheduled' | 'event' | 'carry';

/** A resource moved from one value to another. */
export interface ResourceChanged {
  type: 'ResourceChanged';
  key: ResourceKey;
  from: number;
  to: number;
  source: ChangeSource;
}

/** A day (or sol) passed; carries what the time panel needs to redraw. */
export interface DayAdvanced {
  type: 'DayAdvanced';
  day: number;
  dayText: string;
  chips: ChipView[];
  timeline: TimelineCell[];
}

/** A sticker should be shown (gamble result, supplies landed, delayed effect, ...). */
export interface StickerRaised {
  type: 'StickerRaised';
  title: string;
  subtitle?: string;
  tone: Tone;
}

/** A new field note was learned. */
export interface FactLogged {
  type: 'FactLogged';
  fact: string;
}

/** A card is now on the table. */
export interface NodePresented {
  type: 'NodePresented';
  card: CardView;
}

/** A chapter just started (first card is already presented). */
export interface ChapterStarted {
  type: 'ChapterStarted';
  chapterId: string;
  index: number;
}

/** A chapter reached an ending. */
export interface ChapterEnded {
  type: 'ChapterEnded';
  chapterId: string;
  ending: EndingView;
}

/** The mission is over (win or loss). */
export interface MissionEnded {
  type: 'MissionEnded';
  report: MissionReport;
}

/** A badge was earned. */
export interface AchievementUnlocked {
  type: 'AchievementUnlocked';
  id: string;
  name: string;
}

/** The world phase flipped (lunar night or dust storm). */
export interface PhaseChanged {
  type: 'PhaseChanged';
  phase: 'night' | 'storm';
  active: boolean;
}

/** Union of every engine event. */
export type GameEvent =
  | ResourceChanged
  | DayAdvanced
  | StickerRaised
  | FactLogged
  | NodePresented
  | ChapterStarted
  | ChapterEnded
  | MissionEnded
  | AchievementUnlocked
  | PhaseChanged;
