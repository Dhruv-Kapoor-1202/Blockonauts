/**
 * Content bundled at build time: every JSON file under `content/` (except the generated JSON
 * Schemas) is inlined by Vite so the game still runs when the API is unreachable. The map is keyed
 * relative to `content/` with forward slashes, exactly what `ContentLoader.load` expects.
 */
import { ContentBundle, ContentLoader } from '@commander/engine';

const CONTENT_PREFIX = '../../../content/';

const modules = import.meta.glob(['../../../content/**/*.json', '!../../../content/schema/**'], {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

/** Builds the `relative path -> JSON` map from glob results. Exported for tests. */
export function toContentFiles(globbed: Record<string, unknown>): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  for (const [path, json] of Object.entries(globbed)) {
    files[path.startsWith(CONTENT_PREFIX) ? path.slice(CONTENT_PREFIX.length) : path] = json;
  }
  return files;
}

/** Validates and indexes the content that shipped with this build. @throws ContentLoadError. */
export function loadBundledContent(
  files: Record<string, unknown> = toContentFiles(modules),
): ContentBundle {
  return new ContentBundle(ContentLoader.load(files).data);
}
