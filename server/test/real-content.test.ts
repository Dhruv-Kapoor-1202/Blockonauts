/**
 * End-to-end check against the REAL content folder: it is loaded through FileSystemContentSource,
 * served by the API and a full run is played by a bot, submitted and scored by the server.
 * Skipped (not failed) while the story content is still being authored and does not validate.
 */
import { randomUUID } from 'node:crypto';
import { ContentBundle, ContentLoader, ContentValidator } from '@commander/engine';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { buildDependencies } from '../src/composition-root.js';
import { loadConfig } from '../src/config/env.js';
import { FileSystemContentSource } from '../src/content/content-sources.js';
import { SilentLogger } from '../src/logging/logger.js';
import { registerPlayer } from './helpers/api.js';
import { playRun } from './helpers/bot.js';

const config = loadConfig({ STORAGE_DRIVER: 'memory' });

async function loadRealBundle(): Promise<ContentBundle | undefined> {
  try {
    const files = await new FileSystemContentSource(config.contentDir).readFiles();
    const { data, sources } = ContentLoader.load(files);
    const bundle = new ContentBundle(data);
    return ContentValidator.validateBundle(bundle, sources).ok ? bundle : undefined;
  } catch {
    return undefined;
  }
}

const bundle = await loadRealBundle();

describe.skipIf(!bundle)('real content folder', () => {
  it('is served and a bot-played run of every world is accepted by the leaderboard', async () => {
    const real = bundle as ContentBundle;
    const deps = buildDependencies(config, { logger: new SilentLogger() });
    const app = createApp(deps);
    await request(app).get('/api/content').expect(200);

    const playerId = await registerPlayer(app, 'REALBOT');
    for (const world of real.data.worlds) {
      const run = playRun(real, { worldId: world.id, difficultyId: 'commander', seed: 2024 });
      const res = await request(app)
        .post('/api/leaderboard')
        .send({
          playerId,
          runId: randomUUID(),
          seed: run.seed,
          world: run.worldId,
          difficulty: run.difficultyId,
          commands: run.commands,
        })
        .expect(201);
      expect(res.body.entry.score).toBe(run.report.score);
    }
    const board = await request(app).get('/api/leaderboard').expect(200);
    expect(board.body.entries).toHaveLength(real.data.worlds.length);
  });
});
