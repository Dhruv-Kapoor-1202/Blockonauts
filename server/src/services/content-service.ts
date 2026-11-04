/**
 * ContentService: loads the story content through an `IContentSource`, schema-checks it with the
 * engine's `ContentLoader`, cross-checks it with `ContentValidator` and caches the validated
 * bundle (plus its serialised JSON and ETag) in memory. Invalid content is never served: callers
 * get a `ContentInvalidError` (HTTP 500 `CONTENT_INVALID`) and the issues are logged. Failures are
 * not cached, so fixing a content file and retrying works without restarting the server.
 */
import { createHash } from 'node:crypto';
import {
  ContentBundle,
  ContentLoadError,
  ContentLoader,
  ContentValidator,
  formatIssue,
} from '@commander/engine';
import { ContentInvalidError } from '../errors/app-error.js';
import type { Logger } from '../logging/logger.js';
import type { IContentSource } from '../repositories/interfaces/content-source.js';

/** A validated bundle ready to be served and used by the replay verifier. */
export interface LoadedBundle {
  bundle: ContentBundle;
  /** `JSON.stringify(bundle.toJSON())`, computed once. */
  json: string;
  /** Strong ETag derived from `json`. */
  etag: string;
}

/** Provides the validated content bundle. */
export class ContentService {
  private cached: Promise<LoadedBundle> | undefined;

  constructor(
    private readonly source: IContentSource,
    private readonly logger: Logger,
  ) {}

  /**
   * Returns the cached bundle, loading it on first use.
   * @throws ContentInvalidError when the content cannot be read, loaded or validated.
   */
  get(): Promise<LoadedBundle> {
    if (!this.cached) {
      const attempt = this.load();
      this.cached = attempt;
      attempt.catch(() => {
        if (this.cached === attempt) this.cached = undefined;
      });
    }
    return this.cached;
  }

  /** Like `get` but returns `undefined` instead of throwing (for optional enrichment). */
  async tryGet(): Promise<LoadedBundle | undefined> {
    try {
      return await this.get();
    } catch {
      return undefined;
    }
  }

  /** Loads content at startup; failures are logged and the server keeps running. */
  async warmUp(): Promise<void> {
    await this.tryGet();
  }

  private async load(): Promise<LoadedBundle> {
    try {
      const files = await this.source.readFiles();
      const { data, sources } = ContentLoader.load(files);
      const bundle = new ContentBundle(data);
      const report = ContentValidator.validateBundle(bundle, sources);
      for (const warning of report.warnings) this.logger.warn(formatIssue(warning));
      if (!report.ok) {
        for (const issue of report.errors) this.logger.error(formatIssue(issue));
        throw new ContentInvalidError(
          `Game content failed validation with ${report.errors.length} error(s); see the server log.`,
        );
      }
      const json = JSON.stringify(bundle.toJSON());
      const etag = `"${createHash('sha1').update(json).digest('hex')}"`;
      this.logger.info(
        `Content loaded: ${data.worlds.length} world(s), ${Object.keys(data.chapters).length} chapter(s).`,
      );
      return { bundle, json, etag };
    } catch (error) {
      throw this.asContentError(error);
    }
  }

  private asContentError(error: unknown): ContentInvalidError {
    if (error instanceof ContentInvalidError) return error;
    if (error instanceof ContentLoadError) {
      for (const issue of error.issues) this.logger.error(formatIssue(issue));
      return new ContentInvalidError(
        `Game content failed to load with ${error.issues.length} error(s); see the server log.`,
      );
    }
    this.logger.error(`Content could not be read: ${(error as Error).message}`);
    return new ContentInvalidError('Game content could not be read; see the server log.');
  }
}
