/**
 * Wire types of the COMMANDER server API and the `ApiClient` interface the rest of the client
 * depends on. Components and stores never call `fetch` directly, so tests inject a fake client.
 */
import type {
  ChoiceCommand,
  ContentData,
  MissionReport,
  SessionSnapshot,
  SessionStatus,
} from '@commander/engine';

/** One row of the "continue" list (`GET /api/progress/:playerId`). */
export interface RunSummary {
  runId: string;
  worldId: string;
  difficultyId: string;
  chapterIndex: number;
  chapterTitle?: string;
  day: number;
  status: SessionStatus;
  updatedAt: string;
  callsign: string;
}

/** A leaderboard row computed by the server. */
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

/** `POST /api/players` response. */
export interface PlayerRecord {
  playerId: string;
  callsign: string;
}

/** `POST /api/leaderboard` body: the run's inputs; the server replays them and scores the run. */
export interface ScoreSubmission {
  playerId: string;
  runId: string;
  seed: number;
  world: string;
  difficulty: string;
  commands: ChoiceCommand[];
}

/** `POST /api/leaderboard` response. */
export interface ScoreReceipt {
  entry: LeaderboardEntry;
  rank: number;
}

/** Options of a leaderboard read. */
export interface LeaderboardQuery {
  world?: string;
  limit?: number;
}

/** The server answered with an error (or an unexpected status). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The server could not be reached (network failure, timeout, or a dead proxy target). */
export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

/** HTTP statuses that mean "the API is not really there" (e.g. the dev proxy cannot reach it). */
const UNREACHABLE_FROM_STATUS = 500;

/** True when an error means the API is unreachable (as opposed to rejecting a request). */
export function isUnreachable(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  return error instanceof ApiError && error.status >= UNREACHABLE_FROM_STATUS;
}

/** Typed access to the server. */
export interface ApiClient {
  health(): Promise<void>;
  getContent(options?: { timeoutMs?: number }): Promise<ContentData>;
  createPlayer(callsign: string): Promise<PlayerRecord>;
  listRuns(playerId: string): Promise<RunSummary[]>;
  getRun(playerId: string, runId: string): Promise<SessionSnapshot>;
  saveRun(
    playerId: string,
    runId: string,
    snapshot: SessionSnapshot,
  ): Promise<{ updatedAt: string }>;
  deleteRun(playerId: string, runId: string): Promise<void>;
  leaderboard(query?: LeaderboardQuery): Promise<LeaderboardEntry[]>;
  submitScore(submission: ScoreSubmission): Promise<ScoreReceipt>;
}
