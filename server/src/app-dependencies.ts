/**
 * Application wiring contract: everything `createApp` needs, expressed as services and plain
 * values. The composition root builds it; tests may build it by hand.
 */
import type { StorageDriver } from './config/env.js';
import type { Logger } from './logging/logger.js';
import type { ContentService } from './services/content-service.js';
import type { LeaderboardService } from './services/leaderboard-service.js';
import type { PlayerService } from './services/player-service.js';
import type { ProgressService } from './services/progress-service.js';

/** The use-case layer. */
export interface Services {
  content: ContentService;
  players: PlayerService;
  progress: ProgressService;
  leaderboard: LeaderboardService;
}

/** Dependencies of the express app. */
export interface AppDependencies {
  corsOrigins: readonly string[];
  storage: StorageDriver;
  logger: Logger;
  services: Services;
}
