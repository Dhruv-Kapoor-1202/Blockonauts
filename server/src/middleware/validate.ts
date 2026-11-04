/**
 * Request validation middleware: parses `body`, `params` and `query` with Zod schemas and stores
 * the parsed (typed, defaulted, transformed) values in `res.locals.input`. Express 5 makes
 * `req.query` read-only, hence the separate location; controllers read it through `validated()`.
 */
import type { RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { MAX_REPORTED_ISSUES } from '../config/constants.js';
import { ValidationError } from '../errors/app-error.js';

/** Schemas to apply to a route; omitted parts are not checked. */
export interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/** Parsed request parts handed to a controller. */
export interface ValidatedInput<B = unknown, P = unknown, Q = unknown> {
  body: B;
  params: P;
  query: Q;
}

const PARTS = ['body', 'params', 'query'] as const;

/** Builds a middleware that validates the given request parts. @throws ValidationError (400). */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, res, next) => {
    const input: ValidatedInput = { body: undefined, params: undefined, query: undefined };
    const problems: string[] = [];
    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (result.success) {
        input[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          const location = [part, ...issue.path.map(String)].join('.');
          problems.push(`${location}: ${issue.message}`);
        }
      }
    }
    if (problems.length > 0) {
      const shown = problems.slice(0, MAX_REPORTED_ISSUES).join('; ');
      const extra = problems.length - MAX_REPORTED_ISSUES;
      next(new ValidationError(extra > 0 ? `${shown}; and ${extra} more` : shown));
      return;
    }
    res.locals.input = input;
    next();
  };
}

/** Reads the parsed input stored by `validate`. The generics describe the route's schemas. */
export function validated<B = unknown, P = unknown, Q = unknown>(
  res: Response,
): ValidatedInput<B, P, Q> {
  return res.locals.input as ValidatedInput<B, P, Q>;
}
