/**
 * InterludeSelector: draws the next survival side-card. Follow-up cards that are due come first;
 * otherwise a random card from the chapter's pools, avoiding recently seen cards and biased
 * (35% by default) toward cards that help the lowest resource.
 */
import { localizeChoice } from '../content/world-keyed.js';
import type { Interlude } from '../content/schemas/index.js';
import type { ResourceKey, WorldId } from '../domain/ids.js';
import type { ConditionContext, ConditionEvaluator } from '../narrative/condition-evaluator.js';
import type { RandomSource } from '../random/seeded-random.js';
import type { FollowUpQueue } from './queues.js';

/** Pool name for cards that are only injected by world rules (never drawn at random). */
export const INJECTED_POOL = 'injected';

/** Tuning for card selection. */
export interface SelectorTuning {
  recentMemoryMax: number;
  recentMemoryReserve: number;
  helpBias: number;
}

/** Everything needed for one draw. */
export interface DrawRequest {
  worldId: WorldId;
  pools: string[];
  conditions: ConditionContext;
  recent: string[];
  followUps: FollowUpQueue;
  day: number;
  lowest: ResourceKey;
}

/** The drawn card and the updated recent-card memory. */
export interface DrawResult {
  card: Interlude;
  recent: string[];
}

/** Picks interlude cards. */
export class InterludeSelector {
  /** @param interludes all interlude cards. */
  constructor(
    private readonly interludes: readonly Interlude[],
    private readonly conditions: ConditionEvaluator,
    private readonly rng: RandomSource,
    private readonly tuning: SelectorTuning,
  ) {}

  /** @returns the next card, or undefined if no card is eligible at all. */
  draw(request: DrawRequest): DrawResult | undefined {
    const { worldId, pools, conditions, followUps, day, lowest } = request;
    const forWorld = (card: Interlude) => !card.worlds || card.worlds.includes(worldId);
    const deck = this.interludes.filter((card) => forWorld(card) && pools.includes(card.pool));

    const due = followUps.takeFirstDue(day);
    const queued = due ? this.interludes.find((card) => card.id === due.id) : undefined;
    if (queued && forWorld(queued)) return this.remember(queued, request.recent, deck.length);

    const eligible = deck.filter(
      (card) =>
        !card.followUp &&
        card.pool !== INJECTED_POOL &&
        this.conditions.matches(card.when, conditions),
    );
    const fresh = eligible.filter((card) => !request.recent.includes(card.id));
    const pool = fresh.length > 0 ? fresh : eligible;
    if (pool.length === 0) return undefined;

    const helpful = pool.filter((card) => this.helps(card, worldId, lowest));
    const source = helpful.length > 0 && this.rng.chance(this.tuning.helpBias) ? helpful : pool;
    return this.remember(this.rng.pick(source), request.recent, deck.length);
  }

  private helps(card: Interlude, worldId: WorldId, key: ResourceKey): boolean {
    return [card.left, card.right].some(
      (side) => (localizeChoice(side, worldId)?.effects?.[key] ?? 0) > 0,
    );
  }

  private remember(card: Interlude, recent: string[], deckSize: number): DrawResult {
    const memory = [...recent, card.id];
    const limit = Math.min(this.tuning.recentMemoryMax, deckSize - this.tuning.recentMemoryReserve);
    while (memory.length > Math.max(0, limit)) memory.shift();
    return { card, recent: memory };
  }
}
