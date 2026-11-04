/**
 * ReplayVerifier: the anti-cheat core. The engine is deterministic, so replaying a run's seed and
 * command log against the server's own content reproduces the exact mission. The score, day and
 * result come from that replay, never from the client.
 */
import {
  EngineError,
  GameSessionFactory,
  type ChoiceCommand,
  type ContentBundle,
  type MissionReport,
} from '@commander/engine';
import { UnprocessableError, ValidationError } from '../errors/app-error.js';

/** Everything needed to replay a run. */
export interface ReplayRequest {
  worldId: string;
  difficultyId: string;
  seed: number;
  callsign: string;
  commands: readonly ChoiceCommand[];
}

/** Replays command logs and extracts the authoritative mission report. */
export class ReplayVerifier {
  /**
   * @returns the final `MissionReport` of a finished run.
   * @throws ValidationError `UNKNOWN_WORLD` / `UNKNOWN_DIFFICULTY` (400);
   * UnprocessableError `INVALID_REPLAY` when the engine rejects a command (422) or
   * `RUN_NOT_FINISHED` when the log does not end in `missionOver` (422).
   */
  verify(bundle: ContentBundle, request: ReplayRequest): MissionReport {
    const { data } = bundle;
    if (!data.worlds.some((world) => world.id === request.worldId)) {
      throw new ValidationError(`Unknown world "${request.worldId}"`, 'UNKNOWN_WORLD');
    }
    if (!data.difficulties.some((difficulty) => difficulty.id === request.difficultyId)) {
      throw new ValidationError(
        `Unknown difficulty "${request.difficultyId}"`,
        'UNKNOWN_DIFFICULTY',
      );
    }
    try {
      const session = GameSessionFactory.replay(
        {
          bundle,
          worldId: request.worldId,
          difficultyId: request.difficultyId,
          seed: request.seed,
          callsign: request.callsign,
        },
        request.commands,
      );
      const view = session.view();
      if (view.status !== 'missionOver' || !view.report) {
        throw new UnprocessableError('The submitted run is not finished', 'RUN_NOT_FINISHED');
      }
      return view.report;
    } catch (error) {
      if (error instanceof EngineError) {
        throw new UnprocessableError(
          `The command log is not a valid run: ${error.message}`,
          'INVALID_REPLAY',
        );
      }
      throw error;
    }
  }
}
