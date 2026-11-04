/**
 * Small pure helpers: effect-preview dots, duration texts, keyboard mapping and the star scatter.
 */
import type { ChoicePreview } from '@commander/engine';
import { describe, expect, it } from 'vitest';
import { buildStars } from '../src/components/StarField';
import { NO_DOT, dotFor } from '../src/game/effect-preview';
import { dayPreview, durationBadge } from '../src/game/format';
import { sideForKey } from '../src/screens/use-choice-keys';

const preview = (overrides: Partial<ChoicePreview>): ChoicePreview => ({
  label: 'x',
  days: 1,
  effects: {},
  uncertain: [],
  hasGamble: false,
  ...overrides,
});

describe('dotFor', () => {
  it('hides every dot without a preview', () => {
    expect(dotFor('P', null, true)).toEqual(NO_DOT);
  });

  it('is big for |delta| >= 10 and small below', () => {
    expect(dotFor('P', preview({ effects: { P: -10 } }), false).state).toBe('big');
    expect(dotFor('P', preview({ effects: { P: 9 } }), false).state).toBe('small');
  });

  it('colours up/down only when hints are on (Cadet)', () => {
    const p = preview({ effects: { P: 5, F: -5 } });
    expect(dotFor('P', p, false).tone).toBe('neutral');
    expect(dotFor('P', p, true).tone).toBe('up');
    expect(dotFor('F', p, true).tone).toBe('down');
  });

  it('shows a dashed "?" dot for uncertain keys only', () => {
    const p = preview({ uncertain: ['W'], effects: { P: 1 } });
    expect(dotFor('W', p, true)).toEqual({ state: 'small', kind: 'uncertain', tone: 'neutral' });
    expect(dotFor('M', p, true)).toEqual(NO_DOT);
  });
});

describe('duration text', () => {
  it('formats badges for days and sols, singular and plural', () => {
    expect(durationBadge(0, 'day', 'days', 'NO TIME')).toBe('NO TIME');
    expect(durationBadge(1, 'day', 'days', 'NO TIME')).toBe('T+1 DAY');
    expect(durationBadge(3, 'sol', 'sols', 'NO TIME')).toBe('T+3 SOLS');
  });

  it('formats the day-counter preview and hides it for zero days', () => {
    expect(dayPreview(2, 'day', 'days')).toBe('+2 DAYS');
    expect(dayPreview(0, 'day', 'days')).toBeNull();
  });
});

describe('sideForKey', () => {
  const key = (k: string, extra: Partial<KeyboardEvent> = {}) =>
    sideForKey({ key: k, ctrlKey: false, metaKey: false, altKey: false, ...extra });

  it('maps arrows and A/D to sides', () => {
    expect(key('ArrowLeft')).toBe('left');
    expect(key('a')).toBe('left');
    expect(key('A')).toBe('left');
    expect(key('ArrowRight')).toBe('right');
    expect(key('d')).toBe('right');
  });

  it('ignores other keys and modified shortcuts', () => {
    expect(key('Enter')).toBeNull();
    expect(key('a', { ctrlKey: true })).toBeNull();
  });
});

describe('buildStars', () => {
  it('is deterministic for a seed', () => {
    expect(buildStars(10, 3)).toEqual(buildStars(10, 3));
    expect(buildStars(10, 3)).not.toEqual(buildStars(10, 4));
    expect(buildStars(10, 3)).toHaveLength(10);
  });
});
