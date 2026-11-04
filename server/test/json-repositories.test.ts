import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LeaderboardEntry, Player, SavedRun } from '../src/domain/models.js';
import { RecordingLogger } from '../src/logging/logger.js';
import {
  JsonFileLeaderboardRepository,
  JsonFilePlayerRepository,
  JsonFileProgressRepository,
} from '../src/repositories/json-file/json-file-repositories.js';
import { JsonFileStore } from '../src/repositories/json-file/json-file-store.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'commander-json-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const player = (callsign = 'NOVA'): Player => ({
  id: randomUUID(),
  callsign,
  createdAt: '2030-01-01T00:00:00.000Z',
});

const run = (
  playerId: string,
  runId = randomUUID(),
  updatedAt = '2030-01-01T00:00:00.000Z',
): SavedRun =>
  ({
    runId,
    playerId,
    snapshot: { version: 1, callsign: 'NOVA' },
    summary: {
      worldId: 'moon',
      difficultyId: 'cadet',
      chapterIndex: 0,
      day: 1,
      status: 'playing',
      updatedAt,
    },
  }) as unknown as SavedRun;

const entry = (playerId: string, score: number, createdAt: string): LeaderboardEntry => ({
  id: randomUUID(),
  playerId,
  callsign: 'NOVA',
  runId: randomUUID(),
  worldId: 'moon',
  difficultyId: 'cadet',
  score,
  day: 10,
  chaptersCleared: 1,
  result: 'win',
  createdAt,
});

describe('JsonFileStore', () => {
  const makeStore = (file: string, logger?: RecordingLogger) =>
    new JsonFileStore<number[]>(
      file,
      () => [],
      (raw): raw is number[] => Array.isArray(raw),
      logger,
    );

  it('treats a missing file (and missing folder) as empty and creates it on first write', async () => {
    const file = path.join(dir, 'nested', 'numbers.json');
    const store = makeStore(file);
    expect(await store.read()).toEqual([]);
    await store.update((current) => ({ next: [...current, 1], result: undefined }));
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([1]);
  });

  it('leaves no temp files behind and replaces the file atomically', async () => {
    const file = path.join(dir, 'numbers.json');
    const store = makeStore(file);
    for (let i = 0; i < 5; i += 1) {
      await store.update((current) => ({ next: [...current, i], result: undefined }));
    }
    expect(await readdir(dir)).toEqual(['numbers.json']);
  });

  it('keeps the previous file intact when a write fails', async () => {
    const file = path.join(dir, 'numbers.json');
    const store = makeStore(file);
    await store.update(() => ({ next: [1, 2, 3], result: undefined }));
    const circular: unknown[] = [];
    circular.push(circular);
    await expect(
      store.update(() => ({ next: circular as unknown as number[], result: undefined })),
    ).rejects.toThrow();
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([1, 2, 3]);
    expect((await readdir(dir)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    // the queue survives a failed task
    await store.update((current) => ({ next: [...current, 4], result: undefined }));
    expect(await store.read()).toEqual([1, 2, 3, 4]);
  });

  it('does not write when the step returns the same object', async () => {
    const file = path.join(dir, 'numbers.json');
    const store = makeStore(file);
    await store.update((current) => ({ next: current, result: undefined }));
    expect(await readdir(dir)).toEqual([]);
  });

  it('serialises concurrent read-modify-write cycles without losing updates', async () => {
    const file = path.join(dir, 'numbers.json');
    const store = makeStore(file);
    const other = makeStore(file); // a second instance shares the same per-file queue
    const total = 40;
    await Promise.all(
      Array.from({ length: total }, (_, i) =>
        (i % 2 === 0 ? store : other).update((current) => ({
          next: [...current, i],
          result: undefined,
        })),
      ),
    );
    const stored = await store.read();
    expect(stored).toHaveLength(total);
    expect([...stored].sort((a, b) => a - b)).toEqual(Array.from({ length: total }, (_, i) => i));
  });

  it('quarantines a corrupt file, logs a warning and starts empty', async () => {
    const file = path.join(dir, 'numbers.json');
    await writeFile(file, '{ not json', 'utf8');
    const logger = new RecordingLogger();
    const store = makeStore(file, logger);
    expect(await store.read()).toEqual([]);
    const files = await readdir(dir);
    expect(files.some((name) => name.startsWith('numbers.json.corrupt-'))).toBe(true);
    expect(logger.messages.some((m) => m.level === 'warn')).toBe(true);
    await store.update(() => ({ next: [9], result: undefined }));
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([9]);
  });

  it('quarantines a file with the wrong shape', async () => {
    const file = path.join(dir, 'numbers.json');
    await writeFile(file, '{"not":"an array"}', 'utf8');
    expect(await makeStore(file).read()).toEqual([]);
    expect((await readdir(dir)).some((name) => name.includes('.corrupt-'))).toBe(true);
  });
});

describe('JSON repositories', () => {
  it('persist players across repository instances', async () => {
    const p = player();
    await new JsonFilePlayerRepository(dir).create(p);
    const reopened = new JsonFilePlayerRepository(dir);
    expect(await reopened.findById(p.id)).toEqual(p);
    expect(await reopened.findById(randomUUID())).toBeUndefined();
  });

  it('persist, replace, list and delete runs across instances', async () => {
    const owner = randomUUID();
    const first = run(owner, randomUUID(), '2030-01-01T00:00:00.000Z');
    const second = run(owner, randomUUID(), '2030-01-02T00:00:00.000Z');
    const repo = new JsonFileProgressRepository(dir);
    await repo.save(first);
    await repo.save(second);
    await repo.save({ ...first, summary: { ...first.summary, day: 9 } });

    const reopened = new JsonFileProgressRepository(dir);
    const listed = await reopened.listByPlayer(owner);
    expect(listed).toHaveLength(2);
    expect((await reopened.find(owner, first.runId))?.summary.day).toBe(9);
    expect(await reopened.listByPlayer(randomUUID())).toEqual([]);
    expect(await reopened.delete(owner, second.runId)).toBe(true);
    expect(await reopened.delete(owner, second.runId)).toBe(false);
    expect(await new JsonFileProgressRepository(dir).find(owner, second.runId)).toBeUndefined();
  });

  it('handle many concurrent saves without corrupting the file', async () => {
    const owner = randomUUID();
    const repo = new JsonFileProgressRepository(dir);
    const runs = Array.from({ length: 25 }, () => run(owner));
    await Promise.all(runs.map((r) => repo.save(r)));
    expect(await repo.listByPlayer(owner)).toHaveLength(runs.length);
    expect(JSON.parse(await readFile(path.join(dir, 'progress.json'), 'utf8'))).toHaveLength(
      runs.length,
    );
  });

  it('persist the leaderboard, order it and enforce one entry per run', async () => {
    const owner = randomUUID();
    const low = entry(owner, 100, '2030-01-01T00:00:00.000Z');
    const tieEarly = entry(owner, 500, '2030-01-01T00:00:00.000Z');
    const tieLate = entry(owner, 500, '2030-01-02T00:00:00.000Z');
    const repo = new JsonFileLeaderboardRepository(dir);
    expect(await repo.add(low)).toBe(true);
    expect(await repo.add(tieLate)).toBe(true);
    expect(await repo.add(tieEarly)).toBe(true);
    expect(await repo.add({ ...low, id: randomUUID() })).toBe(false);

    const reopened = new JsonFileLeaderboardRepository(dir);
    const top = await reopened.top({ limit: 10 });
    expect(top.map((e) => e.id)).toEqual([tieEarly.id, tieLate.id, low.id]);
    expect(await reopened.rankOf(low)).toBe(3);
    expect(await reopened.top({ limit: 1 })).toHaveLength(1);
    expect(await reopened.top({ limit: 10, worldId: 'mars' })).toEqual([]);
    expect((await reopened.findByRun(owner, low.runId))?.id).toBe(low.id);
  });

  it('recover from a corrupt data file', async () => {
    await writeFile(path.join(dir, 'players.json'), 'garbage', 'utf8');
    const logger = new RecordingLogger();
    const repo = new JsonFilePlayerRepository(dir, logger);
    const p = player();
    await repo.create(p);
    expect(await repo.findById(p.id)).toEqual(p);
    expect(logger.messages).toHaveLength(1);
  });
});
