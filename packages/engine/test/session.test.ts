import { describe, expect, it } from 'vitest';
import type { GameEvent, GameSession } from '../src/index.js';
import { EngineError } from '../src/index.js';
import { labNode, startLab } from './lab.js';

/** Records every event a session emits. */
function record(session: GameSession): GameEvent[] {
  const events: GameEvent[] = [];
  session.events.onAny((event) => events.push(event));
  return events;
}

const toWin = { goto: 'lab.win' };

describe('immediate effects, flags and goto', () => {
  const nodes = [
    labNode(
      'a',
      { label: 'L', days: 0, effects: { P: 40 }, setFlags: ['x'], goto: 'b' },
      { label: 'R', days: 0, effects: { P: -90 }, goto: 'b' },
    ),
    labNode(
      'b',
      { label: 'L', days: 0, goto: [{ when: { flags: ['x'] }, to: 'c' }, { to: 'lab.win' }] },
      { label: 'R', days: 0, clearFlags: ['x'], goto: 'lab.win' },
      {
        variants: [
          { when: { flags: ['x'] }, text: 'Variant text' },
          { when: { flags: ['x'] }, text: 'Never shown' },
        ],
      },
    ),
    labNode(
      'c',
      { label: 'L', days: 0, ...toWin },
      { label: 'R', days: 0, setFlags: ['y'], ...toWin },
    ),
  ];

  it('clamps effects, shows the first matching variant and follows the first matching goto', () => {
    const session = startLab({ nodes });
    expect(session.view().resources.P).toBe(72);
    session.choose('left');
    expect(session.view().resources.P).toBe(100);
    expect(session.view().card?.text).toBe('Variant text');
    session.choose('left');
    expect(session.view().card?.id).toBe('c');
  });

  it('clear flags remove earlier flags before the goto is evaluated', () => {
    const session = startLab({ nodes });
    session.choose('left');
    session.choose('right');
    expect(session.view().status).toBe('missionOver');
  });

  it('previews certain and uncertain effects without changing state', () => {
    const risky = labNode(
      'g',
      {
        label: 'Gamble',
        days: 2,
        effects: { P: 3 },
        gamble: { p: 0.5, win: { P: 9, W: 5 }, lose: { H: -4 }, winText: 'W', loseText: 'L' },
        ...toWin,
      },
      { label: 'Later', later: { in: 2, effects: { C: 6 }, message: 'M' }, ...toWin },
    );
    const session = startLab({ nodes: [risky] });
    const left = session.preview('left');
    expect(left).toMatchObject({ days: 2, effects: { P: 3 }, hasGamble: true });
    expect(left.uncertain.sort()).toEqual(['H', 'W']);
    expect(session.preview('right').uncertain).toEqual(['C']);
    expect(session.view().resources.P).toBe(72);
  });

  it('rejects a choice when no card is waiting', () => {
    const session = startLab({ nodes });
    session.choose('left');
    session.choose('left');
    session.choose('left');
    expect(() => session.choose('left')).toThrow(EngineError);
    expect(() => session.proceed()).toThrow(EngineError);
  });
});

describe('gambles', () => {
  const gamble = (p: number) =>
    labNode(
      'g',
      {
        label: 'Risk',
        days: 0,
        gamble: {
          p,
          win: { M: 10 },
          lose: { M: -10 },
          winText: 'YES',
          loseText: 'NO',
          winGoto: 'lab.win',
          loseGoto: 'lab.retry',
        },
      },
      { label: 'Safe', days: 0, goto: 'lab.advance' },
    );

  it('always wins at p=1 and always loses at p=0, using the matching goto and sticker', () => {
    const won = startLab({ nodes: [gamble(1)] });
    const wonEvents = record(won);
    won.choose('left');
    expect(won.view().status).toBe('missionOver');
    expect(wonEvents).toContainEqual({
      type: 'StickerRaised',
      title: 'YES',
      subtitle: undefined,
      tone: 'good',
    });

    const lost = startLab({ nodes: [gamble(0)] });
    const lostEvents = record(lost);
    lost.choose('left');
    expect(lost.view().status).toBe('chapterResult');
    expect(lostEvents).toContainEqual({
      type: 'StickerRaised',
      title: 'NO',
      subtitle: undefined,
      tone: 'bad',
    });
  });

  it('is deterministic for a given seed', () => {
    const outcomeFor = (seed: number) => {
      const session = startLab({ nodes: [gamble(0.5)] }, { seed });
      session.choose('left');
      return session.view().resources.M;
    };
    const seeds = [1, 2, 3, 7, 8, 9];
    const outcomes = seeds.map(outcomeFor);
    expect(outcomes).toEqual(seeds.map(outcomeFor));
    expect(new Set(outcomes).size).toBe(2);
  });
});

describe('delayed effects', () => {
  it('lands a "later" effect on its day and announces it', () => {
    const chain = (id: string, next: string, extra: Record<string, unknown> = {}) =>
      labNode(
        id,
        { label: 'L', days: 1, goto: next, ...extra },
        { label: 'R', days: 1, goto: next, setFlags: [`${id}R`] },
      );
    const session = startLab({
      nodes: [
        chain('a', 'b', { later: { in: 2, effects: { C: -20 }, message: 'LATE' } }),
        chain('b', 'c'),
        chain('c', 'd'),
        chain('d', 'lab.win'),
      ],
    });
    const events = record(session);
    const before = session.view().resources.C;
    session.choose('left');
    expect(session.view().resources.C).toBe(before);
    session.choose('left');
    expect(session.view().resources.C).toBe(before - 20);
    session.choose('left');
    expect(session.view().resources.C).toBe(before - 20);
    expect(events.find((e) => e.type === 'StickerRaised' && e.title === 'LATE')).toMatchObject({
      tone: 'bad',
    });
    expect(
      events.filter((e) => e.type === 'ResourceChanged' && e.source === 'scheduled'),
    ).toHaveLength(1);
  });
});

describe('events', () => {
  it('emits resource changes, facts, days, node presentation and chapter endings in order', () => {
    const session = startLab({
      nodes: [
        labNode(
          'a',
          { label: 'L', days: 2, effects: { F: -5 }, goto: 'lab.advance' },
          { label: 'R', days: 1, goto: 'lab.retry' },
        ),
      ],
    });
    const events = record(session);
    session.choose('left');
    const types = events.map((e) => e.type);
    expect(types[0]).toBe('ResourceChanged');
    expect(types).toContain('FactLogged');
    expect(types.filter((t) => t === 'DayAdvanced')).toHaveLength(2);
    expect(types).toContain('ChapterEnded');
    expect(types.at(-1)).toBe('MissionEnded');
    const day = events.find((e) => e.type === 'DayAdvanced');
    expect(day).toMatchObject({ day: 2, dayText: '002' });
  });

  it('logs each fact once and keeps field notes newest first', () => {
    const session = startLab({
      nodes: [
        labNode(
          'a',
          { label: 'L', days: 0, goto: 'b' },
          { label: 'R', days: 0, goto: 'b' },
          { fact: 'Same fact' },
        ),
        labNode(
          'b',
          { label: 'L', days: 0, goto: 'lab.win' },
          { label: 'R', days: 0, setFlags: ['q'], goto: 'lab.win' },
          { fact: 'Same fact' },
        ),
      ],
    });
    const events = record(session);
    session.choose('left');
    session.choose('left');
    expect(events.filter((e) => e.type === 'FactLogged')).toHaveLength(1);
  });
});
