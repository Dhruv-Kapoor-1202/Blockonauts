/**
 * Composition root: the ONLY place where concrete implementations are chosen and wired
 * (Dependency Injection by hand). `STORAGE_DRIVER` is interpreted here, through
 * `RepositoryFactory`; the content source strategy is also selected here. Everything else
 * receives interfaces through constructors.
 */
import type { AppDependencies } from './app-dependencies.js';
import type { AppConfig } from './config/env.js';
import { FileSystemContentSource } from './content/content-sources.js';
import { ConsoleLogger, type Logger } from './logging/logger.js';
import type { IContentSource } from './repositories/interfaces/content-source.js';
import { RepositoryFactory, type Repositories } from './repositories/repository-factory.js';
import { ContentService } from './services/content-service.js';
import { LeaderboardService } from './services/leaderboard-service.js';
import { PlayerService } from './services/player-service.js';
import { ProgressService } from './services/progress-service.js';
import { ReplayVerifier } from './services/replay-verifier.js';
import { systemClock, type Clock } from './services/shared.js';

/** Optional replacements, used by tests. */
export interface DependencyOverrides {
  contentSource?: IContentSource;
  logger?: Logger;
  clock?: Clock;
}

/** Everything the app needs plus the repositories (exposed for tests and shutdown hooks). */
export interface BuiltDependencies extends AppDependencies {
  repositories: Repositories;
}

/**
 * Builds the object graph for a configuration.
 *
 * Storage driver switch: `RepositoryFactory.create` maps `config.storageDriver` to repository
 * classes. To add a `cosmos` or `sql` driver, follow the checklist in the TSDoc of that method
 * (one class per repository interface plus one `case`); nothing in this file changes except
 * passing any new config values through `RepositoryOptions`.
 */
export function buildDependencies(
  config: AppConfig,
  overrides: DependencyOverrides = {},
): BuiltDependencies {
  const logger = overrides.logger ?? new ConsoleLogger();
  const clock = overrides.clock ?? systemClock;
  const contentSource = overrides.contentSource ?? new FileSystemContentSource(config.contentDir);
  const repositories = RepositoryFactory.create(config.storageDriver, {
    dataDir: config.dataDir,
    logger,
  });

  const content = new ContentService(contentSource, logger);
  const services = {
    content,
    players: new PlayerService(repositories.players, clock),
    progress: new ProgressService(repositories.players, repositories.progress, content, clock),
    leaderboard: new LeaderboardService(
      repositories.players,
      repositories.leaderboard,
      content,
      new ReplayVerifier(),
      clock,
    ),
  };
  return {
    corsOrigins: config.corsOrigins,
    storage: config.storageDriver,
    logger,
    services,
    repositories,
  };
}
