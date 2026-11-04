/**
 * Typed error hierarchy. Services and middleware throw these; the error handler turns them into
 * the uniform `{ error: { code, message } }` response, so no layer builds HTTP errors by hand.
 */
import { HTTP } from '../config/constants.js';

/** Base class: an error with an HTTP status and a stable machine-readable code. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** 400: the request is malformed or fails validation. */
export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(HTTP.BAD_REQUEST, code, message);
  }
}

/** 404: a resource does not exist. */
export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(HTTP.NOT_FOUND, code, message);
  }
}

/** 409: the request conflicts with current state (duplicates, limits). */
export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(HTTP.CONFLICT, code, message);
  }
}

/** 413: the body exceeds the configured limit. */
export class PayloadTooLargeError extends AppError {
  constructor(message = 'Request body is too large') {
    super(HTTP.PAYLOAD_TOO_LARGE, 'PAYLOAD_TOO_LARGE', message);
  }
}

/** 422: the request is well formed but semantically unacceptable (e.g. a tampered replay). */
export class UnprocessableError extends AppError {
  constructor(message: string, code = 'UNPROCESSABLE') {
    super(HTTP.UNPROCESSABLE, code, message);
  }
}

/** 500: server-side content that cannot be served (invalid or missing game content). */
export class ContentInvalidError extends AppError {
  constructor(message: string) {
    super(HTTP.INTERNAL, 'CONTENT_INVALID', message);
  }
}
