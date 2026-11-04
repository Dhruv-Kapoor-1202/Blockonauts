/**
 * Reads the whole `content/` folder into a `relative/path.json -> parsed JSON` map that the
 * engine's ContentLoader understands. Shared by the content scripts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path of the repository root. */
export const repoRoot = resolve(here, '..', '..');

/** Absolute path of the content folder. */
export const contentDir = join(repoRoot, 'content');

/** Recursively lists JSON files below `dir`, skipping generated schemas. */
function listJson(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'schema' ? [] : listJson(full);
    return name.endsWith('.json') ? [full] : [];
  });
}

/** Reads every content JSON file. @throws Error with the file path when JSON is malformed. */
export function readContentFiles(): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  for (const full of listJson(contentDir)) {
    const key = relative(contentDir, full).split('\\').join('/');
    try {
      files[key] = JSON.parse(readFileSync(full, 'utf8'));
    } catch (error) {
      throw new Error(`Invalid JSON in content/${key}: ${(error as Error).message}`);
    }
  }
  return files;
}
