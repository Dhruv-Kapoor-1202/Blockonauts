/**
 * Error and not-found middleware. Everything that goes wrong becomes the uniform
 * `{ "error": { "code", "message" } }` body: typed `AppError`s keep their status, body-parser
 * failures (malformed JSON, oversized body) are mapped to 400/413 and anything else is a generic
 * 500 whose details are only logged.
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HTTP } from '../config/constants.js';
import {
  AppError,
  NotFoundError,
  PayloadTooLargeError,
  ValidationError,
} from '../errors/app-error.js';
import type { Logger } from '../logging/logger.js';

/** Shape of every error response. */
export interface ErrorBody {
  error: { code: string; message: string };
}

interface ParserError {
  type?: string;
  status?: number;
}

/** Converts unknown thrown values into an `AppError` (undefined = unexpected failure). */
function translate(error: unknown): AppError | undefined {
  if (error instanceof AppError) return error;
  const parser = error as ParserError;
  if (parser?.type === 'entity.too.large') return new PayloadTooLargeError();
  if (parser?.type === 'entity.parse.failed') {
    return new ValidationError('Request body is not valid JSON', 'INVALID_JSON');
  }
  if (parser?.type === 'encoding.unsupported' || parser?.type === 'charset.unsupported') {
    return new ValidationError('Unsupported request encoding', 'INVALID_ENCODING');
  }
  return undefined;
}

/** Responds 404 `ROUTE_NOT_FOUND` for unmatched routes. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`, 'ROUTE_NOT_FOUND'));
};

/** Builds the final error handler. */
export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const known = translate(error);
    if (known) {
      const body: ErrorBody = { error: { code: known.code, message: known.message } };
      res.status(known.status).json(body);
      return;
    }
    logger.error(
      `Unhandled error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    );
    const body: ErrorBody = {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
    res.status(HTTP.INTERNAL).json(body);
  };
}
