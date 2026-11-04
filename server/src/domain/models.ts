/**
 * Domain types persisted and returned by the API. They are plain serialisable data; repositories
 * store them and services create them, so neither depends on Express or on a storage engine.
 */
import type { MissionReport, SessionSnapshot, SessionStatus } from '@commander/engine';

/** A registered player. */
export interface Player {
  id: string;
  callsign: string;
  createdAt: string;
}

/** Denormalised facts about a saved run, enough to render a "Continue" list without the snapshot. */
export interface SavedRunSummary {
  worldId: string;
  difficultyId: string;
  chapterIndex: number;
  day: number;
  status: SessionStatus;
  updatedAt: string;
}

/** A run saved by autosave: the full memento plus its summary. */
export interface SavedRun {
  runId: string;
  playerId: string;
  snapshot: SessionSnapshot;
  summary: SavedRunSummary;
}

/** One verified, server-scored finished mission on the shared leaderboard. */
export interface LeaderboardEntry {
  id: string;
  playerId: string;
  callsign: string;
  runId: string;
  worldId: string;
  difficultyId: string;
  score: number;
  day: number;
  chaptersCleared: number;
  result: MissionReport['result'];
  createdAt: string;
}

/** Criteria of a leaderboard read. */
export interface LeaderboardQuery {
  worldId?: string;
  limit: number;
}
