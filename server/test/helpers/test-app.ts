/**
 * Builds an in-process app over in-memory storage and the shared mini-campaign fixture, with a
 * deterministic clock (one second per call) so ordering and timestamps are reproducible.
 */
import { ContentBundle, ContentLoader } from '@commander/engine';
import type { Express } from 'express';
import { buildDependencies, type BuiltDependencies } from '../../src/composition-root.js';
import type { AppConfig } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { InMemoryContentSource } from '../../src/content/content-sources.js';
import { RecordingLogger } from '../../src/logging/logger.js';
import { buildMiniContentFiles } from '../../../packages/engine/test/fixtures/mini-content.js';

/** Origin allowed by the default test config. */
export const TEST_ORIGIN = 'http://localhost:5173';

/** Config for tests (memory storage). */
export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: 0,
    corsOrigins: [TEST_ORIGIN],
    storageDriver: 'memory',
    dataDir: 'unused',
    contentDir: 'unused',
    nodeEnv: 'test',
    ...overrides,
  };
}

/** The validated mini bundle (same content the server loads in tests). */
export function loadMiniBundle(): ContentBundle {
  return new ContentBundle(ContentLoader.load(buildMiniContentFiles()).data);
}

/** Everything a route test needs. */
export interface TestApp {
  app: Express;
  deps: BuiltDependencies;
  source: InMemoryContentSource;
  logger: RecordingLogger;
}

/** Creates the app. Pass `files` to override the content (e.g. broken content). */
export function createTestApp(
  options: { files?: Record<string, unknown>; config?: Partial<AppConfig> } = {},
): TestApp {
  const source = new InMemoryContentSource(options.files ?? buildMiniContentFiles());
  const logger = new RecordingLogger();
  let tick = Date.UTC(2030, 0, 1);
  const clock = () => new Date((tick += 1000));
  const deps = buildDependencies(testConfig(options.config), {
    contentSource: source,
    logger,
    clock,
  });
  return { app: createApp(deps), deps, source, logger };
}
