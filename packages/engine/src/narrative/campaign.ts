/**
 * Campaign: the ordered chapters a world plays through (e.g. prologue, transit, landing,
 * survival, epilogue).
 */
import type { ContentBundle } from '../content/bundle.js';
import type { WorldId } from '../domain/ids.js';
import { ChapterRunner } from './chapter-runner.js';

/** The chapter sequence for one world. */
export class Campaign {
  private readonly runners: ChapterRunner[];

  /** @throws Error when the world has no sequence or a chapter is missing. */
  constructor(
    bundle: ContentBundle,
    readonly worldId: WorldId,
  ) {
    this.runners = bundle.sequence(worldId).map((id) => new ChapterRunner(bundle.chapter(id)));
  }

  /** Number of chapters. */
  get count(): number {
    return this.runners.length;
  }

  /** The runner at an index. @throws Error when out of range. */
  runner(index: number): ChapterRunner {
    const runner = this.runners[index];
    if (!runner) throw new Error(`No chapter at index ${index}`);
    return runner;
  }

  /** Whether the index is the final chapter. */
  isLast(index: number): boolean {
    return index >= this.runners.length - 1;
  }
}
