/**
 * ContentSource: where the game's content comes from. `ApiFirstContentSource` asks the server
 * first (short timeout) and falls back to the content bundled at build time on ANY failure,
 * flagging the app as offline. Both paths yield the same `ContentBundle`.
 */
import { ContentBundle } from '@commander/engine';
import { CONTENT_TIMEOUT_MS } from '../game/constants';
import type { Connectivity } from '../game/connectivity';
import type { ApiClient } from './types';

/** Where a loaded bundle came from. */
export type ContentOrigin = 'api' | 'bundled';

/** A loaded bundle and its origin. */
export interface LoadedBundle {
  bundle: ContentBundle;
  origin: ContentOrigin;
}

/** Supplies content to the app. */
export interface ContentSource {
  load(): Promise<LoadedBundle>;
}

/** Server first, bundled content as the fallback. */
export class ApiFirstContentSource implements ContentSource {
  constructor(
    private readonly api: ApiClient,
    private readonly bundled: () => ContentBundle,
    private readonly connectivity: Connectivity,
    private readonly timeoutMs: number = CONTENT_TIMEOUT_MS,
  ) {}

  async load(): Promise<LoadedBundle> {
    try {
      const data = await this.api.getContent({ timeoutMs: this.timeoutMs });
      const bundle = ContentBundle.fromJSON(data);
      this.connectivity.markOnline();
      return { bundle, origin: 'api' };
    } catch {
      this.connectivity.markOffline();
      return { bundle: this.bundled(), origin: 'bundled' };
    }
  }
}
