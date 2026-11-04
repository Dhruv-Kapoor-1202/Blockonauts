/**
 * MarsWorld (Strategy): rolling dust storms that block sunlight and drain power and comms,
 * a variable comms delay, and a storm card injected when a storm hits.
 */
import type { ChipView, TimelineCell } from '../domain/view.js';
import type { WorldDef } from '../content/schemas/index.js';
import {
  fillCount,
  type DayRuleContext,
  type PhaseFlags,
  type WeatherState,
  type World,
  type WorldViewContext,
} from './world.js';

type DustDef = Extract<WorldDef, { strategy: 'dust' }>;

/** Martian dust-storm rules. */
export class MarsWorld implements World {
  private readonly params: DustDef['params'];

  /** @param def a world definition whose strategy is `dust`. */
  constructor(readonly def: DustDef) {
    this.params = def.params;
  }

  applyDay({ day, multiplier, delta, weather, rng, sink }: DayRuleContext): void {
    const p = this.params;
    if (weather.storm > 0) {
      delta.P = (delta.P ?? 0) - p.stormPowerDrain * multiplier;
      delta.C = (delta.C ?? 0) - p.stormCommsDrain * multiplier;
      weather.storm -= 1;
      if (weather.storm === 0) {
        sink.sticker(p.clearMessage.title, p.clearMessage.subtitle, 'good');
        sink.phaseWeathered();
      }
    } else if (day > p.stormStartsAfterDay && rng.chance(p.stormChance)) {
      weather.storm = rng.int(p.stormMinLength, p.stormMinLength + p.stormLengthSpread - 1);
      sink.sticker(p.stormMessage.title, fillCount(p.stormMessage.subtitle, weather.storm), 'bad');
      sink.injectCard(p.stormCard);
    }
  }

  phases(_day: number, weather: WeatherState): PhaseFlags {
    return { night: false, storm: weather.storm > 0 };
  }

  nightInDays(): number | null {
    return null;
  }

  chips({ day, weather, goalDay, supply }: WorldViewContext): ChipView[] {
    const delay = this.params.commsDelay;
    const storming = weather.storm > 0;
    return [
      {
        id: 'phase',
        text: storming
          ? `▒ STORM ${weather.storm} ${this.def.units.toUpperCase()}`
          : `${this.def.supply.chipLabel} IN ${supply.daysUntilNext(day)}`,
        hot: storming,
      },
      { id: 'goal', text: `${this.def.goalName} IN ${Math.max(0, goalDay - day)}`, hot: false },
      {
        id: 'delay',
        text: `DELAY ~${delay.base + ((day * delay.step) % delay.modulo)} MIN`,
        hot: false,
      },
    ];
  }

  timeline({ day, weather, supply }: WorldViewContext): TimelineCell[] {
    const { timelineWindow, timelineLookBehind } = this.params;
    return Array.from({ length: timelineWindow }, (_, i) => {
      const d = day + i - timelineLookBehind;
      return {
        kind: 'lit',
        past: d < day,
        now: d === day,
        supply: supply.isSupplyDay(d),
        storm: i >= timelineLookBehind && i - timelineLookBehind < weather.storm,
      };
    });
  }

  ariaPhaseTip(_day: number, weather: WeatherState): 'storm' | null {
    return weather.storm > 0 ? 'storm' : null;
  }
}
