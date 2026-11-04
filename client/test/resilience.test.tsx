/**
 * Content and persistence resilience: the API client maps errors, the content source falls back to
 * the bundled content when the API is unreachable (and the app shows the OFFLINE chip), and the
 * resilient stores switch to local storage through the same interfaces.
 */
import { GameSessionFactory, type ContentData } from '@commander/engine';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loadBundledContent } from '../src/api/bundled-content';
import { ApiFirstContentSource } from '../src/api/content-source';
import { FetchApiClient } from '../src/api/fetch-api-client';
import { PlayerRegistry } from '../src/api/player-registry';
import { ApiError, NetworkError, isUnreachable } from '../src/api/types';
import { Connectivity } from '../src/game/connectivity';
import {
  LocalLeaderboardStore,
  RemoteLeaderboardStore,
  ResilientLeaderboardStore,
  type FinishedRun,
} from '../src/game/leaderboard-store';
import { LocalProgressStore } from '../src/game/progress-store';
import { RemoteProgressStore, ResilientProgressStore } from '../src/game/remote-progress-store';
import { buildMiniBundle, createTestServices, memoryStorage, renderApp } from './support';

const rejectingFetch = () => Promise.reject(new TypeError('Failed to fetch'));
const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('FetchApiClient', () => {
  it('maps server error bodies to ApiError and transport failures to NetworkError', async () => {
    const rejected = new FetchApiClient('/api', rejectingFetch);
    await expect(rejected.health()).rejects.toBeInstanceOf(NetworkError);

    const notFound = new FetchApiClient('/api', () =>
      jsonResponse({ error: { code: 'RUN_NOT_FOUND', message: 'nope' } }, 404),
    );
    await expect(notFound.getRun('p', 'r')).rejects.toMatchObject({
      status: 404,
      code: 'RUN_NOT_FOUND',
      message: 'nope',
    });
  });

  it('sends the leaderboard submission without any score and encodes ids', async () => {
    const fetchSpy = vi.fn(() => jsonResponse({ entry: { id: 'e' }, rank: 1 }, 201));
    const api = new FetchApiClient('/api', fetchSpy as never);
    await api.submitScore({
      playerId: 'p',
      runId: 'r',
      seed: 5,
      world: 'moon',
      difficulty: 'cadet',
      commands: [{ kind: 'choose', side: 'left' }],
    });
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/leaderboard');
    expect(Object.keys(JSON.parse(init.body as string)).sort()).toEqual(
      ['commands', 'difficulty', 'playerId', 'runId', 'seed', 'world'].sort(),
    );
  });

  it('treats 5xx and network errors as "unreachable" but 4xx as a rejection', () => {
    expect(isUnreachable(new NetworkError('x'))).toBe(true);
    expect(isUnreachable(new ApiError(500, 'X', 'proxy'))).toBe(true);
    expect(isUnreachable(new ApiError(409, 'X', 'limit'))).toBe(false);
  });
});

describe('ApiFirstContentSource', () => {
  it('uses the server content when it answers', async () => {
    const data: ContentData = buildMiniBundle().toJSON();
    const connectivity = new Connectivity();
    connectivity.markOffline();
    const api = new FetchApiClient('/api', () => jsonResponse(data));
    const bundled = vi.fn(buildMiniBundle);
    const loaded = await new ApiFirstContentSource(api, bundled, connectivity).load();
    expect(loaded.origin).toBe('api');
    expect(bundled).not.toHaveBeenCalled();
    expect(connectivity.getSnapshot()).toBe(false);
  });

  it('falls back to the bundled content when fetch rejects and flags offline', async () => {
    const connectivity = new Connectivity();
    const api = new FetchApiClient('/api', rejectingFetch);
    const loaded = await new ApiFirstContentSource(api, buildMiniBundle, connectivity).load();
    expect(loaded.origin).toBe('bundled');
    expect(loaded.bundle.sequence('moon').length).toBeGreaterThan(0);
    expect(connectivity.getSnapshot()).toBe(true);
  });

  it('falls back when the server sends something that is not a content bundle', async () => {
    const connectivity = new Connectivity();
    const api = new FetchApiClient('/api', () => jsonResponse({ nonsense: true }));
    const loaded = await new ApiFirstContentSource(api, buildMiniBundle, connectivity).load();
    expect(loaded.origin).toBe('bundled');
    expect(connectivity.getSnapshot()).toBe(true);
  });

  it('shows the OFFLINE chip in the app and still starts a game', async () => {
    const connectivity = new Connectivity();
    const api = new FetchApiClient('/api', rejectingFetch);
    const services = createTestServices({
      connectivity,
      content: new ApiFirstContentSource(api, buildMiniBundle, connectivity),
    });
    renderApp(services);
    expect(await screen.findByText('OFFLINE')).toBeInTheDocument();
    expect(await screen.findByLabelText('Commander callsign')).toBeInTheDocument();
  });
});

describe('bundled content', () => {
  it('loads and validates the real content shipped with the build', () => {
    const bundle = loadBundledContent();
    expect(bundle.data.worlds.map((w) => w.id).sort()).toEqual(['mars', 'moon']);
    expect(bundle.sequence('moon')[0]).toBe('ch0-launch-day');
    expect(Object.keys(bundle.data.chapters).length).toBeGreaterThanOrEqual(5);
  });
});

function snapshot() {
  const session = GameSessionFactory.create({
    bundle: buildMiniBundle(),
    worldId: 'moon',
    difficultyId: 'cadet',
    seed: 1,
    callsign: 'ADA',
  });
  session.choose('left');
  return session.snapshot();
}

describe('ResilientProgressStore', () => {
  const unreachableApi = new FetchApiClient('/api', rejectingFetch);

  it('saves locally and flags offline when the server is unreachable', async () => {
    const storage = memoryStorage();
    const connectivity = new Connectivity();
    const players = new PlayerRegistry(unreachableApi, storage, 'p');
    const local = new LocalProgressStore(storage, 'runs');
    const store = new ResilientProgressStore(
      new RemoteProgressStore(unreachableApi, players),
      local,
      connectivity,
    );
    await store.save('run-1', snapshot());
    expect(connectivity.getSnapshot()).toBe(true);
    const runs = await store.list();
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ runId: 'run-1', worldId: 'moon', callsign: 'ADA' });
    expect(await store.get('run-1')).not.toBeNull();
    await store.delete('run-1');
    expect(await store.list()).toEqual([]);
  });

  it('writes to the server when it answers and keeps no local copy', async () => {
    const calls: string[] = [];
    const fetchFn = ((url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.endsWith('/players'))
        return jsonResponse({ playerId: 'player-1', callsign: 'ADA' }, 201);
      return jsonResponse({ runId: 'run-1', updatedAt: 'now' });
    }) as typeof fetch;
    const api = new FetchApiClient('/api', fetchFn);
    const storage = memoryStorage();
    const local = new LocalProgressStore(storage, 'runs');
    const connectivity = new Connectivity();
    connectivity.markOffline();
    const store = new ResilientProgressStore(
      new RemoteProgressStore(api, new PlayerRegistry(api, storage, 'p')),
      local,
      connectivity,
    );
    await store.save('run-1', snapshot());
    expect(calls).toEqual(['POST /api/players', 'PUT /api/progress/player-1/run-1']);
    expect(connectivity.getSnapshot()).toBe(false);
    expect(await local.list()).toEqual([]);
  });
});

describe('ResilientLeaderboardStore', () => {
  const run = (score: number, runId: string): FinishedRun => ({
    runId,
    seed: 1,
    worldId: 'moon',
    difficultyId: 'cadet',
    callsign: 'ADA',
    commands: [],
    report: { score, day: 12 } as FinishedRun['report'],
  });

  it('keeps a local top-5 when the server is unreachable', async () => {
    const storage = memoryStorage();
    const api = new FetchApiClient('/api', rejectingFetch);
    const store = new ResilientLeaderboardStore(
      new RemoteLeaderboardStore(api, new PlayerRegistry(api, storage, 'p')),
      new LocalLeaderboardStore(storage, 'lb'),
      new Connectivity(),
    );
    for (let i = 1; i <= 7; i += 1) await store.submit(run(i * 100, `run-${i}`));
    const result = await store.submit(run(450, 'run-mine'));
    expect(result.source).toBe('local');
    expect(result.rows).toHaveLength(5);
    expect(result.rows.map((r) => r.score)).toEqual([700, 600, 500, 450, 400]);
    expect(result.rows.find((r) => r.id === result.highlightId)?.score).toBe(450);
  });
});
