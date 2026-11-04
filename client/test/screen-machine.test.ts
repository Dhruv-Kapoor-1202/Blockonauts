/**
 * Screen state machine: the reducer follows the documented flow and ignores impossible events.
 */
import { describe, expect, it } from 'vitest';
import {
  INITIAL_SCREEN,
  screenReducer,
  type Screen,
  type ScreenEvent,
} from '../src/app/screen-machine';

const run = (events: ScreenEvent[], from: Screen = INITIAL_SCREEN): Screen =>
  events.reduce(screenReducer, from);

describe('screenReducer', () => {
  it('starts on the landing screen', () => {
    expect(INITIAL_SCREEN).toEqual({ name: 'landing' });
  });

  it('follows the main flow: landing -> select -> intro -> game -> result -> intro -> game -> report', () => {
    expect(run([{ type: 'start' }]).name).toBe('select');
    expect(run([{ type: 'start' }, { type: 'launch' }]).name).toBe('chapterIntro');
    expect(run([{ type: 'start' }, { type: 'launch' }, { type: 'begin' }]).name).toBe('game');
    expect(
      run([
        { type: 'start' },
        { type: 'launch' },
        { type: 'begin' },
        { type: 'chapterEnded' },
        { type: 'next' },
        { type: 'begin' },
        { type: 'missionEnded' },
      ]).name,
    ).toBe('missionReport');
  });

  it('goes from the result screen to the report when the mission is over', () => {
    expect(run([{ type: 'report' }], { name: 'chapterResult' }).name).toBe('missionReport');
  });

  it('offers Switch rock and Fly again after the report', () => {
    expect(run([{ type: 'switchRock' }], { name: 'missionReport' }).name).toBe('select');
    expect(run([{ type: 'flyAgain' }], { name: 'missionReport' }).name).toBe('game');
  });

  it('can go back from selection to landing', () => {
    expect(run([{ type: 'back' }], { name: 'select' }).name).toBe('landing');
  });

  it('resumes into the screen that matches the saved status', () => {
    expect(run([{ type: 'resume', status: 'playing' }]).name).toBe('game');
    expect(run([{ type: 'resume', status: 'chapterResult' }]).name).toBe('chapterResult');
    expect(run([{ type: 'resume', status: 'idle' }]).name).toBe('landing');
  });

  it('ignores events that are not valid on the current screen (same state object)', () => {
    const game: Screen = { name: 'game' };
    expect(screenReducer(game, { type: 'start' })).toBe(game);
    expect(screenReducer(game, { type: 'launch' })).toBe(game);
    const landing: Screen = { name: 'landing' };
    expect(screenReducer(landing, { type: 'chapterEnded' })).toBe(landing);
    const intro: Screen = { name: 'chapterIntro' };
    expect(screenReducer(intro, { type: 'missionEnded' })).toBe(intro);
  });
});
