/**
 * ProgressStore: the client's save-game interface (list / get / save / delete runs) plus the
 * localStorage implementation used while offline. The game talks only to the interface; the
 * composition root decides whether saves go to the server, to this store, or both.
 */
import type { SessionSnapshot } from '@commander/engine';
import type { RunSummary } from '../api/types';
import { LOCAL_RUN_LIMIT } from './constants';

/** Autosave storage. */
export interface ProgressStore {
  /** Saved runs, newest first. */
  list(): Promise<RunSummary[]>;
  /** The snapshot of a run, or `null` when it does not exist. */
  get(runId: string): Promise<SessionSnapshot | null>;
  /** Creates or replaces a run. */
  save(runId: string, snapshot: SessionSnapshot): Promise<void>;
  /** Removes a run (no error when it does not exist). */
  delete(runId: string): Promise<void>;
}

interface LocalRun {
  runId: string;
  updatedAt: string;
  snapshot: SessionSnapshot;
}

/** Builds the summary shown in the "continue" list from a snapshot. */
export function summarize(runId: string, updatedAt: string, snapshot: SessionSnapshot): RunSummary {
  return {
    runId,
    worldId: snapshot.worldId,
    difficultyId: snapshot.difficultyId,
    chapterIndex: snapshot.state.chapterIndex,
    day: snapshot.state.day,
    status: snapshot.state.status,
    updatedAt,
    callsign: snapshot.callsign,
  };
}

/** Saves runs in localStorage (offline play, and the fallback behind the remote store). */
export class LocalProgressStore implements ProgressStore {
  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'>,
    private readonly storageKey: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(): Promise<RunSummary[]> {
    const runs = this.read().map((run) => summarize(run.runId, run.updatedAt, run.snapshot));
    return Promise.resolve(runs);
  }

  get(runId: string): Promise<SessionSnapshot | null> {
    return Promise.resolve(this.read().find((run) => run.runId === runId)?.snapshot ?? null);
  }

  save(runId: string, snapshot: SessionSnapshot): Promise<void> {
    const others = this.read().filter((run) => run.runId !== runId);
    const run: LocalRun = { runId, updatedAt: this.now().toISOString(), snapshot };
    this.write([run, ...others].slice(0, LOCAL_RUN_LIMIT));
    return Promise.resolve();
  }

  delete(runId: string): Promise<void> {
    this.write(this.read().filter((run) => run.runId !== runId));
    return Promise.resolve();
  }

  private read(): LocalRun[] {
    try {
      const parsed: unknown = JSON.parse(this.storage.getItem(this.storageKey) ?? '[]');
      return Array.isArray(parsed) ? (parsed as LocalRun[]) : [];
    } catch {
      return [];
    }
  }

  private write(runs: LocalRun[]): void {
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(runs));
    } catch {
      // Quota or private mode: progress simply is not persisted.
    }
  }
}
