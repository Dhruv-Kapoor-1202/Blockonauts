/**
 * ProgressService: use cases for autosaved runs (list, load, save, delete). The server trusts a
 * saved snapshot only as the player's own resume data; scores are never taken from it (the
 * leaderboard recomputes them by replay).
 */
import type { SessionSnapshot } from '@commander/engine';
import { MAX_RUNS_PER_PLAYER } from '../config/constants.js';
import type { SavedRun } from '../domain/models.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import type {
  IPlayerRepository,
  IProgressRepository,
} from '../repositories/interfaces/repositories.js';
import type { ContentService } from './content-service.js';
import { requirePlayer, type Clock } from './shared.js';

/** One row of the "Continue" list. */
export interface RunListItem {
  runId: string;
  worldId: string;
  difficultyId: string;
  chapterIndex: number;
  chapterTitle?: string;
  day: number;
  status: SavedRun['summary']['status'];
  updatedAt: string;
  callsign: string;
}

/** Use cases around saved runs. */
export class ProgressService {
  constructor(
    private readonly players: IPlayerRepository,
    private readonly progress: IProgressRepository,
    private readonly content: ContentService,
    private readonly clock: Clock,
  ) {}

  /** Lists a player's runs, newest first. @throws NotFoundError for an unknown player. */
  async list(playerId: string): Promise<RunListItem[]> {
    await requirePlayer(this.players, playerId);
    const runs = await this.progress.listByPlayer(playerId);
    const loaded = await this.content.tryGet();
    return runs.map((run) => {
      const { summary, snapshot } = run;
      const data = loaded?.bundle.data;
      const chapterId = data?.campaign.sequences[summary.worldId]?.[summary.chapterIndex];
      const title = chapterId ? data?.chapters[chapterId]?.def.title : undefined;
      return {
        runId: run.runId,
        worldId: summary.worldId,
        difficultyId: summary.difficultyId,
        chapterIndex: summary.chapterIndex,
        ...(title === undefined ? {} : { chapterTitle: title }),
        day: summary.day,
        status: summary.status,
        updatedAt: summary.updatedAt,
        callsign: snapshot.callsign,
      };
    });
  }

  /** The full snapshot needed to resume. @throws NotFoundError (`RUN_NOT_FOUND`). */
  async load(playerId: string, runId: string): Promise<SessionSnapshot> {
    await requirePlayer(this.players, playerId);
    const run = await this.progress.find(playerId, runId);
    if (!run) throw new NotFoundError(`Run ${runId} not found`, 'RUN_NOT_FOUND');
    return run.snapshot;
  }

  /**
   * Creates or replaces a run.
   * @returns the `updatedAt` timestamp stored in the summary.
   * @throws NotFoundError for an unknown player; ConflictError (`RUN_LIMIT_REACHED`) when the
   * player already stores the maximum number of other runs.
   */
  async save(playerId: string, runId: string, snapshot: SessionSnapshot): Promise<string> {
    await requirePlayer(this.players, playerId);
    const existing = await this.progress.listByPlayer(playerId);
    const isNew = !existing.some((run) => run.runId === runId);
    if (isNew && existing.length >= MAX_RUNS_PER_PLAYER) {
      throw new ConflictError(
        `A player can store at most ${MAX_RUNS_PER_PLAYER} runs; delete one first`,
        'RUN_LIMIT_REACHED',
      );
    }
    const updatedAt = this.clock().toISOString();
    await this.progress.save({
      runId,
      playerId,
      snapshot,
      summary: {
        worldId: snapshot.worldId,
        difficultyId: snapshot.difficultyId,
        chapterIndex: snapshot.state.chapterIndex,
        day: snapshot.state.day,
        status: snapshot.state.status,
        updatedAt,
      },
    });
    return updatedAt;
  }

  /** Deletes a run. @throws NotFoundError (`RUN_NOT_FOUND`). */
  async delete(playerId: string, runId: string): Promise<void> {
    await requirePlayer(this.players, playerId);
    const removed = await this.progress.delete(playerId, runId);
    if (!removed) throw new NotFoundError(`Run ${runId} not found`, 'RUN_NOT_FOUND');
  }
}
