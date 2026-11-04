/**
 * Route table: maps each endpoint to its validation schemas and controller method. This is the
 * only file that knows the URL layout; controllers and services stay URL-agnostic.
 */
import { Router } from 'express';
import type { AppDependencies } from '../app-dependencies.js';
import {
  ContentController,
  HealthController,
  LeaderboardController,
  PlayerController,
  ProgressController,
} from '../controllers/controllers.js';
import { validate } from '../middleware/validate.js';
import {
  CreatePlayerBody,
  LeaderboardQuerySchema,
  PlayerParams,
  RunParams,
  SubmitScoreBody,
} from '../schemas/requests.js';
import { SnapshotSchema } from '../schemas/snapshot.js';

/** Builds the `/api` router. */
export function createApiRouter(deps: AppDependencies): Router {
  const { services } = deps;
  const health = new HealthController(deps.storage);
  const content = new ContentController(services.content);
  const players = new PlayerController(services.players);
  const progress = new ProgressController(services.progress);
  const leaderboard = new LeaderboardController(services.leaderboard);

  const router = Router();
  router.get('/health', health.get);
  router.get('/content', content.get);
  router.post('/players', validate({ body: CreatePlayerBody }), players.create);

  router.get('/progress/:playerId', validate({ params: PlayerParams }), progress.list);
  router.get('/progress/:playerId/:runId', validate({ params: RunParams }), progress.get);
  router.put(
    '/progress/:playerId/:runId',
    validate({ params: RunParams, body: SnapshotSchema }),
    progress.save,
  );
  router.delete('/progress/:playerId/:runId', validate({ params: RunParams }), progress.remove);

  router.get('/leaderboard', validate({ query: LeaderboardQuerySchema }), leaderboard.list);
  router.post('/leaderboard', validate({ body: SubmitScoreBody }), leaderboard.submit);
  return router;
}
