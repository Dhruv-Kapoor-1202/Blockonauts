import { describe, expect, it } from 'vitest';
import {
  AchievementTracker,
  AriaAdvisor,
  ConditionEvaluator,
  EventBus,
  FlagSet,
  FollowUpQueue,
  MissionClock,
  ResourcePool,
  ScheduledEffectQueue,
  ScoreCalculator,
  SeededRandom,
  SupplySchedule,
  TextTemplater,
  clampResource,
  type ConditionContext,
  type GameEvent,
} from '../src/index.js';
import { loadMini } from './helpers.js';

const START = { P: 50, F: 50, W: 50, R: 50, M: 50, C: 50, H: 50 };

describe('ResourcePool', () => {
  it('clamps values to 0..100 and reports only real changes', () => {
    const pool = new ResourcePool(START);
    const changes = pool.apply({ P: 80, F: -80, W: 0 });
    expect(pool.get('P')).toBe(100);
    expect(pool.get('F')).toBe(0);
    expect(changes.map((c) => c.key)).toEqual(['P', 'F']);
    expect(pool.apply({ P: 5 })).toEqual([]);
    expect(clampResource(-4)).toBe(0);
  });

  it('finds the lowest and depleted resources and counts critical ones except health', () => {
    const pool = new ResourcePool({ ...START, W: 10, H: 5, M: 19 });
    expect(pool.lowest()).toBe('H');
    expect(pool.depleted()).toBeUndefined();
    expect(pool.criticalCount(20)).toBe(2);
    pool.apply({ W: -10 });
    expect(pool.depleted()).toBe('W');
    expect(pool.anyBelow(15)).toBe(true);
    expect(pool.allAtLeast(0)).toBe(true);
  });

  it('breaks ties by key order and can restore', () => {
    const pool = new ResourcePool(START);
    expect(pool.lowest()).toBe('P');
    const saved = pool.snapshot();
    pool.apply({ P: 10 });
    pool.restore(saved);
    expect(pool.get('P')).toBe(50);
  });
});

describe('queues', () => {
  it('releases scheduled effects on their day, in order, and can rebase', () => {
    const queue = new ScheduledEffectQueue();
    queue.schedule({ day: 5, effects: { P: 1 }, message: 'a' });
    queue.schedule({ day: 3, effects: { P: 2 }, message: 'b' });
    expect(queue.takeDue(2)).toEqual([]);
    expect(queue.takeDue(4).map((e) => e.message)).toEqual(['b']);
    queue.rebase(10);
    expect(queue.snapshot()[0]?.day).toBe(15);
    queue.restore([]);
    expect(queue.takeDue(100)).toEqual([]);
  });

  it('takes the first due follow-up and supports front insertion', () => {
    const queue = new FollowUpQueue();
    queue.push({ day: 3, id: 'late' });
    queue.push({ day: 1, id: 'soon' });
    queue.unshift({ day: 1, id: 'first' });
    expect(queue.takeFirstDue(1)?.id).toBe('first');
    expect(queue.takeFirstDue(1)?.id).toBe('soon');
    expect(queue.takeFirstDue(2)).toBeUndefined();
    queue.rebase(-1);
    expect(queue.takeFirstDue(2)?.id).toBe('late');
  });
});

describe('small systems', () => {
  it('SeededRandom is deterministic and serialisable', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
    const state = a.getState();
    const expected = a.next();
    a.setState(state);
    expect(a.next()).toBe(expected);
    expect(new SeededRandom(1).int(3, 3)).toBe(3);
    expect(() => new SeededRandom(1).pick([])).toThrow();
    expect(new SeededRandom(5).pick(['x'])).toBe('x');
  });

  it('MissionClock formats launch countdown and mission days', () => {
    const clock = new MissionClock(-1);
    expect(MissionClock.format(clock.day)).toBe('T-1');
    expect(MissionClock.format(clock.advance())).toBe('T-0');
    expect(MissionClock.format(clock.advance())).toBe('001');
    clock.set(84);
    expect(MissionClock.format(clock.day)).toBe('084');
  });

  it('SupplySchedule finds the next drop', () => {
    const supply = new SupplySchedule(14, 10);
    expect(supply.isSupplyDay(10)).toBe(true);
    expect(supply.isSupplyDay(24)).toBe(true);
    expect(supply.daysUntilNext(1)).toBe(9);
    expect(supply.daysUntilNext(10)).toBe(14);
  });

  it('FlagSet adds, removes and restores', () => {
    const flags = new FlagSet();
    flags.add('a');
    flags.add('b');
    flags.remove('a');
    expect(flags.all()).toEqual(['b']);
    flags.restore(['x']);
    expect(flags.has('x') && !flags.has('b')).toBe(true);
  });

  it('TextTemplater fills placeholders, falling back when night is not upcoming', () => {
    const templater = new TextTemplater();
    const vars = { unit: 'sol', units: 'sols', planet: 'Mars', nightIn: 5 };
    expect(templater.render('{D}/{Ds}/{P}/{nightIn}', vars)).toBe('sol/sols/Mars/5');
    expect(templater.render('{nightIn}', { ...vars, nightIn: 0 })).toBe('a few');
    expect(templater.render('{nightIn}', { ...vars, nightIn: null })).toBe('a few');
  });

  it('EventBus delivers typed events and unsubscribes', () => {
    const bus = new EventBus<GameEvent>();
    const seen: string[] = [];
    const off = bus.on('FactLogged', (e) => seen.push(e.fact));
    bus.onAny((e) => seen.push(e.type));
    bus.emit({ type: 'FactLogged', fact: 'x' });
    off();
    bus.emit({ type: 'FactLogged', fact: 'y' });
    expect(seen).toEqual(['x', 'FactLogged', 'FactLogged']);
    bus.clear();
    bus.emit({ type: 'FactLogged', fact: 'z' });
    expect(seen).toHaveLength(3);
  });
});

describe('ConditionEvaluator', () => {
  const evaluator = new ConditionEvaluator();
  const ctx = (flags: string[], extra: Partial<ConditionContext> = {}): ConditionContext => ({
    hasFlag: (f) => flags.includes(f),
    worldId: 'moon',
    day: 10,
    resources: { ...START, W: 25 },
    chapterRetries: 1,
    ...extra,
  });

  it('treats an empty condition as true and ANDs every field', () => {
    expect(evaluator.matches(undefined, ctx([]))).toBe(true);
    expect(evaluator.matches({ flags: ['a', 'b'] }, ctx(['a']))).toBe(false);
    expect(evaluator.matches({ flags: ['a'], notFlags: ['b'] }, ctx(['a']))).toBe(true);
    expect(evaluator.matches({ notFlags: ['a'] }, ctx(['a']))).toBe(false);
    expect(evaluator.matches({ anyFlags: ['x', 'a'] }, ctx(['a']))).toBe(true);
    expect(evaluator.matches({ anyFlags: ['x'] }, ctx(['a']))).toBe(false);
  });

  it('checks world, day range, resource thresholds and retries', () => {
    expect(evaluator.matches({ world: 'mars' }, ctx([]))).toBe(false);
    expect(evaluator.matches({ world: ['mars', 'moon'] }, ctx([]))).toBe(true);
    expect(evaluator.matches({ minDay: 11 }, ctx([]))).toBe(false);
    expect(evaluator.matches({ maxDay: 9 }, ctx([]))).toBe(false);
    expect(evaluator.matches({ minDay: 10, maxDay: 10 }, ctx([]))).toBe(true);
    expect(evaluator.matches({ resourceAbove: { W: 30 } }, ctx([]))).toBe(false);
    expect(evaluator.matches({ resourceBelow: { W: 30 } }, ctx([]))).toBe(true);
    expect(evaluator.matches({ chapterRetries: 2 }, ctx([]))).toBe(false);
    expect(evaluator.matches({ chapterRetries: 1 }, ctx([]))).toBe(true);
  });
});

describe('AchievementTracker', () => {
  const defs = loadMini().data.achievements;
  const base = {
    day: 1,
    scienceCount: 0,
    factsCount: 0,
    resources: new ResourcePool({ ...START, F: 49 }),
  };

  it('unlocks day, counter, event and balance badges once', () => {
    const tracker = new AchievementTracker(defs);
    expect(tracker.evaluate({ ...base, day: 14 }).map((a) => a.id)).toEqual(['d14']);
    expect(tracker.evaluate({ ...base, day: 14 })).toEqual([]);
    tracker.markEvent('supplyLanded');
    tracker.markEvent('phaseWeathered');
    const balanced = new ResourcePool(START);
    const fresh = tracker
      .evaluate({ ...base, day: 13, scienceCount: 5, factsCount: 12, resources: balanced })
      .map((a) => a.id);
    expect(fresh.sort()).toEqual(['bal', 'facts', 'phase', 'sci', 'sup']);
    tracker.markEvent('missionWon');
    expect(tracker.evaluate(base).map((a) => a.id)).toEqual(['win']);
    expect(tracker.count).toBe(7);
    const restored = new AchievementTracker(defs);
    restored.restore(tracker.snapshot());
    expect(restored.ids()).toEqual(tracker.ids());
  });

  it('only counts balance after day 12 with every system at 50', () => {
    const tracker = new AchievementTracker(defs);
    expect(tracker.evaluate({ ...base, day: 12 }).map((a) => a.id)).not.toContain('bal');
    const low = new ResourcePool({ ...START, F: 49 });
    expect(tracker.evaluate({ ...base, day: 20, resources: low }).map((a) => a.id)).not.toContain(
      'bal',
    );
  });
});

describe('ScoreCalculator', () => {
  const calculator = new ScoreCalculator(loadMini().config.scoring);

  it('uses the prototype formula plus chapter bonus and retry penalty', () => {
    const score = calculator.compute({
      day: 84,
      factsLogged: 10,
      achievements: 4,
      won: true,
      chaptersCleared: 5,
      retries: 2,
    });
    expect(score).toBe(84 * 100 + 10 * 20 + 4 * 200 + 2000 + 5 * 300 - 2 * 150);
  });

  it('never goes below zero', () => {
    expect(
      calculator.compute({
        day: -3,
        factsLogged: 0,
        achievements: 0,
        won: false,
        chaptersCleared: 0,
        retries: 9,
      }),
    ).toBe(0);
  });
});

describe('AriaAdvisor', () => {
  const copy = loadMini().data.factsAndTips;
  const advisor = new AriaAdvisor(copy);
  const request = (values: Partial<typeof START>) => ({
    resources: new ResourcePool({ ...START, ...values }),
    phaseTip: null,
    unit: 'sol',
    hints: false,
    tipThreshold: 40,
  });

  it('prefers the lowest resource tip, then phase tips, then the nominal message', () => {
    expect(advisor.advise(request({ W: 10 }))).toBe(copy.tips.W);
    expect(
      advisor.advise({
        ...request({ P: 90, F: 90, W: 90, R: 90, M: 90, C: 90, H: 90 }),
        phaseTip: 'night',
      }),
    ).toBe(copy.aria.night);
    expect(advisor.advise(request({ P: 90, F: 90, W: 90, R: 90, M: 90, C: 90, H: 90 }))).toContain(
      'every extra sol',
    );
  });

  it('reveals gamble odds only when hints are on', () => {
    const odds = { ...request({ W: 10 }), gambleChance: 0.6 };
    expect(advisor.advise(odds)).not.toContain('60%');
    expect(advisor.advise({ ...odds, hints: true })).toContain('60%');
  });
});
