/**
 * Content sources (Strategy pattern implementations of `IContentSource`): the file-system source
 * used in production and an in-memory source used by tests.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ContentFiles, IContentSource } from '../repositories/interfaces/content-source.js';

/** Folder with generated JSON schemas that must not be loaded as content. */
const SCHEMA_DIR = 'schema';

/** Reads every `.json` file below a content folder, skipping `schema/`. */
export class FileSystemContentSource implements IContentSource {
  /** @param contentDir absolute path of the content folder. */
  constructor(private readonly contentDir: string) {}

  async readFiles(): Promise<ContentFiles> {
    const files: ContentFiles = {};
    for (const relative of await this.listJson('')) {
      const full = path.join(this.contentDir, relative);
      try {
        const text = await readFile(full, 'utf8');
        files[relative] = JSON.parse(text.replace(/^\uFEFF/, ''));
      } catch (error) {
        throw new Error(`Invalid JSON in content/${relative}: ${(error as Error).message}`);
      }
    }
    return files;
  }

  /** Lists POSIX-style relative paths of JSON files, sorted for deterministic loading. */
  private async listJson(relativeDir: string): Promise<string[]> {
    const entries = await readdir(path.join(this.contentDir, relativeDir), { withFileTypes: true });
    const found: string[] = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name !== SCHEMA_DIR) found.push(...(await this.listJson(relative)));
      } else if (entry.name.endsWith('.json')) {
        found.push(relative);
      }
    }
    return found;
  }
}

/** Serves a fixed map of files (tests). */
export class InMemoryContentSource implements IContentSource {
  constructor(private files: ContentFiles) {}

  /** Replaces the files, e.g. to simulate content being fixed or broken at runtime. */
  setFiles(files: ContentFiles): void {
    this.files = files;
  }

  async readFiles(): Promise<ContentFiles> {
    return structuredClone(this.files);
  }
}
