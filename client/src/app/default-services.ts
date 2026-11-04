/**
 * Composition root of the client: builds the production `AppServices` (fetch API client, content
 * source with bundled fallback, resilient progress and leaderboard stores, `?fast` timing).
 * This is the only module that chooses concrete implementations.
 */
import { loadBundledContent } from '../api/bundled-content';
import { ApiFirstContentSource } from '../api/content-source';
import { FetchApiClient } from '../api/fetch-api-client';
import { PlayerRegistry } from '../api/player-registry';
import { Connectivity } from '../game/connectivity';
import { STORAGE_KEYS } from '../game/constants';
import {
  LocalLeaderboardStore,
  RemoteLeaderboardStore,
  ResilientLeaderboardStore,
} from '../game/leaderboard-store';
import { LocalProgressStore } from '../game/progress-store';
import { RemoteProgressStore, ResilientProgressStore } from '../game/remote-progress-store';
import { timingFromSearch } from '../game/timing';
import { CryptoSeedSource, type AppServices } from './services';

/** Builds the real services for the current page. */
export function createDefaultServices(
  search: string = window.location.search,
  storage: Storage = window.localStorage,
): AppServices {
  const api = new FetchApiClient();
  const connectivity = new Connectivity();
  const players = new PlayerRegistry(api, storage, STORAGE_KEYS.player);
  return {
    content: new ApiFirstContentSource(api, () => loadBundledContent(), connectivity),
    progress: new ResilientProgressStore(
      new RemoteProgressStore(api, players),
      new LocalProgressStore(storage, STORAGE_KEYS.runs),
      connectivity,
    ),
    leaderboard: new ResilientLeaderboardStore(
      new RemoteLeaderboardStore(api, players),
      new LocalLeaderboardStore(storage, STORAGE_KEYS.leaderboard),
      connectivity,
    ),
    connectivity,
    timing: timingFromSearch(search),
    seeds: new CryptoSeedSource(),
    storage,
  };
}
