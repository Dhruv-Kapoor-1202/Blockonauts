import { randomUUID } from 'node:crypto';
import { GameSessionFactory } from '@commander/engine';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { registerPlayer } from './helpers/api.js';
import { playRun } from './helpers/bot.js';
import { createTestApp, loadMiniBundle } from './helpers/test-app.js';

const bundle = loadMiniBundle();

type Run = ReturnType<typeof playRun>;

function payload(playerId: string, run: Run, runId = randomUUID()) {
  return {
    playerId,
    runId,
    seed: run.seed,
    world: run.worldId,
    difficulty: run.difficultyId,
    commands: run.commands,
  };
}

describe('POST /api/leaderboard', () => {
  it('replays the run and stores the server-computed score', async () => {
    const { app } = createTestApp();
    const playerId = await registerPlayer(app, 'ace');
    const run = playRun(bundle, { seed: 11, botSeed: 3 });

    const res = await request(app)
      .post('/api/leaderboard')
      .send(payload(playerId, run))
      .expect(201);
    expect(res.body.rank).toBe(1);
    expect(res.body.entry).toEqual({
      id: expect.any(String),
      playerId,
      callsign: 'ACE',
      runId: expect.any(String),
      worldId: 'moon',
      difficultyId: 'commander',
      score: run.report.score,
      day: run.report.day,
      chaptersCleared: run.report.chaptersCleared,
      result: run.report.result,
      createdAt: expect.any(String),
    });
  });

  it('is deterministic: the same inputs always score the same', async () => {
    const { app } = createTestApp();
    const a = await registerPlayer(app, 'A');
    const b = await registerPlayer(app, 'B');
    const run = playRun(bundle, { seed: 5, botSeed: 9 });
    const first = await request(app).post('/api/leaderboard').send(payload(a, run)).expect(201);
    const second = await request(app).post('/api/leaderboard').send(payload(b, run)).expect(201);
    expect(second.body.entry.score).toBe(first.body.entry.score);
    expect(first.body.rank).toBe(1);
    expect(second.body.rank).toBe(2);
  });

  describe('tampering', () => {
    it('rejects a client supplied score (unknown key) with 400', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const run = playRun(bundle);
      const res = await request(app)
        .post('/api/leaderboard')
        .send({ ...payload(playerId, run), score: 999999 })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect((await request(app).get('/api/leaderboard')).body.entries).toEqual([]);
    });

    it('rejects commands appended after the mission ended with 422 INVALID_REPLAY', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const run = playRun(bundle);
      const body = {
        ...payload(playerId, run),
        commands: [...run.commands, { kind: 'choose', side: 'left' }],
      };
      const res = await request(app).post('/api/leaderboard').send(body).expect(422);
      expect(res.body.error.code).toBe('INVALID_REPLAY');
    });

    it('rejects a command that is illegal in the current state with 422', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const run = playRun(bundle);
      const body = { ...payload(playerId, run), commands: [{ kind: 'proceed' }, ...run.commands] };
      const res = await request(app).post('/api/leaderboard').send(body).expect(422);
      expect(res.body.error.code).toBe('INVALID_REPLAY');
    });

    it('rejects an unfinished run with 422 RUN_NOT_FINISHED', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const run = playRun(bundle);
      const body = { ...payload(playerId, run), commands: run.commands.slice(0, -1) };
      const res = await request(app).post('/api/leaderboard').send(body).expect(422);
      expect(res.body.error.code).toBe('RUN_NOT_FINISHED');
      await request(app)
        .post('/api/leaderboard')
        .send({ ...payload(playerId, run), commands: [] })
        .expect(422);
    });

    it('scores what the replay produces for the submitted seed, never the original score', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const run = playRun(bundle, { seed: 1, botSeed: 4 });
      const res = await request(app)
        .post('/api/leaderboard')
        .send({ ...payload(playerId, run), seed: 2 });
      let expected: number | undefined;
      try {
        const session = GameSessionFactory.replay({ ...run, seed: 2 }, run.commands);
        expected = session.status === 'missionOver' ? session.view().report?.score : undefined;
      } catch {
        expected = undefined;
      }
      if (expected === undefined) expect(res.status).toBe(422);
      else expect(res.body.entry.score).toBe(expected);
    });
    it('rejects a second submission of the same run with 409 ALREADY_SUBMITTED', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const run = playRun(bundle);
      const body = payload(playerId, run);
      await request(app).post('/api/leaderboard').send(body).expect(201);
      const again = await request(app).post('/api/leaderboard').send(body).expect(409);
      expect(again.body.error.code).toBe('ALREADY_SUBMITTED');
      expect((await request(app).get('/api/leaderboard')).body.entries).toHaveLength(1);
    });

    it('rejects concurrent duplicate submissions so only one is stored', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const body = payload(playerId, playRun(bundle));
      const results = await Promise.all([
        request(app).post('/api/leaderboard').send(body),
        request(app).post('/api/leaderboard').send(body),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    });
  });

  describe('validation and lookups', () => {
    it.each([
      ['bad playerId', (b: Record<string, unknown>) => (b.playerId = 'x')],
      ['bad runId', (b: Record<string, unknown>) => (b.runId = 'x')],
      ['fractional seed', (b: Record<string, unknown>) => (b.seed = 1.5)],
      ['missing world', (b: Record<string, unknown>) => delete b.world],
      ['commands not an array', (b: Record<string, unknown>) => (b.commands = 'left')],
      ['bad command', (b: Record<string, unknown>) => (b.commands = [{ kind: 'nuke' }])],
    ])('rejects %s with 400', async (_name, mutate) => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const body = payload(playerId, playRun(bundle)) as Record<string, unknown>;
      mutate(body);
      await request(app).post('/api/leaderboard').send(body).expect(400);
    });

    it('answers 404 for an unknown player', async () => {
      const { app } = createTestApp();
      const res = await request(app)
        .post('/api/leaderboard')
        .send(payload(randomUUID(), playRun(bundle)))
        .expect(404);
      expect(res.body.error.code).toBe('PLAYER_NOT_FOUND');
    });

    it('answers 400 for an unknown world or difficulty', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const body = payload(playerId, playRun(bundle));
      const world = await request(app)
        .post('/api/leaderboard')
        .send({ ...body, world: 'venus' })
        .expect(400);
      expect(world.body.error.code).toBe('UNKNOWN_WORLD');
      const difficulty = await request(app)
        .post('/api/leaderboard')
        .send({ ...body, difficulty: 'godmode' })
        .expect(400);
      expect(difficulty.body.error.code).toBe('UNKNOWN_DIFFICULTY');
    });

    it('answers 500 CONTENT_INVALID when content is broken', async () => {
      const { app } = createTestApp({ files: {} });
      const playerId = await registerPlayer(app);
      const res = await request(app)
        .post('/api/leaderboard')
        .send(payload(playerId, playRun(bundle)));
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('CONTENT_INVALID');
    });
  });
});

describe('GET /api/leaderboard', () => {
  async function seededBoard() {
    const ctx = createTestApp();
    const players = [
      await registerPlayer(ctx.app, 'ONE'),
      await registerPlayer(ctx.app, 'TWO'),
      await registerPlayer(ctx.app, 'THREE'),
    ];
    const runs: Run[] = [
      playRun(bundle, { worldId: 'moon', seed: 1, botSeed: 1 }),
      playRun(bundle, { worldId: 'moon', seed: 2, botSeed: 2 }),
      playRun(bundle, { worldId: 'mars', seed: 3, botSeed: 3 }),
      playRun(bundle, { worldId: 'moon', seed: 4, botSeed: 4 }),
    ];
    for (const [index, run] of runs.entries()) {
      const playerId = players[index % players.length]!;
      await request(ctx.app).post('/api/leaderboard').send(payload(playerId, run)).expect(201);
    }
    return { ...ctx, runs };
  }

  it('sorts by score descending and filters by world', async () => {
    const { app, runs } = await seededBoard();
    const all = (await request(app).get('/api/leaderboard').expect(200)).body.entries;
    expect(all).toHaveLength(runs.length);
    const scores = all.map((e: { score: number }) => e.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));

    const moon = (await request(app).get('/api/leaderboard?world=moon').expect(200)).body.entries;
    expect(moon).toHaveLength(3);
    expect(moon.every((e: { worldId: string }) => e.worldId === 'moon')).toBe(true);
    const mars = (await request(app).get('/api/leaderboard?world=mars')).body.entries;
    expect(mars).toHaveLength(1);
    expect((await request(app).get('/api/leaderboard?world=venus')).body.entries).toEqual([]);
  });

  it('honours the limit', async () => {
    const { app } = await seededBoard();
    expect((await request(app).get('/api/leaderboard?limit=2')).body.entries).toHaveLength(2);
    expect((await request(app).get('/api/leaderboard?limit=1')).body.entries).toHaveLength(1);
  });

  it('breaks score ties by earlier submission', async () => {
    const { app } = createTestApp();
    const players = [await registerPlayer(app, 'FIRST'), await registerPlayer(app, 'SECOND')];
    const run = playRun(bundle, { seed: 8, botSeed: 8 });
    for (const playerId of players) {
      await request(app).post('/api/leaderboard').send(payload(playerId, run)).expect(201);
    }
    const entries = (await request(app).get('/api/leaderboard')).body.entries;
    expect(entries.map((e: { callsign: string }) => e.callsign)).toEqual(['FIRST', 'SECOND']);
  });

  it('computes the rank within the entry world', async () => {
    const { app } = createTestApp();
    const playerId = await registerPlayer(app);
    const moon = await request(app)
      .post('/api/leaderboard')
      .send(payload(playerId, playRun(bundle, { worldId: 'moon' })));
    const mars = await request(app)
      .post('/api/leaderboard')
      .send(payload(playerId, playRun(bundle, { worldId: 'mars' })));
    expect([moon.body.rank, mars.body.rank]).toEqual([1, 1]);
  });

  it.each(['0', '51', '-1', 'abc', '2.5'])('rejects limit=%s with 400', async (limit) => {
    const { app } = createTestApp();
    const res = await request(app).get(`/api/leaderboard?limit=${limit}`).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a malformed world filter with 400', async () => {
    const { app } = createTestApp();
    await request(app).get('/api/leaderboard?world=a%20b').expect(400);
  });
});
