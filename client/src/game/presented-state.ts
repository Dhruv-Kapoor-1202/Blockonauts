/**
 * Presented state: what the UI currently SHOWS, which lags behind the engine's final state while a
 * turn is being played back. `applyStep` is a pure reducer from playback steps to this state, so the
 * pacing logic stays testable; React just renders the result.
 */
import type {
  CardView,
  ChapterView,
  ChipView,
  GameView,
  ResourceKey,
  ResourceValues,
  Side,
  TimelineCell,
} from '@commander/engine';
import type { PlaybackStep } from './playback-plan';

/** The latest change of one resource, used by the meter for ghost bars, pops and shakes. */
export interface ResourceMotion {
  /** Increases on every change so equal changes still retrigger animations. */
  seq: number;
  from: number;
  to: number;
  /** Whether to flash a `+N/-N` pop and shake (false for daily upkeep). */
  pop: boolean;
}

/** The slice of the game the screen renders. */
export interface PresentedState {
  worldId: string;
  unit: string;
  units: string;
  unitLabel: string;
  resources: ResourceValues;
  motions: Partial<Record<ResourceKey, ResourceMotion>>;
  motionSeq: number;
  dayText: string;
  /** Increases every time the day changes (retriggers the flip animation). */
  dayTick: number;
  chips: ChipView[];
  timeline: TimelineCell[];
  night: boolean;
  storm: boolean;
  notes: string[];
  notesMax: number;
  /** The note that just arrived (animated in). */
  freshNote: string | null;
  card: CardView | null;
  /** Increases every time a new card is dealt. */
  cardSeq: number;
  chapter: ChapterView;
  /** The side the card is flying out to, while input is locked. */
  flyOut: Side | null;
  /** Input is locked while a turn plays back. */
  busy: boolean;
}

/** Builds the presented state from a full game view (start, resume, chapter change). */
export function presentedFromView(view: GameView, notesMax: number): PresentedState {
  return {
    worldId: view.worldId,
    unit: view.unit,
    units: view.units,
    unitLabel: view.unitLabel,
    resources: { ...view.resources },
    motions: {},
    motionSeq: 0,
    dayText: view.dayText,
    dayTick: 0,
    chips: view.chips,
    timeline: view.timeline,
    night: view.night,
    storm: view.storm,
    notes: view.notes,
    notesMax,
    freshNote: null,
    card: view.card,
    cardSeq: 1,
    chapter: view.chapter,
    flyOut: null,
    busy: false,
  };
}

/** Brings the presented state in line with the engine's final view without animating. */
export function reconcileWithView(state: PresentedState, view: GameView): PresentedState {
  return {
    ...state,
    resources: { ...view.resources },
    dayText: view.dayText,
    chips: view.chips,
    timeline: view.timeline,
    night: view.night,
    storm: view.storm,
    notes: view.notes,
    chapter: view.chapter,
    card: view.card ?? state.card,
    flyOut: null,
    busy: false,
  };
}

/** Applies one presentation step. `wait`, `sticker` and `exit` do not touch this state. */
export function applyStep(state: PresentedState, step: PlaybackStep): PresentedState {
  switch (step.kind) {
    case 'resource': {
      const seq = state.motionSeq + 1;
      return {
        ...state,
        resources: { ...state.resources, [step.key]: step.to },
        motions: {
          ...state.motions,
          [step.key]: { seq, from: step.from, to: step.to, pop: step.pop },
        },
        motionSeq: seq,
      };
    }
    case 'note':
      return {
        ...state,
        notes: [step.fact, ...state.notes.filter((note) => note !== step.fact)].slice(
          0,
          state.notesMax,
        ),
        freshNote: step.fact,
      };
    case 'phase':
      return { ...state, [step.phase]: step.active };
    case 'day':
      return {
        ...state,
        dayText: step.dayText,
        dayTick: state.dayTick + 1,
        chips: step.chips,
        timeline: step.timeline,
      };
    case 'card':
      return { ...state, card: step.card, cardSeq: state.cardSeq + 1, flyOut: null };
    case 'wait':
    case 'sticker':
    case 'exit':
      return state;
  }
}
