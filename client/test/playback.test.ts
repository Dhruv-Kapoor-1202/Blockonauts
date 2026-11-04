/**
 * Event playback: the pure planner orders presentation steps like the prototype, and the pure
 * reducer turns them into the presented state. Uses real events from a mini-campaign session.
 */
import {
  GameSessionFactory,
  type CardView,
  type GameEvent,
  type GameView,
} from '@commander/engine';
import { describe, expect, it } from 'vitest';
import { PLAYBACK } from '../src/game/constants';
import { planChoice, type PlaybackStep } from '../src/game/playback-plan';
import { applyStep, presentedFromView } from '../src/game/presented-state';
import { buildMiniBundle } from './support';

const FLY_OUT = 300;
const base = { units: 'days', flyOutMs: FLY_OUT } as const;
const kinds = (steps: PlaybackStep[]) => steps.map((s) => s.kind);

const card = { id: 'next' } as CardView;
const resource = (source: 'choice' | 'tick' | 'supply', to = 40): GameEvent => ({
  type: 'ResourceChanged',
  key: 'P',
  from: 50,
  to,
  source,
});
const day = (n: number): GameEvent => ({
  type: 'DayAdvanced',
  day: n,
  dayText: String(n).padStart(3, '0'),
  chips: [],
  timeline: [],
});
const sticker = (title: string): GameEvent => ({ type: 'StickerRaised', title, tone: 'good' });

describe('planChoice', () => {
  it('starts with the fly-out wait and pops only non-upkeep resource changes', () => {
    const steps = planChoice(
      [
        resource('choice'),
        day(2),
        resource('tick', 49),
        resource('supply', 60),
        { type: 'NodePresented', card },
      ],
      { ...base, days: 1, hasGamble: false },
    );
    expect(steps[0]).toEqual({ kind: 'wait', ms: FLY_OUT });
    const pops = steps
      .filter((s) => s.kind === 'resource')
      .map((s) => s.kind === 'resource' && s.pop);
    expect(pops).toEqual([true, false, true]);
  });

  it('waits 420 ms before the first day, 700 ms after a gamble sticker, and 320 ms per day', () => {
    const plain = planChoice([resource('choice'), day(2), day(3)], {
      ...base,
      days: 2,
      hasGamble: false,
    });
    expect(plain).toContainEqual({ kind: 'wait', ms: PLAYBACK.beforeDaysMs });
    expect(plain.filter((s) => s.kind === 'wait' && s.ms === PLAYBACK.dayMs)).toHaveLength(2);

    const gamble = planChoice([resource('choice'), sticker('ICE FOUND!'), day(2)], {
      ...base,
      days: 1,
      hasGamble: true,
    });
    expect(gamble).toContainEqual({ kind: 'wait', ms: PLAYBACK.beforeDaysAfterGambleMs });
    // the gamble sticker comes before the pause, i.e. before any day passes
    expect(kinds(gamble).indexOf('sticker')).toBeLessThan(kinds(gamble).indexOf('day'));
  });

  it('adds an "N days pass…" sticker and faster day pauses for long choices', () => {
    const steps = planChoice([day(2), day(3), day(4)], { ...base, days: 3, hasGamble: false });
    const pass = steps.find((s) => s.kind === 'sticker');
    expect(pass).toEqual({ kind: 'sticker', sticker: { title: '3 days pass…', tone: 'time' } });
    expect(steps.filter((s) => s.kind === 'wait' && s.ms === PLAYBACK.longDayMs)).toHaveLength(3);
    expect(steps.some((s) => s.kind === 'wait' && s.ms === PLAYBACK.dayMs)).toBe(false);
  });

  it('does not pause or announce time when no day passes', () => {
    const steps = planChoice([resource('choice'), { type: 'NodePresented', card }], {
      ...base,
      days: 0,
      hasGamble: false,
    });
    expect(kinds(steps)).toEqual(['wait', 'resource', 'card']);
  });

  it('puts the field note right after the choice effects and the new card last', () => {
    const steps = planChoice(
      [
        resource('choice'),
        { type: 'FactLogged', fact: 'Moon facts' },
        day(2),
        { type: 'NodePresented', card },
      ],
      { ...base, days: 1, hasGamble: false },
    );
    expect(kinds(steps)).toEqual(['wait', 'resource', 'note', 'wait', 'day', 'wait', 'card']);
  });

  it('finishes with a pause and an exit: 1100 ms for a failure, 1500 ms (plus a sticker) for success', () => {
    const failed = planChoice(
      [
        {
          type: 'ChapterEnded',
          chapterId: 'c',
          ending: {
            id: 'e',
            title: 'LOST',
            text: '',
            outcome: 'retry',
            next: 'retry',
            retriesLeft: null,
          },
        },
      ],
      { ...base, days: 0, hasGamble: false },
    );
    expect(failed.slice(-2)).toEqual([
      { kind: 'wait', ms: PLAYBACK.failureExitMs },
      { kind: 'exit', destination: 'chapterResult' },
    ]);

    const won = planChoice(
      [
        {
          type: 'MissionEnded',
          report: { result: 'win', title: 'HOME' } as never,
        },
      ],
      { ...base, days: 0, hasGamble: false },
    );
    expect(won.slice(-3)).toEqual([
      { kind: 'sticker', sticker: { title: 'HOME', tone: 'good' } },
      { kind: 'wait', ms: PLAYBACK.successExitMs },
      { kind: 'exit', destination: 'missionReport' },
    ]);
  });

  it('plans a real engine turn in order (events captured from a session)', () => {
    const session = GameSessionFactory.create({
      bundle: buildMiniBundle(),
      worldId: 'moon',
      difficultyId: 'cadet',
      seed: 7,
      callsign: 'TEST',
    });
    const before = session.view();
    const events: GameEvent[] = [];
    session.events.onAny((event) => events.push(event));
    session.choose('left');
    const steps = planChoice(events, {
      days: before.card?.left.days ?? 0,
      hasGamble: false,
      units: before.units,
      flyOutMs: FLY_OUT,
    });
    expect(steps[0]).toEqual({ kind: 'wait', ms: FLY_OUT });
    expect(kinds(steps).filter((k) => k === 'card')).toHaveLength(1);
    expect(kinds(steps).at(-1)).toBe('card');
    expect(kinds(steps).indexOf('day')).toBeGreaterThan(kinds(steps).indexOf('resource'));
  });
});

describe('applyStep', () => {
  const view = (): GameView => {
    const session = GameSessionFactory.create({
      bundle: buildMiniBundle(),
      worldId: 'mars',
      difficultyId: 'commander',
      seed: 1,
      callsign: 'T',
    });
    return session.view();
  };

  it('updates resources with motion info, notes (newest first, capped), day and card', () => {
    const initial = presentedFromView(view(), 2);
    const afterResource = applyStep(initial, {
      kind: 'resource',
      key: 'F',
      from: 58,
      to: 53,
      pop: true,
    });
    expect(afterResource.resources.F).toBe(53);
    expect(afterResource.motions.F).toMatchObject({ from: 58, to: 53, pop: true });

    let state = applyStep(afterResource, { kind: 'note', fact: 'one' });
    state = applyStep(state, { kind: 'note', fact: 'two' });
    state = applyStep(state, { kind: 'note', fact: 'three' });
    expect(state.notes).toEqual(['three', 'two']);
    expect(state.freshNote).toBe('three');

    const dayed = applyStep(state, { kind: 'day', dayText: '002', chips: [], timeline: [] });
    expect(dayed.dayText).toBe('002');
    expect(dayed.dayTick).toBe(state.dayTick + 1);

    const next = { id: 'x' } as CardView;
    const dealt = applyStep({ ...dayed, flyOut: 'left' }, { kind: 'card', card: next });
    expect(dealt.card).toBe(next);
    expect(dealt.flyOut).toBeNull();
    expect(dealt.cardSeq).toBe(dayed.cardSeq + 1);
  });

  it('toggles night and storm phases', () => {
    const initial = presentedFromView(view(), 4);
    expect(applyStep(initial, { kind: 'phase', phase: 'storm', active: true }).storm).toBe(true);
    expect(applyStep(initial, { kind: 'phase', phase: 'night', active: true }).night).toBe(true);
  });

  it('ignores steps that are handled outside the state', () => {
    const initial = presentedFromView(view(), 4);
    expect(applyStep(initial, { kind: 'wait', ms: 5 })).toBe(initial);
    expect(applyStep(initial, { kind: 'exit', destination: 'missionReport' })).toBe(initial);
  });
});
