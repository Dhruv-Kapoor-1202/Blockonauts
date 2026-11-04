/**
 * RepositoryFactory (Factory pattern): the single place that maps a `StorageDriver` to concrete
 * repository classes. Services only ever see the three repository interfaces.
 */
import type { StorageDriver } from '../config/env.js';
import type { Logger } from '../logging/logger.js';
import {
  InMemoryLeaderboardRepository,
  InMemoryPlayerRepository,
  InMemoryProgressRepository,
} from './in-memory/in-memory-repositories.js';
import type {
  ILeaderboardRepository,
  IPlayerRepository,
  IProgressRepository,
} from './interfaces/repositories.js';
import {
  JsonFileLeaderboardRepository,
  JsonFilePlayerRepository,
  JsonFileProgressRepository,
} from './json-file/json-file-repositories.js';

/** The three repositories of one storage driver. */
export interface Repositories {
  players: IPlayerRepository;
  progress: IProgressRepository;
  leaderboard: ILeaderboardRepository;
}

/** What a driver may need to build its repositories. */
export interface RepositoryOptions {
  /** Folder for file based drivers. */
  dataDir: string;
  logger?: Logger;
}

/** Builds repositories for a driver. */
export class RepositoryFactory {
  /**
   * Creates the repositories of `driver`.
   *
   * ## How to add a new driver (for example `cosmos` or `sql`)
   * 1. Add the name to `STORAGE_DRIVERS` in `config/env.ts` (this widens `StorageDriver`).
   * 2. Create one class per interface in a new folder `repositories/<driver>/`:
   *    `<Driver>PlayerRepository implements IPlayerRepository`,
   *    `<Driver>ProgressRepository implements IProgressRepository` and
   *    `<Driver>LeaderboardRepository implements ILeaderboardRepository`.
   *    Reuse `leaderboard-queries.ts` ordering rules, or push them into the database
   *    (score DESC, createdAt ASC, scoped by world) and keep `rankOf` consistent with them.
   * 3. Add one `case '<driver>':` below that returns the three new instances. The `never` check
   *    in `default` makes TypeScript fail the build until every driver is handled.
   * 4. Add any connection settings to `AppConfig`/`EnvSchema` (never read `process.env` here).
   * No service, controller, route or test code changes: they only know the interfaces.
   *
   * @throws Error for an unknown driver (unreachable when types are respected).
   */
  static create(driver: StorageDriver, options: RepositoryOptions): Repositories {
    switch (driver) {
      case 'memory':
        return {
          players: new InMemoryPlayerRepository(),
          progress: new InMemoryProgressRepository(),
          leaderboard: new InMemoryLeaderboardRepository(),
        };
      case 'json':
        return {
          players: new JsonFilePlayerRepository(options.dataDir, options.logger),
          progress: new JsonFileProgressRepository(options.dataDir, options.logger),
          leaderboard: new JsonFileLeaderboardRepository(options.dataDir, options.logger),
        };
      default: {
        const unsupported: never = driver;
        throw new Error(`Unsupported storage driver: ${String(unsupported)}`);
      }
    }
  }
}
