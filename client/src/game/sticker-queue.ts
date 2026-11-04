/**
 * StickerQueue: shows stickers one at a time, each for its slot length, in the order they were
 * raised. A tiny external store (subscribe / getSnapshot) so React can read the active sticker with
 * `useSyncExternalStore`.
 */
import type { StickerSpec } from './playback-plan';
import type { Timing } from './timing';

/** The sticker currently on screen. */
export interface ActiveSticker extends StickerSpec {
  /** Unique per showing; use as the React key so the entrance animation replays. */
  id: number;
}

interface QueuedSticker {
  sticker: StickerSpec;
  slotMs: number;
}

/** FIFO queue with a single visible sticker. */
export class StickerQueue {
  private readonly waiting: QueuedSticker[] = [];
  private readonly listeners = new Set<() => void>();
  private current: ActiveSticker | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 1;

  constructor(private readonly timing: Timing) {}

  /** Queues a sticker that will occupy the screen for `slotMs` (scaled by the timing). */
  enqueue(sticker: StickerSpec, slotMs: number): void {
    this.waiting.push({ sticker, slotMs });
    if (!this.current) this.showNext();
  }

  /** Drops everything (new run, unmount). */
  clear(): void {
    this.waiting.length = 0;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.setCurrent(null);
  }

  /** Subscribes to changes. @returns an unsubscribe function. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** The sticker on screen, or `null`. */
  getSnapshot = (): ActiveSticker | null => this.current;

  private showNext(): void {
    const next = this.waiting.shift();
    if (!next) {
      this.setCurrent(null);
      return;
    }
    this.setCurrent({ ...next.sticker, id: this.nextId });
    this.nextId += 1;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.showNext();
    }, this.timing.scale(next.slotMs));
  }

  private setCurrent(sticker: ActiveSticker | null): void {
    this.current = sticker;
    this.listeners.forEach((listener) => listener());
  }
}
