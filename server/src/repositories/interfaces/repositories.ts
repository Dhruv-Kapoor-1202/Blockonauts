/**
 * Repository contracts (Repository pattern + Dependency Inversion). Services depend on these
 * interfaces only; a concrete driver (JSON file, memory, Cosmos, SQL...) is chosen in the
 * composition root. Every method is async so any I/O-bound store can implement it.
 */
import type { LeaderboardEntry, LeaderboardQuery, Player, SavedRun } from '../../domain/models.js';

/** Stores registered players. */
export interface IPlayerRepository {
  create(player: Player): Promise<void>;
  findById(id: string): Promise<Player | undefined>;
}

/** Stores autosaved runs, keyed by (playerId, runId). */
export interface IProgressRepository {
  /** All runs of a player, most recently updated first. */
  listByPlayer(playerId: string): Promise<SavedRun[]>;
  find(playerId: string, runId: string): Promise<SavedRun | undefined>;
  /** Inserts or replaces the run with the same (playerId, runId). */
  save(run: SavedRun): Promise<void>;
  /** @returns true when a run was removed. */
  delete(playerId: string, runId: string): Promise<boolean>;
}

/** Stores verified leaderboard entries. */
export interface ILeaderboardRepository {
  /** Best entries first (score desc, ties: earlier first), optionally for one world. */
  top(query: LeaderboardQuery): Promise<LeaderboardEntry[]>;
  findByRun(playerId: string, runId: string): Promise<LeaderboardEntry | undefined>;
  /**
   * Appends an entry unless one already exists for the same (playerId, runId); the check and
   * the insert are atomic.
   * @returns false when the run was already present (nothing is stored).
   */
  add(entry: LeaderboardEntry): Promise<boolean>;
  /** 1-based position of `entry` among entries of the same world (it must already be stored). */
  rankOf(entry: LeaderboardEntry): Promise<number>;
}
