/**
 * MoonWorld (Strategy): a 28-day light/dark cycle (14 days sun, 14 dark). Nights drain extra
 * power, days add a little, and a night-warning card is injected shortly before dusk.
 */
import type { ChipView, TimelineCell } from '../domain/view.js';
import type { WorldDef } from '../content/schemas/index.js';
import type { DayRuleContext, PhaseFlags, WeatherState, World, WorldViewContext } from './world.js';

type LunarDef = Extract<WorldDef, { strategy: 'lunar' }>;

/** Lunar day/night rules. */
export class MoonWorld implements World {
  private readonly params: LunarDef['params'];

  /** @param def a world definition whose strategy is `lunar`. */
  constructor(readonly def: LunarDef) {
    this.params = def.params;
  }

  /** Position within the cycle, 0-based (days 1 and 29 are 0). */
  cycle(day: number): number {
    return (
      (((day - 1) % this.params.cycleLength) + this.params.cycleLength) % this.params.cycleLength
    );
  }

  private isNight(day: number): boolean {
    return this.cycle(day) >= this.params.nightStartsAt;
  }

  applyDay({ day, multiplier, delta, weather, sink }: DayRuleContext): void {
    const p = this.params;
    const cycle = this.cycle(day);
    const power = delta.P ?? 0;
    delta.P =
      cycle >= p.nightStartsAt ? power - p.nightPowerDrain * multiplier : power + p.dayPowerGain;
    if (cycle === p.nightStartsAt) {
      sink.sticker(p.nightMessage.title, p.nightMessage.subtitle, 'time');
    }
    if (cycle === 0) {
      sink.sticker(p.sunriseMessage.title, p.sunriseMessage.subtitle, 'good');
      sink.phaseWeathered();
    }
    // Warn once per lunar cycle, a few days before dusk.
    const cycleNumber = Math.floor((day - 1) / p.cycleLength);
    if (cycle >= p.warningFrom && cycle <= p.warningTo && weather.nightCycle !== cycleNumber) {
      weather.nightCycle = cycleNumber;
      sink.injectCard(p.warningCard);
    }
  }

  phases(day: number, _weather: WeatherState): PhaseFlags {
    return { night: this.isNight(day), storm: false };
  }

  nightInDays(day: number): number | null {
    return this.params.nightStartsAt - this.cycle(day);
  }

  chips({ day, goalDay, supply }: WorldViewContext): ChipView[] {
    const p = this.params;
    const cycle = this.cycle(day);
    const night = this.isNight(day);
    const untilNight = p.nightStartsAt - cycle;
    return [
      {
        id: 'phase',
        text: night ? `☾ DAWN IN ${p.cycleLength - cycle}` : `☀ NIGHT IN ${untilNight}`,
        hot: night || untilNight <= 4,
      },
      { id: 'goal', text: `${this.def.goalName} IN ${Math.max(0, goalDay - day)}`, hot: false },
      {
        id: 'supply',
        text: `${this.def.supply.chipLabel} IN ${supply.daysUntilNext(day)}`,
        hot: false,
      },
    ];
  }

  timeline({ day, supply }: WorldViewContext): TimelineCell[] {
    const p = this.params;
    const base = day - this.cycle(day);
    return Array.from({ length: p.cycleLength }, (_, i) => {
      const d = base + i;
      return {
        kind: i >= p.nightStartsAt ? 'dark' : 'lit',
        past: d < day,
        now: d === day,
        supply: supply.isSupplyDay(d),
        storm: false,
      };
    });
  }

  ariaPhaseTip(day: number): 'night' | null {
    return this.isNight(day) ? 'night' : null;
  }
}
