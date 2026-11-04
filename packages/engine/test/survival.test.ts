import { describe, expect, it } from 'vitest';
import {
  ContentBundle,
  ContentLoader,
  GameSessionFactory,
  type GameEvent,
  type GameSession,
} from '../src/index.js';
import { labFiles, labNode, startFromFiles, startLab, type LabOptions } from './lab.js';

const pass = { goto: '$interludes' };

/** A survival lab: one hold node that loops into interludes until the goal day. */
function survival(extra: Partial<LabOptions> = {}, untilDay = 60): LabOptions {
  return {
    nodes: [
      labNode(
        's',
        { label: 'Hold', days: 1, ...pass },
        { label: 'Push', days: 1, setFlags: ['pushed'], ...pass },
      ),
      ...(extra.nodes ?? []),
    ],
    endings: { 'lab.done': { outcome: 'advance', title: 'DONE', text: 'Survived.' } },
    clock: { startDay: 1, simulate: true },
    interludes: {
      pools: ['colony', 'moon', 'mars', 'followup', 'injected'],
      every: [2, 3],
      untilDay,
      goalEnding: 'lab.done',
    },
    ...extra,
  };
}

const keys = ['P', 'F', 'W', 'R', 'M', 'C', 'H'] as const;
const moonDrain = { P: 0.6, F: 1, W: 0.95, R: 0.3, M: 0.45, C: 0.25 };
const marsDrain = { P: 0.45, F: 0.9, W: 0.7, R: 0.32, M: 0.48, C: 0.35 };

function record(session: GameSession): GameEvent[] {
  const events: GameEvent[] = [];
  session.events.onAny((event) => events.push(event));
  return events;
}

describe('daily tick', () => {
  it.each([
    ['moon', 'commander', 1, moonDrain, 0.5],
    ['moon', 'cadet', 0.65, moonDrain, 0.5],
    ['moon', 'veteran', 1.4, moonDrain, 0.5],
    ['mars', 'commander', 1, marsDrain, 0],
    ['mars', 'veteran', 1.4, marsDrain, 0],
  ] as const)(
    '%s / %s applies world drain x difficulty multiplier',
    (world, difficulty, multiplier, drain, dayPowerGain) => {
      const session = startLab(survival(), { world, difficulty });
      const before = session.view().resources;
      session.choose('left');
      const after = session.view().resources;
      for (const key of keys) {
        const rate = key === 'H' ? 0 : drain[key];
        const bonus = key === 'P' ? dayPowerGain : 0;
        expect(after[key]).toBeCloseTo(before[key] - rate * multiplier + bonus, 5);
      }
      expect(session.view().day).toBe(2);
    },
  );

  it('drains extra power during lunar night', () => {
    const day = startLab(survival({}, 200), { world: 'moon' });
    const wait = [
      labNode(
        's',
        { label: 'Wait', days: 14, ...pass },
        { label: 'Wait too', days: 14, setFlags: ['w'], ...pass },
      ),
    ];
    const waiting = startLab({ ...survival(), nodes: wait }, { world: 'moon' });
    const events = record(waiting);
    waiting.choose('left');
    expect(waiting.view().night).toBe(true);
    expect(events.filter((e) => e.type === 'PhaseChanged')).toEqual([
      { type: 'PhaseChanged', phase: 'night', active: true },
    ]);
    expect(events.some((e) => e.type === 'StickerRaised' && e.title === 'LUNAR NIGHT')).toBe(true);
    expect(day.view().night).toBe(false);
  });

  it('applies the -0.8 health penalty for every non-health resource below 20', () => {
    const nodes = [
      labNode(
        's',
        { label: 'Burn', days: 1, effects: { F: -45, W: -40 }, ...pass },
        { label: 'Calm', days: 1, setFlags: ['c'], ...pass },
      ),
    ];
    const session = startLab({ ...survival(), nodes }, { world: 'moon' });
    const healthBefore = session.view().resources.H;
    session.choose('left');
    expect(session.view().resources.H).toBeCloseTo(healthBefore - 0.8 * 2, 5);
  });

  it('lands supply drops on the world schedule with a sticker and the badge', () => {
    const waits = [
      labNode(
        's',
        { label: 'Wait', days: 9, ...pass },
        { label: 'Wait too', days: 9, setFlags: ['w'], ...pass },
      ),
    ];
    const session = startLab({ ...survival(), nodes: waits }, { world: 'moon' });
    const events = record(session);
    session.choose('left');
    expect(session.view().day).toBe(10);
    expect(
      events
        .filter((e) => e.type === 'ResourceChanged' && e.source === 'supply')
        .map((e) => (e as { key: string }).key)
        .sort(),
    ).toEqual(['F', 'P', 'W']);
    expect(
      events.some(
        (e) => e.type === 'StickerRaised' && e.title === 'LANDER ARRIVED' && e.tone === 'good',
      ),
    ).toBe(true);
    expect(events.some((e) => e.type === 'AchievementUnlocked' && e.id === 'sup')).toBe(true);
  });

  it('only runs the daily rules in simulated chapters', () => {
    const session = startLab({
      nodes: [
        labNode(
          's',
          { label: 'Wait', days: 5, goto: 'lab.win' },
          { label: 'Other', days: 1, goto: 'lab.loss' },
        ),
      ],
    });
    const before = session.view().resources;
    session.choose('left');
    expect(session.view().resources).toEqual(before);
  });
});

describe('random events', () => {
  function withEventChance(chance: number): Record<string, unknown> {
    const files = labFiles(survival({}, 30));
    const config = files['config.json'] as { randomEvents: { chance: number } };
    config.randomEvents.chance = chance;
    return files;
  }

  it('never fires on or before day 4 and fires daily when the chance is 1', () => {
    const session = startFromFiles(withEventChance(1), { world: 'moon' });
    const events = record(session);
    for (let i = 0; i < 3; i += 1) session.choose('left');
    expect(events.filter((e) => e.type === 'ResourceChanged' && e.source === 'event')).toEqual([]);
    for (let i = 0; i < 4; i += 1) {
      while (session.view().card?.kind === 'node') session.choose('left');
      if (session.status !== 'playing') break;
      session.choose('left');
    }
    expect(
      events.some(
        (e) =>
          e.type === 'StickerRaised' &&
          ['RELAY SAT ONLINE', 'THERMAL SPIKE', 'COSMIC RAY BURST', 'EARTHRISE VIEW'].includes(
            e.title,
          ),
      ),
    ).toBe(true);
  });

  it('never fires at chance 0', () => {
    const session = startFromFiles(withEventChance(0), { world: 'mars' });
    const events = record(session);
    for (let i = 0; i < 12 && session.status === 'playing'; i += 1) session.choose('left');
    expect(events.filter((e) => e.type === 'ResourceChanged' && e.source === 'event')).toEqual([]);
  });
});

describe('survival flow and interludes', () => {
  it('draws 2-3 interlude cards between story nodes and finishes at the goal day', () => {
    const nodes = [
      labNode(
        's',
        { label: 'A', days: 1, goto: 't' },
        { label: 'B', days: 1, setFlags: ['b'], goto: 't' },
      ),
      labNode(
        't',
        { label: 'A', days: 1, ...pass },
        { label: 'B', days: 1, setFlags: ['c'], ...pass },
      ),
    ];
    const session = startLab({ ...survival(), nodes }, { world: 'moon', difficulty: 'cadet' });
    session.choose('left');
    const kinds: string[] = [];
    while (session.view().card?.id !== 't') {
      kinds.push(session.view().card?.kind ?? 'none');
      session.choose('left');
    }
    expect(kinds.length).toBeGreaterThanOrEqual(2);
    expect(kinds.length).toBeLessThanOrEqual(3);
    expect(new Set(kinds)).toEqual(new Set(['interlude']));
    let guard = 0;
    while (session.status === 'playing' && guard < 200) {
      session.choose('right');
      guard += 1;
    }
    expect(session.view().chapter.progress).toBeGreaterThan(0);
    expect(['missionOver', 'chapterResult']).toContain(session.status);
  });

  it('reaches the world goal day and fires the goal ending (win)', () => {
    const session = startLab(survival({}, 12), { world: 'moon', difficulty: 'cadet', seed: 3 });
    let guard = 0;
    while (session.status === 'playing' && guard < 100) {
      session.choose(guard % 2 === 0 ? 'left' : 'right');
      guard += 1;
    }
    if (session.status === 'missionOver') {
      expect(session.view().report?.result).toBe('win');
    } else {
      expect(session.view().ending?.title).toBe('DONE');
      expect(session.view().day).toBeGreaterThanOrEqual(12);
    }
  });

  it('queues follow-up cards (winNext) a few days after a won gamble', () => {
    const bundle = new ContentBundle(ContentLoader.load(labFiles(survival({}, 40))).data);
    const session = GameSessionFactory.create({
      bundle,
      worldId: 'moon',
      difficultyId: 'cadet',
      seed: 5,
      callsign: 'X',
    });
    const seen = new Set<string>();
    let guard = 0;
    while (session.status === 'playing' && guard < 150) {
      const card = session.view().card;
      if (card) seen.add(card.id);
      session.choose('right');
      guard += 1;
    }
    expect(seen.size).toBeGreaterThan(5);
  });

  it('biases card choice toward cards that help the lowest resource', () => {
    // Count how often a water-positive card is drawn when water is critically low vs. when it is fine.
    const lowWater = labFiles(
      survival(
        {
          nodes: [
            labNode(
              's',
              { label: 'Drain', days: 0, effects: { W: -35 }, ...pass },
              { label: 'Calm', days: 0, effects: { W: 40 }, ...pass },
            ),
          ],
        },
        200,
      ),
    );
    const countHelpful = (choose: 'left' | 'right') => {
      let helpful = 0;
      let draws = 0;
      for (let seed = 1; seed <= 120; seed += 1) {
        const session = startFromFiles(lowWater, { world: 'moon', seed, difficulty: 'cadet' });
        session.choose(choose);
        const card = session.view().card;
        if (!card) continue;
        draws += 1;
        const waterGain = [card.left, card.right].some((side) => (side.effects.W ?? 0) > 0);
        if (waterGain) helpful += 1;
      }
      return helpful / draws;
    };
    expect(countHelpful('left')).toBeGreaterThan(countHelpful('right'));
  });

  it('does not repeat recently seen cards', () => {
    const session = startLab(survival({}, 200), { world: 'mars', difficulty: 'cadet', seed: 4 });
    session.choose('left');
    const ids: string[] = [];
    for (let i = 0; i < 12 && session.status === 'playing'; i += 1) {
      const card = session.view().card;
      if (card?.kind === 'interlude') ids.push(card.id);
      session.choose('left');
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});
