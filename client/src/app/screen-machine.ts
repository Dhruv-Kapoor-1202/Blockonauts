/**
 * Screen state machine: which screen is showing is a typed discriminated union advanced by a pure
 * reducer, never a set of loose booleans. Transitions that are not listed are ignored (the same
 * state is returned), so a stray event can never put the app on an impossible screen.
 *
 *   landing -> select -> chapterIntro -> game -> chapterResult -> chapterIntro | missionReport
 *   game -> missionReport;  landing -> game | chapterResult (resume);
 *   missionReport -> select | game
 */
import type { SessionStatus } from '@commander/engine';

/** The screens of the app. */
export type Screen =
  | { name: 'landing' }
  | { name: 'select' }
  | { name: 'chapterIntro' }
  | { name: 'game' }
  | { name: 'chapterResult' }
  | { name: 'missionReport' };

/** Name of a screen. */
export type ScreenName = Screen['name'];

/** Events that move between screens. */
export type ScreenEvent =
  | { type: 'start' }
  | { type: 'back' }
  | { type: 'launch' }
  | { type: 'resume'; status: SessionStatus }
  | { type: 'begin' }
  | { type: 'chapterEnded' }
  | { type: 'missionEnded' }
  | { type: 'next' }
  | { type: 'report' }
  | { type: 'switchRock' }
  | { type: 'flyAgain' };

/** The screen the app starts on. */
export const INITIAL_SCREEN: Screen = { name: 'landing' };

const go = (name: ScreenName): Screen => ({ name }) as Screen;

/** Pure transition function. */
export function screenReducer(screen: Screen, event: ScreenEvent): Screen {
  switch (screen.name) {
    case 'landing':
      if (event.type === 'start') return go('select');
      if (event.type === 'resume') {
        if (event.status === 'playing') return go('game');
        if (event.status === 'chapterResult') return go('chapterResult');
        if (event.status === 'missionOver') return go('missionReport');
      }
      return screen;
    case 'select':
      if (event.type === 'back') return go('landing');
      if (event.type === 'launch') return go('chapterIntro');
      return screen;
    case 'chapterIntro':
      return event.type === 'begin' ? go('game') : screen;
    case 'game':
      if (event.type === 'chapterEnded') return go('chapterResult');
      if (event.type === 'missionEnded') return go('missionReport');
      return screen;
    case 'chapterResult':
      if (event.type === 'next') return go('chapterIntro');
      if (event.type === 'report') return go('missionReport');
      return screen;
    case 'missionReport':
      if (event.type === 'switchRock') return go('select');
      if (event.type === 'flyAgain') return go('game');
      return screen;
  }
}
