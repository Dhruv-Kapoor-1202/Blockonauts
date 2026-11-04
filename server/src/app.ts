/**
 * Express application factory. It assembles middleware and routes from injected dependencies and
 * never listens, so Supertest can drive it in-process and `server.ts` owns the network socket.
 */
import express, { type Express } from 'express';
import type { AppDependencies } from './app-dependencies.js';
import { JSON_BODY_LIMIT } from './config/constants.js';
import { corsMiddleware } from './middleware/cors.js';
import { createErrorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createApiRouter } from './routes/api-router.js';

/** Creates the configured express app. */
export function createApp(deps: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(corsMiddleware(deps.corsOrigins));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use('/api', createApiRouter(deps));
  app.use(notFoundHandler);
  app.use(createErrorHandler(deps.logger));
  return app;
}
