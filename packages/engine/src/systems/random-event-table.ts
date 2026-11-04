/**
 * RandomEventTable: small random world events (8% chance per day after day 4 by default).
 */
import type { RandomEventDef } from '../content/schemas/index.js';
import type { WorldId } from '../domain/ids.js';
import type { RandomSource } from '../random/seeded-random.js';

/** Picks random events for a world. */
export class RandomEventTable {
  /** @param events events keyed by world id. */
  constructor(private readonly events: Record<WorldId, RandomEventDef[]>) {}

  /** @returns a random event for the world, or undefined if it has none. */
  roll(world: WorldId, rng: RandomSource): RandomEventDef | undefined {
    const list = this.events[world];
    return list && list.length > 0 ? rng.pick(list) : undefined;
  }
}
