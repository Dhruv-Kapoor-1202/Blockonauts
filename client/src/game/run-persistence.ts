/**
 * RunPersistence: everything a run writes outside the game: autosaves after every command, the
 * clean-up of other saved runs (one save slot per player), deleting the save when the mission ends,
 * and the leaderboard submission. Saves and deletes run strictly in order through a promise chain,
 * so a late save can never resurrect a deleted run. Failures never reach the player.
 */
import type { GameSession, MissionReport, SessionSnapshot } from '@commander/engine';
import type { LeaderboardResult, LeaderboardStore } from './leaderboard-store';
import type { ProgressStore } from './progress-store';

/** The identity of the run being persisted. */
export interface RunIdentity {
  runId: string;
  callsign: string;
}

/** Writes a run's save game and score. */
export class RunPersistence {
  private chain: Promise<unknown> = Promise.resolve();
  private readonly purged = new Set<string>();

  constructor(
    private readonly progress: ProgressStore,
    private readonly leaderboard: LeaderboardStore,
  ) {}

  /** Marks a run whose other saves must not be touched (a resumed run). */
  skipPurge(runId: string): void {
    this.purged.add(runId);
  }

  /** Saves a snapshot; the first save of a run also removes the player's other saved runs. */
  autosave(runId: string, snapshot: SessionSnapshot): void {
    this.enqueue(async () => {
      await this.progress.save(runId, snapshot);
      if (this.purged.has(runId)) return;
      this.purged.add(runId);
      const runs = await this.progress.list();
      await Promise.all(
        runs.filter((r) => r.runId !== runId).map((r) => this.progress.delete(r.runId)),
      );
    });
  }

  /** Deletes the save of a finished run and submits its inputs to the leaderboard. */
  finish(
    run: RunIdentity,
    session: GameSession,
    report: MissionReport,
  ): Promise<LeaderboardResult> {
    this.enqueue(() => this.progress.delete(run.runId));
    return this.leaderboard.submit({
      runId: run.runId,
      seed: session.seed,
      worldId: session.worldId,
      difficultyId: session.difficultyId,
      callsign: run.callsign,
      commands: session.commandLog,
      report,
    });
  }

  private enqueue(task: () => Promise<unknown>): void {
    this.chain = this.chain.then(task).catch(() => undefined);
  }
}
