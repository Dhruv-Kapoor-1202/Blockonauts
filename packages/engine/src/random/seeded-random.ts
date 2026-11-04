/**
 * Seeded random number generation (mulberry32). All game randomness flows through this class,
 * so the same seed plus the same choices always replays the exact same run.
 */

/** Source of randomness injected into engine systems. */
export interface RandomSource {
  /** @returns a float in [0, 1). */
  next(): number;
  /** @returns an integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** @returns true with probability `p`. */
  chance(p: number): boolean;
  /** @returns a uniformly chosen element. @throws Error on an empty list. */
  pick<T>(items: readonly T[]): T;
}

/** mulberry32 PRNG with serialisable state (so snapshots can resume mid-run). */
export class SeededRandom implements RandomSource {
  private state: number;

  /** @param seed any integer; it is coerced to uint32. */
  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Cannot pick from an empty list');
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Current internal state, for snapshots. */
  getState(): number {
    return this.state;
  }

  /** Restores a state captured with {@link getState}. */
  setState(state: number): void {
    this.state = state >>> 0;
  }
}
