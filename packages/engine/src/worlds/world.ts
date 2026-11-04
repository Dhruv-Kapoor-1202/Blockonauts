/**
 * World (Strategy pattern): the rules that differ per world. The engine talks only to this
 * interface; `MoonWorld` and `MarsWorld` implement it. Adding a world = one class + one JSON file.
 */
import type { RandomSource } from '../random/seeded-random.js';
import type { ResourceDelta, Tone } from '../domain/ids.js';
import type { ChipView, TimelineCell } from '../domain/view.js';
import type { WorldDef } from '../content/schemas/index.js';
import type { SupplySchedule } from '../systems/supply-schedule.js';

/** Mutable weather state owned by the session and updated by the world's daily rules. */
export interface WeatherState {
  /** Remaining storm days (0 = clear). */
  storm: number;
  /** Which lunar cycle already received its night-warning card (-1 = none). */
  nightCycle: number;
}

/** Callbacks a world uses to report side effects of a day. */
export interface DayRuleSink {
  sticker(title: string, subtitle: string | undefined, tone: Tone): void;
  /** Queue a card to be drawn next (injected night/storm card). */
  injectCard(cardId: string): void;
  /** The crew weathered a phase (feeds the WEATHERED IT badge). */
  phaseWeathered(): void;
}

/** Input to a world's daily rules. */
export interface DayRuleContext {
  day: number;
  multiplier: number;
  /** Delta being assembled for this tick; the world may add to it. */
  delta: ResourceDelta;
  weather: WeatherState;
  rng: RandomSource;
  sink: DayRuleSink;
}

/** Read-only context for presentation helpers. */
export interface WorldViewContext {
  day: number;
  weather: WeatherState;
  goalDay: number;
  supply: SupplySchedule;
}

/** Which phase flags are active on a given day. */
export interface PhaseFlags {
  night: boolean;
  storm: boolean;
}

/** Per-world rules. */
export interface World {
  readonly def: WorldDef;
  /** Applies world-specific daily drain/gain and emits stickers. */
  applyDay(ctx: DayRuleContext): void;
  /** Active phases (night veil / storm veil). */
  phases(day: number, weather: WeatherState): PhaseFlags;
  /** Days until the next lunar night, or null if not applicable. */
  nightInDays(day: number): number | null;
  /** Status chips for the time panel, in display order. */
  chips(ctx: WorldViewContext): ChipView[];
  /** Timeline strip cells. */
  timeline(ctx: WorldViewContext): TimelineCell[];
  /** Which ARIA phase tip applies, if any. */
  ariaPhaseTip(day: number, weather: WeatherState): 'night' | 'storm' | null;
}

/** Fills `{n}` in sticker copy. */
export function fillCount(text: string | undefined, n: number): string | undefined {
  return text?.replace(/\{n\}/g, String(n));
}
