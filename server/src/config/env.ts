/**
 * Typed, validated runtime configuration. Environment variables are parsed once with Zod so the
 * rest of the server receives a plain `AppConfig` and never touches `process.env` directly.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';
import { DEFAULT_CORS_ORIGIN, DEFAULT_PORT } from './constants.js';

/** Supported persistence drivers (see `RepositoryFactory` to add more). */
export const STORAGE_DRIVERS = ['json', 'memory'] as const;

/** One of the supported persistence drivers. */
export type StorageDriver = (typeof STORAGE_DRIVERS)[number];

/** Runtime environment. */
export type NodeEnv = 'development' | 'test' | 'production';

/** Validated server configuration. */
export interface AppConfig {
  port: number;
  corsOrigins: string[];
  storageDriver: StorageDriver;
  dataDir: string;
  contentDir: string;
  nodeEnv: NodeEnv;
}

/** Thrown when the environment is invalid; the message lists every problem. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

// Both src/config and dist/config sit two levels below `server/`, so these hold in dev and build.
const SERVER_DIR = fileURLToPath(new URL('../..', import.meta.url));
const DEFAULT_DATA_DIR = path.join(SERVER_DIR, 'data');
const DEFAULT_CONTENT_DIR = path.resolve(SERVER_DIR, '..', 'content');
const MAX_PORT = 65535;

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(MAX_PORT).default(DEFAULT_PORT),
  CORS_ORIGIN: z.string().default(DEFAULT_CORS_ORIGIN),
  STORAGE_DRIVER: z.enum(STORAGE_DRIVERS).default('json'),
  DATA_DIR: z.string().min(1).default(DEFAULT_DATA_DIR),
  CONTENT_DIR: z.string().min(1).default(DEFAULT_CONTENT_DIR),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/** Splits a comma separated origin list, dropping blanks. */
function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Parses and validates the environment.
 * @param env variables to read (defaults to `process.env`).
 * @throws ConfigError when a variable is invalid.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new ConfigError(`Invalid environment configuration: ${problems.join('; ')}`);
  }
  const values = parsed.data;
  const corsOrigins = parseOrigins(values.CORS_ORIGIN);
  if (corsOrigins.length === 0) throw new ConfigError('CORS_ORIGIN must list at least one origin');
  return {
    port: values.PORT,
    corsOrigins,
    storageDriver: values.STORAGE_DRIVER,
    dataDir: path.resolve(values.DATA_DIR),
    contentDir: path.resolve(values.CONTENT_DIR),
    nodeEnv: values.NODE_ENV,
  };
}
