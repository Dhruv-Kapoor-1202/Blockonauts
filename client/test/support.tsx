/**
 * Test support: injectable `AppServices` that need no network, backed by the shared mini content
 * fixture, in-memory stores with spies, instant timing and a fixed seed. Also helpers to render
 * the whole app and to walk the screens.
 */
import { ContentBundle, ContentLoader, type SessionSnapshot } from '@commander/engine';
import { render, screen, within, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LoadedBundle } from '../src/api/content-source';
import type { RunSummary } from '../src/api/types';
import { App } from '../src/app/App';
import type { AppServices, SeedSource } from '../src/app/services';
import { Connectivity } from '../src/game/connectivity';
import {
  LocalLeaderboardStore,
  type FinishedRun,
  type LeaderboardStore,
} from '../src/game/leaderboard-store';
import { summarize, type ProgressStore } from '../src/game/progress-store';
import { FAST_TIMING } from '../src/game/timing';
import type { ThemeDefinition } from '../src/themes/types';
import { buildMiniContentFiles } from '../../packages/engine/test/fixtures/mini-content';

/** Builds the mini-campaign bundle used by every client test. */
export function buildMiniBundle(): ContentBundle {
  return new ContentBundle(ContentLoader.load(buildMiniContentFiles()).data);
}

/** In-memory progress store that records what happened to it. */
export class FakeProgressStore implements ProgressStore {
  readonly runs = new Map<string, { snapshot: SessionSnapshot; updatedAt: string }>();
  readonly deleted: string[] = [];
  saves = 0;

  list(): Promise<RunSummary[]> {
    return Promise.resolve(
      [...this.runs.entries()].map(([runId, run]) => summarize(runId, run.updatedAt, run.snapshot)),
    );
  }

  get(runId: string): Promise<SessionSnapshot | null> {
    return Promise.resolve(this.runs.get(runId)?.snapshot ?? null);
  }

  save(runId: string, snapshot: SessionSnapshot): Promise<void> {
    this.saves += 1;
    this.runs.set(runId, { snapshot, updatedAt: new Date(this.saves).toISOString() });
    return Promise.resolve();
  }

  delete(runId: string): Promise<void> {
    this.deleted.push(runId);
    this.runs.delete(runId);
    return Promise.resolve();
  }
}

/** Services plus handles on the fakes. */
export interface TestServices extends AppServices {
  progress: FakeProgressStore;
  submissions: FinishedRun[];
}

/** In-memory `Storage` stand-in. */
export function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

/** Deterministic seeds. */
export class FixedSeeds implements SeedSource {
  private runs = 0;
  newSeed(): number {
    return 1234;
  }
  newRunId(): string {
    this.runs += 1;
    return `00000000-0000-4000-8000-${String(this.runs).padStart(12, '0')}`;
  }
}

/** Builds fully fake services. */
export function createTestServices(overrides: Partial<AppServices> = {}): TestServices {
  const storage = memoryStorage();
  const local = new LocalLeaderboardStore(storage, 'test.leaderboard');
  const submissions: FinishedRun[] = [];
  const leaderboard: LeaderboardStore = {
    submit: (run) => {
      submissions.push(run);
      return local.submit(run);
    },
    top: () => local.top(),
  };
  const bundle = buildMiniBundle();
  const loaded: LoadedBundle = { bundle, origin: 'bundled' };
  return {
    content: { load: () => Promise.resolve(loaded) },
    progress: new FakeProgressStore(),
    leaderboard,
    connectivity: new Connectivity(),
    timing: FAST_TIMING,
    seeds: new FixedSeeds(),
    storage,
    ...overrides,
    submissions,
  } as TestServices;
}

/** Renders the whole app with the given services (and optional themes). */
export function renderApp(
  services: AppServices = createTestServices(),
  themes?: readonly ThemeDefinition[],
): RenderResult & { user: ReturnType<typeof userEvent.setup>; services: AppServices } {
  const user = userEvent.setup();
  const result = render(<App services={services} themes={themes} />);
  return { ...result, user, services };
}

/** Types a callsign, presses Enter, picks the selection and enters the first chapter's game. */
export async function startGame(
  user: ReturnType<typeof userEvent.setup>,
  options: { callsign?: string; difficulty?: string } = {},
): Promise<void> {
  await user.type(
    await screen.findByLabelText('Commander callsign'),
    `${options.callsign ?? 'ada'}{Enter}`,
  );
  if (options.difficulty) {
    await user.click(
      await screen.findByRole('radio', { name: new RegExp(options.difficulty, 'i') }),
    );
  }
  await user.click(await screen.findByRole('button', { name: /launch/i }));
  await user.click(await screen.findByRole('button', { name: /begin/i }));
  await screen.findByTestId('card');
}

/** The text of the card on the table. */
export function cardText(): string {
  return within(screen.getByTestId('card')).getByText(/./, { selector: 'p' }).textContent ?? '';
}
