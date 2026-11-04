/**
 * Playback runner: executes the steps of a plan in order: waits through `Timing`, hands stickers to
 * the sticker queue, applies state steps through a callback, and stops at an `exit` step (or when
 * cancelled because a new run started or the app unmounted).
 */
import type { ExitDestination, PlaybackStep } from './playback-plan';
import type { StickerQueue } from './sticker-queue';
import type { Timing } from './timing';

/** What the runner needs from its host. */
export interface PlaybackEnvironment {
  timing: Timing;
  stickers: StickerQueue;
  /** How long each sticker occupies the queue. */
  stickerMs: number;
  /** True once the run this playback belongs to is no longer current. */
  isCancelled: () => boolean;
  /** Applies a state-changing step (`resource`, `note`, `phase`, `day`, `card`). */
  apply: (step: PlaybackStep) => void;
}

/** Plays `steps`. @returns the exit destination, or `null` when the turn ended on the same screen. */
export async function playSteps(
  steps: readonly PlaybackStep[],
  env: PlaybackEnvironment,
): Promise<ExitDestination | null> {
  for (const step of steps) {
    if (env.isCancelled()) return null;
    switch (step.kind) {
      case 'wait':
        await env.timing.wait(step.ms);
        break;
      case 'sticker':
        env.stickers.enqueue(step.sticker, env.stickerMs);
        break;
      case 'exit':
        return step.destination;
      default:
        env.apply(step);
    }
  }
  return null;
}
