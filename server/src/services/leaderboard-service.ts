/**
 * LeaderboardService: reads the shared leaderboard and accepts submissions. A submission carries
 * only the run's inputs; the score is recomputed by `ReplayVerifier`.
 */
import { randomUUID } from 'node:crypto';
import type { LeaderboardEntry, LeaderboardQuery } from '../domain/models.js';
import { ConflictError } from '../errors/app-error.js';
import type {
  ILeaderboardRepository,
  IPlayerRepository,
} from '../repositories/interfaces/repositories.js';
import type { SubmitScoreInput } from '../schemas/requests.js';
import type { ContentService } from './content-service.js';
import type { ReplayVerifier } from './replay-verifier.js';
import { requirePlayer, type Clock } from './shared.js';

/** Result of an accepted submission. */
export interface Submission {
  entry: LeaderboardEntry;
  /** 1-based position among the entries of the same world. */
  rank: number;
}

/** Error for a run that is already on the board. */
const alreadySubmitted = (): ConflictError =>
  new ConflictError('This run is already on the leaderboard', 'ALREADY_SUBMITTED');

/** Use cases around the leaderboard. */
export class LeaderboardService {
  constructor(
    private readonly players: IPlayerRepository,
    private readonly leaderboard: ILeaderboardRepository,
    private readonly content: ContentService,
    private readonly verifier: ReplayVerifier,
    private readonly clock: Clock,
  ) {}

  /** Best entries first (score desc, ties: earlier first). */
  top(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
    return this.leaderboard.top(query);
  }

  /**
   * Verifies and records a finished run. One entry exists per (playerId, runId): resubmitting a
   * run that is already on the board is always rejected with ConflictError `ALREADY_SUBMITTED`
   * (409) and never changes the stored entry, so the board cannot be reshuffled by retries.
   * @throws NotFoundError `PLAYER_NOT_FOUND`; ValidationError `UNKNOWN_WORLD`/`UNKNOWN_DIFFICULTY`;
   * UnprocessableError `INVALID_REPLAY`/`RUN_NOT_FINISHED`; ContentInvalidError.
   */
  async submit(input: SubmitScoreInput): Promise<Submission> {
    const player = await requirePlayer(this.players, input.playerId);
    if (await this.leaderboard.findByRun(player.id, input.runId)) throw alreadySubmitted();
    const { bundle } = await this.content.get();
    const report = this.verifier.verify(bundle, {
      worldId: input.world,
      difficultyId: input.difficulty,
      seed: input.seed,
      callsign: player.callsign,
      commands: input.commands,
    });
    const entry: LeaderboardEntry = {
      id: randomUUID(),
      playerId: player.id,
      callsign: player.callsign,
      runId: input.runId,
      worldId: input.world,
      difficultyId: input.difficulty,
      score: report.score,
      day: report.day,
      chaptersCleared: report.chaptersCleared,
      result: report.result,
      createdAt: this.clock().toISOString(),
    };
    if (!(await this.leaderboard.add(entry))) throw alreadySubmitted();
    return { entry, rank: await this.leaderboard.rankOf(entry) };
  }
}
