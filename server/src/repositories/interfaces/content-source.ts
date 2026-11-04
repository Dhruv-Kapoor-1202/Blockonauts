/**
 * Content source contract (Strategy pattern): where the raw content files come from. The default
 * strategy reads the `content/` folder; tests plug in an in-memory map. Swapping the source never
 * touches the loader, the validator or the HTTP layer.
 */

/** Map of POSIX-style relative path (e.g. `worlds/moon.json`) to parsed JSON. */
export type ContentFiles = Record<string, unknown>;

/** Supplies the raw content files. */
export interface IContentSource {
  /** @throws Error when the files cannot be read or contain malformed JSON. */
  readFiles(): Promise<ContentFiles>;
}
