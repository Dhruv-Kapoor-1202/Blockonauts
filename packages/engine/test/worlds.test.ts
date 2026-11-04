import { describe, expect, it } from 'vitest';
import type { MarsWorld, MoonWorld } from '../src/index.js';
import {
  SupplySchedule,
  createWorld,
  type RandomSource,
  type ResourceDelta,
  type WeatherState,
  type World,
} from '../src/index.js';
import { loadMini } from './helpers.js';

const bundle = loadMini();
const moon = createWorld(bundle.world('moon')) as MoonWorld;
const mars = createWorld(bundle.world('mars')) as MarsWorld;

/** Runs one day of world rules and records what the sink saw. */
function runDay(
  world: World,
  day: number,
  weather: WeatherState,
  rng: RandomSource,
  multiplier = 1,
) {
  const delta: ResourceDelta = {};
  const stickers: string[] = [];
  const injected: string[] = [];
  let weathered = 0;
  world.applyDay({
    day,
    multiplier,
    delta,
    weather,
    rng,
    sink: {
      sticker: (title) => stickers.push(title),
      injectCard: (id) => injected.push(id),
      phaseWeathered: () => (weathered += 1),
    },
  });
  return { delta, stickers, injected, weathered };
}

const calm = (): WeatherState => ({ storm: 0, nightCycle: -1 });
const alwaysRng = (value: number): RandomSource => ({
  next: () => value,
  int: (min) => min,
  chance: () => value < 1,
  pick: (items) => items[0] as never,
});

describe('MoonWorld', () => {
  it('has a 28-day cycle: 14 lit days then 14 dark days', () => {
    expect(moon.cycle(1)).toBe(0);
    expect(moon.cycle(14)).toBe(13);
    expect(moon.cycle(15)).toBe(14);
    expect(moon.cycle(29)).toBe(0);
    expect(moon.phases(14, calm()).night).toBe(false);
    expect(moon.phases(15, calm()).night).toBe(true);
    expect(moon.nightInDays(5)).toBe(10);
  });

  it('adds power by day and drains it extra by night, scaled by difficulty', () => {
    expect(runDay(moon, 5, calm(), alwaysRng(0)).delta.P).toBeCloseTo(0.5);
    expect(runDay(moon, 20, calm(), alwaysRng(0), 1.4).delta.P).toBeCloseTo(-1.7 * 1.4);
  });

  it('raises night and sunrise stickers and the weathered badge at the cycle edges', () => {
    expect(runDay(moon, 15, calm(), alwaysRng(0)).stickers).toEqual(['LUNAR NIGHT']);
    const sunrise = runDay(moon, 29, calm(), alwaysRng(0));
    expect(sunrise.stickers).toEqual(['SUNRISE']);
    expect(sunrise.weathered).toBe(1);
  });

  it('injects the night warning card once per cycle in the warning window', () => {
    const weather = calm();
    expect(runDay(moon, 11, weather, alwaysRng(0)).injected).toEqual(['m_night']);
    expect(runDay(moon, 12, weather, alwaysRng(0)).injected).toEqual([]);
    expect(runDay(moon, 39, weather, alwaysRng(0)).injected).toEqual(['m_night']);
  });

  it('builds chips and a 28-cell timeline with supply markers', () => {
    const supply = new SupplySchedule(14, 10);
    const context = (day: number) => ({ day, weather: calm(), goalDay: 84, supply });
    expect(moon.chips(context(1)).map((c) => c.text)).toEqual([
      '☀ NIGHT IN 14',
      'CREW ROTATION IN 83',
      'LANDER IN 9',
    ]);
    expect(moon.chips(context(20))[0]).toEqual({ id: 'phase', text: '☾ DAWN IN 9', hot: true });
    const cells = moon.timeline(context(3));
    expect(cells).toHaveLength(28);
    expect(cells[2]).toMatchObject({ now: true, past: false });
    expect(cells[1]?.past).toBe(true);
    expect(cells[14]?.kind).toBe('dark');
    expect(cells[9]?.supply).toBe(true);
    expect(moon.ariaPhaseTip(20)).toBe('night');
    expect(moon.ariaPhaseTip(2)).toBeNull();
  });
});

describe('MarsWorld', () => {
  it('only starts storms after the configured day, with a 4-7 sol length', () => {
    expect(runDay(mars, 8, calm(), alwaysRng(0)).stickers).toEqual([]);
    const forced = calm();
    const result = runDay(mars, 9, forced, alwaysRng(0));
    expect(forced.storm).toBe(4);
    expect(result.stickers).toEqual(['DUST STORM']);
    expect(result.injected).toEqual(['r_storm']);
    expect(mars.phases(9, forced).storm).toBe(true);
  });

  it('drains power and comms during a storm, then clears it', () => {
    const weather: WeatherState = { storm: 1, nightCycle: -1 };
    const outcome = runDay(mars, 12, weather, alwaysRng(0), 2);
    expect(outcome.delta.P).toBeCloseTo(-1.4 * 2);
    expect(outcome.delta.C).toBeCloseTo(-0.6 * 2);
    expect(weather.storm).toBe(0);
    expect(outcome.stickers).toEqual(['STORM CLEARED']);
    expect(outcome.weathered).toBe(1);
  });

  it('shows storm or ship chips, a comms delay and a rolling 24-sol window', () => {
    const supply = new SupplySchedule(30, 24);
    const stormy = { day: 10, weather: { storm: 3, nightCycle: -1 }, goalDay: 100, supply };
    expect(mars.chips(stormy)[0]).toEqual({ id: 'phase', text: '▒ STORM 3 SOLS', hot: true });
    const clear = { ...stormy, weather: calm() };
    expect(mars.chips(clear).map((c) => c.text)).toEqual([
      'SHIP IN 14',
      'RETURN WINDOW IN 90',
      `DELAY ~${4 + ((10 * 7) % 18)} MIN`,
    ]);
    const cells = mars.timeline(stormy);
    expect(cells).toHaveLength(24);
    expect(cells[3]?.now).toBe(true);
    expect(cells.filter((c) => c.storm)).toHaveLength(3);
    expect(mars.ariaPhaseTip(1, stormy.weather)).toBe('storm');
    expect(mars.nightInDays()).toBeNull();
  });
});
