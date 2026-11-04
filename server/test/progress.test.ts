import { randomUUID } from 'node:crypto';
import { GameSessionFactory, type SessionSnapshot } from '@commander/engine';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { MAX_RUNS_PER_PLAYER } from '../src/config/constants.js';
import { registerPlayer } from './helpers/api.js';
import { createTestApp, loadMiniBundle } from './helpers/test-app.js';

/** A real mid-run snapshot, JSON round-tripped exactly as the client would send it. */
function midRunSnapshot(steps = 1): SessionSnapshot {
  const session = GameSessionFactory.create({
    bundle: loadMiniBundle(),
    worldId: 'moon',
    difficultyId: 'commander',
    seed: 7,
    callsign: 'NOVA',
  });
  for (let i = 0; i < steps; i += 1) {
    if (session.status === 'chapterResult') session.proceed();
    else session.choose(i % 2 === 0 ? 'left' : 'right');
  }
  return JSON.parse(JSON.stringify(session.snapshot())) as SessionSnapshot;
}

describe('progress routes', () => {
  it('saves, lists, loads and deletes a run (round trip)', async () => {
    const { app } = createTestApp();
    const playerId = await registerPlayer(app);
    const runId = randomUUID();
    const snapshot = midRunSnapshot();

    const saved = await request(app)
      .put(`/api/progress/${playerId}/${runId}`)
      .send(snapshot)
      .expect(200);
    expect(saved.body).toEqual({ runId, updatedAt: expect.any(String) });

    const list = await request(app).get(`/api/progress/${playerId}`).expect(200);
    expect(list.body.runs).toEqual([
      {
        runId,
        worldId: 'moon',
        difficultyId: 'commander',
        chapterIndex: snapshot.state.chapterIndex,
        chapterTitle: 'Mini Launch',
        day: snapshot.state.day,
        status: snapshot.state.status,
        updatedAt: saved.body.updatedAt,
        callsign: 'NOVA',
      },
    ]);

    const loaded = await request(app).get(`/api/progress/${playerId}/${runId}`).expect(200);
    expect(loaded.body).toEqual(snapshot);

    await request(app).delete(`/api/progress/${playerId}/${runId}`).expect(204);
    await request(app).get(`/api/progress/${playerId}/${runId}`).expect(404);
    expect((await request(app).get(`/api/progress/${playerId}`)).body).toEqual({ runs: [] });
  });

  it('overwrites a run on repeated autosave and lists newest first', async () => {
    const { app } = createTestApp();
    const playerId = await registerPlayer(app);
    const [a, b] = [randomUUID(), randomUUID()];
    await request(app).put(`/api/progress/${playerId}/${a}`).send(midRunSnapshot(1)).expect(200);
    await request(app).put(`/api/progress/${playerId}/${b}`).send(midRunSnapshot(2)).expect(200);
    const later = midRunSnapshot(4);
    await request(app).put(`/api/progress/${playerId}/${a}`).send(later).expect(200);

    const list = (await request(app).get(`/api/progress/${playerId}`)).body.runs;
    expect(list.map((r: { runId: string }) => r.runId)).toEqual([a, b]);
    const loaded = await request(app).get(`/api/progress/${playerId}/${a}`);
    expect(loaded.body.commands).toHaveLength(4);
  });

  it('keeps players isolated from each other', async () => {
    const { app } = createTestApp();
    const one = await registerPlayer(app, 'ONE');
    const two = await registerPlayer(app, 'TWO');
    const runId = randomUUID();
    await request(app).put(`/api/progress/${one}/${runId}`).send(midRunSnapshot()).expect(200);
    await request(app).get(`/api/progress/${two}/${runId}`).expect(404);
    expect((await request(app).get(`/api/progress/${two}`)).body).toEqual({ runs: [] });
  });

  it('returns 404 for unknown players and runs', async () => {
    const { app } = createTestApp();
    const ghost = randomUUID();
    const unknownPlayer = await request(app).get(`/api/progress/${ghost}`).expect(404);
    expect(unknownPlayer.body.error.code).toBe('PLAYER_NOT_FOUND');
    await request(app)
      .put(`/api/progress/${ghost}/${randomUUID()}`)
      .send(midRunSnapshot())
      .expect(404);
    const playerId = await registerPlayer(app);
    const missing = await request(app)
      .delete(`/api/progress/${playerId}/${randomUUID()}`)
      .expect(404);
    expect(missing.body.error.code).toBe('RUN_NOT_FOUND');
    await request(app).get(`/api/progress/${playerId}/${randomUUID()}`).expect(404);
  });

  it('rejects malformed ids with 400', async () => {
    const { app } = createTestApp();
    const res = await request(app).get('/api/progress/not-a-uuid').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const playerId = await registerPlayer(app);
    await request(app).get(`/api/progress/${playerId}/nope`).expect(400);
    await request(app).delete(`/api/progress/${playerId}/nope`).expect(400);
    await request(app).put(`/api/progress/${playerId}/nope`).send(midRunSnapshot()).expect(400);
  });

  describe('snapshot validation', () => {
    const mutations: [string, (s: Record<string, unknown>) => void][] = [
      ['wrong version', (s) => (s.version = 2)],
      ['fractional seed', (s) => (s.seed = 1.5)],
      ['missing world', (s) => delete s.worldId],
      ['bad command', (s) => (s.commands = [{ kind: 'choose', side: 'up' }])],
      ['extra command key', (s) => (s.commands = [{ kind: 'proceed', x: 1 }])],
      ['missing state', (s) => delete s.state],
      ['state is not an object', (s) => (s.state = 'oops')],
      ['unknown status', (s) => ((s.state as Record<string, unknown>).status = 'dancing')],
      ['negative chapter index', (s) => ((s.state as Record<string, unknown>).chapterIndex = -1)],
      [
        'resource out of range',
        (s) => ((s.state as { resources: Record<string, number> }).resources.P = 101),
      ],
      [
        'missing resource key',
        (s) => delete (s.state as { resources: Record<string, number> }).resources.H,
      ],
      ['flags not strings', (s) => ((s.state as Record<string, unknown>).flags = [1, 2])],
      ['checkpoint wrong type', (s) => (s.checkpoint = 'x')],
    ];

    it.each(mutations)('rejects %s with 400', async (_name, mutate) => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      const bad = midRunSnapshot() as unknown as Record<string, unknown>;
      mutate(bad);
      const res = await request(app).put(`/api/progress/${playerId}/${randomUUID()}`).send(bad);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects an empty body', async () => {
      const { app } = createTestApp();
      const playerId = await registerPlayer(app);
      await request(app).put(`/api/progress/${playerId}/${randomUUID()}`).send({}).expect(400);
    });
  });

  it('limits the number of runs per player but still allows updates', async () => {
    const { app } = createTestApp();
    const playerId = await registerPlayer(app);
    const snapshot = midRunSnapshot(1);
    const ids = Array.from({ length: MAX_RUNS_PER_PLAYER }, () => randomUUID());
    for (const id of ids)
      await request(app).put(`/api/progress/${playerId}/${id}`).send(snapshot).expect(200);

    const over = await request(app).put(`/api/progress/${playerId}/${randomUUID()}`).send(snapshot);
    expect(over.status).toBe(409);
    expect(over.body.error.code).toBe('RUN_LIMIT_REACHED');
    await request(app).put(`/api/progress/${playerId}/${ids[0]}`).send(snapshot).expect(200);

    await request(app).delete(`/api/progress/${playerId}/${ids[1]}`).expect(204);
    await request(app).put(`/api/progress/${playerId}/${randomUUID()}`).send(snapshot).expect(200);
  });

  it('omits chapterTitle when content cannot be loaded', async () => {
    const { app, source } = createTestApp();
    const playerId = await registerPlayer(app);
    const runId = randomUUID();
    await request(app).put(`/api/progress/${playerId}/${runId}`).send(midRunSnapshot()).expect(200);
    source.setFiles({});
    const list = await request(app).get(`/api/progress/${playerId}`).expect(200);
    expect(list.body.runs[0]).not.toHaveProperty('chapterTitle');
  });
});
