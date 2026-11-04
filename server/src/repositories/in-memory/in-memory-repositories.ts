/**
 * In-memory repositories (tests and the `memory` storage driver). Data lives only as long as the
 * process; entities are cloned on the way in and out so callers cannot mutate stored state.
 */
import type { LeaderboardEntry, LeaderboardQuery, Player, SavedRun } from '../../domain/models.js';
import { rankAmong, selectTop } from '../leaderboard-queries.js';
import type {
  ILeaderboardRepository,
  IPlayerRepository,
  IProgressRepository,
} from '../interfaces/repositories.js';

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Players held in a Map. */
export class InMemoryPlayerRepository implements IPlayerRepository {
  private readonly players = new Map<string, Player>();

  async create(player: Player): Promise<void> {
    this.players.set(player.id, clone(player));
  }

  async findById(id: string): Promise<Player | undefined> {
    const player = this.players.get(id);
    return player && clone(player);
  }
}

/** Saved runs held in a Map keyed by `playerId/runId`. */
export class InMemoryProgressRepository implements IProgressRepository {
  private readonly runs = new Map<string, SavedRun>();

  private static key(playerId: string, runId: string): string {
    return `${playerId}/${runId}`;
  }

  async listByPlayer(playerId: string): Promise<SavedRun[]> {
    return [...this.runs.values()]
      .filter((run) => run.playerId === playerId)
      .sort((a, b) => b.summary.updatedAt.localeCompare(a.summary.updatedAt))
      .map(clone);
  }

  async find(playerId: string, runId: string): Promise<SavedRun | undefined> {
    const run = this.runs.get(InMemoryProgressRepository.key(playerId, runId));
    return run && clone(run);
  }

  async save(run: SavedRun): Promise<void> {
    this.runs.set(InMemoryProgressRepository.key(run.playerId, run.runId), clone(run));
  }

  async delete(playerId: string, runId: string): Promise<boolean> {
    return this.runs.delete(InMemoryProgressRepository.key(playerId, runId));
  }
}

/** Leaderboard entries held in an array. */
export class InMemoryLeaderboardRepository implements ILeaderboardRepository {
  private readonly entries: LeaderboardEntry[] = [];

  async top(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
    return selectTop(this.entries, query).map(clone);
  }

  async findByRun(playerId: string, runId: string): Promise<LeaderboardEntry | undefined> {
    const found = this.entries.find((e) => e.playerId === playerId && e.runId === runId);
    return found && clone(found);
  }

  async add(entry: LeaderboardEntry): Promise<boolean> {
    if (this.entries.some((e) => e.playerId === entry.playerId && e.runId === entry.runId)) {
      return false;
    }
    this.entries.push(clone(entry));
    return true;
  }

  async rankOf(entry: LeaderboardEntry): Promise<number> {
    return rankAmong(this.entries, entry);
  }
}
