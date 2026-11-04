import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildDependencies } from '../src/composition-root.js';
import { ConfigError, loadConfig } from '../src/config/env.js';
import { FileSystemContentSource, InMemoryContentSource } from '../src/content/content-sources.js';
import {
  InMemoryLeaderboardRepository,
  InMemoryPlayerRepository,
  InMemoryProgressRepository,
} from '../src/repositories/in-memory/in-memory-repositories.js';
import {
  JsonFileLeaderboardRepository,
  JsonFilePlayerRepository,
  JsonFileProgressRepository,
} from '../src/repositories/json-file/json-file-repositories.js';
import { RepositoryFactory } from '../src/repositories/repository-factory.js';
import { SilentLogger } from '../src/logging/logger.js';
import { testConfig } from './helpers/test-app.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'commander-cfg-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('composition root', () => {
  it('wires in-memory repositories for STORAGE_DRIVER=memory', () => {
    const deps = buildDependencies(testConfig({ storageDriver: 'memory' }), {
      logger: new SilentLogger(),
    });
    expect(deps.storage).toBe('memory');
    expect(deps.repositories.players).toBeInstanceOf(InMemoryPlayerRepository);
    expect(deps.repositories.progress).toBeInstanceOf(InMemoryProgressRepository);
    expect(deps.repositories.leaderboard).toBeInstanceOf(InMemoryLeaderboardRepository);
  });

  it('wires JSON-file repositories for STORAGE_DRIVER=json', () => {
    const deps = buildDependencies(testConfig({ storageDriver: 'json', dataDir: dir }), {
      logger: new SilentLogger(),
    });
    expect(deps.storage).toBe('json');
    expect(deps.repositories.players).toBeInstanceOf(JsonFilePlayerRepository);
    expect(deps.repositories.progress).toBeInstanceOf(JsonFileProgressRepository);
    expect(deps.repositories.leaderboard).toBeInstanceOf(JsonFileLeaderboardRepository);
  });

  it('RepositoryFactory rejects an unknown driver', () => {
    expect(() => RepositoryFactory.create('cosmos' as never, { dataDir: dir })).toThrow(
      /Unsupported storage driver/,
    );
  });

  it('uses the content source override when given', async () => {
    const source = new InMemoryContentSource({});
    const deps = buildDependencies(testConfig(), {
      contentSource: source,
      logger: new SilentLogger(),
    });
    await expect(deps.services.content.get()).rejects.toMatchObject({ code: 'CONTENT_INVALID' });
  });
});

describe('loadConfig', () => {
  it('applies defaults', () => {
    const config = loadConfig({});
    expect(config).toMatchObject({
      port: 3001,
      corsOrigins: ['http://localhost:5173'],
      storageDriver: 'json',
      nodeEnv: 'development',
    });
    expect(config.dataDir.endsWith(path.join('server', 'data'))).toBe(true);
    expect(config.contentDir.endsWith('content')).toBe(true);
  });

  it('reads and normalises values', () => {
    const config = loadConfig({
      PORT: '4000',
      CORS_ORIGIN: ' http://a.test , http://b.test ,',
      STORAGE_DRIVER: 'memory',
      DATA_DIR: dir,
      NODE_ENV: 'production',
    });
    expect(config.port).toBe(4000);
    expect(config.corsOrigins).toEqual(['http://a.test', 'http://b.test']);
    expect(config.storageDriver).toBe('memory');
    expect(config.dataDir).toBe(path.resolve(dir));
    expect(config.nodeEnv).toBe('production');
  });

  it.each([
    { PORT: 'abc' },
    { PORT: '0' },
    { PORT: '70000' },
    { STORAGE_DRIVER: 'mongo' },
    { NODE_ENV: 'staging' },
    { CORS_ORIGIN: ' , ' },
  ])('rejects invalid environment %j', (env) => {
    expect(() => loadConfig(env)).toThrow(ConfigError);
  });
});

describe('content sources', () => {
  it('FileSystemContentSource reads JSON recursively, skips schema/ and normalises keys', async () => {
    await mkdir(path.join(dir, 'a', 'b'), { recursive: true });
    await mkdir(path.join(dir, 'schema'));
    await writeFile(path.join(dir, 'root.json'), '\uFEFF{"x":1}', 'utf8');
    await writeFile(path.join(dir, 'a', 'b', 'deep.json'), '{"y":2}', 'utf8');
    await writeFile(path.join(dir, 'a', 'notes.txt'), 'ignored', 'utf8');
    await writeFile(path.join(dir, 'schema', 'x.schema.json'), '{}', 'utf8');
    expect(await new FileSystemContentSource(dir).readFiles()).toEqual({
      'a/b/deep.json': { y: 2 },
      'root.json': { x: 1 },
    });
  });

  it('FileSystemContentSource names the file with malformed JSON', async () => {
    await writeFile(path.join(dir, 'bad.json'), '{oops', 'utf8');
    await expect(new FileSystemContentSource(dir).readFiles()).rejects.toThrow(/bad\.json/);
  });

  it('FileSystemContentSource fails for a missing folder', async () => {
    await expect(new FileSystemContentSource(path.join(dir, 'nope')).readFiles()).rejects.toThrow();
  });

  it('InMemoryContentSource returns copies', async () => {
    const source = new InMemoryContentSource({ 'a.json': { n: 1 } });
    const files = await source.readFiles();
    (files['a.json'] as { n: number }).n = 2;
    expect(await source.readFiles()).toEqual({ 'a.json': { n: 1 } });
  });
});
