/**
 * Playback plan: a pure function that turns the events the engine emitted for ONE choice into an
 * ordered list of presentation steps (apply this, wait that long, show this sticker...). The engine
 * resolves a whole turn synchronously; this plan re-creates the prototype's pacing from the events,
 * so the ordering rules are unit-testable without React or timers.
 */
import type {
  CardView,
  ChipView,
  GameEvent,
  ResourceKey,
  TimelineCell,
  Tone,
} from '@commander/engine';
import { PLAYBACK } from './constants';

/** A sticker to flash. */
export interface StickerSpec {
  title: string;
  subtitle?: string;
  tone: Tone;
}

/** Where the game screen hands over to. */
export type ExitDestination = 'chapterResult' | 'missionReport';

/** One presentation step. */
export type PlaybackStep =
  | { kind: 'wait'; ms: number }
  | { kind: 'resource'; key: ResourceKey; from: number; to: number; pop: boolean }
  | { kind: 'sticker'; sticker: StickerSpec }
  | { kind: 'note'; fact: string }
  | { kind: 'phase'; phase: 'night' | 'storm'; active: boolean }
  | {
      kind: 'day';
      dayText: string;
      chips: ChipView[];
      timeline: TimelineCell[];
    }
  | { kind: 'card'; card: CardView }
  | { kind: 'exit'; destination: ExitDestination };

/** What the planner needs to know about the choice that was made. */
export interface ChoicePlanContext {
  /** Days the chosen option takes. */
  days: number;
  /** Whether the chosen option is a gamble (its result sticker precedes the passing of time). */
  hasGamble: boolean;
  /** Plural unit word, e.g. `days` / `sols`. */
  units: string;
  /** How long the card fly-out animation lasts. */
  flyOutMs: number;
  /** Builds the "N days pass…" sticker title; defaults to `${days} ${units} pass…`. */
  passTitle?: (days: number, units: string) => string;
}

const defaultPassTitle = (days: number, units: string): string => `${days} ${units} pass…`;

interface ChoicePhase {
  steps: PlaybackStep[];
  next: number;
  gambleShown: boolean;
}

/** Plays the part of a turn that belongs to the choice itself (before any day passes). */
function planChoicePhase(events: readonly GameEvent[], hasGamble: boolean): ChoicePhase {
  const steps: PlaybackStep[] = [];
  let gambleShown = false;
  let index = 0;
  for (; index < events.length; index += 1) {
    const event = events[index] as GameEvent;
    if (event.type === 'ResourceChanged' && event.source === 'choice') {
      steps.push({ kind: 'resource', key: event.key, from: event.from, to: event.to, pop: true });
    } else if (event.type === 'StickerRaised' && hasGamble && !gambleShown) {
      gambleShown = true;
      steps.push({ kind: 'sticker', sticker: toSticker(event) });
    } else if (event.type === 'FactLogged') {
      steps.push({ kind: 'note', fact: event.fact });
      index += 1;
      break;
    } else {
      break;
    }
  }
  return { steps, next: index, gambleShown };
}

function toSticker(event: Extract<GameEvent, { type: 'StickerRaised' }>): StickerSpec {
  return { title: event.title, subtitle: event.subtitle, tone: event.tone };
}

/**
 * Plans the playback of one choice. Order, as in the prototype: card fly-out, choice effects,
 * gamble sticker, field note, a short pause, a "N days pass…" sticker for long choices, then each
 * day (resources without pops for daily upkeep, supplies/delayed effects with pops, stickers, the
 * time panel flip) followed by a pause, then random events and the next card; chapter and mission
 * endings finish with a pause and an `exit` step.
 */
export function planChoice(
  events: readonly GameEvent[],
  context: ChoicePlanContext,
): PlaybackStep[] {
  const passTitle = context.passTitle ?? defaultPassTitle;
  const long = context.days >= PLAYBACK.longChoiceDays;
  const steps: PlaybackStep[] = [{ kind: 'wait', ms: context.flyOutMs }];

  const choice = planChoicePhase(events, context.hasGamble);
  steps.push(...choice.steps);

  const rest = events.slice(choice.next);
  if (rest.some((event) => event.type === 'DayAdvanced')) {
    steps.push({
      kind: 'wait',
      ms: choice.gambleShown ? PLAYBACK.beforeDaysAfterGambleMs : PLAYBACK.beforeDaysMs,
    });
    if (long) {
      steps.push({
        kind: 'sticker',
        sticker: { title: passTitle(context.days, context.units), tone: 'time' },
      });
    }
  }

  let exit: { destination: ExitDestination; success: boolean; title: string } | null = null;
  for (const event of rest) {
    switch (event.type) {
      case 'ResourceChanged':
        steps.push({
          kind: 'resource',
          key: event.key,
          from: event.from,
          to: event.to,
          pop: event.source !== 'tick',
        });
        break;
      case 'StickerRaised':
        steps.push({ kind: 'sticker', sticker: toSticker(event) });
        break;
      case 'FactLogged':
        steps.push({ kind: 'note', fact: event.fact });
        break;
      case 'PhaseChanged':
        steps.push({ kind: 'phase', phase: event.phase, active: event.active });
        break;
      case 'DayAdvanced':
        steps.push({
          kind: 'day',
          dayText: event.dayText,
          chips: event.chips,
          timeline: event.timeline,
        });
        steps.push({ kind: 'wait', ms: long ? PLAYBACK.longDayMs : PLAYBACK.dayMs });
        break;
      case 'NodePresented':
        steps.push({ kind: 'card', card: event.card });
        break;
      case 'ChapterEnded':
        exit = {
          destination: 'chapterResult',
          success: event.ending.outcome === 'advance',
          title: event.ending.title,
        };
        break;
      case 'MissionEnded':
        exit = {
          destination: 'missionReport',
          success: event.report.result === 'win',
          title: event.report.title,
        };
        break;
      default:
        break;
    }
  }

  if (exit) {
    if (exit.success) {
      steps.push({ kind: 'sticker', sticker: { title: exit.title, tone: 'good' } });
    }
    steps.push({
      kind: 'wait',
      ms: exit.success ? PLAYBACK.successExitMs : PLAYBACK.failureExitMs,
    });
    steps.push({ kind: 'exit', destination: exit.destination });
  }
  return steps;
}
