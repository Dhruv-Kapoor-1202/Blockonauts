/**
 * CORS wiring: allows the configured browser origins (the Vite dev server by default) to call the
 * API with the verbs and headers it uses, and lets browsers read the ETag.
 */
import cors from 'cors';
import type { RequestHandler } from 'express';

/** Max age of a preflight response, in seconds. */
const PREFLIGHT_MAX_AGE_SECONDS = 600;

/** @param origins exact origins that may call the API. */
export function corsMiddleware(origins: readonly string[]): RequestHandler {
  return cors({
    origin: [...origins],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'If-None-Match'],
    exposedHeaders: ['ETag'],
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
  });
}
