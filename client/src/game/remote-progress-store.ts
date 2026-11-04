/**
 * Server-backed implementations: `RemoteProgressStore` (the API's progress routes) and
 * `ResilientProgressStore`, which wraps it with a local store so play continues offline through the
 * very same interface. The resilient store reports reachability to `Connectivity`.
 */
import type { SessionSnapshot } from '@commander/engine';
import { isUnreachable, type ApiClient, type RunSummary } from '../api/types';
import type { PlayerRegistry } from '../api/player-registry';
import type { Connectivity } from './connectivity';
import type { ProgressStore } from './progress-store';

/** Saves runs on the server. */
export class RemoteProgressStore implements ProgressStore {
  constructor(
    private readonly api: ApiClient,
    private readonly players: PlayerRegistry,
  ) {}

  async list(): Promise<RunSummary[]> {
    const playerId = this.players.currentId();
    return playerId ? this.api.listRuns(playerId) : [];
  }

  async get(runId: string): Promise<SessionSnapshot | null> {
    const playerId = this.players.currentId();
    return playerId ? this.api.getRun(playerId, runId) : null;
  }

  async save(runId: string, snapshot: SessionSnapshot): Promise<void> {
    const playerId = await this.players.ensure(snapshot.callsign);
    await this.api.saveRun(playerId, runId, snapshot);
  }

  async delete(runId: string): Promise<void> {
    const playerId = this.players.currentId();
    if (playerId) await this.api.deleteRun(playerId, runId);
  }
}

/** Prefers the server; falls back to (and merges with) the local store when it is unreachable. */
export class ResilientProgressStore implements ProgressStore {
  constructor(
    private readonly remote: ProgressStore,
    private readonly local: ProgressStore,
    private readonly connectivity: Connectivity,
  ) {}

  async list(): Promise<RunSummary[]> {
    const localRuns = await this.local.list();
    try {
      const remoteRuns = await this.remote.list();
      const known = new Set(remoteRuns.map((run) => run.runId));
      return [...remoteRuns, ...localRuns.filter((run) => !known.has(run.runId))].sort(newestFirst);
    } catch (error) {
      this.noteFailure(error);
      return localRuns;
    }
  }

  async get(runId: string): Promise<SessionSnapshot | null> {
    const localCopy = await this.local.get(runId);
    try {
      return (await this.remote.get(runId)) ?? localCopy;
    } catch (error) {
      this.noteFailure(error);
      return localCopy;
    }
  }

  async save(runId: string, snapshot: SessionSnapshot): Promise<void> {
    try {
      await this.remote.save(runId, snapshot);
      this.connectivity.markOnline();
      await this.local.delete(runId);
    } catch (error) {
      this.noteFailure(error);
      await this.local.save(runId, snapshot);
    }
  }

  async delete(runId: string): Promise<void> {
    await this.local.delete(runId);
    try {
      await this.remote.delete(runId);
    } catch (error) {
      this.noteFailure(error);
    }
  }

  private noteFailure(error: unknown): void {
    if (isUnreachable(error)) this.connectivity.markOffline();
  }
}

function newestFirst(a: RunSummary, b: RunSummary): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}
