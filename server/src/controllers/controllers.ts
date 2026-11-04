/**
 * Controllers (HTTP adapters): translate validated requests into service calls and service
 * results into the documented response shapes. They contain no business rules.
 */
import type { Request, Response } from 'express';
import type { StorageDriver } from '../config/env.js';
import { HTTP } from '../config/constants.js';
import { validated } from '../middleware/validate.js';
import type {
  CreatePlayerInput,
  LeaderboardQueryInput,
  PlayerParamsInput,
  RunParamsInput,
  SubmitScoreInput,
} from '../schemas/requests.js';
import type { ContentService } from '../services/content-service.js';
import type { LeaderboardService } from '../services/leaderboard-service.js';
import type { PlayerService } from '../services/player-service.js';
import type { ProgressService } from '../services/progress-service.js';
import type { SnapshotInput } from '../schemas/snapshot.js';

/** `GET /api/health`. */
export class HealthController {
  constructor(private readonly storage: StorageDriver) {}

  get = (_req: Request, res: Response): void => {
    res.json({ status: 'ok', uptime: process.uptime(), storage: this.storage });
  };
}

/** `GET /api/content` (cached bundle with ETag; `If-None-Match` yields 304). */
export class ContentController {
  constructor(private readonly content: ContentService) {}

  get = async (_req: Request, res: Response): Promise<void> => {
    const { json, etag } = await this.content.get();
    res.set('ETag', etag).set('Cache-Control', 'no-cache').type('application/json').send(json);
  };
}

/** `POST /api/players`. */
export class PlayerController {
  constructor(private readonly players: PlayerService) {}

  create = async (_req: Request, res: Response): Promise<void> => {
    const { body } = validated<CreatePlayerInput>(res);
    const player = await this.players.register(body.callsign);
    res.status(HTTP.CREATED).json({ playerId: player.id, callsign: player.callsign });
  };
}

/** `/api/progress/...`. */
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const { params } = validated<unknown, PlayerParamsInput>(res);
    res.json({ runs: await this.progress.list(params.playerId) });
  };

  get = async (_req: Request, res: Response): Promise<void> => {
    const { params } = validated<unknown, RunParamsInput>(res);
    res.json(await this.progress.load(params.playerId, params.runId));
  };

  save = async (_req: Request, res: Response): Promise<void> => {
    const { body, params } = validated<SnapshotInput, RunParamsInput>(res);
    const updatedAt = await this.progress.save(params.playerId, params.runId, body);
    res.json({ runId: params.runId, updatedAt });
  };

  remove = async (_req: Request, res: Response): Promise<void> => {
    const { params } = validated<unknown, RunParamsInput>(res);
    await this.progress.delete(params.playerId, params.runId);
    res.status(HTTP.NO_CONTENT).end();
  };
}

/** `/api/leaderboard`. */
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const { query } = validated<unknown, unknown, LeaderboardQueryInput>(res);
    const entries = await this.leaderboard.top({ worldId: query.world, limit: query.limit });
    res.json({ entries });
  };

  submit = async (_req: Request, res: Response): Promise<void> => {
    const { body } = validated<SubmitScoreInput>(res);
    res.status(HTTP.CREATED).json(await this.leaderboard.submit(body));
  };
}
