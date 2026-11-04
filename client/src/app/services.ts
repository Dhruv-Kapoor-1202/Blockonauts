/**
 * AppServices: everything the app needs from the outside world (content, saves, leaderboard,
 * connectivity, timing, randomness, storage), bundled into one injectable object. Production wires
 * the real implementations in `default-services.ts`; tests pass fakes through `ServicesProvider`.
 */
import { createContext, useContext } from 'react';
import type { ContentSource } from '../api/content-source';
import type { Connectivity } from '../game/connectivity';
import type { LeaderboardStore } from '../game/leaderboard-store';
import type { ProgressStore } from '../game/progress-store';
import type { Timing } from '../game/timing';

/** Source of the run seed and run id (the engine itself never calls `Math.random`). */
export interface SeedSource {
  /** An unsigned 32-bit integer seed for a new run. */
  newSeed(): number;
  /** A fresh UUID for a new run. */
  newRunId(): string;
}

/** Everything injected into the app. */
export interface AppServices {
  content: ContentSource;
  progress: ProgressStore;
  leaderboard: LeaderboardStore;
  connectivity: Connectivity;
  timing: Timing;
  seeds: SeedSource;
  /** Small preferences (last callsign). */
  storage: Pick<Storage, 'getItem' | 'setItem'>;
}

/** Browser-crypto seed source. */
export class CryptoSeedSource implements SeedSource {
  newSeed(): number {
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
  }

  newRunId(): string {
    return crypto.randomUUID();
  }
}

const ServicesContext = createContext<AppServices | null>(null);

/** Provider of {@link AppServices}. */
export const ServicesProvider = ServicesContext.Provider;

/** Reads the services. @throws Error outside a {@link ServicesProvider}. */
export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}
