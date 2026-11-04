/**
 * Process entry point: reads configuration, builds dependencies through the composition root,
 * warms the content cache, starts listening and shuts down gracefully on SIGINT/SIGTERM.
 */
import { createApp } from './app.js';
import { buildDependencies } from './composition-root.js';
import { SHUTDOWN_TIMEOUT_MS } from './config/constants.js';
import { ConfigError, loadConfig } from './config/env.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const deps = buildDependencies(config);
  await deps.services.content.warmUp();

  const app = createApp(deps);
  const server = app.listen(config.port, () => {
    deps.logger.info(
      `COMMANDER server listening on http://localhost:${config.port} (storage: ${config.storageDriver})`,
    );
  });

  let closing = false;
  const shutdown = (signal: string): void => {
    if (closing) return;
    closing = true;
    deps.logger.info(`${signal} received, shutting down`);
    const timer = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
    timer.unref();
    server.close(() => process.exit(0));
    server.closeIdleConnections();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  const message = error instanceof ConfigError ? error.message : String(error);
  console.error(`[error] ${message}`);
  process.exit(1);
});
