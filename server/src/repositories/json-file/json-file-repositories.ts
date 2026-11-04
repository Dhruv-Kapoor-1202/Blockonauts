/**
 * JSON-file repositories: one JSON array per collection inside the data directory
 * (`players.json`, `progress.json`, `leaderboard.json`). All I/O goes through `JsonFileStore`,
 * which provides atomic writes and per-file serialisation.
 */
import path from 'node:path';
import type { LeaderboardEntry, LeaderboardQuery, Player, SavedRun } from '../../domain/models.js';
import type { Logger } from '../../logging/logger.js';
import type {
  ILeaderboardRepository,
  IPlayerRepository,
  IProgressRepository,
} from '../interfaces/repositories.js';
import { rankAmong, selectTop } from '../leaderboard-queries.js';
import { JsonFileStore } from './json-file-store.js';

function isRecordArray<T extends object>(raw: unknown): raw is T[] {
  return Array.isArray(raw) && raw.every((item) => typeof item === 'object' && item !== null);
}

function collection<T extends object>(dataDir: string, name: string, logger?: Logger) {
  return new JsonFileStore<T[]>(
    path.join(dataDir, name),
    () => [],
    (raw): raw is T[] => isRecordArray<T>(raw),
    logger,
  );
}

/** Players persisted in `players.json`. */
export class JsonFilePlayerRepository implements IPlayerRepository {
  private readonly store: JsonFileStore<Player[]>;

  constructor(dataDir: string, logger?: Logger) {
    this.store = collection<Player>(dataDir, 'players.json', logger);
  }

  create(player: Player): Promise<void> {
    return this.store.update((players) => ({ next: [...players, player], result: undefined }));
  }

  async findById(id: string): Promise<Player | undefined> {
    return (await this.store.read()).find((player) => player.id === id);
  }
}

/** Saved runs persisted in `progress.json`. */
export class JsonFileProgressRepository implements IProgressRepository {
  private readonly store: JsonFileStore<SavedRun[]>;

  constructor(dataDir: string, logger?: Logger) {
    this.store = collection<SavedRun>(dataDir, 'progress.json', logger);
  }

  async listByPlayer(playerId: string): Promise<SavedRun[]> {
    const runs = await this.store.read();
    return runs
      .filter((run) => run.playerId === playerId)
      .sort((a, b) => b.summary.updatedAt.localeCompare(a.summary.updatedAt));
  }

  async find(playerId: string, runId: string): Promise<SavedRun | undefined> {
    return (await this.store.read()).find((r) => r.playerId === playerId && r.runId === runId);
  }

  save(run: SavedRun): Promise<void> {
    return this.store.update((runs) => {
      const others = runs.filter((r) => !(r.playerId === run.playerId && r.runId === run.runId));
      return { next: [...others, run], result: undefined };
    });
  }

  delete(playerId: string, runId: string): Promise<boolean> {
    return this.store.update((runs) => {
      const remaining = runs.filter((r) => !(r.playerId === playerId && r.runId === runId));
      const removed = remaining.length !== runs.length;
      return { next: removed ? remaining : runs, result: removed };
    });
  }
}

/** Leaderboard entries persisted in `leaderboard.json`. */
export class JsonFileLeaderboardRepository implements ILeaderboardRepository {
  private readonly store: JsonFileStore<LeaderboardEntry[]>;

  constructor(dataDir: string, logger?: Logger) {
    this.store = collection<LeaderboardEntry>(dataDir, 'leaderboard.json', logger);
  }

  async top(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
    return selectTop(await this.store.read(), query);
  }

  async findByRun(playerId: string, runId: string): Promise<LeaderboardEntry | undefined> {
    const entries = await this.store.read();
    return entries.find((e) => e.playerId === playerId && e.runId === runId);
  }

  add(entry: LeaderboardEntry): Promise<boolean> {
    return this.store.update((entries) => {
      const exists = entries.some((e) => e.playerId === entry.playerId && e.runId === entry.runId);
      return exists
        ? { next: entries, result: false }
        : { next: [...entries, entry], result: true };
    });
  }

  async rankOf(entry: LeaderboardEntry): Promise<number> {
    return rankAmong(await this.store.read(), entry);
  }
}
