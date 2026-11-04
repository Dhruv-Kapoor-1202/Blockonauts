/**
 * Types shared by the game controller and the screens: the run selection, the leaderboard state of
 * the mission report and the `GameController` the UI consumes.
 */
import type { GameView, SessionSnapshot, SessionStatus, Side } from '@commander/engine';
import type { LeaderboardResult } from './leaderboard-store';
import type { PresentedState } from './presented-state';
import type { ActiveSticker } from './sticker-queue';

/** What the player picked on the selection screen. */
export interface RunSelection {
  worldId: string;
  difficultyId: string;
  callsign: string;
}

/** State of the TOP COMMANDERS board on the mission report. */
export type LeaderboardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; result: LeaderboardResult }
  | { status: 'failed' };

/** What the UI gets from `useGameSession`. */
export interface GameController {
  /** The engine's final view after the last command (use for chapter/report screens). */
  view: GameView | null;
  /** What the game screen currently shows (lags `view` during playback). */
  presented: PresentedState | null;
  /** The sticker on screen. */
  sticker: ActiveSticker | null;
  /** Leaderboard of the finished mission. */
  leaderboard: LeaderboardState;
  /** The selection of the current run. */
  selection: RunSelection | null;
  /** Starts a new run. */
  startRun(selection: RunSelection): void;
  /** Starts a new run with the same selection (Fly again). */
  restartRun(): void;
  /** Resumes a saved run and reports where the player was. */
  resumeRun(snapshot: SessionSnapshot, runId: string): SessionStatus;
  /** Picks a side and plays the turn back. */
  choose(side: Side): Promise<void>;
  /** Leaves the chapter result screen (continue or retry). */
  proceed(): void;
  /** ARIA's advice, or `null` while a turn is playing back. */
  askAria(): string | null;
}
