/**
 * LeaderboardStore: submitting a finished mission and reading TOP COMMANDERS. The remote
 * implementation sends only the run's inputs (seed + commands) and lets the server replay and score
 * it; the local implementation keeps a top-5 list on this device for offline play, and the
 * resilient wrapper switches between them.
 */
import type { ChoiceCommand, MissionReport } from '@commander/engine';
import { isUnreachable, type ApiClient, type LeaderboardEntry } from '../api/types';
import type { PlayerRegistry } from '../api/player-registry';
import type { Connectivity } from './connectivity';
import { LEADERBOARD_SIZE } from './constants';

/** A finished mission, as handed to the leaderboard. */
export interface FinishedRun {
  runId: string;
  seed: number;
  worldId: string;
  difficultyId: string;
  callsign: string;
  commands: readonly ChoiceCommand[];
  report: MissionReport;
}

/** One displayed leaderboard row. */
export interface LeaderboardRow {
  id: string;
  rank: number;
  callsign: string;
  worldId: string;
  score: number;
  day: number;
}

/** The board plus which row (if any) is the player's latest run. */
export interface LeaderboardResult {
  rows: LeaderboardRow[];
  highlightId: string | null;
  source: 'remote' | 'local';
}

/** Leaderboard access. */
export interface LeaderboardStore {
  submit(run: FinishedRun): Promise<LeaderboardResult>;
  top(): Promise<LeaderboardResult>;
}

function toRow(entry: LeaderboardEntry, rank: number): LeaderboardRow {
  return {
    id: entry.id,
    rank,
    callsign: entry.callsign,
    worldId: entry.worldId,
    score: entry.score,
    day: entry.day,
  };
}

function toRows(entries: readonly LeaderboardEntry[]): LeaderboardRow[] {
  return entries.map((entry, index) => toRow(entry, index + 1));
}

/** Shared server leaderboard. */
export class RemoteLeaderboardStore implements LeaderboardStore {
  constructor(
    private readonly api: ApiClient,
    private readonly players: PlayerRegistry,
    private readonly size: number = LEADERBOARD_SIZE,
  ) {}

  async submit(run: FinishedRun): Promise<LeaderboardResult> {
    const playerId = await this.players.ensure(run.callsign);
    const receipt = await this.api.submitScore({
      playerId,
      runId: run.runId,
      seed: run.seed,
      world: run.worldId,
      difficulty: run.difficultyId,
      commands: [...run.commands],
    });
    const entries = await this.api.leaderboard({ limit: this.size });
    const rows = toRows(entries);
    if (!rows.some((row) => row.id === receipt.entry.id)) {
      rows.push(toRow(receipt.entry, receipt.rank));
    }
    return { rows, highlightId: receipt.entry.id, source: 'remote' };
  }

  async top(): Promise<LeaderboardResult> {
    const entries = await this.api.leaderboard({ limit: this.size });
    return { rows: toRows(entries), highlightId: null, source: 'remote' };
  }
}

interface LocalEntry {
  id: string;
  callsign: string;
  worldId: string;
  score: number;
  day: number;
}

/** Top-5 on this device (the prototype's `cmdr_lb2` idea, namespaced). */
export class LocalLeaderboardStore implements LeaderboardStore {
  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'>,
    private readonly storageKey: string,
    private readonly size: number = LEADERBOARD_SIZE,
  ) {}

  submit(run: FinishedRun): Promise<LeaderboardResult> {
    const entry: LocalEntry = {
      id: run.runId,
      callsign: run.callsign,
      worldId: run.worldId,
      score: run.report.score,
      day: run.report.day,
    };
    const board = [...this.read().filter((e) => e.id !== entry.id), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, this.size);
    this.write(board);
    return Promise.resolve(this.result(board, entry.id));
  }

  top(): Promise<LeaderboardResult> {
    return Promise.resolve(this.result(this.read(), null));
  }

  private result(board: LocalEntry[], highlightId: string | null): LeaderboardResult {
    const rows = board.map((entry, index) => ({ ...entry, rank: index + 1 }));
    return { rows, highlightId, source: 'local' };
  }

  private read(): LocalEntry[] {
    try {
      const parsed: unknown = JSON.parse(this.storage.getItem(this.storageKey) ?? '[]');
      return Array.isArray(parsed) ? (parsed as LocalEntry[]) : [];
    } catch {
      return [];
    }
  }

  private write(board: LocalEntry[]): void {
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(board));
    } catch {
      // Storage unavailable: the score is just not remembered.
    }
  }
}

/** Uses the shared board when reachable; otherwise the device board. */
export class ResilientLeaderboardStore implements LeaderboardStore {
  constructor(
    private readonly remote: LeaderboardStore,
    private readonly local: LeaderboardStore,
    private readonly connectivity: Connectivity,
  ) {}

  async submit(run: FinishedRun): Promise<LeaderboardResult> {
    try {
      const result = await this.remote.submit(run);
      this.connectivity.markOnline();
      return result;
    } catch (error) {
      if (isUnreachable(error)) this.connectivity.markOffline();
      return this.local.submit(run);
    }
  }

  async top(): Promise<LeaderboardResult> {
    try {
      return await this.remote.top();
    } catch (error) {
      if (isUnreachable(error)) this.connectivity.markOffline();
      return this.local.top();
    }
  }
}
